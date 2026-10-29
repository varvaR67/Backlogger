// backend/src/models/Item.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  mediaType: {
    type: String,
    enum: ['game', 'movie', 'series', 'anime'],
    default: 'game'
  },
  status: {
    type: String,
    enum: ['wishlist', 'backlog', 'playing', 'paused', 'completed', 'dropped'],
    default: 'backlog'
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
  playtime: {
    type: Number,
    default: 0,
    min: 0,
    max: 100000
  },
  runtimeMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  currentSeason: {
    type: Number,
    default: 1,
    min: 1
  },
  currentEpisode: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEpisodes: {
    type: Number,
    default: null,
    min: 0
  },
  personalRating: {
    type: Number,
    default: null,
    min: 1,
    max: 10
  },
  comment: {
    type: String,
    default: '',
    maxlength: 2000
  },
  steamAppId: {
    type: String,
    default: null
  },
  rawgId: {
    type: String,
    default: null,
    index: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

itemSchema.index({ user: 1, mediaType: 1 });
itemSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Item', itemSchema);
