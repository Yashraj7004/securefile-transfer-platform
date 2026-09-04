const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticateUser } = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');

// All file management routes require authentication
router.use(authenticateUser);

router.post('/upload', uploadMiddleware.single('file'), fileController.uploadFile);
router.get('/', fileController.getFiles);
router.get('/:id', fileController.getFileById);
router.get('/:id/download', fileController.downloadFile);
router.delete('/:id', fileController.deleteFile);

module.exports = router;
