const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Реєстрація нового користувача
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Шукаємо користувача суворо, але ігноруючи великі/малі літери
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

// Логін існуючого користувача
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Шукаємо юзера в базі
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Неправильне ім\'я або пароль' });
    }

    // 2. Порівнюємо введений пароль із зашифрованим
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неправильне ім\'я або пароль' });
    }

    // 3. Якщо все ок — видаємо токен
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, username: user.username });
  } catch (error) {
    console.error("Помилка логіну:", error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

module.exports = router;