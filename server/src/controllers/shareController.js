const ShareService = require('../services/shareService');

const createShareLink = async (req, res, next) => {
  try {
    const { fileId, expiration, customExpiresAt, password, maxDownloads } = req.body;

    const shareLink = await ShareService.createShareLink({
      userId: req.user._id,
      fileId,
      expiration,
      customExpiresAt,
      password,
      maxDownloads
    });

    res.status(201).json({
      success: true,
      message: 'Share link created successfully',
      data: shareLink
    });
  } catch (err) {
    next(err);
  }
};

const getUserShareLinks = async (req, res, next) => {
  try {
    const links = await ShareService.getUserShareLinks(req.user._id);
    res.status(200).json({
      success: true,
      data: links
    });
  } catch (err) {
    next(err);
  }
};

const getPublicShareInfo = async (req, res, next) => {
  try {
    const info = await ShareService.getPublicShareInfo(req.params.token);
    res.status(200).json({
      success: true,
      data: info
    });
  } catch (err) {
    next(err);
  }
};

const verifySharePassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const result = await ShareService.verifyPassword(req.params.token, password);
    res.status(200).json({
      success: true,
      message: 'Password verified successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const downloadSharedFile = async (req, res, next) => {
  try {
    const { password } = req.query;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const { stream, file } = await ShareService.downloadSharedFile({
      token: req.params.token,
      password,
      user: req.user,
      ipAddress,
      userAgent
    });

    const encodedFilename = encodeURIComponent(file.originalName).replace(/['()]/g, escape);

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName.replace(/"/g, '')}"; filename*=UTF-8''${encodedFilename}`
    );
    res.setHeader('Content-Length', file.size);

    stream.on('error', (err) => {
      if (!res.headersSent) {
        next(err);
      } else {
        res.end();
      }
    });

    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

const updateShareLink = async (req, res, next) => {
  try {
    const updated = await ShareService.updateShareLink(req.params.id, req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Share link updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

const deleteShareLink = async (req, res, next) => {
  try {
    const result = await ShareService.deleteShareLink(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createShareLink,
  getUserShareLinks,
  getPublicShareInfo,
  verifySharePassword,
  downloadSharedFile,
  updateShareLink,
  deleteShareLink
};
