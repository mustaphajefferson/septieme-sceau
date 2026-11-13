// ─────────────────────────────────────────────────────────────
//  Les cartes bonus (règles complètes de Flip 7) gravées pour
//  chaque deck : Gel, Trois cartes, Seconde chance, +N, ×2.
//  Mêmes outils et mêmes calques que les cartes numérotées.
// ─────────────────────────────────────────────────────────────
import { T, DECKS } from './cardart.js';
import { hand, bigSkull, crown, glow, cardShape } from './plates.js';
const { K, P, R, G, tone, WW, WH, B, TAU, shape, line, seg, disc, box, inside, hatch, shade, rays, burst, halo, skyNight, skyDay, cloud, land, grass, tree, bramble, flame, candle, skull, raven, bat, bell, bricks, pathOf } = T;
const full = (c, col = K) => { c.fillStyle = col; c.fillRect(-B, -B, WW + 2 * B, WH + 2 * B); };

/** un grand libellé gravé (« +6 », « ×2 ») : contour d'encre épais, remplissage au choix */
export function bigLabel(c, text, x, y, size, fill = G, stroke = K) {
  c.font = `700 ${size}px Grenze`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = size * 0.16; c.strokeStyle = stroke; c.strokeText(text, x, y);
  c.fillStyle = fill; c.fillText(text, x, y);
}
/** flocon à six branches */
export function snowflake(c, x, y, rr, lw = 2, col = P) {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU, ex = x + Math.cos(a) * rr, ey = y + Math.sin(a) * rr;
    seg(c, x, y, ex, ey, lw, col);
    for (const k of [0.45, 0.72]) { const bx = x + Math.cos(a) * rr * k, by = y + Math.sin(a) * rr * k, l = rr * (0.3 - k * 0.15); for (const s of [-1, 1]) seg(c, bx, by, bx + Math.cos(a + s * 0.8) * l, by + Math.sin(a + s * 0.8) * l, lw * 0.7, col); }
  }
  disc(c, x, y, lw * 1.6, col);
}
export function icicles(c, r, y, n = 14, h = 30, col = P) { for (let i = 0; i < n; i++) { const x = -8 + (i / (n - 1)) * 208 + (r() - 0.5) * 6, l = h * (0.4 + r()); shape(c, [[x - 4, y - 2], [x + 4, y - 2], [x, y + l]], { fill: col, lw: 1, smooth: false }); } }
export function coins(c, r, x, y, n, w = 26) { for (let i = 0; i < n; i++) { const yy = y - i * 5, xx = x + (r() - 0.5) * 4; c.beginPath(); c.ellipse(xx, yy, w, w * 0.32, 0, 0, TAU); c.fillStyle = G; c.fill(); c.strokeStyle = K; c.lineWidth = 1.4; c.stroke(); c.fillStyle = K; c.fillRect(xx - w, yy, 1.4, 4); c.fillRect(xx + w - 1.4, yy, 1.4, 4); } }
function helm(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const h = [[-30, 40], [-32, -10], [-24, -34], [0, -44], [24, -34], [32, -10], [30, 40]];
  shape(c, h, { fill: P, lw: 2.2 }); shade(c, h, 6, -46, 30, 90, { ang: 1.1, gap: 2.4 });
  c.fillStyle = K; c.fillRect(-26, -6, 52, 6); c.fillRect(-2, -6, 4, 40);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) disc(c, -16 + j * 5 + (i % 2) * 2, 10 + i * 6, 1.1, K);
  c.restore();
}

