const crypto = require('crypto');
const path = require('path');

/**
 * Sanitize filename to prevent directory traversal and illegal characters
 */
const sanitizeFilename = (filename) => {
  if (!filename) return 'unnamed_file';
  // Remove null bytes, path traversal tokens (../ or ..\)
  const basename = path.basename(filename);
  return basename.replace(/[/\\?%*:|"<>]/g, '_').trim();
};

/**
 * Generate a cryptographically secure random token (hex string)
 */
const generateSecureToken = (bytes = 24) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Format bytes into human-readable string (KB, MB, GB)
 */
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

module.exports = {
  sanitizeFilename,
  generateSecureToken,
  formatBytes
};
