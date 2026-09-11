import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shaders";

export type GlassPanel = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  refraction: number;
  thickness: number;
  blur: number;
  dispersion: number;
  fresnel: number;
  glare: number;
  tint: number;
  elasticity: number;
  opacity: number;
};

const MAX_PANELS = 12;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create WebGL shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create WebGL program.");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Unknown program linking error.";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

export class LiquidGlassRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly rectLocation: WebGLUniformLocation;
  private readonly materialLocation: WebGLUniformLocation;
  private readonly opticalLocation: WebGLUniformLocation;
  private readonly interactionLocation: WebGLUniformLocation;
  private readonly resolutionLocation: WebGLUniformLocation;
  private readonly timeLocation: WebGLUniformLocation;
  private readonly pointerLocation: WebGLUniformLocation;
  private readonly panelCountLocation: WebGLUniformLocation;
  private readonly panels = new Map<string, GlassPanel>();
  private frame = 0;
  private running = false;
  private dpr = 1;
  private pointer = { x: 0, y: 0 };
  private resizeObserver?: ResizeObserver;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 is not available in this browser.");
    this.gl = gl;
    this.program = createProgram(gl);

    this.rectLocation = this.requiredUniform("uPanelRect[0]");
    this.materialLocation = this.requiredUniform("uPanelMaterial[0]");
    this.opticalLocation = this.requiredUniform("uPanelOptical[0]");
    this.interactionLocation = this.requiredUniform("uPanelInteraction[0]");
    this.resolutionLocation = this.requiredUniform("uResolution");
    this.timeLocation = this.requiredUniform("uTime");
    this.pointerLocation = this.requiredUniform("uPointer");
    this.panelCountLocation = this.requiredUniform("uPanelCount");

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement || canvas);
    this.resize();
    this.start();
  }

  private requiredUniform(name: string): WebGLUniformLocation {
    const location = this.gl.getUniformLocation(this.program, name);
    if (!location) throw new Error(`Missing WebGL uniform: ${name}`);
    return location;
  }

  setPointer(x: number, y: number) {
    this.pointer.x = x;
    this.pointer.y = this.canvas.clientHeight - y;
  }

  register(panel: GlassPanel) {
    this.panels.set(panel.id, panel);
  }

  unregister(id: string) {
    this.panels.delete(id);
  }

  update(panel: GlassPanel) {
    this.panels.set(panel.id, panel);
  }

  resize() {
    const host = this.canvas.parentElement;
    if (!host) return;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const maxDpr = window.matchMedia("(max-width: 900px)").matches ? 1.35 : 1.7;
    this.dpr = reduceMotion ? 1 : Math.min(window.devicePixelRatio || 1, maxDpr);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  private draw(timeMs: number) {
    const gl = this.gl;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const ordered = [...this.panels.values()].slice(0, MAX_PANELS);

    gl.useProgram(this.program);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.timeLocation, timeMs * 0.001);
    gl.uniform2f(this.pointerLocation, this.pointer.x * this.dpr, this.pointer.y * this.dpr);
    gl.uniform1i(this.panelCountLocation, ordered.length);

    const rect = new Float32Array(MAX_PANELS * 4);
    const material = new Float32Array(MAX_PANELS * 4);
    const optical = new Float32Array(MAX_PANELS * 4);
    const interaction = new Float32Array(MAX_PANELS * 4);

    ordered.forEach((panel, index) => {
      const base = index * 4;
      const x = panel.x * this.dpr;
      const y = (height - panel.y - panel.height) * this.dpr;
      rect[base] = x + (panel.width * this.dpr) * 0.5;
      rect[base + 1] = y + (panel.height * this.dpr) * 0.5;
      rect[base + 2] = panel.width * this.dpr;
      rect[base + 3] = panel.height * this.dpr;

      material[base] = panel.radius * this.dpr;
      material[base + 1] = panel.refraction;
      material[base + 2] = panel.thickness * this.dpr;
      material[base + 3] = panel.blur * this.dpr;

      optical[base] = panel.dispersion;
      optical[base + 1] = panel.fresnel;
      optical[base + 2] = panel.glare;
      optical[base + 3] = panel.tint;

      interaction[base] = panel.elasticity;
      interaction[base + 1] = panel.opacity;
    });

    gl.uniform4fv(this.rectLocation, rect);
    gl.uniform4fv(this.materialLocation, material);
    gl.uniform4fv(this.opticalLocation, optical);
    gl.uniform4fv(this.interactionLocation, interaction);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = (timeMs: number) => {
      if (!this.running) return;
      this.draw(timeMs);
      this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.gl.deleteProgram(this.program);
  }
}
