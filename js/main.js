// ─────────────────────────────────────────────────────────────
//  VII — LE SEPTIÈME SCEAU · chef d'orchestre
//  Accueil (le lieu du prochain duel) → le seuil → la route,
//  le deck, le guide → la table → le butin (ou la mort).
// ─────────────────────────────────────────────────────────────
import { THREE, DitherRenderer, PALETTES } from './render.js';
import { buildExterior } from './world.js';
import { installFrameVars, drawScreenFrame } from './frames.js';
import { portrait, portraitCanvas } from './gallery.js';
import { Play } from './play.js';
import { sound } from './audio.js';
import { Match, RANK_NAMES } from './game.js';
import { makeAI } from './ai.js';
import { icon } from './icons.js';
import { BESTIAIRE, PACTE } from './lore.js';
import { ZONES, FOES, PALIERS, offer, ILLUS } from './content.js';
import { loadDots, dotsToCanvas, Veil, Thorn, Figure } from './dots.js';
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
// plusieurs decks viendront ; pour l'instant, celui du pèlerin (rangs 0 à 12, sans cartes spéciales)
const DECKS = [{ id: 'pelerin', name: 'Le deck du pèlerin' }];

// ── icônes & curseur ─────────────────────────────────────────
const fillIcons = (root = document) => $$('[data-icon]', root).forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
fillIcons();
{
  const svg = icon('grab').replace('class="px "', 'xmlns="http://www.w3.org/2000/svg" width="32" height="32"').replace(/currentColor/g, '#e9e3bf');
  const outline = svg.replace('<path', '<path transform="translate(1 1)" fill="#000" ').replace(/fill="#e9e3bf" opacity=".45"/, 'fill="#000"');
  document.body.style.cursor = `url("data:image/svg+xml,${encodeURIComponent(outline)}") 8 2, auto`;
}

// ── rendu ────────────────────────────────────────────────────
let current = 'title', current0 = '';
const canvas = $('#gl');
const dr = new DitherRenderer(canvas, { pixel: (w, h) => Math.max(2, Math.min(w, h) / 250), palette: 'fange' });
const play = new Play(dr);
// ── illustrations en points ─────────────────────────────────
const veil = new Veil($('#veil')); play.veil = veil;
const illus = {};      // nom → points du dessin
const figures = {};    // nom → personnage animé
let thorns = [], thornSrc = null;
const foeCache = new Map();
// portrait d'un adversaire : son dessin s'il en a un, sinon le rendu de sa créature
function foeCanvas(i, w, h, palette = 'velin') {
  const k = [i, w, h, palette].join('|');
  if (!foeCache.has(k)) {
    const f = FOES[i], P = PALETTES[palette];
    foeCache.set(k, f.art && illus[f.art] ? dotsToCanvas(illus[f.art], ILLUS[f.art].bust, w, h, P.ramp[0], P.ramp[4]) : portraitCanvas(dr, 'f' + i, { palette, w, h }));
  }
  return foeCache.get(k);
}
setRankArt(Object.assign((v) => (v >= 1 && save.ranks.includes(v) ? foeCanvas(v - 1, 148, 150) : null), { label: (v) => FOES[v - 1]?.name || '' }));
setHandArt((v) => (v >= 1 && save.ranks.includes(v) ? { url: foeCanvas(v - 1, 148, 150).toDataURL(), name: FOES[v - 1].name } : null));
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener('pointermove', (e) => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = -((e.clientY / innerHeight) * 2 - 1); });
const extScene = new THREE.Scene();
const ext = buildExterior(extScene);
const extCam = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
const SHOTS = {
  title: { pos: [0.4, 1.6, 5.5], look: [0, 4.2, -12], fov: 55 },
  menu: { pos: [-1.0, 1.9, 2.2], look: [0, 3.4, -14], fov: 56 },
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
addEventListener('resize', redrawFrame);

function placeGL() {
  const slot = $(`#${current} [data-gl]`);
  if (!slot) { canvas.style.display = 'none'; return; }
  const r = slot.getBoundingClientRect();
  if (!r.width || !r.height) { canvas.style.display = 'none'; return; }
  canvas.style.display = 'block';
  Object.assign(canvas.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', clipPath: 'none' });
  dr.resize(r.width, r.height);
  play.stage.resize(r.width, r.height);
  extCam.aspect = r.width / r.height; extCam.updateProjectionMatrix();
}
addEventListener('resize', placeGL);
addEventListener('resize', () => { veil.resize(); for (const f of Object.values(figures)) f.setup(); buildThorns(); });
function buildThorns() {
  if (!thornSrc) return;
  thorns = [new Thorn($('#m-go'), thornSrc), new Thorn($('#m-deck'), thornSrc)];
}
let palSync = '';

let last = performance.now(), ct = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (document.hidden) return;
  if (dr.paletteName !== palSync) { palSync = dr.paletteName; const P = PALETTES[palSync] || PALETTES.fange; veil.setPalette(P); thorns.forEach((b) => b.setPalette(P)); }
  veil.frame(now / 1000, dt);
  if (current === 'menu') thorns.forEach((b) => b.frame(now / 1000, dt));
  if (current === 'game') { if (canvas.style.display !== 'none') play.frame(dt); return; }
  if (current === 'deck') { play.stage.update(dt); play.stage.render(); return; }
  ct += dt;
  mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 4); mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 4);
  ext.tick(ct);
  if (shotTo) {
    shotK = Math.min(1, shotK + dt / shotTo.dur);
    const k = shotK < 0.5 ? 2 * shotK * shotK : 1 - Math.pow(-2 * shotK + 2, 2) / 2;
    shot.pos.lerpVectors(shotFrom.pos, shotTo.pos, k); shot.look.lerpVectors(shotFrom.look, shotTo.look, k); shot.fov = shotFrom.fov + (shotTo.fov - shotFrom.fov) * k;
    if (shotK >= 1) shotTo = null;
  }
  extCam.position.copy(shot.pos).add(new THREE.Vector3(Math.sin(ct * 0.13) * 0.15 + mouse.sx * 0.35, Math.sin(ct * 0.21) * 0.05 + mouse.sy * 0.12, 0));
  extCam.fov = shot.fov; extCam.updateProjectionMatrix(); extCam.lookAt(shot.look.x + mouse.sx * 2.6, shot.look.y + mouse.sy * 1.2, shot.look.z);
  dr.render(extScene, extCam);
}

