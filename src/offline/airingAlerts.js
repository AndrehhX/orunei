/**
 * Gestor de alertas y recordatorios de episodios en emisión (Airing Alerts).
 * Permite al usuario activar avisos para cuando se estrene el próximo capítulo.
 */

const ALERTS_STORAGE_KEY = 'orunei_airing_alerts';

function getAlertsStore() {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(ALERTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setAlertsStore(data) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function buildAlertKey(animeId, episode) {
  return `alert_${animeId}_ep_${episode}`;
}

export function hasAiringAlert(animeId, episode) {
  if (!animeId || !episode) return false;
  const store = getAlertsStore();
  const key = buildAlertKey(animeId, episode);
  return Boolean(store[key]);
}

export function toggleAiringAlert({ animeId, animeTitle, episode, airingAt }) {
  if (!animeId || !episode) return false;
  const store = getAlertsStore();
  const key = buildAlertKey(animeId, episode);

  if (store[key]) {
    delete store[key];
    setAlertsStore(store);
    return false; // Alerta desactivada
  }

  // Activar alerta
  store[key] = {
    animeId: String(animeId),
    animeTitle: animeTitle || 'Anime',
    episode: Number(episode),
    airingAt: Number(airingAt) || null,
    createdAt: Date.now(),
  };

  setAlertsStore(store);

  // Solicitar permiso de notificaciones si está en el navegador
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    try {
      Notification.requestPermission().catch(() => {});
    } catch {}
  }

  return true; // Alerta activada
}

export function removeAiringAlert(animeId, episode) {
  if (!animeId || !episode) return;
  const store = getAlertsStore();
  const key = buildAlertKey(animeId, episode);
  if (store[key]) {
    delete store[key];
    setAlertsStore(store);
  }
}

export function getAllAiringAlerts() {
  const store = getAlertsStore();
  return Object.values(store);
}
