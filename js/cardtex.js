// Faces de cartes (placeholders dans le style du guide) dessinées sur canvas.
import { THREE } from './render.js';
import { roman, cardTitle } from './game.js';

const W = 192, H = 282;
const cache = new Map();
let rankArt = () => null; // (v) => canvas | null : portrait du vaincu pour ce rang
export function setRankArt(fn) { rankArt = fn; cache.clear(); }
const INK = '#16120c', PAPER = '#e6dbb8', PAPER2 = '#cbbd93';

function bayer(x, y) {
  let v = 0; for (let b = 0; b < 3; b++) v = v * 4 + ((((x ^ y) >> b) & 1) * 2) + ((y >> b) & 1);
  return (v + 0.5) / 64;
}
// tramage 2 tons d'une zone (encre/papier)
function ditherRect(c, x0, y0, w, h, lum, ink = [22, 18, 12], paper = [230, 219, 184]) {
  const img = c.getImageData(x0, y0, w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const on = lum(x / w, y / h) > bayer(x, y);
    const p = (y * w + x) * 4; const col = on ? paper : ink;
    img.data[p] = col[0]; img.data[p + 1] = col[1]; img.data[p + 2] = col[2]; img.data[p + 3] = 255;
  }
  c.putImageData(img, x0, y0);
}

function frame(c, dark) {
  c.fillStyle = dark ? '#0e120c' : PAPER; c.fillRect(0, 0, W, H);
  // grain
  for (let k = 0; k < 900; k++) { c.fillStyle = dark ? 'rgba(160,200,110,.06)' : 'rgba(60,40,20,.08)'; c.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1); }
  const ink = dark ? '#9fcf55' : INK;
  c.strokeStyle = ink; c.lineWidth = 3; c.strokeRect(6, 6, W - 12, H - 12);
  c.lineWidth = 1; c.strokeRect(12, 12, W - 24, H - 24);
  // coins
  c.fillStyle = ink;
  for (const [x, y] of [[12, 12], [W - 12, 12], [12, H - 12], [W - 12, H - 12]]) { c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill(); }
  return ink;
}

