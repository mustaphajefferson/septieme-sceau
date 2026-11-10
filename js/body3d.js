// ─────────────────────────────────────────────────────────────
//  Figures 3D : squelette articulé + pièces d'armure détaillées.
//  Même système pour le chevalier (et ses 12 éléments) et pour
//  les adversaires (robes, capuches, crânes, heaumes…).
//  Le personnage regarde vers +Z. Unité : mètre.
// ─────────────────────────────────────────────────────────────
import { THREE, mats, mesh, at, rot, lathe, tube, taper, V, tatterAlpha, flameMesh } from './r3d.js';
import { TAU, rng, canvas } from './paint.js';

const G = () => new THREE.Group();
const SPH = (r, w = 24, h = 16, ...a) => new THREE.SphereGeometry(r, w, h, ...a);
const CYL = (a, b, h, s = 24, open = false) => new THREE.CylinderGeometry(a, b, h, s, 1, open);
const BOX = (x, y, z) => new THREE.BoxGeometry(x, y, z, 2, 2, 2);
const CONE = (r, h, s = 12) => new THREE.ConeGeometry(r, h, s);

// ── pièces génériques ────────────────────────────────────────
function plateLimb(len, r0, r1, mat, { lames = 0, ridge = true } = {}) {
  const g = G();
  const pts = [[0, 0], [r0 * 0.92, -0.004], [r0, -0.02]];
  for (let i = 1; i <= 8; i++) { const k = i / 8; pts.push([r0 + (r1 - r0) * k + Math.sin(k * Math.PI) * r0 * 0.08, -len * k]); }
  pts.push([r1 * 0.9, -len - 0.004], [0, -len - 0.004]);
  const m = mesh(lathe(pts, 28), mat); m.scale.z = 0.92; g.add(m);
  if (ridge) { const rg = mesh(CYL(0.004, 0.004, len * 0.9, 6), mat); at(rg, 0, -len / 2, r0 * 0.93); g.add(rg); }
  for (let i = 1; i <= lames; i++) { const ring = mesh(new THREE.TorusGeometry(r0 + (r1 - r0) * (i / (lames + 1)) + 0.003, 0.004, 6, 28), mat); ring.rotation.x = Math.PI / 2; ring.position.y = -len * i / (lames + 1); ring.scale.y = 0.92; g.add(ring); }
  return g;
}
function cop(r, mat, wing = 1) { // genouillère / cubitière avec aileron
  const g = G();
  g.add(mesh(SPH(r, 24, 16, 0, TAU, 0, Math.PI * 0.6), mat));
  const w = mesh(SPH(r * 1.35, 20, 12, -0.9, 1.8, 0.5, 1.4), mat); w.scale.set(1, 1, 0.35 * wing); w.position.x = r * 0.4; g.add(w);
  for (let i = 0; i < 3; i++) { const rv = mesh(SPH(r * 0.1, 8, 6), mat); at(rv, Math.cos(i * 2.1) * r * 0.7, 0, Math.sin(i * 2.1) * r * 0.7); g.add(rv); }
  return g;
}
function rivetRing(g, r, y, n, mat, rr = 0.006, zs = 1) {
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, rv = mesh(SPH(rr, 8, 6), mat); at(rv, Math.cos(a) * r, y, Math.sin(a) * r * zs); g.add(rv); }
}

