import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextEpisodeToWatch,
  formatContinueWatchingLabel,
  enrichContinueWatchingItem,
  sortContinueWatchingList,
  isAnimeCompletedInLibrary,
  filterContinueWatchingList,
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

  it('sortContinueWatchingList ordena priorizando el anime reproducido más recientemente', () => {
    // Simulamos que el anime '200' se vio más recientemente que el '100'
    globalThis.localStorage.setItem('orunei_anime_last_watched', JSON.stringify({
      '100': 1000,
      '200': 5000,
      '300': 2000,
    }));

    const items = [
      { id: '100', t: 'Anime Antiguo', status: 'watching' },
      { id: '200', t: 'Anime Reciente', status: 'watching' },
      { id: '300', t: 'Anime Medio', status: 'watching' },
    ];

    const sorted = sortContinueWatchingList(items);
    assert.equal(sorted[0].id, '200');
    assert.equal(sorted[1].id, '300');
    assert.equal(sorted[2].id, '100');
  });

  it('si el usuario vio los episodios 1 y 2, recomienda avanzar al episodio 3', () => {
    globalThis.localStorage.setItem('orunei_watched_episodes', JSON.stringify({
      '101': [1, 2],
    }));

    const result = calculateNextEpisodeToWatch({
      animeId: '101',
      savedEpisode: 1,
      totalEpisodes: 12,
    });

    assert.equal(result.episode, 3);
    assert.equal(result.isSeriesCompleted, false);
  });

  it('isAnimeCompletedInLibrary detecta correctamente obras marcadas como visto o terminado', () => {
    assert.equal(isAnimeCompletedInLibrary({ status: 'completed' }), true);
    assert.equal(isAnimeCompletedInLibrary({ s: 'Terminado' }), true);
    assert.equal(isAnimeCompletedInLibrary({ s: 'Visto' }), true);
    assert.equal(isAnimeCompletedInLibrary({ status: 'watching', s: 'Viendo · Ep. 5' }), false);
    assert.equal(isAnimeCompletedInLibrary({ status: 'planned', s: 'Planeo ver' }), false);
  });

  it('filterContinueWatchingList excluye obras marcadas como visto en biblioteca', () => {
    const libraryItems = [
      { id: '1', t: 'Anime En Curso', status: 'watching', currentEpisode: 3, episodes: 12 },
      { id: '2', t: 'Anime Terminado 1', status: 'completed', currentEpisode: 12, episodes: 12 },
      { id: '3', t: 'Anime Terminado 2', s: 'Terminado', currentEpisode: 24, episodes: 24 },
      { id: '4', t: 'Anime Visto 3', s: 'Visto', currentEpisode: 1, episodes: 1 },
      { id: '5', t: 'Anime Planeado', status: 'planned', currentEpisode: 0, episodes: 12 },
    ];

    const filtered = filterContinueWatchingList(libraryItems);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, '1');
    assert.equal(filtered[0].t, 'Anime En Curso');
  });

  it('filterContinueWatchingList excluye series donde el usuario ya vio todos los episodios', () => {
    // Marcamos los 3 episodios del anime 10 como vistos
    globalThis.localStorage.setItem('orunei_watched_episodes', JSON.stringify({
      '10': [1, 2, 3],
      '20': [1],
    }));

    const libraryItems = [
      { id: '10', t: 'Anime Todo Visto', status: 'watching', currentEpisode: 3, episodes: 3 },
      { id: '20', t: 'Anime Con Caps Pendientes', status: 'watching', currentEpisode: 1, episodes: 12 },
    ];

    const filtered = filterContinueWatchingList(libraryItems);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, '20');
  });

  it('filterContinueWatchingList devuelve vacio y no muestra nada si todas las obras estan terminadas', () => {
    const libraryItems = [
      { id: '1', t: 'Completado A', status: 'completed' },
      { id: '2', t: 'Completado B', s: 'Terminado' },
    ];

    const filtered = filterContinueWatchingList(libraryItems);
    assert.deepEqual(filtered, []);
  });
});

