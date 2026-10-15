/* vortex.js — VORTEX, the flow: the nodal lines of ψ(t), located exactly (print of 2026-09-03, Thread C); since 0.4.0 S3 the
 * window also carries DYNAMICS' PARTICLES (rack.js), which ride the current these lines are the singular set of.
 *
 * STATUS: EXACT ANALYTIC on the sampled circles.  On the coaxial circle (r, θ), ψ = Σ_m g_m(r,θ,t) e^{imφ}, so the
 * nodal set on that circle is the set of unimodular roots of the polynomial P(w) = Σ g_m w^{m−m_min} (Theorem C.1):
 * at most M = m_max − m_min lines pierce any circle (degree bound), none where one |g_m| dominates the rest
 * (Rouché).  The locator tracks the roots across θ on each sphere and refines every crossing of |w| = 1 by
 * bisection, so every drawn point is an exact zero of the sampled polynomial; between samples nothing is claimed.
 * For a stretched three-mode state (m₀+1, m₀, m₀−1 with l = |m|) the event census is the root set of
 * Φ(r) = Â₀² − 4|Â₊Â₋| (Theorem C.3), every point firing at one of two phases of the discriminant beat; each event is
 * NAMED by `classifyEvent` (frontier.js, 0.6.3 E1) — regular line · birth · death · saddle — never by a stored word.
 * The overlay draws the points on the stage through the FIELD's own camera; it is an observer product.
 */
import { BASIS } from './hydrogen.js';
import { vortexPoints, stretchedCensus, threeModes, classifyEvent } from './frontier.js';
import { cameraKey, toScreen } from './field.js';
import { el, readout, sw, seg, trig } from './mir/kit.js';