const _mm = new Map();
function mailM(M, u, v) { const k = u + 'x' + v; if (!_mm.has(k)) { const m = M.mail.clone(); const t = M.mail.bumpMap.clone(), c = M.mail.map.clone(); t.repeat.set(u, v); c.repeat.set(u, v); t.needsUpdate = c.needsUpdate = true; m.map = c; m.bumpMap = t; _mm.set(k, m); } return _mm.get(k); }
// ── têtes ────────────────────────────────────────────────────
function helmBasic(M) {
  const g = G();
  const prof = [[0, 0.26], [0.06, 0.255], [0.1, 0.235], [0.122, 0.2], [0.13, 0.15], [0.13, 0.02], [0.135, -0.02], [0.14, -0.05]];
  const h = mesh(lathe(prof, 36), M.steel); h.scale.z = 1.05; g.add(h);
  // fente de vision et ventail
  const slit = mesh(BOX(0.24, 0.016, 0.04), M.black); at(slit, 0, 0.155, 0.12); g.add(slit);
  const nasal = mesh(BOX(0.016, 0.1, 0.03), M.black); at(nasal, 0, 0.11, 0.13); g.add(nasal);
  const brow = mesh(new THREE.TorusGeometry(0.133, 0.009, 8, 36, Math.PI), M.steel); brow.rotation.x = Math.PI / 2; brow.rotation.z = Math.PI; at(brow, 0, 0.175, 0); g.add(brow);
  const ridge = mesh(new THREE.TorusGeometry(0.13, 0.007, 8, 36, Math.PI * 0.9), M.steel); ridge.rotation.y = Math.PI / 2; at(ridge, 0, 0.13, 0); g.add(ridge);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const b = mesh(CYL(0.005, 0.005, 0.03, 8), M.black); b.rotation.x = Math.PI / 2; at(b, 0.035 + j * 0.022, 0.09 - i * 0.022, 0.125); g.add(b); }
  rivetRing(g, 0.138, -0.03, 14, M.steel, 0.007, 1.05);
  rivetRing(g, 0.132, 0.2, 10, M.steel, 0.006, 1.05);
  return g;
}
function helmSpikes(M) {
  const g = G();
  const h = mesh(CYL(0.13, 0.145, 0.3, 8), M.steelDark); h.position.y = 0.12; g.add(h);
  const top = mesh(CONE(0.13, 0.1, 8), M.steelDark); top.position.y = 0.32; g.add(top);
  g.add(at(mesh(BOX(0.22, 0.02, 0.06), M.black), 0, 0.16, 0.125));
  g.add(at(mesh(BOX(0.012, 0.25, 0.05), M.steel), 0, 0.12, 0.14));
  const r = rng(31);
  for (let i = 0; i < 26; i++) {
    const a = r() * TAU, y = 0.05 + r() * 0.3, up = 0.2 + r() * 0.9;
    const dir = V(Math.cos(a), up, Math.sin(a)).normalize();
    const L = 0.12 + r() * 0.22 * (y > 0.2 ? 1.3 : 0.7);
    const s = mesh(CONE(0.012 + r() * 0.01, L, 8), r() < 0.5 ? M.steel : M.steelDark);
    s.position.set(Math.cos(a) * 0.13, y, Math.sin(a) * 0.13).addScaledVector(dir, L / 2);
    s.quaternion.setFromUnitVectors(V(0, 1, 0), dir); g.add(s);
  }
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; const rv = mesh(SPH(0.008, 8, 6), M.steel); at(rv, Math.cos(a) * 0.145, -0.02, Math.sin(a) * 0.145); g.add(rv); }
  return g;
}
function antlers(M, s = 1) {
  const g = G();
  for (const sd of [-1, 1]) {
    const b = (pts, r0, r1) => g.add(mesh(taper(pts.map(([x, y, z]) => [x * sd * s, y * s, z * s]), r0 * s, r1 * s, 20), M.bone));
    b([[0.06, 0, 0], [0.14, 0.12, -0.02], [0.2, 0.3, -0.04], [0.24, 0.5, 0]], 0.022, 0.006);
    b([[0.13, 0.1, -0.02], [0.24, 0.16, 0.04], [0.32, 0.22, 0.06]], 0.013, 0.004);
    b([[0.18, 0.25, -0.03], [0.12, 0.38, 0.02], [0.11, 0.48, 0.04]], 0.011, 0.004);
    b([[0.21, 0.36, -0.03], [0.32, 0.44, -0.02], [0.38, 0.56, 0]], 0.01, 0.003);
    b([[0.1, 0.05, 0], [0.2, 0.06, 0.06], [0.26, 0.12, 0.1]], 0.01, 0.004);
  }
  return g;
}
function crown(M, broken = true) {
  const g = G();
  g.add(mesh(CYL(0.14, 0.135, 0.05, 32, true), M.brass));
  const pts = 8;
  for (let i = 0; i < pts; i++) {
    if (broken && i === 3) continue;
    const a = (i / pts) * TAU, h = i % 2 ? 0.08 : 0.13;
    const c = mesh(CONE(0.03, h, 4), M.brass); at(c, Math.cos(a) * 0.135, 0.025 + h / 2, Math.sin(a) * 0.135); c.rotation.y = -a; g.add(c);
    const j = mesh(SPH(0.012, 10, 8), M.black); at(j, Math.cos(a) * 0.142, 0.005, Math.sin(a) * 0.142); g.add(j);
  }
  if (broken) { const c = mesh(CONE(0.03, 0.05, 4), M.brass); const a = (3 / pts) * TAU; at(c, Math.cos(a) * 0.135, 0.05, Math.sin(a) * 0.135); c.rotation.z = 0.5; g.add(c); }
  return g;
}
export function skull(M, s = 1, { jaw = true } = {}) {
  const g = G();
  const c = mesh(SPH(0.1, 28, 20), M.bone); c.scale.set(0.9, 1, 1.05); c.position.y = 0.04; g.add(c);
  const face = mesh(SPH(0.075, 24, 16), M.bone); face.scale.set(0.95, 0.9, 0.7); at(face, 0, -0.03, 0.05); g.add(face);
  for (const sd of [-1, 1]) {
    const e = mesh(SPH(0.03, 16, 12), M.black); e.scale.set(1, 1.1, 0.6); at(e, sd * 0.034, 0, 0.1); g.add(e);
    const cb = mesh(SPH(0.025, 12, 10), M.bone); cb.scale.set(1.2, 0.7, 1); at(cb, sd * 0.06, -0.035, 0.07); g.add(cb);
  }
  const nose = mesh(CONE(0.014, 0.03, 3), M.black); nose.rotation.x = Math.PI; at(nose, 0, -0.035, 0.11); g.add(nose);
  if (jaw) {
    const j = mesh(SPH(0.06, 20, 12, 0, TAU, Math.PI * 0.45, Math.PI * 0.55), M.bone); j.scale.set(1, 0.7, 1.05); at(j, 0, -0.045, 0.035); g.add(j);
    for (let i = -3; i <= 3; i++) { const t = mesh(BOX(0.009, 0.016, 0.008), M.bone); at(t, i * 0.011, -0.07, 0.092 - Math.abs(i) * 0.004); g.add(t); }
  }
  g.scale.setScalar(s);
  return g;
}
function hood(M, { mat, depth = 1 } = {}) {
  const g = G();
  const prof = [[0.0, 0.32], [0.08, 0.31], [0.15, 0.25], [0.19, 0.12], [0.2, -0.05], [0.23, -0.2], [0.3, -0.3]];
  const h = mesh(lathe(prof, 32, Math.PI * 0.62, TAU * 0.86), mat || M.clothDark); h.rotation.y = 0; g.add(h);
  const inner = mesh(SPH(0.16 * depth, 20, 14), M.black); inner.scale.set(0.9, 1.15, 0.7); at(inner, 0, 0.06, 0.06); g.add(inner);
  return g;
}
function head3d(kit, M) {
  const g = G();
  const k = kit.head || 'helm';
  const aventail = () => { const a = mesh(CYL(0.125, 0.19, 0.17, 32, true), mailM(M, 14, 3)); a.position.y = -0.09; g.add(a); g.add(at(mesh(CYL(0.12, 0.18, 0.16, 24, true), M.mailUnder), 0, -0.09, 0)); };
  if (k === 'helm') { aventail(); g.add(kit.helm === 'piques' ? helmSpikes(M) : helmBasic(M)); if (kit.crest === 'cerf') g.add(at(antlers(M, 0.9), 0, 0.24, 0)); if (kit.crown) g.add(at(crown(M, true), 0, 0.26, 0)); }
  else if (k === 'kettle') {
    aventail();
    g.add(at(mesh(SPH(0.11, 20, 14), M.black), 0, 0.08, 0.02));
    for (const sd of [-1, 1]) g.add(at(mesh(SPH(0.008, 8, 6), M.glow), sd * 0.03, 0.09, 0.11));
    const brim = mesh(lathe([[0.12, 0.16], [0.21, 0.13], [0.26, 0.09], [0.255, 0.08], [0.2, 0.115], [0.12, 0.15]], 36), M.steel); g.add(brim);
    g.add(mesh(lathe([[0, 0.32], [0.08, 0.3], [0.12, 0.24], [0.13, 0.16]], 32), M.steel));
  } else if (k === 'sack') {
    const s = mesh(SPH(0.14, 24, 18), M.cloth); s.scale.set(0.95, 1.15, 0.95); s.position.y = 0.1; g.add(s);
    for (const [x, y] of [[-0.045, 0.13], [0.05, 0.125]]) g.add(at(mesh(SPH(0.022, 10, 8), M.black), x, y, 0.125));
    for (let i = -3; i <= 3; i++) g.add(at(mesh(BOX(0.004, 0.03, 0.01), M.black), i * 0.016, 0.04, 0.13));
    g.add(at(rot(mesh(new THREE.TorusGeometry(0.11, 0.018, 10, 28), M.leather), Math.PI / 2, 0, 0), 0, -0.03, 0));
  } else if (k === 'hag') { g.add(hood(M)); g.add(at(skull(M, 0.95), 0, 0.06, 0.03)); for (let i = 0; i < 18; i++) { const x = -0.09 + i * 0.011; g.add(mesh(tube([[x, 0.15, 0.06], [x * 1.4, 0, 0.1], [x * 1.8, -0.2, 0.08]], 0.003, 10, 4), M.bone)); } }
  else if (k === 'deer') {
    g.add(hood(M));
    const sk = mesh(SPH(0.1, 24, 16), M.bone); sk.scale.set(0.85, 1.6, 0.9); at(sk, 0, 0.06, 0.05); sk.rotation.x = 0.2; g.add(sk);
    for (const sd of [-1, 1]) g.add(at(mesh(SPH(0.026, 12, 10), M.black), sd * 0.05, 0.13, 0.11));
    g.add(at(antlers(M, 1.0), 0, 0.2, 0));
  } else if (k === 'wolf') {
    const pelt = mesh(lathe([[0, 0.3], [0.12, 0.28], [0.2, 0.18], [0.23, 0], [0.3, -0.2], [0.4, -0.32]], 32, Math.PI * 0.6, TAU * 0.8), M.fur); g.add(pelt);
    const snout = mesh(CONE(0.07, 0.22, 16), M.fur); snout.rotation.x = Math.PI / 2 + 0.25; at(snout, 0, 0.24, 0.17); g.add(snout);
    const top = mesh(SPH(0.13, 20, 14), M.fur); top.scale.set(1, 0.7, 1.1); at(top, 0, 0.25, 0.02); g.add(top);
    for (const sd of [-1, 1]) { const e = mesh(CONE(0.04, 0.12, 6), M.fur); at(e, sd * 0.08, 0.36, -0.02); e.rotation.z = -sd * 0.3; g.add(e); g.add(at(mesh(SPH(0.012, 8, 6), M.glow), sd * 0.05, 0.27, 0.11)); }
    for (let i = -3; i <= 3; i++) { const t = mesh(CONE(0.006, 0.03, 4), M.bone); t.rotation.x = Math.PI; at(t, i * 0.012, 0.18, 0.22); g.add(t); }
    g.add(at(mesh(SPH(0.11, 20, 14), M.black), 0, 0.06, 0.05));
    for (const sd of [-1, 1]) g.add(at(mesh(SPH(0.01, 8, 6), M.glow), sd * 0.03, 0.08, 0.14));
  } else if (k === 'mitre') {
    g.add(at(skull(M, 0.85, { jaw: false }), 0, 0.04, 0.03));
    const sh = new THREE.Shape(); sh.moveTo(-0.12, 0); sh.lineTo(-0.11, 0.2); sh.quadraticCurveTo(-0.06, 0.38, 0, 0.45); sh.quadraticCurveTo(0.06, 0.38, 0.11, 0.2); sh.lineTo(0.12, 0); sh.lineTo(-0.12, 0);
    const mt = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 }), M.cloth); at(mt, 0, 0.1, -0.09); g.add(mt);
    g.add(at(mesh(BOX(0.02, 0.26, 0.012), M.brass), 0, 0.3, 0.1)); g.add(at(mesh(BOX(0.14, 0.02, 0.012), M.brass), 0, 0.34, 0.1));
    g.add(at(mesh(CYL(0.125, 0.125, 0.035, 32, true), M.brass), 0, 0.1, 0));
  } else if (k === 'exec') {
    const h = mesh(lathe([[0, 0.5], [0.04, 0.42], [0.1, 0.25], [0.14, 0.08], [0.16, -0.08], [0.24, -0.22]], 28), M.clothDark); g.add(h);
    for (const sd of [-1, 1]) { g.add(at(mesh(SPH(0.024, 12, 8), M.black), sd * 0.05, 0.1, 0.125)); g.add(at(mesh(SPH(0.007, 8, 6), M.glow), sd * 0.05, 0.1, 0.14)); }
  } else if (k === 'veil') {
    g.add(at(skull(M, 0.85), 0, 0.06, 0.02));
    const v = mesh(lathe([[0.0, 0.25], [0.12, 0.22], [0.16, 0.08], [0.2, -0.15], [0.3, -0.45]], 32), M.cloth);
    v.material = M.cloth.clone(); v.material.transparent = true; v.material.opacity = 0.55; g.add(v);
    g.add(at(crown(M, false), 0, 0.2, 0));
  } else if (k === 'king') {
    g.add(at(skull(M, 1.1), 0, 0.06, 0.02));
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 1.4 - Math.PI * 1.2; g.add(mesh(tube([[Math.cos(a) * 0.09, 0.14, Math.sin(a) * 0.09], [Math.cos(a) * 0.13, -0.05, Math.sin(a) * 0.12], [Math.cos(a) * 0.16, -0.3, Math.sin(a) * 0.14]], 0.004, 10, 4), M.bone)); }
    for (let i = 0; i < 10; i++) g.add(mesh(tube([[-0.04 + i * 0.009, -0.06, 0.1], [-0.05 + i * 0.011, -0.16, 0.1], [-0.06 + i * 0.013, -0.3, 0.08]], 0.003, 8, 4), M.bone));
    g.add(at(crown(M, true), 0, 0.2, 0));
  }
  return g;
}

