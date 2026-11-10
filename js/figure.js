// ─────────────────────────────────────────────────────────────
//  Figures peintes : un squelette 2D, des pièces d'armure
//  ombrées, et toutes les pièces à débloquer. Sert au chevalier
//  (écran du héros), aux adversaires (bustes) et aux gantelets.
//  Unité : 1000 = taille d'un homme ; pieds en (0,0), y vers le bas.
// ─────────────────────────────────────────────────────────────
import { TAU, clamp, lerp, rng, METAL, DULL, grad, radial, finish, limb, boss, rivet, pattern, mailTex, clothTex, furTex, glow, cloth } from './paint.js';

const P = (x, y) => [x, y];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = (a) => Math.hypot(a[0], a[1]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const perp = (a) => [-a[1], a[0]];
const mid = (a, b, k = 0.5) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

// ── Poses ────────────────────────────────────────────────────
export const POSES = {
  garde: {
    head: P(0, -905), neck: P(0, -828), sL: P(-128, -786), sR: P(128, -786), eL: P(-168, -612), eR: P(168, -612),
    hL: P(-32, -508), hR: P(32, -508), pelvis: P(0, -470), hipL: P(-62, -462), hipR: P(62, -462),
    kL: P(-84, -246), kR: P(84, -246), fL: P(-104, -12), fR: P(104, -12),
    sword: { grip: P(0, -520), tip: P(0, -8), behindHands: true }, shield: { at: P(-262, -585), rot: -0.22, front: false },
  },
  salut: {
    head: P(0, -905), neck: P(0, -828), sL: P(-128, -786), sR: P(128, -786), eL: P(-178, -610), eR: P(228, -640),
    hL: P(-196, -458), hR: P(250, -500), pelvis: P(0, -470), hipL: P(-62, -462), hipR: P(62, -462),
    kL: P(-74, -246), kR: P(102, -244), fL: P(-82, -12), fR: P(140, -12),
    sword: { grip: P(250, -505), tip: P(300, -1140), behindHands: false }, shield: { at: P(-232, -560), rot: 0.1, front: true },
  },
  genou: {
    head: P(0, -735), neck: P(0, -660), sL: P(-128, -618), sR: P(128, -618), eL: P(-168, -468), eR: P(168, -468),
    hL: P(-30, -392), hR: P(30, -392), pelvis: P(0, -305), hipL: P(-64, -298), hipR: P(64, -298),
    kL: P(-150, -178), kR: P(92, -26), fL: P(-150, -10), fR: P(180, -8),
    sword: { grip: P(0, -400), tip: P(0, -6), behindHands: true }, shield: { at: P(-275, -330), rot: -0.35, front: false }, bow: 0.12,
  },
  trone: {
    head: P(0, -805), neck: P(0, -728), sL: P(-130, -686), sR: P(130, -686), eL: P(-196, -520), eR: P(196, -520),
    hL: P(-226, -402), hR: P(226, -402), pelvis: P(0, -392), hipL: P(-74, -384), hipR: P(74, -384),
    kL: P(-108, -318), kR: P(108, -318), fL: P(-118, -14), fR: P(118, -14),
    sword: { grip: P(0, -470), tip: P(0, -8), behindHands: true, lean: 0.12 }, shield: { at: P(-300, -230), rot: -0.5, front: false },
  },
  table: {
    head: P(0, -905), neck: P(0, -828), sL: P(-132, -786), sR: P(132, -786), eL: P(-190, -630), eR: P(190, -630),
    hL: P(-120, -545), hR: P(120, -545), pelvis: P(0, -470), hipL: P(-62, -462), hipR: P(62, -462),
    kL: P(-84, -246), kR: P(84, -246), fL: P(-104, -12), fR: P(104, -12),
    sword: null, shield: { at: P(-250, -560), rot: -0.2, front: false },
  },
};
export const POSE_ORDER = ['garde', 'salut', 'genou'];

// ── Pièces de base ───────────────────────────────────────────
function legs(c, J, o) {
  for (const s of ['L', 'R']) {
    const hip = J['hip' + s], k = J['k' + s], f = J['f' + s];
    limb(c, hip, k, 104, 76, { scale: o.sc, k: o.k });
    // grève + solerets
    limb(c, k, f, 74, 52, { scale: o.sc, k: o.k * 0.92 });
    const d = norm(sub(f, k));
    for (let i = 1; i < 4; i++) { const p = mid(k, f, 0.2 + i * 0.18); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2 * o.sc; c.beginPath(); c.moveTo(...add(p, perp(d), 26)); c.lineTo(...add(p, perp(d), -26)); c.stroke(); }
    const toe = s === 'L' ? -1 : 1;
    const sab = new Path2D();
    sab.moveTo(f[0] - 34, f[1] - 22); sab.quadraticCurveTo(f[0] + toe * 60, f[1] - 26, f[0] + toe * 74, f[1] + 2); sab.lineTo(f[0] - toe * 30, f[1] + 6); sab.closePath();
    c.fillStyle = grad(c, f[0], f[1] - 26, f[0], f[1] + 6, METAL, o.k * 0.9); c.fill(sab); finish(c, sab, { scale: o.sc });
    for (let i = 0; i < 3; i++) { c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1.6 * o.sc; c.beginPath(); c.arc(f[0] + toe * (10 + i * 16), f[1] - 4, 22, -2.2, -0.9); c.stroke(); }
    boss(c, k[0], k[1] - 6, 30, { wing: 0.9, rot: s === 'L' ? Math.PI : 0, scale: o.sc, k: o.k });
  }
}

function mailSkirt(c, J, o) {
  const p = J.pelvis, w = 128, top = p[1] - 70, bot = p[1] + (o.pose === 'trone' ? 40 : 100);
  const sk = new Path2D();
  sk.moveTo(-w, top); sk.lineTo(w, top); sk.lineTo(w + 34, bot);
  for (let i = 10; i >= 0; i--) sk.lineTo(lerp(-w - 34, w + 34, i / 10), bot + (i % 2 ? 10 : 0));
  sk.closePath();
  c.fillStyle = pattern(c, mailTex(), o.sc * 0.55); c.fill(sk);
  c.save(); c.clip(sk); c.globalCompositeOperation = 'multiply';
  c.fillStyle = grad(c, -w - 34, 0, w + 34, 0, [[0, 0.25], [0.3, 1], [0.6, 0.7], [1, 0.15]], o.k); c.fill(sk); c.restore();
}

function breastplate(c, J, o) {
  const n = J.neck, p = J.pelvis, sL = J.sL, sR = J.sR;
  const top = n[1] + 34, waist = p[1] - 58;
  const bp = new Path2D();
  bp.moveTo(sL[0] + 26, sL[1] + 8);
  bp.quadraticCurveTo(-30, top + 26, 0, top + 34); bp.quadraticCurveTo(30, top + 26, sR[0] - 26, sR[1] + 8);
  bp.bezierCurveTo(sR[0] + 8, sR[1] + 120, 118, waist - 90, 92, waist);
  bp.quadraticCurveTo(0, waist + 24, -92, waist);
  bp.bezierCurveTo(-118, waist - 90, sL[0] - 8, sL[1] + 120, sL[0] + 26, sL[1] + 8);
  bp.closePath();
  c.fillStyle = grad(c, -150, 0, 150, 0, [[0, 0.04], [0.14, 0.3], [0.3, 0.78], [0.44, 0.5], [0.5, 0.28], [0.58, 0.42], [0.8, 0.16], [1, 0.03]], o.k); c.fill(bp);
  c.save(); c.clip(bp); c.globalCompositeOperation = 'multiply'; c.fillStyle = grad(c, 0, top, 0, waist + 20, [[0, 1], [0.55, 0.85], [1, 0.35]]); c.fill(bp); c.restore();
  c.save(); c.clip(bp);
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = radial(c, -55, top + 90, 4, 110, [[0, 0.22], [1, 0]], o.k); c.fill(bp);
  c.restore();
  // arête centrale
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3 * o.sc; c.beginPath(); c.moveTo(-2, top + 36); c.quadraticCurveTo(-4, (top + waist) / 2, -2, waist + 12); c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.75)'; c.lineWidth = 4 * o.sc; c.beginPath(); c.moveTo(4, top + 36); c.quadraticCurveTo(6, (top + waist) / 2, 4, waist + 12); c.stroke();
  finish(c, bp, { scale: o.sc });
  // plackart
  const pk = new Path2D(); pk.moveTo(-84, waist - 70); pk.quadraticCurveTo(0, waist - 160, 84, waist - 70); pk.lineTo(90, waist); pk.quadraticCurveTo(0, waist + 22, -90, waist); pk.closePath();
  c.fillStyle = grad(c, -90, 0, 90, 0, [[0, 0.05], [0.3, 0.6], [0.45, 0.35], [0.6, 0.3], [1, 0.05]], o.k); c.fill(pk); finish(c, pk, { scale: o.sc, edge: 0.4 });
  for (const x of [-70, 70]) rivet(c, x, waist - 50, 6, o.k);
  // tassettes (lames de la taille)
  for (let i = 0; i < 3; i++) {
    const y = waist + 6 + i * 26, w0 = 96 + i * 10, w1 = 104 + i * 12;
    const f = new Path2D(); f.moveTo(-w0, y); f.quadraticCurveTo(0, y + 18, w0, y); f.lineTo(w1, y + 28); f.quadraticCurveTo(0, y + 46, -w1, y + 28); f.closePath();
    c.fillStyle = grad(c, -w1, y, w1, y + 30, METAL, o.k * (0.9 - i * 0.08)); c.fill(f); finish(c, f, { scale: o.sc, edge: 0.35 });
    rivet(c, -w0 + 8, y + 12, 4, o.k); rivet(c, w0 - 8, y + 12, 4, o.k);
  }
  // gorgerin
  const g = new Path2D(); g.moveTo(-70, n[1] + 6); g.quadraticCurveTo(0, n[1] - 14, 70, n[1] + 6); g.lineTo(84, n[1] + 40); g.quadraticCurveTo(0, n[1] + 66, -84, n[1] + 40); g.closePath();
  c.fillStyle = grad(c, -84, 0, 84, 0, METAL, o.k * 0.9); c.fill(g); finish(c, g, { scale: o.sc });
}

