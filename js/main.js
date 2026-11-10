// ─────────────────────────────────────────────────────────────
//  VII — LE SEPTIÈME SCEAU
//  Titre → le Chevalier → la Route → le Duel → le butin (ou la mort)
// ─────────────────────────────────────────────────────────────
import { Dither, ditherCanvas } from './dither.js';
import { canvas, grad, radial, glow, vignette, goth, TAU, rng, fbm, clamp } from './paint.js';
import { mist, rain, ash, fireflies, dust, frameSimple, frameHonneurs } from './places.js';
import { View, portrait, buildFigure } from './world3d.js';
import { POSE_ORDER, skull } from './body3d.js';
import { ZONES, FOES, ITEMS, PALIERS, knightKit } from './content.js';
import { setUnlockedRanks, setPortrait, face, back } from './cards.js';
import { Match } from './game.js';
import { makeAI } from './ai.js';
import { Duel } from './duel3d.js';
import { sound } from './audio.js';
import { icon } from './icons.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ── sauvegarde ───────────────────────────────────────────────
const KEY = 'vii-save-2';
const fresh = () => ({ unlocked: [], ranks: [], node: 0, score: 0, pose: 0 });
let save = (() => { try { return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return fresh(); } })();
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* */ } };
{ // raccourcis de test : ?reset  ·  ?jusqua=N (débloque les N premiers combats)
  const q = new URLSearchParams(location.search);
  if (q.has('reset')) { save = fresh(); persist(); }
  if (q.has('jusqua')) {
    save = fresh();
    const n = Math.min(12, +q.get('jusqua') || 0);
    for (let i = 0; i < n; i++) { const f = FOES[i]; save.unlocked.push(f.reward); if (f.ambiance) save.unlocked.push(f.ambiance); if (f.extra) save.unlocked.push(f.extra); save.ranks.push(i + 1); }
    save.node = n; save.pose = n % 3; persist();
  }
}
setPortrait((foe, w, h) => portrait(foe.kit, w, h, { key: foe.name }));
setUnlockedRanks(save.ranks);
const has = (k) => save.unlocked.includes(k);
const done = () => save.node >= 12;
const zoneOf = (n) => ZONES[Math.min(2, Math.floor(Math.min(n, 11) / 4))];

// ── rendu ────────────────────────────────────────────────────
let current = 'title';
const glc = $('#gl');
const dither = new Dither(glc);
const src = canvas(10, 10), ctx = src.getContext('2d');
let W = 10, H = 10, bake = {};
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 3), D = dpr >= 2 ? dpr * 0.85 : 1.05;
  W = Math.min(1700, Math.round(innerWidth * dpr / D)); H = Math.max(10, Math.round(W * innerHeight / innerWidth));
  src.width = W; src.height = H; dither.size(W, H);
  bake = {};
  if (current === 'map') placeNodes();
}
const app = {
  flash(v = 1, mode = 'flash') { if (mode === 'invert') { dither.invert = 1; setTimeout(() => { dither.invert = 0; }, 130); } else { dither.flash = v; setTimeout(() => { dither.flash = 0; }, 160); } },
  shake() { glc.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-8px,4px)' }, { transform: 'translate(7px,-5px)' }, { transform: 'translate(-4px,-2px)' }, { transform: 'translate(0,0)' }], { duration: 380, easing: 'steps(5)' }); },
};
const duel = new Duel(); duel.app = app;

let t0 = performance.now(), last = t0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  const t = (now - t0) / 1000;
  if (document.hidden) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  (SCREENS[current] || SCREENS.title)(ctx, W, H, t, dt);
  dither.draw(src);
}

