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
];
