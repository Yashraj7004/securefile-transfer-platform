const { body, validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => `${err.path}: ${err.msg}`);
    return next(ApiError.badRequest(errorMessages[0], errorMessages));
  }
  next();
};

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  validate
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const createShareValidation = [
  body('fileId').isMongoId().withMessage('Valid file ID is required'),
  body('password')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage('Share password must be at least 4 characters long'),
  body('maxDownloads')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 10000 })
    .withMessage('Max downloads must be a positive number'),
  body('expiration')
    .optional()
    .isIn(['1h', '1d', '7d', '30d', 'never', 'custom'])
    .withMessage('Invalid expiration preset'),
  body('customExpiresAt')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Custom expiration must be a valid date'),
  validate
];

module.exports = {
  registerValidation,
  loginValidation,
  createShareValidation
};
