/**
 * Minimal WebGL2 shader runner.
 *
 * Renders a fullscreen triangle with a user-supplied fragment shader that
 * receives:
 *   uniform vec2  iResolution;
 *   uniform float iTime;
 *   uniform vec2  iMouse;     // pixel coords; (0,0) when inactive
 *
 * The fragment writes to `vec4 fragColor`. We expose two conveniences:
 *   - `vUv`     : varying vec2 in [0,1]
 *   - main()    : declared by the user, expected to set fragColor
 */

const VERT = /* glsl */ `#version 300 es
precision highp float;
out vec2 vUv;
const vec2 pos[3] = vec2[3](
  vec2(-1.0, -1.0),
  vec2( 3.0, -1.0),
  vec2(-1.0,  3.0)
);
void main() {
  vec2 p = pos[gl_VertexID];
  vUv = (p + 1.0) * 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

const FRAG_PREAMBLE = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec2  iResolution;
uniform float iTime;
uniform vec2  iMouse;
`;

export type CompileError = { stage: "vertex" | "fragment" | "link"; log: string };

export type RunnerHandle = {
  canvas: HTMLCanvasElement;
  setSource: (frag: string) => CompileError | null;
  setMouse: (px: number, py: number) => void;
  start: () => void;
  stop: () => void;
  /** Read a single pixel in normalized [0,1] uv coords from the current frame. */
  readPixel: (u: number, v: number) => [number, number, number, number];
  /** Force-render once to a specific time without RAF (useful for validation). */
  renderAt: (timeSeconds: number) => void;
  dispose: () => void;
};

export function buildFragmentSource(userSource: string): string {
  return FRAG_PREAMBLE + "\n" + userSource;
}

export function createShaderRunner(canvas: HTMLCanvasElement): RunnerHandle | null {
  const ctx = canvas.getContext("webgl2", {
    antialias: false,
    preserveDrawingBuffer: true, // required for readPixels after raf
  });
  if (!ctx) return null;
  const gl: WebGL2RenderingContext = ctx;

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  let program: WebGLProgram | null = null;
  let uniLoc: {
    iResolution: WebGLUniformLocation | null;
    iTime: WebGLUniformLocation | null;
    iMouse: WebGLUniformLocation | null;
  } = { iResolution: null, iTime: null, iMouse: null };

  let raf = 0;
  let startTime = performance.now();
  let mouseX = 0;
  let mouseY = 0;
  let running = false;

  function compile(type: number, src: string): WebGLShader | string {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh) ?? "unknown error";
      gl.deleteShader(sh);
      return log;
    }
    return sh;
  }

  function setSource(userFrag: string): CompileError | null {
    const vs = compile(gl.VERTEX_SHADER, VERT);
    if (typeof vs === "string") return { stage: "vertex", log: vs };
    const fs = compile(gl.FRAGMENT_SHADER, buildFragmentSource(userFrag));
    if (typeof fs === "string") {
      gl.deleteShader(vs);
      return { stage: "fragment", log: fs };
    }
    const p = gl.createProgram()!;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(p) ?? "link failed";
      gl.deleteProgram(p);
      return { stage: "link", log };
    }
    if (program) gl.deleteProgram(program);
    program = p;
    uniLoc = {
      iResolution: gl.getUniformLocation(p, "iResolution"),
      iTime: gl.getUniformLocation(p, "iTime"),
      iMouse: gl.getUniformLocation(p, "iMouse"),
    };
    return null;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function draw(timeSeconds: number) {
    if (!program) return;
    resize();
    gl.useProgram(program);
    gl.uniform2f(uniLoc.iResolution, canvas.width, canvas.height);
    gl.uniform1f(uniLoc.iTime, timeSeconds);
    gl.uniform2f(uniLoc.iMouse, mouseX, mouseY);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function loop() {
    if (!running) return;
    const t = (performance.now() - startTime) / 1000;
    draw(t);
    raf = requestAnimationFrame(loop);
  }

  return {
    canvas,
    setSource,
    setMouse(px, py) {
      mouseX = px;
      mouseY = py;
    },
    start() {
      if (running) return;
      running = true;
      startTime = performance.now();
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    renderAt(timeSeconds: number) {
      draw(timeSeconds);
    },
    readPixel(u, v) {
      const x = Math.max(0, Math.min(canvas.width - 1, Math.floor(u * canvas.width)));
      const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(v * canvas.height)));
      const out = new Uint8Array(4);
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, out);
      return [out[0] / 255, out[1] / 255, out[2] / 255, out[3] / 255];
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      if (program) gl.deleteProgram(program);
      if (vao) gl.deleteVertexArray(vao);
    },
  };
}
