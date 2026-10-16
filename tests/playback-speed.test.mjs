import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPPORTED_SPEEDS,
  DEFAULT_SPEED,
  getStoredPlaybackSpeed,
  setStoredPlaybackSpeed,
  applyPlaybackSpeed,
} from '../src/playback/playbackSpeed.js';

describe('Playback Speed Manager', () => {
  beforeEach(() => {
    // Reset global localStorage mock
    globalThis.localStorage = {
      _store: {},
      getItem(key) { return this._store[key] || null; },
      setItem(key, value) { this._store[key] = String(value); },
      removeItem(key) { delete this._store[key]; },
      clear() { this._store = {}; }
    };
  });

  it('retorna la velocidad por defecto (1x) cuando no hay nada guardado', () => {
    const speed = getStoredPlaybackSpeed();
    assert.equal(speed, DEFAULT_SPEED);
    assert.equal(speed, 1);
  });

  it('guarda y recupera velocidades soportadas válidas', () => {
    for (const validSpeed of SUPPORTED_SPEEDS) {
      setStoredPlaybackSpeed(validSpeed);
      assert.equal(getStoredPlaybackSpeed(), validSpeed);
    }
  });

  it('ignora velocidades inválidas o fuera de rango y retorna el default', () => {
    globalThis.localStorage.setItem('orunei_playback_speed', 'invalid');
    assert.equal(getStoredPlaybackSpeed(), DEFAULT_SPEED);

    globalThis.localStorage.setItem('orunei_playback_speed', '-2');
    assert.equal(getStoredPlaybackSpeed(), DEFAULT_SPEED);

    globalThis.localStorage.setItem('orunei_playback_speed', '10');
    assert.equal(getStoredPlaybackSpeed(), DEFAULT_SPEED);
  });

  it('applyPlaybackSpeed ajusta correctamente playbackRate en el elemento de video', () => {
    const fakeVideo = { playbackRate: 1 };
    applyPlaybackSpeed(fakeVideo, 1.5);
    assert.equal(fakeVideo.playbackRate, 1.5);
  });

  it('applyPlaybackSpeed no lanza error si el elemento de video es nulo', () => {
    assert.doesNotThrow(() => {
      applyPlaybackSpeed(null, 1.25);
    });
  });
});
