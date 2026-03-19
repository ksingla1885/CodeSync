const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  filename: { type: String, required: true },
  path: { type: String, default: '/' },
  content: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('File', fileSchema);
