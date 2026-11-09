// Petits utilitaires d'animation de texte.
const SCR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function scramble(el, text = el.dataset.text || el.textContent, dur = 420) {
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
export function typeInto(el, text, { speed = 28, onChar, skip = () => false } = {}) {
  return new Promise((res) => {
    let i = 0;
    const tick = () => {
      if (skip()) { el.textContent = text; return res(); }
      el.textContent = text.slice(0, ++i);
      if (text[i - 1] && text[i - 1] !== ' ') onChar?.();
      if (i < text.length) setTimeout(tick, speed * (/[.,;:…]/.test(text[i - 1]) ? 7 : 1));
      else res();
    };
    tick();
  });
}
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
