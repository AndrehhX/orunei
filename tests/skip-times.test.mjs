import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getActiveSkipInterval,
  fetchSkipTimes,
  resolveActiveSkip,
  isAutoSkipEnabled,
  setAutoSkipEnabled,
} from '../src/playback/skipTimes.js';

test('getActiveSkipInterval detecta intervalo activo de opening correctamente', () => {
  const intervals = [
    { type: 'op', startTime: 90.0, endTime: 180.0, label: 'Saltar Intro' },
    { type: 'ed', startTime: 1300.0, endTime: 1390.0, label: 'Saltar Ending' },
  ];

  // Antes de opening
  assert.equal(getActiveSkipInterval(intervals, 50.0), null);

  // Dentro de opening
  const activeOp = getActiveSkipInterval(intervals, 120.0);
  assert.ok(activeOp);
  assert.equal(activeOp.type, 'op');
  assert.equal(activeOp.label, 'Saltar Intro');

  // En la frontera final
  assert.equal(getActiveSkipInterval(intervals, 180.5), null);

  // Dentro de ending
  const activeEd = getActiveSkipInterval(intervals, 1350.0);
  assert.ok(activeEd);
  assert.equal(activeEd.type, 'ed');
  assert.equal(activeEd.label, 'Saltar Ending');
});

test('resolveActiveSkip activa fallback inteligente cuando AniSkip no tiene datos', () => {
  // En los primeros minutos (intro)
  const introFallback = resolveActiveSkip({
    intervals: [],
    currentTime: 45,
    duration: 1420,
  });
  assert.ok(introFallback);
  assert.equal(introFallback.type, 'fallback_op');
  assert.equal(introFallback.label, 'Saltar Intro (+85s)');
  assert.equal(introFallback.targetTime, 45 + 85);

  // En los créditos finales (ending)
  const endingFallback = resolveActiveSkip({
    intervals: [],
    currentTime: 1350,
    duration: 1400,
  });
  assert.ok(endingFallback);
  assert.equal(endingFallback.type, 'fallback_ed');
  assert.equal(endingFallback.label, 'Saltar Ending');
  assert.equal(endingFallback.targetTime, 1400 - 2);

  // A la mitad del episodio sin intro ni ending
  assert.equal(resolveActiveSkip({ intervals: [], currentTime: 600, duration: 1400 }), null);
});

test('auto-skip preference se guarda y recupera en storage', () => {
  globalThis.localStorage = {
    _store: {},
    getItem(k) { return this._store[k] || null; },
    setItem(k, v) { this._store[k] = String(v); },
  };

  assert.equal(isAutoSkipEnabled(), false);
  setAutoSkipEnabled(true);
  assert.equal(isAutoSkipEnabled(), true);
  setAutoSkipEnabled(false);
  assert.equal(isAutoSkipEnabled(), false);
});

test('getActiveSkipInterval maneja listas vacias o entradas invalidas de forma segura', () => {
  assert.equal(getActiveSkipInterval([], 100), null);
  assert.equal(getActiveSkipInterval(null, 100), null);
  assert.equal(getActiveSkipInterval([{ startTime: 10, endTime: 20 }], null), null);
});

test('fetchSkipTimes retorna arreglo vacio si no se suministra malId o episodio', async () => {
  const empty1 = await fetchSkipTimes({ malId: null, episodeNumber: 1 });
  assert.deepEqual(empty1, []);

  const empty2 = await fetchSkipTimes({ malId: 21, episodeNumber: null });
  assert.deepEqual(empty2, []);
});
