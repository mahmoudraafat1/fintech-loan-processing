// services/saga-orchestrator/src/sagas/loan-processing.saga.ts
import { Saga, SagaStep } from '../interfaces/saga.interface';
import { HttpClient } from '../utils/http-client';
import { Logger } from '../utils/logger';

export class LoanProcessingSaga implements Saga {
  private httpClient: HttpClient;
  private logger: Logger;

  constructor() {
    this.httpClient = new HttpClient();
    this.logger = new Logger('LoanProcessingSaga');
  }

  getSteps(): SagaStep[] {
    return [
      {
        name: 'CREATE_APPLICATION',
        execute: async (context) => {
          const response = await this.httpClient.post('http://loan-application:3001/applications', {
            loanType: context.loanType,
            customerId: context.customerId,
            amount: context.amount,
            term: context.term
          });
          context.applicationId = response.data.id;
          return response.data;
        },
        compensate: async (context) => {
          if (context.applicationId) {
            await this.httpClient.delete(`http://loan-application:3001/applications/${context.applicationId}`);
          }
        }
      },
      {
        name: 'VERIFY_KYC',
        execute: async (context) => {
          const response = await this.httpClient.get(`http://kyc-service:3002/status/${context.customerId}`);
          if (response.data.status !== 'VERIFIED') {
            throw new Error('KYC verification required');
          }
          return response.data;
        }
      },
      {
        name: 'CALCULATE_CREDIT_SCORE',
        execute: async (context) => {
          const response = await this.httpClient.post('http://credit-scoring:3003/api/credit-score/calculate', {
            applicationId: context.applicationId,
            customerId: context.customerId,
            loanAmount: context.amount,
            loanTerm: context.term,
            monthlyIncome: context.monthlyIncome,
            existingDebt: context.existingDebt
          });
          context.creditScore = response.data.score;
          context.riskLevel = response.data.riskLevel;
          return response.data;
        }
      },
      {
        name: 'MAKE_DECISION',
        execute: async (context) => {
          const response = await this.httpClient.post('http://decision-service:3004/decide', {
            applicationId: context.applicationId,
            creditScore: context.creditScore,
            riskLevel: context.riskLevel,
            loanAmount: context.amount,
            monthlyIncome: context.monthlyIncome
          });
          
          if (response.data.decision !== 'APPROVED') {
            throw new Error(`Loan application rejected: ${response.data.reason}`);
          }
          
          context.approvalDetails = response.data;
          return response.data;
        },
        compensate: async (context) => {
          if (context.approvalDetails) {
            await this.httpClient.post(`http://decision-service:3004/cancel/${context.applicationId}`);
          }
        }
      },
      {
        name: 'GENERATE_CONTRACT',
        execute: async (context) => {
          const response = await this.httpClient.post('http://contract-service:3005/generate', {
            applicationId: context.applicationId,
            customerId: context.customerId,
            loanDetails: {
              amount: context.amount,
              term: context.term,
              interestRate: context.approvalDetails.interestRate,
              monthlyPayment: context.approvalDetails.monthlyPayment
            }
          });
          context.contractId = response.data.contractId;
          return response.data;
        },
        compensate: async (context) => {
          if (context.contractId) {
            await this.httpClient.delete(`http://contract-service:3005/contracts/${context.contractId}`);
          }
        }
      },
      {
        name: 'SEND_NOTIFICATION',
        execute: async (context) => {
          await this.httpClient.post('http://notification-service:3007/send', {
            customerId: context.customerId,
            type: 'LOAN_APPROVED',
            data: {
              applicationId: context.applicationId,
              contractId: context.contractId,
              amount: context.amount,
              monthlyPayment: context.approvalDetails.monthlyPayment
            }
          });
          return { notificationSent: true };
        }
      }
    ];
  }
}
