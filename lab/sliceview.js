/* sliceview.js — the SLICE window: a rotatable complex plane through ψ, painted with the phase palette.
 *
 * Drag the picture to turn the plane.  Plain drag moves the MINUS rotor, which is a HOLOMORPHIC (U(2)) motion —
 * n₊ stands still — and shift-drag moves the PLUS rotor, which is not.  That is the 4D engine's two-trackball
 * control surface, and it is the right one here for the reason their notes give: dim SO(4) = 6 = 4 (the plane
 * itself) + 1 visible roll + 1 angle that changes nothing you can see, so a control designed on S² × S² wastes
 * none of the user's motion.  TOUR runs the two-slerp geodesic between the named planes.
 */
import { sampleSlice, paintSlice, planeReport } from './slice.js';
import { IDENTITY, expPure, qmul, qnormalize, canonicaliseRotors, classifyManeuver, tourSegmentAt, projectToU2, isHolomorphic } from './rotor4.js';
import { el, seg, sw, knob, trig, readout } from './kit.js';

const NAMED = [
  { key: 'xy', label: 'x–y', qL: [1, 0, 0, 0], qR: [1, 0, 0, 0] },
  { key: 'xz', label: 'x–z', qL: qnormalize([Math.SQRT1_2, Math.SQRT1_2, 0, 0]), qR: [1, 0, 0, 0] },
  { key: 'yz', label: 'y–z', qL: qnormalize([Math.SQRT1_2, 0, 0, Math.SQRT1_2]), qR: [1, 0, 0, 0] },
  { key: 'iso', label: 'isoclinic', qL: qnormalize([1, 1, 1, 1]), qR: qnormalize([1, -1, 1, -1]) },
];

