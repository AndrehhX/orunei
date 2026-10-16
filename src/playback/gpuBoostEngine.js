/**
 * gpuBoostEngine.js
 * 
 * Motor WebGL2 de Alto Rendimiento para Reproductor de Anime:
 * - Frame Generation / Interpolación suave (28/30 FPS a 60 FPS+)
 * - Reescalado espacial con Nitidez Adaptativa al Contraste (CAS / AMD style)
 * - Detector de cortes bruscos de escena para prevenir artefactos
 * - Arquitectura no invasiva: Canvas fantasma superpuesto con pointer-events: none
 * - Watchdog de seguridad: Auto-fallback a reproducción normal si la GPU cae de 45 FPS o hay error de CORS
 */

export const GPU_BOOST_SETTINGS = {
  MIN_ACCEPTABLE_FPS: 45,
  FPS_MONITOR_WINDOW_MS: 3000,
  DEFAULT_SHARPNESS: 0.65,
  SCENE_CUT_THRESHOLD: 0.35,
};

/**
 * Comprueba si el entorno soporta WebGL2
 */
export function isWebGL2Supported() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2', { powerPreference: 'high-performance' });
    const supported = Boolean(gl);
    if (gl) {
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
    return supported;
  } catch {
    return false;
  }
}

const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 a_position;
out vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = vec2((a_position.x + 1.0) * 0.5, (1.0 - a_position.y) * 0.5);
}
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_texA;
uniform sampler2D u_texB;
uniform float u_factor;
uniform vec2 u_resolution;
uniform float u_sharpness;
uniform float u_sceneCutThreshold;
out vec4 fragColor;

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

vec3 applyCAS(sampler2D tex, vec2 uv, vec2 dx) {
  vec3 c = texture(tex, uv).rgb;
  vec3 n = texture(tex, uv + vec2(0.0, -dx.y)).rgb;
  vec3 s = texture(tex, uv + vec2(0.0, dx.y)).rgb;
  vec3 w = texture(tex, uv + vec2(-dx.x, 0.0)).rgb;
  vec3 e = texture(tex, uv + vec2(dx.x, 0.0)).rgb;

  float lumaC = luma(c);
  float lumaN = luma(n);
  float lumaS = luma(s);
  float lumaW = luma(w);
  float lumaE = luma(e);

  float minLuma = min(lumaC, min(min(lumaN, lumaS), min(lumaW, lumaE)));
  float maxLuma = max(lumaC, max(max(lumaN, lumaS), max(lumaW, lumaE)));

  float amp = clamp(min(minLuma, 2.0 - maxLuma) / max(maxLuma, 1e-5), 0.0, 1.0);
  float wCAS = -sqrt(amp) * 0.22 * u_sharpness;

  vec3 sharpened = (wCAS * (n + s + w + e) + c) / (1.0 + 4.0 * wCAS);
  return clamp(sharpened, 0.0, 1.0);
}