function robe(c, J, o, { k = 0.55, hooded = false, quilt = false, tabard = false, bare = false } = {}) {
  const n = J.neck, p = J.pelvis, sL = J.sL, sR = J.sR;
  const bot = p[1] + 220;
  const r = new Path2D();
  r.moveTo(sL[0] - 10, sL[1] + 10); r.quadraticCurveTo(0, n[1] + 10, sR[0] + 10, sR[1] + 10);
  r.bezierCurveTo(sR[0] + 50, sR[1] + 200, 170, bot - 120, 190, bot); r.lineTo(-190, bot);
  r.bezierCurveTo(-170, bot - 120, sL[0] - 50, sL[1] + 200, sL[0] - 10, sL[1] + 10); r.closePath();
  if (bare) {
    c.fillStyle = grad(c, -160, 0, 160, 0, [[0, 0.05], [0.3, 0.5], [0.55, 0.38], [1, 0.05]], k); c.fill(r);
    c.save(); c.clip(r); c.globalCompositeOperation = 'lighter';
    for (const [x, y, rx, ry] of [[-55, n[1] + 110, 52, 36], [55, n[1] + 110, 52, 36], [-30, n[1] + 220, 30, 26], [30, n[1] + 220, 30, 26], [-30, n[1] + 280, 28, 22], [30, n[1] + 280, 28, 22]]) {
      c.fillStyle = radial(c, x - 10, y - 10, 2, rx, [[0, 0.35], [1, 0]]); c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill();
    }
    c.restore();
    return;
  }
  cloth(c, r, -190, 190, { k: k * 1.5, tex: clothTex(), texScale: o.sc * 0.8, folds: 12 });
  finish(c, r, { scale: o.sc, scratch: 0, edge: 0.3, dark: 0.6 });
  if (quilt) {
    c.save(); c.clip(r); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 2.4 * o.sc;
    for (let x = -200; x < 200; x += 34) { c.beginPath(); c.moveTo(x, n[1]); c.lineTo(x + 10, bot); c.stroke(); }
    c.setLineDash([6 * o.sc, 5 * o.sc]); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.2 * o.sc;
    for (let y = n[1] + 40; y < bot; y += 40) { c.beginPath(); c.moveTo(-200, y); c.lineTo(200, y); c.stroke(); }
    c.restore();
  }
  if (tabard) {
    const t = new Path2D(); t.moveTo(-96, n[1] + 30); t.lineTo(96, n[1] + 30); t.lineTo(110, bot); t.lineTo(-110, bot); t.closePath();
    c.fillStyle = grad(c, -110, 0, 110, 0, [[0, 0.15], [0.35, 0.75], [1, 0.2]], 1); c.fill(t);
    c.fillStyle = '#000'; c.beginPath(); c.moveTo(-96, n[1] + 140); c.lineTo(0, n[1] + 60); c.lineTo(96, n[1] + 140); c.lineTo(96, n[1] + 180); c.lineTo(0, n[1] + 100); c.lineTo(-96, n[1] + 180); c.fill();
    c.font = '90px Jacquard'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText('VII', 0, n[1] + 300);
    finish(c, t, { scale: o.sc, edge: 0.2, scratch: 0 });
  }
  if (hooded) {
    const h = new Path2D(); h.moveTo(sL[0] + 10, sL[1]); h.quadraticCurveTo(0, n[1] + 120, sR[0] - 10, sR[1]); h.quadraticCurveTo(0, n[1] + 50, sL[0] + 10, sL[1]);
    c.fillStyle = 'rgba(0,0,0,.6)'; c.fill(h);
  }
}

function pauldron(c, J, o, s) {
  const sh = J['s' + s], dir = s === 'L' ? -1 : 1, x = sh[0] + dir * 18, y = sh[1] - 4;
  if (o.kit.pauldrons === 'loup') {
    c.save(); c.translate(x + dir * 10, y + 6);
    const f = new Path2D(); f.ellipse(0, 0, 112, 84, dir * 0.25, 0, TAU);
    c.fillStyle = pattern(c, furTex(), o.sc * 0.7); c.fill(f);
    c.save(); c.clip(f); c.globalCompositeOperation = 'multiply'; c.fillStyle = radial(c, -dir * 30, -40, 10, 130, [[0, 1], [0.6, 0.55], [1, 0.1]]); c.fill(f); c.restore();
    // mèches qui dépassent
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2 * o.sc;
    const r = rng(s === 'L' ? 4 : 5);
    for (let i = 0; i < 46; i++) { const a = r() * TAU, rr = 80 + r() * 30; const px = Math.cos(a) * rr * 1.2, py = Math.sin(a) * rr * 0.9; if (py < -40) continue; c.beginPath(); c.moveTo(px, py); c.lineTo(px + (r() - 0.5) * 10, py + 14 + r() * 22); c.stroke(); }
    if (s === 'L') { // crâne de loup sur l'épaule
      c.translate(-20, -50); c.rotate(-0.3);
      const sk = new Path2D(); sk.moveTo(-34, -8); sk.quadraticCurveTo(-20, -40, 10, -36); sk.lineTo(62, -16); sk.lineTo(66, 2); sk.lineTo(10, 12); sk.quadraticCurveTo(-26, 18, -34, -8);
      c.fillStyle = grad(c, 0, -40, 0, 16, [[0, 0.95], [0.6, 0.6], [1, 0.25]]); c.fill(sk); finish(c, sk, { scale: o.sc, scratch: 0.2 });
      c.fillStyle = '#000'; c.beginPath(); c.ellipse(-4, -14, 9, 7, 0.2, 0, TAU); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 2 * o.sc; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(18 + i * 8, 4); c.lineTo(20 + i * 8, 14); c.stroke(); }
      for (const ex of [-16, 0]) { c.fillStyle = '#000'; c.beginPath(); c.moveTo(ex - 10, -30); c.lineTo(ex - 4, -54); c.lineTo(ex + 6, -30); c.fill(); }
    }
    c.restore();
    return;
  }
  for (let i = 2; i >= 0; i--) {
    const pth = new Path2D();
    const yy = y + i * 26, rx = 74 - i * 4, ry = 46 - i * 6;
    pth.ellipse(x + dir * i * 4, yy, rx, ry, dir * 0.28, Math.PI * (i ? 0.95 : 0.9), Math.PI * (i ? 2.05 : 2.1));
    pth.closePath();
    c.fillStyle = grad(c, x - rx, yy - ry, x + rx, yy + ry, METAL, o.k * (1 - i * 0.12)); c.fill(pth); finish(c, pth, { scale: o.sc });
  }
  rivet(c, x + dir * 30, y - 10, 6, o.k); rivet(c, x - dir * 20, y - 16, 5, o.k);
}

