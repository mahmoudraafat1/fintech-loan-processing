// services/loan-application/src/index.ts
import express from 'express';
import { LoanApplicationController } from './controllers/loan-application.controller';
import { MetricsMiddleware } from './middleware/metrics';
import { ErrorHandler } from './middleware/error-handler';
import { Logger } from './utils/logger';

const app = express();
const logger = new Logger('LoanApplicationService');
const controller = new LoanApplicationController();

app.use(express.json());
app.use(MetricsMiddleware);

// Routes
app.post('/applications', controller.createApplication.bind(controller));
app.get('/applications/:id', controller.getApplication.bind(controller));
app.put('/applications/:id', controller.updateApplication.bind(controller));
app.get('/health', (req, res) => res.json({ status: 'UP' }));

app.use(ErrorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Loan Application Service listening on port ${PORT}`);
});