let duelInk = '#ece8dc';
function show(id) {
  current = id;
  $$('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
  const z = zoneOf(save.node);
  dither.set({ ink: id === 'duel' ? duelInk : z.ink, gamma: id === 'map' ? 1.3 : 1.55, gain: 1.15, lift: 0 });
  if (id === 'map') placeNodes();
}

// ── ÉCRAN TITRE ─────────────────────────────────────────────
function ogive(cx, top, bot, w) {
  const p = new Path2D();
  p.moveTo(cx - w / 2, bot); p.lineTo(cx - w / 2, top + w * 0.62);
  p.quadraticCurveTo(cx - w / 2, top + w * 0.1, cx, top); p.quadraticCurveTo(cx + w / 2, top + w * 0.1, cx + w / 2, top + w * 0.62);
  p.lineTo(cx + w / 2, bot); p.closePath();
  return p;
}
function pinnacle(c, x, y, h, s) {
  c.fillStyle = grad(c, x - 10 * s, 0, x + 10 * s, 0, [[0, 0.1], [0.4, 0.75], [1, 0.1]]);
  c.beginPath(); c.moveTo(x - 9 * s, y); c.lineTo(x, y - h); c.lineTo(x + 9 * s, y); c.fill();
  c.fillStyle = '#fff';
  for (let i = 1; i < 5; i++) {
    const yy = y - h * i / 5, ww = 9 * s * (1 - i / 5);
    c.beginPath(); c.moveTo(x - ww, yy); c.lineTo(x - ww - 6 * s, yy - 4 * s); c.lineTo(x - ww, yy - 3 * s); c.fill();
    c.beginPath(); c.moveTo(x + ww, yy); c.lineTo(x + ww + 6 * s, yy - 4 * s); c.lineTo(x + ww, yy - 3 * s); c.fill();
  }
  c.beginPath(); c.arc(x, y - h - 4 * s, 4 * s, 0, TAU); c.fill();
}
const views = {};
function titleScreen(c, W, H, t, dt) {
  const place = done() ? 'trone' : zoneOf(save.node).place;
  const view = (views[place] ||= new View(place));
  const s = H / 600, cx = W / 2, top = H * 0.07, bot = H * 0.74, aw = Math.min(W * 0.62, H * 0.82);
  const arch = ogive(cx, top, bot, aw);
  c.save(); c.clip(arch);
  view.draw(c, W, H, t);
  if (place === 'foret') mist(c, W, H, t, 0.6, 0.25);
  rain(c, W, H, dt, 0.55);
  c.restore();
  // moulures de l'arc
  c.strokeStyle = '#fff'; c.lineWidth = 3 * s; c.stroke(arch);
  for (const [k, lw] of [[14, 1.5], [24, 1], [34, 2.5]]) { c.lineWidth = lw * s; c.strokeStyle = `rgba(255,255,255,${0.9 - k / 60})`; c.stroke(ogive(cx, top - k * s, bot, aw + k * 2 * s)); }
  // crochets le long de l'arc
  for (let i = 1; i < 12; i++) {
    const k = i / 12, side = k < 0.5 ? -1 : 1, kk = side < 0 ? k * 2 : (1 - k) * 2;
    const x = cx + side * (aw / 2 + 34 * s) * (1 - kk * kk * 0.98), y = top - 34 * s + (aw * 0.62) * (1 - Math.sqrt(kk)) * 1.0;
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y, 4 * s, 8 * s, side * (0.6 + kk), 0, TAU); c.fill();
  }
  // pinacles et colonnettes
  for (const sx of [-1, 1]) {
    const x = cx + sx * (aw / 2 + 52 * s);
    c.fillStyle = grad(c, x - 12 * s, 0, x + 12 * s, 0, [[0, 0.05], [0.4, 0.6], [1, 0.05]]); c.fillRect(x - 10 * s, top + aw * 0.4, 20 * s, bot - top - aw * 0.4);
    pinnacle(c, x, top + aw * 0.4, 110 * s, s);
    for (let y = top + aw * 0.5; y < bot; y += 40 * s) { c.fillStyle = '#000'; c.fillRect(x - 3 * s, y, 6 * s, 22 * s); }
  }
  pinnacle(c, cx, top - 38 * s, 70 * s, s);
  goth(c, 'VII', cx, H * 0.875, H * 0.2, { stroke: 10 * s, fill: '#fff' });
  goth(c, 'Le Septième Sceau', cx, H * 0.935, H * 0.048, { stroke: 5 * s, fill: '#ddd' });
  frameSimple(c, W, H);
}

