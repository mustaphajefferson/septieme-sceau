// ─────────────────────────────────────────────────────────────
//  L'interface « en points » : bordures, trames et balayages
//  sont dessinés point par point puis servis au CSS (variables),
//  aux couleurs du lieu. Un point = --u pixels à l'écran.
// ─────────────────────────────────────────────────────────────
import { bayer } from './dots.js';

const cache = new Map();
function tile(w, h, u, fn) {
  const c = document.createElement('canvas'); c.width = w * u; c.height = h * u;
  const x = c.getContext('2d');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const col = fn(i, j); if (col) { x.fillStyle = col; x.fillRect(i * u, j * u, u, u); } }
  return `url(${c.toDataURL()})`;
}
// image de bordure en 9 tranches : coin(x, y) et bord(profondeur, position)
function nine(S, u, corner, edge) {
  const N = 2 * S + 2;
  return tile(N, N, u, (i, j) => {
    const x = i < S ? i : i >= N - S ? N - 1 - i : -1, y = j < S ? j : j >= N - S ? N - 1 - j : -1;
    if (x < 0 && y < 0) return null;
    if (x >= 0 && y >= 0) return corner(x, y);
    return x >= 0 ? edge(x, j) : edge(y, i);
  });
}
const SOLID = 260, FADE = 72;

function build(P, u) {
  const [c0, c1, c2, c3, c4] = P.ramp, [, w1, w2, w3] = P.warm;
  const check = (col) => tile(2, 2, u, (i, j) => ((i + j) % 2 ? null : col));
  const sparse = (col, n) => tile(8, 8, u, (i, j) => (bayer(i, j) < n ? col : null));
  const sweep = (col) => tile(SOLID * 2 + FADE, 8, u, (i, j) => (i < SOLID ? col : i < SOLID + FADE ? (bayer(i, j) < (1 - (i - SOLID) / FADE) * 64 ? col : null) : null));
  // bouton : filet plein, liseré pointillé, coins coupés
  const btn = (line, dot) => nine(4, u,
    (x, y) => { const s = x + y; if (s < 2) return null; if (s === 2 || x === 0 || y === 0) return line; if ((x === 2 && y >= 3) || (y === 2 && x >= 3)) return (x + y) % 2 ? dot : c0; return c0; },
    (d, k) => (d === 0 ? line : d === 2 ? (k % 2 ? dot : c0) : c0));
  // panneau : double filet, pointillé intérieur, coins à clou
  const panel = (line, dot) => nine(7, u,
    (x, y) => { const s = x + y; if (s < 3) return null; if (s === 3 || x === 0 || y === 0) return line; if (s === 6 && x >= 2 && y >= 2) return line; if ((x === 2 && y >= 4) || (y === 2 && x >= 4)) return line; if (x >= 5 && y >= 5) return x === 5 && y === 5 ? dot : c0; if ((x === 4 && y >= 6) || (y === 4 && x >= 6)) return (x + y) % 2 ? dot : c0; return c0; },
    (d, k) => (d === 0 || d === 2 ? line : d === 4 ? (k % 2 ? dot : c0) : c0));
  // petite carte (les cartes en main) : papier, liseré d'encre pointillé, coins coupés
  const card = (paper, ink) => nine(2, u,
    (x, y) => (x + y < 1 ? null : x === 1 && y === 1 ? ink : paper),
    (d, k) => (d === 1 ? (k % 2 ? ink : paper) : paper));
  return {
    '--u': u + 'px', '--bs': 4 * u, '--ps': 7 * u, '--sweep-off': -(SOLID + FADE) * u + 'px',
    '--c0': c0, '--c1': c1, '--c2': c2, '--c3': c3, '--c4': c4, '--w1': w1, '--w2': w2, '--w3': w3,
    '--p12': sparse(c1, 10), '--p25': sparse(c2, 16), '--p50': check(c4), '--p50m': check(c3), '--p50d': check(c1), '--p50w': check(w2), '--p50k': check('#000'),
    '--sweep': sweep(c4), '--sweep-w': sweep(w2),
    '--bd-btn': btn(c4, c3), '--bd-btn-w': btn(w2, w3), '--bd-btn-dim': btn(c2, c2), '--bd-panel': panel(c4, c3), '--bd-panel-w': panel(w2, w3), '--bd-card': card(c4, c0), '--bd-card-w': card(w2, '#000'), '--bd-card-d': card(c2, c0),
    '--p25w': sparse(w2, 16), '--p25k': sparse('#000', 24), '--p50c': check(c2), '--p50w3': check(w3),
  };
}

export const dotUnit = () => (innerWidth >= 900 && innerHeight >= 640 ? 3 : 2);
/** Applique la palette (et la taille de point) à toute l'interface. */
export function installDotUI(P, u = dotUnit()) {
  const key = P.ramp.join() + P.warm.join() + u;
  if (!cache.has(key)) cache.set(key, build(P, u));
  const st = document.documentElement.style;
  for (const [k, v] of Object.entries(cache.get(key))) st.setProperty(k, v);
}
