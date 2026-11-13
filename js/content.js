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
export const relicCard = (id, owner = 'you') => ({ ...RELICS[id].card, relic: true, owner, rid: id });

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

// Le guide : ce que le pèlerin sait de chacun (bestiaire)
export const LORE = [
  { title: 'Premier gardien de la forêt', text: "On l'a pendu trois fois. La corde a cédé trois fois. Il est redescendu s'asseoir et a demandé les cartes.", stats: { Avidité: 2, Ruse: 2, Foi: 1, Volonté: 4 }, align: 0.3, items: [['skull', 'Corde usée', 'Elle se souvient du chêne.'], ['candle', 'Sac de toile', 'Deux trous, et rien derrière.']], say: { bust: 'La corde a lâché.', win: 'Reste pendu avec moi.', stay: 'Assez.', taunt: 'Tire.' } },
  { title: 'Celle qui pousse entre les tombes', text: "Elle a planté ses propres mains dans le sol pour qu'elles repoussent en ronces. Elle triche, mais seulement avec la mort.", stats: { Avidité: 3, Ruse: 5, Foi: 2, Volonté: 2 }, align: 0.2, items: [['scroll', 'Fagot de ronces', 'Il saigne quand on le serre.'], ['eye', 'Œil de verre', 'Il voit les doublons.']], say: { bust: 'Les épines te connaissent.', win: 'Enterre-le là.', stay: 'Prudent, petit.', taunt: 'Encore une, encore.' } },
  { title: 'Il marche vers un autel qui n\'existe plus', text: "Un pèlerin mort en chemin. Le cerf qu'il chassait a pris sa tête. Ils continuent ensemble, sans savoir où.", stats: { Avidité: 4, Ruse: 2, Foi: 4, Volonté: 3 }, align: 0.5, items: [['helm', 'Bois de cerf', 'Ils poussent encore.'], ['seal', 'Coquille vide', 'Le signe du pèlerin.']], say: { bust: '…', win: 'Le chemin continue.', stay: 'Je m\'arrête ici.', taunt: 'Avance.' } },
  { title: 'Seigneur de la Forêt des Pendus', text: "Il vivait seul dans la forêt jusqu'à ce que la forêt vive en lui. Il distribue les âmes à ceux qui s'égarent et les reprend à la nuit.", stats: { Avidité: 4, Ruse: 4, Foi: 1, Volonté: 5 }, align: 0.1, items: [['skull', 'Peau du dernier loup', 'Encore chaude.'], ['candle', 'Lanterne de résine', 'Elle attire les égarés.']], say: { bust: 'La meute a faim.', win: 'La forêt te garde.', stay: 'Je flaire la peur.', taunt: 'Cours, ou tire.' } },
  { title: 'Il n\'a jamais raté une cible vivante', text: "Posté sur le pont depuis un siège oublié. Il compte les âmes comme il comptait les carreaux : sans émotion.", stats: { Avidité: 2, Ruse: 3, Foi: 2, Volonté: 4 }, align: 0.35, items: [['helm', 'Chapeau de fer', 'Cabossé par un seul coup.'], ['coin', 'Carquois vide', 'Il a tout tiré.']], say: { bust: 'Raté.', win: 'Dans le mille.', stay: 'Je vise.', taunt: 'Bouge pas.' } },
  { title: 'Il annonce ceux qui vont mourir', text: "Il porte les couleurs d'un roi que personne n'a vu. Il crie ton nom avant chaque manche, au cas où ce serait la dernière.", stats: { Avidité: 3, Ruse: 3, Foi: 4, Volonté: 3 }, align: 0.55, items: [['scroll', 'Étendard de la garde', 'Déchiré au même endroit.'], ['bell', 'Trompe d\'os', 'Un seul son.']], say: { bust: 'Qu\'on l\'annonce !', win: 'Gloire au vainqueur.', stay: 'Il se retire !', taunt: 'Place !' } },
  { title: 'Il a juré de ne jamais s\'éteindre', text: "Un chevalier d'un ordre solaire. Le soleil s'est couché sur lui il y a cent ans. Il brille encore, par orgueil.", stats: { Avidité: 5, Ruse: 1, Foi: 5, Volonté: 4 }, align: 0.7, items: [['seal', 'Plastron au soleil', 'Doré à la feuille.'], ['candle', 'Mèche éternelle', 'Elle fume sans flamme.']], say: { bust: 'Ombre…', win: 'Lumière.', stay: 'Assez de clarté.', taunt: 'Ose.' } },
  { title: 'Seigneur du Pont-levis', text: "Personne ne passe sans jouer. Il a cloué son heaume pour ne plus jamais voir ceux qui perdent. Il entend seulement les cartes tomber.", stats: { Avidité: 4, Ruse: 3, Foi: 2, Volonté: 5 }, align: 0.25, items: [['helm', 'Heaume à piques', 'Cloué de l\'intérieur.'], ['door', 'Clé de la herse', 'Rouillée dans sa main.']], say: { bust: 'Le pont s\'ouvre sous toi.', win: 'Personne ne passe.', stay: 'Tu hésites.', taunt: 'Paye le passage.' } },
  { title: 'Il bénit chaque carte avant de la maudire', text: "Évêque d'un diocèse englouti. Il prie pour toi, puis il prie contre toi. Les deux marchent.", stats: { Avidité: 2, Ruse: 4, Foi: 5, Volonté: 2 }, align: 0.4, items: [['scroll', 'Crosse noire', 'Le bois est mort deux fois.'], ['bell', 'Encensoir', 'Fumée de cendres d\'âmes.']], say: { bust: 'Pardonné. Pas sauvé.', win: 'Amen.', stay: 'Sage.', taunt: 'Confesse une carte.' } },
  { title: 'Il n\'a jamais eu besoin de deux coups', text: "Il a servi tous les rois du château, puis il les a servis eux. Il tire comme il frappe : d'un geste.", stats: { Avidité: 5, Ruse: 1, Foi: 1, Volonté: 5 }, align: 0.1, items: [['skull', 'Épée de justice', 'Le bout est carré.'], ['helm', 'Cagoule', 'Personne n\'a vu dessous.']], say: { bust: 'Tranché.', win: 'Au suivant.', stay: 'Hm.', taunt: 'Tends le cou.' } },
  { title: 'Elle règne sous les douves', text: "Elle s'est jetée du haut des remparts le jour du sacre. Elle porte encore la couronne et l'eau qui coule de son voile ne sèche jamais.", stats: { Avidité: 2, Ruse: 5, Foi: 3, Volonté: 3 }, align: 0.45, items: [['seal', 'Couronne mouillée', 'Elle pèse comme une pierre.'], ['skull', 'Collier de crânes', 'Ses prétendants.']], say: { bust: 'Noie-toi.', win: 'Viens sous l\'eau.', stay: 'Si tôt ?', taunt: 'Plonge.' } },
  { title: 'Le dernier boss : il a perdu son royaume aux cartes', text: "Il a tout misé, une nuit, et tout perdu sauf la couronne. Depuis il rejoue, encore et encore, pour la reprendre à qui l'emporte.", stats: { Avidité: 5, Ruse: 5, Foi: 2, Volonté: 5 }, align: 0.15, items: [['seal', 'Couronne brisée', 'Il manque une pointe.'], ['skull', 'Sceptre de fémur', 'Le sien.']], say: { bust: 'À genoux.', win: 'Le royaume est à moi.', stay: 'Le roi attend.', taunt: 'Mise ton âme.' } },
];

