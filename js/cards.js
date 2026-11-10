// Cartes : faces peintes puis tramées (cache par rang / résolution).
import { canvas, grad, radial, finish, METAL, glow, TAU, goth } from './paint.js';
import { ditherCanvas } from './dither.js';
import { FOES } from './content.js';
import { roman } from './game.js';

const cache = new Map();
let unlockedRanks = [], portraitFn = null;
export function setPortrait(fn) { portraitFn = fn; cache.clear(); raw.clear(); }
export function setUnlockedRanks(r) { unlockedRanks = r.slice(); cache.clear(); raw.clear(); }

function invert(c, w, h) { c.save(); c.globalCompositeOperation = 'difference'; c.fillStyle = '#e8e8e8'; c.fillRect(0, 0, w, h); c.restore(); }
function frame(c, w, h, s) {
  c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#fff'; c.lineWidth = 2 * s; c.strokeRect(4 * s, 4 * s, w - 8 * s, h - 8 * s);
  c.lineWidth = 1 * s; c.strokeRect(8 * s, 8 * s, w - 16 * s, h - 16 * s);
  for (const [x, y] of [[8, 8], [w / s - 8, 8], [8, h / s - 8], [w / s - 8, h / s - 8]]) { c.save(); c.translate(x * s, y * s); c.rotate(Math.PI / 4); c.fillStyle = '#fff'; c.fillRect(-4 * s, -4 * s, 8 * s, 8 * s); c.restore(); }
}

function symbol(c, card, cx, cy, r) {
  c.save(); c.translate(cx, cy);
  c.strokeStyle = '#fff'; c.fillStyle = '#fff'; c.lineCap = 'round';
  if (card.a === 'freeze') {
    c.lineWidth = r * 0.09;
    for (let k = 0; k < 6; k++) { c.save(); c.rotate(k * Math.PI / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r); c.stroke(); for (const d of [0.45, 0.72]) { c.beginPath(); c.moveTo(-r * 0.2, -r * d - r * 0.18); c.lineTo(0, -r * d); c.lineTo(r * 0.2, -r * d - r * 0.18); c.stroke(); } c.restore(); }
  } else if (card.a === 'three') {
    for (let k = 0; k < 3; k++) {
      const x = (k - 1) * r * 0.62, y = k === 1 ? -r * 0.15 : r * 0.1, s = r * 0.42;
      c.fillStyle = grad(c, x - s, 0, x + s, 0, [[0, 0.3], [0.4, 1], [1, 0.2]]);
      c.beginPath(); c.moveTo(x - s, y + s); c.bezierCurveTo(x - s * 0.7, y, x - s * 0.7, y - s, x, y - s); c.bezierCurveTo(x + s * 0.7, y - s, x + s * 0.7, y, x + s, y + s); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y + s * 1.2, s * 0.2, 0, TAU); c.fill();
    }
  } else if (card.a === 'chance') {
    c.lineWidth = r * 0.07;
    c.beginPath(); c.moveTo(-r * 0.45, -r * 0.8); c.lineTo(r * 0.45, -r * 0.8); c.lineTo(r * 0.05, 0); c.lineTo(r * 0.45, r * 0.8); c.lineTo(-r * 0.45, r * 0.8); c.lineTo(-r * 0.05, 0); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(-r * 0.3, r * 0.8); c.lineTo(0, r * 0.35); c.lineTo(r * 0.3, r * 0.8); c.fill();
    c.fillRect(-r * 0.6, -r * 0.92, r * 1.2, r * 0.1); c.fillRect(-r * 0.6, r * 0.82, r * 1.2, r * 0.1);
  } else if (card.t === 'x') {
    c.fillStyle = grad(c, -r, -r, r, r, [[0, 1], [0.5, 0.7], [1, 0.3]]);
    c.beginPath(); c.moveTo(-r * 0.8, r * 0.4); c.lineTo(-r * 0.9, -r * 0.5); c.lineTo(-r * 0.45, -r * 0.05); c.lineTo(0, -r * 0.8); c.lineTo(r * 0.45, -r * 0.05); c.lineTo(r * 0.9, -r * 0.5); c.lineTo(r * 0.8, r * 0.4); c.closePath(); c.fill();
    c.fillRect(-r * 0.8, r * 0.5, r * 1.6, r * 0.2);
  } else if (card.t === 'm') {
    c.fillStyle = radial(c, -r * 0.3, -r * 0.3, 1, r * 1.1, [[0, 1], [0.6, 0.55], [1, 0.15]]); c.beginPath(); c.arc(0, 0, r * 0.8, 0, TAU); c.fill();
    c.strokeStyle = '#000'; c.lineWidth = r * 0.06; c.beginPath(); c.arc(0, 0, r * 0.62, 0, TAU); c.stroke();
  }
  c.restore();
}

