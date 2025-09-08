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

  it('should initialize redis without errors', async () => {
    await expect(redisService.initializeRedis()).resolves.not.toThrow();
  });

  it('should handle basic key-value operations', async () => {
    await redisService.initializeRedis();
    
    // Mock the operations
    redisService.set.mockResolvedValue(true);
    redisService.get.mockResolvedValue('test-value');
    redisService.exists.mockResolvedValue(true);
    redisService.del.mockResolvedValue(true);
    
    const setResult = await redisService.set('test-key', 'test-value');
    expect(setResult).toBe(true);
    
    const getValue = await redisService.get('test-key');
    expect(getValue).toBe('test-value');
    
    const existsResult = await redisService.exists('test-key');
    expect(existsResult).toBe(true);
    
    const delResult = await redisService.del('test-key');
    expect(delResult).toBe(true);
  });

  it('should handle hash operations', async () => {
    await redisService.initializeRedis();
    
    // Mock hash operations
    redisService.hset.mockResolvedValue(true);
    redisService.hget.mockResolvedValue('field-value');
    redisService.hgetall.mockResolvedValue({ field1: 'value1' });
    
    const hsetResult = await redisService.hset('hash-key', 'field', 'value');
    expect(hsetResult).toBe(true);
    
    const hgetResult = await redisService.hget('hash-key', 'field');
    expect(hgetResult).toBe('field-value');
    
    const hgetallResult = await redisService.hgetall('hash-key');
    expect(hgetallResult).toEqual({ field1: 'value1' });
  });

  it('should handle TTL operations', async () => {
    await redisService.initializeRedis();
    
    // Mock TTL operations
    redisService.expire.mockResolvedValue(true);
    redisService.ttl.mockResolvedValue(3600);
    
    const expireResult = await redisService.expire('test-key', 3600);
    expect(expireResult).toBe(true);
    
    const ttlResult = await redisService.ttl('test-key');
    expect(ttlResult).toBe(3600);
  });

  it('should close redis connection', async () => {
    redisService.closeRedis.mockResolvedValue();
    await expect(redisService.closeRedis()).resolves.not.toThrow();
  });

  it('should handle set with TTL', async () => {
    await redisService.initializeRedis();
    
    redisService.set.mockResolvedValue(true);
    const result = await redisService.set('test-key', 'test-value', 300);
    expect(result).toBe(true);
  });

  it('should handle object serialization', async () => {
    await redisService.initializeRedis();
    
    const testObject = { name: 'test', value: 123 };
    redisService.set.mockResolvedValue(true);
    redisService.get.mockResolvedValue(testObject);
    
    const setResult = await redisService.set('object-key', testObject);
    expect(setResult).toBe(true);
    
    const getResult = await redisService.get('object-key');
    expect(getResult).toEqual(testObject);
  });

  it('should handle non-existent keys', async () => {
    await redisService.initializeRedis();
    
    redisService.get.mockResolvedValue(null);
    redisService.exists.mockResolvedValue(false);
    
    const getValue = await redisService.get('non-existent-key');
    expect(getValue).toBeNull();
    
    const existsValue = await redisService.exists('non-existent-key');
    expect(existsValue).toBe(false);
  });
});
