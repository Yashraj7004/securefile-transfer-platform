const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const { ApiError } = require('./errorHandler');

const fallbackStore = require('../services/fallbackStore');

/**
 * Middleware to authenticate requests using JWT Bearer token
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Authentication token is missing'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(ApiError.unauthorized('Authentication token is empty'));
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    let user = await User.findById(decoded.id);

    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email.toLowerCase() });
    }

    // If container hasn't synced this user from cloud yet, force cloud sync
    if (!user && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await fallbackStore.syncFromCloud(true);
        user =
          (await User.findById(decoded.id)) ||
          (await User.findOne({ email: decoded.email.toLowerCase() }));
      } catch (e) {
        // Fallback to trusted JWT payload below
      }
    }

    // Resilient fallback: If token signature is cryptographically valid and unexpired,
    // construct session directly from trusted JWT payload so user is never rejected on ephemeral containers
    if (!user && decoded.id && decoded.email) {
      user = fallbackStore.wrapUser({
        _id: decoded.id,
        name: decoded.name || decoded.email.split('@')[0],
        email: decoded.email.toLowerCase(),
        role: decoded.role || 'user',
        status: 'active',
        storageUsed: 0,
        storageLimit: 5368709120
      });
      const exists = fallbackStore.data.users.some(
        (u) => u && (u._id || '').toString() === decoded.id.toString()
      );
      if (!exists) {
        fallbackStore.data.users.push(user);
      }
    }

    if (!user) {
      return next(ApiError.unauthorized('User associated with token no longer exists'));
    }

    if (user.status === 'disabled') {
      return next(ApiError.forbidden('Your account has been deactivated. Please contact support.'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware for Role-Based Access Control (RBAC)
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Access denied: Requires ${roles.join(' or ')} privilege`));
    }

    next();
  };
};

/**
 * Optional authentication: attaches user if valid token present, otherwise req.user is null
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user && user.status !== 'disabled') {
          req.user = user;
        }
      }
    }
  } catch (err) {
    // Ignore errors for optional authentication
  }
  next();
};

module.exports = {
  authenticateUser,
  authorizeRoles,
  optionalAuth
};