// ── LE CHEVALIER ─────────────────────────────────────────────
let knight = null, knightKey = '';
function hubView() {
  const v = (views.hub ||= new View('hub'));
  const kit = knightKit(save.unlocked), pose = done() ? 'trone' : POSE_ORDER[save.pose % POSE_ORDER.length];
  const k = JSON.stringify(kit) + pose;
  if (k !== knightKey) {
    knight?.root.removeFromParent();
    knight = buildFigure(kit); knight.setPose(pose); knightKey = k;
    v.scene.add(knight.root);
    const H = v.P.honneurs;
    H.vitrail.visible = has('vitrail'); H.etendard.visible = has('etendard'); H.trophees.visible = has('trophees'); H.throne.visible = done();
    knight.root.position.set(0, 0.24, done() ? -1.35 : 0);
    if (done()) knight.root.position.y = 0.24 + 0.72 * 0.9 - 0.48;
    knight.root.rotation.y = pose === 'salut' ? -0.25 : pose === 'genou' ? 0.5 : 0.3;
  }
  return v;
}
function hubScreen(c, W, H, t, dt) {
  const v = hubView();
  const tall = H > W;
  const low = knight.pose === 'genou' ? -0.12 : 0;
  v.setCam(tall ? [0, 1.5 + low, 5.8] : [0.5, 1.45 + low, 4.6], [0, (tall ? 1.2 : 1.12) + low, 0], tall ? 40 : 34);
  v.drift = 0.6;
  knight.update(t);
  v.draw(c, W, H, t, { portrait: false });
  if (has('brume')) { mist(c, W, H, t, 0.72, 0.3); fireflies(c, W, H, t); }
  if (has('pluie')) rain(c, W, H, dt, 0.7);
  if (has('cendres')) ash(c, W, H, dt);
  dust(c, W, H, t, 0.35);
  vignette(c, W, H, 0.8, 0.3);
  if (has('cadre')) frameHonneurs(c, W, H, t); else frameSimple(c, W, H);
}

