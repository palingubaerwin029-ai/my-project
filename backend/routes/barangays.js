const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// ─── List all barangays ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM barangays ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error('Barangays list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Add barangay (admin only) ────────────────────────────────────────────────
router.post('/', auth, requireRole('admin'), async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Barangay name is required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO barangays (name, created_at, updated_at) VALUES (?, NOW(), NOW())',
      [name.trim()]
    );
    const [rows] = await pool.query('SELECT * FROM barangays WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ error: 'This barangay already exists' });
    console.error('Barangay create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Update barangay (admin only) ─────────────────────────────────────────────
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Barangay name is required' });
  try {
    await pool.query('UPDATE barangays SET name=?, updated_at=NOW() WHERE id=?', [name.trim(), req.params.id]);
    const [rows] = await pool.query('SELECT * FROM barangays WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ error: 'This barangay already exists' });
    console.error('Barangay update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Delete barangay (admin only) ─────────────────────────────────────────────
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM barangays WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Barangay delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
