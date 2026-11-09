// ─────────────────────────────────────────────────────────────
//  VII — LE SEPTIÈME SCEAU · chef d'orchestre
// ─────────────────────────────────────────────────────────────
import { THREE, DitherRenderer } from './render.js';
import { buildTavern } from './world.js';
import { AsciiView } from './asciiview.js';
import { installFrameVars, drawScreenFrame } from './frames.js';
import { portrait, panel } from './gallery.js';
import { Play } from './play.js';
import { sound } from './audio.js';
import { Match } from './game.js';
import { makeAI, PERSONAS } from './ai.js';
import { Host, Client, newCode, cleanCode, wander, errText, MAX_SEATS } from './net.js';
import { icon } from './icons.js';
import { BESTIAIRE, PACTE, HELMS, INTRO, INTRO_SHORT } from './lore.js';
import { typeInto, wait } from './fx.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('vii-' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('vii-' + k, JSON.stringify(v)); } catch { /* */ } },
};
const settings = { risk: true, intro: 'auto', grain: 1, opps: 3, ...store.get('settings2', {}) };
installFrameVars();
const saveSettings = () => store.set('settings2', settings);

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
const PIX = [4, 3, 2];
const dr = new DitherRenderer(canvas, { pixel: (w, h) => (current === 'game' ? Math.max(2, Math.min(w, h) / [190, 250, 330][settings.grain]) : PIX[settings.grain]), palette: 'rouille' });
const play = new Play(dr);

const tavScene = new THREE.Scene();
const tavern = buildTavern(tavScene);
const tavCam = new THREE.PerspectiveCamera(42, 1, 0.1, 90);
const ascii = new AsciiView($('#asc'), dr.renderer);
const SHOTS = {
  title: { pos: [0.4, 1.5, 4.5], look: [0, 4.4, -9], fov: 55 },
  menu: { pos: [0.9, 1.45, -1.2], look: [0.1, 1.35, -7], fov: 40 },
};
let shot = { pos: new THREE.Vector3(...SHOTS.title.pos), look: new THREE.Vector3(...SHOTS.title.look), fov: SHOTS.title.fov };
let shotFrom = null, shotTo = null, shotK = 1;
function goShot(name, dur = 2.2) {
  const s = SHOTS[name]; if (!s) return;
  shotFrom = { pos: shot.pos.clone(), look: shot.look.clone(), fov: shot.fov };
  shotTo = { pos: new THREE.Vector3(...s.pos), look: new THREE.Vector3(...s.look), fov: s.fov, dur };
  shotK = 0;
}
window.__vii = { dr, tavScene, tavCam, THREE };
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
  const cs = getComputedStyle(slot);
  const bl = parseFloat(cs.borderLeftWidth) || 0, bt = parseFloat(cs.borderTopWidth) || 0;
  const w = r.width - bl - (parseFloat(cs.borderRightWidth) || 0), h = r.height - bt - (parseFloat(cs.borderBottomWidth) || 0);
  Object.assign(canvas.style, { left: r.left + bl + 'px', top: r.top + bt + 'px', width: w + 'px', height: h + 'px' });
  canvas.style.clipPath = cs.borderRadius && cs.borderRadius !== '0px' ? `inset(0 round ${cs.borderRadius})` : 'none';
  dr.resize(w, h);
  play.stage.resize(w, h);
}
addEventListener('resize', placeGL);
$$('.spread.scroll, .spread').forEach((s) => s.addEventListener('scroll', placeGL, { passive: true }));

