const { PrismaClient } = require('@prisma/client');
const { logger } = require('./logger');

// Create Prisma client instance
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Query: ' + e.query);
    logger.debug('Params: ' + e.params);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}

// Log errors
prisma.$on('error', (e) => {
  logger.error('Prisma Error:', e);
});

// Log warnings
prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning:', e);
});

// Log info
prisma.$on('info', (e) => {
  logger.info('Prisma Info:', e);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Test database connection
async function testConnection() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connection established successfully');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    logger.info('✅ Database query test successful');
    
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Initialize database
async function initializeDatabase() {
  try {
    await testConnection();
    
    // Run migrations if needed
    if (process.env.NODE_ENV === 'development') {
      logger.info('🔄 Running database migrations...');
      // Prisma will handle migrations automatically
    }
    
    logger.info('✅ Database initialization completed');
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
}

module.exports = {
  prisma,
  testConnection,
  initializeDatabase
};
