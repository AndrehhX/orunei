import test from 'node:test';
import assert from 'node:assert/strict';
import { handlePlayerKeydown, PLAYER_SHORTCUTS } from '../src/playback/keyboardShortcuts.js';

test('PLAYER_SHORTCUTS contiene la lista de atajos documentados', () => {
  assert.ok(Array.isArray(PLAYER_SHORTCUTS));
  assert.ok(PLAYER_SHORTCUTS.length >= 7);
  assert.ok(PLAYER_SHORTCUTS.some((s) => s.key.includes('Espacio')));
});

test('ignora eventos si el foco está en un input o textarea', () => {
  let playCalled = false;
  const mockVideo = { paused: true, play: () => { playCalled = true; } };
  const mockEvent = {
    key: ' ',
    target: { tagName: 'INPUT' },
    preventDefault: () => {},
  };

  const handled = handlePlayerKeydown({ event: mockEvent, video: mockVideo });
  assert.equal(handled, false);
  assert.equal(playCalled, false);
});

test('Espacio o tecla K alternan pausa/play en el video con feedback', () => {
  let paused = false;
  let feedback = null;
  const mockVideo = {
    paused: false,
    pause: () => { paused = true; },
    play: () => { paused = false; },
  };
  const mockEvent = {
    key: 'k',
    target: { tagName: 'DIV' },
    preventDefault: () => {},
  };

  const handled = handlePlayerKeydown({
    event: mockEvent,
    video: mockVideo,
    showFeedback: (fb) => { feedback = fb; },
  });

  assert.equal(handled, true);
  assert.equal(paused, true);
  assert.equal(feedback?.type, 'pause');
});

test('Flechas izquierda/derecha adelantan y retroceden 10s', () => {
  const mockVideo = {
    currentTime: 45,
    duration: 1200,
  };
  let feedback = null;

  // Izquierda: -10s
  handlePlayerKeydown({
    event: { key: 'ArrowLeft', target: { tagName: 'BODY' }, preventDefault: () => {} },
    video: mockVideo,
    showFeedback: (fb) => { feedback = fb; },
  });
  assert.equal(mockVideo.currentTime, 35);
  assert.equal(feedback?.direction, 'backward');

  // Derecha: +10s
  handlePlayerKeydown({
    event: { key: 'ArrowRight', target: { tagName: 'BODY' }, preventDefault: () => {} },
    video: mockVideo,
    showFeedback: (fb) => { feedback = fb; },
  });
  assert.equal(mockVideo.currentTime, 45);
  assert.equal(feedback?.direction, 'forward');
});

test('Tecla M silencia y restaura sonido con indicador de volumen', () => {
  const mockVideo = {
    muted: false,
    volume: 0.8,
  };
  let feedback = null;

  handlePlayerKeydown({
    event: { key: 'm', target: { tagName: 'BODY' }, preventDefault: () => {} },
    video: mockVideo,
    showFeedback: (fb) => { feedback = fb; },
  });
  assert.equal(mockVideo.muted, true);
  assert.equal(feedback?.value, 0);

  handlePlayerKeydown({
    event: { key: 'M', target: { tagName: 'BODY' }, preventDefault: () => {} },
    video: mockVideo,
    showFeedback: (fb) => { feedback = fb; },
  });
  assert.equal(mockVideo.muted, false);
  assert.equal(feedback?.value, 80);
});

test('Tecla S activa el callback onTriggerSkip cuando hay un activeSkip', () => {
  let skipTriggered = false;
  const mockSkip = { targetTime: 90, label: 'Saltar Intro' };

  const handled = handlePlayerKeydown({
    event: { key: 's', target: { tagName: 'BODY' }, preventDefault: () => {} },
    activeSkip: mockSkip,
    onTriggerSkip: () => { skipTriggered = true; },
  });

  assert.equal(handled, true);
  assert.equal(skipTriggered, true);
});