let last = performance.now(), ct = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (document.hidden) return;
  if (current === 'game') { if (canvas.style.display !== 'none') play.frame(dt); return; }
  if (current === 'intro') return;
  ct += dt;
  tavern.tick(ct);
  if (shotTo) {
    shotK = Math.min(1, shotK + dt / shotTo.dur);
    const k = shotK < 0.5 ? 2 * shotK * shotK : 1 - Math.pow(-2 * shotK + 2, 2) / 2;
    shot.pos.lerpVectors(shotFrom.pos, shotTo.pos, k); shot.look.lerpVectors(shotFrom.look, shotTo.look, k); shot.fov = shotFrom.fov + (shotTo.fov - shotFrom.fov) * k;
    if (shotK >= 1) shotTo = null;
  }
  tavCam.position.copy(shot.pos).add(new THREE.Vector3(Math.sin(ct * 0.13) * 0.15, Math.sin(ct * 0.21) * 0.05, 0));
  tavCam.fov = shot.fov; tavCam.lookAt(shot.look);
  ascii.render(tavScene, tavCam, dt, { dim: current === 'codex' || current === 'tavern' ? 0.45 : 1 });
}

function show(id) {
  current = id;
  document.body.classList.toggle('ingame', id === 'game');
  if (id === 'title' || id === 'menu') goShot(id);
  tavern.showPilgrim(id !== 'title');
  $$('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
  dr.setPalette('fange');
  requestAnimationFrame(placeGL);
  setTimeout(placeGL, 520);
}

// ── utilitaires d'interface ─────────────────────────────────
function toast(msg, ms = 2800) {
  const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.add('hidden'), ms);
}
function modal(html, onMount) {
  const m = $('#modal');
  $('.modal-body', m).innerHTML = html;
  fillIcons(m);
  m.classList.remove('hidden');
  const close = () => { m.classList.add('hidden'); sound.play('click'); };
  m.onclick = (e) => { if (e.target === m || e.target.closest('[data-close]')) close(); };
  onMount?.($('.modal-body', m), close);
  return close;
}
document.addEventListener('pointerover', (e) => {
  const b = e.target.closest('button');
  if (b && !b.disabled && b !== document._h) { document._h = b; sound.play('hover'); }
});
const updateSound = () => $$('[data-sound-toggle]').forEach((b) => { b.innerHTML = icon(sound.muted ? 'mute' : 'note'); b.classList.toggle('off', !!sound.muted); });
$$('[data-sound-toggle]').forEach((b) => b.addEventListener('click', () => { sound.setMuted(!sound.muted); updateSound(); }));

// ── le pèlerin ───────────────────────────────────────────────
let helm = store.get('helm', 0);
const myName = () => ($('#name').value.trim() || 'Pèlerin').slice(0, 14);
function renderMe() {
  $('#helm-name').textContent = HELMS[helm];
  tavern.setPilgrim(helm);
}
$$('[data-helm]').forEach((b) => b.addEventListener('click', () => { helm = (helm + +b.dataset.helm + 4) % 4; store.set('helm', helm); sound.play('click'); renderMe(); }));
$('#name').addEventListener('input', (e) => store.set('name', e.target.value));

// ── COUVERTURE ───────────────────────────────────────────────
async function boot() {
  show('title');
  requestAnimationFrame(loop);
  await document.fonts.ready;
  await Promise.all(['27px Bastarda', '60px Jacquard', '700 30px Grenze', '500 20px Grenze', '11px JBM'].map((f) => document.fonts.load(f).catch(() => {})));
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
  $('#name').value = store.get('name', '');
  renderMe();
  show('menu');
  const code = cleanCode(new URLSearchParams(location.search).get('table'));
  if (code.length === 5) setTimeout(() => joinFlow(code), 700);
}

// ── MENU ─────────────────────────────────────────────────────
$('#menu-list').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  sound.play('click');
  ({ host: () => hostFlow(), join: () => joinFlow(), random: randomFlow, codex: openCodex, options: optionsModal })[b.dataset.act]?.();
});

