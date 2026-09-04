const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');
const { storageService } = require('../services/storageService');
const { ApiError } = require('./errorHandler');
const { sanitizeFilename } = require('../utils/helpers');

// Multer disk storage for temporary staging before streaming encryption
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageService.getTempDir());
  },
  filename: (req, file, cb) => {
    const cleanOriginal = sanitizeFilename(file.originalname);
    const tempName = `temp_${Date.now()}_${uuidv4()}_${cleanOriginal}`;
    cb(null, tempName);
  }
});

// File filter to block dangerous executable files
const fileFilter = (req, file, cb) => {
  const dangerousExtensions = [
    '.exe',
    '.bat',
    '.cmd',
    '.sh',
    '.vbs',
    '.msi',
    '.com',
    '.scr',
    '.ps1',
    '.dll'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  if (dangerousExtensions.includes(ext)) {
    return cb(
      ApiError.badRequest(`File extension ${ext} is restricted for security reasons`),
      false
    );
  }

  cb(null, true);
};

const uploadMiddleware = multer({
  storage: tempStorage,
  limits: {
    fileSize: config.MAX_FILE_SIZE
  },
  fileFilter
});

module.exports = uploadMiddleware;
