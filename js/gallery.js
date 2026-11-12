// Rendus fixes tramés : portraits du bestiaire, cases de la cinématique.
import { THREE } from './render.js';
import { CREATURES, makeCreature, buildCrypt, buildCover, makeGauntlet, TABLE } from './world.js';

const cache = new Map();
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

function lightRig(scene, warm = true) {
  scene.add(new THREE.HemisphereLight(0xb0bca0, 0x141410, 3.2));
  const key = new THREE.PointLight(warm ? 0xffecd0 : 0xe8f0d8, 38, 5, 1); key.position.set(-0.35, 1.75, -0.9); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 1.6); fill.position.set(0.3, 1.6, -2); scene.add(fill);
  const rim = new THREE.PointLight(0xd8e8c0, 12, 4, 1); rim.position.set(0.7, 2.0, 0.5); scene.add(rim);
}

export function portrait(dr, kind, { variant = 0, palette = 'velin', w = 96, h = 112, bg = 0x000000 } = {}) {
  const k = [kind, variant, palette, w, h, bg].join('|');
  if (cache.has(k)) return cache.get(k);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(bg);
  const cr = makeCreature(kind, variant);
  scene.add(cr.root);
  cr.update(0.5, null, 0); cr.head.rotation.y = 0.25;
  lightRig(scene);
  const headY = cr.head.getWorldPosition(new THREE.Vector3()).y;
  const cam = new THREE.PerspectiveCamera(32, w / h, 0.05, 20);
  cam.position.set(0.18, headY - 0.02, -1.25); cam.lookAt(0, headY - 0.12, 0);
  const cv = dr.still(scene, cam, w, h, palette);
  const url = cv.toDataURL();
  cache.set(k, url); cache.set(k + '#cv', cv);
  return url;
}

export function panel(dr, which, palette, w = 320, h = 220) {
  const k = which + palette + w + 'x' + h;
  if (cache.has(k)) return cache.get(k);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, w / h, 0.05, 40);
  if (which === 'corridor') {
    const c = buildCover(scene); c.tick(3);
    cam.position.set(2.6, 1.2, -1.2); cam.lookAt(0.6, 1.4, -9);
  } else if (which === 'fossoyeur') {
    scene.background = new THREE.Color(0);
    const cr = CREATURES.fossoyeur(); scene.add(cr.root); cr.update(1, null, 0);
    cr.flames?.forEach((f) => f.userData.flicker(1));
    lightRig(scene, true);
    const k2 = new THREE.PointLight(0xffe8c8, 14, 3, 1); k2.position.set(-0.6, 1.3, -0.7); scene.add(k2);
    cam.position.set(-0.25, 1.45, -0.95); cam.lookAt(0, 1.4, 0);
  } else {
    const crypt = buildCrypt(scene); crypt.tick(1);
    const kinds = ['clous', 'fossoyeur', 'terreau', 'cierge'];
    kinds.forEach((kd, i) => {
      const a = -0.95 + i * 0.63, d = V3(Math.sin(a), 0, -Math.cos(a));
      const cr = makeCreature(kd); const sp = TABLE.c.clone().add(d.multiplyScalar(TABLE.r + 0.42)); sp.y = 0;
      cr.root.position.copy(sp); cr.root.lookAt(V3(TABLE.c.x, 0, TABLE.c.z)); cr.root.rotateY(Math.PI); scene.add(cr.root); cr.update(1, null, 0);
      cr.flames?.forEach((f) => f.userData.flicker(1));
    });
    const hand = makeGauntlet(1); hand.position.set(0.25, 0.87, -0.15); hand.scale.setScalar(1.25); scene.add(hand);
    cam.position.set(0, 1.75, 0.6); cam.lookAt(0, 0.9, -1.4);
  }
  const cv = dr.still(scene, cam, w, h, palette);
  const url = cv.toDataURL();
  cache.set(k, url); cache.set(k + '#cv', cv);
  return url;
}

export function portraitCanvas(dr, kind, opts = {}) {
  const k = [kind, opts.variant || 0, opts.palette || 'velin', opts.w || 96, opts.h || 112, opts.bg ?? 0].join('|');
  if (!cache.has(k + '#cv')) portrait(dr, kind, opts);
  return cache.get(k + '#cv');
}
