// backend/src/models/Playlist.js
const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  desc: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  theme: {
    type: String,
    default: 'indigo'
  },
  category: {
    type: String,
    enum: ['games', 'movies'],
    default: 'games'
  },
  games: [{
    title: String,
    imageUrl: String,
    releaseYear: Number,
    metacritic: Number,
    genres: [String],
    mediaType: String,
    runtimeMinutes: Number
  }],
  likes: {
    type: [String],
    default: []
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, { timestamps: true });

playlistSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Playlist || mongoose.model('Playlist', playlistSchema);