// ── tronc ────────────────────────────────────────────────────
function cuirass(M, kit) {
  const g = G();
  const prof = [[0.12, 0.34], [0.2, 0.33], [0.235, 0.28], [0.25, 0.18], [0.24, 0.06], [0.205, -0.04], [0.18, -0.1], [0.185, -0.12]];
  const c = mesh(lathe(prof, 40), M.steel); c.scale.z = 0.78; g.add(c);
  // arête, plackart, rivets
  const ridge = mesh(taper([[0, 0.33, 0.17], [0, 0.18, 0.2], [0, 0.0, 0.17], [0, -0.1, 0.145]], 0.008, 0.006, 20), M.steel); g.add(ridge);
  const pk = mesh(lathe([[0.19, -0.12], [0.2, 0.0], [0.21, 0.06]], 40, -Math.PI * 0.35, Math.PI * 0.7), M.steelDark); pk.scale.z = 0.82; pk.rotation.y = Math.PI / 2 - Math.PI * 0; g.add(pk);
  rivetRing(g, 0.205, -0.1, 18, M.steel, 0.007, 0.8);
  // gorgerin
  const gor = mesh(lathe([[0.075, 0.42], [0.09, 0.4], [0.14, 0.36], [0.17, 0.33], [0.16, 0.32]], 32), M.steel); gor.scale.z = 0.85; g.add(gor);
  // tassettes
  for (let i = 0; i < 3; i++) { const f = mesh(lathe([[0.19 + i * 0.012, -0.12 - i * 0.055], [0.205 + i * 0.014, -0.18 - i * 0.055]], 40), i % 2 ? M.steelDark : M.steel); f.scale.z = 0.82; g.add(f); }
  if (kit.breast === 'soleil') {
    const sh = new THREE.Shape();
    for (let i = 0; i < 32; i++) { const a = (i / 32) * TAU, r = i % 2 ? 0.05 : (i % 4 ? 0.075 : 0.095); i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const sun = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.01, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 }), M.brass);
    at(sun, 0, 0.17, 0.188); g.add(sun);
    const disc = mesh(SPH(0.045, 24, 16, 0, TAU, 0, Math.PI / 2), M.brass); disc.rotation.x = Math.PI / 2; at(disc, 0, 0.17, 0.2); g.add(disc);
    for (const sd of [-1, 1]) g.add(at(mesh(SPH(0.006, 8, 6), M.black), sd * 0.015, 0.18, 0.242));
  }
  return g;
}
function mailSkirt(M) {
  const g = G();
  const s = mesh(CYL(0.18, 0.225, 0.3, 40, true), mailM(M, 22, 5)); s.scale.z = 0.85; s.position.y = -0.17; g.add(s);
  const u = mesh(CYL(0.175, 0.215, 0.29, 32, true), M.mailUnder); u.scale.z = 0.84; u.position.y = -0.17; g.add(u);
  return g;
}
function robeBody(M, kit) {
  const g = G();
  const r = rng(5), prof = [[0.08, 0.42], [0.16, 0.38], [0.24, 0.3], [0.25, 0.1], [0.26, -0.2], [0.3, -0.5], [0.36, -0.85], [0.4, -1.0]];
  const geo = lathe(prof, 48);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(z, x); const f = 1 + 0.06 * Math.sin(a * 9 + r()) * Math.min(1, (0.3 - y) * 1.2); pos.setXYZ(i, x * f, y, z * f * 0.85); }
  geo.computeVertexNormals();
  const mat = kit.body === 'gambeson' ? M.cloth : kit.body === 'bare' ? M.skin : M.clothDark;
  g.add(mesh(geo, mat));
  if (kit.body === 'gambeson') for (let i = 0; i < 8; i++) { const ring = mesh(new THREE.TorusGeometry(0.255 + i * 0.006, 0.004, 6, 40), M.leather); ring.rotation.x = Math.PI / 2; ring.scale.y = 0.85; ring.position.y = 0.25 - i * 0.07; g.add(ring); }
  if (kit.body === 'tabard') {
    const cv = canvas(128, 256), x = cv.getContext('2d'); x.fillStyle = '#ddd'; x.fillRect(0, 0, 128, 256); x.fillStyle = '#111'; x.beginPath(); x.moveTo(0, 80); x.lineTo(64, 30); x.lineTo(128, 80); x.lineTo(128, 110); x.lineTo(64, 60); x.lineTo(0, 110); x.fill(); x.font = '60px Jacquard'; x.textAlign = 'center'; x.fillText('VII', 64, 200);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const tb = mesh(new THREE.PlaneGeometry(0.34, 0.9, 4, 12), new THREE.MeshStandardMaterial({ map: t, roughness: 1, side: THREE.DoubleSide })); at(tb, 0, -0.1, 0.215); g.add(tb);
  }
  if (kit.body === 'bare') { for (const [x, y] of [[-0.08, 0.22], [0.08, 0.22], [-0.05, 0.05], [0.05, 0.05], [-0.05, -0.05], [0.05, -0.05]]) { const m = mesh(SPH(0.07, 16, 12), M.skin); m.scale.set(1, 0.7, 0.4); at(m, x, y, 0.17); g.add(m); } }
  return g;
}

