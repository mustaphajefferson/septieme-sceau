// ─────────────────────────────────────────────────────────────
//  La carte en grand : on l'incline (souris ou doigt), ses
//  calques glissent les uns sur les autres (profondeur) et un
//  reflet irisé, tramé lui aussi, court sur le papier et fait
//  chatoyer les encres rouille et or.
// ─────────────────────────────────────────────────────────────
import { CW, CH, NAMES, cardFace, compose, LUT, backCanvas } from './cardart.js';
import { bayer, abgr } from './dots.js';

const IRI = ['#ff6a3c', '#ffc23c', '#a8e05a', '#3cd0b4', '#6f9cff', '#e070d0'].map((h) => abgr(h));
const PALE = ['#ffd2c0', '#ffeab8', '#e2f4c0', '#c0f0e6', '#cfdcff', '#f4cff0'].map((h) => abgr(h));
const DEEP = ['#5a1e10', '#5a4010', '#2c4a14', '#104a40', '#1c2c60', '#4a1848'].map((h) => abgr(h));
const WHITE = abgr('#fffdf0'), GOLD = abgr('#d8a23c'), EMBER = abgr('#7a2c14'), NIGHT = abgr('#0a0705');
const clamp = (v, a = -1, b = 1) => (v < a ? a : v > b ? b : v);

