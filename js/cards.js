// ─────────────────────────────────────────────────────────────
//  Cartes PLACEHOLDER — en attendant les illustrations.
//  Chaque carte reçoit une "image" ASCII générée (chiffre,
//  symbole) pour qu'on puisse caler les animations dès maintenant.
// ─────────────────────────────────────────────────────────────
import { roman, cardTitle, ACTIONS } from './game.js';

const RAMP = ' .,:;!+*a2$SZ0%&gQ8';
const cache = new Map();

const hash = (a, b) => {
  let h = Math.imul(a * 73856093 ^ b * 19349663, 2654435761);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967295;
};

export function rasterToAscii(cols, rows, draw, { seed = 1, ramp = RAMP, contrast = 1 } = {}) {
  const cw = 8, ch = 14;
  const cv = document.createElement('canvas');
  cv.width = cols * cw; cv.height = rows * ch;
  const c = cv.getContext('2d');
  c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
  c.fillStyle = '#fff'; c.strokeStyle = '#fff';
  draw(c, cv.width, cv.height);
  const d = c.getImageData(0, 0, cv.width, cv.height).data;
  let out = '';
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let s = 0;
      for (const [ox, oy] of [[2, 3], [6, 3], [2, 10], [6, 10], [4, 7]]) s += d[((j * ch + oy) * cv.width + i * cw + ox) * 4];
      let v = Math.min(1, (s / (5 * 255)) * contrast);
      if (v < 0.06) { out += ' '; continue; }
      const k = Math.round(v * (ramp.length - 1));
      const jit = hash(i + seed * 31, j) < 0.3 ? 1 : 0;
      out += ramp[Math.max(1, Math.min(ramp.length - 1, k - jit))];
    }
    out += '\n';
  }
  return out.replace(/\n$/, '');
}

