# Son — VII · Le Septième Sceau

Par défaut **tout le son est synthétisé en direct** (Web Audio) : bourdon grave, chœur en ré mineur, vent, glas lointains, battements de cœur qui accélèrent quand le risque de Profanation monte, et un effet pour chaque action. Aucun fichier n'est nécessaire.

Pour remplacer une musique ou un effet par un vrai fichier :

1. Dépose le fichier dans ce dossier `audio/` (`.mp3` ou `.ogg`).
2. Ouvre `audio/manifest.json` et remplace le `null` correspondant par le chemin, par exemple :

```json
{
  "menu": "audio/menu.ogg",
  "table": "audio/table.ogg",
  "sfx": { "flip": "audio/card-flip.ogg", "bust": "audio/impact.ogg" }
}
```

Tout ce qui reste à `null` continue d'être synthétisé.

## Pistes repérées (libres de droits)

Musique d'ambiance

| Piste | Usage conseillé | Licence |
|---|---|---|
| [Dungeon Ambience — yd](https://opengameart.org/content/dungeon-ambience) | table de jeu | CC0 |
| [Insistent — yd](https://opengameart.org/comment/17169) | table (tension) | CC0 |
| [Dark Cavern Ambient — Paul Wortmann](https://opengameart.org/node/131394) | menu | CC0 |
| [Cathedral in the forest (loop) — congusbongus](https://opengameart.org/content/cathedral-in-the-forest-ambient-loop) | menu (cloches, nappes) | CC0 |
| [Dark Place (loop) — SkyleTheFrench](https://opengameart.org/node/159643) | menu | CC0 |
| [Vampire's Piano — TAD](https://opengameart.org/comment/97268) | écran de fin | CC0 |
| [Dark Fantasy Ambient (Dungeon Synth) — DeusLower](https://pixabay.com/users/deuslower-45666444) | menu / table | licence Pixabay |

Effets

| Pack | Contenu | Licence |
|---|---|---|
| [Kenney — Casino Audio](https://kenney.nl/assets/casino-audio) | 50 sons de cartes, jetons, dés (pour `flip`, `whoosh`, `reshuffle`) | CC0 |
| [Loopable Dungeon Ambience — JaggedStone](https://opengameart.org/node/143245) | vent + gouttes, à superposer | CC0 |
