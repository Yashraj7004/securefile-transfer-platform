const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rawKey = process.env.FILE_ENCRYPTION_KEY || 'default_secret_encryption_key_32b!';
// Ensure encryption key is exactly 32 bytes for AES-256
let encryptionKey = Buffer.from(rawKey, 'utf8');
if (encryptionKey.length !== 32) {
  encryptionKey = crypto.createHash('sha256').update(rawKey).digest();
}

const os = require('os');

const defaultUploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'storage')
  : path.resolve(__dirname, '../../', process.env.UPLOAD_DIR || './storage');

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/securefile_db',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret_change_in_production_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FILE_ENCRYPTION_KEY: encryptionKey,
  UPLOAD_DIR: defaultUploadDir,
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 524288000, // 500 MB default
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
