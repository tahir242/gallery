const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  relativePath: { type: String, required: true },
  directory: { type: String, required: true },
  type: { type: String, enum: ['image', 'video', 'audio'], required: true },
  ext: { type: String, required: true },
  size: { type: Number, default: 0 },
  modifiedAt: { type: Date },
});

const scanSessionSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    label: { type: String, default: '' },
    fileCount: { type: Number, default: 0 },
    folderCount: { type: Number, default: 0 },
    files: [fileSchema],
    status: {
      type: String,
      enum: ['scanning', 'complete', 'error'],
      default: 'scanning',
    },
    error: { type: String, default: null },
  },
  { timestamps: true }
);

// Index for fast search by path
scanSessionSchema.index({ path: 1, createdAt: -1 });
scanSessionSchema.index({ 'files.name': 'text' });

module.exports = mongoose.model('ScanSession', scanSessionSchema);
