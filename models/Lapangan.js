const mongoose = require('mongoose');

const LapanganSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true,
    trim: true,
    unique: true, // Nama lapangan tidak boleh sama
    minlength: 2,
    maxlength: 60
  },
  lokasi: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  harga_per_jam: {
    type: Number,
    required: true,
    min: 10000, // Minimal harga (boleh disesuaikan)
    max: 5000000
  },
  deskripsi: {
    type: String,
    default: "",
    maxlength: 300
  },
  fasilitas: {
    type: [String],
    default: []
  },
  foto: {
    type: String,
    default: "" // Nama file foto yang diupload
  },
  created: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true // Untuk menonaktifkan lapangan jika perlu
  }
});

// Index untuk pencarian cepat
LapanganSchema.index({ nama: 1 });

module.exports = mongoose.model('Lapangan', LapanganSchema);
