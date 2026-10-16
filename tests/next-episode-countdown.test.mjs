import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldTriggerCountdown,
  TRIGGER_THRESHOLD_SECONDS,
  COUNTDOWN_DURATION,
} from '../src/playback/nextEpisodeCountdown.js';

describe('Next Episode Countdown Logic', () => {
  it('constantes tienen valores estándar', () => {
    assert.equal(TRIGGER_THRESHOLD_SECONDS, 15);
    assert.equal(COUNTDOWN_DURATION, 5);
  });

  it('no activa si no hay siguiente episodio disponible', () => {
    const res = shouldTriggerCountdown({
      currentTime: 1400,
      duration: 1420,
      episode: 12,
      totalEpisodes: 12,
      isDismissed: false,
    });
    assert.equal(res, false);
  });

  it('no activa si el usuario ya descartó el aviso en este episodio', () => {
    const res = shouldTriggerCountdown({
      currentTime: 1410,
      duration: 1420,
      episode: 5,
      totalEpisodes: 12,
      isDismissed: true,
    });
    assert.equal(res, false);
  });

  it('no activa si el video está lejos del final', () => {
    const res = shouldTriggerCountdown({
      currentTime: 200,
      duration: 1420,
      episode: 5,
      totalEpisodes: 12,
      isDismissed: false,
    });
    assert.equal(res, false);
  });

  it('activa cuando faltan 15 segundos o menos para terminar', () => {
    const res = shouldTriggerCountdown({
      currentTime: 1406,
      duration: 1420,
      episode: 5,
      totalEpisodes: 12,
      isDismissed: false,
    });
    assert.equal(res, true);
  });

  it('activa cuando el video llega al final exacto o duration', () => {
    const res = shouldTriggerCountdown({
      currentTime: 1420,
      duration: 1420,
      episode: 1,
      totalEpisodes: 24,
      isDismissed: false,
    });
    assert.equal(res, true);
  });

  it('maneja valores inválidos o videos demasiado cortos de forma segura', () => {
    assert.equal(shouldTriggerCountdown({}), false);
    assert.equal(shouldTriggerCountdown({ currentTime: 5, duration: 10, episode: 1, totalEpisodes: 10 }), false);
  });
});
