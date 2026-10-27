const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 32
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 128
  },
  avatar: {
    type: String,
    default: 'cyber',
    maxlength: 500
  },
  customTitle: {
    type: String,
    default: 'Дослідник всесвітів',
    trim: true,
    maxlength: 40
  },
  accentColor: {
    type: String,
    default: 'indigo',
    maxlength: 20
  },
  favoriteGameId: {
    type: String,
    default: '',
    maxlength: 64
  },
  steamSynced: {
    type: Boolean,
    default: false
  },
  steamId: {
    type: String,
    default: '',
    maxlength: 64
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Перевіряємо, чи пароль вже не був захешований у контролері, щоб уникнути подвійного хешування
  const isAlreadyHashed = /^\$2[abxy]\$\d{2}\$.{53}$/.test(this.password);
  if (isAlreadyHashed) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);