// ── LA ROUTE ─────────────────────────────────────────────────
const NODE_POS = [
  [0.09, 0.74], [0.16, 0.66], [0.23, 0.72], [0.3, 0.6],
  [0.4, 0.68], [0.47, 0.6], [0.54, 0.66], [0.6, 0.54],
  [0.7, 0.62], [0.77, 0.52], [0.84, 0.58], [0.9, 0.38],
];
function mapStatic(c, W, H) {
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  c.fillStyle = grad(c, 0, 0, 0, H * 0.75, [[0, 0], [1, 0.12]]); c.fillRect(0, 0, W, H);
  c.fillStyle = radial(c, W * 0.62, H * 0.16, 2, H * 0.08, [[0, 1], [0.8, 0.8], [1, 0]]); c.beginPath(); c.arc(W * 0.62, H * 0.16, H * 0.055, 0, TAU); c.fill();
  glow(c, W * 0.62, H * 0.16, H * 0.25, 0.2);
  const r = rng(8), s = H / 600;
  c.fillStyle = '#0d0d0d';
  c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 8) c.lineTo(x, H * (0.62 - 0.12 * Math.sin(x / W * 3.1) * (x / W)) - fbm(x / 40, 1, 3) * 30 * s); c.lineTo(W, H); c.fill();
  for (let i = 0; i < 80; i++) {
    const x = r() * W * 0.36, base = H * (0.55 + r() * 0.35), h = (40 + r() * 70) * s;
    c.fillStyle = grad(c, x - h * 0.3, 0, x + h * 0.3, 0, [[0, 0.04], [0.45, 0.28 + r() * 0.1], [1, 0.03]]);
    for (let j = 0; j < 4; j++) { const yy = base - h * (j / 4), ww = h * 0.32 * (1 - j / 5); c.beginPath(); c.moveTo(x - ww, yy); c.lineTo(x, yy - h * 0.42); c.lineTo(x + ww, yy); c.fill(); }
  }
  const bx = W * 0.5, by = H * 0.58;
  c.fillStyle = grad(c, bx - 120 * s, 0, bx + 120 * s, 0, [[0, 0.12], [0.5, 0.4], [1, 0.1]]);
  c.fillRect(bx - 150 * s, by - 60 * s, 300 * s, 70 * s);
  for (const sx of [-1, 1]) { c.fillRect(bx + sx * 70 * s - 22 * s, by - 120 * s, 44 * s, 130 * s); c.beginPath(); c.moveTo(bx + sx * 70 * s - 28 * s, by - 120 * s); c.lineTo(bx + sx * 70 * s, by - 170 * s); c.lineTo(bx + sx * 70 * s + 28 * s, by - 120 * s); c.fill(); }
  c.fillStyle = '#000'; c.beginPath(); c.moveTo(bx - 22 * s, by + 10 * s); c.lineTo(bx - 22 * s, by - 30 * s); c.quadraticCurveTo(bx, by - 60 * s, bx + 22 * s, by - 30 * s); c.lineTo(bx + 22 * s, by + 10 * s); c.fill();
  for (let x = bx - 150 * s; x < bx + 150 * s; x += 14 * s) c.fillRect(x, by - 68 * s, 8 * s, 10 * s);
  const cx = W * 0.86, cy = H * 0.44;
  c.fillStyle = grad(c, cx - 140 * s, 0, cx + 140 * s, 0, [[0, 0.05], [0.4, 0.35], [1, 0.05]]);
  c.beginPath(); c.moveTo(cx - 200 * s, H * 0.75); c.lineTo(cx - 120 * s, cy + 40 * s); c.lineTo(cx + 120 * s, cy + 40 * s); c.lineTo(cx + 200 * s, H * 0.75); c.fill();
  for (const [dx, w, h] of [[-90, 40, 110], [-40, 34, 150], [0, 60, 190], [50, 34, 140], [95, 40, 100]]) {
    const x = cx + dx * s;
    c.fillStyle = grad(c, x - w * s / 2, 0, x + w * s / 2, 0, [[0, 0.08], [0.4, 0.45], [1, 0.06]]);
    c.fillRect(x - w * s / 2, cy + 40 * s - h * s, w * s, h * s);
    c.beginPath(); c.moveTo(x - w * s * 0.6, cy + 40 * s - h * s); c.lineTo(x, cy + 40 * s - h * s - w * s * 1.1); c.lineTo(x + w * s * 0.6, cy + 40 * s - h * s); c.fill();
    for (let y = cy + 30 * s - h * s; y < cy + 30 * s; y += 30 * s) { c.fillStyle = r() < 0.3 ? '#fff' : '#000'; c.fillRect(x - 2 * s, y, 4 * s, 9 * s); }
  }
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2 * s; c.setLineDash([3 * s, 6 * s]);
  c.beginPath(); NODE_POS.forEach(([x, y], i) => (i ? c.lineTo(x * W, y * H) : c.moveTo(x * W, y * H))); c.stroke(); c.setLineDash([]);
  ZONES.forEach((z, i) => goth(c, z.name, W * (0.2 + i * 0.3), H * 0.93, 26 * s, { stroke: 4 * s }));
  frameSimple(c, W, H);
}
function mapScreen(c, W, H, t) {
  if (!bake.map) { bake.map = canvas(W, H); mapStatic(bake.map.getContext('2d'), W, H); }
  c.drawImage(bake.map, 0, 0);
  const s = H / 600;
  NODE_POS.forEach(([nx, ny], i) => {
    const x = nx * W, y = ny * H, boss = FOES[i].boss, R = (boss ? 16 : 10) * s;
    if (i < save.node) { c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, R * 0.7, 0, TAU); c.fill(); c.fillStyle = '#000'; c.fillRect(x - R * 0.4, y - R * 0.2, R * 0.3, R * 0.3); c.fillRect(x + R * 0.1, y - R * 0.2, R * 0.3, R * 0.3); }
    else if (i === save.node) {
      const p = 0.5 + 0.5 * Math.sin(t * 4);
      glow(c, x, y, R * 4, 0.35 * p + 0.15);
      c.strokeStyle = '#fff'; c.lineWidth = 2.5 * s; c.beginPath(); c.arc(x, y, R + p * 6 * s, 0, TAU); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, R * 0.55, 0, TAU); c.fill();
    } else {
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.5 * s; c.beginPath(); c.arc(x, y, R * 0.7, 0, TAU); c.stroke();
    }
    if (boss && i >= save.node) { c.strokeStyle = '#fff'; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(x - R, y - R * 1.1); c.lineTo(x - R * 0.6, y - R * 1.8); c.lineTo(x, y - R * 1.3); c.lineTo(x + R * 0.6, y - R * 1.8); c.lineTo(x + R, y - R * 1.1); c.stroke(); }
  });
  mist(c, W, H, t, 0.7, 0.12);
}
function placeNodes() {
  const box = $('#nodes'); box.innerHTML = '';
  $('#preview').classList.add('hidden');
  NODE_POS.forEach(([x, y], i) => {
    const b = document.createElement('button');
    b.style.left = x * 100 + 'vw'; b.style.top = y * 100 + 'vh';
    b.disabled = i !== save.node;
    b.setAttribute('aria-label', FOES[i].name);
    if (i === save.node) {
      b.onmouseenter = b.onfocus = () => showPreview(i, x, y);
      b.onmouseleave = b.onblur = () => $('#preview').classList.add('hidden');
      b.onclick = () => { sound.play('click'); $('#preview').classList.add('hidden'); startDuel(); };
    }
    box.appendChild(b);
  });
  if (save.node < 12 && innerWidth < 760) { const [x, y] = NODE_POS[save.node]; showPreview(save.node, x, y); }
}
const previews = {};
function showPreview(i, x, y) {
  const pv = $('#pv');
  if (!previews[i]) {
    previews[i] = ditherCanvas(portrait(FOES[i].kit, 140, 154, { key: FOES[i].name }), { ink: zoneOf(i).ink, gamma: 1.3 });
  }
  pv.width = 140; pv.height = 154; pv.getContext('2d').drawImage(previews[i], 0, 0);
  $('#pv-name').textContent = FOES[i].name;
  const p = $('#preview'); p.style.left = Math.min(Math.max(x, 0.12), 0.88) * 100 + 'vw'; p.style.top = y * 100 + 'vh'; p.classList.remove('hidden');
}

