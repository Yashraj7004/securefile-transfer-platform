const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Storage Interface Specification:
 * - saveStream(stream, filename): Promise<{ storedName, size, path }>
 * - getReadStream(filename): fs.ReadStream
 * - delete(filename): Promise<boolean>
 * - exists(filename): Promise<boolean>
 */

class LocalStorageService {
  constructor(baseDir) {
    this.baseDir = baseDir || config.UPLOAD_DIR;
    this.encryptedDir = path.join(this.baseDir, 'encrypted');
    this.tempDir = path.join(this.baseDir, 'temp');

    this.initDirectories();
  }

  initDirectories() {
    [this.baseDir, this.encryptedDir, this.tempDir].forEach((dir) => {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          logger.info(`Storage directory initialized: ${dir}`);
        }
      } catch (err) {
        logger.warn(`Could not create storage directory ${dir}: ${err.message}`);
      }
    });
  }

  /**
   * Save a readable stream into local encrypted storage
   */
  async saveStream(readStream, filename) {
    const targetPath = path.join(this.encryptedDir, filename);

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(targetPath);
      let bytesWritten = 0;

      readStream.on('data', (chunk) => {
        bytesWritten += chunk.length;
      });

      readStream.on('error', (err) => {
        writeStream.destroy();
        reject(err);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });

      writeStream.on('finish', async () => {
        // Sync encrypted file to Vercel Blob if configured
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          try {
            const vercelBlob = require('@vercel/blob');
            await vercelBlob.put(`encrypted/${filename}`, fs.readFileSync(targetPath), {
              access: 'private',
              addRandomSuffix: false,
              allowOverwrite: true
            });
          } catch (e) {
            logger.warn(`Vercel Blob upload note: ${e.message}`);
          }
        }

        resolve({
          storedName: filename,
          path: path.relative(config.UPLOAD_DIR, targetPath).replace(/\\/g, '/'),
          size: bytesWritten
        });
      });

      readStream.pipe(writeStream);
    });
  }

  /**
   * Ensure file is present locally (fetches from Vercel Blob if missing in ephemeral container)
   */
  async ensureFileLocal(filename) {
    const filePath = path.join(this.encryptedDir, filename);
    if (fs.existsSync(filePath)) return filePath;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const vercelBlob = require('@vercel/blob');
        const { blobs } = await vercelBlob.list({ prefix: `encrypted/${filename}` });
        if (blobs && blobs.length > 0) {
          const res = await vercelBlob.get(blobs[0].url, { access: 'private' });
          if (res && res.stream) {
            const chunks = [];
            for await (const chunk of res.stream) chunks.push(chunk);
            fs.writeFileSync(filePath, Buffer.concat(chunks));
            return filePath;
          }
        }
      } catch (err) {
        logger.warn(`Failed to restore ${filename} from Vercel Blob: ${err.message}`);
      }
    }
    return filePath;
  }

  /**
   * Get a readable stream for a stored encrypted file
   */
  getReadStream(filename) {
    const filePath = path.join(this.encryptedDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filename} does not exist in storage`);
    }
    return fs.createReadStream(filePath);
  }

  /**
   * Delete a stored file
   */
  async delete(filename) {
    const filePath = path.join(this.encryptedDir, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }

  /**
   * Check if file exists in storage
   */
  async exists(filename) {
    const filePath = path.join(this.encryptedDir, filename);
    return fs.existsSync(filePath);
  }

  getEncryptedDir() {
    return this.encryptedDir;
  }

  getTempDir() {
    return this.tempDir;
  }
}

// Export singleton instance of storage service
const storageService = new LocalStorageService();

module.exports = {
  LocalStorageService,
  storageService
};
