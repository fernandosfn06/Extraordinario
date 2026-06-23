const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { pool } = require('../config/db');
const { generateFolio }    = require('../helpers/folio');
const { generateQRCode }   = require('../helpers/qr');
const { insertQRIntoPDF, saveQRPDF } = require('../helpers/pdf');
const { getBaseUrl } = require('../helpers/publicUrl');

// ── Multer (memory storage, validates PDF only) ──────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Solo se permiten archivos en formato PDF.'));
    }
    cb(null, true);
  },
});

function handleUpload(req, res, next) {
  upload.single('pdf')(req, res, (err) => {
    if (err) {
      req.session.flash = { type: 'error', message: err.message };
      return res.redirect('/documents/upload');
    }
    next();
  });
}

// ── GET /documents ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { search = '', status = '' } = req.query;
  try {
    let sql = `SELECT d.*, u.name AS user_name
               FROM documents d
               LEFT JOIN users u ON d.user_id = u.id
               WHERE 1=1`;
    const params = [];
    if (search) {
      sql += ' AND (d.folio LIKE ? OR d.title LIKE ? OR d.issuing_area LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) { sql += ' AND d.status = ?'; params.push(status); }
    sql += ' ORDER BY d.created_at DESC';

    const [documents] = await pool.query(sql, params);
    const flash = req.session.flash; delete req.session.flash;
    res.render('documents', { documents, flash, search, status, title: 'Repositorio de Documentos' });
  } catch (err) {
    console.error(err);
    res.render('documents', { documents: [], flash: null, search, status, title: 'Repositorio de Documentos' });
  }
});

// ── GET /documents/upload ────────────────────────────────────────────────────
router.get('/upload', (req, res) => {
  const flash = req.session.flash; delete req.session.flash;
  res.render('upload', { flash, title: 'Subir Documento' });
});

// ── POST /documents/upload ───────────────────────────────────────────────────
router.post('/upload', handleUpload, async (req, res) => {
  if (!req.file) {
    req.session.flash = { type: 'error', message: 'No se recibió ningún archivo PDF.' };
    return res.redirect('/documents/upload');
  }

  const { title, document_type, issuing_area, qr_position = 'bottom-right' } = req.body;
  if (!title || !document_type || !issuing_area) {
    req.session.flash = { type: 'error', message: 'Completa todos los campos obligatorios.' };
    return res.redirect('/documents/upload');
  }

  const folio   = generateFolio();
  const baseUrl = await getBaseUrl(req);
  const valUrl  = `${baseUrl}/validate/${folio}`;

  try {
    // 1. Save original PDF
    const origDir  = path.join(__dirname, '..', 'uploads', 'originals');
    if (!fs.existsSync(origDir)) fs.mkdirSync(origDir, { recursive: true });
    const origPath = path.join(origDir, `${folio}.pdf`);
    fs.writeFileSync(origPath, req.file.buffer);

    // 2. Generate QR
    const { buffer: qrBuffer, relativePath: qrRelPath } =
      await generateQRCode(valUrl, folio);

    // 3. Insert QR into PDF
    const pdfWithQR = await insertQRIntoPDF(req.file.buffer, qrBuffer, qr_position);

    // 4. Save PDF with QR
    const { relativePath: qrPdfRelPath } = await saveQRPDF(pdfWithQR, folio);

    // 5. Persist to DB
    await pool.query(
      `INSERT INTO documents
         (folio, title, document_type, issuing_area, status,
          original_filename, original_path, qr_path, qr_pdf_path, qr_position, user_id)
       VALUES (?,?,?,?,'vigente',?,?,?,?,?,?)`,
      [folio, title, document_type, issuing_area,
       req.file.originalname,
       `uploads/originals/${folio}.pdf`,
       qrRelPath, qrPdfRelPath,
       qr_position,
       req.session.userId]
    );

    req.session.flash = { type: 'success', message: `Documento registrado con folio: ${folio}` };
    res.redirect(`/documents/${folio}`);
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'error', message: 'Error al procesar el documento: ' + err.message };
    res.redirect('/documents/upload');
  }
});

// ── GET /documents/:folio ────────────────────────────────────────────────────
router.get('/:folio', async (req, res) => {
  const { folio } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT d.*, u.name AS user_name
       FROM documents d
       LEFT JOIN users u ON d.user_id = u.id
       WHERE d.folio = ?`,
      [folio]
    );
    if (!rows.length) {
      req.session.flash = { type: 'error', message: 'Documento no encontrado.' };
      return res.redirect('/documents');
    }
    const doc     = rows[0];
    const baseUrl = await getBaseUrl(req);
    const flash   = req.session.flash; delete req.session.flash;
    res.render('document-detail', { doc, baseUrl, flash, title: `Documento ${doc.folio}` });
  } catch (err) {
    console.error(err);
    res.redirect('/documents');
  }
});

// ── POST /documents/:folio/status ────────────────────────────────────────────
router.post('/:folio/status', async (req, res) => {
  const { folio }    = req.params;
  const { new_status, reason } = req.body;

  if (!['revocado', 'cancelado'].includes(new_status)) {
    req.session.flash = { type: 'error', message: 'Estado no válido.' };
    return res.redirect(`/documents/${folio}`);
  }
  try {
    await pool.query(
      'UPDATE documents SET status=?, revoked_at=NOW(), revoked_reason=? WHERE folio=?',
      [new_status, reason || null, folio]
    );
    req.session.flash = { type: 'success', message: `El documento ha sido marcado como ${new_status}.` };
    res.redirect(`/documents/${folio}`);
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'error', message: 'Error al cambiar el estado.' };
    res.redirect(`/documents/${folio}`);
  }
});

// ── GET /documents/:folio/download/:type ─────────────────────────────────────
router.get('/:folio/download/:type', async (req, res) => {
  const { folio, type } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM documents WHERE folio=?', [folio]);
    if (!rows.length) return res.status(404).send('Documento no encontrado.');

    const doc      = rows[0];
    const relPath  = type === 'qr' ? doc.qr_pdf_path : doc.original_path;
    const filePath = path.join(__dirname, '..', relPath);

    if (!fs.existsSync(filePath)) return res.status(404).send('Archivo no encontrado en el servidor.');

    const filename = type === 'qr' ? `${folio}_con_qr.pdf` : `${folio}_original.pdf`;
    res.download(filePath, filename);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al descargar el archivo.');
  }
});

module.exports = router;
