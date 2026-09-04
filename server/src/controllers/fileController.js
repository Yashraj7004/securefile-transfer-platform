const FileService = require('../services/fileService');

const uploadFile = async (req, res, next) => {
  try {
    const fileDoc = await FileService.uploadFile({
      user: req.user,
      uploadedFile: req.file
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded and encrypted successfully',
      data: fileDoc
    });
  } catch (err) {
    next(err);
  }
};

const getFiles = async (req, res, next) => {
  try {
    const { search, category, sortBy, sortOrder, page, limit } = req.query;

    const result = await FileService.getFiles({
      userId: req.user.role === 'admin' && req.query.all === 'true' ? null : req.user._id,
      role: req.user.role,
      search,
      category,
      sortBy,
      sortOrder,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const getFileById = async (req, res, next) => {
  try {
    const file = await FileService.getFileById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: file
    });
  } catch (err) {
    next(err);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const { stream, file } = await FileService.getDownloadStream({
      fileId: req.params.id,
      user: req.user,
      ipAddress,
      userAgent
    });

    // Encode filename for Content-Disposition header (RFC 5987 compatible)
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

const deleteFile = async (req, res, next) => {
  try {
    const result = await FileService.deleteFile(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadFile,
  getFiles,
  getFileById,
  downloadFile,
  deleteFile
};
