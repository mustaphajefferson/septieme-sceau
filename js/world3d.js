// ─────────────────────────────────────────────────────────────
//  Décors 3D : la Forêt des Pendus, le Pont-levis, la salle du
//  Roi déchu, et la scène nue où pose le chevalier.
// ─────────────────────────────────────────────────────────────
import { THREE, mats, mesh, at, rot, lathe, tube, taper, V, render, still, candle3d, flameMesh, getRenderer } from './r3d.js';
import { buildFigure, etendard3d, trophees3d, skull } from './body3d.js';
import { mergeGeometries } from '../vendor/three.min.js';
import { TAU, rng, canvas } from './paint.js';

const G = () => new THREE.Group();
const BOX = (x, y, z) => new THREE.BoxGeometry(x, y, z);
const CYL = (a, b, h, s = 20, o = false) => new THREE.CylinderGeometry(a, b, h, s, 1, o);
const shaftMat = () => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });

// ── végétation ───────────────────────────────────────────────
function pineGeo(seed) {
  const r = rng(seed), parts = [];
  const trunk = CYL(0.06, 0.16, 7, 8); trunk.translate(0, 3.5, 0); parts.push(trunk);
  for (let i = 0; i < 9; i++) {
    const y = 1.6 + i * 0.62, rad = (1.5 - i * 0.15) * (0.85 + r() * 0.3);
    const c = new THREE.ConeGeometry(rad, 1.3, 9, 3); c.translate(0, y + 0.5, 0);
    const p = c.attributes.position;
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), z = p.getZ(k), yy = p.getY(k); const f = 1 + (r() - 0.5) * 0.35; p.setXYZ(k, x * f, yy - (Math.hypot(x, z) > rad * 0.8 ? r() * 0.35 : 0), z * f); }
    c.deleteAttribute('uv'); c.deleteAttribute('normal'); trunk.deleteAttribute?.('x');
    parts.push(c);
  }
  parts.forEach((g) => { if (g.attributes.uv) g.deleteAttribute('uv'); if (g.attributes.normal) g.deleteAttribute('normal'); });
  const m = mergeGeometries(parts.map((g) => g.index ? g.toNonIndexed() : g)); m.computeVertexNormals(); return m;
}
function deadTreeGeo(seed, h = 6) {
  const r = rng(seed), parts = [];
  const branch = (p0, dir, len, rad, depth) => {
    const pts = [p0.clone()]; let p = p0.clone(), d = dir.clone();
    for (let i = 0; i < 4; i++) { d.add(V((r() - 0.5) * 0.5, (r() - 0.3) * 0.25, (r() - 0.5) * 0.5)).normalize(); p = p.clone().addScaledVector(d, len / 4); pts.push(p); }
    parts.push(taper(pts.map((v) => [v.x, v.y, v.z]), rad, rad * 0.35, 10));
    if (depth > 0) for (let k = 0; k < (depth > 1 ? 3 : 2); k++) {
      const i = 1 + Math.floor(r() * 3), nd = d.clone().add(V((r() - 0.5) * 2, r() * 0.4 - 0.1, (r() - 0.5) * 2)).normalize();
      branch(pts[i], nd, len * (0.55 + r() * 0.2), rad * 0.5, depth - 1);
    }
  };
  branch(V(0, -0.3, 0), V(0, 1, 0), h, 0.32, 3);
  const m = mergeGeometries(parts.map((g) => { g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; })); m.computeVertexNormals(); return m;
}
function hanged(M, seed) {
  const g = G(), r = rng(seed);
  const rope = mesh(tube([[0, 1.3, 0], [0.02, 0.6, 0.01], [0, 0, 0]], 0.012, 12, 6), M.leather); g.add(rope);
  const body = G(); g.add(body);
  const head = mesh(new THREE.SphereGeometry(0.13, 16, 12), M.cloth); head.scale.set(0.95, 1.15, 0.95); at(head, 0.03, -0.12, 0); head.rotation.z = 0.5; body.add(head);
  const robe = mesh(lathe([[0.05, 0], [0.18, -0.08], [0.22, -0.3], [0.2, -0.8], [0.26, -1.2], [0.2, -1.25]], 18), M.cloth); robe.position.y = -0.22; body.add(robe);
  for (const sd of [-1, 1]) { const arm = mesh(taper([[sd * 0.18, -0.35, 0], [sd * 0.22, -0.7, 0.02], [sd * 0.2, -0.95, 0.05]], 0.05, 0.035, 8), M.clothDark); body.add(arm); const hand = mesh(new THREE.SphereGeometry(0.035, 8, 6), M.bone); at(hand, sd * 0.2, -0.98, 0.05); body.add(hand); }
  for (const sd of [-1, 1]) { const ft = mesh(taper([[sd * 0.08, -1.4, 0], [sd * 0.08, -1.62, 0.02]], 0.04, 0.03, 6), M.bone); body.add(ft); }
  g.userData.tick = (t) => { body.rotation.y = Math.sin(t * 0.4 + seed) * 0.6; g.rotation.z = Math.sin(t * 0.7 + seed) * 0.03; };
  g.userData.phase = r();
  return g;
}

