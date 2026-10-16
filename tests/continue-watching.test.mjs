import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextEpisodeToWatch,
  formatContinueWatchingLabel,
  enrichContinueWatchingItem,
} from '../src/playback/continueWatching.js';

describe('Continue Watching Engine (Donde lo dejaste)', () => {
  beforeEach(() => {
    globalThis.localStorage = {
      _store: {},
      getItem(k) { return this._store[k] || null; },
      setItem(k, v) { this._store[k] = String(v); },
      removeItem(k) { delete this._store[k]; },
      clear() { this._store = {}; }
    };
  });

  it('si el episodio 1 fue completado, recomienda reproducir el episodio 2', () => {
    // Marcamos episodio 1 como visto
    globalThis.localStorage.setItem('orunei_watched_episodes', JSON.stringify({
      '101': [1],
    }));

    const result = calculateNextEpisodeToWatch({
      animeId: '101',
      savedEpisode: 1,
      totalEpisodes: 12,
    });

    assert.equal(result.episode, 2);
    assert.equal(result.isNewEpisode, true);
    assert.equal(result.currentTime, 0);
  });

  it('si el episodio 2 está a medias, recomienda reanudar el episodio 2 con su timestamp', () => {
    globalThis.localStorage.setItem('orunei_playback_progress', JSON.stringify({
      '101_ep_2': { animeId: '101', episode: 2, currentTime: 540, duration: 1420 },
    }));

    const result = calculateNextEpisodeToWatch({
      animeId: '101',
      savedEpisode: 2,
      totalEpisodes: 12,
    });

    assert.equal(result.episode, 2);
    assert.equal(result.isNewEpisode, false);
    assert.equal(result.currentTime, 540);
    assert.equal(result.duration, 1420);
    assert.equal(result.percent, 38);
  });

  it('formatea etiquetas claras y humanas según el estado de visualización', () => {
    const labelNew = formatContinueWatchingLabel({ episode: 3, isNewEpisode: true });
    assert.equal(labelNew, 'Episodio 3 ▸');

    const labelResume = formatContinueWatchingLabel({ episode: 2, currentTime: 365, isNewEpisode: false });
    assert.equal(labelResume, 'Ep. 2 · 6:05 ▸');
  });

  it('si todos los episodios fueron completados, indica serie completada', () => {
    globalThis.localStorage.setItem('orunei_watched_episodes', JSON.stringify({
      '50': [1, 2, 3],
    }));

    const result = calculateNextEpisodeToWatch({
      animeId: '50',
      savedEpisode: 3,
      totalEpisodes: 3,
    });

    assert.equal(result.isSeriesCompleted, true);
    assert.equal(result.episode, 1); // Permite reiniciar
  });
});
