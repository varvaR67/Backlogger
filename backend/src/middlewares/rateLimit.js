// backend/src/middlewares/rateLimit.js
function createRateLimiter({
  windowMs = 60 * 1000,
  max = 100,
  message = 'Забагато запитів, спробуйте трохи пізніше.',
  getKey
} = {}) {
  const hits = new Map();

  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits.entries()) {
      if (now >= entry.resetTime) {
        hits.delete(key);
      }
    }
  }, Math.max(windowMs, 30 * 1000));

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const rawKey = typeof getKey === 'function' ? getKey(req) : req.ip;
    const key = String(rawKey || req.ip || 'unknown');

    let entry = hits.get(key);
    if (!entry || now >= entry.resetTime) {
      if (hits.size >= 10000) {
        const oldestKey = hits.keys().next().value;
        if (oldestKey !== undefined) hits.delete(oldestKey);
      }
      entry = { count: 0, resetTime: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      return res.status(429).json({ message });
    }

    next();
  };
}

module.exports = { createRateLimiter };