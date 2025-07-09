// services/kyc-service/src/models/kyc-record.ts
export interface KYCRecord {
  customerId: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  verifiedAt?: Date;
  expiresAt?: Date;
  verificationData: {
    identityVerified: boolean;
    addressVerified: boolean;
    amlCheckPassed: boolean;
    sanctionsCheckPassed: boolean;
  };
  documents?: Document[];
  metadata: {
    verificationMethod: string;
    riskScore?: number;
    notes?: string;
  };
}

export interface Document {
  id: string;
  type: 'ID' | 'PROOF_OF_ADDRESS' | 'BANK_STATEMENT' | 'OTHER';
  url: string;
  uploadedAt: Date;
  verifiedAt?: Date;
}
