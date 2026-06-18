function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    req.session.flash = { type: 'error', message: 'Debes iniciar sesión para acceder.' };
    return res.redirect('/login');
  }
  next();
}

module.exports = requireAuth;