// ═════════════ deck du chevalier ═════════════
const S0 = {};
S0.freeze = (L, r) => {
  L.bg((c) => { full(c, tone(200)); for (let i = 0; i < 8; i++) seg(c, -12, 20 + i * 30, 204, 4 + i * 30, 1, tone(150)); });
  L.far((c) => { snowflake(c, 96, 120, 92, 3, P); snowflake(c, 96, 120, 92, 1, K); for (let i = 0; i < 14; i++) snowflake(c, r() * 192, r() * 240, 5 + r() * 6, 1, K); });
  L.main((c) => { const ice = [[30, 200], [22, 120], [44, 60], [96, 40], [148, 60], [170, 120], [162, 200], [96, 222]]; shape(c, ice, { fill: tone(225), lw: 2, smooth: false }); inside(c, pathOf(ice, false), () => { for (let i = 0; i < 9; i++) seg(c, 20 + i * 20, 40, 60 + i * 14, 222, 1, tone(140)); }); helm(c, 96, 126, 1.25); });
  L.near((c) => { icicles(c, r, -12, 16, 40, P); for (let i = 0; i < 16; i++) seg(c, -8 + i * 13, -12, -8 + i * 13, -10, 3, K); });
};
S0.three = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 90, 10, 160, 200, 0); rays(c, 96, 90, 50, 160, 40, { col: P, alt: 0.5 }); });
  L.far((c) => { c.fillStyle = tone(80); c.fillRect(-12, 20, 216, 10); box(c, -12, 20, 216, 10, 1.5, P); for (const x of [30, 96, 162]) { seg(c, x, 30, x, 46, 2, P); } });
  L.main((c) => { bell(c, 30, 48, 0.9, false); bell(c, 96, 44, 1.15, true); bell(c, 162, 48, 0.9, false); });
  L.near((c) => { cardShape(c, 54, 196, 40, 58, -0.35, '?'); cardShape(c, 96, 188, 40, 58, 0, '?'); cardShape(c, 138, 196, 40, 58, 0.35, '?'); });
};
S0.chance = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 96, 4, 130, 230, 0); burst(c, 96, 96, 30, 200, 20, P, -Math.PI / 2, 0.1); });
  L.main((c) => { candle(c, 96, 220, 90, 26, 34); line(c, [[86, 120], [70, 100], [84, 80], [66, 60]], 2, P); line(c, [[104, 124], [124, 104], [110, 84], [128, 66]], 1.4, P); });
  L.near((c) => { hand(c, 30, 256, 1.05, 0.55, { spread: 0.6 }); hand(c, 162, 256, 1.05, -0.55, { spread: 0.6 }); });
  L.pop((c) => { glow(c, r, 96, 108, 18, 120, G); });
};
S0.mod = (L, r, n) => {
  L.bg((c) => { full(c, P); for (let y = 0; y < 240; y += 6) seg(c, -12, y, 204, y, 1, tone(200)); burst(c, 96, 100, 40, 220, 28, tone(230), 0, 0.12); });
  L.far((c) => { coins(c, r, 46, 230, 7, 22); coins(c, r, 150, 226, 9, 22); coins(c, r, 96, 236, 4, 30); });
  L.main((c) => { disc(c, 96, 104, 64, K); disc(c, 96, 104, 60, G, 2, K); disc(c, 96, 104, 52, null, 1, K); for (let i = 0; i < 36; i++) { const a = (i / 36) * TAU; disc(c, 96 + Math.cos(a) * 56, 104 + Math.sin(a) * 56, 1, K); } bigLabel(c, '+' + n, 96, 108, n >= 10 ? 62 : 74, P); });
};
S0.x2 = (L, r) => {
  L.bg((c) => { full(c, P); inside(c, (q) => { q.moveTo(-12, -12); q.lineTo(204, -12); q.lineTo(-12, 252); q.closePath(); }, () => full(c, tone(150))); seg(c, 204, -12, -12, 252, 2, K); });
  L.main((c) => { crown(c, 62, 70, 1.6); c.save(); c.translate(130, 176); c.rotate(Math.PI); crown(c, 0, 0, 1.6); c.restore(); });
  L.near((c) => { disc(c, 96, 120, 38, K); disc(c, 96, 120, 34, R, 2, K); bigLabel(c, '×2', 96, 122, 52, P); });
};
DECKS[0].sart = S0;

