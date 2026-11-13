// Textures des cartes posées sur la table (3D) : on puise dans les gravures de cardart.js.
//   faceTex : face « de table » (chiffre géant lisible de loin + gravure en rappel)
//   artTex  : la carte entière (deck étalé)
//   backTex : le dos
import { THREE } from './render.js';
import { cardCanvas, tableCanvas, backCanvas } from './cardart.js';

let owned = () => true;               // (v) => la gravure de ce rang est-elle gagnée ?
export function setOwned(fn) { owned = fn; clearFaces(); }
const cache = new Map();
const toTex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; return t; };
const get = (k, make) => { if (!cache.has(k)) cache.set(k, toTex(make())); return cache.get(k); };
export function faceTex(card) { const v = card.v ?? 0, o = owned(v); return get('t' + v + o, () => tableCanvas(v, !o)); }
export function artTex(card, plain = !owned(card.v ?? 0)) { const v = card.v ?? 0; return get('a' + v + plain, () => cardCanvas(v, plain)); }
export function backTex() { return get('back', () => backCanvas()); }
export function clearFaces() { for (const t of cache.values()) t.dispose(); cache.clear(); }
