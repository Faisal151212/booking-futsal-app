require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const app = express();

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected")).catch(console.error);

// --- Models ---
const User = require('./models/User');
const Lapangan = require('./models/Lapangan');
const Booking = require('./models/Booking');

// --- View Engine & Middleware ---
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3 * 60 * 60 * 1000 }
}));

// --- Multer Config (upload gambar lapangan) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// --- Middleware Auth ---
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.redirect('/');
}

// --- AUTH ROUTES ---
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (user) {
    req.session.user = user;
    res.redirect(user.role === 'admin' ? '/admin/lapangan' : '/');
  } else {
    res.render('login', { error: 'Username/password salah' });
  }
});
app.get('/register', (req, res) => res.render('register', { error: null }));
app.post('/register', async (req, res) => {
  try {
    const { username, password, nama } = req.body;
    await User.create({ username, password, nama, role: 'user' });
    res.redirect('/login');
  } catch {
    res.render('register', { error: 'Username sudah digunakan!' });
  }
});
app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

// --- USER ROUTES ---
app.get('/', isAuthenticated, async (req, res) => {
  const lapangan = await Lapangan.find();
  res.render('dashboard', { user: req.session.user, lapangan });
});
app.get('/booking/:id', isAuthenticated, async (req, res) => {
  const lap = await Lapangan.findById(req.params.id);
  res.render('booking', { lapangan: lap, user: req.session.user, error: null });
});
app.post('/booking/:id', isAuthenticated, async (req, res) => {
  const { tanggal, jam_mulai, jam_selesai } = req.body;
  const ada = await Booking.findOne({ 
    lapangan: req.params.id, tanggal,
    $or: [
      { jam_mulai: { $lt: jam_selesai }, jam_selesai: { $gt: jam_mulai } }
    ]
  });
  if (ada) {
    const lap = await Lapangan.findById(req.params.id);
    return res.render('booking', { lapangan: lap, user: req.session.user, error: 'Jadwal sudah dibooking!' });
  }
  await Booking.create({
    user: req.session.user._id,
    lapangan: req.params.id,
    tanggal, jam_mulai, jam_selesai, status: 'pending'
  });
  res.redirect('/riwayat');
});
app.get('/riwayat', isAuthenticated, async (req, res) => {
  const riwayat = await Booking.find({ user: req.session.user._id }).populate('lapangan');
  res.render('riwayat', { user: req.session.user, riwayat });
});

// --- ADMIN LAPANGAN ROUTES ---
app.get('/admin/lapangan', isAdmin, async (req, res) => {
  const lapangan = await Lapangan.find();
  res.render('admin_lapangan', { user: req.session.user, lapangan });
});
app.get('/admin/lapangan/add', isAdmin, (req, res) => res.render('admin_lapangan_add', { user: req.session.user, error: null }));
app.post('/admin/lapangan/add', isAdmin, upload.single('foto'), async (req, res) => {
  const { nama, lokasi, harga_per_jam } = req.body;
  const foto = req.file ? req.file.filename : '';
  await Lapangan.create({ nama, lokasi, harga_per_jam, foto });
  res.redirect('/admin/lapangan');
});
app.get('/admin/lapangan/edit/:id', isAdmin, async (req, res) => {
  const lapangan = await Lapangan.findById(req.params.id);
  res.render('admin_lapangan_edit', { user: req.session.user, lapangan, error: null });
});
app.post('/admin/lapangan/edit/:id', isAdmin, upload.single('foto'), async (req, res) => {
  const { nama, lokasi, harga_per_jam } = req.body;
  const update = { nama, lokasi, harga_per_jam };
  if (req.file) update.foto = req.file.filename;
  await Lapangan.findByIdAndUpdate(req.params.id, update);
  res.redirect('/admin/lapangan');
});
app.get('/admin/lapangan/delete/:id', isAdmin, async (req, res) => {
  await Lapangan.findByIdAndDelete(req.params.id);
  res.redirect('/admin/lapangan');
});

// --- ADMIN BOOKING ROUTES ---
app.get('/admin/booking', isAdmin, async (req, res) => {
  const booking = await Booking.find().populate('lapangan user');
  res.render('admin_booking', { user: req.session.user, booking });
});
app.post('/admin/booking/:id/status', isAdmin, async (req, res) => {
  const { status } = req.body;
  await Booking.findByIdAndUpdate(req.params.id, { status });
  res.redirect('/admin/booking');
});
app.get('/admin/booking/delete/:id', isAdmin, async (req, res) => {
  await Booking.findByIdAndDelete(req.params.id);
  res.redirect('/admin/booking');
});

// --- RUN SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running at http://localhost:' + PORT));