// ── épaules, bras, mains ─────────────────────────────────────
function pauldron(M, kit, side) {
  const g = G();
  if (kit.pauldrons === 'loup') {
    const geo = SPH(0.17, 24, 18); const pos = geo.attributes.position, r = rng(side > 0 ? 3 : 4);
    for (let i = 0; i < pos.count; i++) { const v = V(pos.getX(i), pos.getY(i), pos.getZ(i)); v.multiplyScalar(1 + (r() - 0.5) * 0.18); pos.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals();
    const f = mesh(geo, M.fur); f.scale.set(1.1, 0.75, 1); f.position.set(side * 0.03, 0.02, 0); g.add(f);
    if (side < 0) { const sk = mesh(SPH(0.07, 16, 12), M.bone); sk.scale.set(0.8, 0.8, 1.5); at(sk, side * 0.06, 0.12, 0.08); g.add(sk); const sn = mesh(CONE(0.04, 0.12, 10), M.bone); sn.rotation.x = Math.PI / 2; at(sn, side * 0.06, 0.1, 0.2); g.add(sn); for (const s2 of [-1, 1]) g.add(at(mesh(SPH(0.012, 8, 6), M.black), side * 0.06 + s2 * 0.022, 0.135, 0.14)); }
    return g;
  }
  for (let i = 0; i < 4; i++) {
    const p = mesh(SPH(0.13 - i * 0.008, 28, 14, 0, TAU, 0, Math.PI * (i ? 0.32 : 0.48)), i % 2 ? M.steelDark : M.steel);
    p.scale.set(1.05, 0.8, 0.95); p.position.set(side * 0.015, -i * 0.045, 0); p.rotation.z = side * -0.35; g.add(p);
  }
  rivetRing(g, 0.1, 0.03, 8, M.steel, 0.007);
  return g;
}
function hand3d(M, kit, { bony = false } = {}) {
  const g = G();
  if (bony) {
    g.add(at(mesh(SPH(0.035, 12, 10), M.bone), 0, -0.03, 0));
    for (let i = 0; i < 4; i++) g.add(mesh(taper([[-0.025 + i * 0.017, -0.04, 0.01], [-0.03 + i * 0.019, -0.1, 0.03], [-0.03 + i * 0.02, -0.15, 0.06]], 0.007, 0.004, 10), M.bone));
    return g;
  }
  const cuff = mesh(CYL(0.05, 0.065, 0.07, 20, true), M.steel); cuff.position.y = 0.01; g.add(cuff);
  const back = mesh(BOX(0.085, 0.09, 0.04), M.steel); back.position.set(0, -0.06, 0.005); g.add(back);
  for (let i = 0; i < 4; i++) {
    const fg = G(); at(fg, -0.03 + i * 0.02, -0.105, 0.005); g.add(fg);
    let p = fg;
    for (let j = 0; j < 3; j++) { const seg = mesh(BOX(0.017, 0.028, 0.02), j % 2 ? M.steelDark : M.steel); seg.position.y = -0.014; p.add(seg); const nx = G(); nx.position.y = -0.028; nx.rotation.x = 0.55; p.add(nx); p = nx; }
    if (kit.gauntlets === 'epines') { const sp = mesh(CONE(0.007, 0.04, 6), M.steel); at(sp, -0.03 + i * 0.02, -0.09, 0.04); sp.rotation.x = Math.PI / 2; g.add(sp); }
  }
  const th = mesh(BOX(0.02, 0.06, 0.02), M.steel); at(th, -0.055, -0.07, 0.02); th.rotation.z = 0.5; g.add(th);
  if (kit.gauntlets === 'epines') {
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; const sp = mesh(CONE(0.008, 0.05, 6), M.steelDark); at(sp, Math.cos(a) * 0.06, 0.04, Math.sin(a) * 0.06); sp.lookAt(V(Math.cos(a), 0.6, Math.sin(a)).multiplyScalar(2)); sp.rotateX(Math.PI / 2); g.add(sp); }
    const vine = mesh(tube(Array.from({ length: 14 }, (_, i) => [Math.cos(i * 1.3) * 0.06, 0.2 - i * 0.02, Math.sin(i * 1.3) * 0.06]), 0.006, 60, 6), M.leather); g.add(vine);
  }
  return g;
}

