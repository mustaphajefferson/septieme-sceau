// ─────────────────────────────────────────────────────────────
//  VII — LE SEPTIÈME SCEAU · chef d'orchestre
// ─────────────────────────────────────────────────────────────
import { AsciiLayer, DitherLayer, makeSwordScene, makeRain, textMask, applyMask, reaperMask, makeCandles, fbm, GOTH } from './ascii.js';
import { sound } from './audio.js';
import { Match } from './game.js';
import { makeAI, PERSONAS } from './ai.js';
import { TableView } from './table.js';
import { Host, Client, newCode, cleanCode, wander, errText, MAX_SEATS } from './net.js';
import { scramble, typeInto, flash, wait } from './fx.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem('vii-' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('vii-' + k, JSON.stringify(v)); } catch { /* */ } },
};

const settings = { fx: true, risk: true, intro: 'auto', ...store.get('settings', {}) };
const saveSettings = () => store.set('settings', settings);
document.body.classList.toggle('no-fx', !settings.fx);

// ── calques graphiques ───────────────────────────────────────
const ascii = new AsciiLayer($('#ascii'), { fontSize: 12, fps: 30 });
const dither = new DitherLayer($('#dither'), { scale: 3, fps: 12 });
const view = new TableView();
let current = 'boot';

const isNarrow = () => innerWidth < 900;
let sword = makeSwordScene({ cx: isNarrow() ? 0.5 : 0.68, zoom: 1.75 });
const rainMenu = makeRain({ density: 0.05, speed: 10, max: 0.42 });
const rainHeavy = makeRain({ density: 0.16, speed: 16, max: 0.7 });
const rainFaint = makeRain({ density: 0.025, speed: 6, max: 0.22 });
const candles = makeCandles([{ x: 0.022, y: 0.5, s: 0.95 }, { x: 0.978, y: 0.48, s: 1 }]);
let titleMask = null, quiet = null, reaper = null, reaperReveal = 0;

function buildMenuMasks() {
  const slot = $('#title-slot').getBoundingClientRect();
  if (!slot.width) return;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = `100px ${GOTH}`;
  const wRatio = probe.measureText('VII').width / 100;
  const size = Math.min(slot.height * 1.12, (slot.width * 0.9) / wRatio);
  titleMask = textMask(ascii, [{ text: 'VII', x: slot.left - size * 0.02, y: slot.bottom - size * 0.12, font: `${size}px ${GOTH}`, stroke: size * 0.035 }]);
  // zones calmes : derrière le texte du menu
  quiet = new Uint8Array(ascii.cols * ascii.rows);
  for (const sel of ['.sub', '.lore', '.namefield', '#menu-list', '#menu .corner']) {
    for (const el of $$(sel)) {
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      const i0 = Math.max(0, Math.floor((r.left - 14) / ascii.cw)), i1 = Math.min(ascii.cols, Math.ceil((r.right + 14) / ascii.cw));
      const j0 = Math.max(0, Math.floor((r.top - 6) / ascii.ch)), j1 = Math.min(ascii.rows, Math.ceil((r.bottom + 6) / ascii.ch));
      for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) quiet[j * ascii.cols + i] = 1;
    }
  }
}
ascii.onResize = () => {
  sword = makeSwordScene({ cx: isNarrow() ? 0.5 : 0.68, zoom: 1.75 });
  if (current === 'menu') buildMenuMasks();
  if (current === 'intro') reaper = reaperMask(ascii, { cx: 0.5, cy: 0.5, scale: isNarrow() ? 0.8 : 1 });
};

function applyQuiet(L, k = 0.1) {
  if (!quiet || quiet.length !== L.lum.length) return;
  for (let c = 0; c < quiet.length; c++) if (quiet[c]) { L.lum[c] *= k; L.glyph[c] = -1; }
}

