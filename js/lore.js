// Le monde de la Fange — textes du guide (univers original).

import { FOES, LORE } from './content.js';
export const BESTIAIRE = Object.fromEntries(FOES.map((f, i) => ['f' + i, { name: f.name, ...LORE[i] }]));

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
  ['candle', 'Reliques', 'Gagnées sur la route, elles rejoignent ton deck. Elles ne servent que toi : un autre qui en tire une la voit brûler.'],
];