const SOLO = ['fossoyeur', 'terreau', 'clous', 'cierge'];
$('#go').addEventListener('click', () => { sound.play('click'); startSolo(SOLO.slice(0, settings.opps)); });
function soloModal() {
  let n = store.get('opps', 1);
  modal(`<h2>La table t'attend</h2><p class="sub">Combien de créatures s'assoient avec toi ?</p>
    <div class="pick">${SOLO.map((k, i) => `<button data-n="${i + 1}"><img alt="" src="${portrait(dr, k, { palette: 'fange', w: 96, h: 112 })}"><span>${i === 0 ? '' : '+ '}${esc(BESTIAIRE[k].name)}</span></button>`).join('')}</div>
    <div class="row"><button class="btn" data-go>S'asseoir</button></div>`, (b, close) => {
    b.querySelector('.pick').style.gridTemplateColumns = 'repeat(4, 1fr)';
    const sel = () => $$('.pick button', b).forEach((x) => x.classList.toggle('sel', +x.dataset.n <= n));
    sel();
    b.querySelector('.pick').onclick = (e) => { const x = e.target.closest('button'); if (!x) return; n = +x.dataset.n; store.set('opps', n); sound.play('click'); sel(); };
    b.querySelector('[data-go]').onclick = () => { close(); startSolo(SOLO.slice(0, n)); };
  });
}

function optionsModal() {
  const v = sound.vol;
  const G = ['Gros', 'Moyen', 'Fin'], I = { auto: 'Auto', full: 'Complète', short: 'Courte' };
  modal(`<h2>Réglages</h2><p class="sub">Son, tramage, cinématique.</p>
    <label class="slider"><span>Musique</span><input type="range" min="0" max="1" step="0.05" value="${v.music}" data-v="music"><b>${Math.round(v.music * 100)}</b></label>
    <label class="slider"><span>Effets</span><input type="range" min="0" max="1" step="0.05" value="${v.sfx}" data-v="sfx"><b>${Math.round(v.sfx * 100)}</b></label>
    <button class="toggle" data-t="opps"><span>Créatures à ta table</span><b>${settings.opps}</b></button>
    <button class="toggle" data-t="grain"><span>Grain du tramage</span><b>${G[settings.grain]}</b></button>
    <button class="toggle" data-t="risk"><span>Afficher le présage (risque)</span><b>${settings.risk ? 'Oui' : 'Non'}</b></button>
    <button class="toggle" data-t="intro"><span>Cinématique d'ouverture</span><b>${I[settings.intro]}</b></button>`, (b) => {
    $$('input[type=range]', b).forEach((r) => r.addEventListener('input', () => { sound.setVolume(r.dataset.v, +r.value); r.nextElementSibling.textContent = Math.round(r.value * 100); }));
    b.addEventListener('click', (e) => {
      const t = e.target.closest('[data-t]'); if (!t) return;
      sound.play('click');
      const k = t.dataset.t;
      if (k === 'opps') { settings.opps = settings.opps % 4 + 1; t.lastElementChild.textContent = settings.opps; }
      if (k === 'grain') { settings.grain = (settings.grain + 1) % 3; t.lastElementChild.textContent = G[settings.grain]; placeGL(); }
      if (k === 'risk') { settings.risk = !settings.risk; t.lastElementChild.textContent = settings.risk ? 'Oui' : 'Non'; play.showRisk = settings.risk; }
      if (k === 'intro') { settings.intro = { auto: 'full', full: 'short', short: 'auto' }[settings.intro]; t.lastElementChild.textContent = I[settings.intro]; }
      saveSettings();
    });
  });
}

