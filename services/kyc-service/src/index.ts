// services/kyc-service/src/index.ts
import express from 'express';
import { KYCController } from './controllers/kyc.controller';
import { Logger } from './utils/logger';
import { RedisCache } from './cache/redis-cache';

const app = express();
const logger = new Logger('KYCService');
const kycController = new KYCController();

app.use(express.json());

// Routes
app.post('/verify', kycController.verifyCustomer.bind(kycController));
app.get('/status/:customerId', kycController.getVerificationStatus.bind(kycController));
app.post('/documents/:customerId', kycController.uploadDocument.bind(kycController));
app.get('/health', (req, res) => res.json({ status: 'UP' }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  logger.info(`KYC Service listening on port ${PORT}`);
});

// services/kyc-service/src/repositories/kyc.repository.ts
import { Repository } from './repository.interface';
import { KYCRecord } from '../models/kyc-record';
import { PostgreSQLAdapter } from '../adapters/postgresql.adapter';
import { MongoDBAdapter } from '../adapters/mongodb.adapter';
import { S3Adapter } from '../adapters/s3.adapter';
import { RedisCache } from '../cache/redis-cache';
import { Logger } from '../utils/logger';

export class KYCRepository implements Repository<KYCRecord> {
  private postgresAdapter: PostgreSQLAdapter;
  private mongoAdapter: MongoDBAdapter;
  private s3Adapter: S3Adapter;
  private cache: RedisCache;
  private logger: Logger;

  constructor() {
    this.postgresAdapter = new PostgreSQLAdapter();
    this.mongoAdapter = new MongoDBAdapter();
    this.s3Adapter = new S3Adapter();
    this.cache = new RedisCache();
    this.logger = new Logger('KYCRepository');
  }

  async save(record: KYCRecord): Promise<KYCRecord> {
    const startTime = Date.now();
    
    try {
      // Save structured data to PostgreSQL
      const savedRecord = await this.postgresAdapter.save({
        customerId: record.customerId,
        status: record.status,
        verifiedAt: record.verifiedAt,
        expiresAt: record.expiresAt
      });

      // Save unstructured verification data to MongoDB
      await this.mongoAdapter.save({
        customerId: record.customerId,
        verificationData: record.verificationData,
        metadata: record.metadata
      });

      // Save documents to S3
      if (record.documents && record.documents.length > 0) {
        for (const doc of record.documents) {
          await this.s3Adapter.uploadDocument(record.customerId, doc);
        }
      }

      // Cache the result (92% cache hit rate mentioned in paper)
      await this.cache.set(`kyc:${record.customerId}`, savedRecord, 3600);

      const latency = Date.now() - startTime;
      this.logger.info(`KYC record saved in ${latency}ms`); // ~7ms overhead

      return savedRecord;
    } catch (error) {
      this.logger.error('Error saving KYC record:', error);
      throw error;
    }
  }

  async findById(customerId: string): Promise<KYCRecord | null> {
    // Check cache first
    const cached = await this.cache.get(`kyc:${customerId}`);
    if (cached) {
      this.logger.debug('Cache hit for customer:', customerId);
      return cached;
    }

    // Fetch from databases
    const [pgData, mongoData] = await Promise.all([
      this.postgresAdapter.findByCustomerId(customerId),
      this.mongoAdapter.findByCustomerId(customerId)
    ]);

    if (!pgData) {
      return null;
    }

    // Combine data from multiple sources
    const record: KYCRecord = {
      ...pgData,
      verificationData: mongoData?.verificationData || {},
      metadata: mongoData?.metadata || {}
    };

    // Cache for future requests
    await this.cache.set(`kyc:${customerId}`, record, 3600);

    return record;
  }

  async update(customerId: string, data: Partial<KYCRecord>): Promise<KYCRecord> {
    const updated = await this.postgresAdapter.update(customerId, data);
    
    if (data.verificationData || data.metadata) {
      await this.mongoAdapter.update(customerId, {
        verificationData: data.verificationData,
        metadata: data.metadata
      });
    }

    // Invalidate cache
    await this.cache.delete(`kyc:${customerId}`);

    return updated;
  }

  async delete(customerId: string): Promise<void> {
    await Promise.all([
      this.postgresAdapter.delete(customerId),
      this.mongoAdapter.delete(customerId),
      this.s3Adapter.deleteDocuments(customerId),
      this.cache.delete(`kyc:${customerId}`)
    ]);
  }

  async findByStatus(status: string): Promise<KYCRecord[]> {
    return this.postgresAdapter.findByStatus(status);
  }
}
