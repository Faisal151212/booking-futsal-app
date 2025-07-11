const express = require('express');
const router = express.Router();
const User = require('../models/User');

// --- Login Page ---
router.get('/login', (req, res) => {
    // jika sudah login, langsung ke dashboard
    if (req.session.user) {
        return res.redirect(req.session.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    }
    res.render('login', { error: null });
});

// --- Login Action ---
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render('login', { error: 'Isi username dan password!' });
    }
    try {
        const user = await User.findOne({ username, password });
        if (!user) return res.render('login', { error: 'Username atau password salah!' });
        req.session.user = user;
        res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
        res.render('login', { error: 'Terjadi error server!' });
    }
});

// --- Register Page ---
router.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('register', { error: null });
});

// --- Register Action ---
router.post('/register', async (req, res) => {
    const { nama, username, password } = req.body;
    if (!nama || !username || !password) {
        return res.render('register', { error: 'Semua kolom wajib diisi!' });
    }
    try {
        // cek jika username sudah dipakai
        const exist = await User.findOne({ username });
        if (exist) return res.render('register', { error: 'Username sudah dipakai!' });
        await User.create({ nama, username, password }); // NOTE: sebaiknya hash password di production
        res.redirect('/login');
    } catch (err) {
        res.render('register', { error: 'Terjadi error server!' });
    }
});

// --- Logout ---
router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