// ── LE DUEL ──────────────────────────────────────────────────
let session = null, paused = false;
async function startDuel() {
  if (done()) return;
  const n = save.node, z = Math.floor(n / 4), j = n % 4;
  const foe = FOES[n], zone = ZONES[z];
  const dealer = j < 3 ? FOES[z * 4 + 3] : null;
  const myStart = j === 0 ? 0 : save.score, oppStart = j === 0 ? 0 : PALIERS[j - 1], target = PALIERS[j];
  duelInk = zone.ink;
  duel.setup({ foe, dealer, place: zone.place === 'chateau' && j === 3 ? 'trone' : zone.place, meId: 'me', foeId: 'foe', kit: knightKit(save.unlocked), target, ink: zone.ink });
  show('duel');
  sound.stopMusic(); sound.startMusic('table'); sound.play('enter');
  const ban = $('#banner');
  ban.innerHTML = `<b>${foe.name}</b><small>— premier à ${target} —</small>`;
  ban.classList.add('on');
  await wait(2600);
  ban.classList.remove('on');
  const players = [{ id: 'me', name: 'Toi', kind: 'human', score: myStart }, { id: 'foe', name: foe.name, kind: 'ai', score: oppStart }];
  const controllers = {
    me: { decide: () => duel.askDecision(), chooseTarget: (s, p, kind, c) => duel.askTarget(kind, c) },
    foe: makeAI(null, { risk: foe.risk }),
  };
  const match = new Match({
    players, controllers, target, dealer: 1,
    presenter: async (ev, snap) => { while (paused) await wait(100); await duel.present(ev, snap); },
  });
  session = { match, n };
  let winner;
  try { winner = await match.run(); } catch { return; }
  if (session?.match !== match) return;
  const me = match.players.find((p) => p.id === 'me');
  session = null;
  if (winner === 'me') return victory(n, me.score);
  return defeat(n);
}