// ── armes ────────────────────────────────────────────────────
export function sword3d(M, big = false) {
  const g = G();
  const L = big ? 1.0 : 0.88, w = big ? 0.075 : 0.045;
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2, 0); sh.lineTo(-w / 2 * 0.92, L * 0.8);
  if (big) { sh.lineTo(-w / 2, L); sh.lineTo(w / 2, L); } else sh.lineTo(0, L);
  sh.lineTo(w / 2 * 0.92, L * 0.8); sh.lineTo(w / 2, 0); sh.lineTo(-w / 2, 0);
  if (big) for (let i = 0; i < 3; i++) { const hole = new THREE.Path(); hole.absarc(0, L - 0.06 - i * 0.05, 0.008, 0, TAU, true); sh.holes.push(hole); }
  const blade = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.002, bevelEnabled: true, bevelThickness: 0.006, bevelSize: w * 0.35, bevelSegments: 2, curveSegments: 6 }), M.steel);
  blade.position.z = -0.001; g.add(blade);
  const fuller = mesh(BOX(w * 0.18, L * 0.6, 0.011), M.steelDark); fuller.position.y = L * 0.35; g.add(fuller);
  const gw = big ? 0.34 : 0.22;
  const guard = mesh(BOX(gw, 0.025, 0.03), M.steel); guard.position.y = -0.012; g.add(guard);
  for (const sd of [-1, 1]) { const q = mesh(SPH(0.02, 12, 10), M.steel); at(q, sd * gw / 2, big ? 0.02 : -0.012, 0); g.add(q); if (big) { const qc = mesh(taper([[0, -0.012, 0], [sd * gw * 0.3, 0.0, 0], [sd * gw / 2, 0.02, 0]], 0.013, 0.008, 10), M.steel); g.add(qc); } }
  const grip = mesh(CYL(0.016, 0.018, big ? 0.28 : 0.16, 12), M.leather); grip.position.y = big ? -0.165 : -0.105; g.add(grip);
  for (let i = 0; i < 8; i++) { const r = mesh(new THREE.TorusGeometry(0.018, 0.003, 6, 12), M.leather); r.rotation.x = Math.PI / 2; r.position.y = -0.03 - i * (big ? 0.034 : 0.019); g.add(r); }
  const pom = mesh(SPH(big ? 0.038 : 0.03, 16, 12), M.steel); pom.scale.z = 0.6; pom.position.y = big ? -0.32 : -0.2; g.add(pom);
  return g;
}
export function shield3d(M) {
  const g = G();
  const sh = new THREE.Shape(); sh.moveTo(-0.24, 0.27); sh.lineTo(0.24, 0.27); sh.quadraticCurveTo(0.26, -0.08, 0, -0.33); sh.quadraticCurveTo(-0.26, -0.08, -0.24, 0.27);
  const face = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3 }), M.wood); g.add(face);
  const rim = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.02, bevelSegments: 2 }), M.steelDark); rim.scale.set(1.04, 1.04, 1); rim.position.z = -0.008; g.add(rim);
  face.position.z = 0.002;
  g.add(at(mesh(BOX(0.05, 0.56, 0.02), M.steel), 0, -0.02, 0.05)); g.add(at(mesh(BOX(0.46, 0.05, 0.02), M.steel), 0, 0.08, 0.05));
  const r = rng(77);
  for (let i = 0; i < 40; i++) { const x = (r() - 0.5) * 0.42, y = (r() - 0.6) * 0.55; if (!sh.getPoints(20).length) continue; if (y < -0.08 && Math.abs(x) > 0.24 * (1 - (-0.08 - y) / 0.25)) continue; g.add(at(mesh(SPH(0.009, 8, 6), M.steel), x, y, 0.048)); }
  g.add(at(mesh(SPH(0.05, 20, 14, 0, TAU, 0, Math.PI / 2), M.steel), 0, 0.08, 0.05)).children;
  g.children[g.children.length - 1].rotation.x = Math.PI / 2;
  return g;
}

