import http from 'http';
import { URL } from 'url';
import { resolveMiruroId, resolveEpisode, handleProxyRequest } from '../src/api/streamServer.js';

const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (!origin || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;

  // Healthcheck endpoint para Render / Railway / Fly / AWS
  if (pathname === '/health' || pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', service: 'orunei-stream-service', timestamp: new Date().toISOString() }));
  }

  // 1. /api/stream/search?id=...&title=...
  if (pathname === '/api/stream/search') {
    const anilistId = reqUrl.searchParams.get('id');
    const title = reqUrl.searchParams.get('title') || '';

    try {
      const miruroId = await resolveMiruroId(anilistId, title);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ anilistId, title, miruroId }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 2. /api/stream/resolve?id=...&ep=...
  if (pathname === '/api/stream/resolve') {
    const miruroId = reqUrl.searchParams.get('id');
    const ep = parseInt(reqUrl.searchParams.get('ep') || '1', 10);

    if (!miruroId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Falta parámetro id (Miruro ID)' }));
    }

    try {
      const result = await resolveEpisode(miruroId, ep);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 3. /api/stream/proxy?url=...&referer=...&origin=...
  if (pathname === '/api/stream/proxy') {
    const targetUrl = reqUrl.searchParams.get('url');
    const referer = reqUrl.searchParams.get('referer') || '';
    const origin = reqUrl.searchParams.get('origin') || '';
    return handleProxyRequest(req, res, targetUrl, referer, origin);
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`[StreamService] Servidor multimedia de Orunei corriendo en puerto ${PORT}`);
});