function arm(c, J, o, s) {
  const S = J['s' + s], E = J['e' + s], H = J['h' + s];
  if (o.kit.body && o.kit.body !== 'armor' && o.kit.body !== 'tabard') {
    limb(c, S, E, 74, 66, { tex: clothTex(), texScale: o.sc * 0.8, scale: o.sc, k: 0.55, edge: 0.15 });
    limb(c, E, H, 66, 58, { tex: clothTex(), texScale: o.sc * 0.8, scale: o.sc, k: 0.5, edge: 0.15 });
    return;
  }
  limb(c, S, E, 74, 62, { scale: o.sc, k: o.k });
  limb(c, E, H, 64, 52, { scale: o.sc, k: o.k * 0.95 });
  const ang = Math.atan2(E[1] - S[1], E[0] - S[0]);
  boss(c, E[0], E[1], 26, { wing: 0.85, rot: ang + (s === 'L' ? Math.PI / 2 : -Math.PI / 2), scale: o.sc, k: o.k });
  if (o.kit.gauntlets === 'epines') { // ronce enroulée autour de l'avant-bras
    const d = norm(sub(H, E)), n = perp(d);
    c.strokeStyle = '#111'; c.lineWidth = 6 * o.sc; c.beginPath();
    for (let i = 0; i <= 24; i++) { const k = i / 24, p = add(mid(E, H, k), n, Math.sin(k * 14) * 24); i ? c.lineTo(...p) : c.moveTo(...p); } c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2 * o.sc; c.stroke();
    for (let i = 1; i < 12; i++) { const k = i / 12, p = add(mid(E, H, k), n, Math.sin(k * 14) * 24); const q = add(p, n, (i % 2 ? 1 : -1) * 16); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(...add(p, d, -4)); c.lineTo(...q); c.lineTo(...add(p, d, 4)); c.fill(); }
  }
}

export function gauntlet(c, H, dirA, o, { fist = true, spiky = false, bony = false, scale = 1 } = {}) {
  c.save(); c.translate(H[0], H[1]); c.rotate(dirA); c.scale(scale, scale);
  if (bony) {
    c.fillStyle = grad(c, 0, -26, 0, 26, [[0, 0.85], [0.5, 0.55], [1, 0.15]]);
    c.beginPath(); c.ellipse(16, 0, 26, 22, 0, 0, TAU); c.fill();
    for (let i = 0; i < 4; i++) { const y = -18 + i * 12; c.strokeStyle = '#ddd'; c.lineWidth = 6 * o.sc; c.lineCap = 'round'; c.beginPath(); c.moveTo(34, y); c.quadraticCurveTo(70, y + 2, 92 + (i % 2) * 8, y + 10); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1.5 * o.sc; c.stroke(); }
    c.restore(); return;
  }
  // manchette évasée
  const cuff = new Path2D(); cuff.moveTo(-34, -34); cuff.lineTo(10, -26); cuff.lineTo(10, 26); cuff.lineTo(-34, 34); cuff.closePath();
  c.fillStyle = grad(c, 0, -34, 0, 34, METAL, o.k); c.fill(cuff); finish(c, cuff, { scale: o.sc });
  // dos de main + doigts en lames
  const hand = new Path2D(); hand.moveTo(6, -24); hand.lineTo(fist ? 50 : 62, -22); hand.quadraticCurveTo(fist ? 66 : 84, 0, fist ? 50 : 62, 22); hand.lineTo(6, 24); hand.closePath();
  c.fillStyle = grad(c, 0, -24, 0, 24, METAL, o.k * 0.95); c.fill(hand); finish(c, hand, { scale: o.sc });
  for (let i = 0; i < 4; i++) { const y = -16 + i * 11; c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 2 * o.sc; c.beginPath(); c.moveTo(30, y); c.lineTo(fist ? 54 : 78, y + 2); c.stroke(); rivet(c, 34, y + 4, 3, o.k); }
  // pouce
  const th = new Path2D(); th.moveTo(18, 20); th.quadraticCurveTo(40, 40, 52, 30); th.lineTo(46, 20); th.closePath();
  c.fillStyle = grad(c, 0, 18, 0, 40, METAL, o.k * 0.8); c.fill(th); finish(c, th, { scale: o.sc, edge: 0.3 });
  if (spiky) {
    for (let i = 0; i < 4; i++) { const y = -18 + i * 12; const sp = new Path2D(); sp.moveTo(40, y - 4); sp.lineTo(44, y - 26 - (i % 2) * 8); sp.lineTo(48, y - 2); sp.closePath(); c.fillStyle = grad(c, 40, y - 30, 48, y, [[0, 1], [1, 0.3]]); c.fill(sp); }
    for (let i = 0; i < 3; i++) { const sp = new Path2D(); sp.moveTo(-30 + i * 14, -32); sp.lineTo(-24 + i * 14, -58); sp.lineTo(-18 + i * 14, -30); sp.closePath(); c.fillStyle = grad(c, 0, -58, 0, -30, [[0, 1], [1, 0.25]]); c.fill(sp); }
  }
  c.restore();
}