const SCENES = {
  boot(L, t, dt) { rainMenu(L, t, dt); },
  menu(L, t, dt) {
    sword(L, t, dt);
    if (isNarrow()) for (let c = 0; c < L.lum.length; c++) L.lum[c] *= 0.5;
    rainMenu(L, t, dt);
    applyQuiet(L);
    applyMask(L, titleMask, t, { gain: 2.2 });
  },
  lobby(L, t, dt) {
    sword(L, t * 0.6, dt);
    for (let c = 0; c < L.lum.length; c++) L.lum[c] *= 0.35;
    rainMenu(L, t, dt);
  },
  intro(L, t, dt) {
    rainHeavy(L, t, dt);
    if (reaper && reaperReveal > 0) applyMask(L, reaper, t, { gain: 1.15, reveal: reaperReveal, glitch: true });
  },
  table(L, t, dt) {
    rainFaint(L, t, dt);
    if (!isNarrow()) candles(L, t, dt);
  },
};

const DITHER = {
  menu(x, y, t, asp) {
    const narrow = isNarrow();
    const mx = narrow ? 0.5 : 0.68, my = narrow ? 0.88 : 0.27, R = narrow ? 0.09 : 0.17;
    const dx = (x - mx) * asp, dy = y - my, r = Math.hypot(dx, dy);
    let l = 0;
    if (r < R) {
      // éclipse : disque noir, quelques reliefs à peine visibles
      l = 0.03 * fbm(dx * 30, dy * 30, 2);
    } else {
      const a = Math.atan2(dy, dx);
      const rays = 0.55 + 0.45 * fbm(Math.cos(a) * 3 + t * 0.04, Math.sin(a) * 3, 3);
      l = Math.exp(-(r - R) * (16 / rays)) * 0.95;
    }
    if (y > 0.72) l += Math.max(0, fbm(x * 5 + t * 0.03, y * 9 - t * 0.01, 3) - 0.42) * (y - 0.72) * 5;
    if (!narrow) l *= Math.min(1, Math.max(0, (x - 0.36) / 0.14));
    return l < 0.05 ? 0 : l;
  },
  intro(x, y, t) { return y > 0.6 ? fbm(x * 4 + t * 0.05, y * 7, 2) * (y - 0.6) * 1.2 : 0; },
  table(x, y, t) {
    const v = Math.hypot((x - 0.5) * 1.3, (y - 0.47) * 1.6);
    const l = Math.max(0, 0.085 - v * 0.2) + (y > 0.8 ? Math.max(0, fbm(x * 4 + t * 0.02, y * 6, 2) - 0.45) * (y - 0.8) * 4 : 0);
    return l < 0.035 ? 0 : l;
  },
  boot() { return 0; },
};

