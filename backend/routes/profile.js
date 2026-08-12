import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
    }
  },
});

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await pool.query(
      'SELECT id, name, email, description, profile_picture, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    const bugsResult = await pool.query(
      `SELECT id, title, description, status, severity, context, tags, created_at, updated_at
       FROM bugs WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const bugs = bugsResult.rows;
    const totalBugs = bugs.length;
    const resolvedBugs = bugs.filter(b => b.status === 'Resolved').length;

    const tagCounts = {};
    bugs.forEach(bug => {
      const tags = bug.tags || [];
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const recentBugs = bugs.slice(0, 5);

    const streakResult = await pool.query(
      `SELECT DATE(created_at) as day, COUNT(*)::int as count
       FROM bugs WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY day DESC`,
      [userId]
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayMs = 86400000;

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today.getTime() - i * dayMs);
      const dateStr = checkDate.toISOString().split('T')[0];
      const found = streakResult.rows.find(r => {
        const rowDate = new Date(r.day).toISOString().split('T')[0];
        return rowDate === dateStr;
      });
      if (found) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    const weekDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * dayMs);
      const dateStr = d.toISOString().split('T')[0];
      const found = streakResult.rows.find(r => {
        const rowDate = new Date(r.day).toISOString().split('T')[0];
        return rowDate === dateStr;
      });
      weekDays.push({
        day: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
        active: !!found,
      });
    }

    res.json({
      success: true,
      profile: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          description: user.description || '',
          profilePicture: user.profile_picture || '',
          createdAt: user.created_at,
        },
        stats: {
          totalBugs,
          resolvedBugs,
          totalTags: Object.keys(tagCounts).length,
        },
        recentBugs,
        topTags,
        streak: {
          days: streak,
          week: weekDays,
        },
      },
    });
  } catch (err) {
    console.error('Profile error');
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
});

router.put('/', upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: 'Name cannot be empty' });
      }
      if (trimmedName.length > 100) {
        return res.status(400).json({ success: false, message: 'Name must be at most 100 characters' });
      }
      updates.push(`name = $${paramIndex++}`);
      values.push(trimmedName);
    }
    if (description !== undefined) {
      const desc = String(description).slice(0, 5000);
      updates.push(`description = $${paramIndex++}`);
      values.push(desc);
    }
    if (req.file) {
      const pictureUrl = `/uploads/${req.file.filename}`;
      updates.push(`profile_picture = $${paramIndex++}`);
      values.push(pictureUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(userId);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

    const userResult = await pool.query(
      'SELECT id, name, email, description, profile_picture, created_at FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        description: user.description || '',
        profilePicture: user.profile_picture || '',
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('Profile update error');
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
});

export default router;
