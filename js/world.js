// ─────────────────────────────────────────────────────────────
//  Le monde : la crypte de Vaulmorte, la table, les créatures
//  (originales), les gantelets du pèlerin, les décors du guide.
// ─────────────────────────────────────────────────────────────
import { THREE, TEX } from './render.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const M = {};
function mats() {
  if (M.ok) return M;
  const S = (o) => new THREE.MeshStandardMaterial({ flatShading: true, ...o });
  Object.assign(M, {
    ok: true,
    cloth: S({ color: 0x4a4a40, roughness: 1, map: TEX.cloth() }),
    clothDark: S({ color: 0x24241f, roughness: 1 }),
    bone: S({ color: 0xd8d0b0, roughness: 0.8 }),
    flesh: S({ color: 0x9a9a78, roughness: 0.9 }),
    metal: S({ color: 0x7a7a72, metalness: 0.8, roughness: 0.3 }),
    metalDark: S({ color: 0x3a3a35, metalness: 0.7, roughness: 0.5 }),
    bronze: S({ color: 0x8a6a3a, metalness: 0.6, roughness: 0.4 }),
    wood: S({ color: 0x8a6a48, roughness: 0.9, map: TEX.wood() }),
    earth: S({ color: 0x3a3426, roughness: 1 }),
    wax: S({ color: 0xe8e0c4, roughness: 0.6 }),
    flame: new THREE.MeshBasicMaterial({ color: 0xff7a2a }),
    flameCore: new THREE.MeshBasicMaterial({ color: 0xffd08a }),
    eye: new THREE.MeshBasicMaterial({ color: 0xff6a20 }),
    eyePale: new THREE.MeshBasicMaterial({ color: 0xf0f0d8 }),
    black: new THREE.MeshBasicMaterial({ color: 0x000000 }),
    bricks: S({ color: 0x6a6a5a, roughness: 1, map: TEX.bricks(), side: THREE.BackSide }),
    stone: S({ color: 0x5a5a50, roughness: 1, map: TEX.stone() }),
  });
  return M;
}

const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const cyl = (rt, rb, h, m, s = 10) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), m);
const sph = (r, m, w = 10, h = 8) => new THREE.Mesh(new THREE.SphereGeometry(r, w, h), m);
const cone = (r, h, m, s = 10) => new THREE.Mesh(new THREE.ConeGeometry(r, h, s), m);
const lathe = (pts, m, s = 12) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), s), m);
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const rx = (o, a) => { o.rotation.x = a; return o; };
const tube = (pts, r, m) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => V3(...p))), 12, r, 5), m);

// ── Flamme + lumière ─────────────────────────────────────────
export function makeFlame(scale = 1, light = true) {
  mats();
  const g = new THREE.Group();
  const f = at(cone(0.012 * scale, 0.05 * scale, M.flame, 6), 0, 0.025 * scale, 0);
  const core = at(cone(0.006 * scale, 0.025 * scale, M.flameCore, 6), 0, 0.016 * scale, 0);
  g.add(f, core);
  if (light) { const l = new THREE.PointLight(0xffe2b8, 2.2 * scale, 3.2 * scale, 1.1); at(l, 0, 0.06 * scale, 0); g.add(l); g.userData.light = l; }
  g.userData.flicker = (t) => {
    const n = Math.sin(t * 13 + g.id) * 0.5 + Math.sin(t * 7.3 + g.id * 3) * 0.5;
    f.scale.set(1 + n * 0.1, 1 + n * 0.25, 1 + n * 0.1);
    f.rotation.z = n * 0.12;
    if (g.userData.light) g.userData.light.intensity = (2.2 + n * 0.45) * scale * (g.userData.mult ?? 1);
  };
  return g;
}

export function makeCandle(h = 0.14, r = 0.022, light = true) {
  mats();
  const g = new THREE.Group();
  g.add(at(cyl(r, r * 1.08, h, M.wax, 8), 0, h / 2, 0));
  for (let k = 0; k < 3; k++) { const d = at(sph(r * 0.35, M.wax, 5, 4), Math.cos(k * 2.1) * r, h - 0.01 - k * 0.025, Math.sin(k * 2.1) * r); d.scale.y = 2.2; g.add(d); }
  g.add(at(cyl(r * 1.8, r * 2.2, 0.012, M.metalDark, 8), 0, 0.006, 0));
  const fl = at(makeFlame(1, light), 0, h, 0);
  g.add(fl); g.userData.flame = fl;
  return g;
}

export function makeSkull(s = 1) {
  mats();
  const g = new THREE.Group();
  const cr = sph(0.06 * s, M.bone, 9, 7); cr.scale.set(1, 0.95, 1.15); g.add(cr);
  const jaw = at(box(0.07 * s, 0.03 * s, 0.06 * s, M.bone), 0, -0.05 * s, -0.035 * s); g.add(jaw);
  for (const x of [-1, 1]) g.add(at(sph(0.017 * s, M.black, 6, 5), x * 0.024 * s, -0.005 * s, -0.06 * s));
  g.add(at(box(0.012 * s, 0.018 * s, 0.01 * s, M.black), 0, -0.03 * s, -0.068 * s));
  return g;
}

