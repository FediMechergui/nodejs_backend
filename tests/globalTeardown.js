// Global teardown - runs once after all tests
const { PrismaClient } = require('@prisma/client');

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Use the same test database URL that was set in globalSetup
  const testDbUrl =
    process.env.DATABASE_URL || "mysql://root@localhost:3307/thea_db_test";
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: testDbUrl
      }
    }
  });

  try {
    // Drop test database
    await prisma.$executeRaw`DROP DATABASE IF EXISTS thea_db_test`;
    console.log('✅ Test database dropped');
  } catch (error) {
    console.error('❌ Error cleaning up test database:', error);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('🎉 Test environment cleanup complete!');
};
