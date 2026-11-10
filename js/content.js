// ─────────────────────────────────────────────────────────────
//  Le parcours du Chevalier : 3 zones × (3 adversaires + boss).
//  Chaque victoire donne l'élément porté par l'adversaire et
//  l'illustration d'un rang de carte (1 à 12).
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

export const ITEMS = {
  cape: { name: 'Cape en lambeaux', kind: 'perso' },
  gantelets: { name: 'Gantelets à épines', kind: 'perso' },
  cimier: { name: 'Cimier de cerf', kind: 'perso' },
  epaulieres: { name: 'Épaulières du Loup', kind: 'perso' },
  bouclier: { name: 'Bouclier clouté', kind: 'perso' },
  etendard: { name: 'L\'Étendard', kind: 'honneur' },
  plastron: { name: 'Plastron au Soleil', kind: 'perso' },
  heaume: { name: 'Heaume à piques', kind: 'perso' },
  vitrail: { name: 'Le Vitrail', kind: 'honneur' },
  epee: { name: 'Épée de justice', kind: 'perso' },
  trophees: { name: 'Les Trophées', kind: 'honneur' },
  couronne: { name: 'Couronne brisée', kind: 'perso' },
  cadre: { name: 'Le Cadre des Honneurs', kind: 'honneur' },
  brume: { name: 'Brume & lucioles', kind: 'ambiance' },
  pluie: { name: 'La Pluie', kind: 'ambiance' },
  cendres: { name: 'Cendres & braises', kind: 'ambiance' },
};

// Apparence du chevalier selon ce qui est débloqué
export function knightKit(un) {
  const has = (k) => un.includes(k);
  return {
    sword: has('epee') ? 'bourreau' : 'arming',
    cape: has('cape') ? 1 : 0,
    gauntlets: has('gantelets') ? 'epines' : 'plain',
    crest: has('cimier') ? 'cerf' : null,
    pauldrons: has('epaulieres') ? 'loup' : 'plates',
    shield: has('bouclier') ? 1 : 0,
    breast: has('plastron') ? 'soleil' : 'plain',
    helm: has('heaume') ? 'piques' : 'basic',
    crown: has('couronne') ? 1 : 0,
    head: 'helm',
  };
}
