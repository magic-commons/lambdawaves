/* orbit.js — ORBIT: the two rotors of every populated shell (print of 2026-09-03, Thread B).
 *
 * STATUS: EXACT ANALYTIC.  A shell n is V_j ⊗ V_j with j = (n−1)/2 (SO(4) ≅ SU(2)₊ × SU(2)₋ / Z₂).  The Clebsch matrix
 * M of the shell's coefficients has singular values (the Schmidt spectrum) that are complete invariants of the
 * SO(4) orbit: unchanged by time, by STATE ROTATE R_z, by STARK ROTATE K_z — changed by a DEFECT WAIT, which is
 * how one recognises that e^{iαL²} is not an SO(4) element.  ⟨J₊⟩ and ⟨J₋⟩ are drawn on two unit spheres
 * (the coherent states are the rank-one matrices: both vectors on their spheres, a Kepler ellipse with
 * e = |⟨K⟩|/n, and NEBULA's camera sphere pair).  Invariants are recomputed only when the register's version
 * changes; the drawing follows the observer's camera so ẑ points where the FIELD's ẑ points.
 */
import { BASIS } from './hydrogen.js';
import { shellMatrix, schmidt, rotorExpectations } from './frontier.js';
import { cameraBasis } from './field.js';
import { el, readout, sw, N_RGB } from './kit.js';

