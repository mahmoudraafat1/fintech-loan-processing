// services/loan-application/src/models/bnpl.application.ts
export class BNPLApplication implements LoanApplication {
  id: string;
  customerId: string;
  amount: number;
  term: number;
  merchantId: string;
  productId: string;
  installments: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this.id = data.id || uuidv4();
    this.customerId = data.customerId;
    this.amount = data.amount;
    this.term = data.term || 3; // BNPL typically 3 months
    this.merchantId = data.merchantId;
    this.productId = data.productId;
    this.installments = data.installments || 4;
    this.status = 'PENDING';
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async validate(): Promise<void> {
    if (this.amount < 50 || this.amount > 5000) {
      throw new Error('BNPL amount must be between $50 and $5,000');
    }
    if (this.installments < 2 || this.installments > 6) {
      throw new Error('BNPL installments must be between 2 and 6');
    }
    if (!this.merchantId) {
      throw new Error('Merchant ID is required for BNPL');
    }
  }

  calculateInterest(): number {
    return 0; // BNPL typically has 0% interest
  }

  getRequiredDocuments(): string[] {
    return [
      'Email Verification',
      'Phone Verification',
      'Debit/Credit Card'
    ];
  }
}
