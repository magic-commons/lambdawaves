/* stage-text.js — THE STAGE TEXT (0.4.0 S3 · F2): what is playing, written on the stage in the notebook's own markdown and
 * KaTeX — the formula, the fade that announces a hand's preset over it, and the atom labels.  Transparent, never a pointer
 * target, beneath every window (#molFormula z 20, #atomLabels z 9, the racks 30), never in the occlusion mask; its ink is
 * accent-wheel.js's, from the live STAGE colour.
 *
 * THIS IS THE INTERIM RENDERER, AND 0.5.0 DELETES THIS FILE: the formula becomes the kit's `layer.addBlock({ md })`,
 * `announce(md, ttl)` becomes `layer.addLabel({ ttl })` and the labels `layer.addLabel({ anchor })` (PLAN F2, KIT BRIEFS 7, 13).
 *
 * THE LAWS (BRIEF S3 T1).  The key is the STRING it would render: the DOM is touched only when the markdown changes, and
 * KaTeX (lab/mir/shell/notebook-render.js, imported, never changed) runs at most four times a second — a change inside the
 * quarter second waits, then renders whatever is wanted by then.  No live coefficient reaches a string (rack.js stageLines).
 * NO PER-TICK LAYOUT READ: place() reads the racks and measures the text only on a resize, a transport or rack move, a SIZE
 * change or a changed string; the labels project through toScreen on a camera key, the canvas size from a ResizeObserver.
 * OFF COSTS NOTHING: nothing renders while STAGE TEXT is off; turning it on renders the string wanted then.
 * THE TYPE SCALE is the notebook's three sizes (lab.css: .nb-title 34 px, .nb-view h1 22 px, .nb-view 14 px): the formula is
 * the title, an announcement the heading, an atom label the body, each × the SIZE knob.
 */
import { renderNotebook } from './mir/shell/notebook-render.js';
import { toScreen, cameraKey } from './field.js';
import { el } from './mir/kit.js';
import { moleculeAtoms } from './molecules.js';
import { ELEMENT } from './md.js';

export const TYPE = { title: 34, heading: 22, body: 14 };
const KATEX_MS = 250, FADE_MS = 600;

