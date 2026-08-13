require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

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
app.listen(PORT, () => {
  console.log(`🚀 Gallery Server (stateless) running on http://localhost:${PORT}`);
});

module.exports = app;
