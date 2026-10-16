/**
 * gpuBoostEngine.js
 * 
 * Motor WebGL2 Premium de Mejora de Imagen y Reescalado 4K para Anime
 * Combina la formulación de AMD FidelityFX CAS con el algoritmo de reconstrucción
 * de trazos Anime4K (Line Thinning & Darkening + Micro-contraste Blu-ray):
 * 
 * 1. Super-resolución a nivel de viewport físico (1080p, 2K, 4K) para eliminar
 *    el desenfoque por estiramiento bilineal del navegador.
 * 2. Operador Sobel 3x3 de gradiente de luminancia para detectar contornos y line-art.
 * 3. Afilado y adelgazamiento de líneas (Anime4K) para transformar trazos gruesos y
 *    borrosos de 720p/1080p en líneas finas, oscuras y nítidas como un Blu-ray master.
 * 4. AMD FidelityFX CAS con Anti-Ringing estricto para evitar halos blancos.
 * 5. Curva de micro-contraste y viveza de color para eliminar el velo grisáceo de la compresión web.
 * 6. Protección absoluta de fondos y cielos homogéneos (cero ruido ni grano).
 * 7. Arquitectura no invasiva: Canvas fantasma superpuesto con pointer-events: none.
 * 8. Freno de seguridad: Pausa automática en segundo plano y watchdog si la GPU cae de 45 FPS.
 */

export const GPU_BOOST_SETTINGS = {
  MIN_ACCEPTABLE_FPS: 45,
  FPS_MONITOR_WINDOW_MS: 3000,
  DEFAULT_SHARPNESS: 1.0, // Nivel óptimo Ultra HD Blu-ray
  DEFAULT_MODE: 'ultra',
};

export const GPU_BOOST_MODES = [
  { id: 'balanced', label: 'Equilibrado', sharpness: 0.65, description: 'AMD CAS Suave' },
  { id: 'ultra', label: 'Ultra Blu-ray (4K)', sharpness: 1.0, description: 'Anime4K + Máxima Definición' },
  { id: 'extreme', label: 'Extremo 4K', sharpness: 1.35, description: 'Trazos extra definidos' },
];

/**
 * Cálculo de luminancia estándar HDTV (ITU-R BT.709)
 */
export function getLuma([r, g, b]) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Reescalado espacial con Nitidez Adaptativa al Contraste (FidelityFX CAS)
 * Mantenido para retrocompatibilidad y pruebas unitarias de AMD CAS puro.
 */
