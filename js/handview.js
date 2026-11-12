// ─────────────────────────────────────────────────────────────
//  Les cartes du joueur, nettes, tenues dans les gantelets :
//  · la carte qu'on vient d'arracher reste en grand dans la main
//    droite jusqu'à la décision ;
//  · les autres sont en éventail dans la main gauche.
//  Couche DOM (et non 3D tramée) pour accueillir plus tard les
//  vraies illustrations et des effets holographiques.
// ─────────────────────────────────────────────────────────────
import { roman, cardTitle, ACTIONS } from './game.js';

const nice = (s) => String(s).toLowerCase().replace(/(^|\s|'|-)(\S)/g, (m, a, b) => a + b.toUpperCase());
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const ART = {
  rays: (n) => {
    let p = '';
    for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; p += `M${50 + Math.cos(a) * 20} ${50 + Math.sin(a) * 20}L${50 + Math.cos(a) * (k % 2 ? 44 : 38)} ${50 + Math.sin(a) * (k % 2 ? 44 : 38)}`; }
    let dots = '';
    for (let k = 0; k < Math.max(1, n); k++) { const a = -Math.PI / 2 + (k / Math.max(1, n)) * Math.PI * 2; dots += `<circle cx="${50 + Math.cos(a) * 31}" cy="${50 + Math.sin(a) * 31}" r="2.6"/>`; }
    return `<svg viewBox="0 0 100 100" class="hc-svg"><path d="${p}" stroke="currentColor" stroke-width="1.2" fill="none" opacity=".55"/><circle cx="50" cy="50" r="31" fill="none" stroke="currentColor" stroke-width="1"/><g fill="currentColor">${dots}</g></svg>`;
  },
};

let handArt = () => null; // (v) => { url, name } | null
export function setHandArt(fn) { handArt = fn; }

export function cardEl(card) {
  const el = document.createElement('div');
  const kind = card.t === 'n' ? 'num' : card.t === 'a' ? 'act' : 'mod';
  el.className = 'hc k-' + kind + (card.relic ? ' relic' : '');
  const a = card.t === 'n' ? handArt(card.v) : null;
  el.dataset.id = card.id;
  const big = card.t === 'n' ? card.v : card.t === 'm' ? '+' + card.v : card.t === 'x' ? '×2' : { freeze: 'G', three: 'T', chance: 'S' }[card.a];
  const head = card.t === 'n' ? `Rang ${roman(card.v)}` : card.t === 'a' ? 'Acte' : card.t === 'x' ? 'Couronne' : 'Obole';
  const sub = card.t === 'a' ? ACTIONS[card.a].desc : card.t === 'n' ? `Vaut ${card.v} âme${card.v > 1 ? 's' : ''}` : card.t === 'x' ? 'Double tes âmes' : `+${card.v} âmes`;
  el.innerHTML = `
    <div class="hc-in">
      <div class="hc-face front">
        <div class="hc-head"><span>${head}</span></div>
        <div class="hc-art ${a ? 'has-img' : ''}">${a ? `<img alt="" src="${a.url}">` : ART.rays(card.t === 'n' ? card.v : 7)}<b class="hc-big">${big}</b></div>
        <div class="hc-name">${nice(cardTitle(card))}</div>
        <div class="hc-sub">${sub}</div>
        <div class="hc-ph">${card.relic ? 'Relique du pèlerin' : a ? a.name : 'illustration à venir'}</div>${card.relic ? '<i class="hc-wax"></i>' : ''}
        <i class="hc-holo"></i><i class="hc-glare"></i>
      </div>
      <div class="hc-face back"><div class="hc-seal"><b>VII</b></div></div>
    </div>`;
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width, my = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', (mx * 100).toFixed(1) + '%');
    el.style.setProperty('--my', (my * 100).toFixed(1) + '%');
    el.style.setProperty('--rx', ((0.5 - my) * 14).toFixed(2) + 'deg');
    el.style.setProperty('--ry', ((mx - 0.5) * 18).toFixed(2) + 'deg');
  });
  el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  return el;
}

export class HandView {
  constructor(root) {
    this.root = root;
    this.held = null;     // { card, el }
    this.fan = [];        // [{ card, el }]
    this.speed = 1;
  }
  w(ms) { return wait(ms / this.speed); }

