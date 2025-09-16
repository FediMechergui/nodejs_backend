// Global setup - runs once before all tests
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

module.exports = async () => {
  console.log("🧪 Setting up test environment...");

  // Load test environment variables
  require("dotenv").config({ path: ".env.test" });

  console.log(`🔧 Using test database: ${process.env.DATABASE_URL}`);

  try {
    // First, try to connect to the test database directly
    const testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Test the connection
    await testPrisma.$connect();
    console.log("✅ Test database connection successful");
    await testPrisma.$disconnect();
  } catch (connectionError) {
    console.log("⚠️  Test database does not exist, attempting to create...");

    try {
      // Use PowerShell-compatible command to create database
      const createDbCommand =
        'mysql -u root -e "CREATE DATABASE IF NOT EXISTS thea_db_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"';

      try {
        execSync(createDbCommand, { stdio: "inherit" });
        console.log("✅ Test database created");
      } catch (mysqlError) {
        console.log("⚠️  MySQL command failed, trying Prisma db push...");
      }

      // Push the schema to the test database
      execSync("npx prisma db push --schema=./prisma/schema.prisma", {
        env: { ...process.env },
        stdio: "inherit",
      });

      console.log("✅ Test database schema pushed");
    } catch (pushError) {
      console.error(
        "❌ Failed to create database with Prisma db push:",
        pushError
      );
      throw pushError;
    }
  }

  console.log("🎉 Test environment setup complete!");
};
