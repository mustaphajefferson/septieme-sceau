// ─────────────────────────────────────────────────────────────
//  VII — LE SEPTIÈME SCEAU · chef d'orchestre
//  Accueil (le lieu du prochain duel) → le seuil → le deck
//  → la table → la carte gagnée (ou la mort).
// ─────────────────────────────────────────────────────────────
import { THREE, DitherRenderer, PALETTES } from './render.js';
import { buildExterior } from './world.js';
import { portraitCanvas } from './gallery.js';
import { Play } from './play.js';
import { sound } from './audio.js';
import { Match } from './game.js';
import { makeAI } from './ai.js';
import { icon } from './icons.js';
import { PALIERS, CAMPAIGNS } from './content.js';
import './cards2.js';
import { loadDots, Veil } from './dots.js';
import { setOwned, clearFaces } from './cardtex.js';
import { DECKS, clearCards } from './cardart.js';
import { CardView } from './cardview.js';
import { installDotUI } from './dotui.js';
import { wait } from './fx.js';
import { Rush } from './fx2d.js';
import { Cine } from './cine.js';
import { STORY } from './story.js';

// ⚠ outils de test (bouton « dev » en bas à gauche) — à retirer avant la sortie
const DEV = true;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── sauvegarde ───────────────────────────────────────────────
const KEY = 'vii-save-4';
// un état par parcours ; save.camp = le parcours en cours (0 : le chevalier, 1 : le squelette)
const cfresh = () => ({ ranks: [], node: 0, score: 0 });
const fresh = () => ({ camp: 0, c: [cfresh()], seen: {} });
let save = (() => {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (o.ranks) return { camp: 0, c: [{ ranks: o.ranks, node: o.node || 0, score: o.score || 0 }], seen: { intro0: o.seen?.intro, boss0: o.seen?.boss } };
    return { ...fresh(), ...o };
  } catch { return fresh(); }
})();
const S = () => (save.c[save.camp] ||= cfresh());
const C = () => CAMPAIGNS[save.camp];
const FOE = new Proxy([], { get: (_, k) => C().foes[k] });
const ZONE = new Proxy([], { get: (_, k) => C().zones[k] });
const seen = (k) => save.seen?.[k + save.camp];
const markSeen = (k) => { (save.seen ||= {})[k + save.camp] = 1; persist(); };
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* */ } };
{ // raccourcis de test : ?reset · ?jusqua=N
  const q = new URLSearchParams(location.search);
  if (q.has('reset')) { save = fresh(); persist(); }
  if (q.has('jusqua') || q.has('parcours')) { save = fresh(); save.camp = q.get('parcours') === '2' ? 1 : 0; save.c[1] ||= cfresh(); const n = Math.min(12, +q.get('jusqua') || 0); for (let i = 0; i < n; i++) S().ranks.push(i + 1); S().node = n; save.seen = { intro0: 1, intro1: 1 }; persist(); }
}
const done = () => S().node >= 12;
const owns = (v) => v === 0 || S().ranks.includes(v);
const zoneIdx = (n) => Math.min(2, Math.floor(Math.min(n, 11) / 4));
const zoneOf = (n) => ZONE[zoneIdx(n)];
const PAL = { foret: 'fange', pont: 'rouille', chateau: 'velin', limbes: 'cendre', styx: 'styx', cathedrale: 'os' };
const NAMESc = () => DECKS[C().deck].names;
setOwned(owns, () => C().deck);