// ── la forêt ─────────────────────────────────────────────────
function foret(M) {
  const s = new THREE.Scene(); s.background = new THREE.Color(0x3a3a38); s.fog = new THREE.FogExp2(0x4a4a48, 0.06); s.background = new THREE.Color(0x4a4a48);
  const r = rng(11), ticks = [];
  const ground = mesh(new THREE.PlaneGeometry(80, 80, 60, 60), M.ground); ground.rotation.x = -Math.PI / 2;
  { const p = ground.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (Math.sin(p.getX(i) * 0.7) + Math.cos(p.getY(i) * 0.5)) * 0.12 + r() * 0.05); ground.geometry.computeVertexNormals(); }
  s.add(ground);
  for (let v = 0; v < 3; v++) {
    const geo = pineGeo(20 + v), n = 70;
    const im = new THREE.InstancedMesh(geo, M.fur, n); im.castShadow = true; im.receiveShadow = true;
    const o = new THREE.Object3D();
    let k = 0;
    while (k < n) {
      const x = (r() - 0.5) * 50, z = -2 - r() * 40;
      if ((Math.abs(x) < 2.6 && z > -16) || (Math.abs(x) < 6 && z > -5)) continue; // clairière + chemin
      o.position.set(x, -0.2, z); o.rotation.y = r() * TAU; o.scale.setScalar(0.7 + r() * 0.8); o.updateMatrix(); im.setMatrixAt(k++, o.matrix);
    }
    s.add(im);
  }
  // chênes morts et pendus
  const oakG = deadTreeGeo(5, 6.5), oakG2 = deadTreeGeo(9, 5.5);
  for (const [x, z, g, ry] of [[-3.2, -3.5, oakG, 0.4], [3.6, -5.5, oakG2, 2.2], [-2.6, -9, oakG2, 1], [2.4, -12, oakG, -0.6]]) {
    const o = mesh(g, M.wood); at(o, x, 0, z); o.rotation.y = ry; s.add(o);
  }
  for (const [x, y, z, sd] of [[-2.0, 4.1, -3.4, 1], [2.6, 3.7, -5.2, 2], [-1.8, 3.6, -8.8, 3], [1.4, 4.0, -11.6, 4]]) {
    const h = hanged(M, sd); at(h, x, y - 1.3, z); s.add(h); ticks.push(h.userData.tick);
    s.add(at(rot(mesh(CYL(0.06, 0.08, 2.2, 8), M.wood), 0, 0, Math.PI / 2), x + (x < 0 ? -0.8 : 0.8), y, z));
  }
  // pierres, souches, croix
  for (let i = 0; i < 40; i++) { const st = mesh(new THREE.DodecahedronGeometry(0.15 + r() * 0.4, 1), M.stone); at(st, (r() - 0.5) * 16, 0, -1 - r() * 18); st.scale.y = 0.5; st.rotation.set(r(), r(), r()); s.add(st); }
  for (const [x, z, a] of [[-1.4, -2.5, 0.2], [1.7, -4, -0.3], [-0.9, -6.5, 0.15]]) { const c = G(); c.add(at(mesh(BOX(0.08, 1.1, 0.08), M.wood), 0, 0.5, 0)); c.add(at(mesh(BOX(0.55, 0.08, 0.08), M.wood), 0, 0.8, 0)); at(c, x, 0, z); c.rotation.set(0, a * 3, a); s.add(c); }
  // lune, rais de lumière
  const moon = mesh(new THREE.CircleGeometry(2.2, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })); at(moon, 4, 13, -45); s.add(moon);
  for (let i = 0; i < 5; i++) { const sh = mesh(new THREE.ConeGeometry(1.2 + r() * 1.5, 22, 20, 1, true), shaftMat(), { cast: false, recv: false }); at(sh, -6 + i * 3 + r(), 9, -8 - r() * 10); sh.rotation.z = -0.35; s.add(sh); }
  const key = new THREE.DirectionalLight(0xe8eef0, 3.2); key.position.set(5, 12, -10); key.target.position.set(0, 0, -3); key.castShadow = true;
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, far: 40 }); key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0005;
  s.add(key, key.target, new THREE.HemisphereLight(0x9a9a98, 0x1a1a18, 0.7));
  return { scene: s, ticks, exp: 1.9, cam: { pos: [0.3, 1.8, 6.5], look: [0, 2.6, -6], fov: 50 }, table: [0, 0, 0] };
}

