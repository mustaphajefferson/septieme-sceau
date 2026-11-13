// ─────────────────────────────────────────────────────────────
//  Le deck du squelette : treize gravures originales sur le
//  royaume des morts. Papier d'os, encre noire, deux encres :
//  sang et lueur spectrale (les couleurs du deck remplacent
//  rouille et or au tramage).
// ─────────────────────────────────────────────────────────────
import { T, registerDeck } from './cardart.js';
import { hand, bigSkull, crown, arch, bars, glow, column, angel, scales } from './plates.js';
import { SART1 } from './specials.js';
const { K, P, R, G, tone, WW, WH, B, TAU, shape, line, seg, disc, box, inside, hatch, shade, rays, burst, halo, skyNight, skyDay, cloud, land, grass, tree, bramble, flame, candle, skull, raven, bat, bricks, pathOf } = T;
const full = (c, col = K) => { c.fillStyle = col; c.fillRect(-B, -B, WW + 2 * B, WH + 2 * B); };

export const NAMES2 = ["L'Oubli", "L'Obole", 'Le Sablier', 'Le Passeur', 'La Balance', 'Le Chien des enfers', 'La Faux', 'Le Septième Cercle', "L'Ossuaire", 'Le Brasier', 'La Porte', 'Le Cœur', 'Le Jugement'];
export const COLORS2 = ['#000000', '#0b0a0e', '#dcd6c8', '#b3222e', '#6fcdb4']; // vide, encre, os, sang, lueur

/** une silhouette encapuchonnée (de face ou de profil), (x, y) = les pieds */
function hooded(c, x, y, s, { lantern = false, pole = false, flip = 1 } = {}) {
  c.save(); c.translate(x, y); c.scale(s * flip, s);
  if (pole) seg(c, 14, -96, 22, 30, 2.4, K);
  const robe = [[-14, 0], [-17, -30], [-12, -60], [-8, -74], [-3, -80], [6, -80], [11, -72], [13, -58], [17, -30], [15, 0]];
  shape(c, robe, { fill: K, stroke: P, lw: 1.2 });
  inside(c, pathOf(robe), () => hatch(c, 4, -82, 16, 84, { ang: 1.15, gap: 2.2, col: P }));
  c.beginPath(); c.ellipse(2, -69, 5.5, 7, 0, 0, TAU); c.fillStyle = K; c.fill(); c.strokeStyle = P; c.lineWidth = 1; c.stroke();
  disc(c, 0, -70, 1.1, G); disc(c, 4.5, -70, 1.1, G);
  line(c, [[-6, -62], [-8, -30], [-7, -2]], 1, P); line(c, [[-12, -58], [-20, -36], [-14, -30]], 1, P);
  if (lantern) { seg(c, 12, -48, 22, -40, 2.5, K); seg(c, 22, -40, 22, -34, 1, P); shape(c, [[18, -34], [26, -34], [27, -22], [17, -22]], { fill: G, lw: 1.2, smooth: false }); }
  c.restore();
}
function boat(c, x, y, w) {
  const hull = [[x - w / 2 - 8, y - 8], [x + w / 2 + 10, y - 10], [x + w / 2 - 6, y + 4], [x - w / 2 + 4, y + 5]];
  shape(c, hull, { fill: tone(70), stroke: P, lw: 1.4, smooth: false }); hatch(c, x - w / 2, y - 8, w, 14, { ang: 0, gap: 3 });
}
function ripples(c, r, y0, y1, n = 26, col = P) { for (let i = 0; i < n; i++) { const y = y0 + r() * (y1 - y0), x = -10 + r() * 200, l = 6 + r() * 26; seg(c, x, y, x + l, y, 1, col); } }
function heart(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const h = [[0, 22], [-16, 6], [-20, -8], [-14, -18], [-4, -18], [0, -10], [4, -20], [14, -20], [20, -8], [16, 6]];
  shape(c, h, { fill: R, lw: 1.6 }); shade(c, h, 2, -22, 22, 46, { ang: 1.1, gap: 2.4 });
  line(c, [[-4, -18], [-6, -28], [-2, -34]], 3, K); line(c, [[6, -20], [8, -30], [12, -34]], 3, K);
  line(c, [[-10, -4], [-4, 6], [0, 14]], 1, K); line(c, [[8, -8], [6, 4]], 1, K);
  c.restore();
}
function dogHead(c, x, y, s, a) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  const hd = [[-10, 14], [-14, -2], [-10, -14], [-14, -30], [-4, -20], [4, -22], [10, -32], [12, -16], [18, -4], [34, 2], [36, 10], [24, 14], [12, 20], [0, 22]];
  shape(c, hd, { fill: K, stroke: P, lw: 1.4 });
  shape(c, [[6, -6], [14, -8], [12, -2]], { fill: R, lw: 0, smooth: false });
  for (let i = 0; i < 4; i++) shape(c, [[18 + i * 4, 12], [20 + i * 4, 17], [22 + i * 4, 12]], { fill: P, lw: 0, smooth: false });
  line(c, [[-8, 0], [-4, 10], [4, 16]], 1, P);
  c.restore();
}