void main() {
  vec2 dx = 1.0 / max(u_resolution, vec2(1.0));

  vec3 colA = texture(u_texA, v_texCoord).rgb;
  vec3 colB = texture(u_texB, v_texCoord).rgb;

  // Detección de cambio de escena
  float diff = abs(luma(colA) - luma(colB));
  float factor = u_factor;
  if (diff > u_sceneCutThreshold) {
    factor = 1.0;
  }

  // Estimación de movimiento local
  vec3 gradAx = texture(u_texA, v_texCoord + vec2(dx.x, 0.0)).rgb - texture(u_texA, v_texCoord - vec2(dx.x, 0.0)).rgb;
  vec3 gradAy = texture(u_texA, v_texCoord + vec2(0.0, dx.y)).rgb - texture(u_texA, v_texCoord - vec2(0.0, dx.y)).rgb;
  float dI = luma(colB) - luma(colA);
  vec2 grad = vec2(luma(gradAx), luma(gradAy));
  float gradSq = dot(grad, grad) + 0.002;
  vec2 motion = clamp(-(dI / gradSq) * grad * dx * 2.0, -dx * 4.0, dx * 4.0);

  vec2 uvA = v_texCoord + motion * factor;
  vec2 uvB = v_texCoord - motion * (1.0 - factor);

  vec3 sharpA = applyCAS(u_texA, uvA, dx);
  vec3 sharpB = applyCAS(u_texB, uvB, dx);

  vec3 finalColor = mix(sharpA, sharpB, factor);
  fragColor = vec4(finalColor, 1.0);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failed: ${info}`);
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`WebGL program linking failed: ${info}`);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

function createEmptyTexture(gl) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // Pixel 1x1 inicial negro
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  return tex;
}

/**
 * Inicializa y administra el ciclo de vida del acelerador GPU Boost
 */
export function createGpuBoostEngine({
  video,
  container,
  sharpness = GPU_BOOST_SETTINGS.DEFAULT_SHARPNESS,
  onFpsUpdate,
  onPerformanceDrop,
  onError,
}) {
  if (!video || !container) {
    throw new Error('video and container are required to initialize GPU Boost');
  }

  if (!isWebGL2Supported()) {
    onError?.(new Error('WebGL2 no está soportado en este dispositivo'));
    return null;
  }

  // 1. Capa visual fantasma en el DOM con pointer-events: none
  let canvas = container.querySelector('#gpu-upscaler-layer');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'gpu-upscaler-layer';
    canvas.className = 'absolute inset-0 w-full h-full object-contain pointer-events-none z-10';
    canvas.style.display = 'block';
    // Insertar justo después del elemento de video para mantener controles por encima
    if (video.nextSibling) {
      container.insertBefore(canvas, video.nextSibling);
    } else {
      container.appendChild(canvas);
    }
  } else {
    canvas.style.display = 'block';
  }

  let gl = null;
  try {
    gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
  } catch (e) {
    onError?.(e);
    canvas.style.display = 'none';
    return null;
  }

  if (!gl) {
    onError?.(new Error('No se pudo inicializar el contexto WebGL2'));
    canvas.style.display = 'none';
    return null;
  }

  let program = null;
  let quadBuffer = null;
  let textureA = null;
  let textureB = null;

  try {
    program = createProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
    gl.useProgram(program);

    // Quad de pantalla completa
    const quadVertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    textureA = createEmptyTexture(gl);
    textureB = createEmptyTexture(gl);
  } catch (err) {
    onError?.(err);
    canvas.style.display = 'none';
    return null;
  }

  const uTexALoc = gl.getUniformLocation(program, 'u_texA');
  const uTexBLoc = gl.getUniformLocation(program, 'u_texB');
  const uFactorLoc = gl.getUniformLocation(program, 'u_factor');
  const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
  const uSharpnessLoc = gl.getUniformLocation(program, 'u_sharpness');
  const uSceneCutLoc = gl.getUniformLocation(program, 'u_sceneCutThreshold');

  gl.uniform1i(uTexALoc, 0);
  gl.uniform1i(uTexBLoc, 1);
  gl.uniform1f(uSharpnessLoc, sharpness);
  gl.uniform1f(uSceneCutLoc, GPU_BOOST_SETTINGS.SCENE_CUT_THRESHOLD);

  // Variables de sincronización dual-clock
  let isDestroyed = false;
  let rafId = null;
  let videoFrameCallbackId = null;
  let lastVideoFrameTime = performance.now();
  let prevVideoFrameTime = lastVideoFrameTime;
  let frameInterval = 1000 / 30; // ~33ms inicial
  let hasFirstFrame = false;

  // Medición de FPS y Watchdog de rendimiento
  let frameCount = 0;
  let lastFpsCheckTime = performance.now();
  let lowFpsDuration = 0;

  function updateVideoTexture() {
    if (isDestroyed || !gl) return;
    try {
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        // Intercambiar texturas: Textura A = viejo cuadro, Textura B = nuevo cuadro
        const temp = textureA;
        textureA = textureB;
        textureB = temp;

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textureB);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

        prevVideoFrameTime = lastVideoFrameTime;
        lastVideoFrameTime = performance.now();
        const measuredInterval = lastVideoFrameTime - prevVideoFrameTime;
        if (measuredInterval > 10 && measuredInterval < 150) {
          frameInterval = measuredInterval;
        }
        hasFirstFrame = true;
      }
    } catch (err) {
      // Si ocurre error por CORS o seguridad, activar fallback seguro
      onError?.(err);
      destroy();
      return;
    }

    if ('requestVideoFrameCallback' in video && !isDestroyed) {
      videoFrameCallbackId = video.requestVideoFrameCallback(updateVideoTexture);
    }
  }

  // Fallback si requestVideoFrameCallback no está disponible
  let lastSeenCurrentTime = -1;
  function checkFallbackVideoFrame() {
    if (!('requestVideoFrameCallback' in video) && video.currentTime !== lastSeenCurrentTime) {
      lastSeenCurrentTime = video.currentTime;
      updateVideoTexture();
    }
  }

  function render(now) {
    if (isDestroyed || !gl) return;

    // Freno de emergencia si la pestaña no es visible o el video está pausado
    if (document.hidden || video.paused || video.ended) {
      rafId = requestAnimationFrame(render);
      return;
    }

    checkFallbackVideoFrame();

    // Sincronizar dimensiones del canvas con el video nativo
    const width = video.videoWidth || video.clientWidth || 1280;
    const height = video.videoHeight || video.clientHeight || 720;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uResolutionLoc, width, height);
    }

    if (hasFirstFrame) {
      // Calcular factor de interpolación t entre 0.0 y 1.0
      const elapsed = now - lastVideoFrameTime;
      const factor = Math.max(0.0, Math.min(1.0, elapsed / Math.max(frameInterval, 16.0)));

      gl.uniform1f(uFactorLoc, factor);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textureA);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, textureB);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // Monitoreo de FPS
    frameCount++;
    const timeSinceLastFps = now - lastFpsCheckTime;
    if (timeSinceLastFps >= 1000) {
      const currentFps = Math.round((frameCount * 1000) / timeSinceLastFps);
      onFpsUpdate?.(currentFps);

      if (currentFps < GPU_BOOST_SETTINGS.MIN_ACCEPTABLE_FPS && !video.paused) {
        lowFpsDuration += timeSinceLastFps;
        if (lowFpsDuration >= GPU_BOOST_SETTINGS.FPS_MONITOR_WINDOW_MS) {
          // La GPU del usuario no alcanza los 45 FPS -> Auto-apagado seguro
          onPerformanceDrop?.({ fps: currentFps });
          destroy();
          return;
        }
      } else {
        lowFpsDuration = 0;
      }

      frameCount = 0;
      lastFpsCheckTime = now;
    }

    rafId = requestAnimationFrame(render);
  }

  // Iniciar sincronización de cuadros
  if ('requestVideoFrameCallback' in video) {
    videoFrameCallbackId = video.requestVideoFrameCallback(updateVideoTexture);
  } else {
    video.addEventListener('timeupdate', updateVideoTexture);
  }

  rafId = requestAnimationFrame(render);

  function destroy() {
    if (isDestroyed) return;
    isDestroyed = true;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    if (videoFrameCallbackId && 'cancelVideoFrameCallback' in video) {
      video.cancelVideoFrameCallback(videoFrameCallbackId);
      videoFrameCallbackId = null;
    }

    video.removeEventListener('timeupdate', updateVideoTexture);

    if (canvas) {
      canvas.style.display = 'none';
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }

    if (gl) {
      try {
        if (textureA) gl.deleteTexture(textureA);
        if (textureB) gl.deleteTexture(textureB);
        if (quadBuffer) gl.deleteBuffer(quadBuffer);
        if (program) gl.deleteProgram(program);
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      } catch {}
      gl = null;
    }
  }

  return {
    destroy,
    getCanvas: () => canvas,
    setSharpness: (newSharpness) => {
      if (gl && program) {
        gl.useProgram(program);
        gl.uniform1f(uSharpnessLoc, newSharpness);
      }
    },
  };
}
