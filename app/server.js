const express  = require('express');
const session  = require('express-session');
const path     = require('path');
const bcrypt   = require('bcryptjs');
const { pool, testConnection } = require('./config/db');
const requireAuth = require('./middleware/requireAuth');

const authRoutes       = require('./routes/auth');
const dashboardRoutes  = require('./routes/dashboard');
const documentRoutes   = require('./routes/documents');
const validationRoutes = require('./routes/validation');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  secret:            process.env.SESSION_SECRET || 'dev-secret-key',
  resave:            false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 8 },
}));

// Expose session to all views
app.use((req, res, next) => { res.locals.session = req.session; next(); });

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) =>
  res.redirect(req.session.userId ? '/dashboard' : '/login')
);

app.use('/',           authRoutes);
app.use('/validate',   validationRoutes);
app.use('/dashboard',  requireAuth, dashboardRoutes);
app.use('/documents',  requireAuth, documentRoutes);

// 404
app.use((req, res) => res.status(404).send('<h2>404 – Página no encontrada</h2><a href="/">Volver al inicio</a>'));

// ── Seed default admin user ───────────────────────────────────────────────────
async function seedAdmin() {
  const [rows] = await pool.query('SELECT COUNT(*) AS c FROM users');
  if (rows[0].c === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)',
      ['Administrador', 'admin@sistema.com', hash, 'admin']
    );
    console.log('Usuario creado: admin@sistema.com / admin123');
  }
}

async function start() {
  await testConnection();
  await seedAdmin();
  app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
}

start().catch(err => { console.error(err); process.exit(1); });
