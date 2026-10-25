const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  releaseYear: {
    type: Number,
    default: null
  },
  metacritic: {
    type: Number,
    default: null
  },
  genres: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['wishlist', 'backlog', 'playing', 'completed'],
    default: 'backlog'
  },
  personalRating: {
    type: Number,
    min: 1,
    max: 10,
    default: null
  },
  playtime: {
    type: Number,
    default: 0
  },
  comment: {
    type: String,
    default: ''
  },
  hasUaLocalization: {
    type: Boolean,
    default: false
  },
  steamAppId: {
    type: Number,
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);