function show(id) {
  current = id;
  document.body.classList.toggle('ingame', id === 'game');
  if (id === 'title' || id === 'menu') goShot(id);
  ext.setZone(zoneOf(save.node).place);
  if (id !== 'game') dr.setPalette(PAL[zoneOf(save.node).place]);
  document.body.classList.toggle('ondeck', id === 'deck');
  if (id !== 'deck') play.stage.clearDeck();
  if (id !== 'game') { play.figPid = null; play.fig?.hide(); }
  if (id === 'menu') thorns.forEach((b, i) => b.reveal(current0 === 'title' ? 1300 + i * 260 : 150 + i * 160));
  current0 = id;
  ext.showPilgrim(id !== 'title');
  $$('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
  requestAnimationFrame(placeGL);
  setTimeout(placeGL, 520);
}

document.addEventListener('pointerover', (e) => {
  const b = e.target.closest('button');
  if (b && !b.disabled && b !== document._h) { document._h = b; sound.play('hover'); }
});
const updateSound = () => { const b = $('[data-p=sound] b'); if (b) b.textContent = sound.muted ? 'coupé' : 'actif'; };

// ── transitions : le voile tramé se referme, la page change, il se rouvre ──
let busy = false;
async function go(fn, type = 'iris') {
  if (busy) return; busy = true;
  sound.play('whoosh');
  await veil.close(type);
  await fn();
  await wait(140);
  busy = false;
  veil.open();
}

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
  const [fr, th] = await Promise.all([loadDots('art/cadre-racines.png'), loadDots('art/cadre-bouton.png'),
    ...Object.entries(ILLUS).map(([k, m]) => loadDots(m.url).then((d) => { illus[k] = d; })),
    ...['27px Bastarda', '60px Jacquard', '700 30px Grenze', '500 20px Grenze', '11px JBM'].map((f) => document.fonts.load(f).catch(() => {}))]);
  veil.setSource(fr); thornSrc = th; buildThorns();
  clearFaces();
  placeGL();
  // les racines poussent depuis les coins, puis la nuit s'ouvre sur le lieu
  veil.growIn(2800);
  await wait(700);
  veil.open(1700);
  $('#title').classList.add('in');
  await wait(1900);
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
  veil.stir = 3; veil.tween('stir', 0, 2400);
  openMenu();
}

