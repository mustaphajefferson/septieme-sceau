// ─────────────────────────────────────────────────────────────
//  Son : musique d'ambiance + effets, synthétisés en direct
//  (Web Audio, aucun fichier requis). Pour utiliser tes propres
//  fichiers, remplis audio/manifest.json (voir audio/LISEZMOI.md).
// ─────────────────────────────────────────────────────────────

const N = (m) => 440 * Math.pow(2, (m - 69) / 12); // MIDI → Hz

class Sound {
  constructor() {
    this.ctx = null;
    this.vol = { music: 0.7, sfx: 0.85 };
    this.mode = null;
    this.timers = [];
    this.voices = [];
    this.files = {};
    this.tension = 0;
    try {
      const v = JSON.parse(localStorage.getItem('vii-vol') || 'null');
      if (v) this.vol = { ...this.vol, ...v };
    } catch { /* stockage indisponible */ }
  }

  async init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') await this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain(); this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp).connect(ctx.destination);
    this.music = ctx.createGain(); this.music.gain.value = this.vol.music * 0.8;
    this.sfx = ctx.createGain(); this.sfx.gain.value = this.vol.sfx;
    this.music.connect(this.master); this.sfx.connect(this.master);
    this.verb = ctx.createConvolver(); this.verb.buffer = this.impulse(4.2, 2.6);
    this.wet = ctx.createGain(); this.wet.gain.value = 0.55;
    this.verb.connect(this.wet).connect(this.master);
    this.noiseBuf = this.makeNoise(2);
    try {
      const r = await fetch('audio/manifest.json', { cache: 'no-store' });
      if (r.ok) this.files = await r.json();
    } catch { /* pas de manifeste : tout est synthétisé */ }
    // effets sonores remplacés par des fichiers (facultatif)
    this.buffers = {};
    for (const [name, url] of Object.entries(this.files?.sfx || {})) {
      if (!url) continue;
      fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)).then((buf) => { this.buffers[name] = buf; }).catch(() => {});
    }
  }

  setMuted(m) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
    if (this.track) this.track.muted = m;
  }

  setVolume(kind, v) {
    this.vol[kind] = v;
    try { localStorage.setItem('vii-vol', JSON.stringify(this.vol)); } catch { /* */ }
    if (!this.ctx) return;
    if (kind === 'music') { this.music.gain.setTargetAtTime(v * 0.8, this.ctx.currentTime, 0.1); if (this.track) this.track.volume = v; }
    else this.sfx.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  impulse(sec, decay) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }
  makeNoise(sec) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  // ── briques ────────────────────────────────────────────────
  env(g, t, a, peak, dur, rel = dur) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + rel);
  }
  osc(type, f, out, t, dur) {
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f;
    o.connect(out); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  noise(out, t, dur, loop = false) {
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = loop;
    s.connect(out); s.start(t, Math.random()); if (!loop) s.stop(t + dur); return s;
  }
  bus(send = 0.3, dest = this.sfx) {
    const g = this.ctx.createGain(); g.connect(dest);
    if (send) { const s = this.ctx.createGain(); s.gain.value = send; g.connect(s).connect(this.verb); }
    return g;
  }

  bell(f = N(50), { t = this.now(), gain = 0.25, dur = 4, send = 0.6, dest } = {}) {
    if (!this.ctx) return;
    const out = this.bus(send, dest || this.sfx);
    const partials = [[0.5, 1], [1, 0.8], [1.183, 0.5], [1.506, 0.45], [2, 0.35], [2.514, 0.25], [2.662, 0.2], [3.011, 0.15], [4.166, 0.08]];
    for (const [r, a] of partials) {
      const g = this.ctx.createGain(); g.connect(out);
      this.env(g, t, 0.004, gain * a, 0.01, dur * (1.2 - r * 0.2));
      this.osc('sine', f * r, g, t, dur * 1.3);
    }
  }
  now() { return this.ctx ? this.ctx.currentTime + 0.01 : 0; }
  ok() { return this.ctx && this.ctx.state === 'running'; }

  // ── musique ────────────────────────────────────────────────
  startMusic(mode = 'menu') {
    if (!this.ctx || this.mode === mode) return;
    this.stopMusic();
    this.mode = mode;
    const file = this.files?.[mode];
    if (file) {
      this.track = new Audio(file); this.track.loop = true; this.track.volume = this.vol.music;
      this.track.play().catch(() => {});
      return;
    }
    const ctx = this.ctx, t = ctx.currentTime;
    const bed = ctx.createGain(); bed.gain.value = 0.0001; bed.connect(this.music);
    bed.gain.exponentialRampToValueAtTime(1, t + 4);
    const send = ctx.createGain(); send.gain.value = 0.5; bed.connect(send).connect(this.verb);
    this.bed = bed;

    // bourdon
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 3;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
    const lfoG = ctx.createGain(); lfoG.gain.value = 140; lfo.connect(lfoG).connect(lp.frequency); lfo.start();
    const dg = ctx.createGain(); dg.gain.value = mode === 'menu' ? 0.11 : 0.08;
    lp.connect(dg).connect(bed);
    const root = mode === 'menu' ? 26 : 25; // ré / do# grave
    const drones = [
      this.osc('sawtooth', N(root), lp, t, 1e5), this.osc('sawtooth', N(root + 12) * 1.004, lp, t, 1e5),
      this.osc('sawtooth', N(root + 19) * 0.997, lp, t, 1e5),
    ];
    const sub = ctx.createGain(); sub.gain.value = 0.12; sub.connect(bed);
    drones.push(this.osc('sine', N(root), sub, t, 1e5), lfo);

    // vent
    const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 500; wf.Q.value = 0.8;
    const wl = ctx.createOscillator(); wl.frequency.value = 0.07;
    const wlg = ctx.createGain(); wlg.gain.value = 350; wl.connect(wlg).connect(wf.frequency); wl.start();
    const wg = ctx.createGain(); wg.gain.value = 0.05; wf.connect(wg).connect(bed);
    const wind = this.noise(wf, t, 0, true);
    drones.push(wind, wl);
    this.voices = drones;

    // chœur : progression lente en ré mineur
    const prog = mode === 'menu'
      ? [[50, 57, 62, 65, 69], [46, 53, 58, 62, 65], [43, 50, 55, 58, 62], [45, 52, 57, 61, 64]]
      : [[49, 56, 61, 64], [50, 57, 62, 65], [44, 51, 56, 59], [45, 52, 57, 60]];
    let step = 0;
    const chord = () => {
      if (this.mode !== mode) return;
      const notes = prog[step++ % prog.length];
      const now = ctx.currentTime;
      for (const m of notes) this.choirNote(N(m - 12), now, 9, bed, mode === 'menu' ? 0.035 : 0.025);
      this.timers.push(setTimeout(chord, 8000));
    };
    this.timers.push(setTimeout(chord, 1200));

    // glas lointain
    const toll = () => {
      if (this.mode !== mode) return;
      this.bell(N(mode === 'menu' ? 38 : 37), { gain: 0.12, dur: 7, send: 1.2, dest: bed });
      this.timers.push(setTimeout(toll, 14000 + Math.random() * 16000));
    };
    this.timers.push(setTimeout(toll, 5000));

    // pulsation (cœur) — contrôlée par la tension en jeu
    if (mode === 'table') {
      const beat = () => {
        if (this.mode !== mode) return;
        const tn = this.tension;
        if (tn > 0.05) this.heartbeat(0.25 + tn * 0.6);
        this.timers.push(setTimeout(beat, tn > 0.05 ? 1150 - tn * 650 : 900));
      };
      beat();
    }
  }

  choirNote(f, t, dur, out, amp) {
    const ctx = this.ctx;
    const g = ctx.createGain(); g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(amp, t + 2.8);
    g.gain.setValueAtTime(amp, t + dur - 3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 2);
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 650; f1.Q.value = 5;
    const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1080; f2.Q.value = 6;
    const mix = ctx.createGain(); mix.gain.value = 3;
    f1.connect(mix); f2.connect(mix); mix.connect(g).connect(out);
    for (const d of [-7, 0, 6]) {
      const o = this.osc('sawtooth', f, f1, t, dur + 2.2); o.detune.value = d;
      o.connect(f2);
      const vib = ctx.createOscillator(); vib.frequency.value = 4.5 + Math.random();
      const vg = ctx.createGain(); vg.gain.value = 6; vib.connect(vg).connect(o.detune);
      vib.start(t); vib.stop(t + dur + 2.2);
    }
  }

  heartbeat(a = 0.5) {
    if (!this.ok()) return;
    const t = this.now();
    for (const [dt, k] of [[0, 1], [0.2, 0.7]]) {
      const g = this.ctx.createGain(); g.connect(this.sfx);
      this.env(g, t + dt, 0.01, 0.35 * a * k, 0.01, 0.22);
      const o = this.osc('sine', 62, g, t + dt, 0.3);
      o.frequency.exponentialRampToValueAtTime(38, t + dt + 0.2);
    }
  }
  setTension(x) { this.tension = Math.max(0, Math.min(1, x)); }

  stopMusic() {
    this.timers.forEach(clearTimeout); this.timers = [];
    if (this.track) { this.track.pause(); this.track = null; }
    if (this.bed && this.ctx) {
      const t = this.ctx.currentTime, bed = this.bed, voices = this.voices;
      bed.gain.cancelScheduledValues(t);
      bed.gain.setValueAtTime(bed.gain.value, t);
      bed.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      setTimeout(() => { voices.forEach((v) => { try { v.stop(); } catch { /* */ } }); bed.disconnect(); }, 1700);
    }
    this.bed = null; this.voices = []; this.mode = null; this.tension = 0;
  }

  // ── effets ─────────────────────────────────────────────────
  play(name, ...args) {
    if (!this.ok()) return;
    const buf = this.buffers?.[name];
    if (buf) {
      const s = this.ctx.createBufferSource(); s.buffer = buf;
      s.connect(this.bus(0.25)); s.start();
      return;
    }
    const fn = this['fx_' + name];
    if (fn) fn.apply(this, args);
  }

  fx_hover() {
    const t = this.now(), out = this.bus(0.1);
    const hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 4000; hp.connect(out);
    const g = this.ctx.createGain(); g.connect(hp); this.env(g, t, 0.001, 0.08, 0.001, 0.03);
    this.noise(g, t, 0.05);
  }
  fx_click() {
    const t = this.now(), out = this.bus(0.35);
    for (const [f, a] of [[1760, 0.12], [2637, 0.07], [3951, 0.04]]) {
      const g = this.ctx.createGain(); g.connect(out); this.env(g, t, 0.002, a, 0.01, 0.35);
      this.osc('sine', f, g, t, 0.45);
    }
  }
  fx_type() {
    const t = this.now(), out = this.bus(0.05);
    const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2500 + Math.random() * 1500; bp.Q.value = 2; bp.connect(out);
    const g = this.ctx.createGain(); g.connect(bp); this.env(g, t, 0.001, 0.12, 0.001, 0.025);
    this.noise(g, t, 0.04);
  }
  fx_whoosh() {
    const t = this.now(), out = this.bus(0.25);
    const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2600, t + 0.22);
    bp.connect(out);
    const g = this.ctx.createGain(); g.connect(bp); this.env(g, t, 0.08, 0.3, 0.05, 0.18);
    this.noise(g, t, 0.35);
  }
  fx_flip() {
    const t = this.now(), out = this.bus(0.2);
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3500; lp.connect(out);
    const g = this.ctx.createGain(); g.connect(lp); this.env(g, t, 0.001, 0.35, 0.005, 0.05);
    this.noise(g, t, 0.08);
    const g2 = this.ctx.createGain(); g2.connect(out); this.env(g2, t, 0.002, 0.3, 0.01, 0.12);
    const o = this.osc('sine', 160, g2, t, 0.2); o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
  }
  fx_gain() {
    const t = this.now(), out = this.bus(0.4);
    [0, 0.07, 0.15].forEach((d, i) => {
      const g = this.ctx.createGain(); g.connect(out); this.env(g, t + d, 0.002, 0.07, 0.01, 0.4);
      this.osc('triangle', N(86 + i * 3), g, t + d, 0.5);
    });
  }
  fx_bust() {
    const t = this.now(), out = this.bus(0.9);
    const g = this.ctx.createGain(); g.connect(out); this.env(g, t, 0.005, 0.9, 0.05, 1.4);
    const o = this.osc('sine', 110, g, t, 1.6); o.frequency.exponentialRampToValueAtTime(28, t + 1.2);
    const ws = this.ctx.createWaveShaper();
    const curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 6); }
    ws.curve = curve; ws.connect(out);
    const gn = this.ctx.createGain(); gn.connect(ws); this.env(gn, t, 0.002, 0.5, 0.05, 0.6);
    this.noise(gn, t, 0.8);
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(out);
    for (const m of [38, 39, 45, 46]) {
      const gc = this.ctx.createGain(); gc.connect(lp); this.env(gc, t + 0.05, 0.05, 0.08, 0.5, 2.2);
      this.osc('sawtooth', N(m), gc, t, 2.8);
    }
  }
  fx_stay() { this.bell(N(57), { gain: 0.16, dur: 3, send: 0.7 }); }
  fx_freeze() {
    const t = this.now(), out = this.bus(1);
    for (let i = 0; i < 9; i++) {
      const g = this.ctx.createGain(); g.connect(out);
      const d = i * 0.06;
      this.env(g, t + d, 0.01, 0.05, 0.05, 1.6);
      this.osc('sine', 1800 + Math.random() * 2600, g, t + d, 1.8);
    }
    const hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000; hp.connect(out);
    const gn = this.ctx.createGain(); gn.connect(hp); this.env(gn, t, 0.3, 0.15, 0.2, 0.8);
    this.noise(gn, t, 1.4);
  }
  fx_toll() { this.bell(N(43), { gain: 0.3, dur: 6, send: 1 }); }
  fx_three() { [0, 0.9, 1.8].forEach((d) => this.bell(N(43), { t: this.now() + d, gain: 0.22, dur: 4, send: 1 })); }
  fx_chance() {
    const t = this.now(), out = this.bus(0.9);
    for (const m of [62, 66, 69, 74]) this.choirNote(N(m), t, 2.5, out, 0.06);
  }
  fx_flip7() {
    const t = this.now(), out = this.bus(1);
    for (const m of [50, 57, 62, 66, 69, 74]) this.choirNote(N(m), t, 4, out, 0.07);
    for (let i = 0; i < 7; i++) this.bell(N(74 + [0, 2, 4, 5, 7, 9, 12][i]), { t: t + i * 0.12, gain: 0.1, dur: 2.5 });
  }
  fx_reshuffle() {
    const t = this.now();
    for (let i = 0; i < 14; i++) {
      const out = this.bus(0.1);
      const g = this.ctx.createGain(); g.connect(out); this.env(g, t + i * 0.04, 0.002, 0.1, 0.005, 0.04);
      this.noise(g, t + i * 0.04, 0.06);
    }
  }
  fx_win() {
    const t = this.now(), out = this.bus(1);
    for (const m of [50, 57, 62, 66, 69]) this.choirNote(N(m), t, 6, out, 0.07);
    this.bell(N(62), { t, gain: 0.25, dur: 6 });
  }
  fx_lose() {
    this.fx_bust();
    [0.6, 1.8, 3].forEach((d) => this.bell(N(31), { t: this.now() + d, gain: 0.3, dur: 6, send: 1.2 }));
  }
  fx_enter() {
    this.bell(N(38), { gain: 0.35, dur: 8, send: 1.3 });
    this.fx_whoosh();
  }
}

export const sound = new Sound();
