// services/loan-application/src/models/personal-loan.application.ts
import { LoanApplication } from './loan-application.interface';
import { v4 as uuidv4 } from 'uuid';

export class PersonalLoanApplication implements LoanApplication {
  id: string;
  customerId: string;
  amount: number;
  term: number;
  purpose: string;
  employmentStatus: string;
  monthlyIncome: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this.id = data.id || uuidv4();
    this.customerId = data.customerId;
    this.amount = data.amount;
    this.term = data.term;
    this.purpose = data.purpose;
    this.employmentStatus = data.employmentStatus;
    this.monthlyIncome = data.monthlyIncome;
    this.status = 'PENDING';
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async validate(): Promise<void> {
    if (this.amount < 1000 || this.amount > 50000) {
      throw new Error('Personal loan amount must be between $1,000 and $50,000');
    }
    if (this.term < 12 || this.term > 84) {
      throw new Error('Personal loan term must be between 12 and 84 months');
    }
    if (this.monthlyIncome < this.amount / this.term * 3) {
      throw new Error('Insufficient income for requested loan amount');
    }
  }

  calculateInterest(): number {
    // Simplified interest calculation
    const baseRate = 0.08;
    const riskAdjustment = this.amount > 20000 ? 0.02 : 0;
    return baseRate + riskAdjustment;
  }

  getRequiredDocuments(): string[] {
    return [
      'Government ID',
      'Proof of Income',
      'Bank Statements (3 months)',
      'Employment Verification'
    ];
  }
}
