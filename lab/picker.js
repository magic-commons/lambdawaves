/* lab/picker.js — THE PICKER (iteration 004, Josh 2026-10-17; iteration 003's MAIN MENU): λWAVES' front page, over the stage.  Three
 * sections in one vertical snap — ATOMIC (the periodic table: each live element H–Kr its own picture, exactly what a press opens, seen
 * from the corner; the elements past Kr their valence subshell's), MOLECULAR (MOLECULES ONLY since iteration 011 Q4: every molecule of
 * the catalogue in its sections' order, one not yet on this device wearing the kit's download glyph; the pages sized to the screen, ‹ ›
 * beside them) and LIBRARY — the one place for what is kept: THE VOLUMES (lab/volumes.js: VOL. I, VOL. II … — each a card that installs
 * with one press; inside a volume ONE head row — the volume's stepper, the count, its plain tags (two intersect), a search, INSTALL — over
 * its molecules; a one-atom entry opens the ATOM), a card per catalogue section that keeps files (THE SECTION INSTALL, iteration 008 P's,
 * moved out of the MOLECULAR deck) and THIS DEVICE's use.  Iteration 012 L1 (Josh: "too much text … concise and not repetitive"): a card
 * says its count and its install (the size rides in INSTALL / REMOVE), a remove is armed for 600 ms, SHOW LABELS sits under the tabs.  The pictures are tools/menu-thumbs.mjs' and each
 * volume's own (t/<id>.webp).  A hover or a focus moves ONLY the picture (lab/picker-fx.js: the spring tilt and a zoom — no background,
 * no tint), writes the name under the tile, and swaps the large caption at the foot.  A press goes there: ATOMS mode and the element
 * (goAtom), MOLECULES mode and the molecule (chem.pick), or a volume's molecule (chem.openVolume).  THE WAY BACK is instant: the DOM is
 * built once and only shown or hidden — the home button (the iris opens from it), L (keys.js `menu`), WINDOW › PICKER; Escape leaves.
 * Under the logo (iteration 012 L2): RETURN HOME (the lab), FOLDERS (the projects and the demos) and THE HUE ring (a dial that turns the
 * molecules' pictures round the colour wheel).  The Picker opens at boot once the photosensitivity notice is accepted,
 * unless a link, a ?preset= or ?menu=0 opened something (rack.js).  A plain module: app is read, never extended (app.state.picker). */
import { storageInfo } from './library.js';   // iteration 011 Q4: the LIBRARY's THIS DEVICE line
import { el, chip, mathPlain, stepper } from './mir/kit.js';
import { CHEM_PRESETS } from './chemview.js';
import { SECTIONS, GROUPS, RECORD_GROUP } from './molecules.js';
import { ATOMS } from './atoms.js';
import { valenceOf } from './valence.js';
import { getHamiltonian } from './hamiltonian.js';
import { RM, animate, pointerFrame, tiltPictures, enterTiles, develop, swapLine, installRing, clamp } from './picker-fx.js';
import * as V from './volumes.js';
import { keepData, keepSection, installed, safariTab } from './library.js';

const SYM = ('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe '
  + 'Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr '
  + 'Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og').split(' ');
const NAMES = 'Hydrogen Helium Lithium Beryllium Boron Carbon Nitrogen Oxygen Fluorine Neon Sodium Magnesium Aluminium Silicon Phosphorus Sulfur Chlorine Argon Potassium Calcium Scandium Titanium Vanadium Chromium Manganese Iron Cobalt Nickel Copper Zinc Gallium Germanium Arsenic Selenium Bromine Krypton Rubidium Strontium Yttrium Zirconium Niobium Molybdenum Technetium Ruthenium Rhodium Palladium Silver Cadmium Indium Tin Antimony Tellurium Iodine Xenon Caesium Barium Lanthanum Cerium Praseodymium Neodymium Promethium Samarium Europium Gadolinium Terbium Dysprosium Holmium Erbium Thulium Ytterbium Lutetium Hafnium Tantalum Tungsten Rhenium Osmium Iridium Platinum Gold Mercury Thallium Lead Bismuth Polonium Astatine Radon Francium Radium Actinium Thorium Protactinium Uranium Neptunium Plutonium Americium Curium Berkelium Californium Einsteinium Fermium Mendelevium Nobelium Lawrencium Rutherfordium Dubnium Seaborgium Bohrium Hassium Meitnerium Darmastadtium Roentgenium Copernicium Nihonium Flerovium Moscovium Livermorium Tennessine Oganesson'.split(' ');   /* the 118 names (ASE's table), the caption's word for an element */
/** the 18-column seat: [row, column] (rows 1–7 the periods, 9–10 the f-block under them) */
function seatOf(Z) {
  const P = [2, 10, 18, 36, 54, 86, 118], p = P.findIndex((e) => Z <= e) + 1, z0 = p > 1 ? P[p - 2] : 0, i = Z - z0;
  if (p === 1) return [1, Z === 1 ? 1 : 18];
  if (p <= 3) return [p, i <= 2 ? i : i + 10];
  if (p <= 5) return [p, i];
  if (i <= 2) return [p, i];
  if (i <= 17) return [p + 3, i];                                      // La–Lu, Ac–Lr: the f rows, columns 3–17
  return [p, i - 14];
}


const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
/** iteration 008 P (Josh: "atoms should not be in the molecules window"): Z when a formula is one bare element symbol (Fe, Kr: a one-atom entry), else 0 */
const atomZ = (f) => SYM.indexOf(String(f || '').replace(/<\/?m>/g, '').trim()) + 1;
const volName = (v) => 'VOL. ' + v.numeral;
const fmtBytes = (b) => (b >= 1e9 ? (b / 1e9).toFixed(b >= 1e10 ? 0 : 1) + ' GB' : b >= 1e6 ? Math.round(b / 1e6) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' kB');

/* iteration 012 L1 · the Picker's own PREFERENCE (settings-store.js FAMILIES, never a project or a link): SHOW LABELS for the atoms (on: the symbol
   and Z, as before) and for the molecules (on: the formula on every tile, the name under it on a hover) */
