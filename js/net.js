// ─────────────────────────────────────────────────────────────
//  Multijoueur pair-à-pair (PeerJS / WebRTC) — aucun serveur à
//  héberger : le site reste statique sur GitHub Pages.
//  L'hôte fait tourner le moteur ; les autres reçoivent les
//  événements et renvoient leurs décisions.
// ─────────────────────────────────────────────────────────────

const PREFIX = 'vii-septieme-sceau-v1-';
const ALPH = 'ACDEFHJKLMNPRTVWXY';
export const MAX_SEATS = 6;

export const newCode = () => Array.from({ length: 5 }, () => ALPH[(Math.random() * ALPH.length) | 0]).join('');
export const cleanCode = (s) => (s || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);

const ERR = {
  'unavailable-id': 'Ce sceau est déjà pris.',
  'peer-unavailable': 'Aucune table ne porte ce sceau.',
  network: 'Les esprits ne répondent pas (réseau indisponible).',
  'server-error': 'Le passeur est injoignable. Réessaie dans un instant.',
  'browser-incompatible': 'Ce navigateur ne sait pas parler aux morts (WebRTC indisponible).',
  full: 'La table est pleine, ou la partie a déjà commencé.',
  timeout: 'Personne ne répond derrière ce sceau.',
};
export const errText = (e) => ERR[e?.type || e] || 'Le rituel a échoué.';

function makePeer(id) {
  if (!window.Peer) throw { type: 'browser-incompatible' };
  return new window.Peer(id, { debug: 0 });
}

// ── Hôte ─────────────────────────────────────────────────────
export class Host {
  constructor({ code, name, isPublic = false }) {
    this.code = code; this.isPublic = isPublic;
    this.seats = [{ id: 'h', name, kind: 'human', you: true }];
    this.conns = new Map();
    this.pending = new Map();
    this.started = false;
    this.rid = 0;
    this.onLobby = null; this.onDrop = null;
  }

  open() {
    return new Promise((res, rej) => {
      let done = false;
      try { this.peer = makePeer(PREFIX + this.code); } catch (e) { return rej(e); }
      this.peer.on('open', () => { done = true; res(this); });
      this.peer.on('error', (e) => { if (!done) { done = true; rej(e); } });
      this.peer.on('connection', (c) => this.accept(c));
      this.peer.on('disconnected', () => { try { this.peer.reconnect(); } catch { /* */ } });
      setTimeout(() => { if (!done) { done = true; rej({ type: 'server-error' }); } }, 12000);
    });
  }

  accept(conn) {
    let pid = null;
    conn.on('data', (m) => {
      if (m?.t === 'hello') {
        if (this.started || this.seats.length >= MAX_SEATS) { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 300); return; }
        pid = 'p' + (++this.rid) + Math.random().toString(36).slice(2, 5);
        this.seats.push({ id: pid, name: String(m.name || 'ÂME ERRANTE').slice(0, 14).toUpperCase(), kind: 'remote' });
        this.conns.set(pid, conn);
        conn.send({ t: 'welcome', you: pid, code: this.code });
        this.lobby();
      } else if (m?.t === 'reply') {
        const p = this.pending.get(m.rid);
        if (p && p.pid === pid) { this.pending.delete(m.rid); clearTimeout(p.timer); p.res(m.value); }
      }
    });
    conn.on('close', () => this.drop(pid));
    conn.on('error', () => this.drop(pid));
  }

  drop(pid) {
    if (!pid || !this.conns.has(pid)) return;
    this.conns.delete(pid);
    for (const [rid, p] of this.pending) if (p.pid === pid) { this.pending.delete(rid); clearTimeout(p.timer); p.res(null); }
    if (!this.started) { this.seats = this.seats.filter((s) => s.id !== pid); this.lobby(); }
    else this.onDrop?.(pid);
  }

  lobby() {
    const players = this.seats.map(({ id, name }) => ({ id, name }));
    this.broadcast({ t: 'lobby', players, isPublic: this.isPublic });
    this.onLobby?.(players);
  }

  broadcast(msg) { for (const c of this.conns.values()) { try { c.send(msg); } catch { /* */ } } }
  send(pid, msg) { try { this.conns.get(pid)?.send(msg); } catch { /* */ } }

  ask(pid, kind, data, timeout = 45000) {
    if (!this.conns.has(pid)) return Promise.resolve(null);
    const rid = 'r' + (++this.rid);
    return new Promise((res) => {
      const timer = setTimeout(() => { this.pending.delete(rid); this.send(pid, { t: 'cancel', rid }); res(null); }, timeout);
      this.pending.set(rid, { pid, res, timer });
      this.send(pid, { t: 'prompt', rid, kind, data });
    });
  }

  close() {
    this.broadcast({ t: 'closed' });
    setTimeout(() => { try { this.peer?.destroy(); } catch { /* */ } }, 200);
  }
}

// ── Invité ───────────────────────────────────────────────────
export class Client {
  constructor({ name }) { this.name = name; this.handlers = {}; }
  on(t, fn) { this.handlers[t] = fn; return this; }

  join(code) {
    return new Promise((res, rej) => {
      let done = false;
      const fail = (e) => { if (!done) { done = true; try { this.peer?.destroy(); } catch { /* */ } rej(e); } };
      try { this.peer = makePeer(); } catch (e) { return fail(e); }
      this.peer.on('error', fail);
      this.peer.on('open', () => {
        const conn = (this.conn = this.peer.connect(PREFIX + code, { reliable: true, serialization: 'json' }));
        conn.on('open', () => conn.send({ t: 'hello', name: this.name }));
        conn.on('data', (m) => {
          if (!m) return;
          if (m.t === 'full') return fail({ type: 'full' });
          if (m.t === 'welcome') { this.you = m.you; this.code = m.code; if (!done) { done = true; res(this); } }
          this.handlers[m.t]?.(m);
        });
        conn.on('close', () => { if (done) this.handlers.closed?.({}); else fail({ type: 'peer-unavailable' }); });
      });
      setTimeout(() => fail({ type: 'timeout' }), 11000);
    });
  }

  reply(rid, value) { try { this.conn?.send({ t: 'reply', rid, value }); } catch { /* */ } }
  close() { try { this.conn?.close(); this.peer?.destroy(); } catch { /* */ } }
}

// ── Errance : trouver une table publique, ou en ouvrir une ──
export async function wander(name, onStatus) {
  for (let slot = 0; slot < 6; slot++) {
    const code = 'ERR' + 'ACDEF'[slot] + 'X';
    onStatus?.(`Tu erres vers la table ${slot + 1}…`);
    try {
      const c = await new Client({ name }).join(code);
      return { role: 'client', client: c, code };
    } catch (e) {
      if (e?.type === 'full') continue;
      if (e?.type === 'network' || e?.type === 'browser-incompatible' || e?.type === 'server-error') throw e;
      // personne : on ouvre cette table nous-mêmes
      try {
        const h = await new Host({ code, name, isPublic: true }).open();
        return { role: 'host', host: h, code };
      } catch (e2) {
        if (e2?.type === 'unavailable-id') continue; // quelqu'un vient de la prendre
        throw e2;
      }
    }
  }
  throw { type: 'full' };
}
