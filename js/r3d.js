// ─────────────────────────────────────────────────────────────
//  Rendu 3D : three.js, reflets d'environnement, ombres douces,
//  matières procédurales (métal rayé, mailles, tissu, os, bois,
//  pierre). L'image 3D est ensuite composée en 2D puis tramée.
// ─────────────────────────────────────────────────────────────
import * as THREE from '../vendor/three.min.js';
import { scratchTex, clothTex, woodTex, stoneTex, furTex, canvas, rng, fbm, TAU } from './paint.js';
export { THREE };

let renderer = null, envTex = null;
export function getRenderer() {
  if (renderer) return renderer;
  const cv = document.createElement('canvas');
  renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const pm = new THREE.PMREMGenerator(renderer);
  envTex = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  return renderer;
}
export function env() { getRenderer(); return envTex; }
export function render(scene, camera, w, h) {
  const r = getRenderer();
  if (r.domElement.width !== w || r.domElement.height !== h) r.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  r.render(scene, camera);
  return r.domElement;
}

// ── textures ─────────────────────────────────────────────────
const tcache = new Map();
function tex(key, make, rep = [1, 1], color = false) {
  const k = key + rep.join('x');
  if (tcache.has(k)) return tcache.get(k);
  const t = new THREE.CanvasTexture(make());
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep);
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 4;
  tcache.set(k, t);
  return t;
}
export function mailAlpha() {
  const c = canvas(128, 128), x = c.getContext('2d');
  x.fillStyle = '#111'; x.fillRect(0, 0, 128, 128);
  const s = 16;
  for (let j = -1; j <= 13; j++) for (let i = -1; i <= 8; i++) {
    const cx = i * s + (j % 2 ? s / 2 : 0), cy = j * 10.67;
    const g = x.createLinearGradient(cx, cy - 6, cx, cy + 6); g.addColorStop(0, '#fff'); g.addColorStop(1, '#666');
    x.strokeStyle = g; x.lineWidth = 3.2; x.beginPath(); x.ellipse(cx, cy, s * 0.46, s * 0.4, 0, 0, TAU); x.stroke();
  }
  return c;
}
function noiseTex(scale = 20, seed = 1) {
  const c = canvas(256, 256), x = c.getContext('2d'), id = x.createImageData(256, 256), r = rng(seed);
  for (let i = 0; i < 256 * 256; i++) { const v = (fbm((i % 256) / scale, Math.floor(i / 256) / scale, 4) * 0.8 + r() * 0.2) * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  x.putImageData(id, 0, 0); return c;
}
export function tatterAlpha(seed = 3, holes = 10) {
  const c = canvas(256, 512), x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 512);
  x.fillStyle = '#000';
  x.beginPath(); x.moveTo(0, 512);
  for (let i = 0; i <= 24; i++) x.lineTo(i * 256 / 24, 512 - (i % 2 ? 40 + r() * 120 : r() * 30));
  x.lineTo(256, 512); x.fill();
  for (let i = 0; i < holes; i++) { x.beginPath(); x.ellipse(r() * 256, 200 + r() * 260, 4 + r() * 12, 8 + r() * 26, r() - 0.5, 0, TAU); x.fill(); }
  return c;
}

