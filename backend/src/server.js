const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const itemRoutes = require('./routes/itemRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Підключаємо маршрути для нашого беклогу
app.use('/api/items', itemRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 Server is running on \x1b[32m\x1b[4mhttp://localhost:${PORT}/api/items\x1b[0m`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });