const bcrypt = require('bcryptjs');
const ShareLink = require('../models/ShareLink');
const File = require('../models/File');
const FileService = require('./fileService');
const { ApiError } = require('../middleware/errorHandler');
const { generateSecureToken } = require('../utils/helpers');

class ShareService {
  /**
   * Create a new share link with optional expiration, password, and download limit
   */
  static async createShareLink({ userId, fileId, expiration, customExpiresAt, password, maxDownloads }) {
    const file = await File.findById(fileId);
    if (!file) {
      throw ApiError.notFound('File not found');
    }

    if (file.owner.toString() !== userId.toString()) {
      throw ApiError.forbidden('You can only create share links for your own files');
    }

    // Calculate expiration date
    let expiresAt = null;
    const now = new Date();
    if (expiration === '1h') {
      expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    } else if (expiration === '1d') {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (expiration === '7d') {
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (expiration === '30d') {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (expiration === 'custom' && customExpiresAt) {
      expiresAt = new Date(customExpiresAt);
    }

    // Password protection
    let passwordHash = null;
    const passwordProtected = Boolean(password && password.trim());
    if (passwordProtected) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    const token = generateSecureToken(20);

    const shareLink = await ShareLink.create({
      file: file._id,
      owner: userId,
      token,
      expiresAt,
      passwordProtected,
      passwordHash,
      maxDownloads: maxDownloads ? parseInt(maxDownloads, 10) : null,
      isActive: true
    });

    return shareLink;
  }

  /**
   * Get all share links created by a user
   */
  static async getUserShareLinks(userId) {
    return ShareLink.find({ owner: userId })
      .populate('file', 'originalName size mimeType createdAt downloadCount')
      .sort({ createdAt: -1 });
  }

  /**
   * Get public metadata for a share link
   */
  static async getPublicShareInfo(token) {
    const link = await ShareLink.findOne({ token }).populate('file', 'originalName size mimeType createdAt');
    if (!link) {
      throw ApiError.notFound('Share link not found or has been revoked');
    }

    if (!link.isActive) {
      throw ApiError.badRequest('This share link is no longer active');
    }

    if (link.isExpired()) {
      throw ApiError.badRequest('This share link has expired');
    }

    if (link.isLimitExceeded()) {
      throw ApiError.badRequest('This share link has reached its maximum download limit');
    }

    if (!link.file) {
      throw ApiError.notFound('The shared file has been deleted by its owner');
    }

    return {
      token: link.token,
      fileName: link.file.originalName,
      fileSize: link.file.size,
      mimeType: link.file.mimeType,
      passwordProtected: link.passwordProtected,
      expiresAt: link.expiresAt,
      maxDownloads: link.maxDownloads,
      downloadCount: link.downloadCount,
      createdAt: link.createdAt
    };
  }

  /**
   * Verify password for a password-protected share link
   */
  static async verifyPassword(token, password) {
    const link = await ShareLink.findOne({ token });
    if (!link) {
      throw ApiError.notFound('Share link not found');
    }

    if (!link.passwordProtected) {
      return { verified: true };
    }

    if (!password) {
      throw ApiError.badRequest('Password is required');
    }

    const isMatch = await bcrypt.compare(password, link.passwordHash);
    if (!isMatch) {
      throw ApiError.badRequest('Incorrect password');
    }

    return { verified: true };
  }

  /**
   * Handle download through a public share link
   */
  static async downloadSharedFile({ token, password, user, ipAddress, userAgent }) {
    const link = await ShareLink.findOne({ token }).populate('file');
    if (!link) {
      throw ApiError.notFound('Share link not found or revoked');
    }

    if (link.isLimitExceeded() || (link.maxDownloads !== null && link.downloadCount >= link.maxDownloads)) {
      throw ApiError.badRequest('This share link has reached its maximum download limit');
    }

    if (!link.isActive) {
      throw ApiError.badRequest('This share link is no longer active');
    }

    if (link.isExpired()) {
      throw ApiError.badRequest('This share link has expired');
    }

    if (!link.file) {
      throw ApiError.notFound('The requested file is no longer available');
    }

    // Verify password if protected
    if (link.passwordProtected) {
      if (!password) {
        throw ApiError.unauthorized('Password required to download this file');
      }
      const isMatch = await bcrypt.compare(password, link.passwordHash);
      if (!isMatch) {
        throw ApiError.badRequest('Incorrect password for this share link');
      }
    }

    // Increment share link download count
    link.downloadCount += 1;
    if (link.maxDownloads !== null && link.downloadCount >= link.maxDownloads) {
      link.isActive = false;
    }
    await link.save();

    // Stream the decrypted file
    return FileService.getDownloadStream({
      fileId: link.file._id,
      user,
      ipAddress,
      userAgent,
      shareLinkId: link._id
    });
  }

  /**
   * Update share link status (toggle active/inactive, change limit)
   */
  static async updateShareLink(linkId, userId, updates) {
    const link = await ShareLink.findById(linkId);
    if (!link) {
      throw ApiError.notFound('Share link not found');
    }

    if (link.owner.toString() !== userId.toString()) {
      throw ApiError.forbidden('Unauthorized to modify this share link');
    }

    if (typeof updates.isActive === 'boolean') {
      link.isActive = updates.isActive;
    }

    if (updates.maxDownloads !== undefined) {
      link.maxDownloads = updates.maxDownloads ? parseInt(updates.maxDownloads, 10) : null;
    }

    await link.save();
    return link;
  }

  /**
   * Delete / Revoke share link
   */
  static async deleteShareLink(linkId, userId) {
    const link = await ShareLink.findById(linkId);
    if (!link) {
      throw ApiError.notFound('Share link not found');
    }

    if (link.owner.toString() !== userId.toString()) {
      throw ApiError.forbidden('Unauthorized to delete this share link');
    }

    await link.deleteOne();
    return { success: true, message: 'Share link revoked successfully' };
  }
}

module.exports = ShareService;
