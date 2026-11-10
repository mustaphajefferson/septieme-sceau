// ─────────────────────────────────────────────────────────────
//  Lieux peints : la Forêt, le Pont-levis, le Château, le Trône.
//  + vitrail, cadres (simple / des Honneurs), ambiances animées.
// ─────────────────────────────────────────────────────────────
import { TAU, clamp, lerp, rng, fbm, noise, canvas, grad, radial, finish, METAL, DULL, pattern, stoneTex, woodTex, glow, vignette, limb, boss, rivet, candle } from './paint.js';

const cache = new Map();
function baked(key, w, h, draw) {
  const k = key + w + 'x' + h;
  if (!cache.has(k)) { const cv = canvas(w, h); draw(cv.getContext('2d'), w, h); cache.set(k, cv); }
  return cache.get(k);
}

// ── Forêt : troncs, rayons de lumière, clairière ─────────────
function foretStatic(c, W, H) {
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const r = rng(5);
  // lueur de clairière au loin
  c.fillStyle = radial(c, W * 0.5, H * 0.52, 4, H * 0.55, [[0, 0.7], [0.4, 0.25], [1, 0]]); c.fillRect(0, 0, W, H);
  // couches de troncs, du lointain vers le proche
  for (let layer = 0; layer < 4; layer++) {
    const n = 14 - layer * 2, k = [0.32, 0.22, 0.12, 0.05][layer], wmul = [0.35, 0.6, 1, 1.8][layer];
    for (let i = 0; i < n; i++) {
      let x = (i + r() * 0.8) / n * W * 1.1 - W * 0.05;
      if (layer < 3 && Math.abs(x - W * 0.5) < W * 0.07) x += W * 0.14 * (x < W * 0.5 ? -1 : 1);
      const w = (8 + r() * 14) * wmul * W / 900;
      const g = c.createLinearGradient(x - w, 0, x + w, 0);
      const lit = x < W * 0.5 ? 1 : 0.6;
      g.addColorStop(0, `rgba(0,0,0,1)`); g.addColorStop(0.3, `rgb(${k * 255 * lit},${k * 255 * lit},${k * 255 * lit})`); g.addColorStop(1, '#000');
      c.fillStyle = g; c.fillRect(x - w, 0, w * 2, H * (0.72 + layer * 0.08));
      // écorce
      c.strokeStyle = `rgba(0,0,0,${0.4 + layer * 0.1})`; c.lineWidth = Math.max(1, w * 0.08);
      for (let j = 0; j < 8; j++) { const yy = r() * H * 0.7; c.beginPath(); c.moveTo(x - w * 0.6, yy); c.lineTo(x + w * 0.2, yy + w * 0.6); c.stroke(); }
      if (layer === 3) { c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x - w * 0.55, 0, w * 0.18, H); }
    }
  }
  // sol de mousse et de racines
  const gr = c.createLinearGradient(0, H * 0.62, 0, H);
  gr.addColorStop(0, 'rgba(160,160,160,.5)'); gr.addColorStop(0.3, 'rgba(70,70,70,.6)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
  c.fillStyle = gr; c.fillRect(0, H * 0.62, W, H * 0.38);
  const id = c.getImageData(0, Math.floor(H * 0.62), W, Math.ceil(H * 0.38));
  for (let j = 0; j < id.height; j++) for (let i = 0; i < W; i++) {
    const p = (j * W + i) * 4, v = fbm(i / 7, j / 3, 3);
    const m = v > 0.55 ? 1.6 : v < 0.38 ? 0.4 : 1;
    id.data[p] = id.data[p + 1] = id.data[p + 2] = clamp(id.data[p] * m / 255) * 255;
  }
  c.putImageData(id, 0, Math.floor(H * 0.62));
}
export function foret(c, W, H, t) {
  c.drawImage(baked('foret', W, H, foretStatic), 0, 0);
  // rayons de lumière (lents)
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const x = W * (0.25 + i * 0.13) + Math.sin(t * 0.1 + i) * W * 0.01, a = 0.06 + 0.04 * Math.sin(t * 0.3 + i * 2);
    const g = c.createLinearGradient(0, 0, 0, H * 0.9); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + W * 0.03, 0); c.lineTo(x + W * 0.12, H * 0.9); c.lineTo(x + W * 0.06, H * 0.9); c.fill();
  }
  c.restore();
  mist(c, W, H, t, 0.62, 0.35);
}

