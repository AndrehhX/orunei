import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPreferredDownloadQuality,
  setPreferredDownloadQuality,
  isAutoDeleteWatchedEnabled,
  setAutoDeleteWatched,
} from '../src/offline/downloadEngine.js';

// Mock de localStorage para Node
const storage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => storage.get(k) || null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear(),
  },
};

test('gestiona la calidad de descarga preferida con valor predeterminado auto', () => {
  storage.clear();
  assert.equal(getPreferredDownloadQuality(), 'auto');

  setPreferredDownloadQuality('720p');
  assert.equal(getPreferredDownloadQuality(), '720p');

  setPreferredDownloadQuality('1080p');
  assert.equal(getPreferredDownloadQuality(), '1080p');
});

test('gestiona la preferencia de auto-eliminación de episodios vistos', () => {
  storage.clear();
  assert.equal(isAutoDeleteWatchedEnabled(), false);

  setAutoDeleteWatched(true);
  assert.equal(isAutoDeleteWatchedEnabled(), true);

  setAutoDeleteWatched(false);
  assert.equal(isAutoDeleteWatchedEnabled(), false);
});
