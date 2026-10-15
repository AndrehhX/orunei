import { URL } from 'url';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MIRURO_BASE = 'https://barelystarted.miruro.tv';

const BROWSER_HEADERS = {
  'User-Agent': USER_AGENT,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
};

/**
 * Resuelve el ID interno de Miruro a partir del ID de AniList y título.
 * No asume que AniList ID == Miruro ID.
 */
export async function resolveMiruroId(anilistId, animeTitle) {
  if (!animeTitle && !anilistId) return null;

  try {
    const query = animeTitle || '';
    const searchUrl = `${MIRURO_BASE}/search?q=${encodeURIComponent(query)}`;
    const resp = await fetch(searchUrl, {
      headers: {
        ...BROWSER_HEADERS,
        'Referer': `${MIRURO_BASE}/`
      }
    });

    if (!resp.ok) return null;
    const html = await resp.text();

    const alIdStr = String(anilistId);

    // Buscar coincidencia exacta con anilist en external_ids
    const pattern1 = /id:"([a-zA-Z0-9_\-]{20,40})"[^\{]*external_ids:\{[^\}]*anilist:\["(\d+)"\]/g;
    let match;
    while ((match = pattern1.exec(html)) !== null) {
      if (match[2] === alIdStr) {
        return match[1];
      }
    }

    const pattern2 = /id:"([a-zA-Z0-9_\-]{20,40})"[^\{]*externalIds:\{[^\}]*anilist:\["(\d+)"\]/g;
    while ((match = pattern2.exec(html)) !== null) {
      if (match[2] === alIdStr) {
        return match[1];
      }
    }

    // Fallback: primer resultado de búsqueda si coincide
    const fallbackMatch = /id:"([a-zA-Z0-9_\-]{20,40})",external_ids/g.exec(html);
    if (fallbackMatch) {
      return fallbackMatch[1];
    }
  } catch (err) {
    console.error('[StreamServer] Error al resolver Miruro ID:', err.message);
  }

  return null;
}

/**
 * Clasifica y normaliza subtitulos segun la heuristica de ani-neko.
 * Prioridad de seleccion: es-419 -> es-ES -> es -> en.
 */
function categorizeSubtitles(subtitlesList) {
  const spanish = [];
  const english = [];
  const other = [];

  for (const sub of subtitlesList) {
    const rawLang = (sub.language || sub.lang || sub.label || '').toLowerCase();
    const rawLabel = (sub.label || sub.name || '').toLowerCase();
    const file = sub.file || sub.url;
    if (!file) continue;

    const entry = {
      file,
      format: sub.format || 'vtt',
      rawLanguage: sub.language || 'unknown',
      label: sub.label || sub.language || 'Subtítulo',
      default: Boolean(sub.default)
    };

    if (rawLang === 'sp' || rawLang === 'es' || rawLang === 'spa' || rawLabel.includes('spanish') || rawLabel.includes('español')) {
      let dialect = 'Español';
      let langCode = 'es';
      if (rawLabel.includes('latin') || rawLabel.includes('latam') || rawLang === 'es-419') {
        dialect = 'Español (Latinoamérica)';
        langCode = 'es-419';
      } else if (rawLabel.includes('spain') || rawLabel.includes('españa') || rawLang === 'es-es') {
        dialect = 'Español (España)';
        langCode = 'es-ES';
      } else {
        dialect = sub.label || 'Español';
      }
      entry.cleanLabel = dialect;
      entry.langCode = langCode;
      spanish.push(entry);
    } else if (rawLang === 'en' || rawLang === 'eng' || rawLabel.includes('english')) {
      entry.cleanLabel = 'English';
      entry.langCode = 'en';
      english.push(entry);
    } else {
      entry.cleanLabel = sub.label || rawLang;
      entry.langCode = rawLang;
      other.push(entry);
    }
  }

  // Ordenar espanol: primero es-419, luego es-ES, luego es
  spanish.sort((a, b) => {
    const weight = (code) => code === 'es-419' ? 1 : code === 'es-ES' ? 2 : 3;
    return weight(a.langCode) - weight(b.langCode);
  });

  return { spanish, english, other, total: subtitlesList.length };
}

/**
 * Consulta la API de Miruro y selecciona stream y subtitulos segun la logica de ani-neko.
 */
export async function resolveEpisode(miruroId, episodeNum = 1) {
  const endpoint = `${MIRURO_BASE}/api/sources?id=${encodeURIComponent(miruroId)}&n=${encodeURIComponent(episodeNum)}`;

  const response = await fetch(endpoint, {
    headers: {
      ...BROWSER_HEADERS,
      'Referer': `${MIRURO_BASE}/`
    }
  });

  if (!response.ok) {
    throw new Error(`Error en API Miruro: HTTP ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const tracks = data.tracks || [];
  const ssubTrack = tracks.find(t => t.track === 'ssub');

  if (!ssubTrack) {
    throw new Error(`No se encontro pista ssub (soft-sub) en la respuesta del episodio ${episodeNum}`);
  }

  const providerOrder = data.providerOrder || ['sun', 'bee', 'hop', 'ally', 'kiwi', 'moo', 'knob', 'nun', 'bun', 'cog', 'telli'];
  const availableProviders = ssubTrack.providers || [];
  const providerMap = new Map(availableProviders.map(p => [p.provider, p]));

  let selectedProvider = null;
  let selectedSubs = null;
  let selectedServer = null;
  let selectedStream = null;

  // Pasada 1: Proveedor con subtitulos en espanol
  for (const provName of providerOrder) {
    const prov = providerMap.get(provName);
    if (!prov) continue;

    const subs = categorizeSubtitles(prov.subtitles || []);
    if (subs.spanish.length === 0) continue;

    const servers = prov.servers || [];
    for (const srv of servers) {
      const streams = (srv.streams || []).filter(s => s.url);
      if (streams.length > 0) {
        selectedProvider = provName;
        selectedSubs = subs;
        selectedServer = srv;
        selectedStream = streams[0];
        break;
      }
    }

    if (selectedStream) break;
  }

  // Pasada 2: Fallback si no hay espanol
  if (!selectedStream) {
    for (const provName of providerOrder) {
      const prov = providerMap.get(provName);
      if (!prov) continue;

      const subs = categorizeSubtitles(prov.subtitles || []);
      const servers = prov.servers || [];
      for (const srv of servers) {
        const streams = (srv.streams || []).filter(s => s.url);
        if (streams.length > 0) {
          selectedProvider = provName;
          selectedSubs = subs;
          selectedServer = srv;
          selectedStream = streams[0];
          break;
        }
      }

      if (selectedStream) break;
    }
  }

  if (!selectedStream) {
    throw new Error(`Ningún proveedor devolvió streams reproducibles para el episodio ${episodeNum}`);
  }

  const upstreamHeaders = selectedServer.headers || {};
  const referer = upstreamHeaders.Referer || upstreamHeaders.referer || '';
  const origin = upstreamHeaders.Origin || upstreamHeaders.origin || '';

  const proxyBase = '/api/stream/proxy';
  const proxiedStreamUrl = `${proxyBase}?url=${encodeURIComponent(selectedStream.url)}&referer=${encodeURIComponent(referer)}&origin=${encodeURIComponent(origin)}`;

  const buildProxiedTrack = (sub, isDefault = false) => ({
    label: sub.cleanLabel,
    lang: sub.langCode,
    src: `${proxyBase}?url=${encodeURIComponent(sub.file)}&referer=${encodeURIComponent(referer)}&origin=${encodeURIComponent(origin)}`,
    default: isDefault
  });

  const formattedTracks = [];
  selectedSubs.spanish.forEach((sub, idx) => {
    formattedTracks.push(buildProxiedTrack(sub, idx === 0));
  });
  if (selectedSubs.english.length > 0) {
    formattedTracks.push(buildProxiedTrack(selectedSubs.english[0], formattedTracks.length === 0));
  }

  return {
    miruroId,
    episodeNum,
    provider: selectedProvider,
    server: selectedServer.server || 'default',
    rawStreamUrl: selectedStream.url,
    proxiedStreamUrl,
    hasSpanishSubtitles: selectedSubs.spanish.length > 0,
    subtitles: {
      hasSpanish: selectedSubs.spanish.length > 0,
      tracks: formattedTracks,
      totalAvailable: selectedSubs.total
    }
  };
}

/**
 * Reescribe un manifiesto HLS (.m3u8) para redirigir sub-listas y segmentos a traves de este proxy.
 */
function rewriteM3U8(content, baseUrl, referer, origin, proxyBase = '/api/stream/proxy') {
  const lines = content.split('\n');
  const rewritten = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    if (trimmed.startsWith('#')) {
      if (trimmed.includes('URI="')) {
        return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
          try {
            const absolute = new URL(uri, baseUrl).href;
            const proxied = `${proxyBase}?url=${encodeURIComponent(absolute)}&referer=${encodeURIComponent(referer)}&origin=${encodeURIComponent(origin)}`;
            return `URI="${proxied}"`;
          } catch {
            return match;
          }
        });
      }
      return line;
    }

    try {
      const absolute = new URL(trimmed, baseUrl).href;
      return `${proxyBase}?url=${encodeURIComponent(absolute)}&referer=${encodeURIComponent(referer)}&origin=${encodeURIComponent(origin)}`;
    } catch {
      return line;
    }
  });

  return rewritten.join('\n');
}

const ALLOWED_CDN_DOMAINS = [
  'keeply.top',
  'ultracloud.cc',
  'megaplay.buzz',
  'miruro.tv',
  'bunnycdn.com',
  'rabbitstream.net',
  'dokicloud.one',
  'mcloud.to',
  'vizcloud.online',
  'rapid-cloud.co'
];

/**
 * Valida que el URL solicitado pertenezca a los CDNs autorizados y protege contra SSRF.
 */
export function isAuthorizedCdnUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') return false;

    const hostname = parsed.hostname.toLowerCase();
    // Bloquear explícitamente localhost y rangos privados / cloud metadata (SSRF)
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname.startsWith('169.254.') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }

    return hostname.includes('.') && !hostname.endsWith('.');
  } catch {
    return false;
  }
}

/**
 * Manejador del proxy de streaming para Vite middleware o servidor Node.js independiente.
 */
export async function handleProxyRequest(req, res, targetUrl, referer = '', origin = '') {
  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ error: 'Falta parametro url' }));
  }

  if (!isAuthorizedCdnUrl(targetUrl)) {
    res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ error: 'Destino no autorizado por la política de seguridad del proxy (SSRF Protection)' }));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  req.on('close', () => controller.abort());

  const upstreamHeaders = {
    'User-Agent': USER_AGENT
  };

  if (referer) upstreamHeaders['Referer'] = referer;
  if (origin) upstreamHeaders['Origin'] = origin;

  if (req.headers.range) {
    upstreamHeaders['Range'] = req.headers.range;
  }

  try {
    const upstreamResp = await fetch(targetUrl, {
      method: req.method,
      headers: upstreamHeaders,
      signal: controller.signal
    });

    if (!upstreamResp.ok && upstreamResp.status !== 206) {
      res.writeHead(upstreamResp.status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({
        error: `Error del CDN proveedor: HTTP ${upstreamResp.status} ${upstreamResp.statusText}`
      }));
    }

    const contentType = upstreamResp.headers.get('content-type') || '';
    const isM3U8 = targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('x-mpegURL');
    const isVTT = targetUrl.includes('.vtt') || (targetUrl.endsWith('.jpeg') && targetUrl.includes('/a/')) || contentType.includes('vtt') || contentType.includes('text/plain');

    const responseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Origin, Content-Type',
      'Cache-Control': 'no-cache'
    };

    if (upstreamResp.status === 206) {
      responseHeaders['Content-Range'] = upstreamResp.headers.get('content-range');
      responseHeaders['Accept-Ranges'] = 'bytes';
    }

    // 1. Manifiesto HLS
    if (isM3U8) {
      const rawText = await upstreamResp.text();
      const rewritten = rewriteM3U8(rawText, targetUrl, referer, origin);
      responseHeaders['Content-Type'] = 'application/vnd.apple.mpegurl; charset=utf-8';
      res.writeHead(upstreamResp.status, responseHeaders);
      return res.end(rewritten);
    }

    // 2. Subtítulos WebVTT
    if (isVTT) {
      const vttText = await upstreamResp.text();
      responseHeaders['Content-Type'] = 'text/vtt; charset=utf-8';
      res.writeHead(upstreamResp.status, responseHeaders);
      return res.end(vttText);
    }

    // 3. Segmentos de video binarios
    const finalType = targetUrl.includes('.png') || targetUrl.includes('.ts')
      ? 'video/mp2t'
      : (contentType || 'application/octet-stream');

    responseHeaders['Content-Type'] = finalType;
    const contentLength = upstreamResp.headers.get('content-length');
    if (contentLength) responseHeaders['Content-Length'] = contentLength;

    res.writeHead(upstreamResp.status, responseHeaders);

    const reader = upstreamResp.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    return res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(err.name === 'AbortError' ? 499 : 502, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ error: err.name === 'AbortError' ? 'Petición cancelada o tiempo de espera agotado' : 'Error en la conexión con el servidor multimedia' }));
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Middleware para Vite que atiende /api/stream/*
 */
export function streamMiddleware(req, res, next) {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;

  if (pathname === '/favicon.ico') {
    res.writeHead(204);
    return res.end();
  }

  if (!pathname.startsWith('/api/stream/')) {
    return next();
  }

  // Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.writeHead(204);
    return res.end();
  }

  // 1. /api/stream/search?id=...&title=...
  if (pathname === '/api/stream/search') {
    const anilistId = reqUrl.searchParams.get('id');
    const title = reqUrl.searchParams.get('title') || '';

    resolveMiruroId(anilistId, title)
      .then((miruroId) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(200);
        res.end(JSON.stringify({ anilistId, title, miruroId }));
      })
      .catch((err) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // 2. /api/stream/resolve?id=...&ep=...
  if (pathname === '/api/stream/resolve') {
    const miruroId = reqUrl.searchParams.get('id');
    const ep = parseInt(reqUrl.searchParams.get('ep') || '1', 10);

    if (!miruroId) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(400);
      return res.end(JSON.stringify({ error: 'Falta parámetro id (Miruro ID)' }));
    }

    resolveEpisode(miruroId, ep)
      .then((result) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(200);
        res.end(JSON.stringify(result));
      })
      .catch((err) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // 3. /api/stream/proxy?url=...&referer=...&origin=...
  if (pathname === '/api/stream/proxy') {
    const targetUrl = reqUrl.searchParams.get('url');
    const referer = reqUrl.searchParams.get('referer') || '';
    const origin = reqUrl.searchParams.get('origin') || '';
    return handleProxyRequest(req, res, targetUrl, referer, origin);
  }

  next();
}
