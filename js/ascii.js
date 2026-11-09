// ─────────────────────────────────────────────────────────────
//  Moteur graphique ASCII / 1-bit
//  · AsciiLayer  : une grille de caractères pilotée par une
//                  fonction de luminance (façon fragment shader)
//  · DitherLayer : fond en points tramés (Bayer 8×8)
//  · Scènes      : épée raymarchée, pluie de chiffres, titres
//                  en caractères, faucheuse, chandelles
// ─────────────────────────────────────────────────────────────

export const RAMP = ' .,:;!+*a2$SZ0%&gQ8@';
const DENSE = '&$%#@80QgSZ';
const RAIN = '01789VII0178';
export const MONO = '"JBM", ui-monospace, monospace';
export const GOTH = '"Fraktur", serif';

// ── Bruit ────────────────────────────────────────────────────
const hash = (x, y) => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
export function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, o = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < o; i++) { s += a * noise(x * f, y * f); f *= 2.03; a *= 0.5; }
  return s;
}
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ── Couche ASCII ─────────────────────────────────────────────
export class AsciiLayer {
  constructor(canvas, { fontSize = 12, lineH = 1.16, fps = 30, color = [236, 232, 222] } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.baseFont = fontSize;
    this.lineH = lineH;
    this.fps = fps;
    this.color = color;
    this.scene = null;
    this.running = false;
    this.t = 0;
    this.flicker = 0.015;
    this._last = 0;
    this._loop = this._loop.bind(this);
    this.resize();
    addEventListener('resize', () => { this.resize(); this.onResize?.(); });
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight;
    this.w = w; this.h = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.fs = w < 520 ? Math.max(8, this.baseFont - 3) : w < 900 ? this.baseFont - 1 : this.baseFont;
    this.ctx.font = `${this.fs}px ${MONO}`;
    this.cw = this.ctx.measureText('M').width;
    this.ch = Math.round(this.fs * this.lineH);
    this.cols = Math.ceil(w / this.cw);
    this.rows = Math.ceil(h / this.ch);
    const n = this.cols * this.rows;
    this.lum = new Float32Array(n);
    this.glyph = new Int16Array(n).fill(-1);   // -1 = rampe ; sinon index dans this.alt
    this.chars = new Array(n).fill(' ');
    this.prevIdx = new Int8Array(n).fill(-1);
    this.seed = new Float32Array(n).map(() => Math.random());
    this.alt = DENSE + RAIN;
  }

  start(scene) { this.scene = scene; if (!this.running) { this.running = true; requestAnimationFrame(this._loop); } }
  stop() { this.running = false; }

  _loop(now) {
    if (!this.running) return;
    requestAnimationFrame(this._loop);
    if (now - this._last < 1000 / this.fps - 2) return;
    const dt = Math.min(0.1, (now - (this._last || now)) / 1000);
    this._last = now;
    this.t += dt;
    if (document.hidden) return;
    this.lum.fill(0);
    this.glyph.fill(-1);
    this.scene?.(this, this.t, dt);
    this.draw();
  }

  draw() {
    const { ctx, cols, rows, lum, chars, glyph, prevIdx } = this;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.font = `${this.fs}px ${MONO}`;
    ctx.textBaseline = 'top';
    const LV = 6;
    const lines = Array.from({ length: LV }, () => new Array(cols));
    const R = RAMP.length - 1;
    for (let j = 0; j < rows; j++) {
      for (let k = 0; k < LV; k++) lines[k].fill(' ');
      let any = false;
      for (let i = 0; i < cols; i++) {
        const c = j * cols + i;
        const l = lum[c];
        if (l < 0.03) { prevIdx[c] = -1; continue; }
        const L = l > 1 ? 1 : l;
        let ch;
        if (glyph[c] >= 0) ch = this.alt[glyph[c] % this.alt.length];
        else {
          let idx = Math.round(L * R);
          if (idx !== prevIdx[c] || Math.random() < this.flicker) {
            const jitter = Math.random() < 0.25 ? (Math.random() < 0.5 ? -1 : 1) : 0;
            chars[c] = RAMP[clamp(idx + jitter, 1, R)];
            prevIdx[c] = idx;
          }
          ch = chars[c];
        }
        lines[Math.min(LV - 1, Math.floor(L * LV))][i] = ch;
        any = true;
      }
      if (!any) continue;
      for (let k = 0; k < LV; k++) {
        const s = lines[k].join('');
        if (!s.trim()) continue;
        const a = 0.22 + 0.78 * ((k + 1) / LV);
        const [r, g, b] = this.color;
        ctx.fillStyle = k === LV - 1 ? '#fff' : `rgba(${r},${g},${b},${a.toFixed(2)})`;
        ctx.fillText(s, 0, j * this.ch);
      }
    }
  }