// ── cape animée ──────────────────────────────────────────────
function cape3d(M, len = 1.35) {
  const geo = new THREE.PlaneGeometry(0.62, len, 14, 28);
  const base = Float32Array.from(geo.attributes.position.array);
  const at_ = new THREE.CanvasTexture(tatterAlpha(13, 12));
  const mat = M.clothDark.clone(); mat.alphaMap = at_; mat.alphaTest = 0.5; mat.side = THREE.DoubleSide;
  const m = mesh(geo, mat);
  m.userData.tick = (t) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1], k = (len / 2 - y) / len;
      const flare = 1 + k * 0.7;
      const ang = x / 0.31 * 1.2;
      p.setXYZ(i, Math.sin(ang) * 0.31 * flare, y, -Math.cos(ang) * 0.12 * flare - k * 0.12 + Math.sin(t * 1.4 + k * 4 + x * 3) * 0.03 * k + Math.sin(x * 22) * 0.012 * k);
    }
    p.needsUpdate = true; geo.computeVertexNormals();
  };
  m.userData.tick(0);
  m.position.y = -len / 2 + 0.05;
  return m;
}

// ── la figure complète ───────────────────────────────────────
// Les poses placent mains et pieds par cible (cinématique inverse).
// Coordonnées dans le repère du personnage (il regarde vers +Z).
export const POSES = {
  garde: { pelvis: 0.98, lean: 0.02, hands: { R: [0.03, 1.15, 0.31], L: [-0.03, 1.06, 0.31] }, feet: { R: [0.13, 0.04, 0.03], L: [-0.13, 0.04, -0.03] }, head: [0.12, 0], sword: { at: [0, 0.0, 0.4], r: [Math.PI - 0.04, 0, 0] }, shield: 'back' },
  salut: { pelvis: 0.98, lean: -0.03, hands: { R: [0.06, 1.38, 0.34], L: [-0.32, 0.86, 0.04] }, feet: { R: [0.15, 0.04, 0.08], L: [-0.12, 0.04, -0.08] }, head: [-0.08, 0], sword: { at: [0.06, 1.2, 0.3], r: [-0.06, 0, 0], fixed: true }, shield: 'back' },
  genou: { pelvis: 0.6, lean: 0.12, hands: { R: [0.02, 0.86, 0.58], L: [-0.01, 0.78, 0.58] }, feet: { R: [0.15, 0.04, 0.42], L: [-0.13, 0.05, -0.5] }, poles: { L: [0, -0.6, 1] }, head: [0.4, 0], sword: { at: [0, 0.0, 0.62], r: [Math.PI - 0.08, 0, 0] }, shield: { at: [-0.45, 0.3, 0.05], r: [-0.35, 0.5, 0.15] } },
  trone: { pelvis: 0.56, lean: -0.08, hands: { R: [0.05, 0.86, 0.55], L: [-0.04, 0.78, 0.55] }, feet: { R: [0.2, 0.04, 0.5], L: [-0.2, 0.04, 0.46] }, head: [0.1, 0], sword: { at: [0, 0.0, 0.58], r: [Math.PI - 0.05, 0, 0] }, shield: { at: [-0.5, 0.3, 0.2], r: [-0.25, 0.6, 0.1] } },
  assis: { pelvis: 0.56, lean: 0.14, hands: { R: [0.2, 0.8, 0.5], L: [-0.2, 0.8, 0.48] }, feet: { R: [0.18, 0.04, 0.5], L: [-0.18, 0.04, 0.46] }, head: [0.2, 0], sword: null, shield: 'back' },
};
export const POSE_ORDER = ['garde', 'salut', 'genou'];

