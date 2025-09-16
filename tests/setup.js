// Test setup file - runs before each test file

// Load test environment variables FIRST
require('dotenv').config({ path: '.env.test' });

// Ensure we're in test mode
process.env.NODE_ENV = 'test';

const { PrismaClient } = require('@prisma/client');

// Mock external services with complete implementations
jest.mock('../src/services/redisService', () => {
  const mockRedisClient = {
    connect: jest.fn().mockResolvedValue(),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue(),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue('test-value'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(300),
    hSet: jest.fn().mockResolvedValue(1),
    hGet: jest.fn().mockResolvedValue('test-value'),
    hGetAll: jest.fn().mockResolvedValue({}),
    on: jest.fn()
  };

  return {
    initializeRedis: jest.fn().mockResolvedValue(),
    getRedisClient: jest.fn().mockReturnValue(mockRedisClient),
    set: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue('test-value'),
    del: jest.fn().mockResolvedValue(true),
    exists: jest.fn().mockResolvedValue(true),
    expire: jest.fn().mockResolvedValue(true),
    ttl: jest.fn().mockResolvedValue(300),
    hset: jest.fn().mockResolvedValue(true),
    hget: jest.fn().mockResolvedValue('test-value'),
    hgetall: jest.fn().mockResolvedValue({}),
    closeRedis: jest.fn().mockResolvedValue()
  };
});

jest.mock('../src/services/minioService', () => ({
  initializeMinIO: jest.fn().mockResolvedValue(),
  getMinioClient: jest.fn().mockReturnValue({}),
  uploadFile: jest.fn().mockResolvedValue({ bucket: 'test', object: 'test.pdf', size: 1024 }),
  downloadFile: jest.fn().mockResolvedValue('/path/to/file.pdf'),
  getPresignedUrl: jest.fn().mockResolvedValue('https://minio.example.com/upload-url'),
  getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://minio.example.com/download-url'),
  deleteFile: jest.fn().mockResolvedValue(true),
  listObjects: jest.fn().mockResolvedValue([]),
  getFileMetadata: jest.fn().mockResolvedValue({ size: 1024, contentType: 'application/pdf' }),
  copyFile: jest.fn().mockResolvedValue(true),
  closeMinIO: jest.fn().mockResolvedValue()
}));

jest.mock('../src/services/rabbitmqService', () => ({
  initializeRabbitMQ: jest.fn().mockResolvedValue(),
  publishMessage: jest.fn().mockResolvedValue(true),
  subscribeToQueue: jest.fn().mockResolvedValue(),
  consumeMessages: jest.fn().mockResolvedValue(),
  getQueueInfo: jest.fn().mockResolvedValue({ messageCount: 0, consumerCount: 0 }),
  purgeQueue: jest.fn().mockResolvedValue(true),
  deleteQueue: jest.fn().mockResolvedValue(true),
  healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' }),
  closeRabbitMQ: jest.fn().mockResolvedValue()
}));

// Mock the database configuration to use test database
jest.mock('../src/config/database', () => {
  const { PrismaClient } = require('@prisma/client');
  
  // Create a test-specific Prisma client
  const testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'mysql://root@localhost:3307/thea_db_test'
      }
    }
  });

  return {
    prisma: testPrisma,
    testConnection: jest.fn().mockResolvedValue(true),
    initializeDatabase: jest.fn().mockResolvedValue(true)
  };
});

// Mock environment variables for testing - these MUST override .env file values
// process.env.NODE_ENV = 'test';
// process.env.PORT = '3001';
// process.env.DATABASE_URL = 'mysql://root@localhost:3306/thea_db_test';
// process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
// process.env.JWT_EXPIRES_IN = '1h';
// process.env.JWT_REFRESH_EXPIRES_IN = '7d';
// process.env.REDIS_URL = 'redis://localhost:6379';
// process.env.MINIO_ENDPOINT = 'localhost';
// process.env.MINIO_PORT = '9000';
// process.env.MINIO_ACCESS_KEY = 'test-access-key';
// process.env.MINIO_SECRET_KEY = 'test-secret-key';
// process.env.RABBITMQ_URL = 'amqp://localhost:5672';

// Global test utilities
global.testUtils = {
  // Generate test JWT tokens
  generateTestToken: (userId = 'test-user-id', role = 'ADMIN', enterpriseId = 'test-enterprise-id') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, role, enterpriseId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },

  // Mock request object
  mockRequest: (overrides = {}) => ({
    headers: {},
    body: {},
    params: {},
    query: {},
    user: { id: 'test-user-id', role: 'ADMIN', enterpriseId: 'test-enterprise-id' },
    ...overrides
  }),

  // Mock response object
  mockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
  },

  // Mock next function
  mockNext: jest.fn(),

  // Clean database between tests
  cleanDatabase: async () => {
    const prisma = new PrismaClient();
    try {
      // Delete all data in reverse dependency order
      // Use try-catch for each operation to handle cases where tables might not exist
      try { await prisma.auditLog.deleteMany(); } catch (e) {}
      try { await prisma.metrics.deleteMany(); } catch (e) {}
      try { await prisma.invoiceLayout.deleteMany(); } catch (e) {}
      try { await prisma.invoice.deleteMany(); } catch (e) {}
      try { await prisma.companyStock.deleteMany(); } catch (e) {}
      try { await prisma.project.deleteMany(); } catch (e) {}
      try { await prisma.supplier.deleteMany(); } catch (e) {}
      try { await prisma.client.deleteMany(); } catch (e) {}
      try { await prisma.user.deleteMany(); } catch (e) {}
      try { await prisma.enterprise.deleteMany(); } catch (e) {}
    } catch (error) {
      console.error('Error cleaning database:', error);
    } finally {
      await prisma.$disconnect();
    }
  },

  // Create test enterprise
  createTestEnterprise: async () => {
    const prisma = new PrismaClient();
    try {
      // Generate unique values to avoid conflicts
      const uniqueTaxId = `TEST-TAX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const uniqueInviteCode = `TEST-INVITE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Let Prisma generate the UUID
      return await prisma.enterprise.create({
        data: {
          name: 'Test Enterprise',
          taxId: uniqueTaxId,
          country: 'Test Country',
          currency: 'USD',
          address: '123 Test Street',
          phone: '+1-555-0123',
          city: 'Test City',
          postalCode: '12345',
          invitationCode: uniqueInviteCode
        }
      });
    } finally {
      await prisma.$disconnect();
    }
  },

  // Create test user
  createTestUser: async (enterpriseId, role = 'ADMIN') => {
    const prisma = new PrismaClient();
    try {
      // Generate unique values to avoid conflicts
      const uniqueUsername = `testuser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
      
      // Create user with a known password: 'admin123'
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('admin123', 12);
      
      // Let Prisma generate the UUID
      return await prisma.user.create({
        data: {
          username: uniqueUsername,
          email: uniqueEmail,
          passwordHash,
          role,
          enterpriseId
        }
      });
    } finally {
      await prisma.$disconnect();
    }
  }
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock logger to prevent actual logging during tests
jest.mock('../src/config/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn()
  };
  
  return {
    __esModule: true,
    default: mockLogger,
    logger: mockLogger,
    ...mockLogger
  };
});

// Ensure logger is available globally for tests
global.logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  log: jest.fn()
};

// Set test timeout
jest.setTimeout(30000);

// Database cleanup is now handled in individual test files
// No global beforeEach hook needed
