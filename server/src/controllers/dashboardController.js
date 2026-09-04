const File = require('../models/File');
const ShareLink = require('../models/ShareLink');
const DownloadLog = require('../models/DownloadLog');
const User = require('../models/User');

const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [userDoc, totalFiles, activeShares, downloadAgg] = await Promise.all([
      User.findById(userId).select('storageUsed storageLimit'),
      File.countDocuments({ owner: userId }),
      ShareLink.countDocuments({ owner: userId, isActive: true }),
      File.aggregate([
        { $match: { owner: userId } },
        { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } }
      ])
    ]);

    const totalDownloads = downloadAgg[0] ? downloadAgg[0].totalDownloads : 0;

    res.status(200).json({
      success: true,
      data: {
        totalFiles,
        storageUsed: userDoc.storageUsed || 0,
        storageLimit: userDoc.storageLimit || 5368709120,
        totalDownloads,
        activeShares
      }
    });
  } catch (err) {
    next(err);
  }
};

const getActivity = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Recent uploads
    const recentUploads = await File.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get user's file IDs
    const userFiles = await File.find({ owner: userId }).select('_id');
    const fileIds = userFiles.map((f) => f._id);

    // Recent download logs for user's files
    const recentDownloads = await DownloadLog.find({ file: { $in: fileIds } })
      .populate('file', 'originalName size mimeType')
      .populate('user', 'name email')
      .sort({ downloadedAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        recentUploads,
        recentDownloads
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  getActivity
};
