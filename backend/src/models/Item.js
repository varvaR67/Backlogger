const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true, default: 'game' },
  status: { type: String, default: 'backlog' }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);