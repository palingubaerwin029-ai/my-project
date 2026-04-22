const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// ─── List all announcements ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Announcements list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Create announcement (admin only) ─────────────────────────────────────────
router.post('/', auth, requireRole('admin'), async (req, res) => {
  const { title, body, type, author, barangay, link } = req.body;
  if (!title?.trim() || !body?.trim())
    return res.status(400).json({ error: 'Title and body are required' });
  try {
    const [result] = await pool.query(
      `INSERT INTO announcements (title, body, type, author, barangay, link, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [title.trim(), body.trim(), type || 'info', author || null, barangay || 'All Barangays', link || null]
    );
    const [rows] = await pool.query('SELECT * FROM announcements WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Announcement create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Update announcement (admin only) ─────────────────────────────────────────
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  const { title, body, type, author, barangay, link } = req.body;
  try {
    await pool.query(
      `UPDATE announcements SET
         title    = COALESCE(?, title),
         body     = COALESCE(?, body),
         type     = COALESCE(?, type),
         author   = COALESCE(?, author),
         barangay = COALESCE(?, barangay),
         link     = COALESCE(?, link),
         updated_at = NOW()
       WHERE id = ?`,
      [title, body, type, author, barangay, link, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM announcements WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Announcement update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Delete announcement (admin only) ─────────────────────────────────────────
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Announcement delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
