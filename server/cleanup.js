const mongoose = require('mongoose');
const Project = require('./models/Project');
const File = require('./models/File');
const Message = require('./models/Message');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanup() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for cleaning up...');

  // Delete all projects, files, and messages
  const projectsCount = await Project.deleteMany({});
  const filesCount = await File.deleteMany({});
  const messagesCount = await Message.deleteMany({});

  console.log(`Deleted ${projectsCount.deletedCount} projects.`);
  console.log(`Deleted ${filesCount.deletedCount} files.`);
  console.log(`Deleted ${messagesCount.deletedCount} messages.`);

  console.log('Dashboard should now be empty.');
  mongoose.connection.close();
}

cleanup().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
}).then(() => process.exit(0));
