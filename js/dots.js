// ─────────────────────────────────────────────────────────────
//  Illustrations « en points » : les dessins tramés (1 bit) sont
//  lus point par point, puis chaque point peut bouger.
//    · Veil   : le cadre de racines (tous les écrans) + les
//               transitions tramées entre les pages
//    · Thorn  : le cadre d'épines des boutons
//    · Figure : un personnage dessiné, assis à la table
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
// moitié de résolution en gardant la densité des points
const halve = (s) => {
  const T = [0.125, 0.625, 0.875, 0.375], o = { w: s.w >> 1, h: s.h >> 1 }; o.v = new Uint8Array(o.w * o.h);
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) {
    let n = 0, m = 0;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const q = s.v[(y * 2 + j) * s.w + x * 2 + i]; if (q === 2) n++; if (q) m++; }
    o.v[y * o.w + x] = n / 4 > T[(y & 1) * 2 + (x & 1)] ? 2 : m ? 1 : 0;
  }
  return o;
};
// réduction d'un facteur f (0,5 à 1) en gardant la densité des points
const shrink = (s, f) => {
  if (f >= 0.999) return s;
  const T = [0.125, 0.625, 0.875, 0.375], o = { w: Math.floor(s.w * f), h: Math.floor(s.h * f) }; o.v = new Uint8Array(o.w * o.h);
  for (let y = 0; y < o.h; y++) { const y0 = Math.floor(y / f), y1 = Math.max(y0 + 1, Math.floor((y + 1) / f));
    for (let x = 0; x < o.w; x++) { const x0 = Math.floor(x / f), x1 = Math.max(x0 + 1, Math.floor((x + 1) / f));
      let n = 0, m = 0, c = 0;
      for (let j = y0; j < y1 && j < s.h; j++) for (let i = x0; i < x1 && i < s.w; i++) { const q = s.v[j * s.w + i]; c++; if (q === 2) n++; if (q) m++; }
      o.v[y * o.w + x] = c && n / c > T[(y & 1) * 2 + (x & 1)] ? 2 : m ? 1 : 0;
    } }
  return o;
};
// recadre + met à une taille donnée en re-tramant (portraits de cartes, etc.)
export function dotsToCanvas(s, [x0, y0, x1, y1], w, h, ink = '#16120c', paper = '#e6dbb8') {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'), img = ctx.createImageData(w, h), b = new Uint32Array(img.data.buffer);
  const sc = Math.max(w / (x1 - x0), h / (y1 - y0)), ox = (x0 + x1) / 2 - w / 2 / sc, oy = (y0 + y1) / 2 - h / 2 / sc;
  const I = abgr(ink), P = abgr(paper), n = Math.max(1, Math.round(1 / sc));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let on = 0;
    const sx = Math.floor(ox + x / sc), sy = Math.floor(oy + y / sc);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const xx = sx + i, yy = sy + j; if (xx >= 0 && yy >= 0 && xx < s.w && yy < s.h && s.v[yy * s.w + xx] === 2) on++; }
    b[y * w + x] = on / (n * n) > (bayer(x, y) + 0.5) / 64 ? P : I;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

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
    this.grow = 0; this.cover = 1; this.type = 'iris'; this.jit = 0; this.stir = 0;
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
      const cost = fx.cost + fy.cost + 1.3 * Math.abs(Math.log((38 * px) / Math.min(W, H) / 0.095));
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
      const i = y * TW + x, sx = mx[x], sy = my[y], q = s.v[sy * s.w + sx];
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
    const { xs, ys, amp, ord, sp, light, mid } = this, n = xs.length, gg = g * 1.12, jit = this.jit, k = 1 + cv * 2.2 + this.stir;
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

