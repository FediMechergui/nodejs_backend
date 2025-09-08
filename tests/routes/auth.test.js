const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// Set test environment variables BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'mysql://root@localhost:3306/thea_db_test';

// Force clear any cached modules that might interfere
jest.resetModules();

// Mock external services
jest.mock('../../src/services/redisService');
jest.mock('../../src/services/minioService');
jest.mock('../../src/services/rabbitmqService');

// Create a test app that mimics the server setup but without service initialization
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Import auth routes
const authRoutes = require('../../src/routes/auth');
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found'
    }
  });
});

describe('Authentication Routes', () => {
  let testEnterprise;
  let testUser;

  beforeAll(async () => {
    // Ensure clean environment - force reset all environment variables
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'mysql://root@localhost:3306/thea_db_test';
    
    // Force clear any cached modules that might interfere
    jest.resetModules();
    
    // Clean database first to ensure no interference from other tests
    await global.testUtils.cleanDatabase();
    
    // Use the mocked database configuration from setup.js
    const { prisma } = require('../../src/config/database');
    
    // Create test enterprise
    testEnterprise = await global.testUtils.createTestEnterprise();
    
    // Create test user
    testUser = await global.testUtils.createTestUser(testEnterprise.id, 'ADMIN');
  });

  afterAll(async () => {
    await global.testUtils.cleanDatabase();
  });

  beforeEach(async () => {
    // Ensure JWT_SECRET is set for each test
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
    process.env.NODE_ENV = 'test';
  });

  // beforeEach hook removed - we don't need to recreate data for each test
  // since we're using unique IDs and the beforeAll creates everything we need

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUserData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'ACCOUNTANT',
        enterpriseId: testEnterprise.id
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.username).toBe('newuser');
      expect(response.body.data.email).toBe('newuser@example.com');
      expect(response.body.data.role).toBe('ACCOUNTANT');
      expect(response.body.data.passwordHash).toBeUndefined(); // Password should not be returned
      // Registration doesn't return tokens - only user data

      // Verify user was created in database
      const { prisma } = require('../../src/config/database');
      const createdUser = await prisma.user.findUnique({
        where: { username: 'newuser' }
      });
      expect(createdUser).toBeDefined();
      expect(createdUser.passwordHash).not.toBe('password123'); // Should be hashed
    });

    it('should reject registration with existing username', async () => {
      const existingUserData = {
        username: testUser.username, // Already exists
        email: 'different@example.com',
        password: 'password123',
        role: 'ACCOUNTANT',
        enterpriseId: testEnterprise.id
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUserData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('User already exists with this username or email');
    });

    it('should reject registration with existing email', async () => {
      const existingUserData = {
        username: 'differentuser',
        email: testUser.email, // Already exists
        password: 'password123',
        role: 'ACCOUNTANT',
        enterpriseId: testEnterprise.id
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUserData)
        .expect(409);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('User already exists with this username or email');
    });

    it('should reject registration with invalid enterprise ID', async () => {
      const invalidUserData = {
        username: 'invaliduser',
        email: 'invaliduser@example.com',
        password: 'password123',
        role: 'ACCOUNTANT',
        enterpriseId: '00000000-0000-0000-0000-000000000000' // Valid UUID format but non-existent
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUserData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Enterprise not found');
    });

    it('should reject registration with missing required fields', async () => {
      const invalidUserData = {
        username: 'incomplete',
        // Missing email, password, enterpriseId, role
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Validation failed');
    });
  });

  describe('POST /auth/login', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        username: testUser.username,
        password: 'admin123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.username).toBe(testUser.username);
      expect(response.body.data.user.passwordHash).toBeUndefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject login with invalid username', async () => {
      const loginData = {
        username: 'nonexistentuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid credentials');
    });

        it('should reject login with invalid password', async () => {
      const loginData = {
        username: testUser.username,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid credentials');
    });

    it('should reject login with missing credentials', async () => {
      const invalidLoginData = {
        username: '',
        password: ''
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLoginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Validation failed');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // First login to get a refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'admin123'
        });

      const refreshToken = loginResponse.body.data.refreshToken;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid refresh token');
    });

    it('should reject refresh with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Validation failed');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${global.testUtils.generateTestToken(testUser.id, testUser.role, testEnterprise.id)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should reject logout without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Access token required');
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user information', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${global.testUtils.generateTestToken(testUser.id, testUser.role, testEnterprise.id)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.username).toBe(testUser.username);
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Access token required');
    });
  });

  describe('POST /auth/change-password', () => {
    it('should change password successfully', async () => {
      const changePasswordData = {
        currentPassword: 'admin123',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${global.testUtils.generateTestToken(testUser.id, testUser.role, testEnterprise.id)}`)
        .send(changePasswordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
    });

    it('should reject password change with wrong current password', async () => {
      const changePasswordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${global.testUtils.generateTestToken(testUser.id, testUser.role, testEnterprise.id)}`)
        .send(changePasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Current password is incorrect');
    });

    it('should reject password change without authentication', async () => {
      const changePasswordData = {
        currentPassword: 'admin123',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .send(changePasswordData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Access token required');
    });
  });
});