function paint(card, w, dith = true) {
  const h = Math.round(w * 1.46), s = w / 100;
  const cv = canvas(w, h), c = cv.getContext('2d');
  frame(c, w, h, s);
  const cx = w / 2, cy = h * 0.52;
  if (card.t === 'n') {
    const foe = card.v >= 1 && unlockedRanks.includes(card.v) ? FOES[card.v - 1] : null;
    if (foe) {
      invert(c, w, h);
      c.save(); c.beginPath(); c.moveTo(14 * s, h - 22 * s); c.lineTo(14 * s, 52 * s); c.quadraticCurveTo(14 * s, 22 * s, cx, 16 * s); c.quadraticCurveTo(w - 14 * s, 22 * s, w - 14 * s, 52 * s); c.lineTo(w - 14 * s, h - 22 * s); c.closePath(); c.clip();
      c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
      if (portraitFn) { const pw = Math.round(w * 0.86), ph = Math.round(h * 0.82); c.drawImage(portraitFn(foe, pw, ph), cx - pw / 2, 16 * s); }
      c.restore();
      c.strokeStyle = '#000'; c.lineWidth = 2.5 * s; c.beginPath(); c.moveTo(14 * s, h - 22 * s); c.lineTo(14 * s, 52 * s); c.quadraticCurveTo(14 * s, 22 * s, cx, 16 * s); c.quadraticCurveTo(w - 14 * s, 22 * s, w - 14 * s, 52 * s); c.lineTo(w - 14 * s, h - 22 * s); c.stroke();
      goth(c, String(card.v), cx, h - 9 * s, 20 * s, { fill: '#000' });
      goth(c, roman(card.v), 22 * s, 38 * s, 16 * s, { align: 'left', stroke: 4 * s });
    } else {
      c.fillStyle = radial(c, cx, cy, 2, w * 0.55, [[0, 0.5], [0.5, 0.18], [1, 0]]); c.fillRect(0, 0, w, h);
      c.strokeStyle = '#fff'; c.lineWidth = 1.2 * s; c.beginPath(); c.arc(cx, cy, 34 * s, 0, TAU); c.stroke();
      const n = Math.max(card.v, 1);
      for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + k * TAU / n; c.fillStyle = '#fff'; c.beginPath(); c.arc(cx + Math.cos(a) * 34 * s, cy + Math.sin(a) * 34 * s, 3 * s, 0, TAU); c.fill(); }
      for (let k = 0; k < 24; k++) { const a = k * TAU / 24; c.strokeStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(cx + Math.cos(a) * 40 * s, cy + Math.sin(a) * 40 * s); c.lineTo(cx + Math.cos(a) * (k % 2 ? 50 : 46) * s, cy + Math.sin(a) * (k % 2 ? 50 : 46) * s); c.stroke(); }
      goth(c, String(card.v), cx, cy + 22 * s, 64 * s, { stroke: 6 * s });
      goth(c, roman(card.v), 18 * s, 30 * s, 16 * s, { align: 'left' });
      goth(c, roman(card.v), w - 18 * s, h - 16 * s, 16 * s, { align: 'right' });
      invert(c, w, h);
    }
  } else {
    c.fillStyle = radial(c, cx, cy, 2, w * 0.6, [[0, 0.45], [1, 0]]); c.fillRect(0, 0, w, h);
    symbol(c, card, cx, cy - 6 * s, 34 * s);
    const lab = card.t === 'm' ? '+' + card.v : card.t === 'x' ? '×2' : { freeze: 'Givre', three: 'Trois Glas', chance: 'Sursis' }[card.a];
    goth(c, lab, cx, card.t === 'm' ? cy + 12 * s : h - 20 * s, card.t === 'm' ? 34 * s : 17 * s, { stroke: 5 * s });
    if (card.t !== 'a') invert(c, w, h);
  }
  return dith ? ditherCanvas(cv, { ink: '#ece8dc', gamma: 1.25 }).toDataURL() : cv;
}

function paintBack(w, dith = true) {
  const h = Math.round(w * 1.46), s = w / 100, cv = canvas(w, h), c = cv.getContext('2d');
  frame(c, w, h, s);
  const cx = w / 2, cy = h / 2;
  c.fillStyle = radial(c, cx, cy, 2, w * 0.6, [[0, 0.4], [1, 0.05]]); c.fillRect(10 * s, 10 * s, w - 20 * s, h - 20 * s);
  for (let y = 14 * s; y < h - 14 * s; y += 6 * s) for (let x = 14 * s; x < w - 14 * s; x += 6 * s) if (((x + y) / (6 * s)) % 2 < 1) { c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x, y, 3 * s, 3 * s); }
  c.strokeStyle = '#fff'; c.lineWidth = 2 * s; c.beginPath(); c.arc(cx, cy, 30 * s, 0, TAU); c.stroke();
  for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + k * TAU / 7; c.fillStyle = '#fff'; c.beginPath(); c.arc(cx + Math.cos(a) * 30 * s, cy + Math.sin(a) * 30 * s, 4 * s, 0, TAU); c.fill(); }
  goth(c, 'VII', cx, cy + 9 * s, 28 * s);
  return dith ? ditherCanvas(cv, { gamma: 1.2 }).toDataURL() : cv;
}

const key = (c) => (c.t === 'n' ? 'n' + c.v : c.t === 'a' ? c.a : c.t + c.v);
export function face(card, w = 100) { const k = key(card) + '@' + w; if (!cache.has(k)) cache.set(k, paint(card, w)); return cache.get(k); }
export function back(w = 100) { const k = 'back@' + w; if (!cache.has(k)) cache.set(k, paintBack(w)); return cache.get(k); }
const raw = new Map();
export function faceCanvas(card, w = 256) { const k = key(card) + '@' + w; if (!raw.has(k)) raw.set(k, paint(card, w, false)); return raw.get(k); }
export function backCanvas(w = 256) { const k = 'back@' + w; if (!raw.has(k)) raw.set(k, paintBack(w, false)); return raw.get(k); }