// ── Pont-levis ───────────────────────────────────────────────
function pontStatic(c, W, H) {
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const sky = c.createLinearGradient(0, 0, 0, H * 0.6); sky.addColorStop(0, '#000'); sky.addColorStop(1, '#2c2c2c'); c.fillStyle = sky; c.fillRect(0, 0, W, H * 0.6);
  // lune
  c.fillStyle = radial(c, W * 0.78, H * 0.16, 2, H * 0.09, [[0, 1], [0.85, 0.85], [1, 0]]); c.beginPath(); c.arc(W * 0.78, H * 0.16, H * 0.07, 0, TAU); c.fill();
  glow(c, W * 0.78, H * 0.16, H * 0.3, 0.25);
  const cx = W * 0.5, base = H * 0.66, s = H / 600;
  // remparts
  c.fillStyle = pattern(c, stoneTex(), s * 0.5); c.fillRect(0, base - 210 * s, W, 210 * s);
  c.fillStyle = grad(c, 0, base - 210 * s, 0, base, [[0, 0.1], [1, 0.45]]); c.globalCompositeOperation = 'multiply'; c.fillRect(0, base - 210 * s, W, 210 * s); c.globalCompositeOperation = 'source-over';
  for (let x = 0; x < W; x += 34 * s) { c.fillStyle = '#000'; c.fillRect(x + 20 * s, base - 226 * s, 14 * s, 18 * s); }
  // deux tours
  for (const sx of [-1, 1]) {
    const tx = cx + sx * 150 * s;
    c.fillStyle = pattern(c, stoneTex(), s * 0.5); c.fillRect(tx - 70 * s, base - 380 * s, 140 * s, 380 * s);
    c.save(); c.globalCompositeOperation = 'multiply';
    c.fillStyle = grad(c, tx - 70 * s, 0, tx + 70 * s, 0, [[0, sx < 0 ? 0.9 : 0.3], [1, sx < 0 ? 0.35 : 0.1]]); c.fillRect(tx - 70 * s, base - 380 * s, 140 * s, 380 * s); c.restore();
    for (let x = -70; x < 70; x += 28) { c.fillStyle = '#000'; c.fillRect(tx + (x + 14) * s, base - 400 * s, 14 * s, 24 * s); }
    c.fillStyle = pattern(c, stoneTex(), s * 0.5); for (let x = -70; x < 70; x += 28) c.fillRect(tx + x * s, base - 404 * s, 14 * s, 28 * s);
    // meurtrières
    for (const y of [150, 250, 320]) { c.fillStyle = '#000'; c.fillRect(tx - 4 * s, base - y * s, 8 * s, 40 * s); }
    // toit pointu
    c.fillStyle = grad(c, tx - 90 * s, 0, tx + 90 * s, 0, [[0, 0.35], [0.5, 0.15], [1, 0.05]]);
    c.beginPath(); c.moveTo(tx - 86 * s, base - 404 * s); c.lineTo(tx, base - 560 * s); c.lineTo(tx + 86 * s, base - 404 * s); c.fill();
    c.strokeStyle = '#000'; c.lineWidth = 2; c.beginPath(); c.moveTo(tx, base - 560 * s); c.lineTo(tx, base - 600 * s); c.stroke();
  }
  // porte en ogive + herse
  const gw = 110 * s, gh = 190 * s;
  c.fillStyle = '#000';
  c.beginPath(); c.moveTo(cx - gw / 2, base); c.lineTo(cx - gw / 2, base - gh * 0.6); c.quadraticCurveTo(cx - gw / 2, base - gh, cx, base - gh * 1.08); c.quadraticCurveTo(cx + gw / 2, base - gh, cx + gw / 2, base - gh * 0.6); c.lineTo(cx + gw / 2, base); c.fill();
  c.fillStyle = radial(c, cx, base - gh * 0.3, 2, gh, [[0, 0.55], [1, 0]]); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.95)'; c.lineWidth = 5 * s;
  for (let x = -gw / 2; x <= gw / 2; x += 16 * s) { c.beginPath(); c.moveTo(cx + x, base - gh); c.lineTo(cx + x, base - gh * 0.25); c.stroke(); }
  for (let y = gh * 0.3; y < gh; y += 18 * s) { c.beginPath(); c.moveTo(cx - gw / 2, base - y); c.lineTo(cx + gw / 2, base - y); c.stroke(); }
  // pont-levis en perspective + chaînes
  const pb = new Path2D(); pb.moveTo(cx - gw / 2, base); pb.lineTo(cx + gw / 2, base); pb.lineTo(cx + 280 * s, H); pb.lineTo(cx - 280 * s, H); pb.closePath();
  c.fillStyle = pattern(c, woodTex(), s * 0.6, Math.PI / 2); c.fill(pb);
  c.save(); c.clip(pb); c.globalCompositeOperation = 'multiply'; c.fillStyle = grad(c, 0, base, 0, H, [[0, 0.9], [1, 0.3]]); c.fill(pb); c.restore();
  for (const sx of [-1, 1]) {
    c.strokeStyle = 'rgba(200,200,200,.9)'; c.lineWidth = 3 * s; c.setLineDash([7 * s, 4 * s]);
    c.beginPath(); c.moveTo(cx + sx * gw * 0.6, base - gh * 1.05); c.lineTo(cx + sx * 240 * s, H * 0.92); c.stroke(); c.setLineDash([]);
  }
  // douves
  c.fillStyle = grad(c, 0, base, 0, H, [[0, 0.18], [1, 0.02]]);
  c.beginPath(); c.moveTo(0, base); c.lineTo(cx - gw / 2, base); c.lineTo(cx - 280 * s, H); c.lineTo(0, H); c.fill();
  c.beginPath(); c.moveTo(W, base); c.lineTo(cx + gw / 2, base); c.lineTo(cx + 280 * s, H); c.lineTo(W, H); c.fill();
  // reflets de lune dans l'eau
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.5;
  const r = rng(3); for (let i = 0; i < 40; i++) { const x = W * 0.62 + r() * W * 0.35, y = base + 10 + r() * (H - base); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 8 + r() * 20, y); c.stroke(); }
}
export function pont(c, W, H, t) {
  c.drawImage(baked('pont', W, H, pontStatic), 0, 0);
  // torches de chaque côté de la porte
  const s = H / 600, cx = W * 0.5, base = H * 0.66;
  for (const sx of [-1, 1]) { const x = cx + sx * 80 * s, y = base - 130 * s; c.fillStyle = '#222'; c.fillRect(x - 3 * s, y, 6 * s, 30 * s); glow(c, x, y - 10 * s, 110 * s, 0.35 + 0.08 * Math.sin(t * 9 + sx)); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y - 8 * s, 6 * s, 13 * s * (1 + 0.15 * Math.sin(t * 13 + sx)), 0, 0, TAU); c.fill(); }
  mist(c, W, H, t, 0.62, 0.22);
}

