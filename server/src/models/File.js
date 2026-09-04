const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true
    },
    storedName: {
      type: String,
      required: [true, 'Stored file name is required'],
      unique: true,
      index: true
    },
    path: {
      type: String,
      required: [true, 'File path is required']
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: 0
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream'
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'File owner is required'],
      index: true
    },
    encrypted: {
      type: Boolean,
      default: true
    },
    encryptionMetadata: {
      algorithm: {
        type: String,
        default: 'aes-256-cbc'
      },
      iv: {
        type: String,
        required: true
      },
      authTag: {
        type: String,
        default: null
      }
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for user search and sort queries
fileSchema.index({ owner: 1, createdAt: -1 });
fileSchema.index({ owner: 1, originalName: 1 });

const File = mongoose.model('File', fileSchema);

module.exports = File;
