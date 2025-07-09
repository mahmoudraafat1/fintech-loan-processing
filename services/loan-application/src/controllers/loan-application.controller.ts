// services/loan-application/src/controllers/loan-application.controller.ts
import { Request, Response } from 'express';
import { LoanApplicationFactory } from '../factories/loan-application.factory';
import { LoanApplicationRepository } from '../repositories/loan-application.repository';
import { EventPublisher } from '../utils/event-publisher';
import { Logger } from '../utils/logger';

export class LoanApplicationController {
  private factory: LoanApplicationFactory;
  private repository: LoanApplicationRepository;
  private eventPublisher: EventPublisher;
  private logger: Logger;

  constructor() {
    this.factory = new LoanApplicationFactory();
    this.repository = new LoanApplicationRepository();
    this.eventPublisher = new EventPublisher();
    this.logger = new Logger('LoanApplicationController');
  }

  async createApplication(req: Request, res: Response): Promise<void> {
    try {
      const { loanType, ...applicationData } = req.body;
      
      // Use Factory pattern to create appropriate loan application
      const loanApplication = this.factory.createLoanApplication(loanType, applicationData);
      
      // Validate the application
      await loanApplication.validate();
      
      // Save to repository
      const savedApplication = await this.repository.save(loanApplication);
      
      // Publish event for other services (Observer pattern)
      await this.eventPublisher.publish('loan.application.created', {
        applicationId: savedApplication.id,
        type: loanType,
        customerId: applicationData.customerId,
        amount: applicationData.amount
      });
      
      res.status(201).json({
        id: savedApplication.id,
        status: savedApplication.status,
        createdAt: savedApplication.createdAt
      });
    } catch (error) {
      this.logger.error('Error creating loan application:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getApplication(req: Request, res: Response): Promise<void> {
    try {
      const application = await this.repository.findById(req.params.id);
      if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }
      res.json(application);
    } catch (error) {
      this.logger.error('Error fetching application:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateApplication(req: Request, res: Response): Promise<void> {
    try {
      const updated = await this.repository.update(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      this.logger.error('Error updating application:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