// ── PACTE & BESTIAIRE ───────────────────────────────────────
let codexBuilt = false;
function openCodex() {
  if (!codexBuilt) {
    $('#pacte').innerHTML = PACTE.map(([ic, n, d]) => `<div class="state"><div class="st-ic">${icon(ic)}</div><h3>${esc(n)}</h3><p>${esc(d)}</p></div>`).join('');
    $('#bestiaire').innerHTML = Object.entries(BESTIAIRE).map(([k, b]) => `
      <div class="beast">
        <div class="arch"><img alt="" src="${portrait(dr, k, { palette: 'fange', w: 200, h: 128 })}"></div>
        <div class="nm">${esc(b.name)}</div>
        <div class="tt">${esc(b.title)}</div>
        <div class="tx">${esc(b.text)}</div>
        <div class="stats">${Object.entries(b.stats).map(([s, v]) => `<span>${s}</span><span class="bar">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= v ? 'on' : ''}"></i>`).join('')}</span>`).join('')}</div>
        <div class="items">${b.items.map(([ic, n, d]) => `<div>${icon(ic)}<span>${esc(n)}<small>${esc(d)}</small></span></div>`).join('')}</div>
        <div class="align"><span>Mal</span><span><i style="left:${b.align * 100}%"></i></span><span>Bien</span></div>
      </div>`).join('');
    codexBuilt = true;
  }
  show('codex');
}
$('[data-back]').addEventListener('click', () => { sound.play('click'); show('menu'); });

// ── CINÉMATIQUE EN CASES ─────────────────────────────────────
async function playIntro() {
  show('intro');
  sound.stopMusic();
  const seen = store.get('seenIntro2', false);
  const full = settings.intro === 'full' || (settings.intro === 'auto' && !seen);
  const planches = full ? INTRO : INTRO_SHORT;
  let skipped = false, next = null;
  const adv = () => { sound.play('click'); next?.(); };
  const skip = (e) => { e?.stopPropagation(); skipped = true; next?.(); };
  $('#intro').onclick = adv;
  $('#intro-skip').onclick = skip;
  const onKey = (e) => { if (e.key === 'Escape') skip(); else if (e.key === ' ' || e.key === 'Enter') adv(); };
  addEventListener('keydown', onKey);
  sound.play('toll');
  for (const pl of planches) {
    if (skipped) break;
    const img = $('#intro-img');
    img.src = panel(dr, pl.scene, pl.palette, 320, 220);
    img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
    const say = $('#intro-say');
    say.innerHTML = pl.speaker ? `<span class="who">${esc(pl.speaker)}</span>` : '';
    if (pl.scene === 'fossoyeur') sound.play('enter');
    for (const line of pl.lines) {
      if (skipped) break;
      const s = document.createElement('span'); s.className = 'ln'; say.appendChild(s);
      let fast = false;
      next = () => { fast = true; };
      await typeInto(s, line, { speed: 30, onChar: () => sound.play('type'), skip: () => fast || skipped });
      await new Promise((res) => { next = res; setTimeout(res, 2400); });
    }
  }
  removeEventListener('keydown', onKey);
  $('#intro').onclick = null;
  store.set('seenIntro2', true);
  sound.play('whoosh');
}

// ── PARTIES ──────────────────────────────────────────────────
let session = null;
const localCtrl = () => ({ decide: () => play.askDecision(), chooseTarget: (s, pid, kind, c) => play.askTarget(kind, c) });

async function runMatch(match, you, { replay, helms } = {}) {
  play.showRisk = settings.risk;
  play.stage.speed = 1;
  play.canReplay = !!replay;
  play.gate = true;
  play.onEnd = (c) => { if (c === 'again' && replay) replay(); else leave(); };
  show('game');
  play.mount(match.snapshot(), you, { helms });
  sound.startMusic('table');
  try { await match.run(); } catch (e) { if (e?.message !== 'aborted') console.error(e); }
}

async function startSolo(personas) {
  const players = [{ id: 'you', name: myName(), kind: 'human' }, ...personas.map((k, i) => ({ id: 'ai' + i, name: BESTIAIRE[k].name, kind: 'ai', persona: k }))];
  const controllers = { you: localCtrl() };
  personas.forEach((k, i) => { controllers['ai' + i] = makeAI(k); });
  const match = new Match({ players, controllers, presenter: (ev, snap) => play.present(ev, snap) });
  session = { kind: 'solo', match };
  play.chatEnabled = false; $('#chat-in').style.display = 'none';
  await playIntro();
  if (session?.match !== match) return;
  runMatch(match, 'you', { replay: () => startSolo(personas), helms: { you: helm } });
}

function leave() {
  if (session) {
    if (session.match) session.match.aborted = true;
    play.cancelPrompts();
    session.host?.close(); session.client?.close();
    clearInterval(session.countdown);
  }
  session = null;
  play.closeOverlay();
  sound.stopMusic(); sound.startMusic('menu');
  show('menu');
}
$('#g-quit').onclick = () => {
  sound.play('click');
  modal(`<h2>Fuir la table ?</h2><p class="sub">Le Fossoyeur n'oublie jamais ceux qui se lèvent.</p>
    <div class="row"><button class="btn ghost" data-close>Rester</button><button class="btn" data-yes>Fuir</button></div>`, (b, close) => {
    b.querySelector('[data-yes]').onclick = () => { close(); leave(); };
  });
};
$('#g-chat').onclick = () => { sound.play('click'); $('#log').classList.toggle(innerWidth < 860 ? 'open' : 'min'); };

// ── TAVERNE ──────────────────────────────────────────────────
const inviteLink = (code) => `${location.origin}${location.pathname}?table=${code}`;
function seatPortrait(p) {
  if (p.kind === 'ai') return portrait(dr, p.persona, { palette: 'fange', w: 96, h: 112 });
  return portrait(dr, 'pelerin', { variant: p.helm | 0, palette: 'fange', w: 96, h: 112 });
}
function renderSeats(players, me) {
  $('#tav-seats').innerHTML = Array.from({ length: MAX_SEATS }, (_, i) => {
    const p = players[i];
    return p ? `<li class="full ${p.id === me ? 'me' : ''}"><div class="arch"><img alt="" src="${seatPortrait(p)}"></div><span>${esc(p.kind === 'ai' ? BESTIAIRE[p.persona].name : p.name)}</span></li>`
      : `<li><div class="arch">${icon('candle')}</div><span>·</span></li>`;
  }).join('');
}
function tavLog(html) { const ol = $('#tav-log'); const li = document.createElement('li'); li.innerHTML = html; ol.appendChild(li); ol.scrollTop = ol.scrollHeight; }
function chatLine(from, text) {
  const h = `<b>${esc(from)}</b> : ${esc(text)}`;
  tavLog(h); play.log(h, 'chat');
}
function openTavern(kind, code, isHost) {
  show('tavern');
  $('#tav-kind').textContent = kind;
  $('#tav-code').textContent = code === 'ERRANCE' ? 'Errance' : code;
  $('#tav-copy').style.display = isHost && code !== 'ERRANCE' ? '' : 'none';
  $('#tav-ai').style.display = isHost ? '' : 'none';
  $('#tav-start').style.display = isHost ? '' : 'none';
  $('#tav-log').innerHTML = '';
  $('#tav-in').value = '';
}
$('#tav-leave').onclick = () => { sound.play('click'); leave(); };
$('#tav-in').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.value.trim()) { session?.sendChat?.(e.target.value.trim()); e.target.value = ''; } });
play.onChat = (text) => session?.sendChat?.(text);

async function hostFlow({ isPublic = false, host: existing = null, code: c0 = null } = {}) {
  let host = existing, code = c0;
  if (!host) {
    for (let k = 0; k < 3 && !host; k++) {
      code = newCode();
      try { host = await new Host({ code, name: myName(), helm }).open(); }
      catch (e) { if (e?.type !== 'unavailable-id') { toast(errText(e), 4200); return; } }
    }
    if (!host) { toast(errText('server-error')); return; }
  }
  const sendChat = (text) => { host.broadcast({ t: 'chat', from: myName(), text }); chatLine(myName(), text); };
  session = { kind: 'host', host, sendChat };
  host.onChat = (pid, text) => { const s = host.seats.find((x) => x.id === pid); host.broadcast({ t: 'chat', from: s?.name || '?', text }); chatLine(s?.name || '?', text); };
  openTavern(isPublic ? 'Table publique · errance' : 'Table privée', isPublic ? 'ERRANCE' : code, true);
  $('#tav-copy').onclick = async () => {
    sound.play('click');
    try { await navigator.clipboard.writeText(inviteLink(code)); toast('Lien copié. Envoie-le aux vivants.'); } catch { toast(inviteLink(code), 6000); }
  };
  $('#tav-ai').onclick = () => {
    sound.play('click');
    const used = host.seats.filter((s) => s.kind === 'ai').map((s) => s.persona);
    const k = SOLO.find((p) => !used.includes(p));
    if (!k || host.seats.length >= MAX_SEATS) return toast('Plus de place à la table.');
    host.seats.push({ id: 'ai-' + k, name: BESTIAIRE[k].name, kind: 'ai', persona: k });
    host.lobby();
  };
  const start = $('#tav-start');
  const refresh = (players) => {
    renderSeats(players, 'h');
    start.disabled = players.length < 2;
    $('#tav-status').textContent = players.length < 2
      ? (isPublic ? 'Tu attends d\'autres âmes errantes…' : 'Envoie le lien. Les vivants s\'assiéront ici.')
      : `${players.length} à la table. Ouvre l'Ossuaire quand tu veux.`;
    if (isPublic && session) {
      clearInterval(session.countdown);
      if (players.length >= 2) {
        let n = players.length >= 4 ? 3 : 20;
        session.countdown = setInterval(() => {
          $('#tav-status').textContent = `L'Ossuaire s'ouvre dans ${n}…`;
          if (--n < 0) { clearInterval(session.countdown); startHosted(host); }
        }, 1000);
      }
    }
  };
  host.onLobby = refresh;
  refresh(host.seats);
  start.onclick = () => { sound.play('click'); startHosted(host); };
}

