// ─────────────────────────────────────────────────────────────
//  Vue ASCII : une scène 3D est rendue en toute petite taille,
//  relue pixel par pixel et redessinée en caractères, avec une
//  pluie oblique par-dessus. Sert à l'accueil et au seuil.
// ─────────────────────────────────────────────────────────────
import { THREE } from './render.js';

const RAMP = ' .`,:;-~+=*xoX#%@';
const BONE = [222, 218, 204], WARM = [242, 166, 88];

export class AsciiView {
  constructor(canvas, renderer) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.renderer = renderer;
    this.rt = new THREE.WebGLRenderTarget(8, 8, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.drops = [];
    this.chars = []; this.prev = [];
    this.resize();
  }
  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = innerWidth, h = innerHeight;
    this.w = w; this.h = h;
    this.canvas.width = w * dpr; this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.fs = w < 600 ? 7 : w < 1100 ? 9 : 10;
    this.ctx.font = `${this.fs}px "JBM", ui-monospace, monospace`;
    this.cw = this.ctx.measureText('MMMMMMMMMM').width / 10;
    this.ch = Math.round(this.fs * 1.05);
    this.cols = Math.ceil(w / this.cw); this.rows = Math.ceil(h / this.ch);
    this.rt.setSize(this.cols, this.rows);
    this.buf = new Uint8Array(this.cols * this.rows * 4);
    this.chars = new Array(this.cols * this.rows).fill(' ');
    this.prev = new Int8Array(this.cols * this.rows).fill(-1);
    const n = Math.round((w * h) / 5200);
    this.drops = Array.from({ length: n }, () => this.drop(true));
  }
  drop(any) {
    return { x: Math.random() * (this.w + 200) - 100, y: any ? Math.random() * this.h : -20 - Math.random() * 100, v: 520 + Math.random() * 380, l: 8 + Math.random() * 18, a: 0.25 + Math.random() * 0.55 };
  }

  render(scene, camera, dt, { dim = 1 } = {}) {
    const { cols, rows, cw, ch, ctx } = this;
    camera.aspect = (cols * cw) / (rows * ch); camera.updateProjectionMatrix();
    const r = this.renderer;
    r.setRenderTarget(this.rt); r.render(scene, camera); r.setRenderTarget(null);
    r.readRenderTargetPixels(this.rt, 0, 0, cols, rows, this.buf);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.w, this.h);
    ctx.font = `${this.fs}px "JBM", ui-monospace, monospace`;
    ctx.textBaseline = 'top';
    const LV = 5, R = RAMP.length - 1;
    const lines = Array.from({ length: LV * 2 }, () => new Array(cols));
    for (let j = 0; j < rows; j++) {
      for (const l of lines) l.fill(' ');
      let any = false;
      const sy = rows - 1 - j;
      for (let i = 0; i < cols; i++) {
        const p = (sy * cols + i) * 4;
        const rr = this.buf[p] / 255, gg = this.buf[p + 1] / 255, bb = this.buf[p + 2] / 255;
        let L = Math.pow(0.3 * rr + 0.59 * gg + 0.11 * bb, 0.55);
        L = Math.min(1, Math.max(0, (L - 0.14) / 0.72)) * dim;
        if (L < 0.07) { this.prev[j * cols + i] = -1; continue; }
        if (L > 1) L = 1;
        const warm = rr > gg * 1.3 && rr > bb * 1.8 && rr > 0.25;
        const c = j * cols + i;
        const idx = Math.round(L * R);
        if (idx !== this.prev[c] || Math.random() < 0.02) { this.chars[c] = RAMP[Math.max(1, Math.min(R, idx + (Math.random() < 0.2 ? (Math.random() < 0.5 ? -1 : 1) : 0)))]; this.prev[c] = idx; }
        lines[(warm ? LV : 0) + Math.min(LV - 1, Math.floor(L * LV))][i] = this.chars[c];
        any = true;
      }
      if (!any) continue;
      for (let k = 0; k < LV * 2; k++) {
        const s = lines[k].join('');
        if (!s.trim()) continue;
        const warm = k >= LV, lv = k % LV, a = 0.3 + 0.7 * ((lv + 1) / LV);
        const [cr, cg, cb] = warm ? WARM : BONE;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${a.toFixed(2)})`;
        ctx.fillText(s, 0, j * ch);
      }
    }
    // pluie oblique
    ctx.strokeStyle = 'rgba(222,218,204,.6)'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (const d of this.drops) {
      d.y += d.v * dt; d.x += d.v * 0.32 * dt;
      if (d.y > this.h + 20) Object.assign(d, this.drop(false));
      ctx.moveTo(Math.round(d.x), Math.round(d.y)); ctx.lineTo(Math.round(d.x - d.l * 0.32), Math.round(d.y - d.l));
    }
    ctx.stroke();
  }
}
