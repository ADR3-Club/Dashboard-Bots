const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Role hierarchy: admin > user
const ROLE_HIERARCHY = {
  admin: 2,
  user: 1
};

/**
 * Middleware to verify JWT token
 */
function authMiddleware(req, res, next) {
  try {
    // Get token from Authorization header or query parameter (for SSE)
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else if (req.query.token) {
      token = req.query.token; // For SSE connections
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to request (including role)
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role || 'user'
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
  }
}

/**
 * Middleware to require a minimum role level
 * @param {string} requiredRole - Minimum role required ('admin', 'user')
 */
function requireRole(requiredRole) {
  return (req, res, next) => {
    const userRole = req.user?.role || 'user';
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}

/**
 * Generate JWT token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role || 'user'
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRATION || '24h'
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify token (without middleware)
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = {
  authMiddleware,
  requireRole,
  generateToken,
  verifyToken
};