// ── le pont-levis ────────────────────────────────────────────
function crenels(M, w, y, z, d = 0.8) { const g = G(); for (let x = -w / 2 + 0.3; x < w / 2; x += 1.1) g.add(at(mesh(BOX(0.6, 0.8, d), M.stone), x, y + 0.4, z)); return g; }
function tower(M, r, h) {
  const g = G();
  g.add(at(mesh(CYL(r, r * 1.08, h, 28), M.stone), 0, h / 2, 0));
  g.add(at(mesh(CYL(r * 1.18, r * 1.1, 0.5, 28), M.stone), 0, h + 0.25, 0));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; g.add(at(mesh(BOX(0.5, 0.7, 0.5), M.stone), Math.cos(a) * r * 1.12, h + 0.85, Math.sin(a) * r * 1.12)); }
  const roof = mesh(new THREE.ConeGeometry(r * 1.25, r * 2.6, 28), M.wood); at(roof, 0, h + 0.6 + r * 1.3, 0); g.add(roof);
  for (let i = 0; i < 4; i++) { const sl = mesh(BOX(0.12, 0.7, 0.1), M.black); const a = i * 1.3 + 0.4; at(sl, Math.cos(a) * r, h * (0.4 + i * 0.12), Math.sin(a) * r); sl.lookAt(0, sl.position.y, 0); g.add(sl); }
  return g;
}
function ogiveShape(w, h) { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(-w / 2, h - w * 0.62); sh.quadraticCurveTo(-w / 2, h - w * 0.08, 0, h); sh.quadraticCurveTo(w / 2, h - w * 0.08, w / 2, h - w * 0.62); sh.lineTo(w / 2, 0); sh.lineTo(-w / 2, 0); return sh; }
function torch(M) { const g = G(); g.add(at(mesh(CYL(0.035, 0.025, 0.5, 8), M.wood), 0, 0.25, 0)); g.add(at(mesh(CYL(0.07, 0.05, 0.12, 10, true), M.steelDark), 0, 0.52, 0)); const f = flameMesh(3.2); at(f, 0, 0.56, 0); g.add(f); g.userData.flame = f; return g; }
function chain(M, a, b, n = 26) {
  const g = G(), A = V(...a), B = V(...b);
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1), p = A.clone().lerp(B, k); p.y -= Math.sin(k * Math.PI) * 0.25;
    const l = mesh(new THREE.TorusGeometry(0.05, 0.014, 6, 12), M.steelDark); l.position.copy(p);
    l.lookAt(B); if (i % 2) l.rotateZ(Math.PI / 2); g.add(l);
  }
  return g;
}
function pont(M) {
  const s = new THREE.Scene(); s.background = new THREE.Color(0x161616); s.fog = new THREE.FogExp2(0x161616, 0.035);
  const ticks = [], r = rng(3);
  const ground = mesh(new THREE.PlaneGeometry(60, 60, 20, 20), M.ground); ground.rotation.x = -Math.PI / 2; ground.position.y = 0; s.add(ground);
  const water = mesh(new THREE.PlaneGeometry(40, 4.5), M.water); water.rotation.x = -Math.PI / 2; at(water, 0, -0.9, -6.2); s.add(water);
  const moatWall = mesh(BOX(40, 1.6, 0.4), M.stone); at(moatWall, 0, -0.75, -3.8); s.add(moatWall);
  const wallZ = -8.6;
  const wsh = new THREE.Shape(); wsh.moveTo(-13, -0.9); wsh.lineTo(13, -0.9); wsh.lineTo(13, 6.1); wsh.lineTo(-13, 6.1); wsh.lineTo(-13, -0.9);
  wsh.holes.push(new THREE.Path(ogiveShape(3, 4.6).getPoints(30).map((p) => new THREE.Vector2(p.x, p.y - 0.1))));
  const wall = mesh(new THREE.ExtrudeGeometry(wsh, { depth: 1.6, bevelEnabled: false }), M.stone); at(wall, 0, 0, wallZ - 0.8); s.add(wall);
  s.add(at(mesh(new THREE.PlaneGeometry(4, 6), M.black), 0, 2, wallZ - 0.7));
  const inner = new THREE.PointLight(0xffc080, 6, 4, 1.5); inner.position.set(0, 1.2, wallZ - 0.4); s.add(inner);
  s.add(crenels(M, 26, 6.1, wallZ + 0.4));
  for (const x of [-4.2, 4.2]) { const tw = tower(M, 1.8, 9); at(tw, x, -0.9, wallZ + 0.6); s.add(tw); }
  for (const x of [-11, 11]) { const tw = tower(M, 1.5, 7.5); at(tw, x, -0.9, wallZ - 1); s.add(tw); }
  // porte en ogive, herse, voussures
  for (let k = 1; k <= 3; k++) { const ar = mesh(new THREE.ExtrudeGeometry(ogiveShape(3 + k * 0.5, 4.6 + k * 0.32), { depth: 0.18, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04 }), M.stone); ar.geometry.translate(0, 0, 0); at(ar, 0, -0.1, wallZ + 0.8 - k * 0.06); s.add(ar); }
  const herse = G();
  for (let x = -1.3; x <= 1.31; x += 0.26) herse.add(at(mesh(BOX(0.07, 3.2, 0.07), M.steelDark), x, 0, 0));
  for (let y = -1.4; y <= 1.41; y += 0.4) herse.add(at(mesh(BOX(2.7, 0.06, 0.06), M.steelDark), 0, y, 0));
  for (let x = -1.3; x <= 1.31; x += 0.26) herse.add(at(rot(mesh(new THREE.ConeGeometry(0.05, 0.22, 6), M.steelDark), Math.PI, 0, 0), x, -1.7, 0));
  at(herse, 0, 3.1, wallZ + 0.1); s.add(herse);
  // le tablier du pont
  const deck = G();
  for (let i = 0; i < 16; i++) { const pl = mesh(BOX(0.22, 0.12, 6), M.wood); at(pl, -1.6 + i * 0.215, 0, 0); pl.rotation.z = (r() - 0.5) * 0.03; pl.position.y = (r() - 0.5) * 0.02; deck.add(pl); }
  for (const z of [-2.6, 0, 2.6]) deck.add(at(mesh(BOX(3.6, 0.1, 0.16), M.steelDark), 0, -0.07, z));
  for (let i = 0; i < 40; i++) deck.add(at(mesh(new THREE.SphereGeometry(0.02, 6, 4), M.steel), -1.6 + (i % 16) * 0.215, 0.06, [-2.6, 0, 2.6][i % 3]));
  at(deck, 0, 0.0, -5); s.add(deck);
  s.add(chain(M, [-1.75, 0.05, -2.2], [-1.6, 5.2, wallZ + 0.9]));
  s.add(chain(M, [1.75, 0.05, -2.2], [1.6, 5.2, wallZ + 0.9]));
  for (const x of [-2.6, 2.6]) { const tc = torch(M); at(tc, x, 2.2, wallZ + 1.0); tc.rotation.z = x < 0 ? 0.25 : -0.25; s.add(tc); ticks.push(tc.userData.flame.userData.tick); }
  // lumières : lune froide, torches chaudes
  const key = new THREE.DirectionalLight(0xdde4ea, 2.4); key.position.set(-6, 10, 6); key.target.position.set(0, 0, -4); key.castShadow = true;
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -6, far: 40 }); key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0005;
  s.add(key, key.target, new THREE.HemisphereLight(0x8a8a8a, 0x111111, 0.55));
  const gl = new THREE.PointLight(0xffd090, 18, 9, 1.6); gl.position.set(0, 2.4, wallZ + 2); s.add(gl);
  const moon = mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })); at(moon, -7, 14, -30); s.add(moon);
  return { scene: s, ticks, exp: 2.6, cam: { pos: [0.6, 2.4, 11.5], look: [0, 3.2, -8], fov: 46 }, table: [0, 0, 0] };
}

