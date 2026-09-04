const crypto = require('crypto');
const config = require('../config/env');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // 16 bytes for AES-256-CBC

class CryptoService {
  /**
   * Generate a secure random Initialization Vector (16 bytes)
   */
  static generateIv() {
    return crypto.randomBytes(IV_LENGTH);
  }

  /**
   * Create an encryption cipher stream using AES-256-CBC
   * @param {Buffer} [key] 32-byte encryption key
   * @param {Buffer} iv 16-byte initialization vector
   */
  static createEncryptCipher(key = config.FILE_ENCRYPTION_KEY, iv) {
    if (!iv) {
      throw new Error('IV is required for encryption');
    }
    return crypto.createCipheriv(ALGORITHM, key, iv);
  }

  /**
   * Create a decryption decipher stream using AES-256-CBC
   * @param {Buffer} [key] 32-byte encryption key
   * @param {Buffer} iv 16-byte initialization vector
   */
  static createDecryptDecipher(key = config.FILE_ENCRYPTION_KEY, iv) {
    if (!iv) {
      throw new Error('IV is required for decryption');
    }
    return crypto.createDecipheriv(ALGORITHM, key, iv);
  }

  /**
   * Convenience helper to encrypt a readable stream into a transformed readable stream
   */
  static encryptStream(inputStream, iv, key = config.FILE_ENCRYPTION_KEY) {
    const cipher = CryptoService.createEncryptCipher(key, iv);
    return inputStream.pipe(cipher);
  }

  /**
   * Convenience helper to decrypt an encrypted readable stream into plaintext
   */
  static decryptStream(encryptedStream, iv, key = config.FILE_ENCRYPTION_KEY) {
    const decipher = CryptoService.createDecryptDecipher(key, iv);
    return encryptedStream.pipe(decipher);
  }
}

module.exports = CryptoService;
