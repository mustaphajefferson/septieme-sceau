// ─────────────────────────────────────────────────────────────
//  Le grimoire de la Sorcière (parcours III) : treize gravures
//  originales et ses cinq cartes bonus. Encre de nuit, vélin,
//  bleu de lapis et or. Cadre « grimoire » : fenêtre à coins
//  coupés, chiffres aux deux coins, titre sur un phylactère.
// ─────────────────────────────────────────────────────────────
import { T, registerDeck } from './cardart.js';
import { hand, crown, glow } from './plates.js';
import { bigLabel, snowflake, coins, icicles } from './specials.js';
const { K, P, R, G, tone, WW, WH, B, TAU, shape, line, seg, disc, box, inside, hatch, shade, rays, burst, halo, skyNight, skyDay, cloud, land, grass, tree, bramble, flame, candle, skull, raven, bat, bird, moth, bricks, pathOf, wing } = T;
const full = (c, col = K) => { c.fillStyle = col; c.fillRect(-B, -B, WW + 2 * B, WH + 2 * B); };
const stars = (c, r, n = 60, y1 = 240) => { c.fillStyle = P; for (let i = 0; i < n; i++) { const x = (r() * 216 - 12) | 0, y = (r() * (y1 + 12) - 12) | 0; c.fillRect(x, y, 1, 1); if (r() > 0.88) { c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3); } } };

export const NAMES3 = ['La Lune noire', 'Le Feu-follet', 'Le Crapaud', 'La Chouette', 'Le Chaudron', 'Le Grimoire', 'Le Balai', 'Les Cimes', 'Le Loup blanc', "L'Œuf", 'La Griffe', 'Le Trésor', 'Le Dragon'];
export const COLORS3 = ['#000000', '#0b0f1a', '#e8e2d0', '#3d6fc4', '#e0a83a']; // vide, encre de nuit, vélin, lapis, or

