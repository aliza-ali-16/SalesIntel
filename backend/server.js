require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB } = require('./config/db');
const { startScheduler } = require('./services/scheduler');
const { validateEnv, apiLimiter, errorHandler } = require('./middleware/security');
const { initSocket } = require('./services/socketService');

// Validate environment parameters before booting
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

// Wrap Express with HTTP Server for WebSocket capability
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    credentials: true
  }
});

// Initialize real-time Socket service
initSocket(io);

// Apply API Gateway Rate Limiting to all routes
app.use('/api/', apiLimiter);

// Initialize Database connection
connectDB().then(() => {
  // Start background scheduler after DB is initialized
  startScheduler();
});

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for local dev environment
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/crm', require('./routes/crm'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/mcp', require('./routes/mcp'));

// Root endpoint status check
app.get('/api/status', (req, res) => {
  const { isFallback } = require('./config/db');
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: isFallback() ? 'JSON_Fallback_Database' : 'MongoDB_Connected',
    agents: process.env.USE_EMBEDDED_AGENTS === 'true' || process.env.USE_EMBEDDED_AGENTS === 'only_json' ? 'Embedded_Node_Engine' : 'FastAPI_Microservice'
  });
});

// Production error handling middleware
app.use(errorHandler);

// Start HTTP Server
server.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
});

