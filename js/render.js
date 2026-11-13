// ─────────────────────────────────────────────────────────────
//  Rendu « vieux jeu » : la scène 3D est calculée en très basse
//  résolution puis tramée (Bayer 8×8) dans une palette de 5 tons
//  + 4 tons « chauds » réservés aux flammes et aux braises.
// ─────────────────────────────────────────────────────────────
import * as THREE from '../vendor/three.min.js';
export { THREE };

const hex = (h) => new THREE.Color(h);
export const PALETTES = {
  // vert-de-gris sur noir — la crypte, la table
  fange:   { ramp: ['#060805', '#142a16', '#3b6e2c', '#98c653', '#e9e3bf'], warm: ['#170703', '#6e2410', '#d65a28', '#f5c27c'] },
  // encre sur parchemin — pages du guide, portraits
  velin:   { ramp: ['#17120c', '#463a27', '#857654', '#c7b88f', '#ece2c3'], warm: ['#1d0c05', '#7a2c14', '#c9572e', '#efb27a'] },
  // couverture : sarcelle, os, rouille
  rouille: { ramp: ['#09090a', '#12302d', '#3f7a69', '#c9b892', '#efe4c8'], warm: ['#220a05', '#8a2b14', '#e2643a', '#f7b57e'] },
  // sang : profanation
  // parcours II — cendre violette, fleuve d'encre, os et sang
  cendre:  { ramp: ['#08070a', '#27222d', '#5e5668', '#a89eb4', '#ebe6ef'], warm: ['#12060a', '#5a1a2a', '#c23a50', '#f2a4ae'] },
  styx:    { ramp: ['#03070a', '#0b2530', '#1f5c66', '#72b6aa', '#dcf0e8'], warm: ['#0a0604', '#3d2c10', '#cfa444', '#f6de94'] },
  os:      { ramp: ['#0c0806', '#3b2519', '#7c5437', '#caad86', '#f3e7ce'], warm: ['#140404', '#6c0f10', '#cf2424', '#ff8e5e'] },
  // parcours III — marais, givre, or du dragon
  marais:  { ramp: ['#070806', '#1e2412', '#4d5a26', '#b5b85a', '#ece9c8'], warm: ['#0c0704', '#4a2a0a', '#d8a028', '#f8e080'] },
  givre:   { ramp: ['#04060c', '#14223a', '#3c6488', '#a8c8dc', '#f0f6fa'], warm: ['#0a0406', '#3a1a2a', '#c84a6a', '#f8b0c0'] },
  or:      { ramp: ['#0a0503', '#2a1206', '#6a3410', '#c88a34', '#f6e2b8'], warm: ['#140202', '#6a1006', '#e04018', '#ffb070'] },
  sang:    { ramp: ['#0a0303', '#3a0d0a', '#8a2416', '#d8613c', '#f2dcc0'], warm: ['#0a0303', '#8a2416', '#e2643a', '#f6c08a'] },
};

const VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAG = /* glsl */`
precision highp float;
uniform sampler2D tScene;
uniform vec3 r0, r1, r2, r3, r4, w0, w1, w2, w3;
uniform float flash, invert, contrast, lift;
varying vec2 vUv;

float bayer(vec2 fc){
  int x = int(mod(fc.x, 8.0)), y = int(mod(fc.y, 8.0));
  int v = 0;
  for (int b = 0; b < 3; b++) {
    v = v * 4 + (((x ^ y) >> b) & 1) * 2 + ((y >> b) & 1);
  }
  return (float(v) + 0.5) / 64.0;
}
vec3 ramp(int i){ return i <= 0 ? r0 : i == 1 ? r1 : i == 2 ? r2 : i == 3 ? r3 : r4; }
vec3 warm(int i){ return i <= 0 ? w0 : i == 1 ? w1 : i == 2 ? w2 : w3; }

void main(){
  vec3 c = texture2D(tScene, vUv).rgb;
  float th = bayer(gl_FragCoord.xy) - 0.5;
  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
  float sat = mx > 0.001 ? (mx - mn) / mx : 0.0;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  l = clamp((pow(l, 0.75) - 0.5) * contrast + 0.5 + lift, 0.0, 1.0);
  vec3 o;
  if (sat > 0.62 && c.r > c.g * 1.4 && c.r > c.b * 1.8 && mx > 0.35) {
    int i = int(floor(clamp(pow(mx, 0.8) * 3.0 + th, 0.0, 3.0) + 0.5));
    o = warm(i);
  } else {
    int i = int(floor(clamp(l * 4.0 + th, 0.0, 4.0) + 0.5));
    o = ramp(i);
  }
  o = mix(o, r4, flash);
  o = mix(o, vec3(1.0) - o + r0, invert);
  gl_FragColor = vec4(o, 1.0);
}`;

