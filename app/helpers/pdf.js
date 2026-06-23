const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs   = require('fs');
const os   = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');

const QR_SIZE = 90;
const MARGIN  = 15;

function decryptPdfBuffer(pdfBuffer) {
  return new Promise((resolve) => {
    const tmpDir = os.tmpdir();
    const inPath  = path.join(tmpDir, `${crypto.randomUUID()}_in.pdf`);
    const outPath = path.join(tmpDir, `${crypto.randomUUID()}_out.pdf`);

    fs.writeFileSync(inPath, pdfBuffer);

    execFile('qpdf', ['--decrypt', inPath, outPath], (err) => {
      let result = pdfBuffer;
      if (!err && fs.existsSync(outPath)) {
        result = fs.readFileSync(outPath);
      }
      fs.rmSync(inPath, { force: true });
      fs.rmSync(outPath, { force: true });
      resolve(result);
    });
  });
}

function getPosition(position, w, h) {
  switch (position) {
    case 'top-right':      return { x: w - QR_SIZE - MARGIN, y: h - QR_SIZE - MARGIN };
    case 'top-left':       return { x: MARGIN,                y: h - QR_SIZE - MARGIN };
    case 'bottom-left':    return { x: MARGIN,                y: MARGIN };
    case 'last-bottom-right':
    case 'bottom-right':
    default:               return { x: w - QR_SIZE - MARGIN, y: MARGIN };
  }
}

async function insertQRIntoPDF(pdfBuffer, qrBuffer, position) {
  const decryptedBuffer = await decryptPdfBuffer(pdfBuffer);
  const pdfDoc = await PDFDocument.load(decryptedBuffer, { ignoreEncryption: true });
  const pages  = pdfDoc.getPages();
  const page   = position === 'last-bottom-right' ? pages[pages.length - 1] : pages[0];
  const { width, height } = page.getSize();
  const pos    = getPosition(position, width, height);
  const qrImg  = await pdfDoc.embedPng(qrBuffer);

  page.drawImage(qrImg, { x: pos.x, y: pos.y, width: QR_SIZE, height: QR_SIZE });

  return await pdfDoc.save();
}

async function saveQRPDF(bytes, folio) {
  const dir = path.join(__dirname, '..', 'uploads', 'with-qr');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${folio}_qr.pdf`);
  fs.writeFileSync(filePath, bytes);

  return { filePath, relativePath: `uploads/with-qr/${folio}_qr.pdf` };
}

module.exports = { insertQRIntoPDF, saveQRPDF };
