// ─────────────────────────────────────────────────────────────
//  Tramage 1-bit : une toile peinte en niveaux de gris est
//  convertie en points (Bayer 8×8) sur le GPU, à chaque image.
// ─────────────────────────────────────────────────────────────

const VS = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; uv.y = 1. - uv.y; gl_Position = vec4(p, 0., 1.); }`;
const FS = `precision mediump float;
uniform sampler2D t; uniform vec3 ink, bg; uniform float gamma, gain, lift, flash, invert; uniform vec2 res;
varying vec2 uv;
float bayer(vec2 f){
  vec2 a = floor(mod(f, 8.));
  float v = 0.;
  for (int i = 0; i < 3; i++) {
    vec2 b = floor(mod(a / exp2(float(i)), 2.));
    v += exp2(float(4 - 2 * i)) * (mod(b.x + b.y, 2.) * 2. + b.y) ;
  }
  return (v + .5) / 64.;
}
void main(){
  vec3 c = texture2D(t, uv).rgb;
  float l = dot(c, vec3(.299, .587, .114));
  l = clamp(pow(l, gamma) * gain + lift, 0., 1.);
  l = max(l, flash);
  float on = step(bayer(gl_FragCoord.xy), l);
  on = mix(on, 1. - on, invert);
  gl_FragColor = vec4(mix(bg, ink, on), 1.);
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

export class Dither {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = (this.gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: false }));
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
    const pr = (this.pr = gl.createProgram());
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr); gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.u = {};
    for (const n of ['t', 'ink', 'bg', 'gamma', 'gain', 'lift', 'flash', 'invert', 'res']) this.u[n] = gl.getUniformLocation(pr, n);
    this.set({ ink: '#ece8dc', bg: '#000000', gamma: 1, gain: 1, lift: 0 });
    this.flash = 0; this.invert = 0;
  }
  set(o) { Object.assign(this, o); }
  size(w, h) { if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; } }
  draw(src) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.uniform3fv(this.u.ink, hex(this.ink)); gl.uniform3fv(this.u.bg, hex(this.bg));
    gl.uniform1f(this.u.gamma, this.gamma); gl.uniform1f(this.u.gain, this.gain); gl.uniform1f(this.u.lift, this.lift);
    gl.uniform1f(this.u.flash, this.flash); gl.uniform1f(this.u.invert, this.invert);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

// Tramage sur le processeur, pour les images fixes (cartes, aperçus)
const B8 = (() => {
  const m = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    let v = 0;
    for (let i = 0; i < 3; i++) { const bx = (x >> i) & 1, by = (y >> i) & 1; v += (1 << (4 - 2 * i)) * (((bx + by) % 2) * 2 + by); }
    m[y * 8 + x] = (v + 0.5) / 64;
  }
  return m;
})();
export function ditherCanvas(src, { ink = '#ece8dc', bg = '#000000', gamma = 1, gain = 1, transparent = false } = {}) {
  const w = src.width, h = src.height;
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const c = out.getContext('2d');
  const d = src.getContext('2d').getImageData(0, 0, w, h);
  const I = hex(ink).map((v) => v * 255), G = hex(bg).map((v) => v * 255);
  const px = d.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = (y * w + x) * 4;
    let l = (0.299 * px[p] + 0.587 * px[p + 1] + 0.114 * px[p + 2]) / 255;
    l = Math.min(1, Math.pow(l, gamma) * gain);
    const on = l > B8[(y & 7) * 8 + (x & 7)];
    const col = on ? I : G;
    px[p] = col[0]; px[p + 1] = col[1]; px[p + 2] = col[2];
    px[p + 3] = transparent && !on && px[p + 3] < 250 ? 0 : 255;
  }
  c.putImageData(d, 0, 0);
  return out;
}
