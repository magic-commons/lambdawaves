/* lab/shell/stage-words.js — THE STAGE TEXT and its CAPTION (0.5.2 R2d; moved verbatim out of lab/rack.js boot()): the source, the caption a capture draws,
 * the tick and the INFORMATIONAL layer (initStageText, called by boot() at the go).  stageTextTick and stageCaption are registered on app.w at creation. */
import { el, mathPlain } from '../mir/kit.js'; import { createInfoLayer } from '../mir/info/layer.js'; import { paintedRect } from '../occlusion.js'; import { toScreen, cameraKey } from '../field.js';
import { BASIS } from '../hydrogen.js'; import { getHamiltonian } from '../hamiltonian.js'; import { MOLECULE_BY_ID } from '../molecules.js'; import { ELEMENT } from '../md.js';
import { stateLatex, formulaLatex, BASIS_LABEL } from '../latex-state.js';
export function createStageWords(app) {
  const { dom, reg } = app, { rack } = app.host, { wChem } = app.w, { paintMarks } = app.ctl;
  const stageSrc = { v: -1, id: null };
  /** the states that play, as stateLatex's prose with UNIT coefficients (md) or as their plain labels, comma-separated */
  function stageStates(md) {
    const H = getHamiltonian(), mix = reg.transition;
    const line = md ? (ids) => stateLatex({ H, states: ids.map((a) => ({ n: BASIS[a].n, l: BASIS[a].l, m: BASIS[a].m, re: 1, im: 0 })) }).split('\n')[0]
      : (ids) => ids.map((a) => (H.id === 'hydrogen' ? BASIS[a].label : H.labelOf(BASIS[a]))).join(', ');
    const live = (re, im) => BASIS.filter((s) => re[s.index] * re[s.index] + im[s.index] * im[s.index] > 1e-12).map((s) => s.index);
    if (mix) { const A = line(live(mix.reA, mix.imA)), B = line(live(mix.reB, mix.imB)); return A && B ? A + '  ↔  ' + B : A || B; }
    return line(reg.populated());
  }
  function stageMd() {
    const row = app.state.chem && app.state.chem.on ? MOLECULE_BY_ID.get(app.state.chem.preset()) : null;
    return row ? '$' + formulaLatex(row.formula) + '$' : stageStates(true);
  }
  /** THE CAPTION a capture carries (T3): the same stage text as ONE plain-Unicode line — `H₂O · 1b1 HOMO · STO-3G` (the
   *  formula, the ORBITAL on the field in names.js's plain form, the basis) or SPECTRUM's states ("2s₀, 2p₋₁"; A ↔ B) — drawn
   *  by capture.js, since the DOM formula never reaches an export.  It follows the STAGE FORMULA switch.  KIT BRIEF 6 replaces it. */
  function stageCaption() {
    if (!app.state.stageText || !app.state.stageText.on) return '';
    const row = app.state.chem && app.state.chem.on ? MOLECULE_BY_ID.get(app.state.chem.preset()) : null;
    if (!row) return stageStates(false);
    const o = app.state.chem.exportNames(), k = o && o.orbital;
    return [mathPlain(row.formula), app.state.chem.espCaption(), k && k.plain ? k.plain + (/^(HOMO|LUMO)$/.test(k.frontier) ? ' ' + k.frontier : '') : '', BASIS_LABEL[app.state.chem.basis] || ''].filter(Boolean).join(' · ');
  }
  function stageTextTick() {
    if (!app.state.stageText) return;
    const id = app.state.chem && app.state.chem.on ? app.state.chem.preset() : '';
    if (reg.version === stageSrc.v && id === stageSrc.id) return;
    stageSrc.v = reg.version; stageSrc.id = id;
    app.state.stageText.setFormula(stageMd());
  }
  app.w.stageTextTick = stageTextTick; app.w.stageCaption = stageCaption;
  /* 0.5.1 D1 · THE STAGE TEXT IS ONE BLOCK of the kit's INFORMATIONAL layer (mir/info/layer.js; stage-text.js left): the kit's ink,
     shade and serif at the kit's seat — the free stage's top + 12 %, between the racks, clear of the transport and a docked TIMELINE —
     and STILL: no subject, no labels, no parallax, no drift, no following, and never told of a camera move (a block with no subject
     depends on no view; the layer's own ResizeObserver and `resize` cover a size, and the racks and the transport are told below);
     only a pointer passing within the kit's reach (260 px) parts it, and HOLD (I) freezes even that.
     THE LAWS kept: the key is the STRING — a changed one is remove() + addBlock(), the kit's exit and entrance — and KaTeX runs at
     most four times a second (a change inside the quarter second waits, then renders whatever is wanted by then); OFF COSTS NOTHING
     (the root hidden, nothing added); THE FADE is a HAND's preset (`{ hand: true }`; the register's `announce`) in the formula's seat
     for 2.4 s — the formula leaves and comes back, and the kit's exit IS the fade.  The type (lab.css .lw-stage) is the notebook's:
     the formula its title (34 px), an announcement its heading (22 px), × SIZE.  THE ATOM LETTERS stay λWAVES' (R6-L): one element
     symbol per nucleus at its projected place, written only when the camera, the molecule, the SIZE or the canvas changed; white
     under `difference`, so each glyph inverts what it is on; the notebook's body (14 px) × SIZE. */
  function initStageText() {
    const KATEX_MS = 250, racks = () => [app.host.rackL, rack].filter((r) => r && r.querySelector('.dev:not(.closed):not([hidden])'));
    const layer = createInfoLayer({ stage: dom.stage, parallax: false, drift: false, follow: false,
      avoid: () => [...racks(), app.sh.layout.docked ? null : document.getElementById('transport'), app.state.tl && app.state.tl.isOpen() ? app.state.tl.root : null].map((e) => paintedRect(e)).filter(Boolean) });
    layer.root.classList.add('lw-stage'); layer.root.setAttribute('aria-hidden', 'true');
    const stats = { renders: 0, announced: 0, places: 0, labelWrites: 0 };   // the gate's witnesses: KaTeX runs, banners, re-placements asked, letter moves
    let on = true, labelsOn = true, labelScale = 1, formula = '', banner = null, shown = '', block = null, lastRender = -1e9, wait = 0, fadeT = 0;
    function show() {                                                // the markdown wanted now, as a new block if it changed and KaTeX's quarter second has passed
      if (!on) return;
      const md = banner !== null ? banner : formula;
      if (md === shown) return;
      const due = lastRender + KATEX_MS - performance.now();
      if (due > 0) { if (!wait) wait = setTimeout(() => { wait = 0; show(); }, due); return; }
      if (block) block.remove();
      block = md ? layer.addBlock({ md }) : null; shown = md;
      if (block) { block.el.toggleAttribute('data-fade', banner !== null); lastRender = performance.now(); stats.renders++; }
    }
    /* the racks hide, peek and slide (body classes), the transport docks or goes to the top, the TIMELINE opens or docks: only THOSE
       re-place the block — the play edge's frost-hold and the tablet's motion class are not a reason to read layout — and once more
       400 ms on, when the slide or the pill's dodge (a class first, then its arrival) has landed */
    let settle = 0;
    const place = (again = true) => { stats.places++; layer.viewChanged(); clearTimeout(settle); if (again) settle = setTimeout(place, 400, false); };
    const rackKey = () => ['rack-hidden', 'rack-peek', 'rack-l', 'ui-hidden', 'phone', 'transport-peek'].map((c) => +document.body.classList.contains(c)).join('');
    let racksAt = rackKey();
    new MutationObserver(() => { const k = rackKey(); if (k === racksAt) return; racksAt = k; place(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    for (const [n, f] of [[document.getElementById('transport'), ['class']], [app.state.tl && app.state.tl.root, ['hidden', 'style']]]) if (n) new MutationObserver(() => place()).observe(n, { attributes: true, attributeFilter: f });

    const labels = el('div', '', dom.stage); labels.id = 'atomLabels'; labels.setAttribute('aria-hidden', 'true'); labels.hidden = true;
    let cssW = dom.canvas.clientWidth, cssH = dom.canvas.clientHeight;
    if (typeof ResizeObserver === 'function') new ResizeObserver((e) => { const b = e[e.length - 1].contentRect; cssW = b.width; cssH = b.height; }).observe(dom.canvas);
    let atomsId = '', atoms = [], spans = [], labelsKey = '', placeKey = '';
    function atomLabels(id, obs, half) {
      if (!id || !labelsOn) { if (!labels.hidden) labels.hidden = true; labelsKey = placeKey = ''; return; }
      if (id !== atomsId) { atomsId = id; labelsKey = ''; }
      atoms = app.state.chem.atomsNow(); const at = atoms.map((a) => `${a.x.toFixed(3)},${a.y.toFixed(3)},${a.z.toFixed(3)}`).join(';');   // 0.7.0 V2: the nuclei AS DRAWN (V1 poses them), so the labels follow
      if (labelsKey !== id + '|' + labelScale) {
        labelsKey = id + '|' + labelScale; placeKey = '';
        labels.textContent = ''; spans = atoms.map((a) => el('span', 'atom-label', labels, ELEMENT[a.Z] || '?'));
        labels.style.fontSize = Math.round(14 * labelScale) + 'px';
      }
      labels.hidden = false;
      if (cssW < 32 || cssH < 32) return;
      const key = `${labelsKey}|${cameraKey(obs)}|${obs.dist}|${obs.fov}|${half}|${cssW}|${cssH}|${at}`;
      if (key === placeKey) return;
      placeKey = key; stats.labelWrites++;
      const S = toScreen(obs, half, cssW, cssH);
      for (let i = 0; i < atoms.length; i++) {
        const a = atoms[i], sp = spans[i], q = S.at(a.x, a.y, a.z);
        if (!q) { sp.style.display = 'none'; continue; }
        sp.style.display = ''; sp.style.transform = `translate(${q[0].toFixed(1)}px, ${q[1].toFixed(1)}px) translate(-50%, -50%)`;
      }
    }
    app.state.stageText = {
      layer, stats, atomLabels,
      /** the formula's markdown ('' for none); the DOM moves only if the string did */
      setFormula(md) { formula = md || ''; if (banner === null) show(); },
      /** THE FADE: `md` in the formula's seat for `ttl` (0: until dismiss(md) — the molecule's head, D2), then its exit and the
       *  formula's return.  Only a HAND calls it. */
      announce(md, ttl = 2400) {
        if (!on || !md) return false;
        stats.announced++; clearTimeout(fadeT); banner = md; show();
        if (ttl) fadeT = setTimeout(() => { banner = null; show(); }, ttl);
        return true;
      },
      dismiss(md) { if (banner !== md) return; clearTimeout(fadeT); banner = null; show(); },   // a later announcement has already taken the seat: nothing
      /** STAGE FORMULA (the formula, the fade, the caption) and ATOM LABELS are two switches since 0.5.3 M9 (INFORMATIONAL) */
      setOn(v) { on = !!v; layer.root.hidden = !on; show(); }, setLabels(v) { labelsOn = !!v; }, setLabelScale(s) { labelScale = s; labelsKey = ''; },
      /** SIZE: the type × s (lab.css), then a re-measure — setPane(false) measures every bare block again (layer.js) */
      setScale(s) { layer.root.style.setProperty('--lw-stage-size', String(s)); stats.places++; layer.setPane(false); },
      get on() { return on; }, get labelsOn() { return labelsOn; }, get md() { return shown; }, get formula() { return formula; }, get banner() { return banner; },
    };
    wChem.root.addEventListener('change', stageTextTick);           // the pick lands in `preset` at once; the solve comes later
    app.state.chem.subscribe(() => stageTextTick());                         // … and a restore / undo / link that re-solves
    paintMarks(); stageTextTick();
  }
  return { stageCaption, stageTextTick, initStageText };
}
