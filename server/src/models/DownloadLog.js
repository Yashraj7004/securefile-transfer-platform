const mongoose = require('mongoose');

const downloadLogSchema = new mongoose.Schema(
  {
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: [true, 'File reference is required'],
      index: true
    },
    shareLink: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShareLink',
      default: null,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    ipAddress: {
      type: String,
      default: 'Unknown'
    },
    userAgent: {
      type: String,
      default: 'Unknown'
    },
    downloadedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

downloadLogSchema.index({ file: 1, downloadedAt: -1 });

const DownloadLog = mongoose.model('DownloadLog', downloadLogSchema);

module.exports = DownloadLog;
