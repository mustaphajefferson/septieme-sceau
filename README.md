# VII — Le Septième Sceau

> *Guide officiel du pèlerin · Vol. I*
> « Arrache deux cents âmes au Fossoyeur, et il te rouvrira la dalle. »

Jeu de cartes à risque (règles inspirées de *Flip 7*), présenté comme un vieux jeu dark fantasy et son guide officiel : vue subjective en 3D tramée (dither Bayer, palettes de 5 tons), gantelets du pèlerin qui prennent les cartes, créatures autour de la table, interface façon MMO à l'ancienne.

## L'univers (original)

Anno Domini 1349. Tu es mort dans la Fange. Sous la septième dalle de l'Ossuaire de Vaulmorte, le **Fossoyeur** tient une table : on y joue des âmes. Arrache-lui deux cents âmes et il te rouvre la dalle. Mais deux âmes du même rang dans ta main se reconnaissent et te déchirent.

Créatures : **le Fossoyeur**, **la Mère-aux-Clous**, **le Chevalier-Terreau**, **l'Enfant-Cierge**. Les autres joueurs humains apparaissent en pèlerins casqués (4 heaumes au choix).

| Flip 7 | Le Septième Sceau |
|---|---|
| Tirer / Rester | Arracher / Se retirer |
| Bust | Profanation |
| Flip 7 (+15) | Les Sept Sceaux |
| Freeze / Flip Three / Second Chance | Givre / Trois Glas / Sursis |
| +2…+10 / ×2 | Oboles / Couronne |

## Modes

- **Affronter le Fossoyeur** : 1 à 4 créatures IA, chacune avec son tempérament.
- **Convier des vivants** : table privée, lien `?table=CODE` ; l'hôte peut asseoir des créatures. Discussion dans la taverne et en jeu.
- **Briser un sceau** : rejoindre avec le code de 5 lettres.
- **Errer** : table publique au hasard.

Multijoueur pair-à-pair (WebRTC via PeerJS) : site 100 % statique.

## Commandes

`1` / `A` / `Espace` : arracher · `2` / `R` : se retirer · `Entrée` : parler (multijoueur) · clic sur une créature ou un portrait pour viser (Givre, Trois Glas, Sursis).

## Structure

```
js/render.js    rendu basse résolution + tramage/palettes (shader)
js/world.js     crypte, table, créatures, gantelets, décor de couverture
js/stage.js     scène de jeu : animations des mains et des cartes, effets
js/play.js      interface de jeu (portraits, jauges, barre d'action, journal)
js/gallery.js   portraits et cases de la cinématique (rendus tramés fixes)
js/cardtex.js   faces de cartes PLACEHOLDER
js/icons.js     icônes pixel 16×16
js/lore.js      textes du guide (bestiaire, pacte, cinématique)
js/game.js      moteur de règles · js/ai.js IA · js/net.js réseau · js/audio.js son
vendor/         three.js, PeerJS · fonts/ Jacquard 24, Jacquarda Bastarda 9, Grenze Gotisch (OFL)
```

## Lancer en local

```
python3 -m http.server 8000
```

## À venir

Illustrations définitives des cartes (`js/cardtex.js`), animations propres à chaque carte.