// ─────────────────────────────────────────────────────────────
//  Parcours II — le Squelette, au royaume des morts.
// ─────────────────────────────────────────────────────────────
export const ZONES2 = [
  { id: 'limbes', name: 'Les Limbes', place: 'limbes' },
  { id: 'styx', name: 'Le Fleuve noir', place: 'styx' },
  { id: 'cathedrale', name: "La Cathédrale d'Os", place: 'cathedrale' },
];
export const FOES2 = [
  { name: "L'Âme errante", risk: 0.3, kit: { body: 'robe', head: 'ghost', hands: 'bony' } },
  { name: 'Le Médecin de peste', risk: 0.26, kit: { body: 'robe', head: 'plague', extras: ['lantern'] } },
  { name: 'La Pleureuse', risk: 0.33, kit: { body: 'robe', head: 'hag', hands: 'bony', extras: ['skulls'] } },
  { name: 'Le Gardien des Limbes', risk: 0.34, boss: true, kit: { head: 'horns', pauldrons: 'loup', hands: 'bony', sword: 'bourreau' } },
  { name: 'Le Noyé', risk: 0.28, kit: { body: 'bare', head: 'skull', hands: 'bony', extras: ['noose'] } },
  { name: "La Sirène d'os", risk: 0.31, kit: { body: 'robe', head: 'veil', hands: 'bony' } },
  { name: "Le Pêcheur d'âmes", risk: 0.35, kit: { body: 'gambeson', head: 'ferry', hands: 'bony', extras: ['crozier'] } },
  { name: 'Le Passeur', risk: 0.37, boss: true, kit: { body: 'robe', head: 'ferry', hands: 'bony', extras: ['lantern'] } },
  { name: 'Le Moine sans visage', risk: 0.24, kit: { body: 'robe', head: 'exec', hands: 'bony' } },
  { name: 'Le Chantre des cryptes', risk: 0.3, kit: { body: 'robe', head: 'mitre', hands: 'bony', extras: ['crozier', 'skulls'] } },
  { name: 'Le Chevalier creux', risk: 0.4, kit: { head: 'helm', sword: 'bourreau', shield: 1 } },
  { name: "L'Ange du Jugement", risk: 0.34, boss: true, kit: { body: 'robe', head: 'angel', hands: 'bony', extras: ['wings'] } },
];
export const LORE2 = [
  { say: { bust: 'Encore un peu…', win: 'Reste avec moi.', stay: 'Déjà ?', taunt: "Je ne me rappelle plus mon nom. Et toi ?" } },
  { say: { bust: 'Contagieux.', win: 'Le remède, c\'est moi.', stay: 'Prudent.', taunt: 'Montre-moi tes cartes. Je vais les ausculter.' } },
  { say: { bust: 'Je pleurerai pour toi.', win: 'Encore des larmes.', stay: 'Si tôt…', taunt: 'Chaque carte que tu tires, je la pleure.' } },
  { say: { bust: 'Retourne dans la cendre.', win: 'Les Limbes te gardent.', stay: 'Lâche.', taunt: 'Personne ne sort des Limbes sans jouer.' } },
  { say: { bust: 'Coule.', win: 'Glou.', stay: 'Hm.', taunt: "L'eau est froide. Les cartes aussi." } },
  { say: { bust: 'Viens au fond.', win: 'Tu chantes faux.', stay: 'Reste.', taunt: 'Écoute-moi… et tire.' } },
  { say: { bust: 'Ferré !', win: 'Belle prise.', stay: 'Il a vu l\'hameçon.', taunt: 'Je pêche des âmes. Les squelettes, je les relâche… parfois.' } },
  { say: { bust: 'Pas d\'obole, pas de rive.', win: 'La traversée est payée.', stay: 'Tu as peur de l\'eau ?', taunt: 'Une carte pour monter. Toutes pour descendre.' } },
  { say: { bust: '…', win: '…', stay: '…', taunt: '…' } },
  { say: { bust: 'Requiem.', win: 'Amen.', stay: 'Silence.', taunt: 'Je chante pour les morts. Tu es déjà dans le chœur.' } },
  { say: { bust: 'Vide, comme moi.', win: 'Rien dedans.', stay: 'Creux.', taunt: "Mon armure est vide. Ta main l'est-elle aussi ?" } },
  { say: { bust: 'Trop léger.', win: 'Jugé.', stay: 'Tu crains la balance ?', taunt: 'Je pèse chaque âme. Pose la tienne.' } },
];
export const HERO2 = { body: 'robe', head: 'skull', hands: 'bony' };

