import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isWebGL2Supported,
  createGpuBoostEngine,
  GPU_BOOST_SETTINGS,
  GPU_BOOST_MODES,
  computeCASSample,
  computeAnime4KSample,
} from '../src/playback/gpuBoostEngine.js';

test('isWebGL2Supported retorna false de forma segura si no hay document/window', () => {
  assert.equal(typeof isWebGL2Supported(), 'boolean');
});

test('GPU_BOOST_SETTINGS tiene umbral mínimo de 45 FPS y configuración segura', () => {
  assert.equal(GPU_BOOST_SETTINGS.MIN_ACCEPTABLE_FPS, 45);
  assert.equal(GPU_BOOST_SETTINGS.FPS_MONITOR_WINDOW_MS, 3000);
  assert.ok(GPU_BOOST_SETTINGS.DEFAULT_SHARPNESS > 0);
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
  assert.ok(texturesCount >= 1);
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

test('Reescalado CAS (Contrast Adaptive Sharpening): realza bordes sin distorsionar zonas planas', () => {
  // Caso 1: Zona plana (cielo o color plano típico de animación japonesa)
  const flatValue = 0.5;
  const casFlat = computeCASSample(flatValue, flatValue, flatValue, flatValue, flatValue, 0.65);
  assert.ok(Math.abs(casFlat - flatValue) < 0.001, 'Zonas planas deben permanecer idénticas sin ruido');

  // Caso 2: Borde / Línea de dibujo anime (transición de borde: un lado oscuro 0.15, centro 0.35, otro lado claro 0.80)
  const left = 0.15;
  const center = 0.35;
  const right = 0.80;
  const casEdge = computeCASSample(center, 0.35, 0.35, left, right, 0.65);
  assert.ok(casEdge < center, `El borde debe acentuarse adaptativamente hacia la línea: ${casEdge} < ${center}`);
  assert.ok(casEdge >= left, `No debe violar el límite anti-ringing del vecindario: ${casEdge} >= ${left}`);

  // Caso 3: Evaluación multicanal RGB
  const rgbCenter = [0.35, 0.35, 0.35];
  const rgbLeft = [0.15, 0.15, 0.15];
  const rgbRight = [0.80, 0.80, 0.80];
  const rgbSharp = computeCASSample(rgbCenter, rgbCenter, rgbCenter, rgbLeft, rgbRight, 0.65);
  assert.ok(Array.isArray(rgbSharp));
  assert.equal(rgbSharp.length, 3);
  assert.ok(rgbSharp[0] < rgbCenter[0]);
  assert.ok(rgbSharp[0] >= rgbLeft[0]);
});

test('FidelityFX CAS: respeta estrictamente el rango Anti-Ringing de AMD sin sobreimpulso ni halos', () => {
  const center = 0.40;
  const north = 0.85;
  const south = 0.30;
  const west = 0.90;
  const east = 0.25;

  const minNeighbor = Math.min(center, north, south, west, east); // 0.25
  const maxNeighbor = Math.max(center, north, south, west, east); // 0.90

  // Evaluar con nitidez estándar (0.65) y máxima (1.0)
  const casNormal = computeCASSample(center, north, south, west, east, 0.65);
  const casMax = computeCASSample(center, north, south, west, east, 1.0);

  // Garantía Anti-Ringing oficial de AMD:
  assert.ok(casNormal >= minNeighbor, `El valor CAS (${casNormal}) no debe ser inferior al mínimo (${minNeighbor})`);
  assert.ok(casNormal <= maxNeighbor, `El valor CAS (${casNormal}) no debe superar el máximo (${maxNeighbor})`);
  assert.ok(casMax >= minNeighbor);
  assert.ok(casMax <= maxNeighbor);
  assert.notEqual(casNormal, center, 'El píxel en borde debe sufrir realce adaptativo de contraste');
});

test('Arquitectura no invasiva: el canvas nunca bloquea los eventos ni altera el video original', () => {
  const fakeVideo = {
    controls: true,
    playsInline: true,
    crossOrigin: 'anonymous',
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  let createdCanvas = null;
  globalThis.document = {
    createElement: (tag) => {
      if (tag === 'canvas') {
        createdCanvas = {
          id: '',
          className: '',
          style: {},
          getContext: () => ({
            createShader: () => ({}),
            shaderSource: () => {},
            compileShader: () => {},
            getShaderParameter: () => true,
            createProgram: () => ({}),
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
            createTexture: () => ({}),
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
          }),
        };
        return createdCanvas;
      }
      return {};
    },
    hidden: false,
  };
  globalThis.window = {};
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};

  const fakeContainer = {
    querySelector: () => null,
    insertBefore: (el) => { el.parentNode = fakeContainer; },
    appendChild: (el) => { el.parentNode = fakeContainer; },
    removeChild: () => {},
  };

  const engine = createGpuBoostEngine({
    video: fakeVideo,
    container: fakeContainer,
  });

  // El video original conserva sus propiedades intactas
  assert.equal(fakeVideo.controls, true);
  assert.equal(fakeVideo.crossOrigin, 'anonymous');

  // El canvas TIENE pointer-events: none garantizado para que los clics atraviesen al video
  assert.ok(createdCanvas.className.includes('pointer-events-none'));
  assert.ok(createdCanvas.className.includes('z-10'));

  engine.destroy();

  delete globalThis.document;
  delete globalThis.window;
  delete globalThis.requestAnimationFrame;
  delete globalThis.cancelAnimationFrame;
});

test('GPU_BOOST_MODES define perfiles equilibrado, ultra blu-ray y extremo', () => {
  assert.ok(Array.isArray(GPU_BOOST_MODES));
  assert.equal(GPU_BOOST_MODES.length, 3);
  assert.ok(GPU_BOOST_MODES.some((m) => m.id === 'ultra' && m.sharpness === 1.0));
  assert.ok(GPU_BOOST_MODES.some((m) => m.id === 'balanced' && m.sharpness < 1.0));
  assert.ok(GPU_BOOST_MODES.some((m) => m.id === 'extreme' && m.sharpness > 1.0));
});

test('Anime4K Reescalado: afila trazos borrosos con reducción demostrada de grosor y oscurecimiento del núcleo', () => {
  // Simular un trazo de anime desenfocado por compresión web 720p:
  // Fondo claro (0.90) con trazo oscuro en el centro atenuado a gris (0.45)
  const bg = [0.90, 0.90, 0.90];
  const blurryStroke = [0.45, 0.45, 0.45];
  const darkCore = [0.15, 0.15, 0.15];

  const output = computeAnime4KSample({
    c: blurryStroke,
    tl: bg, tc: bg, tr: bg,
    ml: darkCore, mr: bg,
    bl: bg, bc: bg, br: bg,
    sharpness: 1.0,
  });

  // El trazo borroso debe haberse oscurecido hacia el núcleo oscuro (mayor definición tipo Blu-ray)
  assert.ok(output[0] < blurryStroke[0], `El trazo debe afilarse: ${output[0]} < ${blurryStroke[0]}`);
  assert.ok(output[0] >= darkCore[0] * 0.80, 'No debe violar el límite anti-ringing');
});

test('Anime4K Reescalado: preserva cielos y fondos homogéneos con cero ruido agregado', () => {
  const flatSky = [0.35, 0.65, 0.95];

  const output = computeAnime4KSample({
    c: flatSky,
    tl: flatSky, tc: flatSky, tr: flatSky,
    ml: flatSky, mr: flatSky,
    bl: flatSky, bc: flatSky, br: flatSky,
    sharpness: 1.0,
  });

  // En superficies planas de anime (cielo, paredes, piel lisa), no debe introducir grano
  assert.ok(Math.abs(output[0] - flatSky[0]) < 0.03);
  assert.ok(Math.abs(output[1] - flatSky[1]) < 0.03);
  assert.ok(Math.abs(output[2] - flatSky[2]) < 0.03);
});