// ── la salle du trône ────────────────────────────────────────
function pillar(M, h) {
  const g = G();
  g.add(at(mesh(BOX(0.9, 0.35, 0.9), M.stone), 0, 0.17, 0));
  g.add(at(mesh(CYL(0.36, 0.4, 0.2, 20), M.stone), 0, 0.45, 0));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; g.add(at(mesh(CYL(0.09, 0.09, h - 1, 10), M.stone), Math.cos(a) * 0.25, h / 2, Math.sin(a) * 0.25)); }
  g.add(at(mesh(CYL(0.26, 0.26, h - 1, 16), M.stone), 0, h / 2, 0));
  g.add(at(mesh(CYL(0.48, 0.32, 0.4, 20), M.stone), 0, h - 0.3, 0));
  g.add(at(mesh(BOX(1.0, 0.18, 1.0), M.stone), 0, h - 0.05, 0));
  return g;
}
function rose(M, R) {
  const g = G();
  const glass = mesh(new THREE.CircleGeometry(R, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })); g.add(glass);
  const tr = M.black;
  g.add(at(mesh(new THREE.TorusGeometry(R, R * 0.06, 8, 64), M.stone), 0, 0, 0.02));
  g.add(at(mesh(new THREE.TorusGeometry(R * 0.32, R * 0.04, 8, 48), tr), 0, 0, 0.02));
  g.add(at(mesh(new THREE.TorusGeometry(R * 0.7, R * 0.025, 8, 48), tr), 0, 0, 0.02));
  for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; const sp = mesh(BOX(R * 0.035, R * 0.7, 0.04), tr); at(sp, Math.cos(a) * R * 0.66, Math.sin(a) * R * 0.66, 0.03); sp.rotation.z = a - Math.PI / 2; g.add(sp); const c = mesh(new THREE.TorusGeometry(R * 0.11, R * 0.018, 6, 24), tr); at(c, Math.cos(a + 0.22) * R * 0.85, Math.sin(a + 0.22) * R * 0.85, 0.03); g.add(c); }
  return g;
}
function throne(M) {
  const g = G();
  for (let i = 0; i < 4; i++) g.add(at(mesh(BOX(3.4 - i * 0.5, 0.18, 2.6 - i * 0.4), M.stone), 0, 0.09 + i * 0.18, -i * 0.12));
  const seat = G(); at(seat, 0, 0.72, -0.4); g.add(seat);
  seat.add(at(mesh(BOX(1.0, 0.45, 0.8), M.stone), 0, 0.22, 0));
  seat.add(at(mesh(BOX(1.1, 2.6, 0.22), M.stone), 0, 1.3, -0.4));
  for (const sd of [-1, 1]) {
    seat.add(at(mesh(BOX(0.16, 0.6, 0.8), M.stone), sd * 0.56, 0.6, 0));
    seat.add(at(mesh(CYL(0.08, 0.1, 3.3, 10), M.stone), sd * 0.56, 1.6, -0.42));
    seat.add(at(mesh(new THREE.ConeGeometry(0.12, 0.6, 8), M.stone), sd * 0.56, 3.55, -0.42));
    seat.add(at(skull(M, 0.9), sd * 0.56, 0.98, 0.32));
  }
  seat.add(at(mesh(new THREE.ConeGeometry(0.2, 0.9, 8), M.stone), 0, 3.0, -0.4));
  const arch = mesh(new THREE.ExtrudeGeometry(ogiveShape(0.8, 1.6), { depth: 0.05, bevelEnabled: false }), M.black); at(arch, 0, 0.8, -0.28); seat.add(arch);
  g.userData.seat = seat;
  return g;
}
function chateau(M, { trone = false } = {}) {
  const s = new THREE.Scene(); s.background = new THREE.Color(0x0c0c0c); s.fog = new THREE.FogExp2(0x161616, 0.05);
  const ticks = [];
  const floor = mesh(new THREE.PlaneGeometry(14, 40, 4, 4), M.stone); floor.rotation.x = -Math.PI / 2; at(floor, 0, 0, -12); s.add(floor);
  const H = 8.5;
  for (const sd of [-1, 1]) {
    const wall = mesh(BOX(0.6, 14, 40), M.stone); at(wall, sd * 6.5, 7, -12); s.add(wall);
    for (let i = 0; i < 6; i++) {
      const z = 2 - i * 4.2;
      const pl = pillar(M, H); at(pl, sd * 3.6, 0, z); s.add(pl);
      const ar = mesh(new THREE.ExtrudeGeometry((() => { const o = ogiveShape(4.2, 3.4), h = ogiveShape(3.5, 3.0); o.holes.push(new THREE.Path(h.getPoints(24))); return o; })(), { depth: 0.6, bevelEnabled: false }), M.stone);
      ar.rotation.y = Math.PI / 2; at(ar, sd * 3.6 - 0.3, H, z + 2.1); if (i < 5) s.add(ar);
      if (i % 2 === 0 && i < 5) { const ban = mesh(new THREE.PlaneGeometry(0.9, 3.4, 4, 10), M.clothDark); at(ban, sd * 6.15, 5, z - 2.1); ban.rotation.y = -sd * Math.PI / 2; s.add(ban); }
      if (i < 4) { const c = candle3d(0.35, 0.05); at(c, sd * 3.0, 0, z - 0.5); s.add(c); ticks.push(c.userData.flame.userData.tick); }
    }
  }
  const back = mesh(BOX(14, 16, 0.6), M.stone); at(back, 0, 8, -22); s.add(back);
  const rw = rose(M, 2.4); at(rw, 0, 9.5, -21.65); s.add(rw);
  for (const sd of [-1, 1]) { const lw = mesh(new THREE.ExtrudeGeometry(ogiveShape(1.2, 5), { depth: 0.05, bevelEnabled: false }), new THREE.MeshBasicMaterial({ color: 0xbdbdbd, fog: false })); at(lw, sd * 4, 2.2, -21.68); s.add(lw); for (let k = 1; k < 5; k++) s.add(at(mesh(BOX(1.2, 0.06, 0.06), M.black), sd * 4, 2.2 + k, -21.6)); s.add(at(mesh(BOX(0.06, 5, 0.06), M.black), sd * 4, 4.7, -21.6)); }
  const sh = mesh(new THREE.CylinderGeometry(2.2, 4.5, 26, 24, 1, true), shaftMat(), { cast: false, recv: false }); sh.material.opacity = 0.05; at(sh, 0, 4, -12); sh.rotation.x = -1.15; s.add(sh);
  if (trone) { const th = throne(M); at(th, 0, 0, -16); s.add(th); const tl = new THREE.SpotLight(0xffffff, 120, 16, 0.4, 0.6, 1.2); tl.position.set(1.5, 7, -11); tl.target.position.set(0, 1.5, -16.4); tl.castShadow = true; s.add(tl, tl.target); }
  const key = new THREE.SpotLight(0xffffff, 140, 40, 0.45, 0.7, 1.2); key.position.set(0, 12, -20); key.target.position.set(0, 0, -2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0003;
  s.add(key, key.target, new THREE.HemisphereLight(0x777777, 0x0a0a0a, 0.35));
  return { scene: s, ticks, exp: 2.4, cam: trone ? { pos: [0.4, 2.2, -6], look: [0, 2.0, -16], fov: 46 } : { pos: [0.5, 1.8, 4], look: [0, 3.6, -16], fov: 50 }, table: [0, 0, -3] };
}

// ── la scène du chevalier ────────────────────────────────────
function hub(M) {
  const s = new THREE.Scene(); s.background = new THREE.Color(0x000000); s.fog = new THREE.Fog(0x000000, 5, 13);
  const dark = M.stone.clone(); dark.color.set(0x3a3a38);
  const floor = mesh(new THREE.CircleGeometry(7, 64), dark); floor.rotation.x = -Math.PI / 2; s.add(floor);
  for (let i = 0; i < 3; i++) s.add(at(mesh(CYL(2.2 - i * 0.35, 2.25 - i * 0.35, 0.08, 64), dark), 0, 0.04 + i * 0.08, 0));
  const key = new THREE.SpotLight(0xffffff, 90, 14, 0.3, 0.6, 1.3); key.position.set(1.4, 6.5, 2.6); key.target.position.set(0, 1, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0002;
  const rim = new THREE.SpotLight(0xffffff, 60, 12, 0.5, 0.6, 1.2); rim.position.set(-2.5, 4.5, -3.5); rim.target.position.set(0, 1.2, 0);
  const fill = new THREE.DirectionalLight(0xffffff, 0.25); fill.position.set(-3, 2, 4);
  s.add(key, key.target, rim, rim.target, fill, new THREE.HemisphereLight(0x666666, 0x000000, 0.15));
  // les honneurs (montrés selon les déblocages)
  const vit = G();
  const glass = mesh(new THREE.ExtrudeGeometry(ogiveShape(1.6, 4.4), { depth: 0.05, bevelEnabled: false }), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })); vit.add(glass);
  for (let k = 1; k < 6; k++) vit.add(at(mesh(BOX(1.6, 0.05, 0.08), M.black), 0, k * 0.65, 0.05));
  vit.add(at(mesh(BOX(0.05, 4.2, 0.08), M.black), 0, 2.1, 0.05));
  for (const sd of [-0.4, 0.4]) vit.add(at(mesh(BOX(0.04, 3.6, 0.08), M.black), sd, 1.8, 0.05));
  const ring = mesh(new THREE.TorusGeometry(0.35, 0.04, 8, 32), M.black); at(ring, 0, 3.45, 0.05); vit.add(ring);
  const frame = mesh(new THREE.ExtrudeGeometry((() => { const o = ogiveShape(2.2, 4.8), h = ogiveShape(1.62, 4.42); o.holes.push(new THREE.Path(h.getPoints(30))); return o; })(), { depth: 0.3, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04 }), M.stone); at(frame, 0, -0.1, -0.1); vit.add(frame);
  const shaft = mesh(new THREE.CylinderGeometry(0.8, 2.2, 9, 24, 1, true), shaftMat(), { cast: false, recv: false }); shaft.material.opacity = 0.06; at(shaft, 0, 0.5, 2.8); shaft.rotation.x = -1.0; vit.add(shaft);
  at(vit, 0, 0.6, -4.2);
  const vl = new THREE.SpotLight(0xffffff, 40, 10, 0.5, 0.8, 1); vl.position.set(0, 3.5, -4); vl.target.position.set(0, 0, 0); vit.add(vl, vl.target);
  const ete = etendard3d(M); at(ete, -1.35, 0, -0.5);
  const tro = trophees3d(M); at(tro, 0, 0, 0.55);
  const thr = throne(M); at(thr, 0, 0, -1.25); thr.scale.setScalar(0.9);
  s.add(vit, ete, tro, thr);
  return { scene: s, ticks: [(t) => ete.userData.tick(t)], cam: { pos: [0, 1.5, 5.4], look: [0, 1.2, 0], fov: 36 }, honneurs: { vitrail: vit, etendard: ete, trophees: tro, throne: thr } };
}

