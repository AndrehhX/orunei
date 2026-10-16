import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasAiringAlert,
  toggleAiringAlert,
  removeAiringAlert,
  getAllAiringAlerts,
} from '../src/offline/airingAlerts.js';

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

test('activa y desactiva alertas de estreno para episodios en emisión', () => {
  storage.clear();

  assert.equal(hasAiringAlert('123', 5), false);

  const activated = toggleAiringAlert({
    animeId: '123',
    animeTitle: 'Frieren',
    episode: 5,
    airingAt: 1729000000,
  });
  assert.equal(activated, true);
  assert.equal(hasAiringAlert('123', 5), true);

  const all = getAllAiringAlerts();
  assert.equal(all.length, 1);
  assert.equal(all[0].animeTitle, 'Frieren');

  const deactivated = toggleAiringAlert({
    animeId: '123',
    episode: 5,
  });
  assert.equal(deactivated, false);
  assert.equal(hasAiringAlert('123', 5), false);
});

test('removeAiringAlert elimina la alerta correspondiente', () => {
  storage.clear();
  toggleAiringAlert({ animeId: '55', episode: 2 });
  assert.equal(hasAiringAlert('55', 2), true);

  removeAiringAlert('55', 2);
  assert.equal(hasAiringAlert('55', 2), false);
});
