// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const USERNAME_COLLATION = { locale: 'en', strength: 2 };

router.post('/register', async (req, res) => {
  try {
    const username = str(req.body?.username);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (username.length < 2 || username.length > 32) {
      return res.status(400).json({ message: 'Нікнейм має містити від 2 до 32 символів' });
    }

    if (password.length < 6 || password.length > 72) {
      return res.status(400).json({ message: 'Пароль має містити від 6 до 72 символів' });
    }

    const existingUser = await User.findOne({ username }).collation(USERNAME_COLLATION);
    if (existingUser) {
      return res.status(400).json({ message: 'Цей нікнейм вже зайнятий' });
    }

    const newUser = new User({ username, password });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '30d' }
    );

    return res.status(201).json({
      token,
      username: newUser.username
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Некоректні дані реєстрації' });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Цей нікнейм вже зайнятий' });
    }
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Помилка сервера під час реєстрації' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const username = str(req.body?.username);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username || !password || password.length > 72) {
      return res.status(401).json({ message: 'Неправильний нікнейм або пароль' });
    }

    const user = await User.findOne({ username })
      .collation(USERNAME_COLLATION)
      .select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Неправильний нікнейм або пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неправильний нікнейм або пароль' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '30d' }
    );

    return res.json({
      token,
      username: user.username
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Помилка сервера під час входу' });
  }
});

module.exports = router;