const BUILD = { foret, pont, chateau, trone: (M) => chateau(M, { trone: true }), hub };
const placeCache = {};
export function place(name) {
  if (!placeCache[name]) placeCache[name] = BUILD[name](mats());
  return placeCache[name];
}

// ── une « vue » : décor + caméra animée, rendue dans la toile 2D ──
export class View {
  constructor(name) {
    this.P = place(name); this.scene = this.P.scene;
    const c = this.P.cam;
    this.cam = new THREE.PerspectiveCamera(c.fov, 1, 0.05, 120);
    this.base = { pos: V(...c.pos), look: V(...c.look) };
    this.drift = 1; this.extra = [];
  }
  setCam(pos, look, fov) { this.base = { pos: V(...pos), look: V(...look) }; if (fov) this.cam.fov = fov; }
  add(o) { this.scene.add(o); this.extra.push(o); return o; }
  clear() { for (const o of this.extra) o.removeFromParent(); this.extra = []; }
  draw(ctx, W, H, t, { portrait = W < H, fovBoost = 1.0 } = {}) {
    for (const f of this.P.ticks) f(t);
    const d = this.drift;
    this.cam.position.copy(this.base.pos).add(V(Math.sin(t * 0.13) * 0.25 * d, Math.sin(t * 0.21) * 0.08 * d, 0));
    const fov0 = this.fov0 ?? (this.fov0 = this.cam.fov);
    this.cam.fov = fov0 * fovBoost * (portrait ? Math.min(1.7, 1 + (H / W - 1) * 0.6) : 1);
    this.cam.lookAt(this.base.look);
    getRenderer().toneMappingExposure = this.exposure ?? this.P.exp ?? 1.1;
    ctx.drawImage(render(this.scene, this.cam, W, H), 0, 0);
  }
}

