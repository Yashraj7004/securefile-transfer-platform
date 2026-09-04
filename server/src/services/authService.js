const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');

class AuthService {
  /**
   * Generate JWT authentication token
   */
  static generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
  }

  /**
   * Register a new user
   */
  static async register({ name, email, password }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    // Default first registered user to admin if none exists
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role
    });

    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token
    };
  }

  /**
   * Authenticate an existing user
   */
  static async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status === 'disabled') {
      throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token
    };
  }

  /**
   * Update user profile or password
   */
  static async updateProfile(userId, { name, currentPassword, newPassword }) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (name) {
      user.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        throw ApiError.badRequest('Current password is required to set a new password');
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        throw ApiError.badRequest('Current password does not match');
      }
      user.password = newPassword;
    }

    await user.save();
    return user.toJSON();
  }
}

module.exports = AuthService;