// ── LE SEUIL ─────────────────────────────────────────────────
function openMenu() {
  const n = Math.min(save.node, 11), z = zoneOf(save.node), j = n % 4;
  $('#m-zone').textContent = z.name;
  $('#m-foe').textContent = done() ? 'Le trône est vide' : FOES[n].name;
  $('#m-tier').textContent = done() ? 'rejouer le Roi déchu' : FOES[n].boss ? 'le maître des lieux' : 'premier à ' + PALIERS[j];
  show('menu');
}
$('#m-go').onclick = () => { sound.play('click'); startDuel(done() ? 11 : save.node); };
$('#m-deck').onclick = () => { sound.play('click'); go(openDeck); };
$$('[data-back]').forEach((b) => b.addEventListener('click', () => { sound.play('click'); go(openMenu); }));

// ── LE DECK : étalé sur la table du lieu ─────────────────────
function openDeck() {
  const st = play.stage, z = zoneOf(save.node);
  st.setPlayers([{ id: 'you', name: 'Pèlerin', kind: 'human' }], 'you');
  st.setDealer(null); st.crypt.setZone(z.place);
  const list = [];
  for (let v = 0; v <= 12; v++) {
    const open = v === 0 || save.ranks.includes(v);
    list.push({ card: { t: 'n', v, id: 'g' + v }, locked: !open, row: v < 7 ? 0 : 1, col: v < 7 ? v : v - 7, per: v < 7 ? 7 : 6, tip: open ? `Rang ${v} · ${RANK_NAMES[v].toLowerCase()} · ${Math.max(1, v)} dans l'Ossuaire` + (v ? ' · ' + FOES[v - 1].name : '') : `Rang ${v} · bats ${FOES[v - 1].name.toLowerCase()} pour lui donner un visage` });
  }
  st.deckMode(list, (k) => { if (k % 2 === 0) sound.play('flip'); }); st.setDeckCount(0);
  $('#deck-count').textContent = `${DECKS[0].name} · 79 âmes · ${save.ranks.length} / 12 visages`;
  $('#deck-tip').textContent = '';
  dr.setPalette(PAL[z.place]);
  show('deck');
}
const ndc = (e) => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1]; };
canvas.addEventListener('pointermove', (e) => {
  if (current !== 'deck') return;
  const m = play.stage.deckAt(...ndc(e));
  play.stage.deckHover = m;
  $('#deck-tip').textContent = m ? m.userData.deck.tip : '';
  canvas.style.cursor = m && !m.userData.deck.locked ? 'zoom-in' : '';
});
canvas.addEventListener('click', (e) => {
  if (current !== 'deck') return;
  const m = play.stage.deckAt(...ndc(e));
  if (m && !m.userData.deck.locked) inspect(faceURL(m.userData.deck.card));
});
play.onInspect = (card) => inspect(faceURL(card));

