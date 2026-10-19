/* lab/picker.js — THE PICKER (iteration 004, Josh 2026-10-17; iteration 003's MAIN MENU): λWAVES' front page, over the stage.  Three
 * sections in one vertical snap — ATOMIC (the periodic table: each live element H–Kr its own picture, exactly what a press opens, seen
 * from the corner; the elements past Kr their valence subshell's), MOLECULAR (every molecule in the store by its section, each section
 * opened by a heading tile that installs the section's records — iteration 008 P; the pages sized to the screen, ‹ › beside them) and
 * LIBRARY (THE VOLUMES, lab/volumes.js: VOL. I, VOL. II … — each a card that installs with one press; inside a volume ONE head row — the
 * volume's stepper, the count, its plain tags (two intersect), a search, INSTALL — over its molecules; a one-atom entry opens the ATOM).  The pictures are tools/menu-thumbs.mjs' and each
 * volume's own (t/<id>.webp).  A hover or a focus moves ONLY the picture (lab/picker-fx.js: the spring tilt and a zoom — no background,
 * no tint), writes the name under the tile, and swaps the large caption at the foot.  A press goes there: ATOMS mode and the element
 * (goAtom), MOLECULES mode and the molecule (chem.pick), or a volume's molecule (chem.openVolume).  THE WAY BACK is instant: the DOM is
 * built once and only shown or hidden — the home button (the iris opens from it), L (keys.js `menu`), WINDOW › PICKER; Escape leaves.
 * FOLDERS (the projects and the demos) has its door at the top left.  It opens at boot once the photosensitivity notice is accepted,
 * unless a link, a ?preset= or ?menu=0 opened something (rack.js).  A plain module: app is read, never extended (app.state.picker). */
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
const ARROW = (dir) => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="${dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function createPicker(app, { open: openAtBoot = true } = {}) {
  const root = el('div', 'lw-menu', document.body); root.id = 'lwMenu'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'the Picker');
  const top = el('div', 'mm-top', root);
  /* FOLDERS' door (iteration 004 · F: the projects and the eleven demos live there now) */
  const door = el('button', 'mm-door', top); door.type = 'button'; chip(door, 'folder', 'Folders'); el('span', '', door, 'FOLDERS'); door.title = 'your projects and the demos — FOLDERS';
  door.addEventListener('click', () => { close(); const P = app.sh.layout && app.sh.layout.projects; if (P) (P.show || P.toggle).call(P); });
  const logo = el('div', 'mm-logo', top);
  fetch('./img/lambdawaves-logo.svg').then((r) => r.text()).then((t) => { logo.innerHTML = t.replace(/fill="#f0f4f7"/g, 'fill="currentColor"'); const s = logo.querySelector('svg'); if (s) { s.setAttribute('aria-label', 'λWAVES'); s.setAttribute('role', 'img'); } }).catch(() => { logo.textContent = 'λWAVES'; });
  const tabs = el('div', 'mm-tabs', top), pill = el('i', 'mm-pill', tabs), scroller = el('div', 'mm-scroll', root), caption = el('div', 'mm-caption', root);
  caption.setAttribute('aria-live', 'polite');

  /* ── the caption: the formula (STIX), the name (LW Title), the line under them (an element: its name alone, its valence subshell alone in STIX); R6's swap ── */
  let said = null;
  const say = (t) => {
    const key = t ? [t.formula, t.name, t.sub].join('|') : '';
    if (key === said) return; said = key;
    swapLine(caption, (line) => { if (!t) return; if (t.formula) el('b', 'mm-cap-f', line, t.formula); if (t.name) el('span', 'mm-cap-n', line, t.name); if (t.sub) el('i', 'mm-cap-s' + (t.math ? ' mm-cap-m' : ''), line, t.sub); });
  };
  /* ── a tile: the picture moves, the name shows under it; nothing else changes on a hover ── */
  /* a picture of ours (img/menu/, sw.js DATA) is kept on the device once it has loaded (library.js keepData); a volume's is its own */
  const pic = (host, src) => { const i = el('img', 'mm-pic', host); i.alt = ''; i.decoding = 'async'; i.loading = 'lazy'; i.draggable = false; i.addEventListener('error', () => { i.remove(); }); if (src) { develop(i); i.addEventListener('load', () => keepData(src), { once: true }); i.src = src; } return i; };
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
      b.setAttribute('aria-label', dir < 0 ? 'previous page' : 'next page'); b.innerHTML = ARROW(dir); b.addEventListener('click', () => pageTo(page + dir)); return b; };
    const arrows = [arrow(-1), arrow(1)];
    let list = [], make = null, pages = [], page = 0, per = 1;
    const fill = (k) => { const p = pages[k]; if (!p || p.dataset.full) return; p.dataset.full = '1'; for (let i = k * per; i < Math.min(list.length, (k + 1) * per); i++) make(list[i], p); };
    const near = (k) => { for (let j = k - 1; j <= k + 1; j++) fill(j); };
    function paint() {
      arrows[0].disabled = page <= 0; arrows[1].disabled = page >= pages.length - 1; foot.hidden = pages.length < 2;
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
      const H = Math.max(150, scroller.clientHeight - above - 70), W = Math.max(200, Math.min(scroller.clientWidth - (narrow ? 24 : 150), 1900));
      let rows = H >= 560 ? 4 : H >= 400 ? 3 : 2, t = Math.min(260, (H - (rows - 1) * gap) / rows);   // iteration 008 P: a row sooner (4 from 560 px, once 640) — "more molecules per page"
      let cols = Math.max(3, Math.min(12, Math.floor((W + gap) / (t + gap))));
      const want = narrow ? 3 : 8;   // Josh: bigger AND more columns — a desktop page is at least eight across while a tile stays ≥ 150 px
      if (cols < want && (W - (want - 1) * gap) / want >= (narrow ? 80 : 150)) cols = want;
      t = Math.min(t, (W - (cols - 1) * gap) / cols); rows = Math.max(2, Math.min(6, Math.floor((H + gap) / (t + gap))));
      return { cols, rows, t: Math.floor(t), gap };
    }
    function lay() {
      if (root.hidden || !make || !host.getClientRects().length) return;
      const first = page * per, g = size(); per = g.cols * g.rows;
      for (const e of [pagesEl, host]) { e.style.setProperty('--t', g.t + 'px'); e.style.setProperty('--cols', String(g.cols)); e.style.setProperty('--gap', g.gap + 'px'); }   // the host's: a head row (the LIBRARY's) as wide as the page
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
    const d = { set(l, m) { list = l; make = m; page = 0; per = 1; lay(); }, lay, pageTo, get tiles() { return pages[page] ? [...pages[page].children] : []; }, get count() { return list.length; } };
    decks.push(d); return d;
  }

  /* ── the sections and the tabs (R9: the sliding pill, the approach accent) ── */
  const sections = [['atomic', 'ATOMIC'], ['molecular', 'MOLECULAR'], ['library', 'LIBRARY']].map(([id, label]) => {
    const sec = el('section', 'mm-sec mm-' + id, scroller), b = el('button', 'mm-tab', tabs, label); b.type = 'button';
    b.addEventListener('click', () => sec.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }));
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
    pic(t, './img/menu/' + (live ? 'el-' + sym : 'orb-' + v.nl + '_' + v.m) + '.webp');   // the atom's highest orbital: its own past H–Kr hydrogen's (n, l, m)
    el('i', 'mm-z', t, String(Z)); el('b', 'mm-sym', t, sym);
  }
  /* ── MOLECULAR: the catalogue by its SECTIONS (lab/molecules.js), each opened by its HEADING tile — the section's name, its count and, for a
     section with records, THE SECTION INSTALL (iteration 008 P: MOLECULES' INSTALLED moved here): the lamp lit when every record of the section is
     on this device, the press installs them all (persist() asked once) or, pressed twice, removes them, the ring their share.  The records' road
     (library.js keepSection, chemview's road too: each record checked against its sha-256 name), and the card's lamps re-read after (chem.records()).  Within a
     section, the dropdown's order (its groups).  A one-atom entry is never listed here: an atom is the ATOMIC table's. ── */
  const GROUP_AT = new Map([...GROUPS, RECORD_GROUP].map((g, i) => [g.id, i])), rank = (p) => (GROUP_AT.has(p.group) ? GROUP_AT.get(p.group) : GROUP_AT.size);
  const secRows = (sec) => CHEM_PRESETS.filter((p) => p.section === sec && !atomZ(p.formula)).sort((a, b) => rank(a) - rank(b));
  const secs = new Map(SECTIONS.map((sec) => { const rows = secRows(sec), recs = rows.flatMap((p) => Object.values(p.records || {}));
    return [sec, { sec, rows, recs, bytes: recs.reduce((t, r) => t + r.bytes, 0), n: 0, busy: false, stop: false, arm: 0, view: null }]; }));
  const secLine = (S) => `${S.rows.length} molecules · ` + (S.recs.length ? `${S.recs.length} record${S.recs.length > 1 ? 's' : ''} · ${fmtBytes(S.bytes)} · ${S.n} here` : 'all live');
  function paintSec(S) {
    const v = S.view; if (!v || !v.b.isConnected) return;
    const N = S.recs.length, all = N > 0 && S.n === N;
    v.meta.textContent = secLine(S); if (S.busy) return;
    v.b.dataset.state = all ? 'installed' : S.n ? 'partial' : 'absent'; v.b.setAttribute('aria-pressed', String(all)); v.ring.set(N ? S.n / N : 0, all ? 'done' : 'idle');
    v.word.textContent = all ? 'INSTALLED' : S.n ? `${S.n} / ${N} · INSTALL` : 'INSTALL · ' + fmtBytes(S.bytes);
  }
  async function countSec(S) { let n = 0; for (const r of S.recs) if (await installed(r.hash).catch(() => false)) n++; S.n = n; paintSec(S); }
  async function pressSec(S) {
    if (S.busy) { S.stop = true; return; }   // a press while installing: stop after the record in hand
    if (S.n === S.recs.length) {             // two presses remove: no window.confirm (the volume's law)
      if (Date.now() - S.arm > 3000) { S.arm = Date.now(); S.view.word.textContent = 'REMOVE ' + S.sec + '? PRESS AGAIN'; return; }
      S.arm = 0; await keepSection(S.recs, false);
    } else {
      S.busy = true; S.stop = false; S.view.b.dataset.state = 'busy';
      await keepSection(S.recs, true, { stop: () => S.stop, onStep: (k, n) => { const w = S.view; if (w && w.b.isConnected) { w.ring.set(k / n, 'busy'); w.word.textContent = `${k} / ${n} · CANCEL`; } } });
      S.busy = false;
    }
    await countSec(S);
    if (app.state.chem && app.state.chem.records) app.state.chem.records().catch(() => {});   // MOLECULES' lamps (DOWNLOAD / INSTALLED) read the store again
    if (!S.stop && S.n && S.n < S.recs.length) say({ name: S.sec, sub: `${S.n} of ${S.recs.length} records on this device — the rest did not download (offline?)` });
  }
  function secHead(S, host) {
    const h = el('div', 'mm-tile mm-shead', host); h.setAttribute('role', 'group'); h.setAttribute('aria-label', S.sec + ' — ' + secLine(S));
    el('b', 'mm-shead-n', h, S.sec); const meta = el('span', 'mm-shead-m', h, secLine(S));
    h.addEventListener('pointerenter', () => say({ name: S.sec, sub: secLine(S) }));
    if (!S.recs.length || safariTab()) return;   // a live-only section keeps nothing; a Safari tab is offered nothing to keep (chemview's own rule)
    const b = el('button', 'mm-install mm-sinstall', h); b.type = 'button'; b.title = `Every record of ${S.sec} kept on this device: press to install them all, press twice to remove them`;
    const ringHost = el('span', 'mm-ring-host', b), ring = installRing(ringHost); el('i', 'mm-lamp', b); const word = el('span', 'mm-install-word', b);
    S.view = { b, ring, word, meta }; paintSec(S); if (S.busy) { ring.set(0, 'busy'); b.dataset.state = 'busy'; word.textContent = 'INSTALLING · CANCEL'; }
    b.addEventListener('click', (e) => { e.stopPropagation(); pressSec(S); });
  }
  const molDeck = deck(sections[1].sec);
  molDeck.set(SECTIONS.flatMap((sec) => [{ head: secs.get(sec) }, ...secs.get(sec).rows]), (m, host) => {
    if (m.head) { secHead(m.head, host); return; }
    const t = tile(host, 'mm-mol', { formula: mathPlain(m.formula), name: cap(m.name), sub: m.disabled ? m.reason : '' }, () => goMolecule(m.id), !!m.disabled);
    pic(t, './img/menu/' + m.id + '.webp');
  });
  const countSecs = () => { for (const S of secs.values()) if (S.recs.length && !S.busy) countSec(S); };   // the store read each time the deck comes into view (the card or the browser may have changed it)

  /* ── LIBRARY: the shelf of volumes; a volume's molecules by their tags ── */
  const library = (() => {
    const sec = sections[2].sec, shelfEl = el('div', 'mm-shelf', sec), view = el('div', 'mm-volview', sec); view.hidden = true;
    /* iteration 008 P (Josh: "less of the stuff on top … much tighter, and more molecules shown per page"): the volume's head is ONE row —
       ‹ LIBRARY · the kit's stepper ‹ VOL. I › (its title and size on its hover) · the count · the tags on one line that scrolls sideways
       (the wheel turns it) · the search · INSTALL / OPEN FILE… with its ring — and the deck below measures its tile from what is left */
    const vhead = el('div', 'mm-vhead', view), vdeck = deck(view);
    let woke = false, cur = null, vols = [], mols = [], on = new Set(), query = '', tagsEl = null, countEl = null;
    /* a volume with an `index` installs from the network (INSTALL); one without is a file the reader downloads once (OPEN FILE…, or a drop) */
    function installer(host, v) {
      const b = el('button', 'mm-install', host); b.type = 'button';
      const ringHost = el('span', 'mm-ring-host', b), ring = installRing(ringHost), word = el('span', 'mm-install-word', b);
      const fromFile = !v.index, size = fromFile ? v.archive.bytes : v.bytes, pick = fromFile ? el('input', '', host) : null;
      if (pick) { pick.type = 'file'; pick.accept = '.lwv'; pick.hidden = true; pick.addEventListener('change', () => { const f = pick.files && pick.files[0]; pick.value = ''; if (f) run(f); }); }
      let ctl = null, arm = 0;
      const paint = async () => {
        const s = await V.statusOf(v.id).catch(() => ({ state: 'absent', n: 0, N: v.count || 0 }));
        const est = fromFile && s.state !== 'installed' ? await navigator.storage?.estimate?.().catch(() => null) : null;
        const tight = est && est.quota && est.quota - (est.usage || 0) < size ? ' · TOO BIG FOR THIS DEVICE' : '';
        b.dataset.state = s.state; ring.set(s.N ? s.n / s.N : 0, s.state === 'installed' ? 'done' : 'idle');
        word.textContent = s.state === 'installed' ? 'INSTALLED · REMOVE' : (s.state === 'partial' ? `RESUME · ${s.n.toLocaleString('en')} / ${s.N.toLocaleString('en')}` + (fromFile ? ' · OPEN FILE…' : '')
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
          if (Date.now() - arm > 3000) { arm = Date.now(); word.textContent = 'REMOVE ' + volName(v) + '? PRESS AGAIN'; return; }
          arm = 0; await V.remove(v.id); await paint(); return;
        }
        if (pick) pick.click(); else run(null);
      });
      paint(); return { paint, run };
    }
    function card(v) {
      const c = el('div', 'mm-vol', shelfEl), o = el('button', 'mm-vol-open', c); o.type = 'button'; o.setAttribute('aria-label', 'open ' + volName(v) + (v.title ? ' · ' + v.title : ''));
      el('b', 'mm-vol-num', o, volName(v)); if (v.title) el('span', 'mm-vol-title', o, v.title);
      const size = v.index ? v.bytes : v.archive.bytes;
      const meta = [v.count != null ? Number(v.count).toLocaleString('en') + ' molecules' : '', size ? fmtBytes(size) : '', Array.isArray(v.bases) && v.bases.length ? v.bases.length + ' bases' : ''].filter(Boolean).join(' · ');
      if (meta) el('span', 'mm-vol-meta', o, meta);
      if (v.blurb) el('span', 'mm-vol-blurb', o, v.blurb);
      if (!v.index) el('span', 'mm-vol-blurb', o, 'A volume is a file you download once and open here.');
      o.addEventListener('pointerenter', () => say({ formula: volName(v), name: v.title || '', sub: meta }));
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
      shelfEl.textContent = ''; shelfEl.hidden = false; view.hidden = true; cur = null;
      let s = { volumes: [] }; try { s = await V.shelf({ fresh: true }); } catch (_) { /* no shelf: said below */ }
      if (!s.volumes.length) {
        const e = el('div', 'mm-empty', shelfEl); el('b', '', e, 'LIBRARY');
        el('span', '', e, 'No volume is published yet. A volume is an expansion library — thousands of molecules, each solved in every basis from STO-3G to 6-31+G* — installed on this device with one press.');
        return;
      }
      vols = s.volumes; for (const v of s.volumes) card(v);
      enterTiles([...shelfEl.children]);
    }
    async function enter(v) {
      cur = v; on.clear(); query = ''; shelfEl.hidden = true; view.hidden = false; vhead.textContent = '';
      const back = el('button', 'mm-back', vhead, '‹ LIBRARY'); back.type = 'button'; back.addEventListener('click', () => paintShelf());
      const size = v.index ? v.bytes : v.archive && v.archive.bytes;
      const step = stepper({ aria: 'volume', items: (vols.length ? vols : [v]).map((x) => ({ id: x.id, label: volName(x) })), value: v.id, list: false, cls: 'mm-vstep',
        onChange: (id) => { const x = vols.find((y) => y.id === id); if (x) enter(x); } });
      step.root.title = [volName(v), v.title, size ? fmtBytes(size) : ''].filter(Boolean).join(' · '); vhead.appendChild(step.root);
      countEl = el('span', 'mm-count', vhead);
      tagsEl = el('div', 'mm-tags', vhead); tagsEl.setAttribute('role', 'group'); tagsEl.setAttribute('aria-label', 'tags of ' + volName(v));
      tagsEl.addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && tagsEl.scrollWidth > tagsEl.clientWidth) { e.preventDefault(); tagsEl.scrollLeft += e.deltaY; } }, { passive: false });
      const q = el('input', 'mm-search', vhead); q.type = 'search'; q.placeholder = 'search'; q.setAttribute('aria-label', 'search ' + volName(v));
      q.addEventListener('input', () => { query = q.value.trim().toLowerCase(); filter(); });
      q.addEventListener('keydown', (e) => e.stopPropagation());
      installer(vhead, v);
      animate(view, [{ opacity: 0, transform: 'translateY(12px) scale(.98)' }], 260);
      try { mols = (await V.index(v.id)).molecules; } catch (err) { mols = []; countEl.textContent = String(err && err.message || err); }
      if (cur !== v) return;
      paintTags(); filter();
    }
    /* the tags: built once a volume and lit in place (the strip keeps where it was scrolled); two or more intersect, ALL clears them */
    function paintTags() {
      tagsEl.textContent = ''; const n = new Map(); for (const m of mols) for (const t of m.tags || []) n.set(t, (n.get(t) || 0) + 1);
      const chipOf = (id, label, count) => { const b = el('button', 'mm-tag', tagsEl, label); b.type = 'button'; b.dataset.tag = id; el('i', '', b, count.toLocaleString('en'));
        b.addEventListener('click', () => { if (id === '') on.clear(); else if (on.has(id)) on.delete(id); else on.add(id); markTags(); filter(); }); };
      chipOf('', 'all', mols.length);
      for (const [t, k] of [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) chipOf(t, t, k);
      markTags();
    }
    function markTags() { for (const b of tagsEl.children) { const isOn = b.dataset.tag ? on.has(b.dataset.tag) : !on.size; b.classList.toggle('on', isOn); b.setAttribute('aria-pressed', String(isOn)); } }
    function filter() {
      const list = mols.filter((m) => [...on].every((t) => (m.tags || []).includes(t))
        && (!query || [m.name, m.formula, m.id, ...(m.tags || [])].some((s) => s && String(s).toLowerCase().includes(query))));
      countEl.textContent = list.length === mols.length ? mols.length.toLocaleString('en') : list.length.toLocaleString('en') + ' / ' + mols.length.toLocaleString('en');
      countEl.title = (on.size ? [...on].join(' + ') : query ? '“' + query + '”' : 'all') + ' · ' + list.length.toLocaleString('en') + ' molecules';
      vdeck.set(list, (m, host) => {
        /* iteration 008 P: a ONE-ATOM entry (VOL. I's Fe · Kr · Zn · Cr · Ni · Ti, PubChem compounds) is an atom: it opens the ATOMS road, wearing its
           element's own picture; past the ATOM system's reach it still opens from the volume */
        const z = atomZ(m.formula), atom = z && ATOMS.some((a) => a.Z === z) ? z : 0;
        const t = tile(host, 'mm-mol', { formula: m.formulaM ? mathPlain(m.formulaM) : m.formula, name: cap(m.name), sub: atom ? volName(cur) + ' · one atom: it opens in ATOMS' : [volName(cur), ...(m.tags || [])].join(' · ') },
          () => (atom ? goAtom(atom) : goVolume(cur, m)));
        if (atom) { pic(t, './img/menu/el-' + SYM[atom - 1] + '.webp'); return; }
        const i = pic(t, null), ph = () => { i.remove(); el('b', 'mm-ph', t, m.formulaM ? mathPlain(m.formulaM) : m.formula); };   // no picture yet: the formula holds the square
        if (!m.thumb) ph(); else V.picture(cur.id, m.id).then((u) => { if (u) { develop(i); i.src = u; } else ph(); }, ph);
      });
    }
    return { wake() { if (!woke) { woke = true; paintShelf(); } } };
  })();

  /* ── the tab under the reader's eye ── */
  let current = sections[0];
  const show = (s) => { if (!s) return; if (s !== current) say(null); current = s; for (const x of sections) x.b.classList.toggle('on', x === s); movePill(s.b); if (s.id === 'library') library.wake(); if (s.id === 'molecular') countSecs(); };
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
    if (app.w.fillValence) app.w.fillValence();                         // the valence shell that makes the atom, every m equal and in phase (SPECTRUM's own road)
  }
  /* ── open / close: shown or hidden, nothing rebuilt; the iris opens from the home button (R8), the way back is instant ── */
  function open() {
    if (!root.hidden) return;
    const r = home.getBoundingClientRect();
    root.style.setProperty('--ox', r.width ? r.left + r.width / 2 + 'px' : '50%'); root.style.setProperty('--oy', r.width ? r.top + r.height / 2 + 'px' : '50%');
    root.hidden = false; document.body.classList.add('menu-open'); said = null; say(null); ro.observe(scroller);
    for (const d of decks) d.lay();
    if (current.id === 'molecular') countSecs();
    requestAnimationFrame(() => { root.classList.add('in'); movePill(current.b); enterTiles(current.id === 'atomic' ? [...table.children] : current.id === 'molecular' ? molDeck.tiles : [], (t, i) => (t.classList.contains('mm-el') ? (+t.style.gridColumn || 0) + (+t.style.gridRow || 0) : i)); });
  }
  function close() { if (root.hidden) return; ro.unobserve(scroller); root.classList.remove('in'); document.body.classList.remove('menu-open'); root.hidden = true; }
  const toggle = () => (root.hidden ? open() : close());
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !root.hidden) close(); });
  /* the home button by the title: the kit's grid glyph */
  const home = el('button', 'lw-home', document.body); home.id = 'lwHome'; home.type = 'button'; chip(home, 'gallery', 'Picker'); home.title = 'Picker (L)';
  home.addEventListener('click', toggle);
  const api = { open, close, toggle, get shown() { return !root.hidden; }, root, show(id) { const s = sections.find((x) => x.id === id); if (s) { open(); s.sec.scrollIntoView({ block: 'start' }); } } };
  app.state.picker = api;
  if (openAtBoot) open();
  return api;
}
