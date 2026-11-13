// ─────────────────────────────────────────────────────────────
//  Les cartes à collectionner : treize gravures originales,
//  dessinées trait par trait puis tramées (points d'encre sur
//  papier, plus deux encres : rouille et or).
//  Chaque carte est faite de calques, du lointain au premier
//  plan, pour donner de la profondeur quand on l'incline.
// ─────────────────────────────────────────────────────────────
import { bayer } from './dots.js';

export const CW = 224, CH = 328;
const WX = 16, WY = 16, WW = 192, WH = 240, B = 12;       // fenêtre de l'image + débord des calques
const TAU = Math.PI * 2, K = '#000', P = '#fff', R = '#f00', G = '#fc0';
const tone = (v) => `rgb(${v | 0},${v | 0},255)`;          // gris à tramer (0 = encre, 255 = papier)
export const NAMES = ['Le Néant', 'La Lanterne', 'Les Corbeaux', 'Les Trois Glas', 'La Tour', 'La Main de Gloire', 'Le Calice', 'Le Septième Sceau', 'La Herse', 'Le Glaive', 'La Roue', 'Le Heaume', 'La Couronne'];
export const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
export const COLORS = ['#000000', '#14100b', '#e8dcb6', '#c8502a', '#d8a23c']; // vide, encre, papier, rouille, or

const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ── outils de gravure ────────────────────────────────────────
function spline(c, pts, closed = false, cont = false, t = 0.5) {
  const n = pts.length, g = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  cont ? c.lineTo(pts[0][0], pts[0][1]) : c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = g(i - 1), b = g(i), d = g(i + 1), e = g(i + 2);
    c.bezierCurveTo(b[0] + ((d[0] - a[0]) * t) / 3, b[1] + ((d[1] - a[1]) * t) / 3, d[0] - ((e[0] - b[0]) * t) / 3, d[1] - ((e[1] - b[1]) * t) / 3, d[0], d[1]);
  }
  if (closed) c.closePath();
}
const poly = (c, pts, closed = true) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); if (closed) c.closePath(); };
const pathOf = (pts, smooth = true) => (c) => (smooth ? spline(c, pts, true) : poly(c, pts));
function shape(c, pts, { fill = P, stroke = K, lw = 2, smooth = true, closed = true } = {}) {
  c.beginPath(); smooth ? spline(c, pts, closed) : poly(c, pts, closed);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke && lw) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
}
const line = (c, pts, lw = 2, col = K, smooth = true) => shape(c, pts, { fill: null, stroke: col, lw, smooth, closed: false });
const seg = (c, x0, y0, x1, y1, lw = 1, col = K) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
const disc = (c, x, y, r, fill, lw = 0, stroke = K) => { c.beginPath(); c.arc(x, y, r, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } if (lw) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } };
const box = (c, x, y, w, h, t = 2, col = K) => { c.fillStyle = col; c.fillRect(x, y, w, t); c.fillRect(x, y + h - t, w, t); c.fillRect(x, y, t, h); c.fillRect(x + w - t, y, t, h); };
const inside = (c, path, fn) => { c.save(); c.beginPath(); path(c); c.clip(); fn(); c.restore(); };
// hachures parallèles dans un rectangle (à combiner avec inside pour ombrer une forme)
function hatch(c, x, y, w, h, { ang = -0.9, gap = 4, lw = 1, col = K } = {}) {
  inside(c, (q) => q.rect(x, y, w, h), () => {
    const cx = x + w / 2, cy = y + h / 2, r = Math.hypot(w, h) / 2 + 2, ca = Math.cos(ang), sa = Math.sin(ang);
    c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'butt'; c.beginPath();
    for (let d = -r; d <= r; d += gap) { c.moveTo(cx - sa * d - ca * r, cy + ca * d - sa * r); c.lineTo(cx - sa * d + ca * r, cy + ca * d + sa * r); }
    c.stroke(); c.lineCap = 'round';
  });
}
const shade = (c, pts, x, y, w, h, o = {}, smooth = true) => inside(c, pathOf(pts, smooth), () => hatch(c, x, y, w, h, o));
function rays(c, x, y, r0, r1, n, { col = K, lw = 1, alt = 0.6, rot = 0 } = {}) {
  for (let i = 0; i < n; i++) { const a = rot + (i / n) * TAU, e = r0 + (r1 - r0) * (i % 2 ? alt : 1); seg(c, x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * e, y + Math.sin(a) * e, lw, col); }
}
function burst(c, x, y, r0, r1, n, col = P, rot = 0, wd = 0.28) { // rayons en pointe
  c.fillStyle = col;
  for (let i = 0; i < n; i++) { const a = rot + (i / n) * TAU, w = (TAU / n) * wd; c.beginPath(); c.moveTo(x + Math.cos(a - w) * r0, y + Math.sin(a - w) * r0); c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); c.lineTo(x + Math.cos(a + w) * r0, y + Math.sin(a + w) * r0); c.fill(); }
}
function halo(c, x, y, r0, r1, v0 = 220, v1 = 0) { const g = c.createRadialGradient(x, y, r0, x, y, r1); g.addColorStop(0, tone(v0)); g.addColorStop(1, tone(v1)); c.fillStyle = g; c.fillRect(-B, -B, WW + 2 * B, WH + 2 * B); }

// ── ciels, terres, nuages ────────────────────────────────────
function skyNight(c, r, { glow = 120, y0 = 110, stars = 50 } = {}) {
  c.fillStyle = K; c.fillRect(-B, -B, WW + 2 * B, WH + 2 * B);
  const g = c.createLinearGradient(0, y0, 0, 230); g.addColorStop(0, tone(0)); g.addColorStop(1, tone(glow));
  c.fillStyle = g; c.fillRect(-B, y0, WW + 2 * B, WH + B - y0);
  c.fillStyle = P;
  for (let i = 0; i < stars; i++) { const x = (-B + r() * (WW + 2 * B)) | 0, y = (-B + r() * 150) | 0; c.fillRect(x, y, 1, 1); if (r() > 0.84) { c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3); } }
}
function skyDay(c, r, y1 = 200, gap = 6) {
  c.fillStyle = P; c.fillRect(-B, -B, WW + 2 * B, WH + 2 * B);
  c.fillStyle = K;
  for (let y = -8; y < y1; y += gap) { let x = -B - r() * 20; while (x < WW + B) { const l = 6 + r() * 34; c.fillRect(x | 0, y, l | 0, 1); x += l + 3 + r() * 14; } }
}
function cloud(c, x, y, w, r, { fill = P } = {}) {
  const bs = [];
  for (let i = 0; i < 5; i++) { const k = i / 4, s = Math.sin(k * Math.PI); bs.push([x + (k - 0.5) * w * 0.8, y - s * w * 0.16 - r() * 2, w * (0.12 + 0.13 * s) + r() * 2]); }
  inside(c, (q) => q.rect(x - w, y - w, w * 2, w + 1), () => {
    for (const [bx, by, br] of bs) disc(c, bx, by, br + 1.6, K);
    for (const [bx, by, br] of bs) disc(c, bx, by, br, fill);
    c.strokeStyle = K; c.lineWidth = 1;
    for (const [bx, by, br] of bs) { c.beginPath(); c.arc(bx + 1, by + 2, br * 0.55, Math.PI * 1.05, Math.PI * 1.8); c.stroke(); }
  });
  c.fillStyle = K; c.fillRect(x - w * 0.52, y, w * 1.04, 2);
  for (let i = 0; i < 3; i++) c.fillRect(x - w * (0.4 - i * 0.12), y + 4 + i * 3, w * (0.5 - i * 0.1), 1);
}
function land(c, ridge, { fill = K, lw = 2, stroke = K } = {}) {
  c.beginPath(); c.moveTo(-B - 4, WH + B + 4); c.lineTo(-B - 4, ridge[0][1]); spline(c, ridge, false, true); c.lineTo(WW + B + 4, ridge[ridge.length - 1][1]); c.lineTo(WW + B + 4, WH + B + 4); c.closePath();
  c.fillStyle = fill; c.fill(); if (lw) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
}
function grass(c, r, y, { n = 40, h = 9, col = K, x0 = -B, x1 = WW + B } = {}) {
  c.strokeStyle = col; c.lineWidth = 1;
  for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), hh = h * (0.5 + r()), l = (r() - 0.5) * 6; c.beginPath(); c.moveTo(x, y + r() * 3); c.quadraticCurveTo(x + l * 0.3, y - hh * 0.6, x + l, y - hh); c.stroke(); }
}
function tree(c, x, y, h, r, { lean = 0, col = K, lw = 5, depth = 3 } = {}) {
  const br = (x0, y0, ang, len, w, d) => {
    const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
    c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + (r() - 0.5) * len * 0.3, (y0 + y1) / 2 + (r() - 0.5) * len * 0.2, x1, y1); c.stroke();
    if (d > 0) for (let i = 0, n = 2 + ((r() * 2) | 0); i < n; i++) { const k = 0.35 + r() * 0.6; br(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, ang + (r() - 0.5) * 1.9, len * (0.45 + r() * 0.25), Math.max(1, w * 0.55), d - 1); }
  };
  br(x, y, -Math.PI / 2 + lean, h, lw, depth);
}
function bramble(c, pts, r, { lw = 3, col = K, n = 12, len = 6 } = {}) {
  c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); spline(c, pts); c.stroke();
  c.fillStyle = col;
  for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < n / (pts.length - 1); j++) {
    const k = r(), x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k;
    const d = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]), a = d + (r() < 0.5 ? 1 : -1) * (1.1 + r() * 0.5), w = lw * 0.6;
    c.beginPath(); c.moveTo(x - Math.cos(d) * w, y - Math.sin(d) * w); c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); c.lineTo(x + Math.cos(d) * w, y + Math.sin(d) * w); c.fill();
  }
}

