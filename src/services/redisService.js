const redis = require('redis');
const { logger } = require('../config/logger');

let redisClient = null;

/**
 * Initialize Redis connection
 */
async function initializeRedis() {
  try {
    const redisConfig = {
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB) || 0,
    };

    redisClient = redis.createClient(redisConfig);

    // Handle Redis events
    redisClient.on('connect', () => {
      logger.info('🔗 Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis client ready');
    });

    redisClient.on('error', (err) => {
      logger.error('❌ Redis client error:', err);
    });

    redisClient.on('end', () => {
      logger.info('🔌 Redis client disconnected');
    });

    redisClient.on('reconnecting', () => {
      logger.info('🔄 Redis client reconnecting...');
    });

    // Connect to Redis
    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    logger.info('✅ Redis connection test successful');
    
  } catch (error) {
    logger.error('❌ Redis initialization failed:', error);
    throw error;
  }
}

/**
 * Get Redis client instance
 */
function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

/**
 * Set key-value pair with optional TTL
 */
async function set(key, value, ttl = null) {
  try {
    const client = getRedisClient();
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
    
    if (ttl) {
      await client.setEx(key, ttl, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }
    
    logger.debug(`Redis SET: ${key}`);
    return true;
  } catch (error) {
    logger.error('Redis SET error:', error);
    throw error;
  }
}

/**
 * Get value by key
 */
async function get(key) {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    
    if (value === null) {
      logger.debug(`Redis GET: ${key} (not found)`);
      return null;
    }
    
    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    logger.error('Redis GET error:', error);
    throw error;
  }
}

/**
 * Delete key
 */
async function del(key) {
  try {
    const client = getRedisClient();
    const result = await client.del(key);
    logger.debug(`Redis DEL: ${key} (${result} keys deleted)`);
    return result > 0;
  } catch (error) {
    logger.error('Redis DEL error:', error);
    throw error;
  }
}

/**
 * Check if key exists
 */
async function exists(key) {
  try {
    const client = getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    logger.error('Redis EXISTS error:', error);
    throw error;
  }
}

/**
 * Set key expiration
 */
async function expire(key, seconds) {
  try {
    const client = getRedisClient();
    const result = await client.expire(key, seconds);
    logger.debug(`Redis EXPIRE: ${key} for ${seconds}s`);
    return result === 1;
  } catch (error) {
    logger.error('Redis EXPIRE error:', error);
    throw error;
  }
}

/**
 * Get key TTL
 */
async function ttl(key) {
  try {
    const client = getRedisClient();
    return await client.ttl(key);
  } catch (error) {
    logger.error('Redis TTL error:', error);
    throw error;
  }
}

/**
 * Hash operations
 */
async function hset(key, field, value) {
  try {
    const client = getRedisClient();
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
    await client.hSet(key, field, serializedValue);
    logger.debug(`Redis HSET: ${key}.${field}`);
    return true;
  } catch (error) {
    logger.error('Redis HSET error:', error);
    throw error;
  }
}

async function hget(key, field) {
  try {
    const client = getRedisClient();
    const value = await client.hGet(key, field);
    
    if (value === null) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    logger.error('Redis HGET error:', error);
    throw error;
  }
}

async function hgetall(key) {
  try {
    const client = getRedisClient();
    const hash = await client.hGetAll(key);
    
    // Handle case where hash is null or undefined
    if (!hash || typeof hash !== 'object') {
      return {};
    }
    
    // Parse JSON values
    const result = {};
    for (const [field, value] of Object.entries(hash)) {
      try {
        result[field] = JSON.parse(value);
      } catch {
        result[field] = value;
      }
    }
    
    return result;
  } catch (error) {
    logger.error('Redis HGETALL error:', error);
    throw error;
  }
}

/**
 * Close Redis connection
 */
async function closeRedis() {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('🔌 Redis connection closed');
    }
  } catch (error) {
    logger.error('❌ Redis close error:', error);
  }
}

module.exports = {
  initializeRedis,
  getRedisClient,
  set,
  get,
  del,
  exists,
  expire,
  ttl,
  hset,
  hget,
  hgetall,
  closeRedis
};
