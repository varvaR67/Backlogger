const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true, default: 'game' },
  status: { type: String, default: 'backlog' },
  imageUrl: { type: String, default: '' },
  
  // Ось цей новий рядок: Прив'язка до конкретного акаунта
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Розширена інформація
  releaseYear: { type: Number, default: null },
  metacritic: { type: Number, default: null },
  genres: { type: [String], default: [] },
  
  // Особисті нотатки
  personalRating: { type: Number, default: null },
  playtime: { type: Number, default: 0 },
  comment: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);