// ── LE DUEL ──────────────────────────────────────────────────
let session = null;
async function startDuel(n) {
  if (busy) return; busy = true;
  sound.play('whoosh');
  await veil.close('iris');
  const z = Math.floor(n / 4), j = n % 4, zone = ZONES[z];
  const foe = FOES[n], target = PALIERS[j];
  const myStart = j === 0 || done() ? 0 : save.score, oppStart = j === 0 ? 0 : PALIERS[j - 1];
  const players = [{ id: 'you', name: 'Pèlerin', kind: 'human', score: myStart }, { id: 'foe', name: foe.name, kind: 'ai', persona: 'f' + n, score: oppStart }];
  const controllers = { you: { decide: () => play.askDecision(), chooseTarget: (s, pid, kind, c) => play.askTarget(kind, c) }, foe: makeAI(null, { risk: foe.risk }) };
  const match = new Match({ players, controllers, target, dealer: 1, extra: [], specials: false, presenter: async (ev, snap) => { while (paused) await wait(120); await play.present(ev, snap); } });
  session = { match, n };
  play.showRisk = true; play.stage.speed = 1; play.gate = true;
  setPause(false);
  play.onGameOver = async (ev) => {
    if (session?.match !== match) return; session = null;
    const won = ev.winner === 'you', fig = play.figPid ? play.fig : null;
    busy = true;
    if (fig) { if (won) { sound.play('reshuffle'); await fig.collapse(); } else { fig.stare(1); fig.look(1); fig.jolt(0.7); await wait(1100); } }
    await veil.close(won ? 'up' : 'down', 700);
    if (won) victory(n, match.players.find((p) => p.id === 'you').score); else defeat(n);
    await wait(160);
    busy = false; veil.open(800);
  };
  play.stage.crypt.setZone(zone.place);
  play.stage.setDealer(j < 3 ? 'f' + (z * 4 + 3) : null);
  show('game');
  dr.setPalette(PAL[zone.place]);
  play.mount(match.snapshot(), 'you');
  $('#g-target').textContent = target;
  sound.stopMusic(); sound.startMusic('table');
  // l'adversaire dessiné se rassemble, point par point, de l'autre côté de la table
  let fig = null;
  if (foe.art && illus[foe.art]) {
    fig = figures[foe.art] ||= new Figure($('#ill'), illus[foe.art], ILLUS[foe.art]);
    fig.reset(); play.fig = fig; play.figPid = 'foe';
  }
  await wait(260);
  busy = false;
  veil.open(800);
  await wait(350);
  if (fig) { sound.play('reshuffle'); fig.appear(2000); await wait(1500); }
  play.banner(foe.name);
  await wait(500);
  if (session?.match !== match) return;
  try { await match.run(); } catch (e) { if (e?.message !== 'aborted') console.error(e); }
}
function leave() {
  if (session) { session.match.aborted = true; play.cancelPrompts(); }
  session = null;
  go(() => { play.closeOverlay(); sound.stopMusic(); sound.startMusic('menu'); openMenu(); });
}
let paused = false;
function setPause(v) {
  paused = v;
  $('#pause-menu').classList.toggle('hidden', !v);
  if (!v || !session) return;
  const snap = session.match.snapshot(), foe = FOES[session.n], T = snap.target;
  $('#pz-info').textContent = `${zoneOf(session.n).name} · ${foe.name} · manche ${snap.round || 1} · premier à ${T}`;
  $('#pz-rows').innerHTML = snap.players.map((p) => `<li class="${p.id === 'you' ? 'me' : ''}"><span class="r-name">${p.id === 'you' ? 'Toi' : esc(foe.name)}</span><span class="gauge big"><i class="g1" style="width:${Math.min(100, p.score / T * 100)}%"></i><i class="g2" style="left:${Math.min(100, p.score / T * 100)}%;width:${Math.max(0, Math.min(100 - p.score / T * 100, (p.status === 'bust' ? 0 : p.hand) / T * 100))}%"></i></span><b class="r-tot">${p.score}${p.hand && p.status !== 'bust' ? ' +' + p.hand : ''}</b></li>`).join('');
  $('#pz-deck').textContent = `L'Ossuaire : ${snap.deckCount} âmes · la Fosse : ${snap.discard.length}`;
  updateSound();
}
$('#pause').onclick = () => { sound.play('click'); setPause(!paused); };
$('#pause-menu').addEventListener('click', (e) => {
  const b = e.target.closest('[data-p]'); if (!b) return;
  sound.play('click');
  if (b.dataset.p === 'resume') setPause(false);
  if (b.dataset.p === 'sound') { sound.setMuted(!sound.muted); updateSound(); }
  if (b.dataset.p === 'flee') { setPause(false); leave(); }
});

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
  $('#sp-relics').innerHTML = '<button class="gbtn small" id="sp-go"><span>Continuer</span></button>';
  $('#sp-go').onclick = () => { sound.play('click'); go(openMenu); };
  show('spoils');
  setTimeout(() => { flip.classList.add('up'); sound.play('flip'); }, 900);
  setTimeout(() => sp.classList.add('picking'), 1900);
}

// ── LA MORT ──────────────────────────────────────────────────
function defeat(n) {
  const z = Math.floor(n / 4);
  if (!done()) { save.node = z * 4; save.score = 0; persist(); }
  sound.stopMusic();
  $('#dt-zone').textContent = ZONES[z].name;
  $('#dt-img').src = foeCanvas(n, 200, 230, 'sang').toDataURL();
  $('#dt-lead').textContent = `${FOES[n].name} a gagné ta mise. Les âmes que tu portais t'ont repris. Tu renais à l'orée : ${ZONES[z].name}. Les visages gagnés te suivent.`;
  show('death');
}
$('#dt-go').onclick = () => { sound.play('click'); sound.startMusic('menu'); go(openMenu); };

addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#cardview').classList.contains('hidden')) { $('#cardview').classList.add('hidden'); return; }
  if (current === 'game' && session) setPause(!paused);
});
window.__vii = { veil, play, figures, go, get save() { return save; }, victory, defeat, startDuel, openDeck, openMenu, setPause };
boot();