// ── petits sujets ────────────────────────────────────────────
function flame(c, x, y, h, core = true) {
  const w = h * 0.42;
  c.beginPath(); c.moveTo(x, y - h); c.bezierCurveTo(x + w * 1.1, y - h * 0.45, x + w, y, x, y); c.bezierCurveTo(x - w, y, x - w * 0.9, y - h * 0.4, x, y - h);
  c.fillStyle = R; c.fill(); c.strokeStyle = K; c.lineWidth = 1; c.stroke();
  if (core) { c.beginPath(); c.moveTo(x, y - h * 0.58); c.quadraticCurveTo(x + w * 0.55, y - h * 0.1, x, y - 1); c.quadraticCurveTo(x - w * 0.55, y - h * 0.1, x, y - h * 0.58); c.fillStyle = G; c.fill(); }
}
function candle(c, x, y, h, w = 9, fl = 13) {
  const pts = [[x - w / 2, y], [x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y]];
  shape(c, pts, { smooth: false, lw: 1.6 });
  hatch(c, x + w * 0.05, y - h, w * 0.45, h, { ang: 0.7, gap: 3 });
  shape(c, [[x - w / 2 - 1, y - h + 1], [x - w / 2, y - h + 9], [x - w / 2 + 2.5, y - h + 5], [x - w / 2 + 3, y - h + 1]], { lw: 1 });
  seg(c, x, y - h, x, y - h - 3, 1); flame(c, x, y - h - 2, fl);
}
function skull(c, x, y, s, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  shape(c, [[0, -11], [8, -9], [11, -2], [9, 4], [6, 7], [5, 12], [-5, 12], [-6, 7], [-9, 4], [-11, -2], [-8, -9]], { lw: 1.7 / s });
  disc(c, -4.2, -1, 3, K); disc(c, 4.2, -1, 3, K);
  c.fillStyle = K; c.beginPath(); c.moveTo(0, 2.5); c.lineTo(1.9, 6); c.lineTo(-1.9, 6); c.fill();
  seg(c, -5, 8.6, 5, 8.6, 0.9 / s);
  for (let i = -2; i <= 2; i++) seg(c, i * 2, 8.6, i * 2, 12, 0.9 / s);
  c.restore();
}
function raven(c, x, y, s, flip = 1, rim = false) { // (x, y) : là où se posent les pattes · rim : liseré papier (ciel de nuit)
  c.save(); c.translate(x, y - 19 * s); c.scale(s * flip, s);
  const tail = [[-12, 4], [-37, 15], [-33, 20], [-8, 12]], body = [[-28, 11], [-12, -6], [2, -19], [10, -25], [17, -24], [21, -21], [33, -16], [20, -14.5], [16, -6], [12, 6], [2, 13], [-10, 10]];
  if (rim) { shape(c, tail, { fill: P, stroke: P, lw: 5 / s, smooth: false }); shape(c, body, { fill: P, stroke: P, lw: 5 / s }); seg(c, 2, 12, 2, 19, 4.5 / s, P); seg(c, 8, 9, 8, 19, 4.5 / s, P); }
  shape(c, tail, { fill: K, lw: 0, smooth: false });
  shape(c, body, { fill: K, lw: 0 });
  c.strokeStyle = P; c.lineWidth = 1 / s;
  for (const [a, b, e, f] of [[-8, -2, 6, 8], [-13, 3, 0, 11], [-2, -9, 10, 1], [-20, 8, -8, 9]]) { c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo((a + e) / 2 - 2, (b + f) / 2 + 3, e, f); c.stroke(); }
  disc(c, 13.5, -20.5, 1.5, P); seg(c, 21, -19.5, 30, -16.8, 0.9 / s, P);
  seg(c, 2, 12, 2, 19, 1.5 / s); seg(c, 8, 9, 8, 19, 1.5 / s);
  c.restore();
}
function bat(c, x, y, s, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  const pts = [[0, 4], [-6, 0], [-10, 5], [-14, 0], [-19, 6], [-25, -7], [-8, -6], [-3, -3], [-2.5, -9], [0, -4.5], [2.5, -9], [3, -3], [8, -6], [25, -7], [19, 6], [14, 0], [10, 5], [6, 0]];
  shape(c, pts, { fill: K, stroke: P, lw: 2 / s, smooth: false }); shape(c, pts, { fill: K, lw: 0, smooth: false });
  c.restore();
}
function bird(c, x, y, s) { line(c, [[x - 5 * s, y - 2 * s], [x - 2 * s, y - 3.5 * s], [x, y], [x + 2 * s, y - 3.5 * s], [x + 5 * s, y - 2 * s]], 1.3); }
function bell(c, x, y, s, mark = false) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = K; c.fillRect(-6, -5, 12, 6);
  const pr = [[4, 0], [6, 9], [9, 21], [12, 30], [18, 38], [19, 42]], pts = [...pr, ...pr.slice().reverse().map(([a, b]) => [-a, b])];
  shape(c, pts, { lw: 2 / s, smooth: false });
  inside(c, pathOf(pts, false), () => { hatch(c, 3, 0, 18, 44, { ang: 1.1, gap: 2.6, lw: 0.9 / s }); c.fillStyle = K; c.fillRect(13, 0, 8, 44); });
  seg(c, -18, 37, 18, 37, 1 / s); seg(c, -10, 24, 10, 24, 1 / s); seg(c, -8, 16, 8, 16, 0.8 / s);
  if (mark) { c.fillStyle = R; c.fillRect(-7, 26, 2.4, 9); c.fillRect(-9.8, 28.6, 8, 2.4); }
  disc(c, 0, 46, 3.4, K); disc(c, -1, 45, 1, P);
  c.restore();
}
function moth(c, x, y, s, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  for (const f of [-1, 1]) { shape(c, [[0, -1], [f * 9, -8], [f * 12, -1], [f * 6, 2]], { lw: 1 / s }); shape(c, [[0, 1], [f * 7, 3], [f * 8, 8], [f * 2, 6]], { lw: 1 / s }); disc(c, f * 8, -3.5, 1.3, K); }
  c.fillStyle = K; c.fillRect(-1, -4, 2, 10); seg(c, 0, -4, -3, -8, 0.8 / s); seg(c, 0, -4, 3, -8, 0.8 / s);
  c.restore();
}
function bricks(c, x, y, w, h, { bh = 11, bw = 24, lw = 1 } = {}) {
  c.fillStyle = K;
  for (let j = 0, yy = y; yy < y + h; yy += bh, j++) { c.fillRect(x, yy | 0, w, lw); for (let xx = x + (j % 2 ? bw / 2 : 0) + ((j * 7) % 5); xx < x + w; xx += bw) c.fillRect(xx | 0, yy | 0, lw, bh); }
}

// ═════════════════════════════════════════════════════════════
//  LES TREIZE GRAVURES
// ═════════════════════════════════════════════════════════════
const ART = [];

// 0 — Le Néant : le pèlerin devant le soleil noir
ART[0] = (L, r) => {
  L.bg((c) => skyDay(c, r, 196));
  L.far((c) => {
    rays(c, 96, 88, 48, 86, 52, { lw: 1, alt: 0.5 });
    disc(c, 96, 88, 46, G); disc(c, 96, 88, 42, K);
    halo2(c, 96, 88, 42);
    cloud(c, 30, 150, 54, r); cloud(c, 168, 136, 46, r);
  });
  L.main((c) => {
    land(c, [[-12, 218], [40, 208], [96, 198], [150, 209], [204, 220]], { fill: K });
    shape(c, [[91, 199], [101, 199], [134, 254], [58, 254]], { fill: tone(150), lw: 0, smooth: false });
    c.fillStyle = K; for (let i = 0; i < 6; i++) c.fillRect(95 - i * 0.6, 204 + i * 9, 2 + i * 0.9, 4 + i);
    shape(c, [[96, 150], [103, 156], [106, 170], [114, 199], [78, 199], [86, 170], [89, 156]], { fill: K, lw: 0 });
    seg(c, 114, 146, 117, 200, 2); disc(c, 114, 145, 3, K);
    line(c, [[91, 157], [88, 171], [82, 197]], 1, P);
    grass(c, r, 214, { n: 50, col: P, h: 7 });
  });
  L.near((c) => { bramble(c, [[-14, 200], [14, 214], [30, 240], [26, 256]], r, { lw: 4 }); bramble(c, [[206, 190], [180, 212], [170, 240], [176, 256]], r, { lw: 4 }); });
};
function halo2(c, x, y, rr) { c.strokeStyle = P; c.lineWidth = 1; c.beginPath(); c.arc(x - 4, y - 4, rr - 9, Math.PI * 0.9, Math.PI * 1.6); c.stroke(); c.beginPath(); c.arc(x - 3, y - 3, rr - 15, Math.PI, Math.PI * 1.45); c.stroke(); }

