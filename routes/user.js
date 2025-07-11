const express = require('express');
const router = express.Router();
const Lapangan = require('../models/Lapangan');
const Booking = require('../models/Booking');

// Middleware: Cek login
function isAuth(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/login');
}

// Dashboard User: tampilkan info dan lapangan
router.get('/dashboard', isAuth, async (req, res) => {
    const lapangan = await Lapangan.find({ status: 'aktif' });
    res.render('dashboard', { user: req.session.user, lapangan });
});

// Booking Form (Pilih Lapangan)
router.get('/booking', isAuth, async (req, res) => {
    const lapangan = await Lapangan.find({ status: 'aktif' });
    res.render('booking', { user: req.session.user, lapangan, error: null, success: null });
});

// Proses Booking
router.post('/booking', isAuth, async (req, res) => {
    const { lapanganId, tanggal, jam_mulai, jam_selesai, catatan } = req.body;
    if (!lapanganId || !tanggal || !jam_mulai || !jam_selesai) {
        const lapangan = await Lapangan.find({ status: 'aktif' });
        return res.render('booking', { user: req.session.user, lapangan, error: "Semua kolom wajib diisi!", success: null });
    }
    // Cek bentrok jadwal
    const bentrok = await Booking.findOne({
        lapangan: lapanganId, tanggal,
        $or: [
            { jam_mulai: { $lt: jam_selesai }, jam_selesai: { $gt: jam_mulai } }
        ],
        status: { $ne: 'rejected' }
    });
    if (bentrok) {
        const lapangan = await Lapangan.find({ status: 'aktif' });
        return res.render('booking', { user: req.session.user, lapangan, error: "Sudah dibooking di jam tersebut!", success: null });
    }
    await Booking.create({
        user: req.session.user._id,
        lapangan: lapanganId,
        tanggal,
        jam_mulai,
        jam_selesai,
        catatan,
        status: 'pending'
    });
    res.render('booking', { user: req.session.user, lapangan: await Lapangan.find({ status: 'aktif' }), error: null, success: "Booking berhasil, menunggu konfirmasi admin." });
});

// Riwayat Booking User
router.get('/riwayat', isAuth, async (req, res) => {
    const riwayat = await Booking.find({ user: req.session.user._id })
        .populate('lapangan')
        .sort({ tanggal: -1, jam_mulai: -1 });
    res.render('riwayat', { user: req.session.user, riwayat });
});

// Statistik Pemakaian Lapangan oleh User
router.get('/statistik', isAuth, async (req, res) => {
    const lapanganList = await Lapangan.find();
    const statBooking = {};
    for (let lap of lapanganList) {
        statBooking[lap.nama] = await Booking.countDocuments({ lapangan: lap._id, user: req.session.user._id });
    }
    res.render('statistik', { user: req.session.user, statBooking });
});

// Detail Booking (opsional)
router.get('/booking/detail/:id', isAuth, async (req, res) => {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.session.user._id }).populate('lapangan');
    if (!booking) return res.redirect('/riwayat');
    res.render('booking_detail', { user: req.session.user, booking });
});

// Batalkan Booking (opsional)
router.post('/booking/cancel/:id', isAuth, async (req, res) => {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.session.user._id, status: 'pending' });
    if (booking) {
        booking.status = 'rejected';
        await booking.save();
    }
    res.redirect('/riwayat');
});

module.exports = router;
