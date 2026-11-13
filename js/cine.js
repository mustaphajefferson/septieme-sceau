// ─────────────────────────────────────────────────────────────
//  Les cinématiques : des planches gravées qui s'animent.
//  Chaque planche apparaît en se tramant depuis le noir, ses
//  calques dérivent (profondeur), des particules la traversent
//  (pluie, braises, cendres, lucioles, poussière), des calques
//  s'allument au fil du temps (yeux, sceaux, éclair), et le
//  texte s'écrit à côté. Toucher : finir la ligne / planche
//  suivante. « Passer » saute tout.
// ─────────────────────────────────────────────────────────────
import { plateFace, compose, LUT, CW, CH, PLATE } from './cardart.js';
import { PLATES } from './plates.js';
import { bayer } from './dots.js';
import { sound } from './audio.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ease = (k) => k * k * (3 - 2 * k);
const PW = PLATE.WW + 16, PH = PLATE.WH + 16, OX = PLATE.WX - 8, OY = PLATE.WY - 8;   // la planche seule, sans la place du cartouche
const faces = new Map();
const faceOf = (id) => { if (!faces.has(id)) faces.set(id, plateFace(PLATES[id], id.length * 31 + id.charCodeAt(0))); return faces.get(id); };
export const clearPlates = () => faces.clear();

// réglages des particules : code de couleur (1 encre, 2 papier, 3 rouille, 4 or)
const FX = {
  rain: { n: 140, code: 2, spawn: (p) => { p.x = Math.random() * 260 - 20; p.y = Math.random() * -40; p.vx = -40; p.vy = 300 + Math.random() * 80; p.len = 4; } },
  ash: { n: 70, code: 2, spawn: (p) => { p.x = Math.random() * 224; p.y = Math.random() * -20; p.vx = 4 + Math.random() * 6; p.vy = 10 + Math.random() * 14; p.wob = Math.random() * 6; } },
  embers: { n: 60, code: 3, alt: 4, spawn: (p) => { p.x = 40 + Math.random() * 144; p.y = 330 + Math.random() * 30; p.vx = (Math.random() - 0.5) * 10; p.vy = -24 - Math.random() * 30; p.wob = Math.random() * 6; } },
  flies: { n: 26, code: 4, spawn: (p) => { p.x = 20 + Math.random() * 184; p.y = 80 + Math.random() * 220; p.vx = (Math.random() - 0.5) * 8; p.vy = (Math.random() - 0.5) * 8; p.wob = Math.random() * 6; p.blink = true; } },
  dust: { n: 160, code: 2, alt: 4, spawn: (p) => { p.x = 70 + Math.random() * 84; p.y = 140 + Math.random() * 120; p.vx = (Math.random() - 0.5) * 16; p.vy = -12 - Math.random() * 26; p.wob = Math.random() * 6; } },
  souls: { n: 30, code: 2, spawn: (p) => { p.x = Math.random() * 224; p.y = 330 + Math.random() * 40; p.vx = (Math.random() - 0.5) * 6; p.vy = -14 - Math.random() * 12; p.wob = Math.random() * 6; p.len = 3; } },
};

