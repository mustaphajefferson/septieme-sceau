// Cadres gothiques : bordure en 9 tranches (border-image) et cadre plein écran.

export function frameURI(c = '#e8dcae', bg = '#000') {
  const corner = (x, y) => `<path d="M${x} ${y - 8}L${x + 8} ${y}L${x} ${y + 8}L${x - 8} ${y}Z" fill="${c}"/><circle cx="${x}" cy="${y}" r="2.2" fill="${bg}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60">
    <rect x="1" y="1" width="58" height="58" fill="none" stroke="${c}" stroke-width="2"/>
    <rect x="6.5" y="6.5" width="47" height="47" fill="none" stroke="${c}" stroke-width="1"/>
    ${corner(10, 10)}${corner(50, 10)}${corner(10, 50)}${corner(50, 50)}
    <g fill="${c}"><circle cx="30" cy="4" r="1.3"/><circle cx="30" cy="56" r="1.3"/><circle cx="4" cy="30" r="1.3"/><circle cx="56" cy="30" r="1.3"/></g>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function installFrameVars() {
  const r = document.documentElement.style;
  r.setProperty('--gf-bone', frameURI('#e8dcae', '#000'));
  r.setProperty('--gf-ink', frameURI('#16120c', '#e6dbb8'));
  r.setProperty('--gf-green', frameURI('#98c653', '#060805'));
  r.setProperty('--gf-rust', frameURI('#d8613c', '#000'));
}

// cadre plein écran : bande pointillée + filets + ornements gothiques
export function drawScreenFrame(svg, color = '#d9d4c4') {
  const W = innerWidth, H = innerHeight, B = W < 600 ? 14 : 22, I = B + 6;
  const q = (cx, cy, r) => [[0, -r], [r, 0], [0, r], [-r, 0]].map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="${r * 0.9}"/>`).join('');
  const corner = (x, y, sx, sy) => {
    const s = W < 600 ? 0.7 : 1;
    const p = (a, b) => `${x + sx * a * s} ${y + sy * b * s}`;
    return `<path d="M${p(0, 0)}L${p(70, 0)}M${p(0, 0)}L${p(0, 70)}" stroke-width="3"/>
      <path d="M${p(8, 8)}L${p(46, 8)}Q${p(30, 18)} ${p(18, 30)}Q${p(8, 46)} ${p(8, 46)}Z" fill="${color}" stroke="none"/>
      <path d="M${p(14, 14)}L${p(34, 14)}Q${p(22, 20)} ${p(14, 34)}Z" fill="#000" stroke="none"/>
      <g fill="none" stroke-width="1.2">${q(x + sx * 58 * s, y + sy * 58 * s, 5 * s)}</g>
      <path d="M${p(0, 90)}L${p(0, 120)}M${p(90, 0)}L${p(120, 0)}" stroke-width="1"/>`;
  };
  const midT = (x) => `<path d="M${x - 60} ${I} Q${x - 20} ${I} ${x} ${I + 22} Q${x + 20} ${I} ${x + 60} ${I}" fill="none" stroke-width="1.5"/><path d="M${x} ${I - 2}L${x + 6} ${I + 8}L${x} ${I + 18}L${x - 6} ${I + 8}Z" fill="${color}"/>`;
  const midB = (x) => `<path d="M${x - 60} ${H - I} Q${x - 20} ${H - I} ${x} ${H - I - 22} Q${x + 20} ${H - I} ${x + 60} ${H - I}" fill="none" stroke-width="1.5"/><path d="M${x} ${H - I + 2}L${x + 6} ${H - I - 8}L${x} ${H - I - 18}L${x - 6} ${H - I - 8}Z" fill="${color}"/>`;
  const side = (x, dir) => { let s = ''; for (let y = 150; y < H - 150; y += 70) s += `<path d="M${x} ${y - 6}L${x + dir * 5} ${y}L${x} ${y + 6}L${x - dir * 5} ${y}Z" fill="${color}"/>`; return s; };
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = `<g stroke="${color}" fill="none">
    <rect x="${I}" y="${I}" width="${W - 2 * I}" height="${H - 2 * I}" stroke-width="2"/>
    <rect x="${I + 6}" y="${I + 6}" width="${W - 2 * I - 12}" height="${H - 2 * I - 12}" stroke-width="1"/>
    ${corner(I + 6, I + 6, 1, 1)}${corner(W - I - 6, I + 6, -1, 1)}${corner(I + 6, H - I - 6, 1, -1)}${corner(W - I - 6, H - I - 6, -1, -1)}
    ${midT(W / 2)}${midB(W / 2)}${side(I + 3, 1)}${side(W - I - 3, -1)}
  </g>`;
  svg.style.setProperty('--band', B + 'px');
}
