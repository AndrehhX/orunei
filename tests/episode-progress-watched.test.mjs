import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  savePlaybackProgress,
  getPlaybackProgress,
  clearPlaybackProgress,
  markEpisodeWatched,
  isEpisodeWatched,
  unmarkEpisodeWatched,
  getEpisodeDisplayProgress,
} from '../src/playback/playbackProgress.js';

describe('Episode Progress and Watched Status', () => {
  beforeEach(() => {
    globalThis.localStorage = {
      _store: {},
      getItem(key) { return this._store[key] || null; },
      setItem(key, value) { this._store[key] = String(value); },
      removeItem(key) { delete this._store[key]; },
      clear() { this._store = {}; },
    };
  });

  it('guarda el progreso en curso y calcula el porcentaje correctamente', () => {
    savePlaybackProgress({
      animeId: 101,
      episode: 2,
      currentTime: 600,
      duration: 1200,
    });

    const display = getEpisodeDisplayProgress(101, 2);
    assert.equal(display.watched, false);
    assert.equal(display.percent, 50);
    assert.equal(display.currentTime, 600);
    assert.equal(display.duration, 1200);
  });

  it('marca automáticamente como visto cuando supera el 92% o faltan menos de 20s', () => {
    savePlaybackProgress({
      animeId: 101,
      episode: 3,
      currentTime: 1390,
      duration: 1400,
    });

    assert.equal(isEpisodeWatched(101, 3), true);
    const display = getEpisodeDisplayProgress(101, 3);
    assert.equal(display.watched, true);
    assert.equal(display.percent, 100);
  });

  it('markEpisodeWatched y unmarkEpisodeWatched gestionan el estado correctamente', () => {
    assert.equal(isEpisodeWatched(200, 1), false);
    markEpisodeWatched(200, 1);
    assert.equal(isEpisodeWatched(200, 1), true);

    unmarkEpisodeWatched(200, 1);
    assert.equal(isEpisodeWatched(200, 1), false);
  });

  it('getEpisodeDisplayProgress retorna valores por defecto para episodios sin reproducir', () => {
    const display = getEpisodeDisplayProgress(999, 1);
    assert.equal(display.watched, false);
    assert.equal(display.percent, 0);
  });
});