export function buildFigure(kit = {}, { bust = false } = {}) {
  const M = mats();
  const root = G();
  const armored = !kit.body || kit.body === 'armor' || kit.body === 'tabard';
  const J = {};
  const pelvis = at(G(), 0, 0.98, 0); root.add(pelvis); J.pelvis = pelvis;
  const torso = at(G(), 0, 0.05, 0); pelvis.add(torso); J.torso = torso;
  const chest = at(G(), 0, 0.1, 0); torso.add(chest); J.chest = chest;
  if (armored) { chest.add(cuirass(M, kit)); pelvis.add(mailSkirt(M)); }
  if (!armored || kit.body === 'tabard') chest.add(robeBody(M, kit));
  const neck = at(G(), 0, 0.4, 0); chest.add(neck); J.neck = neck;
  const head = at(G(), 0, 0.06, 0); neck.add(head); J.head = head;
  head.add(head3d(kit, M));
  if (kit.cape) { const cp = cape3d(M); at(cp, 0, 0.32, -0.15); chest.add(cp); root.userData.cape = cp; }
  // bras
  for (const sd of [-1, 1]) {
    const S = sd < 0 ? 'L' : 'R';
    if (armored || kit.pauldrons === 'loup') chest.add(at(pauldron(M, kit, sd), sd * 0.25, 0.33, 0));
    const sh = at(G(), sd * 0.25, 0.28, 0); chest.add(sh); J['sh' + S] = sh;
    const armMat = armored ? M.steel : (kit.body === 'bare' ? M.skin : M.clothDark);
    if (armored) { sh.add(at(mesh(SPH(0.06, 16, 12), M.mail), 0, 0, 0)); sh.add(plateLimb(0.28, 0.055, 0.047, armMat, { lames: 2 })); }
    else sh.add(mesh(lathe([[0.0, 0.02], [0.07, 0], [0.068, -0.15], [0.066, -0.28], [0.0, -0.29]], 16), armMat));
    const el = at(G(), 0, -0.28, 0); sh.add(el); J['el' + S] = el;
    if (armored) { const c = cop(0.05, M.steel); c.rotation.set(0, Math.PI, 0); c.position.z = -0.02; el.add(c); el.add(plateLimb(0.25, 0.047, 0.04, armMat, { lames: 1 })); }
    else el.add(mesh(lathe([[0.0, 0.0], [0.068, -0.01], [0.085, -0.15], [0.1, -0.24], [0.0, -0.25]], 16), armMat));
    const ha = at(G(), 0, -0.26, 0); el.add(ha); J['ha' + S] = ha;
    ha.add(hand3d(M, kit, { bony: kit.hands === 'bony' }));
  }
  // jambes
  if (!bust) for (const sd of [-1, 1]) {
    const S = sd < 0 ? 'L' : 'R';
    const hip = at(G(), sd * 0.1, -0.06, 0); pelvis.add(hip); J['hip' + S] = hip;
    const kn = at(G(), 0, -0.44, 0); hip.add(kn); J['kn' + S] = kn;
    const ft = at(G(), 0, -0.44, 0); kn.add(ft); J['ft' + S] = ft;
    if (armored) {
      hip.add(plateLimb(0.44, 0.085, 0.064, M.steel, { lames: 2 }));
      const kc = cop(0.058, M.steel); kc.rotation.x = -Math.PI / 2; kc.position.z = 0.035; kn.add(kc);
      kn.add(plateLimb(0.42, 0.062, 0.046, M.steel, { lames: 0 }));
      for (let i = 0; i < 5; i++) { const s = mesh(SPH(0.058 - i * 0.006, 16, 10, 0, TAU, 0, Math.PI / 2), i % 2 ? M.steelDark : M.steel); s.scale.set(0.95, 0.65, 1.4); at(s, 0, -0.035, 0.0 + i * 0.04); ft.add(s); }
    } else {
      hip.add(mesh(CYL(0.08, 0.065, 0.44, 12), M.clothDark)).position.y = -0.22;
      kn.add(mesh(CYL(0.06, 0.05, 0.42, 12), M.leather)).position.y = -0.21;
      const f = mesh(SPH(0.055, 12, 8), M.leather); f.scale.set(1, 0.6, 1.8); at(f, 0, -0.03, 0.05); ft.add(f);
    }
  }
  if (kit.sword) root.userData.sword = sword3d(M, kit.sword === 'bourreau');
  if (kit.shield) root.userData.shield = shield3d(M);
  const ex = kit.extras || [];
  if (ex.includes('noose')) { neck.add(at(rot(mesh(new THREE.TorusGeometry(0.1, 0.02, 10, 28), M.leather), Math.PI / 2, 0, 0), 0, 0.0, 0)); neck.add(mesh(tube([[0.05, 0.02, 0.05], [0.06, 0.6, 0.08], [0.04, 2.4, 0.05]], 0.016, 20, 8), M.leather)); }
  if (ex.includes('skulls')) for (let i = 0; i < 7; i++) { const a = Math.PI * (0.15 + i * 0.7 / 6); chest.add(at(skull(M, 0.32), Math.cos(a) * 0.2, 0.33 - Math.sin(a) * 0.14, 0.17 + Math.sin(a) * 0.05)); }
  if (ex.includes('crozier')) { const cz = G(); cz.add(at(mesh(CYL(0.015, 0.015, 2.0, 10), M.wood), 0, 1.0, 0)); const hk = mesh(new THREE.TorusGeometry(0.1, 0.018, 10, 24, Math.PI * 1.5), M.brass); at(hk, 0.1, 2.0, 0); cz.add(hk); root.userData.crozier = cz; }
  if (ex.includes('banner')) root.userData.banner = etendard3d(M);
  const fig = { root, J, kit, armored, bust, pose: 'garde', nodT: -1, nodKind: null, P: null };
  fig.setPose = (name) => setPose(fig, name);
  fig.update = (t, dt) => updateFig(fig, t, dt);
  fig.nod = (kind) => { fig.nodKind = kind; fig.nodT = 0; };
  fig.setPose('garde');
  return fig;
}

// IK à deux os : l'os supérieur pointe en -Y local, le coude plie autour de X.
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3();
function ik(upper, lower, end, target, pole, a, b, sign) {
  const parent = upper.parent;
  parent.updateWorldMatrix(true, false);
  const T = parent.worldToLocal(target.clone()), S = upper.position.clone();
  const P = parent.worldToLocal(pole.clone().add(parent.getWorldPosition(new THREE.Vector3()))).sub(parent.worldToLocal(parent.getWorldPosition(new THREE.Vector3())));
  let D = T.clone().sub(S); const d = Math.min(Math.max(D.length(), 0.05), a + b - 0.002); D.normalize();
  const alpha = Math.acos(clamp1((a * a + d * d - b * b) / (2 * a * d)));
  const n = P.clone().addScaledVector(D, -P.dot(D)).normalize();
  const u = D.clone().multiplyScalar(Math.cos(alpha)).addScaledVector(n, Math.sin(alpha)).normalize(); // os sup.
  const E = S.clone().addScaledVector(u, a);
  const w = T.clone().sub(E); w.addScaledVector(u, -w.dot(u)); if (w.lengthSq() < 1e-8) w.copy(n).negate(); w.normalize();
  const Y = u.clone().negate(), Z = w.multiplyScalar(sign), X = new THREE.Vector3().crossVectors(Y, Z);
  _m.makeBasis(X, Y, Z); upper.quaternion.setFromRotationMatrix(_m);
  const beta = Math.acos(clamp1((a * a + b * b - d * d) / (2 * a * b)));
  lower.rotation.set(-sign * (Math.PI - beta), 0, 0);
}
const clamp1 = (x) => Math.max(-1, Math.min(1, x));

function solve(fig) {
  const P = fig.P, J = fig.J, root = fig.root;
  root.updateMatrixWorld(true);
  const W = (p) => root.localToWorld(V(...p));
  const dirW = (p) => V(...p).applyQuaternion(root.getWorldQuaternion(_q));
  for (const S of ['L', 'R']) {
    const sd = S === 'L' ? -1 : 1;
    const hp = P.hands[S];
    ik(J['sh' + S], J['el' + S], J['ha' + S], W(hp), dirW((P.poles && P.poles['a' + S]) || [sd * 0.8, -0.5, -0.6]), 0.28, 0.26, 1);
    if (J['hip' + S]) ik(J['hip' + S], J['kn' + S], J['ft' + S], W(P.feet[S]), dirW((P.poles && P.poles[S]) || [sd * 0.1, 0, 1]), 0.44, 0.44, -1);
  }
  // mains orientées vers la prise, pieds à plat
  root.updateMatrixWorld(true);
  const rq = root.getWorldQuaternion(new THREE.Quaternion());
  for (const S of ['L', 'R']) {
    const ft = J['ft' + S]; if (!ft) continue;
    const pq = ft.parent.getWorldQuaternion(new THREE.Quaternion());
    ft.quaternion.copy(pq.invert().multiply(rq));
    if (S === 'L' && fig.pose === 'genou') ft.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(1.2, 0, 0)));
  }
}

