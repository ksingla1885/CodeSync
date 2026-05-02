const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  folder: { type: String, default: 'My Projects' }, // New field for organization
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  docState: { type: Buffer },
  createdAt: { type: Date, default: Date.now },
});
projectSchema.index({ owner: 1 });
projectSchema.index({ collaborators: 1 });

module.exports = mongoose.model('Project', projectSchema);