  // place un élément en coordonnées écran absolues (centre)
  placeAt(el, x, y, scale = 1, rot = 0) {
    el.style.left = x + 'px'; el.style.top = y + 'px';
    el.style.setProperty('--s', scale); el.style.setProperty('--rot', rot + 'deg');
  }
  heldSpot() {
    const W = innerWidth, H = innerHeight, narrow = W < 860;
    return narrow ? { x: W * 0.6, y: H * 0.44, s: 1 } : { x: W * 0.66, y: H * 0.5, s: 1 };
  }
  fanSpot(i, n) {
    const W = innerWidth, H = innerHeight, narrow = W < 860;
    const spread = Math.min(9, 60 / Math.max(1, n));
    const rot = (i - (n - 1) / 2) * spread;
    const cx = narrow ? W * 0.24 : W * 0.27, cy = narrow ? H * 0.6 : H * 0.8;
    const r = narrow ? H * 0.32 : H * 0.42;
    const a = (rot * Math.PI) / 180;
    return { x: cx + Math.sin(a) * r * 0.55, y: cy - Math.cos(a) * r * 0.18 + r * 0.06, rot: rot * 0.9 };
  }

  // carte qui arrive de l'Ossuaire jusqu'à la main droite, puis se retourne
  async draw(card, from) {
    const el = cardEl(card);
    el.classList.add('down', 'moving', 'held');
    this.root.appendChild(el);
    this.placeAt(el, from.x, from.y, 0.18, -20);
    void el.offsetWidth;
    const sp = this.heldSpot();
    this.placeAt(el, sp.x, sp.y, sp.s, -4);
    this.held = { card, el };
    await this.w(520);
    el.classList.remove('down');
    await this.w(420);
    el.classList.remove('moving');
    return el;
  }

  // la carte tenue rejoint l'éventail
  async stash() {
    if (!this.held) return;
    const h = this.held; this.held = null;
    h.el.classList.remove('held'); h.el.classList.add('moving', 'infan');
    this.fan.push(h);
    this.layoutFan();
    await this.w(380);
    h.el.classList.remove('moving');
  }

  // une carte entre directement dans l'éventail (Sursis offert, acte posé de côté)
  async addToFan(card, from) {
    const el = cardEl(card);
    el.classList.add('moving', 'infan');
    this.root.appendChild(el);
    this.placeAt(el, from.x, from.y, 0.2, 0);
    void el.offsetWidth;
    this.fan.push({ card, el });
    this.layoutFan();
    await this.w(420);
    el.classList.remove('moving');
  }

  layoutFan() {
    const n = this.fan.length;
    this.fan.forEach((f, i) => {
      const s = this.fanSpot(i, n);
      f.el.style.zIndex = 10 + i;
      this.placeAt(f.el, s.x, s.y, 0.62, s.rot);
    });
  }
  relayout() {
    this.layoutFan();
    if (this.held) { const sp = this.heldSpot(); this.placeAt(this.held.el, sp.x, sp.y, sp.s, -4); }
  }

  find(id) { return this.held?.card.id === id ? this.held : this.fan.find((f) => f.card.id === id); }

  // une carte part (vers la fosse, ou vers une cible)
  async send(id, to) {
    const f = this.find(id);
    if (!f) return;
    if (this.held === f) this.held = null; else this.fan = this.fan.filter((x) => x !== f);
    f.el.classList.add('moving');
    f.el.classList.remove('held');
    this.placeAt(f.el, to.x, to.y, 0.15, 30);
    f.el.style.opacity = '0';
    this.layoutFan();
    await this.w(480);
    f.el.remove();
  }

  mark(id, cls) { this.find(id)?.el.classList.add(cls); }
  setState(state) { // 'bust' | 'frozen' | null
    this.root.classList.toggle('bust', state === 'bust');
    this.root.classList.toggle('frozen', state === 'frozen');
  }

  async clear(to) {
    const all = [...(this.held ? [this.held] : []), ...this.fan];
    this.held = null; this.fan = [];
    all.forEach((f, i) => setTimeout(() => {
      f.el.classList.add('moving'); f.el.classList.remove('held');
      this.placeAt(f.el, to.x, to.y, 0.12, 40); f.el.style.opacity = '0';
    }, i * 40));
    await this.w(500 + all.length * 40);
    all.forEach((f) => f.el.remove());
    this.setState(null);
  }
  hasCards() { return !!this.held || this.fan.length > 0; }
}
