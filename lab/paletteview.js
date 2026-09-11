/* paletteview.js — the palette editor: colour the complex plane, and that becomes the hue cycle arg ψ runs through.
 *
 * The strip IS the phase circle: its left edge is arg ψ = −π, its centre 0, its right edge +π, and it wraps.
 * Click the strip to add a stop, drag a stop to move it, use the colour well to recolour the selected one,
 * double-click a stop to remove it.  The ring beside it shows the same palette as the complex plane itself, so
 * the seam at ±π is visible: a palette that does not close there paints a false nodal line into the picture.
 * This is an OBSERVER product and is labelled a DESIGN CHOICE — ψ is never touched.
 */
import { toLUT, normalize, cyclic, rgbToHex, hexToRgb, PRESETS, PRESET_BY_ID, PRESET_GROUPS } from './palette.js';
import { el, sw, trig, knob, readout, themeInk, onThemeChange, chip } from './mir/kit.js';


export const DEFAULT_PALETTE = 'prism';
export function createPaletteEditor(host, api) {
  const startId = (api.startId && PRESET_BY_ID.get(api.startId)) ? api.startId : DEFAULT_PALETTE;
  let stops = PRESET_BY_ID.get(startId).stops.map((s) => ({ at: s.at, rgb: s.rgb.slice() }));
  let sel = 0;
  const ui = {};
  const r0 = el('div', 'row tight palette-presets', host);
  ui.on = sw({ label: 'PALETTE', value: false, onChange: (v) => { api.setEnabled(v); push(); } });
  const enableRow=el('div','row tight palette-enable',host);enableRow.appendChild(ui.on.root);
  ui.sel = el('select', 'sel', r0); ui.sel.setAttribute('aria-label', 'palette');   // wave 62: the other five <select>s name themselves through a `title`; this one had nothing


  for (const g of PRESET_GROUPS) {
    const og = el('optgroup', '', ui.sel); og.label = g.points + ' points';
    for (const p of g.items) { const o = el('option', '', og, p.label); o.value = p.id; if (p.note) o.title = p.note; }
  }
  ui.sel.value = startId;
  /* ── WAVE 56 · THE SECOND RE-PICK TRAP (ANTI-PATTERNS 12) ────────────────────────────────────
   * Wave 55 fixed this exact class on the PRESET select and NAMED this one without fixing it: a
   * `<select>` fires `change` only when the value CHANGES, so after ROTATE / REVERSE / ADD / REMOVE
   * / a recolour, re-picking the palette you are already on fires nothing at all and the catalogue
   * colours you were reaching for are unreachable — the menu looks like a dead control.  The work
   * this handler does is a RELOAD and not an assignment, so it needs a way to be asked for again.
   * Same class, same fix as the preset select: one loader, called unconditionally by a trigger. */
  const pickPalette = (id) => {
    const p = PRESET_BY_ID.get(id); if (!p) return false;
    stops = p.stops.map((s) => ({ at: s.at, rgb: s.rgb.slice() }));
    sel = 0; push();
    if (api.chose) api.chose(id);
    return true;
  };
  ui.sel.addEventListener('change', () => pickPalette(ui.sel.value));
  ui.sel.style.flex = '1 1 120px';


  const stepPalette = (d) => {
    const ids = [...ui.sel.options].map((o) => o.value);
    if (!ids.length) return;
    const i = ids.indexOf(ui.sel.value);
    const next = ids[((i < 0 ? 0 : i) + d + ids.length) % ids.length];
    ui.sel.value = next; pickPalette(next);
  };


  ui.palPrev = trig({ label: '', cls: 'pal-nav', title: 'Select the previous palette', onFire: () => stepPalette(-1) });
  ui.palNext = trig({ label: '', cls: 'pal-nav', title: 'Select the next palette', onFire: () => stepPalette(1) });
  chip(ui.palPrev.root, 'dirPrev', 'previous palette');
  chip(ui.palNext.root, 'dirNext', 'next palette');
  r0.insertBefore(ui.palPrev.root, ui.sel);
  r0.appendChild(ui.palNext.root);
  enableRow.appendChild(trig({ label: 'RESET', title: 'Reload the selected palette', onFire: () => pickPalette(ui.sel.value) }).root);
  ui.seam = readout({ label: 'SEAM at ±π', value: '—', sub: 'OKLab distance across the wrap' });
  const seamInfo=el('div','palette-seam',host);seamInfo.appendChild(ui.seam.root);

  const wrap = el('div', 'pal-wrap', host);
  const strip = el('canvas', 'pal-strip', wrap);
  const ring = el('canvas', 'pal-ring', wrap);
  const r1 = el('div', 'row tight', host);
  ui.color = el('input', 'pal-color', r1); ui.color.type = 'color'; ui.color.value = '#5ee7d8';
  ui.color.addEventListener('input', () => { if (stops[sel]) { stops[sel].rgb = hexToRgb(ui.color.value); push(); } });
  r1.appendChild(trig({ label: 'ADD', title: 'add a stop opposite the selected one', onFire: () => { const at = ((stops[sel] ? stops[sel].at : 0) + 0.5) % 1; stops.push({ at, rgb: hexToRgb(ui.color.value) }); stops = normalize(stops); sel = stops.findIndex((s) => Math.abs(s.at - at) < 1e-9); push(); } }).root);
  r1.appendChild(trig({ label: 'REMOVE', onFire: () => { if (stops.length > 2) { stops.splice(sel, 1); sel = 0; push(); } } }).root);
  r1.appendChild(knob({ label: 'ROTATE', min: 0, max: 2 * Math.PI, value: 0, wrap: true, fmt: () => 'turn', onDelta: (d) => { const f = d / (2 * Math.PI); for (const s of stops) s.at = ((s.at + f) % 1 + 1) % 1; stops = normalize(stops); push(); } }).root);   // a wheel: turn the whole cycle around the complex plane
  r1.appendChild(trig({ label: 'REVERSE', title: 'Reverse the palette cycle', onFire: () => { for (const s of stops) s.at = (1 - s.at) % 1; stops = normalize(stops); push(); } }).root);
  el('div', 'note', host).innerHTML = '<b>Phase palette.</b> The strip runs from arg ψ = −π to +π and wraps at the seam. Click to add a stop, drag to move it, and double-click to remove it. OKLab blending keeps transitions perceptually even.';

  function push() {
    stops = normalize(stops);
    api.setLUT(toLUT(stops));
    ui.seam.set(cyclic(stops).toFixed(4), cyclic(stops) < 0.06 ? 'ok' : 'warn');
    ui.seam.setSub(cyclic(stops) < 0.06 ? 'closes cleanly' : 'a visible seam at arg ψ = ±π');
    if (stops[sel]) ui.color.value = rgbToHex(stops[sel].rgb);
    paint();
    api.repaint();
  }
  onThemeChange(() => paint());          /* the strip's tick ink follows the theme (wave 46) */
  function paint() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = strip.clientWidth, H = strip.clientHeight;
    if (W < 16 || H < 8) return;
    if (strip.width !== W * dpr || strip.height !== H * dpr) { strip.width = W * dpr; strip.height = H * dpr; }
    const g = strip.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const lut = toLUT(stops);
    for (let x = 0; x < W; x++) {
      const i = Math.floor(x / W * 256) % 256;
      g.fillStyle = `rgb(${Math.round(lut[i * 4] * 255)},${Math.round(lut[i * 4 + 1] * 255)},${Math.round(lut[i * 4 + 2] * 255)})`;
      g.fillRect(x, 0, 1, H - 12);
    }
    g.font = '8px ui-monospace, monospace'; g.textBaseline = 'middle'; g.textAlign = 'center';
    g.fillStyle = themeInk(g).ink(0.85);          /* a canvas has no theme: white on white on the light card */
    for (const [f, lab] of [[0, '−π'], [0.25, '−π/2'], [0.5, '0'], [0.75, '+π/2'], [1, '+π']]) g.fillText(lab, Math.min(W - 8, Math.max(8, f * W)), H - 5);
    stops.forEach((s, i) => {
      const x = s.at * W;
      g.strokeStyle = i === sel ? '#fff' : 'rgba(255,255,255,0.55)'; g.lineWidth = i === sel ? 2 : 1;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H - 12); g.stroke();
      g.fillStyle = `rgb(${s.rgb.map((v) => Math.round(v * 255)).join(',')})`;
      g.beginPath(); g.arc(x, 6, i === sel ? 5 : 3.5, 0, 2 * Math.PI); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1; g.stroke();
    });
    // the ring: the same palette laid on the complex plane, so the seam is visible where it matters
    const RW = ring.clientWidth, RH = ring.clientHeight;
    if (RW > 16 && RH > 16) {
      if (ring.width !== RW * dpr || ring.height !== RH * dpr) { ring.width = RW * dpr; ring.height = RH * dpr; }
      const r = ring.getContext('2d'); r.setTransform(dpr, 0, 0, dpr, 0, 0); r.clearRect(0, 0, RW, RH);
      const cx = RW / 2, cy = RH / 2, R = Math.min(cx, cy) - 2;
      for (let a = 0; a < 360; a++) {
        const th = a / 360, i = Math.floor(th * 256) % 256;
        r.strokeStyle = `rgb(${Math.round(lut[i * 4] * 255)},${Math.round(lut[i * 4 + 1] * 255)},${Math.round(lut[i * 4 + 2] * 255)})`;
        r.lineWidth = 2; r.beginPath();
        const A = (th * 2 - 1) * Math.PI;
        r.moveTo(cx + Math.cos(A) * R * 0.45, cy + Math.sin(A) * R * 0.45);
        r.lineTo(cx + Math.cos(A) * R, cy + Math.sin(A) * R);
        r.stroke();
      }
      r.strokeStyle = 'rgba(255,255,255,0.5)'; r.setLineDash([2, 2]); r.beginPath(); r.moveTo(cx - R, cy); r.lineTo(cx - R * 0.45, cy); r.stroke(); r.setLineDash([]);
    }
  }
  /* pointer: click to add, drag to move, double-click to remove */
  {
    let drag = -1, downAt = 0;
    const pos = (e) => { const b = strip.getBoundingClientRect(); return Math.min(0.9999, Math.max(0, (e.clientX - b.left) / Math.max(1, b.width))); };
    strip.addEventListener('pointerdown', (e) => {
      e.preventDefault(); strip.setPointerCapture(e.pointerId);
      const u = pos(e);
      let best = -1, bd = 1e9;
      stops.forEach((s, i) => { let d = Math.abs(s.at - u); d = Math.min(d, 1 - d); if (d < bd) { bd = d; best = i; } });
      const now = performance.now();
      if (bd < 0.03 && now - downAt < 320 && best === sel && stops.length > 2) { stops.splice(sel, 1); sel = 0; push(); downAt = 0; return; }
      downAt = now;
      if (bd < 0.03) { sel = best; drag = best; } else { stops.push({ at: u, rgb: hexToRgb(ui.color.value) }); stops = normalize(stops); sel = stops.findIndex((s) => Math.abs(s.at - u) < 1e-9); drag = sel; }
      push();
    });
    strip.addEventListener('pointermove', (e) => { if (drag < 0) return; stops[drag].at = pos(e); const keep = stops[drag]; stops = normalize(stops); sel = stops.indexOf(keep) >= 0 ? stops.indexOf(keep) : stops.findIndex((s) => s.at === keep.at); drag = sel; push(); });
    const up = () => { drag = -1; };
    strip.addEventListener('pointerup', up); strip.addEventListener('pointercancel', up);
  }
  window.addEventListener('resize', () => paint());
  push();
  return { get stops() { return stops; }, get selected() { return sel; }, get on() { return ui.on.get(); }, setOn(v) { ui.on.set(v); api.setEnabled(v); push(); },
    get id() { return ui.sel.value; }, get groups() { return PRESET_GROUPS.map((g) => ({ points: g.points, items: g.items.map((p) => p.id) })); },
    /** name a preset from the catalogue — the settings key's road back in, and LW.setPalette's */
    select(id) { if (!PRESET_BY_ID.get(id)) return false; ui.sel.value = id; stops = PRESET_BY_ID.get(id).stops.map((x) => ({ at: x.at, rgb: x.rgb.slice() })); sel = 0; push(); return true; },
    load(s, selected = 0) { stops = normalize(s.map((x) => ({ at: x.at, rgb: x.rgb.slice() }))); sel = Math.max(0, Math.min(stops.length - 1, Math.trunc(selected) || 0)); push(); }, repaint: paint };
}
