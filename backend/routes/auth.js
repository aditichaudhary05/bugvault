import { Router } from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';
import pool from '../db.js';

const router = Router();
const saltRounds = 10;

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    const user = result.rows[0];

    await new Promise((resolve, reject) => {
      req.login(user, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return res.status(201).json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Login error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error during login' });
    }
    if (!user) {
      return res.status(401).json({ success: false, message: info?.message || 'Invalid email or password' });
    }
    req.login(user, (err) => {
      if (err) {
        console.error('Login session error:', err.message);
        return res.status(500).json({ success: false, message: 'Login failed' });
      }
      return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    });
  })(req, res, next);
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err.message);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      return res.json({ success: true, message: 'Logged out' });
    });
  });
});

router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({
      authenticated: true,
      user: { id: req.user.id, name: req.user.name, email: req.user.email }
    });
  }
  return res.json({ authenticated: false, user: null });
});

export default router;
