// services/kyc-service/src/services/kyc.service.ts
import { KYCRepository } from '../repositories/kyc.repository';
import { KYCRecord } from '../models/kyc-record';
import { AMLService } from './aml.service';
import { IdentityVerificationService } from './identity-verification.service';
import { Logger } from '../utils/logger';

export class KYCService {
  private repository: KYCRepository;
  private amlService: AMLService;
  private identityService: IdentityVerificationService;
  private logger: Logger;

  constructor() {
    this.repository = new KYCRepository();
    this.amlService = new AMLService();
    this.identityService = new IdentityVerificationService();
    this.logger = new Logger('KYCService');
  }

  async verifyCustomer(customerId: string, documents: any[], personalInfo: any): Promise<KYCRecord> {
    this.logger.info(`Starting KYC verification for customer: ${customerId}`);
    
    // Parallel verification checks
    const [identityCheck, amlCheck] = await Promise.all([
      this.identityService.verifyIdentity(personalInfo, documents),
      this.amlService.checkAML(personalInfo)
    ]);
    
    const record: KYCRecord = {
      customerId,
      status: this.determineStatus(identityCheck, amlCheck),
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      verificationData: {
        identityVerified: identityCheck.passed,
        addressVerified: identityCheck.addressVerified,
        amlCheckPassed: amlCheck.passed,
        sanctionsCheckPassed: amlCheck.sanctionsCheckPassed
      },
      documents: documents.map(doc => ({
        id: doc.id,
        type: doc.type,
        url: doc.url,
        uploadedAt: new Date(),
        verifiedAt: identityCheck.passed ? new Date() : undefined
      })),
      metadata: {
        verificationMethod: 'AUTOMATED',
        riskScore: amlCheck.riskScore
      }
    };
    
    return await this.repository.save(record);
  }
  
  private determineStatus(identityCheck: any, amlCheck: any): KYCRecord['status'] {
    if (identityCheck.passed && amlCheck.passed) {
      return 'VERIFIED';
    }
    return 'REJECTED';
  }
  
  async getVerificationStatus(customerId: string): Promise<KYCRecord | null> {
    return await this.repository.findById(customerId);
  }
  
  async uploadDocument(customerId: string, documentType: string, documentData: any): Promise<any> {
    // Document upload logic
    return { success: true, documentId: 'doc-' + Date.now() };
  }
}