function sword(c, J, o) {
  const S = J.sword; if (!S) return;
  const big = o.kit.sword === 'bourreau';
  let G = S.grip, T = S.tip;
  if (S.lean) T = [T[0] + 160 * S.lean, T[1]];
  const d = norm(sub(T, G)), n = perp(d);
  const guard = add(G, d, big ? 46 : 38), pom = add(G, d, big ? -96 : -62);
  const bw = big ? 58 : 30;
  // lame
  const tipStart = add(T, d, big ? 0 : -120);
  const bl = new Path2D();
  bl.moveTo(...add(guard, n, bw / 2)); bl.lineTo(...add(tipStart, n, bw / 2 * (big ? 1 : 0.9)));
  if (big) { bl.lineTo(...add(T, n, bw * 0.4)); bl.lineTo(...add(T, n, -bw * 0.4)); } else bl.lineTo(...T);
  bl.lineTo(...add(tipStart, n, -bw / 2 * (big ? 1 : 0.9))); bl.lineTo(...add(guard, n, -bw / 2)); bl.closePath();
  c.fillStyle = grad(c, ...add(guard, n, bw / 2), ...add(guard, n, -bw / 2), [[0, 0.25], [0.35, 1], [0.5, 0.55], [0.7, 0.85], [1, 0.15]], o.k); c.fill(bl);
  finish(c, bl, { scale: o.sc, scratch: 0.5 });
  // gouttière
  c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = (big ? 8 : 5) * o.sc; c.beginPath(); c.moveTo(...add(guard, d, 20)); c.lineTo(...add(guard, d, len(sub(T, guard)) * 0.6)); c.stroke();
  if (big) { // trous et gravures de l'épée de justice
    for (let i = 0; i < 3; i++) { const p = add(T, d, -36 - i * 26); c.fillStyle = '#000'; c.beginPath(); c.arc(p[0], p[1], 6, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5 * o.sc;
    for (let i = 0; i < 5; i++) { const p = add(guard, d, 90 + i * 40); c.beginPath(); c.moveTo(...add(p, n, -14)); c.quadraticCurveTo(...add(add(p, d, 14), n, 0), ...add(p, n, 14)); c.stroke(); }
  }
  // garde
  const gw = big ? 130 : 78;
  const gd = new Path2D();
  if (big) {
    gd.moveTo(...add(add(guard, n, -gw), d, -26)); gd.quadraticCurveTo(...add(guard, n, -gw * 0.4), ...add(add(guard, n, -20), d, -4));
    gd.lineTo(...add(add(guard, n, 20), d, -4)); gd.quadraticCurveTo(...add(guard, n, gw * 0.4), ...add(add(guard, n, gw), d, -26));
    gd.lineTo(...add(add(guard, n, gw), d, -10)); gd.quadraticCurveTo(...add(add(guard, n, gw * 0.4), d, 18), ...add(add(guard, n, 0), d, 14));
    gd.quadraticCurveTo(...add(add(guard, n, -gw * 0.4), d, 18), ...add(add(guard, n, -gw), d, -10)); gd.closePath();
  } else {
    gd.moveTo(...add(add(guard, n, -gw), d, -8)); gd.lineTo(...add(add(guard, n, gw), d, -8)); gd.lineTo(...add(add(guard, n, gw), d, 8)); gd.lineTo(...add(add(guard, n, -gw), d, 8)); gd.closePath();
  }
  c.fillStyle = grad(c, ...add(guard, d, -14), ...add(guard, d, 14), METAL, o.k); c.fill(gd); finish(c, gd, { scale: o.sc });
  for (const sgn of [-1, 1]) boss(c, ...add(guard, n, sgn * gw), big ? 13 : 10, { scale: o.sc, k: o.k });
  // fusée + pommeau
  limb(c, add(guard, d, -4), add(pom, d, 12), big ? 26 : 22, big ? 22 : 18, { stops: DULL, k: 0.6, scale: o.sc, edge: 0.2 });
  c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 2 * o.sc;
  for (let i = 0; i < 7; i++) { const p = mid(guard, pom, 0.12 + i * 0.11); c.beginPath(); c.moveTo(...add(p, n, -12)); c.lineTo(...add(add(p, n, 12), d, -8)); c.stroke(); }
  boss(c, pom[0], pom[1], big ? 26 : 20, { scale: o.sc, k: o.k });
}

function shield(c, J, o) {
  const S = J.shield; if (!S || !o.kit.shield) return;
  c.save(); c.translate(...S.at); c.rotate(S.rot);
  const sh = new Path2D(); sh.moveTo(-108, -128); sh.lineTo(108, -128); sh.quadraticCurveTo(116, 40, 0, 150); sh.quadraticCurveTo(-116, 40, -108, -128); sh.closePath();
  c.fillStyle = grad(c, -120, -128, 120, 150, [[0, 0.75], [0.35, 0.5], [0.7, 0.22], [1, 0.08]], o.k); c.fill(sh);
  c.save(); c.clip(sh); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.5; c.fillStyle = pattern(c, clothTex(), o.sc); c.fill(sh); c.restore();
  // bordure de fer
  c.lineWidth = 14 * 1; c.strokeStyle = grad(c, -120, -128, 120, 150, METAL, o.k); c.stroke(sh); c.lineWidth = 2 * o.sc; c.strokeStyle = '#000'; c.stroke(sh);
  // bande en croix + clous
  c.save(); c.clip(sh); c.fillStyle = grad(c, -14, 0, 14, 0, METAL, o.k * 0.9); c.fillRect(-14, -124, 28, 280); c.fillRect(-120, -30, 240, 26); c.restore();
  for (let y = -110; y < 120; y += 26) rivet(c, 0, y, 6, o.k);
  for (let x = -90; x <= 90; x += 26) rivet(c, x, -17, 6, o.k);
  const r = rng(77);
  for (let i = 0; i < 24; i++) { const a = r() * TAU, rr = 40 + r() * 70; const x = Math.cos(a) * rr * 0.9, y = Math.sin(a) * rr; if (c.isPointInPath(sh, x, y)) rivet(c, x, y, 4.5, o.k * 0.9); }
  boss(c, 0, -17, 22, { scale: o.sc, k: o.k });
  finish(c, sh, { scale: o.sc, edge: 0.4, scratch: 0.5 });
  c.restore();
}

function sunEmblem(c, x, y, r, o) {
  c.save(); c.translate(x, y);
  const rays = new Path2D();
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, a1 = a - 0.11, a2 = a + 0.11, R = i % 2 ? r * 1.55 : r * 2.1; rays.moveTo(Math.cos(a1) * r * 0.95, Math.sin(a1) * r * 0.95); rays.lineTo(Math.cos(a) * R, Math.sin(a) * R); rays.lineTo(Math.cos(a2) * r * 0.95, Math.sin(a2) * r * 0.95); }
  c.fillStyle = '#000'; c.save(); c.translate(3, 3); c.fill(rays); c.restore();
  c.fillStyle = grad(c, -r * 2, -r * 2, r * 2, r * 2, [[0, 1], [0.5, 0.75], [1, 0.35]], o.k); c.fill(rays);
  const disc = new Path2D(); disc.arc(0, 0, r, 0, TAU);
  c.fillStyle = radial(c, -r * 0.3, -r * 0.35, 1, r * 1.2, [[0, 1], [0.6, 0.6], [1, 0.25]], o.k); c.fill(disc); finish(c, disc, { scale: o.sc, scratch: 0.2 });
  // visage du soleil
  c.strokeStyle = 'rgba(0,0,0,.75)'; c.lineWidth = 2.4 * o.sc;
  c.beginPath(); c.arc(-r * 0.35, -r * 0.15, r * 0.14, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
  c.beginPath(); c.arc(r * 0.35, -r * 0.15, r * 0.14, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
  c.beginPath(); c.moveTo(0, -r * 0.1); c.lineTo(-r * 0.08, r * 0.2); c.lineTo(r * 0.06, r * 0.22); c.stroke();
  c.beginPath(); c.arc(0, r * 0.32, r * 0.28, 0.2, Math.PI - 0.2); c.stroke();
  c.restore();
}

function cape(c, J, o, t) {
  const sL = J.sL, sR = J.sR, ground = Math.max(J.fL[1], J.fR[1]) - 20;
  const sway = Math.sin(t * 0.9) * 14, sway2 = Math.sin(t * 1.3 + 1) * 10;
  const r = rng(13);
  const cp = new Path2D();
  cp.moveTo(sL[0] + 10, sL[1] - 6); cp.quadraticCurveTo(0, sL[1] - 30, sR[0] - 10, sR[1] - 6);
  cp.bezierCurveTo(sR[0] + 110, sR[1] + 200, 250 + sway, ground - 300, 270 + sway, ground);
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const k = i / N, x = lerp(270 + sway, -270 + sway2, k);
    const y = ground - (i % 2 ? 40 + r() * 120 : r() * 30);
    c && cp.lineTo(x + (r() - 0.5) * 20, y);
  }
  cp.bezierCurveTo(-250 + sway2, ground - 300, sL[0] - 110, sL[1] + 200, sL[0] + 10, sL[1] - 6);
  cp.closePath();
  cloth(c, cp, -280, 280, { k: 0.75, tex: clothTex(), texScale: o.sc * 0.9, folds: 16, phase: t * 0.4 });
  c.save(); c.clip(cp);
  // trous et déchirures
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 9; i++) { const x = -220 + r() * 440, y = ground - 60 - r() * 260; c.beginPath(); c.ellipse(x, y, 6 + r() * 16, 10 + r() * 30, (r() - 0.5), 0, TAU); c.fill(); }
  c.restore();
  c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = 3 * o.sc; c.stroke(cp);
}

// ── Têtes et heaumes ─────────────────────────────────────────
function aventail(c, J, o) {
  const h = J.head, n = J.neck;
  const a = new Path2D(); a.moveTo(-58, h[1] + 40); a.lineTo(58, h[1] + 40); a.lineTo(96, n[1] + 40); a.quadraticCurveTo(0, n[1] + 70, -96, n[1] + 40); a.closePath();
  c.fillStyle = pattern(c, mailTex(), o.sc * 0.5); c.fill(a);
  c.save(); c.clip(a); c.globalCompositeOperation = 'multiply'; c.fillStyle = grad(c, -96, 0, 96, 0, [[0, 0.3], [0.35, 1], [1, 0.2]]); c.fill(a); c.restore();
}

function helmBasic(c, J, o) {
  const h = J.head;
  c.save(); c.translate(...h); c.rotate(J.bow || 0);
  const hp = new Path2D();
  hp.moveTo(-64, 66); hp.lineTo(-68, -20); hp.bezierCurveTo(-66, -96, 66, -96, 68, -20); hp.lineTo(64, 66); hp.quadraticCurveTo(0, 80, -64, 66); hp.closePath();
  c.fillStyle = grad(c, -70, -60, 70, 60, METAL, o.k); c.fill(hp);
  c.save(); c.clip(hp); c.globalCompositeOperation = 'lighter'; c.fillStyle = radial(c, -26, -40, 2, 60, [[0, 0.6], [1, 0]]); c.fill(hp); c.restore();
  finish(c, hp, { scale: o.sc });
  // fente de vision
  c.fillStyle = '#000'; c.fillRect(-60, -10, 120, 14); c.fillRect(-4, -10, 8, 50);
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.6 * o.sc; c.beginPath(); c.moveTo(-60, 6); c.lineTo(60, 6); c.stroke();
  // arête + trous d'aération
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3 * o.sc; c.beginPath(); c.moveTo(-2, -78); c.lineTo(-2, -12); c.stroke();
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { c.fillStyle = '#000'; c.beginPath(); c.arc(18 + j * 12, 26 + i * 10, 2.6, 0, TAU); c.fill(); }
  for (const x of [-56, 56]) for (const y of [-30, 30, 56]) rivet(c, x, y, 4, o.k);
  c.restore();
}

function helmSpikes(c, J, o) {
  const h = J.head;
  c.save(); c.translate(...h); c.rotate(J.bow || 0);
  const r = rng(31);
  // piques derrière
  const spikes = [];
  for (let i = 0; i < 17; i++) { const a = -Math.PI / 2 + (i / 16 - 0.5) * 2.9 + (r() - 0.5) * 0.1; const L = 80 + r() * 110 * (1 - Math.abs(i / 16 - 0.5)); spikes.push([a, L, 8 + r() * 6]); }
  for (const [a, L, w] of spikes) {
    const bx = Math.cos(a) * 58, by = Math.sin(a) * 66 - 10, tx = Math.cos(a) * (58 + L), ty = Math.sin(a) * (66 + L) - 10;
    const pa = a + Math.PI / 2;
    const sp = new Path2D(); sp.moveTo(bx + Math.cos(pa) * w, by + Math.sin(pa) * w); sp.lineTo(tx, ty); sp.lineTo(bx - Math.cos(pa) * w, by - Math.sin(pa) * w); sp.closePath();
    c.fillStyle = grad(c, bx + Math.cos(pa) * w, by + Math.sin(pa) * w, bx - Math.cos(pa) * w, by - Math.sin(pa) * w, [[0, 0.9], [0.45, 0.6], [1, 0.1]], o.k); c.fill(sp); finish(c, sp, { scale: o.sc, edge: 0.3 });
  }
  // heaume anguleux
  const hp = new Path2D(); hp.moveTo(-70, 74); hp.lineTo(-74, -30); hp.lineTo(-40, -90); hp.lineTo(0, -100); hp.lineTo(40, -90); hp.lineTo(74, -30); hp.lineTo(70, 74); hp.lineTo(0, 96); hp.closePath();
  c.fillStyle = grad(c, -74, 0, 74, 0, [[0, 0.15], [0.3, 0.75], [0.49, 0.95], [0.51, 0.35], [0.8, 0.2], [1, 0.05]], o.k); c.fill(hp);
  finish(c, hp, { scale: o.sc, scratch: 0.6 });
  c.fillStyle = '#000'; c.fillRect(-66, -14, 56, 13); c.fillRect(10, -14, 56, 13); c.fillRect(-66, 14, 132, 7);
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2 * o.sc; c.beginPath(); c.moveTo(0, -100); c.lineTo(0, 96); c.stroke();
  for (const [x, y] of [[-60, -48], [60, -48], [-62, 40], [62, 40], [-30, 70], [30, 70], [0, 84]]) rivet(c, x, y, 4.5, o.k);
  // piques frontales
  for (const [x, y, a, L] of [[-36, 50, Math.PI * 0.85, 60], [40, 44, Math.PI * 0.12, 70], [-20, -60, -Math.PI * 0.62, 50]]) {
    const sp = new Path2D(); const pa = a + Math.PI / 2; sp.moveTo(x + Math.cos(pa) * 7, y + Math.sin(pa) * 7); sp.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); sp.lineTo(x - Math.cos(pa) * 7, y - Math.sin(pa) * 7); sp.closePath();
    c.fillStyle = grad(c, x, y - 10, x, y + 10, [[0, 1], [1, 0.25]], o.k); c.fill(sp);
  }
  c.restore();
}