// ─────────────────────────────────────────────────────────────
//  Parcours III — la Sorcière : marais, cimes gelées, antre du dragon.
//  Ici, on joue à plusieurs autour de la table.
// ─────────────────────────────────────────────────────────────
export const ZONES3 = [
  { id: 'marais', name: 'Le Marais des Feux-follets', place: 'marais' },
  { id: 'cimes', name: 'Les Cimes gelées', place: 'cimes' },
  { id: 'antre', name: "L'Antre du Dragon", place: 'antre' },
];
export const FOES3 = [
  { name: 'Le Crapaud-Roi', risk: 0.3, kit: { body: 'bare', head: 'frog', hands: 'bony' } },
  { name: "L'Homme-Saule", risk: 0.24, kit: { body: 'robe', head: 'willow', hands: 'bony' } },
  { name: 'La Vieille aux Lanternes', risk: 0.33, kit: { body: 'robe', head: 'hag', hands: 'bony', extras: ['lantern'] } },
  { name: 'Le Roi des Feux-follets', risk: 0.32, boss: true, kit: { body: 'robe', head: 'wisp', hands: 'bony', extras: ['lantern'] } },
  { name: 'Le Yéti', risk: 0.36, kit: { body: 'bare', head: 'yeti', pauldrons: 'loup', hands: 'bony' } },
  { name: 'Le Moine de givre', risk: 0.22, kit: { body: 'robe', head: 'exec', hands: 'bony', extras: ['crozier'] } },
  { name: 'La Chasseresse', risk: 0.34, kit: { body: 'gambeson', head: 'wolf', shield: 1 } },
  { name: 'Le Géant de givre', risk: 0.38, boss: true, kit: { head: 'helm', helm: 'piques', sword: 'bourreau', pauldrons: 'plates', scale: 1.18 } },
  { name: 'Le Cultiste écarlate', risk: 0.28, kit: { body: 'robe', head: 'plague', hands: 'bony' } },
  { name: "Le Chevalier d'or", risk: 0.33, kit: { breast: 'soleil', head: 'soleil' } },
  { name: 'La Vouivre', risk: 0.31, kit: { body: 'robe', head: 'veil', hands: 'bony', extras: ['skulls'] } },
  { name: 'Le Dragon', risk: 0.35, boss: true, kit: { dragon: true } },
];
export const LORE3 = [
  { say: { bust: 'Croâ !', win: 'Mon royaume, ma mare.', stay: 'Peureux.', taunt: 'Un baiser porte bonheur. Approche.' } },
  { say: { bust: 'Je plie…', win: 'Les racines gagnent toujours.', stay: 'Patience.', taunt: 'J\'ai le temps. Cent ans de temps.' } },
  { say: { bust: 'Ma flamme vacille.', win: 'Suis la lumière, petite.', stay: 'Tu as vu clair.', taunt: 'Une lanterne par âme perdue. J\'en ai beaucoup.' } },
  { say: { bust: 'Je m\'éteins !', win: 'Égarée, comme les autres.', stay: 'Tu ne me suis plus ?', taunt: 'Suis-moi… juste encore une carte…' } },
  { say: { bust: 'GRAAH !', win: 'Hmpf.', stay: 'Hm ?', taunt: 'Le froid fait trembler les mains. Pas les miennes.' } },
  { say: { bust: 'Silence glacé.', win: 'Ainsi soit-il.', stay: 'Sage.', taunt: 'Je joue pour réchauffer mon cloître.' } },
  { say: { bust: 'Manqué.', win: 'Prise.', stay: 'Elle flaire le piège.', taunt: 'Je chasse les sorcières. Tu tombes bien.' } },
  { say: { bust: 'Ma glace se fend !', win: 'Gelée pour l\'éternité.', stay: 'Tu as froid ?', taunt: 'Personne ne passe le col sans jouer contre moi.' } },
  { say: { bust: 'Le Dragon me punira.', win: 'Pour Lui !', stay: 'Lâche.', taunt: 'Ton or ira au Maître.' } },
  { say: { bust: 'Mon armure…', win: 'L\'or appelle l\'or.', stay: 'Prudente.', taunt: 'J\'ai vendu mon ordre pour une pièce du trésor.' } },
  { say: { bust: 'Sss…', win: 'Sssublime.', stay: 'Ssserrée ?', taunt: 'Ma pierre vaut plus que ta vie.' } },
  { say: { bust: 'GRRRAAAH !', win: 'Encore une pour le trésor.', stay: 'Tu flaires le feu.', taunt: 'Mille ans que je joue. Mille ans que je gagne.' } },
];
export const HERO3 = { body: 'robe', head: 'witch', hands: 'bony' };

// règles par lieu : cartes bonus admises et taille de la table
const R1 = () => ({ specials: false, size: 2 });
const R2 = (z) => ({ specials: [['mods', 'x2'], ['mods', 'x2', 'freeze', 'chance'], true][z], size: 2 });
const R3 = (z) => ({ specials: true, size: [3, 4, 5][z] });
export const CAMPAIGNS = [
  { id: 'chevalier', hero: 'Le Chevalier', heroKind: 'pelerin', hands: 'gant', persona: 'f', zones: ZONES, foes: FOES, deck: 0, deckName: 'Le deck du chevalier', paliers: [30, 50, 100, 200], carry: true, rules: R1 },
  { id: 'squelette', hero: 'Le Squelette', heroKind: 'h2', hands: 'os', persona: 's', zones: ZONES2, foes: FOES2, deck: 1, deckName: 'Le deck du squelette', paliers: [50, 100, 150, 200], carry: true, rules: R2 },
  { id: 'sorciere', hero: 'La Sorcière', heroKind: 'h3', hands: 'sorc', persona: 'w', zones: ZONES3, foes: FOES3, deck: 2, deckName: 'Le grimoire de la Sorcière', paliers: [80, 120, 160, 200], carry: false, rules: R3 },
];