// I — La Lanterne
ART[1] = (L, r) => {
  L.bg((c) => {
    skyNight(c, r, { glow: 90 }); halo(c, 96, 122, 10, 92, 235, 0);
    rays(c, 96, 122, 44, 86, 28, { col: P, alt: 0.55 });
    c.fillStyle = P; for (let i = 0; i < 30; i++) c.fillRect((r() * WW) | 0, (r() * 60 - 8) | 0, 1, 1);
  });
  L.far((c) => {
    tree(c, 16, 252, 190, r, { lean: 0.06, lw: 7 }); tree(c, 176, 252, 170, r, { lean: -0.1, lw: 6 }); tree(c, 150, 252, 90, r, { lean: 0.12, lw: 3, depth: 2 });
    land(c, [[-12, 222], [50, 214], [110, 220], [204, 210]], { fill: K, lw: 0 });
    grass(c, r, 222, { n: 46, col: P, h: 8 });
  });
  L.main((c) => {
    // la branche et sa chaîne
    const br = [[-14, 8], [30, 18], [80, 32], [130, 34], [160, 24], [162, 31], [130, 47], [80, 50], [30, 42], [-14, 38]];
    shape(c, br, { lw: 2.2 }); inside(c, pathOf(br), () => { hatch(c, -14, 30, 180, 24, { ang: 0.12, gap: 2.5 }); c.fillStyle = K; c.fillRect(-14, 44, 180, 10); });
    line(c, [[58, 30], [50, 14], [56, 0]], 3); line(c, [[122, 38], [136, 22], [134, 8]], 2.4); line(c, [[20, 40], [10, 54]], 2);
    for (let i = 0; i < 5; i++) { c.strokeStyle = K; c.lineWidth = 3.4; c.beginPath(); c.ellipse(96, 50 + i * 6, i % 2 ? 1.4 : 3, 3.8, 0, 0, TAU); c.stroke(); c.strokeStyle = P; c.lineWidth = 1.2; c.stroke(); }
    // la lanterne
    c.save(); c.translate(96, 128); c.scale(1.36, 1.36); c.translate(-96, -128);
    disc(c, 96, 90, 4, null, 3.4); disc(c, 96, 90, 4, null, 1.2, P);
    const cap = [[96, 92], [119, 108], [73, 108]]; shape(c, cap, { smooth: false }); shade(c, cap, 97, 90, 24, 20, { ang: 1.2, gap: 2.2 }, false);
    const body = [[78, 108], [114, 108], [110, 158], [82, 158]]; shape(c, body, { smooth: false, fill: tone(232) });
    c.fillStyle = K; c.fillRect(94.6, 108, 2.8, 50); c.fillRect(79, 131, 34, 1.6);
    flame(c, 96, 153, 27);
    shape(c, [[75, 158], [117, 158], [113, 166], [79, 166]], { fill: K, stroke: P, lw: 1, smooth: false }); c.fillStyle = P; c.fillRect(82, 161.4, 28, 1);
    shape(c, [[90, 166], [102, 166], [96, 175]], { fill: K, stroke: P, lw: 1, smooth: false });
    c.restore();
  });
  L.near((c) => {
    moth(c, 44, 130, 1.1, -0.5); moth(c, 152, 96, 0.9, 0.4); moth(c, 146, 186, 0.8, 0.9);
    bramble(c, [[-14, 214], [20, 226], [44, 250], [40, 262]], r, { lw: 4 }); bramble(c, [[206, 206], [176, 226], [160, 250]], r, { lw: 4 });
  });
  L.pop((c) => moth(c, 183, 150, 1.4, 0.3));
};

// II — Les Corbeaux
ART[2] = (L, r) => {
  L.bg((c) => { skyDay(c, r, 168); rays(c, 96, 136, 44, 70, 36, { lw: 1 }); disc(c, 96, 136, 38, R, 2); });
  L.far((c) => {
    land(c, [[-12, 172], [36, 158], [92, 168], [150, 152], [204, 164]], { fill: tone(176), lw: 2 });
    inside(c, (q) => q.rect(-12, 150, 220, 110), () => hatch(c, -12, 168, 220, 60, { ang: 0.5, gap: 5 }));
    c.fillStyle = K; c.fillRect(160, 132, 2, 24); c.fillRect(160, 132, 12, 2); c.fillRect(170, 132, 1, 9); disc(c, 170.5, 143, 2, K);
    land(c, [[-12, 206], [60, 196], [130, 204], [204, 192]], { fill: K, lw: 0 });
    grass(c, r, 204, { n: 44, col: P, h: 7 });
  });
  L.main((c) => {
    // le gibet
    const post = [[158, 256], [160, 60], [176, 58], [178, 256]]; shape(c, post, { smooth: false }); shade(c, post, 168, 56, 12, 204, { ang: 1.3, gap: 2.6 }, false);
    const arm = [[10, 86], [180, 78], [182, 92], [12, 100], [4, 94]]; shape(c, arm, { smooth: false }); shade(c, arm, 0, 88, 190, 14, { ang: 0.05, gap: 2.6 }, false);
    shape(c, [[160, 120], [130, 92], [138, 90], [164, 110]], { smooth: false, lw: 1.6 });
    c.fillStyle = K; for (const x of [28, 62, 100, 140]) c.fillRect(x, 84, 2, 2);
    raven(c, 64, 82, 1.15, 1); raven(c, 122, 80, 1.15, -1);
  });
  L.near((c) => {
    // la corde
    line(c, [[93, 98], [94, 150], [92, 176]], 4.5); line(c, [[93, 98], [94, 150], [92, 176]], 2, P);
    c.strokeStyle = K; c.lineWidth = 4.5; c.beginPath(); c.ellipse(92, 192, 9, 15, 0.1, 0, TAU); c.stroke(); c.strokeStyle = P; c.lineWidth = 2; c.stroke();
    c.fillStyle = K; for (let y = 104; y < 176; y += 5) c.fillRect(91, y, 5, 1);
    c.fillStyle = K; c.fillRect(88, 172, 9, 7);
    bramble(c, [[-14, 228], [24, 236], [50, 256]], r, { lw: 4 });
  });
  L.pop((c) => { shape(c, [[26, 232], [34, 246], [30, 262], [22, 248]], { fill: K, stroke: P, lw: 1.2 }); seg(c, 27, 236, 29, 258, 1, P); });
};

// III — Les Trois Glas
ART[3] = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 150, y0: 130 }); disc(c, 140, 56, 17, P); disc(c, 133, 51, 15, K); });
  L.far((c) => {
    land(c, [[-12, 214], [50, 204], [120, 212], [204, 202]], { fill: K, lw: 0 });
    c.fillStyle = K; c.fillRect(84, 178, 14, 34); shape(c, [[82, 178], [91, 160], [100, 178]], { fill: K, lw: 0, smooth: false }); c.fillRect(90, 152, 2, 10); c.fillRect(87, 155, 8, 2);
    c.fillStyle = R; c.fillRect(89, 190, 4, 7);
  });
  L.main((c) => {
    // le clocher : mur percé d'une ogive
    const open = (q) => { q.moveTo(36, 256); q.lineTo(36, 96); q.quadraticCurveTo(40, 40, 96, 10); q.quadraticCurveTo(152, 40, 156, 96); q.lineTo(156, 256); q.closePath(); };
    c.save(); c.beginPath(); c.rect(-14, -14, 220, 270); open(c); c.clip('evenodd');
    c.fillStyle = P; c.fillRect(-14, -14, 220, 270); bricks(c, -14, -14, 220, 270, { bh: 12, bw: 26 });
    hatch(c, -14, -14, 50, 270, { ang: 0.9, gap: 4 }); c.fillStyle = K; c.fillRect(176, -14, 30, 270);
    hatch(c, 156, -14, 22, 270, { ang: 0.9, gap: 2.5 });
    c.restore();
    c.strokeStyle = K; c.lineWidth = 3; c.beginPath(); open(c); c.stroke();
    c.lineWidth = 1; c.beginPath(); c.moveTo(42, 256); c.lineTo(42, 98); c.quadraticCurveTo(46, 46, 96, 18); c.quadraticCurveTo(146, 46, 150, 98); c.lineTo(150, 256); c.stroke();
    // la poutre et les cloches
    const beam = [[34, 62], [158, 62], [158, 74], [34, 74]]; shape(c, beam, { smooth: false, fill: tone(110) }); c.fillStyle = P; for (let x = 44; x < 150; x += 17) c.fillRect(x, 67, 9, 1);
    seg(c, 60, 74, 60, 86, 2.4); seg(c, 132, 74, 132, 86, 2.4); seg(c, 96, 74, 96, 112, 2.4);
    for (const x of [60, 96, 132]) { const y0 = x === 96 ? 196 : 138, w = [[x, y0], [x + 2, 220], [x - 1, 256]]; line(c, w, 3.4); line(c, w, 1.2, P); }
    bell(c, 60, 90, 0.98); bell(c, 132, 90, 0.98); bell(c, 96, 116, 1.6, true);
    c.strokeStyle = P; c.lineWidth = 1; for (const k of [1, 2, 3]) { c.beginPath(); c.arc(96, 176, 40 + k * 8, 0.2, 0.6); c.stroke(); c.beginPath(); c.arc(96, 176, 40 + k * 8, Math.PI - 0.6, Math.PI - 0.2); c.stroke(); }
  });
  L.near((c) => { bat(c, 60, 40, 0.8, -0.2); bat(c, 20, 160, 0.6, 0.1); });
  L.pop((c) => bat(c, 176, 22, 1.15, 0.25));
};