// ── sujets ────────────────────────────────────────────────────
function reeds(c, r, y, n = 30, h = 50, col = K) { for (let i = 0; i < n; i++) { const x = -10 + r() * 212, hh = h * (0.5 + r() * 0.7), l = (r() - 0.5) * 10; line(c, [[x, y], [x + l * 0.4, y - hh * 0.6], [x + l, y - hh]], 1.6, col); if (r() > 0.6) { c.beginPath(); c.ellipse(x + l, y - hh - 5, 2.2, 6, l * 0.02, 0, TAU); c.fillStyle = col; c.fill(); } } }
function owl(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const body = [[0, -46], [20, -40], [28, -14], [24, 18], [10, 34], [-10, 34], [-24, 18], [-28, -14], [-20, -40]]; shape(c, body, { fill: P, lw: 2 });
  inside(c, pathOf(body), () => { for (let i = 0; i < 6; i++) for (let j = -2; j <= 2; j++) { c.beginPath(); c.arc(j * 9 + (i % 2) * 4, -4 + i * 7, 3.5, 0, Math.PI); c.strokeStyle = K; c.lineWidth = 1; c.stroke(); } hatch(c, 8, -46, 22, 82, { ang: 1.1, gap: 2.4 }); });
  for (const sx of [-1, 1]) { shape(c, [[sx * 14, -40], [sx * 22, -54], [sx * 6, -44]], { fill: K, lw: 0, smooth: false }); disc(c, sx * 10, -28, 9, P, 1.4, K); disc(c, sx * 10, -28, 5.5, G, 1, K); disc(c, sx * 10, -28, 2.4, K); }
  shape(c, [[-3, -22], [3, -22], [0, -14]], { fill: G, lw: 1, smooth: false });
  for (const sx of [-1, 1]) for (let k = -1; k <= 1; k++) seg(c, sx * 8 + k * 3, 34, sx * 8 + k * 4, 40, 1.4, K);
  c.restore();
}
function cauldron(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const pot = [[-50, -20], [50, -20], [56, 6], [44, 34], [-44, 34], [-56, 6]]; shape(c, pot, { fill: tone(70), lw: 2.4 }); shade(c, pot, 10, -22, 50, 60, { ang: 1.1, gap: 2.2, col: K });
  c.beginPath(); c.ellipse(0, -20, 50, 10, 0, 0, TAU); c.fillStyle = R; c.fill(); c.strokeStyle = K; c.lineWidth = 2; c.stroke();
  for (const sx of [-1, 1]) { seg(c, sx * 30, 34, sx * 38, 50, 3, K); }
  c.restore();
}
function dragonHead(c, x, y, s, flip = 1) {
  c.save(); c.translate(x, y); c.scale(s * flip, s);
  const hd = [[-40, 20], [-34, -10], [-14, -26], [16, -28], [52, -18], [82, -14], [92, -4], [80, 6], [58, 8], [70, 18], [52, 26], [20, 22], [0, 34], [-20, 40]];
  shape(c, hd, { fill: P, lw: 2 }); shade(c, hd, -40, 0, 140, 40, { ang: 0.4, gap: 2.6 });
  for (let i = 0; i < 6; i++) shape(c, [[60 + i * 5, 8], [62 + i * 5, 14], [64 + i * 5, 8]], { fill: P, lw: 0.8, smooth: false });
  line(c, [[-14, -26], [-30, -56], [-24, -70]], 4, K); line(c, [[2, -28], [-6, -52], [4, -64]], 3, K);
  shape(c, [[24, -16], [40, -18], [36, -10], [24, -10]], { fill: G, lw: 1.2, smooth: false }); disc(c, 32, -14, 1.8, K);
  disc(c, 84, -10, 2, K);
  for (let i = 0; i < 7; i++) shape(c, [[-30 + i * 10, -18 - (i < 3 ? i * 3 : 6)], [-24 + i * 10, -30 - (i < 3 ? i * 3 : 6)], [-20 + i * 10, -18 - (i < 3 ? i * 3 : 6)]], { fill: K, lw: 0, smooth: false });
  c.restore();
}
function bigCoin(c, x, y, rr, mark = true) { disc(c, x, y, rr + 2, K); disc(c, x, y, rr, G, 1.6, K); disc(c, x, y, rr * 0.8, null, 1, K); if (mark) { c.save(); c.translate(x, y); c.scale(rr / 30, rr / 30); dragonHead(c, -8, 6, 0.3); c.restore(); } }
function flask(c, x, y, s, fill = R) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const f = [[-6, -46], [6, -46], [6, -26], [26, 0], [26, 22], [16, 34], [-16, 34], [-26, 22], [-26, 0], [-6, -26]]; shape(c, f, { fill: P, lw: 2, smooth: false });
  inside(c, pathOf(f, false), () => { c.fillStyle = fill; c.fillRect(-30, 4, 60, 40); for (let i = 0; i < 5; i++) disc(c, -12 + i * 6, 12 + (i % 2) * 8, 2.4, P); hatch(c, 10, -50, 20, 90, { ang: 1.1, gap: 2.4 }); });
  shape(c, [[-9, -46], [9, -46], [8, -54], [-8, -54]], { fill: tone(120), lw: 1.4, smooth: false });
  c.restore();
}