export class CardView {
  constructor(root) {
    this.root = root;
    root.innerHTML = `<canvas class="cv-rays"></canvas>
      <div class="cv-head"><h2></h2><p></p></div>
      <div class="cv-fly"><div class="cv-tilt"><canvas class="cv-front" width="${CW}" height="${CH}"></canvas><img class="cv-back" alt=""></div></div>
      <div class="cv-foot"><p class="cv-cap"></p><button class="dbtn warm hidden"><span>Continuer</span></button></div>
      <button class="cv-nav prev" aria-label="Carte précédente"><span>‹</span></button><button class="cv-nav next" aria-label="Carte suivante"><span>›</span></button>`;
    this.cv = root.querySelector('.cv-front'); this.ctx = this.cv.getContext('2d');
    this.img = this.ctx.createImageData(CW, CH); this.buf = new Uint32Array(this.img.data.buffer); this.codes = new Uint8Array(CW * CH);
    this.rays = root.querySelector('.cv-rays'); this.rctx = this.rays.getContext('2d');
    this.tilt = root.querySelector('.cv-tilt'); this.fly = root.querySelector('.cv-fly'); this.btn = root.querySelector('button');
    this.open_ = false; this.tx = 0; this.ty = 0; this.gx = 0; this.gy = 0; this.lastMove = -9; this.t = 0; this.age = 0;
    const move = (e) => { const r = this.cv.getBoundingClientRect(); this.gx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width * 0.7)); this.gy = clamp((e.clientY - (r.top + r.height / 2)) / (r.height * 0.7)); this.lastMove = this.t; };
    root.addEventListener('pointermove', move); root.addEventListener('pointerdown', move);
    root.addEventListener('click', (e) => { if (!this.reward && this.age > 0.5 && !e.target.closest('button') && !this.swiped) this.close(); this.swiped = false; });
    // passer à la carte voisine : flèches, clavier, glissé
    root.querySelector('.prev').addEventListener('click', () => this.step(-1));
    root.querySelector('.next').addEventListener('click', () => this.step(1));
    addEventListener('keydown', (e) => { if (!this.open_ || this.reward) return; if (e.key === 'ArrowLeft') this.step(-1); if (e.key === 'ArrowRight') this.step(1); });
    let sx = null;
    root.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    root.addEventListener('pointerup', (e) => { if (sx == null || this.reward) return; const d = e.clientX - sx; sx = null; if (Math.abs(d) > 60) { this.swiped = true; this.step(d < 0 ? 1 : -1); } });
    this.btn.addEventListener('click', () => { const f = this.onDone; this.close(); f?.(); });
    addEventListener('resize', () => this.open_ && this.size());
  }
  get isOpen() { return this.open_; }
  size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3), room = this.reward ? 0.6 : 0.78;
    const s = Math.max(1, Math.min((innerWidth * 0.86) / CW, (innerHeight * room) / CH));
    for (const el of [this.cv, this.tilt]) { el.style.width = CW * s + 'px'; el.style.height = CH * s + 'px'; }
    // rayons du butin : basse résolution, angle et distance calculés une fois
    const px = Math.max(3, Math.round(Math.min(innerWidth, innerHeight) / 190)), W = (this.rw = Math.ceil(innerWidth / px)), H = (this.rh = Math.ceil(innerHeight / px));
    this.rays.width = W; this.rays.height = H; this.rimg = this.rctx.createImageData(W, H); this.rbuf = new Uint32Array(this.rimg.data.buffer);
    this.rang = new Float32Array(W * H); this.rrad = new Float32Array(W * H);
    const m = Math.hypot(W / 2, H / 2);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = x - W / 2, dy = y - H * 0.48; this.rang[y * W + x] = Math.atan2(dy, dx); this.rrad[y * W + x] = Math.hypot(dx, dy) / m; }
  }
  /** v : rang · plain : carte sans gravure · reward : mise en scène du butin (titre, rayons, bouton) */
  open(v, { plain = false, reward = null, onDone = null, nav = null, dir = 0 } = {}) {
    this.face = cardFace(v, plain); this.reward = reward; this.onDone = onDone; this.nav = reward ? null : nav; this.v = v;
    this.root.classList.toggle('navs', !!this.nav);
    this.root.querySelector('.cv-back').src = backCanvas().toDataURL();
    this.root.querySelector('.cv-head h2').textContent = reward?.title || '';
    this.root.querySelector('.cv-head p').textContent = reward?.sub || '';
    this.root.querySelector('.cv-cap').textContent = reward ? '' : (plain ? `Rang ${v} · gravure à gagner` : `${NAMES[v]} · rang ${v}`) + ' — incline la carte';
    this.btn.classList.toggle('hidden', !reward); this.btn.querySelector('span').textContent = reward?.button || 'Continuer';
    this.root.classList.toggle('reward', !!reward);
    this.root.classList.remove('hidden');
    this.open_ = true; this.age = 0; this.gx = this.gy = 0; this.tx = 0.9; this.ty = -0.5; this.lastMove = -9;
    this.size();
    this.fly.style.animation = 'none'; void this.fly.offsetWidth; this.fly.style.animation = dir ? `cv-slide-${dir > 0 ? 'r' : 'l'} .42s cubic-bezier(.2, .8, .25, 1) both` : '';
    if (dir) { this.age = 0.6; this.tx = -dir * 0.9; }
    this.frame(this.t, 0);
  }
  close() { this.open_ = false; this.root.classList.add('hidden'); }
  /** carte voisine (nav(v, dir) → { v, plain } ou null) */
  step(dir) { const n = this.nav?.(this.v, dir); if (n) { this.onStep?.(); this.open(n.v, { plain: n.plain, nav: this.nav, dir }); } }

  frame(t, dt) {
    if (!this.open_) return;
    this.t = t; this.age += dt;
    // sans geste, la carte se balance toute seule
    const idle = t - this.lastMove > 1.6, gx = idle ? Math.sin(t * 0.8) * 0.62 : this.gx, gy = idle ? Math.cos(t * 0.57) * 0.4 : this.gy;
    const k = Math.min(1, dt * 7); this.tx += (gx - this.tx) * k; this.ty += (gy - this.ty) * k;
    const tx = this.tx, ty = this.ty;
    this.tilt.style.setProperty('--ry', (tx * 17).toFixed(2) + 'deg'); this.tilt.style.setProperty('--rx', (-ty * 13).toFixed(2) + 'deg');
    this.tilt.style.setProperty('--sx', (-tx * 16).toFixed(1) + 'px'); this.tilt.style.setProperty('--sy', (14 - ty * 10).toFixed(1) + 'px');
    const { codes, buf } = this;
    compose(this.face, codes, tx, ty, 8);
    // le reflet : une bande irisée qui traverse la carte quand on l'incline
    const gp = 0.5 + tx * 0.6 - ty * 0.22, ph = tx * 2.6 - ty * 1.5 + t * 0.05;
    for (let y = 0, i = 0; y < CH; y++) {
      const dy = (y / CH) * 0.36;
      for (let x = 0; x < CW; x++, i++) {
        const q = codes[i], d = (x / CW) * 0.64 + dy, b = bayer(x, y);
        const g = 1 - Math.abs(d - gp) * 4.6;                                  // intensité du reflet (≤ 0 hors de la bande)
        const h = ((((d * 3.2 + ph) % 1) + 1) % 1 * 6) | 0;                    // teinte, le long de la diagonale
        let col = LUT[q];
        if (q >= 3) { const s = Math.sin((d * 6 + ph * 2.2) * 6.2832); if ((s - 0.15) * 70 > b) col = IRI[h]; if (g > 0.75) col = WHITE; } // encres rouille et or : feuille irisée
        else if (g > 0) { if (q === 2) { if (g > 0.9) col = WHITE; else if (g * 30 > b) col = PALE[h]; } else if (g * 20 > b) col = DEEP[h]; }
        buf[i] = col;
      }
    }
    this.ctx.putImageData(this.img, 0, 0);
    if (this.reward) this.drawRays(t);
  }
  drawRays(t) {
    const { rbuf, rang, rrad } = this, W = this.rw, n = rbuf.length, grow = Math.min(1, this.age / 1.2);
    for (let i = 0; i < n; i++) {
      const r = rrad[i], ray = Math.sin(rang[i] * 10 + t * 0.35) * 0.5 + 0.5, v = ray * ray * (1.05 - r) * grow, b = bayer(i % W, (i / W) | 0);
      rbuf[i] = v * 78 > b + 1 ? (v * 30 > b ? GOLD : EMBER) : NIGHT;
    }
    this.rctx.putImageData(this.rimg, 0, 0);
  }
}
