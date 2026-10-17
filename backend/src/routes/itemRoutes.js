const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// Отримати весь список (беклог)
router.get('/', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Додати новий запис у базу
router.post('/', async (req, res) => {
  const item = new Item({
    title: req.body.title,
    type: req.body.type || 'game',
    status: req.body.status || 'backlog'
  });

  try {
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;