// ─────────────────────────────────────────────────────────────
//  Les planches gravées des cinématiques (originales), dans le
//  même style que les cartes : calques du lointain au premier
//  plan, encre / papier / rouille / or, tramés.
//  Fenêtre : 192 × 240 (débord de 12 autour).
// ─────────────────────────────────────────────────────────────
import { T } from './cardart.js';
const { K, P, R, G, tone, WW, WH, B, TAU, shape, line, seg, disc, box, inside, hatch, shade, rays, burst, halo, skyNight, skyDay, cloud, land, grass, tree, bramble, flame, candle, skull, raven, bat, bricks, pathOf } = T;
const full = (c, col = K) => { c.fillStyle = col; c.fillRect(-B, -B, WW + 2 * B, WH + 2 * B); };
/** lueur en points : dense au centre, clairsemée au bord, transparente ailleurs (pour les calques qu'on allume) */
function glow(c, r, x, y, rad, n = 260, col = P) { c.fillStyle = col; for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.pow(r(), 0.7) * rad; c.fillRect((x + Math.cos(a) * d) | 0, (y + Math.sin(a) * d) | 0, 1, 1); } }

// ── sujets ────────────────────────────────────────────────────
/** une main levée (gantelet ou os), (x, y) = poignet */
function hand(c, x, y, s, a, { fill = P, bony = false, spread = 1 } = {}) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  if (bony) { seg(c, -5, 0, -6, 70, 4, fill); seg(c, 5, 0, 6, 70, 4, fill); }
  else { shape(c, [[-9, 0], [9, 0], [12, 70], [-12, 70]], { fill, lw: 1.5, smooth: false }); for (let i = 1; i < 5; i++) seg(c, -10, i * 13, 10, i * 13 + 1, 1); hatch(c, 2, 0, 12, 70, { ang: 1.1, gap: 2.5 }); }
  const L = [17, 22, 21, 16];
  for (let i = 0; i < 4; i++) {
    c.save(); c.translate(-8 + i * 5.4, -24); c.rotate((i - 1.5) * 0.16 * spread);
    if (bony) { for (let k = 0; k < 3; k++) { shape(c, [[-1.8, -k * 7.5], [-1.8, -k * 7.5 - 6], [1.8, -k * 7.5 - 6], [1.8, -k * 7.5]], { fill, lw: 0.8, smooth: false }); } }
    else { shape(c, [[-2.7, 2], [-2.7, -L[i] + 2.7], [2.7, -L[i] + 2.7], [2.7, 2]], { fill, lw: 1.2, smooth: false }); disc(c, 0, -L[i] + 2.7, 2.7, fill, 1.2); seg(c, -2.5, -L[i] * 0.45, 2.5, -L[i] * 0.45, 1); seg(c, -2.5, -L[i] * 0.75, 2.5, -L[i] * 0.75, 1); }
    c.restore();
  }
  c.save(); c.translate(-11, -8); c.rotate(-0.95 * spread);
  if (bony) { shape(c, [[-1.8, 0], [-1.8, -12], [1.8, -12], [1.8, 0]], { fill, lw: 0.8, smooth: false }); } else { shape(c, [[-3, 2], [-3, -13], [3, -13], [3, 2]], { fill, lw: 1.2, smooth: false }); disc(c, 0, -13, 3, fill, 1.2); }
  c.restore();
  const palm = [[-11, 0], [-12, -18], [-9, -26], [9, -26], [12, -18], [11, 0]];
  if (bony) { for (let i = 0; i < 4; i++) seg(c, -8 + i * 5.4, -24, -4 + i * 2.6, -2, 2.2, fill); shape(c, [[-6, 0], [6, 0], [5, -6], [-5, -6]], { fill, lw: 0.8 }); }
  else { shape(c, palm, { fill, lw: 1.5 }); shade(c, palm, 2, -26, 12, 28, { ang: 1.1, gap: 2.4 }); }
  c.restore();
}
/** le chevalier, de dos ; (x, y) = les pieds */
function knightBack(c, x, y, s, { lantern = true } = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (lantern) { seg(c, 15, -52, 26, -40, 3, K); seg(c, 26, -40, 26, -34, 1, P); shape(c, [[22, -34], [30, -34], [31, -22], [21, -22]], { fill: G, lw: 1.2, smooth: false }); seg(c, 26, -34, 26, -22, 1, K); }
  const cloak = [[-17, 0], [-21, -28], [-16, -56], [-9, -66], [9, -66], [16, -56], [21, -28], [17, 0], [8, -3], [0, 0], [-8, -3]];
  shape(c, cloak, { fill: K, stroke: P, lw: 1.3 });
  line(c, [[-8, -60], [-11, -30], [-10, -4]], 1, P); line(c, [[6, -60], [9, -32], [7, -4]], 1, P);
  for (const sx of [-1, 1]) shape(c, [[sx * 4, -64], [sx * 16, -62], [sx * 18, -55], [sx * 6, -57]], { fill: tone(90), stroke: P, lw: 1 });
  shape(c, [[-7, -66], [-8, -80], [-4, -87], [4, -87], [8, -80], [7, -66]], { fill: tone(70), stroke: P, lw: 1.2 });
  seg(c, 0, -87, 0, -66, 1, K); line(c, [[3, -86], [6, -80], [6, -68]], 1, P);
  seg(c, -16, -44, -24, 2, 2.4, P); seg(c, -21, -26, -13, -26, 2, P);
  c.restore();
}
function hanged(c, x, y, s, swing = 0) { // (x, y) = la branche
  c.save(); c.translate(x, y); c.rotate(swing); c.scale(s, s);
  seg(c, 0, 0, 0, 22, 1, P); disc(c, 0, 26, 4.5, K, 1, P);
  shape(c, [[-4, 30], [-7, 50], [-5, 70], [5, 70], [7, 50], [4, 30]], { fill: K, stroke: P, lw: 1 });
  seg(c, -2, 70, -2, 82, 2, K); seg(c, 2, 70, 2.5, 82, 2, K);
  c.restore();
}
function arch(c, x, y, w, h, { stones = 13, fill = tone(205) } = {}) { // arc brisé en blocs, (x, y) = bas gauche
  const cx = x + w / 2, top = y - h, pts = [];
  for (let i = 0; i <= stones; i++) {
    const k = i / stones, side = k < 0.5 ? -1 : 1, t = k < 0.5 ? k * 2 : (1 - k) * 2;
    const yy = y - Math.min(1, t * 1.6) * (h - w * 0.55) - (t > 0.62 ? (t - 0.62) / 0.38 * w * 0.55 : 0);
    const xx = cx + side * (w / 2) * (t < 0.62 ? 1 : 1 - (t - 0.62) / 0.38);
    pts.push([xx, yy]);
  }
  for (let i = 0; i < stones; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], nx = (by - ay), ny = -(bx - ax), l = Math.hypot(nx, ny) || 1, d = 14;
    const q = [[ax, ay], [bx, by], [bx - (nx / l) * d * (i < stones / 2 ? 1 : -1), by - (ny / l) * d * (i < stones / 2 ? 1 : -1)], [ax - (nx / l) * d * (i < stones / 2 ? 1 : -1), ay - (ny / l) * d * (i < stones / 2 ? 1 : -1)]];
    shape(c, q, { fill, lw: 1.6, smooth: false });
    inside(c, pathOf(q, false), () => hatch(c, Math.min(ax, bx) - 16, Math.min(ay, by) - 16, 40, 40, { ang: 0.8 + i * 0.3, gap: 3 }));
  }
  return top;
}
function bars(c, x0, x1, y0, y1, n = 5) { // une herse
  const w = (x1 - x0) / (n - 1);
  for (let i = 0; i < n; i++) { const x = x0 + i * w; seg(c, x, y0, x, y1, 3, P); seg(c, x + 1, y0, x + 1, y1, 1, K); shape(c, [[x - 3, y1], [x, y1 + 10], [x + 3, y1]], { fill: P, lw: 1, smooth: false }); }
  for (const y of [y0 + (y1 - y0) * 0.3, y0 + (y1 - y0) * 0.72]) { c.fillStyle = P; c.fillRect(x0 - 4, y - 3, x1 - x0 + 8, 6); box(c, x0 - 4, y - 3, x1 - x0 + 8, 6, 1); for (let i = 0; i < n; i++) disc(c, x0 + i * w, y, 1.6, K); }
}
function column(c, x, y0, y1, w) {
  shape(c, [[x - w / 2, y1], [x - w / 2, y0], [x + w / 2, y0], [x + w / 2, y1]], { smooth: false, lw: 1.4 });
  hatch(c, x, y0, w / 2, y1 - y0, { ang: 1.4, gap: 2.5 });
  c.fillStyle = P; c.fillRect(x - w * 0.75, y0 - 6, w * 1.5, 6); box(c, x - w * 0.75, y0 - 6, w * 1.5, 6, 1); c.fillRect(x - w * 0.7, y1, w * 1.4, 5); box(c, x - w * 0.7, y1, w * 1.4, 5, 1);
}
function crown(c, x, y, s, broken = false) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const pts = [[-22, 0], [-24, -18], [-14, -8], [-8, -26], [0, -10], [8, -26], [14, -8], [24, -18], [22, 0]];
  if (broken) pts.splice(5, 1, [6, -12]);
  shape(c, pts, { fill: G, lw: 1.5, smooth: false });
  c.fillStyle = K; c.fillRect(-22, -4, 44, 1.2);
  for (const dx of [-12, 0, 12]) disc(c, dx, -2, 2, R, 0.8);
  c.restore();
}
function bigSkull(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const cr = [[0, -60], [30, -54], [44, -30], [44, 0], [36, 18], [26, 26], [24, 48], [-24, 48], [-26, 26], [-36, 18], [-44, 0], [-44, -30], [-30, -54]];
  shape(c, cr, { fill: P, lw: 2 }); shade(c, cr, 12, -60, 40, 110, { ang: 1.1, gap: 2.6 });
  for (const sx of [-1, 1]) shape(c, [[sx * 6, -6], [sx * 12, -18], [sx * 26, -18], [sx * 32, -8], [sx * 28, 4], [sx * 12, 6]], { fill: K, lw: 0 });
  shape(c, [[0, 8], [5, 20], [-5, 20]], { fill: K, lw: 0, smooth: false });
  c.fillStyle = K; c.fillRect(-20, 30, 40, 2);
  for (let i = -4; i <= 4; i++) { c.fillRect(i * 5 - 0.5, 30, 1, 16); }
  c.fillRect(-22, 46, 44, 2);
  line(c, [[-30, -40], [-18, -28], [-22, -14]], 1);
  c.restore();
}
function seal(c, x, y, r = 7) { disc(c, x, y, r + 1.5, K); disc(c, x, y, r, R, 1.2); disc(c, x, y, r * 0.45, null, 1, K); seg(c, x - r * 0.4, y, x + r * 0.4, y, 1); }
function cardShape(c, x, y, w, h, a, mark = 'VII') {
  c.save(); c.translate(x, y); c.rotate(a);
  shape(c, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], { fill: P, lw: 2, smooth: false });
  box(c, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 1);
  c.fillStyle = K; c.font = '700 20px Grenze'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(mark, 0, 2);
  c.restore();
}
function stars(c, r, n, y1 = 150, col = P) { c.fillStyle = col; for (let i = 0; i < n; i++) c.fillRect((-B + r() * (WW + 2 * B)) | 0, (-B + r() * (y1 + B)) | 0, 1, 1); }
function tower(c, x0, x1, y0, y1, { lit = true } = {}) { // tour sombre éclairée par la lune (à droite)
  const tw = [[x0, y1], [x0 + 2, y0], [x1 - 2, y0], [x1, y1]];
  shape(c, tw, { fill: tone(36), stroke: P, lw: 1.2, smooth: false });
  inside(c, pathOf(tw, false), () => { c.fillStyle = P; for (let yy = y0 + 4; yy < y1; yy += 9) { let xx = x0 + ((yy / 9) % 2 ? 6 : 0); for (; xx < x1; xx += 13) if (xx > (x0 + x1) / 2 - 4) c.fillRect(xx | 0, yy | 0, 9, 1); } hatch(c, x0, y0, (x1 - x0) * 0.4, y1 - y0, { ang: 1.2, gap: 2.2 }); });
  const m = (x1 - x0) / 7, top = [];
  for (let i = 0; i <= 7; i++) { const xx = x0 - 3 + i * (m + 6 / 7); top.push([xx, y0 - (i % 2 ? 0 : 9)], [xx + m * 0.5, y0 - (i % 2 ? 0 : 9)]); }
  shape(c, [[x0 - 3, y0 + 4], ...top.map(([a, b]) => [Math.min(a, x1 + 3), b]), [x1 + 3, y0 + 4]], { fill: tone(30), stroke: P, lw: 1, smooth: false });
  if (lit) { c.fillStyle = G; c.fillRect((x0 + x1) / 2 - 3, y0 + 34, 7, 12); c.fillStyle = K; c.fillRect((x0 + x1) / 2, y0 + 34, 1, 12); }
  c.fillStyle = K; c.fillRect((x0 + x1) / 2 + 8, y0 + 80, 3, 8);
}

