const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

// All admin routes require authentication and 'admin' role
router.use(authenticateUser);
router.use(authorizeRoles('admin'));

router.get('/stats', adminController.getSystemStats);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);
router.get('/files', adminController.getAllFiles);
router.delete('/files/:id', adminController.deleteAdminFile);

module.exports = router;
