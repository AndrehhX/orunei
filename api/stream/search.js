import { resolveMiruroId } from '../../src/api/streamServer.js';

const WORKER_BASE = 'https://orunei-stream.thealex230820.workers.dev';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query || Object.fromEntries(new URL(req.url, 'http://localhost').searchParams);
  const id = query.id;
  const title = query.title;

  if (!id && !title) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Falta parametro id o title' }));
  }

  // 1. Intentar resolver mediante Cloudflare Worker Edge
  try {
    const workerUrl = `${WORKER_BASE}/api/stream/search?id=${encodeURIComponent(id || '')}&title=${encodeURIComponent(title || '')}`;
    const workerResp = await fetch(workerUrl);
    const workerData = await workerResp.json();
    if (workerResp.ok && workerData.miruroId) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(workerData));
    }
  } catch (workerErr) {
    console.warn('[search.js] Worker no respondió, intentando fallback local:', workerErr.message);
  }

  // 2. Fallback local
  try {
    const miruroId = await resolveMiruroId(id, title);
    if (!miruroId) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'No se encontro Miruro ID para este anime' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ miruroId }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: err.message }));
  }
}