// ── Gantelets du pèlerin ─────────────────────────────────────
export function makeGauntlet(side = 1) {
  mats();
  const root = new THREE.Group();
  // avant-bras (vers la caméra)
  const arm = new THREE.Group();
  const va = cyl(0.05, 0.062, 0.34, M.metalDark, 10); va.rotation.x = Math.PI / 2; at(va, 0, 0.0, 0.2); arm.add(va);
  for (let k = 0; k < 3; k++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.056 + k * 0.003, 0.008, 4, 12), M.metal); at(ring, 0, 0, 0.08 + k * 0.1); arm.add(ring); }
  const cuff = cone(0.075, 0.07, M.metal, 10); cuff.rotation.x = -Math.PI / 2; at(cuff, 0, 0, 0.055); arm.add(cuff);
  const spike = cone(0.012, 0.05, M.metalDark, 5); spike.rotation.z = -side * Math.PI / 2; at(spike, side * 0.06, 0.01, 0.2); arm.add(spike);
  root.add(arm);

  const hand = new THREE.Group(); root.add(hand);
  hand.add(at(box(0.095, 0.03, 0.1, M.metal), 0, 0, -0.05));
  for (let k = 0; k < 3; k++) { const p = box(0.1 - k * 0.004, 0.012, 0.04, M.metalDark); p.rotation.x = -0.18; at(p, 0, 0.02 + k * 0.002, -0.015 - k * 0.03); hand.add(p); }

  const fingers = [];
  const xs = [-0.034, -0.011, 0.012, 0.034];
  xs.forEach((x, fi) => {
    let parent = new THREE.Group(); at(parent, x * side, 0, -0.1); hand.add(parent);
    const chain = [parent];
    [0.042, 0.032, 0.026].map((l) => l * (fi === 3 ? 0.82 : fi === 0 ? 0.92 : 1)).forEach((len, si) => {
      const seg = box(0.019, 0.018, len, si % 2 ? M.metalDark : M.metal);
      at(seg, 0, 0, -len / 2); parent.add(seg);
      if (si === 0) parent.add(at(cone(0.006, 0.018, M.metalDark, 4), 0, 0.016, -len * 0.3));
      if (si === 2) { seg.scale.x = 0.85; parent.add(rx(at(cone(0.008, 0.02, M.metal, 4), 0, 0, -len - 0.006), -Math.PI / 2)); }
      const next = new THREE.Group(); at(next, 0, 0, -len); parent.add(next); parent = next; chain.push(next);
    });
    fingers.push(chain.slice(0, 3));
  });
  // pouce
  const tp = new THREE.Group(); at(tp, -side * 0.05, -0.005, -0.03); tp.rotation.y = side * 0.9; tp.rotation.z = -side * 0.3; hand.add(tp);
  const t1 = at(box(0.021, 0.02, 0.04, M.metal), 0, 0, -0.02); tp.add(t1);
  const tp2 = at(new THREE.Group(), 0, 0, -0.04); tp.add(tp2);
  tp2.add(at(box(0.018, 0.018, 0.03, M.metalDark), 0, 0, -0.015));

  root.userData = {
    hand, fingers, thumb: [tp, tp2], curl: 0.2, side,
    setCurl(c) {
      this.curl = c;
      for (const ch of fingers) ch.forEach((p, i) => { p.rotation.x = -c * (i === 0 ? 0.9 : 1.15); });
      tp.rotation.x = -c * 0.4; tp2.rotation.x = -c * 0.8;
    },
  };
  root.userData.setCurl(0.25);
  return root;
}

// ── Créatures (originales) ───────────────────────────────────
// Chaque créature : { root, head, update(t, look) }
function seated(root, head, extra = {}) {
  const base = head.rotation.clone();
  return {
    root, head, ...extra,
    update(t, look = null, mood = 0) {
      const br = Math.sin(t * 1.1 + root.id) * 0.012;
      root.userData.torso && (root.userData.torso.scale.y = 1 + br);
      if (look) {
        const lp = root.worldToLocal(look.clone());
        const yaw = Math.atan2(lp.x, -lp.z), pitch = Math.atan2(lp.y - head.position.y, Math.hypot(lp.x, lp.z));
        head.rotation.y += ((Math.max(-0.9, Math.min(0.9, -yaw))) - head.rotation.y) * 0.06;
        head.rotation.x += ((base.x + Math.max(-0.4, Math.min(0.4, pitch)) * 0.5) - head.rotation.x) * 0.06;
      } else {
        head.rotation.y += (Math.sin(t * 0.3 + root.id) * 0.25 - head.rotation.y) * 0.02;
      }
      head.rotation.z = base.z + Math.sin(t * 0.7 + root.id) * 0.03 + mood * Math.sin(t * 20) * 0.04;
      extra.tick?.(t);
    },
  };
}

