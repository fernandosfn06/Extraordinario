const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const { pool } = require('../config/db');

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  const flash = req.session.flash; delete req.session.flash;
  res.render('login', { flash, title: 'Iniciar Sesión' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND active = 1', [email]
    );
    if (!rows.length) {
      req.session.flash = { type: 'error', message: 'Credenciales incorrectas.' };
      return res.redirect('/login');
    }
    const user  = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      req.session.flash = { type: 'error', message: 'Credenciales incorrectas.' };
      return res.redirect('/login');
    }
    req.session.userId   = user.id;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'error', message: 'Error del servidor. Intenta de nuevo.' };
    res.redirect('/login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
