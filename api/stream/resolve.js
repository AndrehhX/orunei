import { resolveEpisode } from '../../src/api/streamServer.js';

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
  const ep = query.ep;

  if (!id) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Falta parametro id' }));
  }

  const episodeNum = parseInt(ep, 10) || 1;

  // 1. Intentar resolver mediante Cloudflare Worker Edge
  try {
    const workerUrl = `${WORKER_BASE}/api/stream/resolve?id=${encodeURIComponent(id)}&ep=${encodeURIComponent(episodeNum)}`;
    const workerResp = await fetch(workerUrl);
    const workerData = await workerResp.json();
    if (workerResp.ok && (workerData.proxiedStreamUrl || workerData.rawStreamUrl)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(workerData));
    }
  } catch (workerErr) {
    console.warn('[resolve.js] Worker no respondió, intentando fallback local:', workerErr.message);
  }

  // 2. Fallback local
  try {
    const playback = await resolveEpisode(id, episodeNum);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(playback));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: err.message }));
  }
}
