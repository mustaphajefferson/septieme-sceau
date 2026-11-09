# VII — Le Septième Sceau

> « Arrache deux cents âmes à la Mort, et elle te rendra la tienne. »

Jeu de cartes à risque (règles inspirées de *Flip 7*), dark fantasy médiéval, rendu tout en caractères ASCII et en trame 1-bit.

**Anno Domini 1349.** La peste t'a pris. La Mort s'ennuie, elle te propose une partie. Elle tient l'**Ossuaire** : 94 âmes. Chaque carte que tu tires est une âme que tu lui arraches. Deux âmes du même rang dans ta main se reconnaissent et se déchirent (**Profanation**) : tu perds la manche. Atteins 200 âmes pour racheter ta vie.

| Flip 7 | Le Septième Sceau |
|---|---|
| Tirer / Rester | Arracher une âme / Se retirer |
| Pioche / Défausse | L'Ossuaire / La Fosse |
| Bust | Profanation |
| Flip 7 (+15) | Les Sept Sceaux brisés (+15) |
| Freeze | Givre |
| Flip Three | Les Trois Glas |
| Second Chance | Sursis |
| +2 … +10 / ×2 | Oboles / Couronne |

## Modes

- **Affronter la Mort** : contre 1 à 3 adversaires IA (la Mort, le Flagellant, la Veuve), chacun avec son tempérament face au risque.
- **Convier des vivants** : crée une table privée, partage le lien `?table=CODE`. L'hôte peut aussi asseoir des IA.
- **Rejoindre une table** : entre le sceau de 5 lettres.
- **Errer** : partie aléatoire, rejoint une table publique ou en ouvre une (lancement auto à 2 joueurs ou plus).

Le multijoueur est en pair-à-pair (WebRTC via [PeerJS](https://peerjs.com)) : aucun serveur à héberger, le site reste 100 % statique.

## Structure

```
index.html
css/style.css        direction artistique
js/main.js           écrans, menu, salons, cinématique
js/game.js           moteur de règles (94 cartes, actions, score)
js/ai.js             adversaires IA
js/table.js          table de jeu, animations des cartes
js/cards.js          cartes PLACEHOLDER (à remplacer par les illustrations)
js/ascii.js          moteur ASCII (épée raymarchée, faucheuse, pluie, titres) + trame Bayer
js/fx.js             particules de caractères, flash, secousse, textes brouillés
js/audio.js          musique + effets synthétisés (Web Audio)
js/net.js            multijoueur PeerJS
audio/               fichiers son optionnels (voir audio/LISEZMOI.md)
fonts/               UnifrakturMaguntia, JetBrains Mono, Cormorant Garamond (OFL)
```

## Lancer en local

```
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000

## À venir

- Illustrations des 13 rangs d'âmes, des actes et des oboles (les cartes actuelles sont des placeholders : `js/cards.js`).
- Animations propres à chaque carte.
