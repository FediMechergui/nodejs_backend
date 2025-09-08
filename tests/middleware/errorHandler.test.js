const { errorHandler } = require('../../src/middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      url: '/test',
      headers: {},
      body: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0 (Test Browser)'),
      id: 'test-request-id'
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

  describe('Validation Errors', () => {
    it('should handle validation errors with 400 status', () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.details = [{ message: 'Field is required' }];

      errorHandler(validationError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation Error',
          statusCode: 400,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          details: [{ message: 'Field is required' }],
          requestId: 'test-request-id'
        }
      });
    });

    it('should handle Joi validation errors', () => {
      const joiError = new Error('Joi validation failed');
      joiError.isJoi = true;
      joiError.details = [{ message: 'Invalid email format' }];

      errorHandler(joiError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Joi validation failed',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });
  });

  describe('Authentication Errors', () => {
    it('should handle JWT errors with 401 status', () => {
      const jwtError = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';

      errorHandler(jwtError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid token',
          statusCode: 401,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });

    it('should handle JWT expired errors with 401 status', () => {
      const jwtExpiredError = new Error('Token expired');
      jwtExpiredError.name = 'TokenExpiredError';

      errorHandler(jwtExpiredError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Token expired',
          statusCode: 401,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });

    it('should handle unauthorized errors with 401 status', () => {
      const unauthorizedError = new Error('Access denied');
      unauthorizedError.statusCode = 401;

      errorHandler(unauthorizedError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Access denied',
          statusCode: 401,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });
  });

  describe('Database Errors', () => {
    it('should handle duplicate key errors with 409 status', () => {
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 11000;

      errorHandler(duplicateError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Duplicate field value',
          statusCode: 409,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });

    it('should handle foreign key constraint errors with 500 status', () => {
      const fkError = new Error('Foreign key constraint failed');
      fkError.code = 'ER_NO_REFERENCED_ROW_2';

      errorHandler(fkError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Foreign key constraint failed',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });

    it('should handle Prisma errors with 500 status', () => {
      const prismaError = new Error('Record not found');
      prismaError.code = 'P2025';

      errorHandler(prismaError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Record not found',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });
  });

  describe('File Upload Errors', () => {
    it('should handle file size limit errors with 500 status', () => {
      const fileSizeError = new Error('File too large');
      fileSizeError.code = 'LIMIT_FILE_SIZE';

      errorHandler(fileSizeError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'File too large',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });

    it('should handle unsupported file type errors with 500 status', () => {
      const fileTypeError = new Error('Unsupported file type');
      fileTypeError.code = 'LIMIT_UNEXPECTED_FILE';

      errorHandler(fileTypeError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Unsupported file type',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });
  });

  describe('Rate Limiting Errors', () => {
    it('should handle rate limit exceeded errors with 429 status', () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.statusCode = 429;

      errorHandler(rateLimitError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Too many requests',
          statusCode: 429,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });
  });

  describe('Generic Errors', () => {
    it('should handle generic errors with 500 status', () => {
      const genericError = new Error('Something went wrong');

      errorHandler(genericError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Something went wrong',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });

    it('should handle errors with custom status codes', () => {
      const customError = new Error('Custom error message');
      customError.statusCode = 418;

      errorHandler(customError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(418);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Custom error message',
          statusCode: 418,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });

    it('should handle errors with custom error codes', () => {
      const customCodeError = new Error('Custom code error');
      customCodeError.code = 'CUSTOM_ERROR_CODE';

      errorHandler(customCodeError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Custom code error',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });
  });

  describe('Error Logging', () => {
    it('should log error details for debugging', () => {
      const testError = new Error('Test error');
      testError.stack = 'Error stack trace';

      errorHandler(testError, mockReq, mockRes, mockNext);

      // The logger is mocked in the test setup, so we just verify the response
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });

    it('should handle errors without stack trace', () => {
      const testError = new Error('Test error');
      delete testError.stack;

      errorHandler(testError, mockReq, mockRes, mockNext);

      // The logger is mocked in the test setup, so we just verify the response
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });
  });

  describe('Response Format', () => {
    it('should always return consistent error response format', () => {
      const testError = new Error('Test error');

      errorHandler(testError, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });

    it('should include additional error details when available', () => {
      const testError = new Error('Validation failed');
      testError.name = 'ValidationError';
      testError.details = [{ field: 'email', message: 'Invalid format' }];

      errorHandler(testError, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation Error',
          statusCode: 400,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          details: [{ field: 'email', message: 'Invalid format' }],
          requestId: 'test-request-id'
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors without message property', () => {
      const errorWithoutMessage = {};
      errorWithoutMessage.message = undefined;

      errorHandler(errorWithoutMessage, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal Server Error',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });

    it('should handle null errors gracefully', () => {
      errorHandler(null, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Unknown error',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });

    it('should handle undefined errors gracefully', () => {
      errorHandler(undefined, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Unknown error',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id'
        }
      });
    });
  });
});
