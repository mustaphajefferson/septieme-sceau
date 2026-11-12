// ─────────────────────────────────────────────────────────────
//  Le parcours du Chevalier : 3 zones × (3 adversaires + boss).
//  Chaque victoire donne l'illustration d'un rang de carte (1 à 12)
//  et une relique à ajouter à ton deck.
// ─────────────────────────────────────────────────────────────

export const PALIERS = [30, 50, 100, 200];

export const ZONES = [
  { id: 'foret', name: 'La Forêt des Pendus', place: 'foret', ink: '#dfe9d6' },
  { id: 'pont', name: 'Le Pont-levis', place: 'pont', ink: '#ece8dc' },
  { id: 'chateau', name: 'Le Château du Roi déchu', place: 'chateau', ink: '#efe5cf' },
];

// kit = apparence de l'adversaire (même système que le chevalier)
export const FOES = [
  { name: 'Le Pendu du chêne', risk: 0.30, reward: 'cape', kit: { body: 'robe', head: 'sack', cape: 1, hands: 'bony', extras: ['noose'] } },
  { name: 'La Sorcière des ronces', risk: 0.24, reward: 'gantelets', kit: { body: 'robe', head: 'hag', gauntlets: 'epines', hands: 'bony' } },
  { name: 'Le Cerf-Pèlerin', risk: 0.34, reward: 'cimier', kit: { body: 'robe', head: 'deer', hands: 'bony' } },
  { name: 'L\'Ermite-Loup', risk: 0.32, reward: 'epaulieres', boss: true, ambiance: 'brume', kit: { body: 'robe', head: 'wolf', pauldrons: 'loup', hands: 'bony' } },
  { name: 'L\'Arbalétrier', risk: 0.26, reward: 'bouclier', kit: { body: 'gambeson', head: 'kettle', shield: 1 } },
  { name: 'Le Héraut', risk: 0.3, reward: 'etendard', kit: { body: 'tabard', head: 'helm', extras: ['banner'] } },
  { name: 'Le Chevalier-Soleil', risk: 0.36, reward: 'plastron', kit: { breast: 'soleil', head: 'helm' } },
  { name: 'Le Gardien du Pont', risk: 0.38, reward: 'heaume', boss: true, ambiance: 'pluie', kit: { head: 'helm', helm: 'piques', pauldrons: 'plates' } },
  { name: 'L\'Évêque noir', risk: 0.22, reward: 'vitrail', kit: { body: 'robe', head: 'mitre', hands: 'bony', extras: ['crozier'] } },
  { name: 'Le Bourreau', risk: 0.42, reward: 'epee', kit: { body: 'bare', head: 'exec', sword: 'bourreau' } },
  { name: 'La Reine noyée', risk: 0.28, reward: 'trophees', kit: { body: 'robe', head: 'veil', hands: 'bony', extras: ['skulls'] } },
  { name: 'Le Roi déchu', risk: 0.33, reward: 'couronne', boss: true, ambiance: 'cendres', extra: 'cadre', kit: { body: 'robe', head: 'king', hands: 'bony', pauldrons: 'loup' } },
];

// Les reliques : cartes qui rejoignent ton deck après chaque victoire.
// Elles ne servent que toi : si l'adversaire en tire une, elle brûle sans effet.
export const RELICS = {
  obole4: { name: "Obole d'argent", card: { t: 'm', v: 4 } },
  obole6: { name: 'Obole de cuivre', card: { t: 'm', v: 6 } },
  obole8: { name: "Obole d'or", card: { t: 'm', v: 8 } },
  obole10: { name: 'Denier du Roi', card: { t: 'm', v: 10 }, rare: true },
  couronne: { name: 'Couronne ×2', card: { t: 'x', v: 2 }, rare: true },
  sursis: { name: 'Sursis', card: { t: 'a', a: 'chance' } },
  givre: { name: 'Givre', card: { t: 'a', a: 'freeze' } },
  glas: { name: 'Les Trois Glas', card: { t: 'a', a: 'three' } },
};
export const relicCard = (id) => ({ ...RELICS[id].card, relic: true, owner: 'me', rid: id });

// Trois reliques proposées après une victoire (un boss en garantit une rare)
export function offer(n) {
  const ids = Object.keys(RELICS), rares = ids.filter((k) => RELICS[k].rare), commons = ids.filter((k) => !RELICS[k].rare);
  const pick = (arr) => arr.splice(Math.floor(Math.random() * arr.length), 1)[0];
  const out = [];
  if (FOES[n]?.boss) out.push(pick(rares));
  const pool = [...commons, ...rares.filter((r) => !out.includes(r))];
  while (out.length < 3) out.push(pick(pool));
  return out;
}
