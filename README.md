# VII — Le Septième Sceau

Jeu de cartes à risque (règles de *Flip 7*), dark fantasy à l'ancienne : rendu tramé façon vieux jeu, vue subjective à la table.

La route mène de la Forêt des Pendus au Pont-levis puis au Château du Roi déchu : 12 duels (premier à 30, puis 50, puis 100 ; le boss donne les cartes puis s'assoit : premier à 200). Chaque victoire fait gagner la carte gravée du rang suivant (12 cartes à collectionner, plus le Néant). Perdre, c'est renaître au début du lieu, en gardant les cartes gagnées.

## Écrans
Accueil (cadre de racines, le lieu du prochain duel) → Continuer · Deck (le deck étalé sur la table, chaque carte s'inspecte) → la table (pause pour les infos) → le décompte de chaque manche → la carte gagnée (ou la mort).

Trois parcours, chacun avec son deck de 13 cartes gravées (+ ses cartes bonus), ses cinématiques et ses règles :
- **Le Chevalier** (Forêt des Pendus → Pont-levis → Château du Roi déchu) : duels, chiffres seulement. Paliers 30/50/100/200.
- **Le Squelette** (Limbes → Fleuve noir → Cathédrale d'Os, boss : l'Ange du Jugement) : les cartes bonus arrivent lieu par lieu (+N et ×2, puis Gel et Sursis, puis Trois cartes). Paliers 50/100/150/200.
- **La Sorcière** (Marais → Cimes gelées → Antre du Dragon) : tables de 3, 4, 5 joueurs (6 contre le Dragon), paquet complet. Paliers 80/120/160/200.
- **Table libre** (après les trois) : le Flip 7 complet, 1 à 6 adversaires, lieu et deck au choix.

## Raccourcis de test
`?reset` efface la progression · `?jusqua=N` simule N victoires · `?parcours=2` / `?parcours=3` ouvre le parcours du squelette / de la sorcière.
Bouton **dev** (en bas à gauche, `DEV` dans `js/main.js`) : gagner, sauter un duel ou un lieu, rejouer les cinématiques. **À retirer avant la sortie.**

## Structure
```
js/cardart.js  moteur des cartes + deck du chevalier · js/cards2.js squelette · js/cards3.js sorcière
js/specials.js cartes bonus (Gel, Trois cartes, Sursis, +N, ×2)
js/plates.js   planches des cinématiques · js/cine.js le lecteur · js/story.js les textes
js/fx2d.js     la plongée vers le duel
js/cardview.js la carte en grand : parallaxe des calques + reflet irisé tramé
js/cardtex.js  textures des cartes posées sur la table
js/dotui.js    l'interface « en points » : bordures, trames, balayages (variables CSS)
js/dots.js     cadre de racines (accueil) et transitions tramées
js/content.js  zones, adversaires, textes du bestiaire
js/world.js    décors, créatures, gantelets · js/stage.js la table
js/play.js     mise en scène, plaques des joueurs, décompte animé
js/render.js   tramage en palette · js/main.js écrans et progression
js/game.js     règles · js/ai.js adversaires
```
Lancer en local : `python3 -m http.server 8000`

## Cadre de racines (`art/cadre-racines.png`)
PNG en niveaux de gris lu point par point : 255 = point, 128 = fond plein, 0 = vide.
