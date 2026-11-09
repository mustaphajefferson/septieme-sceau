// Le monde de la Fange — textes du guide (univers original).

export const BESTIAIRE = {
  fossoyeur: {
    name: 'Le Fossoyeur', title: 'Gardien de l\'Ossuaire',
    text: 'Il a enterré tout le monde, un jour ou l\'autre. Il garde les âmes que la Fange recrache et les distribue à qui ose s\'asseoir. Sous le masque, une fente. Derrière la fente, la faim.',
    stats: { Avidité: 3, Ruse: 5, Foi: 1, Volonté: 4 }, align: 0.08,
    items: [['candle', 'Lanterne sans huile', 'Brûle avec ce qu\'elle trouve.'], ['skull', 'Pelle des dix mille fosses', 'Le manche est poli par les adieux.']],
    say: { bust: 'Elles se sont reconnues.', win: 'L\'Ossuaire a faim.', stay: 'Prudent. Pour l\'instant.', taunt: 'Encore une ?' },
  },
  clous: {
    name: 'La Mère-aux-Clous', title: 'Veuve de la septième veille',
    text: 'Chaque clou est une prière qu\'on n\'a pas exaucée. Elle en compte trente-quatre. Elle joue sans hâte : elle a déjà tout perdu une fois.',
    stats: { Avidité: 1, Ruse: 4, Foi: 5, Volonté: 3 }, align: 0.42,
    items: [['bell', 'Marteau de veille', 'Pour le trente-cinquième.'], ['scroll', 'Voile noir', 'Cousu de cheveux d\'enfants.']],
    say: { bust: 'Encore un clou.', win: 'Je me souviens de toi.', stay: 'Assez.', taunt: 'Tire, mon petit.' },
  },
  terreau: {
    name: 'Le Chevalier-Terreau', title: 'Mort debout, enterré de même',
    text: 'Tombé au champ d\'honneur, enterré dans son armure. La terre a pris sa place dans le heaume et quelque chose y a pris racine. Il tire toujours une âme de trop.',
    stats: { Avidité: 5, Ruse: 1, Foi: 2, Volonté: 5 }, align: 0.3,
    items: [['helm', 'Heaume fertile', 'Des vers y font leur nid.'], ['coin', 'Obole de bronze', 'Il ne sait plus à qui la donner.']],
    say: { bust: '…', win: 'HONNEUR.', stay: 'Assez de terre.', taunt: 'ENCORE.' },
  },
  cierge: {
    name: 'L\'Enfant-Cierge', title: 'Né d\'une chapelle noyée',
    text: 'Né d\'un cierge oublié dans une chapelle engloutie. Il rit quand les âmes se déchirent. Personne ne sait ce qu\'il pense, lui non plus.',
    stats: { Avidité: 3, Ruse: 3, Foi: 4, Volonté: 1 }, align: 0.55,
    items: [['candle', 'Mèches de rechange', 'Toujours sept.'], ['skull', 'Hochet d\'os', 'Il ne le lâche jamais.']],
    say: { bust: 'Hi hi hi.', win: 'Encore ! Encore !', stay: 'Peur du noir ?', taunt: 'Elle va te mordre.' },
  },
};

export const HELMS = ['Heaume-Lune', 'Cornes de bouc', 'Auréole de cuivre', 'Mitre de fer'];

export const PACTE = [
  ['grab', 'Arracher', 'Tirer une âme de l\'Ossuaire. Elle vaut son rang.'],
  ['fist', 'Se retirer', 'Garder ce qu\'on tient. La main est encaissée.'],
  ['skull', 'Profanation', 'Deux âmes du même rang : elles te déchirent. Rien ne compte.'],
  ['seal', 'Sept Sceaux', 'Sept rangs différents : +15 et la manche s\'arrête net.'],
  ['frost', 'Givre', 'Fige un joueur, toi compris. Il encaisse et sort.'],
  ['bell', 'Trois Glas', 'La cible arrache trois âmes, sans pouvoir refuser.'],
  ['hourglass', 'Sursis', 'Annule une Profanation, puis se consume.'],
  ['coin', 'Obole', '+2 à +10, ajoutées à la main.'],
  ['crown', 'Couronne', 'Double les âmes de la main (pas les oboles).'],
];

export const INTRO = [
  { scene: 'corridor', palette: 'rouille', lines: ['Anno Domini 1349.', 'Tu es mort dans la Fange, pèlerin.', 'Ton armure t\'a suivi. Ta chair, non.'] },
  { scene: 'fossoyeur', palette: 'velin', speaker: 'Le Fossoyeur', lines: ['Encore un qui frappe à ma dalle.', 'Assieds-toi. Ici, on joue des âmes.'] },
  { scene: 'table', palette: 'fange', speaker: 'Le Fossoyeur', lines: ['Arrache-moi deux cents âmes et je te rouvre la dalle.', 'Mais si deux âmes du même rang se reconnaissent dans ta main…', '…elles te déchirent.'] },
];
export const INTRO_SHORT = [
  { scene: 'fossoyeur', palette: 'velin', speaker: 'Le Fossoyeur', lines: ['Te revoilà.', 'Deux cents âmes. Pas une de moins.'] },
];