function show(id) {
  current = id;
  $$('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
  ascii.start(SCENES[id] || SCENES.boot);
  dither.start(DITHER[id === 'lobby' ? 'menu' : id] || DITHER.boot);
  $('#ascii').style.opacity = id === 'table' ? 0.75 : 1;
  $('#dither').style.opacity = id === 'lobby' ? 0.18 : id === 'table' ? 0.35 : 0.5;
  if (id === 'menu') requestAnimationFrame(() => { buildMenuMasks(); $$('#menu [data-scramble]').forEach((el, i) => setTimeout(() => scramble(el), i * 70)); });
}

// ── utilitaires d'interface ─────────────────────────────────
function toast(msg, ms = 2800) {
  const t = $('#toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.add('hidden'), ms);
}
function modal(html, onMount) {
  const m = $('#modal');
  $('.modal-body', m).innerHTML = html;
  m.classList.remove('hidden');
  const close = () => { m.classList.add('hidden'); sound.play('click'); };
  m.onclick = (e) => { if (e.target === m || e.target.closest('[data-close]')) close(); };
  onMount?.($('.modal-body', m), close);
  return close;
}
const myName = () => $('#name').value.trim().toUpperCase().slice(0, 14) || 'PÉNITENT';

function wireSounds(root = document) {
  root.addEventListener('pointerover', (e) => {
    const b = e.target.closest('button');
    if (b && !b.disabled && b !== root._lastHover) { root._lastHover = b; sound.play('hover'); }
  });
  root.addEventListener('pointerout', (e) => { if (e.target.closest('button') === root._lastHover) root._lastHover = null; });
}
wireSounds();

function updateSoundLabels() {
  $$('[data-sound-toggle] b').forEach((b) => { b.textContent = sound.muted ? 'COUPÉ' : 'ACTIF'; });
}
$$('[data-sound-toggle]').forEach((b) => b.addEventListener('click', () => { sound.setMuted(!sound.muted); updateSoundLabels(); }));

// ── DÉMARRAGE ────────────────────────────────────────────────
async function boot() {
  show('boot');
  await document.fonts.ready;
  ascii.resize();
  const log = $('#boot-log');
  const lines = [
    ['> OSSUAIRE.SYS', 'OK'],
    ['> INVOCATION DES ÂMES', '94/94'],
    ['> CHEVALIERS · DÉMONS · SAINTS', 'ENCHAÎNÉS'],
    ['> SCELLEMENT', '✱ ✱ ✱ ✱ ✱ ✱ ✱'],
    ['> LA MORT', 'T\'ATTEND'],
  ];
  for (const [a, b] of lines) {
    const pad = '.'.repeat(Math.max(3, 34 - a.length));
    log.innerHTML += `${a} <span class="dim">${pad}</span> `;
    await wait(170);
    log.innerHTML += `<b>${b}</b>\n`;
    await wait(110);
  }
  const btn = $('#boot-enter');
  btn.classList.remove('hidden');
  btn.focus();
  btn.onclick = enter;
}

async function enter() {
  await sound.init();
  sound.play('enter');
  sound.startMusic('menu');
  flash(90);
  $('#name').value = store.get('name', '');
  show('menu');
  const code = cleanCode(new URLSearchParams(location.search).get('table'));
  if (code.length === 5) setTimeout(() => joinFlow(code), 600);
}

// ── MENU ─────────────────────────────────────────────────────
$('#name').addEventListener('input', (e) => store.set('name', e.target.value.toUpperCase()));
$('#menu-list').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  sound.play('click');
  ({ solo: soloModal, host: hostFlow, join: () => joinFlow(), random: randomFlow, rules: rulesModal, options: optionsModal })[b.dataset.act]?.();
});
$('#menu-list').addEventListener('pointerover', (e) => {
  const s = e.target.closest('button')?.querySelector('[data-scramble]');
  if (s && s !== $('#menu-list')._s) { $('#menu-list')._s = s; scramble(s, s.dataset.text, 300); }
});

function soloModal() {
  let n = store.get('opps', 1);
  const list = ['mort', 'flagellant', 'veuve'];
  const render = (b) => {
    $$('.choice button', b).forEach((x) => x.classList.toggle('sel', +x.dataset.n === n));
    $('.who', b).innerHTML = list.slice(0, n).map((k) => `<li><b>${PERSONAS[k].name}</b><span>${PERSONAS[k].epithet}</span></li>`).join('');
  };
  modal(`
    <h2>La Table</h2>
    <p class="kicker">AFFRONTER LA MORT · CONTRE L'ORDINATEUR</p>
    <p class="q">Combien de damnés s'assoient avec toi ?</p>
    <div class="choice">${[1, 2, 3].map((k) => `<button data-n="${k}">${k} ADVERSAIRE${k > 1 ? 'S' : ''}</button>`).join('')}</div>
    <ul class="who"></ul>
    <div class="row"><button class="btn" data-go>S'ASSEOIR À LA TABLE</button></div>`, (b, close) => {
    render(b);
    b.querySelector('.choice').onclick = (e) => { const x = e.target.closest('button'); if (!x) return; n = +x.dataset.n; store.set('opps', n); sound.play('click'); render(b); };
    b.querySelector('[data-go]').onclick = () => { close(); startSolo(list.slice(0, n)); };
  });
}

