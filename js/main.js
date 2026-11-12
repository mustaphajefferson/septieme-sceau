// ─────────────────────────────────────────────────────────────
//  VII — LE SEPTIÈME SCEAU · chef d'orchestre
//  Accueil (le lieu du prochain duel) → le seuil → la route,
//  le deck, le guide → la table → le butin (ou la mort).
// ─────────────────────────────────────────────────────────────
import { THREE, DitherRenderer } from './render.js';
import { buildExterior } from './world.js';
import { AsciiView } from './asciiview.js';
import { installFrameVars, drawScreenFrame } from './frames.js';
import { portrait, portraitCanvas } from './gallery.js';
import { Play } from './play.js';
import { sound } from './audio.js';
import { Match, RANK_NAMES } from './game.js';
import { makeAI } from './ai.js';
import { icon } from './icons.js';
import { BESTIAIRE, PACTE } from './lore.js';
import { ZONES, FOES, PALIERS, RELICS, relicCard, offer } from './content.js';
import { setRankArt, faceURL, backURL, clearFaces } from './cardtex.js';
import { wait } from './fx.js';
import { setHandArt } from './handview.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
installFrameVars();

// ── sauvegarde ───────────────────────────────────────────────
const KEY = 'vii-save-4';
const fresh = () => ({ ranks: [], relics: [], node: 0, score: 0 });
let save = (() => { try { return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return fresh(); } })();
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* */ } };
{ // raccourcis de test : ?reset · ?jusqua=N
  const q = new URLSearchParams(location.search);
  if (q.has('reset')) { save = fresh(); persist(); }
  if (q.has('jusqua')) {
    save = fresh();
    const n = Math.min(12, +q.get('jusqua') || 0);
    for (let i = 0; i < n; i++) { save.ranks.push(i + 1); save.relics.push(offer(i)[0]); }
    save.node = n; persist();
  }
}
const done = () => save.node >= 12;
const zoneIdx = (n) => Math.min(2, Math.floor(Math.min(n, 11) / 4));
const zoneOf = (n) => ZONES[zoneIdx(n)];
const PAL = { foret: 'fange', pont: 'rouille', chateau: 'velin' };

// ── icônes & curseur ─────────────────────────────────────────
const fillIcons = (root = document) => $$('[data-icon]', root).forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
fillIcons();
{
  const svg = icon('grab').replace('class="px "', 'xmlns="http://www.w3.org/2000/svg" width="32" height="32"').replace(/currentColor/g, '#e9e3bf');
  const outline = svg.replace('<path', '<path transform="translate(1 1)" fill="#000" ').replace(/fill="#e9e3bf" opacity=".45"/, 'fill="#000"');
  document.body.style.cursor = `url("data:image/svg+xml,${encodeURIComponent(outline)}") 8 2, auto`;
}

// ── rendu ────────────────────────────────────────────────────
let current = 'title';
const canvas = $('#gl');
const dr = new DitherRenderer(canvas, { pixel: (w, h) => Math.max(2, Math.min(w, h) / 250), palette: 'fange' });
const play = new Play(dr);
const art = (i, w = 96, h = 112) => portrait(dr, 'f' + i, { palette: 'velin', w, h });
setRankArt(Object.assign((v) => (v >= 1 && save.ranks.includes(v) ? portraitCanvas(dr, 'f' + (v - 1), { palette: 'velin', w: 148, h: 150 }) : null), { label: (v) => FOES[v - 1]?.name || '' }));

