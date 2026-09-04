const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const { authenticateUser, optionalAuth } = require('../middleware/auth');
const { createShareValidation } = require('../middleware/validators');
const { shareVerifyLimiter } = require('../middleware/rateLimiter');

// Public share endpoints
router.get('/:token/download', optionalAuth, shareController.downloadSharedFile);
router.post('/:token/verify', shareVerifyLimiter, shareController.verifySharePassword);
router.get('/:token', shareController.getPublicShareInfo);

// Protected endpoints for managing shares
router.post('/', authenticateUser, createShareValidation, shareController.createShareLink);
router.get('/', authenticateUser, shareController.getUserShareLinks);
router.patch('/:id', authenticateUser, shareController.updateShareLink);
router.delete('/:id', authenticateUser, shareController.deleteShareLink);

module.exports = router;
