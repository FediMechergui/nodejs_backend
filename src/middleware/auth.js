const jwt = require('jsonwebtoken');
const { logger } = require('../config/logger');
const { prisma } = require('../config/database');

/**
 * Authentication middleware
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access token required',
          statusCode: 401
        }
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        enterprise: {
          select: {
            id: true,
            name: true,
            taxId: true,
            country: true,
            currency: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not found',
          statusCode: 401
        }
      });
    }

    // Check if user is active
    if (!user.enterprise) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User enterprise not found',
          statusCode: 401
        }
      });
    }

    // Add user and enterprise info to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      enterpriseId: user.enterpriseId,
      enterprise: user.enterprise
    };

    logger.debug('User authenticated', {
      userId: user.id,
      username: user.username,
      role: user.role,
      enterpriseId: user.enterpriseId
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token',
          statusCode: 401
        }
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token expired',
          statusCode: 401
        }
      });
    } else {
      logger.error('Authentication error:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Authentication failed',
          statusCode: 500
        }
      });
    }
  }
}

/**
 * Role-based access control middleware
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          statusCode: 401
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Access denied - insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        endpoint: req.url,
        method: req.method
      });

      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          statusCode: 403,
          requiredRoles: roles,
          userRole: req.user.role
        }
      });
    }

    next();
  };
}

/**
 * Enterprise access control middleware
 */
function requireEnterpriseAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
        statusCode: 401
      }
    });
  }

  // Check if user has access to the requested enterprise
  const requestedEnterpriseId = req.params.enterpriseId || req.body.enterpriseId;
  
  if (requestedEnterpriseId && requestedEnterpriseId !== req.user.enterpriseId) {
    logger.warn('Access denied - enterprise mismatch', {
      userId: req.user.id,
      userEnterpriseId: req.user.enterpriseId,
      requestedEnterpriseId,
      endpoint: req.url,
      method: req.method
    });

    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied to enterprise',
        statusCode: 403
      }
    });
  }

  next();
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          enterprise: {
            select: {
              id: true,
              name: true,
              taxId: true,
              country: true,
              currency: true
            }
          }
        }
      });

      if (user && user.enterprise) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          enterpriseId: user.enterpriseId,
          enterprise: user.enterprise
        };
      }
    }
  } catch (error) {
    // Silently ignore authentication errors for optional auth
    logger.debug('Optional authentication failed:', error.message);
  }

  next();
}

module.exports = {
  authenticateToken,
  requireRole,
  requireEnterpriseAccess,
  optionalAuth
};
