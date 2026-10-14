const idCache = new Map();

/**
 * Resuelve el Miruro ID para un anime a partir de su ID de AniList y título.
 * Mantiene un caché en memoria para evitar consultas repetidas.
 */
export async function getMiruroId(anilistId, animeTitle) {
  const cacheKey = `${anilistId}:${animeTitle}`;
  if (idCache.has(cacheKey)) {
    return idCache.get(cacheKey);
  }

  try {
    const url = `/api/stream/search?id=${encodeURIComponent(anilistId)}&title=${encodeURIComponent(animeTitle || '')}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    const data = await resp.json();
    if (data.miruroId) {
      idCache.set(cacheKey, data.miruroId);
      return data.miruroId;
    }
  } catch (err) {
    console.warn('[streamAdapter] No se pudo resolver Miruro ID:', err.message);
  }

  return null;
}

/**
 * Obtiene la fuente de video HLS y las pistas de subtítulos en español e inglés
 * para un episodio específico.
 */
export async function getEpisodePlayback(miruroId, episodeNum = 1) {
  if (!miruroId) {
    throw new Error('Miruro ID no disponible');
  }

  const url = `/api/stream/resolve?id=${encodeURIComponent(miruroId)}&ep=${encodeURIComponent(episodeNum)}`;
  const resp = await fetch(url);
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.error || `HTTP ${resp.status}`);
  }

  return data;
}
