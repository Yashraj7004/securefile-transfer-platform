const User = require('../models/User');
const File = require('../models/File');
const DownloadLog = require('../models/DownloadLog');
const ShareLink = require('../models/ShareLink');
const FileService = require('../services/fileService');
const { ApiError } = require('../middleware/errorHandler');

const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) query.role = role;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['active', 'disabled'].includes(status)) {
      throw ApiError.badRequest('Status must be either "active" or "disabled"');
    }

    // Prevent admin from disabling their own account
    if (id === req.user._id.toString()) {
      throw ApiError.badRequest('You cannot disable your own administrator account');
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    res.status(200).json({
      success: true,
      message: `User status changed to ${status}`,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!['user', 'admin'].includes(role)) {
      throw ApiError.badRequest('Role must be either "user" or "admin"');
    }

    if (id === req.user._id.toString() && role !== 'admin') {
      throw ApiError.badRequest('You cannot revoke your own administrator role');
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

const getAllFiles = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      File.find(query)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      File.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        files,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

const deleteAdminFile = async (req, res, next) => {
  try {
    const result = await FileService.deleteFile(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: 'File removed by administrator'
    });
  } catch (err) {
    next(err);
  }
};

const getSystemStats = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, totalFiles, storageAgg, totalDownloads, activeShares] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: 'active' }),
        File.countDocuments(),
        File.aggregate([{ $group: { _id: null, totalStorage: { $sum: '$size' } } }]),
        DownloadLog.countDocuments(),
        ShareLink.countDocuments({ isActive: true })
      ]);

    const totalStorageUsed = storageAgg[0] ? storageAgg[0].totalStorage : 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalFiles,
        totalStorageUsed,
        totalDownloads,
        activeShares
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getAllFiles,
  deleteAdminFile,
  getSystemStats
};