// ── icônes & curseur ─────────────────────────────────────────
$$('[data-icon]').forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
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
const veil = new Veil($('#veil'));
const cardView = new CardView($('#cardview'));
cardView.onStep = () => sound.play('flip');
const rush = new Rush($('#rush'));
const cine = new Cine($('#cine'));
const story = () => STORY[save.camp];
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener('pointermove', (e) => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = -((e.clientY / innerHeight) * 2 - 1); });
const extScene = new THREE.Scene();
const ext = buildExterior(extScene);
const extCam = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
const SHOTS = {
  title: { pos: [0.4, 1.6, 5.5], look: [0, 4.2, -12], fov: 55 },
  menu: { pos: [-1.0, 1.9, 2.2], look: [0, 3.4, -14], fov: 56 },
  death: { pos: [0.2, 1.2, 1.2], look: [0, 2.6, -14], fov: 50 },
  rush: { pos: [-0.2, 2.6, -7.5], look: [0, 3.4, -16], fov: 26 },
};
let shot = { pos: new THREE.Vector3(...SHOTS.title.pos), look: new THREE.Vector3(...SHOTS.title.look), fov: SHOTS.title.fov };
let shotFrom = null, shotTo = null, shotK = 1;
function goShot(name, dur = 2.2, ease = 'io') {
  const s = SHOTS[name]; if (!s) return;
  shotFrom = { pos: shot.pos.clone(), look: shot.look.clone(), fov: shot.fov };
  shotTo = { pos: new THREE.Vector3(...s.pos), look: new THREE.Vector3(...s.look), fov: s.fov, dur, ease };
  shotK = 0;
}
function placeGL() {
  const slot = $(`#${current} [data-gl]`), r = slot?.getBoundingClientRect();
  if (!r || !r.width || !r.height) { canvas.style.display = 'none'; return; }
  canvas.style.display = 'block';
  Object.assign(canvas.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  dr.resize(r.width, r.height);
  play.stage.resize(r.width, r.height);
  extCam.aspect = r.width / r.height; extCam.updateProjectionMatrix();
}
let palSync = '';
const syncUI = () => { const P = PALETTES[dr.paletteName] || PALETTES.fange; palSync = dr.paletteName; installDotUI(P); veil.setPalette(P); rush.pal(P.ramp, P.warm); };
addEventListener('resize', () => { placeGL(); veil.resize(); syncUI(); });

let last = performance.now(), ct = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (document.hidden) return;
  if (dr.paletteName !== palSync) syncUI();
  veil.frame(now / 1000, dt);
  cardView.frame(now / 1000, dt);
  rush.frame(now / 1000, dt);
  if (cine.on) return;                                          // la cinématique couvre tout
  if (cardView.isOpen && cardView.reward) return;                // le butin couvre tout l'écran
  if (current === 'game') { if (canvas.style.display !== 'none') play.frame(dt); return; }
  if (current === 'deck') { play.stage.update(dt); play.stage.render(); return; }
  if (canvas.style.display === 'none') return;
  ct += dt;
  mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 4); mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 4);
  ext.tick(ct);
  if (shotTo) {
    shotK = Math.min(1, shotK + dt / shotTo.dur);
    const k = shotTo.ease === 'in' ? shotK * shotK * shotK : shotK < 0.5 ? 2 * shotK * shotK : 1 - Math.pow(-2 * shotK + 2, 2) / 2;
    shot.pos.lerpVectors(shotFrom.pos, shotTo.pos, k); shot.look.lerpVectors(shotFrom.look, shotTo.look, k); shot.fov = shotFrom.fov + (shotTo.fov - shotFrom.fov) * k;
    if (shotK >= 1) shotTo = null;
  }
  extCam.position.copy(shot.pos).add(new THREE.Vector3(Math.sin(ct * 0.13) * 0.15 + mouse.sx * 0.35, Math.sin(ct * 0.21) * 0.05 + mouse.sy * 0.12, 0));
  extCam.fov = shot.fov; extCam.updateProjectionMatrix(); extCam.lookAt(shot.look.x + mouse.sx * 2.6, shot.look.y + mouse.sy * 1.2, shot.look.z);
  dr.render(extScene, extCam);
}

