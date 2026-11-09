// ─────────────────────────────────────────────────────────────
//  La table : rendu de l'état, mise en scène des événements,
//  saisie des décisions du joueur local.
// ─────────────────────────────────────────────────────────────
import { bustRisk, roman, cardTitle, TARGET, FLIP7_BONUS } from './game.js';
import { makeCard, portraitFor } from './cards.js';
import { sound } from './audio.js';
import { burst, ring, rise, flash, shake, scramble, wait } from './fx.js';

const $ = (s, r = document) => r.querySelector(s);
const STATUS = { active: '', stayed: 'RETIRÉ', frozen: 'FIGÉ', bust: 'PROFANÉ' };

export class TableView {
  constructor() {
    this.root = $('#table');
    this.opps = $('#opps');
    this.me = $('#me');
    this.myHand = $('#my-hand');
    this.narrEl = $('#narr-line');
    this.overlay = $('#overlay');
    this.hit = $('#b-hit');
    this.stay = $('#b-stay');
    this.speed = 1;
    this.showRisk = true;
    this.floating = null;
    this.pendingDecision = null;
    this.pendingTarget = null;
    this.hit.onclick = () => this.resolveDecision('hit');
    this.stay.onclick = () => this.resolveDecision('stay');
    this.hit.onmouseenter = this.stay.onmouseenter = () => sound.play('hover');
    addEventListener('keydown', (e) => {
      if (!this.root.classList.contains('on') || e.target.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (this.pendingDecision && (k === 'a' || k === ' ')) { e.preventDefault(); this.resolveDecision('hit'); }
      if (this.pendingDecision && (k === 'r' || k === 'enter')) { e.preventDefault(); this.resolveDecision('stay'); }
      if (this._continue && (k === 'enter' || k === ' ')) { e.preventDefault(); this._continue(); }
    });
  }

  // ── montage ────────────────────────────────────────────────
  mount(snap, you) {
    this.you = you;
    this.snap = snap;
    this.names = Object.fromEntries(snap.players.map((p) => [p.id, p.name]));
    const idx = snap.players.findIndex((p) => p.id === you);
    const others = [...snap.players.slice(idx + 1), ...snap.players.slice(0, Math.max(idx, 0))];
    this.opps.innerHTML = '';
    for (const p of others) {
      const el = document.createElement('div');
      el.className = 'opp seat';
      el.dataset.pid = p.id;
      const persona = p.kind === 'ai' ? p.persona : 'human';
      el.innerHTML = `
        <pre class="portrait">${portraitFor(persona)}</pre>
        <div class="opp-name"><span>${p.name}</span><span class="tag"></span></div>
        <div class="opp-sub">${p.kind === 'ai' ? (p.epithet || '') : 'âme vivante'}</div>
        <div class="opp-stats"><span>TOTAL <b data-k="total">0</b></span><span>MAIN <b data-k="hand">0</b></span></div>
        <div class="bar"><i data-k="bar1"></i><i data-k="bar2"></i></div>
        <div class="mini-hand"></div>`;
      el.onclick = () => this.pickTarget(p.id);
      this.opps.appendChild(el);
    }
    this.me.dataset.pid = you;
    this.me.onclick = (e) => { if (e.target.closest('.btn')) return; this.pickTarget(you); };
    $('#me-name').textContent = this.names[you] || 'TOI';
    this.myHand.innerHTML = '';
    this.setDeck($('#deck .stack'), true);
    $('#fosse .stack').innerHTML = '';
    this.overlay.className = 'hidden'; this.overlay.innerHTML = '';
    this.narr('La Mort pose l\'Ossuaire sur la table.', 'QUE LA PARTIE COMMENCE');
    this.sync(snap);
  }

  setDeck(stack, full) {
    stack.innerHTML = '';
    const n = full ? 4 : 0;
    for (let i = 0; i < n; i++) {
      const c = makeCard(null, { down: true });
      c.style.transform = `translate(${i * -2}px, ${i * -2}px)`;
      stack.appendChild(c);
    }
  }

  seat(pid) { return pid === this.you ? this.me : this.opps.querySelector(`[data-pid="${pid}"]`); }
  handOf(pid) { return pid === this.you ? this.myHand : this.seat(pid)?.querySelector('.mini-hand'); }
  who(pid) { return pid === this.you ? 'TOI' : this.names[pid] || '…'; }
  is(pid) { return pid === this.you; }

  // ── synchronisation (idempotente) ─────────────────────────
  sync(snap, { hide = null } = {}) {
    this.snap = snap;
    $('#deck-count').textContent = snap.deckCount;
    $('#fosse-count').textContent = snap.discard.length;
    const fs = $('#fosse .stack');
    const top = snap.discardTop;
    if (!top) fs.innerHTML = '';
    else if (fs.firstChild?.dataset.id !== top.id) { fs.innerHTML = ''; fs.appendChild(makeCard(top)); }
    $('#deck .stack').style.visibility = snap.deckCount ? 'visible' : 'hidden';

    for (const p of snap.players) {
      const seat = this.seat(p.id);
      if (!seat) continue;
      seat.classList.toggle('turn', snap.turn === p.id);
      seat.classList.toggle('out', p.status !== 'active');
      const tag = seat.querySelector('.tag');
      const st = p.flip7 ? 'VII SCEAUX' : STATUS[p.status];
      tag.textContent = st; tag.className = 'tag' + (p.status === 'bust' ? ' bust' : '');
      if (this.is(p.id)) {
        $('#me-total').textContent = p.score;
        $('#me-hand').textContent = p.hand;
        const r = p.status === 'active' ? bustRisk(snap, p.id) : 0;
        const rEl = $('#me-risk');
        rEl.style.display = this.showRisk ? '' : 'none';
        rEl.querySelector('b').textContent = Math.round(r * 100) + '%';
        rEl.classList.toggle('hot', r >= 0.3);
      } else {
        seat.querySelector('[data-k=total]').textContent = p.score;
        seat.querySelector('[data-k=hand]').textContent = p.hand;
        seat.querySelector('[data-k=bar1]').style.width = Math.min(100, (p.score / TARGET) * 100) + '%';
        const b2 = seat.querySelector('[data-k=bar2]');
        b2.style.left = Math.min(100, (p.score / TARGET) * 100) + '%';
        b2.style.width = Math.max(0, Math.min(100 - (p.score / TARGET) * 100, (p.hand / TARGET) * 100)) + '%';
      }
      this.syncHand(p, hide);
    }
  }

  syncHand(p, hide) {
    const box = this.handOf(p.id);
    if (!box) return;
    const mini = !this.is(p.id);
    const want = [...p.nums, ...(p.mods.length ? ['gap'] : []), ...p.mods, ...(p.chance || p.used.length ? ['gap'] : []), ...(p.chance ? [p.chance] : []), ...p.used];
    const keep = new Set();
    let prev = null;
    for (const c of want) {
      let el;
      if (c === 'gap') { el = document.createElement('i'); el.className = 'gap'; }
      else {
        el = box.querySelector(`[data-id="${c.id}"]`);
        if (!el) { el = makeCard(c, { mini }); }
        el.classList.toggle('dup', !!c.dup);
        el.classList.toggle('burnt', p.status === 'bust' && !c.dup);
        el.style.visibility = hide && hide === c.id ? 'hidden' : '';
        keep.add(el);
      }
      if (c === 'gap') keep.add(el);
      const next = prev ? prev.nextSibling : box.firstChild;
      if (next !== el) box.insertBefore(el, next);
      prev = el;
    }
    for (const el of [...box.children]) if (!keep.has(el)) el.remove();
  }

  // ── narration ──────────────────────────────────────────────
  narr(text, sub = '') {
    this.narrEl.innerHTML = '';
    const t = document.createElement('span');
    this.narrEl.appendChild(t);
    t.textContent = text;
    t.animate([{ opacity: 0, filter: 'blur(4px)', transform: 'translateY(6px)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }], { duration: 420 / this.speed, easing: 'ease-out' });
    if (sub) { const s = document.createElement('small'); s.textContent = sub; this.narrEl.appendChild(s); scramble(s, sub, 500); }
  }

  // ── cartes volantes ────────────────────────────────────────
  centerRect() {
    const d = $('#deck .stack').getBoundingClientRect();
    const n = $('#narr').getBoundingClientRect();
    const w = d.width * 1.25, h = d.height * 1.25;
    return { left: n.left + n.width / 2 - w / 2, top: n.top + n.height / 2 - h / 2 - 6, width: w, height: h };
  }

  async fly(el, from, to, { dur = 420, flipTo = null } = {}) {
    const fs = from.width / 7.4;
    Object.assign(el.style, { position: 'fixed', left: from.left + 'px', top: from.top + 'px', fontSize: fs + 'px', margin: 0, zIndex: 30, transformOrigin: '0 0' });
    el.classList.add('flying');
    if (!el.isConnected) document.body.appendChild(el);
    const s = to.width / from.width;
    const dx = to.left - from.left, dy = to.top - from.top;
    const a = el.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)' },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 30}px) scale(${(1 + s) / 2 * 1.05}) rotate(${dx > 0 ? 4 : -4}deg)`, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(0deg)` },
    ], { duration: dur / this.speed, easing: 'cubic-bezier(.3,.6,.2,1)', fill: 'forwards' });
    if (flipTo !== null) setTimeout(() => el.classList.toggle('down', flipTo === 'down'), dur * 0.45 / this.speed);
    await a.finished.catch(() => {});
    return el;
  }

  async revealCard(card, pid) {
    const deck = $('#deck .stack').getBoundingClientRect();
    const el = makeCard(card, { down: true });
    this.floating?.el.remove();
    this.floating = { el, card, pid };
    sound.play('whoosh');
    await this.fly(el, deck, this.centerRect(), { dur: 440 });
    el.style.transform = '';
    el.getAnimations().forEach((a) => { a.commitStyles?.(); a.cancel(); });
    const c = this.centerRect();
    Object.assign(el.style, { left: c.left + 'px', top: c.top + 'px', fontSize: c.width / 7.4 + 'px', transform: '' });
    await wait(60);
    el.classList.remove('down');
    sound.play('flip');
    const name = cardTitle(card);
    const sub = card.t === 'n' ? `ÂME DE RANG ${roman(card.v)} · ${card.v}` : card.t === 'a' ? 'ACTE' : 'OBOLE';
    this.narr(`${this.is(pid) ? 'Tu arraches' : this.who(pid) + ' arrache'} « ${name} »`, sub);
    await wait(this.is(pid) ? 620 : 520);
  }

  // fait atterrir la carte flottante sur sa destination (après sync)
  async settle(destEl, { dur = 380 } = {}) {
    const f = this.floating;
    if (!f) return;
    this.floating = null;
    const from = f.el.getBoundingClientRect();
    if (!destEl) destEl = $('#fosse .stack');
    const to = destEl.getBoundingClientRect();
    if (destEl.classList?.contains('card')) destEl.style.visibility = 'hidden';
    await this.fly(f.el, from, to.width ? to : from, { dur });
    f.el.remove();
    if (destEl.classList?.contains('card')) destEl.style.visibility = '';
  }

  cardEl(pid, id) { return this.handOf(pid)?.querySelector(`[data-id="${id}"]`); }
  seatCenter(pid) {
    const h = this.handOf(pid) || this.seat(pid);
    const r = (h?.lastElementChild || h)?.getBoundingClientRect?.() || { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    return [r.left + r.width / 2, r.top + r.height / 2];
  }

  // ── mise en scène des événements ───────────────────────────
  async present(ev, snap) {
    const S = this.speed;
    switch (ev.type) {
      case 'gameStart':
        this.sync(snap);
        await wait(500 / S);
        break;

      case 'roundStart': {
        this.overlay.className = 'hidden'; this.overlay.innerHTML = '';
        this._continue = null;
        const r = $('#t-round');
        scramble(r, 'MANCHE ' + roman(ev.round));
        this.sync(snap);
        sound.play('toll');
        this.narr(ev.round === 1 ? 'La Mort distribue la première âme à chacun.' : 'Les âmes retournent à la fosse. La Mort distribue.', 'MANCHE ' + roman(ev.round));
        await wait(1100 / S);
        break;
      }

      case 'turn':
        this.sync(snap);
        if (this.is(ev.pid)) { this.narr('À toi. Arrache une âme, ou retire-toi.', 'TON TOUR'); }
        else this.narr(`${this.who(ev.pid)} contemple l'Ossuaire…`, '');
        break;

      case 'reveal':
        this.sync(snap);
        await this.revealCard(ev.card, ev.pid);
        break;

      case 'gain': {
        this.sync(snap, { hide: ev.card.id });
        const dest = this.cardEl(ev.pid, ev.card.id);
        await this.settle(dest);
        sound.play('gain');
        const [x, y] = this.seatCenter(ev.pid);
        rise(x, y - 30, ev.card.t === 'n' ? '+' + ev.card.v : ev.card.t === 'x' ? '×2' : ev.card.t === 'm' ? '+' + ev.card.v : 'SURSIS');
        this.sync(snap);
        await wait(140 / S);
        break;
      }

      case 'bust': {
        this.sync(snap, { hide: ev.card.id });
        await this.settle(this.cardEl(ev.pid, ev.card.id));
        this.sync(snap);
        sound.play('bust');
        flash(140); shake();
        const [x, y] = this.seatCenter(ev.pid);
        burst(x, y, { n: 110, speed: 520 });
        this.narr(`PROFANATION. Deux âmes de rang ${roman(ev.value)} se reconnaissent — ${this.is(ev.pid) ? 'elles te déchirent' : 'elles déchirent ' + this.who(ev.pid)}.`, 'MAIN PERDUE · 0 ÂME');
        await wait(1500 / S);
        break;
      }

      case 'saved': {
        await this.settle($('#fosse .stack'));
        this.sync(snap);
        sound.play('chance');
        const [x, y] = this.seatCenter(ev.pid);
        burst(x, y, { n: 40, speed: 260, chars: '+*.' });
        this.narr(`Le Sursis se consume. ${this.is(ev.pid) ? 'Tu es épargné' : this.who(ev.pid) + ' est épargné'} — pour cette fois.`, 'SURSIS UTILISÉ');
        await wait(1100 / S);
        break;
      }

      case 'flip7': {
        this.sync(snap);
        sound.play('flip7');
        flash(260);
        const [x, y] = this.seatCenter(ev.pid);
        ring(x, y, { r: 160 });
        this.narr(`LES SEPT SCEAUX SONT BRISÉS. ${this.is(ev.pid) ? 'La Mort recule devant toi' : 'La Mort recule devant ' + this.who(ev.pid)}.`, `+${FLIP7_BONUS} ÂMES · FIN DE LA MANCHE`);
        await wait(2000 / S);
        break;
      }

      case 'stay': {
        this.sync(snap);
        sound.play('stay');
        const p = snap.players.find((q) => q.id === ev.pid);
        this.narr(this.is(ev.pid) ? `Tu te retires avec ${p.hand} âmes.` : `${this.who(ev.pid)} se retire avec ${p.hand} âmes.`, 'MAIN SCELLÉE');
        await wait(650 / S);
        break;
      }

      case 'freeze': {
        const t = this.seat(ev.to);
        await this.settle(t);
        this.sync(snap);
        sound.play('freeze');
        const [x, y] = this.seatCenter(ev.to);
        burst(x, y, { n: 60, speed: 300, g: -40, chars: '*+.·', life: 1.8 });
        this.narr(ev.to === ev.from
          ? `${this.is(ev.from) ? 'Tu te figes' : this.who(ev.from) + ' se fige'} dans le Givre, la main serrée.`
          : `${this.is(ev.from) ? 'Tu figes' : this.who(ev.from) + ' fige'} ${this.is(ev.to) ? 'ton âme' : this.who(ev.to)} dans le Givre.`, 'GIVRE · LA MAIN EST ENCAISSÉE');
        await wait(1100 / S);
        break;
      }

      case 'three': {
        await this.settle(this.seat(ev.to));
        this.sync(snap);
        sound.play('three');
        this.narr(`${this.is(ev.from) ? 'Tu sonnes' : this.who(ev.from) + ' sonne'} les Trois Glas pour ${this.is(ev.to) ? 'toi' : this.who(ev.to)}.`, 'TROIS ÂMES, SANS REFUS POSSIBLE');
        await wait(1500 / S);
        break;
      }

      case 'toll':
        this.sync(snap);
        this.narr(`${['Premier', 'Deuxième', 'Troisième'][ev.n - 1]} glas…`, 'LES TROIS GLAS');
        await wait(300 / S);
        break;

      case 'setAside':
        this.sync(snap, { hide: ev.card.id });
        await this.settle(this.cardEl(ev.pid, ev.card.id));
        this.sync(snap);
        this.narr('L\'acte attendra la fin des glas.', 'POSÉ DE CÔTÉ');
        await wait(500 / S);
        break;

      case 'give':
        this.sync(snap, { hide: ev.card.id });
        await this.settle(this.cardEl(ev.to, ev.card.id));
        this.sync(snap);
        sound.play('chance');
        this.narr(`${this.is(ev.from) ? 'Tu offres' : this.who(ev.from) + ' offre'} un Sursis à ${this.is(ev.to) ? 'toi' : this.who(ev.to)}.`, 'SURSIS');
        await wait(900 / S);
        break;

      case 'discard':
        await this.settle($('#fosse .stack'));
        this.sync(snap);
        break;

      case 'reshuffle':
        sound.play('reshuffle');
        this.narr('La fosse retourne à l\'Ossuaire.', 'L\'OSSUAIRE EST REBATTU');
        this.sync(snap);
        await wait(900 / S);
        break;

      case 'roundEnd':
        this.sync(snap);
        sound.setTension(0);
        await this.showRoundEnd(ev, snap);
        break;

      case 'gameOver':
        this.sync(snap);
        await this.showGameOver(ev, snap);
        break;
    }
  }

  // ── décisions du joueur local ─────────────────────────────
  askDecision() {
    const snap = this.snap;
    const r = bustRisk(snap, this.you);
    sound.setTension(r * 1.6);
    this.hit.disabled = false; this.stay.disabled = false;
    this.me.classList.add('turn');
    return new Promise((res) => { this.pendingDecision = res; });
  }
  resolveDecision(v) {
    if (!this.pendingDecision) return;
    sound.play('click');
    sound.setTension(0);
    this.hit.disabled = true; this.stay.disabled = true;
    const r = this.pendingDecision; this.pendingDecision = null; r(v);
  }

  askTarget(kind, cands) {
    const label = { freeze: ['GIVRE', 'Qui figeras-tu ? (toi compris)'], three: ['LES TROIS GLAS', 'Pour qui sonnera le glas ?'], give: ['SURSIS', 'À qui offrir ton second Sursis ?'] }[kind] || ['CHOISIS', ''];
    this.overlay.className = 'thin';
    this.overlay.innerHTML = `<div class="target-banner">${label[0]} — CHOISIS UNE CIBLE<em>${label[1]}</em></div>`;
    for (const pid of cands) this.seat(pid)?.classList.add('target');
    this.narr(label[1], 'CLIQUE SUR UN JOUEUR');
    return new Promise((res) => { this.pendingTarget = { res, cands }; });
  }
  pickTarget(pid) {
    const p = this.pendingTarget;
    if (!p || !p.cands.includes(pid)) return;
    sound.play('click');
    this.pendingTarget = null;
    document.querySelectorAll('.seat.target').forEach((e) => e.classList.remove('target'));
    this.overlay.className = 'hidden'; this.overlay.innerHTML = '';
    p.res(pid);
  }
  cancelPrompts(fallback = 'stay') {
    if (this.pendingDecision) this.resolveDecision(fallback);
    if (this.pendingTarget) this.pickTarget(this.pendingTarget.cands[0]);
    if (this._continue) this._continue();
  }

  // ── fin de manche / fin de partie ─────────────────────────
  scoreRows(snap, results) {
    const max = Math.max(TARGET, ...snap.players.map((p) => p.score));
    return snap.players.map((p) => {
      const r = results?.find((x) => x.pid === p.id);
      const before = p.score - (r?.pts || 0);
      return `<div class="score-row">
        <span>${this.is(p.id) ? 'TOI' : p.name}</span>
        <span class="sbar"><i style="width:${(before / max) * 100}%"></i><i class="add" data-w="${(r?.pts || 0) / max * 100}" style="left:${(before / max) * 100}%;width:0"></i></span>
        <span class="pts">${r ? (r.status === 'bust' ? 'PROF.' : '+' + r.pts) : ''}</span>
        <span class="tot">${p.score}</span></div>`;
    }).join('');
  }

  showRoundEnd(ev, snap, { gate = true } = {}) {
    const mine = ev.results.find((r) => r.pid === this.you);
    const q = mine?.status === 'bust' ? 'Tes âmes se sont déchirées. Rien n\'est gagné.'
      : mine?.flip7 ? 'Les sept sceaux ont cédé sous tes doigts.'
        : `Tu gardes ${mine?.pts ?? 0} âmes pour ta rançon.`;
    this.overlay.className = '';
    this.overlay.innerHTML = `<div class="ov-box">
      <p class="kicker">FIN DE LA MANCHE ${roman(snap.round)}</p>
      <h2>Le Décompte</h2>
      <p class="q">${q}</p>
      <div class="score-rows">${this.scoreRows(snap, ev.results)}</div>
      <button class="btn" data-continue>${gate ? 'MANCHE SUIVANTE' : 'EN ATTENTE DE L\'HÔTE…'}</button></div>`;
    requestAnimationFrame(() => setTimeout(() => this.overlay.querySelectorAll('i.add').forEach((i) => { i.style.width = i.dataset.w + '%'; }), 60));
    sound.play('stay');
    return new Promise((res) => {
      const done = () => { this._continue = null; clearTimeout(tm); if (gate) { this.overlay.className = 'hidden'; this.overlay.innerHTML = ''; } res(); };
      const tm = setTimeout(done, gate ? 12000 : 2500);
      const b = this.overlay.querySelector('[data-continue]');
      if (gate) { b.onclick = () => { sound.play('click'); done(); }; this._continue = done; }
      else b.disabled = true;
    });
  }

  showGameOver(ev, snap) {
    const won = ev.winner === this.you;
    const w = snap.players.find((p) => p.id === ev.winner);
    sound.play(won ? 'win' : 'lose');
    if (won) { flash(300); ring(innerWidth / 2, innerHeight / 2, { r: 220 }); } else { shake(); burst(innerWidth / 2, innerHeight / 2, { n: 160, speed: 600 }); }
    this.overlay.className = '';
    this.overlay.innerHTML = `<div class="ov-box">
      <p class="kicker">${won ? 'LE PACTE EST HONORÉ' : 'LE PACTE EST ROMPU'}</p>
      <h2>${won ? 'Tu vivras' : 'La Mort t\'emporte'}</h2>
      <p class="q">${won ? 'Deux cents âmes. La Mort repousse sa chaise et te rend ta vie. Elle reviendra.' : `${w?.name || 'Un autre'} a racheté sa vie. La tienne reste dans l'Ossuaire.`}</p>
      <div class="score-rows">${this.scoreRows(snap, null)}</div>
      <div class="row" style="display:flex;gap:10px;justify-content:center">
        ${this.canReplay ? '<button class="btn" data-again>REJOUER</button>' : ''}
        <button class="btn ghost" data-menu>RETOUR AU MENU</button></div></div>`;
    return new Promise((res) => {
      this.overlay.querySelector('[data-again]')?.addEventListener('click', () => { sound.play('click'); res('again'); this.onEnd?.('again'); });
      this.overlay.querySelector('[data-menu]').addEventListener('click', () => { sound.play('click'); res('menu'); this.onEnd?.('menu'); });
    });
  }
}