function antlers(c, J, o, { big = 1 } = {}) {
  const h = J.head;
  c.save(); c.translate(h[0], h[1] - 70); c.rotate(J.bow || 0); c.scale(big, big);
  for (const s of [-1, 1]) {
    const branch = (pts, w) => {
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = '#000'; c.lineWidth = (w + 3) * 1.7; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(s * p[0], p[1]) : c.moveTo(s * p[0], p[1]))); c.stroke();
      c.strokeStyle = grad(c, 0, -260, 0, 0, [[0, 0.95], [1, 0.55]]); c.lineWidth = w * 1.7; c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1.5 * o.sc; c.stroke();
    };
    branch([[30, 0], [70, -60], [100, -150], [120, -250]], 9);
    branch([[78, -76], [140, -110], [176, -150]], 6);
    branch([[96, -140], [60, -200], [56, -250]], 5);
    branch([[108, -190], [170, -230], [196, -290]], 5);
    branch([[116, -230], [100, -290]], 4);
    branch([[50, -36], [100, -40], [128, -66]], 5);
  }
  c.restore();
}

function crown(c, J, o, broken = true) {
  const h = J.head;
  c.save(); c.translate(h[0], h[1] - 82); c.rotate((J.bow || 0) + 0.06);
  const cr = new Path2D();
  cr.moveTo(-74, 22); cr.lineTo(-78, -24); cr.lineTo(-56, 2); cr.lineTo(-38, -52); cr.lineTo(-16, -2);
  cr.lineTo(0, -64); cr.lineTo(14, -6);
  if (broken) { cr.lineTo(26, -20); cr.lineTo(34, -6); } else { cr.lineTo(38, -52); }
  cr.lineTo(56, 2); cr.lineTo(78, -24); cr.lineTo(74, 22); cr.closePath();
  c.fillStyle = grad(c, -80, -60, 80, 22, [[0, 0.95], [0.3, 0.7], [0.55, 1], [1, 0.35]], o.k); c.fill(cr); finish(c, cr, { scale: o.sc, scratch: 0.3 });
  c.fillStyle = grad(c, 0, 4, 0, 26, METAL, o.k); c.fillRect(-76, 4, 152, 20);
  for (const x of [-50, -16, 18, 52]) { c.fillStyle = '#000'; c.beginPath(); c.arc(x, 14, 6, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 2, 12, 1.8, 0, TAU); c.fill(); }
  for (const [x, y] of [[-38, -52], [0, -64], [-78, -24], [78, -24]]) boss(c, x, y, 7, { scale: o.sc, k: o.k });
  c.restore();
}

