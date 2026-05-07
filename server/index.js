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
    process.env.NEXT_PUBLIC_CLIENT_URL,
    process.env.NEXT_PUBLIC_SERVER_URL,
    'https://code-sync-chi-gold.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5000'
].filter(Boolean).map(url => url.replace(/\/$/, ''));

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const normalizedOrigin = origin.replace(/\/$/, '');
        const isAllowed = allowedOrigins.includes(normalizedOrigin) || 
                         process.env.CLIENT_URL === '*' ||
                         normalizedOrigin.endsWith('.vercel.app'); // Allow all Vercel deployments
        
        if (!isAllowed) {
            console.warn(`⚠️ CORS blocked for origin: ${origin}`);
            return callback(null, false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
app.use(express.json());

// DB Connection
let isConnected = false;
let dbPromise = null;

const connectDB = async () => {
    if (isConnected) return;
    if (dbPromise) return dbPromise;

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI is not defined! Please add it to your environment variables.');
        return;
    }

    dbPromise = mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
    }).then(() => {
        isConnected = true;
        console.log('✅ Connected to MongoDB');
        dbPromise = null; // Clear promise once connected
    }).catch(err => {
        console.error('[DB] CRITICAL ERROR:', err.message);
        dbPromise = null; // Clear promise on failure so we can retry
        throw err;
    });

    return dbPromise;
};

// Start connection immediately
connectDB().catch(err => console.error('[DB] Initial connection failed:', err));

// Basic routes
app.get('/', (req, res) => {
    res.send('<h1>🚀 CodeSync API is live!</h1><p>The collaboration server is running. Access the frontend to start coding.</p>');
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'CodeSync API is running', dbConnected: isConnected });
});

// Middleware to check/ensure connection (only for API routes)
app.use('/api', async (req, res, next) => {
    try {
        await connectDB();
        if (!isConnected) {
            return res.status(503).json({ 
                status: 'ERROR', 
                message: 'Database is currently unavailable. Please try again in a moment.' 
            });
        }
        next();
    } catch (err) {
        console.error('[MIDDLEWARE] DB Check failed:', err.message);
        res.status(503).json({ status: 'ERROR', message: 'Service Temporarily Unavailable' });
    }
});

const projectRoutes = require('./routes/projectRoutes');
const authRoutes = require('./routes/authRoutes');
const { executeCode } = require('./controllers/executionController');

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/auth', authRoutes);
app.post('/api/execute', executeCode);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('💥 Unhandled Error:', err.stack);
    res.status(500).json({
        status: 'ERROR',
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Environment-specific setup (Socket.io/Yjs only for persistent servers)
if (process.env.VERCEL !== '1') {
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        connectTimeout: 60000,
        maxHttpBufferSize: 1e8, // 100MB
        transports: ['websocket', 'polling']
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
                        try { execSync(`taskkill /F /PID ${pid}`); } catch (e) { }
                    }
                }
            });
        } catch (e) { }
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
