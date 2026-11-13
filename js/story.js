// ─────────────────────────────────────────────────────────────
//  Les histoires : les cinématiques de chaque parcours
//  (planches de js/plates.js + texte). Court, simple.
// ─────────────────────────────────────────────────────────────
const seals = (t0, step, sound = 'flip') => Array.from({ length: 7 }, (_, k) => ({ t: t0 + k * step, show: 'seal' + k, sound }));
const sealIds = Array.from({ length: 7 }, (_, k) => 'seal' + k);

export const RULES = {
  plate: 'regles', title: 'Les règles', hold: 6, fx: 'embers', n: 18, dur: 16,
  text: [
    { t: "Tire des cartes, une à une. Leurs chiffres s'additionnent.", chips: [3, 7, 12], sum: '+22' },
    { t: 'Deux fois le même chiffre : ta mise est profanée, la manche est perdue.', chips: [3, 7, '7!'], stamp: 'Profané' },
    { t: 'Retire-toi quand tu veux : tu gardes ta mise.' },
    { t: 'Sept chiffres différents : les Sept Sceaux, +15.', chips: [1, 2, 4, 5, 8, 9, 11], seal: '+15' },
    { t: 'Le premier qui atteint le palier gagne le duel.' },
  ],
};

export const STORY = [
  { // ── I · le chevalier ──
    intro: [
      { plate: 'tour', title: 'Le Septième Sceau', fx: 'ash', drift: [-0.6, -0.6, 0.5, 0.4], text: ["Il était une fois un chevalier qui joua, une nuit, plus qu'il ne possédait."] },
      { plate: 'mains', fx: 'dust', n: 60, hide: sealIds, events: seals(1.3, 0.32), text: ['Il perdit ses terres, puis son nom.', 'Puis son âme, scellée sous sept sceaux.'] },
      { plate: 'herse', hide: ['eyes'], events: [{ t: 2.4, show: 'eyes', flash: 0.9, shake: 0.6, sound: 'bust' }], text: ['Le Roi déchu garde les sceaux au fond de son château.', "On ne les lui reprend qu'à son propre jeu."] },
      RULES,
      { plate: 'route', title: 'La Forêt des Pendus', fx: 'flies', drift: [0, -0.8, 0, 0.6], text: ["La route commence là où l'on pend les mauvais joueurs."] },
    ],
    zones: [null,
      [{ plate: 'pont', title: 'Le Pont-levis', fx: 'embers', n: 40, text: ['La forêt se tait derrière toi.', "Au bout du chemin, un pont-levis s'abaisse… rien que pour toi."] }],
      [{ plate: 'chateau', title: 'Le Château du Roi déchu', fx: 'rain', hide: ['bolt'], events: [{ t: 1.6, show: 'bolt', flash: 1, shake: 0.4, sound: 'bust' }, { t: 1.85, hide: 'bolt' }, { t: 4.6, show: 'bolt', flash: 0.8 }, { t: 4.8, hide: 'bolt' }], text: ['Les chaînes grincent dans ton dos.', 'Là-haut, une seule fenêtre brûle encore : la salle du trône.'] }],
    ],
    boss: [
      { plate: 'trone', fx: 'embers', n: 50, drift: [0, 0.4, 0, -0.6], text: ['La salle du trône.', 'Il t\'attendait.'] },
      { plate: 'roi', hide: ['eyes'], events: [{ t: 1.5, show: 'eyes', flash: 1, shake: 0.8, sound: 'bust' }], fx: 'ash', text: [{ t: '« Encore un qui vient jouer sa vie…', cls: 'q' }, { t: 'Assieds-toi, chevalier. »', cls: 'q' }] },
      { plate: 'duel', fx: 'embers', n: 40, title: 'Le dernier duel', text: ['Premier à 200.', "Le perdant n'aura plus rien à perdre."] },
    ],
    ending: [
      { plate: 'poussiere', fx: 'dust', hide: sealIds, events: seals(1.2, 0.3, 'bust'), text: ['Le Roi déchu tombe en poussière.', "Les sept sceaux se brisent, l'un après l'autre."] },
      { plate: 'aube', title: 'Fin', fx: 'ash', n: 30, text: ['Ton âme t\'est rendue.', 'Le jour se lève sur le royaume.'] },
      { plate: 'tombe', title: 'Parcours II', fx: 'souls', text: ['Mais sous la terre, quelqu\'un d\'autre a entendu battre les cartes…'] },
    ],
  },
  { // ── II · le squelette ──
    intro: [
      { plate: 'tombe', title: 'Le Squelette', fx: 'souls', text: ["Il est mort depuis si longtemps qu'il a oublié son nom.", "Il ne se rappelle qu'une chose : le bruit des cartes."] },
      { plate: 'angeloin', fx: 'ash', hide: ['eyes'], events: [{ t: 2.2, show: 'eyes', flash: 0.7, sound: 'bust' }], text: ['Au royaume des morts, tout se joue : la mémoire, la traversée, le repos.', "Et tout au bout, l'Ange du Jugement pèse les âmes et tient la banque."] },
      RULES,
      { plate: 'bonusA', title: 'Nouvelles cartes', fx: 'embers', n: 20, hold: 5, text: [
        { t: 'Au royaume des morts, le paquet change. Voici les offrandes : elles s\'ajoutent à ta mise.', chips: ['+4', '+10'], sum: '+14' },
        { t: 'Le ×2 double la somme de tes chiffres (pas les offrandes).', chips: [5, 9, '×2'], sum: '28' },
        { t: 'Elles ne comptent pas pour les Sept Sceaux, et une profanation les emporte aussi.' },
      ] },
      { plate: 'limbes', title: 'Les Limbes', fx: 'ash', drift: [0, -0.8, 0, 0.6], text: ['La route commence dans la cendre, parmi les âmes qui ne savent plus où aller.'] },
    ],
    zones: [null,
      [{ plate: 'barque', title: 'Le Fleuve noir', fx: 'flies', text: ["Les Limbes s'éteignent derrière toi.", 'Sur l\'eau noire, une barque attend. Le passeur se paie en cartes.'] },
        { plate: 'bonusB', title: 'Deux cartes de plus', fx: 'ash', hold: 5, text: [
          'Le Gel : quand tu le tires, tu choisis un joueur (toi compris). Il encaisse sa main et sort de la manche.',
          'Le Sursis : garde-le devant toi. Il annule ta prochaine profanation, puis disparaît.',
        ] }],
      [{ plate: 'cathedrale', title: "La Cathédrale d'Os", fx: 'embers', n: 50, drift: [0, 0.6, 0, -0.6], text: ["L'autre rive.", 'Une cathédrale bâtie de crânes et, tout au fond, une lumière rouge.'] },
        { plate: 'bonusC', title: 'La dernière carte', fx: 'embers', n: 20, hold: 5, text: [
          'Trois cartes : le joueur que tu désignes doit en tirer trois d\'affilée, sans pouvoir s\'arrêter.',
          'À partir d\'ici, le paquet est complet : c\'est le vrai jeu.',
        ] }],
    ],
    boss: [
      { plate: 'ange', hide: ['eyes'], fx: 'ash', events: [{ t: 1.5, show: 'eyes', flash: 1, shake: 0.8, sound: 'bust' }], text: [{ t: '« Mille yeux t\'ont regardé mourir, squelette.', cls: 'q' }, { t: 'Pose ton âme sur la balance. Les cartes décideront. »', cls: 'q' }] },
      { plate: 'duel2', fx: 'embers', n: 40, title: 'Le dernier duel', text: ['Premier à 200.', 'Contre le Jugement, on ne joue qu\'une fois.'] },
    ],
    ending: [
      { plate: 'chute', fx: 'ash', text: ["L'Ange tombe. Son auréole roule dans la cendre.", 'Ses mille yeux se ferment, un à un.'] },
      { plate: 'repos', title: 'Fin', fx: 'flies', text: ['Le squelette se souvient de son nom.', 'Il peut enfin dormir. Merci d\'avoir joué.'] },
    ],
  },
  { // ── III · la sorcière ──
    intro: [
      { plate: 'sorciere', title: 'La Sorcière', fx: 'embers', n: 40, hide: ['vision'], events: [{ t: 2.4, show: 'vision', flash: 0.6, sound: 'flip7' }], text: ['Dans la fumée de son chaudron, la sorcière a vu un dragon.', 'Et sous ses griffes, assez d\'or pour acheter tous les sorts du monde.'] },
      { plate: 'tablee', title: 'Les grandes tables', fx: 'flies', hold: 5, text: [
        'Ici, on ne joue plus en duel : chaque table réunit trois, quatre, puis cinq joueurs.',
        'Le paquet est complet. Garde tes Gels et tes Trois cartes pour le joueur en tête.',
        'Le premier qui atteint le palier gagne la table.',
      ] },
      { plate: 'marais', title: 'Le Marais des Feux-follets', fx: 'flies', hide: ['wisps'], events: [{ t: 1.6, show: 'wisps' }], text: ['Le chemin passe par le marais. Les lumières qui dansent sur l\'eau ne mènent nulle part.'] },
    ],
    zones: [null,
      [{ plate: 'cimes', title: 'Les Cimes gelées', fx: 'ash', n: 120, text: ['Le marais gèle, puis la montagne commence.', 'Au col, un monastère de pierre : on y joue pour se réchauffer.'] }],
      [{ plate: 'antre', title: "L'Antre du Dragon", fx: 'embers', n: 60, hide: ['eyes'], events: [{ t: 2.2, show: 'eyes', flash: 0.8, shake: 0.5, sound: 'bust' }], text: ['Derrière les cimes, une gueule de pierre fume.', 'Tout au fond, deux yeux d\'or s\'ouvrent.'] }],
    ],
    boss: [
      { plate: 'dragon', hide: ['fire'], fx: 'embers', n: 70, events: [{ t: 2, show: 'fire', flash: 1, shake: 1, sound: 'bust' }], text: [{ t: '« Une sorcière… Qui vient jouer mon or.', cls: 'q' }, { t: 'Assieds-toi. Mes convives ont faim. »', cls: 'q' }] },
      { plate: 'tablee', title: 'La table du Dragon', fx: 'embers', n: 40, text: ['Six joueurs autour de la table, premier à 200.', 'Le vrai jeu, sans pitié.'] },
    ],
    ending: [
      { plate: 'tresor', title: 'Le trésor', fx: 'dust', text: ['Le Dragon s\'endort sur son or, vaincu.', 'La sorcière repart, la couronne sur la tête.'] },
      { plate: 'trois', title: 'Fin', fx: 'embers', n: 30, hold: 6, text: ['Le chevalier, le squelette et la sorcière ont gagné leur partie.', 'Désormais, la Table libre est ouverte : le Flip 7 complet, contre autant d\'adversaires que tu veux.'] },
    ],
  },
];