// ── Château : nef gothique et vitrail ────────────────────────
export function vitrail(c, cx, cy, w, h, t, { k = 1 } = {}) {
  // fenêtre en ogive avec remplage
  const path = new Path2D();
  path.moveTo(cx - w / 2, cy + h / 2); path.lineTo(cx - w / 2, cy - h * 0.1);
  path.quadraticCurveTo(cx - w / 2, cy - h * 0.45, cx, cy - h / 2); path.quadraticCurveTo(cx + w / 2, cy - h * 0.45, cx + w / 2, cy - h * 0.1);
  path.lineTo(cx + w / 2, cy + h / 2); path.closePath();
  c.save(); c.clip(path);
  // verre : mosaïque claire
  const r = rng(17);
  c.fillStyle = '#000'; c.fill(path);
  const cell = w / 9;
  for (let y = cy - h / 2; y < cy + h / 2; y += cell) for (let x = cx - w / 2; x < cx + w / 2; x += cell) {
    const v = (0.35 + r() * 0.55) * k * (0.85 + 0.15 * Math.sin(t * 0.5 + x * 0.05));
    c.fillStyle = `rgb(${v * 255},${v * 255},${v * 255})`; c.fillRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
  }
  // figure du saint : silhouette à l'épée
  c.fillStyle = '#000';
  c.beginPath(); c.ellipse(cx, cy - h * 0.18, w * 0.09, w * 0.11, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(cx - w * 0.16, cy + h * 0.4); c.lineTo(cx - w * 0.12, cy - h * 0.08); c.lineTo(cx + w * 0.12, cy - h * 0.08); c.lineTo(cx + w * 0.16, cy + h * 0.4); c.fill();
  c.fillRect(cx - w * 0.015, cy - h * 0.35, w * 0.03, h * 0.6); c.fillRect(cx - w * 0.1, cy - h * 0.06, w * 0.2, w * 0.03);
  c.strokeStyle = '#000'; c.lineWidth = w * 0.02; c.beginPath(); c.arc(cx, cy - h * 0.18, w * 0.16, 0, TAU); c.stroke();
  c.restore();
  // remplage de pierre
  c.lineWidth = w * 0.035; c.strokeStyle = '#111'; c.stroke(path);
  c.lineWidth = w * 0.02;
  c.beginPath(); c.moveTo(cx, cy - h * 0.38); c.lineTo(cx, cy + h / 2); c.stroke();
  c.beginPath(); c.arc(cx, cy - h * 0.25, w * 0.22, 0, TAU); c.stroke();
  for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(cx + sx * w / 4, cy - h * 0.02); c.lineTo(cx + sx * w / 4, cy + h / 2); c.stroke(); }
}
function chateauStatic(c, W, H, throne) {
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const s = H / 600, cx = W / 2, floor = H * 0.64;
  // voûtes et colonnes en perspective
  for (let i = 5; i >= 0; i--) {
    const d = 1 / (1 + i * 0.55), x0 = cx - W * 0.55 * d, x1 = cx + W * 0.55 * d, yT = H * 0.5 - H * 0.55 * d, yB = floor + (H - floor) * (d - 0.35) * 0.3;
    const k = 0.08 + d * 0.22;
    for (const x of [x0, x1]) {
      c.fillStyle = grad(c, x - 30 * s * d, 0, x + 30 * s * d, 0, [[0, 0], [0.35, k * 1.5], [1, 0]]);
      c.fillRect(x - 30 * s * d, yT, 60 * s * d, yB - yT + 200);
    }
    c.strokeStyle = `rgba(${k * 400},${k * 400},${k * 400},.8)`; c.lineWidth = 6 * s * d;
    c.beginPath(); c.moveTo(x0, yT + 120 * s * d); c.quadraticCurveTo(x0, yT - 60 * s * d, cx, yT - 90 * s * d); c.quadraticCurveTo(x1, yT - 60 * s * d, x1, yT + 120 * s * d); c.stroke();
  }
  // grand vitrail au fond
  vitrail(c, cx, H * 0.3, W * 0.16, H * 0.42, 0, { k: 0.95 });
  // rayons
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, H * 0.3, 0, floor + 60 * s); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.beginPath(); c.moveTo(cx - W * 0.07, H * 0.2); c.lineTo(cx + W * 0.07, H * 0.2); c.lineTo(cx + W * 0.22, floor + 80 * s); c.lineTo(cx - W * 0.22, floor + 80 * s); c.fill();
  c.restore();
  // dallage en perspective
  const fl = new Path2D(); fl.moveTo(0, floor); fl.lineTo(W, floor); fl.lineTo(W, H); fl.lineTo(0, H); fl.closePath();
  c.fillStyle = grad(c, 0, floor, 0, H, [[0, 0.3], [1, 0.08]]); c.fill(fl);
  c.strokeStyle = 'rgba(0,0,0,.8)'; c.lineWidth = 1.5;
  for (let i = -12; i <= 12; i++) { c.beginPath(); c.moveTo(cx + i * 20 * s, floor); c.lineTo(cx + i * 200 * s, H); c.stroke(); }
  for (let j = 0; j < 9; j++) { const y = floor + (H - floor) * Math.pow(j / 9, 1.7); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  if (throne) {
    const tx = cx, ty = floor + 10 * s;
    c.fillStyle = grad(c, tx - 90 * s, 0, tx + 90 * s, 0, [[0, 0.05], [0.4, 0.35], [1, 0.05]]);
    c.beginPath(); c.moveTo(tx - 80 * s, ty); c.lineTo(tx - 80 * s, ty - 200 * s); c.lineTo(tx - 50 * s, ty - 260 * s); c.lineTo(tx, ty - 320 * s); c.lineTo(tx + 50 * s, ty - 260 * s); c.lineTo(tx + 80 * s, ty - 200 * s); c.lineTo(tx + 80 * s, ty); c.fill();
    for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(tx + sx * 80 * s, ty - 200 * s); c.lineTo(tx + sx * 90 * s, ty - 290 * s); c.lineTo(tx + sx * 100 * s, ty - 200 * s); c.fill(); }
  }
}
export function chateau(c, W, H, t, throne = false) {
  c.drawImage(baked(throne ? 'trone' : 'chateau', W, H, (cc, w, h) => chateauStatic(cc, w, h, throne)), 0, 0);
  dust(c, W, H, t, 0.5);
}

