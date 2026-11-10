// ─────────────────────────────────────────────────────────────
//  VII — LE SEPTIÈME SCEAU · moteur de règles
//  Règles de base : Flip 7 (94 cartes, objectif 200).
//  Le moteur est asynchrone : il attend les décisions des
//  contrôleurs (humain, IA, joueur distant) et les animations
//  du "presenter" avant de continuer.
// ─────────────────────────────────────────────────────────────

export const TARGET = 200;
export const FLIP7_BONUS = 15;

// Noms provisoires des rangs (placeholder — à remplacer par les vraies cartes)
export const RANK_NAMES = [
  'LE FOU', 'LE MENDIANT', "L'ÉCUYER", 'LE MOINE', 'LA SORCIÈRE', 'LE CHEVALIER',
  'LE BOURREAU', "L'ÉVÊQUE", 'LE SEIGNEUR', 'LA REINE MORTE', 'LE ROI LÉPREUX',
  "L'ARCHIDÉMON", 'LE CAVALIER BLÊME',
];

export const ACTIONS = {
  freeze: { name: 'GIVRE', short: 'GIVRE', desc: "Fige une âme : elle encaisse sa main et quitte la manche." },
  three:  { name: 'LES TROIS GLAS', short: 'GLAS', desc: 'La cible doit arracher trois âmes, sans pouvoir refuser.' },
  chance: { name: 'SURSIS', short: 'SURSIS', desc: 'Annule une Profanation. Défaussé une fois utilisé.' },
};