function hood(c, J, o, { k = 0.45, deep = 1 } = {}) {
  const h = J.head;
  const hd = new Path2D();
  hd.moveTo(-110, h[1] + 120); hd.bezierCurveTo(-120, h[1] - 40, -80, h[1] - 130, 0, h[1] - 140); hd.bezierCurveTo(80, h[1] - 130, 120, h[1] - 40, 110, h[1] + 120); hd.closePath();
  cloth(c, hd, h[0] - 120, h[0] + 120, { k: k * 2.2, tex: clothTex(), texScale: o.sc * 0.8, folds: 7 });
  finish(c, hd, { scale: o.sc, scratch: 0, edge: 0.35, dark: 0.6 });
  const inner = new Path2D(); inner.ellipse(h[0], h[1] + 10, 60 * deep, 84 * deep, 0, 0, TAU);
  c.fillStyle = '#000'; c.fill(inner);
  return inner;
}

function skullFace(c, x, y, s, o, { long = 0, teeth = true } = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const f = new Path2D(); f.moveTo(-40, -30); f.bezierCurveTo(-46, -80, 46, -80, 40, -30); f.lineTo(34, 20 + long); f.quadraticCurveTo(0, 50 + long, -34, 20 + long); f.closePath();
  c.fillStyle = grad(c, -40, -70, 40, 50, [[0, 0.95], [0.45, 0.7], [1, 0.2]], o.k); c.fill(f); finish(c, f, { scale: o.sc, scratch: 0.35, edge: 0.3 });
  c.fillStyle = '#000';
  for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * 17, -20, 13, 15, sx * 0.3, 0, TAU); c.fill(); }
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-15, -18, 2.4, 0, TAU); c.arc(19, -18, 2.4, 0, TAU); c.fill();
  c.fillStyle = '#000'; c.beginPath(); c.moveTo(0, -4); c.lineTo(-7, 10); c.lineTo(7, 10); c.fill();
  if (teeth) { c.strokeStyle = '#000'; c.lineWidth = 2 * o.sc; c.beginPath(); c.moveTo(-22, 22 + long); c.lineTo(22, 22 + long); c.stroke(); for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 6, 16 + long); c.lineTo(i * 6, 30 + long); c.stroke(); } }
  c.restore();
}

function head(c, J, o) {
  const kind = o.kit.head || 'helm', h = J.head;
  if (kind === 'helm') { aventail(c, J, o); (o.kit.helm === 'piques' ? helmSpikes : helmBasic)(c, J, o); }
  else if (kind === 'kettle') {
    aventail(c, J, o);
    c.fillStyle = '#000'; c.beginPath(); c.ellipse(h[0], h[1] + 16, 58, 70, 0, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(h[0] - 20, h[1] + 4, 3, 0, TAU); c.arc(h[0] + 20, h[1] + 4, 3, 0, TAU); c.fill();
    const b = new Path2D(); b.ellipse(h[0], h[1] - 34, 136, 30, 0, 0, TAU); c.fillStyle = grad(c, -136, 0, 136, 0, METAL, o.k); c.fill(b); finish(c, b, { scale: o.sc });
    const d = new Path2D(); d.moveTo(h[0] - 70, h[1] - 34); d.bezierCurveTo(h[0] - 70, h[1] - 130, h[0] + 70, h[1] - 130, h[0] + 70, h[1] - 34); d.closePath();
    c.fillStyle = grad(c, -70, 0, 70, 0, METAL, o.k); c.fill(d); finish(c, d, { scale: o.sc });
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3 * o.sc; c.beginPath(); c.moveTo(h[0] - 2, h[1] - 120); c.lineTo(h[0] - 2, h[1] - 36); c.stroke();
  } else if (kind === 'sack') {
    const s = new Path2D(); s.moveTo(-70, h[1] + 70); s.bezierCurveTo(-90, h[1] - 60, -40, h[1] - 120, 10, h[1] - 110); s.bezierCurveTo(70, h[1] - 100, 90, h[1] - 30, 70, h[1] + 70); s.closePath();
    cloth(c, s, -90, 90, { k: 1.6, tex: clothTex(), texScale: o.sc * 0.7, folds: 6 });
    finish(c, s, { scale: o.sc, scratch: 0, edge: 0.4 });
    c.fillStyle = '#000'; c.beginPath(); c.ellipse(-24, h[1] - 10, 13, 9, 0.2, 0, TAU); c.ellipse(26, h[1] - 6, 11, 8, -0.2, 0, TAU); c.fill();
    c.strokeStyle = '#000'; c.lineWidth = 3 * o.sc; c.beginPath(); c.moveTo(-30, h[1] + 34); c.lineTo(30, h[1] + 30); c.stroke();
    for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 9, h[1] + 24); c.lineTo(i * 9 + 2, h[1] + 42); c.stroke(); }
  } else if (kind === 'hag') {
    hood(c, J, o, { k: 0.45 });
    skullFace(c, h[0], h[1] + 18, 0.95, o, { long: 14 });
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.6 * o.sc;
    for (let i = 0; i < 16; i++) { const x = -54 + i * 7; c.beginPath(); c.moveTo(x, h[1] - 50); c.quadraticCurveTo(x + Math.sin(i) * 14, h[1] + 60, x + Math.sin(i * 2) * 20, h[1] + 150); c.stroke(); }
  } else if (kind === 'deer') {
    hood(c, J, o, { k: 0.4 });
    antlers(c, J, o, { big: 1.05 });
    c.save(); c.translate(...h);
    const sk = new Path2D(); sk.moveTo(-44, -60); sk.bezierCurveTo(-40, -110, 40, -110, 44, -60); sk.lineTo(26, 40); sk.lineTo(14, 110); sk.lineTo(-14, 110); sk.lineTo(-26, 40); sk.closePath();
    c.fillStyle = grad(c, -44, -100, 44, 110, [[0, 0.98], [0.5, 0.7], [1, 0.25]], o.k); c.fill(sk); finish(c, sk, { scale: o.sc, scratch: 0.4, edge: 0.35 });
    c.fillStyle = '#000'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 26, -36, 12, 16, s * 0.4, 0, TAU); c.fill(); }
    c.beginPath(); c.ellipse(-6, 90, 5, 10, 0, 0, TAU); c.ellipse(6, 90, 5, 10, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1.5 * o.sc; c.beginPath(); c.moveTo(0, -90); c.lineTo(0, 70); c.stroke();
    c.restore();
  } else if (kind === 'wolf') {
    c.save(); c.translate(...h);
    const pelt = new Path2D(); pelt.moveTo(-130, 120); pelt.bezierCurveTo(-140, -40, -90, -130, 0, -140); pelt.bezierCurveTo(90, -130, 140, -40, 130, 120); pelt.closePath();
    c.fillStyle = pattern(c, furTex(), o.sc * 0.7); c.fill(pelt);
    c.save(); c.clip(pelt); c.globalCompositeOperation = 'multiply'; c.fillStyle = radial(c, -30, -60, 10, 170, [[0, 1], [1, 0.25]]); c.fill(pelt); c.restore();
    for (const s of [-1, 1]) { const e = new Path2D(); e.moveTo(s * 40, -110); e.lineTo(s * 86, -190); e.lineTo(s * 96, -96); e.closePath(); c.fillStyle = pattern(c, furTex(), o.sc * 0.7); c.fill(e); c.fillStyle = 'rgba(0,0,0,.55)'; c.fill(e); }
    // museau du loup au-dessus du visage
    const sn = new Path2D(); sn.moveTo(-60, -40); sn.quadraticCurveTo(0, -70, 60, -40); sn.lineTo(30, 20); sn.quadraticCurveTo(0, 34, -30, 20); sn.closePath();
    c.fillStyle = pattern(c, furTex(), o.sc * 0.6); c.fill(sn);
    c.fillStyle = '#000'; c.beginPath(); c.ellipse(0, 16, 14, 9, 0, 0, TAU); c.fill();
    for (const s of [-1, 1]) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(s * 24, -46); c.lineTo(s * 40, -40); c.lineTo(s * 26, -36); c.fill(); }
    c.strokeStyle = '#fff'; c.lineWidth = 2.4 * o.sc; for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * 7, 26); c.lineTo(i * 7 + 1, 40 + (Math.abs(i) === 3 ? 10 : 0)); c.stroke(); }
    c.fillStyle = '#000'; c.beginPath(); c.ellipse(0, 90, 50, 46, 0, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(-16, 84, 3, 0, TAU); c.arc(16, 84, 3, 0, TAU); c.fill();
    c.restore();
  } else if (kind === 'mitre') {
    c.fillStyle = '#000'; c.beginPath(); c.ellipse(h[0], h[1] + 20, 56, 72, 0, 0, TAU); c.fill();
    skullFace(c, h[0], h[1] + 26, 0.85, o, { teeth: false });
    const m = new Path2D(); m.moveTo(-62, h[1] - 30); m.lineTo(-56, h[1] - 140); m.quadraticCurveTo(-30, h[1] - 230, 0, h[1] - 260); m.quadraticCurveTo(30, h[1] - 230, 56, h[1] - 140); m.lineTo(62, h[1] - 30); m.closePath();
    c.fillStyle = grad(c, -62, 0, 62, 0, [[0, 0.2], [0.35, 0.95], [0.6, 0.7], [1, 0.15]]); c.fill(m); finish(c, m, { scale: o.sc, scratch: 0.15, edge: 0.3 });
    c.fillStyle = '#000'; c.fillRect(-7, h[1] - 220, 14, 160); c.fillRect(-40, h[1] - 170, 80, 14);
    c.fillStyle = grad(c, 0, h[1] - 50, 0, h[1] - 30, METAL); c.fillRect(-62, h[1] - 52, 124, 22);
  } else if (kind === 'exec') {
    const e = new Path2D(); e.moveTo(-80, h[1] + 120); e.lineTo(-70, h[1] - 40); e.quadraticCurveTo(-40, h[1] - 150, 10, h[1] - 230); e.quadraticCurveTo(40, h[1] - 140, 70, h[1] - 40); e.lineTo(80, h[1] + 120); e.closePath();
    c.fillStyle = grad(c, -80, 0, 80, 0, [[0, 0.05], [0.35, 0.3], [0.6, 0.18], [1, 0.03]]); c.fill(e); finish(c, e, { scale: o.sc, scratch: 0.2, edge: 0.25 });
    c.fillStyle = '#000'; c.beginPath(); c.ellipse(-24, h[1] - 6, 14, 9, 0.15, 0, TAU); c.ellipse(24, h[1] - 6, 14, 9, -0.15, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(-22, h[1] - 6, 3.4, 0, TAU); c.arc(26, h[1] - 6, 3.4, 0, TAU); c.fill();
  } else if (kind === 'veil') {
    c.fillStyle = '#000'; c.beginPath(); c.ellipse(h[0], h[1] + 10, 58, 76, 0, 0, TAU); c.fill();
    skullFace(c, h[0], h[1] + 16, 0.85, o, { teeth: true });
    const v = new Path2D(); v.moveTo(-70, h[1] - 70); v.quadraticCurveTo(0, h[1] - 120, 70, h[1] - 70); v.bezierCurveTo(110, h[1] + 40, 130, h[1] + 180, 150, h[1] + 260); v.lineTo(-150, h[1] + 260); v.bezierCurveTo(-130, h[1] + 180, -110, h[1] + 40, -70, h[1] - 70); v.closePath();
    c.save(); c.globalAlpha = 0.55; c.fillStyle = pattern(c, clothTex(), o.sc * 0.6); c.fill(v); c.restore();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.6 * o.sc;
    for (let i = 0; i < 14; i++) { const x = -100 + i * 15; c.beginPath(); c.moveTo(x * 0.6, h[1] - 60); c.quadraticCurveTo(x * 0.9, h[1] + 80, x * 1.3, h[1] + 250); c.stroke(); }
    for (let i = 0; i < 10; i++) { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-80 + i * 18, h[1] + 200 + (i % 3) * 20, 2.5, 6, 0, 0, TAU); c.fill(); }
    crown(c, { ...J, head: [h[0], h[1] - 30] }, o, false);
  } else if (kind === 'king') {
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2 * o.sc;
    for (let i = 0; i < 22; i++) { const x = -70 + i * 6.6; c.beginPath(); c.moveTo(x, h[1] - 60); c.quadraticCurveTo(x * 1.2, h[1] + 80, x * 1.5 + Math.sin(i) * 10, h[1] + 200); c.stroke(); }
    skullFace(c, h[0], h[1] + 10, 1.15, o, { long: 10 });
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2 * o.sc;
    for (let i = 0; i < 12; i++) { const x = -30 + i * 5.4; c.beginPath(); c.moveTo(x, h[1] + 50); c.quadraticCurveTo(x, h[1] + 120, x + Math.sin(i * 1.7) * 14, h[1] + 170); c.stroke(); }
    crown(c, J, o, true);
  }
  if (kind === 'helm') {
    if (o.kit.crest === 'cerf') antlers(c, J, o, { big: 0.8 });
    if (o.kit.crown) crown(c, J, o, true);
  }
}

