// ─────────────────────────────────────────────────────────────
//  Outils de peinture : bruit, matières (métal rayé, mailles,
//  bois, pierre, tissu), plaques d'armure ombrées.
//  Tout est peint en niveaux de gris, le tramage vient ensuite.
// ─────────────────────────────────────────────────────────────

export const TAU = Math.PI * 2;
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, k) => a + (b - a) * k;
export function rng(seed = 1) { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x6d2b79f5) >>> 0) / 4294967296); }
const h2 = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
export function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * noise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }

// tissu éclairé : dégradé de plis + trame du tissu en surimpression
export function cloth(ctx, path, x0, x1, { k = 1, tex, texScale = 1, folds = 10, phase = 0, light = 0.25 } = {}) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  for (let i = 0; i <= folds; i++) {
    const kk = i / folds, side = 1 - kk * 0.7 + light;
    const v = clamp((0.25 + 0.35 * (Math.sin(i * 1.9 + phase) * 0.5 + 0.5)) * side * k);
    const c = Math.round(v * 255); g.addColorStop(kk, `rgb(${c},${c},${c})`);
  }
  ctx.fillStyle = g; ctx.fill(path);
  if (tex) { ctx.save(); ctx.clip(path); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.75; ctx.fillStyle = pattern(ctx, tex, texScale); ctx.fill(path); ctx.restore(); }
}
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
const cache = new Map();
function cached(key, make) { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); }

