// ─────────────────────────────────────────────────────────────
//  La scène de jeu en vue subjective : les gantelets du pèlerin,
//  la table, les créatures, les cartes et leurs animations.
// ─────────────────────────────────────────────────────────────
import { THREE } from './render.js';
import { buildCrypt, CREATURES, makeCreature, makeGauntlet, makeCardMesh, TABLE, CARD_W, CARD_H } from './world.js';
import { faceTex, backTex } from './cardtex.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = { io: (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2), out: (k) => 1 - Math.pow(1 - k, 3), in: (k) => k * k * k };
export const PERSONA_CREATURE = { fossoyeur: 'fossoyeur', clous: 'clous', terreau: 'terreau', cierge: 'cierge' };

export class Stage {
  constructor(dr) {
    this.dr = dr;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.02, 40);
    this.camBase = V3(0, 1.3, 0.32);
    this.lookBase = V3(0, 0.98, -1.05);
    this.camera.position.copy(this.camBase);
    this.camera.lookAt(this.lookBase);
    this.crypt = buildCrypt(this.scene);
    this.tweens = [];
    this.cards = new Map();   // id → mesh
    this.seats = new Map();   // pid → seat
    this.mouse = { x: 0, y: 0 };
    this.shakeAmt = 0;
    this.speed = 1;
    this.focus = null;
    this.t = 0;

    // gantelets
    this.R = makeGauntlet(1); this.L = makeGauntlet(-1);
    this.R.scale.setScalar(1.25); this.L.scale.setScalar(1.25);
    this.scene.add(this.R, this.L);
    this.poseR = { pos: V3(0.2, 0.875, -0.3), rot: new THREE.Euler(0.02, 0.18, -0.05), curl: 0.3 };
    this.poseL = { pos: V3(-0.22, 0.875, -0.32), rot: new THREE.Euler(0.02, -0.22, 0.06), curl: 0.35 };
    this.applyPose(this.R, this.poseR); this.applyPose(this.L, this.poseL);
    this.handBusy = false;

