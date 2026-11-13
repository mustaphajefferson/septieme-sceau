// ─────────────────────────────────────────────────────────────
//  La partie : mise en scène des événements du moteur dans la
//  scène 3D + l'interface de la table (joueurs, actions, décompte).
// ─────────────────────────────────────────────────────────────
import { bustRisk, TARGET, FLIP7_BONUS } from './game.js';
import { Stage } from './stage.js';
import { sound } from './audio.js';
import { BESTIAIRE } from './lore.js';
import { wait } from './fx.js';
import { PALETTES } from './render.js';
import { portraitCanvas } from './gallery.js';
import { icon } from './icons.js';
import { bayer, abgr } from './dots.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = (v, T) => Math.max(0, Math.min(100, (v / T) * 100));

export class Play {
  constructor(dr) {
    this.dr = dr;
    this.stage = new Stage(dr);
    this.root = $('#game');
    this.canvas = dr.canvas;
    this.pending = null; this._continue = null;
    this.hit = $('#b-hit'); this.stay = $('#b-stay');
    this.hit.onclick = () => this.decide('hit');
    this.stay.onclick = () => this.decide('stay');
    addEventListener('keydown', (e) => {
      if (!this.root.classList.contains('on')) return;
      const k = e.key.toLowerCase();
      if (this.pending && (k === '1' || k === 'a' || k === ' ')) { e.preventDefault(); this.decide('hit'); }
      else if (this.pending && (k === '2' || k === 'r')) { e.preventDefault(); this.decide('stay'); }
      else if (this._continue && (k === 'enter' || k === ' ')) { e.preventDefault(); this._continue(); }
    });
    this.canvas.addEventListener('pointermove', (e) => { const [x, y] = this.ndc(e); this.stage.mouse.x += (x - this.stage.mouse.x) * 0.5; this.stage.mouse.y += (y - this.stage.mouse.y) * 0.5; });
    this.canvas.addEventListener('click', (e) => { if (!this.root.classList.contains('on')) return; const c = this.stage.cardAt(...this.ndc(e)); if (c) this.onInspect?.(c); });
  }
  ndc(e) { const r = this.canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1]; }

  // ── montage ────────────────────────────────────────────────
  mount(snap, you) {
    this.you = you; this.snap = snap;
    this.names = Object.fromEntries(snap.players.map((p) => [p.id, p.id === you ? 'Pèlerin' : BESTIAIRE[p.persona]?.name || p.name]));
    this.stage.setPlayers(snap.players, you);
    this.stage.holdR = false; this.stage.holdL = false;
    this.stage.layout(snap, { instant: true });
    this.stage.setDeckCount(snap.deckCount);
    this.buildParty(snap);
    this.closeOverlay();
    this.sync(snap);
    const foe = snap.players.find((p) => p.id !== you);
    const l = foe && this.creatureSay(foe.id, 'taunt'); if (l) this.say(l[0], [l[1]]);
  }
  T() { return this.snap?.target || TARGET; }
  who(pid) { return pid === this.you ? 'Toi' : this.names[pid] || '…'; }
  is(pid) { return pid === this.you; }
  creatureSay(pid, key) {
    const p = this.snap.players.find((x) => x.id === pid), b = p?.kind === 'ai' ? BESTIAIRE[p.persona] : null;
    return b?.say?.[key] ? [b.name, b.say[key]] : null;
  }

  // ── les deux joueurs, en haut à gauche ─────────────────────
  buildParty(snap) {
    const box = $('#party'); box.innerHTML = '';
    for (const p of [snap.players.find((q) => this.is(q.id)), ...snap.players.filter((q) => !this.is(q.id))]) {
      const el = document.createElement('div');
      el.className = 'pf' + (this.is(p.id) ? ' me' : ''); el.dataset.pid = p.id;
      el.innerHTML = `<span class="pf-face"><img alt="" src="${this.face(p)}"></span>
        <span class="pf-id"><span class="pf-name">${esc(this.names[p.id])}</span><span class="pf-tag"></span></span>
        <b class="pf-score"><span>0</span><small>/ ${this.T()}</small></b>
        <span class="gauge"><i class="g1"></i><i class="g2"></i></span>
        <span class="pf-cards"></span>`;
      box.appendChild(el);
    }
  }
  /** médaillon : le visage de la créature (ou du pèlerin), rendu tramé aux couleurs du lieu */
  face(p) {
    const pal = this.dr.paletteName in PALETTES ? this.dr.paletteName : 'velin', k = (p.persona || 'pelerin') + pal;
    this._faces ||= new Map();
    if (!this._faces.has(k)) { try { this._faces.set(k, portraitCanvas(this.dr, p.kind === 'ai' ? p.persona : 'pelerin', { palette: pal, w: 72, h: 84 }).toDataURL()); } catch { this._faces.set(k, ''); } }
    return this._faces.get(k);
  }
  sync(snap) {
    this.snap = snap;
    const T = this.T();
    for (const p of snap.players) {
      const pf = $(`#party [data-pid="${p.id}"]`); if (!pf) continue;
      const bust = p.status === 'bust', hand = bust ? 0 : p.hand;
      pf.classList.toggle('turn', snap.turn === p.id);
      pf.classList.toggle('bust', bust);
      const sc = pf.querySelector('.pf-score');
      if (sc.firstElementChild.textContent !== String(p.score)) { sc.firstElementChild.textContent = p.score; sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); }
      pf.querySelector('.g1').style.width = pct(p.score, T) + '%';
      const g2 = pf.querySelector('.g2'); g2.style.left = pct(p.score, T) + '%'; g2.style.width = Math.min(100 - pct(p.score, T), pct(hand, T)) + '%';
      pf.querySelector('.pf-tag').textContent = bust ? 'profané' : p.flip7 ? 'sept sceaux' : p.status === 'stayed' ? 'retiré' : snap.turn === p.id ? (this.is(p.id) ? 'à toi' : 'joue…') : '';
      // la liste des cartes : on n'ajoute que les nouvelles, pour qu'elles seules s'animent
      const box = pf.querySelector('.pf-cards'), n = p.nums.length, first = p.nums[0]?.id ?? null;
      if (first !== pf._first || n < (pf._n || 0)) box.innerHTML = '';
      box.querySelector('.pf-sum')?.remove(); box.querySelector('.pf-none')?.remove();
      const chips = box.querySelectorAll('.chip');
      p.nums.forEach((c, i) => { let ch = chips[i]; if (!ch) { ch = document.createElement('i'); ch.className = 'chip'; ch.textContent = c.v; box.appendChild(ch); } ch.classList.toggle('dup', !!c.dup); });
      pf._first = first; pf._n = n;
      if (n) { const sm = document.createElement('b'); sm.className = 'pf-sum'; sm.textContent = '+' + p.hand; box.appendChild(sm); } else box.innerHTML = '<span class="pf-none">aucune carte</span>';
      if (this.is(p.id)) {
        const r = p.status === 'active' && p.nums.length ? bustRisk(snap, p.id) : 0;
        this.hit.style.setProperty('--risk', Math.round(r * 100));
        this.hit.classList.toggle('hot', r >= 0.25);
        $('#risk-n').textContent = Math.round(r * 100);
        $('#keep-n').textContent = hand;
      }
    }
  }

  // ── boucle (appelée par main) ──────────────────────────────
  frame(dt) { this.stage.update(dt); this.stage.render(); }

  say(speaker, lines, ms = 2600) {
    const box = $('#say');
    box.innerHTML = (speaker ? `<span class="who">${esc(speaker)}</span>` : '') + lines.map((l) => `<span class="ln">${esc(l)}</span>`).join('');
    box.classList.remove('show'); void box.offsetWidth; box.classList.add('show');
    clearTimeout(this._sayT);
    this._sayT = setTimeout(() => box.classList.remove('show'), ms / this.stage.speed);
  }
  banner(text, sub = '') {
    const b = $('#banner');
    b.innerHTML = `<span>${esc(text)}</span>` + (sub ? `<small>${esc(sub)}</small>` : '');
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  }

  // ── événements ─────────────────────────────────────────────
  async present(ev, snap) {
    const st = this.stage;
    switch (ev.type) {
      case 'gameStart': this.sync(snap); await st.wait(600); break;

      case 'roundStart':
        this.closeOverlay();
        st.setHolding(false, false);
        await this.sweep();
        st.layout(snap, { instant: true });
        st.setDeckCount(snap.deckCount);
        this.sync(snap);
        sound.play('toll');
        this.banner('Manche ' + ev.round);
        await st.wait(1000);
        break;

      case 'turn': st.focus = ev.pid; this.sync(snap); break;

      case 'reveal':
        st.focus = ev.pid;
        this.sync(snap);
        sound.play('whoosh');
        if (this.is(ev.pid)) { await st.meDrawTable(ev.card); sound.play('flip'); await st.wait(380); }
        else { await st.oppDraw(ev.pid, ev.card); sound.play('flip'); await st.wait(420); }
        break;

      case 'gain':
        await st.settleCard(ev.card, ev.pid, snap);
        st.layout(snap); this.sync(snap);
        sound.play('gain');
        break;

      case 'bust': {
        await st.settleCard(ev.card, ev.pid, snap);
        st.layout(snap); this.sync(snap);
        sound.play('bust');
        st.shake(0.04); st.flashDither('invert', 140); st.burst(ev.pid, 'ember', 110);
        st.paletteFlash('sang', 1300);
        const s = st.seats.get(ev.pid); if (s) s.mood = 1;
        setTimeout(() => { if (s) s.mood = 0; }, 1500);
        const foeId = this.snap.players.find((p) => !this.is(p.id))?.id;
        const line = this.is(ev.pid) ? this.creatureSay(foeId, 'win') || ['', 'Elles se sont reconnues.'] : this.creatureSay(ev.pid, 'bust') || ['', 'Profanation.'];
        this.say(line[0], [line[1]]);
        await st.wait(1500);
        break;
      }

      case 'flip7':
        this.sync(snap);
        sound.play('flip7'); st.flashDither('flash', 260); st.ring(ev.pid);
        this.banner('Les Sept Sceaux');
        this.say('', [`${this.who(ev.pid)} : sept cartes, +${FLIP7_BONUS}`], 2200);
        await st.wait(1800);
        break;

      case 'stay':
        st.layout(snap); this.sync(snap);
        sound.play('stay');
        if (!this.is(ev.pid)) { const l = this.creatureSay(ev.pid, 'stay'); if (l && Math.random() < 0.5) this.say(l[0], [l[1]], 1800); }
        await st.wait(500);
        break;

      case 'discard': await st.settleCard(ev.card, 'fosse', snap); this.sync(snap); break;

      case 'reshuffle':
        sound.play('reshuffle');
        st.setDeckCount(snap.deckCount);
        await st.wait(700);
        break;

      case 'roundEnd':
        this.sync(snap);
        sound.setTension(0);
        st.focus = null;
        await this.showRoundEnd(ev, snap);
        break;

      case 'gameOver': {
        this.sync(snap);
        const won = ev.winner === this.you;
        sound.play(won ? 'win' : 'lose');
        if (won) { st.flashDither('flash', 400); st.ring(this.you); } else { st.shake(0.05); st.paletteFlash('sang', 2500); }
        await st.wait(1600);
        this.onGameOver?.(ev, snap);
        break;
      }

      default: this.sync(snap); // cartes spéciales (désactivées pour l'instant)
    }
  }

  async sweep() {
    const st = this.stage, ms = [...st.cards.values()];
    if (!ms.length) return;
    sound.play('reshuffle');
    await Promise.all(ms.map((m, i) => st.wait(i * 25).then(() => st.moveCard(m, st.fossePos.clone().setY(st.fossePos.y + 0.04), m.quaternion.clone(), 300, { arc: 0.08 }))));
    for (const [id, m] of st.cards) { st.scene.remove(m); st.cards.delete(id); }
  }

  // ── décisions du joueur ────────────────────────────────────
  askDecision() {
    sound.setTension(bustRisk(this.snap, this.you) * 1.6);
    this.hit.disabled = false; this.stay.disabled = false;
    $('#bar').classList.add('ready');
    this.stage.tapping = true;
    return new Promise((res) => { this.pending = res; });
  }
  decide(v) {
    if (!this.pending) return;
    const b = v === 'hit' ? this.hit : this.stay; b.classList.remove('press'); void b.offsetWidth; b.classList.add('press'); setTimeout(() => b.classList.remove('press'), 320);
    sound.play('click'); sound.setTension(0);
    this.hit.disabled = true; this.stay.disabled = true;
    $('#bar').classList.remove('ready');
    this.stage.tapping = false;
    const r = this.pending; this.pending = null; r(v);
  }
  askTarget(kind, cands) { return Promise.resolve(cands[0]); }
  cancelPrompts() {
    if (this.pending) this.decide('stay');
    if (this._continue) this._continue();
  }

  // ── le décompte de fin de manche ───────────────────────────
  // rayons tournants derrière, titre lettre à lettre, chaque carte rejouée
  // sur la plaque de son joueur, total qui grimpe, sceau « Profané » qui s'abat
  closeOverlay() { const o = $('#g-overlay'); o.className = 'hidden'; o.innerHTML = ''; this._continue = null; cancelAnimationFrame(this._raysF); }
  showRoundEnd(ev, snap) {
    const o = $('#g-overlay'), T = this.T();
    const order = [snap.players.find((p) => this.is(p.id)), ...snap.players.filter((p) => !this.is(p.id))];
    const lead = Math.max(...snap.players.map((p) => p.score));
    o.className = 'tally-on';
    const title = 'Le Décompte'.split('').map((ch, i) => (ch === ' ' ? ' ' : `<i style="animation-delay:${(0.15 + i * 0.05).toFixed(2)}s">${ch}</i>`)).join('');
    o.innerHTML = `<canvas class="tl-rays"></canvas><div class="tally"><h2 class="tl-title">${title}</h2><br><p class="tl-sub">Manche ${snap.round} · premier à ${T}</p>
      ${order.map((p, k) => {
        const r = ev.results.find((x) => x.pid === p.id) || { pts: 0 }, before = p.score - r.pts;
        return `<div class="tl-row" data-pid="${p.id}" style="--d:${(0.7 + k * 0.25).toFixed(2)}s">
          <span class="tl-face"><img alt="" src="${this.face(p)}"></span>
          <b class="tl-name">${esc(this.who(p.id))}</b>
          <b class="tl-pts">${r.status === 'bust' ? '' : '+0'}</b>
          <span class="tl-cards">${p.nums.map((c) => `<i class="chip${c.dup ? ' dup' : ''}">${c.v}</i>`).join('')}</span>
          <div class="tl-foot"><span class="gauge"><i class="g1" style="width:${pct(before, T)}%"></i><i class="g2" style="left:${pct(before, T)}%"></i></span>
            <span class="tl-tot"><b>${before}</b> / ${T}</span></div>
        </div>`;
      }).join('')}
      <button class="dbtn warm" data-go><span>Manche suivante</span></button></div>`;
    this.rays(o.querySelector('.tl-rays'));
    sound.play('toll');
    // la mise en scène, joueur après joueur
    let alive = true;
    const W = (ms) => new Promise((r) => setTimeout(r, ms));
    const count = (el, from, to, dur) => new Promise((res) => { const t0 = performance.now(); const step = (now) => { if (!alive) return res(); const k = Math.min(1, (now - t0) / dur); el.textContent = Math.round(from + (to - from) * k); if (k < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
    const bump = (el) => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };
    const fly = (from, txt) => { const r = from.getBoundingClientRect(), f = document.createElement('b'); f.className = 'fly-num'; f.textContent = txt; f.style.left = r.left + r.width / 2 + 'px'; f.style.top = r.top + 'px'; document.body.appendChild(f); setTimeout(() => f.remove(), 800); };
    const show = async () => {
      await W(1100);
      for (const p of order) {
        if (!alive) return;
        const row = o.querySelector(`.tl-row[data-pid="${p.id}"]`), r = ev.results.find((x) => x.pid === p.id) || { pts: 0 }, bust = r.status === 'bust', before = p.score - r.pts;
        const pts = row.querySelector('.tl-pts'), chips = [...row.querySelectorAll('.chip')];
        let run = 0;
        for (const ch of chips) {
          if (!alive) return;
          ch.classList.add('go'); sound.play('flip');
          await W(230);
          if (!bust && !ch.classList.contains('dup')) { run += +ch.textContent; pts.textContent = '+' + run; bump(pts); fly(ch, '+' + ch.textContent); }
        }
        if (bust) {
          await W(250);
          const st = document.createElement('em'); st.className = 'tl-stamp'; st.textContent = 'Profané'; row.appendChild(st);
          sound.play('bust'); this.stage.shake(0.03);
          const box = o.querySelector('.tally'); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
          await W(700);
          continue;
        }
        if (r.flip7) { const se = document.createElement('em'); se.className = 'tl-seal'; se.innerHTML = 'Sept<br>sceaux'; row.appendChild(se); sound.play('flip7'); await W(500); }
        if (r.pts !== run) { pts.textContent = '+' + r.pts; bump(pts); }
        await W(200);
        // la mise rejoint le total
        const tot = row.querySelector('.tl-tot b'), g2 = row.querySelector('.g2');
        g2.style.width = Math.min(100 - pct(before, T), pct(r.pts, T)) + '%';
        if (r.pts) sound.play('gain');
        await count(tot, before, p.score, 500 + Math.min(700, r.pts * 14));
        bump(tot);
        await W(300);
      }
      if (!alive) return;
      // couronne au meneur
      const best = order.filter((p) => p.score === lead && lead > 0);
      if (best.length === 1) { const row = o.querySelector(`.tl-row[data-pid="${best[0].id}"]`); row.classList.add('win'); row.insertAdjacentHTML('beforeend', `<span class="tl-crown">${icon('crown')}</span>`); sound.play('stay'); }
      o.querySelector('[data-go]').classList.add('go');
    };
    return new Promise((res) => {
      const done = () => { alive = false; clearTimeout(tm); this._continue = null; this.closeOverlay(); res(); };
      const tm = setTimeout(done, 25000);
      o.querySelector('[data-go]').onclick = () => { sound.play('click'); done(); };
      this._continue = done;
      show();
    });
  }
  /** rayons tramés qui tournent lentement (fond du décompte) */
  rays(cv) {
    const P = PALETTES[this.dr.paletteName] || PALETTES.velin, px = Math.max(3, Math.round(Math.min(innerWidth, innerHeight) / 200));
    const W = (cv.width = Math.ceil(innerWidth / px)), H = (cv.height = Math.ceil(innerHeight / px)), ctx = cv.getContext('2d'), img = ctx.createImageData(W, H), buf = new Uint32Array(img.data.buffer);
    const ang = new Float32Array(W * H), rad = new Float32Array(W * H), bay = new Uint8Array(W * H), m = Math.hypot(W / 2, H / 2);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, dx = x - W / 2, dy = y - H * 0.42; ang[i] = Math.atan2(dy, dx); rad[i] = Math.hypot(dx, dy) / m; bay[i] = bayer(x, y); }
    const C0 = abgr(P.ramp[0]), C1 = abgr(P.ramp[1]), C2 = abgr(P.ramp[2]);
    const t0 = performance.now();
    const step = (now) => {
      if (!cv.isConnected) return;
      const t = (now - t0) / 1000, grow = Math.min(1, t / 1.2);
      for (let i = 0; i < buf.length; i++) {
        const r = rad[i], ray = Math.sin(ang[i] * 9 + t * 0.25) * 0.5 + 0.5, v = ray * ray * (1.1 - r) * grow, b = bay[i];
        buf[i] = v * 70 > b + 2 ? (v * 26 > b ? C2 : C1) : C0;
      }
      ctx.putImageData(img, 0, 0);
      this._raysF = requestAnimationFrame(step);
    };
    this._raysF = requestAnimationFrame(step);
  }
}
