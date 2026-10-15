import { handleProxyRequest } from '../../src/api/streamServer.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Origin, Content-Type'
    });
    return res.end();
  }

  const query = req.query || Object.fromEntries(new URL(req.url, 'http://localhost').searchParams);
  const targetUrl = query.url;
  const referer = query.referer || '';
  const origin = query.origin || '';

  await handleProxyRequest(req, res, targetUrl, referer, origin);
}
