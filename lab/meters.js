/* meters.js — METERS: norm, ⟨E⟩, autocorrelation, active modes, logical time, the badge (§10.6), the picture's f16 FLOOR. */
import { AU_TIME_AS, HARTREE_EV } from './hydrogen.js';
import { el, readout } from './mir/kit.js';
import { FIELD_LAW as L } from './status.js'; import { SQUEEZE } from './kick.js'; import { coherence } from './equalizer.js'; import { densityPeriod, fmtPeriod } from './period.js'; import { toLUT } from './mir/palette.js';

export function createMeters(host, src = null) {
  const grid = el('div', 'meters', host);
  const norm = readout({ label: 'NORM  ⟨ψ|ψ⟩^½', value: '—' }); grid.appendChild(norm.root);
  const energy = readout({ label: '⟨E⟩  hartree', value: '—', sub: '' }); grid.appendChild(energy.root);
  const tlog = readout({ label: 't  LOGICAL  a.u.', value: '—', sub: '' }); grid.appendChild(tlog.root);
  const auto = readout({ label: '|⟨ψ(0)|ψ(t)⟩|  AUTOCORR', value: '—', cls: 'two' }); grid.appendChild(auto.root);
  const abar = el('div', 'abar', auto.root); const abarI = el('i', '', abar);
  const modes = readout({ label: 'MODES  rend / pop / 91', value: '—', sub: '' }); grid.appendChild(modes.root);
  const field = readout({ label: 'FIELD CACHE', value: '—', sub: '' }); grid.appendChild(field.root);
  const rates = readout({ label: 'CLOCKS Hz  disp · field · phys', value: '—', sub: '' }); grid.appendChild(rates.root);
  const tier = readout({ label: 'LAST TIER', value: '—', sub: '' }); grid.appendChild(tier.root);
  const e = (x) => x.toExponential(0); /* FLOOR: static, the field law's own constants (status.js), never typed */
  const floor = readout({ label: 'FLOOR  f16 · the picture\'s own precision', value: '1 f16 ulp · toward zero', sub: `hydrogen ${e(L.hydrogen.rms)} RMS · ${e(L.hydrogen.worst)} worst voxel · density ${e(L.density.worst)} worst` }); grid.appendChild(floor.root);
  const status = readout({ label: 'STATUS', value: '—', cls: 'wide' }); grid.appendChild(status.root);
  const prof = readout({ label: 'FRAME PROFILE  ms · total · field · windows', value: '—', cls: 'wide', sub: '' }); grid.appendChild(prof.root);
  for (const [k, r] of Object.entries({ norm, energy, tlog, auto, modes, field, rates, tier, floor, status })) r.root.dataset.m = k;
  /* 0.8.2 P2 · THE COHERENCE MAP: |ρ_ab| as an N × N heat image (the palette's ramp, alpha the magnitude, scaled to the largest population),
     repainted only when what it reads changes; src() is readouts.js' (the register, or a molecule's STATES lanes, and the equalizer's table) */
  const coh = readout({ label: 'COHERENCE  |c_a c̄_b|', value: '—', cls: 'wide', sub: '' }), cohCv = el('canvas', 'eq-grid', coh.root), cohG = cohCv.getContext('2d'); grid.appendChild(coh.root);
  let cohKey = '', cohMap = null, cohSay = '', cohUnit = 'hartree';
  cohCv.onpointermove = (e) => { if (!cohMap) return; const N = cohMap.L.length, r = cohCv.getBoundingClientRect(), at = (u) => Math.min(N - 1, Math.max(0, u * N | 0)), i = at((e.clientY - r.top) / r.height), j = at((e.clientX - r.left) / r.width), a = cohMap.L[i], b = cohMap.L[j], v = cohMap.M[i][j].toFixed(4), T = densityPeriod([a.E, b.E]).T;
    coh.setSub(i === j ? `${a.label} · population ${v}` : `${a.label} ↔ ${b.label} · ${v} · ω ${Math.abs(a.E - b.E).toPrecision(4)} · T ${cohUnit === 'hartree' ? fmtPeriod(T) : T ? T.toPrecision(4) + ' ħ/' + cohUnit : '—'}`); };
  cohCv.onpointerleave = () => coh.setSub(cohSay);
  function paintCoherence() {
    const s = src && src(), pal = s && s.pal, key = s && (s.why || s.c.map((x) => x.label + (x.re ** 2 + x.im ** 2).toPrecision(12)).join() + (s.T && s.T.gamma ? s.T.gamma.join() + s.T.mode : '') + (pal && pal.on ? JSON.stringify(pal.stops) : ''));
    if (!s || key === cohKey) return; cohKey = key; cohMap = s.why || !s.c.length ? null : coherence(s.c, s.T); cohUnit = s.unit; cohG.clearRect(0, 0, cohCv.width, cohCv.height);
    if (!cohMap) { coh.set('—'); coh.setSub(cohSay = s.why || 'no populated label'); return; }
    const N = cohMap.L.length, M = cohMap.M.flat(), top = Math.max(...M), lut = pal && pal.on ? toLUT(pal.stops) : null; cohCv.width = cohCv.height = N; const img = cohG.createImageData(N, N);
    M.forEach((v, i) => { const u = v / top, k = Math.min(255, u * 216 | 0) * 4; img.data.set(lut ? [lut[k] * 255, lut[k + 1] * 255, lut[k + 2] * 255, u * 255] : [120, 170, 255, u * 255], i * 4); }); cohG.putImageData(img, 0, 0);
    const fs = cohMap.F.flat().filter((f) => f < 1 - 1e-9), lo = Math.min(...fs), hi = Math.max(...fs), x = lo.toFixed(3) + (hi - lo > 5e-4 ? '–' + hi.toFixed(3) : '');
    cohSay = (!fs.length ? 'the diagonal the populations, the off-diagonal the coherences the beats live on' : s.T.mode < 2 ? 'coherences damped: this is what decoherence looks like' : 'cross terms of a signed split, not a density') + (cohMap.cut ? ` · the 12 largest of ${N + cohMap.cut} by |c|` : '');
    coh.set(`${N} × ${N}` + (fs.length ? ` · ×${x}` : '')); coh.setSub(cohSay);
  }

  let lastT = -1;
  function update(m) {
    paintCoherence();
    norm.set(m.norm.toFixed(3), Math.abs(m.norm - 1) < 5e-4 ? 'ok' : 'warn');
    energy.set(m.energy.toFixed(5)); energy.setSub(m.unit === 'hartree' || !m.unit ? (m.energy * HARTREE_EV).toFixed(3) + ' eV' : 'in ' + m.unit + ' (no eV: ω is not set)');
    if (m.t !== lastT) { tlog.set(m.t.toFixed(2), m.playing ? 'live' : ''); tlog.setSub(m.unit === 'hartree' || !m.unit ? (m.t * AU_TIME_AS).toFixed(1) + ' as' : 'in 1/ω'); lastT = m.t; }
    auto.set(m.autocorr.toFixed(4)); abarI.style.setProperty('--v', m.autocorr.toFixed(4));
    modes.set(`${m.rendered} / ${m.populated} / 91`, m.rendered < m.populated ? 'warn' : '');
    modes.setSub(m.masked ? `${m.masked} muted · ${(m.covered * 100).toFixed(1)}% of norm rendered` : m.truncated ? `${m.truncated} truncated · ${(m.covered * 100).toFixed(1)}% of norm rendered` : 'full state rendered');
    field.set(`${m.res}³`); field.setSub(`L = ±${m.half} a.u. · ${m.steps} rays · ${m.encodeMs.toFixed(2)} ms enc`);
    rates.set(`${m.fps.toFixed(0)} · ${m.reconPerSec.toFixed(0)} · ${m.stepsPerSec.toFixed(0)} Hz`, m.playing ? 'live' : '');
    rates.setSub(m.scheduled ? 'scheduled' : 'IDLE · zero work');
    tier.set(m.lastTier); tier.setSub(`P ${m.tiers.PRESENT} · R ${m.tiers.RECONSTRUCT} · E ${m.tiers.EVOLVE} · B ${m.tiers.REBUILD}`);
    status.set(m.status, m.rendered < m.populated ? 'warn' : 'ok'); if (SQUEEZE.said) status.setSub(SQUEEZE.said);   // 0.8.0 G2: the last squeeze, its variance error beside its lost norm
    if (m.profile) {
      const p = m.profile, win = p.spectrum + p.shadow + p.orbit + p.slice + p.meters;
      prof.set(`${p.total.toFixed(2)} · ${p.field.toFixed(2)} · ${win.toFixed(2)}`, p.total < 8.3 ? 'ok' : 'warn');
      const ms = (name) => (p[name] || 0).toFixed(2);
      prof.setSub(`${m.perfMode === '120' ? '120 Hz mode · ' : ''}spectrum ${ms('spectrum')} · shadow ${ms('shadow')} · orbit ${ms('orbit')} · vortex ${ms('vortex')} · particles ${ms('particles')} · Kepler ${ms('kepler')} · slice ${ms('slice')} · meters ${ms('meters')} · 8.33 ms is a 120 Hz frame`);
    }
  }
  return { update };
}