  // Masque de luminance depuis un dessin 2D (titre, silhouette…)
  maskFrom(draw) {
    const off = document.createElement('canvas');
    off.width = Math.ceil(this.w); off.height = Math.ceil(this.h);
    const c = off.getContext('2d');
    c.fillStyle = '#000'; c.fillRect(0, 0, off.width, off.height);
    draw(c, off.width, off.height);
    const data = c.getImageData(0, 0, off.width, off.height).data;
    const m = new Float32Array(this.cols * this.rows);
    for (let j = 0; j < this.rows; j++) for (let i = 0; i < this.cols; i++) {
      let s = 0;
      for (const [ox, oy] of [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]]) {
        const x = Math.min(off.width - 1, Math.floor((i + ox) * this.cw));
        const y = Math.min(off.height - 1, Math.floor((j + oy) * this.ch));
        s += data[(y * off.width + x) * 4];
      }
      m[j * this.cols + i] = s / (4 * 255);
    }
    return m;
  }
}

// ── Couche tramée (Bayer 8×8, points ronds via masque CSS) ───
const BAYER = (() => {
  const b = [[0, 2], [3, 1]];
  let m = b;
  for (let n = 2; n < 8; n *= 2) {
    const nm = [];
    for (let y = 0; y < n * 2; y++) { nm[y] = []; for (let x = 0; x < n * 2; x++) nm[y][x] = 4 * m[y % n][x % n] + b[Math.floor(y / n)][Math.floor(x / n)]; }
    m = nm;
  }
  return m.map((r) => r.map((v) => (v + 0.5) / 64));
})();

export class DitherLayer {
  constructor(canvas, { scale = 3, fps = 14 } = {}) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.scale = scale; this.fps = fps; this.t = 0; this._last = 0;
    this._loop = this._loop.bind(this);
    this.resize();
    addEventListener('resize', () => this.resize());
  }
  resize() {
    const w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight;
    this.vw = w; this.vh = h;
    this.w = Math.ceil(w / this.scale); this.h = Math.ceil(h / this.scale);
    this.canvas.width = this.w; this.canvas.height = this.h;
    this.img = this.ctx.createImageData(this.w, this.h);
  }
  start(fn) { this.fn = fn; if (!this.running) { this.running = true; requestAnimationFrame(this._loop); } }
  stop() { this.running = false; }
  _loop(now) {
    if (!this.running) return;
    requestAnimationFrame(this._loop);
    if (now - this._last < 1000 / this.fps) return;
    const dt = Math.min(0.2, (now - (this._last || now)) / 1000);
    this._last = now; this.t += dt;
    if (document.hidden || !this.fn) return;
    const { w, h, img } = this; const d = img.data;
    const asp = w / h;
    for (let y = 0; y < h; y++) {
      const row = BAYER[y & 7];
      for (let x = 0; x < w; x++) {
        const l = this.fn(x / w, y / h, this.t, asp);
        const on = l > row[x & 7];
        const p = (y * w + x) * 4;
        d[p] = d[p + 1] = d[p + 2] = on ? 235 : 0;
        d[p + 3] = on ? 255 : 0;
      }
    }
    this.ctx.putImageData(img, 0, 0);
  }
}