// ═════════════════════════════════════════════════════════════
//  LES PLANCHES
// ═════════════════════════════════════════════════════════════
export const PLATES = {};

// — intro 1 : la tour, la nuit du pari —
PLATES.tour = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 70, y0: 140, stars: 80 }); disc(c, 152, 46, 19, P); disc(c, 158, 42, 16, K); rays(c, 148, 48, 24, 34, 28, { col: P, alt: 0.4 }); });
  L.far((c) => { land(c, [[-12, 196], [40, 186], [90, 192], [150, 180], [204, 190]], { fill: tone(26), stroke: P, lw: 1 }); for (let i = 0; i < 14; i++) tree(c, -6 + i * 15 + r() * 6, 192 + r() * 4, 14 + r() * 10, r, { lw: 1.6, depth: 2, col: K }); });
  L.main((c) => { land(c, [[-12, 226], [60, 214], [110, 212], [204, 224]], { fill: K, lw: 1, stroke: P }); tower(c, 68, 116, 54, 216); });
  L.near((c) => { tree(c, 4, 256, 120, r, { lean: 0.28, lw: 7, depth: 3 }); bramble(c, [[110, 256], [150, 236], [204, 244]], r, { lw: 3 }); });
  L.extra(0.31, 'glow', (c) => { glow(c, r, 92, 94, 30, 300); glow(c, r, 92, 94, 12, 80, G); });
  L.pop((c) => { bat(c, 46, 60, 0.8, 0.2); bat(c, 172, 96, 0.6, -0.3); });
};
// — intro 2 : les mains tendues vers la carte, les sept sceaux —
PLATES.mains = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 72, 6, 150, 200, 0); burst(c, 96, 72, 30, 220, 18, P, -Math.PI / 2, 0.08); stars(c, r, 50, 240); });
  L.main((c) => { cardShape(c, 96, 76, 46, 66, 0.18); });
  for (let k = 0; k < 7; k++) L.extra(0.5, 'seal' + k, (c) => { const a = -Math.PI / 2 + (k / 7) * TAU; seal(c, 96 + Math.cos(a) * 52, 78 + Math.sin(a) * 52, 7); });
  L.near((c) => { hand(c, 40, 230, 1.15, 0.42, { spread: 1.3 }); hand(c, 150, 236, 1.2, -0.38, { spread: 1.1 }); hand(c, 98, 262, 1.3, 0.04, { bony: true, spread: 1.4 }); });
};
// — intro 3 : la herse du Roi —
PLATES.herse = (L, r) => {
  L.bg((c) => { full(c); stars(c, r, 30, 60); });
  L.far((c) => { full(c, tone(18)); inside(c, (q) => q.rect(-B, -B, WW + 2 * B, WH + 2 * B), () => bricks(c, -B, -B, WW + 2 * B, WH + 2 * B, { bh: 14, bw: 30 })); c.fillStyle = K; c.beginPath(); c.moveTo(30, 236); c.lineTo(30, 110); c.quadraticCurveTo(30, 40, 96, 26); c.quadraticCurveTo(162, 40, 162, 110); c.lineTo(162, 236); c.fill(); });
  L.extra(-0.2, 'eyes', (c) => { for (const sx of [-1, 1]) shape(c, [[96 + sx * 10, 100], [96 + sx * 24, 92], [96 + sx * 22, 100]], { fill: G, lw: 0, smooth: false }); crown(c, 96, 78, 0.7, true); });
  L.main((c) => { bars(c, 44, 148, 34, 214, 5); });
  L.near((c) => { arch(c, 14, 252, 164, 236, { stones: 15 }); c.fillStyle = P; c.fillRect(-B, 240, WW + 2 * B, 20); bricks(c, -B, 240, WW + 2 * B, 20, { bh: 10, bw: 26 }); hand(c, 70, 176, 0.7, 0.1, { bony: true, spread: 0.6 }); hand(c, 122, 172, 0.7, -0.1, { bony: true, spread: 0.6 }); });
};
// — intro 4 : les règles (une main pioche dans le paquet) —
PLATES.regles = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 150, 10, 160, 170, 0); });
  L.far((c) => { shape(c, [[-12, 140], [204, 140], [204, 256], [-12, 256]], { fill: tone(70), smooth: false, lw: 0 }); for (let i = 0; i < 9; i++) seg(c, -12, 146 + i * 13, 204, 146 + i * 13 + 2, 1); candle(c, 30, 160, 34, 9, 14); candle(c, 168, 152, 26, 8, 12); });
  L.main((c) => { for (let i = 0; i < 8; i++) shape(c, [[56 - i * 0.4, 196 - i * 2.6], [116 - i * 0.4, 196 - i * 2.6], [124, 212 - i * 2.6], [48, 212 - i * 2.6]], { fill: i === 7 ? P : tone(150), lw: 1.2, smooth: false }); cardShape(c, 120, 120, 40, 58, -0.22, '7'); });
  L.near((c) => { hand(c, 150, 214, 1.0, -0.62, { spread: 0.5 }); });
};
// — intro 5 : la route de la Forêt des Pendus —
PLATES.route = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 110, y0: 90, stars: 60 }); disc(c, 40, 50, 12, P); });
  L.far((c) => { for (let i = 0; i < 22; i++) { const x = -10 + i * 10 + r() * 4; tree(c, x, 150 + r() * 6, 40 + r() * 30, r, { lw: 2.6, depth: 3, col: K }); } c.fillStyle = K; c.fillRect(-B, 150, WW + 2 * B, 120); });
  L.main((c) => {
    shape(c, [[90, 152], [102, 152], [160, 256], [36, 256]], { fill: tone(120), lw: 0, smooth: false }); hatch(c, 36, 152, 124, 104, { ang: 0.2, gap: 5 });
    tree(c, 150, 200, 110, r, { lean: -0.12, lw: 6, depth: 2 }); seg(c, 120, 118, 190, 108, 3, K);
    hanged(c, 136, 116, 0.8, 0.05); hanged(c, 172, 111, 0.7, -0.04);
    grass(c, r, 254, { n: 60, col: P, h: 8 });
  });
  L.near((c) => { knightBack(c, 84, 248, 1.15); bramble(c, [[-14, 210], [10, 236], [20, 256]], r, { lw: 4 }); });
  L.extra(0.86, 'glow', (c) => { glow(c, r, 115, 214, 22, 240); glow(c, r, 115, 214, 8, 50, G); });
};
// — passage : vers le Pont-levis —
PLATES.pont = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 90, y0: 100, stars: 50 }); });
  L.far((c) => {
    const wall = [[-12, 150], [-12, 96], [204, 96], [204, 150]]; shape(c, wall, { fill: tone(60), stroke: P, lw: 1, smooth: false });
    for (let x = -12; x < 204; x += 14) { c.fillStyle = tone(60); c.fillRect(x, 88, 8, 9); box(c, x, 88, 8, 9, 1, P); }
    for (const x of [40, 152]) { shape(c, [[x - 18, 160], [x - 16, 50], [x + 16, 50], [x + 18, 160]], { fill: tone(46), stroke: P, lw: 1.2, smooth: false }); shape(c, [[x - 22, 52], [x, 14], [x + 22, 52]], { fill: K, stroke: P, lw: 1, smooth: false }); c.fillStyle = G; c.fillRect(x - 2, 80, 4, 8); }
    c.fillStyle = K; c.beginPath(); c.moveTo(74, 160); c.lineTo(74, 112); c.quadraticCurveTo(96, 92, 118, 112); c.lineTo(118, 160); c.fill(); c.fillStyle = G; c.fillRect(80, 118, 32, 42);
    for (let x = 80; x <= 112; x += 6) seg(c, x, 112, x, 150, 1.6, K);
  });
  L.main((c) => {
    c.fillStyle = K; c.fillRect(-B, 160, WW + 2 * B, 100); for (let i = 0; i < 12; i++) { const y = 168 + i * 7; line(c, [[-12 + r() * 30, y], [40 + r() * 20, y + 1]], 1, P); line(c, [[150 + r() * 20, y], [200, y + 1]], 1, P); }
    const br = [[76, 160], [116, 160], [146, 256], [46, 256]]; shape(c, br, { fill: tone(170), lw: 1.5, smooth: false });
    inside(c, pathOf(br, false), () => { for (let i = 0; i < 12; i++) { const k = i / 12; seg(c, 76 - 30 * k * k - 0, 160 + 96 * k, 116 + 30 * k * k, 160 + 96 * k, 1); } for (let i = -3; i <= 3; i++) seg(c, 96 + i * 5, 160, 96 + i * 14, 256, 1); });
    for (const s of [-1, 1]) for (let k = 0; k < 9; k++) disc(c, 96 + s * (24 + k * 4.5), 112 + k * 6, 2.2, null, 1.2, P);
  });
  L.near((c) => { knightBack(c, 96, 254, 0.9); });
  L.extra(-0.3, 'torch', (c) => { for (const x of [40, 152]) { flame(c, x, 70, 14); glow(c, r, x, 62, 20, 160); } });
};
// — passage : vers le Château du Roi déchu —
PLATES.chateau = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 60, y0: 120, stars: 20 }); for (let i = 0; i < 4; i++) cloud(c, 20 + i * 52, 40 + (i % 2) * 22, 70, r, { fill: tone(90) }); });
  L.extra(-0.9, 'bolt', (c) => { line(c, [[160, -12], [150, 30], [162, 50], [140, 96], [150, 104], [132, 140]], 3, P, false); line(c, [[150, 30], [176, 60], [170, 80]], 1.5, P, false); });
  L.far((c) => {
    const keep = [[56, 150], [58, 54], [134, 54], [136, 150]]; shape(c, keep, { fill: tone(40), stroke: P, lw: 1.2, smooth: false });
    shape(c, [[84, 54], [86, 6], [106, 6], [108, 54]], { fill: tone(34), stroke: P, lw: 1, smooth: false }); shape(c, [[80, 8], [96, -12], [112, 8]], { fill: K, stroke: P, lw: 1, smooth: false });
    for (const x of [44, 148]) { shape(c, [[x - 12, 150], [x - 11, 64], [x + 11, 64], [x + 12, 150]], { fill: tone(46), stroke: P, lw: 1, smooth: false }); shape(c, [[x - 15, 66], [x, 34], [x + 15, 66]], { fill: K, stroke: P, lw: 1, smooth: false }); }
    disc(c, 96, 86, 14, G, 1.5, K); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; seg(c, 96, 86, 96 + Math.cos(a) * 14, 86 + Math.sin(a) * 14, 1.2, K); } disc(c, 96, 86, 4, R, 1);
    for (const [x, y] of [[74, 120], [118, 120], [96, 30], [44, 96], [148, 96]]) { c.fillStyle = y === 30 ? G : K; c.fillRect(x - 2, y, 4, 9); }
  });
  L.main((c) => { const cliff = [[-12, 256], [-12, 160], [30, 150], [60, 152], [96, 146], [136, 152], [170, 148], [204, 160], [204, 256]]; shape(c, cliff, { fill: K, stroke: P, lw: 1.2 }); for (let i = 0; i < 18; i++) { const x = r() * 200, y = 160 + r() * 90; line(c, [[x, y], [x + 6 + r() * 10, y + 10 + r() * 14]], 1, P); } });
  L.near((c) => { knightBack(c, 150, 254, 0.85, { lantern: false }); });
  L.pop((c) => { raven(c, 34, 40, 0.8, 1, true); });
};
// — boss final 1 : la salle du trône —
PLATES.trone = (L, r) => {
  const vx = 96, vy = 92;
  L.bg((c) => { full(c); halo(c, vx, vy, 4, 120, 120, 0); });
  L.far((c) => {
    shape(c, [[vx - 26, vy + 30], [vx - 26, vy - 18], [vx - 16, vy - 34], [vx + 16, vy - 34], [vx + 26, vy - 18], [vx + 26, vy + 30]], { fill: tone(70), stroke: P, lw: 1.2, smooth: false });
    shape(c, [[vx - 10, vy + 30], [vx - 12, vy + 4], [vx - 6, vy - 12], [vx + 6, vy - 12], [vx + 12, vy + 4], [vx + 10, vy + 30]], { fill: K, lw: 0 }); disc(c, vx, vy - 14, 6, K); crown(c, vx, vy - 20, 0.32, true);
    for (const sx of [-1, 1]) disc(c, vx + sx * 2.5, vy - 14, 1, R);
  });
  L.main((c) => {
    c.fillStyle = tone(40); c.beginPath(); c.moveTo(-B, 256); c.lineTo(vx - 30, vy + 30); c.lineTo(vx + 30, vy + 30); c.lineTo(WW + B, 256); c.fill();
    for (let i = -8; i <= 8; i++) seg(c, vx + i * 7, vy + 30, vx + i * 34, 256, 1, P);
    for (let k = 0; k < 9; k++) { const y = vy + 30 + Math.pow(k / 8, 1.8) * 140; seg(c, -B, y, WW + B, y, 1, P); }
    shape(c, [[vx - 9, vy + 30], [vx + 9, vy + 30], [vx + 46, 256], [vx - 46, 256]], { fill: R, lw: 1, smooth: false }); seg(c, vx - 9, vy + 30, vx - 46, 256, 1, G); seg(c, vx + 9, vy + 30, vx + 46, 256, 1, G);
    for (let k = 0; k < 4; k++) { const d = 1 - k * 0.22, h = 150 * d, w = 16 * d; for (const sx of [-1, 1]) column(c, vx + sx * (40 + 90 * (1 - d) + 12) * (0.6 + k * 0.4), vy + 30 + h * 0.85, vy + 30 - h * 0.35, w); }
  });
  L.near((c) => { for (const sx of [-1, 1]) { const x = vx + sx * 78; shape(c, [[x - 10, 256], [x - 6, 214], [x + 6, 214], [x + 10, 256]], { fill: tone(90), smooth: false }); shape(c, [[x - 14, 214], [x + 14, 214], [x + 10, 204], [x - 10, 204]], { fill: P, smooth: false }); } });
  L.extra(0.86, 'fire', (c) => { for (const sx of [-1, 1]) { flame(c, vx + sx * 78, 204, 26); glow(c, r, vx + sx * 78, 186, 34, 320); } });
};
// — boss final 2 : le Roi déchu, de près —
PLATES.roi = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 110, 20, 150, 90, 0); rays(c, 96, 110, 80, 160, 60, { col: P, alt: 0.5 }); });
  L.far((c) => { const hood = [[-12, 256], [6, 150], [30, 60], [96, 10], [162, 60], [186, 150], [204, 256]]; shape(c, hood, { fill: K, stroke: P, lw: 1.6 }); line(c, [[40, 80], [22, 180], [14, 256]], 1, P); line(c, [[152, 80], [170, 180], [178, 256]], 1, P); });
  L.main((c) => { bigSkull(c, 96, 128, 1.25); for (let i = 0; i < 26; i++) { const x = 52 + i * 3.4; line(c, [[x, 186], [x - 2 + r() * 4, 220], [x - 4 + r() * 8, 256]], 0.8, P); } });
  L.near((c) => { crown(c, 96, 52, 1.5, true); });
  L.extra(0.35, 'eyes', (c) => { for (const sx of [-1, 1]) { disc(c, 96 + sx * 24, 112, 6, G); disc(c, 96 + sx * 24, 112, 2.4, R); } });
};
// — boss final 3 : la table, les cartes qui volent —
PLATES.duel = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 120, 10, 160, 150, 0); burst(c, 96, 120, 40, 220, 24, tone(120), 0, 0.12); });
  L.far((c) => { shape(c, [[-12, 170], [30, 140], [96, 132], [162, 140], [204, 170], [204, 256], [-12, 256]], { fill: tone(60), stroke: P, lw: 1.5 }); hatch(c, -12, 132, 216, 124, { ang: 0.15, gap: 6 }); });
  L.main((c) => { for (let i = 0; i < 7; i++) cardShape(c, 40 + i * 19, 100 + Math.abs(i - 3) * 9, 26, 38, (i - 3) * 0.2, String([3, 7, 1, 12, 5, 9, 4][i])); });
  L.near((c) => { hand(c, 20, 256, 1.1, 0.5); hand(c, 172, 256, 1.1, -0.5, { bony: true }); });
};
// — fin 1 : le Roi tombe en poussière —
PLATES.poussiere = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 120, 10, 150, 130, 0); });
  L.main((c) => { inside(c, (q) => q.rect(-B, 120, WW + 2 * B, 200), () => bigSkull(c, 96, 150, 1.1)); for (let i = 0; i < 300; i++) { const x = 40 + r() * 112, y = 60 + r() * 100; c.fillStyle = r() > 0.5 ? P : tone(160); c.fillRect(x | 0, y | 0, 1 + (r() * 2) | 0, 1); } });
  L.near((c) => { c.fillStyle = K; c.fillRect(-B, 214, WW + 2 * B, 60); seg(c, -B, 214, WW + B, 214, 1, P); c.save(); c.translate(132, 206); c.rotate(0.5); crown(c, 0, 0, 0.9, true); c.restore(); });
  for (let k = 0; k < 7; k++) L.extra(0.6, 'seal' + k, (c) => { const x = 20 + k * 26; seal(c, x, 30 + (k % 2) * 10, 6); seg(c, x - 7, 30 + (k % 2) * 10 - 7, x + 7, 30 + (k % 2) * 10 + 7, 2, K); });
};
// — fin 2 : l'aube —
PLATES.aube = (L, r) => {
  L.bg((c) => { skyDay(c, r, 180, 5); disc(c, 96, 150, 48, P, 1.5); rays(c, 96, 150, 54, 140, 48, { alt: 0.55 }); });
  L.far((c) => { for (const x of [60, 132]) shape(c, [[x - 12, 170], [x - 10, 90], [x + 10, 90], [x + 12, 170]], { fill: K, lw: 0, smooth: false }); shape(c, [[78, 170], [80, 70], [112, 70], [114, 170]], { fill: K, lw: 0, smooth: false }); shape(c, [[74, 72], [96, 36], [118, 72]], { fill: K, lw: 0, smooth: false }); cloud(c, 34, 120, 60, r); cloud(c, 164, 104, 52, r); });
  L.main((c) => { land(c, [[-12, 196], [50, 180], [96, 176], [150, 182], [204, 194]], { fill: K }); grass(c, r, 200, { n: 70, col: P, h: 8 }); });
  L.near((c) => { c.save(); c.translate(52, 252); c.scale(1.05, 1.05); shape(c, [[-12, 0], [-14, -40], [-8, -60], [8, -60], [14, -40], [12, 0]], { fill: K, lw: 0 }); shape(c, [[-6, -60], [-7, -74], [7, -74], [6, -60]], { fill: K, lw: 0, smooth: false }); seg(c, 10, -56, 26, -84, 4, K); c.restore(); crown(c, 80, 162, 0.55); });
};
// — fin 3 : sous la terre, une main d'os —
PLATES.tombe = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 60, y0: 130, stars: 70 }); disc(c, 140, 54, 22, P); disc(c, 132, 50, 20, K); });
  L.far((c) => { land(c, [[-12, 170], [60, 160], [140, 166], [204, 158]], { fill: tone(30), stroke: P, lw: 1 }); for (let i = 0; i < 7; i++) { const x = 6 + i * 30 + r() * 8, h = 18 + r() * 12; shape(c, [[x - 6, 172], [x - 6, 172 - h], [x, 166 - h], [x + 6, 172 - h], [x + 6, 172]], { fill: tone(80), stroke: P, lw: 1, smooth: false }); seg(c, x, 160 - h, x, 150 - h, 1.5, P); seg(c, x - 4, 156 - h, x + 4, 156 - h, 1.5, P); } });
  L.main((c) => { land(c, [[-12, 214], [70, 206], [130, 210], [204, 204]], { fill: K, stroke: P, lw: 1 }); shape(c, [[50, 214], [64, 200], [130, 200], [144, 214]], { fill: tone(50), stroke: P, lw: 1 }); for (let i = 0; i < 10; i++) disc(c, 60 + r() * 76, 206 + r() * 10, 1.5 + r() * 2, P); });
  L.near((c) => { hand(c, 96, 236, 1.1, 0.06, { bony: true, spread: 1.5 }); cardShape(c, 114, 128, 30, 44, 0.3, '0'); grass(c, r, 256, { n: 50, col: P, h: 10 }); });
};
export { hand, bigSkull, crown, arch, bars, seal, glow, cardShape, column, hanged };

