// services/loan-application/src/factories/loan-application.factory.ts
import { PersonalLoanApplication } from '../models/personal-loan.application';
import { BNPLApplication } from '../models/bnpl.application';
import { SecuredLoanApplication } from '../models/secured-loan.application';
import { LoanApplication } from '../models/loan-application.interface';
import { Container } from '../utils/di-container';

export class LoanApplicationFactory {
  private container: Container;

  constructor() {
    this.container = Container.getInstance();
    this.registerLoanTypes();
  }

  private registerLoanTypes(): void {
    // Register loan types in DI container to avoid excess factory classes
    this.container.register('personal', PersonalLoanApplication);
    this.container.register('bnpl', BNPLApplication);
    this.container.register('secured', SecuredLoanApplication);
  }

  createLoanApplication(type: string, data: any): LoanApplication {
    const LoanClass = this.container.resolve(type);
    if (!LoanClass) {
      throw new Error(`Unknown loan type: ${type}`);
    }
    return new LoanClass(data);
  }
}
