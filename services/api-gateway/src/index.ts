// services/api-gateway/src/index.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Logger } from './utils/logger';
import { ServiceRegistry } from './utils/service-registry';
import { CircuitBreaker } from './utils/circuit-breaker';
import { MetricsCollector } from './utils/metrics';

const app = express();
const logger = new Logger('APIGateway');
const serviceRegistry = new ServiceRegistry();
const metrics = new MetricsCollector();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Circuit breakers for each service
const circuitBreakers = {
  loanApplication: new CircuitBreaker('loan-application', { threshold: 5, timeout: 30000 }),
  kyc: new CircuitBreaker('kyc-service', { threshold: 5, timeout: 30000 }),
  creditScoring: new CircuitBreaker('credit-scoring', { threshold: 5, timeout: 30000 }),
  decision: new CircuitBreaker('decision-service', { threshold: 5, timeout: 30000 }),
  contract: new CircuitBreaker('contract-service', { threshold: 5, timeout: 30000 })
};

// Service routes with circuit breakers
const createServiceProxy = (serviceName: string, path: string, target: string) => {
  const breaker = circuitBreakers[serviceName];
  
  app.use(path, async (req, res, next) => {
    try {
      await breaker.fire(async () => {
        const proxy = createProxyMiddleware({
          target,
          changeOrigin: true,
          pathRewrite: { [`^${path}`]: '' },
          onProxyReq: (proxyReq, req) => {
            proxyReq.setHeader('X-Request-ID', req.headers['x-request-id'] || generateRequestId());
            proxyReq.setHeader('X-User-ID', req.headers['x-user-id'] || 'anonymous');
          },
          onProxyRes: (proxyRes, req, res) => {
            metrics.recordLatency(serviceName, Date.now() - req['startTime']);
            metrics.recordStatusCode(serviceName, proxyRes.statusCode);
          },
          onError: (err, req, res) => {
            logger.error(`Proxy error for ${serviceName}:`, err);
            metrics.recordError(serviceName);
            res.status(502).json({ error: 'Service unavailable' });
          }
        });
        proxy(req, res, next);
      });
    } catch (error) {
      logger.error(`Circuit breaker open for ${serviceName}`);
      res.status(503).json({ error: `${serviceName} is temporarily unavailable` });
    }
  });
};

// GraphQL endpoint (for client optimization mentioned in the paper)
app.post('/graphql', async (req, res) => {
  try {
    // Aggregate data from multiple services
    const { query, variables } = req.body;
    
    // Parse GraphQL query and fetch from appropriate services
    // This reduces client round trips as mentioned in the paper
    const result = await aggregateGraphQLQuery(query, variables);
    
    res.json(result);
  } catch (error) {
    logger.error('GraphQL error:', error);
    res.status(500).json({ errors: [{ message: 'Internal server error' }] });
  }
});

// Service discovery and registration
async function setupServices() {
  const services = await serviceRegistry.discoverServices();
  
  createServiceProxy('loanApplication', '/api/loans', services.loanApplication);
  createServiceProxy('kyc', '/api/kyc', services.kyc);
  createServiceProxy('creditScoring', '/api/credit-score', services.creditScoring);
  createServiceProxy('decision', '/api/decision', services.decision);
  createServiceProxy('contract', '/api/contracts', services.contract);
}

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    services: Object.entries(circuitBreakers).map(([name, breaker]) => ({
      name,
      status: breaker.getState()
    }))
  };
  res.json(health);
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(metrics.getPrometheusMetrics());
});

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function aggregateGraphQLQuery(query: string, variables: any): Promise<any> {
  // Simplified GraphQL aggregation logic
  // In production, use a proper GraphQL schema and resolver
  const result = {
    data: {},
    errors: []
  };
  
  // Parse query and determine which services to call
  // Aggregate results and return
  
  return result;
}

const PORT = process.env.PORT || 8080;

setupServices().then(() => {
  app.listen(PORT, () => {
    logger.info(`API Gateway listening on port ${PORT}`);
  });
}).catch(error => {
  logger.error('Failed to setup services:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