// ═════════════════════════════════════════════════════════════
//  LE BOUTON D'ÉPINES
// ═════════════════════════════════════════════════════════════
export class Thorn {
  constructor(btn, src0) {
    // taille : un point = 1 px d'écran net ; version compacte sur petits écrans
    const dpr = window.devicePixelRatio || 1, compact = innerHeight < 760 || innerWidth < 1000;
    const src = compact && dpr < 1.5 ? halve(src0) : src0, cell = compact && dpr >= 1.5 ? 0.5 : 1;
    this.btn = btn; this.src = src;
    btn.querySelector('canvas')?.remove();
    btn.style.width = (src.w + 16) * cell + 'px'; btn.style.height = (src.h + 16) * cell + 'px'; btn.style.setProperty('--tf', Math.round((src.h + 16) * cell * 0.2) + 'px');
    const c = (this.cv = document.createElement('canvas')); c.width = src.w + 16; c.height = src.h + 16;
    btn.prepend(c);
    this.ctx = c.getContext('2d'); this.img = this.ctx.createImageData(c.width, c.height); this.buf = new Uint32Array(this.img.data.buffer);
    const W = c.width, xs = [], ys = [], nx = [], ny = [], ph = [];
    this.back = [];
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const q = src.v[y * src.w + x]; if (!q) continue;
      this.back.push((y + 8) * W + x + 8);
      if (q === 2) { xs.push(x + 8); ys.push(y + 8); const dx = (x - src.w / 2) / (src.w / 2), dy = (y - src.h / 2) / (src.h / 2), l = Math.hypot(dx, dy) || 1; nx.push(dx / l); ny.push(dy / l); ph.push(hash(y * src.w + x) * 6.283); }
    }
    this.xs = Int16Array.from(xs); this.ys = Int16Array.from(ys); this.nx = Float32Array.from(nx); this.ny = Float32Array.from(ny); this.ph = Float32Array.from(ph);
    this.hov = 0; this.hovT = 0; this.hit = 0; this.show = 0; this.showT = 1;
    this.light = abgr('#e9e3bf'); this.hot = abgr('#e2643a');
    const on = () => { this.hovT = 1; }, off = () => { this.hovT = 0; };
    btn.addEventListener('pointerenter', on); btn.addEventListener('pointerleave', off); btn.addEventListener('focus', on); btn.addEventListener('blur', off);
    btn.addEventListener('pointerdown', () => { this.hit = 1; });
  }
  setPalette(p) { this.light = abgr(p.ramp[4]); this.hot = abgr(p.warm[2]); }
  reveal(delay = 0) { this.show = 0; this.showT = 0; setTimeout(() => { this.showT = 1; }, delay); }
  frame(t, dt) {
    this.hov += (this.hovT - this.hov) * Math.min(1, dt * 10);
    this.show += (this.showT - this.show) * Math.min(1, dt * 3.2);
    this.hit *= Math.exp(-dt * 6);
    const { buf, xs, ys, nx, ny, ph } = this, W = this.cv.width, H = this.cv.height, h = this.hov, s = this.show;
    buf.fill(0);
    const bk = 0xd8000000, sth = s * 80 - 8;
    for (let i = 0; i < this.back.length; i++) { const j = this.back[i]; if (bayer(j % W, (j / W) | 0) < sth) buf[j] = bk; }
    const col = h > 0.5 ? this.hot : this.light, n = xs.length, push = h * 2.2 + this.hit * 7 + (1 - s) * 26;
    for (let i = 0; i < n; i++) {
      const p = ph[i];
      if (p > s * 7.2) continue;
      const d = push * (0.55 + 0.45 * Math.sin(t * 9 + p)) + Math.sin(t * 1.3 + p) * 0.45;
      const x = Math.round(xs[i] + nx[i] * d), y = Math.round(ys[i] + ny[i] * d);
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      buf[y * W + x] = col;
    }
    this.ctx.putImageData(this.img, 0, 0);
  }
}