export const CREATURES = {
  // Le Fossoyeur : masque de bronze à fente unique, lanterne
  fossoyeur() {
    mats();
    const root = new THREE.Group();
    const torso = lathe([[0, 0], [0.4, 0], [0.36, 0.35], [0.3, 0.7], [0.25, 0.95], [0.12, 1.05], [0, 1.08]], M.cloth); at(torso, 0, 0.4, 0);
    root.add(torso); root.userData.torso = torso;
    const mantle = lathe([[0.02, 0], [0.33, -0.02], [0.36, -0.2], [0.28, -0.12], [0, 0]], M.clothDark); at(mantle, 0, 1.38, 0); root.add(mantle);
    const head = at(new THREE.Group(), 0, 1.55, 0); root.add(head);
    const hood = lathe([[0, 0.34], [0.07, 0.3], [0.15, 0.2], [0.18, 0.05], [0.17, -0.1], [0.13, -0.16], [0, -0.17]], M.clothDark, 10); head.add(hood);
    const face = at(sph(0.13, M.black, 8, 6), 0, 0, -0.06); face.scale.set(1, 1.1, 0.7); head.add(face);
    const mask = at(box(0.17, 0.22, 0.03, M.bronze), 0, -0.01, -0.13); head.add(mask);
    mask.add(at(box(0.15, 0.012, 0.035, M.eye), 0, 0.03, 0));
    for (const x of [-0.06, 0.06]) mask.add(rx(at(cyl(0.008, 0.008, 0.02, M.metalDark, 5), x, -0.07, -0.01), Math.PI / 2));
    // bras + lanterne
    const arm = tube([[0.28, 1.25, 0], [0.38, 1.0, -0.2], [0.34, 0.9, -0.45]], 0.05, M.cloth); root.add(arm);
    const hand = at(new THREE.Group(), 0.34, 0.88, -0.5); root.add(hand);
    for (let k = 0; k < 4; k++) hand.add(at(box(0.012, 0.012, 0.07, M.bone), -0.03 + k * 0.02, 0, -0.03));
    const lantern = at(new THREE.Group(), -0.42, 0.96, -0.42); root.add(lantern);
    lantern.add(at(box(0.09, 0.12, 0.09, M.metalDark), 0, 0, 0));
    lantern.add(at(cone(0.07, 0.06, M.metalDark, 4), 0, 0.09, 0));
    const lf = at(makeFlame(1.6), 0, -0.03, 0); lantern.add(lf);
    lantern.add(at(cyl(0.004, 0.004, 0.2, M.metalDark, 4), 0, 0.2, 0));
    const larm = tube([[-0.28, 1.25, 0], [-0.4, 1.2, -0.25], [-0.42, 1.1, -0.42]], 0.045, M.cloth); root.add(larm);
    return seated(root, head, { flames: [lf], tick: (t) => { lantern.rotation.z = Math.sin(t * 0.9) * 0.08; lf.userData.flicker(t); } });
  },

  // La Mère-aux-Clous : crâne hérissé de clous, voile, doigts trop longs
  clous() {
    mats();
    const root = new THREE.Group();
    const torso = lathe([[0, 0], [0.3, 0], [0.27, 0.35], [0.2, 0.7], [0.14, 0.9], [0.06, 0.98], [0, 1]], M.clothDark); at(torso, 0, 0.4, 0);
    root.add(torso); root.userData.torso = torso;
    const head = at(new THREE.Group(), 0, 1.47, 0); root.add(head);
    const skull = sph(0.12, M.flesh, 10, 8); skull.scale.set(0.9, 1.1, 1); head.add(skull);
    for (let k = 0; k < 34; k++) {
      const u = Math.acos(1 - Math.random() * 0.9), v = Math.random() * Math.PI * 2;
      const dir = V3(Math.sin(u) * Math.cos(v), Math.cos(u), Math.sin(u) * Math.sin(v));
      const n = cyl(0.003, 0.003, 0.07 + Math.random() * 0.06, M.metal, 4);
      n.position.copy(dir.clone().multiplyScalar(0.13)); n.quaternion.setFromUnitVectors(V3(0, 1, 0), dir); head.add(n);
      const cap = cyl(0.009, 0.009, 0.004, M.metalDark, 6); cap.position.copy(dir.clone().multiplyScalar(0.13 + 0.04 + Math.random() * 0.03)); cap.quaternion.copy(n.quaternion); head.add(cap);
    }
    const veil = lathe([[0.135, 0.02], [0.14, -0.06], [0.16, -0.2], [0.2, -0.32], [0, -0.32]], M.clothDark, 10); head.add(veil);
    for (const x of [-0.04, 0.04]) head.add(at(sph(0.012, M.eyePale, 5, 4), x, 0.04, -0.105));
    for (const s of [-1, 1]) {
      root.add(tube([[s * 0.22, 1.25, 0], [s * 0.3, 1.0, -0.25], [s * 0.2, 0.86, -0.5]], 0.035, M.clothDark));
      const hd = at(new THREE.Group(), s * 0.18, 0.84, -0.56); root.add(hd);
      for (let k = 0; k < 4; k++) { const f = at(box(0.008, 0.008, 0.16, M.flesh), -0.03 + k * 0.02, 0, -0.07); f.rotation.y = (k - 1.5) * 0.12; hd.add(f); }
    }
    return seated(root, head);
  },

  // Le Chevalier-Terreau : heaume rempli de terre d'où sortent des racines
  terreau() {
    mats();
    const root = new THREE.Group();
    const torso = lathe([[0, 0], [0.38, 0], [0.4, 0.3], [0.36, 0.65], [0.3, 0.88], [0.12, 0.95], [0, 0.96]], M.metalDark); at(torso, 0, 0.42, 0);
    root.add(torso); root.userData.torso = torso;
    for (const s of [-1, 1]) {
      const p = at(sph(0.17, M.metal, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), s * 0.3, 1.26, 0); p.scale.set(1, 0.8, 1.1); root.add(p);
      root.add(tube([[s * 0.33, 1.15, 0], [s * 0.42, 0.95, -0.25], [s * 0.3, 0.86, -0.5]], 0.06, M.metalDark));
      root.add(at(sph(0.06, M.metal, 7, 5), s * 0.3, 0.86, -0.52));
    }
    const head = at(new THREE.Group(), 0, 1.5, 0); root.add(head);
    head.add(at(cyl(0.15, 0.15, 0.28, M.metal, 12), 0, 0, 0));
    const top = at(sph(0.15, M.earth, 10, 6), 0, 0.14, 0); top.scale.y = 0.5; head.add(top);
    head.add(at(box(0.2, 0.025, 0.04, M.black), 0, 0.03, -0.14));
    head.add(at(box(0.03, 0.14, 0.04, M.black), 0, -0.02, -0.14));
    for (let k = 0; k < 7; k++) {
      const x = -0.08 + k * 0.027;
      head.add(tube([[x, 0.03, -0.15], [x + Math.sin(k) * 0.03, -0.05 - k % 3 * 0.03, -0.2], [x * 1.4, -0.25 - (k % 2) * 0.1, -0.18]], 0.006, M.earth));
    }
    for (let k = 0; k < 5; k++) head.add(tube([[Math.cos(k) * 0.08, 0.2, Math.sin(k) * 0.08], [Math.cos(k) * 0.12, 0.3, Math.sin(k) * 0.1], [Math.cos(k) * 0.2, 0.33 + k * 0.02, Math.sin(k) * 0.15]], 0.005, M.earth));
    const eye = at(sph(0.012, M.eye, 5, 4), 0.03, 0.03, -0.12); head.add(eye);
    return seated(root, head, { tick: (t) => { eye.visible = Math.sin(t * 0.6) > -0.9; } });
  },

  // L'Enfant-Cierge : petite chose voûtée, des cierges fondus sur le crâne
  cierge() {
    mats();
    const root = new THREE.Group();
    const torso = at(sph(0.26, M.clothDark, 10, 8), 0, 0.8, 0.05); torso.scale.set(1, 0.9, 1); root.add(torso); root.userData.torso = torso;
    const head = at(new THREE.Group(), 0, 1.1, -0.12); head.rotation.x = 0.25; root.add(head);
    const sk = sph(0.17, M.wax, 10, 8); sk.scale.set(1, 0.95, 1); head.add(sk);
    for (const x of [-0.06, 0.06]) { head.add(at(sph(0.04, M.black, 6, 5), x, 0, -0.14)); head.add(at(sph(0.008, M.eyePale, 4, 3), x, 0, -0.175)); }
    head.add(at(box(0.07, 0.008, 0.02, M.black), 0, -0.08, -0.15));
    const flames = [];
    [[0, 0.12], [0.08, 0.09], [-0.08, 0.08], [0.04, 0.05], [-0.05, 0.13]].forEach(([x, h], i) => {
      const c = makeCandle(h, 0.018, i < 2); at(c, x, 0.13, (i % 2 ? 0.05 : -0.02)); c.rotation.z = -x * 1.5; head.add(c); flames.push(c.userData.flame);
    });
    for (const s of [-1, 1]) {
      root.add(tube([[s * 0.2, 0.9, -0.05], [s * 0.25, 0.85, -0.3], [s * 0.15, 0.84, -0.48]], 0.03, M.wax));
      const hd = at(new THREE.Group(), s * 0.14, 0.835, -0.52); root.add(hd);
      for (let k = 0; k < 3; k++) hd.add(at(box(0.01, 0.01, 0.06, M.wax), -0.015 + k * 0.015, 0, -0.03));
    }
    return seated(root, head, { flames, tick: (t) => flames.forEach((f) => f.userData.flicker(t)) });
  },

  // Les autres pèlerins (joueurs humains distants)
  pelerin(variant = 0) {
    mats();
    const root = new THREE.Group();
    const torso = lathe([[0, 0], [0.34, 0], [0.36, 0.35], [0.32, 0.7], [0.26, 0.9], [0.1, 0.96], [0, 0.97]], M.metalDark); at(torso, 0, 0.42, 0);
    root.add(torso); root.userData.torso = torso;
    const cape = lathe([[0.3, 0.9], [0.38, 0.5], [0.42, 0]], M.cloth, 10); at(cape, 0, 0.42, 0.04); root.add(cape);
    for (const s of [-1, 1]) {
      root.add(tube([[s * 0.3, 1.2, 0], [s * 0.38, 0.95, -0.25], [s * 0.24, 0.86, -0.5]], 0.05, M.metal));
      root.add(at(box(0.09, 0.03, 0.1, M.metal), s * 0.24, 0.85, -0.55));
    }
    const head = at(new THREE.Group(), 0, 1.5, 0); root.add(head);
    head.add(makeHelm(variant));
    return seated(root, head);
  },
};