// ── Scène : l'épée plantée (raymarching SDF) ─────────────────
export function makeSwordScene(opts = {}) {
  let ang = 0;
  const S = { cx: 0.62, cy: 0, zoom: 1, ...opts };
  let ca = 1, sa = 0;

  function sdSword(x, y, z) {
    const rx = x * ca - z * sa, rz = x * sa + z * ca;
    x = rx; z = rz;
    const ax = Math.abs(x), az = Math.abs(z);
    // lame (section losange, effilée vers la pointe)
    const tipY = -0.3, topY = 1.28;
    const yy = y < tipY ? tipY : y > topY ? topY : y;
    const k = Math.min(1, (yy - tipY) / 0.42);
    const hw = 0.11 * k + 0.004 + (yy > 1.18 ? (yy - 1.18) * 0.12 : 0), th = 0.024 * k + 0.002;
    const dd = (ax * th + az * hw - hw * th) / Math.hypot(hw, th);
    const dy = Math.max(tipY - y, y - topY, 0);
    let d = dd > 0 ? Math.hypot(dd, dy) : dy > 0 ? dy : dd;
    // garde (légèrement recourbée)
    const gy = y - 1.31 + 0.55 * x * x;
    const qx = ax - 0.37, qy = Math.abs(gy) - 0.028, qz = az - 0.042;
    const g = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - 0.008;
    d = Math.min(d, g);
    // quillons
    d = Math.min(d, Math.hypot(ax - 0.375, y - 1.31 + 0.55 * 0.137, z) - 0.042);
    // fusée (filetée)
    const r = Math.hypot(x, z) - (0.03 + 0.005 * Math.sin(y * 140));
    const fy = Math.abs(y - 1.48) - 0.15;
    d = Math.min(d, Math.max(r, fy));
    // pommeau
    d = Math.min(d, Math.hypot(x, (y - 1.68) * 0.9, z * 1.6) - 0.058);
    return d;
  }

  return function sword(L, t) {
    const { cols, rows, lum, glyph } = L;
    ang = t * 0.32 + 0.6;
    ca = Math.cos(ang); sa = Math.sin(ang);
    const W = cols * L.cw, H = rows * L.ch;
    const aspect = W / H;
    const ro = [0, 1.0, 3.6 / S.zoom];
    const ta = [0, 0.82, 0];
    let f = [ta[0] - ro[0], ta[1] - ro[1], ta[2] - ro[2]];
    const fl = Math.hypot(...f); f = f.map((v) => v / fl);
    let rgt = [-f[2], 0, f[0]]; const rl = Math.hypot(...rgt); rgt = rgt.map((v) => v / rl);
    const up = [rgt[1] * f[2] - rgt[2] * f[1], rgt[2] * f[0] - rgt[0] * f[2], rgt[0] * f[1] - rgt[1] * f[0]];
    const focal = 1.9;
    const lx = -0.55, ly = 0.7, lz = 0.45, ll = Math.hypot(lx, ly, lz);
    const Lx = lx / ll, Ly = ly / ll, Lz = lz / ll;
    const cxN = S.cx * 2 - 1;
    const R = 0.5, R2 = R * R;
    const pulse = 0.85 + 0.15 * Math.sin(t * 1.3);

    for (let j = 0; j < rows; j++) {
      const v = -((j + 0.5) / rows * 2 - 1) + S.cy;
      for (let i = 0; i < cols; i++) {
        const u = ((i + 0.5) / cols * 2 - 1 - cxN) * aspect;
        let dx = f[0] * focal + rgt[0] * u + up[0] * v;
        let dy = f[1] * focal + rgt[1] * u + up[1] * v;
        let dz = f[2] * focal + rgt[2] * u + up[2] * v;
        const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
        const c = j * cols + i;
        let out = 0;

        // sol
        let tg = Infinity;
        if (dy < -0.001) tg = -ro[1] / dy;

        // épée : test cylindre englobant
        const a = dx * dx + dz * dz, b = 2 * (ro[0] * dx + ro[2] * dz), cc = ro[0] * ro[0] + ro[2] * ro[2] - R2;
        const disc = b * b - 4 * a * cc;
        let hit = false, ts = 0;
        if (disc > 0) {
          const sq = Math.sqrt(disc);
          let t0 = (-b - sq) / (2 * a), t1 = Math.min((-b + sq) / (2 * a), tg);
          ts = Math.max(t0, 0);
          for (let s = 0; s < 48 && ts < t1; s++) {
            const px = ro[0] + dx * ts, py = ro[1] + dy * ts, pz = ro[2] + dz * ts;
            if (py > 1.8 && dy > 0) break;
            const d = sdSword(px, py, pz);
            if (d < 0.0015) { hit = true; break; }
            ts += d * 0.9;
          }
        }
        if (hit) {
          const px = ro[0] + dx * ts, py = ro[1] + dy * ts, pz = ro[2] + dz * ts;
          const e = 0.002;
          let nx = sdSword(px + e, py, pz) - sdSword(px - e, py, pz);
          let ny = sdSword(px, py + e, pz) - sdSword(px, py - e, pz);
          let nz = sdSword(px, py, pz + e) - sdSword(px, py, pz - e);
          const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          const dif = Math.max(0, nx * Lx + ny * Ly + nz * Lz);
          const hx = Lx - dx, hy = Ly - dy, hz = Lz - dz, hl = Math.hypot(hx, hy, hz);
          const spec = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), 28);
          const rim = Math.pow(1 - Math.abs(nx * dx + ny * dy + nz * dz), 3);
          const blade = py < 1.29;
          // gouttière centrale de la lame
          const lx2 = Math.abs(px * ca - pz * sa);
          const fuller = blade && lx2 < 0.012 && py > 0.1 ? 0.55 : 1;
          out = (0.12 + dif * (blade ? 0.55 : 0.4) + spec * (blade ? 1.1 : 0.6) + rim * 0.55) * fuller;
          if (blade) out *= 0.8 + 0.25 * pulse;
          if (out > 0.85) glyph[c] = Math.floor(hash(i, j + Math.floor(t * 6)) * 11);
        } else if (tg < Infinity) {
          const gx = ro[0] + dx * tg, gz = ro[2] + dz * tg;
          const rr = gx * gx + gz * gz;
          const pool = Math.exp(-rr * 0.55);
          const tex = fbm(gx * 3.2, gz * 3.2, 3);
          out = pool * (0.1 + 0.55 * tex) * 0.75;
          // ombre portée de l'épée (vers l'arrière-droite)
          const along = gx * 0.77 - gz * 0.63, across = Math.abs(gx * 0.63 + gz * 0.77);
          if (along > 0 && along < 1.6 && across < 0.03 + along * 0.02) out *= 0.2;
          out *= smooth(14, 2, tg);
        }
        if (out > lum[c]) lum[c] = out;
      }
    }
  };
}