function show(id) {
  current = id;
  const framed = id === 'title' || id === 'menu';            // le cadre de racines : seulement à l'accueil
  document.body.classList.toggle('framed', framed);
  if (veil.src) veil.setFrame(framed, framed ? 1400 : 700);
  goShot(id);
  ext.setZone(zoneOf(S().node).place);
  if (id !== 'game') dr.setPalette(id === 'death' ? 'sang' : PAL[zoneOf(S().node).place]);
  if (id !== 'deck') play.stage.clearDeck();
  ext.showPilgrim(id !== 'title' && save.camp === 0);
  $$('.screen').forEach((s) => { s.classList.toggle('on', s.id === id); s.classList.remove('leaving'); });
  requestAnimationFrame(placeGL);
  setTimeout(placeGL, 450);
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
// ── inspecter une carte : en grand, inclinable, irisée ──
const cardNav = (v, d) => { const n = (v + d + 13) % 13; return { v: n, plain: !owns(n) }; };
const inspect = (v) => { sound.play('flip'); cardView.open(v, { plain: !owns(v), nav: cardNav, deck: C().deck }); };

// ── ACCUEIL ──────────────────────────────────────────────────
async function boot() {
  syncUI();
  show('title');
  requestAnimationFrame(loop);
  // la musique part dès l'ouverture (ou au premier geste, si le navigateur bloque le son)
  sound.init().then(() => sound.startMusic('menu')).catch(() => {});
  const wake = () => { sound.init().then(() => sound.startMusic('menu')); for (const e of ['pointerdown', 'keydown', 'touchstart']) removeEventListener(e, wake, true); };
  for (const e of ['pointerdown', 'keydown', 'touchstart']) addEventListener(e, wake, true);
  await document.fonts.ready;
  const [fr] = await Promise.all([loadDots('art/cadre-racines.png'), ...['60px Jacquard', '700 30px Grenze', '500 20px Grenze'].map((f) => document.fonts.load(f).catch(() => {}))]);
  clearCards(); clearFaces(); play.stage.refreshBack(); play.stage.setHands(C().hands);
  veil.setSource(fr); veil.want = 0; veil.grow = 0;
  placeGL();
  veil.setFrame(current === 'title' || current === 'menu', 2800);   // les racines poussent depuis les coins…
  await wait(700);
  veil.open(1700);                                                  // …puis la nuit s'ouvre sur le lieu
  $('#title').classList.add('in');
  await wait(1900);
  const b = $('#enter');
  b.disabled = false; b.querySelector('span').textContent = 'Entrer';
  const start = () => { removeEventListener('keydown', start); b.removeEventListener('click', start); enter(); };
  b.addEventListener('click', start);
  addEventListener('keydown', start);
}
async function enter() {
  await sound.init();
  sound.play('enter');
  sound.startMusic('menu');
  updateSound();
  veil.stir = 3; veil.tween('stir', 0, 2400);
  if (!seen('intro')) { openMenu(); await cine.play(story().intro); markSeen('intro'); return; }
  openMenu();
}

// ── LE SEUIL ─────────────────────────────────────────────────
function openMenu() {
  const n = Math.min(S().node, 11), z = zoneOf(S().node), j = n % 4;
  $('#m-zone').textContent = z.name;
  $('#m-foe').textContent = done() ? (save.camp ? 'La Mort a perdu' : 'Le trône est vide') : FOE[n].name;
  $('#m-tier').textContent = done() ? 'Rejouer ' + FOE[11].name : (FOE[n].boss ? 'Le maître des lieux · ' : '') + 'premier à ' + PALIERS[j];
  // le choix du parcours, une fois le second ouvert
  const cp = $('#m-camps'); cp.classList.toggle('hidden', save.c.length < 2);
  cp.innerHTML = save.c.map((_, i) => `<button class="chipb${i === save.camp ? ' on' : ''}" data-c="${i}">${CAMPAIGNS[i].hero}</button>`).join('');
  show('menu');
}
$('#m-go').onclick = async () => {
  if (busy) return;
  sound.play('click');
  const n = done() ? 11 : S().node;
  if (n === 11 && !seen('boss')) { busy = true; await cine.play(story().boss); markSeen('boss'); busy = false; }
  startDuel(n);
};
$('#m-deck').onclick = () => { sound.play('click'); go(openDeck); };
$('#m-camps').addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (!b || +b.dataset.c === save.camp) return; sound.play('click'); go(() => { switchCamp(+b.dataset.c); openMenu(); }); });
function switchCamp(i) { save.camp = i; S(); persist(); clearFaces(); play.stage.refreshBack(); play.stage.setHands(C().hands); }
$$('[data-back]').forEach((b) => b.addEventListener('click', () => { sound.play('click'); go(openMenu); }));

