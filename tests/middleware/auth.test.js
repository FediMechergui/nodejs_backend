const jwt = require('jsonwebtoken');
const { authenticateToken, requireRole, requireEnterpriseAccess, optionalAuth } = require('../../src/middleware/auth');

describe('Authentication Middleware', () => {
  let mockReq, mockRes, mockNext;
  let testEnterprise, testUser;

  beforeAll(async () => {
    // Create test data
    testEnterprise = await testUtils.createTestEnterprise();
    testUser = await testUtils.createTestUser(testEnterprise.id, 'ADMIN');
  });

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: null,
      params: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid JWT token', async () => {
      const token = testUtils.generateTestToken(testUser.id, 'ADMIN', testEnterprise.id);
      mockReq.headers.authorization = `Bearer ${token}`;

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(testUser.id);
      expect(mockReq.user.role).toBe('ADMIN');
      expect(mockReq.user.enterpriseId).toBe(testEnterprise.id);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject request without authorization header', async () => {
      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Access token required',
          statusCode: 401
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', async () => {
      mockReq.headers.authorization = 'InvalidFormat token123';

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid token',
          statusCode: 401
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user-123', role: 'ADMIN', enterpriseId: 'enterprise-456' },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );
      mockReq.headers.authorization = `Bearer ${expiredToken}`;

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Token expired',
          statusCode: 401
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token signature', async () => {
      const invalidToken = jwt.sign(
        { userId: 'user-123', role: 'ADMIN', enterpriseId: 'enterprise-456' },
        'wrong-secret',
        { expiresIn: '1h' }
      );
      mockReq.headers.authorization = `Bearer ${invalidToken}`;

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid token',
          statusCode: 401
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      mockReq.user = { id: testUser.id, role: 'ADMIN', enterpriseId: testEnterprise.id };
    });

    it('should allow access for user with required role', () => {
      const middleware = requireRole('ADMIN');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for user with different role', () => {
      const middleware = requireRole('ACCOUNTANT');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Insufficient permissions',
          statusCode: 403,
          requiredRoles: ['ACCOUNTANT'],
          userRole: 'ADMIN'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for user with lower role', () => {
      const middleware = requireRole('ADMIN');
      mockReq.user.role = 'ACCOUNTANT';
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Insufficient permissions',
          statusCode: 403,
          requiredRoles: ['ADMIN'],
          userRole: 'ACCOUNTANT'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for user without role', () => {
      const middleware = requireRole('ADMIN');
      delete mockReq.user.role;
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Insufficient permissions',
          statusCode: 403,
          requiredRoles: ['ADMIN'],
          userRole: undefined
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireEnterpriseAccess', () => {
    beforeEach(() => {
      mockReq.user = { id: testUser.id, role: 'ADMIN', enterpriseId: testEnterprise.id };
    });

    it('should allow access to enterprise resource', () => {
      mockReq.params.enterpriseId = testEnterprise.id;
      requireEnterpriseAccess(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow access when enterpriseId is in body', () => {
      mockReq.body.enterpriseId = testEnterprise.id;
      requireEnterpriseAccess(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access to different enterprise resource', () => {
      mockReq.params.enterpriseId = 'enterprise-789';
      requireEnterpriseAccess(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Access denied to enterprise',
          statusCode: 403
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access when no enterprise context found', () => {
      requireEnterpriseAccess(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('optionalAuth', () => {
    it('should set user when valid token provided', async () => {
      const token = testUtils.generateTestToken(testUser.id, 'ADMIN', testEnterprise.id);
      mockReq.headers.authorization = `Bearer ${token}`;

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(testUser.id);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without user when no token provided', async () => {
      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeNull();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without user when invalid token provided', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeNull();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