function remoteCtrl(host, pid) {
  const ai = makeAI('cierge', { fast: true });
  return {
    async decide(s, p) { const v = await host.ask(pid, 'decide', {}); return v === 'hit' || v === 'stay' ? v : ai.decide(s, p); },
    async chooseTarget(s, p, kind, c) { const v = await host.ask(pid, 'target', { kind, cands: c }); return c.includes(v) ? v : ai.chooseTarget(s, p, kind, c); },
  };
}

async function startHosted(host) {
  if (host.started || host.seats.length < 2) return;
  clearInterval(session?.countdown);
  host.started = true;
  const players = host.seats.map((s) => ({ id: s.id, name: s.name, kind: s.id === 'h' ? 'human' : s.kind, persona: s.persona }));
  const helms = Object.fromEntries(host.seats.map((s) => [s.id, s.helm | 0]));
  const controllers = {};
  for (const p of players) {
    if (p.id === 'h') controllers.h = localCtrl();
    else if (p.kind === 'ai') controllers[p.id] = makeAI(p.persona);
    else controllers[p.id] = remoteCtrl(host, p.id);
  }
  host.onDrop = (pid) => {
    controllers[pid] = makeAI('cierge');
    const p = players.find((x) => x.id === pid);
    toast(`${p?.name || 'Une âme'} s'est évanouie. L'Enfant-Cierge joue à sa place.`, 4000);
  };
  const match = new Match({ players, controllers, presenter: async (ev, snap) => { host.broadcast({ t: 'ev', ev, state: snap }); await play.present(ev, snap); } });
  session = { ...session, kind: 'host', host, match };
  host.broadcast({ t: 'start', state: match.snapshot(), helms });
  play.chatEnabled = true; $('#chat-in').style.display = '';
  await playIntro();
  if (session?.match !== match) return;
  runMatch(match, 'h', { helms });
}

