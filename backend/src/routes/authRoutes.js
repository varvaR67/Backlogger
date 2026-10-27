const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId, username) => {
  return jwt.sign({ id: userId, username }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password || username.length < 2 || password.length < 6) {
      return res.status(400).json({ message: 'Логін від 2 символів, пароль від 6' });
    }
    
    // Перевірка існування користувача
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Користувач із таким нікнеймом вже існує' });
    }

    const newUser = new User({ username, password });
    await newUser.save(); // Тут спрацює хук із User.js і захешує пароль

    // Одразу генеруємо токен і віддаємо його на клієнт для автоматичного входу
    const token = generateToken(newUser._id, newUser.username);
    res.status(201).json({ token, username: newUser.username });
  } catch (err) {
    // Обробка помилки дублювання (на випадок, якщо findOne пропустив через race condition)
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Користувач із таким нікнеймом вже існує' });
    }
    res.status(500).json({ message: 'Помилка реєстрації на сервері' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неправильний пароль' });
    }

    const token = generateToken(user._id, user.username);
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Помилка входу на сервері' });
  }
});

module.exports = router;