// ═════════════════════════════════════════════════════════════
//  Parcours II — le Squelette
// ═════════════════════════════════════════════════════════════
function robeFig(c, x, y, s, { flip = 1, lantern = false, pole = false, scythe = false, skullFace = false } = {}) { // silhouette encapuchonnée, (x, y) = les pieds
  c.save(); c.translate(x, y); c.scale(s * flip, s);
  if (pole) seg(c, 14, -100, 22, 30, 2.4, K);
  if (scythe) { seg(c, -16, 10, -20, -120, 2.6, P); shape(c, [[-20, -120], [10, -128], [40, -116], [56, -98], [34, -108], [8, -114], [-18, -112]], { fill: P, lw: 1 }); }
  const robe = [[-15, 0], [-18, -30], [-13, -60], [-8, -76], [-2, -82], [7, -82], [12, -73], [14, -58], [18, -30], [16, 0]];
  shape(c, robe, { fill: K, stroke: P, lw: 1.3 });
  inside(c, pathOf(robe), () => hatch(c, 5, -84, 16, 86, { ang: 1.15, gap: 2.2, col: P }));
  c.beginPath(); c.ellipse(2, -70, 6, 8, 0, 0, TAU); c.fillStyle = skullFace ? P : K; c.fill(); c.strokeStyle = P; c.lineWidth = 1; c.stroke();
  if (skullFace) { disc(c, 0, -71, 1.6, K); disc(c, 4.5, -71, 1.6, K); seg(c, -1, -65, 5, -65, 1, K); } else { disc(c, 0, -71, 1.1, G); disc(c, 4.5, -71, 1.1, G); }
  if (lantern) { seg(c, 12, -50, 22, -42, 2.5, K); seg(c, 22, -42, 22, -36, 1, P); shape(c, [[18, -36], [26, -36], [27, -24], [17, -24]], { fill: G, lw: 1.2, smooth: false }); }
  c.restore();
}
function skeletonBack(c, x, y, s) { // le squelette de dos, (x, y) = les pieds
  c.save(); c.translate(x, y); c.scale(s, s);
  for (const sx of [-1, 1]) { seg(c, sx * 4, 0, sx * 5, -30, 2.6, P); seg(c, sx * 5, -30, sx * 6, -52, 2.6, P); disc(c, sx * 5, -30, 1.8, P); }
  shape(c, [[-9, -50], [9, -50], [7, -56], [-7, -56]], { fill: P, lw: 1, smooth: false });
  seg(c, 0, -56, 0, -82, 2.2, P); for (let i = 0; i < 5; i++) { const y0 = -60 - i * 4.5; line(c, [[-11 + i, y0 + 2], [-1, y0], [1, y0], [11 - i, y0 + 2]], 1.4, P); }
  seg(c, -12, -84, 12, -84, 2, P);
  for (const sx of [-1, 1]) { line(c, [[sx * 12, -84], [sx * 16, -64], [sx * 18, -46]], 2.2, P); }
  disc(c, 0, -94, 8.5, P, 1.2); disc(c, 0, -90, 5, tone(200));
  c.restore();
}
// — intro II : la Mort, au loin, sous la lune —
PLATES.mortloin = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 60, y0: 150, stars: 90 }); disc(c, 96, 96, 62, P); disc(c, 96, 96, 62, null, 1.5, K); for (let i = 0; i < 5; i++) seg(c, 40, 74 + i * 12, 152, 74 + i * 12, 1, tone(190)); });
  L.far((c) => { land(c, [[-12, 196], [50, 178], [96, 168], [142, 178], [204, 194]], { fill: K, stroke: P, lw: 1 }); });
  L.main((c) => { robeFig(c, 96, 172, 0.9, { scythe: true, skullFace: true }); for (let i = 0; i < 9; i++) { const x = 4 + i * 23; shape(c, [[x - 5, 230], [x - 5, 212], [x, 206], [x + 5, 212], [x + 5, 230]], { fill: tone(70), stroke: P, lw: 1, smooth: false }); } c.fillStyle = K; c.fillRect(-B, 228, WW + 2 * B, 40); });
  L.near((c) => { tree(c, 186, 256, 100, r, { lean: -0.3, lw: 6, depth: 3 }); });
  L.extra(0.32, 'eyes', (c) => { disc(c, 95, 108, 1.5, G); disc(c, 99, 108, 1.5, G); glow(c, r, 97, 108, 10, 50, G); });
  L.pop((c) => { bat(c, 30, 60, 0.7, 0.3); bat(c, 60, 34, 0.5, -0.2); });
};
// — Les Limbes : la plaine de cendre, la porte blanche au loin —
PLATES.limbes = (L, r) => {
  L.bg((c) => { full(c, tone(70)); halo(c, 96, 110, 4, 90, 240, 70); });
  L.far((c) => { shape(c, [[78, 150], [78, 92], [96, 78], [114, 92], [114, 150]], { fill: P, lw: 1.5, smooth: false }); for (const x of [70, 122]) shape(c, [[x - 6, 150], [x - 6, 84], [x + 6, 84], [x + 6, 150]], { fill: tone(110), stroke: K, lw: 1, smooth: false }); land(c, [[-12, 150], [204, 150]], { fill: tone(40), lw: 0 }); });
  L.main((c) => { shape(c, [[90, 150], [102, 150], [150, 256], [42, 256]], { fill: tone(150), lw: 0, smooth: false }); for (let i = 0; i < 12; i++) { const x = r() * 192, y = 156 + r() * 70, s = 0.6 + r() * 0.6; if (x > 70 && x < 120) continue; shape(c, [[x - 5 * s, y], [x - 5 * s, y - 14 * s], [x, y - 19 * s], [x + 5 * s, y - 14 * s], [x + 5 * s, y]], { fill: tone(90), stroke: K, lw: 1, smooth: false }); } tree(c, 20, 200, 110, r, { lean: 0.2, lw: 5, depth: 3 }); tree(c, 176, 190, 100, r, { lean: -0.2, lw: 5, depth: 3 }); });
  L.near((c) => { skeletonBack(c, 92, 250, 1.3); });
};
// — Le Fleuve noir : la barque du passeur —
PLATES.barque = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 60, y0: 120, stars: 40 }); disc(c, 46, 50, 13, P); });
  L.far((c) => { for (const sd of [-1, 1]) shape(c, [[96 + sd * 108, 150], [96 + sd * 108, 30], [96 + sd * 66, 86], [96 + sd * 54, 150]], { fill: K, stroke: P, lw: 1, smooth: false }); c.fillStyle = K; c.fillRect(-B, 150, WW + 2 * B, 120); shape(c, [[84, 150], [84, 120], [96, 110], [108, 120], [108, 150]], { fill: G, lw: 0, smooth: false }); });
  L.main((c) => { for (let i = 0; i < 46; i++) { const y = 156 + r() * 96, x = -10 + r() * 200; seg(c, x, y, x + 6 + r() * 24, y, 1, tone(150)); } const hull = [[30, 196], [150, 192], [138, 212], [40, 214]]; shape(c, hull, { fill: tone(70), stroke: P, lw: 1.4, smooth: false }); robeFig(c, 120, 194, 1, { pole: true, lantern: true }); skeletonBack(c, 62, 200, 0.62); });
  L.extra(0.32, 'lamp', (c) => { glow(c, r, 145, 164, 24, 200, G); });
};
// — La Cathédrale d'Os —
PLATES.cathedrale = (L, r) => {
  const vx = 96, vy = 110;
  L.bg((c) => { full(c); disc(c, vx, 70, 34, R, 2, P); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; seg(c, vx, 70, vx + Math.cos(a) * 34, 70 + Math.sin(a) * 34, 1.5, K); } disc(c, vx, 70, 10, G, 1.5, K); });
  L.far((c) => { for (let k = 0; k < 4; k++) { const d = 1 - k * 0.2; for (const sx of [-1, 1]) { const x = vx + sx * (30 + (3 - k) * 26); for (let j = 0; j < 7; j++) skull(c, x, vy + 100 * d - j * 15 * d, 0.6 * d + 0.3); } } });
  L.main((c) => { c.fillStyle = tone(50); c.beginPath(); c.moveTo(-B, 256); c.lineTo(vx - 20, vy + 40); c.lineTo(vx + 20, vy + 40); c.lineTo(WW + B, 256); c.fill(); for (let i = -6; i <= 6; i++) seg(c, vx + i * 4, vy + 40, vx + i * 32, 256, 1, P); shape(c, [[vx - 6, vy + 40], [vx + 6, vy + 40], [vx + 30, 256], [vx - 30, 256]], { fill: R, lw: 1, smooth: false }); });
  L.near((c) => { arch(c, -4, 256, 200, 252, { stones: 17, fill: tone(190) }); skeletonBack(c, 96, 252, 0.9); });
};
// — boss II : la Mort, de près —
PLATES.mort = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 110, 20, 150, 90, 0); rays(c, 96, 110, 80, 160, 60, { col: P, alt: 0.5 }); });
  L.far((c) => { seg(c, 170, 256, 176, -10, 4, P); const bl = [[176, -6], [120, -14], [62, 6], [34, 36], [80, 18], [130, 12], [174, 18]]; shape(c, bl, { fill: P, lw: 2 }); shade(c, bl, 30, -14, 150, 52, { ang: 0.3, gap: 3 }); });
  L.main((c) => { const hood = [[-12, 256], [6, 150], [30, 60], [96, 18], [162, 60], [186, 150], [204, 256]]; shape(c, hood, { fill: K, stroke: P, lw: 1.6 }); bigSkull(c, 96, 128, 1.2); });
  L.near((c) => { crown(c, 96, 56, 1.4); hand(c, 40, 256, 1.1, 0.35, { bony: true, spread: 0.8 }); });
  L.extra(0.35, 'eyes', (c) => { for (const sx of [-1, 1]) { disc(c, 96 + sx * 23, 112, 6, G); disc(c, 96 + sx * 23, 112, 2.4, P); } });
};
// — boss II : la table, deux mains d'os —
PLATES.duel2 = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 120, 10, 160, 150, 0); burst(c, 96, 120, 40, 220, 24, tone(120), 0, 0.12); });
  L.far((c) => { shape(c, [[-12, 170], [30, 140], [96, 132], [162, 140], [204, 170], [204, 256], [-12, 256]], { fill: tone(60), stroke: P, lw: 1.5 }); hatch(c, -12, 132, 216, 124, { ang: 0.15, gap: 6 }); });
  L.main((c) => { for (let i = 0; i < 7; i++) cardShape(c, 40 + i * 19, 100 + Math.abs(i - 3) * 9, 26, 38, (i - 3) * 0.2, String([12, 6, 0, 7, 11, 2, 9][i])); });
  L.near((c) => { hand(c, 20, 256, 1.1, 0.5, { bony: true }); hand(c, 172, 256, 1.1, -0.5, { bony: true }); });
};
// — fin II : la faux brisée —
PLATES.faux = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 120, 10, 150, 130, 0); });
  L.main((c) => { c.fillStyle = K; c.fillRect(-B, 196, WW + 2 * B, 70); seg(c, -B, 196, WW + B, 196, 1, P); seg(c, 20, 210, 100, 190, 4, P); seg(c, 112, 196, 176, 220, 4, P); const bl = [[176, 220], [150, 176], [110, 160], [80, 166], [120, 174], [150, 192]]; shape(c, bl, { fill: P, lw: 2 }); shade(c, bl, 76, 158, 104, 64, { ang: 0.4, gap: 3 }); });
  L.near((c) => { crown(c, 60, 206, 0.8, true); c.save(); c.translate(132, 120); c.scale(0.7, 0.7); bigSkull(c, 0, 0, 1); c.restore(); });
};
// — fin II : le repos, à l'aube —
PLATES.repos = (L, r) => {
  L.bg((c) => { skyDay(c, r, 170, 5); disc(c, 96, 160, 46, P, 1.5); rays(c, 96, 160, 50, 130, 48, { alt: 0.55 }); });
  L.far((c) => { land(c, [[-12, 180], [60, 170], [130, 176], [204, 168]], { fill: tone(110), stroke: K, lw: 1 }); cloud(c, 40, 100, 60, r); cloud(c, 160, 84, 52, r); });
  L.main((c) => { tree(c, 150, 214, 130, r, { lean: -0.1, lw: 8, depth: 3 }); land(c, [[-12, 212], [80, 204], [204, 214]], { fill: K }); for (let i = 0; i < 24; i++) { const x = r() * 192, y = 208 + r() * 40; disc(c, x, y, 2, r() > 0.5 ? R : P); } });
  L.near((c) => { c.save(); c.translate(70, 222); c.rotate(-Math.PI / 2 + 0.06); skeletonBack(c, 0, 0, 0.75); c.restore(); grass(c, r, 256, { n: 70, col: P, h: 12 }); });
};
