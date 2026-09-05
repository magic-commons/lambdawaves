/* meters.js — METERS: norm, ⟨E⟩, autocorrelation, active modes, logical time, the badge (§10.6). */
import { AU_TIME_AS, HARTREE_EV } from './hydrogen.js';
import { el, readout } from './kit.js';

export function createMeters(host) {
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
  const status = readout({ label: 'STATUS', value: '—', cls: 'wide' }); grid.appendChild(status.root);
  const prof = readout({ label: 'FRAME PROFILE  ms · total · field · windows', value: '—', cls: 'wide', sub: '' }); grid.appendChild(prof.root);
  for (const [k, r] of Object.entries({ norm, energy, tlog, auto, modes, field, rates, tier, status })) r.root.dataset.m = k;

  let lastT = -1;
  function update(m) {
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
    status.set(m.status, m.rendered < m.populated ? 'warn' : 'ok');
    if (m.profile) {
      const p = m.profile, win = p.spectrum + p.shadow + p.orbit + p.dynamics + p.slice + p.qcd + p.molecule + p.meters;
      prof.set(`${p.total.toFixed(2)} · ${p.field.toFixed(2)} · ${win.toFixed(2)}`, p.total < 8.3 ? 'ok' : 'warn');
      prof.setSub(`${m.perfMode === '120' ? '120 Hz mode · ' : ''}spectrum ${p.spectrum.toFixed(2)} · shadow ${p.shadow.toFixed(2)} · orbit ${p.orbit.toFixed(2)} · overlays ${p.overlays.toFixed(2)} · dynamics ${p.dynamics.toFixed(2)} · slice ${p.slice.toFixed(2)} · meters ${p.meters.toFixed(2)} · 8.33 ms is a 120 Hz frame`);
    }
  }
  return { update };
}
