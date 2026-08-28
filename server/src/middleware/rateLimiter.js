const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter — applied globally to /api/* in index.js.
 * Acts as a backstop for any route not covered by a more specific limiter.
 * 300 req / 1 min is generous for local use but still closes the CodeQL sink.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: 300,
  standardHeaders: true,    // Return rate-limit headers (RateLimit-*)
  legacyHeaders: false,     // Disable the deprecated X-RateLimit-* headers
  message: { error: 'Too many requests, please try again later.' },
});

/**
 * Scan / write limiter — applied to expensive mutating endpoints:
 *   POST /api/directory/scan
 *   PUT  /api/directory/scan/:id/extensions
 *   DELETE /api/directory/history
 * These trigger recursive directory walks and heavy DB writes.
 * 30 req / 1 min is more than enough for normal interactive use.
 */
const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many scan requests, please wait before retrying.' },
});

/**
 * Edit limiter — applied to POST /api/media/edit.
 * Each request invokes sharp image processing (CPU/memory intensive).
 * 20 req / 1 min prevents runaway processing loops.
 */
const editLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many edit requests, please wait before retrying.' },
});

module.exports = { apiLimiter, scanLimiter, editLimiter };
