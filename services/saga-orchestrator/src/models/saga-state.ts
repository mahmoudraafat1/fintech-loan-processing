// services/saga-orchestrator/src/models/saga-state.ts
export interface SagaState {
  id: string;
  type: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'COMPENSATED';
  currentStep: number;
  steps: any[];
  context: any;
  startedAt: Date;
  completedAt?: Date;
  completedSteps: CompletedStep[];
  compensatedSteps: CompensatedStep[];
  error?: string;
}

export interface CompletedStep {
  stepIndex: number;
  name: string;
  result: any;
  completedAt: Date;
}

export interface CompensatedStep {
  stepIndex: number;
  name: string;
  compensatedAt: Date;
}