// ═════════════════════════════════════════════════════════════
//  LE PERSONNAGE DESSINÉ
// ═════════════════════════════════════════════════════════════
export class Figure {
  constructor(canvas, src, meta) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.full = src; this.meta = meta;
    this.assemble = 0; this.fall = 0; this.chaos = 0; this.hand = 0; this.handT = 0; this.tilt = 0; this.tiltT = 0; this.glare = 0.3; this.glareT = 0.3;
    this.tweens = []; this.visible = false;
    this.setup();
  }
  // choisit la résolution (pleine ou moitié) et la taille d'un point à l'écran
  setup() {
    // le dessin occupe presque toute la hauteur (le bas passe derrière la table), sans déborder en largeur
    const dpr = Math.min(window.devicePixelRatio || 1, 3), devH = innerHeight * dpr, devW = innerWidth * dpr;
    // partie visible : du haut de la fumée utile jusqu'à la ligne posée sur le bord de la table
    const M0 = this.meta, rows = (M0.sink || this.full.h) - (M0.top || 0);
    const g = Math.min((devH * 0.47) / rows, (devW * 0.95) / this.full.w);
    const k = Math.max(1, Math.floor(g + 0.15)), sc = k > 1 ? 1 : Math.max(0.5, Math.min(1, Math.round(g * 20) / 20));
    const s = shrink(this.full, sc);
    this.k = k; this.dpr = dpr; this.sc = sc; this.s = s;
    const w = s.w, h = s.h, padX = (this.padX = Math.round(w * 0.4)), padT = (this.padT = Math.round(h * 0.18));
    const BW = (this.BW = w + padX * 2), BH = (this.BH = h + padT);
    this.cv.width = BW; this.cv.height = BH;
    this.cv.style.width = (BW * k) / dpr + 'px'; this.cv.style.height = (BH * k) / dpr + 'px';
    this.img = this.ctx.createImageData(BW, BH); this.buf = new Uint32Array(this.img.data.buffer);
    this.limit = new Int32Array(BW).fill(BH);
    const M = this.meta, hd = M.head, hx = [], hy = [], rn = [], r2 = [], wh = [], wa = [], sm = [], up = [], lo = [];
    this.mask = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const q = s.v[y * w + x]; if (!q) continue;
      this.mask.push((y + padT) * BW + x + padX);
      if (q !== 2) continue;
      const X = x / sc, Y = y / sc, i = y * w + x;
      hx.push(x); hy.push(y); rn.push(hash(i)); r2.push(hash(i + 7919));
      const smoke = X > M.smoke.x0 && Y < M.smoke.y1;
      sm.push(smoke ? clamp((M.smoke.y1 - Y) / M.smoke.y1) * 0.85 + 0.15 : 0);
      const e = Math.hypot((X - hd.cx) / hd.rx, (Y - hd.cy) / hd.ry);
      wh.push(smoke ? 0 : clamp((1.15 - e) / 0.3));
      const a = M.hand; wa.push(!smoke && X > a.x0 && Y > a.y0 && Y < a.y1 ? clamp((X - a.x0) / 30) * clamp((a.y1 - Y) / 40) : 0);
      up.push(clamp(1 - y / h));
      lo.push(bayer(x, y) / 64 < (y / h - 0.72) * 2.2 ? 1 : 0);
    }
    const F = (a) => Float32Array.from(a);
    this.hx = F(hx); this.hy = F(hy); this.rn = F(rn); this.r2 = F(r2); this.wh = F(wh); this.wa = F(wa); this.sm = F(sm); this.up = F(up); this.lo = Uint8Array.from(lo);
    this.pv = [hd.px * sc, hd.py * sc];
    this.eye = []; for (let i = 0; i < 22; i++) { const a = hash(i * 31) * 6.283, r = Math.sqrt(hash(i * 57)) * M.eye.r * sc; this.eye.push([M.eye.x * sc + Math.cos(a) * r, M.eye.y * sc + Math.sin(a) * r * 0.7, hash(i * 91) * 6.283]); }
  }
  tween(prop, to, dur) {
    this.tweens = this.tweens.filter((t) => t.prop !== prop);
    return new Promise((res) => this.tweens.push({ prop, from: this[prop], to, t: 0, dur, res }));
  }
  reset() { this.assemble = 0; this.fall = 0; this.chaos = 0; this.handT = 0; this.tiltT = 0; this.glareT = 0.3; this.tweens = []; }
  appear(dur = 1900) { this.fall = 0; this.assemble = 0; return this.tween('assemble', 1, dur); }
  collapse(dur = 1700) { this.glareT = 0; return this.tween('fall', 1, dur); }
  jolt(a = 1) { this.chaos = Math.max(this.chaos, a); }
  reach(ms = 520) { this.handT = 1; clearTimeout(this._h); this._h = setTimeout(() => { this.handT = 0; }, ms); }
  look(v) { this.tiltT = v; }
  stare(v) { this.glareT = v; }
  hide() { this.visible = false; this.cv.style.display = 'none'; }

  /** geom : { x, y } point d'ancrage (bas-centre, px CSS) · rim(xCss) → y CSS du bord de table */
  render(t, dt, geom, pal) {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const w = this.tweens[i]; w.t += dt * 1000; const k = Math.min(1, w.t / w.dur);
      this[w.prop] = w.from + (w.to - w.from) * k;
      if (k >= 1) { this.tweens.splice(i, 1); w.res(); }
    }
    const q = Math.min(1, dt * 7);
    this.hand += (this.handT - this.hand) * q; this.tilt += (this.tiltT - this.tilt) * Math.min(1, dt * 3); this.glare += (this.glareT - this.glare) * q;
    this.chaos *= Math.exp(-dt * 3.5); if (this.chaos < 0.01) this.chaos = 0;
    const { BW, BH, padX, padT, k, dpr, buf, limit } = this, s = this.s, w = s.w, h = s.h, sc = this.sc, u = k / dpr;
    const left = Math.round((geom.x - (padX + w / 2) * u) * dpr) / dpr, top = Math.round((geom.y - (padT + (this.meta.sink ? this.meta.sink * sc : h)) * u) * dpr) / dpr;
    if (!this.visible) { this.visible = true; this.cv.style.display = 'block'; }
    this.cv.style.transform = `translate(${left}px, ${top}px)`;
    for (let c = 0; c < BW; c++) limit[c] = Math.min(BH, Math.floor((geom.rim(left + (c + 0.5) * u) - top) / u));
    buf.fill(0);
    const A = this.assemble, Fq = this.fall, C = this.chaos;
    // fond plein derrière le dessin (apparaît quand les points sont en place)
    const solid = clamp((A - 0.55) / 0.45) * (1 - clamp(Fq * 2.2));
    if (solid > 0) {
      const th = solid * 66, m = this.mask;
      for (let i = 0; i < m.length; i++) { const j = m[i], x = j % BW, y = (j / BW) | 0; if (y < limit[x] && (solid >= 1 || bayer(x, y) < th)) buf[j] = BLACK; }
    }
    const light = abgr(pal.ramp[4]), mid = abgr(pal.ramp[3]), w2 = abgr(pal.warm[2]), w3 = abgr(pal.warm[3]);
    const ang = this.tilt * 0.07 + Math.sin(t * 0.45) * 0.014 + (C ? (rand() - 0.5) * C * 0.05 : 0), ca = Math.cos(ang), sa = Math.sin(ang), pvx = this.pv[0], pvy = this.pv[1];
    const br = Math.sin(t * 1.15) * 1.6 * sc, hl = this.hand, f1 = 0.045 / sc, f2 = 0.11 / sc;
    const { hx, hy, rn, r2, wh, wa, sm, up, lo } = this, n = hx.length;
    for (let i = 0; i < n; i++) {
      let x = hx[i], y = hy[i]; const r = rn[i];
      const ks = sm[i];
      if (ks) {
        x += (Math.sin(y * f1 + t * 1.7) * 7 + Math.sin(y * f2 - t * 1.1 + r * 6) * 2.5) * ks * sc;
        y -= hl * 6 * sc * (1 - ks);
        if (r < 0.06 + 0.05 * Math.sin(t * 3 + y * 0.05)) continue; // la fumée scintille
      } else {
        y -= br * up[i];
        const a = wh[i]; if (a) { const dx = x - pvx, dy = y - pvy; x += (dx * ca - dy * sa - dx) * a; y += (dx * sa + dy * ca - dy) * a; }
        const b = wa[i]; if (b) { x -= b * hl * 5 * sc; y -= b * hl * 13 * sc; }
      }
      if (A < 1) {
        const a = clamp(A * 1.7 - r * 0.7); if (a <= 0) continue;
        const e = 1 - Math.pow(1 - a, 3), o = 1 - e, an = o * 2.8 + r * 6.283, R = o * (90 + r2[i] * 240) * sc;
        x += Math.cos(an) * R; y += Math.sin(an) * R * 0.7 - o * 60 * sc;
      }
      if (Fq > 0) {
        const tt = Fq * 1.7 - r * 0.55 - up[i] * 0.15;
        if (tt > 0) { y += tt * tt * h * 1.25; x += (r2[i] - 0.5) * tt * 110 * sc + Math.sin(t * 9 + r * 20) * tt * 6 * sc; }
      }
      if (C) { x += (rand() - 0.5) * C * 12 * sc; y += (rand() - 0.5) * C * 12 * sc; }
      const xi = (x + padX + 0.5) | 0, yi = (y + padT + 0.5) | 0;
      if (xi < 0 || yi < 0 || xi >= BW || yi >= limit[xi]) continue;
      buf[yi * BW + xi] = ks || lo[i] ? mid : light;
    }
    // la braise au fond de l'orbite
    if (A > 0.9 && Fq < 0.2) {
      const gl = this.glare, ne = Math.round(4 + gl * 18);
      for (let i = 0; i < ne; i++) {
        const [ex, ey, ep] = this.eye[i];
        if (Math.sin(t * 6 + ep) < -0.2 - gl * 0.6) continue;
        const dx = ex - pvx, dy = ey - pvy;
        const xi = (pvx + dx * ca - dy * sa + padX + 0.5) | 0, yi = (pvy + dx * sa + dy * ca - br * 0.6 + padT + 0.5) | 0;
        if (xi >= 0 && yi >= 0 && xi < BW && yi < limit[xi]) buf[yi * BW + xi] = i % 3 ? w2 : w3;
      }
    }
    this.ctx.putImageData(this.img, 0, 0);
  }
}
