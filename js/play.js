// ─────────────────────────────────────────────────────────────
//  La partie : mise en scène des événements du moteur dans la
//  scène 3D + interface façon vieux MMO (cadres, jauges, icônes).
// ─────────────────────────────────────────────────────────────
import { bustRisk, roman, cardTitle, TARGET, FLIP7_BONUS } from './game.js';
import { Stage } from './stage.js';
import { sound } from './audio.js';
import { icon } from './icons.js';
import { portrait } from './gallery.js';
import { BESTIAIRE } from './lore.js';
import { wait } from './fx.js';
import { HandView } from './handview.js';

const $ = (s, r = document) => r.querySelector(s);
const STATUS_ICON = { stayed: 'fist', frozen: 'frost', bust: 'skull' };
const cardShort = (c) => (c.t === 'n' ? String(c.v) : c.t === 'm' ? '+' + c.v : c.t === 'x' ? '×2' : { freeze: 'G', three: 'T', chance: 'S' }[c.a]);
const nice = (s) => String(s).toLowerCase().replace(/(^|\s|'|-)(\S)/g, (m, a, b) => a + b.toUpperCase());
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class Play {
  constructor(dr) {
    this.dr = dr;
    this.stage = new Stage(dr);
    this.hand = new HandView($('#hand'));
    addEventListener('resize', () => this.hand.relayout());
    this.root = $('#game');
    this.canvas = dr.canvas;
    this.pending = null; this.pendingTarget = null; this._continue = null;
    this.showRisk = true;
    this.hit = $('#b-hit'); this.stay = $('#b-stay');
    this.hit.onclick = () => this.decide('hit');
    this.stay.onclick = () => this.decide('stay');
    addEventListener('keydown', (e) => {
      if (!this.root.classList.contains('on') || e.target.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (this.pending && (k === '1' || k === 'a' || k === ' ')) { e.preventDefault(); this.decide('hit'); }
      else if (this.pending && (k === '2' || k === 'r')) { e.preventDefault(); this.decide('stay'); }
      else if (this._continue && (k === 'enter' || k === ' ')) { e.preventDefault(); this._continue(); }
      else if (k === 'enter' && this.chatEnabled) { e.preventDefault(); $('#chat-in').focus(); }
    });
    this.canvas.addEventListener('pointermove', (e) => this.onMove(e));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
    $('#chat-in').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { const v = e.target.value.trim(); if (v) this.onChat?.(v); e.target.value = ''; e.target.blur(); }
      if (e.key === 'Escape') e.target.blur();
    });
  }

  // ── montage ────────────────────────────────────────────────
  mount(snap, you, { helms = {} } = {}) {
    this.you = you; this.snap = snap; this.helms = helms;
    this.players = snap.players.map((p) => ({ ...p }));
    this.names = Object.fromEntries(snap.players.map((p) => [p.id, p.name]));
    this.stage.setPlayers(snap.players, you);
    this.hand.clear({ x: innerWidth / 2, y: innerHeight }); $('#hand').innerHTML = '';
    this.stage.holdR = false; this.stage.holdL = false;
    this.stage.layout(snap, { instant: true });
    this.stage.setDeckCount(snap.deckCount);
    this.buildParty(snap);
    this.buildPlates(snap);
    $('#log ol').innerHTML = '';
    $('#g-overlay').className = 'hidden'; $('#g-overlay').innerHTML = '';
    this.sync(snap);
    const foe = snap.players.find((p) => p.id !== you);
    const l = foe && this.creatureSay(foe.id, 'taunt'); if (l) this.say(l[0], [l[1]]);
  }

  T() { return this.snap?.target || TARGET; }
  kindOf(p) { return p.kind === 'ai' ? p.persona : 'pelerin'; }
  portraitOf(p, w = 64, h = 72) {
    return portrait(this.dr, this.kindOf(p), { variant: this.helms[p.id] ?? 0, palette: 'fange', w, h });
  }
  who(pid) { return pid === this.you ? 'Toi' : this.names[pid] || '…'; }
  is(pid) { return pid === this.you; }
  creatureSay(pid, key) {
    const p = this.snap.players.find((x) => x.id === pid);
    const b = p?.kind === 'ai' ? BESTIAIRE[p.persona] : null;
    return b?.say?.[key] ? [b.name, b.say[key]] : null;
  }

  buildParty(snap) {
    const box = $('#party');
    box.innerHTML = '';
    const order = [snap.players.find((p) => p.id === this.you), ...snap.players.filter((p) => p.id !== this.you)];
    for (const p of order) {
      const el = document.createElement('button');
      el.className = 'pf' + (this.is(p.id) ? ' me' : '');
      el.dataset.pid = p.id;
      el.innerHTML = `
        <span class="pf-img"><img alt="" src="${this.portraitOf(p)}"></span>
        <span class="pf-body">
          <span class="pf-name">${esc(this.is(p.id) ? p.name : (BESTIAIRE[p.persona]?.name || p.name))}</span>
          <span class="gauge"><i class="g1"></i><i class="g2"></i><b class="gv">0</b></span>
          <span class="pf-cards"></span>
        </span>
        <span class="pf-st"></span>`;
      el.onclick = () => this.pickTarget(p.id);
      box.appendChild(el);
    }
  }

  buildPlates(snap) {
    const box = $('#plates');
    box.innerHTML = '';
    for (const p of snap.players) {
      if (this.is(p.id)) continue;
      const el = document.createElement('div');
      el.className = 'plate'; el.dataset.pid = p.id;
      el.innerHTML = `<span class="pl-name">${esc(BESTIAIRE[p.persona]?.name || p.name)}</span><span class="pl-cards"></span><span class="pl-st"></span>`;
      box.appendChild(el);
    }
  }

  sync(snap) {
    this.snap = snap;
    $('#g-deck').textContent = snap.deckCount;
    $('#g-round').textContent = roman(snap.round || 1);
    for (const p of snap.players) {
      const pf = $(`#party [data-pid="${p.id}"]`);
      if (pf) {
        pf.classList.toggle('turn', snap.turn === p.id);
        pf.classList.toggle('out', p.status !== 'active');
        pf.querySelector('.g1').style.width = Math.min(100, (p.score / this.T()) * 100) + '%';
        const g2 = pf.querySelector('.g2');
        g2.style.left = Math.min(100, (p.score / this.T()) * 100) + '%';
        g2.style.width = Math.max(0, Math.min(100 - (p.score / this.T()) * 100, (p.hand / this.T()) * 100)) + '%';
        pf.querySelector('.gv').textContent = p.score + (p.hand && p.status !== 'bust' ? ' +' + p.hand : '');
        if (!this.is(p.id)) pf.querySelector('.pf-cards').innerHTML = [...p.nums, ...p.mods].map((c) => `<i class="${c.dup ? 'dup' : ''}">${cardShort(c)}</i>`).join('');
        pf.querySelector('.pf-st').innerHTML = p.flip7 ? icon('seal') : STATUS_ICON[p.status] ? icon(STATUS_ICON[p.status]) : snap.turn === p.id ? icon('candle', 'blink') : '';
      }
      const pl = $(`#plates [data-pid="${p.id}"]`);
      if (pl) {
        pl.classList.toggle('turn', snap.turn === p.id);
        pl.classList.toggle('out', p.status !== 'active');
        pl.querySelector('.pl-cards').innerHTML = [...p.nums, ...p.mods, ...(p.chance ? [p.chance] : [])].map((c) => `<i class="${c.dup ? 'dup' : ''} ${c.t !== 'n' ? 'alt' : ''}">${cardShort(c)}</i>`).join('');
        pl.querySelector('.pl-st').innerHTML = p.flip7 ? icon('seal') : STATUS_ICON[p.status] ? icon(STATUS_ICON[p.status]) : '';
      }
      if (this.is(p.id)) {
        $('#g-hand').textContent = p.status === 'bust' ? '0' : p.hand;
        const r = p.status === 'active' ? bustRisk(snap, p.id) : 0;
        $('#g-risk').style.width = Math.round(r * 100) + '%';
        $('.omen').title = 'Présage de profanation : ' + Math.round(r * 100) + '%';
        $('.omen').classList.toggle('hot', r >= 0.3);
        $('.omen').style.display = this.showRisk ? '' : 'none';
        $('#g-buffs').innerHTML = [...p.nums, ...p.mods, ...(p.chance ? [p.chance] : [])].map((c) => `<i class="${c.dup ? 'dup' : ''} ${c.t !== 'n' ? 'alt' : ''}" title="${esc(nice(cardTitle(c)))}">${cardShort(c)}</i>`).join('');
        $('#g-xp').style.width = Math.min(100, (p.score / this.T()) * 100) + '%';
        $('#g-xp2').style.left = Math.min(100, (p.score / this.T()) * 100) + '%';
        $('#g-xp2').style.width = Math.max(0, Math.min(100 - (p.score / this.T()) * 100, ((p.status === 'bust' ? 0 : p.hand) / this.T()) * 100)) + '%';
        $('#g-total').textContent = p.score;
      }
    }
  }

  // ── boucle (appelée par main) ──────────────────────────────
  frame(dt) {
    this.stage.update(dt);
    this.stage.render();
    const r = this.canvas.getBoundingClientRect();
    for (const pl of document.querySelectorAll('#plates .plate')) {
      const s = this.stage.screenOf(pl.dataset.pid, r.width, r.height);
      if (!s || !s.vis) { pl.style.display = 'none'; continue; }
      pl.style.display = '';
      if (s.x < 40 || s.x > r.width - 40) { pl.style.display = 'none'; continue; }
      const x = s.x, y = Math.max(r.width < 860 ? 150 : 74, s.y);
      pl.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`;
    }
  }

  // ── journal / paroles ──────────────────────────────────────
  log(html, cls = '') {
    const ol = $('#log ol');
    const li = document.createElement('li'); li.className = cls; li.innerHTML = html;
    ol.appendChild(li);
    while (ol.children.length > 40) ol.firstChild.remove();
    ol.scrollTop = ol.scrollHeight;
  }
  say(speaker, lines, ms = 2600) {
    const box = $('#say');
    box.innerHTML = (speaker ? `<span class="who">${esc(speaker)}</span>` : '') + lines.map((l) => `<span class="ln">${esc(l)}</span>`).join('');
    box.classList.remove('show'); void box.offsetWidth; box.classList.add('show');
    clearTimeout(this._sayT);
    this._sayT = setTimeout(() => box.classList.remove('show'), ms / this.stage.speed);
  }

  // ── événements ─────────────────────────────────────────────
  async present(ev, snap) {
    const st = this.stage;
    switch (ev.type) {
      case 'gameStart':
        this.sync(snap);
        await st.wait(600);
        break;

      case 'roundStart': {
        this.closeOverlay();
        st.setHolding(false, false);
        await Promise.all([this.sweep(), this.hand.clear(st.fosseScreen())]);
        st.layout(snap, { instant: true });
        st.setDeckCount(snap.deckCount);
        this.sync(snap);
        sound.play('toll');
        this.log(`<b>Manche ${roman(ev.round)}</b>`, 'sys');
        this.banner('Manche ' + roman(ev.round));
        await st.wait(1000);
        break;
      }

      case 'turn':
        st.focus = ev.pid;
        this.sync(snap);
        break;

      case 'reveal':
        st.focus = ev.pid;
        this.sync(snap);
        if (this.is(ev.pid)) {
          await this.hand.stash();
          if (this.hand.fan.length) st.setHolding(undefined, true);
          sound.play('whoosh');
          const xy = await st.meReach();
          const d = this.hand.draw(ev.card, xy);
          setTimeout(() => sound.play('flip'), 520 / st.speed);
          await d; await st.wait(250);
        }
        else { sound.play('whoosh'); await st.oppDraw(ev.pid, ev.card); sound.play('flip'); await st.wait(420); }
        this.log(`${esc(this.who(ev.pid))} · <em>${esc(nice(cardTitle(ev.card)))}</em>`);
        break;

      case 'gain':
        if (!this.is(ev.pid)) await st.settleCard(ev.card, ev.pid, snap);
        st.layout(snap); this.sync(snap);
        sound.play('gain');
        break;

      case 'bust': {
        if (this.is(ev.pid)) { this.hand.mark(ev.card.id, 'dup'); this.hand.setState('bust'); }
        else await st.settleCard(ev.card, ev.pid, snap);
        st.layout(snap); this.sync(snap);
        sound.play('bust');
        st.shake(0.04); st.flashDither('invert', 140); st.burst(ev.pid, 'ember', 110);
        st.paletteFlash('sang', 1300);
        const s = st.seats.get(ev.pid); if (s) s.mood = 1;
        setTimeout(() => { if (s) s.mood = 0; }, 1500);
        this.log(`${esc(this.who(ev.pid))} · <b>Profanation</b> (${roman(ev.value)})`, 'bad');
        const foeId = this.snap.players.find((p) => !this.is(p.id))?.id;
        const line = this.is(ev.pid) ? (this.creatureSay(foeId, 'win') || ['', 'Elles se sont reconnues.']) : (this.creatureSay(ev.pid, 'bust') || ['', 'Profanation.']);
        this.say(line[0], [line[1]]);
        await st.wait(1500);
        break;
      }

      case 'saved':
        if (this.is(ev.pid)) await Promise.all([this.hand.send(ev.card.id, st.fosseScreen()), this.hand.send(ev.chance.id, st.fosseScreen())]);
        else await st.settleCard(ev.card, 'fosse', snap);
        st.layout(snap); this.sync(snap);
        sound.play('chance'); st.pulse(ev.pid, 1);
        this.log(`${esc(this.who(ev.pid))} · <b>Sursis</b>`);
        await st.wait(800);
        break;

      case 'flip7':
        this.sync(snap);
        sound.play('flip7'); st.flashDither('flash', 260); st.ring(ev.pid);
        this.log(`${esc(this.who(ev.pid))} · <b>Sept Sceaux</b> +${FLIP7_BONUS}`, 'good');
        this.banner('Les Sept Sceaux');
        await st.wait(1800);
        break;

      case 'stay': {
        st.layout(snap); this.sync(snap);
        sound.play('stay');
        const p = snap.players.find((q) => q.id === ev.pid);
        this.log(`${esc(this.who(ev.pid))} · se retire (${p.hand})`);
        if (this.is(ev.pid)) { await this.hand.stash(); st.setHolding(false, true); }
        else { const l = this.creatureSay(ev.pid, 'stay'); if (l && Math.random() < 0.5) this.say(l[0], [l[1]], 1800); }
        await st.wait(500);
        break;
      }

      case 'freeze':
        if (this.is(ev.from)) { await this.hand.send(ev.card.id, this.is(ev.to) ? st.fosseScreen() : st.seatScreen(ev.to)); st.setHolding(false, undefined); }
        else await st.settleCard(ev.card, 'fosse', snap);
        if (this.is(ev.to)) this.hand.setState('frozen');
        st.layout(snap); this.sync(snap);
        sound.play('freeze'); st.burst(ev.to, 'frost', 90);
        this.log(`${esc(this.who(ev.from))} → ${esc(this.who(ev.to))} · <b>Givre</b>`);
        await st.wait(1000);
        break;

      case 'three':
        if (this.is(ev.from)) { await this.hand.send(ev.card.id, this.is(ev.to) ? st.fosseScreen() : st.seatScreen(ev.to)); st.setHolding(false, undefined); }
        else await st.settleCard(ev.card, 'fosse', snap);
        this.sync(snap);
        sound.play('three'); st.pulse(ev.to, 3);
        this.log(`${esc(this.who(ev.from))} → ${esc(this.who(ev.to))} · <b>Trois Glas</b>`);
        await st.wait(1500);
        break;

      case 'toll':
        st.focus = ev.pid; this.sync(snap);
        await st.wait(200);
        break;

      case 'setAside':
      case 'give':
        if (ev.type === 'setAside' && this.is(ev.pid)) await this.hand.stash();
        else if (ev.type === 'give' && this.is(ev.from)) await this.hand.send(ev.card.id, st.seatScreen(ev.to));
        else if (ev.type === 'give' && this.is(ev.to)) await this.hand.addToFan(ev.card, st.seatScreen(ev.from));
        if (!(ev.type === 'setAside' ? this.is(ev.pid) : this.is(ev.to))) await st.settleCard(ev.card, ev.type === 'give' ? ev.to : ev.pid, snap);
        st.layout(snap); this.sync(snap);
        if (ev.type === 'give') { sound.play('chance'); this.log(`${esc(this.who(ev.from))} → ${esc(this.who(ev.to))} · <b>Sursis</b>`); }
        await st.wait(300);
        break;

      case 'void':
        await st.settleCard(ev.card, 'fosse', snap);
        this.sync(snap);
        sound.play('freeze'); st.burst(ev.pid, 'ember', 70); st.flashDither('flash', 120);
        this.say('', ['La relique se refuse à ' + this.who(ev.pid) + '.'], 1800);
        await st.wait(700);
        break;

      case 'discard':
        if (this.is(ev.pid)) await this.hand.send(ev.card.id, st.fosseScreen());
        else await st.settleCard(ev.card, 'fosse', snap);
        this.sync(snap);
        break;

      case 'reshuffle':
        sound.play('reshuffle');
        st.setDeckCount(snap.deckCount);
        this.log('La Fosse retourne à l\'Ossuaire.', 'sys');
        await st.wait(700);
        break;

      case 'roundEnd':
        this.sync(snap);
        sound.setTension(0);
        st.focus = null;
        await this.showRoundEnd(ev, snap, { gate: this.gate !== false });
        break;

      case 'gameOver':
        this.sync(snap);
        if (this.onGameOver) { sound.play(ev.winner === this.you ? 'win' : 'lose'); if (ev.winner === this.you) { this.stage.flashDither('flash', 400); this.stage.ring(this.you); } else { this.stage.shake(0.05); this.stage.paletteFlash('sang', 2500); } await this.stage.wait(1600); this.onGameOver(ev, snap); break; }
        await this.showGameOver(ev, snap);
        break;
    }
  }

  async sweep() {
    const st = this.stage;
    const ms = [...st.cards.values()];
    if (!ms.length) return;
    sound.play('reshuffle');
    await Promise.all(ms.map((m, i) => st.wait(i * 25).then(() => st.moveCard(m, st.fossePos.clone().setY(st.fossePos.y + 0.04), m.quaternion.clone(), 300, { arc: 0.08 }))));
    for (const [id, m] of st.cards) { st.scene.remove(m); st.cards.delete(id); }
  }
  async tapTable() {
    const st = this.stage, R = st.R;
    st.handBusy = true;
    const p = st.poseR.pos.clone();
    await st.moveHand(R, { pos: p.clone().setY(p.y + 0.05), rot: st.poseR.rot, curl: 0.9 }, 160);
    await st.moveHand(R, { pos: p, rot: st.poseR.rot, curl: 0.9 }, 90);
    st.shake(0.008);
    await st.moveHand(R, st.poseR, 260);
    st.handBusy = false;
  }
  banner(text) {
    const b = $('#banner');
    b.innerHTML = `<span>${esc(text)}</span>`;
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  }

  // ── décisions du joueur local ─────────────────────────────
  askDecision() {
    const r = bustRisk(this.snap, this.you);
    sound.setTension(r * 1.6);
    this.hit.disabled = false; this.stay.disabled = false;
    $('#bar').classList.add('ready');
    this.stage.tapping = true;
    return new Promise((res) => { this.pending = res; });
  }
  decide(v) {
    if (!this.pending) return;
    sound.play('click');
    sound.setTension(0);
    this.hit.disabled = true; this.stay.disabled = true;
    $('#bar').classList.remove('ready');
    this.stage.tapping = false;
    if (v === 'hit') this.hand.stash();
    const r = this.pending; this.pending = null; r(v);
  }

  askTarget(kind, cands) {
    const label = { freeze: ['Givre', 'Désigne l\'âme à figer — toi compris.'], three: ['Trois Glas', 'Pour qui sonnera le glas ?'], give: ['Sursis', 'À qui offrir ton second Sursis ?'] }[kind] || ['Choisis', ''];
    this.say(label[0], [label[1]], 60000);
    for (const pid of cands) $(`#party [data-pid="${pid}"]`)?.classList.add('target');
    this.root.classList.add('targeting');
    return new Promise((res) => { this.pendingTarget = { res, cands }; });
  }
  pickTarget(pid) {
    const p = this.pendingTarget;
    if (!p || !p.cands.includes(pid)) return;
    sound.play('click');
    this.pendingTarget = null;
    document.querySelectorAll('#party .target').forEach((e) => e.classList.remove('target'));
    this.root.classList.remove('targeting');
    this.stage.setHover(null);
    $('#say').classList.remove('show');
    p.res(pid);
  }
  ndc(e) { const r = this.canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1]; }
  onMove(e) {
    const [x, y] = this.ndc(e);
    this.stage.mouse.x += (x - this.stage.mouse.x) * 0.5; this.stage.mouse.y += (y - this.stage.mouse.y) * 0.5;
    if (this.pendingTarget) {
      const pid = this.stage.pickAt(x, y);
      const ok = pid && this.pendingTarget.cands.includes(pid);
      this.stage.setHover(ok ? pid : null);
      this.canvas.style.cursor = ok ? 'pointer' : '';
    }
  }
  onClick(e) {
    if (!this.pendingTarget) return;
    const [x, y] = this.ndc(e);
    const pid = this.stage.pickAt(x, y);
    if (pid) this.pickTarget(pid);
  }
  cancelPrompts() {
    if (this.pending) this.decide('stay');
    if (this.pendingTarget) this.pickTarget(this.pendingTarget.cands[0]);
    if (this._continue) this._continue();
  }

  // ── tableaux ───────────────────────────────────────────────
  closeOverlay() { const o = $('#g-overlay'); o.className = 'hidden'; o.innerHTML = ''; this._continue = null; }
  rows(snap, results) {
    return [...snap.players].sort((a, b) => b.score - a.score).map((p) => {
      const r = results?.find((x) => x.pid === p.id);
      const before = p.score - (r?.pts || 0);
      return `<li class="${this.is(p.id) ? 'me' : ''}">
        <img alt="" src="${this.portraitOf(p, 40, 46)}">
        <span class="r-name">${esc(this.is(p.id) ? 'Toi' : (BESTIAIRE[p.persona]?.name || p.name))}</span>
        <span class="gauge big"><i class="g1" style="width:${(before / this.T()) * 100}%"></i><i class="g2" data-w="${Math.min(100 - (before / this.T()) * 100, ((r?.pts || 0) / this.T()) * 100)}" style="left:${(before / this.T()) * 100}%;width:0"></i></span>
        <span class="r-pts">${r ? (r.status === 'bust' ? icon('skull') : r.flip7 ? icon('seal') + '+' + r.pts : '+' + r.pts) : ''}</span>
        <b class="r-tot">${p.score}</b></li>`;
    }).join('');
  }
  showRoundEnd(ev, snap, { gate = true } = {}) {
    const o = $('#g-overlay');
    o.className = 'page-overlay';
    o.innerHTML = `<div class="sheet velin frame">
      <header class="sheet-h"><span class="orn">${icon('skull')}</span><h2>Le Décompte</h2><span class="orn">${icon('skull')}</span></header>
      <p class="sub">Fin de la manche ${roman(snap.round)}</p>
      <ol class="rows">${this.rows(snap, ev.results)}</ol>
      <button class="btn" data-go ${gate ? '' : 'disabled'}>${gate ? 'Manche suivante' : 'L\'hôte décide…'}</button></div>`;
    requestAnimationFrame(() => setTimeout(() => o.querySelectorAll('.g2[data-w]').forEach((i) => { i.style.width = i.dataset.w + '%'; }), 80));
    sound.play('stay');
    return new Promise((res) => {
      const done = () => { clearTimeout(tm); this._continue = null; if (gate) this.closeOverlay(); res(); };
      const tm = setTimeout(done, gate ? 14000 : 2500);
      if (gate) { o.querySelector('[data-go]').onclick = () => { sound.play('click'); done(); }; this._continue = done; }
    });
  }
  showGameOver(ev, snap) {
    const won = ev.winner === this.you;
    const w = snap.players.find((p) => p.id === ev.winner);
    sound.play(won ? 'win' : 'lose');
    if (won) { this.stage.flashDither('flash', 400); this.stage.ring(this.you); } else { this.stage.shake(0.05); this.stage.paletteFlash('sang', 2500); }
    const o = $('#g-overlay');
    o.className = 'page-overlay';
    o.innerHTML = `<div class="sheet ${won ? 'velin' : 'fange'} frame">
      <header class="sheet-h"><span class="orn">${icon(won ? 'seal' : 'skull')}</span><h2>${won ? 'La dalle se rouvre' : 'La Fange te garde'}</h2><span class="orn">${icon(won ? 'seal' : 'skull')}</span></header>
      <p class="sub">${won ? 'Deux cents âmes. Le Fossoyeur s\'écarte.' : esc((BESTIAIRE[w?.persona]?.name || w?.name || 'Un autre')) + ' a racheté sa chair.'}</p>
      <ol class="rows">${this.rows(snap, null)}</ol>
      <div class="btns">${this.canReplay ? '<button class="btn" data-again>Rejouer</button>' : ''}<button class="btn ghost" data-menu>Retour au guide</button></div></div>`;
    return new Promise((res) => {
      o.querySelector('[data-again]')?.addEventListener('click', () => { sound.play('click'); res(); this.onEnd?.('again'); });
      o.querySelector('[data-menu]').addEventListener('click', () => { sound.play('click'); res(); this.onEnd?.('menu'); });
    });
  }
}