// IV — La Tour
ART[4] = (L, r) => {
  L.bg((c) => { skyDay(c, r, 190); disc(c, 96, 74, 50, P, 1.5); rays(c, 96, 74, 54, 70, 40, { alt: 0.5 }); cloud(c, 28, 92, 56, r); cloud(c, 172, 116, 50, r); });
  L.far((c) => {
    const mt = [[-14, 196], [14, 160], [34, 176], [58, 140], [84, 182], [120, 168], [150, 136], [178, 170], [206, 150], [206, 260], [-14, 260]];
    shape(c, mt, { smooth: false, fill: tone(190) }); shade(c, mt, -14, 130, 220, 80, { ang: 1.0, gap: 4 }, false);
    land(c, [[-12, 214], [70, 206], [140, 212], [204, 204]], { fill: K, lw: 0 }); grass(c, r, 212, { n: 40, col: P, h: 6 });
  });
  L.main((c) => {
    const rock = [[40, 256], [52, 222], [70, 208], [96, 204], [124, 208], [142, 224], [152, 256]]; shape(c, rock); shade(c, rock, 100, 200, 60, 60, { ang: 0.9, gap: 3 });
    const tw = [[72, 210], [76, 70], [116, 70], [120, 210]]; shape(c, tw, { smooth: false });
    inside(c, pathOf(tw, false), () => { bricks(c, 70, 70, 54, 142, { bh: 10, bw: 18 }); hatch(c, 100, 70, 22, 142, { ang: 1.0, gap: 3 }); c.fillStyle = K; c.fillRect(113, 70, 9, 142); });
    // couronnement et tourelle
    const top = [[68, 70], [68, 56], [76, 56], [76, 62], [84, 62], [84, 56], [92, 56], [92, 62], [100, 62], [100, 56], [108, 56], [108, 62], [116, 62], [116, 56], [124, 56], [124, 70]];
    shape(c, top, { smooth: false }); shade(c, top, 104, 54, 22, 18, { ang: 1.0, gap: 2.5 }, false);
    shape(c, [[86, 56], [86, 34], [106, 34], [106, 56]], { smooth: false }); hatch(c, 97, 35, 8, 20, { ang: 1.0, gap: 2.5 });
    const roof = [[82, 35], [96, 6], [110, 35]]; shape(c, roof, { smooth: false, fill: K });
    seg(c, 88, 28, 92, 14, 1, P);
    // quatre fenêtres allumées
    for (const [x, y] of [[84, 84], [100, 112], [84, 142], [100, 172]]) { c.beginPath(); c.moveTo(x, y + 14); c.lineTo(x, y + 4); c.quadraticCurveTo(x + 4, y - 3, x + 8, y + 4); c.lineTo(x + 8, y + 14); c.closePath(); c.fillStyle = R; c.fill(); c.strokeStyle = K; c.lineWidth = 1.5; c.stroke(); c.fillStyle = K; c.fillRect(x + 3.5, y + 1, 1, 13); }
    c.fillStyle = K; c.beginPath(); c.moveTo(90, 210); c.lineTo(90, 196); c.quadraticCurveTo(96, 188, 102, 196); c.lineTo(102, 210); c.fill();
    // les ronces montent à l'assaut
    bramble(c, [[44, 250], [60, 214], [70, 170], [80, 128], [72, 96]], r, { lw: 3.5, n: 22, len: 7 });
    bramble(c, [[150, 250], [132, 214], [124, 176], [126, 140]], r, { lw: 3, n: 16, len: 6 });
  });
  L.near((c) => { bird(c, 40, 40, 1.2); bird(c, 150, 30, 1); bird(c, 136, 62, 0.8); bramble(c, [[-14, 224], [26, 238], [40, 262]], r, { lw: 4.5 }); bramble(c, [[206, 216], [172, 236], [164, 262]], r, { lw: 4.5 }); });
  L.pop((c) => raven(c, 174, 12, 0.95, -1));
};

// V — La Main de Gloire
ART[5] = (L, r) => {
  L.bg((c) => { c.fillStyle = K; c.fillRect(-B, -B, WW + 2 * B, WH + 2 * B); halo(c, 96, 96, 20, 150, 170, 0); burst(c, 96, 104, 70, 190, 32, P, 0.1, 0.16); });
  L.far((c) => { c.strokeStyle = P; c.lineWidth = 1; c.setLineDash([2, 3]); for (const rr of [62, 74]) { c.beginPath(); c.arc(96, 104, rr, 0, TAU); c.stroke(); } c.setLineDash([]); });
  const F = [[70, -0.2, 46], [85, -0.07, 58], [100, 0.04, 62], [115, 0.16, 50]]; // doigts : x, angle, longueur
  const tip = (x, a, l) => [x + Math.sin(a) * (l + 4), 122 - Math.cos(a) * (l + 4)];
  L.main((c) => {
    // la manchette
    const cuff = [[68, 186], [124, 186], [140, 256], [52, 256]]; shape(c, cuff, { smooth: false });
    inside(c, pathOf(cuff, false), () => { hatch(c, 98, 186, 44, 72, { ang: 1.0, gap: 3 }); c.fillStyle = K; c.fillRect(122, 186, 20, 72); for (let y = 198; y < 256; y += 14) c.fillRect(50, y, 92, 1.5); });
    c.fillStyle = K; for (const x of [62, 76, 90, 104]) for (let y = 205; y < 256; y += 14) c.fillRect(x + ((y / 14) | 0) % 2 * 3, y, 2, 2);
    // le dos de la main
    const back = [[62, 132], [128, 130], [126, 188], [66, 188]]; shape(c, back, { lw: 2 }); shade(c, back, 100, 128, 30, 62, { ang: 1.0, gap: 3 });
    // le pouce
    c.save(); c.translate(64, 170); c.rotate(-0.75);
    for (const [y, h] of [[-22, 22], [-42, 19]]) { const s = [[-7, y + h], [-7, y + 3], [0, y], [7, y + 3], [7, y + h]]; shape(c, s, { smooth: false, lw: 1.6 }); hatch(c, 1, y, 6, h, { ang: 1.0, gap: 2.5 }); }
    c.restore();
    // les doigts, phalange par phalange
    for (const [x, a, l] of F) {
      c.save(); c.translate(x, 124); c.rotate(a);
      let y = 0; for (const k of [0.4, 0.33, 0.27]) { const h = l * k, s = [[-6.5, y], [-6.5, y - h + 2], [-4, y - h], [4, y - h], [6.5, y - h + 2], [6.5, y]]; shape(c, s, { smooth: false, lw: 1.6 }); hatch(c, 1, y - h, 6, h, { ang: 1.0, gap: 2.5 }); y -= h; }
      disc(c, 0, 4, 8, P, 1.6); c.beginPath(); c.arc(0, 4, 8, -0.2, 1.4); c.lineWidth = 3; c.strokeStyle = K; c.stroke();
      c.restore();
    }
    // le sceau sur la main
    shape(c, [[96, 144], [108, 160], [96, 176], [84, 160]], { smooth: false, fill: R, lw: 1.6 }); disc(c, 96, 160, 4, G, 1);
  });
  L.near((c) => { for (const [x, a, l] of F) { const [fx, fy] = tip(x, a, l); flame(c, fx, fy + 2, 17 + (l - 46) * 0.3); } const [tx, ty] = [64 - Math.sin(0.75) * 44, 170 - Math.cos(0.75) * 44]; flame(c, tx, ty + 2, 14); });
  L.pop((c) => { for (const [x0, k] of [[58, 1], [130, -1]]) { line(c, [[x0, 30], [x0 + 5 * k, 14], [x0 - 3 * k, 0], [x0 + 4 * k, -12]], 3, K); line(c, [[x0, 30], [x0 + 5 * k, 14], [x0 - 3 * k, 0], [x0 + 4 * k, -12]], 1.2, P); } });
};

// VI — Le Calice
ART[6] = (L, r) => {
  L.bg((c) => { skyDay(c, r, 260, 7); rays(c, 96, 80, 50, 120, 36, { alt: 0.7 }); disc(c, 96, 80, 46, G, 2); disc(c, 96, 80, 38, null, 1); });
  L.far((c) => {
    for (const f of [0, 1]) {
      const X = (x) => (f ? 192 - x : x), cur = [[-14, -14], [34, -14], [30, 60], [16, 130], [22, 200], [10, 256], [-14, 256]].map(([x, y]) => [X(x), y]);
      shape(c, cur, { fill: K, lw: 0 });
      for (const k of [0, 1, 2]) line(c, [[2 + k * 9, -10], [4 + k * 7, 70], [-4 + k * 6, 150], [k * 5, 250]].map(([x, y]) => [X(x), y]), 1, P);
    }
    c.fillStyle = K; c.fillRect(-14, -14, 220, 16); c.fillStyle = G; for (let x = -8; x < 204; x += 8) disc(c, x, 5, 2.4, G, 0.8);
  });
  L.main((c) => {
    // le serpent, derrière la coupe
    const sA = [[166, 212], [146, 196], [120, 178], [92, 166]], sB = [[92, 166], [64, 146], [44, 116], [42, 86], [54, 66]];
    const body = (pts) => { line(c, pts, 11); line(c, pts, 7.5, P); c.setLineDash([1.6, 5]); line(c, pts, 7.5, K); c.setLineDash([]); };
    body(sB);
    // la coupe
    const pr = [[30, 80], [29, 100], [22, 120], [9, 132], [12, 142], [6, 151], [5, 172], [14, 184], [30, 194], [33, 202]];
    const cup = [...pr.map(([x, y]) => [96 + x, y]), ...pr.slice().reverse().map(([x, y]) => [96 - x, y])];
    shape(c, cup, { smooth: false }); shade(c, cup, 100, 78, 34, 126, { ang: 1.0, gap: 3 }, false);
    inside(c, pathOf(cup, false), () => { c.fillStyle = K; c.fillRect(118, 78, 12, 60); c.fillRect(66, 104, 60, 1.5); c.fillRect(66, 112, 60, 1.5); });
    for (let x = 72; x < 122; x += 9) disc(c, x, 108.5, 2, G, 0.8);
    disc(c, 96, 142, 5, G, 1.4);
    c.beginPath(); c.ellipse(96, 80, 30, 6, 0, 0, TAU); c.fillStyle = R; c.fill(); c.strokeStyle = K; c.lineWidth = 2; c.stroke();
    // six gouttes
    for (const [x, y, s] of [[70, 92, 1], [124, 96, 0.9], [66, 116, 0.8], [58, 150, 1], [136, 136, 0.9], [130, 170, 0.8]]) { c.beginPath(); c.moveTo(x, y - 6 * s); c.quadraticCurveTo(x + 4.5 * s, y + 2 * s, x, y + 4 * s); c.quadraticCurveTo(x - 4.5 * s, y + 2 * s, x, y - 6 * s); c.fillStyle = R; c.fill(); c.strokeStyle = K; c.lineWidth = 1; c.stroke(); }
    // le serpent repasse devant le pied et dresse la tête
    body(sA);
    shape(c, [[48, 70], [54, 54], [72, 50], [84, 58], [74, 68], [58, 74]], { lw: 2 }); disc(c, 70, 57, 1.8, K); seg(c, 60, 62, 78, 62, 1);
    line(c, [[84, 59], [92, 58], [97, 54]], 1.3, R); line(c, [[92, 58], [98, 61]], 1.3, R);
  });
  L.near((c) => {
    c.fillStyle = K; c.fillRect(-14, 204, 220, 54); c.fillStyle = P; c.fillRect(-14, 208, 220, 1.5);
    for (let x = -10; x < 204; x += 7) { c.fillStyle = G; c.fillRect(x, 214, 2, 8); }
    c.fillStyle = P; for (let x = -10; x < 204; x += 14) c.fillRect(x, 228, 8, 1);
  });
  L.pop((c) => { for (const [x, y, s] of [[20, 236, 1.5], [170, 228, 1.2]]) { c.beginPath(); c.moveTo(x, y - 7 * s); c.quadraticCurveTo(x + 5 * s, y + 2 * s, x, y + 4.5 * s); c.quadraticCurveTo(x - 5 * s, y + 2 * s, x, y - 7 * s); c.fillStyle = R; c.fill(); c.strokeStyle = K; c.lineWidth = 1.4; c.stroke(); } });
};

