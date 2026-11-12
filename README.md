# VII — Le Septième Sceau

Jeu de cartes à risque (règles de *Flip 7*), dark fantasy à l'ancienne : rendu tramé façon vieux jeu, guide du pèlerin, vue subjective à la table.

Tu es un pèlerin qui parie les âmes de ceux qu'il a tués. La route mène de la Forêt des Pendus au Pont-levis puis au Château du Roi déchu : 12 duels (premier à 30, puis 50, puis 100 ; le boss donne les cartes puis s'assoit : premier à 200). Chaque victoire donne au rang N le visage du vaincu et une relique au choix, qui rejoint ton deck (elle ne sert que toi : si l'adversaire la tire, elle brûle). Perdre, c'est renaître au début du lieu, en gardant visages et reliques.

## Écrans
Accueil (le lieu du prochain duel, en ASCII) → le seuil (« Que veux-tu faire ? ») → la route · ton deck · Pacte & Bestiaire → la table → le butin (ou la mort).

## Raccourcis de test
`?reset` efface la progression · `?jusqua=N` simule N victoires.

## Structure
```
js/content.js  zones, adversaires, reliques, textes du bestiaire
js/world.js    décors (extérieurs, table par lieu), créatures, gantelets
js/stage.js    la table en vue subjective · js/play.js mise en scène et interface
js/handview.js cartes tenues en main · js/cardtex.js faces de cartes
js/render.js   tramage en palette · js/asciiview.js accueil ASCII
js/main.js     écrans et progression · js/game.js règles · js/ai.js adversaires
```
Lancer en local : `python3 -m http.server 8000`
