const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    // Connected to MongoDB
    // Auto-seed if empty
    const User = require('./models/User');
    const count = await User.countDocuments();
    if (count === 0) {
      // Seeding...
      const seed = require('./seed');
      await seed();
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const { setupYjs } = require('./websocket/yjs-provider');
const { executeCode } = require('./controllers/executionController');
const projectRoutes = require('./routes/projectRoutes');
const authRoutes = require('./routes/authRoutes');

setupYjs(io);

// Basic route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Collaboration server is running' });
});

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/auth', authRoutes);
app.post('/api/execute', executeCode);


// Socket.IO for real-time features
io.on('connection', (socket) => {
  // User connected

  // Join a specific project room
  socket.on('join-project', (projectId) => {
    socket.join(projectId);
    // Joined project
  });

  // Handle chat messages
  socket.on('send-message', ({ projectId, message, sender }) => {
    io.to(projectId).emit('receive-message', { message, sender, timestamp: new Date() });
  });

  // Handle cursor movement
  socket.on('cursor-move', ({ projectId, position, user }) => {
    socket.to(projectId).emit('cursor-update', { position, user, id: socket.id });
  });

  socket.on('disconnect', () => {
    // User disconnected
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  // Server started
});
