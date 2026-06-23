let cachedUrl = null;

async function fetchQuickTunnelHostname() {
  for (let i = 0; i < 6; i++) {
    try {
      const res = await fetch('http://cloudflared:20241/quicktunnel', { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        if (data.hostname) return data.hostname;
      }
    } catch (_) {
      // cloudflared aún no responde, se reintenta
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
}

async function getBaseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (cachedUrl) return cachedUrl;

  const hostname = await fetchQuickTunnelHostname();
  if (hostname) {
    cachedUrl = `https://${hostname}`;
    return cachedUrl;
  }

  return `${req.protocol}://${req.get('host')}`;
}

module.exports = { getBaseUrl };