function joinFlow(prefill = '') {
  modal(`<h2>Briser un sceau</h2><p class="sub">Les cinq lettres du sceau qu'on t'a confié.</p>
    <input class="codein" maxlength="5" value="${esc(prefill)}" placeholder="·····" autocomplete="off" spellcheck="false">
    <p class="sub" data-st style="text-align:center;margin-top:8px"></p>
    <div class="row"><button class="btn" data-go>Frapper à la dalle</button></div>`, (b, close) => {
    const inp = b.querySelector('input'), st = b.querySelector('[data-st]');
    inp.focus();
    inp.oninput = () => { inp.value = cleanCode(inp.value); };
    const go = async () => {
      const code = cleanCode(inp.value);
      if (code.length !== 5) { st.textContent = 'Un sceau compte cinq lettres.'; return; }
      sound.play('click'); st.textContent = 'Tu frappes à la dalle…';
      try { const c = await new Client({ name: myName(), helm }).join(code); close(); enterAsClient(c, code, false); }
      catch (e) { st.textContent = errText(e); }
    };
    b.querySelector('[data-go]').onclick = go;
    inp.onkeydown = (e) => { if (e.key === 'Enter') go(); };
    if (prefill.length === 5) go();
  });
}

async function randomFlow() {
  openTavern('Errance', 'ERRANCE', false);
  $('#tav-seats').innerHTML = '';
  session = { kind: 'wander' };
  try {
    const r = await wander(myName(), helm, (s) => { $('#tav-status').textContent = s; });
    if (session?.kind !== 'wander') { r.host?.close(); r.client?.close(); return; }
    if (r.role === 'host') hostFlow({ isPublic: true, host: r.host, code: r.code });
    else enterAsClient(r.client, r.code, true);
  } catch (e) { $('#tav-status').textContent = errText(e); }
}