const ROMAN = ['N', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
export const roman = (n) => ROMAN[n] ?? String(n);

// ── Deck ─────────────────────────────────────────────────────
export function buildDeck() {
  const deck = [];
  let i = 0;
  const id = () => 'c' + (i++);
  deck.push({ id: id(), t: 'n', v: 0 });
  for (let v = 1; v <= 12; v++) for (let k = 0; k < v; k++) deck.push({ id: id(), t: 'n', v });
  for (const a of ['freeze', 'three', 'chance']) for (let k = 0; k < 3; k++) deck.push({ id: id(), t: 'a', a });
  for (const v of [2, 4, 6, 8, 10]) deck.push({ id: id(), t: 'm', v });
  deck.push({ id: id(), t: 'x', v: 2 });
  return deck; // 94
}

export function shuffle(arr, rng = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function cardTitle(c) {
  if (!c) return '';
  if (c.t === 'n') return RANK_NAMES[c.v];
  if (c.t === 'a') return ACTIONS[c.a].name;
  if (c.t === 'm') return 'OBOLE +' + c.v;
  if (c.t === 'x') return 'COURONNE ×2';
  return '?';
}

// ── Scoring ──────────────────────────────────────────────────
export function handScore(p) {
  if (p.status === 'bust') return 0;
  let s = p.nums.filter((c) => !c.dup).reduce((a, c) => a + c.v, 0);
  if (p.mods.some((c) => c.t === 'x')) s *= 2;
  s += p.mods.filter((c) => c.t === 'm').reduce((a, c) => a + c.v, 0);
  if (p.flip7) s += FLIP7_BONUS;
  return s;
}

export function uniqueCount(p) {
  return new Set(p.nums.filter((c) => !c.dup).map((c) => c.v)).size;
}

// Probabilité de profanation au prochain tirage (info publique : défausse + mains visibles)
export function bustRisk(state, pid) {
  const p = state.players.find((x) => x.id === pid);
  if (!p) return 0;
  const counts = remainingCounts(state);
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const held = new Set(p.nums.filter((c) => !c.dup).map((c) => c.v));
  let bad = 0;
  for (const v of held) bad += counts['n' + v] || 0;
  return bad / total;
}

// Composition restante de l'Ossuaire (si on ne voit que la défausse + les mains)
export function remainingCounts(state) {
  const counts = {};
  const full = buildDeck();
  for (const c of full) counts[key(c)] = (counts[key(c)] || 0) + 1;
  const seen = [...(state.discard || [])];
  for (const p of state.players) seen.push(...p.nums, ...p.mods, ...(p.chance ? [p.chance] : []), ...(p.used || []));
  for (const c of seen) if (counts[key(c)]) counts[key(c)]--;
  return counts; // Ossuaire = tout − fosse − mains : composition exacte
}
const key = (c) => (c.t === 'n' ? 'n' + c.v : c.t === 'a' ? 'a' + c.a : c.t + c.v);

// ── Match ────────────────────────────────────────────────────
export class Match {
  /**
   * @param {object} o
   * @param {{id:string,name:string,kind:string,persona?:string}[]} o.players
   * @param {Record<string,{decide:Function,chooseTarget:Function}>} o.controllers
   * @param {(ev:object, snap:object)=>Promise<void>} o.presenter
   */
  constructor({ players, controllers, presenter, rng = Math.random, target = TARGET, dealer = 0 }) {
    this.target = target;
    this.rng = rng;
    this.players = players.map((p) => ({
      score: 0, ...p, nums: [], mods: [], chance: null, used: [], status: 'active', flip7: false, last: 0,
    }));
    this.controllers = controllers;
    this.presenter = presenter;
    this.deck = shuffle(buildDeck(), rng);
    this.discard = [];
    this.round = 0;
    this.dealer = dealer % this.players.length;
    this.turn = null;
    this.flip7Hit = false;
    this.aborted = false;
    this.winner = null;
  }

  snapshot() {
    return {
      round: this.round,
      dealer: this.players[this.dealer]?.id,
      turn: this.turn,
      deckCount: this.deck.length,
      discard: this.discard.slice(),
      discardTop: this.discard[this.discard.length - 1] || null,
      target: this.target,
      winner: this.winner,
      players: this.players.map((p) => ({
        id: p.id, name: p.name, kind: p.kind, persona: p.persona, score: p.score,
        nums: p.nums.slice(), mods: p.mods.slice(), chance: p.chance, used: p.used.slice(),
        status: p.status, flip7: p.flip7, hand: handScore(p), last: p.last,
      })),
    };
  }

  async emit(ev) {
    if (this.aborted) throw new Error('aborted');
    await this.presenter(ev, this.snapshot());
  }

  get(pid) { return this.players.find((p) => p.id === pid); }
  ctrl(p) { return this.controllers[p.id]; }
  active() { return this.players.filter((p) => p.status === 'active'); }
  order() {
    const n = this.players.length;
    return Array.from({ length: n }, (_, i) => this.players[(this.dealer + 1 + i) % n]);
  }
  roundOver() { return this.flip7Hit || this.active().length === 0; }

  async run() {
    await this.emit({ type: 'gameStart' });
    while (!this.winner) {
      await this.playRound();
      const top = Math.max(...this.players.map((p) => p.score));
      if (top >= this.target) {
        const leaders = this.players.filter((p) => p.score === top);
        if (leaders.length === 1) this.winner = leaders[0].id;
      }
      this.dealer = (this.dealer + 1) % this.players.length;
    }
    await this.emit({ type: 'gameOver', winner: this.winner });
    return this.winner;
  }

  async playRound() {
    this.round++;
    this.flip7Hit = false;
    for (const p of this.players) Object.assign(p, { nums: [], mods: [], chance: null, used: [], status: 'active', flip7: false, last: 0 });
    await this.emit({ type: 'roundStart', round: this.round });

    // Distribution initiale : une âme pour chacun
    for (const p of this.order()) {
      if (this.roundOver()) break;
      if (p.status !== 'active') continue;
      this.turn = p.id;
      await this.deal(p);
    }

    // Tours de table
    while (!this.roundOver()) {
      for (const p of this.order()) {
        if (this.roundOver()) break;
        if (p.status !== 'active') continue;
        this.turn = p.id;
        await this.emit({ type: 'turn', pid: p.id });
        const choice = await this.ctrl(p).decide(this.snapshot(), p.id);
        if (this.aborted) throw new Error('aborted');
        if (choice === 'stay') {
          p.status = 'stayed';
          await this.emit({ type: 'stay', pid: p.id });
        } else {
          await this.deal(p);
        }
      }
    }
    this.turn = null;

    // Décompte
    const results = this.players.map((p) => {
      const pts = handScore(p);
      p.last = pts;
      p.score += pts;
      return { pid: p.id, pts, total: p.score, status: p.status, flip7: p.flip7 };
    });
    await this.emit({ type: 'roundEnd', results });

    // Les cartes partent dans la fosse
    for (const p of this.players) {
      this.discard.push(...p.nums.map(strip), ...p.mods, ...(p.chance ? [p.chance] : []), ...p.used);
      p.nums = []; p.mods = []; p.chance = null; p.used = [];
    }
  }

  draw() {
    if (this.deck.length === 0) this.deck = shuffle(this.discard.splice(0), this.rng);
    return this.deck.pop();
  }

  /** Tire une carte pour p. Retourne une carte d'action différée si on est dans les Trois Glas. */
  async deal(p, { inThree = false } = {}) {
    if (this.deck.length === 0) {
      this.deck = shuffle(this.discard.splice(0), this.rng); // la fosse retourne à l'Ossuaire
      await this.emit({ type: 'reshuffle' });
    }
    const card = this.draw();
    await this.emit({ type: 'reveal', pid: p.id, card });

    if (card.t === 'n') {
      const dupe = p.nums.find((c) => c.v === card.v && !c.dup);
      if (dupe) {
        if (p.chance) {
          const ch = p.chance;
          p.chance = null;
          this.discard.push(card, ch);
          await this.emit({ type: 'saved', pid: p.id, card, chance: ch });
        } else {
          p.nums.push({ ...card, dup: true });
          p.status = 'bust';
          await this.emit({ type: 'bust', pid: p.id, card, value: card.v });
        }
      } else {
        p.nums.push(card);
        await this.emit({ type: 'gain', pid: p.id, card });
        if (uniqueCount(p) >= 7) {
          p.flip7 = true;
          this.flip7Hit = true;
          await this.emit({ type: 'flip7', pid: p.id });
        }
      }
      return null;
    }

    if (card.t === 'm' || card.t === 'x') {
      p.mods.push(card);
      await this.emit({ type: 'gain', pid: p.id, card });
      return null;
    }

    // Cartes d'action
    if (card.a === 'chance') {
      if (!p.chance) {
        p.chance = card;
        await this.emit({ type: 'gain', pid: p.id, card });
      } else {
        const others = this.active().filter((o) => o.id !== p.id && !o.chance);
        if (others.length) {
          const tid = others.length === 1 ? others[0].id
            : await this.ctrl(p).chooseTarget(this.snapshot(), p.id, 'give', others.map((o) => o.id));
          const t = this.get(tid) || others[0];
          t.chance = card;
          await this.emit({ type: 'give', from: p.id, to: t.id, card });
        } else {
          this.discard.push(card);
          await this.emit({ type: 'discard', pid: p.id, card });
        }
      }
      return null;
    }

    if (inThree) {
      p.used.push(card); // posée à côté, résolue après les trois glas
      await this.emit({ type: 'setAside', pid: p.id, card });
      return card;
    }
    await this.resolveAction(p, card);
    return null;
  }

  async resolveAction(p, card) {
    const cands = this.active().map((o) => o.id);
    if (!cands.length) { this.discard.push(card); return; }
    let tid = cands.length === 1 ? cands[0]
      : await this.ctrl(p).chooseTarget(this.snapshot(), p.id, card.a, cands);
    if (!cands.includes(tid)) tid = cands[0];
    const t = this.get(tid);
    p.used = p.used.filter((c) => c.id !== card.id);
    this.discard.push(card);

    if (card.a === 'freeze') {
      t.status = 'frozen';
      await this.emit({ type: 'freeze', from: p.id, to: t.id, card });
      return;
    }

    // Les Trois Glas
    await this.emit({ type: 'three', from: p.id, to: t.id, card });
    const deferred = [];
    for (let i = 0; i < 3; i++) {
      if (t.status !== 'active' || this.flip7Hit) break;
      this.turn = t.id;
      await this.emit({ type: 'toll', pid: t.id, n: i + 1 });
      const d = await this.deal(t, { inThree: true });
      if (d) deferred.push(d);
    }
    for (const d of deferred) {
      if (t.status === 'active' && !this.flip7Hit) await this.resolveAction(t, d);
      else { t.used = t.used.filter((c) => c.id !== d.id); this.discard.push(d); }
    }
  }
}

const strip = (c) => { const { dup, ...rest } = c; return rest; };