// ── Carte (géométrie) ────────────────────────────────────────
export const CARD_W = 0.075, CARD_H = 0.11;
export function makeCardMesh(front, back) {
  mats();
  const edge = new THREE.MeshBasicMaterial({ color: 0xcfc49c });
  const f = new THREE.MeshStandardMaterial({ map: front, roughness: 0.9, emissiveMap: front, emissive: 0x8a8a8a });
  const b = new THREE.MeshStandardMaterial({ map: back, roughness: 0.9, emissiveMap: back, emissive: 0x6a6a6a });
  const m = new THREE.Mesh(new THREE.BoxGeometry(CARD_W, CARD_H, 0.0015), [edge, edge, edge, edge, f, b]);
  return m;
}

// ── La crypte et la table ───────────────────────────────────
export const TABLE = { c: V3(0, 0.82, -1.25), r: 1.2 };

export function buildCrypt(scene) {
  mats();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 3.2, 10);
  const room = new THREE.Group(); scene.add(room);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 5, 28, 1, true), M.bricks); at(wall, 0, 2.3, -1.2); room.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), M.stone); floor.rotation.x = -Math.PI / 2; at(floor, 0, 0, -1.2); room.add(floor);
  // piliers et arcs
  for (let k = 0; k < 10; k++) {
    if (k === 0) continue;
    const a = (k / 10) * Math.PI * 2;
    const p = at(box(0.5, 4.5, 0.5, M.stone), Math.sin(a) * 4.6, 2.25, -1.2 - Math.cos(a) * 4.6); p.rotation.y = a; room.add(p);
    const arch = ogive(2.2, 2.4, 0.35, 0.28, M.stone);
    const ax = Math.sin(a + 0.314) * 4.75, az = -1.2 - Math.cos(a + 0.314) * 4.75;
    at(arch, ax, 0, az); arch.lookAt(V3(0, 0, -1.2)); room.add(arch);
    const niche = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.4), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    at(niche, ax * 1.01, 1.7, -1.2 + (az + 1.2) * 1.01); niche.lookAt(V3(0, 1.7, -1.2)); room.add(niche);
  }
  // rosace derrière le Fossoyeur
  const rose = makeRose(1.05); at(rose, 0, 2.15, -6.0); room.add(rose);
  const roseArch = ogive(2.6, 1.1, 0.4, 0.3, M.stone); at(roseArch, 0, 0, -6.1); room.add(roseArch);
  const roseL = new THREE.SpotLight(0xd8e8c8, 25, 9, 0.5, 0.7, 1); at(roseL, 0, 2.2, -5.8); roseL.target.position.set(0, 0.8, -1.4); room.add(roseL, roseL.target);
  // table ronde
  const top = at(cyl(TABLE.r, TABLE.r, 0.07, M.wood, 28), TABLE.c.x, TABLE.c.y - 0.035, TABLE.c.z); room.add(top);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(TABLE.r, 0.035, 5, 32), M.metalDark); rim.rotation.x = Math.PI / 2; at(rim, TABLE.c.x, TABLE.c.y - 0.03, TABLE.c.z); room.add(rim);
  room.add(at(cyl(0.18, 0.4, 0.8, M.wood, 10), TABLE.c.x, 0.4, TABLE.c.z));
  // sceau gravé au centre
  const seal = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.3, 32), new THREE.MeshBasicMaterial({ color: 0x1a1208 })); seal.rotation.x = -Math.PI / 2; at(seal, TABLE.c.x, TABLE.c.y + 0.001, TABLE.c.z); room.add(seal);
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.025, 8), new THREE.MeshBasicMaterial({ color: 0x1a1208 }));
    d.rotation.x = -Math.PI / 2; at(d, TABLE.c.x + Math.sin(a) * 0.36, TABLE.c.y + 0.001, TABLE.c.z - Math.cos(a) * 0.36); room.add(d);
  }
  // os épars, crâne, cierges
  const skull = makeSkull(1.1); at(skull, -0.42, TABLE.c.y + 0.06, -0.92); skull.rotation.y = 0.6; room.add(skull);
  for (let k = 0; k < 3; k++) { const b = at(cyl(0.008, 0.01, 0.16, M.bone, 5), 0.55 + k * 0.03, TABLE.c.y + 0.01, -1.0 + k * 0.05); b.rotation.z = Math.PI / 2; b.rotation.y = k * 0.7; room.add(b); }
  const flames = [];
  [[-0.62, -1.2, 0.2], [0.6, -1.5, 0.16], [0.12, -0.78, 0.09], [-0.3, -1.85, 0.24]].forEach(([x, z, h], i) => {
    const c = makeCandle(h, 0.024, i !== 2); at(c, x, TABLE.c.y, z); room.add(c); flames.push(c.userData.flame);
  });
  // grand candélabre derrière (contre-jour)
  for (const s of [-1, 1]) {
    const cb = at(new THREE.Group(), s * 2.5, 0, -3.6); room.add(cb);
    cb.add(at(cyl(0.03, 0.08, 1.8, M.metalDark, 6), 0, 0.9, 0));
    for (let k = -1; k <= 1; k++) { const c = makeCandle(0.18, 0.03, k === 0); at(c, k * 0.2, 1.8, 0); cb.add(c); flames.push(c.userData.flame); }
  }
  // lumière froide tombant d'une grille
  const spot = new THREE.SpotLight(0xd8e8c0, 40, 10, 0.5, 0.55, 1.0); at(spot, 0.3, 5, -1.1); spot.target.position.copy(TABLE.c); room.add(spot, spot.target);
  const amb = new THREE.HemisphereLight(0x8aa070, 0x141410, 1.4); room.add(amb);
  const near = new THREE.PointLight(0xfff0d8, 1.8, 2.4, 1.0); at(near, 0.05, 1.35, -0.55); room.add(near);
  // poussière en suspension
  const n = 160, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 2.2; pos[i * 3 + 1] = 0.9 + Math.random() * 2.6; pos[i * 3 + 2] = -1.2 + (Math.random() - 0.5) * 2.2; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xd8e0b8, size: 0.012, sizeAttenuation: true }));
  room.add(dust);
  return {
    room, flames, spot, amb,
    tick(t) {
      flames.forEach((f) => f.userData.flicker(t));
      const p = dg.attributes.position;
      for (let i = 0; i < n; i++) { let y = p.getY(i) - 0.0015; if (y < 0.85) y = 3.4; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(t + i) * 0.0004); }
      p.needsUpdate = true;
    },
  };
}

