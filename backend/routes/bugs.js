import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/', async (req, res) => {
  try {
    const {
      title, project, severity, whatHappened, stepsToReproduce,
      expectedBehavior, actualBehavior, rootCause, tags, solution, codeSnippet, language
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const result = await pool.query(
      `INSERT INTO bugs (
        user_id, title, context, severity, description,
        reproduction_steps, expected_behavior, actual_behavior,
        root_cause, tags, solution, code_snippet, language
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`,
      [
        req.user.id,
        title.trim(),
        project || null,
        severity || 'Medium',
        whatHappened || null,
        stepsToReproduce || null,
        expectedBehavior || null,
        actualBehavior || null,
        rootCause || null,
        tags ? JSON.stringify(tags) : '[]',
        solution || null,
        codeSnippet || null,
        language || 'JavaScript'
      ]
    );

    return res.status(201).json({ success: true, bug: result.rows[0] });
  } catch (err) {
    console.error('Create bug error:', err);
    return res.status(500).json({ success: false, message: 'Server error creating bug' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bugs WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json({ success: true, bugs: result.rows });
  } catch (err) {
    console.error('Get bugs error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching bugs' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM bugs WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    return res.json({ success: true, bug: result.rows[0] });
  } catch (err) {
    console.error('Get bug error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching bug' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query(
      'SELECT id FROM bugs WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    const {
      title, project, severity, whatHappened, stepsToReproduce,
      expectedBehavior, actualBehavior, rootCause, tags, solution, codeSnippet, language
    } = req.body;

    const result = await pool.query(
      `UPDATE bugs SET
        title = COALESCE($1, title),
        context = COALESCE($2, context),
        severity = COALESCE($3, severity),
        description = COALESCE($4, description),
        reproduction_steps = COALESCE($5, reproduction_steps),
        expected_behavior = COALESCE($6, expected_behavior),
        actual_behavior = COALESCE($7, actual_behavior),
        root_cause = COALESCE($8, root_cause),
        tags = COALESCE($9, tags),
        solution = COALESCE($10, solution),
        code_snippet = COALESCE($11, code_snippet),
        language = COALESCE($12, language),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 AND user_id = $14
      RETURNING *`,
      [
        title, project, severity, whatHappened, stepsToReproduce,
        expectedBehavior, actualBehavior, rootCause,
        tags ? JSON.stringify(tags) : null,
        solution, codeSnippet, language,
        id, req.user.id
      ]
    );

    return res.json({ success: true, bug: result.rows[0] });
  } catch (err) {
    console.error('Update bug error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating bug' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM bugs WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    return res.json({ success: true, message: 'Bug deleted' });
  } catch (err) {
    console.error('Delete bug error:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting bug' });
  }
});

export default router;
