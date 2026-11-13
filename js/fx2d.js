// ─────────────────────────────────────────────────────────────
//  Effets plein écran tramés, par-dessus la scène :
//    · Rush : la plongée vers le duel (traits de vitesse, éclair)
//  Basse résolution, tramage de Bayer, couleurs du lieu.
// ─────────────────────────────────────────────────────────────
import { bayer, abgr } from './dots.js';

const hash = (i) => { let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export class Rush {
  constructor(cv) { this.cv = cv; this.ctx = cv.getContext('2d'); this.k = 0; this.flash = 0; this.tw = []; this.pal(['#000', '#222', '#555', '#aaa', '#fff'], ['#000', '#400', '#c40', '#fc8']); }
  pal(ramp, warm) { this.c = [abgr(ramp[4]), abgr(ramp[3]), abgr(warm[2]), abgr(warm[3])]; }
  resize() {
    const px = Math.max(3, Math.round(Math.min(innerWidth, innerHeight) / 190)), W = Math.ceil(innerWidth / px), H = Math.ceil(innerHeight / px);
    this.cv.width = W; this.cv.height = H; this.W = W; this.H = H;
    this.img = this.ctx.createImageData(W, H); this.buf = new Uint32Array(this.img.data.buffer);
    this.ang = new Uint16Array(W * H); this.rad = new Float32Array(W * H); this.bay = new Uint8Array(W * H);
    const m = Math.hypot(W / 2, H / 2);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, dx = x - W / 2, dy = y - H * 0.45; this.ang[i] = Math.floor(((Math.atan2(dy, dx) / (Math.PI * 2)) + 0.5) * 720) % 720; this.rad[i] = Math.hypot(dx, dy) / m; this.bay[i] = bayer(x, y); }
  }
  to(prop, v, dur) { return new Promise((res) => this.tw.push({ prop, from: this[prop], to: v, t: 0, dur, res })); }
  frame(t, dt) {
    for (let i = this.tw.length - 1; i >= 0; i--) { const w = this.tw[i]; w.t += dt * 1000; const k = Math.min(1, w.t / w.dur); this[w.prop] = w.from + (w.to - w.from) * (k * k * (3 - 2 * k)); if (k >= 1) { this.tw.splice(i, 1); w.res(); } }
    const on = this.k > 0.01 || this.flash > 0.01;
    this.cv.style.display = on ? 'block' : 'none';
    if (!on) return;
    if (!this.buf || this.cv.width !== Math.ceil(innerWidth / Math.max(3, Math.round(Math.min(innerWidth, innerHeight) / 190)))) this.resize();
    const { buf, ang, rad, bay, k, flash } = this, n = buf.length, [L, M, W2, W3] = this.c, sp = t * 2.4;
    for (let i = 0; i < n; i++) {
      const a = ang[i], r = rad[i], b = bay[i];
      if (flash * 64 > b + r * 40) { buf[i] = flash > 0.85 ? L : (b & 3) === 0 ? W3 : L; continue; }
      // un trait par secteur d'angle : il file vers l'extérieur
      const s = hash(a >> 1), len = 0.12 + s * 0.3, ph = ((r * 1.6 - sp * (0.6 + s) + s * 7) % 1 + 1) % 1;
      const v = (ph < len ? 1 - ph / len : 0) * Math.min(1, r * 2.4 - 0.25) * k * (s > 0.45 ? 1 : 0);
      buf[i] = v * 64 > b ? (s > 0.85 ? W2 : v > 0.6 ? L : M) : 0;
    }
    this.ctx.putImageData(this.img, 0, 0);
  }
}