export function createSliceView(host, api) {
  let rotor = { ...IDENTITY }, mode = 'space', half = 8, gain = 1.6, res = 128, dirty = true, tour = null;
  const cv = el('canvas', 'slice-c', host);
  const g = cv.getContext('2d');
  let img = null, sample = null;

  const r1 = el('div', 'row tight', host);
  const modeSeg = seg({ label: 'PLANE', value: 'space', options: [
    { id: 'space', label: 'ℝ³', title: 'a 2-plane through ordinary space' },
    { id: 'ks', label: 'KS ℝ⁴', title: 'a 2-plane in the Kustaanheimo–Stiefel 4-space, mapped down by the quadratic KS map — the plane the grand tour rotates' }],
    onChange: (v) => { mode = v; dirty = true; api.repaint(); } });
  r1.appendChild(modeSeg.root);
  r1.appendChild(knob({ label: 'EXTENT a₀', min: 1, max: 60, value: 8, log: true, fmt: (v) => '±' + v.toFixed(1), onInput: (v) => { half = v; dirty = true; api.repaint(); } }).root);
  r1.appendChild(knob({ label: 'GAIN', min: 0.1, max: 20, value: 1.6, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { gain = v; dirty = true; api.repaint(); } }).root);
  const holo = sw({ label: 'HOLO U(2)', value: false, title: 'snap the plus rotor to the holomorphic sheet: every motion then keeps n₊ fixed', onChange: (v) => { if (v) { rotor = canonicaliseRotors(projectToU2(rotor.qL), rotor.qR); dirty = true; api.repaint(); } } });
  r1.appendChild(holo.root);

  const r2 = el('div', 'row tight', host);
  for (const p of NAMED) r2.appendChild(trig({ label: p.label, onFire: () => { tour = { from: { qL: rotor.qL.slice(), qR: rotor.qR.slice() }, to: { qL: p.qL.slice(), qR: p.qR.slice() }, t: 0 }; api.repaint(); } }).root);
  r2.appendChild(trig({ label: 'RESET', onFire: () => { rotor = { ...IDENTITY }; tour = null; dirty = true; api.repaint(); } }).root);
  const ro = readout({ label: 'PLANE  n₊ · n₋', value: '—', cls: 'wide', sub: '' });
  el('div', 'row tight', host).appendChild(ro.root);
  el('div', 'note', host).innerHTML = 'ψ sampled on the plane and <b>domain-coloured</b>: hue is arg ψ through the phase palette, brightness is |ψ| through the same bounded knee the field uses, and the faint bands are contours of |ψ|. <b>Drag</b> to turn the plane — plain drag moves the minus rotor, which is a <b>holomorphic U(2) motion</b> (n₊ never moves), shift-drag moves the plus rotor, which is not. In <b>KS</b> the plane lives in hydrogen\'s own 4-space; its image is a <b>cone over a circle</b> (Round 10, a theorem, gated): axis on the plus sphere, half-angle arccos|n₋z| from the minus sphere. It never folds — it flattens to a plane at the minus sphere\'s equator and collapses to a ray at its poles, and the readout says which.';

  function recompute(reg, t) {
    const N = res;
    if (!img || img.width !== N) { img = g.createImageData(N, N); }
    sample = sampleSlice(reg, t, rotor, { mode, half, N });
    paintSlice(sample, img, { lut: api.lut(), gain, knee: 0.6 });
    dirty = false;
  }
  function paint() {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 32 || !img) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    const off = document.createElement('canvas'); off.width = img.width; off.height = img.height;
    off.getContext('2d').putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true;
    g.clearRect(0, 0, cv.width, cv.height);
    g.drawImage(off, 0, 0, cv.width, cv.height);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
    g.font = '9px ui-monospace, monospace'; g.fillStyle = 'rgba(255,255,255,0.55)'; g.textAlign = 'left';
    g.fillText(`${mode === 'ks' ? 'KS ℝ⁴' : 'ℝ³'} · ±${half.toFixed(1)} a₀ · ${res}²`, 8, 12);
    if (isHolomorphic(rotor.qL)) { g.fillStyle = 'rgba(120,225,240,0.85)'; g.fillText('HOLOMORPHIC  U(2)', 8, H - 8); }
  }
  function update(reg, t, playing) {
    if (tour) {
      tour.t = Math.min(1, tour.t + 0.04);
      rotor = tourSegmentAt({ from: tour.from, to: tour.to }, tour.t);
      if (tour.t >= 1) tour = null;
      dirty = true;
      api.repaint();
    }
    const key = `${reg.version}|${t.toFixed(4)}|${mode}|${half}|${gain}|${res}`;
    if (dirty || key !== update.key) { update.key = key; recompute(reg, t); paint(); }
    const rep = planeReport(rotor);
    ro.set(rep.text, rep.holomorphic ? 'ok' : '');
    const nmz = Math.abs(rep.nM[2]), cone = Math.acos(Math.min(1, nmz)) * 180 / Math.PI;
    const shape = mode === 'ks' ? (nmz > 0.999 ? 'KS: COLLAPSED to a ray (n₋ at a pole)' : nmz < 0.02 ? 'KS: FLAT — a whole plane (n₋ on the equator)' : `KS: cone, half-angle ${cone.toFixed(1)}° = arccos|n₋z|`) : 'ℝ³ plane';
    ro.setSub(`${shape} · ${classifyManeuver(Math.acos(Math.min(1, Math.abs(rotor.qL[0]))) * 2, Math.acos(Math.min(1, Math.abs(rotor.qR[0]))) * 2)} · ${rep.holomorphic ? 'n₊ fixed (U(2) sheet)' : 'general SO(4)'}`);
  }
  /* drag the picture to turn the plane: plain = minus rotor (holomorphic), shift = plus rotor */
  {
    let down = false, px = 0, py = 0, shift = false;
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); down = true; px = e.clientX; py = e.clientY; shift = e.shiftKey; res = 64; });
    cv.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = (e.clientX - px) * 0.008, dy = (e.clientY - py) * 0.008; px = e.clientX; py = e.clientY;
      const d = expPure([dy * 0.5, dx * 0.5, 0]);
      if (shift && !holo.get()) rotor = canonicaliseRotors(qnormalize(qmul(d, rotor.qL)), rotor.qR);
      else rotor = canonicaliseRotors(rotor.qL, qnormalize(qmul(d, rotor.qR)));
      dirty = true; api.repaint();
    });
    const up = () => { if (down) { down = false; res = 128; dirty = true; api.repaint(); } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }
  window.addEventListener('resize', () => paint());
  return { update, get rotor() { return rotor; }, setRotor(r) { rotor = canonicaliseRotors(r.qL, r.qR); dirty = true; },
    get sample() { return sample; }, get mode() { return mode; }, setMode(m) { mode = m; modeSeg.set(m); dirty = true; },
    tourTo(key) { const p = NAMED.find((x) => x.key === key); if (p) tour = { from: { qL: rotor.qL.slice(), qR: rotor.qR.slice() }, to: { qL: p.qL.slice(), qR: p.qR.slice() }, t: 0 }; } };
}