// ── Pluie de chiffres (façon Matrix) ─────────────────────────
export function makeRain({ density = 0.06, speed = 9, max = 0.55, region = null } = {}) {
  let drops = [];
  let cols = 0;
  return function rain(L, t, dt) {
    if (L.cols !== cols) {
      cols = L.cols;
      drops = [];
      for (let i = 0; i < L.cols; i++) if (Math.random() < density) drops.push({ x: i, y: Math.random() * L.rows, v: speed * (0.4 + Math.random()), len: 4 + Math.random() * 14 });
    }
    for (const d of drops) {
      d.y += d.v * dt;
      if (d.y - d.len > L.rows) { d.y = -Math.random() * 20; d.x = Math.floor(Math.random() * L.cols); d.v = speed * (0.4 + Math.random()); }
      for (let k = 0; k < d.len; k++) {
        const y = Math.floor(d.y) - k;
        if (y < 0 || y >= L.rows) continue;
        if (region && !region(d.x / L.cols, y / L.rows)) continue;
        const c = y * L.cols + d.x;
        const b = (k === 0 ? 1 : (1 - k / d.len) * 0.6) * max;
        if (b > L.lum[c]) { L.lum[c] = b; L.glyph[c] = 11 + Math.floor(hash(d.x, y + Math.floor(t * 4)) * RAIN.length); }
      }
    }
  };
}

// ── Titre en caractères ──────────────────────────────────────
export function textMask(L, items) {
  return L.maskFrom((c) => {
    for (const it of items) {
      c.save();
      c.fillStyle = '#fff';
      c.textBaseline = 'alphabetic';
      c.textAlign = it.align || 'left';
      c.font = it.font;
      if (it.stroke) { c.strokeStyle = '#fff'; c.lineWidth = it.stroke; c.lineJoin = 'round'; c.strokeText(it.text, it.x, it.y); }
      c.fillText(it.text, it.x, it.y);
      c.restore();
    }
  });
}

export function applyMask(L, mask, t, { gain = 1, glitch = true, dense = true, reveal = 1 } = {}) {
  if (!mask) return;
  const { cols, rows, lum, glyph } = L;
  const gl = glitch && Math.sin(t * 2.1) > 0.93;
  const gRow = Math.floor(hash(Math.floor(t * 8), 3) * rows);
  for (let j = 0; j < rows; j++) {
    const shift = gl && Math.abs(j - gRow) < 3 ? Math.floor((hash(j, Math.floor(t * 20)) - 0.5) * 8) : 0;
    for (let i = 0; i < cols; i++) {
      const si = i - shift;
      if (si < 0 || si >= cols) continue;
      const m = mask[j * cols + si];
      if (m < 0.08) continue;
      if (reveal < 1 && hash(i * 7, j * 13) > reveal) continue;
      const c = j * cols + i;
      const v = Math.min(1, m * gain);
      if (v > lum[c]) { lum[c] = v; if (dense && v > 0.5) glyph[c] = Math.floor(hash(i, j + Math.floor(t * 3 + hash(i, j) * 3)) * 11); }
    }
  }
}

