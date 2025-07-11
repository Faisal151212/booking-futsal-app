const express = require('express');
const router = express.Router();
const Lapangan = require('../models/Lapangan');
const Booking = require('../models/Booking');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Middleware: cek admin
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.redirect('/login');
}

// Multer config (upload foto lapangan)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ================== DASHBOARD ADMIN ==================
router.get('/dashboard', isAdmin, async (req, res) => {
  const totalLapangan = await Lapangan.countDocuments();
  const totalBooking = await Booking.countDocuments();
  const totalUser = await User.countDocuments({ role: 'user' });
  res.render('admin_dashboard', {
    user: req.session.user,
    totalLapangan,
    totalBooking,
    totalUser
  });
});

// ================== LAPANGAN ==================
// List Lapangan
router.get('/lapangan', isAdmin, async (req, res) => {
  const lapangan = await Lapangan.find();
  res.render('admin_lapangan', { lapangan, user: req.session.user, error: null });
});
// Tambah Lapangan (Form)
router.get('/lapangan/add', isAdmin, (req, res) =>
  res.render('admin_lapangan_tambah', { error: null, user: req.session.user })
);
// Tambah Lapangan (POST)
router.post('/lapangan/add', isAdmin, upload.single('foto'), async (req, res) => {
  try {
    await Lapangan.create({
      nama: req.body.nama,
      lokasi: req.body.lokasi,
      harga_per_jam: req.body.harga_per_jam,
      foto: req.file ? req.file.filename : '',
    });
    res.redirect('/admin/lapangan');
  } catch {
    res.render('admin_lapangan_tambah', { error: 'Gagal tambah lapangan!', user: req.session.user });
  }
});
// Edit Lapangan (Form)
router.get('/lapangan/edit/:id', isAdmin, async (req, res) => {
  const lap = await Lapangan.findById(req.params.id);
  res.render('admin_lapangan_edit', { lapangan: lap, error: null, user: req.session.user });
});
// Edit Lapangan (POST)
router.post('/lapangan/edit/:id', isAdmin, upload.single('foto'), async (req, res) => {
  try {
    const update = {
      nama: req.body.nama,
      lokasi: req.body.lokasi,
      harga_per_jam: req.body.harga_per_jam
    };
    if (req.file) update.foto = req.file.filename;
    await Lapangan.findByIdAndUpdate(req.params.id, update);
    res.redirect('/admin/lapangan');
  } catch {
    const lap = await Lapangan.findById(req.params.id);
    res.render('admin_lapangan_edit', { lapangan: lap, error: 'Gagal edit!', user: req.session.user });
  }
});
// Hapus Lapangan
router.post('/lapangan/hapus/:id', isAdmin, async (req, res) => {
  await Lapangan.findByIdAndDelete(req.params.id);
  res.redirect('/admin/lapangan');
});

// ================== BOOKING ==================
// List Booking
router.get('/booking', isAdmin, async (req, res) => {
  const q = req.query.q;
  let filter = {};
  if (q) {
    filter = {
      $or: [
        { tanggal: { $regex: q, $options: 'i' } },
      ]
    };
  }
  const booking = await Booking.find(filter).populate('lapangan').populate('user');
  res.render('admin_booking', { booking, user: req.session.user, q });
});
// Update Status Booking (approve/reject/cancel)
router.post('/booking/:id/status', isAdmin, async (req, res) => {
  const { status } = req.body;
  await Booking.findByIdAndUpdate(req.params.id, { status });
  res.redirect('/admin/booking');
});
// Hapus Booking
router.get('/booking/hapus/:id', isAdmin, async (req, res) => {
  await Booking.findByIdAndDelete(req.params.id);
  res.redirect('/admin/booking');
});

module.exports = router;
