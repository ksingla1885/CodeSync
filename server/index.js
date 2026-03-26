const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const mongoose = require('mongoose');

const app = express();
// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173', // Vite default
  'http://localhost:5000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1 && process.env.CLIENT_URL !== '*') {
      return callback(new Error('CORS Policy: This origin is not allowed'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
app.use(express.json());

// Database Connection
if (!process.env.MONGODB_URI) {
  console.error('CRITICAL ERROR: MONGODB_URI is not defined in environment variables!');
} else {
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of hanging
  })
    .then(async () => {
      console.log('Successfully connected to MongoDB');
      // Auto-seed if empty
      const User = require('./models/User');
      const count = await User.countDocuments();
      if (count === 0) {
        console.log('Database empty, seeding...');
        const seed = require('./seed');
        await seed();
      }
    })
    .catch(err => {
      console.error('CRITICAL ERROR: MongoDB connection failed:', err.message);
    });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
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
  console.log(`User connected: ${socket.id}`);

  // Join a specific project room
  socket.on('join-project', (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project: ${projectId}`);
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
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[V1.1] Server listening on port ${PORT}`);
});