let unlockState = null, deathState = null;
function victory(n, score) {
  const foe = FOES[n], j = n % 4;
  const gained = [];
  for (const k of [foe.reward, foe.ambiance, foe.extra]) if (k && !has(k)) { save.unlocked.push(k); gained.push(k); }
  if (!save.ranks.includes(n + 1)) save.ranks.push(n + 1);
  setUnlockedRanks(save.ranks);
  save.score = j === 3 ? 0 : Math.min(score, PALIERS[j] + Math.round((PALIERS[j + 1] - PALIERS[j]) * 0.5));
  save.node = Math.max(save.node, n + 1);
  save.pose = (save.pose + 1) % POSE_ORDER.length;
  persist();
  unlockState = { n, gained: gained.length ? gained : [foe.reward], t: 0 };
  sound.stopMusic(); sound.play('win');
  show('unlock');
  const uc = $('#unlock-card');
  uc.innerHTML = `<div class="cd down"><div class="cd-in"><img class="f" src="${face({ t: 'n', v: n + 1, id: 'u' }, 200)}" alt=""><img class="b" src="${back(200)}" alt=""></div></div>`;
  setTimeout(() => { uc.querySelector('.cd')?.classList.remove('down'); sound.play('flip'); }, 1600);
}
function unlockScreen(c, W, H, t, dt) {
  const u = unlockState; if (!u) return;
  u.t += dt;
  const s = H / 600, narrow = W < H;
  const v = hubView();
  const a = u.t * 0.25;
  v.setCam(narrow ? [Math.sin(a) * 4.8, 1.8, Math.cos(a) * 4.8 + 1.4] : [Math.sin(a) * 3.8 - 1.1, 1.5, Math.cos(a) * 3.8], [narrow ? 0 : -0.55, narrow ? 1.5 : 1.25, 0], 36);
  v.drift = 0;
  knight.update(t);
  c.save(); c.globalAlpha = clamp(u.t / 1.2); v.draw(c, W, H, t, { portrait: false }); c.restore();
  vignette(c, W, H, 0.7, 0.3);
  const names = u.gained.map((g) => ITEMS[g]?.name).filter(Boolean);
  c.save(); c.globalAlpha = clamp((u.t - 0.6) / 0.8);
  goth(c, names[0] || '', W / 2, H * 0.12, Math.min(H * 0.085, W * 0.07), { stroke: 6 * s });
  names.slice(1).forEach((nm, i) => goth(c, '+ ' + nm, W / 2, H * 0.19 + i * H * 0.05, H * 0.04, { stroke: 4 * s }));
  c.restore();
  if (u.gained.includes('pluie')) rain(c, W, H, dt, 0.6);
  if (u.gained.includes('cendres')) ash(c, W, H, dt);
  if (u.gained.includes('brume')) { mist(c, W, H, t, 0.72, 0.3); fireflies(c, W, H, t); }
  dust(c, W, H, t, 0.4);
  if (u.gained.includes('cadre')) frameHonneurs(c, W, H, t); else frameSimple(c, W, H);
}

