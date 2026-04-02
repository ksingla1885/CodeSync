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

let isConnected = false;
const connectDB = async () => {
    if (isConnected) return;
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in environment variables! Please add it in Vercel settings.');
    }
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        isConnected = true;
        console.log('Successfully connected to MongoDB');
        
        // Auto-seed if empty (only for local dev or first run)
        const User = require('./models/User');
        const count = await User.countDocuments();
        if (count === 0) {
            console.log('Database empty, seeding...');
            const seed = require('./seed');
            await seed();
        }
    } catch (err) {
        console.error('CRITICAL ERROR: MongoDB connection failed:', err.message);
        throw err; // Re-throw to inform Vercel of the failure
    }
};

// Middleware to ensure DB connection before every request
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({ status: 'ERROR', message: 'Database connection failed', error: err.message });
    }
});

const projectRoutes = require('./routes/projectRoutes');
const authRoutes = require('./routes/authRoutes');
const { executeCode } = require('./controllers/executionController');

// Basic route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'CodeSync API is running' });
});

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/auth', authRoutes);
app.post('/api/execute', executeCode);

// Environment-specific setup (Socket.io/Yjs only for persistent servers)
if (process.env.VERCEL !== '1') {
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: ['GET', 'POST'],
        },
    });

    const { setupYjs } = require('./websocket/yjs-provider');
    setupYjs(io);

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        socket.on('join-project', (projectId) => {
            socket.join(projectId);
        });
        socket.on('send-message', ({ projectId, message, sender }) => {
            io.to(projectId).emit('receive-message', { message, sender, timestamp: new Date() });
        });
        socket.on('cursor-move', ({ projectId, position, user }) => {
            socket.to(projectId).emit('cursor-update', { position, user, id: socket.id });
        });
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`[LOCAL] Server listening on port ${PORT}`);
    });
}


module.exports = app;