export function computeCASSample(c, n, s, w, e, sharpness = GPU_BOOST_SETTINGS.DEFAULT_SHARPNESS) {
  const peak = 0.125 + (0.20 - 0.125) * Math.max(0, Math.min(1.5, sharpness));

  if (typeof c === 'number') {
    const minVal = Math.min(c, n, s, w, e);
    const maxVal = Math.max(c, n, s, w, e);
    const amp = Math.max(0, Math.min(1, Math.min(minVal, 2.0 - maxVal) / Math.max(maxVal, 1e-4)));
    const wCAS = -Math.sqrt(amp) * peak;
    const unconstrained = (wCAS * (n + s + w + e) + c) / (1.0 + 4.0 * wCAS);
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
 * Motor completo de Reescalado Premium Anime (Anime4K + CAS + Anti-Ringing + Vibrancy)
 * Modelo matemático ejecutable en CPU para pruebas unitarias.
 */
export function computeAnime4KSample({
  c, tl, tc, tr, ml, mr, bl, bc, br,
  sharpness = GPU_BOOST_SETTINGS.DEFAULT_SHARPNESS,
}) {
  const l_tl = getLuma(tl); const l_tc = getLuma(tc); const l_tr = getLuma(tr);
  const l_ml = getLuma(ml); const l_mr = getLuma(mr);
  const l_bl = getLuma(bl); const l_bc = getLuma(bc); const l_br = getLuma(br);

  // 1. Detección de trazos mediante operador Sobel 3x3
  const dX = (l_tr + 2.0 * l_mr + l_br) - (l_tl + 2.0 * l_ml + l_bl);
  const dY = (l_bl + 2.0 * l_bc + l_br) - (l_tl + 2.0 * l_tc + l_tr);
  const gradMag = Math.sqrt(dX * dX + dY * dY);

  // 2. Límites locales para Anti-Ringing
  const min_rgb = [0, 1, 2].map((i) => Math.min(
    c[i], tl[i], tc[i], tr[i], ml[i], mr[i], bl[i], bc[i], br[i]
  ));
  const max_rgb = [0, 1, 2].map((i) => Math.max(
    c[i], tl[i], tc[i], tr[i], ml[i], mr[i], bl[i], bc[i], br[i]
  ));

  // 3. CAS de Alta Definición
  const peak = 0.20 + (0.40 - 0.20) * Math.min(1.5, Math.max(0, sharpness));
  const cas = [0, 1, 2].map((i) => {
    const minVal = min_rgb[i];
    const maxVal = max_rgb[i];
    const amp = Math.max(0, Math.min(1, Math.min(minVal, 2.0 - maxVal) / Math.max(maxVal, 1e-4)));
    const w = -Math.sqrt(amp) * peak;
    const laplacian = (tc[i] + ml[i] + mr[i] + bc[i]) * 0.20 + (tl[i] + tr[i] + bl[i] + br[i]) * 0.05;
    const unconstrained = (c[i] + w * 4.0 * laplacian) / (1.0 + w * 4.0);
    return Math.max(minVal, Math.min(maxVal, unconstrained));
  });

  let result = [...cas];

  // 4. Line Thinning & Darkening de Anime4K (solo en trazos y bordes)
  if (gradMag > 0.05) {
    const len = Math.max(gradMag, 1e-4);
    const dirX = dX / len;
    const samplePos = dirX > 0 ? mr : ml;
    const sampleNeg = dirX > 0 ? ml : mr;
    const l_pos = getLuma(samplePos);
    const l_neg = getLuma(sampleNeg);

    const darkSample = l_pos < l_neg ? samplePos : sampleNeg;
    const lineWeight = Math.min(1.0, (gradMag - 0.05) * 3.0) * Math.min(1.5, sharpness);

    result = result.map((val, i) => {
      const thinned = val * (1.0 - 0.60 * lineWeight) + Math.min(val, darkSample[i]) * (0.60 * lineWeight);
      return Math.max(min_rgb[i] * 0.85, Math.min(max_rgb[i], thinned));
    });
  }

  // 5. Micro-contraste y color Blu-ray
  const curved = result.map((v) => v * v * (3.0 - 2.0 * v));
  const vibrancy = 0.14 * Math.min(1.5, sharpness);
  return result.map((v, i) => v * (1.0 - vibrancy) + curved[i] * vibrancy);
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
uniform vec2 u_sourceResolution;
uniform vec2 u_targetResolution;
uniform float u_sharpness;
out vec4 fragColor;

float getLuma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  // texel en el espacio nativo de la textura del video
  vec2 texel = 1.0 / max(u_sourceResolution, vec2(1.0));
  vec2 uv = v_texCoord;

  // 1. Muestreo 3x3 del vecindario
  vec3 c  = texture(u_tex, uv).rgb;
  vec3 tl = texture(u_tex, uv + vec2(-texel.x, -texel.y)).rgb;
  vec3 tc = texture(u_tex, uv + vec2( 0.0,     -texel.y)).rgb;
  vec3 tr = texture(u_tex, uv + vec2( texel.x, -texel.y)).rgb;
  vec3 ml = texture(u_tex, uv + vec2(-texel.x,  0.0)).rgb;
  vec3 mr = texture(u_tex, uv + vec2( texel.x,  0.0)).rgb;
  vec3 bl = texture(u_tex, uv + vec2(-texel.x,  texel.y)).rgb;
  vec3 bc = texture(u_tex, uv + vec2( 0.0,      texel.y)).rgb;
  vec3 br = texture(u_tex, uv + vec2( texel.x,  texel.y)).rgb;

  // 2. Luminancias
  float l_tl = getLuma(tl); float l_tc = getLuma(tc); float l_tr = getLuma(tr);
  float l_ml = getLuma(ml); float l_mr = getLuma(mr);
  float l_bl = getLuma(bl); float l_bc = getLuma(bc); float l_br = getLuma(br);

  // 3. Operador Sobel para detección de líneas y contornos
  float dX = (l_tr + 2.0 * l_mr + l_br) - (l_tl + 2.0 * l_ml + l_bl);
  float dY = (l_bl + 2.0 * l_bc + l_br) - (l_tl + 2.0 * l_tc + l_tr);
  float gradMag = length(vec2(dX, dY));

  // 4. Límites locales para Anti-Ringing estricto
  vec3 min_rgb = min(min(min(min(tl, tc), min(tr, ml)), min(min(mr, bl), min(bc, br))), c);
  vec3 max_rgb = max(max(max(max(tl, tc), max(tr, ml)), max(max(mr, bl), max(bc, br))), c);

  // 5. Motor CAS (Contrast Adaptive Sharpening)
  vec3 amp_rgb = clamp(min(min_rgb, vec3(2.0) - max_rgb) / max(max_rgb, vec3(1e-4)), 0.0, 1.0);
  float peak = mix(0.20, 0.40, clamp(u_sharpness, 0.0, 1.5));
  vec3 w_rgb = -sqrt(amp_rgb) * peak;

  vec3 laplacian = (tc + ml + mr + bc) * 0.20 + (tl + tr + bl + br) * 0.05;
  vec3 cas = (c + w_rgb * 4.0 * laplacian) / (vec3(1.0) + w_rgb * 4.0);
  cas = clamp(cas, min_rgb, max_rgb);

  vec3 result = cas;

  // 6. Reconstrucción y afilado de trazos Anime (Anime4K Line Darkening & Thinning)
  if (gradMag > 0.05) {
    vec2 dir = vec2(dX, dY) / max(gradMag, 1e-4);
    
    vec3 samplePos = texture(u_tex, uv + dir * texel * 0.55).rgb;
    vec3 sampleNeg = texture(u_tex, uv - dir * texel * 0.55).rgb;
    float l_pos = getLuma(samplePos);
    float l_neg = getLuma(sampleNeg);

    vec3 darkSample = (l_pos < l_neg) ? samplePos : sampleNeg;
    float lineWeight = clamp((gradMag - 0.05) * 3.0, 0.0, 1.0) * clamp(u_sharpness, 0.0, 1.5);

    vec3 thinned = mix(result, min(result, darkSample), 0.60 * lineWeight);
    result = clamp(thinned, min_rgb * 0.85, max_rgb);
  }

  // 7. Micro-contraste y color Blu-ray
  vec3 curved = result * result * (vec3(3.0) - 2.0 * result);
  float vibrancy = 0.14 * clamp(u_sharpness, 0.0, 1.5);
  result = mix(result, curved, vibrancy);

  fragColor = vec4(result, 1.0);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Error compilando shader WebGL2: ${info}`);
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`Error enlazando programa WebGL2: ${info}`);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return prog;
}

function createEmptyTexture(gl) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  return tex;
}

/**
 * Inicializa y administra el ciclo de vida del acelerador de Reescalado Premium Anime 4K
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

  let currentSharpness = sharpness;

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
  const uSourceResLoc = gl.getUniformLocation(program, 'u_sourceResolution');
  const uTargetResLoc = gl.getUniformLocation(program, 'u_targetResolution');
  const uSharpnessLoc = gl.getUniformLocation(program, 'u_sharpness');

  gl.uniform1i(uTexLoc, 0);
  gl.uniform1f(uSharpnessLoc, currentSharpness);

  let isDestroyed = false;
  let rafId = null;

  let frameCount = 0;
  let lastFpsCheckTime = performance.now();
  let lowFpsDuration = 0;

  function render(now) {
    if (isDestroyed || !gl) return;

    if (document.hidden || video.paused || video.ended) {
      rafId = requestAnimationFrame(render);
      return;
    }

    // Super-resolución: calcular resolución física del canvas según el viewport y DPR de pantalla
    const containerW = container.clientWidth || video.clientWidth || 1280;
    const containerH = container.clientHeight || video.clientHeight || 720;
    const dpr = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 2.0);
    const targetWidth = Math.max(1280, Math.round(containerW * dpr));
    const targetHeight = Math.max(720, Math.round(containerH * dpr));

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      gl.viewport(0, 0, targetWidth, targetHeight);
      if (uTargetResLoc) gl.uniform2f(uTargetResLoc, targetWidth, targetHeight);
    }

    const srcW = video.videoWidth || 1280;
    const srcH = video.videoHeight || 720;
    if (uSourceResLoc) gl.uniform2f(uSourceResLoc, srcW, srcH);

    try {
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, videoTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    } catch (err) {
      onError?.(err);
      destroy();
      return;
    }

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
      currentSharpness = newSharpness;
      if (gl && program && uSharpnessLoc) {
        gl.useProgram(program);
        gl.uniform1f(uSharpnessLoc, newSharpness);
      }
    },
    getSharpness: () => currentSharpness,
  };
}
