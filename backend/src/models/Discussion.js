// backend/src/models/Discussion.js
const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  tag: {
    type: String,
    default: 'Обговорення',
    trim: true,
    maxlength: 40
  },
  category: {
    type: String,
    enum: ['movies', 'games'],
    default: 'movies'
  },
  likes: {
    type: [String],
    default: []
  },
  replies: [{
    username: String,
    avatar: String,
    text: {
      type: String,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, { timestamps: true });

discussionSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Discussion || mongoose.model('Discussion', discussionSchema);

