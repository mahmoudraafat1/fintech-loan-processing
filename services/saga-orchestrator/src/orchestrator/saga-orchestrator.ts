// services/saga-orchestrator/src/orchestrator/saga-orchestrator.ts
import { Saga } from '../interfaces/saga.interface';
import { SagaState } from '../models/saga-state';
import { SagaRepository } from '../repositories/saga.repository';
import { EventPublisher } from '../utils/event-publisher';
import { Logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class SagaOrchestrator {
  private sagas: Map<string, Saga>;
  private repository: SagaRepository;
  private eventPublisher: EventPublisher;
  private logger: Logger;

  constructor() {
    this.sagas = new Map();
    this.repository = new SagaRepository();
    this.eventPublisher = new EventPublisher();
    this.logger = new Logger('SagaOrchestrator');
  }

  registerSaga(name: string, saga: Saga): void {
    this.sagas.set(name, saga);
    this.logger.info(`Registered saga: ${name}`);
  }

  async startSaga(sagaType: string, payload: any): Promise<string> {
    const saga = this.sagas.get(sagaType);
    if (!saga) {
      throw new Error(`Unknown saga type: ${sagaType}`);
    }

    const sagaId = uuidv4();
    const state: SagaState = {
      id: sagaId,
      type: sagaType,
      status: 'RUNNING',
      currentStep: 0,
      steps: [],
      context: payload,
      startedAt: new Date(),
      completedSteps: [],
      compensatedSteps: []
    };

    await this.repository.save(state);
    
    // Execute saga asynchronously
    this.executeSaga(sagaId, saga, state).catch(error => {
      this.logger.error(`Saga ${sagaId} failed:`, error);
    });

    return sagaId;
  }

  private async executeSaga(sagaId: string, saga: Saga, state: SagaState): Promise<void> {
    const steps = saga.getSteps();
    
    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        state.currentStep = i;
        
        this.logger.info(`Executing step ${i} of saga ${sagaId}: ${step.name}`);
        
        try {
          // Execute the step
          const result = await step.execute(state.context);
          
          // Update state
          state.completedSteps.push({
            stepIndex: i,
            name: step.name,
            result,
            completedAt: new Date()
          });
          
          // Save progress
          await this.repository.update(sagaId, state);
          
          // Publish step completed event
          await this.eventPublisher.publish('saga.step.completed', {
            sagaId,
            stepName: step.name,
            stepIndex: i
          });
          
        } catch (error) {
          this.logger.error(`Step ${step.name} failed:`, error);
          
          // Start compensation
          await this.compensate(sagaId, saga, state, i);
          throw error;
        }
      }
      
      // Saga completed successfully
      state.status = 'COMPLETED';
      state.completedAt = new Date();
      await this.repository.update(sagaId, state);
      
      await this.eventPublisher.publish('saga.completed', {
        sagaId,
        type: state.type,
        result: state.context
      });
      
    } catch (error) {
      state.status = 'FAILED';
      state.error = error.message;
      await this.repository.update(sagaId, state);
      
      await this.eventPublisher.publish('saga.failed', {
        sagaId,
        type: state.type,
        error: error.message
      });
    }
  }

  private async compensate(sagaId: string, saga: Saga, state: SagaState, failedStepIndex: number): Promise<void> {
    this.logger.info(`Starting compensation for saga ${sagaId} from step ${failedStepIndex}`);
    
    const steps = saga.getSteps();
    
    // Compensate in reverse order
    for (let i = failedStepIndex - 1; i >= 0; i--) {
      const step = steps[i];
      
      if (step.compensate) {
        try {
          this.logger.info(`Compensating step ${i}: ${step.name}`);
          
          await step.compensate(state.context);
          
          state.compensatedSteps.push({
            stepIndex: i,
            name: step.name,
            compensatedAt: new Date()
          });
          
          await this.repository.update(sagaId, state);
          
        } catch (error) {
          this.logger.error(`Compensation failed for step ${step.name}:`, error);
          // Continue compensating other steps
        }
      }
    }
    
    state.status = 'COMPENSATED';
    await this.repository.update(sagaId, state);
  }

  async getSagaStatus(sagaId: string): Promise<SagaState | null> {
    return await this.repository.findById(sagaId);
  }
}
