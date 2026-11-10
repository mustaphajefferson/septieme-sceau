# VII — Le Septième Sceau

Jeu de cartes à risque (règles de *Flip 7*), dark fantasy, rendu en 3D (three.js) puis entièrement tramé en points (dither 1-bit).

Tu joues un chevalier qui parie les âmes de ceux qu'il a tués. Sur la route — la Forêt des Pendus, le Pont-levis, le Château du Roi déchu — tu affrontes 12 adversaires en duels à paliers (premier à 30, puis 50, puis 100, puis 200 contre le boss, qui distribue les cartes avant de s'asseoir). Chaque victoire te donne l'élément que porte l'adversaire et l'illustration d'un rang de carte. Si tu perds, les âmes te réclament : tu renais au début de la zone, en gardant ce que tu as gagné.

## Écrans
Titre (le lieu de ta prochaine bataille) → ton chevalier (pose différente à chaque retour, avec tout ce qui est débloqué) → la route → le duel (vue à la troisième personne : ton chevalier de dos à la table, l'adversaire en face, le boss qui donne ; il hoche la tête pour tirer, la secoue pour s'arrêter ; clic sur une carte pour l'inspecter) → le butin.

## Raccourcis de test
`?reset` efface la progression · `?jusqua=N` simule N victoires.

## Structure
```
js/dither.js   tramage 1-bit (GPU) et tramage des images fixes
js/r3d.js      rendu 3D : reflets, ombres, matières (acier, mailles, tissu, os, bois, pierre)
js/body3d.js   figures 3D articulées (IK), poses, 12 pièces débloquables, adversaires
js/world3d.js  décors 3D (forêt, pont-levis, salle du trône, scène), portraits
js/duel3d.js   la table en 3D, cartes, gestes
js/paint.js    textures procédurales · js/places.js cadres et ambiances 2D
js/cards.js    faces de cartes (rangs débloqués = portrait 3D de l'adversaire vaincu)
js/content.js  zones, adversaires, récompenses
vendor/        three.js (MIT)
js/main.js     écrans et progression
js/game.js     moteur de règles · js/ai.js adversaires · js/audio.js son
```
Lancer en local : `python3 -m http.server 8000`