function rulesModal() {
  modal(`
    <h2>Le Pacte</h2>
    <p class="kicker">LES RÈGLES DE LA TABLE</p>
    <p class="q">« Arrache deux cents âmes à mon Ossuaire, et je te rendrai la tienne. Mais deux âmes du même rang ne partagent jamais un même corps. »</p>
    <ul>
      <li><b>À TON TOUR</b><span><u>Arracher</u> une âme (tirer une carte) ou <u>te retirer</u> pour encaisser ta main.</span></li>
      <li><b>LES ÂMES</b><span>Rangs 0 à XII. Chaque âme vaut son rang. Plus un rang est élevé, plus il y en a : douze âmes de rang XII, une seule de rang I.</span></li>
      <li><b>PROFANATION</b><span>Deux âmes du même rang dans ta main : elles se déchirent, tu ne marques rien cette manche.</span></li>
      <li><b>LES SEPT SCEAUX</b><span>Sept rangs différents : +15 âmes et la manche s'arrête net.</span></li>
      <li><b>OBOLES · COURONNE</b><span>Oboles +2 à +10 s'ajoutent. La Couronne ×2 double tes âmes (pas les oboles).</span></li>
      <li><b>GIVRE</b><span>Fige un joueur (toi compris) : il encaisse sa main et quitte la manche.</span></li>
      <li><b>LES TROIS GLAS</b><span>Le joueur choisi doit arracher trois âmes d'affilée.</span></li>
      <li><b>SURSIS</b><span>Annule une Profanation, puis disparaît. Un seul à la fois ; le second s'offre à un autre.</span></li>
      <li><b>FIN</b><span>Dès qu'un joueur atteint 200 âmes en fin de manche, le plus haut total rachète sa vie.</span></li>
    </ul>
    <p class="dim" style="font-size:10.5px;letter-spacing:.14em">Inspiré des règles de Flip 7. Cartes et illustrations : placeholders.</p>`);
}

function optionsModal() {
  const v = sound.vol;
  const row = (k, label, val) => `<button class="toggle" data-t="${k}"><span>${label}</span><b>${val}</b></button>`;
  const intro = { auto: 'AUTO', full: 'COMPLÈTE', short: 'COURTE' };
  modal(`
    <h2>Réglages</h2>
    <p class="kicker">SON · EFFETS · AFFICHAGE</p>
    <label class="slider"><span>MUSIQUE</span><input type="range" min="0" max="1" step="0.05" value="${v.music}" data-v="music"><b>${Math.round(v.music * 100)}</b></label>
    <label class="slider"><span>EFFETS</span><input type="range" min="0" max="1" step="0.05" value="${v.sfx}" data-v="sfx"><b>${Math.round(v.sfx * 100)}</b></label>
    ${row('fx', 'EFFETS CRT · SECOUSSES', settings.fx ? 'ACTIVÉS' : 'COUPÉS')}
    ${row('risk', 'AFFICHER LE RISQUE DE PROFANATION', settings.risk ? 'OUI' : 'NON')}
    ${row('intro', 'CINÉMATIQUE D\'OUVERTURE', intro[settings.intro])}`, (b) => {
    $$('input[type=range]', b).forEach((r) => r.addEventListener('input', () => {
      sound.setVolume(r.dataset.v, +r.value); r.nextElementSibling.textContent = Math.round(r.value * 100);
      if (r.dataset.v === 'sfx') sound.play('hover');
    }));
    b.addEventListener('click', (e) => {
      const t = e.target.closest('[data-t]'); if (!t) return;
      sound.play('click');
      const k = t.dataset.t;
      if (k === 'fx') { settings.fx = !settings.fx; document.body.classList.toggle('no-fx', !settings.fx); t.lastElementChild.textContent = settings.fx ? 'ACTIVÉS' : 'COUPÉS'; }
      if (k === 'risk') { settings.risk = !settings.risk; t.lastElementChild.textContent = settings.risk ? 'OUI' : 'NON'; }
      if (k === 'intro') { settings.intro = { auto: 'full', full: 'short', short: 'auto' }[settings.intro]; t.lastElementChild.textContent = intro[settings.intro]; }
      saveSettings();
    });
  });
}