// ── Couverture : forêt de pins, tour en ruine, pèlerin ──────
export function buildCover(scene) {
  mats();
  scene.background = new THREE.Color(0xd8c8a0);
  scene.fog = new THREE.Fog(0xd8c8a0, 6, 30);
  const g = new THREE.Group(); scene.add(g);
  const pine = new THREE.MeshStandardMaterial({ color: 0x1e3a33, flatShading: true, roughness: 1 });
  const rock = new THREE.MeshStandardMaterial({ color: 0x6f9a86, flatShading: true, roughness: 1 });
  for (let k = 0; k < 90; k++) {
    const x = (Math.random() - 0.5) * 34, z = -4 - Math.random() * 26;
    if (Math.abs(x + 3) < 2.4 && z < -14) continue;
    const s = 0.7 + Math.random() * 1.1, tree = new THREE.Group();
    for (let j = 0; j < 4; j++) tree.add(at(cone(0.9 * s * (1 - j * 0.2), 1.6 * s, pine, 7), 0, 1 * s + j * 0.9 * s, 0));
    tree.add(at(cyl(0.08 * s, 0.12 * s, 1.2 * s, pine, 5), 0, 0.5 * s, 0));
    at(tree, x, 0, z); g.add(tree);
  }
  // tour
  const stoneM = new THREE.MeshStandardMaterial({ color: 0x9a8a70, flatShading: true, roughness: 1 });
  const tower = at(new THREE.Group(), -3.4, 0, -18); g.add(tower);
  tower.add(at(cyl(1.1, 1.4, 9, stoneM, 9), 0, 4.5, 0));
  tower.add(at(cone(1.4, 3.5, stoneM, 9), 0, 10.6, 0));
  tower.add(at(cyl(0.7, 0.9, 5, stoneM, 8), 2.2, 2.5, 0.6));
  for (let k = 0; k < 6; k++) tower.add(at(box(0.18, 0.4, 0.2, M.eye), Math.sin(k) * 1.05, 2.5 + k * 1.2, Math.cos(k) * 1.05 + 0.3));
  // rocher + pèlerin vu de dos + épée plantée
  const rk = at(new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 0), rock), 1.3, -0.6, -4.6); rk.scale.set(1.6, 0.8, 1); g.add(rk);
  const pil = at(new THREE.Group(), 1.4, 0.55, -4.4); g.add(pil);
  pil.add(at(lathe([[0, 0], [0.32, 0], [0.26, 0.6], [0.2, 1.1], [0.1, 1.25], [0, 1.27]], new THREE.MeshStandardMaterial({ color: 0x2f6f5a, flatShading: true }), 9), 0, 0, 0));
  pil.add(at(cone(0.14, 0.42, new THREE.MeshStandardMaterial({ color: 0x2f6f5a, flatShading: true }), 7), 0, 1.45, 0));
  pil.add(at(cyl(0.25, 0.25, 0.02, new THREE.MeshStandardMaterial({ color: 0x2f6f5a }), 10), 0, 1.3, 0));
  const sword = at(new THREE.Group(), 2.3, 0.3, -4.2); sword.rotation.z = -0.15; g.add(sword);
  sword.add(at(box(0.05, 1.1, 0.012, M.metal), 0, 0.3, 0)); sword.add(at(box(0.36, 0.04, 0.04, M.bronze), 0, 0.85, 0)); sword.add(at(box(0.035, 0.22, 0.035, M.clothDark), 0, 1.0, 0)); sword.add(at(sph(0.04, M.bronze), 0, 1.13, 0));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), rock); ground.rotation.x = -Math.PI / 2; g.add(ground);
  // brume
  const mistM = new THREE.MeshBasicMaterial({ color: 0xe8dcc0, transparent: true, opacity: 0.35, depthWrite: false });
  const mists = [];
  for (let k = 0; k < 5; k++) { const m = at(new THREE.Mesh(new THREE.PlaneGeometry(40, 1.6), mistM), 0, 0.6 + k * 0.5, -8 - k * 3.5); mists.push(m); g.add(m); }
  scene.add(new THREE.HemisphereLight(0xf0e0c0, 0x203a30, 1.4));
  const sun = new THREE.DirectionalLight(0xffe8c0, 1.4); sun.position.set(-4, 8, -10); scene.add(sun);
  return { tick(t) { mists.forEach((m, i) => { m.position.x = Math.sin(t * 0.05 + i) * 3; }); } };
}

