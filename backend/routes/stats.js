import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const totalResult = await pool.query(
      'SELECT COUNT(*)::int as total FROM bugs WHERE user_id = $1',
      [userId]
    );

    const resolvedResult = await pool.query(
      "SELECT COUNT(*)::int as count FROM bugs WHERE user_id = $1 AND status = 'Resolved'",
      [userId]
    );

    const inProgressResult = await pool.query(
      "SELECT COUNT(*)::int as count FROM bugs WHERE user_id = $1 AND status = 'In Progress'",
      [userId]
    );

    const openResult = await pool.query(
      "SELECT COUNT(*)::int as count FROM bugs WHERE user_id = $1 AND (status = 'Open' OR status IS NULL)",
      [userId]
    );

    const lastMonthResult = await pool.query(
      "SELECT COUNT(*)::int as count FROM bugs WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'",
      [userId]
    );

    const highResult = await pool.query(
      "SELECT COUNT(*)::int as count FROM bugs WHERE user_id = $1 AND severity = 'High'",
      [userId]
    );

    const mediumResult = await pool.query(
      "SELECT COUNT(*)::int as count FROM bugs WHERE user_id = $1 AND severity = 'Medium'",
      [userId]
    );

    const lowResult = await pool.query(
      "SELECT COUNT(*)::int as count FROM bugs WHERE user_id = $1 AND severity = 'Low'",
      [userId]
    );

    const infoResult = await pool.query(
      "SELECT COUNT(*)::int as count FROM bugs WHERE user_id = $1 AND severity = 'Info'",
      [userId]
    );

    const tagsResult = await pool.query(
      "SELECT jsonb_array_elements_text(tags) as tag FROM bugs WHERE user_id = $1 AND tags IS NOT NULL AND tags != '[]'::jsonb",
      [userId]
    );

    const tagCounts = {};
    tagsResult.rows.forEach(row => {
      const tag = row.tag;
      if (tag) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    });

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const recentResult = await pool.query(
      'SELECT id, title, status, created_at FROM bugs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [userId]
    );

    const bugsOverTimeResult = await pool.query(
      `SELECT TO_CHAR(created_at, 'Mon DD') as date, COUNT(*)::int as count
       FROM bugs WHERE user_id = $1
       GROUP BY TO_CHAR(created_at, 'Mon DD'), created_at::date
       ORDER BY created_at::date ASC`,
      [userId]
    );

    const bugsOverTime = bugsOverTimeResult.rows.map(row => ({
      name: row.date,
      bugs: row.count,
    }));

    res.json({
      success: true,
      stats: {
        totalBugs: totalResult.rows[0].total,
        resolved: resolvedResult.rows[0].count,
        inProgress: inProgressResult.rows[0].count,
        open: openResult.rows[0].count,
        lastMonth: lastMonthResult.rows[0].count,
        severity: {
          high: highResult.rows[0].count,
          medium: mediumResult.rows[0].count,
          low: lowResult.rows[0].count,
          info: infoResult.rows[0].count,
        },
        topTags,
        recentBugs: recentResult.rows,
        bugsOverTime,
      },
    });
  } catch (err) {
    console.error('Stats error');
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
});

export default router;
