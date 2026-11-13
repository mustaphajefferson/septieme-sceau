# VII — Le Septième Sceau

Jeu de cartes à risque (règles de *Flip 7*), dark fantasy à l'ancienne : rendu tramé façon vieux jeu, vue subjective à la table.

La route mène de la Forêt des Pendus au Pont-levis puis au Château du Roi déchu : 12 duels (premier à 30, puis 50, puis 100 ; le boss donne les cartes puis s'assoit : premier à 200). Chaque victoire fait gagner la carte gravée du rang suivant (12 cartes à collectionner, plus le Néant). Perdre, c'est renaître au début du lieu, en gardant les cartes gagnées.

## Écrans
Accueil (cadre de racines, le lieu du prochain duel) → Continuer · Deck (le deck étalé sur la table, chaque carte s'inspecte) → la table (pause pour les infos) → le décompte de chaque manche → la carte gagnée (ou la mort).

Deux parcours : **le Chevalier** (Forêt des Pendus → Pont-levis → Château du Roi déchu) puis **le Squelette** (Limbes → Fleuve noir → Cathédrale d'Os), chacun avec son deck de 13 cartes gravées et ses cinématiques (intro + règles, passages entre lieux, boss final, fin).

## Raccourcis de test
`?reset` efface la progression · `?jusqua=N` simule N victoires · `?parcours=2` ouvre le parcours du squelette.
Bouton **dev** (en bas à gauche, `DEV` dans `js/main.js`) : gagner, sauter un duel ou un lieu, rejouer les cinématiques. **À retirer avant la sortie.**

## Structure
```
js/cardart.js  les 13 gravures du chevalier (originales), calques tramés · js/cards2.js le deck du squelette
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
