// IA des adversaires. Chaque persona a un tempérament face au risque.
import { bustRisk, TARGET, uniqueCount } from './game.js';

export const PERSONAS = {
  mort:       { name: 'LA MORT',       risk: 0.30, think: [900, 1700], epithet: 'Celle qui tient l\'Ossuaire' },
  flagellant: { name: 'LE FLAGELLANT', risk: 0.42, think: [500, 1100], epithet: 'Il aime la douleur' },
  veuve:      { name: 'LA VEUVE',      risk: 0.20, think: [1100, 2000], epithet: 'Elle a déjà tout perdu' },
  lepreux:    { name: 'LE LÉPREUX',    risk: 0.33, think: [700, 2200], epithet: 'Ses doigts tombent un à un' },
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const between = ([a, b]) => a + Math.random() * (b - a);

export function makeAI(persona = 'mort', { fast = false } = {}) {
  const P = PERSONAS[persona] || PERSONAS.mort;
  return {
    async decide(state, pid) {
      await wait(fast ? 0 : between(P.think));
      const me = state.players.find((p) => p.id === pid);
      const risk = bustRisk(state, pid) * (me.chance ? 0.15 : 1);
      const best = Math.max(...state.players.filter((p) => p.id !== pid).map((p) => p.score));
      // Si encaisser suffit pour gagner (et passer devant) : on encaisse
      if (me.score + me.hand >= TARGET && me.score + me.hand > best) return 'stay';
      let threshold = P.risk;
      if (best >= TARGET * 0.8 && me.score < best) threshold += 0.12; // désespoir
      if (uniqueCount(me) === 6) threshold += 0.08;                    // les Sept Sceaux tentent
      if (me.hand < 12) threshold += 0.1;                               // main trop maigre
      if (persona === 'lepreux') threshold += (Math.random() - 0.5) * 0.25;
      return risk > threshold ? 'stay' : 'hit';
    },

    async chooseTarget(state, pid, kind, cands) {
      await wait(fast ? 0 : between(P.think) * 0.7);
      const me = state.players.find((p) => p.id === pid);
      const others = state.players.filter((p) => cands.includes(p.id) && p.id !== pid);
      if (kind === 'give') {
        // On offre le Sursis au plus faible
        return others.sort((a, b) => a.score - b.score)[0]?.id ?? cands[0];
      }
      if (kind === 'freeze') {
        // Se figer soi-même si la main est belle et le risque élevé
        if (cands.includes(pid) && me.hand >= 20 && bustRisk(state, pid) > 0.22) return pid;
        // Sinon figer l'adversaire le plus menaçant tôt dans sa main
        const threat = others.sort((a, b) => (b.score + b.hand * 0.5) - (a.score + a.hand * 0.5))[0];
        return threat?.id ?? pid;
      }
      if (kind === 'three') {
        // Les Trois Glas sur celui qui risque le plus
        const victim = others.sort((a, b) => bustRisk(state, b.id) - bustRisk(state, a.id))[0];
        return victim?.id ?? pid;
      }
      return cands[0];
    },
  };
}
