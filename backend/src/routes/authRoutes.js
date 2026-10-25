const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Реєстрація нового користувача
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Користувач з таким іменем вже існує!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      password: hashedPassword
    });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ token, username: newUser.username });
  } catch (error) {
    console.error("Помилка реєстрації:", error);
    res.status(500).json({ message: 'Внутрішня помилка сервера при реєстрації' });
  }
});

// Вхід існуючого користувача
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });
    if (!user) {
      return res.status(400).json({ message: 'Неправильне ім\'я або пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неправильне ім\'я або пароль' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, username: user.username });
  } catch (error) {
    console.error("Помилка входу:", error);
    res.status(500).json({ message: 'Внутрішня помилка сервера при вході' });
  }
});

// Авторизація або реєстрація через Google
router.post('/google', async (req, res) => {
  try {
    const { email, name, avatarUrl } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Не вказано Google email' });
    }

    const cleanName = (name || email.split('@')[0]).trim().slice(0, 24);

    // Шукаємо за Google поштою або за нікнеймом
    let user = await User.findOne({
      $or: [
        { googleEmail: email.toLowerCase() },
        { username: { $regex: new RegExp(`^${cleanName}$`, 'i') } }
      ]
    });

    if (!user) {
      const randomSecret = Math.random().toString(36).slice(-10) + Date.now();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomSecret, salt);

      user = new User({
        username: cleanName.length >= 3 ? cleanName : `${cleanName}_ua`,
        password: hashedPassword,
        googleEmail: email.toLowerCase(),
        avatar: avatarUrl || 'rocket',
        customTitle: 'Google Геймер'
      });
      await user.save();
    } else if (!user.googleEmail) {
      user.googleEmail = email.toLowerCase();
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, username: user.username });
  } catch (error) {
    console.error("Помилка Google входу:", error);
    res.status(500).json({ message: 'Помилка авторизації через Google' });
  }
});

module.exports = router;