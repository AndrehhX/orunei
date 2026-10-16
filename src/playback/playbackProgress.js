/**
 * Gestor de persistencia del punto exacto de reproducción (Timestamp Resume).
 * Permite reanudar un episodio en el segundo exacto donde se pausó.
 */

const STORAGE_KEY = 'orunei_playback_progress';

function getStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStorage(data) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

/**
 * Formatea segundos en formato M:SS o H:MM:SS
 */
export function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const sec = Math.floor(seconds);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const sStr = s < 10 ? `0${s}` : `${s}`;

  if (h > 0) {
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${h}:${mStr}:${sStr}`;
  }
  return `${m}:${sStr}`;
}

export function buildProgressKey(animeId, episode) {
  return `${animeId || 'unknown'}_ep_${episode || 1}`;
}

/**
 * Guarda el progreso actual en segundos.
 * Si el usuario ya está a menos de 20s del final o vio más del 92%, se borra para no reanudar en los créditos.
 */
export function savePlaybackProgress({ animeId, episode, currentTime, duration }) {
  if (!animeId || !episode || typeof currentTime !== 'number' || isNaN(currentTime)) return null;

  const validDuration = typeof duration === 'number' && !isNaN(duration) && duration > 0 ? duration : null;
  const store = getStorage();
  const key = buildProgressKey(animeId, episode);

  // Si está al inicio (< 5s) o casi al final (> 92% o faltan menos de 20s)
  const isFinished = validDuration && (currentTime > validDuration - 20 || (currentTime / validDuration) > 0.92);

  if (isFinished || currentTime < 5) {
    if (store[key]) {
      delete store[key];
      setStorage(store);
    }
    return null;
  }

  const record = {
    animeId: String(animeId),
    episode: Number(episode),
    currentTime: Math.round(currentTime),
    duration: validDuration ? Math.round(validDuration) : null,
    updatedAt: Date.now(),
  };

  store[key] = record;
  setStorage(store);
  return record;
}

/**
 * Obtiene el registro de reproducción para un episodio específico.
 */
export function getPlaybackProgress(animeId, episode) {
  if (!animeId || !episode) return null;
  const store = getStorage();
  const key = buildProgressKey(animeId, episode);
  const entry = store[key];
  if (!entry || typeof entry.currentTime !== 'number') return null;
  return entry;
}

/**
 * Limpia el progreso guardado (ej. cuando el usuario desea reiniciar desde 0:00).
 */
export function clearPlaybackProgress(animeId, episode) {
  if (!animeId || !episode) return;
  const store = getStorage();
  const key = buildProgressKey(animeId, episode);
  if (store[key]) {
    delete store[key];
    setStorage(store);
  }
}
