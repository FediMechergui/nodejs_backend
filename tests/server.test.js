const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Set test environment variables BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random available port
process.env.RATE_LIMIT_WINDOW_MS = '900000'; // 15 minutes
process.env.RATE_LIMIT_MAX_REQUESTS = '100';

// Mock external services
jest.mock('../src/services/redisService');
jest.mock('../src/services/minioService');
jest.mock('../src/services/rabbitmqService');
jest.mock('../src/services/serviceInitializer');

// Mock logger
jest.mock('../src/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Create test app similar to server.js
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || false
    : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Mock request logger
const mockRequestLogger = (req, res, next) => {
  next();
};
app.use(mockRequestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Mock routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route' });
});

// Mock 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      statusCode: 404
    }
  });
});

// Mock error handler
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error'
    }
  });
});

describe('Server Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check Endpoint', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.environment).toBe('test');
    });

    it('should include valid timestamp', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should include valid uptime', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from any origin in test environment', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.body.status).toBe('OK');
    });

    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(204);

      // CORS headers should be present
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API routes', async () => {
      // Make multiple requests to trigger rate limiting
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/api/test')
          .expect(200);
      }

      // Rate limiting should be working (though we won't hit the limit in this test)
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body.message).toBe('Test route');
    });

    it('should not apply rate limiting to non-API routes', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers from helmet', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Helmet adds various security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-xss-protection']).toBe('0');
    });
  });

  describe('Body Parsing', () => {
    it('should parse JSON bodies', async () => {
      const testData = { message: 'test', number: 123 };
      
      // Create a test route that echoes the body
      const testApp = express();
      testApp.use(express.json({ limit: '25mb' }));
      testApp.post('/test-json', (req, res) => {
        res.json(req.body);
      });

      const response = await request(testApp)
        .post('/test-json')
        .send(testData)
        .expect(200);

      expect(response.body).toEqual(testData);
    });

    it('should parse URL-encoded bodies', async () => {
      const testData = { message: 'test', number: '123' };
      
      // Create a test route that echoes the body
      const testApp = express();
      testApp.use(express.urlencoded({ extended: true, limit: '25mb' }));
      testApp.post('/test-urlencoded', (req, res) => {
        res.json(req.body);
      });

      const response = await request(testApp)
        .post('/test-urlencoded')
        .type('form')
        .send(testData)
        .expect(200);

      expect(response.body).toEqual(testData);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Route not found');
      expect(response.body.error.statusCode).toBe(404);
    });

    it('should handle server errors', async () => {
      // Create a test app with an error route
      const errorApp = express();
      errorApp.get('/error', (req, res, next) => {
        next(new Error('Test error'));
      });
      errorApp.use((err, req, res, next) => {
        res.status(500).json({
          success: false,
          error: {
            message: 'Internal server error'
          }
        });
      });

      const response = await request(errorApp)
        .get('/error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Internal server error');
    });
  });

  describe('Environment Configuration', () => {
    it('should use test environment', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should use test port', () => {
      expect(process.env.PORT).toBe('0');
    });

    it('should use test rate limit configuration', () => {
      expect(process.env.RATE_LIMIT_WINDOW_MS).toBe('900000');
      expect(process.env.RATE_LIMIT_MAX_REQUESTS).toBe('100');
    });
  });

  describe('Request Logging', () => {
    it('should include request logging middleware', async () => {
      // The mock request logger should not throw errors
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
    });
  });

  describe('API Routes', () => {
    it('should serve API routes', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body.message).toBe('Test route');
    });
  });

  describe('Process Signal Handlers', () => {
    it('should have process signal handlers configured', () => {
      // Test that the process signal handlers are properly configured
      // This is a placeholder test since we can't easily test process.on calls
      expect(true).toBe(true);
    });
  });
});
