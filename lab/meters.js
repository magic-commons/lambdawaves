/* meters.js — METERS: norm, ⟨E⟩, autocorrelation, active modes, logical time, the badge (§10.6), the picture's f16 FLOOR. */
import { AU_TIME_AS, HARTREE_EV, BASIS } from './hydrogen.js';
import { el, readout } from './mir/kit.js';
import { FIELD_LAW as L } from './status.js'; import { SQUEEZE } from './kick.js'; import { coherence } from './equalizer.js'; import { densityPeriod, fmtPeriod } from './period.js'; import { toLUT } from './mir/palette.js';

export function createMeters(host, src = null, measure = null) {
  const grid = el('div', 'meters', host);
  const norm = readout({ label: 'NORM  ⟨ψ|ψ⟩^½', value: '—' }); grid.appendChild(norm.root);
  const energy = readout({ label: '⟨E⟩  hartree', value: '—', sub: '' }); grid.appendChild(energy.root);
  const tlog = readout({ label: 't  LOGICAL  a.u.', value: '—', sub: '' }); grid.appendChild(tlog.root);
  const auto = readout({ label: '|⟨ψ(0)|ψ(t)⟩|  AUTOCORR', value: '—', cls: 'two' }); grid.appendChild(auto.root);
  const abar = el('div', 'abar', auto.root); const abarI = el('i', '', abar);
  const modes = readout({ label: `MODES  rend / pop / ${BASIS.length}`, value: '—', sub: '' }); grid.appendChild(modes.root);
  const field = readout({ label: 'FIELD CACHE', value: '—', sub: '' }); grid.appendChild(field.root);
  const rates = readout({ label: 'CLOCKS Hz  disp · field · phys', value: '—', sub: '' }); grid.appendChild(rates.root);
  const tier = readout({ label: 'LAST TIER', value: '—', sub: '' }); grid.appendChild(tier.root);
  /* FLOOR · GRID ERROR (iteration 005 P3): the LIVE reading of the grid in force (a press, or GRID moving while METERS is open: `measure` is
     readouts.js', field.js' errorField against the exact twin), then two sub lines — what the reading says, and the CERTIFIED constants
     (status.js', never typed; P7c's commit).  Each line fits the card: the sub shows two lines and none wraps; a probe misses the peak, so it
     prints no "of ρmax" from 64 voxels. */
  const e = (x) => x.toExponential(0), x1 = (v) => (Number.isFinite(v) ? v.toExponential(1) : '—');
  const CERT = `CERTIFIED 0b0a8f6 · 1 f16 ulp · ψ ${e(L.hydrogen.rms)} RMS, ${e(L.hydrogen.worst)} worst · ρ ${e(L.density.worst)}`;
  const floor = readout({ label: 'FLOOR · GRID ERROR  f16 · press to measure', value: 'press to measure the grid in force', cls: 'wide', sub: 'one readback against the exact value at each voxel centre\n' + CERT }); grid.appendChild(floor.root);
  const meas = { N: 0, res: 0, busy: false };
  const TITLE = floor.root.title = 'f16 grid vs exact, per voxel';
  floor.root.querySelector('.ro-sub').style.whiteSpace = 'pre-line'; floor.root.tabIndex = 0; floor.root.setAttribute('role', 'button'); floor.root.style.cursor = 'pointer';
  floor.root.addEventListener('click', () => measureGrid()); floor.root.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); measureGrid(); } });
  async function measureGrid() {
    if (!measure || meas.busy) return; meas.busy = true; floor.set('MEASURING · the grid read back …', 'live');
    let r; try { r = await measure(); } catch (err) { r = { why: String((err && err.message) || err) }; }
    meas.busy = false; meas.N = (r && r.N) || meas.res || -1;
    if (!r || r.why) { floor.set('— no reading', 'warn'); floor.setSub(((r && r.why) || '') + '\n' + CERT); floor.root.title = TITLE; return; }
    const psi = r.metric === 'psi', ms = r.ms < 1000 ? Math.round(r.ms) + ' ms' : (r.ms / 1000).toFixed(1) + ' s', led = r.ledger, caught = r.t !== null && r.t !== undefined;
    const side = r.above ? `ρ > exact at ${r.above} (${r.aboveF32 ? r.aboveF32 + ' past' : 'within'} f32)` : 'ρ ≤ exact everywhere';   // the one-sided law, as read
    floor.set(psi ? `MEASURED ${r.N}³ · RMS ${x1(r.rms)} · worst ${x1(r.worst)}` : `PROBE ${r.probe} · ${r.N}³ · |Δρ|/ρ RMS ${x1(r.rms)} · worst ${x1(r.worst)}`, 'ok');
    floor.setSub(`${psi ? x1(r.relToMax) + ' of max|ψ|' : caught ? `the frame it caught (t ${r.t.toFixed(2)})` : r.normal + ' f16-normal'} · ${r.mode} · ${side} · ${ms}\n${CERT}`);
    floor.root.title = `${TITLE} — measured: ${r.voxels} voxels${psi ? '' : `, ${r.normal} with an f16-normal √ρ`} · 99.8 % ≤ ${x1(r.p998)} · rounding: of ${led.disc} components where the modes disagree, ${led.rtz} toward zero, ${led.rne} to nearest`
      + ` · largest (ρ − stored ρ)/ρ ${x1(r.deficit)} where the components are f16-normal (the law: 2·2⁻¹⁰ = 2.0e-3)${caught ? ` · t ${r.t.toFixed(2)}` : ''} · readback ${r.readMs} ms of ${r.ms} ms`;
  }
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
    meas.res = m.res; if (meas.N && m.res && m.res !== meas.N && !meas.busy) measureGrid();   // the grid moved under a reading: measure the one in force
    norm.set(m.norm.toFixed(3), Math.abs(m.norm - 1) < 5e-4 ? 'ok' : 'warn');
    energy.set(m.energy.toFixed(5)); energy.setSub(m.unit === 'hartree' || !m.unit ? (m.energy * HARTREE_EV).toFixed(3) + ' eV' : 'in ' + m.unit + ' (no eV: ω is not set)');
    if (m.t !== lastT) { tlog.set(m.t.toFixed(2), m.playing ? 'live' : ''); tlog.setSub(m.unit === 'hartree' || !m.unit ? (m.t * AU_TIME_AS).toFixed(1) + ' as' : 'in 1/ω'); lastT = m.t; }
    auto.set(m.autocorr.toFixed(4)); abarI.style.setProperty('--v', m.autocorr.toFixed(4));
    modes.set(`${m.rendered} / ${m.populated} / ${BASIS.length}`, m.rendered < m.populated ? 'warn' : '');
    modes.setSub(m.masked ? `${m.masked} muted · ${(m.covered * 100).toFixed(1)}% of norm rendered` : m.truncated ? `${m.truncated} truncated · ${(m.covered * 100).toFixed(1)}% of norm rendered` : 'full state rendered');
    field.set(`${m.res}³`); field.setSub(`L = ±${m.half} a.u. · ${m.steps} rays · ${m.encodeMs.toFixed(2)} ms enc`);
    rates.set(`${m.fps.toFixed(0)} · ${m.reconPerSec.toFixed(0)} · ${m.stepsPerSec.toFixed(0)} Hz`, m.playing ? 'live' : '');
    rates.setSub((m.lock ? m.lock + ' · ' : '') + (m.scheduled ? 'scheduled' : 'IDLE · zero work'));   // 020 L2: PLAYBACK LOCK said
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
