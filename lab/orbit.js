/* orbit.js — ORBIT: the two rotors of every populated shell (print of 2026-09-03, Thread B).
 *
 * STATUS: EXACT ANALYTIC.  A shell n is V_j ⊗ V_j with j = (n−1)/2 (SO(4) ≅ SU(2)₊ × SU(2)₋ / Z₂).  The Clebsch matrix
 * M of the shell's coefficients has singular values (the Schmidt spectrum) that are invariants of the
 * SO(4) orbit: unchanged by time, by STATE ROTATE R_z, by STARK ROTATE K_z — changed by a DEFECT WAIT, which is
 * how one recognises that e^{iαL²} is not an SO(4) element.  ⟨J₊⟩ and ⟨J₋⟩ are drawn on two unit spheres
 * (coherent states have BOTH spin expectations of length j; rank one alone is insufficient for n ≥ 3).
 * The illustrative Kepler shadow uses e = |⟨K⟩|/n. Invariants are recomputed only when the register's version
 * changes; the drawing follows the observer's camera so ẑ points where the FIELD's ẑ points.
 */
import { BASIS } from './hydrogen.js';
import { shellMatrix, shellCharacter } from './frontier.js';
import { cameraBasis, cameraKey } from './field.js';
import { el, readout, sw, nRGB, themeInk, graphHover, fitText } from './mir/kit.js';

/* WAVE 49 — THE LABEL IS THE SCALAR'S VERDICT.  The card used to read "rank one ⇒ COHERENT (a Kepler ellipse)"
   off the Schmidt spectrum alone, which printed a Kepler ellipse with e = 0 over |1,0⟩⊗|1,0⟩ = −0.5774·3s +
   0.8165·3d₀ — a state with NO angular momentum at all (⟨L⟩ = ⟨K⟩ = 0).  Rank one is separability of the two
   rotors and nothing more for n ≥ 3; "coherent" is now said only when the SO(4) invariant |⟨L⟩|² + |⟨K⟩|²
   saturates its ceiling (n−1)² to 1e-9 (frontier.js shellCharacter). */
const characterLabel = (s) => s.coherent ? 'spin coherent · Kepler shadow' : s.separable ? 'rank one · not coherent' : 'entangled rotors';

