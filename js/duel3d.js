// ─────────────────────────────────────────────────────────────
//  Le duel en 3D, vue à la troisième personne : le chevalier est
//  assis de dos au premier plan, l'adversaire en face, le boss
//  donne les cartes debout. Les cartes sont posées sur la table
//  et s'inspectent d'un clic. Le chevalier dit oui ou non de la tête.
// ─────────────────────────────────────────────────────────────
import { THREE, mats, mesh, at, rot, lathe, V, candle3d } from './r3d.js';
import { View, buildFigure } from './world3d.js';
import { skull } from './body3d.js';
import { faceCanvas, backCanvas, face } from './cards.js';
import { bustRisk } from './game.js';
import { vignette, clamp } from './paint.js';
import { sound } from './audio.js';
import { icon } from './icons.js';

const $ = (s, r = document) => r.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const TOP = 0.79, CW = 0.155, CH = CW * 1.46;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

const texCache = new Map();
function ctex(key, make) {
  if (!texCache.has(key)) { const t = new THREE.CanvasTexture(make()); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; texCache.set(key, t); }
  return texCache.get(key);
}
const cardKey = (c) => (c.t === 'n' ? 'n' + c.v : c.t === 'a' ? c.a : c.t + c.v);

function chair(M, back = true) {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.46), M.wood), 0, 0.46, 0));
  for (const [x, z] of [[-0.21, -0.19], [0.21, -0.19], [-0.21, 0.19], [0.21, 0.19]]) g.add(at(mesh(new THREE.BoxGeometry(0.05, 0.46, 0.05), M.wood), x, 0.23, z));
  if (back) {
    for (const x of [-0.22, 0.22]) { g.add(at(mesh(new THREE.BoxGeometry(0.06, 1.25, 0.06), M.wood), x, 1.05, -0.21)); g.add(at(mesh(new THREE.ConeGeometry(0.05, 0.22, 4), M.wood), x, 1.78, -0.21)); }
    g.add(at(mesh(new THREE.BoxGeometry(0.44, 0.5, 0.03), M.wood), 0, 1.25, -0.21));
    const arc = mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 16, Math.PI), M.wood); at(arc, 0, 1.5, -0.21); g.add(arc);
  }
  return g;
}
function table(M) {
  const g = new THREE.Group();
  const top = mesh(new THREE.BoxGeometry(1.8, 0.07, 1.15, 4, 1, 4), M.wood); at(top, 0, TOP - 0.035, 0); g.add(top);
  const edge = mesh(new THREE.BoxGeometry(1.84, 0.03, 1.19), M.wood); at(edge, 0, TOP - 0.085, 0); g.add(edge);
  for (const [x, z] of [[-0.78, -0.48], [0.78, -0.48], [-0.78, 0.48], [0.78, 0.48]]) {
    g.add(at(mesh(lathe([[0.06, 0], [0.07, 0.05], [0.045, 0.12], [0.05, 0.35], [0.065, 0.42], [0.045, 0.5], [0.05, 0.68], [0.06, TOP - 0.1]], 12), M.wood), x, 0, z));
  }
  // sceau gravé (anneau de laiton + sept clous)
  const ring = mesh(new THREE.TorusGeometry(0.26, 0.006, 6, 64), M.brass); ring.rotation.x = Math.PI / 2; at(ring, 0, TOP + 0.001, 0); g.add(ring);
  for (let k = 0; k < 7; k++) { const a = k * Math.PI * 2 / 7 - Math.PI / 2; g.add(at(mesh(new THREE.SphereGeometry(0.012, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.brass), Math.cos(a) * 0.26, TOP, Math.sin(a) * 0.26)); }
  // cierges, crâne, os
  const ticks = [];
  for (const [x, z, h] of [[-0.74, -0.38, 0.26], [-0.66, -0.46, 0.16], [0.75, -0.42, 0.3], [0.68, 0.4, 0.12]]) { const c = candle3d(h, 0.024); at(c, x, TOP, z); g.add(c); ticks.push(c.userData.flame.userData.tick); }
  const sk = skull(M, 0.62); at(sk, -0.62, TOP + 0.05, -0.12); sk.rotation.y = 0.6; g.add(sk);
  for (const [x, z, a] of [[0.62, 0.05, 0.5], [0.58, 0.12, -0.3]]) { const b = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8), M.bone); b.rotation.set(Math.PI / 2, 0, a); at(b, x, TOP + 0.012, z); g.add(b); for (const e of [-1, 1]) g.add(at(mesh(new THREE.SphereGeometry(0.02, 8, 6), M.bone), x + Math.sin(a) * 0.11 * e, TOP + 0.014, z + Math.cos(a) * 0.11 * e)); }
  g.userData.ticks = ticks;
  return g;
}