function enterAsClient(client, code, isPublic) {
  session = { kind: 'client', client, sendChat: (text) => client.chat(text) };
  openTavern(isPublic ? 'Table publique · errance' : 'Table privée', isPublic ? 'ERRANCE' : code, false);
  $('#tav-status').textContent = 'Tu es assis. L\'hôte ouvrira l\'Ossuaire.';
  const q = []; let busy = false, curRid = null, mounted = false;
  const cancelled = new Set();
  const pump = async () => {
    if (busy) return; busy = true;
    while (q.length) {
      play.stage.speed = q.length > 5 ? 2.4 : q.length > 2 ? 1.4 : 1;
      try { await q.shift()(); } catch (e) { console.error(e); }
    }
    busy = false;
  };
  client.on('lobby', (m) => renderSeats(m.players, client.you))
    .on('chat', (m) => chatLine(m.from, m.text))
    .on('start', (m) => {
      play.chatEnabled = true; $('#chat-in').style.display = '';
      const p = playIntro().then(() => {
        if (session?.client !== client) return;
        play.showRisk = settings.risk; play.canReplay = false; play.gate = false;
        play.onEnd = () => leave();
        show('game');
        play.mount(m.state, client.you, { helms: m.helms || {} });
        mounted = true;
        sound.startMusic('table');
      });
      q.push(() => p); pump();
    })
    .on('ev', (m) => { q.push(() => play.present(m.ev, m.state)); pump(); })
    .on('prompt', (m) => {
      q.push(async () => {
        if (cancelled.has(m.rid) || !mounted) return;
        curRid = m.rid;
        const v = m.kind === 'decide' ? await play.askDecision() : await play.askTarget(m.data.kind, m.data.cands);
        curRid = null;
        if (!cancelled.has(m.rid)) client.reply(m.rid, v);
      });
      pump();
    })
    .on('cancel', (m) => { cancelled.add(m.rid); if (curRid === m.rid) { play.cancelPrompts(); toast('Trop lent. Le Fossoyeur a choisi pour toi.'); } })
    .on('closed', () => { if (session?.client === client) { toast('L\'hôte a quitté la table.', 4000); leave(); } });
}

addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').classList.contains('hidden')) $('#modal').classList.add('hidden'); });
updateSound();
boot();
