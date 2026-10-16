import test from 'node:test';
import assert from 'node:assert/strict';
import { isPiPSupported, togglePiP } from '../src/playback/useVideoGestures.js';

test('isPiPSupported retorna false de forma segura si no está disponible en el entorno', () => {
  // En node no existe document por defecto
  assert.equal(isPiPSupported(), false);
});

test('togglePiP maneja elementos nulos sin lanzar excepciones', async () => {
  const result = await togglePiP(null);
  assert.equal(result, false);
});

test('togglePiP invoca requestPictureInPicture cuando está habilitado en document', async () => {
  let requested = false;
  globalThis.document = {
    pictureInPictureEnabled: true,
    pictureInPictureElement: null,
  };
  const fakeVideo = {
    requestPictureInPicture: async () => {
      requested = true;
      return {};
    },
  };

  const ok = await togglePiP(fakeVideo);
  assert.equal(ok, true);
  assert.equal(requested, true);

  // Limpiar mock
  delete globalThis.document;
});