// VII — Le Septième Sceau
function wing(c, x, y, f) {
  c.save(); c.translate(x, y); c.scale(f, 1);
  const row = (n, a0, a1, l0, l1, w) => { for (let i = 0; i < n; i++) { const a = a0 + ((a1 - a0) * i) / (n - 1), l = l0 + ((l1 - l0) * i) / (n - 1); c.save(); c.rotate(a); c.beginPath(); c.moveTo(0, -w * 0.3); c.lineTo(l - w / 2, -w / 2); c.arc(l - w / 2, 0, w / 2, -Math.PI / 2, Math.PI / 2); c.lineTo(0, w * 0.3); c.closePath(); c.fillStyle = P; c.fill(); c.strokeStyle = K; c.lineWidth = 1.5; c.stroke(); c.fillStyle = K; c.fillRect(l * 0.3, -0.5, l * 0.55, 1); c.restore(); } };
  row(7, 0.5, -1.2, 74, 98, 13); row(6, 0.4, -1.05, 50, 64, 12); row(5, 0.3, -0.9, 30, 38, 11);
  c.restore();
}
ART[7] = (L, r) => {
  L.bg((c) => { c.fillStyle = K; c.fillRect(-B, -B, WW + 2 * B, WH + 2 * B); halo(c, 96, 100, 30, 150, 190, 0); burst(c, 96, 100, 78, 200, 14, G, -Math.PI / 2, 0.12); c.fillStyle = P; for (let i = 0; i < 40; i++) c.fillRect((r() * 216 - 12) | 0, (r() * 264 - 12) | 0, 1, 1); });
  L.far((c) => { wing(c, 122, 110, 1); wing(c, 70, 110, -1); });
  L.main((c) => {
    // le livre
    c.fillStyle = K; c.fillRect(56, 62, 10, 104);
    shape(c, [[62, 62], [132, 62], [132, 164], [62, 164]], { smooth: false, lw: 2.5 });
    hatch(c, 104, 64, 27, 98, { ang: 1.0, gap: 3 }); c.fillStyle = P; c.fillRect(70, 70, 54, 86); box(c, 70, 70, 54, 86, 1.5); box(c, 74, 74, 46, 78, 1);
    for (const [x, y] of [[66, 66], [128, 66], [66, 160], [128, 160]]) disc(c, x, y, 3.2, G, 1);
    c.fillStyle = P; for (const y of [72, 92, 112, 132, 152]) c.fillRect(57, y, 8, 1.5);
    shape(c, [[97, 78], [119, 113], [97, 148], [75, 113]], { smooth: false, fill: K, lw: 0 });
    line(c, [[84, 105], [88.5, 122], [93, 105]], 2.4, P, false); seg(c, 98.5, 105, 98.5, 122, 2.4, P); seg(c, 104.5, 105, 104.5, 122, 2.4, P);
    c.fillStyle = P; c.fillRect(81, 103, 27, 1.5); c.fillRect(95, 122.5, 13, 1.5);
    c.fillStyle = K; c.fillRect(132, 96, 8, 6); c.fillRect(132, 126, 8, 6);
    // sept rubans, sept sceaux
    [[68, 30, 6.5], [78, 50, 7], [88, 36, 6.5], [97, 64, 10], [107, 40, 6.5], [117, 52, 7], [127, 28, 6.5]].forEach(([x, l, s], i) => {
      const w = [[x, 164], [x + (i % 2 ? 2 : -2), 164 + l * 0.5], [x, 164 + l]];
      line(c, w, 4); line(c, w, 2, P);
      disc(c, x, 164 + l + s - 1, s, R, 1.6); c.fillStyle = K; c.fillRect(x - 0.5, 164 + l + s - 1 - s * 0.5, 1.5, s); c.fillRect(x - s * 0.5, 164 + l + s - 1.5, s, 1.5);
    });
  });
  L.near((c) => { c.fillStyle = P; for (let i = 0; i < 16; i++) { const x = r() * 192, y = 150 + r() * 100; c.fillRect(x | 0, y | 0, 2, 2); } });
  L.pop((c) => { candle(c, 13, 247, 46, 11, 15); candle(c, 179, 247, 34, 11, 15); });
};

// VIII — La Herse
ART[8] = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 70 }); disc(c, 150, 8, 17, P); for (const [x, y, s] of [[145, 5, 4], [156, 13, 3.4], [154, 1, 2]]) disc(c, x, y, s, tone(150)); });
  L.far((c) => {
    
  });
  L.main((c) => {
    const open = (q) => { q.moveTo(50, 256); q.lineTo(50, 132); q.quadraticCurveTo(54, 84, 96, 60); q.quadraticCurveTo(138, 84, 142, 132); q.lineTo(142, 256); q.closePath(); };
    // ce qui se tient derrière la herse
    inside(c, open, () => {
      const g = c.createLinearGradient(0, 60, 0, 250); g.addColorStop(0, tone(0)); g.addColorStop(0.6, tone(40)); g.addColorStop(1, tone(190)); c.fillStyle = g; c.fillRect(40, 50, 112, 210);
      shape(c, [[96, 176], [104, 184], [108, 204], [116, 256], [76, 256], [84, 204], [88, 184]], { fill: K, lw: 0 });
      c.fillStyle = R; c.fillRect(91, 187, 3, 2); c.fillRect(98, 187, 3, 2);
      // huit barreaux, à demi levés
      for (let i = 0; i < 8; i++) { const x = 55 + i * 11.6; c.fillStyle = K; c.fillRect(x - 2.5, 50, 5, 118); c.fillStyle = P; c.fillRect(x - 1.5, 50, 1, 116); shape(c, [[x - 3.5, 166], [x + 3.5, 166], [x, 180]], { smooth: false, fill: K, stroke: P, lw: 1 }); }
      for (const y of [92, 118, 144]) { c.fillStyle = K; c.fillRect(48, y, 96, 5); c.fillStyle = P; c.fillRect(48, y + 1, 96, 1); }
    });
    // le mur
    c.save(); c.beginPath(); c.rect(-14, 44, 220, 220); open(c); c.clip('evenodd');
    c.fillStyle = P; c.fillRect(-14, 44, 220, 220); bricks(c, -14, 44, 220, 220, { bh: 12, bw: 26 });
    hatch(c, 142, 44, 30, 220, { ang: 0.9, gap: 3 }); c.fillStyle = K; c.fillRect(168, 44, 40, 220); hatch(c, -14, 44, 30, 220, { ang: 0.9, gap: 5 });
    c.restore();
    for (let x = -12; x < 204; x += 22) { c.fillStyle = P; c.fillRect(x, 30, 14, 16); box(c, x, 30, 14, 16, 1.5); } c.fillStyle = K; c.fillRect(-14, 44, 220, 2);
    c.strokeStyle = K; c.lineWidth = 3; c.beginPath(); open(c); c.stroke();
    for (let i = 0; i <= 10; i++) { const a = Math.PI + (i / 10) * Math.PI, x = 96 + Math.cos(a) * 46, y = 120 + Math.sin(a) * 62; seg(c, x, y, 96 + Math.cos(a) * 58, 120 + Math.sin(a) * 76, 1.2); }
    c.strokeStyle = K; c.lineWidth = 1.5; c.beginPath(); c.moveTo(38, 256); c.lineTo(38, 130); c.quadraticCurveTo(42, 70, 96, 44); c.quadraticCurveTo(150, 70, 154, 130); c.lineTo(154, 256); c.stroke();
    // chaînes
    for (const f of [-1, 1]) for (let i = 0; i < 12; i++) { c.strokeStyle = K; c.lineWidth = 1.4; c.beginPath(); c.ellipse(96 + f * (64 + i * 2.2), 60 + i * 15, i % 2 ? 1.5 : 3, 5, f * 0.14, 0, TAU); c.fillStyle = P; c.fill(); c.stroke(); }
  });
  L.near((c) => {
    shape(c, [[30, 232], [162, 232], [206, 262], [-14, 262]], { smooth: false, fill: tone(205) });
    c.fillStyle = K; for (let i = 0; i < 9; i++) { const k = i / 8; seg(c, 30 + k * 132, 232, -14 + k * 220, 262, 1.2); } c.fillRect(-14, 244, 220, 1.5);
    for (const x of [22, 170]) { c.fillStyle = K; c.fillRect(x - 2, 150, 4, 24); c.fillRect(x - 6, 146, 12, 5); flame(c, x, 146, 22); }
  });
};

