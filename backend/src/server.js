// backend/src/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const Item = require('./models/Item');
const { createRateLimiter } = require('./middlewares/rateLimit');
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');

if ((process.env.JWT_SECRET || '').length < 32) {
  throw new Error('Слабкий JWT_SECRET: мінімальна довжина ключа має становити 32 символи');
}

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', Number(process.env.TRUST_PROXY || 0));

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      const corsErr = new Error('Not allowed by CORS');
      corsErr.isCors = true;
      return callback(corsErr);
    },
    credentials: true
  })
);

app.use(express.json({ limit: '100kb' }));

const globalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Забагато запитів з вашої адреси, зачекайте хвилину.'
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Забагато спроб входу або реєстрації, спробуйте пізніше.'
});

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/items', itemRoutes);

app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Невалідний JSON' });
  }
  if (err?.isCors || err?.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Доступ заборонено політикою CORS' });
  }
  console.error('Unhandled server error:', err);
  return res.status(500).json({ message: 'Помилка сервера' });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB успішно підключено');
    await Promise.all([User.syncIndexes(), Item.syncIndexes()]);
    app.listen(PORT, () => {
      console.log(`Сервер запущено на порту ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Критична помилка підключення до MongoDB:', err);
    process.exit(1);
  });