// ── Matières (motifs répétables) ─────────────────────────────
export function scratchTex() {
  return cached('scratch', () => {
    const c = canvas(256, 256), x = c.getContext('2d'), r = rng(9);
    x.fillStyle = '#808080'; x.fillRect(0, 0, 256, 256);
    const id = x.getImageData(0, 0, 256, 256);
    for (let i = 0; i < 256 * 256; i++) { const v = 128 + (fbm((i % 256) / 18, Math.floor(i / 256) / 18, 3) - 0.5) * 120 + (r() - 0.5) * 40; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; }
    x.putImageData(id, 0, 0);
    for (let k = 0; k < 220; k++) {
      const sx = r() * 256, sy = r() * 256, l = 4 + r() * 40, a = (r() - 0.5) * 0.9;
      x.strokeStyle = r() < 0.5 ? `rgba(255,255,255,${0.2 + r() * 0.4})` : `rgba(0,0,0,${0.2 + r() * 0.5})`;
      x.lineWidth = 0.6 + r(); x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l); x.stroke();
    }
    for (let k = 0; k < 40; k++) { x.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.5})`; x.beginPath(); x.arc(r() * 256, r() * 256, 1 + r() * 4, 0, TAU); x.fill(); }
    return c;
  });
}
export function mailTex(s = 7) {
  return cached('mail' + s, () => {
    const c = canvas(s * 2, s * 2), x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, s * 2, s * 2);
    const ring = (cx, cy) => {
      const g = x.createLinearGradient(cx - s, cy - s, cx + s, cy + s);
      g.addColorStop(0, '#fff'); g.addColorStop(0.5, '#777'); g.addColorStop(1, '#222');
      x.strokeStyle = g; x.lineWidth = s * 0.34; x.beginPath(); x.ellipse(cx, cy, s * 0.62, s * 0.5, 0, 0, TAU); x.stroke();
    };
    for (const [cx, cy] of [[0, 0], [s * 2, 0], [0, s * 2], [s * 2, s * 2], [s, s], [s, -s], [s, s * 3], [-s, s], [s * 3, s]]) ring(cx, cy);
    return c;
  });
}
export function woodTex() {
  return cached('wood', () => {
    const c = canvas(512, 256), x = c.getContext('2d'), r = rng(3);
    const id = x.createImageData(512, 256);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 512; i++) {
      const g = Math.sin(j * 0.18 + fbm(i / 60, j / 14, 3) * 9) * 0.5 + 0.5;
      const plank = (j % 64) < 2 ? 0.1 : 1;
      const v = (0.25 + g * 0.35 + (fbm(i / 7, j / 2, 2) - 0.5) * 0.25) * plank * 255;
      const p = (j * 512 + i) * 4; id.data[p] = id.data[p + 1] = id.data[p + 2] = v; id.data[p + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    for (let k = 0; k < 14; k++) { x.fillStyle = 'rgba(0,0,0,.6)'; x.beginPath(); x.ellipse(r() * 512, r() * 256, 4 + r() * 6, 2 + r() * 3, 0, 0, TAU); x.fill(); }
    return c;
  });
}
export function stoneTex() {
  return cached('stone', () => {
    const c = canvas(256, 256), x = c.getContext('2d'), r = rng(11);
    const id = x.createImageData(256, 256);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
      const v = (0.35 + (fbm(i / 22, j / 22, 4) - 0.5) * 0.6 + (r() - 0.5) * 0.12) * 255;
      const p = (j * 256 + i) * 4; id.data[p] = id.data[p + 1] = id.data[p + 2] = v; id.data[p + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    x.strokeStyle = 'rgba(0,0,0,.85)'; x.lineWidth = 3;
    for (let row = 0; row < 4; row++) {
      x.beginPath(); x.moveTo(0, row * 64); x.lineTo(256, row * 64); x.stroke();
      for (let k = 0; k < 3; k++) { const bx = ((k * 96 + (row % 2) * 48) % 256); x.beginPath(); x.moveTo(bx, row * 64); x.lineTo(bx, row * 64 + 64); x.stroke(); }
    }
    x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 1.5;
    for (let row = 0; row < 4; row++) { x.beginPath(); x.moveTo(0, row * 64 + 3); x.lineTo(256, row * 64 + 3); x.stroke(); }
    return c;
  });
}
export function clothTex() {
  return cached('cloth', () => {
    const c = canvas(128, 128), x = c.getContext('2d'), id = x.createImageData(128, 128);
    for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) {
      const v = (0.45 + (i % 3 === 0 ? -0.12 : 0) + (j % 4 === 0 ? -0.08 : 0) + (fbm(i / 9, j / 30, 3) - 0.5) * 0.5) * 255;
      const p = (j * 128 + i) * 4; id.data[p] = id.data[p + 1] = id.data[p + 2] = v; id.data[p + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    return c;
  });
}
export function furTex() {
  return cached('fur', () => {
    const c = canvas(128, 128), x = c.getContext('2d'), r = rng(21);
    x.fillStyle = '#2a2a2a'; x.fillRect(0, 0, 128, 128);
    for (let k = 0; k < 900; k++) {
      const sx = r() * 128, sy = r() * 128, l = 6 + r() * 14, a = Math.PI / 2 + (r() - 0.5) * 0.9;
      x.strokeStyle = `rgba(${r() < 0.3 ? 255 : 160},${r() < 0.3 ? 255 : 160},${r() < 0.3 ? 255 : 160},${0.25 + r() * 0.5})`;
      x.lineWidth = 0.8 + r() * 1.2; x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + Math.cos(a) * l * 0.5 + 3, sy + Math.sin(a) * l * 0.5, sx + Math.cos(a) * l, sy + Math.sin(a) * l); x.stroke();
    }
    return c;
  });
}
export function pattern(ctx, tex, scale = 1, rot = 0, ox = 0, oy = 0) {
  const p = ctx.createPattern(tex, 'repeat');
  if (p.setTransform) p.setTransform(new DOMMatrix().translate(ox, oy).rotate(rot * 180 / Math.PI).scale(scale));
  return p;
}

// ── Peinture des plaques ─────────────────────────────────────
// Remplit le chemin courant avec un dégradé « métal poli »,
// des rayures, puis souligne les arêtes.
export const METAL = [[0, 0.05], [0.12, 0.28], [0.3, 0.95], [0.4, 0.62], [0.62, 0.3], [0.86, 0.12], [1, 0.03]];
export const DULL = [[0, 0.04], [0.3, 0.45], [0.5, 0.55], [0.8, 0.2], [1, 0.05]];
export function grad(ctx, x0, y0, x1, y1, stops, k = 1, lift = 0) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, v] of stops) { const c = Math.round(clamp(v * k + lift) * 255); g.addColorStop(o, `rgb(${c},${c},${c})`); }
  return g;
}
export function radial(ctx, x, y, r0, r1, stops, k = 1) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  for (const [o, v] of stops) { const c = Math.round(clamp(v * k) * 255); g.addColorStop(o, `rgb(${c},${c},${c})`); }
  return g;
}
export function finish(ctx, path, { scratch = 0.35, edge = 0.55, dark = 0.6, scale = 1 } = {}) {
  ctx.save();
  ctx.clip(path);
  if (scratch) { ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = scratch; ctx.fillStyle = pattern(ctx, scratchTex(), scale * 0.6); ctx.fill(path); }
  ctx.restore();
  ctx.save();
  if (dark) { ctx.strokeStyle = `rgba(0,0,0,${dark})`; ctx.lineWidth = 3 * scale; ctx.stroke(path); }
  if (edge) { ctx.strokeStyle = `rgba(255,255,255,${edge})`; ctx.lineWidth = 1.1 * scale; ctx.stroke(path); }
  ctx.restore();
}

// Plaque le long d'un segment A→B, largeur wa→wb, ombrée en travers.
export function limb(ctx, A, B, wa, wb, { stops = METAL, k = 1, round = 0.5, light = -0.45, scale = 1, tex = null, texScale = 1, edge = 0.5, dark = 0.7 } = {}) {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
  ctx.save();
  ctx.translate(A[0], A[1]); ctx.rotate(a);
  const p = new Path2D();
  const ra = wa / 2, rb = wb / 2;
  p.moveTo(0, -ra);
  p.lineTo(L, -rb);
  p.quadraticCurveTo(L + rb * round * 1.6, 0, L, rb);
  p.lineTo(0, ra);
  p.quadraticCurveTo(-ra * round * 1.6, 0, 0, -ra);
  // la lumière vient d'en haut à gauche : on décale le dégradé
  const flip = Math.cos(a) > 0 ? 1 : -1;
  ctx.fillStyle = tex ? grad(ctx, 0, -ra * flip, 0, ra * flip, [[0, 0.12], [0.3, 0.75], [0.6, 0.45], [1, 0.08]], k * 1.4) : grad(ctx, 0, -ra * flip * 1.05, 0, ra * flip * 1.05, stops, k);
  ctx.fill(p);
  if (tex) { ctx.save(); ctx.clip(p); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.7; ctx.fillStyle = pattern(ctx, tex, texScale); ctx.fill(p); ctx.restore(); }
  finish(ctx, p, { scale, edge, dark, scratch: tex ? 0 : 0.4 });
  void light;
  ctx.restore();
}

// disque bombé (cubitière, genouillère, rivet, umbo)
export function boss(ctx, x, y, r, { k = 1, wing = 0, rot = 0, scale = 1 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  if (wing) {
    const w = new Path2D();
    w.moveTo(0, -r * 0.6); w.quadraticCurveTo(r * wing * 1.4, -r * 1.4, r * wing * 1.7, 0); w.quadraticCurveTo(r * wing * 1.2, r * 0.9, 0, r * 0.6); w.closePath();
    ctx.fillStyle = grad(ctx, 0, -r, 0, r, METAL, k * 0.85); ctx.fill(w); finish(ctx, w, { scale });
  }
  const p = new Path2D(); p.arc(0, 0, r, 0, TAU);
  ctx.fillStyle = radial(ctx, -r * 0.35, -r * 0.4, r * 0.05, r * 1.15, [[0, 1], [0.25, 0.7], [0.7, 0.2], [1, 0.05]], k);
  ctx.fill(p); finish(ctx, p, { scale, scratch: 0.3 });
  ctx.restore();
}
export function rivet(ctx, x, y, r, k = 1) {
  ctx.fillStyle = radial(ctx, x - r * 0.3, y - r * 0.35, 0, r * 1.2, [[0, 1], [0.5, 0.45], [1, 0]], k);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

// halo de lumière (additif)
export function glow(ctx, x, y, r, a = 0.5) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
export function vignette(ctx, w, h, a = 0.85, inner = 0.35) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * inner, w / 2, h / 2, Math.hypot(w, h) * 0.55);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

// flamme de bougie (t = temps)
export function flame(ctx, x, y, s, t, seed = 0) {
  const n = Math.sin(t * 11 + seed) * 0.5 + Math.sin(t * 6.7 + seed * 3) * 0.5;
  glow(ctx, x, y - 14 * s, 90 * s * (1 + n * 0.08), 0.35);
  ctx.save(); ctx.translate(x, y); ctx.rotate(n * 0.08);
  const p = new Path2D();
  p.moveTo(0, -30 * s * (1 + n * 0.15)); p.bezierCurveTo(9 * s, -16 * s, 7 * s, 0, 0, 0); p.bezierCurveTo(-7 * s, 0, -9 * s, -16 * s, 0, -30 * s * (1 + n * 0.15));
  ctx.fillStyle = '#fff'; ctx.fill(p);
  ctx.restore();
}
export function candle(ctx, x, y, s, h, t, seed = 0) {
  const w = 14 * s;
  ctx.fillStyle = grad(ctx, x - w, 0, x + w, 0, [[0, 0.2], [0.35, 0.85], [0.6, 0.55], [1, 0.12]]);
  ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x - w, y - h * s); ctx.quadraticCurveTo(x, y - h * s - 6 * s, x + w, y - h * s); ctx.lineTo(x + w, y); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  for (let k = 0; k < 3; k++) { const dx = (k - 1) * w * 0.6; ctx.beginPath(); ctx.ellipse(x + dx, y - h * s + (10 + k * 9) * s, 2.5 * s, (6 + k * 4) * s, 0, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x, y - h * s - 2 * s); ctx.lineTo(x, y - h * s - 9 * s); ctx.stroke();
  flame(ctx, x, y - h * s - 9 * s, s, t, seed);
}

// texte gothique (sera tramé avec le reste)
export function goth(ctx, text, x, y, size, { font = 'Jacquard', align = 'center', fill = '#fff', stroke = 0, shadow = 0 } = {}) {
  ctx.save();
  ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  if (shadow) { ctx.fillStyle = '#000'; ctx.fillText(text, x + shadow, y + shadow); }
  if (stroke) { ctx.strokeStyle = '#000'; ctx.lineWidth = stroke; ctx.lineJoin = 'round'; ctx.strokeText(text, x, y); }
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
  ctx.restore();
}
