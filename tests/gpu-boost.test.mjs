import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isWebGL2Supported,
  createGpuBoostEngine,
  GPU_BOOST_SETTINGS,
  computeInterpolationFactor,
  detectSceneCut,
  computeCASSample,
  generateInterpolatedPixel,
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

test('Frame Generation: computeInterpolationFactor genera cuadros intermedios precisos para 60 FPS', () => {
  const frameInterval30Fps = 1000 / 30; // 33.33ms entre cuadros nativos
  const lastFrameTime = 1000;

  // Cuadro inicial idéntico (t = 0)
  const factorStart = computeInterpolationFactor(1000, lastFrameTime, frameInterval30Fps);
  assert.equal(factorStart, 0.0);

  // Cuadro intermedio inventado a mitad de camino (t = 16.66ms -> 60 Hz)
  const midTime = lastFrameTime + frameInterval30Fps / 2;
  const factorMid = computeInterpolationFactor(midTime, lastFrameTime, frameInterval30Fps);
  assert.ok(Math.abs(factorMid - 0.5) < 0.01, `Factor intermedio esperado ~0.5, obtenido: ${factorMid}`);

  // Cuadro final completado (t = 33.33ms)
  const factorEnd = computeInterpolationFactor(lastFrameTime + frameInterval30Fps, lastFrameTime, frameInterval30Fps);
  assert.ok(Math.abs(factorEnd - 1.0) < 0.0001, `Factor final esperado ~1.0, obtenido: ${factorEnd}`);

  // Seguridad ante saltos temporales extremos: clamping estricto [0.0, 1.0]
  assert.equal(computeInterpolationFactor(lastFrameTime - 50, lastFrameTime, frameInterval30Fps), 0.0);
  assert.equal(computeInterpolationFactor(lastFrameTime + 200, lastFrameTime, frameInterval30Fps), 1.0);
});

test('Detector de cortes bruscos de escena (Scene Cut): previene artefactos de interpolación', () => {
  // Caso 1: Cambio abrupto de cámara (habitación oscura a exterior soleado)
  const colA_Oscuro = [0.05, 0.05, 0.08]; // ~0.05 luminancia
  const colB_Claro = [0.92, 0.90, 0.85];   // ~0.90 luminancia
  const isCut = detectSceneCut(colA_Oscuro, colB_Claro, GPU_BOOST_SETTINGS.SCENE_CUT_THRESHOLD);
  assert.equal(isCut, true, 'Debe detectar corte de escena brusco para no hacer blending');

  // Caso 2: Movimiento y paneo continuo en anime
  const colA_Paneo = [0.45, 0.50, 0.55];
  const colB_Paneo = [0.48, 0.52, 0.56];
  const isCutContinuous = detectSceneCut(colA_Paneo, colB_Paneo, GPU_BOOST_SETTINGS.SCENE_CUT_THRESHOLD);
  assert.equal(isCutContinuous, false, 'No debe confundir movimiento de cámara con corte de escena');
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
  // El filtro CAS profundiza la nitidez del trazo oscuro hacia el borde
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

test('Demostración de Frame Generation Real: el fotograma generado a t=0.5 es nuevo y visualmente distinto de A y B', () => {
  // Simulamos un cuadro A donde un trazo de anime o personaje está en posición A
  const pixelA = [0.10, 0.12, 0.14]; // Trazo oscuro inicial
  const pixelB = [0.85, 0.88, 0.90]; // Fondo claro hacia donde se desplazó

  // 1. A t = 0.0 (fotograma A nativo)
  const atStart = generateInterpolatedPixel({ pixelA, pixelB, factor: 0.0 });
  assert.deepEqual(atStart, pixelA);

  // 2. A t = 1.0 (fotograma B nativo)
  const atEnd = generateInterpolatedPixel({ pixelA, pixelB, factor: 1.0 });
  assert.deepEqual(atEnd, pixelB);

  // 3. A t = 0.5 (fotograma intermedio sintetizado a 60 FPS)
  const atMid = generateInterpolatedPixel({ pixelA, pixelB, factor: 0.5 });

  // Comprobar matemáticamente que NO es simplemente una copia de A ni de B
  assert.notDeepEqual(atMid, pixelA, 'El cuadro intermedio NO debe ser idéntico al cuadro anterior A');
  assert.notDeepEqual(atMid, pixelB, 'El cuadro intermedio NO debe ser idéntico al cuadro posterior B');

  // Comprobar que el píxel intermedio sintetizado está exactamente en el centro de la transición óptica
  const expectedR = (pixelA[0] + pixelB[0]) / 2;
  const expectedG = (pixelA[1] + pixelB[1]) / 2;
  const expectedB = (pixelA[2] + pixelB[2]) / 2;
  assert.ok(Math.abs(atMid[0] - expectedR) < 1e-4);
  assert.ok(Math.abs(atMid[1] - expectedG) < 1e-4);
  assert.ok(Math.abs(atMid[2] - expectedB) < 1e-4);
});

test('FidelityFX CAS: respeta estrictamente el rango Anti-Ringing de AMD sin sobreimpulso ni halos', () => {
  // Probamos un gradiente con bordes y contrastes extremos
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

  // Verificación de la garantía AMD Anti-Ringing:
  // El valor resultante NUNCA debe sobrepasar el rango del vecindario [min, max]
  assert.ok(casNormal >= minNeighbor, `El valor CAS (${casNormal}) no debe ser inferior al mínimo (${minNeighbor})`);
  assert.ok(casNormal <= maxNeighbor, `El valor CAS (${casNormal}) no debe superar el máximo (${maxNeighbor})`);
  assert.ok(casMax >= minNeighbor);
  assert.ok(casMax <= maxNeighbor);

  // A mayor nitidez configurada, mayor agudeza en el contraste local
  assert.notEqual(casNormal, center, 'El píxel en borde debe sufrir realce adaptativo de contraste');
});


