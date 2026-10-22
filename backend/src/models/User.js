const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, // Забороняє створювати двох юзерів з однаковим ніком
    trim: true,
    minlength: 3
  },
  password: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);