export const ART2 = [];
// 0 — L'Oubli : une barque seule sur le lac immobile
ART2[0] = (L, r) => {
  L.bg((c) => { full(c); disc(c, 96, 84, 56, tone(225)); disc(c, 96, 84, 56, null, 1.5, P); for (let i = 0; i < 6; i++) seg(c, 40, 70 + i * 10, 152, 70 + i * 10, 1, tone(150)); });
  L.far((c) => { c.fillStyle = K; c.fillRect(-B, 150, WW + 2 * B, 110); for (let i = 0; i < 4; i++) shape(c, [[-12, 152 + i], [60, 140 + i * 2], [120, 146], [204, 138 + i]], { fill: null, stroke: tone(60), lw: 1, closed: false }); });
  L.main((c) => { ripples(c, r, 160, 236, 40, tone(170)); for (let i = 0; i < 8; i++) seg(c, 76 - i * 2, 186 + i * 5, 118 + i * 2, 186 + i * 5, 1, tone(200)); boat(c, 96, 180, 64); hooded(c, 96, 176, 0.62, { lantern: true }); });
  L.near((c) => { grass(c, r, 256, { n: 40, h: 34, col: K, x0: -12, x1: 40 }); grass(c, r, 256, { n: 30, h: 28, col: K, x0: 160, x1: 204 }); });
  L.pop((c) => { glow(c, r, 112, 148, 14, 90, G); });
};
// 1 — L'Obole : une main d'os tend la pièce du passeur
ART2[1] = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 86, 8, 140, 190, 0); rays(c, 96, 86, 40, 120, 36, { col: P, alt: 0.5 }); });
  L.main((c) => { hand(c, 96, 236, 1.6, 0.04, { bony: true, spread: 0.7 }); });
  L.pop((c) => { disc(c, 96, 86, 30, G, 2, K); disc(c, 96, 86, 24, null, 1, K); skull(c, 96, 84, 1.2); for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU; disc(c, 96 + Math.cos(a) * 27, 86 + Math.sin(a) * 27, 0.9, K); } });
};
// 2 — Le Sablier : le temps des morts
ART2[2] = (L, r) => {
  L.bg((c) => { skyDay(c, r, 260, 6); });
  L.far((c) => { candle(c, 28, 226, 50, 10, 16); candle(c, 166, 226, 40, 9, 14); c.fillStyle = K; c.fillRect(-B, 226, WW + 2 * B, 40); });
  L.main((c) => {
    for (const y of [26, 214]) { shape(c, [[46, y], [146, y], [140, y + 12], [52, y + 12]], { fill: tone(110), smooth: false }); }
    for (const x of [54, 138]) { seg(c, x, 38, x, 214, 4, K); seg(c, x - 1, 38, x - 1, 214, 1, P); }
    const glass = [[62, 40], [130, 40], [126, 80], [100, 118], [100, 134], [126, 172], [130, 212], [62, 212], [66, 172], [92, 134], [92, 118], [66, 80]];
    shape(c, glass, { fill: P, lw: 2 });
    inside(c, pathOf(glass), () => { shape(c, [[60, 64], [132, 64], [100, 118], [92, 118]], { fill: tone(100), lw: 0, smooth: false }); shape(c, [[60, 214], [132, 214], [118, 188], [96, 176], [74, 188]], { fill: tone(90), lw: 0 }); seg(c, 96, 118, 96, 178, 1.4, K); hatch(c, 104, 40, 30, 172, { ang: 1.2, gap: 3 }); });
  });
  L.near((c) => { skull(c, 96, 200, 1.6); });
  L.pop((c) => { bat(c, 30, 40, 0.6, 0.3); bat(c, 168, 60, 0.5, -0.2); });
};
// 3 — Le Passeur : la barque, la perche, la lanterne
ART2[3] = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 70, y0: 120, stars: 40 }); disc(c, 150, 46, 14, P); });
  L.far((c) => { for (const sd of [-1, 1]) shape(c, [[96 + sd * 108, 160], [96 + sd * 108, 40], [96 + sd * 70, 90], [96 + sd * 60, 160]], { fill: K, stroke: P, lw: 1, smooth: false }); c.fillStyle = K; c.fillRect(-B, 160, WW + 2 * B, 100); });
  L.main((c) => { ripples(c, r, 166, 250, 46, tone(160)); boat(c, 92, 206, 92); hooded(c, 92, 200, 1.1, { pole: true, lantern: true }); });
  L.near((c) => { for (let i = 0; i < 5; i++) { const x = r() * 192; seg(c, x, 240, x + 3, 214 - r() * 20, 2, K); } });
  L.pop((c) => { glow(c, r, 117, 158, 22, 160, G); });
};
// 4 — La Balance : un cœur contre un crâne
ART2[4] = (L, r) => {
  L.bg((c) => { full(c, P); for (let y = 0; y < 240; y += 6) seg(c, -12, y, 204, y, 1, tone(190)); burst(c, 96, 60, 20, 200, 24, tone(230), 0, 0.15); });
  L.far((c) => { shape(c, [[-12, 210], [204, 210], [204, 256], [-12, 256]], { fill: tone(120), smooth: false }); for (let i = 0; i < 9; i++) seg(c, -12 + i * 26, 210, -40 + i * 34, 256, 1); });
  L.main((c) => {
    seg(c, 96, 40, 96, 214, 5, K); seg(c, 95, 40, 95, 214, 1, P); shape(c, [[78, 214], [114, 214], [104, 200], [88, 200]], { fill: tone(80), smooth: false });
    seg(c, 36, 60, 156, 50, 3, K); disc(c, 96, 46, 6, G, 1.5);
    for (const [x, y] of [[36, 60], [156, 50]]) { seg(c, x, y, x - 22, y + 70, 1, K); seg(c, x, y, x + 22, y + 70, 1, K); shape(c, [[x - 28, y + 70], [x + 28, y + 70], [x + 18, y + 80], [x - 18, y + 80]], { fill: G, lw: 1.5, smooth: false }); }
  });
  L.near((c) => { heart(c, 36, 116, 0.8); skull(c, 156, 108, 1.4); });
};
// 5 — Le Chien des enfers : trois têtes et la flamme
ART2[5] = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 200, 10, 170, 150, 0); });
  L.far((c) => { for (let i = 0; i < 9; i++) flame(c, 4 + i * 23, 256, 50 + r() * 50, false); });
  L.main((c) => { const body = [[30, 256], [40, 200], [70, 170], [122, 170], [152, 200], [162, 256]]; shape(c, body, { fill: K, stroke: P, lw: 1.5 }); for (let i = 0; i < 9; i++) shape(c, [[48 + i * 12, 178], [52 + i * 12, 168], [56 + i * 12, 178]], { fill: P, lw: 0, smooth: false }); seg(c, 46, 182, 146, 182, 3, P); });
  L.near((c) => { dogHead(c, 54, 150, 1.4, -0.5); dogHead(c, 140, 150, 1.4, 0.5); dogHead(c, 96, 112, 1.6, 0); });
  L.pop((c) => { for (let i = 0; i < 18; i++) disc(c, 20 + r() * 150, 20 + r() * 80, 1, R); });
};
// 6 — La Faux : la lame et la lune
ART2[6] = (L, r) => {
  L.bg((c) => { skyNight(c, r, { glow: 90, y0: 150, stars: 50 }); disc(c, 70, 76, 46, G); disc(c, 88, 64, 42, K); });
  L.far((c) => { land(c, [[-12, 206], [60, 196], [130, 202], [204, 192]], { fill: K, stroke: P, lw: 1 }); grass(c, r, 206, { n: 120, col: P, h: 18 }); });
  L.main((c) => { seg(c, 40, 250, 150, 20, 5, K); seg(c, 41, 249, 151, 19, 1, P); const bl = [[150, 20], [100, 10], [52, 28], [24, 58], [60, 40], [104, 32], [148, 36]]; shape(c, bl, { fill: P, lw: 2 }); shade(c, bl, 20, 8, 140, 50, { ang: 0.3, gap: 3 }); });
  L.pop((c) => { raven(c, 150, 30, 0.8, -1, true); bat(c, 40, 120, 0.6, 0.4); });
};
// 7 — Le Septième Cercle : l'entonnoir des damnés
ART2[7] = (L, r) => {
  L.bg((c) => { full(c); });
  L.main((c) => {
    for (let k = 0; k < 7; k++) {
      const y = 34 + k * 26, w = 92 - k * 11, h = 16 - k * 1.4;
      c.beginPath(); c.ellipse(96, y, w, h, 0, 0, TAU); c.fillStyle = tone(40 + k * 22); c.fill(); c.strokeStyle = P; c.lineWidth = 1.5; c.stroke();
      for (let i = 0; i < 14 - k; i++) { const a = (i / (14 - k)) * TAU + k; const x = 96 + Math.cos(a) * w * 0.8, yy = y + Math.sin(a) * h * 0.6; if (Math.sin(a) > -0.2) flame(c, x, yy + 3, 8 - k * 0.6, false); }
    }
    disc(c, 96, 220, 14, R, 2, K); disc(c, 96, 220, 6, G);
  });
  L.near((c) => { for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i / 7) * TAU; disc(c, 96 + Math.cos(a) * 92, 130 + Math.sin(a) * 116, 5, R, 1.2, P); } });
};
// 8 — L'Ossuaire : un mur de crânes sous l'arc
ART2[8] = (L, r) => {
  L.bg((c) => { full(c, tone(30)); });
  L.far((c) => { for (let y = 40; y < 236; y += 22) for (let x = -6 + ((y / 22) % 2) * 11; x < 204; x += 22) skull(c, x, y, 0.95, (r() - 0.5) * 0.3); });
  L.main((c) => { arch(c, 6, 256, 180, 250, { stones: 15 }); });
  L.near((c) => { candle(c, 72, 252, 36, 10, 16); candle(c, 120, 252, 28, 9, 14); c.fillStyle = K; c.fillRect(-B, 240, WW + 2 * B, 20); });
};
// 9 — Le Brasier : les mains des damnés dans la flamme
ART2[9] = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 240, 10, 200, 160, 0); for (let i = 0; i < 5; i++) cloud(c, 20 + i * 40, 40 + (i % 2) * 16, 60, r, { fill: tone(60) }); });
  L.far((c) => { for (let i = 0; i < 7; i++) flame(c, 10 + i * 30, 256, 90 + r() * 60, false); });
  L.main((c) => { hand(c, 50, 214, 1.1, 0.3, { bony: true, spread: 1.4 }); hand(c, 146, 218, 1.2, -0.25, { bony: true, spread: 1.2 }); hand(c, 96, 196, 1.4, 0, { bony: true, spread: 1.6 }); });
  L.near((c) => { for (let i = 0; i < 7; i++) flame(c, 4 + i * 30, 264, 34 + r() * 18); });
  L.pop((c) => { for (let i = 0; i < 26; i++) disc(c, r() * 192, r() * 160, 1, r() > 0.5 ? R : G); });
};
// 10 — La Porte : la herse, les yeux, la flamme dessous
ART2[10] = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 150, 6, 110, 120, 0); });
  L.far((c) => { for (const sx of [-1, 1]) line(c, [[96 + sx * 20, 70], [96 + sx * 44, 40], [96 + sx * 40, 20]], 5, P); for (const sx of [-1, 1]) shape(c, [[96 + sx * 8, 104], [96 + sx * 24, 94], [96 + sx * 22, 104]], { fill: G, lw: 0, smooth: false }); for (let i = 0; i < 6; i++) flame(c, 50 + i * 18, 236, 30 + r() * 20, false); });
  L.main((c) => { bars(c, 44, 148, 34, 214, 5); });
  L.near((c) => { arch(c, 14, 252, 164, 236, { stones: 15, fill: tone(170) }); c.fillStyle = P; c.fillRect(-B, 240, WW + 2 * B, 20); bricks(c, -B, 240, WW + 2 * B, 20, { bh: 10, bw: 26 }); });
};
// 11 — Le Cœur : percé, ceint de ronces
ART2[11] = (L, r) => {
  L.bg((c) => { skyDay(c, r, 260, 5); disc(c, 96, 118, 70, P, 1.5); rays(c, 96, 118, 74, 110, 44, { alt: 0.55 }); });
  L.main((c) => { heart(c, 96, 118, 2.4); for (let i = 0; i < 6; i++) disc(c, 82 + i * 6, 190 + (i % 3) * 14, 2.4, R); });
  L.near((c) => { bramble(c, [[-14, 150], [40, 120], [96, 160], [150, 120], [206, 150]], r, { lw: 3 }); });
  L.pop((c) => { seg(c, 30, 40, 160, 196, 6, K); seg(c, 31, 40, 161, 196, 2, P); seg(c, 40, 34, 22, 52, 5, K); disc(c, 24, 26, 5, G, 1.2); });
};
// 12 — Le Jugement : l'Ange aux mille yeux et sa balance
ART2[12] = (L, r) => {
  L.bg((c) => { full(c); halo(c, 96, 100, 10, 160, 150, 0); burst(c, 96, 100, 60, 220, 30, tone(140), -Math.PI / 2, 0.1); });
  L.main((c) => { c.save(); c.translate(96, 96); c.scale(0.92, 0.92); c.translate(-96, -96); angel(c, 96, 96, 1); c.restore(); });
  L.near((c) => { scales(c, 96, 196, 0.8, -0.14); });
};