export function createOrbit(host, api) {
  const cv = el('canvas', 'orbit-c', host);
  const bar = el('div', 'row tight', host);
  const drive = sw({ label: 'DRIVE  (changes ψ)', value: false, onChange: (v) => { cv.classList.toggle('drive', v); if (api.setStatus) api.setStatus(v ? 'DRIVE ON · changes c' : 'exact · per shell', v ? 'warn' : ''); } });
  bar.appendChild(drive.root);
  const hint = el('div', 'note', bar); hint.style.flex = '1 1 auto';
  hint.innerHTML = 'drag a sphere: <b>⟨J₊⟩</b> or <b>⟨J₋⟩</b> alone is an SO(4) move that is <i>not</i> a spatial rotation; the <b>KEPLER</b> panel drags both together = the ordinary rotation D<sup>l</sup>(R).';
  const rows = el('div', 'orbit-rows', host);
  el('div', 'note', host).innerHTML = '<b>EXACT.</b> Schmidt spectrum = the invariants of the SO(4) orbit (unchanged by t, R<sub>z</sub>, K<sub>z</sub> and by any rotor pair; changed by DEFECT WAIT). A rank-one shell is a coherent state: a classical Kepler ellipse with e = |⟨K⟩|/n = ((n−1)/n)·sin(γ/2), γ the angle between the two rotors — never e = 1.';
  const g = cv.getContext('2d');
  let lastVersion = -1, shells = [], lastObs = '', centres = [0, 0, 0], radius = 1, midY = 0;
  /* the three panels are three controls when DRIVE is on: ⟨J₊⟩ · ⟨J₋⟩ · both (a spatial rotation) */
  {
    const WHICH = ['+', '−', 'both'];
    let dragging = -1, px = 0, py = 0;
    cv.addEventListener('pointerdown', (e) => {
      if (!drive.get() || !api.rotor) return;
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      let best = -1, bd = 1e9;
      for (let k = 0; k < 3; k++) { const d = Math.hypot(x - centres[k], y - midY); if (d < bd) { bd = d; best = k; } }
      if (bd > radius * 1.6) return;
      dragging = best; px = e.clientX; py = e.clientY; cv.setPointerCapture(e.pointerId); e.preventDefault();
    });
    cv.addEventListener('pointermove', (e) => {
      if (dragging < 0) return;
      const dx = (e.clientX - px) * 0.012, dy = (e.clientY - py) * 0.012;
      px = e.clientX; py = e.clientY;
      if (dx) api.rotor({ which: WHICH[dragging], axis: 'z', angle: dx });
      if (dy) api.rotor({ which: WHICH[dragging], axis: 'y', angle: dy });
    });
    const up = () => { dragging = -1; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }
  function recompute(reg) {
    shells = [];
    const seen = new Set(); for (const a of reg.populated()) seen.add(BASIS[a].n);
    for (const n of [...seen].sort((x, y) => x - y)) {
      const M = shellMatrix(reg.re0, reg.im0, n);
      const S = schmidt(M), R = rotorExpectations(M);
      shells.push({ n, weight: M.norm2 / (reg.norm2() || 1), spectrum: S.values, ...R, coherent: n === 1 || S.values[0] > 0.9995 });
    }
    lastVersion = reg.version;
    rows.innerHTML = '';
    for (const s of shells) {
      const row = el('div', 'orbit-row', rows); row.style.setProperty('--nc', `rgb(${N_RGB[s.n].join(',')})`);
      el('div', 'orbit-band', row);
      const idz = el('div', 'orbit-id', row); el('div', 'sp-name', idz, `n${s.n}`); el('div', 'sp-sub', idz, `${(s.weight * 100).toFixed(1)}% of norm · j = ${s.j}`);
      const spec = readout({ label: 'SCHMIDT SPECTRUM', value: s.spectrum.map((v) => v.toFixed(3)).join(' · '), sub: s.coherent ? 'rank one · COHERENT (a Kepler ellipse)' : 'rank > 1 · entangled rotors' }); row.appendChild(spec.root); spec.set(spec.root.querySelector('.ro-val').textContent, s.coherent ? 'ok' : '');
      const lk = readout({ label: '|⟨L⟩| · |⟨K⟩| · e', value: `${s.absL.toFixed(3)} · ${s.absK.toFixed(3)} · ${s.e.toFixed(3)}`, sub: `⟨z⟩ = ${s.z.toFixed(3)} a₀ · coherence ${s.coherence.toFixed(3)}` }); row.appendChild(lk.root);
    }
  }
  function project(v, B) { return [v[0] * B.right[0] + v[1] * B.right[1] + v[2] * B.right[2], v[0] * B.up[0] + v[1] * B.up[1] + v[2] * B.up[2], v[0] * B.fwd[0] + v[1] * B.fwd[1] + v[2] * B.fwd[2]]; }
  function paint(obs) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    if (W < 32 || H < 32) return;                       // folded: no size, no drawing (radii would go negative)
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.font = '9px ui-monospace, monospace'; g.textBaseline = 'middle';
    if (!shells.length) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.textAlign = 'center'; g.fillText('no populated shell', W / 2, H / 2); return; }
    const B = cameraBasis(obs);
    const R = Math.min(W / 6.6, H / 2 - 16), cx = [W * 0.17, W * 0.5, W * 0.83], cy = H / 2;
    centres = cx; radius = R; midY = cy;
    const sphere = (k, label) => {
      g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1; g.beginPath(); g.arc(cx[k], cy, R, 0, 2 * Math.PI); g.stroke();
      const zt = project([0, 0, 1], B); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(cx[k], cy); g.lineTo(cx[k] + zt[0] * R, cy - zt[1] * R); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.textAlign = 'center'; g.fillText('ẑ', cx[k] + zt[0] * R * 1.12, cy - zt[1] * R * 1.12); g.fillText(label, cx[k], cy + R + 10);
    };
    sphere(0, '⟨J₊⟩ / j'); sphere(1, '⟨J₋⟩ / j'); sphere(2, 'KEPLER  (L̂ normal, K̂ major axis)');
    for (const s of shells) {
      if (s.n === 1) continue;
      const col = N_RGB[s.n], rgba = (a) => `rgba(${col[0]},${col[1]},${col[2]},${a})`;
      for (const [k, v] of [[0, s.Jp], [1, s.Jm]]) {
        const p = project([v[0] / s.j, v[1] / s.j, v[2] / s.j], B), x = cx[k] + p[0] * R, y = cy - p[1] * R;
        g.strokeStyle = rgba(0.9); g.lineWidth = 2; g.beginPath(); g.moveTo(cx[k], cy); g.lineTo(x, y); g.stroke();
        g.fillStyle = rgba(1); g.beginPath(); g.arc(x, y, p[2] > 0 ? 3.5 : 2.5, 0, 2 * Math.PI); g.fill();
      }
      // the Kepler ellipse of the (coherent) shell: a = n² a₀, e = |K|/n, major axis along K̂, normal along L̂
      if (s.absL > 1e-9 || s.absK > 1e-9) {
        const e = Math.min(0.999, s.e), Lh = s.absL > 1e-9 ? s.L.map((v) => v / s.absL) : null, Kh = s.absK > 1e-9 ? s.K.map((v) => v / s.absK) : null;
        let u = Kh, w;
        if (!u) { u = Math.abs(Lh[2]) < 0.9 ? [-Lh[1], Lh[0], 0] : [1, 0, 0]; const l = Math.hypot(...u); u = u.map((v) => v / l); }
        if (Lh) w = [Lh[1] * u[2] - Lh[2] * u[1], Lh[2] * u[0] - Lh[0] * u[2], Lh[0] * u[1] - Lh[1] * u[0]];
        else { w = [0, 0, 1]; }
        const sc = 0.92 / (1 + e);   // the ellipse a(1+e) apoapsis fits the sphere
        g.strokeStyle = rgba(s.coherent ? 0.95 : 0.35); g.lineWidth = s.coherent ? 1.8 : 1; g.beginPath();
        for (let i = 0; i <= 96; i++) {
          const ph = 2 * Math.PI * i / 96, rr = (1 - e * e) / (1 + e * Math.cos(ph)) * sc;      // r(φ) with the focus at the centre, periapsis toward +K̂ ... A points to the perihelion
          const q = [rr * (Math.cos(ph) * u[0] + Math.sin(ph) * w[0]), rr * (Math.cos(ph) * u[1] + Math.sin(ph) * w[1]), rr * (Math.cos(ph) * u[2] + Math.sin(ph) * w[2])];
          const p = project(q, B); const x = cx[2] + p[0] * R, y = cy - p[1] * R;
          if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
        g.fillStyle = rgba(1); g.beginPath(); g.arc(cx[2], cy, 2.5, 0, 2 * Math.PI); g.fill();
      }
      g.fillStyle = rgba(1); g.textAlign = 'left'; g.fillText(`n${s.n}  e = ${s.e.toFixed(3)}${s.coherent ? '' : '  (rank > 1)'}`, 6, 10 + 11 * shells.indexOf(s));
    }
  }
  function update(obs) {
    const reg = api.reg;
    if (reg.version !== lastVersion) { recompute(reg); paint(obs); lastObs = ''; return; }
    const key = `${obs.yaw.toFixed(4)}|${obs.pitch.toFixed(4)}|${cv.clientWidth}`;
    if (key !== lastObs) { lastObs = key; paint(obs); }
  }
  window.addEventListener('resize', () => { lastObs = ''; });
  return { update, get shells() { return shells; } };
}