// ── CINÉMATIQUE ──────────────────────────────────────────────
async function playIntro() {
  show('intro');
  sound.stopMusic();
  const box = $('#intro-text');
  box.innerHTML = '';
  let skipped = false;
  const skip = () => { skipped = true; box._skip = true; };
  $('#intro-skip').onclick = skip;
  const onKey = (e) => { if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') skip(); };
  addEventListener('keydown', onKey);
  reaper = reaperMask(ascii, { cx: 0.5, cy: 0.47, scale: isNarrow() ? 0.8 : 1 });
  reaperReveal = 0;
  const seen = store.get('seenIntro', false);
  const full = settings.intro === 'full' || (settings.intro === 'auto' && !seen);
  const lines = full ? [
    { k: 'mono', t: 'ANNO DOMINI MCCCXLIX' },
    { t: 'La peste a pris le village. Cette nuit, elle t\'a pris aussi.' },
    { t: 'Mais la Mort s\'ennuie. Et la Mort aime jouer.', reaper: true },
    { t: 'Elle tient l\'Ossuaire : quatre-vingt-quatorze âmes. Chevaliers, démons, saints et damnés.' },
    { t: 'Arrache-lui deux cents âmes, et elle te rendra la tienne.' },
    { t: 'Mais souviens-toi : deux âmes du même rang ne partagent jamais un même corps.' },
    { k: 'goth', t: 'Assieds-toi.' },
  ] : [
    { k: 'mono', t: 'TU REVIENS À SA TABLE', reaper: true },
    { t: 'Deux cents âmes. Pas une de moins.' },
    { k: 'goth', t: 'Assieds-toi.' },
  ];
  sound.play('toll');
  for (const ln of lines) {
    if (skipped) break;
    if (ln.reaper) {
      sound.play('enter');
      const t0 = performance.now();
      const grow = () => { reaperReveal = Math.min(1, (performance.now() - t0) / 3200); if (reaperReveal < 1 && current === 'intro') requestAnimationFrame(grow); };
      grow();
    }
    box.innerHTML = '';
    const p = document.createElement('p');
    if (ln.k) p.className = ln.k;
    box.appendChild(p);
    if (ln.k === 'goth') { p.textContent = ln.t; p.animate([{ opacity: 0, letterSpacing: '.3em', filter: 'blur(8px)' }, { opacity: 1, letterSpacing: '0', filter: 'blur(0)' }], { duration: 1200, easing: 'ease-out' }); sound.play('toll'); await wait(1500); }
    else { await typeInto(p, ln.t, { speed: ln.k === 'mono' ? 55 : 30, onChar: () => sound.play('type') }); if (!skipped) await wait(ln.k === 'mono' ? 700 : 1300); }
  }
  removeEventListener('keydown', onKey);
  store.set('seenIntro', true);
  reaperReveal = 1;
  flash(120);
  sound.play('whoosh');
  await wait(skipped ? 100 : 300);
  reaper = null;
}

// ── PARTIES ──────────────────────────────────────────────────
let session = null; // { match, host, client, kind }

function localCtrl() {
  return { decide: () => view.askDecision(), chooseTarget: (s, pid, kind, c) => view.askTarget(kind, c) };
}

async function runMatch(match, you, { replay } = {}) {
  view.showRisk = settings.risk;
  view.speed = 1;
  view.canReplay = !!replay;
  view.onEnd = (choice) => { if (choice === 'again' && replay) replay(); else leave(); };
  view.mount(match.snapshot(), you);
  show('table');
  sound.startMusic('table');
  try { await match.run(); } catch (e) { if (e?.message !== 'aborted') console.error(e); }
}

async function startSolo(personas) {
  const name = myName();
  const players = [{ id: 'you', name, kind: 'human' }, ...personas.map((k, i) => ({ id: 'ai' + i, name: PERSONAS[k].name, kind: 'ai', persona: k, epithet: PERSONAS[k].epithet }))];
  const controllers = { you: localCtrl() };
  personas.forEach((k, i) => { controllers['ai' + i] = makeAI(k); });
  const match = new Match({ players, controllers, presenter: (ev, snap) => view.present(ev, snap) });
  session = { kind: 'solo', match };
  await playIntro();
  if (session?.match !== match) return;
  runMatch(match, 'you', { replay: () => startSolo(personas) });
}

function leave() {
  if (session) {
    if (session.match) session.match.aborted = true;
    view.cancelPrompts();
    session.host?.close();
    session.client?.close();
    clearInterval(session.countdown);
  }
  session = null;
  sound.stopMusic();
  sound.startMusic('menu');
  $('#overlay').className = 'hidden';
  show('menu');
}

$('#t-quit').onclick = () => {
  sound.play('click');
  modal(`<h2>Fuir ?</h2><p class="kicker">ABANDONNER LA PARTIE</p><p class="q">La Mort n'oublie jamais ceux qui quittent sa table.</p>
    <div class="row"><button class="btn" data-yes>FUIR</button><button class="btn ghost" data-close>RESTER</button></div>`, (b, close) => {
    b.querySelector('[data-yes]').onclick = () => { close(); leave(); };
  });
};

// ── MULTIJOUEUR : HÔTE ───────────────────────────────────────
function inviteLink(code) { return `${location.origin}${location.pathname}?table=${code}`; }

function renderSeats(players, me) {
  const ol = $('#lobby-seats');
  ol.innerHTML = '';
  for (let i = 0; i < MAX_SEATS; i++) {
    const p = players[i];
    const li = document.createElement('li');
    if (p) { li.className = 'full' + (p.id === me ? ' me' : ''); li.textContent = p.name; }
    else li.textContent = '· place vide ·';
    ol.appendChild(li);
  }
}

async function hostFlow({ isPublic = false, host: existing = null, code: c0 = null } = {}) {
  const name = myName();
  let host = existing, code = c0;
  if (!host) {
    $('#lobby-status').textContent = 'Le sceau se forme…';
    for (let k = 0; k < 3 && !host; k++) {
      code = newCode();
      try { host = await new Host({ code, name, isPublic }).open(); }
      catch (e) { if (e?.type !== 'unavailable-id') { toast(errText(e), 4200); return; } }
    }
    if (!host) { toast(errText('server-error')); return; }
  }
  session = { kind: 'host', host };
  show('lobby');
  $('#lobby-kind').textContent = isPublic ? 'TABLE PUBLIQUE · ERRANCE' : 'TABLE PRIVÉE';
  scramble($('#lobby-code'), isPublic ? 'ERRANCE' : code, 700);
  $('#lobby-copy').style.display = isPublic ? 'none' : '';
  $('#lobby-copy').onclick = async () => {
    sound.play('click');
    try { await navigator.clipboard.writeText(inviteLink(code)); toast('LIEN COPIÉ — ENVOIE-LE À TES VIVANTS'); }
    catch { toast(inviteLink(code), 6000); }
  };
  const start = $('#lobby-start');
  start.style.display = '';
  // bouton : ajouter un damné (IA)
  let addAI = $('#lobby-addai');
  if (!addAI) {
    addAI = document.createElement('button');
    addAI.id = 'lobby-addai'; addAI.className = 'btn ghost';
    addAI.textContent = '+ ASSEOIR UN DAMNÉ (IA)';
    start.before(addAI);
  }
  addAI.style.display = '';
  const pool = ['mort', 'flagellant', 'veuve', 'lepreux'];
  addAI.onclick = () => {
    sound.play('click');
    const used = host.seats.filter((s) => s.kind === 'ai').map((s) => s.persona);
    const k = pool.find((p) => !used.includes(p));
    if (!k || host.seats.length >= MAX_SEATS) return toast('PLUS DE PLACE À LA TABLE');
    host.seats.push({ id: 'ai-' + k, name: PERSONAS[k].name, kind: 'ai', persona: k, epithet: PERSONAS[k].epithet });
    host.lobby();
  };
  const refresh = (players) => {
    renderSeats(players, 'h');
    start.disabled = players.length < 2;
    $('#lobby-status').textContent = players.length < 2
      ? (isPublic ? 'Tu attends d\'autres âmes errantes…' : 'Envoie le lien. Les vivants te rejoindront ici.')
      : `${players.length} âmes autour de la table. Ouvre l'Ossuaire quand tu veux.`;
    if (isPublic) {
      clearInterval(session?.countdown);
      if (players.length >= 2 && session) {
        let n = players.length >= 4 ? 3 : 20;
        session.countdown = setInterval(() => {
          $('#lobby-status').textContent = `L'Ossuaire s'ouvre dans ${n}…`;
          if (--n < 0) { clearInterval(session.countdown); startHosted(host); }
        }, 1000);
      }
    }
  };
  host.onLobby = refresh;
  refresh(host.seats);
  start.onclick = () => { sound.play('click'); startHosted(host); };
}

async function startHosted(host) {
  if (host.started || host.seats.length < 2) return;
  clearInterval(session?.countdown);
  host.started = true;
  const players = host.seats.map((s) => ({ id: s.id, name: s.name, kind: s.id === 'h' ? 'human' : s.kind, persona: s.persona, epithet: s.epithet }));
  const controllers = {};
  for (const p of players) {
    if (p.id === 'h') controllers.h = localCtrl();
    else if (p.kind === 'ai') controllers[p.id] = makeAI(p.persona);
    else controllers[p.id] = remoteCtrl(host, p.id);
  }
  host.onDrop = (pid) => {
    controllers[pid] = makeAI('lepreux');
    const p = players.find((x) => x.id === pid);
    toast(`${p?.name || 'UNE ÂME'} S'EST ÉVANOUIE — LE LÉPREUX JOUE À SA PLACE`, 4000);
  };
  const match = new Match({
    players, controllers,
    presenter: async (ev, snap) => { host.broadcast({ t: 'ev', ev, state: snap }); await view.present(ev, snap); },
  });
  session = { kind: 'host', host, match };
  host.broadcast({ t: 'start', state: match.snapshot() });
  await playIntro();
  if (session?.match !== match) return;
  runMatch(match, 'h');
}

function remoteCtrl(host, pid) {
  const ai = makeAI('lepreux', { fast: true });
  return {
    async decide(s, p) { const v = await host.ask(pid, 'decide', {}); return v === 'hit' || v === 'stay' ? v : ai.decide(s, p); },
    async chooseTarget(s, p, kind, c) { const v = await host.ask(pid, 'target', { kind, cands: c }); return c.includes(v) ? v : ai.chooseTarget(s, p, kind, c); },
  };
}

// ── MULTIJOUEUR : INVITÉ ─────────────────────────────────────
function joinFlow(prefill = '') {
  modal(`
    <h2>Le Sceau</h2>
    <p class="kicker">REJOINDRE UNE TABLE</p>
    <p class="q">Entre les cinq lettres du sceau que l'on t'a confié.</p>
    <input class="codeinput" maxlength="5" value="${prefill}" placeholder="·····" autocomplete="off" spellcheck="false">
    <p class="status" data-st></p>
    <div class="row"><button class="btn" data-go>BRISER LE SCEAU</button></div>`, (b, close) => {
    const inp = b.querySelector('input'), st = b.querySelector('[data-st]');
    inp.focus();
    inp.oninput = () => { inp.value = cleanCode(inp.value); };
    const go = async () => {
      const code = cleanCode(inp.value);
      if (code.length !== 5) { st.textContent = 'Un sceau compte cinq lettres.'; return; }
      sound.play('click');
      st.textContent = 'Tu frappes à la porte…';
      try { const c = await new Client({ name: myName() }).join(code); close(); enterAsClient(c, code, false); }
      catch (e) { st.textContent = errText(e); }
    };
    b.querySelector('[data-go]').onclick = go;
    inp.onkeydown = (e) => { if (e.key === 'Enter') go(); };
    if (prefill.length === 5) go();
  });
}

async function randomFlow() {
  show('lobby');
  $('#lobby-kind').textContent = 'ERRANCE';
  $('#lobby-code').textContent = '·····';
  $('#lobby-seats').innerHTML = '';
  $('#lobby-start').style.display = 'none';
  $('#lobby-copy').style.display = 'none';
  const addAI = $('#lobby-addai'); if (addAI) addAI.style.display = 'none';
  session = { kind: 'wander' };
  try {
    const r = await wander(myName(), (s) => { $('#lobby-status').textContent = s; });
    if (session?.kind !== 'wander') { r.host?.close(); r.client?.close(); return; }
    if (r.role === 'host') hostFlow({ isPublic: true, host: r.host, code: r.code });
    else enterAsClient(r.client, r.code, true);
  } catch (e) {
    $('#lobby-status').textContent = errText(e);
  }
}

function enterAsClient(client, code, isPublic) {
  session = { kind: 'client', client };
  show('lobby');
  $('#lobby-kind').textContent = isPublic ? 'TABLE PUBLIQUE · ERRANCE' : 'TABLE PRIVÉE';
  scramble($('#lobby-code'), isPublic ? 'ERRANCE' : code, 700);
  $('#lobby-copy').style.display = 'none';
  $('#lobby-start').style.display = 'none';
  const addAI = $('#lobby-addai'); if (addAI) addAI.style.display = 'none';
  $('#lobby-status').textContent = 'Tu es assis. L\'hôte ouvrira l\'Ossuaire.';

  const q = []; let busy = false; let curRid = null; const cancelled = new Set();
  let mounted = false, introDone = null;
  const pump = async () => {
    if (busy) return; busy = true;
    while (q.length) {
      view.speed = q.length > 5 ? 2.4 : q.length > 2 ? 1.4 : 1;
      try { await q.shift()(); } catch (e) { console.error(e); }
    }
    busy = false;
  };
  client.on('lobby', (m) => renderSeats(m.players, client.you))
    .on('start', (m) => {
      introDone = playIntro().then(() => {
        if (session?.client !== client) return;
        view.showRisk = settings.risk; view.canReplay = false;
        view.onEnd = () => leave();
        view.mount(m.state, client.you); mounted = true;
        show('table'); sound.startMusic('table');
      });
      q.push(() => introDone); pump();
    })
    .on('ev', (m) => {
      q.push(() => (m.ev.type === 'roundEnd'
        ? view.showRoundEnd(m.ev, m.state, { gate: false })
        : m.ev.type === 'roundStart' ? view.present(m.ev, m.state) : view.present(m.ev, m.state)));
      pump();
    })
    .on('prompt', (m) => {
      q.push(async () => {
        if (cancelled.has(m.rid) || !mounted) return;
        curRid = m.rid;
        const v = m.kind === 'decide' ? await view.askDecision() : await view.askTarget(m.data.kind, m.data.cands);
        curRid = null;
        if (!cancelled.has(m.rid)) client.reply(m.rid, v);
      });
      pump();
    })
    .on('cancel', (m) => { cancelled.add(m.rid); if (curRid === m.rid) { view.cancelPrompts(); toast('TROP LENTE — LA MORT A CHOISI POUR TOI'); } })
    .on('closed', () => { if (session?.client === client) { toast('L\'HÔTE A QUITTÉ LA TABLE', 4000); leave(); } });
}

$('#lobby-leave').onclick = () => { sound.play('click'); leave(); };

// ── go ───────────────────────────────────────────────────────
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').classList.contains('hidden')) $('#modal').classList.add('hidden'); });
boot();
