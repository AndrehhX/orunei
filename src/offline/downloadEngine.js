// Orunei Offline Download Engine
// Permite descargar episodios de anime para verlos 100% offline (estilo Netflix / Crunchyroll)

const DB_NAME = 'orunei_offline_v1';
const DB_VERSION = 1;
const STORE_EPISODES = 'episodes';
const STORE_BLOBS = 'video_blobs';

let dbInstance = null;
const listeners = new Set();
const activeDownloads = new Map(); // id -> { controller, abort }

function getDb() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no soportado'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_EPISODES)) {
        db.createObjectStore(STORE_EPISODES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onerror = () => reject(request.error);
  });
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 MB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function subscribeDownloads(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners() {
  listeners.forEach((fn) => {
    try { fn(); } catch {}
  });
}

export async function getAllDownloads() {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_EPISODES, 'readonly');
      const store = tx.objectStore(STORE_EPISODES);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        items.sort((a, b) => (b.downloadedAt || 0) - (a.downloadedAt || 0));
        resolve(items);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function getDownload(animeId, episodeNumber) {
  const id = `${animeId}_${episodeNumber}`;
  // Si está descargándose activamente en memoria
  if (activeDownloads.has(id)) {
    return activeDownloads.get(id).meta;
  }
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_EPISODES, 'readonly');
      const req = tx.objectStore(STORE_EPISODES).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function getOfflineVideoBlob(animeId, episodeNumber) {
  const id = `${animeId}_${episodeNumber}`;
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_BLOBS, 'readonly');
      const req = tx.objectStore(STORE_BLOBS).get(id);
      req.onsuccess = () => resolve(req.result?.blob || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function startEpisodeDownload({
  animeId,
  animeTitle,
  animeCover,
  episodeNumber,
  episodeTitle,
  streamUrl,
}) {
  const id = `${animeId}_${episodeNumber}`;

  if (activeDownloads.has(id)) return;

  const controller = new AbortController();
  const meta = {
    id,
    animeId,
    animeTitle,
    animeCover,
    episodeNumber,
    episodeTitle: episodeTitle || `Episodio ${episodeNumber}`,
    status: 'downloading',
    progress: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    sizeFormatted: 'Calculando...',
    downloadedAt: Date.now(),
  };

  activeDownloads.set(id, { controller, meta });
  notifyListeners();

  try {
    const response = await fetch(streamUrl, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentLength = Number(response.headers.get('content-length')) || 0;
    meta.totalBytes = contentLength;

    const reader = response.body.getReader();
    const chunks = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedBytes += value.length;

      meta.downloadedBytes = receivedBytes;
      if (contentLength > 0) {
        meta.progress = Math.min(99, Math.round((receivedBytes / contentLength) * 100));
        meta.sizeFormatted = `${formatBytes(receivedBytes)} / ${formatBytes(contentLength)}`;
      } else {
        meta.progress = 50;
        meta.sizeFormatted = formatBytes(receivedBytes);
      }

      notifyListeners();
    }

    const videoBlob = new Blob(chunks, { type: 'video/mp4' });
    meta.progress = 100;
    meta.status = 'completed';
    meta.sizeBytes = videoBlob.size;
    meta.sizeFormatted = formatBytes(videoBlob.size);
    meta.downloadedAt = Date.now();

    // Guardar en IndexedDB
    const db = await getDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_EPISODES, STORE_BLOBS], 'readwrite');
      tx.objectStore(STORE_EPISODES).put(meta);
      tx.objectStore(STORE_BLOBS).put({ id, blob: videoBlob });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    activeDownloads.delete(id);
    notifyListeners();
    return meta;
  } catch (error) {
    if (controller.signal.aborted) {
      activeDownloads.delete(id);
      notifyListeners();
      return;
    }
    meta.status = 'error';
    meta.error = error.message;
    activeDownloads.delete(id);
    notifyListeners();
    throw error;
  }
}

export function cancelDownload(animeId, episodeNumber) {
  const id = `${animeId}_${episodeNumber}`;
  const active = activeDownloads.get(id);
  if (active) {
    active.controller.abort();
    activeDownloads.delete(id);
    notifyListeners();
  }
}

export async function deleteDownload(animeId, episodeNumber) {
  const id = `${animeId}_${episodeNumber}`;
  cancelDownload(animeId, episodeNumber);
  try {
    const db = await getDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_EPISODES, STORE_BLOBS], 'readwrite');
      tx.objectStore(STORE_EPISODES).delete(id);
      tx.objectStore(STORE_BLOBS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    notifyListeners();
    return true;
  } catch {
    return false;
  }
}

export async function clearAllDownloads() {
  try {
    const db = await getDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_EPISODES, STORE_BLOBS], 'readwrite');
      tx.objectStore(STORE_EPISODES).clear();
      tx.objectStore(STORE_BLOBS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    notifyListeners();
    return true;
  } catch {
    return false;
  }
}

export async function getTotalStorageUsed() {
  const all = await getAllDownloads();
  const total = all.reduce((sum, item) => sum + (item.sizeBytes || 0), 0);
  return {
    bytes: total,
    formatted: formatBytes(total),
    count: all.length,
  };
}
