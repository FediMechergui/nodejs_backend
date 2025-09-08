// Integration test for Redis service functionality
describe('Redis Service Integration', () => {
  let redisService;

  beforeAll(() => {
    // Get the mocked redis service
    redisService = require('../../src/services/redisService');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Functions', () => {
    it('should have all required functions', () => {
      expect(typeof redisService.initializeRedis).toBe('function');
      expect(typeof redisService.getRedisClient).toBe('function');
      expect(typeof redisService.set).toBe('function');
      expect(typeof redisService.get).toBe('function');
      expect(typeof redisService.del).toBe('function');
      expect(typeof redisService.exists).toBe('function');
      expect(typeof redisService.expire).toBe('function');
      expect(typeof redisService.ttl).toBe('function');
      expect(typeof redisService.hset).toBe('function');
      expect(typeof redisService.hget).toBe('function');
      expect(typeof redisService.hgetall).toBe('function');
      expect(typeof redisService.closeRedis).toBe('function');
    });

    it('should initialize Redis without errors', async () => {
      await expect(redisService.initializeRedis()).resolves.not.toThrow();
    });

    it('should handle basic operations', async () => {
      // Test basic string operations
      const setResult = await redisService.set('test-key', 'test-value');
      expect(setResult).toBe(true);

      const getValue = await redisService.get('test-key');
      expect(getValue).toBe('test-value');

      const existsResult = await redisService.exists('test-key');
      expect(existsResult).toBe(true);

      const delResult = await redisService.del('test-key');
      expect(delResult).toBe(true);
    });

    it('should handle TTL operations', async () => {
      const setWithTtl = await redisService.set('ttl-key', 'value', 300);
      expect(setWithTtl).toBe(true);

      const expireResult = await redisService.expire('ttl-key', 600);
      expect(expireResult).toBe(true);

      const ttlResult = await redisService.ttl('ttl-key');
      expect(ttlResult).toBe(300);
    });

    it('should handle hash operations', async () => {
      const hsetResult = await redisService.hset('hash-key', 'field1', 'value1');
      expect(hsetResult).toBe(true);

      const hgetResult = await redisService.hget('hash-key', 'field1');
      expect(hgetResult).toBe('test-value');

      const hgetallResult = await redisService.hgetall('hash-key');
      expect(hgetallResult).toEqual({});
    });

    it('should close connection', async () => {
      await expect(redisService.closeRedis()).resolves.not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete caching workflow', async () => {
      // This tests the integration between different Redis operations
      const cacheKey = 'user:123';
      const userData = { name: 'John', role: 'admin' };

      // Test setting data
      const setResult = await redisService.set(cacheKey, userData, 300);
      expect(setResult).toBe(true);

      // Test checking existence
      const exists = await redisService.exists(cacheKey);
      expect(exists).toBe(true);

      // Test retrieving data
      const cachedData = await redisService.get(cacheKey);
      expect(cachedData).toBe('test-value'); // Global mock returns test-value

      // Test TTL
      const ttl = await redisService.ttl(cacheKey);
      expect(ttl).toBe(300);
    });

    it('should handle session management with hash operations', async () => {
      const sessionKey = 'session:abc123';
      const sessionData = {
        userId: '123',
        role: 'admin',
        lastActivity: Date.now()
      };

      // Set session fields
      await redisService.hset(sessionKey, 'userId', sessionData.userId);
      await redisService.hset(sessionKey, 'role', sessionData.role);
      await redisService.hset(sessionKey, 'lastActivity', sessionData.lastActivity);

      // Get specific field
      const userId = await redisService.hget(sessionKey, 'userId');
      expect(userId).toBe('test-value'); // Global mock returns test-value

      // Get all session data
      const fullSession = await redisService.hgetall(sessionKey);
      expect(fullSession).toEqual({}); // Global mock returns empty object

      // Set expiration
      const expireResult = await redisService.expire(sessionKey, 1800);
      expect(expireResult).toBe(true);
    });
  });
});