setHandArt((v) => (v >= 1 && save.ranks.includes(v) ? { url: portrait(dr, 'f' + (v - 1), { palette: 'velin', w: 148, h: 150 }), name: FOES[v - 1].name } : null));
const extScene = new THREE.Scene();
const ext = buildExterior(extScene);
const extCam = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
const ascii = new AsciiView($('#asc'), dr.renderer);
const SHOTS = {
  title: { pos: [0.4, 1.6, 5.5], look: [0, 4.2, -12], fov: 55 },
  menu: { pos: [-1.6, 1.5, -1.0], look: [-0.6, 1.6, -9], fov: 44 },
};
let shot = { pos: new THREE.Vector3(...SHOTS.title.pos), look: new THREE.Vector3(...SHOTS.title.look), fov: SHOTS.title.fov };
let shotFrom = null, shotTo = null, shotK = 1;
function goShot(name, dur = 2.2) {
  const s = SHOTS[name]; if (!s) return;
  shotFrom = { pos: shot.pos.clone(), look: shot.look.clone(), fov: shot.fov };
  shotTo = { pos: new THREE.Vector3(...s.pos), look: new THREE.Vector3(...s.look), fov: s.fov, dur };
  shotK = 0;
}
const frameSvg = $('#sframe-svg');
const redrawFrame = () => drawScreenFrame(frameSvg);
redrawFrame();
addEventListener('resize', () => { ascii.resize(); redrawFrame(); });

function placeGL() {
  const slot = $(`#${current} [data-gl]`);
  if (!slot) { canvas.style.display = 'none'; return; }
  const r = slot.getBoundingClientRect();
  if (!r.width || !r.height) { canvas.style.display = 'none'; return; }
  canvas.style.display = 'block';
  Object.assign(canvas.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', clipPath: 'none' });
  dr.resize(r.width, r.height);
  play.stage.resize(r.width, r.height);
}
addEventListener('resize', placeGL);

let last = performance.now(), ct = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (document.hidden) return;
  if (current === 'game') { if (canvas.style.display !== 'none') play.frame(dt); return; }
  ct += dt;
  ext.tick(ct);
  if (shotTo) {
    shotK = Math.min(1, shotK + dt / shotTo.dur);
    const k = shotK < 0.5 ? 2 * shotK * shotK : 1 - Math.pow(-2 * shotK + 2, 2) / 2;
    shot.pos.lerpVectors(shotFrom.pos, shotTo.pos, k); shot.look.lerpVectors(shotFrom.look, shotTo.look, k); shot.fov = shotFrom.fov + (shotTo.fov - shotFrom.fov) * k;
    if (shotK >= 1) shotTo = null;
  }
  extCam.position.copy(shot.pos).add(new THREE.Vector3(Math.sin(ct * 0.13) * 0.15, Math.sin(ct * 0.21) * 0.05, 0));
  extCam.fov = shot.fov; extCam.lookAt(shot.look);
  ascii.render(extScene, extCam, dt, { dim: ['title', 'menu'].includes(current) ? 1 : 0.4 });
}

