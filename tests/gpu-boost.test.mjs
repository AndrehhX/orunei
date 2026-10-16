import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isWebGL2Supported,
  createGpuBoostEngine,
  GPU_BOOST_SETTINGS,
} from '../src/playback/gpuBoostEngine.js';

test('isWebGL2Supported retorna false de forma segura si no hay document/window', () => {
  assert.equal(typeof isWebGL2Supported(), 'boolean');
});

test('GPU_BOOST_SETTINGS tiene umbral mínimo de 45 FPS y configuración segura', () => {
  assert.equal(GPU_BOOST_SETTINGS.MIN_ACCEPTABLE_FPS, 45);
  assert.equal(GPU_BOOST_SETTINGS.FPS_MONITOR_WINDOW_MS, 3000);
  assert.ok(GPU_BOOST_SETTINGS.DEFAULT_SHARPNESS > 0);
  assert.ok(GPU_BOOST_SETTINGS.SCENE_CUT_THRESHOLD > 0);
});

test('createGpuBoostEngine lanza error si faltan argumentos video o container', () => {
  assert.throws(() => {
    createGpuBoostEngine({ video: null, container: null });
  }, /video and container are required/);
});

test('createGpuBoostEngine retorna null e invoca onError si WebGL2 no está soportado', () => {
  let errorCaught = null;
  const fakeVideo = { addEventListener: () => {}, removeEventListener: () => {} };
  const fakeContainer = { appendChild: () => {}, querySelector: () => null };

  const engine = createGpuBoostEngine({
    video: fakeVideo,
    container: fakeContainer,
    onError: (err) => {
      errorCaught = err;
    },
  });

  assert.equal(engine, null);
  assert.ok(errorCaught instanceof Error);
});

test('createGpuBoostEngine inicializa canvas fantasma con pointer-events: none y z-index correcto', () => {
  let appendedCanvas = null;
  let removedCanvas = null;
  let shaderProgramCreated = false;
  let texturesCount = 0;

  const mockGl = {
    createShader: () => ({}),
    shaderSource: () => {},
    compileShader: () => {},
    getShaderParameter: () => true,
    createProgram: () => {
      shaderProgramCreated = true;
      return {};
    },
    attachShader: () => {},
    linkProgram: () => {},
    getProgramParameter: () => true,
    deleteShader: () => {},
    useProgram: () => {},
    createBuffer: () => ({}),
    bindBuffer: () => {},
    bufferData: () => {},
    getAttribLocation: () => 0,
    enableVertexAttribArray: () => {},
    vertexAttribPointer: () => {},
    createTexture: () => {
      texturesCount++;
      return {};
    },
    bindTexture: () => {},
    texParameteri: () => {},
    texImage2D: () => {},
    getUniformLocation: () => ({}),
    uniform1i: () => {},
    uniform1f: () => {},
    uniform2f: () => {},
    activeTexture: () => {},
    drawArrays: () => {},
    viewport: () => {},
    deleteTexture: () => {},
    deleteBuffer: () => {},
    deleteProgram: () => {},
    getExtension: () => null,
  };

  const fakeCanvas = {
    id: '',
    className: '',
    style: {},
    getContext: (type) => {
      if (type === 'webgl2') return mockGl;
      return null;
    },
    parentNode: null,
  };

  globalThis.document = {
    createElement: (tag) => {
      if (tag === 'canvas') return { ...fakeCanvas };
      return {};
    },
    hidden: false,
  };

  globalThis.window = {};
  globalThis.requestAnimationFrame = () => 123;
  globalThis.cancelAnimationFrame = () => {};

  const fakeContainer = {
    querySelector: () => null,
    insertBefore: (el) => {
      appendedCanvas = el;
      el.parentNode = fakeContainer;
    },
    appendChild: (el) => {
      appendedCanvas = el;
      el.parentNode = fakeContainer;
    },
    removeChild: (el) => {
      removedCanvas = el;
    },
  };

  const fakeVideo = {
    videoWidth: 1920,
    videoHeight: 1080,
    readyState: 4,
    paused: false,
    ended: false,
    currentTime: 10,
    nextSibling: null,
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  const engine = createGpuBoostEngine({
    video: fakeVideo,
    container: fakeContainer,
  });

  assert.ok(engine !== null);
  assert.equal(shaderProgramCreated, true);
  assert.ok(texturesCount >= 2);
  assert.ok(appendedCanvas);
  assert.equal(appendedCanvas.id, 'gpu-upscaler-layer');
  assert.ok(appendedCanvas.className.includes('pointer-events-none'));
  assert.ok(appendedCanvas.className.includes('z-10'));

  // Probar destrucción limpia
  engine.destroy();
  assert.ok(removedCanvas);
  assert.equal(removedCanvas.style.display, 'none');

  // Limpiar mocks globales
  delete globalThis.document;
  delete globalThis.window;
  delete globalThis.requestAnimationFrame;
  delete globalThis.cancelAnimationFrame;
});
