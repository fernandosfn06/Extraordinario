const QRCode = require('qrcode');
const path   = require('path');
const fs     = require('fs');

async function generateQRCode(url, folio) {
  const qrDir = path.join(__dirname, '..', 'uploads', 'qr');
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

  const buffer = await QRCode.toBuffer(url, {
    width:  300,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
  });

  const filePath = path.join(qrDir, `${folio}.png`);
  fs.writeFileSync(filePath, buffer);

  return { buffer, filePath, relativePath: `uploads/qr/${folio}.png` };
}

module.exports = { generateQRCode };
