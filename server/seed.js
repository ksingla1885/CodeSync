const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const File = require('./models/File');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for seeding...');

  // Clear existing
  await User.deleteMany({});
  await Project.deleteMany({});
  await File.deleteMany({});

  // 1. Create Users
  const ketan = await User.create({
    _id: '65f1a2b3c4d5e6f7a8b9c0d1',
    name: 'Ketan',
    email: 'ketan@codesync.io',
    password: 'password123'
  });

  const rahul = await User.create({
    _id: '65f1a2b3c4d5e6f7a8b9c0d2',
    name: 'Rahul',
    email: 'rahul@codesync.io',
    password: 'password123'
  });

  console.log('Users seeded.');

  // 2. Create Projects in Folders
  const projects = [
    { name: 'Portfolio Website', folder: 'Web Development', owner: ketan._id, collaborators: [rahul._id] },
    { name: 'Auth Service', folder: 'Backend Core', owner: ketan._id, collaborators: [] },
    { name: 'UI Library', folder: 'Web Development', owner: ketan._id, collaborators: [] },
    { name: 'Data Scraper', folder: 'Python Scripts', owner: rahul._id, collaborators: [ketan._id] },
  ];

  await Project.insertMany(projects);
  console.log('Projects seeded.');

    }
  
  module.exports = seed;

if (require.main === module) {
  seed().catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  }).then(() => process.exit(0));
}
