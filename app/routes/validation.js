const express  = require('express');
const router   = express.Router();
const { pool } = require('../config/db');

router.get('/:folio', async (req, res) => {
  const { folio } = req.params;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const ua = (req.headers['user-agent'] || '').substring(0, 500);

  try {
    const [rows] = await pool.query(
      `SELECT d.*, u.name AS registered_by
       FROM documents d
       LEFT JOIN users u ON d.user_id = u.id
       WHERE d.folio = ?`,
      [folio]
    );

    if (!rows.length) {
      await pool.query(
        'INSERT INTO validations (folio, document_id, ip_address, user_agent, result) VALUES (?,NULL,?,?,?)',
        [folio, ip, ua, 'not_found']
      );
      return res.render('validate', { doc: null, folio, title: 'Validación de Documento' });
    }

    const doc = rows[0];
    await pool.query(
      'INSERT INTO validations (folio, document_id, ip_address, user_agent, result) VALUES (?,?,?,?,?)',
      [folio, doc.id, ip, ua, 'found']
    );

    res.render('validate', { doc, folio, title: 'Validación de Documento' });
  } catch (err) {
    console.error(err);
    res.render('validate', { doc: null, folio, title: 'Validación de Documento' });
  }
});

module.exports = router;
