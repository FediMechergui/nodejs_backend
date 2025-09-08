// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
};

jest.mock('../../src/config/logger', () => ({
  logger: mockLogger
}));

// Mock services
const mockRedisService = {
  initializeRedis: jest.fn()
};

const mockMinioService = {
  initializeMinIO: jest.fn()
};

const mockRabbitmqService = {
  initializeRabbitMQ: jest.fn()
};

const mockDatabase = {
  initializeDatabase: jest.fn()
};

jest.mock('../../src/services/redisService', () => mockRedisService);
jest.mock('../../src/services/minioService', () => mockMinioService);
jest.mock('../../src/services/rabbitmqService', () => mockRabbitmqService);
jest.mock('../../src/config/database', () => mockDatabase);

// Import the service after mocking
const { initializeServices, shutdownServices } = require('../../src/services/serviceInitializer');

describe('Service Initializer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeServices', () => {
    it('should initialize all services successfully', async () => {
      // Mock successful initialization
      mockDatabase.initializeDatabase.mockResolvedValue();
      mockRedisService.initializeRedis.mockResolvedValue();
      mockMinioService.initializeMinIO.mockResolvedValue();
      mockRabbitmqService.initializeRabbitMQ.mockResolvedValue();

      await initializeServices();

      expect(mockDatabase.initializeDatabase).toHaveBeenCalled();
      expect(mockRedisService.initializeRedis).toHaveBeenCalled();
      expect(mockMinioService.initializeMinIO).toHaveBeenCalled();
      expect(mockRabbitmqService.initializeRabbitMQ).toHaveBeenCalled();

      expect(mockLogger.info).toHaveBeenCalledWith('🚀 Initializing THEA services...');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Database service initialized');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Redis service initialized');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ MinIO service initialized');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ RabbitMQ service initialized');
      expect(mockLogger.info).toHaveBeenCalledWith('🎉 All services initialized successfully!');
    });

    it('should handle database initialization failure', async () => {
      const error = new Error('Database connection failed');
      mockDatabase.initializeDatabase.mockRejectedValue(error);

      await expect(initializeServices()).rejects.toThrow('Database connection failed');

      expect(mockLogger.error).toHaveBeenCalledWith('❌ Service initialization failed:', error);
      expect(mockRedisService.initializeRedis).not.toHaveBeenCalled();
      expect(mockMinioService.initializeMinIO).not.toHaveBeenCalled();
      expect(mockRabbitmqService.initializeRabbitMQ).not.toHaveBeenCalled();
    });

    it('should handle Redis initialization failure', async () => {
      const error = new Error('Redis connection failed');
      mockDatabase.initializeDatabase.mockResolvedValue();
      mockRedisService.initializeRedis.mockRejectedValue(error);

      await expect(initializeServices()).rejects.toThrow('Redis connection failed');

      expect(mockLogger.error).toHaveBeenCalledWith('❌ Service initialization failed:', error);
      expect(mockMinioService.initializeMinIO).not.toHaveBeenCalled();
      expect(mockRabbitmqService.initializeRabbitMQ).not.toHaveBeenCalled();
    });

    it('should handle MinIO initialization failure', async () => {
      const error = new Error('MinIO connection failed');
      mockDatabase.initializeDatabase.mockResolvedValue();
      mockRedisService.initializeRedis.mockResolvedValue();
      mockMinioService.initializeMinIO.mockRejectedValue(error);

      await expect(initializeServices()).rejects.toThrow('MinIO connection failed');

      expect(mockLogger.error).toHaveBeenCalledWith('❌ Service initialization failed:', error);
      expect(mockRabbitmqService.initializeRabbitMQ).not.toHaveBeenCalled();
    });

    it('should handle RabbitMQ initialization failure', async () => {
      const error = new Error('RabbitMQ connection failed');
      mockDatabase.initializeDatabase.mockResolvedValue();
      mockRedisService.initializeRedis.mockResolvedValue();
      mockMinioService.initializeMinIO.mockResolvedValue();
      mockRabbitmqService.initializeRabbitMQ.mockRejectedValue(error);

      await expect(initializeServices()).rejects.toThrow('RabbitMQ connection failed');

      expect(mockLogger.error).toHaveBeenCalledWith('❌ Service initialization failed:', error);
    });
  });

  describe('shutdownServices', () => {
    it('should shutdown services gracefully', async () => {
      await shutdownServices();

      expect(mockLogger.info).toHaveBeenCalledWith('🔄 Shutting down THEA services...');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ All services shut down gracefully');
    });

    it('should handle shutdown errors gracefully', async () => {
      // Mock a shutdown error by making logger.info throw
      mockLogger.info.mockImplementationOnce(() => {
        throw new Error('Shutdown error');
      });

      await shutdownServices();

      expect(mockLogger.error).toHaveBeenCalledWith('❌ Service shutdown failed:', expect.any(Error));
    });
  });

  describe('Signal Handlers', () => {
    let originalProcessOn;
    let originalProcessExit;

    beforeEach(() => {
      originalProcessOn = process.on;
      originalProcessExit = process.exit;
      process.on = jest.fn();
      process.exit = jest.fn();
    });

    afterEach(() => {
      process.on = originalProcessOn;
      process.exit = originalProcessExit;
    });

    it('should register SIGTERM handler', () => {
      // Re-import to trigger signal handler registration
      jest.resetModules();
      require('../../src/services/serviceInitializer');

      expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });

    it('should register SIGINT handler', () => {
      // Re-import to trigger signal handler registration
      jest.resetModules();
      require('../../src/services/serviceInitializer');

      expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });
  });
});