// ═════════════ les treize ═════════════
export const ART3 = [];
// 0 — La Lune noire : l'éclipse au-dessus du marais
ART3[0] = (L, r) => {
  L.bg((c) => { full(c); stars(c, r, 80, 150); disc(c, 96, 84, 50, G); disc(c, 96, 84, 46, K); rays(c, 96, 84, 52, 90, 48, { col: G, alt: 0.4 }); });
  L.far((c) => { land(c, [[-12, 176], [204, 176]], { fill: tone(40), lw: 0 }); for (let i = 0; i < 26; i++) { const y = 180 + r() * 60; seg(c, r() * 192 - 12, y, r() * 192 + 20, y, 1, tone(140)); } });
  L.main((c) => { reeds(c, r, 256, 40, 70); });
  L.near((c) => { reeds(c, r, 262, 14, 120); });
  L.pop((c) => { bat(c, 150, 50, 0.6, 0.3); });
};
// 1 — Le Feu-follet : la lueur qui égare
ART3[1] = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 70, y0: 140, stars: 40 }); });
  L.far((c) => { for (let i = 0; i < 6; i++) tree(c, -10 + i * 40, 190, 70 + r() * 30, r, { lw: 3, depth: 3 }); c.fillStyle = K; c.fillRect(-B, 188, WW + 2 * B, 80); });
  L.main((c) => { reeds(c, r, 240, 34, 50, P); for (let i = 0; i < 30; i++) { const y = 200 + r() * 40; seg(c, r() * 200 - 12, y, r() * 200 + 14, y, 1, tone(120)); } });
  L.near((c) => { reeds(c, r, 262, 10, 110); });
  L.pop((c) => { glow(c, r, 96, 110, 34, 400, G); disc(c, 96, 110, 8, P); glow(c, r, 44, 150, 12, 60, G); glow(c, r, 156, 140, 10, 50, G); });
};
// 2 — Le Crapaud : le roi de la mare
ART3[2] = (L, r) => {
  L.bg((c) => { skyDay(c, r, 140, 6); disc(c, 150, 50, 22, P, 1.5); });
  L.far((c) => { c.fillStyle = tone(90); c.fillRect(-B, 140, WW + 2 * B, 120); for (let i = 0; i < 20; i++) { const y = 146 + r() * 100; seg(c, r() * 200 - 12, y, r() * 200 + 20, y, 1, P); } });
  L.main((c) => {
    c.beginPath(); c.ellipse(96, 206, 70, 18, 0, 0, TAU); c.fillStyle = P; c.fill(); c.strokeStyle = K; c.lineWidth = 2; c.stroke(); seg(c, 96, 206, 150, 196, 2, K);
    const fr = [[44, 200], [40, 160], [60, 132], [96, 124], [132, 132], [152, 160], [148, 200]]; shape(c, fr, { fill: tone(170), lw: 2.2 }); shade(c, fr, 100, 120, 60, 84, { ang: 1.1, gap: 2.4 });
    for (let i = 0; i < 10; i++) disc(c, 60 + r() * 72, 150 + r() * 40, 2 + r() * 2, K);
    for (const sx of [-1, 1]) { disc(c, 96 + sx * 26, 128, 14, P, 2, K); disc(c, 96 + sx * 26, 128, 8, G, 1, K); c.fillStyle = K; c.fillRect(96 + sx * 26 - 6, 127, 12, 3); }
    seg(c, 62, 156, 130, 156, 2, K); crown(c, 96, 112, 0.9);
  });
  L.near((c) => { reeds(c, r, 262, 10, 90); });
  L.pop((c) => { moth(c, 40, 60, 1.1, 0.3); });
};
// 3 — La Chouette : la gardienne de la nuit
ART3[3] = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 60, y0: 160, stars: 60 }); disc(c, 96, 96, 70, tone(220)); disc(c, 96, 96, 70, null, 1.5, P); });
  L.main((c) => { line(c, [[-12, 170], [60, 162], [130, 168], [204, 156]], 9, K); for (const [x, a] of [[30, -0.6], [160, 0.5]]) line(c, [[x, 166], [x + Math.sin(a) * 30, 140], [x + Math.sin(a) * 40, 120]], 3, K); owl(c, 96, 130, 1.4); });
  L.near((c) => { for (let i = 0; i < 9; i++) { const x = r() * 192; c.beginPath(); c.ellipse(x, 178 + r() * 30, 6, 3, r(), 0, TAU); c.fillStyle = K; c.fill(); } });
};
// 4 — Le Chaudron : la potion qui bout
ART3[4] = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 150, 10, 150, 170, 0); bricks(c, -B, -B, WW + 2 * B, 180, { bh: 13, bw: 28 }); });
  L.far((c) => { for (let i = 0; i < 6; i++) flame(c, 50 + i * 18, 250, 28 + r() * 20); });
  L.main((c) => { cauldron(c, 96, 196, 1.05); for (let i = 0; i < 10; i++) disc(c, 60 + r() * 72, 172 + r() * 8, 2 + r() * 4, P, 1, K); });
  L.near((c) => { for (let i = 0; i < 4; i++) { const yy = 150 - i * 30; line(c, [[96 + Math.sin(i) * 10, yy], [96 - 12 + Math.cos(i) * 8, yy - 14], [96 + 6, yy - 28]], 2, P); } skull(c, 74, 112, 0.9, -0.3); });
  L.pop((c) => { for (let i = 0; i < 14; i++) disc(c, 40 + r() * 112, 20 + r() * 120, 1 + r() * 2, r() > 0.5 ? G : R); });
};
// 5 — Le Grimoire : le livre ouvert, les sigles qui s'élèvent
ART3[5] = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 140, 6, 150, 200, 0); rays(c, 96, 150, 40, 160, 40, { col: P, alt: 0.55 }); });
  L.main((c) => {
    for (const sx of [-1, 1]) { const pg = [[96, 164], [96 + sx * 80, 150], [96 + sx * 84, 210], [96, 222]]; shape(c, pg, { fill: P, lw: 2, smooth: false }); for (let i = 0; i < 8; i++) seg(c, 96 + sx * 10, 172 + i * 6, 96 + sx * (60 + (i % 3) * 6), 166 + i * 6, 1, K); }
    shape(c, [[16, 210], [96, 222], [176, 210], [178, 222], [96, 234], [14, 222]], { fill: tone(70), lw: 1.6, smooth: false });
  });
  L.near((c) => { c.save(); c.translate(96, 90); disc(c, 0, 0, 40, null, 2, G); disc(c, 0, 0, 32, null, 1, G); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i / 5) * TAU, b = -Math.PI / 2 + ((i + 2) / 5) * TAU; seg(c, Math.cos(a) * 32, Math.sin(a) * 32, Math.cos(b) * 32, Math.sin(b) * 32, 1.5, G); } c.restore(); });
  L.pop((c) => { for (let i = 0; i < 12; i++) { const x = 30 + r() * 132, y = 30 + r() * 100; c.fillStyle = G; c.font = '700 12px Grenze'; c.fillText('ᚠᚱᛟᛞᛗᛉ'[i % 6], x, y); } });
};
// 6 — Le Balai : la sorcière passe devant la lune
ART3[6] = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 80, y0: 170, stars: 70 }); disc(c, 110, 100, 64, P); disc(c, 110, 100, 64, null, 1.5, K); for (let i = 0; i < 4; i++) cloud(c, 30 + i * 46, 196 - (i % 2) * 14, 60, r, { fill: tone(60) }); });
  L.main((c) => {
    c.save(); c.translate(100, 108); c.rotate(-0.18);
    seg(c, -70, 10, 50, 0, 3, K); for (let i = 0; i < 9; i++) seg(c, 46, 0, 72, -10 + i * 2.6, 1.6, K);
    shape(c, [[-10, 6], [-22, -26], [-6, -50], [8, -34], [10, 4]], { fill: K, lw: 0 }); disc(c, -6, -46, 7, K);
    shape(c, [[-24, -50], [10, -52], [-2, -86]], { fill: K, lw: 0, smooth: false }); line(c, [[0, -30], [-30, -10], [-44, 4]], 3, K);
    c.restore();
  });
  L.pop((c) => { bat(c, 40, 50, 0.7, -0.3); bat(c, 170, 160, 0.5, 0.4); });
};
// 7 — Les Cimes : le col sous la neige
ART3[7] = (L, r) => {
  L.bg((c) => { skyDay(c, r, 170, 5); disc(c, 40, 50, 18, P, 1.5); });
  L.far((c) => { const mt = [[-14, 200], [20, 90], [44, 130], [92, 30], [140, 120], [166, 70], [206, 200]]; shape(c, mt, { fill: P, lw: 2, smooth: false }); inside(c, pathOf(mt, false), () => { hatch(c, 92, 20, 120, 200, { ang: 1.0, gap: 3 }); for (const [x, y] of [[92, 30], [20, 90], [166, 70]]) shape(c, [[x - 18, y + 30], [x, y], [x + 18, y + 30], [x + 8, y + 24], [x, y + 34], [x - 8, y + 24]], { fill: P, lw: 1, smooth: false }); }); });
  L.main((c) => { land(c, [[-12, 210], [80, 196], [204, 214]], { fill: P }); for (let i = 0; i < 9; i++) { const x = r() * 192, s2 = 0.5 + r() * 0.5; for (let j = 0; j < 3; j++) shape(c, [[x - 12 * s2 + j * 3 * s2, 236 - j * 12 * s2], [x, 214 - j * 12 * s2 - 10 * s2], [x + 12 * s2 - j * 3 * s2, 236 - j * 12 * s2]], { fill: K, lw: 0, smooth: false }); } });
  L.near((c) => { for (let i = 0; i < 30; i++) snowflake(c, r() * 192, r() * 240, 2 + r() * 3, 1, P); });
};
// 8 — Le Loup blanc : le hurlement
ART3[8] = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 90, y0: 150, stars: 60 }); disc(c, 130, 70, 40, P); });
  L.far((c) => { land(c, [[-12, 196], [100, 170], [204, 190]], { fill: tone(200), stroke: K, lw: 1.5 }); });
  L.main((c) => {
    const w = [[30, 256], [40, 210], [60, 186], [78, 150], [86, 120], [98, 100], [112, 80], [118, 92], [114, 104], [120, 116], [108, 124], [104, 150], [118, 200], [130, 256]];
    shape(c, w, { fill: P, lw: 2 }); shade(c, w, 60, 80, 70, 180, { ang: 1.1, gap: 2.6 });
    shape(c, [[100, 92], [104, 76], [110, 88]], { fill: P, lw: 1.4, smooth: false }); disc(c, 108, 98, 1.6, K);
    for (let i = 0; i < 8; i++) line(c, [[60 + i * 5, 180 + i * 6], [52 + i * 5, 190 + i * 6]], 1, K);
  });
  L.pop((c) => { for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(118, 80, 10 + i * 8, -1.4, -0.4); c.strokeStyle = P; c.lineWidth = 1.2; c.stroke(); } });
};
// 9 — L'Œuf : l'œuf de dragon dans son nid de braises
ART3[9] = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 140, 10, 150, 180, 0); });
  L.far((c) => { for (let i = 0; i < 8; i++) flame(c, 20 + i * 22, 236, 40 + r() * 30, false); });
  L.main((c) => {
    const egg = [[96, 60], [130, 90], [142, 140], [132, 190], [96, 206], [60, 190], [50, 140], [62, 90]]; shape(c, egg, { fill: P, lw: 2.4 });
    inside(c, pathOf(egg), () => { for (let y = 70; y < 210; y += 10) for (let x = 50 + ((y / 10) % 2) * 6; x < 146; x += 12) { c.beginPath(); c.arc(x, y, 6, 0, Math.PI); c.strokeStyle = K; c.lineWidth = 1; c.stroke(); } hatch(c, 106, 50, 40, 160, { ang: 1.1, gap: 2.2 }); });
    line(c, [[96, 60], [100, 84], [90, 100], [98, 120]], 2, R);
  });
  L.near((c) => { for (let i = 0; i < 10; i++) { const x = 30 + i * 14; shape(c, [[x - 8, 240], [x, 212 + r() * 10], [x + 8, 240]], { fill: K, stroke: P, lw: 1, smooth: false }); } });
  L.pop((c) => { for (let i = 0; i < 16; i++) disc(c, r() * 192, r() * 120, 1, G); });
};
// 10 — La Griffe : posée sur l'or
ART3[10] = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 200, 10, 180, 160, 0); });
  L.far((c) => { coins(c, r, 40, 240, 8, 24); coins(c, r, 150, 244, 10, 24); coins(c, r, 96, 250, 6, 34); });
  L.main((c) => {
    const arm = [[60, -12], [140, -12], [134, 60], [120, 110], [80, 114], [66, 60]]; shape(c, arm, { fill: tone(90), lw: 2 });
    inside(c, pathOf(arm), () => { for (let y = -10; y < 120; y += 9) for (let x = 56 + ((y / 9 | 0) % 2) * 5; x < 146; x += 10) { c.beginPath(); c.arc(x, y, 5, 0, Math.PI); c.strokeStyle = K; c.lineWidth = 1; c.stroke(); } });
    for (const [x, a] of [[70, 0.5], [92, 0.15], [114, -0.15], [134, -0.5]]) { line(c, [[x, 104], [x + Math.sin(a) * 18, 140], [x + Math.sin(a) * 26, 170]], 7, K); shape(c, [[x + Math.sin(a) * 26 - 5, 168], [x + Math.sin(a) * 30 + 5, 168], [x + Math.sin(a) * 34, 196]], { fill: P, lw: 1.4, smooth: false }); }
  });
  L.pop((c) => { bigCoin(c, 40, 160, 16, false); });
};
// 11 — Le Trésor : la couronne, le calice, les pièces
ART3[11] = (L, r) => {
  L.bg((c) => { full(c, P); burst(c, 96, 110, 20, 220, 30, tone(220), 0, 0.12); });
  L.far((c) => { coins(c, r, 30, 236, 9, 24); coins(c, r, 164, 236, 11, 24); for (let i = 0; i < 26; i++) bigCoin(c, r() * 192, 200 + r() * 40, 7, false); });
  L.main((c) => {
    const cup = [[66, 60], [126, 60], [118, 100], [104, 116], [102, 160], [122, 176], [70, 176], [90, 160], [88, 116], [74, 100]]; shape(c, cup, { fill: G, lw: 2, smooth: false }); shade(c, cup, 100, 56, 30, 124, { ang: 1.1, gap: 2.4 });
    for (const x of [80, 96, 112]) disc(c, x, 80, 4, R, 1);
  });
  L.near((c) => { crown(c, 96, 52, 1.5); for (let i = 0; i < 5; i++) disc(c, 40 + i * 28, 220, 5, R, 1.2); });
};
// 12 — Le Dragon
ART3[12] = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 120, 10, 170, 150, 0); burst(c, 96, 120, 40, 220, 26, tone(120), 0, 0.12); });
  L.far((c) => { wing(c, 140, 80, 1); wing(c, 52, 80, -1); });
  L.main((c) => { line(c, [[96, 260], [70, 210], [90, 170], [70, 140]], 26, K); line(c, [[96, 260], [70, 210], [90, 170], [70, 140]], 20, P); for (let i = 0; i < 8; i++) seg(c, 80 + (i % 2) * 6, 250 - i * 14, 98 - (i % 2) * 6, 246 - i * 14, 1.5, K); dragonHead(c, 66, 130, 1.0); });
  L.pop((c) => { for (let i = 0; i < 4; i++) flame(c, 166 + i * 8, 140 - i * 4, 24 - i * 3); });
};