export function createStageText({ stage, canvas, racks, docked, render = renderNotebook }) {
  const labels = el('div', '', stage); labels.id = 'atomLabels'; labels.setAttribute('aria-hidden', 'true'); labels.hidden = true;
  const node = el('div', '', stage); node.id = 'molFormula'; node.setAttribute('aria-hidden', 'true'); node.hidden = true;
  const narrow = window.matchMedia ? window.matchMedia('(max-width: 860px)') : null;
  const stats = { renders: 0, announced: 0 };
  let on = true, scale = 1, labelScale = 1, formula = '', banner = null, shown = '', lastRender = -1e9, wait = 0;

  /** the markdown wanted now, rendered if it changed and KaTeX's quarter second has passed (else when it has) */
  function show() {
    if (!on) { node.hidden = true; return; }
    const md = banner !== null ? banner : formula;
    if (md !== shown) {
      const due = lastRender + KATEX_MS - performance.now();
      if (due > 0) { if (!wait) wait = setTimeout(() => { wait = 0; show(); }, due); return; }
      node.innerHTML = md ? render(md) : ''; shown = md;
      if (md) { lastRender = performance.now(); stats.renders++; }
    }
    place();
  }
  /** the formula, centred in the open stage between the racks with a wide margin, on the side the transport is NOT on */
  function place() {
    const vis = on && !!shown;
    const tr = document.getElementById('transport');
    const foot = docked() || !!(tr && tr.classList.contains('at-top')) || !!(narrow && narrow.matches);
    node.classList.toggle('mf-foot', foot); node.classList.toggle('mf-top', !foot);
    node.hidden = !vis; if (!vis) return;
    let l = 0, r = window.innerWidth;
    for (const rk of racks) {
      if (!rk) continue;
      const b = rk.getBoundingClientRect();
      if (b.width < 2 || b.right <= 0 || b.left >= window.innerWidth || getComputedStyle(rk).display === 'none') continue;
      if (b.left + b.width / 2 < window.innerWidth / 2) l = Math.max(l, b.right); else r = Math.min(r, b.left);
    }
    if (r - l < 120) { l = 0; r = window.innerWidth; }                    // a phone's rack covers the stage: the whole width
    node.style.left = Math.round((l + r) / 2) + 'px';
    const gap = r - l, room = Math.max(80, gap - 2 * Math.max(48, gap * 0.12));
    const base = banner !== null && shown === banner ? TYPE.heading : TYPE.title;
    const cap = Math.round(Math.max(16, Math.min(base, window.innerWidth * 0.08)) * scale);
    node.style.maxWidth = Math.round(room) + 'px'; node.style.fontSize = cap + 'px';
    /* a long line WRAPS inside the room; only an unbreakable word wider than it is measured down, and wrapped lines past
       45 % of the height shrink until they fit (each pass re-wraps, so it converges in a few).  The slack is KaTeX's: a
       subscript's `.vlist-s` strut overhangs the max-content box by 2 px, which is not a word too wide for the room. */
    if (node.scrollWidth > node.clientWidth + 3) node.style.fontSize = Math.max(12, Math.floor((cap * node.clientWidth) / node.scrollWidth)) + 'px';
    const maxH = window.innerHeight * 0.45;
    for (let i = 0; i < 8 && node.offsetHeight > maxH; i++) {
      const fs = parseFloat(node.style.fontSize) || cap, next = Math.max(12, Math.floor(fs * Math.max(0.6, Math.sqrt(maxH / node.offsetHeight))));
      if (next >= fs) break; node.style.fontSize = next + 'px';
    }
  }

  /* ── the atom labels: one element symbol per nucleus at its projected position, written only when the camera, the
     molecule, the size or the canvas changed (PLAN B3); white under `difference`, so each glyph inverts what it is on ── */
  let cssW = canvas.clientWidth, cssH = canvas.clientHeight;
  if (typeof ResizeObserver === 'function') new ResizeObserver((e) => { const b = e[e.length - 1].contentRect; cssW = b.width; cssH = b.height; }).observe(canvas);
  let atomsId = '', atoms = [], spans = [], labelsKey = '', placeKey = '';
  function atomLabels(id, obs, half, show = true) {
    if (!id || !show) { if (!labels.hidden) labels.hidden = true; labelsKey = placeKey = ''; return; }
    if (id !== atomsId) { atomsId = id; atoms = moleculeAtoms(id); labelsKey = ''; }
    if (labelsKey !== id + '|' + labelScale) {
      labelsKey = id + '|' + labelScale; placeKey = '';
      labels.textContent = ''; spans = atoms.map((a) => el('span', 'atom-label', labels, ELEMENT[a.Z] || '?'));
      labels.style.fontSize = Math.round(TYPE.body * labelScale) + 'px';
    }
    labels.hidden = false;
    if (cssW < 32 || cssH < 32) return;
    const key = `${labelsKey}|${cameraKey(obs)}|${obs.dist}|${obs.fov}|${half}|${cssW}|${cssH}`;
    if (key === placeKey) return;
    placeKey = key;
    const S = toScreen(obs, half, cssW, cssH);
    for (let i = 0; i < atoms.length; i++) {
      const a = atoms[i], sp = spans[i], q = S.at(a.x, a.y, a.z);
      if (!q) { sp.style.display = 'none'; continue; }
      sp.style.display = ''; sp.style.transform = `translate(${q[0].toFixed(1)}px, ${q[1].toFixed(1)}px) translate(-50%, -50%)`;
    }
  }

  /* the racks hide, peek and slide (body classes), so the middle moves — but only THOSE classes re-place it: the play
     edge's frost-hold and the tablet's motion class are not a reason to read layout */
  const rackKey = () => ['rack-hidden', 'rack-peek', 'rack-l', 'ui-hidden', 'phone', 'transport-peek'].map((c) => +document.body.classList.contains(c)).join('');
  let racksAt = rackKey();
  new MutationObserver(() => { const k = rackKey(); if (k === racksAt) return; racksAt = k; place(); setTimeout(place, 400); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  const tr = document.getElementById('transport');
  if (tr) new MutationObserver(place).observe(tr, { attributes: true, attributeFilter: ['class'] });   // dock / undock / .at-top
  window.addEventListener('resize', place, { passive: true });
  if (narrow && narrow.addEventListener) narrow.addEventListener('change', place);

  return {
    /** the formula's markdown ('' for none); the DOM moves only if the string did */
    setFormula(md) { formula = md || ''; if (banner === null) show(); },
    atomLabels, place, stats,
    setOn(v) { on = !!v; show(); },
    setScale(s) { scale = s; place(); },
    setLabelScale(s) { labelScale = s; labelsKey = ''; },
    get on() { return on; }, get md() { return shown; }, get formula() { return formula; }, get banner() { return banner; },
  };
}