// IX — Le Glaive
ART[9] = (L, r) => {
  L.bg((c) => { skyDay(c, r, 200); rays(c, 96, 66, 26, 150, 48, { alt: 0.72 }); cloud(c, 34, 124, 70, r); cloud(c, 160, 110, 64, r); cloud(c, 150, 60, 40, r); cloud(c, 24, 58, 36, r); });
  L.far((c) => {
    land(c, [[-12, 190], [50, 176], [110, 184], [204, 170]], { fill: tone(196), lw: 2 }); inside(c, (q) => q.rect(-14, 160, 220, 100), () => hatch(c, -14, 176, 220, 50, { ang: 0.4, gap: 5 }));
    c.fillStyle = K; for (const [x, y, s] of [[12, 180, 1], [34, 174, 0.8], [58, 172, 1], [136, 176, 0.9], [156, 172, 1.1], [178, 168, 0.8], [190, 172, 1], [78, 176, 0.7], [118, 180, 0.7]]) { c.fillRect(x, y - 12 * s, 2, 14 * s); c.fillRect(x - 3 * s, y - 8 * s, 2 + 6 * s, 2); }
  });
  L.near((c) => {
    land(c, [[-12, 218], [40, 206], [96, 200], [152, 206], [204, 216]], { fill: K, lw: 0 });
    [[18, 226, 1.2, -0.2], [44, 216, 1.1, 0.2], [150, 216, 1.15, -0.25], [176, 226, 1.2, 0.15], [30, 246, 1.3, 0.3], [164, 246, 1.3, -0.2], [70, 222, 1.1, -0.1], [124, 222, 1.1, 0.25]].forEach(([x, y, s, a]) => skull(c, x, y, s, a));
    grass(c, r, 208, { n: 30, col: P, h: 6 });
  });
  L.pop((c) => {
    // la lame
    const bl = [[88, 26], [104, 26], [103, 180], [96, 204], [89, 180]]; shape(c, bl, { smooth: false });
    inside(c, pathOf(bl, false), () => { hatch(c, 96, 26, 9, 180, { ang: 1.05, gap: 3 }); c.fillStyle = K; c.fillRect(95.5, 26, 1, 168); });
    // la garde, la fusée, le pommeau
    shape(c, [[58, 16], [66, 20], [126, 20], [134, 16], [136, 24], [126, 28], [66, 28], [56, 24]], { smooth: false, lw: 1.8 }); hatch(c, 98, 20, 36, 8, { ang: 1.0, gap: 2.5 });
    c.fillStyle = K; c.fillRect(91, -2, 10, 20); c.fillStyle = P; for (let y = 0; y < 17; y += 4) c.fillRect(91, y, 10, 1);
    disc(c, 96, -8, 7, G, 1.8); disc(c, 96, -8, 2.5, K);
    // la ronce et sa rose
    const vine = [[80, 196], [112, 170], [82, 140], [110, 110], [84, 82], [108, 54]];
    bramble(c, vine, rng(91), { lw: 2.6, n: 26, len: 6 });
    for (const [x, y] of [[112, 52], [108, 58], [116, 58]]) disc(c, x, y, 5, R, 1.2); disc(c, 112, 56, 2.2, K);
    // les neuf crânes : celui-ci garde la pointe
    skull(c, 96, 214, 1.55, 0.05);
  });
};

// X — La Roue
ART[10] = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 130, y0: 120 }); disc(c, 160, 40, 15, P); disc(c, 154, 36, 13, K); });
  L.far((c) => {
    land(c, [[-12, 206], [40, 190], [110, 202], [160, 186], [204, 198]], { fill: K, lw: 0 });
    c.fillStyle = K; for (const [x, y] of [[150, 188], [36, 192]]) { c.fillRect(x, y - 26, 2, 28); c.fillRect(x, y - 26, 12, 2); c.fillRect(x + 10, y - 26, 1, 8); disc(c, x + 10.5, y - 15, 2, K); }
    line(c, [[-12, 206], [40, 190], [110, 202], [160, 186], [204, 198]], 1, P);
  });
  L.main((c) => {
    const pole = [[91, 260], [92, 100], [100, 100], [102, 260]]; shape(c, pole, { smooth: false }); shade(c, pole, 97, 100, 6, 160, { ang: 1.2, gap: 2.5 }, false);
    // la roue : jante, dix rais, moyeu
    c.save(); c.translate(96, 92); c.scale(0.93, 0.88);
    disc(c, 0, 0, 56, P, 2.5); disc(c, 0, 0, 45, K, 0);
    inside(c, (q) => { q.arc(0, 0, 56, 0, TAU); q.arc(0, 0, 45, 0, TAU, true); }, () => hatch(c, 2, -58, 58, 116, { ang: 1.0, gap: 3 }));
    disc(c, 0, 0, 45, tone(26), 2);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + 0.16; c.save(); c.rotate(a); c.fillStyle = P; c.fillRect(8, -2.6, 38, 5.2); box(c, 8, -2.6, 38, 5.2, 1.2); c.restore(); }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + 0.16 + TAU / 20; disc(c, Math.cos(a) * 50.5, Math.sin(a) * 50.5, 1.6, K); }
    disc(c, 0, 0, 10, P, 2); disc(c, 0, 0, 5, G, 1.4);
    c.restore();
    // haillons et cordes
    for (const [x, y, l] of [[54, 112, 30], [132, 120, 24], [72, 134, 18]]) { const g = [[x, y], [x + 4, y + l * 0.5], [x - 2, y + l], [x - 8, y + l * 0.6], [x - 6, y + 4]]; shape(c, g, { lw: 1.4 }); shade(c, g, x - 9, y, 14, l + 2, { ang: 1.3, gap: 2.5 }); }
    
    skull(c, 78, 238, 1.3, -0.25); line(c, [[100, 244], [126, 236]], 4); line(c, [[100, 244], [126, 236]], 2, P);
  });
  L.near((c) => { land(c, [[-12, 244], [60, 236], [130, 242], [204, 234]], { fill: K, lw: 0 }); grass(c, r, 244, { n: 70, col: K, h: 22 }); grass(c, r, 246, { n: 40, col: P, h: 9 }); });
  L.pop((c) => raven(c, 100, 45, 1.08, -1, true));
};

// XI — Le Heaume
ART[11] = (L, r) => {
  L.bg((c) => { skyDay(c, r, 260, 7); disc(c, 96, 104, 74, R, 2.5); rays(c, 96, 104, 80, 150, 44, { alt: 0.6 }); });
  L.far((c) => { cloud(c, 24, 196, 66, r); cloud(c, 170, 204, 60, r); });
  L.main((c) => {
    // camail et spalières
    const av = [[60, 150], [132, 150], [176, 256], [16, 256]]; shape(c, av, { smooth: false });
    inside(c, pathOf(av, false), () => { c.strokeStyle = K; c.lineWidth = 1; for (let y = 152, j = 0; y < 260; y += 4, j++) for (let x = 10 + (j % 2) * 3; x < 184; x += 6) { c.beginPath(); c.arc(x, y, 3, 0, Math.PI); c.stroke(); } hatch(c, 120, 150, 60, 110, { ang: 1.0, gap: 3 }); });
    for (const f of [0, 1]) { const X = (x) => (f ? 192 - x : x), pa = [[-14, 256], [-14, 214], [6, 198], [34, 200], [52, 222], [56, 256]].map(([x, y]) => [X(x), y]); shape(c, pa); shade(c, pa, f ? 150 : 20, 196, 40, 62, { ang: 1.0, gap: 3 }); for (const [x, y] of [[4, 212], [26, 210], [44, 228]]) disc(c, X(x), y, 2, K); line(c, [[-12, 234], [20, 226], [54, 240]].map(([x, y]) => [X(x), y]), 1.2); }
  });
  L.pop((c) => {
    // les bois
    for (const f of [0, 1]) {
      const X = (x) => (f ? 192 - x : x), an = (pts, w) => { const q = pts.map(([x, y]) => [X(x), y]); line(c, q, w + 3); line(c, q, w, P); };
      an([[70, 56], [50, 40], [36, 16], [32, -9]], 6.5); an([[52, 42], [30, 40], [14, 26]], 4.5); an([[40, 24], [54, 10], [57, -7]], 4.5); an([[34, 6], [20, 0], [13, -9]], 4);
    }
    // le heaume
    const hm = [[96, 38], [120, 48], [132, 78], [134, 148], [96, 176], [58, 148], [60, 78], [72, 48]]; shape(c, hm, { lw: 2.5 });
    inside(c, pathOf(hm), () => { hatch(c, 104, 36, 34, 142, { ang: 1.0, gap: 3 }); c.fillStyle = K; c.fillRect(124, 36, 14, 142); });
    // la croix de laiton, les fentes, les trous
    c.fillStyle = G; c.fillRect(92.5, 40, 7, 132); c.fillRect(62, 92, 68, 7); box(c, 92.5, 40, 7, 132, 1.2); box(c, 61, 92, 70, 7, 1.2);
    c.fillStyle = K; c.fillRect(66, 86, 25, 4); c.fillRect(101, 86, 25, 4);
    for (const y of [50, 70, 110, 130, 150]) disc(c, 96, y, 1.4, K); for (const x of [68, 80, 112, 124]) disc(c, x, 95.5, 1.4, K);
    c.fillStyle = K; for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) { c.fillRect(70 + i * 6 + (j % 2) * 3, 112 + j * 7, 2, 2); c.fillRect(106 + i * 6 + (j % 2) * 3, 112 + j * 7, 2, 2); }
    line(c, [[62, 148], [96, 172], [130, 148]], 1.2, K, false); for (const [x, y] of [[66, 142], [78, 152], [114, 152], [126, 142]]) disc(c, x, y, 1.4, K);
  });
};