// ── Ambiances ────────────────────────────────────────────────
export function mist(c, W, H, t, y0 = 0.6, a = 0.3) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const y = H * (y0 + i * 0.07), x = ((t * (8 + i * 4)) % (W * 2)) - W;
    const g = c.createLinearGradient(0, y - H * 0.06, 0, y + H * 0.06);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${a * (0.5 + 0.2 * i)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    for (const ox of [x, x + W * 2]) { c.beginPath(); c.ellipse(ox + W * 0.5, y, W * 0.7, H * 0.06, 0, 0, TAU); c.fill(); }
  }
  c.restore();
}
const P = { rain: [], ash: [], fire: [], dust: [], fly: [] };
function pool(name, n, make) { const a = P[name]; while (a.length < n) a.push(make(true)); return a; }
export function rain(c, W, H, dt, a = 0.8) {
  const drops = pool('rain', 220, (any) => ({ x: Math.random() * W * 1.3, y: any ? Math.random() * H : -20, v: 0.9 + Math.random() * 0.6, l: 10 + Math.random() * 18 }));
  c.save(); c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = Math.max(1, H / 500); c.beginPath();
  for (const d of drops) {
    d.y += d.v * H * dt * 1.2; d.x -= d.v * H * dt * 0.35;
    if (d.y > H) { d.y = -20; d.x = Math.random() * W * 1.3; }
    c.moveTo(d.x, d.y); c.lineTo(d.x + d.l * 0.3 * H / 600, d.y - d.l * H / 600);
  }
  c.stroke();
  // éclaboussures au sol
  c.fillStyle = `rgba(255,255,255,${a * 0.6})`;
  for (let i = 0; i < 18; i++) { const x = Math.random() * W, y = H * (0.85 + Math.random() * 0.15); c.fillRect(x, y, 2, 1); }
  c.restore();
}
export function ash(c, W, H, dt) {
  const ps = pool('ash', 140, (any) => ({ x: Math.random() * W, y: any ? Math.random() * H : -10, v: 0.03 + Math.random() * 0.05, s: 1 + Math.random() * 2.2, ph: Math.random() * 6 }));
  c.save(); c.fillStyle = 'rgba(255,255,255,.75)';
  for (const p of ps) { p.y += p.v * H * dt; p.ph += dt; p.x += Math.sin(p.ph) * 0.4; if (p.y > H) { p.y = -10; p.x = Math.random() * W; } c.fillRect(p.x, p.y, p.s, p.s); }
  const fs = pool('fire', 50, (any) => ({ x: Math.random() * W, y: any ? Math.random() * H : H + 10, v: 0.06 + Math.random() * 0.12, l: 0.5 + Math.random() }));
  for (const p of fs) { p.y -= p.v * H * dt; p.x += Math.sin(p.y * 0.05) * 0.6; if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; } glow(c, p.x, p.y, 6, 0.6); }
  c.restore();
}
export function fireflies(c, W, H, t) {
  const ps = pool('fly', 26, () => ({ x: Math.random(), y: 0.4 + Math.random() * 0.5, ph: Math.random() * 6, r: 0.02 + Math.random() * 0.04 }));
  for (const p of ps) {
    const x = (p.x + Math.sin(t * 0.3 + p.ph) * p.r) * W, y = (p.y + Math.cos(t * 0.4 + p.ph * 2) * p.r) * H;
    const a = 0.5 + 0.5 * Math.sin(t * 2 + p.ph * 3);
    glow(c, x, y, 10, 0.7 * a); c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(x - 1, y - 1, 2, 2);
  }
}
export function dust(c, W, H, t, a = 0.5) {
  const ps = pool('dust', 60, () => ({ x: Math.random(), y: Math.random(), ph: Math.random() * 6 }));
  c.fillStyle = `rgba(255,255,255,${a})`;
  for (const p of ps) { const x = ((p.x + t * 0.004) % 1) * W, y = ((p.y + t * 0.006 + Math.sin(t * 0.2 + p.ph) * 0.01) % 1) * H; c.fillRect(x, y, 1.5, 1.5); }
}

