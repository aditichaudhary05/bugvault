import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

const TAG_MAX = 50;

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const tagsResult = await pool.query(
      `SELECT jsonb_array_elements_text(tags) as tag_name, COUNT(*)::int as bug_count,
              MIN(created_at) as created_at
       FROM bugs WHERE user_id = $1 AND tags IS NOT NULL AND tags != '[]'::jsonb
       GROUP BY tag_name
       ORDER BY bug_count DESC`,
      [userId]
    );

    const totalTags = tagsResult.rows.length;

    const taggedBugsResult = await pool.query(
      "SELECT COUNT(*)::int as count FROM bugs WHERE user_id = $1 AND tags IS NOT NULL AND tags != '[]'::jsonb",
      [userId]
    );

    const totalBugsResult = await pool.query(
      'SELECT COUNT(*)::int as count FROM bugs WHERE user_id = $1',
      [userId]
    );

    const taggedBugs = taggedBugsResult.rows[0].count;
    const totalBugs = totalBugsResult.rows[0].count;
    const avgTags = taggedBugs > 0 ? (tagsResult.rows.reduce((a, b) => a + b.bug_count, 0) / taggedBugs).toFixed(1) : '0.0';

    const lastMonthResult = await pool.query(
      `SELECT COUNT(DISTINCT tag) as count FROM (
        SELECT jsonb_array_elements_text(tags) as tag
        FROM bugs WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
        AND tags IS NOT NULL AND tags != '[]'::jsonb
      ) sub`,
      [userId]
    );

    const lastMonthTags = lastMonthResult.rows[0].count || 0;
    const prevMonthResult = await pool.query(
      `SELECT COUNT(DISTINCT tag) as count FROM (
        SELECT jsonb_array_elements_text(tags) as tag
        FROM bugs WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '60 days'
        AND created_at < NOW() - INTERVAL '30 days'
        AND tags IS NOT NULL AND tags != '[]'::jsonb
      ) sub`,
      [userId]
    );

    const prevMonthTags = prevMonthResult.rows[0].count || 0;
    const changePercent = prevMonthTags > 0
      ? Math.round(((lastMonthTags - prevMonthTags) / prevMonthTags) * 100)
      : (lastMonthTags > 0 ? 100 : 0);

    const tagDescriptions = {
      frontend: 'UI, layout and client-side issues',
      backend: 'Server, API and integrations',
      database: 'Database queries and data issues',
      ui: 'Visual and experience related',
      api: 'API errors and responses',
      authentication: 'Login, signup and permission issues',
      performance: 'Speed, optimization and load',
      security: 'Security vulnerabilities',
    };

    const tags = tagsResult.rows.map(row => ({
      name: row.tag_name,
      bugCount: row.bug_count,
      createdAt: row.created_at,
      description: tagDescriptions[row.tag_name] || `${row.tag_name} related issues`,
    }));

    res.json({
      success: true,
      tags,
      stats: {
        totalTags,
        taggedBugs,
        avgTags: parseFloat(avgTags),
        changePercent,
      },
    });
  } catch (err) {
    console.error('Tags error');
    res.status(500).json({ success: false, message: 'Server error fetching tags' });
  }
});

router.put('/:name', async (req, res) => {
  try {
    const userId = req.user.id;
    const oldName = req.params.name;
    const { newName } = req.body;

    if (!newName || !newName.trim()) {
      return res.status(400).json({ success: false, message: 'New tag name is required' });
    }
    if (newName.trim().length > TAG_MAX) {
      return res.status(400).json({ success: false, message: `Tag name must be at most ${TAG_MAX} characters` });
    }
    if (!oldName || oldName.length > TAG_MAX) {
      return res.status(400).json({ success: false, message: 'Invalid tag name' });
    }

    const trimmedName = newName.trim();

    const bugsResult = await pool.query(
      "SELECT id, tags FROM bugs WHERE user_id = $1 AND tags ? $2",
      [userId, oldName]
    );

    for (const bug of bugsResult.rows) {
      const tags = bug.tags || [];
      const updated = tags.map(t => t === oldName ? trimmedName : t);
      await pool.query('UPDATE bugs SET tags = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(updated), bug.id]);
    }

    res.json({ success: true, message: 'Tag renamed' });
  } catch (err) {
    console.error('Tag rename error');
    res.status(500).json({ success: false, message: 'Server error renaming tag' });
  }
});

router.delete('/:name', async (req, res) => {
  try {
    const userId = req.user.id;
    const tagName = req.params.name;

    if (!tagName || tagName.length > TAG_MAX) {
      return res.status(400).json({ success: false, message: 'Invalid tag name' });
    }

    const bugsResult = await pool.query(
      "SELECT id, tags FROM bugs WHERE user_id = $1 AND tags ? $2",
      [userId, tagName]
    );

    for (const bug of bugsResult.rows) {
      const tags = bug.tags || [];
      const updated = tags.filter(t => t !== tagName);
      await pool.query('UPDATE bugs SET tags = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(updated), bug.id]);
    }

    res.json({ success: true, message: 'Tag deleted' });
  } catch (err) {
    console.error('Tag delete error');
    res.status(500).json({ success: false, message: 'Server error deleting tag' });
  }
});

export default router;