    // Ossuaire (pioche) et Fosse (défausse)
    this.deckPos = V3(-0.24, TABLE.c.y, -0.86);
    this.fossePos = V3(0.32, TABLE.c.y, -0.92);
    const stackMat = [new THREE.MeshStandardMaterial({ color: 0xcfc49c }), new THREE.MeshStandardMaterial({ color: 0xcfc49c }),
      new THREE.MeshStandardMaterial({ map: backTex() }), new THREE.MeshStandardMaterial({ color: 0x22201a }),
      new THREE.MeshStandardMaterial({ color: 0xbfb48c }), new THREE.MeshStandardMaterial({ color: 0xbfb48c })];
    this.stack = new THREE.Mesh(new THREE.BoxGeometry(CARD_W, 1, CARD_H), stackMat);
    this.stack.position.copy(this.deckPos); this.scene.add(this.stack);
    this.setDeckCount(94);
    const bowl = new THREE.Mesh(new THREE.LatheGeometry([[0.0, 0], [0.1, 0], [0.13, 0.03], [0.14, 0.06], [0.125, 0.065], [0.11, 0.03], [0, 0.02]].map(([x, y]) => new THREE.Vector2(x, y)), 14),
      new THREE.MeshStandardMaterial({ color: 0x6a6a5a, flatShading: true, roughness: 1 }));
    bowl.position.copy(this.fossePos); this.scene.add(bowl); this.bowl = bowl;
    this.fosseFill = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), new THREE.MeshStandardMaterial({ color: 0x0c0a06 }));
    this.fosseFill.rotation.x = -Math.PI / 2; this.fosseFill.position.copy(this.fossePos).add(V3(0, 0.035, 0)); this.scene.add(this.fosseFill);

    // particules (braises / givre)
    const N = 220;
    this.pPos = new Float32Array(N * 3); this.pVel = new Float32Array(N * 3); this.pLife = new Float32Array(N);
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3));
    this.embers = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xff6a20, size: 0.018 }));
    this.frostPos = new Float32Array(N * 3); this.frostVel = new Float32Array(N * 3); this.frostLife = new Float32Array(N);
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(this.frostPos, 3));
    this.frost = new THREE.Points(fg, new THREE.PointsMaterial({ color: 0xf4f4e8, size: 0.014 }));
    this.scene.add(this.embers, this.frost);
    this.pN = N;

    this.ray = new THREE.Raycaster();
    this.highlight = new THREE.PointLight(0xe0f0c0, 0, 1.6, 1.5); this.scene.add(this.highlight);
  }

  /** mains du héros : gantelets (chevalier) ou os (squelette) */
  setHands(kind = 'gant') {
    if (this.hands === kind) return; this.hands = kind;
    const bone = this._bone ||= new THREE.MeshStandardMaterial({ color: 0x9a907a, roughness: 0.9, flatShading: true });
    for (const g of [this.R, this.L]) {
      g.traverse((o) => { if (!o.isMesh) return; o.userData.m0 ||= o.material; o.material = kind === 'os' ? bone : o.userData.m0; });
      for (const m of g.userData.armParts || []) m.visible = kind !== 'os';
      if (g.userData.bones) g.userData.bones.visible = kind === 'os';
    }
  }
  // ── sièges ─────────────────────────────────────────────────
  setPlayers(players, you) {
    for (const s of this.seats.values()) if (s.creature) { this.scene.remove(s.creature.root); const f = s.creature.root.userData.fill; if (f) { this.scene.remove(f); if (f.userData.face) { const fc = f.userData.face; this.scene.remove(fc, fc.target); if (fc.userData.rim) this.scene.remove(fc.userData.rim, fc.userData.rim.target); } } }
    this.seats.clear();
    for (const m of this.cards.values()) this.scene.remove(m);
    this.cards.clear();
    this.you = you; this.lookBase.y = 0.98;
    const idx = players.findIndex((p) => p.id === you);
    const others = [...players.slice(idx + 1), ...players.slice(0, Math.max(idx, 0))];
    const n = others.length;
    const spread = n === 1 ? 0 : Math.min(this.camera.aspect < 1 ? 0.5 : 0.78, 0.42 * (n - 1));
    let pil = 0;
    others.forEach((p, i) => {
      const a = n === 1 ? 0 : -spread + (2 * spread * i) / (n - 1);
      const d = V3(Math.sin(a), 0, -Math.cos(a));
      const kind = p.kind === 'ai' ? (PERSONA_CREATURE[p.persona] || p.persona) : 'pelerin';
      const cr = makeCreature(kind, kind === 'pelerin' ? pil++ : 0);
      const sp = TABLE.c.clone().add(d.clone().multiplyScalar(TABLE.r + 0.32)); sp.y = 0;
      cr.root.position.copy(sp); cr.root.scale.setScalar(1.12);
      cr.root.lookAt(V3(TABLE.c.x, 0, TABLE.c.z)); cr.root.rotateY(Math.PI);
      cr.root.traverse((o) => { o.userData.pid = p.id; });
      this.scene.add(cr.root);
            const fl = new THREE.PointLight(0xe8e8d0, 6, 3.2, 1.0);
      fl.position.copy(TABLE.c.clone().add(d.clone().multiplyScalar(TABLE.r - 0.2))); fl.position.y = 1.35;
      this.scene.add(fl); cr.root.userData.fill = fl;
      const face = new THREE.SpotLight(0xfff0d8, 14, 5, 0.5, 0.5, 1.0);
      face.position.copy(TABLE.c.clone().add(d.clone().multiplyScalar(TABLE.r - 0.6))); face.position.y = 1.15;
      face.target.position.copy(sp).setY(1.6); this.scene.add(face, face.target); fl.userData.face = face;
      const rimL = new THREE.SpotLight(0xd8e8c0, 34, 5, 0.6, 0.6, 1.0); rimL.position.copy(sp.clone().add(d.clone().multiplyScalar(1.4))); rimL.position.y = 3.2;
      rimL.target.position.copy(sp).setY(1.3); this.scene.add(rimL, rimL.target); face.userData.rim = rimL;
      this.seats.set(p.id, { pid: p.id, a, d, creature: cr, base: sp.clone(), kind });
    });
    this.seats.set(you, { pid: you, a: Math.PI, d: V3(0, 0, 1), creature: null, me: true });
  }

  // ── le donneur : le boss debout près de la table ───────────
  setDealer(kind) {
    if (this.dealer) { this.scene.remove(this.dealer.root); this.dealer = null; }
    if (!kind) return;
    const cr = makeCreature(kind);
    const a = 0.95, d = V3(Math.sin(a), 0, -Math.cos(a));
    const sp = TABLE.c.clone().add(d.multiplyScalar(TABLE.r + 1.05)); sp.y = 0.3;
    cr.root.position.copy(sp); cr.root.scale.setScalar(0.95);
    cr.root.lookAt(V3(TABLE.c.x, 0.45, TABLE.c.z)); cr.root.rotateY(Math.PI);
    this.scene.add(cr.root);
    this.dealer = cr;
  }

  // ── placement des cartes sur la table ──────────────────────
  slotPose(pid, row, i, count) {
    const s = this.seats.get(pid);
    const yaw = Math.PI - s.a;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, yaw, 0, 'YXZ'));
    let pos;
    if (s.me) {
      const sc = 1.45, gap = Math.min(CARD_W * sc + 0.01, 0.9 / Math.max(1, count));
      const x0 = -((count - 1) * gap) / 2 + 0.02;
      pos = V3(x0 + i * gap, TABLE.c.y + 0.03 + i * 0.0004, row === 0 ? -0.6 : -0.8);
      return { pos, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.55, 0, 0, 'YXZ')), sc };
    } else {
      const gap = CARD_W + 0.008;
      const tg = V3(Math.cos(s.a), 0, Math.sin(s.a));
      const base = TABLE.c.clone().add(s.d.clone().multiplyScalar(row === 0 ? 0.72 : 0.56));
      pos = base.add(tg.multiplyScalar(-((count - 1) * gap) / 2 + i * gap)); pos.y = TABLE.c.y + 0.002 + i * 0.0002;
    }
    return { pos, q, sc: 1 };
  }

  layout(snap, { instant = false, skip = null } = {}) {
    const keep = new Set();
    for (const p of snap.players) {
      if (!this.seats.has(p.id)) continue;
      const rows = [p.nums, [...p.mods, ...(p.chance ? [p.chance] : []), ...p.used]];
      rows.forEach((row, r) => row.forEach((c, i) => {
        keep.add(c.id);
        if (c.id === skip) return;
        let m = this.cards.get(c.id);
        const { pos, q, sc } = this.slotPose(p.id, r, i, row.length);
        if (!m) { m = this.newCard(c); m.position.copy(pos); m.quaternion.copy(q); m.scale.setScalar(sc); }
        else if (!m.userData.anim && (m.position.distanceTo(pos) > 0.001)) {
          if (instant) { m.position.copy(pos); m.quaternion.copy(q); m.scale.setScalar(sc); }
          else { m.scale.setScalar(sc); this.moveCard(m, pos, q, 260); }
        }
        this.tintCard(m, c.dup ? 'dup' : p.status === 'bust' ? 'burnt' : p.status === 'frozen' ? 'frost' : null);
      }));
    }
    for (const [id, m] of this.cards) if (!keep.has(id) && !m.userData.anim) { this.scene.remove(m); this.cards.delete(id); }
  }

  newCard(card) {
    const m = makeCardMesh(faceTex(card), backTex());
    m.userData.card = card;
    this.cards.set(card.id, m);
    this.scene.add(m);
    return m;
  }

  tintCard(m, mode) {
    if (m.userData.tint === mode) return;
    m.userData.tint = mode;
    const f = m.material[4];
    f.emissive = new THREE.Color({ dup: 0xff3300, burnt: 0x0a0a08, frost: 0xc8c8c0 }[mode] ?? 0x8a8a8a);
    f.emissiveMap = mode === 'dup' ? null : f.map;
    f.emissiveIntensity = 1;
    f.color = new THREE.Color(mode === 'burnt' ? 0x3a3a30 : 0xffffff);
    f.needsUpdate = true;
  }

  setDeckCount(n) {
    this.deckCount = n;
    const h = Math.max(0.001, n * 0.00045);
    this.stack.scale.y = h; this.stack.position.y = TABLE.c.y + h / 2;
    this.stack.visible = n > 0;
  }
  deckTop() { return V3(this.deckPos.x, TABLE.c.y + Math.max(0.001, this.deckCount * 0.00045) + 0.002, this.deckPos.z); }

  // ── tweens ─────────────────────────────────────────────────
  tween(dur, fn, e = ease.io) {
    dur /= this.speed;
    return new Promise((res) => this.tweens.push({ t: 0, dur: Math.max(1, dur), fn, e, res }));
  }
  wait(ms) { return new Promise((r) => setTimeout(r, ms / this.speed)); }

  moveCard(m, pos, q, dur = 320, { arc = 0 } = {}) {
    const p0 = m.position.clone(), q0 = m.quaternion.clone();
    m.userData.anim = true;
    return this.tween(dur, (k) => {
      m.position.lerpVectors(p0, pos, k); m.position.y += Math.sin(k * Math.PI) * arc;
      m.quaternion.slerpQuaternions(q0, q, k);
    }).then(() => { m.userData.anim = false; });
  }

  applyPose(h, p) {
    h.position.copy(p.pos); h.rotation.copy(p.rot); h.userData.setCurl(p.curl);
  }
  moveHand(h, to, dur) {
    const p0 = h.position.clone(), q0 = h.quaternion.clone(), c0 = h.userData.curl;
    const q1 = new THREE.Quaternion().setFromEuler(to.rot);
    return this.tween(dur, (k) => {
      h.position.lerpVectors(p0, to.pos, k);
      h.quaternion.slerpQuaternions(q0, q1, k);
      h.userData.setCurl(c0 + (to.curl - c0) * k);
    });
  }
  handAim(from, target, pitch = -0.25) {
    const v = target.clone().sub(from);
    return new THREE.Euler(pitch, Math.atan2(-v.x, -v.z), 0, 'YXZ');
  }

  viewPose() {
    const dir = new THREE.Vector3(); this.camera.getWorldDirection(dir);
    const pos = this.camBase.clone().add(dir.multiplyScalar(0.36)).add(V3(-0.02, -0.03, 0));
    const camQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(this.camBase, this.lookBase, V3(0, 1, 0)));
    const front = camQ.clone();
    const back = camQ.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), Math.PI));
    return { pos, front, back };
  }

  // ── projections écran ───────────────────────────────────
  project(v) {
    const p = v.clone().project(this.camera);
    const r = this.dr.canvas.getBoundingClientRect();
    return { x: r.left + (p.x * 0.5 + 0.5) * r.width, y: r.top + (-p.y * 0.5 + 0.5) * r.height };
  }
  unproject(nx, ny, dist) {
    const v = V3(nx, ny, 0.5).unproject(this.camera).sub(this.camera.position).normalize();
    return this.camera.position.clone().add(v.multiplyScalar(dist));
  }
  deckScreen() { return this.project(this.deckTop()); }
  fosseScreen() { return this.project(this.fossePos.clone().add(V3(0, 0.05, 0))); }
  seatScreen(pid) { return this.project(this.seatPoint(pid)); }

  holdPoseR() {
    const pos = this.unproject(0.36, -0.62, 0.42);
    return { pos, rot: new THREE.Euler(1.35, -0.25, -0.35, 'YXZ'), curl: 0.7 };
  }
  holdPoseL() {
    const pos = this.unproject(-0.5, -0.82, 0.42);
    return { pos, rot: new THREE.Euler(1.3, 0.35, 0.5, 'YXZ'), curl: 0.7 };
  }
  // la main droite va arracher une âme ; renvoie la position écran de la pioche
  async meReach() {
    this.handBusy = true;
    const R = this.R, top = this.deckTop();
    const wristAt = (pt, lift) => { const dir = pt.clone().sub(this.poseR.pos); dir.y = 0; dir.normalize(); return pt.clone().sub(dir.multiplyScalar(0.17)).add(V3(0, lift, 0)); };
    const over = wristAt(top, 0.1);
    await this.moveHand(R, { pos: over, rot: this.handAim(over, top, -0.35), curl: 0.05 }, 280);
    const grab = wristAt(top, 0.035);
    await this.moveHand(R, { pos: grab, rot: this.handAim(grab, top, -0.2), curl: 0.5 }, 160);
    const xy = this.deckScreen();
    this.setDeckCount(this.deckCount - 1);
    this.holdR = true;
    this.moveHand(R, this.holdPoseR(), 520);
    return xy;
  }
  setHolding(r, l) {
    if (r !== undefined && r !== this.holdR) { this.holdR = r; this.handBusy = r; this.moveHand(this.R, r ? this.holdPoseR() : this.poseR, 420); }
    if (l !== undefined && l !== this.holdL) { this.holdL = l; this.moveHand(this.L, l ? this.holdPoseL() : this.poseL, 420); }
  }

  // Le pèlerin arrache une âme : la main droite va la chercher et la montre
  async meDraw(card) {
    this.handBusy = true;
    const R = this.R;
    const top = this.deckTop();
    const wristAt = (pt, lift) => { const dir = pt.clone().sub(this.poseR.pos); dir.y = 0; dir.normalize(); return pt.clone().sub(dir.multiplyScalar(0.17)).add(V3(0, lift, 0)); };
    const over = wristAt(top, 0.1);
    await this.moveHand(R, { pos: over, rot: this.handAim(over, top, -0.35), curl: 0.05 }, 300);
    const grab = wristAt(top, 0.035);
    await this.moveHand(R, { pos: grab, rot: this.handAim(grab, top, -0.2), curl: 0.45 }, 170);
    const m = this.newCard(card);
    m.position.copy(top);
    m.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)); // face cachée
    this.setDeckCount(this.deckCount - 1);
    const v = this.viewPose();
    m.userData.anim = true;
    const p0 = m.position.clone(), q0 = m.quaternion.clone();
    const handTo = { pos: v.pos.clone().add(V3(0.13, -0.15, 0.09)), rot: new THREE.Euler(1.1, 0.6, 0.4), curl: 0.65 };
    m.material[4].emissive.setHex(0xe0e0e0);
    await Promise.all([
      this.tween(420, (k) => { m.position.lerpVectors(p0, v.pos, k); m.position.y += Math.sin(k * Math.PI) * 0.05; m.quaternion.slerpQuaternions(q0, v.back, k); }),
      this.moveHand(R, handTo, 420),
    ]);
    await this.wait(120);
    // retournement
    await this.tween(300, (k) => { m.quaternion.slerpQuaternions(v.back, v.front, k); m.position.y = v.pos.y + Math.sin(k * Math.PI) * 0.012; });
    m.userData.anim = false;
    return m;
  }
  async meDrawTable(card) {
    this.handBusy = true;
    const R = this.R, top = this.deckTop();
    const wristAt = (pt, lift) => { const dir = pt.clone().sub(this.poseR.pos); dir.y = 0; dir.normalize(); return pt.clone().sub(dir.multiplyScalar(0.17)).add(V3(0, lift, 0)); };
    const over = wristAt(top, 0.1);
    await this.moveHand(R, { pos: over, rot: this.handAim(over, top, -0.35), curl: 0.05 }, 260);
    const grab = wristAt(top, 0.035);
    await this.moveHand(R, { pos: grab, rot: this.handAim(grab, top, -0.2), curl: 0.5 }, 150);
    const m = this.newCard(card);
    m.position.copy(top); m.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    this.setDeckCount(this.deckCount - 1);
    const hover = V3(0.16, TABLE.c.y + 0.16, -0.58), qUp = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + 1.0, -0.15, 0, 'YXZ'));
    m.userData.anim = true;
    const p0 = m.position.clone(), q0 = m.quaternion.clone();
    await Promise.all([
      this.tween(420, (k) => { m.position.lerpVectors(p0, hover, k); m.position.y += Math.sin(k * Math.PI) * 0.08; m.quaternion.slerpQuaternions(q0, qUp, k); m.scale.setScalar(1 + k * 0.45); }),
      this.moveHand(R, { pos: hover.clone().add(V3(0.1, -0.02, 0.12)), rot: this.handAim(hover.clone().add(V3(0.1, -0.02, 0.12)), hover, -0.1), curl: 0.6 }, 420),
    ]);
    m.userData.anim = false;
    return m;
  }

  // ── repères écran pour un personnage dessiné : ancrage + bord de table ──
  figGeom(pid) {
    const s = this.seats.get(pid); if (!s) return null;
    const r = this.dr.canvas.getBoundingClientRect();
    this.camera.updateMatrixWorld();
    const P = (v) => { v.project(this.camera); return [r.left + (v.x * 0.5 + 0.5) * r.width, r.top + (-v.y * 0.5 + 0.5) * r.height]; };
    const [x, y] = P(TABLE.c.clone().add(s.d.clone().multiplyScalar(TABLE.r + 0.3)).setY(TABLE.c.y - 0.075));
    const xs = [], ys = [];
    for (let i = 0; i <= 48; i++) { const a = s.a - 1.5 + (i / 48) * 3, p = P(V3(TABLE.c.x + Math.sin(a) * (TABLE.r + 0.04), TABLE.c.y + 0.012, TABLE.c.z - Math.cos(a) * (TABLE.r + 0.04))); xs.push(p[0]); ys.push(p[1]); }
    const rim = (px) => {
      if (px <= xs[0] || px >= xs[48]) return 1e6;
      let i = 1; while (xs[i] < px) i++;
      const k = (px - xs[i - 1]) / (xs[i] - xs[i - 1] || 1);
      return ys[i - 1] + (ys[i] - ys[i - 1]) * k;
    };
    return { x, y, rim };
  }

  // ── le deck étalé sur la table ─────────────────────────────
  deckMode(list, onCard) {
    this.clearDeck();
    this.R.visible = this.L.visible = false;
    const tall = this.camera.aspect < 1;
    const per = tall ? 4 : 7, sc = tall ? 2.4 : 2.1, gw = CARD_W * sc + 0.022, gh = CARD_H * sc + 0.03;
    const ranks = list.filter((it) => !it.card.relic), relics = list.filter((it) => it.card.relic);
    const rows = [];
    for (let i = 0; i < ranks.length; i += per) rows.push(ranks.slice(i, i + per));
    for (let i = 0; i < relics.length; i += per) rows.push(relics.slice(i, i + per));
    const depth = rows.length * gh, z0 = TABLE.c.z - depth / 2 + gh / 2 - (tall ? 0.12 : 0.24);
    this.bowl.visible = this.fosseFill.visible = false;
    this.camBase = tall ? V3(0, 1.6 + depth * 0.45, TABLE.c.z + 0.35 + depth * 0.2) : V3(0, 1.62, -0.55);
    this.lookBase = tall ? V3(0, 0.55, TABLE.c.z - 0.2) : V3(0, 0.74, -1.5);
    this.deckCards = [];
    rows.forEach((row, r) => row.forEach((it, c) => {
      const k = this.deckCards.length;
      const m = makeCardMesh(faceTex(it.card), backTex());
      const x = (c - (row.length - 1) / 2) * gw, z = z0 + r * gh + (it.card.relic && !tall ? 0.04 : 0);
      // chaque carte part du paquet, face cachée, et vient se poser à sa place
      const pos = V3(x, TABLE.c.y + 0.004, z), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, Math.sin(k * 7.3) * 0.05, 0, 'YXZ'));
      m.position.set(0, TABLE.c.y + 0.01 + k * 0.0012, z0 + rows.length * gh + 0.02); m.scale.setScalar(sc);
      m.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
      m.userData = { ...m.userData, deck: it, base: pos, anim: true };
      this.wait(350 + k * 70).then(() => { if (!this.deckCards.includes(m)) return; onCard?.(k); return this.moveCard(m, pos, q, 460, { arc: 0.16 }); });
      if (it.locked) m.material.forEach((mt) => mt.color?.setScalar?.(0.62));
      this.scene.add(m); this.deckCards.push(m);
    }));
  }
  clearDeck() {
    for (const m of this.deckCards || []) this.scene.remove(m);
    this.deckCards = [];
    this.R.visible = this.L.visible = true;
    if (this.bowl) this.bowl.visible = this.fosseFill.visible = true;
    this.camBase = V3(0, 1.3, 0.32); this.lookBase = V3(0, 0.98, -1.05);
  }
  /** après le chargement des polices : redessine le dos du paquet */
  refreshBack() { const m = this.stack.material[2]; m.map = backTex(); m.needsUpdate = true; }
  deckAt(nx, ny) {
    this.ray.setFromCamera({ x: nx, y: ny }, this.camera);
    return this.ray.intersectObjects(this.deckCards || [], false)[0]?.object || null;
  }
  cardAt(nx, ny) {
    this.ray.setFromCamera({ x: nx, y: ny }, this.camera);
    const h = this.ray.intersectObjects([...this.cards.values()], false)[0];
    return h?.object.userData.card || null;
  }

  // repose la main au repos
  async handHome() {
    await this.moveHand(this.R, this.poseR, 320);
    this.handBusy = false;
  }

  // Une créature tire : l'âme jaillit de l'Ossuaire vers sa place
  async oppDraw(pid, card) {
    const s = this.seats.get(pid);
    const m = this.newCard(card);
    m.position.copy(this.deckTop());
    m.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    this.setDeckCount(this.deckCount - 1);
    const mid = TABLE.c.clone().add(s.d.clone().multiplyScalar(s.illus ? -0.25 : 0.45)); mid.y = TABLE.c.y + (s.illus ? 0.14 : 0.32);
    const v = this.viewPose();
    const qFace = v.front.clone();
    m.userData.anim = true;
    const p0 = m.position.clone(), q0 = m.quaternion.clone();
    if (s.creature) this.lean(s, 1);
    await this.tween(460, (k) => { m.position.lerpVectors(p0, mid, k); m.position.y += Math.sin(k * Math.PI) * 0.1; m.quaternion.slerpQuaternions(q0, qFace, ease.out(k)); });
    m.scale.setScalar(s.illus ? 1.45 : 1.6);
    m.material[4].emissive.setHex(0xd0d0d0);
    m.userData.anim = false;
    return m;
  }

  // la carte en main rejoint la table (ou la fosse / une cible)
  async settleCard(card, dest, snap) {
    const m = this.cards.get(card.id);
    if (!m) return;
    let pos, q, sc = 1;
    if (dest === 'fosse') { pos = this.fossePos.clone().add(V3(0, 0.04, 0)); q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, Math.random() * 3, 0)); }
    else if (dest?.seat) {
      const s = this.seats.get(dest.seat);
      pos = s.me ? V3(0, TABLE.c.y + 0.25, -0.5) : TABLE.c.clone().add(s.d.clone().multiplyScalar(0.7)).add(V3(0, 0.3, 0));
      q = m.quaternion.clone();
    } else {
      const p = snap.players.find((x) => x.id === dest);
      const all = [p.nums, [...p.mods, ...(p.chance ? [p.chance] : []), ...p.used]];
      let row = 0, i = all[0].findIndex((c) => c.id === card.id);
      if (i < 0) { row = 1; i = all[1].findIndex((c) => c.id === card.id); }
      ({ pos, q, sc } = this.slotPose(dest, row, Math.max(0, i), all[row].length));
    }
    m.userData.anim = true;
    m.userData.tint = undefined;
    const p0 = m.position.clone(), q0 = m.quaternion.clone(), s0 = m.scale.x;
    const mine = this.seats.get(dest)?.me && this.handBusy;
    const handTo = mine ? { pos: pos.clone().add(V3(0.04, 0.05, 0.16)), rot: this.handAim(pos.clone().add(V3(0.04, 0.05, 0.16)), pos, -0.3), curl: 0.35 } : null;
    await Promise.all([
      this.tween(360, (k) => { m.position.lerpVectors(p0, pos, k); m.position.y += Math.sin(k * Math.PI) * 0.06; m.quaternion.slerpQuaternions(q0, q, k); m.scale.setScalar(s0 + (sc - s0) * k); }),
      handTo ? this.moveHand(this.R, handTo, 360) : null,
    ]);
    m.userData.anim = false;
    if (dest === 'fosse') { await this.tween(200, (k) => { m.position.y = pos.y - k * 0.05; }); this.scene.remove(m); this.cards.delete(card.id); }
    for (const s of this.seats.values()) if (s.creature) this.lean(s, 0);
    if (mine) await this.handHome();
  }

  lean(s, v) {
    const target = s.base.clone().add(s.d.clone().multiplyScalar(-0.08 * v));
    const p0 = s.creature.root.position.clone();
    this.tween(400, (k) => s.creature.root.position.lerpVectors(p0, target, k));
  }

  // ── effets ─────────────────────────────────────────────────
  seatPoint(pid) {
    const s = this.seats.get(pid);
    if (!s) return TABLE.c.clone();
    if (s.me) return V3(0, TABLE.c.y + 0.03, -0.6);
    return TABLE.c.clone().add(s.d.clone().multiplyScalar(0.66)).add(V3(0, 0.03, 0));
  }
  burst(pid, kind = 'ember', n = 80) {
    const c = this.seatPoint(pid);
    const [P, Vv, Lf] = kind === 'ember' ? [this.pPos, this.pVel, this.pLife] : [this.frostPos, this.frostVel, this.frostLife];
    let made = 0;
    for (let i = 0; i < this.pN && made < n; i++) {
      if (Lf[i] > 0) continue;
      P[i * 3] = c.x + (Math.random() - 0.5) * 0.4; P[i * 3 + 1] = c.y + Math.random() * 0.05; P[i * 3 + 2] = c.z + (Math.random() - 0.5) * 0.25;
      Vv[i * 3] = (Math.random() - 0.5) * 0.3; Vv[i * 3 + 1] = (kind === 'ember' ? 0.4 : 0.15) + Math.random() * 0.6; Vv[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      Lf[i] = 0.8 + Math.random() * 1.4; made++;
    }
  }
  shake(a = 0.025) { this.shakeAmt = a; }
  flashDither(kind = 'flash', ms = 160) {
    const u = this.dr.uniforms[kind === 'invert' ? 'invert' : 'flash'];
    u.value = 1;
    setTimeout(() => { u.value = 0; }, ms);
  }
  async paletteFlash(name, ms = 900) {
    const prev = this.dr.paletteName;
    this.dr.setPalette(name);
    await this.wait(ms);
    this.dr.setPalette(prev === name ? 'fange' : prev);
  }
  ring(pid) {
    const c = this.seatPoint(pid);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 4, 28), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    ring.rotation.x = Math.PI / 2; ring.position.copy(c); this.scene.add(ring);
    this.tween(1400, (k) => { ring.scale.setScalar(1 + k * 5); ring.position.y = c.y + k * 0.5; ring.material.color.setScalar(1 - k * 0.8); }, ease.out).then(() => this.scene.remove(ring));
  }
  pulse(pid, n = 1) {
    const p = this.seatPoint(pid).add(V3(0, 0.4, 0));
    this.highlight.position.copy(p);
    let i = 0;
    const go = () => {
      if (i++ >= n) { this.highlight.intensity = 0; return; }
      this.tween(380, (k) => { this.highlight.intensity = Math.sin(k * Math.PI) * 3; }).then(go);
    };
    go();
  }

  // ── interaction ────────────────────────────────────────────
  pickAt(nx, ny) {
    this.ray.setFromCamera({ x: nx, y: ny }, this.camera);
    const roots = [...this.seats.values()].filter((s) => s.creature).map((s) => s.creature.root);
    const hit = this.ray.intersectObjects(roots, true)[0];
    if (hit) return hit.object.userData.pid;
    // clic sur ses propres cartes = soi-même
    const mine = [...this.cards.values()].filter((m) => m.position.z > -0.78 && Math.abs(m.position.x) < 0.7);
    const h2 = this.ray.intersectObjects(mine, false)[0];
    return h2 ? this.you : null;
  }
  setHover(pid) {
    this.hover = pid;
    if (!pid) { if (!this.tweens.length) this.highlight.intensity = 0; return; }
    this.highlight.position.copy(this.seatPoint(pid).add(V3(0, 0.5, 0)));
    this.highlight.intensity = 2.2;
  }
  screenOf(pid, w, h) {
    const s = this.seats.get(pid);
    if (!s?.creature) return null;
    // un personnage dessiné garde sa plaque sur le côté, au ras de la table
    const p = (s.illus ? TABLE.c.clone().add(s.d.clone().multiplyScalar(TABLE.r - 0.05)).add(V3(s.d.z, 0, -s.d.x).multiplyScalar(-0.95)).setY(TABLE.c.y + 0.42) : s.creature.head.getWorldPosition(new THREE.Vector3()).add(V3(0, 0.3, 0))).project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * w, y: (-p.y * 0.5 + 0.5) * h, vis: p.z < 1 };
  }

  // ── boucle ─────────────────────────────────────────────────
  update(dt) {
    this.t += dt;
    const t = this.t;
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      tw.t += dt * 1000;
      const k = Math.min(1, tw.t / tw.dur);
      tw.fn(tw.e(k));
      if (k >= 1) { this.tweens.splice(i, 1); tw.res(); }
    }
    this.crypt.tick(t);
    const look = this.focus ? (this.focus === this.you ? this.camBase.clone() : this.seatPoint(this.focus)) : this.camBase.clone();
    for (const s of this.seats.values()) if (s.creature) s.creature.update(t, s.pid === this.focus ? this.camBase.clone() : look, s.mood || 0);
    this.dealer?.update(t, TABLE.c.clone(), 0);
    for (const m of this.deckCards || []) { if (m.userData.anim) continue; const up = m === this.deckHover ? 0.05 : 0; m.position.y += (m.userData.base.y + up - m.position.y) * 0.2; }
    // respiration des mains
    if (!this.handBusy && !this.holdR) {
      this.R.position.y = this.poseR.pos.y + Math.sin(t * 1.3) * 0.002;
      if (this.tapping) this.R.userData.setCurl(0.3 + Math.max(0, Math.sin(t * 9)) * 0.25 * (Math.sin(t * 1.7) > 0 ? 1 : 0));
    }
    if (!this.holdL) this.L.position.y = this.poseL.pos.y + Math.sin(t * 1.2 + 1) * 0.002;
    // caméra : regard qui suit la souris + secousse
    const yaw = this.mouse.x * 0.16, pitch = this.mouse.y * 0.08;
    const lk = this.lookBase.clone().add(V3(Math.sin(yaw) * 1.4, pitch * 1.4 + Math.sin(t * 0.5) * 0.008, 0));
    this.camera.position.copy(this.camBase);
    if (this.shakeAmt > 0.0005) { this.camera.position.add(V3((Math.random() - 0.5) * this.shakeAmt, (Math.random() - 0.5) * this.shakeAmt, 0)); this.shakeAmt *= 0.88; }
    this.camera.lookAt(lk);
    // particules
    const step = (P, Vv, Lf, g, attr) => {
      for (let i = 0; i < this.pN; i++) {
        if (Lf[i] <= 0) { P[i * 3 + 1] = -10; continue; }
        Lf[i] -= dt; Vv[i * 3 + 1] += g * dt;
        P[i * 3] += Vv[i * 3] * dt; P[i * 3 + 1] += Vv[i * 3 + 1] * dt; P[i * 3 + 2] += Vv[i * 3 + 2] * dt;
      }
      attr.needsUpdate = true;
    };
    step(this.pPos, this.pVel, this.pLife, -0.1, this.embers.geometry.attributes.position);
    step(this.frostPos, this.frostVel, this.frostLife, -0.25, this.frost.geometry.attributes.position);
  }
  resize(w, h) { this.camera.aspect = w / h; this.camera.fov = w / h < 1 ? 78 : 58; this.camera.updateProjectionMatrix(); }
  render() { this.dr.render(this.scene, this.camera); }
}
