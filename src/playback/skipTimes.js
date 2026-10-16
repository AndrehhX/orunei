/**
 * Módulo para detección de aperturas y cierres (Openings y Endings)
 * Consulta la API pública y abierta de AniSkip (https://aniskip.com)
 */

const skipCache = new Map();

/**
 * Consulta intervalos de salto para un episodio dado.
 * @param {Object} params
 * @param {number|string} params.malId - ID de MyAnimeList
 * @param {number|string} params.episodeNumber - Número del episodio
 * @param {number} [params.episodeLength] - Duración en segundos del video
 * @returns {Promise<Array<{ type: string, startTime: number, endTime: number, label: string }>>}
 */
export async function fetchSkipTimes({ malId, episodeNumber, episodeLength = 0 }) {
  if (!malId || !episodeNumber) return [];

  const cacheKey = `${malId}:${episodeNumber}`;
  if (skipCache.has(cacheKey)) {
    return skipCache.get(cacheKey);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const lengthParam = episodeLength > 0 ? `&episodeLength=${Math.round(episodeLength)}` : '';
    const url = `https://api.aniskip.com/v2/skip-times/${malId}/${episodeNumber}?types[]=op&types[]=ed${lengthParam}`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      skipCache.set(cacheKey, []);
      return [];
    }

    const data = await res.json();
    if (!data.found || !Array.isArray(data.results)) {
      skipCache.set(cacheKey, []);
      return [];
    }

    const intervals = data.results
      .filter((r) => r.interval && typeof r.interval.startTime === 'number' && typeof r.interval.endTime === 'number')
      .map((r) => {
        const isOp = r.skipType === 'op';
        return {
          type: r.skipType,
          startTime: r.interval.startTime,
          endTime: r.interval.endTime,
          label: isOp ? 'Saltar Intro' : 'Saltar Ending',
        };
      });

    skipCache.set(cacheKey, intervals);
    return intervals;
  } catch (err) {
    // Si falla o da timeout, retornar vacío de forma segura
    return [];
  }
}

/**
 * Determina si el tiempo actual de reproducción se encuentra dentro de un intervalo de salto.
 * @param {Array} intervals
 * @param {number} currentTime
 * @returns {{ type: string, startTime: number, endTime: number, label: string }|null}
 */
export function getActiveSkipInterval(intervals, currentTime) {
  if (!Array.isArray(intervals) || intervals.length === 0 || typeof currentTime !== 'number') {
    return null;
  }

  for (const interval of intervals) {
    // Consideramos un margen de tolerancia de 0.5s al inicio
    if (currentTime >= interval.startTime - 0.5 && currentTime < interval.endTime) {
      return interval;
    }
  }

  return null;
}