// ═════════════ les bonus ═════════════
const S3 = {};
S3.freeze = (L, r) => { // le sortilège de givre : la baguette, le flocon
  L.bg((c) => { full(c); stars(c, r, 50); halo(c, 96, 96, 10, 140, 150, 0); });
  L.main((c) => { snowflake(c, 96, 96, 70, 4, P); snowflake(c, 96, 96, 70, 1.5, R); disc(c, 96, 96, 12, G, 1.5, K); });
  L.near((c) => { icicles(c, r, -12, 14, 30, P); seg(c, 40, 250, 120, 140, 5, K); seg(c, 40, 250, 120, 140, 3, G); hand(c, 30, 262, 1, 0.6, { spread: 0.4, fill: tone(150) }); });
  L.pop((c) => { glow(c, r, 120, 140, 14, 80, P); });
};
S3.three = (L, r) => { // le triple sort : trois yeux dans la fumée du chaudron
  L.bg((c) => { full(c); halo(c, 96, 200, 10, 160, 150, 0); });
  L.main((c) => { cauldron(c, 96, 210, 0.85); for (let i = 0; i < 3; i++) { const x = 46 + i * 50, y = 90 + (i % 2) * -20; line(c, [[96, 190], [x + 4, 150], [x, y + 20]], 6, tone(150)); c.beginPath(); c.ellipse(x, y, 20, 12, 0, 0, TAU); c.fillStyle = P; c.fill(); c.strokeStyle = K; c.lineWidth = 2; c.stroke(); disc(c, x, y, 7, G, 1, K); disc(c, x, y, 3, K); } });
};
S3.chance = (L, r) => { // la fiole de vie
  L.bg((c) => { full(c); halo(c, 96, 120, 10, 150, 210, 0); rays(c, 96, 120, 60, 160, 44, { col: P, alt: 0.55 }); });
  L.main((c) => { flask(c, 96, 140, 1.7, R); });
  L.pop((c) => { glow(c, r, 96, 160, 40, 220, G); });
};
S3.mod = (L, r, n) => { // l'or du dragon
  L.bg((c) => { full(c); halo(c, 96, 200, 10, 180, 170, 0); });
  L.far((c) => { coins(c, r, 40, 246, 9, 24); coins(c, r, 152, 246, 11, 24); for (let i = 0; i < 20; i++) bigCoin(c, r() * 192, 214 + r() * 30, 7, false); });
  L.main((c) => { bigCoin(c, 96, 100, 58, false); });
  L.near((c) => { bigLabel(c, '+' + n, 96, 102, n >= 10 ? 60 : 72, P, K); });
};
S3.x2 = (L, r) => { // le miroir : la sorcière et son reflet
  L.bg((c) => { full(c); stars(c, r, 40); });
  L.main((c) => {
    const fr = [[96, 18], [150, 46], [162, 120], [150, 200], [96, 226], [42, 200], [30, 120], [42, 46]]; shape(c, fr, { fill: G, lw: 2 }); const gl = fr.map(([x, y]) => [96 + (x - 96) * 0.84, 122 + (y - 122) * 0.86]); shape(c, gl, { fill: tone(170), lw: 1.6 });
    inside(c, pathOf(gl), () => { for (let i = 0; i < 12; i++) seg(c, 30 + i * 14, 20, 10 + i * 14, 230, 1, P); });
  });
  L.near((c) => { disc(c, 96, 122, 32, K); disc(c, 96, 122, 28, R, 2, K); bigLabel(c, '×2', 96, 124, 44, P); });
};

