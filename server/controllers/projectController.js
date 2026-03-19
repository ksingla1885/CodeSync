const Project = require('../models/Project');
const User = require('../models/User');
const File = require('../models/File');
const Message = require('../models/Message');

const mongoose = require('mongoose');

// Get all projects for a user, grouped by folder
exports.getProjects = async (req, res) => {
  try {
    const { userId } = req.query; // Mock auth
    if (!userId || userId === 'undefined') return res.status(401).json({ error: 'Unauthorized' });

    // FALLBACK: If MongoDB is not connected, return mock data to prevent UI errors
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ MongoDB not connected. Returning MOCK data.');
      return res.json([
        { _id: 'mock3', name: 'UI Library', folder: 'Web Development', createdAt: new Date(), collaborators: [] },
        { _id: 'mock2', name: 'Auth Service', folder: 'Backend Core', createdAt: new Date(), collaborators: [] },
        { _id: 'mock1', name: 'Portfolio Website', folder: 'Web Development', createdAt: new Date(), collaborators: [{ name: 'Rahul' }] },
      ]);
    }

    const projects = await Project.find({
      $or: [{ owner: userId }, { collaborators: userId }]
    })
    .sort({ createdAt: -1 })
    .populate('owner collaborators', 'name email');

    console.log(`Fetching projects for user ${userId}:`, projects);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single project details
exports.getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId)
      .populate('owner collaborators', 'name email');
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const { name, folder, userId } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const project = new Project({
      name,
      folder: folder || 'My Projects',
      owner: userId
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a collaborator to a project with verification code
exports.addCollaborator = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ error: 'User not found. Please send a code first.' });

    // Verify the code
    if (userToAdd.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > userToAdd.verificationCodeExpires) {
      return res.status(400).json({ error: 'Verification code expired' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.collaborators.includes(userToAdd._id)) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }

    // Success! Clear code and add user
    userToAdd.verificationCode = undefined;
    userToAdd.verificationCodeExpires = undefined;
    await userToAdd.save();

    project.collaborators.push(userToAdd._id);
    await project.save();

    res.json({ message: 'Collaborator added successfully!', project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove a collaborator from a project
exports.removeCollaborator = async (req, res) => {
  try {
    const { projectId, collaboratorId } = req.params;
    const { userId } = req.query; // Requester ID

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // ONLY OWNER can remove collaborators
    if (project.owner.toString() !== userId) {
      return res.status(403).json({ error: 'Only the project owner can remove collaborators' });
    }

    project.collaborators = project.collaborators.filter(c => c.toString() !== collaboratorId);
    await project.save();

    res.json({ message: 'Collaborator removed successfully', project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, folder } = req.body;
    const project = await Project.findByIdAndUpdate(projectId, { name, folder }, { new: true });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // 1. Delete associated Files
    await File.deleteMany({ projectId });
    
    // 2. Delete associated Messages
    await Message.deleteMany({ projectId });
    
    // 3. Delete Project itself
    const project = await Project.findByIdAndDelete(projectId);
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    res.json({ message: 'Project and all related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.clearProjects = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Find all projects owned by the user
    const projects = await Project.find({ owner: userId });
    const projectIds = projects.map(p => p._id);

    // Delete all files and messages for these projects
    await File.deleteMany({ projectId: { $in: projectIds } });
    await Message.deleteMany({ projectId: { $in: projectIds } });

    // Delete the projects
    const result = await Project.deleteMany({ owner: userId });

    res.json({ message: `Deleted ${result.deletedCount} projects and all associated data` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