// ── LE DECK : étalé sur la table du lieu ─────────────────────
function openDeck() {
  const st = play.stage, z = zoneOf(S().node);
  st.setPlayers([{ id: 'you', name: C().hero, kind: 'human' }], 'you');
  st.setDealer(null); st.crypt.setZone(z.place);
  const list = [];
  for (let v = 0; v <= 12; v++) list.push({ card: { t: 'n', v, id: 'g' + v }, locked: !owns(v), tip: owns(v) ? `${NAMESc()[v]} · rang ${v} — ${Math.max(1, v)} dans le paquet` : `Rang ${v} — bats ${FOE[v - 1].name} pour gagner sa carte` });
  st.deckMode(list, (k) => { if (k % 2 === 0) sound.play('flip'); }); st.setDeckCount(0);
  $('#deck-count').textContent = `${C().deckName} · ${S().ranks.length} / 12 cartes gagnées`;
  $('#deck-tip').textContent = 'Touche une carte pour la prendre en main';
  dr.setPalette(PAL[z.place]);
  show('deck');
}
const ndc = (e) => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1]; };
canvas.addEventListener('pointermove', (e) => {
  if (current !== 'deck') return;
  const m = play.stage.deckAt(...ndc(e));
  play.stage.deckHover = m;
  if (m) $('#deck-tip').textContent = m.userData.deck.tip;
  canvas.style.cursor = m ? 'zoom-in' : '';
});
canvas.addEventListener('click', (e) => {
  if (current !== 'deck') return;
  const m = play.stage.deckAt(...ndc(e));
  if (m) { $('#deck-tip').textContent = m.userData.deck.tip; inspect(m.userData.deck.card.v); }
});
play.onInspect = (card) => inspect(card.v);