// XII — La Couronne
ART[12] = (L, r) => {
  L.bg((c) => { c.fillStyle = K; c.fillRect(-B, -B, WW + 2 * B, WH + 2 * B); halo(c, 96, 96, 40, 140, 200, 0); c.fillStyle = P; for (let i = 0; i < 60; i++) c.fillRect((r() * 216 - 12) | 0, (r() * 264 - 12) | 0, 1, 1); });
  L.far((c) => { for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU - Math.PI / 2, x = 96 + Math.cos(a) * 84, y = 100 + Math.sin(a) * 84; burst(c, x, y, 2.5, 8, 4, G, Math.PI / 4, 0.5); } rays(c, 96, 100, 96, 150, 24, { col: P, alt: 0.5 }); });
  L.main((c) => {
    // le manteau d'hermine
    const mt = [[-14, 256], [-14, 222], [30, 196], [70, 186], [122, 186], [162, 196], [206, 222], [206, 256]]; shape(c, mt);
    c.fillStyle = K; for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++) { const x = -4 + i * 24 + (j % 2) * 12, y = 206 + j * 13; c.fillRect(x, y, 2, 6); c.fillRect(x - 2, y + 4, 6, 2); }
    shape(c, [[70, 186], [96, 214], [122, 186], [112, 180], [96, 196], [80, 180]], { fill: K, lw: 0, smooth: false });
    shape(c, [[96, 198], [106, 210], [96, 222], [86, 210]], { smooth: false, fill: R, lw: 1.6 }); disc(c, 96, 210, 3, G, 0.8);
  });
  L.pop((c) => {
    // le crâne
    const sk = [[96, 38], [134, 54], [142, 92], [132, 122], [120, 136], [116, 160], [96, 170], [76, 160], [72, 136], [60, 122], [50, 92], [58, 54]]; shape(c, sk, { lw: 2.5 });
    inside(c, pathOf(sk), () => { hatch(c, 118, 40, 30, 130, { ang: 1.0, gap: 3 }); hatch(c, 46, 96, 18, 40, { ang: -1.0, gap: 3 }); });
    shape(c, [[66, 96], [76, 86], [90, 90], [92, 104], [84, 114], [70, 110]], { fill: K, lw: 0 }); shape(c, [[126, 96], [116, 86], [102, 90], [100, 104], [108, 114], [122, 110]], { fill: K, lw: 0 });
    c.fillStyle = R; c.fillRect(80, 100, 3, 3); c.fillRect(110, 100, 3, 3);
    shape(c, [[96, 112], [103, 128], [96, 125], [89, 128]], { fill: K, lw: 0, smooth: false });
    c.fillStyle = P; c.fillRect(78, 138, 36, 14); box(c, 78, 138, 36, 14, 1.4); c.fillStyle = K; c.fillRect(78, 144.5, 36, 1.2); for (let x = 84; x < 112; x += 6) c.fillRect(x, 138, 1.2, 14);
    line(c, [[70, 124], [76, 134]], 1.2); line(c, [[122, 124], [116, 134]], 1.2); line(c, [[104, 44], [100, 56], [106, 64]], 1.1);
    // la couronne brisée
    c.save(); c.translate(96, 50); c.rotate(-0.1);
    const cr = [[-46, 8], [-48, -14], [-36, -4], [-28, -34], [-18, -6], [-9, -18], [0, -52], [9, -6], [20, -22], [26, -8], [36, -30], [40, -4], [48, -14], [46, 8]];
    shape(c, cr, { smooth: false, fill: G, lw: 2 });
    c.fillStyle = K; c.fillRect(-47, 0, 94, 2); for (const [x, y] of [[-28, -36], [0, -55], [36, -32]]) disc(c, x, y, 3.4, G, 1.4);
    for (const x of [-32, -11, 11, 32]) shape(c, [[x, -1.5], [x + 4, 4], [x, 9.5], [x - 4, 4]], { smooth: false, fill: R, lw: 1 });
    c.restore();
  });
  L.near((c) => { bramble(c, [[-14, 180], [14, 200], [22, 236], [10, 262]], r, { lw: 4, col: K }); bramble(c, [[206, 176], [178, 200], [172, 236], [184, 262]], r, { lw: 4, col: K }); });
};

// ── le cadre de la carte ─────────────────────────────────────
function paper(c) { const g = c.createRadialGradient(CW / 2, CH / 2, 80, CW / 2, CH / 2, 220); g.addColorStop(0, tone(247)); g.addColorStop(1, tone(212)); c.fillStyle = g; c.fillRect(0, 0, CW, CH); }
function frame(c, v, title = NAMES[v]) {
  paper(c);
  c.clearRect(WX, WY, WW, WH);
  box(c, 5, 5, CW - 10, CH - 10, 3); box(c, 10, 10, CW - 20, CH - 20, 1);
  box(c, WX - 2, WY - 2, WW + 4, WH + 4, 2);
  // cartouche du titre
  c.fillStyle = P; c.fillRect(WX - 2, 264, WW + 4, 48); box(c, WX - 2, 264, WW + 4, 48, 2); box(c, WX + 2, 268, WW - 4, 40, 1);
  c.fillStyle = K; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  let fs = 25; c.font = `700 ${fs}px Grenze`; while (c.measureText(title).width > WW - 34 && fs > 14) c.font = `700 ${--fs}px Grenze`;
  c.fillText(title, CW / 2, 294);
  // fleuron sous le titre (un texte si petit ne survivrait pas à la trame)
  c.fillRect(CW / 2 - 30, 301, 22, 1.5); c.fillRect(CW / 2 + 8, 301, 22, 1.5);
  for (const dx of [-5, 0, 5]) shape(c, [[CW / 2 + dx, 299], [CW / 2 + dx + 2, 301.5], [CW / 2 + dx, 304], [CW / 2 + dx - 2, 301.5]], { smooth: false, fill: dx ? K : G, lw: 0.8 });
  for (const x of [WX + 10, CW - WX - 10]) shape(c, [[x, 283], [x + 4, 288], [x, 293], [x - 4, 288]], { smooth: false, fill: R, lw: 1 });
  for (const [x, y] of [[CW / 2, 7.5], [CW / 2, CH - 7.5], [7.5, CH / 2], [CW - 7.5, CH / 2]]) shape(c, [[x, y - 4], [x + 4, y], [x, y + 4], [x - 4, y]], { smooth: false, fill: G, lw: 1 });
}
// l'onglet du rang : toujours au-dessus de tout, pour rester lisible
function tab(c, v) {
  if (!isNum(v)) { if (v[0] !== 'm' && v !== 'x2') return; v = keyLabel(v); }
  const tw = String(v).length > 1 ? 14 + String(v).length * 18 : 38;
  c.fillStyle = P; c.fillRect(WX - 2, WY - 2, tw, 44); box(c, WX - 2, WY - 2, tw, 44, 2);
  c.fillStyle = K; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = '700 38px Grenze'; c.fillText(String(v), WX - 2 + tw / 2, WY + 31);
}

// ── tramage d'un calque : chaque point devient vide / encre / papier / rouille / or ──
function encode(cv) {
  const w = cv.width, h = cv.height, d = cv.getContext('2d').getImageData(0, 0, w, h).data, o = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < o.length; i++, p += 4) {
    if (d[p + 3] < 110) continue;
    const r = d[p], g = d[p + 1], b = d[p + 2];
    if (r > 150 && g < 110 && b < 110) o[i] = 3;
    else if (r > 170 && g > 110 && b < 100) o[i] = 4;
    else if (b - r > 36) o[i] = r / 255 > (bayer(i % w, (i / w) | 0) + 0.5) / 64 ? 2 : 1;
    else o[i] = r + g + b < 384 ? 1 : 2;
  }
  return o;
}
function ctxOf(cv) { const c = cv.getContext('2d', { willReadFrequently: true }); c.lineJoin = c.lineCap = 'round'; return c; }

