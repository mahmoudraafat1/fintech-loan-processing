// services/kyc-service/src/controllers/kyc.controller.ts
import { Request, Response } from 'express';
import { KYCService } from '../services/kyc.service';
import { EventPublisher } from '../utils/event-publisher';
import { Logger } from '../utils/logger';

export class KYCController {
  private kycService: KYCService;
  private eventPublisher: EventPublisher;
  private logger: Logger;

  constructor() {
    this.kycService = new KYCService();
    this.eventPublisher = new EventPublisher();
    this.logger = new Logger('KYCController');
  }

  async verifyCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, documents, personalInfo } = req.body;
      
      // Perform KYC verification
      const result = await this.kycService.verifyCustomer(customerId, documents, personalInfo);
      
      // Publish verification event
      await this.eventPublisher.publish('kyc.verification.completed', {
        customerId,
        status: result.status,
        verifiedAt: result.verifiedAt
      });
      
      res.json(result);
    } catch (error) {
      this.logger.error('KYC verification error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  }

  async getVerificationStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.kycService.getVerificationStatus(req.params.customerId);
      if (!status) {
        res.status(404).json({ error: 'Customer not found' });
        return;
      }
      res.json(status);
    } catch (error) {
      this.logger.error('Error getting verification status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const { documentType, documentData } = req.body;
      
      const result = await this.kycService.uploadDocument(customerId, documentType, documentData);
      res.json(result);
    } catch (error) {
      this.logger.error('Document upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
}
