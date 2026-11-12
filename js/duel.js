// ─────────────────────────────────────────────────────────────
//  Le duel : table vue par les yeux du chevalier. La scène est
//  peinte puis tramée ; les cartes sont des objets nets posés
//  par-dessus (inspectables d'un clic).
// ─────────────────────────────────────────────────────────────
import { canvas, grad, radial, pattern, woodTex, glow, vignette, candle, TAU, clamp } from './paint.js';
import { drawFigure, fpGauntlet, skullFace } from './figure.js';
import { ZONE_DRAW } from './places.js';
import { face, back } from './cards.js';
import { bustRisk } from './game.js';
import { sound } from './audio.js';
import { icon } from './icons.js';

const $ = (s, r = document) => r.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class Duel {
  constructor() {
    this.ui = $('#duel-ui');
    this.cardsEl = $('#cards');
    this.speed = 1;
    this.els = new Map();            // id → { el, owner }
    this.rows = { me: [], foe: [] }; // ids posés
    this.held = null;
    this.reach = 0; this.reachTo = 0;
    this.foeShake = 0; this.foeAlpha = 0; this.eyes = 0;
    this.pending = null; this.pendingTarget = null;
    $('#act-hit').onclick = () => this.decide('hit');
    $('#act-stay').onclick = () => this.decide('stay');
    $('#deck').onclick = () => this.decide('hit');
    $('#tgt-foe').onclick = () => this.pickTarget(this.foeId);
    $('#tgt-me').onclick = () => this.pickTarget(this.meId);
    $('#inspect').onclick = () => $('#inspect').classList.add('hidden');
    addEventListener('keydown', (e) => {
      if (!$('#duel').classList.contains('on')) return;
      const k = e.key.toLowerCase();
      if (this.pending && (k === '1' || k === ' ' || k === 'a')) { e.preventDefault(); this.decide('hit'); }
      else if (this.pending && (k === '2' || k === 'r')) { e.preventDefault(); this.decide('stay'); }
    });
    addEventListener('resize', () => this.relayout());
  }

  // ── préparation ────────────────────────────────────────────
  setup({ foe, dealer, place, meId, foeId, kit, target, ink }) {
    this.foe = foe; this.dealer = dealer; this.place = place; this.meId = meId; this.foeId = foeId; this.kit = kit; this.target = target; this.ink = ink;
    this.cache = {}; this.foeAlpha = 0; this.reach = 0; this.held = null;
    this.rows = { me: [], foe: [] };
    for (const { el } of this.els.values()) el.remove();
    this.els.clear();
    this.cardsEl.innerHTML = '';
    $('#deck').innerHTML = `<img src="${back(100)}" alt=""><img src="${back(100)}" alt=""><img src="${back(100)}" alt="">`;
    $('#fosse').innerHTML = '';
    this.setTurn(null);
    this.relayout();
  }

  // positions écran (px CSS)
  vp() { return { w: innerWidth, h: innerHeight }; }
  spot(name) {
    const { w, h } = this.vp(), narrow = w < 760;
    return {
      deck: { x: w * (narrow ? 0.78 : 0.7), y: h * 0.575 },
      fosse: { x: w * (narrow ? 0.22 : 0.3), y: h * 0.575 },
      held: { x: w * (narrow ? 0.66 : 0.68), y: h * (narrow ? 0.66 : 0.68) },
      foe: { x: w * 0.5, y: h * 0.585 },
      me: { x: w * 0.5, y: h * (narrow ? 0.79 : 0.8) },
    }[name];
  }
  cw() { return Math.max(46, Math.min(92, innerWidth * 0.065)); }

  relayout() {
    const d = this.spot('deck'), f = this.spot('fosse');
    Object.assign($('#deck').style, { left: d.x + 'px', top: d.y + 'px' });
    Object.assign($('#fosse').style, { left: f.x + 'px', top: f.y + 'px' });
    this.layoutRow('me'); this.layoutRow('foe');
    if (this.held) this.place_(this.held, this.spot('held'), { s: 1.35, tilt: 0, rot: -5 });
    this.cache = {};
  }

  // ── cartes DOM ─────────────────────────────────────────────
  makeCard(card, owner) {
    const el = document.createElement('div');
    el.className = 'cd down';
    el.innerHTML = `<div class="cd-in"><img class="f" src="${face(card, 100)}" alt=""><img class="b" src="${back(100)}" alt=""></div>`;
    el.onclick = (e) => { e.stopPropagation(); this.inspect(card); };
    this.cardsEl.appendChild(el);
    this.els.set(card.id, { el, owner, card });
    return el;
  }
  place_(id, p, { s = 1, tilt = 50, rot = 0 } = {}) {
    const o = this.els.get(id); if (!o) return;
    const st = o.el.style;
    st.left = p.x + 'px'; st.top = p.y + 'px';
    st.setProperty('--s', s); st.setProperty('--tilt', tilt + 'deg'); st.setProperty('--rot', rot + 'deg');
    st.setProperty('--cw', this.cw() + 'px');
  }
  layoutRow(owner) {
    const ids = this.rows[owner], c = this.spot(owner), s = owner === 'me' ? 0.92 : 0.6, gap = this.cw() * s * 1.04;
    ids.forEach((id, i) => {
      const x = c.x + (i - (ids.length - 1) / 2) * gap;
      const o = this.els.get(id); if (o) o.el.style.zIndex = 10 + i;
      this.place_(id, { x, y: c.y }, { s, tilt: owner === 'me' ? 46 : 54, rot: ((i * 37) % 7 - 3) * 0.6 });
    });
  }
  async toRow(id, owner) {
    if (this.held === id) this.held = null;
    if (!this.rows[owner].includes(id)) this.rows[owner].push(id);
    this.layoutRow(owner);
    await wait(380 / this.speed);
  }
  async toFosse(id) {
    const o = this.els.get(id); if (!o) return;
    if (this.held === id) this.held = null;
    for (const k of ['me', 'foe']) this.rows[k] = this.rows[k].filter((x) => x !== id);
    const f = this.spot('fosse');
    this.place_(id, { x: f.x + (Math.random() - 0.5) * 10, y: f.y + (Math.random() - 0.5) * 6 }, { s: 0.6, tilt: 54, rot: (Math.random() - 0.5) * 40 });
    o.el.style.zIndex = 5;
    this.layoutRow('me'); this.layoutRow('foe');
    await wait(420 / this.speed);
    const fo = $('#fosse'); fo.innerHTML = ''; const im = document.createElement('img'); im.src = face(o.card, 100); fo.appendChild(im);
    o.el.remove(); this.els.delete(id);
  }
  async sweep() {
    if (this.held) await this.toRow(this.held, 'me');
    const ids = [...this.els.keys()];
    if (!ids.length) return;
    sound.play('reshuffle');
    await Promise.all(ids.map((id, i) => wait(i * 35).then(() => this.toFosse(id))));
  }

  inspect(card) {
    const box = $('#inspect');
    box.innerHTML = `<div class="ins-card"><img src="${face(card, 320)}" alt=""><i class="holo"></i><i class="glare"></i></div>`;
    box.classList.remove('hidden');
    const ic = box.querySelector('.ins-card');
    box.onpointermove = (e) => {
      const r = ic.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width, my = (e.clientY - r.top) / r.height;
      ic.style.setProperty('--mx', mx * 100 + '%'); ic.style.setProperty('--my', my * 100 + '%');
      ic.style.setProperty('--rx', ((0.5 - my) * 16).toFixed(1) + 'deg'); ic.style.setProperty('--ry', ((mx - 0.5) * 20).toFixed(1) + 'deg');
    };
    sound.play('flip');
  }

  // ── jauge et valeurs ───────────────────────────────────────
  sync(snap) {
    this.snap = snap;
    const me = snap.players.find((p) => p.id === this.meId), foe = snap.players.find((p) => p.id === this.foeId);
    const T = this.target;
    const pos = (v) => clamp(v / T) * 100 + '%';
    $('#g-me').style.bottom = pos(me.score); $('#g-foe').style.bottom = pos(foe.score);
    $('#g-me-hand').style.bottom = pos(me.score); $('#g-me-hand').style.height = Math.max(0, clamp((me.score + (me.status === 'bust' ? 0 : me.hand)) / T) - clamp(me.score / T)) * 100 + '%';
    $('#g-foe-hand').style.bottom = pos(foe.score); $('#g-foe-hand').style.height = Math.max(0, clamp((foe.score + (foe.status === 'bust' ? 0 : foe.hand)) / T) - clamp(foe.score / T)) * 100 + '%';
    $('#g-me b').textContent = me.score; $('#g-foe b').textContent = foe.score;
    $('#g-target').textContent = T;
    $('#v-me').textContent = me.status === 'bust' ? '✕' : me.hand || '';
    $('#v-foe').textContent = foe.status === 'bust' ? '✕' : foe.hand || '';
    $('#v-me').className = 'val me ' + me.status; $('#v-foe').className = 'val foe ' + foe.status;
    this.eyes = snap.turn === this.foeId ? 1 : 0;
  }
  setTurn(pid) {
    const mine = pid && pid === this.meId;
    $('#acts').classList.toggle('on', !!mine);
    $('#deck').classList.toggle('live', !!mine);
  }

  // ── rendu de la scène ──────────────────────────────────────
  render(c, W, H, t, dt) {
    const key = W + 'x' + H;
    if (this.cache.key !== key) this.cache = { key };
    const C = this.cache;
    if (!C.bg) {
      C.bg = canvas(W, H); const b = C.bg.getContext('2d');
      (ZONE_DRAW[this.place] || ZONE_DRAW.foret)(b, W, H, 3);
      b.fillStyle = 'rgba(0,0,0,.72)'; b.fillRect(0, 0, W, H);
    }
    if (!C.foe) {
      C.foe = canvas(W, H); const f = C.foe.getContext('2d');
      const s = Math.min(H / 1180, W / 820), headY = H * 0.5 - 600 * s;
      f.save(); f.beginPath(); f.rect(0, 0, W, H * 0.505); f.clip();
      glow(f, W * 0.5, headY + 140 * s, 700 * s, 0.22);
      drawFigure(f, { x: W * 0.5, y: headY + 905 * s, s, pose: 'table', kit: this.foe.kit, t: 2, bust: true, breathe: false });
      f.restore();
      C.foeS = s; C.headY = headY;
    }
    if (!C.dealer && this.dealer) {
      C.dealer = canvas(W, H); const d = C.dealer.getContext('2d');
      const s = Math.min(H / 1300, W / 900);
      d.save(); d.beginPath(); d.rect(0, 0, W, H * 0.505); d.clip();
      drawFigure(d, { x: W * 0.86, y: H * 0.2 + 905 * s, s, pose: 'garde', kit: this.dealer.kit, t: 2, k: 0.55, breathe: false });
      d.restore();
    }
    if (!C.table) {
      C.table = canvas(W, H); const tb = C.table.getContext('2d');
      const fy = H * 0.5;
      const top = new Path2D(); top.moveTo(W * 0.1, fy); top.lineTo(W * 0.9, fy); top.lineTo(W * 1.25, H); top.lineTo(-W * 0.25, H); top.closePath();
      tb.fillStyle = pattern(tb, woodTex(), H / 700, Math.PI / 2 + 0.02); tb.fill(top);
      tb.save(); tb.clip(top); tb.globalCompositeOperation = 'multiply';
      tb.fillStyle = grad(tb, 0, fy, 0, H, [[0, 0.22], [0.45, 0.5], [1, 0.12]]); tb.fill(top);
      tb.globalCompositeOperation = 'source-over';
      // sceau gravé
      tb.strokeStyle = 'rgba(0,0,0,.6)'; tb.lineWidth = 3; tb.beginPath(); tb.ellipse(W * 0.5, H * 0.7, W * 0.16, H * 0.07, 0, 0, TAU); tb.stroke();
      for (let k = 0; k < 7; k++) { const a = k * TAU / 7; tb.fillStyle = 'rgba(0,0,0,.6)'; tb.beginPath(); tb.ellipse(W * 0.5 + Math.cos(a) * W * 0.16, H * 0.7 + Math.sin(a) * H * 0.07, 6, 3, 0, 0, TAU); tb.fill(); }
      tb.restore();
      tb.strokeStyle = 'rgba(255,255,255,.75)'; tb.lineWidth = 2; tb.beginPath(); tb.moveTo(W * 0.1, fy); tb.lineTo(W * 0.9, fy); tb.stroke();
      tb.fillStyle = grad(tb, 0, fy, 0, fy + 10, [[0, 0.5], [1, 0]]); tb.fillRect(W * 0.1, fy, W * 0.8, 8);
      // crâne et os
      skullFace(tb, W * 0.19, H * 0.545, H / 900, { k: 0.9, sc: 1 }, { teeth: true });
      tb.strokeStyle = 'rgba(220,220,220,.8)'; tb.lineWidth = H / 120; tb.lineCap = 'round';
      tb.beginPath(); tb.moveTo(W * 0.8, H * 0.54); tb.lineTo(W * 0.86, H * 0.56); tb.stroke();
    }
    c.drawImage(C.bg, 0, 0);
    // donneur (boss) debout derrière
    if (C.dealer) { c.save(); c.translate(0, Math.sin(t * 0.9) * 1.5); c.drawImage(C.dealer, 0, 0); c.restore(); }
    // adversaire
    this.foeAlpha = Math.min(1, this.foeAlpha + dt * 0.8);
    const sh = this.foeShake > 0 ? (Math.random() - 0.5) * this.foeShake * W * 0.02 : 0;
    this.foeShake = Math.max(0, this.foeShake - dt * 2);
    c.save(); c.globalAlpha = this.foeAlpha;
    const br = Math.sin(t * 1.1) * 0.006;
    c.translate(W * 0.5 + sh, H * 0.5); c.scale(1 + br * 0.3, 1 + br); c.translate(-W * 0.5, -H * 0.5);
    c.drawImage(C.foe, 0, 0);
    c.restore();
    if (this.eyes) { const y = C.headY + 6 * C.foeS; glow(c, W * 0.5, y, 30 * C.foeS * 3, 0.25 + 0.1 * Math.sin(t * 6)); }
    c.drawImage(C.table, 0, 0);
    // cierges
    const cs = H / 800;
    candle(c, W * 0.12, H * 0.56, cs, 70, t, 1); candle(c, W * 0.155, H * 0.545, cs * 0.8, 46, t, 2);
    candle(c, W * 0.88, H * 0.56, cs, 90, t, 3);
    vignette(c, W, H, 0.8, 0.32);
    // gantelets du chevalier
    this.reach += (this.reachTo - this.reach) * Math.min(1, dt * 10);
    const gs = Math.min(H / 1050, W / 900), spiky = this.kit.gauntlets === 'epines';
    fpGauntlet(c, W * 0.2 + Math.sin(t * 1.1) * 2, H * 1.02, gs, -1, { spiky, t });
    const d = this.spotCanvas('deck', W, H);
    const rx = lerpN(W * 0.8, d.x, this.reach * 0.75), ry = lerpN(H * 1.02, d.y + H * 0.2, this.reach * 0.75);
    fpGauntlet(c, rx + Math.sin(t * 1.3) * 2, ry, gs * (1 - this.reach * 0.25), 1, { spiky, reach: this.reach, curl: this.reach * 0.6, t });
  }
  spotCanvas(name, W, H) { const p = this.spot(name); return { x: p.x / innerWidth * W, y: p.y / innerHeight * H }; }

  // ── événements du moteur ───────────────────────────────────
  async present(ev, snap) {
    const me = (pid) => pid === this.meId;
    switch (ev.type) {
      case 'gameStart': this.sync(snap); await wait(400); break;
      case 'roundStart': await this.sweep(); this.sync(snap); sound.play('toll'); await wait(500 / this.speed); break;
      case 'turn': this.sync(snap); break;
      case 'reveal': {
        this.sync(snap);
        const d = this.spot('deck');
        if (me(ev.pid)) {
          if (this.held) await this.toRow(this.held, 'me');
          this.reachTo = 1; await wait(220 / this.speed);
          const el = this.makeCard(ev.card, 'me');
          this.place_(ev.card.id, d, { s: 0.6, tilt: 54 }); el.style.zIndex = 60;
          void el.offsetWidth;
          sound.play('whoosh');
          this.held = ev.card.id;
          this.place_(ev.card.id, this.spot('held'), { s: 1.35, tilt: 0, rot: -5 });
          this.reachTo = 0;
          await wait(260 / this.speed); el.classList.remove('down'); sound.play('flip');
          await wait(380 / this.speed);
        } else {
          const el = this.makeCard(ev.card, 'foe');
          this.place_(ev.card.id, d, { s: 0.6, tilt: 54 }); void el.offsetWidth;
          sound.play('whoosh');
          this.rows.foe.push(ev.card.id); this.layoutRow('foe');
          await wait(200 / this.speed); el.classList.remove('down'); sound.play('flip');
          await wait(420 / this.speed);
        }
        break;
      }
      case 'gain': this.sync(snap); sound.play('gain'); break;
      case 'bust': {
        this.sync(snap);
        const o = this.els.get(ev.card.id);
        o?.el.classList.add('dup');
        const rowIds = me(ev.pid) ? this.rows.me : this.rows.foe;
        for (const id of rowIds) { const x = this.els.get(id); if (x?.card.v === ev.card.v) x.el.classList.add('dup'); }
        sound.play('bust'); this.app.flash(0.9, 'invert'); this.app.shake();
        if (!me(ev.pid)) this.foeShake = 1;
        await wait(900 / this.speed);
        if (me(ev.pid) && this.held) await this.toRow(this.held, 'me');
        for (const id of (me(ev.pid) ? this.rows.me : this.rows.foe)) this.els.get(id)?.el.classList.add('burnt');
        await wait(500 / this.speed);
        break;
      }
      case 'saved':
        this.sync(snap); sound.play('chance');
        await Promise.all([this.toFosse(ev.card.id), this.toFosse(ev.chance.id)]);
        break;
      case 'flip7':
        this.sync(snap); sound.play('flip7'); this.app.flash(1, 'flash');
        if (me(ev.pid) && this.held) await this.toRow(this.held, 'me');
        for (const id of (me(ev.pid) ? this.rows.me : this.rows.foe)) this.els.get(id)?.el.classList.add('sealed');
        await wait(1400 / this.speed);
        break;
      case 'stay':
        this.sync(snap); sound.play('stay');
        if (me(ev.pid) && this.held) await this.toRow(this.held, 'me');
        for (const id of (me(ev.pid) ? this.rows.me : this.rows.foe)) this.els.get(id)?.el.classList.add('sealed');
        await wait(500 / this.speed);
        break;
      case 'freeze':
      case 'three':
        this.sync(snap);
        sound.play(ev.type === 'freeze' ? 'freeze' : 'three');
        await this.toFosse(ev.card.id);
        if (ev.type === 'freeze') for (const id of (me(ev.to) ? this.rows.me : this.rows.foe)) this.els.get(id)?.el.classList.add('frost');
        if (me(ev.to) && ev.type === 'freeze' && this.held) await this.toRow(this.held, 'me');
        await wait(600 / this.speed);
        break;
      case 'setAside': this.sync(snap); if (me(ev.pid) && this.held === ev.card.id) await this.toRow(ev.card.id, 'me'); break;
      case 'give': {
        this.sync(snap); sound.play('chance');
        const o = this.els.get(ev.card.id);
        if (o) { if (this.held === ev.card.id) this.held = null; for (const k of ['me', 'foe']) this.rows[k] = this.rows[k].filter((x) => x !== ev.card.id); o.owner = me(ev.to) ? 'me' : 'foe'; await this.toRow(ev.card.id, o.owner); this.layoutRow(me(ev.to) ? 'foe' : 'me'); }
        break;
      }
      case 'discard': this.sync(snap); await this.toFosse(ev.card.id); break;
      case 'void': {
        this.sync(snap);
        const el = this.els.get(ev.card.id)?.el;
        el?.classList.add('burnt'); sound.play('freeze'); this.app.flash(0.5);
        await wait(700);
        await this.toFosse(ev.card.id);
        break;
      }
      case 'reshuffle': sound.play('reshuffle'); break;
      case 'roundEnd':
        if (this.held) await this.toRow(this.held, 'me');
        this.sync(snap);
        await wait(1300 / this.speed);
        break;
      case 'gameOver': this.sync(snap); break;
    }
  }

  // ── décisions ──────────────────────────────────────────────
  askDecision() {
    this.setTurn(this.meId);
    sound.setTension(bustRisk(this.snap, this.meId) * 1.6);
    return new Promise((res) => { this.pending = res; });
  }
  decide(v) {
    if (!this.pending) return;
    sound.play('click'); sound.setTension(0);
    this.setTurn(null);
    const r = this.pending; this.pending = null;
    if (v === 'stay' && this.held) this.toRow(this.held, 'me');
    r(v);
  }
  askTarget(kind, cands) {
    $('#tgt-foe').classList.toggle('on', cands.includes(this.foeId));
    $('#tgt-me').classList.toggle('on', cands.includes(this.meId));
    $('#tgt-sym').innerHTML = icon({ freeze: 'frost', three: 'bell', give: 'hourglass' }[kind] || 'eye');
    $('#tgt-sym').classList.add('on');
    return new Promise((res) => { this.pendingTarget = { res, cands }; });
  }
  pickTarget(pid) {
    const p = this.pendingTarget; if (!p || !p.cands.includes(pid)) return;
    sound.play('click');
    this.pendingTarget = null;
    for (const id of ['#tgt-foe', '#tgt-me', '#tgt-sym']) $(id).classList.remove('on');
    p.res(pid);
  }
  cancel() {
    if (this.pending) { const r = this.pending; this.pending = null; this.setTurn(null); r('stay'); }
    if (this.pendingTarget) { const p = this.pendingTarget; this.pendingTarget = null; p.res(p.cands[0]); }
    for (const id of ['#tgt-foe', '#tgt-me', '#tgt-sym']) $(id).classList.remove('on');
  }
}
const lerpN = (a, b, k) => a + (b - a) * k;