function defeat(n) {
  const z = Math.floor(n / 4);
  deathState = { n, t: 0, zone: ZONES[z] };
  save.node = z * 4; save.score = 0; persist();
  sound.stopMusic(); sound.play('lose');
  show('death');
}
function deathScreen(c, W, H, t, dt) {
  const d = deathState; if (!d) return;
  d.t += dt;
  const foe = FOES[d.n], k = 'death' + d.n + W;
  if (!bake[k]) { const b = canvas(W, H), bc = b.getContext('2d'); const ph = Math.round(H * 0.9), pw = Math.round(ph * 0.9); bc.drawImage(portrait(foe.kit, pw, ph, { key: foe.name + 'mort', zoom: 1.25 }), (W - pw) / 2, 0); bake[k] = b; }
  const z = 1 + Math.min(0.15, d.t * 0.03);
  c.save(); c.translate(W / 2, H * 0.4); c.scale(z, z); c.translate(-W / 2, -H * 0.4); c.globalAlpha = clamp(d.t / 1.5); c.drawImage(bake[k], 0, 0); c.restore();
  c.fillStyle = grad(c, 0, H * 0.45, 0, H, [[0, 0], [1, 0]]);
  const g = c.createLinearGradient(0, H * 0.4, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.6, 'rgba(0,0,0,.95)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  ash(c, W, H, dt);
  const s = H / 600;
  c.save(); c.globalAlpha = clamp((d.t - 1) / 1);
  goth(c, 'Les âmes te réclament.', W / 2, H * 0.78, Math.min(H * 0.08, W * 0.075), { stroke: 6 * s });
  goth(c, 'Tu renais : ' + d.zone.name, W / 2, H * 0.86, Math.min(H * 0.035, W * 0.04), { stroke: 4 * s });
  c.restore();
  vignette(c, W, H, 0.9, 0.25);
}

const SCREENS = { title: titleScreen, hub: hubScreen, map: mapScreen, duel: (c, W, H, t, dt) => duel.render(c, W, H, t, dt), unlock: unlockScreen, death: deathScreen };

// ── navigation ───────────────────────────────────────────────
$$('[data-icon]').forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
let started = false;
$('#title').addEventListener('click', async () => {
  if (!started) { started = true; await sound.init(); sound.startMusic('menu'); }
  sound.play('enter');
  show('hub');
});
addEventListener('keydown', (e) => {
  if (current === 'title' && (e.key === 'Enter' || e.key === ' ')) $('#title').click();
  if (current === 'duel' && e.key === 'Escape') togglePause();
});
$('#to-map').addEventListener('click', (e) => { e.stopPropagation(); sound.play('click'); show('map'); });
$('#map-back').addEventListener('click', () => { sound.play('click'); show('hub'); });
const backToHub = () => { sound.play('click'); sound.startMusic('menu'); show('hub'); };
$('#unlock').addEventListener('click', () => { if (unlockState?.t > 1.6) backToHub(); });
$('#death').addEventListener('click', () => { if (deathState?.t > 1.8) backToHub(); });

function togglePause(force) {
  paused = force ?? !paused;
  $('#pause-menu').classList.toggle('hidden', !paused);
  $('[data-p=sound] b').textContent = sound.muted ? 'coupé' : 'actif';
}
$('#pause').addEventListener('click', () => { sound.play('click'); togglePause(true); });
$('#pause-menu').addEventListener('click', (e) => {
  const b = e.target.closest('[data-p]'); if (!b) return;
  sound.play('click');
  if (b.dataset.p === 'resume') togglePause(false);
  if (b.dataset.p === 'sound') { sound.setMuted(!sound.muted); togglePause(true); }
  if (b.dataset.p === 'flee') {
    togglePause(false);
    if (session) { session.match.aborted = true; session = null; }
    duel.cancel();
    backToHub();
  }
});

// ── démarrage ───────────────────────────────────────────────
addEventListener('resize', resize);
(async () => {
  await Promise.all(['60px Jacquard', '700 20px Grenze'].map((f) => document.fonts.load(f).catch(() => {})));
  resize();
  show('title');
  requestAnimationFrame(loop);
})();
window.__vii = { get save() { return save; }, show };