// ── Couloir (cinématique) ────────────────────────────────────
export function buildCorridor(scene) {
  mats();
  scene.background = new THREE.Color(0); scene.fog = new THREE.Fog(0, 2, 16);
  const g = new THREE.Group(); scene.add(g);
  const brick = M.bricks.clone(); brick.side = THREE.DoubleSide;
  for (let k = 0; k < 9; k++) {
    const z = -k * 2;
    for (const s of [-1, 1]) g.add(at(box(0.3, 3, 2, M.stone), s * 1.3, 1.5, z));
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.16, 4, 14, Math.PI), M.stone); at(arch, 0, 3, z - 1); g.add(arch);
  }
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(3, 20), M.stone); fl.rotation.x = -Math.PI / 2; at(fl, 0, 0, -8); g.add(fl);
  const torch = makeFlame(4); at(torch, 1.05, 2.0, -3.5); g.add(torch);
  const torch2 = makeFlame(3); at(torch2, -1.05, 2.0, -9); g.add(torch2);
  const p = CREATURES.pelerin(1); p.root.rotation.y = Math.PI; at(p.root, 0.2, -0.4, -2.6); g.add(p.root);
  scene.add(new THREE.HemisphereLight(0x8aa070, 0x101010, 2.2));
  const end = new THREE.PointLight(0xd8e8c0, 30, 14, 1); end.position.set(0, 2.2, -12); scene.add(end);
  return { tick(t) { torch.userData.flicker(t); torch2.userData.flicker(t); } };
}

// ── Heaumes des pèlerins ─────────────────────────────────────
export function makeHelm(variant = 0) {
  mats();
  const head = new THREE.Group();
  [
    () => { head.add(at(sph(0.14, M.metal, 10, 8), 0, 0, 0)); head.add(at(box(0.2, 0.02, 0.05, M.black), 0, 0.01, -0.12)); head.add(at(cone(0.02, 0.22, M.metalDark, 5), 0, 0.22, 0)); },
    () => { head.add(at(cyl(0.14, 0.13, 0.26, M.metal, 10), 0, 0, 0)); head.add(at(box(0.04, 0.12, 0.05, M.black), 0, 0, -0.12)); for (const s of [-1, 1]) { const h = cone(0.03, 0.2, M.bone, 5); h.rotation.z = -s * 0.8; at(h, s * 0.17, 0.14, 0); head.add(h); } },
    () => { head.add(at(sph(0.14, M.metal, 10, 8), 0, 0, 0)); head.add(rx(at(new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 5, 16), M.flameCore), 0, 0.26, 0), Math.PI / 2)); head.add(at(box(0.18, 0.02, 0.05, M.black), 0, 0, -0.12)); },
    () => { head.add(at(cone(0.16, 0.36, M.metal, 10), 0, 0.05, 0)); head.add(at(box(0.15, 0.03, 0.05, M.black), 0, -0.04, -0.12)); },
  ][variant % 4]();
  return head;
}

// Pèlerin debout (écran du seuil)
export function makeStandingPilgrim(variant = 0) {
  mats();
  const root = new THREE.Group();
  const cloakM = new THREE.MeshStandardMaterial({ color: 0x9a9888, flatShading: true, roughness: 1, side: THREE.DoubleSide });
  for (const s of [-1, 1]) root.add(at(cyl(0.07, 0.06, 0.9, M.metalDark, 6), s * 0.11, 0.45, 0));
  const torso = lathe([[0.2, 0], [0.26, 0.3], [0.3, 0.55], [0.27, 0.65], [0.1, 0.72], [0, 0.73]], M.metal, 10); at(torso, 0, 0.88, 0); root.add(torso);
  const cloak = lathe([[0.5, 0], [0.42, 0.5], [0.34, 0.9], [0.3, 1.25], [0.12, 1.32]], cloakM, 12); at(cloak, 0, 0.12, 0.04); root.add(cloak);
  for (const s of [-1, 1]) { const p = at(sph(0.13, M.metal, 8, 6), s * 0.27, 1.5, 0); p.scale.set(1, 0.7, 1.1); root.add(p); }
  const head = at(makeHelm(variant), 0, 1.72, 0); root.add(head);
  const sword = at(new THREE.Group(), 0.3, 0.75, -0.1); sword.rotation.z = 0.12; root.add(sword);
  sword.add(at(box(0.04, 0.8, 0.01, M.metal), 0, -0.2, 0)); sword.add(at(box(0.22, 0.03, 0.03, M.bronze), 0, 0.2, 0)); sword.add(at(box(0.03, 0.14, 0.03, M.clothDark), 0, 0.29, 0));
  root.userData.tick = (t) => { cloak.rotation.y = Math.sin(t * 0.8) * 0.05; cloak.scale.x = 1 + Math.sin(t * 1.3) * 0.02; head.rotation.y = Math.sin(t * 0.25) * 0.25; };
  return root;
}

