// ─────────────────────────────────────────────────────────────
//  Illustrations « en points » : un dessin tramé (1 bit) est lu
//  point par point, puis chaque point peut bouger.
//    · Veil : le cadre de racines de l'accueil + les transitions
//             tramées entre les pages (sur tous les écrans)
//  Format des images (art/*.png, niveaux de gris) :
//    255 = point · 128 = fond plein derrière le dessin · 0 = vide
// ─────────────────────────────────────────────────────────────

export const bayer = (x, y) => { let v = 0; for (let b = 0; b < 3; b++) v = v * 4 + ((((x ^ y) >> b) & 1) * 2) + ((y >> b) & 1); return v; }; // 0..63
export const abgr = (hex, a = 255) => { const n = parseInt(hex.slice(1), 16); return ((a << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; };
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const BLACK = 0xff000000;
let seed = 1234567;
const rand = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const hash = (i) => { let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export async function loadDots(url) {
  const img = new Image(); img.src = url; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data, v = new Uint8Array(c.width * c.height);
  for (let i = 0; i < v.length; i++) v[i] = d[i * 4] > 200 ? 2 : d[i * 4] > 60 ? 1 : 0;
  return { w: c.width, h: c.height, v };
}
const rot90 = (s) => { const o = { w: s.h, h: s.w, v: new Uint8Array(s.v.length) }; for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) o.v[x * o.w + (s.h - 1 - y)] = s.v[y * s.w + x]; return o; };
// ═════════════════════════════════════════════════════════════
//  LE VOILE : cadre de racines + transitions
// ═════════════════════════════════════════════════════════════
function fit(T, S) {
  let best = null;
  for (let c = Math.round(S * 0.16); c <= Math.round(S * 0.38); c += 2) {
    const need = T - 2 * c, mid = S - 2 * c; if (need < 8 || mid < 8) continue;
    for (const n of [1, 3, 5, 7]) { const st = need / (n * mid), cost = Math.abs(Math.log(st)) + (n - 1) * 0.06; if (!best || cost < best.cost) best = { c, n, need, mid, cost }; }
  }
  return best || { c: T >> 1, n: 1, need: 0, mid: 1, cost: 3 };
}
function axisMap(T, S, f) {
  const m = new Int16Array(T);
  for (let t = 0; t < T; t++) {
    if (t < f.c) m[t] = t;
    else if (t >= T - f.c) m[t] = S - (T - t);
    else { const u = ((t - f.c) / f.need) * f.n * f.mid, k = Math.min(f.n - 1, Math.floor(u / f.mid)), r = u - k * f.mid; m[t] = f.c + clamp(Math.floor(k % 2 ? f.mid - 1e-6 - r : r), 0, f.mid - 1); }
  }
  return m;
}

export class Veil {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.light = abgr('#e9e3bf'); this.mid = abgr('#98c653');
    this.grow = 0; this.want = 0; this.cover = 1; this.type = 'iris'; this.jit = 0; this.stir = 0;
    this.tweens = [];
  }
  setSource(src) { this.src = [src, rot90(src)]; this.resize(); }
  setPalette(p) { this.light = abgr(p.ramp[4]); this.mid = abgr(p.ramp[3]); }
  resize() {
    if (!this.src) return;
    const W = innerWidth, H = innerHeight;
    let best = null;
    for (const s of this.src) for (const px of [1, 2, 3, 4]) {
      const TW = Math.ceil(W / px), TH = Math.ceil(H / px), fx = fit(TW, s.w), fy = fit(TH, s.h);
      const cost = fx.cost + fy.cost + 1.3 * Math.abs(Math.log((38 * px) / Math.min(W, H) / 0.052));
      if (!best || cost < best.cost) best = { s, px, TW, TH, fx, fy, cost };
    }
    const { s, px, TW, TH } = best;
    this.px = px; this.TW = TW; this.TH = TH;
    this.cv.width = TW; this.cv.height = TH;
    const mx = axisMap(TW, s.w, best.fx), my = axisMap(TH, s.h, best.fy);
    const N = TW * TH;
    this.base = new Uint32Array(N); this.bay = new Uint8Array(N); this.rad = new Uint8Array(N); this.ver = new Uint8Array(N);
    const xs = [], ys = [], amp = [], ord = [], sp = [];
    const diag = Math.hypot(TW, TH) / 2;
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
      const i = y * TW + x, sx = mx[x], sy = my[y], mid = x >= best.fx.c && x < TW - best.fx.c && y >= best.fy.c && y < TH - best.fy.c, q = mid ? 0 : s.v[sy * s.w + sx];
      this.bay[i] = bayer(x, y);
      this.rad[i] = Math.min(255, Math.hypot((x - TW / 2) / (TW / 2), (y - TH / 2) / (TH / 2)) / 1.4142 * 255);
      this.ver[i] = (y / TH) * 255;
      if (q) this.base[i] = BLACK;
      if (q === 2) {
        xs.push(x); ys.push(y);
        const d = Math.min(x, y, TW - 1 - x, TH - 1 - y);
        amp.push(clamp((d - 12) / 26) * 1.9);
        const dc = Math.min(Math.hypot(x, y), Math.hypot(TW - x, y), Math.hypot(x, TH - y), Math.hypot(TW - x, TH - y)) / diag;
        ord.push(dc * 0.82 + hash(i) * 0.14);
        let nb = 0; for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) { const xx = sx + k, yy = sy + j; if (xx >= 0 && yy >= 0 && xx < s.w && yy < s.h && s.v[yy * s.w + xx] === 2) nb++; }
        sp.push(nb <= 4 ? 1 : 0);
      }
    }
    this.xs = Int16Array.from(xs); this.ys = Int16Array.from(ys); this.amp = Float32Array.from(amp); this.ord = Float32Array.from(ord); this.sp = Uint8Array.from(sp);
    this.img = this.ctx.createImageData(TW, TH); this.buf = new Uint32Array(this.img.data.buffer);
    // épaisseur utile du cadre, pour pousser l'interface vers l'intérieur
    let band = 0, cnt = 0;
    for (let y = Math.floor(TH * 0.35); y < TH * 0.65; y += 3) { let x = 0; while (x < TW / 2 && this.base[y * TW + x]) x++; band += x; cnt++; }
    document.documentElement.style.setProperty('--fr', Math.round((band / cnt) * px) + 'px');
  }
  tween(prop, to, dur) {
    this.tweens = this.tweens.filter((t) => t.prop !== prop);
    return new Promise((res) => this.tweens.push({ prop, from: this[prop], to, t: 0, dur, res }));
  }
  growIn(dur = 2600) { return this.tween('grow', 1, dur); }
  /** montre (ou retire) le cadre de racines */
  setFrame(on, dur = 900) { if ((on ? 1 : 0) !== this.want) { this.want = on ? 1 : 0; this.tween('grow', this.want, dur); } }
  close(type = 'iris', dur = 460) { this.type = type; document.body.classList.add('veiled'); return this.tween('cover', 1, dur); }
  open(dur = 620) { return this.tween('cover', 0, dur).then(() => document.body.classList.remove('veiled')); }
  shake(a = 1) { this.jit = Math.max(this.jit, a); }
  frame(t, dt) {
    if (!this.buf) return;
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const w = this.tweens[i]; w.t += dt * 1000;
      const k = Math.min(1, w.t / w.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      this[w.prop] = w.from + (w.to - w.from) * e;
      if (k >= 1) { this.tweens.splice(i, 1); w.res(); }
    }
    this.jit *= Math.exp(-dt * 5); if (this.jit < 0.02) this.jit = 0;
    const { buf, base, TW, TH, bay } = this, N = TW * TH, g = this.grow, cv = this.cover;
    if (g <= 0 && cv <= 0) { if (!this.blank) { buf.fill(0); this.ctx.putImageData(this.img, 0, 0); this.blank = true; } return; }
    this.blank = false;
    if (g >= 1 && cv <= 0) buf.set(base);
    else {
      const R = this.type === 'iris' ? this.rad : this.ver, inv = this.type === 'up';
      const cth = cv * 128 - 64, gth = g * 110 - 30;
      for (let i = 0; i < N; i++) {
        const b = bay[i];
        let on = base[i] && b < gth;
        if (!on && cv > 0) { const r = inv ? 255 - R[i] : R[i]; on = b < cth + (this.type === 'iris' ? r : 255 - r) * 0.2510; }
        buf[i] = on ? BLACK : 0;
      }
    }
    const { xs, ys, amp, ord, sp, light, mid } = this, n = g > 0 ? xs.length : 0, gg = g * 1.12, jit = this.jit, k = 1 + cv * 2.2 + this.stir;
    for (let i = 0; i < n; i++) {
      if (ord[i] > gg) continue;
      let x = xs[i], y = ys[i]; const a = amp[i] * k;
      if (a > 0.05) { x += Math.round(Math.sin(t * 0.9 + y * 0.09 + x * 0.021) * a); y += Math.round(Math.cos(t * 0.7 + x * 0.08 + y * 0.013) * a * 0.7); }
      if (jit) { x += Math.round((rand() - 0.5) * jit * 5); y += Math.round((rand() - 0.5) * jit * 5); }
      if (x < 0 || y < 0 || x >= TW || y >= TH) continue;
      buf[y * TW + x] = sp[i] ? mid : light;
    }
    this.ctx.putImageData(this.img, 0, 0);
  }
}
