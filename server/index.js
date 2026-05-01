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

// DB Connection
let isConnected = false;
const connectDB = async () => {
    if (isConnected) return;
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI is not defined!');
    }
    try {
        console.log('[DB] Connecting...');
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
        });
        isConnected = true;
        console.log('[DB] Connected successfully');
        
        // Auto-seed if empty
        const User = require('./models/User');
        const count = await User.countDocuments();
        if (count === 0) {
            console.log('[DB] Database empty, seeding...');
            const seed = require('./seed');
            await seed();
        }
    } catch (err) {
        console.error('[DB] CRITICAL ERROR:', err.message);
        // Don't exit process in dev, just log
    }
};

// Start connection immediately
connectDB();

// Middleware to check connection
app.use((req, res, next) => {
    if (!isConnected && req.path !== '/health') {
        return res.status(503).json({ status: 'ERROR', message: 'Database connecting, please try again in a moment.' });
    }
    next();
});

const projectRoutes = require('./routes/projectRoutes');
const authRoutes = require('./routes/authRoutes');
const { executeCode } = require('./controllers/executionController');

// Basic routes
app.get('/', (req, res) => {
  res.send('<h1>🚀 CodeSync API is live!</h1><p>The collaboration server is running. Access the frontend to start coding.</p>');
});

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
    
    // Self-healing port cleanup (Windows only)
    if (process.platform === 'win32') {
        try {
            const { execSync } = require('child_process');
            const stdout = execSync(`netstat -ano | findstr :${PORT}`).toString();
            const lines = stdout.split('\n');
            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 5) {
                    const pid = parts[parts.length - 1];
                    if (pid !== '0' && pid !== String(process.pid) && !isNaN(pid)) {
                        console.log(`[CLEANUP] Killing ghost process ${pid} on port ${PORT}...`);
                        try { execSync(`taskkill /F /PID ${pid}`); } catch (e) {}
                    }
                }
            });
        } catch (e) {}
    }

    server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            console.error(`\n❌ [PORT ERROR] Port ${PORT} is already in use.`);
            console.error(`👉 Potential solutions:`);
            console.error(`   1. Close any other terminal running this server.`);
            console.error(`   2. If using VS Code, check for hidden 'node' processes in Task Manager.`);
            console.error(`   3. Run: taskkill /F /IM node.exe (Warning: kills all Node processes)\n`);
            process.exit(1);
        }
    });

    server.listen(PORT, () => {
        console.log(`[SERVER] Listening on port ${PORT}`);
    });

    // Graceful Shutdown
    const shutdown = async () => {
        console.log('\n[SERVER] Shutting down gracefully...');
        server.close(() => {
            console.log('[SERVER] Closed network connections');
            mongoose.connection.close(false).then(() => {
                console.log('[DB] Mongoose connection closed');
                process.exit(0);
            });
        });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}


module.exports = app;