// ── le cadre « grimoire » ──
const { CW, CH } = T, WIN = { x: 16, y: 34 };
function lattice(c) { c.save(); c.beginPath(); c.rect(0, 0, CW, CH); c.clip(); c.strokeStyle = tone(110); c.lineWidth = 1; for (let d = -CH; d < CW + CH; d += 10) { seg(c, d, 0, d + CH, CH, 1, tone(110)); seg(c, d, 0, d - CH, CH, 1, tone(110)); } c.restore(); }
function frame3(c, v, title) {
  c.fillStyle = K; c.fillRect(0, 0, CW, CH); lattice(c);
  const { x: wx, y: wy } = WIN, cut = 14;
  const win = [[wx + cut, wy], [wx + WW - cut, wy], [wx + WW, wy + cut], [wx + WW, wy + WH - cut], [wx + WW - cut, wy + WH], [wx + cut, wy + WH], [wx, wy + WH - cut], [wx, wy + cut]];
  c.save(); c.beginPath(); win.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = K; c.fill(); c.globalCompositeOperation = 'destination-out'; c.fill(); c.restore();
  shape(c, win, { fill: null, stroke: G, lw: 2.4, smooth: false });
  shape(c, win.map(([x, y]) => [CW / 2 + (x - CW / 2) * 1.035, wy + WH / 2 + (y - wy - WH / 2) * 1.03]), { fill: null, stroke: P, lw: 1, smooth: false });
  box(c, 3, 3, CW - 6, CH - 6, 2, G); box(c, 7, 7, CW - 14, CH - 14, 1, P);
  // phylactère
  const y0 = wy + WH + 8, rib = [[18, y0], [CW - 18, y0], [CW - 6, y0 + 14], [CW - 18, y0 + 28], [18, y0 + 28], [6, y0 + 14]];
  shape(c, rib, { fill: P, stroke: K, lw: 1.5, smooth: false });
  for (const sx of [-1, 1]) shape(c, [[CW / 2 + sx * (CW / 2 - 18), y0], [CW / 2 + sx * (CW / 2 - 10), y0 - 6], [CW / 2 + sx * (CW / 2 - 18), y0 + 6]], { fill: R, lw: 1, smooth: false });
  c.fillStyle = K; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  let fs = 20; c.font = `700 ${fs}px Grenze`; while (c.measureText(title).width > CW - 56 && fs > 12) c.font = `700 ${--fs}px Grenze`;
  c.fillText(title, CW / 2, y0 + 20);
  for (let i = -1; i <= 1; i++) shape(c, [[CW / 2 + i * 14, CH - 14], [CW / 2 + i * 14 + 4, CH - 10], [CW / 2 + i * 14, CH - 6], [CW / 2 + i * 14 - 4, CH - 10]], { fill: G, lw: 0.8, smooth: false });
}
function tab3(c, v) {
  if (typeof v !== 'number' && v[0] !== 'm' && v !== 'x2') return;
  const lab = typeof v === 'number' ? String(v) : v[0] === 'm' ? '+' + v.slice(1) : '×2';
  const pip = (x, y, rot) => { c.save(); c.translate(x, y); c.rotate(rot); disc(c, 0, 0, 19, K); disc(c, 0, 0, 16.5, G, 1.6, K); c.fillStyle = K; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = `700 ${lab.length > 2 ? 16 : lab.length > 1 ? 21 : 26}px Grenze`; c.fillText(lab, 0, 8); c.restore(); };
  pip(WIN.x + 8, WIN.y + 8, 0); pip(WIN.x + WW - 8, WIN.y + WH - 8, Math.PI);
}
function back3(c) { c.save(); c.translate(CW / 2, CH / 2); disc(c, 0, 0, 40, null, 2, P); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i / 5) * TAU, b = -Math.PI / 2 + ((i + 2) / 5) * TAU; seg(c, Math.cos(a) * 40, Math.sin(a) * 40, Math.cos(b) * 40, Math.sin(b) * 40, 2, P); } c.restore(); }

registerDeck(2, { names: { ...NAMES3, freeze: 'Le Sort de givre', three: 'Le Triple Sort', chance: 'La Fiole de vie', mod: 'Or du dragon', x2: 'Le Miroir' }, colors: COLORS3, art: ART3, sart: S3, frame: frame3, tab: tab3, win: WIN, backMark: back3 });