// ── LE DUEL ──────────────────────────────────────────────────
let session = null;
async function startDuel(n) {
  if (busy) return; busy = true;
  // la plongée : la caméra fonce dans le décor, traits de vitesse, éclair
  sound.play('whoosh'); setTimeout(() => sound.play('toll'), 250);
  document.body.classList.add('lbox');
  if (current === 'menu') { goShot('rush', 1.15, 'in'); $('#menu').classList.add('leaving'); veil.setFrame(false, 600); }
  rush.to('k', 1, 650); veil.shake(0.5);
  await wait(850);
  veil.shake(1); sound.play('enter');
  await rush.to('flash', 1, 160);
  await veil.close('iris', 220);
  rush.k = 0;
  const z = Math.floor(n / 4), j = n % 4, zone = ZONE[z];
  const foe = FOE[n], target = PALIERS[j];
  const myStart = j === 0 || done() ? 0 : S().score, oppStart = j === 0 ? 0 : PALIERS[j - 1];
  const players = [{ id: 'you', name: C().hero, kind: 'human', persona: C().heroKind, score: myStart }, { id: 'foe', name: foe.name, kind: 'ai', persona: C().persona + n, score: oppStart }];
  play.stage.setHands(C().hands);
  const controllers = { you: { decide: () => play.askDecision(), chooseTarget: (s, pid, kind, c) => play.askTarget(kind, c) }, foe: makeAI(null, { risk: foe.risk }) };
  const match = new Match({ players, controllers, target, dealer: 1, extra: [], specials: false, presenter: async (ev, snap) => { while (paused) await wait(120); await play.present(ev, snap); } });
  session = { match, n };
  play.stage.speed = 1;
  setPause(false);
  play.onGameOver = async (ev) => {
    if (session?.match !== match) return; session = null;
    const won = ev.winner === 'you';
    busy = true;
    await wait(won ? 900 : 1200);
    await veil.close(won ? 'up' : 'down', 700);
    play.closeOverlay();
    if (won) victory(n, match.players.find((p) => p.id === 'you').score); else defeat(n);
    await wait(160);
    busy = false; veil.open(800);
  };
  play.stage.crypt.setZone(zone.place);
  play.stage.setDealer(j < 3 ? C().persona + (z * 4 + 3) : null);
  show('game');
  dr.setPalette(PAL[zone.place]);
  play.mount(match.snapshot(), 'you');
  sound.stopMusic(); sound.startMusic('table');
  await wait(260);
  busy = false;
  veil.open(700); rush.to('flash', 0, 700);
  const dc = $('#duelcard');
  dc.querySelector('small').textContent = zone.name; dc.querySelector('b').textContent = foe.name; dc.querySelector('span').textContent = (foe.boss ? 'Le maître des lieux · ' : '') + 'premier à ' + target;
  dc.classList.remove('show'); void dc.offsetWidth; dc.classList.add('show');
  setTimeout(() => sound.play('bust'), 350);
  await wait(2300);
  document.body.classList.remove('lbox');
  await wait(300);
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
  $('#pause').classList.toggle('on', v);
  if (!v || !session) return;
  const snap = session.match.snapshot(), foe = FOE[session.n], T = snap.target, pc = (x) => Math.max(0, Math.min(100, (x / T) * 100));
  $('#pz-info').textContent = `${zoneOf(session.n).name} · manche ${snap.round || 1} · premier à ${T}`;
  $('#pz-rows').innerHTML = snap.players.map((p) => {
    const h = p.status === 'bust' ? 0 : p.hand;
    return `<div class="pz-row${p.id === 'you' ? ' me' : ''}"><b>${p.id === 'you' ? C().hero : esc(foe.name)}</b><em>${p.score}${h ? ' <small>+' + h + '</small>' : ''}</em><span class="gauge"><i class="g1" style="width:${pc(p.score)}%"></i><i class="g2" style="left:${pc(p.score)}%;width:${Math.min(100 - pc(p.score), pc(h))}%"></i></span></div>`;
  }).join('');
  $('#pz-deck').textContent = `Dans le paquet : ${snap.deckCount} cartes · défaussées : ${snap.discard.length}`;
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

// ── LE BUTIN : la carte gagnée ───────────────────────────────
function victory(n, score) {
  const j = n % 4, v = n + 1, isNew = !S().ranks.includes(v);
  if (isNew) S().ranks.push(v);
  if (!done()) S().score = j === 3 ? 0 : Math.min(score, PALIERS[j] + Math.round((PALIERS[j + 1] - PALIERS[j]) * 0.5));
  S().node = Math.max(S().node, n + 1);
  persist();
  clearFaces();
  sound.stopMusic(); sound.startMusic('menu');
  show('spoils');
  const after = n === 11 ? (save.camp ? '' : ' Le trône est à toi.') : FOE[n].boss ? ` La route s'ouvre : ${ZONE[zoneIdx(n + 1)].name}.` : '';
  // après la carte : la cinématique du lieu suivant (ou la fin), puis l'accueil
  const seq = n === 11 ? story().ending : FOE[n].boss ? story().zones[zoneIdx(n + 1)] : null;
  cardView.open(v, { reward: { title: `${FOE[n].name} s'effondre`, sub: (isNew ? `Tu gagnes la carte ${NAMESc()[v]} (rang ${v}).` : `${NAMESc()[v]} · rang ${v}.`) + after }, onDone: async () => {
    sound.play('click');
    if (!seq) return go(openMenu);
    openMenu(); await cine.play(seq);
    if (n === 11 && save.camp === 0 && !save.c[1]) { // la fin du chevalier ouvre le parcours du squelette
      save.c[1] = cfresh(); switchCamp(1); openMenu(); await cine.play(story().intro); markSeen('intro');
    }
  } });
  setTimeout(() => sound.play('flip'), 500);
  setTimeout(() => sound.play('flip7'), 1000);
}

// ── LA MORT ──────────────────────────────────────────────────
function defeat(n) {
  const z = Math.floor(n / 4);
  if (!done()) { S().node = z * 4; S().score = 0; persist(); }
  sound.stopMusic();
  $('#dt-img').src = portraitCanvas(dr, C().persona + n, { palette: 'sang', w: 200, h: 230 }).toDataURL();
  $('#dt-lead').textContent = `${FOE[n].name} a gagné ta mise. Tu renais à l'orée : ${ZONE[z].name}. Les cartes gagnées te suivent.`;
  show('death');
}
$('#dt-go').onclick = () => { sound.play('click'); sound.startMusic('menu'); go(openMenu); };

addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (cardView.isOpen) { if (!cardView.reward) cardView.close(); return; }
  if (current === 'game' && session) setPause(!paused);
});
// ── outils de test ───────────────────────────────────────────
function devJump(node) {
  if (session) { session.match.aborted = true; play.cancelPrompts(); session = null; }
  S().node = Math.max(0, Math.min(12, node)); S().ranks = []; for (let i = 1; i <= S().node; i++) S().ranks.push(i); S().score = 0;
  persist(); clearFaces();
  go(() => { play.closeOverlay(); cardView.close(); sound.startMusic('menu'); openMenu(); });
}
if (DEV) {
  const d = document.createElement('div'); d.id = 'dev';
  d.innerHTML = `<button data-d="open">dev</button><div class="dev-list hidden">
    <button data-d="win">Gagner ce duel</button><button data-d="next">Duel suivant</button><button data-d="zone">Lieu suivant</button>
    <button data-d="end">Boss final</button><button data-d="reset">Recommencer l'histoire</button>
    <button data-d="camp2">Parcours II</button><button data-d="c-intro">▶ Intro</button><button data-d="c-z1">▶ Pont-levis</button><button data-d="c-z2">▶ Château</button><button data-d="c-boss">▶ Boss final</button><button data-d="c-end">▶ Fin</button></div>`;
  document.body.appendChild(d);
  d.addEventListener('click', (e) => {
    const k = e.target.closest('[data-d]')?.dataset.d; if (!k) return;
    const list = d.querySelector('.dev-list');
    if (k === 'open') return list.classList.toggle('hidden');
    list.classList.add('hidden');
    if (k === 'win') { if (session) { session.match.aborted = true; play.cancelPrompts(); play.onGameOver({ winner: 'you' }); } else devJump(S().node + 1); }
    if (k === 'next') devJump(S().node + 1);
    if (k === 'zone') devJump((Math.floor(S().node / 4) + 1) * 4);
    if (k === 'end') devJump(11);
    const ST = story(), CI = { 'c-intro': ST.intro, 'c-z1': ST.zones[1], 'c-z2': ST.zones[2], 'c-boss': ST.boss, 'c-end': ST.ending };
    if (CI[k]) cine.play(CI[k]);
    if (k === 'camp2') { save.c[1] ||= cfresh(); go(() => { switchCamp(save.camp ? 0 : 1); openMenu(); }); }
    if (k === 'reset') { try { localStorage.removeItem(KEY); } catch { /* */ } location.href = location.pathname; }
  });
}
window.__vii = { rush, cine, veil, play, cardView, go, inspect, get save() { return save; }, victory, defeat, startDuel, openDeck, openMenu, setPause, show };
boot();