// ── Cadres ───────────────────────────────────────────────────
export function frameSimple(c, W, H) {
  const m = Math.min(W, H) * 0.035;
  c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(m, m, W - 2 * m, H - 2 * m);
  c.lineWidth = 1; c.strokeRect(m + 6, m + 6, W - 2 * m - 12, H - 2 * m - 12);
  for (const [x, y] of [[m, m], [W - m, m], [m, H - m], [W - m, H - m]]) { c.fillStyle = '#fff'; c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.fillRect(-5, -5, 10, 10); c.restore(); }
}
// Le Cadre des Honneurs : volutes, colonnes en damier, médaillon
export function frameHonneurs(c, W, H, t) {
  const m = Math.min(W, H) * 0.04, s = Math.min(W, H) / 600;
  // colonnes en damier
  for (const x of [m * 0.6, W - m * 1.6]) for (let y = m; y < H - m; y += 10 * s) { c.fillStyle = (Math.floor(y / (10 * s)) % 2) ? '#fff' : '#555'; c.fillRect(x, y, m, 10 * s * 0.8); }
  c.strokeStyle = '#fff'; c.lineWidth = 3 * s; c.strokeRect(m * 2, m, W - m * 4, H - m * 2);
  c.lineWidth = 1.2 * s; c.strokeRect(m * 2 + 8 * s, m + 8 * s, W - m * 4 - 16 * s, H - m * 2 - 16 * s);
  // volutes en haut et en bas
  const scroll = (x, y, dir, vflip) => {
    c.save(); c.translate(x, y); c.scale(dir * s, vflip * s);
    c.strokeStyle = '#fff'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(40, -10, 80, 30, 60, 60); c.bezierCurveTo(45, 82, 15, 70, 22, 48); c.bezierCurveTo(28, 32, 48, 40, 44, 52); c.stroke();
    c.beginPath(); c.moveTo(60, 0); c.bezierCurveTo(110, -6, 150, 20, 140, 40); c.bezierCurveTo(132, 56, 112, 50, 116, 38); c.stroke();
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-10, 40, 10, 90, 0, 140); c.stroke();
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(150 + i * 26, 6); c.quadraticCurveTo(162 + i * 26, -14, 174 + i * 26, 6); c.stroke(); }
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, -18); c.lineTo(8, 0); c.lineTo(0, 18); c.lineTo(-8, 0); c.fill();
    c.restore();
  };
  scroll(m * 2 + 14 * s, m + 14 * s, 1, 1); scroll(W - m * 2 - 14 * s, m + 14 * s, -1, 1);
  scroll(m * 2 + 14 * s, H - m - 14 * s, 1, -1); scroll(W - m * 2 - 14 * s, H - m - 14 * s, -1, -1);
  // fleuron central
  const cx = W / 2;
  for (const [y, v] of [[m, 1], [H - m, -1]]) {
    c.save(); c.translate(cx, y); c.scale(s, v * s); c.strokeStyle = '#fff'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-120, 0); c.bezierCurveTo(-60, 0, -40, 40, 0, 46); c.bezierCurveTo(40, 40, 60, 0, 120, 0); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, -14); c.lineTo(12, 18); c.lineTo(0, 54); c.lineTo(-12, 18); c.fill();
    c.fillStyle = '#000'; c.beginPath(); c.arc(0, 20, 5, 0, TAU); c.fill();
    c.restore();
  }
  // toiles d'araignée dans les coins bas
  c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1;
  for (const [x, sx] of [[m * 2 + 8 * s, 1], [W - m * 2 - 8 * s, -1]]) {
    const y = H - m - 8 * s;
    for (let i = 0; i < 6; i++) { const a = -i * Math.PI / 10; c.beginPath(); c.moveTo(x, y); c.lineTo(x + sx * Math.cos(a) * 90 * s, y + Math.sin(a) * 90 * s); c.stroke(); }
    for (let r = 20; r < 90; r += 18) { c.beginPath(); for (let i = 0; i < 6; i++) { const a = -i * Math.PI / 10; const px = x + sx * Math.cos(a) * r * s, py = y + Math.sin(a) * r * s; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
  }
  void t;
}

export const ZONE_DRAW = { foret, pont, chateau, trone: (c, W, H, t) => chateau(c, W, H, t, true) };
export { vignette, candle };