export class DitherRenderer {
  constructor(canvas, { pixel = 3, palette = 'fange' } = {}) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.pixel = pixel;
    this.rt = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
    this.uniforms = {
      tScene: { value: this.rt.texture }, flash: { value: 0 }, invert: { value: 0 }, contrast: { value: 1.15 }, lift: { value: 0 },
    };
    for (let i = 0; i < 5; i++) this.uniforms['r' + i] = { value: new THREE.Color() };
    for (let i = 0; i < 4; i++) this.uniforms['w' + i] = { value: new THREE.Color() };
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: this.uniforms, depthTest: false }));
    this.qScene = new THREE.Scene(); this.qScene.add(this.quad);
    this.qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.setPalette(palette);
    this.resize();
  }
  setPalette(name) {
    const p = PALETTES[name] || PALETTES.fange;
    this.paletteName = name;
    p.ramp.forEach((h, i) => this.uniforms['r' + i].value.copy(hex(h)));
    p.warm.forEach((h, i) => this.uniforms['w' + i].value.copy(hex(h)));
  }
  resize(w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight) {
    const px = typeof this.pixel === 'function' ? this.pixel(w, h) : this.pixel;
    this.w = Math.max(32, Math.round(w / px)); this.h = Math.max(32, Math.round(h / px));
    this.renderer.setSize(this.w, this.h, false);
    this.rt.setSize(this.w, this.h);
    return [this.w, this.h];
  }
  render(scene, camera) {
    const r = this.renderer;
    r.setRenderTarget(this.rt);
    r.render(scene, camera);
    r.setRenderTarget(null);
    r.render(this.qScene, this.qCam);
  }
  // Rendu hors écran → image (portraits, illustrations du guide)
  still(scene, camera, w, h, palette) {
    const prevPal = this.paletteName, [pw, ph] = [this.w, this.h];
    if (palette) this.setPalette(palette);
    const rt2 = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    const r = this.renderer;
    this.rt.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    r.setRenderTarget(this.rt); r.render(scene, camera);
    r.setRenderTarget(rt2); r.render(this.qScene, this.qCam);
    const buf = new Uint8Array(w * h * 4);
    r.readRenderTargetPixels(rt2, 0, 0, w, h, buf);
    r.setRenderTarget(null);
    rt2.dispose();
    this.rt.setSize(pw, ph);
    if (palette) this.setPalette(prevPal);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'); const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) img.data.set(buf.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
    ctx.putImageData(img, 0, 0);
    return cv;
  }
}

// ── Textures procédurales ────────────────────────────────────
function rnd(seed) { let s = seed >>> 0; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) + 0x6d2b79f5) >>> 0) / 4294967296; }

export function canvasTex(w, h, draw, { repeat = null } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

export const TEX = {
  bricks: () => canvasTex(128, 128, (c, w, h) => {
    const r = rnd(7);
    c.fillStyle = '#2a2a24'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) {
      const ox = (y % 2) * 16, v = 70 + r() * 60;
      c.fillStyle = `rgb(${v},${v * 0.98},${v * 0.85})`;
      c.fillRect(x * 32 + ox + 1, y * 16 + 1, 30, 14);
      for (let k = 0; k < 6; k++) { c.fillStyle = `rgba(0,0,0,${r() * 0.4})`; c.fillRect(x * 32 + ox + r() * 30, y * 16 + r() * 14, 2 + r() * 5, 1 + r() * 2); }
    }
  }, { repeat: [10, 3] }),
  stone: () => canvasTex(128, 128, (c, w, h) => {
    const r = rnd(11);
    c.fillStyle = '#1e1e1a'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const v = 50 + r() * 50; c.fillStyle = `rgb(${v},${v},${v * 0.9})`;
      c.fillRect(x * 32 + 1, y * 32 + 1, 30, 30);
      for (let k = 0; k < 10; k++) { c.fillStyle = `rgba(0,0,0,${r() * 0.5})`; c.fillRect(x * 32 + r() * 30, y * 32 + r() * 30, 1 + r() * 4, 1 + r() * 4); }
    }
  }, { repeat: [8, 8] }),
  wood: () => canvasTex(256, 256, (c, w, h) => {
    const r = rnd(3);
    c.fillStyle = '#4a3420'; c.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 2) {
      const v = 50 + 30 * Math.sin(x * 0.11 + Math.sin(x * 0.031) * 4) + r() * 20;
      c.fillStyle = `rgba(${v + 30},${v + 10},${v - 10},0.55)`; c.fillRect(x, 0, 2, h);
    }
    for (let k = 0; k < 60; k++) { c.fillStyle = `rgba(0,0,0,${0.2 + r() * 0.4})`; c.fillRect(r() * w, r() * h, 1, 4 + r() * 30); }
    c.fillStyle = 'rgba(0,0,0,.5)'; for (let x = 0; x < w; x += 42) c.fillRect(x, 0, 2, h); // planches
  }),
  cloth: () => canvasTex(64, 64, (c, w, h) => {
    const r = rnd(5);
    c.fillStyle = '#3a3a33'; c.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 3) { c.fillStyle = `rgba(0,0,0,${0.15 + r() * 0.3})`; c.fillRect(x, 0, 1, h); }
  }, { repeat: [2, 3] }),
};