export function createVortex(host, overlay, api) {
  const r1 = el('div', 'row tight', host);
  const on = sw({ label: 'LOCATE', value: false, onChange: () => { dirty = true; } }); r1.appendChild(on.root);   // off until asked: the census is a CPU reader
  const qual = seg({ label: 'SAMPLING', value: 'fine', options: [{ id: 'coarse', label: '20 × 48' }, { id: 'fine', label: '40 × 96' }, { id: 'dense', label: '72 × 160' }], onChange: () => { dirty = true; } }); r1.appendChild(qual.root);
  const show = sw({ label: 'OVERLAY ON FIELD', value: false, onChange: () => { drawOverlay(); } }); r1.appendChild(show.root);
  const r2 = el('div', 'row tight', host);
  const mRo = readout({ label: 'DEGREE BOUND  M = m_max − m_min', value: '—', sub: 'lines per coaxial circle ≤ M' }); r2.appendChild(mRo.root);
  const nRo = readout({ label: 'POINTS · CIRCLES · DOMINANT', value: '—', sub: '' }); r2.appendChild(nRo.root);
  const axRo = readout({ label: 'AXIS', value: '—', sub: '' }); r2.appendChild(axRo.root);
  const cRo = readout({ label: 'EVENT CENSUS', value: '—', cls: 'wide', sub: '' }); r2.appendChild(cRo.root);
  const r3 = el('div', 'row tight', host);
  const jump = trig({ label: 'JUMP TO EVENT', title: 'Jump to the next event', onFire: () => { if (census && census.count && api.scrubTo) { const t = api.clock.t, Td = census.Td; const fires = [...new Set(census.points.filter((p) => p.admissible).map((p) => +p.t0.toFixed(6)))].sort((a, b) => a - b); let best = null; for (const f of fires) { let cand = f + Td * Math.floor((t - f) / Td + 1e-9) + Td; if (cand - t < 1e-6) cand += Td; if (best === null || cand < best) best = cand; } if (best !== null) api.scrubTo(best); } } }); r3.appendChild(jump.root);
  el('div', 'note', host).innerHTML = '<b>The flow.</b> Roots of P(w) locate the nodal lines on sampled coaxial circles — where the current v = j/ρ is singular, and which the PARTICLES below never cross. A double root is a nodal event, named from exact derivatives: a regular line, a birth or death of a loop, or a saddle where two lines exchange partners. The three-mode test finds their beat phases directly.';
  const cv = overlay; const g = cv.getContext('2d');
  let dirty = true, last = null, census = null, lastKey = '', lastCensusVersion = -1, lastObs = '';

  function grid() { return { coarse: [20, 48], fine: [40, 96], dense: [72, 160] }[qual.get()]; }
  function locate(reg, t, half) {
    const rs = reg.renderSet(); const ids = rs.ids;
    const c = reg.at(t);
    const [nr, nth] = grid();
    const V = vortexPoints(c.re, c.im, ids, { nr, nth, rMin: 0.05 * half, rMax: half * 0.98 });
    last = { t, ids: ids.slice(), points: V.points, M: V.M, circles: V.circles, skipped: V.skipped, axis: V.axis, half };
    mRo.set(String(V.M)); nRo.set(`${V.points.length} · ${V.circles} · ${V.skipped}`); nRo.setSub(`${nr} spheres × ${nth} polar samples · t = ${t.toFixed(2)}`);
    axRo.set(V.axis ? `vortex, charge ${V.axis}` : 'not nodal'); axRo.setSub(V.axis ? 'no m = 0 mode: the z-axis is a nodal line' : 'an m = 0 mode is populated');
    if (reg.version !== lastCensusVersion) {
      lastCensusVersion = reg.version;
      census = stretchedCensus(threeModes(reg.re0, reg.im0, reg.populated()), Math.max(20, half));
      if (census) {
        const adm = census.points.filter((p) => p.admissible), ids = reg.populated(), tally = {}, at = (p, z) => (p.t0 == null ? { kind: 'unclassified', eig: null }    // the double root sits at φ = arg w, not φ = 0
          : classifyEvent(reg.re0, reg.im0, ids, p.rho * Math.cos(p.phi), p.rho * Math.sin(p.phi), z, p.t0)), word = (e) => e.kind + (e.eig ? ` · H ${e.eig.map((v) => v.toFixed(1)).join(', ')}` : '');
        census.events = adm.flatMap((p) => [p.z, -p.z].map((z) => ({ ...at(p, z), rho: p.rho, z, t0: p.t0 })));
        for (const e of census.events) tally[e.kind] = (tally[e.kind] || 0) + 1;
        cRo.set(`${Object.entries(tally).map(([k, n]) => `${n} ${n === 1 || k === 'unclassified' ? k : k + 's'}`).join(' · ') || '0 events'} · t₀ ∈ {${[...new Set(adm.map((p) => (p.t0 == null ? '—' : p.t0.toFixed(2))))].sort((a, b) => a - b).join(', ')}} of T_d = ${census.Td.toFixed(2)} a.u.`, 'ok');
        cRo.setSub(adm.map((p, i) => { const u = word(census.events[2 * i]), v = word(census.events[2 * i + 1]); return `(ρ, ±z) = (${p.rho.toFixed(3)}, ±${p.z.toFixed(3)}) · ${u === v ? u : `${u} | −z ${v}`}`; }).join(' · ') || 'none admissible');
      } else { cRo.set('— (needs three stretched modes m₀+1, m₀, m₀−1 with l = |m|)', ''); cRo.setSub(''); }
    }
  }
  function drawOverlay(obs) {
    if (!show.get() || !last || !obs) {
      if (cv.width !== 1 || cv.height !== 1) { cv.width = 1; cv.height = 1; }
      return;
    }
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const S = toScreen(obs, last.half, W, H), D = S.D;
    for (const p of last.points) {
      const q = S.at(p.x, p.y, p.z); if (!q) continue;
      const [x, y, depth] = q, sz = Math.max(1.2, 2.6 * (D / depth) ** 0.5);
      g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.arc(x, y, sz, 0, 2 * Math.PI); g.fill();
      g.fillStyle = 'rgba(120,225,240,0.55)'; g.beginPath(); g.arc(x, y, sz + 1.5, 0, 2 * Math.PI); g.fill();
    }
    if (last.axis) {       // the z-axis as a nodal line: draw it through the domain
      const pts = [S.at(0, 0, -last.half * 0.95), S.at(0, 0, last.half * 0.95)];
      if (pts[0] && pts[1]) { g.strokeStyle = 'rgba(120,225,240,0.5)'; g.lineWidth = 1.5; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); g.lineTo(pts[1][0], pts[1][1]); g.stroke(); g.setLineDash([]); }
    }
    g.fillStyle = document.body.dataset.theme === 'light' ? 'rgba(20,30,50,0.62)' : 'rgba(255,255,255,0.45)'; g.font = '9px ui-monospace, monospace'; g.textAlign = 'left';
    const cx = document.body.classList.contains('rack-l') ? 12 + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rack-w')) || 300) + 8 : 12;
    if (!document.body.classList.contains('no-captions')) g.fillText(`VORTEX · ${last.points.length} nodal points on ${grid()[0]} spheres · exact on the sampled circles`, cx, H - 114);
  }
  /**
   * display-rate update: relocate when the register or the time changed (throttled while playing), redraw the
   * overlay when the camera moved.  Idle: nothing.
  */
  let lastLocateWall = 0;
  function suspend() {
    lastObs = '';                                      // visibility returning must redraw even if the camera did not move
    if (cv.width !== 1 || cv.height !== 1) { cv.width = 1; cv.height = 1; }
  }
  function update(reg, t, obs, half, playing) {
    if (!on.get()) { if (last) { last = null; drawOverlay(obs); } return; }
    const key = `${reg.version}|${t.toFixed(6)}|${qual.get()}|${half}`;
    const now = performance.now();
    if (key !== lastKey && (!playing || now - lastLocateWall > 120 || dirty)) { lastKey = key; lastLocateWall = now; dirty = false; locate(reg, t, half); drawOverlay(obs); lastObs = ''; return; }
    const ok = `${cameraKey(obs)}|${obs.dist.toFixed(4)}|${obs.fov}|${cv.clientWidth}|${cv.clientHeight}|${show.get()}`;   // wave 54: the WHOLE orientation (a FREE camera rolls)
    if (ok !== lastObs) { lastObs = ok; drawOverlay(obs); }
  }
  return { update, suspend, get last() { return last; }, get census() { return census; }, locateNow(reg, t, half) { locate(reg, t, half); return last; },
    setOn(v) { on.set(v); dirty = true; }, setOverlay(v) { show.set(v); drawOverlay(); }, get on() { return on.get(); }, get overlay() { return show.get(); } };
}
