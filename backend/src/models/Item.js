const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  mediaType: {
    type: String,
    enum: ['game', 'movie', 'series', 'anime'],
    default: 'game'
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
    enum: ['wishlist', 'backlog', 'playing', 'paused', 'completed'],
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
  runtimeMinutes: {
    type: Number,
    default: null
  },
  currentSeason: {
    type: Number,
    default: 1
  },
  currentEpisode: {
    type: Number,
    default: 0
  },
  totalEpisodes: {
    type: Number,
    default: null
  },
  comment: {
    type: String,
    default: ''
  },
  likes: {
    type: [String],
    default: []
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

// Індекси для швидкої вибірки, сортування та агрегацій
itemSchema.index({ user: 1, playtime: -1, createdAt: -1 });
itemSchema.index({ updatedAt: -1 });
itemSchema.index({ status: 1, mediaType: 1 });
itemSchema.index({ user: 1, steamAppId: 1 });

module.exports = mongoose.model('Item', itemSchema);