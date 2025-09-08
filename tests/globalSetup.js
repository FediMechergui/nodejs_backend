// Global setup - runs once before all tests
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

module.exports = async () => {
  console.log('🧪 Setting up test environment...');
  
  try {
    // Use the existing database from .env but with a test suffix
    const baseDbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/thea_db_neo';
    const testDbUrl = baseDbUrl.replace(/\/[^\/]+$/, '/thea_db_test');
    
    // Set the test database URL for this process
    process.env.DATABASE_URL = testDbUrl;
    
    console.log(`🔧 Using test database: ${testDbUrl}`);
    
    try {
      // First, try to connect to the test database directly
      const testPrisma = new PrismaClient({
        datasources: {
          db: {
            url: testDbUrl
          }
        }
      });
      
      // Test the connection
      await testPrisma.$connect();
      console.log('✅ Test database connection successful');
      await testPrisma.$disconnect();
      
    } catch (connectionError) {
      console.log('⚠️  Test database does not exist, attempting to create...');
      
      try {
        // Use PowerShell-compatible command to create database
        const createDbCommand = `mysql -u root -e "CREATE DATABASE IF NOT EXISTS thea_db_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"`;
        
        try {
          execSync(createDbCommand, { stdio: 'inherit' });
          console.log('✅ Test database created');
        } catch (mysqlError) {
          console.log('⚠️  MySQL command failed, trying Prisma db push...');
        }
        
        // Push the schema to the test database
        execSync('npx prisma db push --schema=./prisma/schema.prisma', {
          env: { ...process.env, DATABASE_URL: testDbUrl },
          stdio: 'inherit'
        });
        
        console.log('✅ Test database schema pushed');
        
      } catch (pushError) {
        console.error('❌ Failed to create database with Prisma db push:', pushError);
        throw pushError;
      }
    }
    
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    throw error;
  }
  
  console.log('🎉 Test environment setup complete!');
};