// ── La Faucheuse (silhouette peinte puis convertie) ──────────
export function reaperMask(L, { cx = 0.5, cy = 0.55, scale = 1 } = {}) {
  return L.maskFrom((c, w, h) => {
    const s = Math.min(w, h * 0.9) * 0.0021 * scale;
    c.save();
    c.translate(w * cx, h * cy);
    c.scale(s, s);
    // faux
    c.strokeStyle = 'rgba(255,255,255,0.75)';
    c.lineWidth = 7;
    c.beginPath(); c.moveTo(150, 330); c.lineTo(205, -300); c.stroke();
    const gb = c.createLinearGradient(200, -300, -60, -200);
    gb.addColorStop(0, '#fff'); gb.addColorStop(1, 'rgba(255,255,255,0.1)');
    c.fillStyle = gb;
    c.beginPath();
    c.moveTo(203, -292);
    c.bezierCurveTo(120, -360, -20, -330, -120, -230);
    c.bezierCurveTo(-20, -290, 110, -300, 200, -262);
    c.closePath(); c.fill();
    // manteau
    const g = c.createLinearGradient(-200, 0, 200, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.15)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0.75)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, -250);
    c.bezierCurveTo(70, -250, 105, -190, 100, -120);
    c.bezierCurveTo(150, -90, 175, 0, 180, 120);
    c.bezierCurveTo(190, 230, 215, 300, 235, 340);
    c.lineTo(-235, 340);
    c.bezierCurveTo(-210, 290, -190, 220, -180, 120);
    c.bezierCurveTo(-172, 0, -150, -90, -100, -120);
    c.bezierCurveTo(-105, -190, -70, -250, 0, -250);
    c.closePath(); c.fill();
    // plis
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.lineWidth = 5;
    for (const [x0, x1] of [[-60, -120], [-10, -40], [40, 60], [90, 150], [-110, -190]]) {
      c.beginPath(); c.moveTo(x0, -60); c.bezierCurveTo(x0 - 5, 80, x1, 200, x1 * 1.1, 330); c.stroke();
    }
    // vide du visage
    const fg = c.createRadialGradient(0, -150, 5, 0, -150, 75);
    fg.addColorStop(0, '#000'); fg.addColorStop(0.75, '#000'); fg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = fg;
    c.beginPath(); c.ellipse(0, -150, 58, 78, 0, 0, Math.PI * 2); c.fill();
    // lueurs des orbites
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-20, -158, 5, 0, Math.PI * 2); c.arc(20, -158, 5, 0, Math.PI * 2); c.fill();
    // main osseuse sur la faux
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath(); c.ellipse(178, -40, 20, 14, -0.3, 0, Math.PI * 2); c.fill();
    c.restore();
  });
}

// ── Chandelles (fond de la table) ────────────────────────────
export function makeCandles(spots) {
  return function candles(L, t) {
    const { cols, rows, lum, glyph } = L;
    const W = cols * L.cw, H = rows * L.ch;
    for (const s of spots) {
      const bx = s.x * W, by = s.y * H, sc = (s.s || 1) * Math.min(W, H) / 900;
      const fl = noise(t * 3 + s.x * 10, 1) - 0.5;
      const i0 = Math.max(0, Math.floor((bx - 220 * sc) / L.cw)), i1 = Math.min(cols, Math.ceil((bx + 220 * sc) / L.cw));
      const j0 = Math.max(0, Math.floor((by - 260 * sc) / L.ch)), j1 = Math.min(rows, Math.ceil((by + 260 * sc) / L.ch));
      for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
        const x = ((i + 0.5) * L.cw - bx) / sc, y = ((j + 0.5) * L.ch - by) / sc;
        let v = 0;
        // corps de la bougie
        if (Math.abs(x) < 16 && y > 0 && y < 160) v = (0.1 + 0.16 * (x < -6 ? 0.2 : x > 6 ? 0.9 : 0.5) + (y < 6 ? 0.25 : 0)) * (1 - y / 220);
        // coulures
        if (Math.abs(x + 12) < 4 && y > 0 && y < 30 + 20 * hash(s.x * 100, 1)) v = 0.4;
        // flamme
        const fx = x - fl * 10 * (-y / 50), fy = y + 30;
        const tear = Math.hypot(fx / (9 + fy * 0.08), (fy + 6) / 26);
        if (y < 0 && tear < 1.2) v = Math.max(v, 1.1 - tear * 0.85);
        // halo
        const halo = Math.exp(-(x * x + (y + 30) * (y + 30)) / (2 * 120 * 120)) * (0.28 + fl * 0.08);
        v = Math.max(v, halo * (0.6 + 0.4 * noise(i * 0.3, j * 0.3 + t)));
        const c = j * cols + i;
        if (v > lum[c]) { lum[c] = v; if (y < -8 && tear < 0.6) glyph[c] = Math.floor(hash(i, j + Math.floor(t * 10)) * 11); }
      }
    }
  };
}
