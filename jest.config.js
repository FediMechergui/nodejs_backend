module.exports = {
  // Test environment
  testEnvironment: "node",

  // Test file patterns - run auth tests first to avoid interference
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],

  // Run tests in a specific order to avoid interference
  testSequencer: "<rootDir>/tests/testSequencer.js",

  // Load test environment variables
  setupFiles: ["dotenv/config"],

  // Configure dotenv to load test environment
  testEnvironmentOptions: {
    NODE_ENV: "test",
  },

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/*.spec.js",
    "!src/server.js",
    "!src/config/logger.js",
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 40,
      lines: 50,
      statements: 50,
    },
  },

  // Coverage reporters
  coverageReporters: ["text", "text-summary", "html", "lcov", "cobertura"],

  // Coverage directory
  coverageDirectory: "coverage",

  // JUnit reporter for CI/CD
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "coverage",
        outputName: "junit.xml",
        classNameTemplate: "{classname}",
        titleTemplate: "{title}",
        ancestorSeparator: " › ",
        usePathForSuiteName: true,
      },
    ],
  ],

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  // Run tests sequentially to avoid cross-file DB cleanup interference
  maxWorkers: 1,

  // Test timeout
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Module name mapping for imports
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Global test setup
  globalSetup: "<rootDir>/tests/globalSetup.js",
  globalTeardown: "<rootDir>/tests/globalTeardown.js",
};
