# VII — Le Septième Sceau

Jeu de cartes à risque (règles de *Flip 7*), dark fantasy à l'ancienne : rendu tramé façon vieux jeu, guide du pèlerin, vue subjective à la table.

Tu es un pèlerin qui parie les âmes de ceux qu'il a tués. La route mène de la Forêt des Pendus au Pont-levis puis au Château du Roi déchu : 12 duels (premier à 30, puis 50, puis 100 ; le boss donne les cartes puis s'assoit : premier à 200). Chaque victoire donne au rang N le visage du vaincu et une relique au choix, qui rejoint ton deck (elle ne sert que toi : si l'adversaire la tire, elle brûle). Perdre, c'est renaître au début du lieu, en gardant visages et reliques.

## Écrans
Accueil tramé (le lieu du prochain duel) → Continuer · Deck (ton deck étalé sur la table) → la table (pause pour les infos) → le butin (ou la mort).

## Raccourcis de test
`?reset` efface la progression · `?jusqua=N` simule N victoires.

## Structure
```
js/content.js  zones, adversaires, reliques, textes du bestiaire
js/world.js    décors (extérieurs, table par lieu), créatures, gantelets
js/stage.js    la table en vue subjective · js/play.js mise en scène et interface
js/handview.js cartes tenues en main · js/cardtex.js faces de cartes
js/render.js   tramage en palette
js/main.js     écrans et progression · js/game.js règles · js/ai.js adversaires
```
Lancer en local : `python3 -m http.server 8000`

## Illustrations en points (`art/`)
Les dessins tramés 1 bit sont lus point par point et animés (`js/dots.js`) : le cadre de racines (tous les écrans + transitions), le cadre d'épines des boutons, et les personnages dessinés assis à la table.
Format : PNG en niveaux de gris — 255 = point, 128 = fond plein derrière le dessin, 0 = vide. Pour un personnage, ajouter son entrée dans `ILLUS` (`js/content.js`) et `art: 'nom'` sur l'adversaire.
