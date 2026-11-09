// Effets : particules de caractères, flash, secousse, textes brouillés.
import { MONO } from './ascii.js';

const cv = document.getElementById('fx');
const ctx = cv.getContext('2d');
let parts = [];
let running = false;
const GLYPHS = '01789$&%@#*+;:.VII';

function fit() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fit();
addEventListener('resize', fit);

function loop() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  const dt = 1 / 60;
  parts = parts.filter((p) => (p.life -= dt) > 0);
  for (const p of parts) {
    p.vx *= p.drag; p.vy = p.vy * p.drag + p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (Math.random() < 0.12) p.ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
    const a = Math.min(1, p.life / p.max * 1.6);
    ctx.font = `${p.size}px ${MONO}`;
    ctx.fillStyle = `rgba(240,236,226,${a.toFixed(2)})`;
    ctx.fillText(p.ch, p.x, p.y);
  }
  if (parts.length) requestAnimationFrame(loop);
  else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}
function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }

export function burst(x, y, { n = 70, speed = 380, life = 1.4, g = 420, size = 13, chars = GLYPHS, drag = 0.97 } = {}) {
  if (document.body.classList.contains('no-fx')) n = Math.round(n / 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = speed * (0.2 + Math.random());
    const l = life * (0.5 + Math.random() * 0.7);
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.3, g, drag, life: l, max: l, size: size * (0.7 + Math.random() * 0.6), ch: chars[(Math.random() * chars.length) | 0] });
  }
  kick();
}

export function ring(x, y, { n = 7, r = 120, life = 1.8, chars = 'VII' } = {}) {
  for (let k = 0; k < 3; k++) for (let i = 0; i < n * 6; i++) {
    const a = (i / (n * 6)) * Math.PI * 2;
    const s = r * (1.4 + k * 0.6);
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0, drag: 0.96, life, max: life, size: 15 - k * 3, ch: chars[i % chars.length] });
  }
  kick();
}

export function rise(x, y, text, { size = 14 } = {}) {
  [...text].forEach((ch, i) => {
    const l = 1.5;
    parts.push({ x: x + (i - text.length / 2) * size * 0.62, y, vx: 0, vy: -70, g: 0, drag: 0.99, life: l, max: l, size, ch, fixed: true });
  });
  kick();
}

export function flash(ms = 120) {
  document.body.classList.add('flash');
  setTimeout(() => document.body.classList.remove('flash'), ms);
}
export function shake() {
  if (document.body.classList.contains('no-fx')) return;
  document.body.classList.remove('shake'); void document.body.offsetWidth;
  document.body.classList.add('shake');
  setTimeout(() => document.body.classList.remove('shake'), 500);
}

const SCR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0178$%&#*+';
export function scramble(el, text = el.dataset.text || el.textContent, dur = 520) {
  el.dataset.text = text;
  const t0 = performance.now();
  cancelAnimationFrame(el._scr);
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    const fixed = Math.floor(k * text.length);
    let s = '';
    for (let i = 0; i < text.length; i++) s += i < fixed || text[i] === ' ' ? text[i] : SCR[(Math.random() * SCR.length) | 0];
    el.textContent = s;
    if (k < 1) el._scr = requestAnimationFrame(step);
  };
  el._scr = requestAnimationFrame(step);
}

export function typeInto(el, text, { speed = 32, onChar } = {}) {
  return new Promise((res) => {
    let i = 0;
    el.textContent = '';
    const cur = document.createElement('span'); cur.className = 'cursor'; cur.textContent = '▌';
    const tick = () => {
      if (el._skip) { el.textContent = text; return res(); }
      el.textContent = text.slice(0, ++i);
      el.appendChild(cur);
      if (text[i - 1] && text[i - 1] !== ' ') onChar?.();
      if (i < text.length) setTimeout(tick, speed * (/[.,;:—]/.test(text[i - 1]) ? 6 : 1));
      else { setTimeout(() => cur.remove(), 600); res(); }
    };
    tick();
  });
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
