const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const axios = require('axios');
const auth = require('../middlewares/auth'); // Ось тут додаємо букву "s"
// 1. Живий пошук для випадаючого списку (Spotlight style)
router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  try {
    if (!process.env.RAWG_API_KEY) {
      return res.status(500).json({ message: "Ключ RAWG не знайдено" });
    }

    const response = await axios.get(`https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=5`);
    
    const results = response.data.results.map(game => ({
      rawgId: game.id,
      title: game.name,
      imageUrl: game.background_image || '',
      releaseYear: game.released ? parseInt(game.released.substring(0, 4)) : null,
      metacritic: game.metacritic || null,
      genres: game.genres ? game.genres.map(g => g.name) : []
    }));

    res.json(results);
  } catch (err) {
    console.error("Помилка RAWG API:", err.message);
    res.status(500).json({ message: "Помилка пошуку" });
  }
});

// 2. Отримати всі ігри
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Додати гру (тепер фронтенд сам передаватиме всі дані з пошуку)
router.post('/', async (req, res) => {
  const item = new Item(req.body);
  try {
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 4. Оновити гру (статус, оцінка тощо)
router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' } // 🚀 ВИПРАВЛЕНО: більше ніяких набридливих попереджень Mongoose!
    );
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 5. Видалити гру
router.delete('/:id', async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Видалено' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;