// ── Ogive (arc brisé) ────────────────────────────────────────
export function ogive(w, h0, depth, thick, m) {
  const outline = (W, H) => {
    const pts = [new THREE.Vector2(-W / 2, 0), new THREE.Vector2(-W / 2, H)];
    for (let i = 1; i <= 10; i++) { const a = Math.PI - (i / 10) * (Math.PI / 3); pts.push(new THREE.Vector2(W / 2 + W * Math.cos(a), H + W * Math.sin(a))); }
    for (let i = 9; i >= 0; i--) { const a = (i / 10) * (Math.PI / 3); pts.push(new THREE.Vector2(-W / 2 + W * Math.cos(a), H + W * Math.sin(a))); }
    pts.push(new THREE.Vector2(W / 2, 0));
    return pts;
  };
  const shape = new THREE.Shape(outline(w + thick * 2, h0));
  const hole = new THREE.Path(outline(w, h0).map((p) => new THREE.Vector2(p.x, p.y)).reverse());
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  return new THREE.Mesh(g, m);
}

// ── Rosace ───────────────────────────────────────────────────
export function makeRose(r = 1.2) {
  mats();
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshBasicMaterial({ color: 0xc8d8a8 }));
  g.add(glass);
  const stone = new THREE.MeshStandardMaterial({ color: 0x2a2a24, roughness: 1, flatShading: true });
  g.add(at(new THREE.Mesh(new THREE.TorusGeometry(r, 0.09, 6, 36), stone), 0, 0, 0.02));
  g.add(at(new THREE.Mesh(new THREE.TorusGeometry(r * 0.32, 0.05, 6, 24), stone), 0, 0, 0.02));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const b = at(box(0.04, r * 0.68, 0.06, stone), Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66, 0.02); b.rotation.z = a - Math.PI / 2; g.add(b);
    const ring = at(new THREE.Mesh(new THREE.TorusGeometry(r * 0.17, 0.03, 4, 16), stone), Math.cos(a + 0.26) * r * 0.78, Math.sin(a + 0.26) * r * 0.78, 0.02); g.add(ring);
  }
  return g;
}

