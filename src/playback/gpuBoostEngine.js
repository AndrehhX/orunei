/**
 * gpuBoostEngine.js
 * 
 * Motor WebGL2 de Nitidez y Reescalado Adaptativo al Contraste (AMD FidelityFX CAS)
 * Diseñado específicamente para animación japonesa / Anime:
 * - Filtro oficial AMD FidelityFX CAS con garantía Anti-Ringing
 * - Realce de contraste adaptativo por canal RGB (profundiza el trazo sin halos)
 * - Inmunidad a ruido en superficies planas y fondos
 * - Cero artefactos de movimiento ni ghosting (procesamiento espacial directo)
 * - Arquitectura no invasiva: Canvas fantasma superpuesto con pointer-events: none
 * - Freno de seguridad: Pausa automática en segundo plano y watchdog de rendimiento
 */

export const GPU_BOOST_SETTINGS = {
  MIN_ACCEPTABLE_FPS: 45,
  FPS_MONITOR_WINDOW_MS: 3000,
  DEFAULT_SHARPNESS: 0.65,
};

/**
 * Reescalado espacial con Nitidez Adaptativa al Contraste (FidelityFX CAS)
 * Implementa la formulación exacta de AMD con clamp anti-ringing:
 * - Realce de contraste adaptativo por canal RGB.
 * - Cero sobreimpulso (anti-ringing clamp a [min, max] de vecindario).
 * - Cero ruido en superficies homogéneas.
 */
export function computeCASSample(c, n, s, w, e, sharpness = GPU_BOOST_SETTINGS.DEFAULT_SHARPNESS) {
  const peak = 0.125 + (0.20 - 0.125) * Math.max(0, Math.min(1, sharpness));

  if (typeof c === 'number') {
    const minVal = Math.min(c, n, s, w, e);
    const maxVal = Math.max(c, n, s, w, e);
    const amp = Math.max(0, Math.min(1, Math.min(minVal, 2.0 - maxVal) / Math.max(maxVal, 1e-4)));
    const wCAS = -Math.sqrt(amp) * peak;
    const unconstrained = (wCAS * (n + s + w + e) + c) / (1.0 + 4.0 * wCAS);
    // Garantía Anti-Ringing de AMD: confina estrictamente al rango del vecindario
    return Math.max(minVal, Math.min(maxVal, unconstrained));
  }

  return [0, 1, 2].map((channel) => {
    const cVal = c[channel], nVal = n[channel], sVal = s[channel], wVal = w[channel], eVal = e[channel];
    const minVal = Math.min(cVal, nVal, sVal, wVal, eVal);
    const maxVal = Math.max(cVal, nVal, sVal, wVal, eVal);
    const amp = Math.max(0, Math.min(1, Math.min(minVal, 2.0 - maxVal) / Math.max(maxVal, 1e-4)));
    const wCAS = -Math.sqrt(amp) * peak;
    const unconstrained = (wCAS * (nVal + sVal + wVal + eVal) + cVal) / (1.0 + 4.0 * wCAS);
    return Math.max(minVal, Math.min(maxVal, unconstrained));
  });
}

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
uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_sharpness;
out vec4 fragColor;

// Filtro oficial AMD FidelityFX CAS (Contrast Adaptive Sharpening)
vec3 applyCAS(sampler2D tex, vec2 uv, vec2 dx) {
  vec3 e = texture(tex, uv).rgb;
  vec3 b = texture(tex, uv + vec2(0.0, -dx.y)).rgb;
  vec3 h = texture(tex, uv + vec2(0.0, dx.y)).rgb;
  vec3 d = texture(tex, uv + vec2(-dx.x, 0.0)).rgb;
  vec3 f = texture(tex, uv + vec2(dx.x, 0.0)).rgb;

  // Vecindario 5-tap cross
  vec3 min_rgb = min(min(min(d, e), min(f, b)), h);
  vec3 max_rgb = max(max(max(d, e), max(f, b)), h);

  // Transferencia de contraste adaptativo por canal RGB (AMD CAS)
  vec3 amp_rgb = clamp(min(min_rgb, vec3(2.0) - max_rgb) / max(max_rgb, vec3(1e-4)), 0.0, 1.0);
  float peak = mix(0.125, 0.20, clamp(u_sharpness, 0.0, 1.0));
  vec3 w_rgb = -sqrt(amp_rgb) * peak;

  vec3 sharpened = (w_rgb * (b + d + f + h) + e) / (vec3(1.0) + 4.0 * w_rgb);
  // Clamp anti-ringing oficial de AMD: elimina halos y contornos artificiales
  return clamp(sharpened, min_rgb, max_rgb);
}

void main() {
  vec2 dx = 1.0 / max(u_resolution, vec2(1.0));
  vec3 color = applyCAS(u_tex, v_texCoord, dx);
  fragColor = vec4(color, 1.0);
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
 * Inicializa y administra el ciclo de vida del acelerador Nitidez Anime (AMD CAS)
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

  // Capa visual fantasma en el DOM con pointer-events: none
  let canvas = container.querySelector('#gpu-upscaler-layer');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'gpu-upscaler-layer';
    canvas.className = 'absolute inset-0 w-full h-full object-contain pointer-events-none z-10';
    canvas.style.display = 'block';
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
  let videoTexture = null;

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

    videoTexture = createEmptyTexture(gl);
  } catch (err) {
    onError?.(err);
    canvas.style.display = 'none';
    return null;
  }

  const uTexLoc = gl.getUniformLocation(program, 'u_tex');
  const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
  const uSharpnessLoc = gl.getUniformLocation(program, 'u_sharpness');

  gl.uniform1i(uTexLoc, 0);
  gl.uniform1f(uSharpnessLoc, sharpness);

  let isDestroyed = false;
  let rafId = null;

  // Medición de FPS y Watchdog de rendimiento
  let frameCount = 0;
  let lastFpsCheckTime = performance.now();
  let lowFpsDuration = 0;

  function render(now) {
    if (isDestroyed || !gl) return;

    // Freno de emergencia si la pestaña no es visible o el video está pausado
    if (document.hidden || video.paused || video.ended) {
      rafId = requestAnimationFrame(render);
      return;
    }

    // Sincronizar dimensiones del canvas con el video nativo
    const width = video.videoWidth || video.clientWidth || 1280;
    const height = video.videoHeight || video.clientHeight || 720;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uResolutionLoc, width, height);
    }

    try {
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, videoTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    } catch (err) {
      // Si ocurre error por CORS de video o seguridad, activar fallback seguro
      onError?.(err);
      destroy();
      return;
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

  rafId = requestAnimationFrame(render);

  function destroy() {
    if (isDestroyed) return;
    isDestroyed = true;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    if (canvas) {
      canvas.style.display = 'none';
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }

    if (gl) {
      try {
        if (videoTexture) gl.deleteTexture(videoTexture);
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
