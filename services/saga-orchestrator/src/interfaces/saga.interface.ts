// services/saga-orchestrator/src/interfaces/saga.interface.ts
export interface Saga {
  getSteps(): SagaStep[];
}

export interface SagaStep {
  name: string;
  execute: (context: any) => Promise<any>;
  compensate?: (context: any) => Promise<void>;
}