// ── Extérieur de la taverne (écrans d'accueil) ──────────────
export function buildTavern(scene) {
  mats();
  scene.background = new THREE.Color(0x020202);
  scene.fog = new THREE.Fog(0x020202, 10, 42);
  const g = new THREE.Group(); scene.add(g);
  const wall = new THREE.MeshStandardMaterial({ color: 0xc8c0b0, roughness: 1, flatShading: true });
  const beam = new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 1 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x3a3a36, roughness: 1, flatShading: true });
  const win = new THREE.MeshBasicMaterial({ color: 0xffb050 });
  const winDim = new THREE.MeshBasicMaterial({ color: 0xc87a30 });
  const T = at(new THREE.Group(), 0, 0, -9); g.add(T);
  // rez-de-chaussée en pierre, étage en colombages en encorbellement
  T.add(at(box(7, 3, 4.4, M.stone), 0, 1.5, 0));
  T.add(at(box(7.6, 2.6, 4.8, wall), 0, 4.3, 0.15));
  for (let x = -3.6; x <= 3.7; x += 1.2) T.add(at(box(0.16, 2.6, 0.12, beam), x, 4.3, 2.58));
  T.add(at(box(7.7, 0.18, 0.14, beam), 0, 3.05, 2.6)); T.add(at(box(7.7, 0.18, 0.14, beam), 0, 5.55, 2.6));
  for (let k = 0; k < 6; k++) { const d = at(box(0.12, 1.6, 0.1, beam), -3 + k * 1.2 + 0.6, 4.3, 2.6); d.rotation.z = k % 2 ? 0.6 : -0.6; T.add(d); }
  // toit pentu
  const rf = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 4.4, 4.2, 4, 1), roof); rf.rotation.y = Math.PI / 4; rf.scale.set(1.25, 1, 0.85); at(rf, 0, 7.6, 0.15); T.add(rf);
  T.add(at(box(0.7, 3, 0.7, M.stone), 2.2, 8.2, -0.6));
  // fenêtres allumées
  const windows = [];
  const mkWin = (x, y, w, h, m) => {
    const p = at(new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), x, y, 2.62 + (y > 3 ? 0.0 : -0.38)); p.userData.m = m; T.add(p); windows.push(p);
    T.add(at(box(0.06, h, 0.06, beam), x, y, p.position.z + 0.02)); T.add(at(box(w, 0.06, 0.06, beam), x, y, p.position.z + 0.02));
    const l = new THREE.PointLight(0xffe8d0, 3, 6, 1.2); at(l, x, y - 1.2, p.position.z + 1.6); T.add(l);
  };
  mkWin(-2.4, 1.6, 1.1, 1.0, win); mkWin(2.5, 1.6, 1.1, 1.0, win);
  mkWin(-2.4, 4.3, 0.9, 1.1, winDim); mkWin(0, 4.3, 0.9, 1.1, win); mkWin(2.4, 4.3, 0.9, 1.1, winDim);
  // porte en ogive, fente de lumière
  const door = at(ogive(1.2, 1.4, 0.3, 0.18, M.stone), 0, 0, 2.15); T.add(door);
  const leaf = at(new THREE.Group(), -0.6, 0, 2.5); T.add(leaf);
  leaf.add(at(box(1.2, 2.0, 0.08, M.wood), 0.6, 1.0, 0)); leaf.rotation.y = 1.25;
  const inside = new THREE.MeshBasicMaterial({ color: 0xfff0d8 });
  T.add(at(new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.05), inside), 0, 1.02, 2.23));
  T.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.6, 16, 0, Math.PI), inside), 0, 2.04, 2.23));
  const doorL = new THREE.SpotLight(0xfff0dc, 30, 12, 0.7, 0.6, 1); at(doorL, 0, 1.6, 2.0); doorL.target.position.set(0, 0, 8); T.add(doorL, doorL.target);
  const lantern = at(makeFlame(5), 0.95, 2.35, 2.55); T.add(lantern);
  T.add(at(box(0.2, 0.3, 0.2, M.metalDark), 0.95, 2.4, 2.55));
  // enseigne
  T.add(at(box(1.2, 0.08, 0.08, M.metalDark), -1.3, 2.9, 2.9));
  const sign = at(new THREE.Group(), -1.7, 2.85, 2.9); T.add(sign);
  sign.add(at(box(0.8, 0.6, 0.06, M.wood), 0, -0.4, 0));
  sign.add(at(makeSkull(2.2), 0, -0.38, 0.05));
  // maisons voisines, flèche d'église, arbre mort, lune
  const dark = new THREE.MeshStandardMaterial({ color: 0x3a3a34, roughness: 1, flatShading: true });
  [[-9, 0, -13, 5, 6], [9.5, 0, -12, 5, 5], [-15, 0, -20, 6, 8], [15, 0, -19, 6, 7]].forEach(([x, y, z, w, h]) => {
    g.add(at(box(w, h, 4, dark), x, h / 2, z));
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.01, w * 0.75, 3, 4, 1), dark); r.rotation.y = Math.PI / 4; at(r, x, h + 1.5, z); g.add(r);
    if (x > 0) g.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), winDim), x - 1, h * 0.6, z + 2.01));
  });
  const church = at(new THREE.Group(), -6, 0, -30); g.add(church);
  church.add(at(box(3, 12, 3, dark), 0, 6, 0)); church.add(at(cone(2.2, 9, dark, 4), 0, 16.5, 0));
  for (const s of [-1, 1]) church.add(at(cone(0.4, 3, dark, 4), s * 1.5, 13.5, 1.5));
  const tree = at(new THREE.Group(), 6.5, 0, -4); g.add(tree);
  tree.add(tube([[0, 0, 0], [0.3, 2, 0], [-0.2, 4, 0.2], [0.4, 6, 0]], 0.18, beam));
  tree.add(tube([[0.1, 3, 0], [1.2, 4, 0.2], [2, 4.4, 0.5]], 0.07, beam)); tree.add(tube([[-0.1, 4.3, 0.2], [-1.3, 5.2, 0], [-1.8, 6, 0.2]], 0.06, beam));
  const moon = at(new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })), 9, 17, -34); g.add(moon);
  // ciel : clair près de l'horizon, noir en haut (silhouettes lisibles)
  const skyTex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#000'); gr.addColorStop(0.45, '#2a2a2a'); gr.addColorStop(0.8, '#8a8880'); gr.addColorStop(1, '#b8b4a8');
    x.fillStyle = gr; x.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const sky = at(new THREE.Mesh(new THREE.PlaneGeometry(160, 60), new THREE.MeshBasicMaterial({ map: skyTex, fog: false })), 0, 24, -40); g.add(sky);
  // pavés + flaques
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), M.stone); ground.rotation.x = -Math.PI / 2; g.add(ground);
  const pud = new THREE.MeshBasicMaterial({ color: 0x9a9a92 });
  [[-1.5, -4], [1.8, -5.5], [0.3, -2.5], [-3, -6.5]].forEach(([x, z], i) => { const p = new THREE.Mesh(new THREE.CircleGeometry(0.5 + i * 0.15, 12), pud); p.rotation.x = -Math.PI / 2; p.scale.x = 1.8; at(p, x, 0.01, z); g.add(p); });
  // fumée de cheminée
  const smoke = [];
  for (let k = 0; k < 10; k++) { const m = at(sph(0.45 + k * 0.08, new THREE.MeshBasicMaterial({ color: 0x5a5a54, transparent: true, opacity: 0.5 }), 8, 6), 2.2, 9.8 + k * 0.8, -9.6); smoke.push(m); g.add(m); }
  scene.add(new THREE.HemisphereLight(0x9aa0b0, 0x1a1a1a, 1.6));
  const moonL = new THREE.DirectionalLight(0xd8dcf0, 1.6); moonL.position.set(6, 12, 8); scene.add(moonL);
  const back = new THREE.DirectionalLight(0xc8ccd8, 1.2); back.position.set(-4, 6, -20); scene.add(back);
  // pèlerin debout (visible sur l'écran du seuil)
  let pilgrim = null, variant = -1;
  const setPilgrim = (v) => {
    if (v === variant) return; variant = v;
    if (pilgrim) g.remove(pilgrim);
    pilgrim = makeStandingPilgrim(v); at(pilgrim, 0.1, 0, -5.5); pilgrim.rotation.y = 0.3; g.add(pilgrim);
  };
  return {
    setPilgrim, showPilgrim(v) { if (pilgrim) pilgrim.visible = v; },
    tick(t) {
      lantern.userData.flicker(t);
      sign.rotation.x = Math.sin(t * 1.4) * 0.12;
      windows.forEach((w, i) => { w.material = Math.sin(t * 0.7 + i * 2.1) > 0.97 ? winDim : w.userData.m; });
      smoke.forEach((m, i) => { m.position.y = 9.8 + ((i * 0.8 + t * 0.35) % 8); m.position.x = 2.2 + Math.sin(t * 0.3 + i) * 0.4 + (m.position.y - 9.8) * 0.25; });
      pilgrim?.userData.tick(t);
    },
  };
}
