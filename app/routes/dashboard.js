const express  = require('express');
const router   = express.Router();
const { pool } = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT
        COUNT(*)                        AS total,
        SUM(status = 'vigente')         AS vigentes,
        SUM(status = 'revocado')        AS revocados,
        SUM(status = 'cancelado')       AS cancelados
      FROM documents
    `);
    const [recent] = await pool.query(
      `SELECT d.*, u.name AS user_name
       FROM documents d
       LEFT JOIN users u ON d.user_id = u.id
       ORDER BY d.created_at DESC LIMIT 5`
    );
    const flash = req.session.flash; delete req.session.flash;
    res.render('dashboard', { stats, recent, flash, title: 'Panel Principal' });
  } catch (err) {
    console.error(err);
    res.render('dashboard', { stats: { total:0, vigentes:0, revocados:0, cancelados:0 }, recent: [], flash: null, title: 'Panel Principal' });
  }
});

module.exports = router;
