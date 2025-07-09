// services/saga-orchestrator/src/index.ts
import express from 'express';
import { SagaOrchestrator } from './orchestrator/saga-orchestrator';
import { LoanProcessingSaga } from './sagas/loan-processing.saga';
import { Logger } from './utils/logger';

const app = express();
const logger = new Logger('SagaOrchestrator');
const orchestrator = new SagaOrchestrator();

// Register sagas
orchestrator.registerSaga('loan-processing', new LoanProcessingSaga());

app.use(express.json());

// Routes
app.post('/saga/start', async (req, res) => {
  try {
    const { sagaType, payload } = req.body;
    const sagaId = await orchestrator.startSaga(sagaType, payload);
    res.json({ sagaId, status: 'STARTED' });
  } catch (error) {
    logger.error('Error starting saga:', error);
    res.status(500).json({ error: 'Failed to start saga' });
  }
});

app.get('/saga/:sagaId/status', async (req, res) => {
  try {
    const status = await orchestrator.getSagaStatus(req.params.sagaId);
    res.json(status);
  } catch (error) {
    logger.error('Error getting saga status:', error);
    res.status(500).json({ error: 'Failed to get saga status' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'UP' }));

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  logger.info(`Saga Orchestrator listening on port ${PORT}`);
});