export class Cine {
  constructor(root) {
    this.root = root;
    root.innerHTML = `<canvas class="ci-bg"></canvas>
      <div class="ci-stage"><div class="ci-tilt"><canvas class="ci-plate" width="${PW}" height="${PH}"></canvas></div></div>
      <div class="ci-text"><h2></h2><div class="ci-lines"></div></div>
      <button class="ci-skip"><span>Passer</span></button><p class="ci-hint">touche pour continuer</p>`;
    this.cv = root.querySelector('.ci-plate'); this.ctx = this.cv.getContext('2d');
    this.img = this.ctx.createImageData(PW, PH); this.buf = new Uint32Array(this.img.data.buffer); this.codes = new Uint8Array(CW * CH);
    this.bg = root.querySelector('.ci-bg'); this.bctx = this.bg.getContext('2d');
    this.tilt = root.querySelector('.ci-tilt'); this.h2 = root.querySelector('h2'); this.lines = root.querySelector('.ci-lines');
    this.on = false;
    root.querySelector('.ci-skip').addEventListener('click', (e) => { e.stopPropagation(); this.finish(); });
    root.addEventListener('click', () => this.tap());
    addEventListener('keydown', (e) => { if (!this.on) return; if (e.key === 'Escape') this.finish(); else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); this.tap(); } });
    addEventListener('resize', () => this.on && this.size());
  }
  size() {
    const tall = innerHeight > innerWidth * 1.05;
    const s = Math.min(tall ? (innerWidth * 0.86) / PW : (innerWidth * 0.46) / PW, (innerHeight * (tall ? 0.56 : 0.84)) / PH);
    this.cv.style.width = PW * s + 'px'; this.cv.style.height = PH * s + 'px';
    this.root.classList.toggle('tall', tall);
    const px = Math.max(4, Math.round(Math.min(innerWidth, innerHeight) / 150));
    this.bw = this.bg.width = Math.ceil(innerWidth / px); this.bh = this.bg.height = Math.ceil(innerHeight / px);
    this.bimg = this.bctx.createImageData(this.bw, this.bh); this.bbuf = new Uint32Array(this.bimg.data.buffer);
  }
  /** joue une séquence de planches ; se résout à la fin (ou si on passe) */
  play(seq) {
    this.seq = seq; this.i = -1; this.on = true;
    this.root.classList.remove('hidden', 'out'); this.size();
    this.t0 = performance.now(); this.last = this.t0;
    return new Promise((res) => { this.res = res; this.next(); this.raf = requestAnimationFrame((t) => this.loop(t)); });
  }
  next() {
    this.i++;
    if (this.i >= this.seq.length) return this.finish();
    const s = (this.cur = this.seq[this.i]);
    this.face = faceOf(s.plate); this.t = 0; this.out = 0; this.flash = 0; this.shake = 0;
    this.hidden = new Set(s.hide || []); this.events = (s.events || []).map((e) => ({ ...e }));
    const fx = FX[s.fx]; this.parts = [];
    if (fx) for (let k = 0; k < (s.n || fx.n); k++) { const p = { code: fx.code }; fx.spawn(p); if (fx.alt && Math.random() < 0.3) p.code = fx.alt; p.y -= Math.random() * (fx === FX.rain ? 360 : 0); if (s.fx !== 'embers' && s.fx !== 'souls' && s.fx !== 'dust') p.y = Math.random() * 330; else p.y = 330 - Math.random() * 330; p.age = Math.random() * 10; this.parts.push(p); }
    // le texte
    this.h2.textContent = s.title || ''; this.h2.classList.remove('in'); void this.h2.offsetWidth; if (s.title) this.h2.classList.add('in');
    this.lines.innerHTML = '';
    this.queue = (s.text || []).map((l) => (typeof l === 'string' ? { t: l } : l));
    this.typing = null; this.typed = 0; this.doneAt = 0;
    this.root.classList.remove('ready');
    if (s.title) sound.play('toll');
    else sound.play('whoosh');
    this.lineDelay = s.title ? 1.1 : 0.7;
  }
  // ── le texte s'écrit lettre à lettre ; les démos de règles posent leurs cartes ──
  typeStep(dt) {
    if (this.lineDelay > 0) { this.lineDelay -= dt; return; }
    if (!this.typing) {
      const l = this.queue.shift();
      if (!l) { if (!this.doneAt) { this.doneAt = this.t; this.root.classList.add('ready'); } return; }
      const p = document.createElement('p'); p.className = 'ci-line' + (l.cls ? ' ' + l.cls : ''); this.lines.appendChild(p);
      this.typing = { l, p, n: 0, acc: 0 };
    }
    const tp = this.typing, txt = tp.l.t;
    tp.acc += dt * 46;
    while (tp.acc >= 1 && tp.n < txt.length) { tp.n++; tp.acc -= 1; }
    tp.p.textContent = txt.slice(0, tp.n);
    if (tp.n >= txt.length) { this.endLine(); this.lineDelay = 0.35; }
  }
  endLine() {
    const { l, p } = this.typing; p.textContent = l.t;
    if (l.chips) {
      const row = document.createElement('div'); row.className = 'ci-chips'; p.appendChild(row);
      l.chips.forEach((v, k) => setTimeout(() => { const ch = document.createElement('i'); ch.className = 'chip' + (String(v).endsWith('!') ? ' dup' : /^[+×]/.test(String(v)) ? ' mod' : /^[A-Za-zé]/.test(String(v)) ? ' bon' : ''); ch.textContent = String(v).replace('!', ''); row.appendChild(ch); sound.play('flip'); }, 180 * k));
      const after = 180 * l.chips.length + 120;
      if (l.sum) setTimeout(() => { const b = document.createElement('b'); b.className = 'ci-sum'; b.textContent = l.sum; row.appendChild(b); sound.play('gain'); }, after);
      if (l.stamp) setTimeout(() => { const b = document.createElement('em'); b.className = 'ci-stamp'; b.textContent = l.stamp; row.appendChild(b); sound.play('bust'); this.shake = 0.3; }, after);
      if (l.seal) setTimeout(() => { const b = document.createElement('em'); b.className = 'ci-seal'; b.textContent = l.seal; row.appendChild(b); sound.play('flip7'); }, after);
      this.lineDelay = (after + 500) / 1000;
    }
    this.typing = null;
  }
  tap() {
    if (!this.on || this.out) return;
    if (this.typing || this.queue.length || this.lineDelay > 0.4) { // tout afficher d'un coup
      if (this.typing) this.endLine();
      while (this.queue.length) { this.typing = { l: this.queue.shift(), p: Object.assign(document.createElement('p'), { className: 'ci-line' }) }; this.lines.appendChild(this.typing.p); this.endLine(); }
      this.lineDelay = 0; return;
    }
    this.leave();
  }
  leave() { if (!this.out) this.out = 0.001; }
  finish() {
    if (!this.on) return;
    this.on = false; cancelAnimationFrame(this.raf);
    this.root.classList.add('out');
    setTimeout(() => { this.root.classList.add('hidden'); this.res?.(); }, 420);
  }

  loop(now) {
    if (!this.on) return;
    this.raf = requestAnimationFrame((t) => this.loop(t));
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    const s = this.cur; this.t += dt;
    this.typeStep(dt);
    // événements programmés : allumer un calque, éclair, secousse, son
    for (const e of this.events) if (!e.done && this.t >= e.t) {
      e.done = true;
      if (e.show) this.hidden.delete(e.show);
      if (e.hide) this.hidden.add(e.hide);
      if (e.flash) this.flash = e.flash;
      if (e.shake) this.shake = e.shake;
      if (e.sound) sound.play(e.sound);
    }
    // fin de planche : automatiquement un moment après le texte
    const hold = s.hold ?? 3.2;
    if (this.doneAt && !this.out && this.t > this.doneAt + hold) this.leave();
    if (this.out) { this.out += dt / 0.55; if (this.out >= 1) return this.next(); }
    this.render(now / 1000, dt);
  }
  render(time, dt) {
    const s = this.cur, d = s.drift || [-0.8, -0.3, 0.8, 0.3], k = ease(Math.min(1, this.t / (s.dur || 9)));
    const tx = d[0] + (d[2] - d[0]) * k + Math.sin(time * 0.7) * 0.08, ty = d[1] + (d[3] - d[1]) * k + Math.cos(time * 0.5) * 0.06;
    const { codes, buf } = this;
    compose(this.face, codes, tx, ty, 11, this.hidden);
    // particules
    for (const p of this.parts) {
      p.age += dt;
      p.x += (p.vx + (p.wob ? Math.sin(p.age * 2 + p.wob) * 6 : 0)) * dt; p.y += p.vy * dt;
      if (p.y > 340 || p.y < -30 || p.x < -30 || p.x > 260) { FX[s.fx].spawn(p); if (s.fx === 'embers' || s.fx === 'souls' || s.fx === 'dust') p.y = 330 + Math.random() * 20; }
      if (p.blink && Math.sin(p.age * 3 + p.wob * 5) < 0.2) continue;
      const x = Math.round(p.x + tx * 9), y = Math.round(p.y + ty * 9);
      for (let j = 0; j < (p.len || 1); j++) {
        const xx = x - Math.round((p.vx / (p.vy || 1)) * j), yy = y - j;
        if (xx >= PLATE.WX && yy >= PLATE.WY && xx < PLATE.WX + PLATE.WW && yy < PLATE.WY + PLATE.WH) codes[yy * CW + xx] = p.code;
      }
    }
    // apparition (du noir) et disparition tramées, éclair
    const inK = Math.min(1, this.t / 0.9) * 64, outK = this.out ? (1 - this.out) * 64 : 64, fl = this.flash;
    for (let y = 0, o = 0; y < PH; y++) for (let x = 0; x < PW; x++, o++) {
      const i = (y + OY) * CW + x + OX; let q = codes[i]; const b = bayer(x, y);
      if (b >= inK || b >= outK) q = 1;
      else if (fl > 0 && (q === 1 || q === 2)) q = fl * 64 > b ? 3 - q : q;
      buf[o] = LUT[q];
    }
    this.ctx.putImageData(this.img, 0, 0);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.shake = Math.max(0, this.shake - dt * 1.4);
    const sh = this.shake * 14, ox = sh ? (Math.random() - 0.5) * sh : 0, oy = sh ? (Math.random() - 0.5) * sh : 0;
    this.tilt.style.transform = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px) rotateY(${(tx * 7).toFixed(2)}deg) rotateX(${(-ty * 6).toFixed(2)}deg)`;
    this.drawBg(time);
  }
  drawBg(t) { // un halo de cendre qui respire, tramé
    const { bbuf, bw, bh } = this; if (!bbuf) return;
    const c1 = LUT[1], c2 = 0xff141d28 >>> 0, c3 = 0xff20324a >>> 0, fl = this.flash, cx = this.root.classList.contains('tall') ? 0.5 : 0.36;
    for (let y = 0, i = 0; y < bh; y++) for (let x = 0; x < bw; x++, i++) {
      const dx = (x / bw - cx) * 1.6, dy = y / bh - 0.45, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const v = Math.max(0, 0.55 - r) * (0.7 + 0.3 * Math.sin(a * 7 + t * 0.3)) + fl * 0.5, b = bayer(x, y);
      bbuf[i] = v * 90 > b + 4 ? (v * 40 > b ? c3 : c2) : c1;
    }
    this.bctx.putImageData(this.bimg, 0, 0);
  }
}