export class Duel {
  constructor() {
    this.ui = $('#duel-ui');
    this.cards = new Map();          // id → { obj, card, owner }
    this.rows = { me: [], foe: [] };
    this.fosse = [];
    this.held = null;
    this.pending = null; this.pendingTarget = null;
    this.raycaster = new THREE.Raycaster();
    $('#act-hit').onclick = () => this.decide('hit');
    $('#act-stay').onclick = () => this.decide('stay');
    $('#tgt-foe').onclick = () => this.pickTarget(this.foeId);
    $('#tgt-me').onclick = () => this.pickTarget(this.meId);
    $('#inspect').onclick = () => $('#inspect').classList.add('hidden');
    this.ui.addEventListener('click', (e) => { if (e.target.closest('button,#inspect,#gauge')) return; this.pick(e.clientX, e.clientY); });
    addEventListener('keydown', (e) => {
      if (!$('#duel').classList.contains('on')) return;
      const k = e.key.toLowerCase();
      if (this.pending && (k === '1' || k === ' ' || k === 'a')) { e.preventDefault(); this.decide('hit'); }
      else if (this.pending && (k === '2' || k === 'r')) { e.preventDefault(); this.decide('stay'); }
    });
  }

  // ── préparation ────────────────────────────────────────────
  setup({ foe, dealer, place, meId, foeId, kit, target }) {
    Object.assign(this, { foe, dealer, meId, foeId, kit, target });
    this.view?.clear();
    this.view = new View(place);
    const M = mats();
    const T = V(...(this.view.P.table || [0, 0, 0]));
    this.T = T;
    const room = new THREE.Group(); room.position.copy(T); this.view.add(room); this.room = room;
    const tb = table(M); room.add(tb); this.ticks = tb.userData.ticks;
    // le chevalier, de dos
    this.me = buildFigure(kit); this.me.setPose('assis'); { const cp = this.me.root.userData.cape; if (cp) { cp.scale.y = 0.5; cp.position.z = -0.13; cp.position.y = 0.0; } } at(this.me.root, 0, 0, 0.82); this.me.root.rotation.y = Math.PI; room.add(this.me.root);
    room.add(at(chair(M, false), 0, 0, 0.86));
    // l'adversaire, en face
    this.op = buildFigure(foe.kit); this.op.setPose('assis'); at(this.op.root, 0, 0, -0.82); room.add(this.op.root);
    const ch = chair(M, true); at(ch, 0, 0, -0.86); room.add(ch);
    // le donneur, debout
    this.dl = null;
    if (dealer) { this.dl = buildFigure(dealer.kit); this.dl.setPose('garde'); this.dl.P = { ...this.dl.P, hands: { R: [0.15, 0.95, 0.25], L: [-0.15, 0.95, 0.25] } }; this.dl.setPose = () => {}; at(this.dl.root, 1.05, 0, -0.95); this.dl.root.rotation.y = Math.atan2(-1.05, 0.95) * 0.8; room.add(this.dl.root); }
    // lanterne au-dessus de la table
    const lamp = new THREE.SpotLight(0xffe6c0, 26, 6, 0.75, 0.6, 1.3); lamp.position.set(0.3, 2.7, 0.2); lamp.target.position.set(0, TOP, 0); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0004;
    room.add(lamp, lamp.target);
    const rim = new THREE.SpotLight(0xffffff, 18, 7, 0.6, 0.6, 1.2); rim.position.set(-1.5, 2.4, -2.4); rim.target.position.set(0, 1.1, 0.6); room.add(rim, rim.target);
    // la pioche
    this.deckObj = new THREE.Group(); at(this.deckObj, 0.6, TOP, 0.02); room.add(this.deckObj);
    this.deckN = -1; this.setDeck(40);
    this.hand = { me: null, op: null, dl: null };
    // caméra : épaule droite du chevalier
    const P = (x, y, z) => [T.x + x, T.y + y, T.z + z];
    this.tall = innerHeight > innerWidth;
    this.view.setCam(this.tall ? P(0.55, 2.85, 2.95) : P(1.5, 2.55, 2.55), this.tall ? P(0, 0.78, -0.3) : P(-0.22, 0.86, -0.38), this.tall ? 33 : 36);
    this.view.drift = 0.25;
    for (const { obj } of this.cards.values()) obj.removeFromParent();
    this.cards.clear(); this.rows = { me: [], foe: [] }; this.fosse = []; this.held = null;
    this.setTurn(null);
  }
  setDeck(n) {
    n = Math.max(0, Math.min(60, n));
    const h = Math.max(1, Math.round(n / 4));
    if (h === this.deckN) return; this.deckN = h;
    this.deckObj.clear();
    const M = mats();
    const side = new THREE.MeshStandardMaterial({ color: 0xd8d2c0, roughness: 0.9 });
    const back = new THREE.MeshStandardMaterial({ map: ctex('back', () => backCanvas(256)), roughness: 0.6 });
    const b = mesh(new THREE.BoxGeometry(CW, 0.004 * h, CH), [side, side, back, side, side, side]); b.position.y = 0.002 * h; b.rotation.y = 0.05; this.deckObj.add(b);
    this.deckObj.userData.top = 0.004 * h;
  }

