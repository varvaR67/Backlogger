const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: 'cyber'
  },
  customTitle: {
    type: String,
    default: 'Дослідник всесвітів'
  },
  accentColor: {
    type: String,
    default: 'indigo'
  },
  favoriteGameId: {
    type: String,
    default: ''
  },
  steamSynced: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);