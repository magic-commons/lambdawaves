/* spectrum.js — the SPECTRUM rail: eigenvalue ladder, one lane per populated mode.
 *
 * A lane shows the ENERGY (eigenvalue, hartree), the degeneracy group (colour = n), the
 * population |c_a|² (a fader that sets |c_a| at the current time), the phase arg c_a(t) as a
 * live free-spinning needle (drag adds a phase; the needle keeps turning while playing),
 * MUTE / SOLO (a reconstruction mask, not an edit) and remove.  Touching a lane selects it.
 * The picker exposes all 91 states grouped by n.  Editing goes through api.* (one road).
 */
import { BASIS, energy, HARTREE_EV } from './hydrogen.js';
import { el, fader, knob, N_COLOR, N_RGB } from './kit.js';

export function createSpectrum(host, api) {
  const ladder = el('div', 'ladder', host);
  const lcv = el('canvas', '', ladder);
  const head = el('div', 'row tight', host);
  const addBtn = el('button', 'trig', head); addBtn.type = 'button'; addBtn.innerHTML = '<span class="trig-g">+</span><span class="trig-l">MODE</span>';
  const info = el('div', 'note', head); info.style.flex = '1 1 auto';
  const rowsEl = el('div', 'sp-rows', host);
  const picker = el('div', 'picker', host); picker.hidden = true;
  addBtn.addEventListener('click', () => { picker.hidden = !picker.hidden; addBtn.classList.toggle('on', !picker.hidden); });
  const chips = new Map();
  for (let n = 1; n <= 6; n++) {
    const g = el('div', 'pk-n', picker); g.style.setProperty('--nc', N_COLOR[n]);
    el('div', 'pk-nl', g, 'n' + n);
    const cs = el('div', 'pk-chips', g);
    for (const s of BASIS) if (s.n === n) {
      const b = el('button', 'pk-c', cs, s.label); b.type = 'button'; b.title = `${s.id}  E = ${s.E.toFixed(5)}`;
      b.addEventListener('click', () => api.toggleMode(s.index));
      chips.set(s.index, b);
    }
  }
  const lanes = new Map();     // index → lane
  let selected = -1, lastVersion = -1;

  function lane(a) {
    const s = BASIS[a];
    const root = el('div', 'sp-row'); root.style.setProperty('--nc', N_COLOR[s.n]); root.dataset.id = s.id;
    el('div', 'sp-band', root);
    const id = el('div', 'sp-id', root);
    el('div', 'sp-name', id, s.label);
    el('div', 'sp-sub', id, `${s.E.toFixed(4)} Eh`);
    id.addEventListener('click', () => api.select(a));
    const pop = fader({ label: '|c|²', min: 0, max: 1, value: 0, cls: 'pop', fmt: (v) => v.toFixed(3),
      onInput: (v) => api.setPopulation(a, v), onChange: (v) => api.setPopulation(a, v, true) });
    root.appendChild(pop.root);
    const ph = knob({ min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'live', fmt: (v) => (v * 180 / Math.PI).toFixed(0) + '°',
      onDelta: (d) => api.addPhase(a, d), onReset: () => api.setPhase(a, 0) });
    root.appendChild(ph.root);
    const mute = el('button', 'sp-b mute', root, 'M'); mute.type = 'button'; mute.title = 'mute: drop from the FIELD reconstruction (the state keeps c)';
    mute.addEventListener('click', () => api.toggleMute(a));
    const solo = el('button', 'sp-b solo', root, 'S'); solo.type = 'button'; solo.title = 'solo: reconstruct from this mode alone';
    solo.addEventListener('click', () => api.toggleSolo(a));
    const x = el('button', 'sp-x', root, '×'); x.type = 'button'; x.title = 'remove (sets c = 0)';
    x.addEventListener('click', () => api.remove(a));
    return { root, pop, ph, mute, solo, a };
  }
  function rebuild() {
    const reg = api.reg;
    const want = reg.populated();
    const keep = new Set(want);
    for (const [a, L] of lanes) if (!keep.has(a)) { L.root.remove(); lanes.delete(a); }
    let prev = null;
    for (const a of want) {
      let L = lanes.get(a);
      if (!L) { L = lane(a); lanes.set(a, L); }
      if (prev ? prev.nextSibling !== L.root : rowsEl.firstChild !== L.root) rowsEl.insertBefore(L.root, prev ? prev.nextSibling : rowsEl.firstChild);
      prev = L.root;
    }
    const n2 = reg.norm2() || 1;
    for (const [a, L] of lanes) {
      L.pop.set(reg.population(a) / n2);
      L.mute.classList.toggle('on', !!reg.muted[a]);
      L.solo.classList.toggle('on', !!reg.solo[a]);
    }
    for (const [a, b] of chips) b.classList.toggle('on', keep.has(a));
    const rs = reg.renderSet();
    const anySolo = want.some((a) => reg.solo[a]);
    for (const [a, L] of lanes) {
      const off = anySolo ? !reg.solo[a] : !!reg.muted[a];
      L.root.classList.toggle('muted', off);
      L.root.classList.toggle('off', false);
      L.root.classList.toggle('sel', a === selected);
    }
    info.textContent = `${want.length} populated · ${rs.rendered} rendered · ${Object.keys(groupByN(want)).length} level${Object.keys(groupByN(want)).length === 1 ? '' : 's'}`;
    lastVersion = reg.version;
    paintLadder();
  }
  function groupByN(list) { const g = {}; for (const a of list) (g[BASIS[a].n] = g[BASIS[a].n] || []).push(a); return g; }

  /* the eigenvalue ladder: E_n drawn at physical height (the Rydberg bunching is the point),
     populated levels lit with their fraction of the norm */
  function paintLadder() {
    const reg = api.reg;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = ladder.clientWidth, H = ladder.clientHeight;
    if (lcv.width !== W * dpr || lcv.height !== H * dpr) { lcv.width = W * dpr; lcv.height = H * dpr; }
    const g = lcv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const pad = 10, left = 44, right = W - 12, top = 10, bot = H - 14;
    const y = (E) => bot - (E - energy(1)) / (0 - energy(1)) * (bot - top);
    g.font = '8px ui-monospace, monospace'; g.textBaseline = 'middle';
    // continuum line
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(left, y(0)); g.lineTo(right, y(0)); g.stroke(); g.setLineDash([]);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.textAlign = 'right'; g.fillText('E = 0', left - 4, y(0));
    const n2 = reg.norm2() || 1;
    const pops = {}; for (const a of reg.populated()) pops[BASIS[a].n] = (pops[BASIS[a].n] || 0) + reg.population(a) / n2;
    for (let n = 1; n <= 6; n++) {
      const yy = y(energy(n)), c = N_RGB[n], lit = pops[n] > 0;
      g.strokeStyle = lit ? `rgba(${c[0]},${c[1]},${c[2]},0.95)` : 'rgba(255,255,255,0.16)'; g.lineWidth = lit ? 2 : 1;
      g.beginPath(); g.moveTo(left, yy); g.lineTo(right, yy); g.stroke();
      g.fillStyle = lit ? `rgba(${c[0]},${c[1]},${c[2]},1)` : 'rgba(255,255,255,0.35)'; g.textAlign = 'right';
      if (n <= 2 || lit) g.fillText(`n${n}`, left - 4, yy);
      if (lit) {
        const w = Math.max(6, (right - left) * pops[n]);
        g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.35)`; g.fillRect(left, yy - 3, w, 6);
        g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},1)`;
        const txt = `${(pops[n] * 100).toFixed(0)}%  ${energy(n).toFixed(4)}`;
        if (left + w + 5 + g.measureText(txt).width < right) { g.textAlign = 'left'; g.fillText(txt, left + w + 5, yy); }
        else { g.textAlign = 'right'; g.fillStyle = 'rgba(0,0,0,0.85)'; g.fillText(txt, left + w - 5, yy + 1); g.fillStyle = '#fff'; g.fillText(txt, left + w - 5, yy); }
      }
    }
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.textAlign = 'left'; g.fillText('EIGENVALUE  E_n = −1/(2n²) hartree', left, H - 5);
  }
  /** display-rate update: live phases, selection */
  function update(c, t) {
    const reg = api.reg;
    if (reg.version !== lastVersion) rebuild();
    for (const [a, L] of lanes) {
      const ph = Math.atan2(c.im[a], c.re[a]);
      L.ph.set(ph < 0 ? ph + 2 * Math.PI : ph);
    }
  }
  function select(a) { selected = a; for (const [i, L] of lanes) L.root.classList.toggle('sel', i === a); }
  window.addEventListener('resize', () => paintLadder());
  return { update, rebuild, select, get selected() { return selected; }, lanes };
}
