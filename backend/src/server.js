require('dotenv').config();
const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Використовуємо публічні DNS лише локально за потреби, не ламаючи маршрутизацію в хмарі
if (process.env.USE_CUSTOM_DNS === 'true') {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');

const app = express();

// Дозволяємо запити лише з вказаного клієнтського домену та локальних портів розробки
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Доступ заблоковано політикою CORS'));
  },
  credentials: true
}));

// Обмежуємо розмір тіла запиту до 1 мегабайта для захисту пам'яті сервера
app.use(express.json({ limit: '1mb' }));

// Вбудований Rate Limiter для захисту від DDoS та брутфорсу паролів
const createRateLimiter = (windowMs, maxRequests, message) => {
  const requests = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests.entries()) {
      if (now - data.startTime > windowMs) {
        requests.delete(ip);
      }
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = requests.get(ip);

    if (!record || now - record.startTime > windowMs) {
      requests.set(ip, { count: 1, startTime: now });
      return next();
    }

    record.count += 1;
    if (record.count > maxRequests) {
      return res.status(429).json({ message });
    }

    next();
  };
};

const authLimiter = createRateLimiter(15 * 60 * 1000, 30, 'Забагато спроб входу. Спробуй пізніше через 15 хвилин.');
const apiLimiter = createRateLimiter(60 * 1000, 120, 'Забагато запитів до сервера. Зачекай хвилину.');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/items', apiLimiter, itemRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Підключено до MongoDB');
    app.listen(PORT, () => {
      console.log(`Сервер успішно запущено на порту ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Помилка підключення до бази даних:', err.message);
  });