// ═════════════ deck du squelette ═════════════
const S1 = {};
function dancer(c, x, y, s, ph) { // un squelette qui danse
  c.save(); c.translate(x, y); c.scale(s, s);
  const la = Math.sin(ph) * 0.6, ra = Math.cos(ph) * 0.6;
  seg(c, 0, -40, 0, -10, 3, P); for (let i = 0; i < 4; i++) line(c, [[-8, -36 + i * 6], [0, -38 + i * 6], [8, -36 + i * 6]], 1.4, P);
  disc(c, 0, -50, 8, P, 1.2, K); disc(c, -3, -51, 2, K); disc(c, 3, -51, 2, K);
  seg(c, -9, -36, -9 - Math.sin(la + 1) * 18, -36 + Math.cos(la + 1) * 6 - 14, 2.4, P); seg(c, 9, -36, 9 + Math.sin(ra + 1) * 18, -36 - 16, 2.4, P);
  seg(c, -4, -10, -12 + la * 8, 12, 2.6, P); seg(c, 4, -10, 12 + ra * 8, 12, 2.6, P);
  c.restore();
}
S1.freeze = (L, r) => {
  L.bg((c) => { full(c); for (let i = 0; i < 18; i++) snowflake(c, r() * 192, r() * 240, 3 + r() * 5, 1, tone(120)); });
  L.main((c) => { const body = [[56, 236], [50, 150], [58, 70], [80, 36], [112, 36], [134, 70], [142, 150], [136, 236]]; shape(c, body, { fill: P, lw: 2 }); inside(c, pathOf(body), () => { for (let i = 0; i < 18; i++) line(c, [[40, 40 + i * 12], [96, 46 + i * 12 + (i % 2) * 4], [152, 40 + i * 12]], 1.2, K); hatch(c, 110, 30, 40, 210, { ang: 1.2, gap: 2.4 }); }); disc(c, 96, 74, 18, tone(160), 1.4, K); });
  L.near((c) => { snowflake(c, 96, 150, 40, 3, G); snowflake(c, 96, 150, 40, 1, K); });
};
S1.three = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 90, y0: 120, stars: 60 }); disc(c, 96, 70, 30, P); });
  L.far((c) => { land(c, [[-12, 190], [60, 182], [130, 188], [204, 180]], { fill: K, stroke: P, lw: 1 }); });
  L.main((c) => { dancer(c, 46, 196, 1.2, 0.4); dancer(c, 96, 188, 1.35, 2.1); dancer(c, 146, 196, 1.2, 4.0); for (const [a, b] of [[58, 150], [110, 146]]) line(c, [[a, 152], [(a + b) / 2 + 2, 160], [b + 26, 150]], 1.4, P); });
  L.near((c) => { for (let i = 0; i < 9; i++) shape(c, [[i * 24 - 6, 256], [i * 24 - 2, 236], [i * 24 + 4, 236], [i * 24 + 8, 256]], { fill: tone(60), stroke: P, lw: 1, smooth: false }); });
};
S1.chance = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 110, 6, 140, 220, 0); rays(c, 96, 110, 54, 150, 48, { col: P, alt: 0.55 }); });
  L.main((c) => { bigSkull(c, 96, 118, 0.95); });
  L.near((c) => { for (const sx of [-1, 1]) { disc(c, 96 + sx * 18, 110, 7, G); disc(c, 96 + sx * 18, 110, 3, P); } line(c, [[40, 40], [60, 60], [70, 52], [90, 70]], 2, G); line(c, [[152, 40], [132, 60], [122, 52], [102, 70]], 2, G); });
  L.pop((c) => { glow(c, r, 96, 110, 28, 140, G); });
};
S1.mod = (L, r, n) => {
  L.bg((c) => { full(c); halo(c, 96, 150, 10, 160, 160, 0); });
  L.far((c) => { candle(c, 26, 236, 70, 12, 18); candle(c, 166, 236, 54, 10, 16); });
  L.main((c) => { const bowl = [[40, 170], [152, 170], [140, 206], [112, 222], [80, 222], [52, 206]]; shape(c, bowl, { fill: P, lw: 2 }); shade(c, bowl, 100, 168, 56, 60, { ang: 1.1, gap: 2.4 }); shape(c, [[84, 222], [108, 222], [116, 236], [76, 236]], { fill: tone(120), smooth: false }); coins(c, r, 96, 168, 5, 40); });
  L.near((c) => { bigLabel(c, '+' + n, 96, 92, n >= 10 ? 70 : 84, G, K); });
};
S1.x2 = (L, r) => {
  L.bg((c) => { full(c); stars(c, r); });
  L.main((c) => { for (const [x, f] of [[66, 1], [126, -1]]) { const g = [[x, 220], [x - 22 * f, 170], [x - 12 * f, 110], [x + 4 * f, 70], [x + 20 * f, 50], [x + 30 * f, 74], [x + 26 * f, 120], [x + 30 * f, 170], [x + 10 * f, 220]]; shape(c, g, { fill: f > 0 ? P : tone(180), lw: 1.6 }); disc(c, x + 16 * f, 76, 3, K); disc(c, x + 26 * f, 78, 3, K); } });
  L.near((c) => { disc(c, 96, 150, 30, K); disc(c, 96, 150, 26, R, 2, K); bigLabel(c, '×2', 96, 152, 40, P); });
};
function stars(c, r, n = 60) { c.fillStyle = P; for (let i = 0; i < n; i++) c.fillRect((r() * 216 - 12) | 0, (r() * 264 - 12) | 0, 1, 1); }
export const SART1 = S1;