// ── Accessoires d'adversaires ────────────────────────────────
function extras(c, J, o, front) {
  const ex = o.kit.extras || [];
  const n = J.neck;
  if (!front && ex.includes('banner')) etendard(c, -260, 0, 1, o.t, o.sc);
  if (front && ex.includes('noose')) {
    c.strokeStyle = '#000'; c.lineWidth = 16 * 1; c.beginPath(); c.moveTo(20, n[1] - 10); c.quadraticCurveTo(70, n[1] - 300, 40, -1600); c.stroke();
    c.strokeStyle = grad(c, 0, -1600, 0, n[1], [[0, 0.3], [1, 0.85]]); c.lineWidth = 10; c.stroke();
    c.lineWidth = 14; c.strokeStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(0, n[1] + 8, 66, 16, 0, 0, TAU); c.stroke();
    for (let i = 0; i < 5; i++) { c.strokeStyle = '#000'; c.lineWidth = 2; c.beginPath(); c.moveTo(20 + i * 4, n[1] - 30 - i * 14); c.lineTo(34 + i * 4, n[1] - 22 - i * 14); c.stroke(); }
  }
  if (front && ex.includes('skulls')) {
    for (let i = 0; i < 7; i++) { const a = Math.PI * (0.15 + i * 0.7 / 6); const x = Math.cos(a) * 120, y = n[1] + 30 + Math.sin(a) * 110; skullFace(c, x, y, 0.38, o, { teeth: false }); }
  }
  if (front && ex.includes('crozier')) {
    const x = J.hR[0] + 10;
    limb(c, [x, -1250], [x, -300], 18, 18, { stops: DULL, k: 0.7, scale: o.sc, edge: 0.2 });
    c.lineWidth = 16; c.strokeStyle = grad(c, x, -1400, x + 120, -1250, METAL); c.beginPath(); c.moveTo(x, -1250); c.bezierCurveTo(x, -1420, x + 150, -1420, x + 130, -1310); c.quadraticCurveTo(x + 110, -1270, x + 70, -1300); c.stroke();
  }
}

// ── Honneurs (décor autour du chevalier) ─────────────────────
export function etendard(c, x, y, s, t, sc = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  limb(c, [0, 30], [0, -1300], 16, 14, { stops: DULL, k: 0.5, scale: sc, edge: 0.2 });
  limb(c, [-120, -1250], [120, -1250], 12, 12, { stops: DULL, k: 0.5, scale: sc, edge: 0.2 });
  boss(c, 0, -1310, 16, { scale: sc });
  const b = new Path2D();
  const w1 = Math.sin(t * 1.4) * 12, w2 = Math.sin(t * 1.4 + 1.5) * 16;
  b.moveTo(-116, -1244); b.lineTo(116, -1244); b.quadraticCurveTo(126 + w1, -1000, 120 + w2, -760);
  b.lineTo(60, -690 + w1); b.lineTo(0, -780); b.lineTo(-60, -690 - w1); b.lineTo(-120 - w2, -760); b.quadraticCurveTo(-126 - w1, -1000, -116, -1244); b.closePath();
  c.fillStyle = pattern(c, clothTex(), sc); c.fill(b);
  c.save(); c.clip(b); c.globalCompositeOperation = 'multiply';
  const g = c.createLinearGradient(-130, 0, 130, 0);
  for (let i = 0; i <= 8; i++) { const v = Math.round((0.45 + 0.35 * Math.sin(i * 1.4 + t)) * 255); g.addColorStop(i / 8, `rgb(${v},${v},${v})`); }
  c.fillStyle = g; c.fill(b); c.restore();
  // blason : épée et sept étoiles
  c.fillStyle = '#000';
  c.fillRect(-6, -1180, 12, 300); c.fillRect(-46, -1130, 92, 12);
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + i * TAU / 7; const px = Math.cos(a) * 80, py = -1030 + Math.sin(a) * 80; c.beginPath(); c.arc(px, py, 7, 0, TAU); c.fill(); }
  c.strokeStyle = '#000'; c.lineWidth = 4; c.stroke(b);
  c.restore();
}