/** Clé d'une carte : rang 0–12, ou 'freeze' / 'three' / 'chance' / 'm2'…'m10' / 'x2'. */
export const cardKey = (c) => (c == null ? 0 : typeof c !== 'object' ? c : c.t === 'n' ? c.v : c.t === 'a' ? c.a : c.t === 'm' ? 'm' + c.v : 'x2');
export const isNum = (k) => typeof k === 'number';
/** libellé court (onglet, table) */
export const keyLabel = (k) => (isNum(k) ? String(k) : k[0] === 'm' ? '+' + k.slice(1) : k === 'x2' ? '×2' : { freeze: 'Gel', three: 'Trois', chance: 'Sursis' }[k]);
const faces = new Map();
const hexABGR0 = (h) => { const n = parseInt(h.slice(1), 16); return (0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; };
/** Les decks : noms, encres et gravures. Le 0 est celui du chevalier ; d'autres s'inscrivent avec registerDeck. */
export const DECKS = [];
export function registerDeck(i, d) { DECKS[i] = { ...(DECKS[i] || {}), ...d, lut: d.colors.map(hexABGR0) }; }
/** Carte complète (v = rang 0–12 ; plain = sans gravure, pour les rangs pas encore gagnés ; deck = numéro du deck). */
export function cardFace(v, plain = false, deck = 0) {
  const D = DECKS[deck] || DECKS[0], key = deck + ':' + v + (plain ? 'p' : '');
  if (faces.has(key)) return faces.get(key);
  const wx = D.win?.x ?? WX, wy = D.win?.y ?? WY, fr = D.frame || frame, tb = D.tab || tab;
  const seed = isNum(v) ? v : [...String(v)].reduce((a, ch) => a + ch.charCodeAt(0), 40);
  const layers = [], r = rng(seed * 7919 + 13 + deck * 101);
  const art = (z, fn) => { const cv = mk(WW + 2 * B, WH + 2 * B), c = ctxOf(cv); c.translate(B, B); fn(c); layers.push({ z, x: wx - B, y: wy - B, w: cv.width, h: cv.height, clip: true, cx: wx, cy: wy, d: encode(cv) }); };
  const full = (z, fn) => { const cv = mk(CW, CH), c = ctxOf(cv); fn(c); layers.push({ z, x: 0, y: 0, w: CW, h: CH, clip: false, d: encode(cv) }); };
  let pop = null;
  if (plain) {
    art(-0.6, (c) => { c.fillStyle = K; c.fillRect(-B, -B, WW + 2 * B, WH + 2 * B); halo(c, 96, 120, 10, 150, 215, 0); burst(c, 96, 120, 84, 200, 24, P, 0, 0.1); });
    art(0.5, (c) => { c.font = `700 ${v > 9 ? 150 : 190}px Grenze`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 10; c.strokeStyle = P; c.strokeText(String(v), 96, 126); c.fillStyle = K; c.fillText(String(v), 96, 126); });
    full(0, (c) => fr(c, v, 'À gagner'));
  } else {
    const L = { bg: (f) => art(-1, f), far: (f) => art(-0.5, f), main: (f) => art(0.3, f), near: (f) => art(0.85, f), pop: (f) => { pop = f; } };
    if (isNum(v)) D.art[v](L, r);
    else if (v[0] === 'm') D.sart.mod(L, r, +v.slice(1));
    else D.sart[v](L, r);
    full(0, (c) => fr(c, v, D.names[v] ?? (v[0] === 'm' ? D.names.mod + ' +' + v.slice(1) : '?')));
    if (pop) full(1.3, (c) => { c.translate(wx, wy); pop(c); });
  }
  full(0, (c) => tb(c, v));
  const face = { v, plain, layers, lut: D.lut, deck };
  faces.set(key, face);
  return face;
}

/** Assemble les calques dans `out` (codes 0–4), décalés selon l'inclinaison (tx, ty ∈ [-1, 1]). */
export function compose(face, out, tx = 0, ty = 0, depth = 7, hidden = null) {
  out.fill(face.fill ?? 2);
  for (const L of face.layers) {
    if (hidden && L.id && hidden.has(L.id)) continue;
    const dx = Math.round(L.z * tx * depth), dy = Math.round(L.z * ty * depth);
    const cx = L.cx ?? WX, cy = L.cy ?? WY;
    const x0 = L.clip ? cx : Math.max(0, L.x + dx), x1 = L.clip ? cx + WW : Math.min(CW, L.x + dx + L.w), y0 = L.clip ? cy : Math.max(0, L.y + dy), y1 = L.clip ? cy + WH : Math.min(CH, L.y + dy + L.h);
    for (let y = y0; y < y1; y++) { const sy = y - L.y - dy; if (sy < 0 || sy >= L.h) continue; const ro = sy * L.w - L.x - dx, oo = y * CW; for (let x = x0; x < x1; x++) { const q = L.d[ro + x]; if (q) out[oo + x] = q; } }
  }
  return out;
}
const hexABGR = (h) => { const n = parseInt(h.slice(1), 16); return (0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; };
export const LUT = COLORS.map(hexABGR);
export function paint(codes, cv = mk(CW, CH), lut = LUT) {
  const c = cv.getContext('2d'), img = c.createImageData(CW, CH), b = new Uint32Array(img.data.buffer);
  for (let i = 0; i < b.length; i++) b[i] = lut[codes[i]];
  c.putImageData(img, 0, 0); return cv;
}
const flat = new Map();
/** Carte à plat (image fixe) : pour le deck, les miniatures. */
export function cardCanvas(v, plain = false, deck = 0) { const k = deck + ':' + v + (plain ? 'p' : ''); if (!flat.has(k)) { const f = cardFace(v, plain, deck); flat.set(k, paint(compose(f, new Uint8Array(CW * CH)), mk(CW, CH), f.lut)); } return flat.get(k); }

/** Face « de table » : le chiffre en très grand (lisible de loin), la gravure en rappel dessous. */
export function tableCanvas(v, plain = false, deck = 0) {
  const D = DECKS[deck] || DECKS[0], cv = mk(CW, CH), c = ctxOf(cv), I = D.colors[1], Pp = D.colors[2];
  c.fillStyle = I; c.fillRect(0, 0, CW, CH);
  const wx = D.win?.x ?? WX, wy = D.win?.y ?? WY;
  if (!plain) c.drawImage(cardCanvas(v, false, deck), wx + 6, wy + 50, WW - 12, 150, 9, 178, CW - 18, 141);
  else { c.fillStyle = Pp; c.font = '700 34px Grenze'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('à gagner', CW / 2, 248); }
  const lab = keyLabel(v), act = !isNum(v);
  c.fillStyle = act ? D.colors[v[0] === 'm' || v === 'x2' ? 4 : 3] : Pp; c.fillRect(7, 7, CW - 14, 164);
  c.fillStyle = I; c.textAlign = 'center'; c.textBaseline = 'middle';
  let fs = act ? 120 : lab.length > 1 ? 150 : 176; c.font = `700 ${fs}px Grenze`; while (c.measureText(lab).width > CW - 30) c.font = `700 ${(fs -= 6)}px Grenze`;
  c.fillText(lab, CW / 2, 96);
  return cv;
}
/** Dos des cartes. */
export function backCanvas(deck = 0) {
  const fk = 'back' + deck;
  if (flat.has(fk)) return flat.get(fk);
  const cv = mk(CW, CH), c = ctxOf(cv);
  c.fillStyle = K; c.fillRect(0, 0, CW, CH);
  const g = c.createRadialGradient(CW / 2, CH / 2, 20, CW / 2, CH / 2, 200); g.addColorStop(0, tone(120)); g.addColorStop(1, tone(10)); c.fillStyle = g; c.fillRect(12, 12, CW - 24, CH - 24);
  c.save(); c.beginPath(); c.rect(12, 12, CW - 24, CH - 24); c.clip(); c.strokeStyle = K; c.lineWidth = 1.5; for (let d = -CH; d < CW + CH; d += 12) { seg(c, d, 0, d + CH, CH, 1.5); seg(c, d, 0, d - CH, CH, 1.5); } c.restore();
  box(c, 5, 5, CW - 10, CH - 10, 3, P); box(c, 11, 11, CW - 22, CH - 22, 1, P);
  disc(c, CW / 2, CH / 2, 62, K, 3, P); disc(c, CW / 2, CH / 2, 54, null, 1, P);
  for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k * TAU) / 7; disc(c, CW / 2 + Math.cos(a) * 76, CH / 2 + Math.sin(a) * 76, 5, R, 1.5, P); }
  if ((DECKS[deck] || DECKS[0]).backMark) (DECKS[deck] || DECKS[0]).backMark(c); else if (deck === 1) { skull(c, CW / 2, CH / 2 + 2, 2.6); } else { c.fillStyle = P; c.font = '400 74px Jacquard'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('VII', CW / 2, CH / 2 + 4); }
  for (const [x, y] of [[20, 20], [CW - 20, 20], [20, CH - 20], [CW - 20, CH - 20]]) shape(c, [[x, y - 6], [x + 6, y], [x, y + 6], [x - 6, y]], { smooth: false, fill: G, lw: 1, stroke: P });
  const out = paint(encode(cv), mk(CW, CH), (DECKS[deck] || DECKS[0]).lut); flat.set(fk, out); return out;
}
export function clearCards() { faces.clear(); flat.clear(); }

// ═════════════════════════════════════════════════════════════
//  Les planches des cinématiques : même outillage, même fenêtre
//  que les cartes (192 × 240 + débord), sans cartouche.
// ═════════════════════════════════════════════════════════════
registerDeck(0, { names: { ...NAMES, freeze: 'Le Givre', three: 'Le Tocsin', chance: 'Le Sursis', mod: 'Obole', x2: 'Le Double' }, colors: COLORS, art: ART, sart: {} });
export const T = { K, rng, frameOf: frame, tabOf: tab, paper, CW, CH, WX, WY, encode, ctxOf, mk, P, R, G, tone, WW, WH, B, TAU, spline, poly, pathOf, shape, line, seg, disc, box, inside, hatch, shade, rays, burst, halo, skyNight, skyDay, cloud, land, grass, tree, bramble, flame, candle, skull, raven, bat, bird, bell, moth, bricks, wing };
export const PLATE = { WX, WY, WW, WH };
/** fn(L, r, T) avec L.bg/far/main/near/pop(fn) et L.extra(z, id, fn) pour un calque qu'on allume ou éteint pendant la planche */
export function plateFace(fn, seed = 1) {
  const layers = [], r = rng(seed * 7919 + 101);
  const art = (z, f, id) => { const cv = mk(WW + 2 * B, WH + 2 * B), c = ctxOf(cv); c.translate(B, B); f(c); layers.push({ z, id, x: WX - B, y: WY - B, w: cv.width, h: cv.height, clip: true, d: encode(cv) }); };
  const full = (z, f, id) => { const cv = mk(CW, CH), c = ctxOf(cv); f(c); layers.push({ z, id, x: 0, y: 0, w: CW, h: CH, clip: false, d: encode(cv) }); };
  let pop = [];
  fn({ bg: (f) => art(-1, f), far: (f) => art(-0.5, f), main: (f) => art(0.3, f), near: (f) => art(0.85, f), pop: (f) => pop.push(f), extra: (z, id, f) => art(z, f, id) }, r, T);
  full(0, (c) => { // passe-partout noir, double filet
    c.fillStyle = K; c.fillRect(0, 0, CW, CH); c.clearRect(WX, WY, WW, WH);
    box(c, WX - 4, WY - 4, WW + 8, WH + 8, 1, P); box(c, WX - 1, WY - 1, WW + 2, WH + 2, 1, P);
    for (const [x, y] of [[WX - 4, WY - 4], [WX + WW + 4, WY - 4], [WX - 4, WY + WH + 4], [WX + WW + 4, WY + WH + 4]]) shape(c, [[x, y - 4], [x + 4, y], [x, y + 4], [x - 4, y]], { smooth: false, fill: G, lw: 0 });
  });
  for (const f of pop) full(1.3, (c) => { c.translate(WX, WY); f(c); });
  return { layers, fill: 1 };
}