function show(id) {
  current = id;
  document.body.classList.toggle('ingame', id === 'game');
  if (id === 'title' || id === 'menu') goShot(id);
  ext.setZone(zoneOf(save.node).place);
  ext.showPilgrim(id !== 'title');
  $$('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
  requestAnimationFrame(placeGL);
  setTimeout(placeGL, 520);
}

document.addEventListener('pointerover', (e) => {
  const b = e.target.closest('button');
  if (b && !b.disabled && b !== document._h) { document._h = b; sound.play('hover'); }
});
const updateSound = () => {
  $$('[data-sound-toggle]').forEach((b) => { b.innerHTML = icon(sound.muted ? 'mute' : 'note'); b.classList.toggle('off', !!sound.muted); });
  $('#m-sound').textContent = sound.muted ? 'coupé' : 'actif';
};
$$('[data-sound-toggle]').forEach((b) => b.addEventListener('click', () => { sound.setMuted(!sound.muted); updateSound(); }));

// ── carte agrandie (inspection) ─────────────────────────────
function inspect(url) {
  const v = $('#cardview'), c = $('.cv-card', v);
  $('img', c).src = url;
  v.classList.remove('hidden');
  sound.play('flip');
  v.onpointermove = (e) => {
    const r = c.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width, my = (e.clientY - r.top) / r.height;
    c.style.setProperty('--mx', mx * 100 + '%'); c.style.setProperty('--my', my * 100 + '%');
    c.style.setProperty('--rx', ((0.5 - my) * 16).toFixed(1) + 'deg'); c.style.setProperty('--ry', ((mx - 0.5) * 20).toFixed(1) + 'deg');
  };
  v.onclick = () => v.classList.add('hidden');
}

// ── ACCUEIL ──────────────────────────────────────────────────
async function boot() {
  show('title');
  requestAnimationFrame(loop);
  await document.fonts.ready;
  await Promise.all(['27px Bastarda', '60px Jacquard', '700 30px Grenze', '500 20px Grenze', '11px JBM'].map((f) => document.fonts.load(f).catch(() => {})));
  clearFaces();
  placeGL();
  const b = $('#enter');
  b.disabled = false; b.textContent = 'Appuie sur une touche';
  const go = () => { removeEventListener('keydown', go); b.removeEventListener('click', go); enter(); };
  b.addEventListener('click', go);
  addEventListener('keydown', go);
}
async function enter() {
  await sound.init();
  sound.play('enter');
  sound.startMusic('menu');
  updateSound();
  openMenu();
}

// ── LE SEUIL ─────────────────────────────────────────────────
function openMenu() {
  const n = Math.min(save.node, 11), z = zoneOf(save.node), j = n % 4;
  $('#m-zone').textContent = z.name;
  if (done()) {
    $('#m-kick').textContent = 'La route est achevée';
    $('#m-foe').textContent = 'Le trône est vide';
    $('#m-tier').textContent = 'le Mage viendra';
    $('#m-go').textContent = 'Rejouer le Roi déchu';
    $('#m-go-sub').textContent = 'premier à 200';
  } else {
    $('#m-kick').textContent = FOES[n].boss ? 'Le maître des lieux' : 'Prochain duel · ' + (j + 1) + ' / 4';
    $('#m-foe').textContent = FOES[n].name;
    $('#m-tier').textContent = 'premier à ' + PALIERS[j];
    $('#m-go').textContent = 'Affronter ' + FOES[n].name.replace(/^(Le |La |L')/, (m) => m.toLowerCase());
    $('#m-go-sub').textContent = j < 3 ? FOES[Math.floor(n / 4) * 4 + 3].name + ' donne les cartes' : 'il s\'assoit';
  }
  $('#m-foe-img').src = art(n);
  $('#m-deck-sub').textContent = `${save.ranks.length} visage${save.ranks.length > 1 ? 's' : ''} · ${save.relics.length} relique${save.relics.length > 1 ? 's' : ''}`;
  $('#m-route-sub').textContent = `${save.node} / 12`;
  show('menu');
}
$('#menu-list').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  sound.play('click');
  if (b.hasAttribute('data-sound-toggle-row')) { sound.setMuted(!sound.muted); updateSound(); return; }
  ({ duel: () => startDuel(done() ? 11 : save.node), deck: openDeck, route: openRoute, codex: openCodex })[b.dataset.act]?.();
});
$$('[data-back]').forEach((b) => b.addEventListener('click', () => { sound.play('click'); openMenu(); }));

// ── LA ROUTE ─────────────────────────────────────────────────
function openRoute() {
  $('#route-zones').innerHTML = ZONES.map((z, zi) => `<div class="zone"><h3>${esc(z.name)}</h3><ol>${[0, 1, 2, 3].map((j) => {
    const i = zi * 4 + j, f = FOES[i], st = i < save.node ? 'done' : i === save.node ? 'now' : 'locked';
    const known = i <= save.node;
    return `<li><button class="node ${st} ${f.boss ? 'boss' : ''}" data-n="${i}" ${st === 'now' ? '' : 'tabindex="-1"'}>
      <span class="ar">${known ? `<img alt="" src="${art(i, 54, 60)}">` : '?'}</span>
      <span><b>${known ? esc(f.name) : '· · ·'}</b><small>${f.boss ? 'boss · premier à 200' : 'premier à ' + PALIERS[j]}</small></span>
      <span>${icon(st === 'done' ? 'seal' : f.boss ? 'skull' : st === 'now' ? 'candle' : 'door')}</span></button></li>`;
  }).join('')}</ol></div>`).join('');
  $('#route-zones').onclick = (e) => { const b = e.target.closest('.node.now'); if (b) { sound.play('click'); startDuel(+b.dataset.n); } };
  show('route');
}

// ── LE DECK ──────────────────────────────────────────────────
function openDeck() {
  $('#deck-ranks').innerHTML = Array.from({ length: 13 }, (_, v) => {
    const open = v === 0 || save.ranks.includes(v);
    const url = open ? faceURL({ t: 'n', v }) : backURL();
    return `<button class="cg ${open ? '' : 'locked'}" data-url="${open ? url : ''}" title="${esc(open ? RANK_NAMES[v] : 'Rang ' + v + ' : bats son gardien')}"><img alt="" src="${url}"><i>×${Math.max(1, v)}</i></button>`;
  }).join('');
  const counts = {}; for (const id of save.relics) counts[id] = (counts[id] || 0) + 1;
  $('#deck-relics').innerHTML = Object.keys(counts).map((id) => { const url = faceURL(relicCard(id)); return `<button class="cg" data-url="${url}" title="${esc(RELICS[id].name)}"><img alt="" src="${url}">${counts[id] > 1 ? `<i>×${counts[id]}</i>` : ''}</button>`; }).join('')
    || '<p class="empty-note">Aucune relique. Bats une créature pour gagner la première.</p>';
  $('#deck-count').textContent = `L'Ossuaire compte ${94 + save.relics.length} âmes : 94 communes et ${save.relics.length} relique${save.relics.length > 1 ? 's' : ''}.`;
  $('#deck').onclick = (e) => { const b = e.target.closest('.cg[data-url]'); if (b?.dataset.url) inspect(b.dataset.url); };
  show('deck');
}

// ── PACTE & BESTIAIRE ───────────────────────────────────────
function openCodex() {
  $('#pacte').innerHTML = PACTE.map(([ic, n, d]) => `<div class="state"><div class="st-ic">${icon(ic)}</div><h3>${esc(n)}</h3><p>${esc(d)}</p></div>`).join('');
  $('#bestiaire').innerHTML = FOES.map((f, i) => {
    const b = BESTIAIRE['f' + i];
    if (i > save.node) return `<div class="beast"><div class="arch" style="display:grid;place-items:center;font:400 90px var(--jac);color:var(--g2)">?</div><div class="nm">· · ·</div><div class="tt">${esc(zoneOf(i).name)}</div></div>`;
    return `<div class="beast">
      <div class="arch"><img alt="" src="${portrait(dr, 'f' + i, { palette: 'fange', w: 200, h: 128 })}"></div>
      <div class="nm">${esc(b.name)}</div>
      <div class="tt">${esc(b.title)}</div>
      <div class="tx">${esc(b.text)}</div>
      <div class="stats">${Object.entries(b.stats).map(([s, v]) => `<span>${s}</span><span class="bar">${[1, 2, 3, 4, 5].map((k) => `<i class="${k <= v ? 'on' : ''}"></i>`).join('')}</span>`).join('')}</div>
      <div class="items">${b.items.map(([ic, n, d]) => `<div>${icon(ic)}<span>${esc(n)}<small>${esc(d)}</small></span></div>`).join('')}</div>
      <div class="align"><span>Mal</span><span><i style="left:${b.align * 100}%"></i></span><span>Bien</span></div>
    </div>`;
  }).join('');
  show('codex');
}

// ── LE DUEL ──────────────────────────────────────────────────
let session = null;
async function startDuel(n) {
  const z = Math.floor(n / 4), j = n % 4, zone = ZONES[z];
  const foe = FOES[n], target = PALIERS[j];
  const myStart = j === 0 || done() ? 0 : save.score, oppStart = j === 0 ? 0 : PALIERS[j - 1];
  const players = [{ id: 'you', name: 'Pèlerin', kind: 'human', score: myStart }, { id: 'foe', name: foe.name, kind: 'ai', persona: 'f' + n, score: oppStart }];
  const controllers = { you: { decide: () => play.askDecision(), chooseTarget: (s, pid, kind, c) => play.askTarget(kind, c) }, foe: makeAI(null, { risk: foe.risk }) };
  const match = new Match({ players, controllers, target, dealer: 1, extra: save.relics.map(relicCard), presenter: (ev, snap) => play.present(ev, snap) });
  session = { match, n };
  play.showRisk = true; play.stage.speed = 1; play.gate = true;
  play.onGameOver = (ev) => { if (session?.match !== match) return; session = null; if (ev.winner === 'you') victory(n, match.players.find((p) => p.id === 'you').score); else defeat(n); };
  play.stage.crypt.setZone(zone.place);
  play.stage.setDealer(j < 3 ? 'f' + (z * 4 + 3) : null);
  show('game');
  dr.setPalette(PAL[zone.place]);
  play.mount(match.snapshot(), 'you');
  $('#g-target').textContent = target;
  sound.stopMusic(); sound.startMusic('table');
  play.banner(foe.name);
  try { await match.run(); } catch (e) { if (e?.message !== 'aborted') console.error(e); }
}
function leave() {
  if (session) { session.match.aborted = true; play.cancelPrompts(); }
  session = null;
  play.closeOverlay();
  sound.stopMusic(); sound.startMusic('menu');
  openMenu();
}
$('#g-quit').onclick = () => { sound.play('click'); if (confirmFlee()) leave(); };
let fleeArmed = 0;
function confirmFlee() { // deux clics pour fuir : la porte clignote
  const b = $('#g-quit');
  if (Date.now() - fleeArmed < 2500) return true;
  fleeArmed = Date.now(); b.classList.add('blink'); setTimeout(() => b.classList.remove('blink'), 2500);
  return false;
}

// ── LE BUTIN ─────────────────────────────────────────────────
function victory(n, score) {
  const j = n % 4;
  if (!save.ranks.includes(n + 1)) save.ranks.push(n + 1);
  if (!done()) save.score = j === 3 ? 0 : Math.min(score, PALIERS[j] + Math.round((PALIERS[j + 1] - PALIERS[j]) * 0.5));
  save.node = Math.max(save.node, n + 1);
  persist();
  clearFaces();
  sound.stopMusic(); sound.startMusic('menu');
  const z = zoneOf(n);
  $('#sp-zone').textContent = z.name;
  $('#sp-title').textContent = FOES[n].name + ' est tombé';
  $('#sp-lead').textContent = `Le rang ${n + 1} porte désormais son visage. ` + (FOES[n].boss && n === 11 ? 'Le trône est à toi.' : FOES[n].boss ? 'La route s\'ouvre vers ' + ZONES[zoneIdx(n + 1)].name + '.' : '');
  $('#sp-card').src = faceURL({ t: 'n', v: n + 1 }); $('#sp-back').src = backURL();
  const flip = $('.flip'); flip.classList.remove('up');
  const sp = $('#spoils'); sp.classList.remove('picking');
  const row = $('#sp-relics'); row.innerHTML = '';
  let taken = false;
  for (const id of offer(n)) {
    const b = document.createElement('button');
    b.innerHTML = `<img alt="" src="${faceURL(relicCard(id))}"><span>${esc(RELICS[id].name)}</span>`;
    b.onclick = () => {
      if (taken) return; taken = true;
      save.relics.push(id); persist();
      b.classList.add('taken'); sound.play('gain');
      setTimeout(openMenu, 900);
    };
    row.appendChild(b);
  }
  show('spoils');
  setTimeout(() => { flip.classList.add('up'); sound.play('flip'); }, 900);
  setTimeout(() => { sp.classList.add('picking'); sound.play('whoosh'); }, 2400);
}

// ── LA MORT ──────────────────────────────────────────────────
function defeat(n) {
  const z = Math.floor(n / 4);
  if (!done()) { save.node = z * 4; save.score = 0; persist(); }
  sound.stopMusic();
  $('#dt-zone').textContent = ZONES[z].name;
  $('#dt-img').src = portrait(dr, 'f' + n, { palette: 'sang', w: 200, h: 230 });
  $('#dt-lead').textContent = `${FOES[n].name} a gagné ta mise. Les âmes que tu portais t'ont repris. Tu renais à l'orée : ${ZONES[z].name}. Tes visages et tes reliques te suivent.`;
  show('death');
}
$('#dt-go').onclick = () => { sound.play('click'); sound.startMusic('menu'); openMenu(); };

addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#cardview').classList.add('hidden'); });
window.__vii = { get save() { return save; }, victory, defeat, startDuel, openDeck, openRoute, openMenu };
boot();