export function trophees(c, cx, y, s, sc = 1) {
  c.save(); c.translate(cx, y); c.scale(s, s);
  const r = rng(91);
  // armes brisées plantées
  for (const [x, a, L] of [[-330, -0.4, 420], [300, 0.35, 380], [-220, 0.2, 300], [240, -0.25, 330]]) {
    c.save(); c.translate(x, 0); c.rotate(a);
    limb(c, [0, 0], [0, -L], 20, 12, { scale: sc }); limb(c, [-44, -L * 0.7], [44, -L * 0.7], 12, 12, { scale: sc });
    c.restore();
  }
  // crânes empilés
  const spots = [];
  for (let i = 0; i < 26; i++) spots.push([(r() - 0.5) * 760, -r() * 60 * (1 - Math.abs(r() - 0.5)), 0.5 + r() * 0.35]);
  spots.sort((a, b) => a[1] - b[1]);
  for (const [x, yy, ss] of spots) skullFace(c, x, yy + 10, ss, { k: 1, sc }, { teeth: true });
  // bouclier tombé
  c.save(); c.translate(380, -30); c.rotate(0.9); shield(c, { shield: { at: [0, 0], rot: 0 } }, { kit: { shield: 1 }, sc, k: 0.8 }); c.restore();
  c.restore();
}

// ── Entrée principale ────────────────────────────────────────
export function drawFigure(c, { x, y, s, pose = 'garde', kit = {}, t = 0, k = 1, bust = false, breathe = true } = {}) {
  const base = POSES[pose] || POSES.garde;
  const J = JSON.parse(JSON.stringify(base));
  // respiration
  if (breathe) {
    const b = Math.sin(t * 1.2) * 4;
    for (const key of ['head', 'neck', 'sL', 'sR', 'eL', 'eR']) J[key][1] += b;
    J.head[0] += Math.sin(t * 0.4) * 2;
  }
  const o = { kit, t, k, pose, sc: 1 / s };
  c.save(); c.translate(x, y); c.scale(s, s);
  if (kit.cape) cape(c, J, o, t);
  if (J.shield && !J.shield.front) shield(c, J, o);
  extras(c, J, o, false);
  const armored = !kit.body || kit.body === 'armor' || kit.body === 'tabard';
  if (!bust && armored) legs(c, J, o);
  if (armored) { mailSkirt(c, J, o); breastplate(c, J, o); if (kit.breast === 'soleil') sunEmblem(c, 0, J.neck[1] + 168, 40, o); }
  if (kit.body === 'tabard') robe(c, J, o, { tabard: true });
  if (!armored) robe(c, J, o, { quilt: kit.body === 'gambeson', bare: kit.body === 'bare', k: kit.body === 'gambeson' ? 0.8 : 0.55 });
  if (armored) { pauldron(c, J, o, 'L'); pauldron(c, J, o, 'R'); }
  else if (kit.pauldrons === 'loup') { pauldron(c, J, o, 'L'); pauldron(c, J, o, 'R'); }
  if (J.sword && kit.sword && J.sword.behindHands) sword(c, J, o);
  arm(c, J, o, 'L'); arm(c, J, o, 'R');
  if (J.shield && J.shield.front) shield(c, J, o);
  const bony = kit.hands === 'bony';
  const spiky = kit.gauntlets === 'epines';
  for (const sd of ['L', 'R']) {
    const E = J['e' + sd], H = J['h' + sd];
    const a = Math.atan2(H[1] - E[1], H[0] - E[0]);
    gauntlet(c, H, a, o, { spiky, bony });
  }
  if (J.sword && kit.sword && !J.sword.behindHands) sword(c, J, o);
  head(c, J, o);
  extras(c, J, o, true);
  // lumière principale (haut-gauche) et contre-jour, sur la figure seulement
  c.globalCompositeOperation = 'source-atop';
  const kl = c.createRadialGradient(-180, -880, 30, -180, -880, 900); kl.addColorStop(0, 'rgba(255,255,255,.22)'); kl.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = kl;
  c.fillRect(-1400, -1800, 2800, 2000);
  c.globalCompositeOperation = 'source-over';
  c.restore();
}

// Gantelet du pèlerin vu à la première personne (avant-bras qui entre par le bas)
export function fpGauntlet(c, x, y, s, side, { spiky = false, reach = 0, curl = 0.3, t = 0 } = {}) {
  c.save(); c.translate(x, y); c.scale(s * side, s);
  const o = { sc: 1 / s, k: 1 };
  c.rotate(-0.55 + reach * 0.3);
  limb(c, [0, 420], [0, 0], 210, 170, { scale: o.sc });
  for (let i = 0; i < 3; i++) { c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 4 * o.sc; c.beginPath(); c.moveTo(-96, 300 - i * 90); c.quadraticCurveTo(0, 270 - i * 90, 96, 300 - i * 90); c.stroke(); rivet(c, -70, 290 - i * 90, 8); rivet(c, 70, 290 - i * 90, 8); }
  // manchette
  const cuff = new Path2D(); cuff.moveTo(-120, 30); cuff.lineTo(120, 30); cuff.lineTo(150, -60); cuff.lineTo(-150, -60); cuff.closePath();
  c.fillStyle = grad(c, -150, 0, 150, 0, METAL); c.fill(cuff); finish(c, cuff, { scale: o.sc });
  // main à plat sur la table
  const hand = new Path2D(); hand.moveTo(-110, -60); hand.lineTo(110, -60); hand.lineTo(120, -190); hand.quadraticCurveTo(0, -220, -120, -190); hand.closePath();
  c.fillStyle = grad(c, -120, 0, 120, 0, METAL, 0.95); c.fill(hand); finish(c, hand, { scale: o.sc });
  for (let i = 0; i < 4; i++) {
    const fx = -84 + i * 56, L = (i === 0 || i === 3 ? 150 : 175) * (1 - curl * 0.45);
    for (let j = 0; j < 3; j++) {
      const y0 = -196 - j * L / 3, y1 = y0 - L / 3 + 4;
      const seg = new Path2D(); seg.moveTo(fx - 22 + j * 2, y0); seg.lineTo(fx + 22 - j * 2, y0); seg.lineTo(fx + 19 - j * 3, y1); seg.lineTo(fx - 19 + j * 3, y1); seg.closePath();
      c.fillStyle = grad(c, fx - 22, 0, fx + 22, 0, METAL, 1 - j * 0.12); c.fill(seg); finish(c, seg, { scale: o.sc, scratch: 0.2 });
    }
    if (spiky) { const sp = new Path2D(); sp.moveTo(fx - 9, -200); sp.lineTo(fx, -270); sp.lineTo(fx + 9, -200); sp.closePath(); c.fillStyle = grad(c, fx, -270, fx, -200, [[0, 1], [1, 0.3]]); c.fill(sp); }
  }
  // pouce
  const th = new Path2D(); th.moveTo(110, -80); th.quadraticCurveTo(190, -120, 200, -190); th.lineTo(160, -200); th.quadraticCurveTo(140, -130, 100, -130); th.closePath();
  c.fillStyle = grad(c, 100, -200, 200, -80, METAL, 0.9); c.fill(th); finish(c, th, { scale: o.sc });
  void t;
  c.restore();
}

export { skullFace, crown, antlers, sunEmblem, helmSpikes, helmBasic, shield as drawShield, sword as drawSword };