// ── portraits (cartes, aperçus de la route, mort) ────────────
let pscene = null;
const pcache = new Map();
export function portrait(kit, w, h, { key = JSON.stringify(kit), zoom = 1 } = {}) {
  const k = key + w + 'x' + h + zoom;
  if (pcache.has(k)) return pcache.get(k);
  if (!pscene) {
    pscene = new THREE.Scene(); pscene.background = new THREE.Color(0x000000);
    const key2 = new THREE.SpotLight(0xffffff, 30, 8, 0.6, 0.6, 1.2); key2.position.set(1.2, 2.6, 2.2); key2.target.position.set(0, 1.4, 0);
    const rim = new THREE.DirectionalLight(0xffffff, 2.2); rim.position.set(-2, 2, -2);
    pscene.add(key2, key2.target, rim, new THREE.HemisphereLight(0x888888, 0x000000, 0.25));
  }
  const fig = buildFigure(kit, { bust: true }); fig.setPose('assis'); fig.root.position.y = 0.4; pscene.add(fig.root);
  fig.update(1.5);
  const cam = new THREE.PerspectiveCamera(30 / zoom, w / h, 0.05, 20); cam.position.set(0.15, 1.72, 1.9); cam.lookAt(0, 1.62, 0);
  const out = still(pscene, cam, w, h);
  fig.root.removeFromParent();
  pcache.set(k, out);
  return out;
}
export { buildFigure };
