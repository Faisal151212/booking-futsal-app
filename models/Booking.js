const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  lapangan: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lapangan', 
    required: true 
  },
  tanggal: { 
    type: String, 
    required: true, 
    match: /^\d{4}-\d{2}-\d{2}$/ // Format: YYYY-MM-DD
  },
  jam_mulai: { 
    type: String, 
    required: true, 
    match: /^\d{2}:\d{2}$/ // Format: HH:mm
  },
  jam_selesai: { 
    type: String, 
    required: true, 
    match: /^\d{2}:\d{2}$/ // Format: HH:mm
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'canceled'],
    default: 'pending'
  },
  catatan: { // Untuk kebutuhan admin/user, bisa kosong
    type: String,
    default: ''
  },
  created: { 
    type: Date, 
    default: Date.now 
  }
});

// Optional: Index untuk mempercepat pencarian & mencegah double booking
BookingSchema.index(
  { lapangan: 1, tanggal: 1, jam_mulai: 1, jam_selesai: 1 },
  { unique: false }
);

module.exports = mongoose.model('Booking', BookingSchema);
