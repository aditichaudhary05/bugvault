import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

const TITLE_MAX = 255;
const CONTEXT_MAX = 255;
const SEVERITY_ENUM = ['Low', 'Medium', 'High', 'Critical'];
const STATUS_ENUM = ['Open', 'In Progress', 'Resolved', 'Closed'];
const LANGUAGE_MAX = 50;
const TEXT_MAX = 10000;
const TAG_MAX = 50;
const MAX_TAGS = 10;

function sanitizeString(val, max) {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

router.post('/', async (req, res) => {
  try {
    const {
      title, project, severity, whatHappened, stepsToReproduce,
      expectedBehavior, actualBehavior, rootCause, tags, solution, codeSnippet, language
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (title.trim().length > TITLE_MAX) {
      return res.status(400).json({ success: false, message: `Title must be at most ${TITLE_MAX} characters` });
    }
    if (severity && !SEVERITY_ENUM.includes(severity)) {
      return res.status(400).json({ success: false, message: 'Invalid severity value' });
    }
    if (language && language.length > LANGUAGE_MAX) {
      return res.status(400).json({ success: false, message: 'Language name too long' });
    }
    if (Array.isArray(tags)) {
      if (tags.length > MAX_TAGS) {
        return res.status(400).json({ success: false, message: `Maximum ${MAX_TAGS} tags allowed` });
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.trim().length > TAG_MAX) {
          return res.status(400).json({ success: false, message: 'Invalid tag' });
        }
      }
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
        title.trim().slice(0, TITLE_MAX),
        sanitizeString(project, CONTEXT_MAX),
        SEVERITY_ENUM.includes(severity) ? severity : 'Medium',
        sanitizeString(whatHappened, TEXT_MAX),
        sanitizeString(stepsToReproduce, TEXT_MAX),
        sanitizeString(expectedBehavior, TEXT_MAX),
        sanitizeString(actualBehavior, TEXT_MAX),
        sanitizeString(rootCause, TEXT_MAX),
        Array.isArray(tags) ? JSON.stringify(tags.map(t => t.trim().slice(0, TAG_MAX)).slice(0, MAX_TAGS)) : '[]',
        sanitizeString(solution, TEXT_MAX),
        sanitizeString(codeSnippet, TEXT_MAX),
        sanitizeString(language, LANGUAGE_MAX) || 'JavaScript'
      ]
    );

    return res.status(201).json({ success: true, bug: result.rows[0] });
  } catch (err) {
    console.error('Create bug error');
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
    console.error('Get bugs error');
    return res.status(500).json({ success: false, message: 'Server error fetching bugs' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid bug ID' });
    }
    const result = await pool.query(
      'SELECT * FROM bugs WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    return res.json({ success: true, bug: result.rows[0] });
  } catch (err) {
    console.error('Get bug error');
    return res.status(500).json({ success: false, message: 'Server error fetching bug' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid bug ID' });
    }
    const existing = await pool.query(
      'SELECT id FROM bugs WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    const {
      title, project, severity, whatHappened, stepsToReproduce,
      expectedBehavior, actualBehavior, rootCause, tags, solution, codeSnippet, language, status
    } = req.body;

    if (title !== undefined && (!title || !title.trim())) {
      return res.status(400).json({ success: false, message: 'Title cannot be empty' });
    }
    if (title && title.trim().length > TITLE_MAX) {
      return res.status(400).json({ success: false, message: `Title must be at most ${TITLE_MAX} characters` });
    }
    if (severity && !SEVERITY_ENUM.includes(severity)) {
      return res.status(400).json({ success: false, message: 'Invalid severity value' });
    }
    if (status && !STATUS_ENUM.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    if (Array.isArray(tags)) {
      if (tags.length > MAX_TAGS) {
        return res.status(400).json({ success: false, message: `Maximum ${MAX_TAGS} tags allowed` });
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.trim().length > TAG_MAX) {
          return res.status(400).json({ success: false, message: 'Invalid tag' });
        }
      }
    }

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
        status = COALESCE($13, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14 AND user_id = $15
      RETURNING *`,
      [
        title ? title.trim().slice(0, TITLE_MAX) : null,
        project !== undefined ? sanitizeString(project, CONTEXT_MAX) : null,
        severity || null,
        whatHappened !== undefined ? sanitizeString(whatHappened, TEXT_MAX) : null,
        stepsToReproduce !== undefined ? sanitizeString(stepsToReproduce, TEXT_MAX) : null,
        expectedBehavior !== undefined ? sanitizeString(expectedBehavior, TEXT_MAX) : null,
        actualBehavior !== undefined ? sanitizeString(actualBehavior, TEXT_MAX) : null,
        rootCause !== undefined ? sanitizeString(rootCause, TEXT_MAX) : null,
        tags ? JSON.stringify(tags.map(t => t.trim().slice(0, TAG_MAX)).slice(0, MAX_TAGS)) : null,
        solution !== undefined ? sanitizeString(solution, TEXT_MAX) : null,
        codeSnippet !== undefined ? sanitizeString(codeSnippet, TEXT_MAX) : null,
        language !== undefined ? sanitizeString(language, LANGUAGE_MAX) : null,
        status || null,
        id, req.user.id
      ]
    );

    return res.json({ success: true, bug: result.rows[0] });
  } catch (err) {
    console.error('Update bug error');
    return res.status(500).json({ success: false, message: 'Server error updating bug' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid bug ID' });
    }
    const result = await pool.query(
      'DELETE FROM bugs WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    return res.json({ success: true, message: 'Bug deleted' });
  } catch (err) {
    console.error('Delete bug error');
    return res.status(500).json({ success: false, message: 'Server error deleting bug' });
  }
});

export default router;