function setPose(fig, name) {
  const P = (fig.P = POSES[name] || POSES.garde), J = fig.J;
  fig.pose = name;
  J.pelvis.position.y = P.pelvis;
  J.torso.rotation.x = P.lean;
  J.head.rotation.set(P.head[0], P.head[1], 0);
  fig.headBase = [P.head[0], P.head[1]];
  const place = (obj, spec) => {
    if (!obj) return;
    obj.removeFromParent();
    if (!spec) return;
    if (spec === 'back') { J.chest.add(obj); obj.position.set(0, 0.12, -0.24); obj.rotation.set(0.12, Math.PI, 0.3); return; }
    (spec.hand ? J['ha' + spec.hand] : fig.root).add(obj);
    obj.position.set(...spec.at); obj.rotation.set(...spec.r);
  };
  place(fig.root.userData.sword, P.sword);
  place(fig.root.userData.shield, P.shield);
  const ud = fig.root.userData;
  if (ud.banner) { fig.root.add(ud.banner); ud.banner.position.set(-0.62, 0, -0.15); }
  if (ud.crozier) { fig.root.add(ud.crozier); ud.crozier.position.set(0.45, 0, 0.2); }
  // l'épée posée au sol : la pointe touche, la garde se cale sous les mains
  if (P.sword && !P.sword.hand && !P.sword.fixed && ud.sword) { const L = fig.kit.sword === 'bourreau' ? 1.0 : 0.88; ud.sword.position.y = L * Math.cos(P.sword.r[0] - Math.PI) * 1; }
  solve(fig);
}
function updateFig(fig, t) {
  const J = fig.J;
  const br = Math.sin(t * 1.3);
  J.chest.position.y = 0.1 + br * 0.004;
  J.chest.rotation.x = br * 0.012;
  let hx = fig.headBase[0] + Math.sin(t * 0.5) * 0.02, hy = fig.headBase[1] + Math.sin(t * 0.31) * 0.05;
  if (fig.nodT >= 0) {
    fig.nodT += 1 / 60;
    const k = fig.nodT, env = Math.max(0, 1 - k / 1.0) * Math.min(1, k * 8);
    if (fig.nodKind === 'oui') hx += Math.sin(k * 13) * 0.24 * env;
    else hy += Math.sin(k * 12) * 0.42 * env;
    if (k > 1.0) fig.nodT = -1;
  }
  J.head.rotation.x = hx; J.head.rotation.y = hy;
  if (br !== fig._br) solve(fig);
  fig._br = br;
  fig.root.userData.cape?.userData.tick(t);
  fig.root.userData.banner?.userData.tick?.(t);
}

// ── honneurs ─────────────────────────────────────────────────
export function etendard3d(M) {
  const g = G();
  g.add(at(mesh(CYL(0.02, 0.025, 2.6, 12), M.wood), 0, 1.3, 0));
  g.add(at(rot(mesh(CYL(0.014, 0.014, 0.7, 10), M.wood), 0, 0, Math.PI / 2), 0, 2.45, 0));
  g.add(at(mesh(CONE(0.03, 0.12, 8), M.brass), 0, 2.66, 0));
  const cv = canvas(256, 512), x = cv.getContext('2d');
  x.fillStyle = '#c8c4b8'; x.fillRect(0, 0, 256, 512);
  x.fillStyle = '#111'; x.fillRect(118, 60, 20, 300); x.fillRect(70, 110, 116, 18);
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + i * TAU / 7; x.beginPath(); x.arc(128 + Math.cos(a) * 90, 230 + Math.sin(a) * 90, 12, 0, TAU); x.fill(); }
  x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.moveTo(0, 512); x.lineTo(64, 430); x.lineTo(128, 512); x.lineTo(192, 430); x.lineTo(256, 512); x.fill();
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map: tx, alphaTest: 0.5, transparent: false, roughness: 1, side: THREE.DoubleSide, bumpMap: M.cloth.bumpMap, bumpScale: 1 });
  const geo = new THREE.PlaneGeometry(0.66, 1.3, 10, 20); const base = Float32Array.from(geo.attributes.position.array);
  const b = mesh(geo, mat); at(b, 0, 1.78, 0.02); g.add(b);
  g.userData.tick = (t) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x0 = base[i * 3], y0 = base[i * 3 + 1], k = (0.65 - y0) / 1.3; p.setZ(i, Math.sin(t * 1.6 + x0 * 6 + y0 * 2) * 0.04 * k + Math.sin(x0 * 14) * 0.01); } p.needsUpdate = true; geo.computeVertexNormals(); };
  return g;
}
export function trophees3d(M) {
  const g = G(), r = rng(91);
  for (let i = 0; i < 22; i++) { const a = r() * Math.PI - Math.PI, rr = 0.55 + r() * 0.5; const s = skull(M, 0.9 + r() * 0.5); at(s, Math.cos(a) * rr, 0.08 + r() * 0.05, Math.sin(a) * rr * 0.6 + 0.1); s.rotation.set(r() - 0.5, r() * 2 - 1, r() - 0.5); g.add(s); }
  for (const [x, z, a] of [[-0.8, 0.0, -0.4], [0.85, -0.1, 0.35], [-0.55, -0.3, 0.2], [0.6, -0.35, -0.25]]) { const sw = sword3d(M, false); sw.position.set(x, 0.5, z); sw.rotation.set(Math.PI, 0, a); sw.scale.setScalar(0.9); g.add(sw); }
  const sh = shield3d(M); sh.position.set(0.95, 0.25, 0.25); sh.rotation.set(-1.1, -0.3, 0.2); g.add(sh);
  return g;
}

export { flameMesh };
