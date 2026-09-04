const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');
const User = require('../models/User');
const ShareLink = require('../models/ShareLink');
const DownloadLog = require('../models/DownloadLog');
const { storageService } = require('./storageService');
const CryptoService = require('./cryptoService');
const { ApiError } = require('../middleware/errorHandler');
const { sanitizeFilename } = require('../utils/helpers');
const logger = require('../utils/logger');

class FileService {
  /**
   * Process an uploaded file from temp staging into encrypted storage
   */
  static async uploadFile({ user, uploadedFile }) {
    if (!uploadedFile) {
      throw ApiError.badRequest('No file was uploaded');
    }

    const tempFilePath = uploadedFile.path;
    const fileSize = uploadedFile.size;

    try {
      // 1. Quota Check
      const updatedUser = await User.findById(user._id);
      if (updatedUser.storageUsed + fileSize > updatedUser.storageLimit) {
        throw ApiError.badRequest(
          `Storage quota exceeded. Available: ${(
            (updatedUser.storageLimit - updatedUser.storageUsed) /
            (1024 * 1024)
          ).toFixed(1)} MB, File size: ${(fileSize / (1024 * 1024)).toFixed(1)} MB`
        );
      }

      // 2. Generate unique stored name & random IV
      const cleanOriginalName = sanitizeFilename(uploadedFile.originalname);
      const ext = path.extname(cleanOriginalName);
      const storedName = `${uuidv4()}_${Date.now()}${ext}.enc`;
      const iv = CryptoService.generateIv();

      // 3. Create read stream from temp file and encrypt on-the-fly into storage
      const tempReadStream = fs.createReadStream(tempFilePath);
      const encryptedStream = CryptoService.encryptStream(tempReadStream, iv);

      const savedInfo = await storageService.saveStream(encryptedStream, storedName);

      // 4. Save file metadata in database
      const fileDoc = await File.create({
        originalName: cleanOriginalName,
        storedName: savedInfo.storedName,
        path: savedInfo.path,
        size: fileSize,
        mimeType: uploadedFile.mimetype || 'application/octet-stream',
        owner: user._id,
        encrypted: true,
        encryptionMetadata: {
          algorithm: 'aes-256-cbc',
          iv: iv.toString('hex')
        }
      });

      // 5. Update user's storage quota
      await User.findByIdAndUpdate(user._id, {
        $inc: { storageUsed: fileSize }
      });

      return fileDoc;
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath).catch((err) => {
          logger.warn(`Failed to unlink temp file ${tempFilePath}: ${err.message}`);
        });
      }
    }
  }

  /**
   * Get paginated files with search and filters
   */
  static async getFiles({ userId, role, search, category, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 }) {
    const query = {};

    // Standard user can only view their own files
    if (role !== 'admin' || userId) {
      query.owner = userId;
    }

    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }

    if (category && category !== 'all') {
      const categoryMap = {
        documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
        archives: ['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip']
      };

      if (categoryMap[category]) {
        query.mimeType = { $in: categoryMap[category] };
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      File.find(query).populate('owner', 'name email').sort(sortOptions).skip(skip).limit(limit),
      File.countDocuments(query)
    ]);

    return {
      files,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Retrieve file metadata by ID with ownership verification
   */
  static async getFileById(fileId, user) {
    const file = await File.findById(fileId).populate('owner', 'name email');
    if (!file) {
      throw ApiError.notFound('File not found');
    }

    if (user.role !== 'admin' && file.owner._id.toString() !== user._id.toString()) {
      throw ApiError.forbidden('You do not have permission to view this file');
    }

    return file;
  }

  /**
   * Stream decrypted file for download
   */
  static async getDownloadStream({ fileId, user, ipAddress, userAgent, shareLinkId = null }) {
    const file = await File.findById(fileId);
    if (!file) {
      throw ApiError.notFound('File not found');
    }

    // Permission check if authenticated download (non-share link)
    if (!shareLinkId && user) {
      if (user.role !== 'admin' && file.owner.toString() !== user._id.toString()) {
        throw ApiError.forbidden('You do not have permission to download this file');
      }
    }

    // Ensure file is present locally (restores from Vercel Blob if needed)
    await storageService.ensureFileLocal(file.storedName);

    // Get encrypted stream from storage
    const encryptedStream = storageService.getReadStream(file.storedName);
    const iv = Buffer.from(file.encryptionMetadata.iv, 'hex');

    // Pipe through decipher stream
    const decryptedStream = CryptoService.decryptStream(encryptedStream, iv);

    // Track download in background
    file.downloadCount += 1;
    await file.save();

    await DownloadLog.create({
      file: file._id,
      shareLink: shareLinkId || null,
      user: user ? user._id : null,
      ipAddress: ipAddress || 'Unknown',
      userAgent: userAgent || 'Unknown'
    }).catch((err) => logger.warn(`DownloadLog write failed: ${err.message}`));

    return {
      stream: decryptedStream,
      file
    };
  }

  /**
   * Delete a file, release quota, and clean up share links & logs
   */
  static async deleteFile(fileId, user) {
    const file = await File.findById(fileId);
    if (!file) {
      throw ApiError.notFound('File not found');
    }

    if (user.role !== 'admin' && file.owner.toString() !== user._id.toString()) {
      throw ApiError.forbidden('You do not have permission to delete this file');
    }

    // 1. Delete encrypted physical file
    await storageService.delete(file.storedName).catch((err) => {
      logger.warn(`Storage delete failed for ${file.storedName}: ${err.message}`);
    });

    // 2. Adjust owner's storage quota
    await User.findByIdAndUpdate(file.owner, {
      $inc: { storageUsed: -file.size }
    });

    // 3. Remove associated share links
    await ShareLink.deleteMany({ file: file._id });

    // 4. Remove database record
    await file.deleteOne();

    return { success: true, message: 'File deleted successfully' };
  }
}

module.exports = FileService;
