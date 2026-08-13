require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const directoryRoutes = require('./routes/directory');
const mediaRoutes = require('./routes/media');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/directory', directoryRoutes);
app.use('/api/media', mediaRoutes);

// Health check
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// Serve static files in production or packaged environments
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  
  // SPA Fallback
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 handler
app.use((req, res) =>
  res.status(404).json({ error: `Route ${req.originalUrl} not found` })
);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
let serverInstance = null;

const startServer = (port = PORT) => {
  return new Promise((resolve, reject) => {
    try {
      serverInstance = app.listen(port, () => {
        console.log(`🚀 Gallery Server (stateless) running on http://localhost:${port}`);
        resolve(serverInstance);
      });
    } catch (err) {
      reject(err);
    }
  });
};

const stopServer = () => {
  if (serverInstance) {
    serverInstance.close();
  }
};

// If run directly (not imported as a module by Electron)
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, stopServer };