function drawArt(card) {
  return (c, w, h) => {
    const cx = w / 2, cy = h / 2;
    if (card.t === 'n' || card.t === 'm') {
      // halo rayonnant (le chiffre est posé par-dessus en typographie)
      const g = c.createRadialGradient(cx, cy, h * 0.05, cx, cy, h * 0.62);
      g.addColorStop(0, 'rgba(255,255,255,.65)'); g.addColorStop(0.55, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 6;
      c.beginPath(); c.arc(cx, cy, h * 0.47, 0, Math.PI * 2); c.stroke();
      const n = card.t === 'n' ? Math.max(card.v, 1) : card.v;
      for (let k = 0; k < n; k++) {
        const a = -Math.PI / 2 + (k * 2 * Math.PI) / n;
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(cx + Math.cos(a) * h * 0.47, cy + Math.sin(a) * h * 0.47, h * 0.06, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = '#000';
      c.beginPath(); c.ellipse(cx, cy, w * 0.17, h * 0.34, 0, 0, Math.PI * 2); c.fill();
    } else if (card.t === 'x') {
      c.font = `700 ${h * 0.55}px JBM, monospace`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      {
        // couronne
        c.beginPath();
        const y0 = cy - h * 0.05;
        c.moveTo(cx - w * 0.32, y0 + h * 0.18);
        c.lineTo(cx - w * 0.36, y0 - h * 0.22); c.lineTo(cx - w * 0.16, y0 - h * 0.02);
        c.lineTo(cx, y0 - h * 0.34); c.lineTo(cx + w * 0.16, y0 - h * 0.02);
        c.lineTo(cx + w * 0.36, y0 - h * 0.22); c.lineTo(cx + w * 0.32, y0 + h * 0.18);
        c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.fillRect(cx - w * 0.32, y0 + h * 0.22, w * 0.64, h * 0.1);
      }
    } else if (card.a === 'freeze') {
      c.lineWidth = 7; c.lineCap = 'round';
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3, r = h * 0.44;
        const ex = cx + Math.cos(a) * r * 1.3, ey = cy + Math.sin(a) * r;
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(ex, ey); c.stroke();
        const mx = cx + Math.cos(a) * r * 0.75, my = cy + Math.sin(a) * r * 0.58;
        for (const s of [-1, 1]) {
          c.beginPath(); c.moveTo(mx, my);
          c.lineTo(mx + Math.cos(a + s * 0.8) * r * 0.45, my + Math.sin(a + s * 0.8) * r * 0.35); c.stroke();
        }
      }
    } else if (card.a === 'three') {
      for (let k = 0; k < 3; k++) {
        const bx = cx + (k - 1) * w * 0.3, by = cy + (k === 1 ? -h * 0.08 : h * 0.06), s = h * 0.24;
        c.beginPath();
        c.moveTo(bx - s * 0.9, by + s);
        c.bezierCurveTo(bx - s * 0.6, by + s * 0.2, bx - s * 0.7, by - s, bx, by - s);
        c.bezierCurveTo(bx + s * 0.7, by - s, bx + s * 0.6, by + s * 0.2, bx + s * 0.9, by + s);
        c.closePath(); c.fill();
        c.beginPath(); c.arc(bx, by + s * 1.2, s * 0.22, 0, Math.PI * 2); c.fill();
      }
    } else if (card.a === 'chance') {
      // sablier
      c.beginPath();
      c.moveTo(cx - w * 0.22, cy - h * 0.42); c.lineTo(cx + w * 0.22, cy - h * 0.42);
      c.lineTo(cx + w * 0.02, cy); c.lineTo(cx + w * 0.22, cy + h * 0.42);
      c.lineTo(cx - w * 0.22, cy + h * 0.42); c.lineTo(cx - w * 0.02, cy); c.closePath();
      c.lineWidth = 5; c.stroke();
      c.beginPath(); c.moveTo(cx - w * 0.14, cy + h * 0.42); c.lineTo(cx, cy + h * 0.2); c.lineTo(cx + w * 0.14, cy + h * 0.42); c.fill();
      c.fillRect(cx - w * 0.3, cy - h * 0.47, w * 0.6, h * 0.06);
      c.fillRect(cx - w * 0.3, cy + h * 0.41, w * 0.6, h * 0.06);
    }
  };
}

export function artFor(card) {
  const k = card.t === 'n' ? 'n' + card.v : card.t === 'a' ? card.a : card.t + card.v;
  if (!cache.has(k)) cache.set(k, rasterToAscii(22, 11, drawArt(card), { seed: k.length * 7 + (card.v || 3), contrast: card.t === 'a' ? 0.55 : 1.15 }));
  return cache.get(k);
}

let backArt = null;
export function backFor() {
  if (!backArt) {
    backArt = rasterToAscii(17, 14, (c, w, h) => {
      const cx = w / 2, cy = h / 2;
      c.lineWidth = 4;
      c.strokeStyle = 'rgba(255,255,255,.55)';
      c.beginPath(); c.arc(cx, cy, h * 0.46, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 2;
      for (let k = 0; k < 7; k++) {
        const a = -Math.PI / 2 + (k * 2 * Math.PI) / 7;
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(cx + Math.cos(a) * h * 0.37, cy + Math.sin(a) * h * 0.37, h * 0.045, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = '#fff';
      c.font = `${h * 0.34}px Fraktur, serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('VII', cx, cy + 2);
    }, { seed: 7, contrast: 1.2 });
  }
  return backArt;
}

const MINI = { freeze: 'GIV', three: 'GLAS', chance: 'SUR' };

export function makeCard(card, { mini = false, down = false } = {}) {
  const el = document.createElement('div');
  el.className = 'card' + (mini ? ' mini' : '') + (down ? ' down' : '') +
    (card?.t === 'a' ? ' k-act' : card?.t === 'm' || card?.t === 'x' ? ' k-mod' : ' k-num');
  if (card) el.dataset.id = card.id;
  if (card?.dup) el.classList.add('dup');
  const top = !card ? '' : card.t === 'n' ? `<span>${roman(card.v)}</span><b>${card.v}</b>`
    : card.t === 'a' ? `<span>ACTE</span><b>${MINI[card.a]}</b>` : `<span>OBOLE</span><b>${card.t === 'x' ? '×2' : '+' + card.v}</b>`;
  const big = !card ? '' : card.t === 'n' ? `<span class="c-big">${card.v}</span>` : card.t === 'm' ? `<span class="c-big mono">+${card.v}</span>`
    : card.t === 'a' ? `<span class="c-big lettrine">${{ freeze: 'G', three: 'T', chance: 'S' }[card.a]}</span>` : '';
  const mini_ = !card ? '' : card.t === 'n' ? card.v : card.t === 'a' ? MINI[card.a] : card.t === 'x' ? '×2' : '+' + card.v;
  el.innerHTML = `
    <div class="inner">
      <div class="face front">
        <div class="c-top">${top}</div>
        <div class="c-artbox"><pre class="c-art">${card ? artFor(card) : ''}</pre>${big}</div>
        <div class="c-name">${card ? cardTitle(card) : ''}</div>
        <div class="c-ph">illustration à venir</div>
        <div class="c-mini">${mini_}</div>
      </div>
      <div class="face back"><pre class="c-back">${backFor()}</pre></div>
    </div>`;
  if (card) el.title = card.t === 'a' ? `${ACTIONS[card.a].name} — ${ACTIONS[card.a].desc}` : cardTitle(card);
  return el;
}

// Petit portrait ASCII (placeholder) pour chaque adversaire
const portraits = new Map();
export function portraitFor(persona = 'mort') {
  if (portraits.has(persona)) return portraits.get(persona);
  const seed = { mort: 1, flagellant: 2, veuve: 3, lepreux: 4, human: 5 }[persona] || 6;
  const art = rasterToAscii(26, 13, (c, w, h) => {
    const cx = w / 2;
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(255,255,255,.2)'); g.addColorStop(0.7, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,.35)');
    c.fillStyle = g;
    c.beginPath();
    const hw = w * (persona === 'veuve' ? 0.3 : 0.34);
    c.moveTo(cx, h * 0.04);
    c.bezierCurveTo(cx + hw, h * 0.04, cx + hw * 1.05, h * 0.5, cx + hw * 1.25, h * 0.7);
    c.lineTo(cx + w * 0.48, h); c.lineTo(cx - w * 0.48, h);
    c.lineTo(cx - hw * 1.25, h * 0.7);
    c.bezierCurveTo(cx - hw * 1.05, h * 0.5, cx - hw, h * 0.04, cx, h * 0.04);
    c.fill();
    c.fillStyle = '#000';
    c.beginPath(); c.ellipse(cx, h * 0.42, w * 0.17, h * 0.28, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    if (persona === 'human') {
      c.fillStyle = 'rgba(255,255,255,.6)';
      c.beginPath(); c.ellipse(cx, h * 0.44, w * 0.12, h * 0.22, 0, 0, Math.PI * 2); c.fill();
    } else {
      const ey = h * (0.36 + seed * 0.01);
      c.beginPath(); c.arc(cx - w * 0.06, ey, 5, 0, Math.PI * 2); c.arc(cx + w * 0.06, ey, 5, 0, Math.PI * 2); c.fill();
    }
    if (persona === 'flagellant') { c.lineWidth = 4; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(w * 0.1 + k * 8, h); c.lineTo(w * 0.04 + k * 10, h * 0.55); c.strokeStyle = '#fff'; c.stroke(); } }
    if (persona === 'mort') { c.fillRect(w * 0.84, 0, 4, h); c.beginPath(); c.moveTo(w * 0.86, h * 0.05); c.quadraticCurveTo(w * 0.6, h * 0.0, w * 0.5, h * 0.2); c.quadraticCurveTo(w * 0.66, h * 0.08, w * 0.86, h * 0.14); c.fill(); }
  }, { seed, contrast: 1.2 });
  portraits.set(persona, art);
  return art;
}
