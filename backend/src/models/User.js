// backend/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 32
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 72,
    select: false
  },
  avatar: {
    type: String,
    default: 'cyber'
  },
  customTitle: {
    type: String,
    default: 'Дослідник всесвітів',
    maxlength: 32
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
  },
  steamId: {
    type: String,
    default: ''
  }
}, { timestamps: true });

userSchema.index(
  { username: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);