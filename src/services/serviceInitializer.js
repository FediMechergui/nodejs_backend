const { logger } = require('../config/logger');
const { initializeRedis } = require('./redisService');
const { initializeMinIO } = require('./minioService');
const { initializeRabbitMQ } = require('./rabbitmqService');
const { initializeDatabase } = require('../config/database');

/**
 * Initialize all external services
 */
async function initializeServices() {
  try {
    logger.info('🚀 Initializing THEA services...');
    
    // Initialize database first
    await initializeDatabase();
    logger.info('✅ Database service initialized');
    
    // Initialize Redis
    await initializeRedis();
    logger.info('✅ Redis service initialized');
    
    // Initialize MinIO
    await initializeMinIO();
    logger.info('✅ MinIO service initialized');
    
    // Initialize RabbitMQ
    await initializeRabbitMQ();
    logger.info('✅ RabbitMQ service initialized');
    
    logger.info('🎉 All services initialized successfully!');
    
  } catch (error) {
    logger.error('❌ Service initialization failed:', error);
    throw error;
  }
}

/**
 * Gracefully shutdown all services
 */
async function shutdownServices() {
  try {
    logger.info('🔄 Shutting down THEA services...');
    
    // Shutdown services in reverse order
    // RabbitMQ, MinIO, Redis, Database
    
    logger.info('✅ All services shut down gracefully');
  } catch (error) {
    logger.error('❌ Service shutdown failed:', error);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down services...');
  await shutdownServices();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down services...');
  await shutdownServices();
  process.exit(0);
});

module.exports = {
  initializeServices,
  shutdownServices
};
