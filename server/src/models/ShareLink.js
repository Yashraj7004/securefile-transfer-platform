const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema(
  {
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: [true, 'File reference is required'],
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner reference is required'],
      index: true
    },
    token: {
      type: String,
      required: [true, 'Share token is required'],
      unique: true,
      index: true
    },
    expiresAt: {
      type: Date,
      default: null
    },
    passwordProtected: {
      type: Boolean,
      default: false
    },
    passwordHash: {
      type: String,
      default: null
    },
    maxDownloads: {
      type: Number,
      default: null
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Method to verify share link validity
shareLinkSchema.methods.isValid = function () {
  if (!this.isActive) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  if (this.maxDownloads !== null && this.downloadCount >= this.maxDownloads) return false;
  return true;
};

// Check if link is expired specifically
shareLinkSchema.methods.isExpired = function () {
  return Boolean(this.expiresAt && new Date() > this.expiresAt);
};

// Check if download limit is exceeded specifically
shareLinkSchema.methods.isLimitExceeded = function () {
  return Boolean(this.maxDownloads !== null && this.downloadCount >= this.maxDownloads);
};

const ShareLink = mongoose.model('ShareLink', shareLinkSchema);

module.exports = ShareLink;
