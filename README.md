# VII — Le Septième Sceau

Jeu de cartes à risque (règles de *Flip 7*), dark fantasy, entièrement tramé en points (dither 1-bit).

Tu joues un chevalier qui parie les âmes de ceux qu'il a tués. Sur la route — la Forêt des Pendus, le Pont-levis, le Château du Roi déchu — tu affrontes 12 adversaires en duels à paliers (premier à 30, puis 50, puis 100, puis 200 contre le boss, qui distribue les cartes avant de s'asseoir). Chaque victoire te donne l'élément que porte l'adversaire et l'illustration d'un rang de carte. Si tu perds, les âmes te réclament : tu renais au début de la zone, en gardant ce que tu as gagné.

## Écrans
Titre (le lieu de ta prochaine bataille) → ton chevalier (pose différente à chaque retour, avec tout ce qui est débloqué) → la route → le duel (vue subjective, cartes posées sur la table, clic sur une carte pour l'inspecter) → le butin.

## Raccourcis de test
`?reset` efface la progression · `?jusqua=N` simule N victoires.

## Structure
```
js/dither.js   tramage 1-bit (GPU) et tramage des images fixes
js/paint.js    matières peintes : métal rayé, mailles, bois, pierre, tissu, fourrure
js/figure.js   chevalier articulé, 4 poses, pièces débloquables, adversaires, gantelets
js/places.js   lieux, vitrail, cadres, ambiances (brume, pluie, cendres)
js/cards.js    faces de cartes (rangs débloqués = portrait de l'adversaire vaincu)
js/content.js  zones, adversaires, récompenses
js/duel.js     la table
js/main.js     écrans et progression
js/game.js     moteur de règles · js/ai.js adversaires · js/audio.js son
```
Lancer en local : `python3 -m http.server 8000`