function draw(card) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const act = card.t === 'a';
  const ink = frame(c, act);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // bandeau du haut
  c.fillStyle = ink; c.fillRect(18, 18, W - 36, 30);
  c.fillStyle = act ? '#0e120c' : PAPER;
  c.font = '27px Bastarda';
  const head = card.t === 'n' ? 'Rang ' + roman(card.v) : act ? 'Acte' : card.t === 'x' ? 'Couronne' : 'Obole';
  c.fillText(head, W / 2, 34);
  // vignette tramée
  const vx = 22, vy = 56, vw = W - 44, vh = 150;
  const art = card.t === 'n' ? rankArt(card.v) : null;
  if (art) {
    c.fillStyle = INK; c.fillRect(vx, vy, vw, vh);
    const s = Math.max(vw / art.width, vh / art.height), aw = art.width * s, ah = art.height * s;
    c.save(); c.beginPath(); c.rect(vx, vy, vw, vh); c.clip(); c.imageSmoothingEnabled = false;
    c.drawImage(art, vx + (vw - aw) / 2, vy + (vh - ah) / 2, aw, ah); c.restore();
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(vx, vy, vw, vh);
    c.font = '54px Jacquard'; c.fillStyle = INK; c.lineWidth = 7; c.strokeStyle = PAPER; c.textAlign = 'left';
    c.strokeText(String(card.v), vx + 6, vy + vh - 20); c.fillText(String(card.v), vx + 6, vy + vh - 20); c.textAlign = 'center';
  } else if (card.t === 'n') {
    ditherRect(c, vx, vy, vw, vh, (u, v) => {
      const r = Math.hypot(u - 0.5, (v - 0.5) * 1.3);
      return 0.85 - r * 1.25 + Math.sin(Math.atan2(v - 0.5, u - 0.5) * 12) * 0.08;
    });
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(vx, vy, vw, vh);
    c.font = '150px Jacquard'; c.fillStyle = INK;
    c.lineWidth = 10; c.strokeStyle = PAPER; c.strokeText(String(card.v), W / 2, vy + vh / 2 + 8);
    c.fillText(String(card.v), W / 2, vy + vh / 2 + 8);
  } else if (act) {
    ditherRect(c, vx, vy, vw, vh, (u, v) => 0.35 - Math.hypot(u - 0.5, v - 0.5) * 0.6, [14, 18, 12], [120, 170, 70]);
    c.strokeStyle = '#9fcf55'; c.lineWidth = 2; c.strokeRect(vx, vy, vw, vh);
    c.fillStyle = '#c4e47a'; c.font = '130px Jacquard';
    c.fillText({ freeze: 'G', three: 'T', chance: 'S' }[card.a], W / 2, vy + vh / 2 + 6);
  } else {
    ditherRect(c, vx, vy, vw, vh, (u, v) => { const r = Math.hypot(u - 0.5, (v - 0.5) * 1.3); return r < 0.32 ? 0.75 - r : 0.15; });
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(vx, vy, vw, vh);
    c.font = '72px Jacquard'; c.fillStyle = INK; c.lineWidth = 8; c.strokeStyle = PAPER;
    const t = card.t === 'x' ? '×2' : '+' + card.v;
    c.strokeText(t, W / 2, vy + vh / 2 + 4); c.fillText(t, W / 2, vy + vh / 2 + 4);
  }
  // nom
  c.fillStyle = ink; c.font = '18px Bastarda';
  const name = cardTitle(card).toLowerCase().replace(/(^|\s|')(\S)/g, (m, a, b) => a + b.toUpperCase());
  c.fillText(name, W / 2, vy + vh + 22);
  c.fillStyle = act ? '#6f9a3f' : '#7a6a4a'; c.font = '18px Bastarda';
  c.fillText(card.relic ? 'Relique du pèlerin' : art ? rankArt.label?.(card.v) || '' : 'illustration à venir', W / 2, vy + vh + 46);
  if (card.relic) { // sceau de cire rouge
    c.fillStyle = '#8a2416'; c.beginPath(); c.arc(W - 30, 66, 15, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f2dcc0'; c.fillRect(W - 32, 56, 4, 20); c.fillRect(W - 38, 62, 16, 4);
  }
  return cv;
}

function drawBack() {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  c.fillStyle = '#0b0e09'; c.fillRect(0, 0, W, H);
  ditherRect(c, 14, 14, W - 28, H - 28, (u, v) => 0.3 - Math.hypot(u - 0.5, (v - 0.5) * 0.7) * 0.5 + (Math.sin(u * 40) * Math.sin(v * 60) > 0.6 ? 0.25 : 0), [11, 14, 9], [80, 120, 50]);
  c.strokeStyle = '#9fcf55'; c.lineWidth = 3; c.strokeRect(8, 8, W - 16, H - 16); c.lineWidth = 1; c.strokeRect(16, 16, W - 32, H - 32);
  c.beginPath(); c.arc(W / 2, H / 2, 58, 0, Math.PI * 2); c.lineWidth = 3; c.stroke();
  for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + k * Math.PI * 2 / 7; c.fillStyle = '#9fcf55'; c.beginPath(); c.arc(W / 2 + Math.cos(a) * 46, H / 2 + Math.sin(a) * 46, 5, 0, Math.PI * 2); c.fill(); }
  c.font = '64px Jacquard'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#c4e47a';
  c.fillText('VII', W / 2, H / 2 + 4);
  return cv;
}

const toTex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 1; return t; };
const key = (c) => (c.t === 'n' ? 'n' + c.v : c.t === 'a' ? c.a : c.t + c.v) + (c.relic ? 'R' : '');
export function faceTex(card) { const k = key(card); if (!cache.has(k)) cache.set(k, toTex(draw(card))); return cache.get(k); }
let back = null;
export function backTex() { return back || (back = toTex(drawBack())); }
const urls = new Map();
export function faceCanvas(card) { return draw(card); }
export function faceURL(card) { const k = key(card); if (!urls.has(k)) urls.set(k, draw(card).toDataURL()); return urls.get(k); }
export function backURL() { if (!urls.has('back')) urls.set('back', drawBack().toDataURL()); return urls.get('back'); }
export function clearFaces() { cache.clear(); urls.clear(); }
export function backCanvas() { return drawBack(); }
