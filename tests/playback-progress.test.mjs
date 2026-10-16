import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime,
  buildProgressKey,
  savePlaybackProgress,
  getPlaybackProgress,
  clearPlaybackProgress,
} from '../src/playback/playbackProgress.js';

// Mock de localStorage para el entorno Node
const storage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => storage.get(k) || null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear(),
  },
};

test('formatTime convierte segundos correctamente en M:SS y H:MM:SS', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(45), '0:45');
  assert.equal(formatTime(75), '1:15');
  assert.equal(formatTime(600), '10:00');
  assert.equal(formatTime(3665), '1:01:05');
});

test('buildProgressKey genera claves únicas y predecibles', () => {
  assert.equal(buildProgressKey(123, 4), '123_ep_4');
  assert.equal(buildProgressKey('naruto', 1), 'naruto_ep_1');
});

test('savePlaybackProgress y getPlaybackProgress guardan y recuperan el timestamp exacto', () => {
  storage.clear();

  const saved = savePlaybackProgress({
    animeId: '21',
    episode: 3,
    currentTime: 145.4,
    duration: 1420,
  });

  assert.ok(saved);
  assert.equal(saved.currentTime, 145);
  assert.equal(saved.episode, 3);

  const retrieved = getPlaybackProgress('21', 3);
  assert.ok(retrieved);
  assert.equal(retrieved.currentTime, 145);
  assert.equal(retrieved.duration, 1420);
});

test('savePlaybackProgress borra o ignora si está al inicio o en los créditos finales', () => {
  storage.clear();

  // Menor a 5s -> no guarda
  const early = savePlaybackProgress({
    animeId: '21',
    episode: 3,
    currentTime: 3,
    duration: 1400,
  });
  assert.equal(early, null);

  // Guardamos un tiempo válido
  savePlaybackProgress({
    animeId: '21',
    episode: 3,
    currentTime: 500,
    duration: 1400,
  });
  assert.ok(getPlaybackProgress('21', 3));

  // Casi al final (>92%) -> debe limpiarse
  savePlaybackProgress({
    animeId: '21',
    episode: 3,
    currentTime: 1380,
    duration: 1400,
  });
  assert.equal(getPlaybackProgress('21', 3), null);
});

test('clearPlaybackProgress remueve el progreso específico', () => {
  storage.clear();
  savePlaybackProgress({ animeId: '50', episode: 2, currentTime: 300, duration: 1200 });
  assert.ok(getPlaybackProgress('50', 2));

  clearPlaybackProgress('50', 2);
  assert.equal(getPlaybackProgress('50', 2), null);
});
