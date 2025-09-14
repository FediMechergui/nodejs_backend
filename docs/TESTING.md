# THEA Backend Testing Guide

## 🧪 Testing Overview

This document provides comprehensive information about the testing setup for the THEA Backend microservice. Our testing strategy covers:

- **Unit Tests**: Individual functions and middleware
- **Integration Tests**: API endpoints and database interactions
- **Service Tests**: External service integrations (Redis, MinIO, RabbitMQ)
- **Coverage Reports**: HTML and JUnit XML reports for CI/CD

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

## 📋 Test Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode (re-runs on file changes) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:ci` | Run tests for CI/CD with JUnit reports |
| `npm run test:unit` | Run only unit tests (exclude integration tests) |
| `npm run test:integration` | Run only integration tests |

## 🏗️ Test Structure

```
tests/
├── setup.js                 # Test environment setup
├── globalSetup.js          # Global test setup (database creation)
├── globalTeardown.js       # Global test cleanup (database deletion)
├── middleware/             # Middleware tests
│   ├── auth.test.js       # Authentication middleware tests
│   └── errorHandler.test.js # Error handling tests
├── routes/                 # API route tests
│   ├── auth.test.js       # Authentication endpoints
│   └── invoices.test.js   # Invoice management endpoints
└── services/               # Service layer tests
    └── redisService.test.js # Redis service tests
```

## 🧩 Test Configuration

### Jest Configuration (`jest.config.js`)

- **Environment**: Node.js
- **Coverage Threshold**: 80% (branches, functions, lines, statements)
- **Reporters**: Default + JUnit XML for CI/CD
- **Test Timeout**: 30 seconds
- **Coverage Reports**: HTML, LCOV, Cobertura, JUnit

### Test Database

Tests use a separate test database (`thea_db_test`) that is:
- Created automatically before all tests
- Populated with test schema
- Cleaned between test runs
- Destroyed after all tests complete

### Environment Variables

Test environment uses specific test values:
- `NODE_ENV=test`
- `DATABASE_URL=mysql://root@localhost:3306/thea_db_test`
- `JWT_SECRET=test-jwt-secret-key-for-testing-only`
- Mocked external services (Redis, MinIO, RabbitMQ)

## 🧪 Test Categories

### 1. Unit Tests

**Location**: `tests/middleware/`, `tests/services/`

**Coverage**:
- Authentication middleware
- Error handling middleware
- Redis service operations
- Validation logic
- Utility functions

**Example**:
```javascript
describe('Authentication Middleware', () => {
  it('should authenticate valid JWT token', () => {
    // Test implementation
  });
});
```

### 2. Integration Tests

**Location**: `tests/routes/`

**Coverage**:
- API endpoint functionality
- Database operations
- Request/response handling
- Authentication flows
- File uploads

**Example**:
```javascript
describe('POST /auth/register', () => {
  it('should register a new user successfully', async () => {
    // Test implementation with database
  });
});
```

### 3. Service Tests

**Location**: `tests/services/`

**Coverage**:
- External service connections
- Error handling
- Service initialization
- Mock interactions

## 🔧 Test Utilities

### Global Test Utilities (`tests/setup.js`)

```javascript
// Generate test JWT tokens
const token = testUtils.generateTestToken(userId, role, enterpriseId);

// Mock request/response objects
const req = testUtils.mockRequest({ body: { key: 'value' } });
const res = testUtils.mockResponse();

// Database operations
await testUtils.cleanDatabase();
const enterprise = await testUtils.createTestEnterprise();
const user = await testUtils.createTestUser(enterpriseId, 'ADMIN');
```

### Mock Objects

```javascript
// Mock request
const mockReq = {
  headers: { authorization: 'Bearer token' },
  body: { key: 'value' },
  params: { id: '123' },
  user: { id: 'user-123', role: 'ADMIN' }
};

// Mock response
const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
};
```

## 📊 Coverage Reports

### HTML Coverage Report

After running `npm run test:coverage`, open:
```
coverage/index.html
```

**What's Covered**:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

**Excluded from Coverage**:
- `src/server.js` (main entry point)
- `src/config/logger.js` (logging configuration)
- Test files themselves

### JUnit XML Report

Generated for CI/CD integration:
```
coverage/junit.xml
```

**Usage**:
- Jenkins integration
- GitLab CI/CD
- GitHub Actions
- SonarQube analysis

## 🚨 Test Best Practices

### 1. Test Isolation

```javascript
beforeEach(async () => {
  await testUtils.cleanDatabase();
  // Recreate test data
});

afterEach(() => {
  jest.clearAllMocks();
});
```

### 2. Descriptive Test Names

```javascript
// Good
it('should reject login with invalid credentials', async () => {
  // Test implementation
});

// Avoid
it('should work', async () => {
  // Test implementation
});
```

### 3. Arrange-Act-Assert Pattern

```javascript
it('should create invoice successfully', async () => {
  // Arrange
  const invoiceData = { /* test data */ };
  
  // Act
  const response = await request(app)
    .post('/invoices')
    .send(invoiceData);
  
  // Assert
  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);
});
```

### 4. Mock External Dependencies

```javascript
// Mock Redis service
jest.mock('../../src/services/redisService');

// Mock MinIO service
jest.mock('../../src/services/minioService');
```

## 🔍 Debugging Tests

### 1. Run Single Test File

```bash
npm test -- tests/routes/auth.test.js
```

### 2. Run Single Test

```bash
npm test -- --testNamePattern="should authenticate valid JWT token"
```

### 3. Debug Mode

```bash
npm test -- --detectOpenHandles --forceExit
```

### 4. Verbose Output

```bash
npm test -- --verbose
```

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Tests
  run: npm run test:ci
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Jenkins Pipeline Example

```groovy
stage('Test') {
  steps {
    sh 'npm run test:ci'
  }
  post {
    always {
      publishTestResults testResultsPattern: 'coverage/junit.xml'
      publishHTML([
        allowMissing: false,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: 'coverage',
        reportFiles: 'index.html',
        reportName: 'Coverage Report'
      ])
    }
  }
}
```

## 🐛 Common Issues

### 1. Database Connection Errors

**Problem**: Tests fail with database connection errors
**Solution**: Ensure MySQL is running and accessible

### 2. Port Conflicts

**Problem**: Tests fail due to port conflicts
**Solution**: Tests use different ports (3001 for tests vs 3000 for dev)

### 3. External Service Dependencies

**Problem**: Tests fail due to Redis/MinIO/RabbitMQ
**Solution**: All external services are mocked in tests

### 4. Test Timeout

**Problem**: Tests timeout after 30 seconds
**Solution**: Increase timeout in `jest.config.js` or optimize slow tests

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Node.js Testing Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

## 🤝 Contributing

When adding new tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Mock external dependencies
4. Ensure proper cleanup
5. Maintain 80%+ coverage
6. Update this documentation if needed

---

**Happy Testing! 🧪✨**