export function createOrbit(host, api) {
  const cv = el('canvas', 'orbit-c', host);
  const bar = el('div', 'row tight', host);
  const drive = sw({ label: 'DRIVE  (changes ψ)', value: false, onChange: (v) => { cv.classList.toggle('drive', v); if (api.setStatus) api.setStatus(v ? 'DRIVE ON · changes c' : 'exact · per shell', v ? 'warn' : ''); } });
  bar.appendChild(drive.root);
  const hint = el('div', 'note', bar); hint.style.flex = '1 1 auto';
  hint.innerHTML = 'Drag either sphere to apply one SO(4) rotor. Use KEPLER controls to rotate both as one spatial rotation.';
  const rows = el('div', 'orbit-rows', host);
  el('div', 'note', host).innerHTML = '<b>Interpretation.</b> Schmidt values are unchanged by the two rotor controls. COHERENCE reaches 1 only when both rotor expectations are maximal. The Kepler ellipse is a classical shadow with eccentricity |⟨K⟩|/n.';
  const g = cv.getContext('2d');
  let lastVersion = -1, shells = [], lastObs = '', centres = [0, 0, 0], radius = 1, midY = 0, lastPaintObs = null, hovers = [], plot = null;
  /* WAVE 46 — the three panels carry no floating text.  "n2  e = 0.834  (rank > 1)" used to be stacked in the
     top-left corner in the shell's own colour, over whatever the spheres had drawn there; the rotor arms, the
     tips and the ellipse ARE the objects, and each one answers for itself under the pointer. */
  const hover = graphHover(cv, { repaint: () => { if (lastPaintObs) paint(lastPaintObs); }, plot: () => plot });
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
      shells.push({ n, weight: M.norm2 / (reg.norm2() || 1), ...shellCharacter(M) });
    }
    lastVersion = reg.version;
    rows.innerHTML = '';
    for (const s of shells) {
      const row = el('div', 'orbit-row', rows); row.style.setProperty('--nc', `rgb(${nRGB(s.n).join(',')})`);
      el('div', 'orbit-band', row);
      const idz = el('div', 'orbit-id', row); el('div', 'sp-name', idz, `n${s.n}`); el('div', 'sp-sub', idz, `${(s.weight * 100).toFixed(1)}% of norm · j = ${s.j}`);
      const spec = readout({ label: 'SCHMIDT SPECTRUM', value: s.spectrum.map((v) => v.toFixed(3)).join(' · '), sub: characterLabel(s) }); row.appendChild(spec.root); spec.set(spec.root.querySelector('.ro-val').textContent, s.coherent ? 'ok' : '');
      const lk = readout({ label: '|⟨L⟩| · |⟨K⟩| · e', cls: 'wide', value: `${s.absL.toFixed(3)} · ${s.absK.toFixed(3)} · ${s.e.toFixed(3)}`, sub: `⟨z⟩ = ${s.z.toFixed(3)} a₀ · |⟨L⟩|²+|⟨K⟩|² = ${s.casimir.toFixed(4)} of ${s.casimirMax} (coherent ⟺ equal)` }); row.appendChild(lk.root);
    }
  }
  function project(v, B) { return [v[0] * B.right[0] + v[1] * B.right[1] + v[2] * B.right[2], v[0] * B.up[0] + v[1] * B.up[1] + v[2] * B.up[2], v[0] * B.fwd[0] + v[1] * B.fwd[1] + v[2] * B.fwd[2]]; }
  function paint(obs) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    if (W < 32 || H < 32) return;                       // folded: no size, no drawing (radii would go negative)
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.font = '9px ui-monospace, monospace'; g.textBaseline = 'middle';
    lastPaintObs = obs; hovers = []; plot = { x0: 0, y0: 0, x1: W, y1: H };
    const T = themeInk(g);
    if (!shells.length) { g.fillStyle = T.ink(0.55); g.textAlign = 'center'; g.fillText('no populated shell', W / 2, H / 2); hover.set(hovers, plot); return; }
    const B = cameraBasis(obs);
    const R = Math.min(W / 6.6, H / 2 - 16), cx = [W * 0.17, W * 0.5, W * 0.83], cy = H / 2;
    centres = cx; radius = R; midY = cy;
    /* the frame: a thin low-alpha circle, the ẑ tick, and ONE short name per panel — measured and clamped into
       its own third, never over the next sphere (KEPLER's parenthetical is on the panel's hover now) */
    const sphere = (k, label) => {
      g.strokeStyle = T.ink(0.30); g.lineWidth = 1; g.beginPath(); g.arc(cx[k], cy, R, 0, 2 * Math.PI); g.stroke();
      const zt = project([0, 0, 1], B); g.strokeStyle = T.ink(0.45); g.beginPath(); g.moveTo(cx[k], cy); g.lineTo(cx[k] + zt[0] * R, cy - zt[1] * R); g.stroke();
      g.fillStyle = T.ink(0.75); g.textAlign = 'center'; g.fillText('ẑ', cx[k] + zt[0] * R * 1.12, cy - zt[1] * R * 1.12);
      fitText(g, label, cx[k], cy + R + 10, { x0: k * W / 3 + 2, y0: 0, x1: (k + 1) * W / 3 - 2, y1: H }, 'center');
    };
    sphere(0, '⟨J₊⟩ / j'); sphere(1, '⟨J₋⟩ / j'); sphere(2, 'KEPLER');
    hovers.push({ kind: 'dot', key: 'kep', x: cx[2], y: cy + R + 10, r: 7, colour: T.ink(1), info: 'KEPLER — L̂ the orbit normal, K̂ the major axis; the panel drags both rotors together (an ordinary rotation)' });
    for (const s of shells) {
      if (s.n === 1) continue;
      const col = nRGB(s.n), rgba = (a) => `rgba(${col[0]},${col[1]},${col[2]},${a})`;
      const tail = `e = ${s.e.toFixed(3)}  ·  ${characterLabel(s)}`;
      for (const [k, v] of [[0, s.Jp], [1, s.Jm]]) {
        const p = project([v[0] / s.j, v[1] / s.j, v[2] / s.j], B), x = cx[k] + p[0] * R, y = cy - p[1] * R;
        g.strokeStyle = rgba(0.9); g.lineWidth = 2; g.beginPath(); g.moveTo(cx[k], cy); g.lineTo(x, y); g.stroke();
        g.fillStyle = rgba(1); g.beginPath(); g.arc(x, y, p[2] > 0 ? 3.5 : 2.5, 0, 2 * Math.PI); g.fill();
        hovers.push({ kind: 'line', key: `n${s.n}J${k}`, points: [cx[k], cy, x, y], lw: 2, colour: rgba(1),
          info: `n${s.n}  ⟨J${k ? '₋' : '₊'}⟩ / j  ·  ${tail}` });
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
        const ell = [];
        for (let i = 0; i <= 96; i++) {
          const ph = 2 * Math.PI * i / 96, rr = (1 - e * e) / (1 + e * Math.cos(ph)) * sc;      // r(φ) with the focus at the centre, periapsis toward +K̂ ... A points to the perihelion
          const q = [rr * (Math.cos(ph) * u[0] + Math.sin(ph) * w[0]), rr * (Math.cos(ph) * u[1] + Math.sin(ph) * w[1]), rr * (Math.cos(ph) * u[2] + Math.sin(ph) * w[2])];
          const p = project(q, B); const x = cx[2] + p[0] * R, y = cy - p[1] * R;
          ell.push(x, y);
          if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
        g.fillStyle = rgba(1); g.beginPath(); g.arc(cx[2], cy, 2.5, 0, 2 * Math.PI); g.fill();
        hovers.push({ kind: 'curve', key: `n${s.n}ell`, points: ell, lw: s.coherent ? 1.8 : 1, colour: rgba(1),
          info: `n${s.n}  Kepler ellipse  ·  ${tail}  ·  a = ${s.n * s.n} a₀` });
      }
    }
    hover.set(hovers, plot);
  }
  function update(obs) {
    const reg = api.reg;
    if (reg.version !== lastVersion) { recompute(reg); paint(obs); lastObs = ''; return; }
    const key = `${cameraKey(obs)}|${cv.clientWidth}`;                              // wave 54: the WHOLE orientation — a FREE camera can roll with both angles still
    if (key !== lastObs) { lastObs = key; paint(obs); }
  }
  window.addEventListener('resize', () => { lastObs = ''; });
  return { update, get shells() { return shells; } };
}