// ── matières ─────────────────────────────────────────────────
const M = {};
export function mats() {
  if (M.ok) return M;
  const e = env();
  const scr = tex('scr', scratchTex, [2, 2]), nz = tex('nz', () => noiseTex(18, 2), [2, 2]);
  const S = (o) => new THREE.MeshStandardMaterial({ envMap: e, ...o });
  Object.assign(M, {
    ok: true,
    steel: S({ color: 0x9c9a94, metalness: 1, roughness: 0.4, roughnessMap: scr, bumpMap: scr, bumpScale: 1.2, envMapIntensity: 0.75 }),
    steelDark: S({ color: 0x55534e, metalness: 1, roughness: 0.55, roughnessMap: scr, bumpMap: scr, bumpScale: 1.4, envMapIntensity: 0.6 }),
    brass: S({ color: 0xd8c08a, metalness: 1, roughness: 0.28, roughnessMap: scr, bumpMap: scr, bumpScale: 0.4 }),
    mail: S({ color: 0xb0b0ac, metalness: 1, roughness: 0.42, map: tex('mailc', mailAlpha, [10, 10], true), bumpMap: tex('mail', mailAlpha, [10, 10]), bumpScale: 3, side: THREE.DoubleSide }),
    mailUnder: S({ color: 0x222222, metalness: 0.6, roughness: 0.8 }),
    cloth: S({ color: 0x8a8880, metalness: 0, roughness: 1, map: tex('cloth', clothTex, [3, 3], true), bumpMap: tex('cloth', clothTex, [3, 3]), bumpScale: 1.5, side: THREE.DoubleSide, envMapIntensity: 0.3 }),
    clothDark: S({ color: 0x3a3a36, metalness: 0, roughness: 1, map: tex('cloth', clothTex, [3, 3], true), bumpMap: tex('cloth', clothTex, [3, 3]), bumpScale: 1.5, side: THREE.DoubleSide, envMapIntensity: 0.3 }),
    leather: S({ color: 0x3c3a36, metalness: 0, roughness: 0.6, bumpMap: nz, bumpScale: 1, envMapIntensity: 0.5 }),
    bone: S({ color: 0xe0dac6, metalness: 0, roughness: 0.55, bumpMap: nz, bumpScale: 2, envMapIntensity: 0.6 }),
    skin: S({ color: 0x8a8070, metalness: 0, roughness: 0.6, bumpMap: nz, bumpScale: 2, envMapIntensity: 0.4 }),
    fur: S({ color: 0x8a8478, metalness: 0, roughness: 1, map: tex('fur', furTex, [3, 3], true), bumpMap: tex('fur', furTex, [3, 3]), bumpScale: 4, envMapIntensity: 0.2 }),
    wood: S({ color: 0x9a8a70, metalness: 0, roughness: 0.85, map: tex('wood', woodTex, [2, 2], true), bumpMap: tex('wood', woodTex, [2, 2]), bumpScale: 2, envMapIntensity: 0.3 }),
    stone: S({ color: 0x8a8a84, metalness: 0, roughness: 0.95, map: tex('stone', stoneTex, [4, 4], true), bumpMap: tex('stone', stoneTex, [4, 4]), bumpScale: 3, envMapIntensity: 0.25 }),
    ground: S({ color: 0x55534c, metalness: 0, roughness: 1, map: tex('nzg', () => noiseTex(10, 7), [10, 10], true), bumpMap: tex('nzg', () => noiseTex(10, 7), [10, 10]), bumpScale: 4, envMapIntensity: 0.15 }),
    black: new THREE.MeshBasicMaterial({ color: 0x000000 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    wax: S({ color: 0xe8e2d0, metalness: 0, roughness: 0.5, envMapIntensity: 0.5 }),
    water: S({ color: 0x1a1a1a, metalness: 1, roughness: 0.08 }),
  });
  return M;
}

// ── petites aides de géométrie ───────────────────────────────
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export function mesh(geo, mat, { cast = true, recv = true } = {}) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; return m; }
export function at(o, x, y, z) { o.position.set(x, y, z); return o; }
export function rot(o, x = 0, y = 0, z = 0) { o.rotation.set(x, y, z); return o; }
export function lathe(pts, segs = 32, phiStart = 0, phiLen = TAU) { return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segs, phiStart, phiLen); }
export function tube(pts, r, segs = 24, rs = 8) { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => V(...p))), segs, r, rs, false); }
export function taper(pts, r0, r1, segs = 24) {
  const g = tube(pts, 1, segs, 8);
  const pos = g.attributes.position, n = g.parameters.tubularSegments, radial = g.parameters.radialSegments;
  const path = g.parameters.path;
  for (let i = 0; i <= n; i++) {
    const k = i / n, r = r0 + (r1 - r0) * k, c = path.getPointAt(k);
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j, p = V(pos.getX(idx), pos.getY(idx), pos.getZ(idx)).sub(c).multiplyScalar(r).add(c);
      pos.setXYZ(idx, p.x, p.y, p.z);
    }
  }
  g.computeVertexNormals();
  return g;
}
export function flameMesh(s = 1) {
  const g = new THREE.Group();
  const f = mesh(new THREE.SphereGeometry(0.012 * s, 10, 8), mats().glow, { cast: false }); f.scale.set(1, 2.6, 1); f.position.y = 0.025 * s; g.add(f);
  const l = new THREE.PointLight(0xffd8a0, 0.6 * s, 2.5 * s, 1.5); l.position.y = 0.05 * s; g.add(l);
  g.userData.tick = (t) => { const n = Math.sin(t * 13 + g.id) * 0.5 + Math.sin(t * 7.3 + g.id) * 0.5; f.scale.set(1 + n * 0.1, 2.6 + n * 0.5, 1); l.intensity = (0.55 + n * 0.12) * s; };
  return g;
}
export function candle3d(h = 0.16, r = 0.022) {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.CylinderGeometry(r, r * 1.1, h, 14), mats().wax), 0, h / 2, 0));
  for (let k = 0; k < 4; k++) { const d = mesh(new THREE.SphereGeometry(r * 0.35, 8, 6), mats().wax); d.scale.y = 2.5; at(d, Math.cos(k * 1.7) * r, h - 0.015 - k * 0.02, Math.sin(k * 1.7) * r); g.add(d); }
  g.add(at(mesh(new THREE.CylinderGeometry(r * 2, r * 2.4, 0.012, 16), mats().steelDark), 0, 0.006, 0));
  const f = flameMesh(1); at(f, 0, h + 0.004, 0); g.add(f); g.userData.flame = f;
  return g;
}

// rendu fixe (portraits de cartes, aperçus)
export function still(scene, camera, w, h) {
  const r = getRenderer();
  const pw = r.domElement.width, ph = r.domElement.height;
  r.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  r.render(scene, camera);
  const out = canvas(w, h); out.getContext('2d').drawImage(r.domElement, 0, 0);
  r.setSize(pw, ph, false);
  return out;
}
