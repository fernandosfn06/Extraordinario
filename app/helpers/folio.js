function generateFolio() {
  const d = new Date();
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rnd = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DOC-${y}${m}${dd}-${rnd}`;
}

module.exports = { generateFolio };
