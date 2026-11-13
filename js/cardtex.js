// Textures des cartes posées sur la table (3D) : on puise dans les gravures de cardart.js.
//   faceTex : face « de table » (chiffre géant lisible de loin + gravure en rappel)
//   artTex  : la carte entière · backTex : le dos
import { THREE } from './render.js';
import { cardCanvas, tableCanvas, backCanvas } from './cardart.js';

let owned = () => true;               // (v) => la gravure de ce rang est-elle gagnée ?
let deckOf = () => 0;                 // () => le deck en jeu
export function setOwned(fn, deck) { owned = fn; if (deck) deckOf = deck; clearFaces(); }
const cache = new Map();
const toTex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; return t; };
const get = (k, make) => { if (!cache.has(k)) cache.set(k, toTex(make())); return cache.get(k); };
export function faceTex(card) { const v = card.v ?? 0, o = owned(v), d = deckOf(); return get('t' + d + ':' + v + o, () => tableCanvas(v, !o, d)); }
export function artTex(card, plain = !owned(card.v ?? 0)) { const v = card.v ?? 0, d = deckOf(); return get('a' + d + ':' + v + plain, () => cardCanvas(v, plain, d)); }
export function backTex() { const d = deckOf(); return get('back' + d, () => backCanvas(d)); }
export function clearFaces() { for (const t of cache.values()) t.dispose(); cache.clear(); }