  // ── objets cartes ──────────────────────────────────────────
  makeCard(card, owner) {
    const side = new THREE.MeshStandardMaterial({ color: 0xcfc8b4, roughness: 0.9 });
    const fm = new THREE.MeshStandardMaterial({ map: ctex(cardKey(card) + JSON.stringify(card.t === 'n' ? card.v : 0), () => faceCanvas(card, 256)), roughness: 0.55, metalness: 0, emissive: 0x000000 });
    const bm = new THREE.MeshStandardMaterial({ map: ctex('back', () => backCanvas(256)), roughness: 0.6 });
    const obj = mesh(new THREE.BoxGeometry(CW, 0.0025, CH), [side, side, fm, bm, side, side], { cast: true, recv: true });
    obj.userData = { card, fm, anim: null };
    this.room.add(obj);
    this.cards.set(card.id, { obj, card, owner });
    return obj;
  }
  qFor(faceUp, ry = 0, tilt = 0) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, ry, faceUp ? 0 : Math.PI, 'YXZ'));
    return q;
  }
  move(id, pos, q, { dur = 420, arc = 0.12, scale = 1 } = {}) {
    const o = this.cards.get(id); if (!o) return Promise.resolve();
    const obj = o.obj;
    return new Promise((res) => {
      const a = { p0: obj.position.clone(), q0: obj.quaternion.clone(), s0: obj.scale.x, p1: pos.clone(), q1: q.clone(), s1: scale, k: 0, dur: dur / 1000, arc, res };
      obj.userData.anim = a;
      // filet de sécurité si l'onglet ne dessine plus
      setTimeout(() => { if (obj.userData.anim === a) { obj.position.copy(a.p1); obj.quaternion.copy(a.q1); obj.scale.setScalar(a.s1); obj.userData.anim = null; res(); } }, dur + 600);
    });
  }
  slot(owner, i, n) {
    const gap = Math.min(CW * 1.06, 1.4 / Math.max(1, n)), z = owner === 'me' ? 0.27 : -0.27;
    return V((i - (n - 1) / 2) * gap, TOP + 0.002, z);
  }
  layoutRow(owner, dur = 380) {
    const ids = this.rows[owner];
    return Promise.all(ids.map((id, i) => this.move(id, this.slot(owner, i, ids.length), this.qFor(true, ((i * 37) % 7 - 3) * 0.012), { dur, arc: 0.04 })));
  }
  async toRow(id, owner) {
    if (this.held === id) this.held = null;
    if (!this.rows[owner].includes(id)) this.rows[owner].push(id);
    await this.layoutRow(owner);
  }
  async toFosse(id) {
    const o = this.cards.get(id); if (!o) return;
    if (this.held === id) this.held = null;
    for (const k of ['me', 'foe']) this.rows[k] = this.rows[k].filter((x) => x !== id);
    const h = this.fosse.length * 0.0026;
    const p = V(-0.6 + (Math.random() - 0.5) * 0.03, TOP + 0.002 + h, 0.02 + (Math.random() - 0.5) * 0.03);
    this.layoutRow('me'); this.layoutRow('foe');
    o.obj.userData.fm.color.set(0xffffff); o.obj.userData.fm.emissive.set(0);
    await this.move(id, p, this.qFor(true, (Math.random() - 0.5) * 0.6), { dur: 460, arc: 0.18 });
    this.fosse.push(id);
    while (this.fosse.length > 6) { const old = this.fosse.shift(); const x = this.cards.get(old); x?.obj.removeFromParent(); this.cards.delete(old); }
    this.fosse.forEach((fid, i) => { const x = this.cards.get(fid); if (x) x.obj.position.y = TOP + 0.002 + i * 0.0026; });
  }
  async sweep() {
    if (this.held) await this.toRow(this.held, 'me');
    const ids = [...this.rows.me, ...this.rows.foe];
    if (!ids.length) return;
    sound.play('reshuffle');
    await Promise.all(ids.map((id, i) => wait(i * 45).then(() => this.toFosse(id))));
  }
  mark(owner, cls) {
    for (const id of this.rows[owner]) {
      const m = this.cards.get(id)?.obj.userData.fm; if (!m) continue;
      if (cls === 'burnt') m.color.set(0x3a3a3a);
      if (cls === 'sealed') m.emissive.set(0x202020);
      if (cls === 'frost') { m.color.set(0xffffff); m.emissive.set(0x404040); }
    }
  }

  // ── gestes ─────────────────────────────────────────────────
  reach(who, on) {
    const f = who === 'me' ? this.me : who === 'op' ? this.op : this.dl; if (!f) return;
    if (!on) { f.hand = null; return; }
    const w = this.room.localToWorld(this.deckObj.position.clone().add(V(0, 0.06, 0)));
    f.hand = { R: f.root.worldToLocal(w) };
  }

  // ── rendu ──────────────────────────────────────────────────
  render(c, W, H, t, dt) {
    for (const f of this.ticks || []) f(t);
    for (const [k, f] of [['me', this.me], ['op', this.op], ['dl', this.dl]]) {
      if (!f) continue;
      // les mains glissent vers leur cible
      const cur = (this.hand[k] ||= { R: null, home: V(...f.P.hands.R) });
      const goal = f.hand?.R || cur.home;
      cur.R = cur.R ? cur.R.lerp(goal, Math.min(1, dt * 9)) : goal.clone();
      f.P = { ...f.P, hands: { ...f.P.hands, R: cur.R.toArray() } };
      f.update(t);
    }
    // animations de cartes
    for (const { obj } of this.cards.values()) {
      const a = obj.userData.anim; if (!a) continue;
      a.k = Math.min(1, a.k + dt / a.dur);
      const e = ease(a.k);
      obj.position.lerpVectors(a.p0, a.p1, e); obj.position.y += Math.sin(a.k * Math.PI) * a.arc;
      obj.quaternion.slerpQuaternions(a.q0, a.q1, e);
      obj.scale.setScalar(a.s0 + (a.s1 - a.s0) * e);
      if (a.k >= 1) { obj.userData.anim = null; a.res(); }
    }
    this.view.draw(c, W, H, t);
    vignette(c, W, H, 0.75, 0.3);
    this.placeLabels(W, H);
  }
  project(v) {
    const p = this.room.localToWorld(v.clone()).project(this.view.cam);
    return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight };
  }
  placeLabels() {
    const lab = (el, v) => { const p = this.project(v); el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; };
    lab($('#v-me'), V(0, TOP, 0.25 + CH * 0.9));
    lab($('#v-foe'), V(0, TOP, -0.25 - CH * 0.9));
    lab($('#tgt-me'), V(0, 1.55, 0.82));
    lab($('#tgt-foe'), V(0, 1.55, -0.82));
  }
  pick(x, y) {
    if (!this.view) return;
    const ndc = new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.view.cam);
    const objs = [...this.cards.values()].map((o) => o.obj);
    const hit = this.raycaster.intersectObjects([...objs, this.deckObj], true)[0];
    if (!hit) return;
    if (this.deckObj.children.includes(hit.object)) { if (this.pending) this.decide('hit'); return; }
    const o = [...this.cards.values()].find((c) => c.obj === hit.object);
    if (o && !this.fosse.slice(0, -1).includes(o.card.id)) this.inspect(o.card);
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
    const T = this.target, pos = (v) => clamp(v / T) * 100 + '%';
    $('#g-me').style.bottom = pos(me.score); $('#g-foe').style.bottom = pos(foe.score);
    $('#g-me-hand').style.bottom = pos(me.score); $('#g-me-hand').style.height = Math.max(0, clamp((me.score + (me.status === 'bust' ? 0 : me.hand)) / T) - clamp(me.score / T)) * 100 + '%';
    $('#g-foe-hand').style.bottom = pos(foe.score); $('#g-foe-hand').style.height = Math.max(0, clamp((foe.score + (foe.status === 'bust' ? 0 : foe.hand)) / T) - clamp(foe.score / T)) * 100 + '%';
    $('#g-me b').textContent = me.score; $('#g-foe b').textContent = foe.score;
    $('#g-target').textContent = T;
    $('#v-me').textContent = me.status === 'bust' ? '✕' : me.hand || '';
    $('#v-foe').textContent = foe.status === 'bust' ? '✕' : foe.hand || '';
    $('#v-me').className = 'val me ' + me.status; $('#v-foe').className = 'val foe ' + foe.status;
    if (snap.deckCount !== undefined) this.setDeck(snap.deckCount);
  }
  setTurn(pid) { $('#acts').classList.toggle('on', !!(pid && pid === this.meId)); }

  // ── événements du moteur ───────────────────────────────────
  async present(ev, snap) {
    const me = (pid) => pid === this.meId;
    const sp = (ms) => wait(ms);
    switch (ev.type) {
      case 'gameStart': this.sync(snap); await sp(400); break;
      case 'roundStart': await this.sweep(); this.sync(snap); sound.play('toll'); await sp(500); break;
      case 'turn': this.sync(snap); break;
      case 'reveal': {
        this.sync(snap);
        const mine = me(ev.pid), who = mine ? 'me' : (this.dl ? 'dl' : 'op');
        if (mine && this.held) await this.toRow(this.held, 'me');
        this.reach(who, true); await sp(300);
        const obj = this.makeCard(ev.card, mine ? 'me' : 'foe');
        obj.position.copy(this.deckObj.position).add(V(0, this.deckObj.userData.top + 0.003, 0)); obj.quaternion.copy(this.qFor(false, 0.05));
        sound.play('whoosh');
        this.reach(who, false);
        if (mine) {
          this.held = ev.card.id;
          // la carte se lève devant le chevalier, tournée vers nous
          await this.move(ev.card.id, V(0.42, TOP + 0.36, 0.55), this.qFor(true, -0.3, 1.0), { dur: 520, arc: 0.1, scale: 1.6 });
          sound.play('flip');
          await sp(420);
        } else {
          this.rows.foe.push(ev.card.id);
          const n = this.rows.foe.length;
          await this.move(ev.card.id, this.slot('foe', n - 1, n), this.qFor(true), { dur: 520, arc: 0.2 });
          this.layoutRow('foe');
          sound.play('flip');
          await sp(380);
        }
        break;
      }
      case 'gain': this.sync(snap); sound.play('gain'); break;
      case 'bust': {
        this.sync(snap);
        const row = me(ev.pid) ? this.rows.me : this.rows.foe;
        for (const id of [...row, ev.card.id]) { const x = this.cards.get(id); if (x && (x.card.v === ev.card.v)) x.obj.userData.fm.emissive.set(0x666666); }
        sound.play('bust'); this.app.flash(0.9, 'invert'); this.app.shake();
        (me(ev.pid) ? this.me : this.op).nod('non');
        await sp(900);
        if (me(ev.pid) && this.held) await this.toRow(this.held, 'me');
        this.mark(me(ev.pid) ? 'me' : 'foe', 'burnt');
        await sp(500);
        break;
      }
      case 'saved':
        this.sync(snap); sound.play('chance');
        await Promise.all([this.toFosse(ev.card.id), this.toFosse(ev.chance.id)]);
        break;
      case 'flip7':
        this.sync(snap); sound.play('flip7'); this.app.flash(1, 'flash');
        if (me(ev.pid) && this.held) await this.toRow(this.held, 'me');
        this.mark(me(ev.pid) ? 'me' : 'foe', 'sealed');
        (me(ev.pid) ? this.me : this.op).nod('oui');
        await sp(1400);
        break;
      case 'stay':
        this.sync(snap); sound.play('stay');
        if (me(ev.pid) && this.held) await this.toRow(this.held, 'me');
        if (!me(ev.pid)) this.op.nod('non');
        this.mark(me(ev.pid) ? 'me' : 'foe', 'sealed');
        await sp(500);
        break;
      case 'freeze':
      case 'three':
        this.sync(snap);
        sound.play(ev.type === 'freeze' ? 'freeze' : 'three');
        await this.toFosse(ev.card.id);
        if (ev.type === 'freeze') this.mark(me(ev.to) ? 'me' : 'foe', 'frost');
        if (me(ev.to) && ev.type === 'freeze' && this.held) await this.toRow(this.held, 'me');
        await sp(600);
        break;
      case 'setAside': this.sync(snap); if (me(ev.pid) && this.held === ev.card.id) await this.toRow(ev.card.id, 'me'); break;
      case 'give': {
        this.sync(snap); sound.play('chance');
        const o = this.cards.get(ev.card.id);
        if (o) { if (this.held === ev.card.id) this.held = null; for (const k of ['me', 'foe']) this.rows[k] = this.rows[k].filter((x) => x !== ev.card.id); o.owner = me(ev.to) ? 'me' : 'foe'; this.layoutRow(me(ev.to) ? 'foe' : 'me'); await this.toRow(ev.card.id, o.owner); }
        break;
      }
      case 'discard': this.sync(snap); await this.toFosse(ev.card.id); break;
      case 'reshuffle': sound.play('reshuffle'); break;
      case 'roundEnd':
        if (this.held) await this.toRow(this.held, 'me');
        this.sync(snap);
        await sp(1300);
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
    this.me.nod(v === 'hit' ? 'oui' : 'non');
    const r = this.pending; this.pending = null;
    setTimeout(() => r(v), 650);
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