// ── le cadre du deck des morts : carte noire, arc brisé, titre en haut, chiffre dans un médaillon d'os ──
const { CW, CH } = T, WIN = { x: 16, y: 46 };
function vert(c, x, y, a) { c.save(); c.translate(x, y); c.rotate(a); shape(c, [[-3, -2], [3, -2], [4, 0], [3, 2], [-3, 2], [-4, 0]], { fill: P, lw: 0.8, smooth: false }); c.restore(); }
function frame1(c, v, title) {
  c.fillStyle = K; c.fillRect(0, 0, CW, CH);
  const { x: wx, y: wy } = WIN;
  // fenêtre : arc brisé
  const top = wy + 4, sh = wy + 70, path = (q) => { q.moveTo(wx, wy + WH); q.lineTo(wx, sh); q.quadraticCurveTo(wx, top + 6, wx + WW / 2, top); q.quadraticCurveTo(wx + WW, top + 6, wx + WW, sh); q.lineTo(wx + WW, wy + WH); q.closePath(); };
  c.save(); c.beginPath(); path(c); c.clip(); c.clearRect(wx, wy, WW, WH); c.restore();
  c.strokeStyle = P; c.lineWidth = 2; c.beginPath(); path(c); c.stroke();
  c.lineWidth = 1; c.save(); c.translate(CW / 2, (wy + WH / 2)); c.scale(1.04, 1.02); c.translate(-CW / 2, -(wy + WH / 2)); c.beginPath(); path(c); c.stroke(); c.restore();
  // colonnes de vertèbres
  for (const x of [8, CW - 8]) for (let y = 20; y < CH - 16; y += 7) vert(c, x, y, 0);
  box(c, 3, 3, CW - 6, CH - 6, 1.5, P);
  // bandeau du titre
  const ban = [[22, 10], [CW - 22, 10], [CW - 14, 22], [CW - 22, 36], [22, 36], [14, 22]];
  shape(c, ban, { fill: P, stroke: K, lw: 1.5, smooth: false }); seg(c, 26, 14, CW - 26, 14, 1, K); seg(c, 26, 32, CW - 26, 32, 1, K);
  c.fillStyle = K; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  let fs = 21; c.font = `700 ${fs}px Grenze`; while (c.measureText(title).width > CW - 60 && fs > 12) c.font = `700 ${--fs}px Grenze`;
  c.fillText(title, CW / 2, 29);
  // os croisés sous la fenêtre
  for (const s of [-1, 1]) { const x0 = CW / 2 + s * 34, x1 = CW / 2 + s * 96; seg(c, x0, wy + WH + 18, x1, wy + WH + 26, 3, P); seg(c, x0, wy + WH + 26, x1, wy + WH + 14, 3, P); for (const [xx, yy] of [[x1, wy + WH + 26], [x1, wy + WH + 14]]) { disc(c, xx, yy - 1.5, 2.4, P); disc(c, xx, yy + 1.5, 2.4, P); } }
}
function tab1(c, v) {
  const x = CW / 2, y = WIN.y + WH + 20;
  disc(c, x, y, 25, K); disc(c, x, y, 22, P, 2, K); disc(c, x, y, 18, null, 1, K);
  if (typeof v === 'number' || v[0] === 'm' || v === 'x2') {
    const lab = typeof v === 'number' ? String(v) : v[0] === 'm' ? '+' + v.slice(1) : '×2';
    c.fillStyle = K; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = `700 ${lab.length > 2 ? 22 : lab.length > 1 ? 28 : 32}px Grenze`; c.fillText(lab, x, y + 10);
  } else skull(c, x, y + 1, 1.1);
}
function back1(c) { skull(c, CW / 2, CH / 2 + 2, 2.6); for (const s of [-1, 1]) { seg(c, CW / 2 + s * 20, CH / 2 + 46, CW / 2 + s * 50, CH / 2 + 60, 3, P); } }

registerDeck(1, { names: { ...NAMES2, freeze: 'Le Linceul', three: 'La Danse macabre', chance: 'Le Réveil', mod: 'Offrande', x2: 'Les Deux Âmes' }, colors: COLORS2, art: ART2, sart: SART1, frame: frame1, tab: tab1, win: WIN, backMark: back1 });