const PREF_KEY = 'lambdawaves.q0.picker', PREF0 = { atomLabels: true, molLabels: false, hue: 0 };   // hue: THE HUE ring's turn in degrees (L2)
const readPrefs = () => { try { return Object.assign({}, PREF0, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (_) { return Object.assign({}, PREF0); } };
const writePrefs = (p) => { try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (_) { /* a blocked profile keeps it for the visit */ } };
/** an iteration 012 icon (lab/img/icons/<name>.svg), drawn in currentColor through a CSS mask */
const icon = (host, name) => { const i = el('i', 'mm-ico', host); i.style.setProperty('--ico', `url(img/icons/${name}.svg)`); i.setAttribute('aria-hidden', 'true'); return i; };
/** two presses remove (no window.confirm): the first arms the button for 600 ms, or until a press anywhere else, then it repaints (Josh 10-20) */
function armer(b, repaint) {
  let t = 0;
  const off = (e) => { if (!b.contains(e.target)) disarm(); };
  const stop = () => { clearTimeout(t); t = 0; removeEventListener('pointerdown', off, true); };
  const disarm = () => { if (!t) return; stop(); repaint(); };
  return { arm() { stop(); t = setTimeout(disarm, 600); addEventListener('pointerdown', off, true); }, take() { const was = !!t; stop(); return was; } };
}

/* ── iteration 014 A2 · THE MINIATURE PICKER's matches: the catalogue and every INSTALLED volume's index (read once, on the first search — never at
   boot), the name, the formula or the id starting with the typed text first, then containing it ── */
let volRowsP = null;
function volumeRows() {
  if (!volRowsP) volRowsP = (async () => {
    const out = [];
    try {
      for (const v of (await V.shelf()).volumes) {
        const s = await V.statusOf(v.id).catch(() => null); if (!s || s.state !== 'installed') continue;
        const idx = await V.index(v.id).catch(() => null);
        for (const m of (idx && idx.molecules) || []) out.push({ id: m.id, name: m.name, formula: m.formula, vol: v.id, thumb: !!m.thumb, m, v });
      }
    } catch (_) { /* no shelf: the catalogue alone */ }
    return out;
  })();
  return volRowsP;
}
const plain = (s) => String(s || '').replace(/<\/?m>/g, '').replace(/[_{}\\]/g, '').toLowerCase();
/** suggest(query, n) → [{ id, name, formula, vol, pic }] — at most n molecules for a typed query: prefix matches (name, formula, id) first */
export async function suggest(query, n = 6) {
  const q = plain(query).trim(); if (!q) return [];
  const cat = CHEM_PRESETS.filter((p) => !p.disabled && !atomZ(p.formula)).map((p) => ({ id: p.id, name: p.name, formula: p.formula, vol: null, pic: './img/menu/' + p.id + '.webp' }));
  const rows = cat.concat((await volumeRows()).map((r) => ({ id: r.id, name: r.name, formula: r.formula, vol: r.vol, thumb: r.thumb, m: r.m, v: r.v })));
  const seen = new Set(), first = [], then = [];
  for (const r of rows) {
    const keys = [plain(r.name), plain(r.formula), plain(r.id)], key = (r.vol || '') + '|' + r.id;
    if (seen.has(key)) continue;
    if (keys.some((k) => k.startsWith(q))) { seen.add(key); first.push(r); } else if (keys.some((k) => k.includes(q))) { seen.add(key); then.push(r); }
    if (first.length >= n) break;
  }
  return first.concat(then).slice(0, n);
}

export function createPicker(app, { open: openAtBoot = true } = {}) {
  const root = el('div', 'lw-menu', document.body); root.id = 'lwMenu'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'the Picker');
  const top = el('div', 'mm-top', root);
  const logo = el('div', 'mm-logo', top);
  fetch('./img/lambdawaves-logo.svg').then((r) => r.text()).then((t) => { logo.innerHTML = t.replace(/fill="#f0f4f7"/g, 'fill="currentColor"'); const s = logo.querySelector('svg'); if (s) { s.setAttribute('aria-label', 'λWAVES'); s.setAttribute('role', 'img'); } }).catch(() => { logo.textContent = 'λWAVES'; });
  /* iteration 012 L2 · under the logo, centred: RETURN HOME (the lab), FOLDERS (iteration 004 · F's door, once at the top left: the projects
     and the demos) and THE HUE ring — a dial dressed as a circle: a vertical drag, the wheel or ↑ ↓ turn the molecules' pictures round the
     colour wheel (cyan hides its shadows, Josh), a double-click puts it back at 0; the Picker's PREFERENCE, never a project's or a link's */
  const nav = el('div', 'mm-nav', top);
  const navBtn = (name, label, go) => { const b = el('button', 'mm-navb', nav); b.type = 'button'; icon(b, name); b.setAttribute('aria-label', label); b.title = label; b.addEventListener('click', go); return b; };
  navBtn('home', 'Return home — the lab', () => close());
  navBtn('folders', 'Folders — your projects and the demos', () => { close(); const P = app.sh.layout && app.sh.layout.projects; if (P) (P.show || P.toggle).call(P); });
  const hue = el('button', 'mm-navb mm-hue', nav); hue.type = 'button'; hue.setAttribute('role', 'slider'); hue.setAttribute('aria-label', 'molecule picture hue');
  hue.setAttribute('aria-valuemin', '0'); hue.setAttribute('aria-valuemax', '359'); el('i', 'mm-hue-ring', hue);
  const tabs = el('div', 'mm-tabs', top), pill = el('i', 'mm-pill', tabs), scroller = el('div', 'mm-scroll', root), caption = el('div', 'mm-caption', root);
  caption.setAttribute('aria-live', 'polite');
  /* SHOW LABELS (iteration 012 L1): one subtle seat under the tabs, the atoms' switch on ATOMIC and the molecules' elsewhere; the volume's head has its twin */
  const prefs = readPrefs(), opts = el('div', 'mm-opts', top);
  let labelBtns = [];
  const labelToggle = (host, kind) => { const b = el('button', 'mm-opt', host); b.type = 'button'; b.dataset.labels = kind; icon(b, 'labels'); el('span', '', b, 'SHOW LABELS');
    b.title = kind === 'atomLabels' ? 'the symbol and Z on every element' : 'the formula on every molecule; the name under it on a hover';
    b.addEventListener('click', () => { prefs[kind] = !prefs[kind]; writePrefs(prefs); paintLabels(); }); labelBtns.push(b); paintLabels(); return b; };
  function paintLabels() {
    root.classList.toggle('labels-atom', !!prefs.atomLabels); root.classList.toggle('labels-mol', !!prefs.molLabels);
    labelBtns = labelBtns.filter((b) => b.isConnected);
    for (const b of labelBtns) { const on = !!prefs[b.dataset.labels]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }
  }
  const atomOpt = labelToggle(opts, 'atomLabels'), molOpt = labelToggle(opts, 'molLabels');
  let hueShown = 0;   // iteration 014 D2: the CSS sees an unwrapped turn (the nearest twin of the hue to the last one shown), so 359 → 0 glides one degree, never back round the wheel
  const setHue = (deg, keep = true) => {
    prefs.hue = ((Math.round(deg) % 360) + 360) % 360; hueShown += ((prefs.hue - hueShown) % 360 + 540) % 360 - 180;
    document.documentElement.style.setProperty('--mol-hue', hueShown + 'deg');   // iteration 013 P2: on the page's root, so MOLECULES' picture (.mol-thumb) turns with the Picker's
    hue.setAttribute('aria-valuenow', String(prefs.hue)); hue.title = 'Hue of the molecules\u2019 pictures · ' + prefs.hue + '° — drag up or down, double-click for 0';
    if (keep) writePrefs(prefs);
  };
  setHue(+prefs.hue || 0, false);
  { let y0 = null, h0 = 0;   // the ONE KNOB LAW's vertical drag: a full turn in 360 px, ⅛ with Shift
    hue.addEventListener('pointerdown', (e) => { if (e.button) return; y0 = e.clientY; h0 = prefs.hue; hue.setPointerCapture(e.pointerId); e.preventDefault(); });
    hue.addEventListener('pointermove', (e) => { if (y0 != null) setHue(h0 + (y0 - e.clientY) * (e.shiftKey ? 0.125 : 1)); });
    const end = () => { y0 = null; }; hue.addEventListener('pointerup', end); hue.addEventListener('pointercancel', end);
    hue.addEventListener('wheel', (e) => { e.preventDefault(); setHue(prefs.hue - Math.sign(e.deltaY) * (e.shiftKey ? 2 : 10)); }, { passive: false });
    hue.addEventListener('dblclick', () => setHue(0));
    hue.addEventListener('keydown', (e) => { const d = { ArrowUp: 10, ArrowRight: 10, ArrowDown: -10, ArrowLeft: -10 }[e.key]; if (d) { e.preventDefault(); e.stopPropagation(); setHue(prefs.hue + (e.shiftKey ? d / 5 : d)); } else if (e.key === 'Home' || e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); setHue(0); } }); }

  /* ── the caption: the formula (STIX), the name (LW Title), the line under them (an element: its name alone, its valence subshell alone in STIX); R6's swap ── */
  let said = null;
  const say = (t) => {
    const key = t ? [t.formula, t.name, t.sub].join('|') : '';
    if (key === said) return; said = key;
    swapLine(caption, (line) => { if (!t) return; if (t.formula) el('b', 'mm-cap-f', line, t.formula); if (t.name) el('span', 'mm-cap-n', line, t.name); if (t.sub) el('i', 'mm-cap-s' + (t.math ? ' mm-cap-m' : ''), line, t.sub); });
  };
  /* ── a tile: the picture moves, the name shows under it; nothing else changes on a hover ── */
  /* a picture of ours (img/menu/, sw.js DATA) is kept on the device once it has loaded (library.js keepData); a volume's is its own */
  let hot = false;   // iteration 012 L3: true while the page on show of the section in view is being made — its pictures are asked for first
  const pic = (host, src) => { const i = el('img', 'mm-pic', host); i.alt = ''; i.decoding = 'async'; i.loading = hot ? 'eager' : 'lazy'; if (hot) i.fetchPriority = 'high'; i.draggable = false; i.addEventListener('error', () => { i.remove(); }); if (src) { develop(i); i.addEventListener('load', () => keepData(src), { once: true }); i.src = src; } return i; };
  const tile = (host, cls, info, go, off) => {
    const b = el('button', 'mm-tile ' + cls, host); b.type = 'button';
    if (off) { b.classList.add('off'); b.setAttribute('aria-disabled', 'true'); }
    b.setAttribute('aria-label', [info.name, info.formula, info.sub, info.note].filter(Boolean).join(' — '));
    if (info.under !== false) el('span', 'mm-under', b, info.under || info.name);   // an element has none: the caption says it
    const hi = () => say(info); b.addEventListener('pointerenter', hi); b.addEventListener('focus', hi);
    b.addEventListener('click', () => { if (!off) go(); });
    return b;
  };

  /* ── THE DECK: pages sized to the space (bigger tiles AND more columns: the tile from the height, the columns from the width), ‹ ›
     beside them, dots under (a page count past sixteen pages); a page's tiles are made when it is the page or its neighbour ── */
  const decks = [];
  function deck(host) {
    const wrap = el('div', 'mm-pager', host), pagesEl = el('div', 'mm-pages', wrap), foot = el('div', 'mm-dots', host);
    const arrow = (dir) => { const b = el('button', 'mm-arrow ' + (dir < 0 ? 'mm-prev' : 'mm-next'), wrap); b.type = 'button';
      b.setAttribute('aria-label', dir < 0 ? 'previous page' : 'next page'); icon(b, dir < 0 ? 'arrow-left' : 'arrow-right'); b.addEventListener('click', () => pageTo(page + dir)); return b; };
    const arrows = [arrow(-1), arrow(1)];
    let list = [], make = null, pages = [], page = 0, per = 1, laid = '';
    const fill = (k) => { const p = pages[k]; if (!p || p.dataset.full) return; p.dataset.full = '1';
      hot = k === page && host.closest('.mm-sec') === current.sec;
      try { for (let i = k * per; i < Math.min(list.length, (k + 1) * per); i++) make(list[i], p); } finally { hot = false; } };
    const near = (k) => { fill(k); fill(k - 1); fill(k + 1); };   // the page first, then its neighbours (iteration 012 L3: the requests in that order)
    function paint() {
      arrows[0].disabled = page <= 0; arrows[1].disabled = page >= pages.length - 1; foot.style.visibility = pages.length < 2 ? 'hidden' : '';   // iteration 012 L1: a one-page deck keeps the line, so the head never moves
      if (pages.length <= 16) {
        if (foot.dataset.mode !== 'dots' || foot.childElementCount !== pages.length) {
          foot.textContent = ''; foot.dataset.mode = 'dots';
          pages.forEach((_, i) => { const d = el('button', 'mm-dot', foot); d.type = 'button'; d.setAttribute('aria-label', 'page ' + (i + 1)); d.addEventListener('click', () => pageTo(i)); });
        }
        [...foot.children].forEach((d, i) => d.classList.toggle('on', i === page));
      } else { foot.dataset.mode = 'count'; foot.textContent = (page + 1) + ' / ' + pages.length; }
    }
    function size() {
      const narrow = innerWidth < 700, gap = narrow ? 6 : 10;
      let above = 0; for (const c of host.children) { if (c === wrap) break; if (!c.hidden) above += c.offsetHeight + 12; }
      /* iteration 012 L2: on a desktop the deck keeps off the racks behind the Picker (a rack's width and 20 px a side, Josh: "not overlap the
         blurred racks too much" on a 16:9 screen); the ATOMIC table is not a deck and keeps its size */
      const rackW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rack-w')) || 300;
      const side = narrow ? 12 : innerWidth >= 1100 ? Math.min(rackW + 20, (innerWidth - 900) / 2) : 75;
      const H = Math.max(150, scroller.clientHeight - above - 70), W = Math.max(200, Math.min(scroller.clientWidth - 2 * side, 1900));
      let rows = H >= 560 ? 4 : H >= 400 ? 3 : 2, t = Math.min(260, (H - (rows - 1) * gap) / rows);   // iteration 008 P: a row sooner (4 from 560 px, once 640) — "more molecules per page"
      let cols = Math.max(3, Math.min(12, Math.floor((W + gap) / (t + gap))));
      const want = narrow ? 3 : 8;   // Josh: bigger AND more columns — a desktop page is at least eight across while a tile stays ≥ 150 px
      if (cols < want && (W - (want - 1) * gap) / want >= (narrow ? 80 : 150)) cols = want;
      t = Math.min(t, (W - (cols - 1) * gap) / cols); rows = Math.max(2, Math.min(6, Math.floor((H + gap) / (t + gap))));
      return { cols, rows, t: Math.floor(t), gap };
    }
    function lay() {
      if (root.hidden || !make || !host.getClientRects().length) return;
      const g = size(), key = [g.t, g.cols, g.rows].join();
      if (key === laid && pages.length) { paint(); return; }   // iteration 012 L3: the same geometry keeps its tiles (the open's first ResizeObserver call rebuilt every deck and asked for every picture again)
      laid = key; const first = page * per; per = g.cols * g.rows;
      for (const e of [pagesEl, host]) { e.style.setProperty('--t', g.t + 'px'); e.style.setProperty('--cols', String(g.cols)); e.style.setProperty('--gap', g.gap + 'px'); e.style.setProperty('--rows', String(g.rows)); }   // the host's: a head row (the LIBRARY's) as wide as the page
      pagesEl.textContent = ''; pages = [];
      for (let i = 0; i < Math.max(1, Math.ceil(list.length / per)); i++) pages.push(el('div', 'mm-page', pagesEl));
      page = Math.min(pages.length - 1, Math.floor(first / per)); near(page);
      pagesEl.scrollLeft = page * pagesEl.clientWidth; paint();
    }
    function pageTo(k, smooth = true) {
      k = Math.max(0, Math.min(pages.length - 1, k)); const dir = Math.sign(k - page); page = k; near(k);
      pagesEl.scrollTo({ left: k * pagesEl.clientWidth, behavior: smooth && !RM.matches ? 'smooth' : 'auto' }); paint();
      if (dir && pages[k]) enterTiles([...pages[k].children], undefined, dir);
    }
    pagesEl.addEventListener('scroll', () => { const k = Math.round(pagesEl.scrollLeft / Math.max(1, pagesEl.clientWidth)); if (k !== page && pages[k]) { page = k; near(k); paint(); } }, { passive: true });
    wrap.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); pageTo(page + (e.key === 'ArrowRight' ? 1 : -1)); } });
    /* R4: the arrows wake as the mouse comes near and swell under it */
    pointerFrame(root, (p) => {
      const w = wrap.getBoundingClientRect();
      for (const a of arrows) {
        const r = a.getBoundingClientRect(), d = p ? Math.hypot(p.x - r.left - r.width / 2, p.y - r.top - r.height / 2) : Infinity, g = Math.max(0, 1 - d / 64);
        const isNear = p && p.x > w.left - 80 && p.x < w.right + 80 && p.y > w.top - 30 && p.y < w.bottom + 30;
        a.style.setProperty('--glyph-scale', (1 + g * g * 0.075).toFixed(4)); a.style.setProperty('--near', isNear ? '1' : '0');
      }
    });
    const d = { set(l, m) { list = l; make = m; page = 0; per = 1; laid = ''; lay(); }, lay, pageTo, get tiles() { return pages[page] ? [...pages[page].children] : []; }, get count() { return list.length; } };
    decks.push(d); return d;
  }

  /* ── the sections and the tabs (R9: the sliding pill, the approach accent) ── */
  const sections = [['atomic', 'ATOMIC'], ['molecular', 'MOLECULAR'], ['library', 'LIBRARY']].map(([id, label]) => {
    const sec = el('section', 'mm-sec mm-' + id, scroller), b = el('button', 'mm-tab', tabs); b.type = 'button'; icon(b, id); el('span', '', b, label);   // iteration 012 L2: I1's icon left of the word
    b.addEventListener('click', () => { if (id === 'library' && current.id === 'library') library.home(); sec.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }); });
    return { id, sec, b };
  });
  const movePill = (b) => { pill.style.setProperty('--px', b.offsetLeft - 10 + 'px'); pill.style.setProperty('--pw', b.offsetWidth + 20 + 'px'); };
  pointerFrame(root, (p) => { for (const { b } of sections) { const r = b.getBoundingClientRect(); b.style.setProperty('--approach', p ? clamp((76 - Math.hypot(p.x - r.left - r.width / 2, p.y - r.top - r.height / 2)) / 58).toFixed(3) : '0'); } });
  tiltPictures(root);

  /* ── ATOMIC: 118 squares on the 18-column table, the f rows under it ── */
  const table = el('div', 'mm-table', sections[0].sec);
  for (let Z = 1; Z <= 118; Z++) {
    const [r, c] = seatOf(Z), v = valenceOf(Z), a = ATOMS.find((x) => x.Z === Z), live = !!a, sym = SYM[Z - 1];
    const t = tile(table, 'mm-el', { name: NAMES[Z - 1], sub: v.label, math: true, under: false, note: live ? '' : 'past krypton: not in the ATOM system yet' }, () => goAtom(Z), !live);
    t.style.gridRow = String(r); t.style.gridColumn = String(c);
    pic(t, './img/menu/' + (live ? 'el-' + sym : 'orb-' + v.nl + '_' + v.m) + '.webp');   // the block's orbital (011 Q3b: the differentiating subshell — Fe 3d, Ce 4f; the pure orbital of its (n, l, m), cut to show its layers)
    el('i', 'mm-z', t, String(Z)); el('b', 'mm-sym', t, sym);
  }
  /* ── MOLECULAR: MOLECULES ONLY (iteration 011 Q4, Josh: "remove those 'lattice' and 'heavy' and other downloadable stuff from the molecular
     system, let that be it's own UI system for handling saved/stored/unsaved molecules in the library section").  The catalogue in its
     SECTIONS' order (lab/molecules.js), within a section the dropdown's order (its groups); no heading tile — a heading broke the picture grid,
     so the section rides in the caption's line under a hover instead.  A record-only molecule not yet on this device keeps its picture and
     wears the kit's download glyph (row V's law, the card's glyph); its press opens it, which fetches that one record (chemview's record road).
     A one-atom entry is never listed here: an atom is the ATOMIC table's.  THE SECTION INSTALL (iteration 008 P) lives in the LIBRARY below. ── */
  const GROUP_AT = new Map([...GROUPS, RECORD_GROUP].map((g, i) => [g.id, i])), rank = (p) => (GROUP_AT.has(p.group) ? GROUP_AT.get(p.group) : GROUP_AT.size);
  const secRows = (sec) => CHEM_PRESETS.filter((p) => p.section === sec && !atomZ(p.formula)).sort((a, b) => rank(a) - rank(b));
  const secs = new Map(SECTIONS.map((sec) => { const rows = secRows(sec), recs = rows.flatMap((p) => Object.values(p.records || {}));
    return [sec, { sec, rows, recs, bytes: recs.reduce((t, r) => t + r.bytes, 0), n: 0, busy: false, stop: false, arm: 0, view: null }]; }));
  const have = new Map(), away = new Map();   // a record's hash → on this device; a deck tile's molecule → its glyph and caption
  const dlRec = (m) => (m.recordOnly && m.records && m.records['sto-3g']) || null;   // the record a press must fetch (chemview's own test)
  function paintAway(m) {
    const a = away.get(m.id); if (!a || !a.t.isConnected) return;
    const r = dlRec(m), off = !!r && !have.get(r.hash) && !safariTab();
    a.t.classList.toggle('away', off); a.g.hidden = !off;
    a.info.sub = off ? `${m.section} · a press downloads it (${fmtBytes(r.bytes)})` : m.section;
  }
  const molDeck = deck(sections[1].sec);
  molDeck.set(SECTIONS.flatMap((sec) => secs.get(sec).rows), (m, host) => {
    const info = { formula: mathPlain(m.formula), name: cap(m.name), sub: m.disabled ? m.reason : m.section };
    const t = tile(host, 'mm-mol', info, () => goMolecule(m.id), !!m.disabled);
    pic(t, './img/menu/' + m.id + '.webp'); el('b', 'mm-lbl', t, info.formula);
    if (!m.disabled && dlRec(m)) { const g = el('i', 'mm-dl', t); icon(g, 'download'); g.title = 'not on this device'; g.hidden = true; away.set(m.id, { t, g, info }); paintAway(m); }
  });

  /* ── THE SECTION INSTALL (iteration 008 P; in the LIBRARY since iteration 011 Q4): a card per catalogue section with records — its name, its
     count, its bytes, "n here", and the install: the lamp lit when every record of the section is on this device, the press installs them all
     (persist() asked once; `n / N · CANCEL` and the ring while it runs, a press then stops after the record in hand) or, pressed twice, removes
     them.  The records' road is library.js keepSection (chemview's too: each record checked against its sha-256 name), and MOLECULES' lamps
     are re-read after (chem.records()). ── */
  const cardLine = (S) => `${S.rows.length} molecules`;   // iteration 012 L1: the size rides in the install word, the count of files kept is the ring
  /** the install's eye: DOWNLOAD while there is something to fetch, TRASH once it is all here (iteration 012 L2, I1's icons) */
  const eye = (i, here) => i.style.setProperty('--ico', `url(img/icons/${here ? 'trash' : 'download'}.svg)`);
  function paintSec(S) {
    const v = S.view; if (!v || !v.b.isConnected) return;
    const N = S.recs.length, all = N > 0 && S.n === N;
    v.meta.textContent = cardLine(S); if (S.busy) return;
    v.b.dataset.state = all ? 'installed' : S.n ? 'partial' : 'absent'; v.b.setAttribute('aria-pressed', String(all)); v.ring.set(N ? S.n / N : 0, all ? 'done' : 'idle'); eye(v.ico, all);
    v.word.textContent = all ? 'REMOVE · ' + fmtBytes(S.bytes) : S.n ? `${S.n} / ${N} · INSTALL` : 'INSTALL · ' + fmtBytes(S.bytes);
  }
  /* the store read each time the MOLECULAR deck or the LIBRARY comes into view (the card, a press or the browser may have changed it) */
  async function readStore() {
    for (const S of secs.values()) for (const r of S.recs) have.set(r.hash, await installed(r.hash).catch(() => false));
    for (const S of secs.values()) { if (!S.busy) S.n = S.recs.filter((r) => have.get(r.hash)).length; paintSec(S); for (const m of S.rows) paintAway(m); }
    library.paintDevice();
  }
  async function pressSec(S) {
    if (S.busy) { S.stop = true; return; }   // a press while installing: stop after the record in hand
    if (S.n === S.recs.length) {             // two presses remove: no window.confirm (the volume's law)
      if (!S.view.arm.take()) { S.view.arm.arm(); S.view.word.textContent = 'REMOVE ' + S.sec + '? PRESS AGAIN'; return; }
      await keepSection(S.recs, false);
    } else {
      S.busy = true; S.stop = false; S.view.b.dataset.state = 'busy'; S.view.ring.set(0, 'busy'); S.view.word.textContent = `0 / ${S.recs.length} · CANCEL`;
      await keepSection(S.recs, true, { stop: () => S.stop, onStep: (k, n) => { const w = S.view; if (w && w.b.isConnected) { w.ring.set(k / n, 'busy'); w.word.textContent = `${k} / ${n} · CANCEL`; } } });
      S.busy = false;
    }
    await readStore();
    if (app.state.chem && app.state.chem.records) app.state.chem.records().catch(() => {});   // MOLECULES' lamps and its download glyph read the store again
    if (!S.stop && S.n && S.n < S.recs.length) say({ name: S.sec, sub: `${S.n} of ${S.recs.length} on this device — the rest did not download (offline?)` });
  }
  function secCard(S, host) {
    const c = el('div', 'mm-vol mm-scard', host); c.dataset.section = S.sec; c.setAttribute('role', 'group'); c.setAttribute('aria-label', S.sec + ' — ' + cardLine(S));
    const h = el('div', 'mm-vol-open', c); el('b', 'mm-scard-n', h, S.sec); const meta = el('span', 'mm-vol-meta', h, cardLine(S));
    if (safariTab()) return;   // a Safari tab is offered nothing to keep (chemview's own rule)
    const b = el('button', 'mm-install mm-sinstall', c); b.type = 'button'; b.title = `Keep ${S.sec} on this device: press to install, press twice to remove`;
    const ringHost = el('span', 'mm-ring-host', b), ring = installRing(ringHost), ico = icon(ringHost, 'download'), word = el('span', 'mm-install-word', b);
    S.view = { b, ring, ico, word, meta, arm: armer(b, () => paintSec(S)) }; paintSec(S);
    b.addEventListener('click', (e) => { e.stopPropagation(); pressSec(S); });
  }

  /* ── LIBRARY: the shelf of volumes; a volume's molecules by their tags ── */
  const library = (() => {
    const sec = sections[2].sec, shelfEl = el('div', 'mm-shelf', sec), catEl = el('div', 'mm-cat', sec), devEl = el('div', 'mm-dev', sec), view = el('div', 'mm-volview', sec); view.hidden = true;
    /* iteration 011 Q4: under the shelf, a card per catalogue section that keeps files (THE SECTION INSTALL) and THIS DEVICE (the store's use
       and quota; iteration 012 L1 cut the heading, the kept counts and the persisted line); both stand aside while a volume is open */
    catEl.hidden = devEl.hidden = true;
    function paintCat() {
      catEl.textContent = '';
      const row = el('div', 'mm-cat-row', catEl); for (const S of secs.values()) if (S.recs.length) secCard(S, row);
    }
    async function paintDevice() {
      if (!woke) return;
      const i = await storageInfo().catch(() => null), size = (b) => (b ? fmtBytes(b) : '0 kB');
      devEl.textContent = ''; el('b', '', devEl, 'THIS DEVICE');
      const part = (t) => { if (t) el('span', '', devEl, t); };
      part(i && i.usage != null && i.quota ? `${size(i.usage)} of ${size(i.quota)} in use` : '');
      part(i && i.safariTab ? 'add λWAVES to the Home Screen to keep it' : '');
    }
    /* iteration 008 P (Josh: "less of the stuff on top … much tighter, and more molecules shown per page"): the volume's head is ONE row —
       ‹ (back to the shelf) · the kit's stepper ‹ VOL. I › (its size on its hover) · the count · the tags on one line that scrolls sideways
       (the wheel turns it) · the search · SHOW LABELS (iteration 012 L1: INSTALL / REMOVE live on the shelf's card only) — and the deck below
       measures its tile from what is left */
    const vhead = el('div', 'mm-vhead', view), vdeck = deck(view);
    let woke = false, cur = null, vols = [], mols = [], on = new Set(), query = '', tagsEl = null, countEl = null, vq = null, sortBtns = [];
    /* iteration 014 D1 · THE SORT: NAME (A–Z → Z–A → as-is) and MASS (heavy first → light first → as-is), one at a time; as-is is the index's own
       order and the buttons unpressed; kept for the Picker's life, never saved */
    const sort = { key: '', dir: 0 };
    const SORTS = { name: { first: 1, word: (d) => (d < 0 ? 'Z–A' : 'A–Z'), tip: (d) => (d > 0 ? 'name A–Z' : d < 0 ? 'name Z–A' : 'as listed') + ' — press for ' + (d > 0 ? 'Z–A' : d < 0 ? 'as listed' : 'A–Z') },
      mass: { first: -1, word: (d) => (d < 0 ? '↓' : d > 0 ? '↑' : ''), tip: (d) => (d < 0 ? 'heaviest first' : d > 0 ? 'lightest first' : 'as listed') + ' — press for ' + (d < 0 ? 'lightest first' : d > 0 ? 'as listed' : 'heaviest first') } };
    const sortBtn = (host, key) => { const b = el('button', 'mm-sort', host); b.type = 'button'; b.dataset.sort = key; if (key === 'mass') icon(b, 'mass'); el('span', '', b);
      b.addEventListener('click', () => { const S = SORTS[key]; if (sort.key !== key) { sort.key = key; sort.dir = S.first; } else if (sort.dir === S.first) sort.dir = -S.first; else { sort.key = ''; sort.dir = 0; } paintSort(); filter(); });
      sortBtns.push(b); return b; };
    function paintSort() { sortBtns = sortBtns.filter((b) => b.isConnected); for (const b of sortBtns) { const k = b.dataset.sort, d = sort.key === k ? sort.dir : 0, S = SORTS[k];
      b.classList.toggle('on', !!d); b.setAttribute('aria-pressed', String(!!d)); b.lastChild.textContent = S.word(d); b.title = (k === 'name' ? 'Sort by name · ' : 'Sort by mass · ') + S.tip(d); b.setAttribute('aria-label', b.title); } }
    const sorted = (list) => { if (!sort.key) return list; const d = sort.dir;
      return list.slice().sort(sort.key === 'name' ? (a, b) => d * String(a.name || a.id).localeCompare(String(b.name || b.id), 'en', { sensitivity: 'base' })
        : (a, b) => (a.mw == null) - (b.mw == null) || d * ((a.mw || 0) - (b.mw || 0))); };
    /* a volume with an `index` installs from the network (INSTALL); one without is a file the reader downloads once (OPEN FILE…, or a drop) */
    function installer(host, v) {
      const b = el('button', 'mm-install', host); b.type = 'button';
      const ringHost = el('span', 'mm-ring-host', b), ring = installRing(ringHost), ico = icon(ringHost, 'download'), word = el('span', 'mm-install-word', b);
      const fromFile = !v.index, size = fromFile ? v.archive.bytes : v.bytes, pick = fromFile ? el('input', '', host) : null;
      if (pick) { pick.type = 'file'; pick.accept = '.lwv'; pick.hidden = true; pick.addEventListener('change', () => { const f = pick.files && pick.files[0]; pick.value = ''; if (f) run(f); }); }
      let ctl = null; const arm = armer(b, () => paint());
      const paint = async () => {
        const s = await V.statusOf(v.id).catch(() => ({ state: 'absent', n: 0, N: v.count || 0 }));
        const est = fromFile && s.state !== 'installed' ? await navigator.storage?.estimate?.().catch(() => null) : null;
        const tight = est && est.quota && est.quota - (est.usage || 0) < size ? ' · TOO BIG FOR THIS DEVICE' : '';
        b.dataset.state = s.state; ring.set(s.N ? s.n / s.N : 0, s.state === 'installed' ? 'done' : 'idle'); eye(ico, s.state === 'installed');
        word.textContent = s.state === 'installed' ? 'REMOVE' + (size ? ' · ' + fmtBytes(size) : '') : (s.state === 'partial' ? `RESUME · ${s.n.toLocaleString('en')} / ${s.N.toLocaleString('en')}` + (fromFile ? ' · OPEN FILE…' : '')
          : (fromFile ? 'OPEN FILE…' : 'INSTALL') + (size ? ' · ' + fmtBytes(size) : '')) + tight;
      };
      const run = async (f) => {
        if (ctl) return;
        ctl = new AbortController(); b.dataset.state = 'busy';
        const opts = { signal: ctl.signal, onProgress: (p) => { ring.set(p.ratio, 'busy'); word.textContent = Math.round(p.ratio * 100) + '% · ' + fmtBytes(p.bytes) + ' OF ' + fmtBytes(p.total) + ' · CANCEL'; } };
        const r = await (f ? V.installFile(v.id, f, opts) : V.install(v.id, opts)).catch((err) => ({ ok: false, why: String(err && err.message || err) }));
        ctl = null; await paint();
        if (r && r.why && !r.cancelled) say({ formula: volName(v), name: v.title || '', sub: r.why });
        else if (r && r.ok && f && cur === v) enter(v);
      };
      b.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (ctl) { ctl.abort(); return; }
        if (b.dataset.state === 'installed') {   // two presses remove: no window.confirm
          if (!arm.take()) { arm.arm(); word.textContent = 'REMOVE ' + volName(v) + '? PRESS AGAIN'; return; }
          await V.remove(v.id); await paint(); return;
        }
        if (pick) pick.click(); else run(null);
      });
      paint(); return { paint, run };
    }
    function card(v) {
      /* iteration 012 L1: the numeral, the count and the bases — the title and the blurb are the hover's (title), the size the install's, and
         no caption under a hover (it repeated the card) */
      const c = el('div', 'mm-vol', shelfEl), o = el('button', 'mm-vol-open', c); o.type = 'button'; o.setAttribute('aria-label', 'open ' + volName(v) + (v.title ? ' · ' + v.title : ''));
      el('b', 'mm-vol-num', o, volName(v)); o.title = [v.title, v.blurb].filter(Boolean).join(' — ');
      const meta = [v.count != null ? Number(v.count).toLocaleString('en') + ' molecules' : '', Array.isArray(v.bases) && v.bases.length ? v.bases.length + ' bases' : ''].filter(Boolean).join(' · ');
      if (meta) el('span', 'mm-vol-meta', o, meta);
      o.addEventListener('click', () => enter(v));
      const ins = installer(c, v);
      if (!v.index) {   // the card takes a drop of its .lwv
        const files = (e) => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
        c.addEventListener('dragover', (e) => { if (files(e)) { e.preventDefault(); c.classList.add('drop'); } });
        c.addEventListener('dragleave', () => c.classList.remove('drop'));
        c.addEventListener('drop', (e) => { if (!files(e)) return; e.preventDefault(); c.classList.remove('drop'); const f = e.dataTransfer.files[0]; if (f) ins.run(f); });
      }
    }
    async function paintShelf() {
      shelfEl.textContent = ''; shelfEl.hidden = catEl.hidden = devEl.hidden = false; view.hidden = true; cur = null; root.classList.remove('in-volume');
      let s = { volumes: [] }; try { s = await V.shelf({ fresh: true }); } catch (_) { /* no shelf: said below */ }
      if (!s.volumes.length) {
        const e = el('div', 'mm-empty', shelfEl); el('b', '', e, 'LIBRARY');
        el('span', '', e, 'No volume is published yet.');
        return;
      }
      vols = s.volumes; for (const v of s.volumes) card(v);
      enterTiles([...shelfEl.children]);
    }
    async function enter(v) {
      cur = v; on.clear(); query = ''; shelfEl.hidden = catEl.hidden = devEl.hidden = true; view.hidden = false; vhead.textContent = ''; root.classList.add('in-volume');   // the head's SHOW LABELS stands for the one under the tabs
      const back = el('button', 'mm-back', vhead); back.type = 'button'; icon(back, 'arrow-left'); back.setAttribute('aria-label', 'back to the volumes'); back.title = 'back to the volumes'; back.addEventListener('click', () => paintShelf());
      const size = v.index ? v.bytes : v.archive && v.archive.bytes;
      const step = stepper({ aria: 'volume', items: (vols.length ? vols : [v]).map((x) => ({ id: x.id, label: volName(x) })), value: v.id, list: false, cls: 'mm-vstep',
        onChange: (id) => { const x = vols.find((y) => y.id === id); if (x) enter(x); } });
      step.root.title = [volName(v), size ? fmtBytes(size) : ''].filter(Boolean).join(' · '); vhead.appendChild(step.root);
      countEl = el('span', 'mm-count', vhead);
      tagsEl = el('div', 'mm-tags', vhead); tagsEl.setAttribute('role', 'group'); tagsEl.setAttribute('aria-label', 'tags of ' + volName(v));
      tagsEl.addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && tagsEl.scrollWidth > tagsEl.clientWidth) { e.preventDefault(); tagsEl.scrollLeft += e.deltaY; } }, { passive: false });
      /* iteration 014 D1 (Josh: "move the search bar to the middle, underneath the atomic, molecular, and library buttons"): the search is
         the seat under the tabs while a volume is open (opts' SHOW LABELS stands aside there); its old seat holds NAME and MASS */
      if (!vq) { vq = el('input', 'mm-search', opts); vq.type = 'search'; vq.placeholder = 'search';
        vq.addEventListener('input', () => { query = vq.value.trim().toLowerCase(); filter(); });
        vq.addEventListener('keydown', (e) => e.stopPropagation()); }
      vq.value = ''; vq.setAttribute('aria-label', 'search ' + volName(v));
      sortBtn(vhead, 'name'); sortBtn(vhead, 'mass'); paintSort();
      labelToggle(vhead, 'molLabels');
      animate(view, [{ opacity: 0, transform: 'translateY(12px) scale(.98)' }], 260);
      try { mols = (await V.index(v.id)).molecules; } catch (err) { mols = []; countEl.textContent = String(err && err.message || err); }
      if (cur !== v) return;
      paintTags(); filter();
    }
    /* the tags: built once a volume and lit in place (the strip keeps where it was scrolled); two or more intersect, ALL clears them */
    function paintTags() {
      /* iteration 012 L2: TWO rows in one sideways strip (the head's other controls sit between them in height); each tag in its count's order
         goes to the row that is shorter so far, so both rows read most-common first and end together */
      tagsEl.textContent = ''; const n = new Map(); for (const m of mols) for (const t of m.tags || []) n.set(t, (n.get(t) || 0) + 1);
      const rows = [el('div', 'mm-tagrow', tagsEl), el('div', 'mm-tagrow', tagsEl)], len = [0, 0];
      const chipOf = (id, label, count) => { const r = len[0] <= len[1] ? 0 : 1; len[r] += String(label).length + String(count).length + 4; const b = el('button', 'mm-tag', rows[r], label); b.type = 'button'; b.dataset.tag = id; el('i', '', b, count.toLocaleString('en'));
        b.addEventListener('click', () => { if (id === '') on.clear(); else if (on.has(id)) on.delete(id); else on.add(id); markTags(); filter(); }); };
      chipOf('', 'all', mols.length);
      for (const [t, k] of [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) chipOf(t, t, k);
      markTags();
    }
    function markTags() { for (const b of tagsEl.querySelectorAll('.mm-tag')) { const isOn = b.dataset.tag ? on.has(b.dataset.tag) : !on.size; b.classList.toggle('on', isOn); b.setAttribute('aria-pressed', String(isOn)); } }
    function filter() {
      const list = sorted(mols.filter((m) => [...on].every((t) => (m.tags || []).includes(t))
        && (!query || [m.name, m.formula, m.id, ...(m.tags || [])].some((s) => s && String(s).toLowerCase().includes(query)))));
      countEl.textContent = list.length === mols.length ? mols.length.toLocaleString('en') : list.length.toLocaleString('en') + ' / ' + mols.length.toLocaleString('en');
      countEl.title = (on.size ? [...on].join(' + ') : query ? '“' + query + '”' : 'all') + ' · ' + list.length.toLocaleString('en') + ' molecules';
      vdeck.set(list, (m, host) => {
        /* iteration 008 P: a ONE-ATOM entry (VOL. I's Fe · Kr · Zn · Cr · Ni · Ti, PubChem compounds) is an atom: it opens the ATOMS road, wearing its
           element's own picture; past the ATOM system's reach it still opens from the volume */
        const z = atomZ(m.formula), atom = z && ATOMS.some((a) => a.Z === z) ? z : 0;
        const t = tile(host, 'mm-mol', { formula: m.formulaM ? mathPlain(m.formulaM) : m.formula, name: cap(m.name), sub: atom ? volName(cur) + ' · one atom: it opens in ATOMS' : [volName(cur), ...(m.tags || [])].join(' · ') },
          () => (atom ? goAtom(atom) : goVolume(cur, m)));
        el('b', 'mm-lbl', t, m.formulaM ? mathPlain(m.formulaM) : m.formula);
        if (atom) { pic(t, './img/menu/el-' + SYM[atom - 1] + '.webp'); return; }
        const i = pic(t, null), ph = () => { i.remove(); el('b', 'mm-ph', t, m.formulaM ? mathPlain(m.formulaM) : m.formula); };   // no picture yet: the formula holds the square
        if (!m.thumb) ph(); else V.picture(cur.id, m.id).then((u) => { if (u) { develop(i); i.src = u; } else ph(); }, ph);
      });
      enterTiles(vdeck.tiles);   // iteration 012 L2: a tag or a search deals the page in (animate() stands down under reduced motion)
    }
    return { wake() { if (!woke) { woke = true; paintCat(); paintShelf(); } }, paintDevice, home() { if (cur) paintShelf(); } };
  })();

  /* ── the tab under the reader's eye ── */
  let current = sections[0];
  const show = (s) => { if (!s) return; if (s !== current) say(null); current = s; atomOpt.hidden = s.id !== 'atomic'; molOpt.hidden = s.id === 'atomic'; root.dataset.sec = s.id; for (const x of sections) x.b.classList.toggle('on', x === s); movePill(s.b); if (s.id === 'library') library.wake(); if (s.id !== 'atomic') readStore(); };
  { const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) show(sections.find((s) => s.sec === e.target)); }, { root: scroller, threshold: 0.55 }); for (const s of sections) io.observe(s.sec); }
  let rf = 0; const ro = new ResizeObserver(() => { if (!rf) rf = requestAnimationFrame(() => { rf = 0; if (!root.hidden) { for (const d of decks) d.lay(); movePill(current.b); } }); });   // observed only while the Picker is open

  /* ── going there ── */
  function goMolecule(id) { close(); const C = app.state.chem; if (!C) return; if (!C.on) C.setOn(true); C.pick(id); }
  function goVolume(v, m) {
    close(); if (app.state.chem) app.state.chem.openVolume(v.id, m.id);   // V2: its record, the lowest rung, MOLECULES on (chemview openVolume)
  }
  function goAtom(Z) {
    close(); const C = app.state.chem; if (C && C.on) C.setOn(false);
    app.w.setElement(Z); if (getHamiltonian().id !== 'atom') app.w.switchHamiltonian('atom'); if (app.ui.hamSeg) app.ui.hamSeg.set('atom');
    if (app.w.fillValence) app.w.fillValence();                         // every valence subshell (outside the noble-gas core), every m, in phase (SPECTRUM's own road); the tile shows the block's subshell alone
  }
  /* ── open / close: shown or hidden, nothing rebuilt; the iris opens from the home button (R8), the way back is instant ── */
  /* THE ENTRANCE (iteration 012 L3, Josh: "the main menu fades in, the logo slides in from the top, the icons appear, fading in, easing upwards,
     the molecules start appearing one by one in sequence"): a first run's open, straight after the notice's CONTINUE, on the MOLECULAR deck.
     The menu fades (no iris), the logo drops, the nav · tabs · labels rise (skin.css #lwMenu.first); the first page's tiles come one at a time
     in reading order, each at its turn AND once its picture has decoded (its request went first: `hot`), so no tile shows empty and none
     waits on a picture further down; under reduced motion the end state at once.  The notice's ground (body.lw-notice) is lifted after. */
  function entrance(tiles) {
    if (RM.matches) return;
    const t0 = performance.now(), wait = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
    let chain = wait(300), last = 270;   // the deck's own fade first; then one tile every 30 ms at the soonest, never out of turn
    for (const t of tiles) {
      const img = t.querySelector('.mm-pic');
      t.style.opacity = '0';
      const ready = img && !img.complete ? Promise.race([new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); }), wait(2500)]) : null;
      chain = chain.then(() => ready).then(() => wait(last + 30 - (performance.now() - t0))).then(() => {
        last = performance.now() - t0; t.style.opacity = '';
        if (img) for (const x of img.getAnimations()) x.finish();   // the tile's own rise is the picture's arrival: no second develop
        animate(t, [{ opacity: 0, translate: '0 10px', scale: '.96' }], 420);
      });
    }
  }
  function open(o) {
    if (!root.hidden) return;
    const first = !!(o && o.first);
    const r = home.getBoundingClientRect();
    root.style.setProperty('--ox', r.width ? r.left + r.width / 2 + 'px' : '50%'); root.style.setProperty('--oy', r.width ? r.top + r.height / 2 + 'px' : '50%');
    root.classList.toggle('first', first);
    if (first) { current = sections[1]; show(current); }   // before the decks are laid, so the MOLECULAR page is the one asked for first
    root.hidden = false; document.body.classList.add('menu-open'); said = null; say(null); ro.observe(scroller);
    if (first) sections[1].sec.scrollIntoView({ block: 'start' });
    for (const d of decks) d.lay();
    if (current.id !== 'atomic') readStore();
    if (first) {
      requestAnimationFrame(() => { root.classList.add('in'); movePill(current.b); entrance(molDeck.tiles); });
      setTimeout(() => { document.body.classList.remove('lw-notice'); }, 700);
      setTimeout(() => { root.classList.remove('first'); }, 2600);
      return;
    }
    requestAnimationFrame(() => { root.classList.add('in'); movePill(current.b); enterTiles(current.id === 'atomic' ? [...table.children] : current.id === 'molecular' ? molDeck.tiles : [], (t, i) => (t.classList.contains('mm-el') ? (+t.style.gridColumn || 0) + (+t.style.gridRow || 0) : i)); });
  }
  function close() { if (root.hidden) return; ro.unobserve(scroller); root.classList.remove('in'); document.body.classList.remove('menu-open'); root.hidden = true; }
  const toggle = () => (root.hidden ? open() : close());
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !root.hidden) close(); });
  /* the home button by the title: the kit's grid glyph */
  const home = el('button', 'lw-home', document.body); home.id = 'lwHome'; home.type = 'button'; chip(home, 'gallery', 'Picker'); home.title = 'Picker (L)';
  home.addEventListener('click', toggle);
  /** iteration 014 A2 · a suggestion's tile is the Picker's own tile (its picture, its formula, the hue in use) and its press the Picker's road */
  const suggestTile = (host, r) => {
    const info = { formula: mathPlain(r.formula), name: cap(r.name), sub: r.vol ? r.vol.toUpperCase() : '' };
    const t = tile(host, 'mm-mol', info, () => (r.vol ? goVolume(r.v, r.m) : goMolecule(r.id)));
    const i = pic(t, r.vol ? '' : r.pic); if (r.vol) { if (r.thumb) V.picture(r.vol, r.id).then((u) => { if (u) i.src = u; else i.remove(); }, () => i.remove()); else i.remove(); }
    el('b', 'mm-lbl', t, info.formula); return t;
  };
  const api = { open, close, toggle, get shown() { return !root.hidden; }, root, show(id) { const s = sections.find((x) => x.id === id); if (s) { open(); s.sec.scrollIntoView({ block: 'start' }); } }, suggest, suggestTile };
  app.state.picker = api;
  if (openAtBoot) open();
  return api;
}
