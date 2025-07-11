const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_.-]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 5
    // Note: Untuk production, sebaiknya gunakan bcrypt untuk hash password!
  },
  nama: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  created: {
    type: Date,
    default: Date.now
  }
});

// Index untuk pencarian lebih cepat
UserSchema.index({ username: 1 });

module.exports = mongoose.model('User', UserSchema);
