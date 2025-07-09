// services/loan-application/src/models/loan-application.interface.ts
export interface LoanApplication {
  id?: string;
  customerId: string;
  amount: number;
  term: number;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  
  validate(): Promise<void>;
  calculateInterest(): number;
  getRequiredDocuments(): string[];
}
