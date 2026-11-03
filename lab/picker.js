/* lab/picker.js — THE PICKER (iteration 004, Josh 2026-10-17; iteration 003's MAIN MENU): λWAVES' front page, over the stage.  Three
 * sections in one vertical snap — ATOMIC (the periodic table: each live element H–Kr its own picture, exactly what a press opens, seen
 * from the corner; the elements past Kr their valence subshell's), MOLECULAR (MOLECULES ONLY since iteration 011 Q4: every molecule of
 * the catalogue in its sections' order, one not yet on this device wearing the kit's download glyph; the pages sized to the screen, ‹ ›
 * beside them) and LIBRARY — the one place for what is kept: THE VOLUMES (lab/volumes.js: VOL. I, VOL. II … — each a card that installs
 * with one press; inside a volume ONE head row — the volume's stepper, the count, its plain tags (two intersect), a search, INSTALL — over
 * its molecules; a one-atom entry opens the ATOM), a card per catalogue section that keeps files (THE SECTION INSTALL, iteration 008 P's,
 * moved out of the MOLECULAR deck; 032: gone — every one of those molecules is MOLECULAR's) and THIS DEVICE's use.  Iteration 012 L1 (Josh: "too much text … concise and not repetitive"): a card
 * says its count and its install (the size rides in INSTALL / REMOVE), a remove is armed for 600 ms, SHOW LABELS sits under the tabs.  The pictures are tools/menu-thumbs.mjs' and each
 * volume's own (t/<id>.webp).  A hover or a focus moves ONLY the picture (lab/picker-fx.js: the spring tilt and a zoom — no background,
 * no tint), writes the name under the tile, and swaps the large caption at the foot.  A press goes there: ATOMS mode and the element
 * (goAtom), MOLECULES mode and the molecule (chem.pick), or a volume's molecule (chem.openVolume).  THE WAY BACK is instant: the DOM is
 * built once and only shown or hidden — the home button (the iris opens from it), L (keys.js `menu`), WINDOW › PICKER; Escape leaves.
 * Under the logo (iteration 012 L2): RETURN HOME (the lab), FOLDERS (the projects and the demos) and THE HUE ring (a dial that turns the
 * molecules' pictures round the colour wheel), THEME (032) and LOOK.  The Picker opens at boot once the photosensitivity notice is accepted,
 * unless a link, a ?preset= or ?menu=0 opened something (rack.js).  A plain module: app is read, never extended (app.state.picker). */
import { storageInfo } from './library.js';   // iteration 011 Q4: the LIBRARY's THIS DEVICE line
import { el, chip, mathPlain, stepper } from './mir/kit.js'; import { setGlyph, glyphSvg } from './mir/glyph.js';
import { jsonStore } from './mir/core/prefs.js';   // 021 R4: the Picker's record on the kit's store
import { CHEM_PRESETS } from './chemview.js';
import { SECTIONS, GROUPS, RECORD_GROUP } from './molecules.js';
import { ATOMS } from './atoms.js';
import { valenceOf } from './valence.js';
import { getHamiltonian } from './hamiltonian.js';
import { BASIS } from './hydrogen.js';
import { L_LETTERS } from './names.js';
import { RM, still, animate, pointerFrame, tiltPictures, holoCards, enterTiles, develop, swapLine, installRing, clamp } from './picker-fx.js';
import * as V from './volumes.js';
import { keepData, installed, safariTab } from './library.js';

/* 030 THE TIP JAR: the donation link, written by tools/tip-qr.py together with img/menu/tip-qr.svg (its picture). Empty: no card, no sheet. */
const TIP_URL = 'https://ko-fi.com/magiccommons';
/* 032 THE PORTRAIT SHELF: the volumes that have a hero and in which themes ('dark light'), written by tools/volume-heroes.mjs with its files
   (img/menu/vol/<id>.<theme>.mp4 and the still .webp). A volume not named here wears the λWAVES palette. */
const HEROES = { 'vol-1': 'dark light' };
/* 034 M3 THE TUTORIAL DECK: one card a row, in this order — its id (`tut-<slug>`), its title, its caption ('' until Josh's words come) and the
   themes its hero has files in (img/menu/tut/<id>.<theme>.mp4 and the still .webp; a theme not named shows the other's), written by
   tools/tutorial-heroes.mjs, one row a line */
const TUTORIAL = [
  { id: 'tut-hero-1', title: 'HERO 1', caption: '', themes: 'light' },
  { id: 'tut-hero-2', title: 'HERO 2', caption: '', themes: 'light' },
  { id: 'tut-hero-3', title: 'HERO 3', caption: '', themes: 'light' },
  { id: 'tut-hero-4', title: 'HERO 4', caption: '', themes: 'light' },
  { id: 'tut-hero-5', title: 'HERO 5', caption: '', themes: 'light' },
  { id: 'tut-hero-6', title: 'HERO 6', caption: '', themes: 'light' },
  { id: 'tut-impulse', title: 'IMPULSE', caption: '', themes: 'light' },
  { id: 'tut-lfo', title: 'LFO', caption: '', themes: 'dark' },
  { id: 'tut-macros', title: 'MACROS', caption: '', themes: 'dark' },
  { id: 'tut-molecules', title: 'MOLECULES', caption: '', themes: 'dark' },
  { id: 'tut-notebook', title: 'NOTEBOOK', caption: '', themes: 'dark' },
  { id: 'tut-palette', title: 'PALETTE', caption: '', themes: 'light' },
  { id: 'tut-projects', title: 'PROJECTS', caption: '', themes: 'dark' },
  { id: 'tut-spectrum', title: 'SPECTRUM', caption: '', themes: 'light' },
  { id: 'tut-themes', title: 'THEMES AND CUSTOMS', caption: '', themes: 'light' },
  { id: 'tut-wave', title: 'WAVE', caption: '', themes: 'light' },
  { id: 'tut-wave-2', title: 'WAVE 2', caption: '', themes: 'light' },
  { id: 'tut-audio', title: 'AUDIO', caption: '', themes: 'dark' },
  { id: 'tut-env', title: 'ENV', caption: '', themes: 'dark' },
  { id: 'tut-mod-hero-1', title: 'MOD HERO 1', caption: '', themes: 'dark' },
  { id: 'tut-mod-hero-2', title: 'MOD HERO 2', caption: '', themes: 'dark' },
  { id: 'tut-mod-hero-3', title: 'MOD HERO 3', caption: '', themes: 'dark' },
  { id: 'tut-mod-hero-4', title: 'MOD HERO 4', caption: '', themes: 'dark' },
  { id: 'tut-mod-hero-5', title: 'MOD HERO 5', caption: '', themes: 'dark' },
  { id: 'tut-mod-hero-6', title: 'MOD HERO 6', caption: '', themes: 'dark' },
];

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
const PREF_KEY = 'lambdawaves.q0.picker', PREF0 = { atomLabels: true, molLabels: false, hue: 0, atomic: 'atoms' };   // iteration 016 P3: no `look` until the reader picks one (lookFor)   // atomic: THE ATOMIC deck's HYDROGEN | ATOMS (iteration 015 M3)   // look: THE PICTURES' STYLE (iteration 014 B4)   // hue: THE HUE ring's turn in degrees (L2)
/* iteration 016 P3 · DEFAULT LOOKS (Josh: "Im ψ for atoms, arg ψ for molecules, until the reader changes it"): a record before 016 wrote PREF0's
   look 'density' on every save of the hue or the labels, so a stored 'density' without `lookHand` is read as no choice; any other stored look
   could only be a hand's and wins */
/* 021 R4 · the kit's jsonStore, versioned `{ v: 1, …prefs }`; an older unversioned record is read once and written back upgraded */
const pickerStore = jsonStore(PREF_KEY);
const readPrefs = () => { const r = pickerStore.get(), o = r && typeof r === 'object' ? r : {}, p = Object.assign({}, PREF0, o); delete p.v;
  if (r && o.v !== 1) pickerStore.set({ v: 1, ...o });
  if (p.look === 'density' && !p.lookHand) delete p.look; return p; };
/** wheelSteps(node, step) — iteration 016 L2 (Josh: "a mouse wheel over the LOOK picker cycles the looks one notch each"): one step per detent — a
    line or page wheel one per event, a pixel wheel's notch (one event of 50 px or more: Chromium's 100, Windows' 120) one per event, a trackpad's
    trickle one per 100 px gathered */
function wheelSteps(node, step) {
  let acc = 0;
  node.addEventListener('wheel', (e) => {
    const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX; if (!d) return;
    e.preventDefault(); e.stopPropagation();
    if (e.deltaMode || Math.abs(d) >= 50) { acc = 0; step(Math.sign(d)); return; }
    if (Math.sign(acc) !== Math.sign(d)) acc = 0;
    acc += d; if (Math.abs(acc) >= 100) { step(Math.sign(acc)); acc = 0; }
  }, { passive: false });
}
const writePrefs = (p) => pickerStore.set({ v: 1, ...p });   // a blocked profile keeps it for the visit (jsonStore swallows the refusal)
/** an iteration 012 icon, a glyph of the one table (021 V2: lab/icons.js, an SVG in the `.mm-ico` seat that sizes it; the section ids keep their
 *  saved names, the glyphs their meaning) */
const ICON = { atomic: 'atom', molecular: 'molecule', 'arrow-left': 'arrowLeft', 'arrow-right': 'arrowRight' };
const icon = (host, name) => { const i = el('i', 'mm-ico', host); setGlyph(i, ICON[name] || name); i.setAttribute('aria-hidden', 'true'); return i; };
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
        const s = await V.installStatus(v.id).catch(() => null); if (!s || s.state !== 'installed') continue;
        const idx = await V.index(v.id).catch(() => null);
        for (const m of (idx && idx.molecules) || []) out.push({ id: m.id, name: m.name, formula: m.formula, vol: v.id, m, v });
      }
    } catch (_) { /* no shelf: the catalogue alone */ }
    return out;
  })();
  return volRowsP;
}
const plain = (s) => String(s || '').replace(/<\/?m>/g, '').replace(/[_{}\\]/g, '').toLowerCase();
/** suggest(query, n) → [{ id, name, formula, vol, pic }] — at most n molecules for a typed query: prefix matches (name, formula, id) first */
async function suggest(query, n = 6) {
  const q = plain(query).trim(); if (!q) return [];
  const cat = CHEM_PRESETS.filter((p) => !p.disabled && !atomZ(p.formula)).map((p) => ({ id: p.id, name: p.name, formula: p.formula, vol: null, pic: './img/menu/' + p.id + '.webp' }));
  const rows = cat.concat((await volumeRows()).map((r) => ({ id: r.id, name: r.name, formula: r.formula, vol: r.vol, m: r.m, v: r.v })));
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
  const root = el('div', 'lw-menu', document.body); root.id = 'lwMenu'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'the main menu');
  const top = el('div', 'mm-top', root);
  const logo = el('div', 'mm-logo', top);
  /* 034 M1 · THE LANDING FACE (Josh 11-02: "When users open up the app, they will be met with the lambdawaves logo in large with two boxes that
     says, 'Tutorial', and 'Library'"): over the decks, the logo large, TUTORIAL · LIBRARY (two album-art doors in THE CARD'S LIGHT) and the
     quiet way into the lab.  It is the home: every open lands here (the boot after the notice, ?menu=1, L, WINDOW › MAIN MENU) except the CSB's
     LIBRARY seat, which opens the decks; the head's ⌂ comes back here.  LIBRARY opens the decks on MOLECULAR (ATOMIC above, EXPANSIONS below),
     TUTORIAL the hero deck (M3).  While it is up the head, the decks and the caption are kept laid out but hidden and inert. */
  const face = el('div', 'mm-face', root); face.hidden = true;
  const faceLogo = el('div', 'mm-face-logo', face), doors = el('div', 'mm-doors', face);
  fetch('./img/lambdawaves-logo.svg').then((r) => r.text()).then((t) => { for (const host of [logo, faceLogo]) { host.innerHTML = t.replace(/fill="#f0f4f7"/g, 'fill="currentColor"'); const s = host.querySelector('svg'); if (s) { s.setAttribute('aria-label', 'λWAVES'); s.setAttribute('role', 'img'); } } }).catch(() => { logo.textContent = faceLogo.textContent = 'λWAVES'; });
  /* iteration 015 M1 · THE HEAD (Josh: "Logo (a little bit bigger), Atomic, molecular, etc. Row, and then Home Folder, and Hue. Add a 4th
     button"): the logo, the tabs, then four round buttons — RETURN HOME (the lab), FOLDERS (the projects and the demos), THE HUE ring (a dial
     dressed as a circle: a vertical drag, the wheel or ↑ ↓ turn the molecules' pictures round the colour wheel, a double-click puts it back at
     0; the Picker's PREFERENCE, never a project's or a link's) and LOOK, which opens THE LOOK DROP below */
  const tabs = el('div', 'mm-tabs', top), pill = el('i', 'mm-pill', tabs);
  const nav = el('div', 'mm-nav', top);
  const navBtn = (name, label, go) => { const b = el('button', 'mm-navb', nav); b.type = 'button'; icon(b, name); b.setAttribute('aria-label', label); b.title = label; b.addEventListener('click', go); return b; };
  navBtn('home', 'Main menu — tutorial and library', () => showFace()).dataset.nav = 'home';   // 034 M1: ⌂ is the face; ENTER THE LAB is on it
  navBtn('folders', 'Folders — your projects and the demos', () => (at === 'folders' ? showDecks() : showFolders())).dataset.nav = 'folders';
  /* the face's two doors (album art in THE CARD'S LIGHT, the λWAVES palette) and the way into the lab */
  const door = (id, word, glyph, k, go) => { const b = el('button', 'mm-door mm-holo', doors); b.type = 'button'; b.dataset.door = id; b.setAttribute('aria-label', word); b.style.setProperty('--k', String(k)); b.style.setProperty('--i', String(k));
    el('span', 'mm-halo', b); const lit = el('span', 'mm-lit mm-art-plain', b); el('span', 'mm-foil', lit); el('span', 'mm-rim', b);
    const w = el('span', 'mm-door-word', lit); icon(w, glyph); el('b', '', w, word); b.addEventListener('click', go); return b; };
  const doorBtns = [door('tutorial', 'TUTORIAL', 'film', 0, () => showTutorial()), door('library', 'LIBRARY', 'library', 1, () => showDecks('molecular'))];
  const labB = el('button', 'mm-face-lab', face, 'ENTER THE LAB'); labB.type = 'button'; labB.addEventListener('click', () => close());
  const hue = el('button', 'mm-navb mm-hue', nav); hue.type = 'button'; hue.setAttribute('role', 'slider'); hue.setAttribute('aria-label', 'molecule picture hue');
  hue.setAttribute('aria-valuemin', '0'); hue.setAttribute('aria-valuemax', '359'); setGlyph(el('i', 'mm-hue-ring', hue), 'hueRing');
  /* 032 (Josh 11-01: "a light and dark toggle in the picker in between the hue knob and thumbnail switcher"): THEME, the action's own
     (lab/actions.js `theme`, the transport's sun ↔ moon) — the sun in LIGHT, the moon in DARK (skin.css) */
  const themeB = el('button', 'mm-navb mm-themeb', nav); themeB.type = 'button'; themeB.title = 'Light or dark — the theme'; themeB.setAttribute('aria-label', themeB.title);
  icon(themeB, 'sun').classList.add('gly-sun'); icon(themeB, 'moon').classList.add('gly-moon'); themeB.addEventListener('click', () => app.sh.ACTIONS.run('theme'));
  const lookB = el('button', 'mm-navb mm-lookb', nav); lookB.type = 'button'; lookB.setAttribute('aria-haspopup', 'true'); lookB.setAttribute('aria-expanded', 'false');
  const lookG = el('b', 'mm-lookg', lookB);
  const scroller = el('div', 'mm-scroll', root), caption = el('div', 'mm-caption', root);
  /* iteration 015 M4 · FOLDERS IN THE MENU (Josh: "Have a main menu, full screen mode of the folder. This way, hitting folder does not take it to the
     stage"): THE THIRD VIEW — the kit's gallery mounted in the Picker's own page (`.mm-folders`, the decks' seat), a second live view of FOLDERS'
     one library as the `projects` rack card is: DEMOS first while ROOT holds nothing of the reader's, the toolbar SAVE · PROJECT · DUPLICATE · NEW,
     RESTORE THE DEMOS in the foot, sized to the page.  The Picker stays up; an OPEN the adapter took closes it (projects.js `landed` → cover()).
     O, WINDOW › FOLDERS and the stage keep the floating window.  A tab returns to the decks. */
  const foldersEl = el('div', 'mm-folders', root); foldersEl.hidden = true; foldersEl.setAttribute('role', 'region'); foldersEl.setAttribute('aria-label', 'Folders');
  let foldersView = null;
  const tutEl = el('div', 'mm-tut', root); tutEl.hidden = true; tutEl.setAttribute('role', 'region'); tutEl.setAttribute('aria-label', 'Tutorial');
  /* 034 M1 · THE VIEWS: the face (over the decks, which stay laid out under it), the decks, FOLDERS' gallery and the tutorial (each in the
     decks' seat); one at a time, one hero playing at most, and leaving a view puts its hero to rest */
  let at = 'decks', firstDeal = false;   // firstDeal: a first run's LIBRARY deals MOLECULAR's first page in THE ENTRANCE (iteration 012 L3)
  function showView(name) {
    if (name === at) return false;
    const was = at; at = name; closeDrop(); restHero();
    face.hidden = name !== 'face'; root.classList.toggle('at-face', name === 'face');
    for (const e of [top, scroller, caption]) e.inert = name === 'face';
    const away = name === 'folders' || name === 'tutorial';
    foldersEl.hidden = name !== 'folders'; tutEl.hidden = name !== 'tutorial'; scroller.hidden = caption.hidden = away;
    if (away) { root.dataset.sec = name; for (const x of sections) x.b.classList.remove('on'); pill.style.setProperty('--pw', '0px'); }
    else if (was === 'folders' || was === 'tutorial') { const s = current; current = null; show(s); s.sec.scrollIntoView({ block: 'start' }); }
    return true;
  }
  function showFace() {
    showView('face'); face.classList.remove('in'); void face.offsetWidth; face.classList.add('in');
    doorBtns[0].focus({ preventScroll: true });
  }
  /** the decks, on a section when one is named (the face's LIBRARY: MOLECULAR) */
  function showDecks(id) {
    const fromFace = at === 'face'; showView('decks');
    const s = id && sections.find((x) => x.id === id);
    if (s) { s.sec.scrollIntoView({ block: 'start' }); show(s); }
    if (!fromFace) return;
    for (const [i, e] of [top, scroller].entries()) animate(e, [{ opacity: 0, translate: '0 14px' }], 420, i * 80);
    if (current.id === 'molecular') { if (firstDeal) { firstDeal = false; entrance(molDeck.tiles); } else enterTiles(molDeck.tiles); }
  }
  function showFolders() {
    const P = app.sh.layout && app.sh.layout.projects; if (!P) return;
    showView('folders');
    if (!foldersView) {   // sized to the page once, at its first showing: the columns as the decks', the rows from the height
      const rackW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rack-w')) || 300;
      const W = Math.min(1500, foldersEl.clientWidth - 48, innerWidth >= 1100 ? innerWidth - 2 * (rackW + 20) : Infinity), H = foldersEl.clientHeight - 150, cols = Math.max(2, Math.min(8, Math.floor(W / 210))), rows = Math.max(1, Math.min(4, Math.floor(H / ((W / cols) * 0.75 + 56))));
      foldersEl.style.setProperty('--fcols', String(cols)); foldersEl.style.setProperty('--sv-page-rows', String(rows));
      foldersView = P.folders.mountGallery(el('div', 'mm-fgal', foldersEl), { pageSize: cols * rows, prefsKey: 'pickerGallery', factory: () => P.restoreDemos() });
    }
    P.demosFirst(foldersView); foldersView.paint(); animate(foldersEl, [{ opacity: 0, transform: 'translateY(12px) scale(.98)' }], 260);
  }
  caption.setAttribute('aria-live', 'polite');
  /* SHOW LABELS (iteration 012 L1): one subtle seat under the tabs, the atoms' switch on ATOMIC and the molecules' elsewhere; the volume's head has its twin */
  const prefs = readPrefs(), opts = el('div', 'mm-opts', top);
  let labelBtns = [];
  const labelToggle = (host, kind) => { const b = el('button', 'mm-opt', host); b.type = 'button'; b.dataset.labels = kind; icon(b, 'labels'); el('span', '', b, 'SHOW LABELS');
    b.title = kind === 'atomLabels' ? 'the symbol on every element, the name on every state' : 'the formula on every molecule; the name under it on a hover';
    b.addEventListener('click', () => { prefs[kind] = !prefs[kind]; writePrefs(prefs); paintLabels(); }); labelBtns.push(b); paintLabels(); return b; };
  function paintLabels() {
    root.classList.toggle('labels-atom', !!prefs.atomLabels); root.classList.toggle('labels-mol', !!prefs.molLabels);
    labelBtns = labelBtns.filter((b) => b.isConnected);
    for (const b of labelBtns) { const on = !!prefs[b.dataset.labels]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }
  }
  /* iteration 015 M3 · ATOMIC MODE (Josh: "In atomic mode, it should show options to pick 'hyrogen' and the periodic table 'atoms'"): HYDROGEN | ATOMS
     beside SHOW LABELS on the ATOMIC deck — ATOMS the periodic table, HYDROGEN THE 140; the Picker's PREFERENCE `atomic` */
  const amode = el('div', 'mm-amode', opts); amode.setAttribute('role', 'radiogroup'); amode.setAttribute('aria-label', 'the atomic deck');
  const amodeBtns = [['hydrogen', 'HYDROGEN', 'every hydrogen state, n ≤ 7: one label each'], ['atoms', 'ATOMS', 'the periodic table']].map(([id, word, tip]) => {
    const b = el('button', 'mm-opt', amode, word); b.type = 'button'; b.dataset.amode = id; b.title = tip; b.setAttribute('role', 'radio'); b.addEventListener('click', () => setAtomic(id)); return b; });
  const atomOpt = labelToggle(opts, 'atomLabels'), molOpt = labelToggle(opts, 'molLabels');
  let hueShown = 0;   // iteration 014 D2: the CSS sees an unwrapped turn (the nearest twin of the hue to the last one shown), so 359 → 0 glides one degree, never back round the wheel
  /* iteration 014 B4 · 015 M1 · THE PICTURES' STYLE: the Picker's PREFERENCE `look`, turned by THE HUE ring like every picture.  THE LOOK DROP
     (Josh: "a fancy drop down … a 2x3 layout of buttons … center aligned and is allowed to overlap the main menu"): a pane of six tiles under
     the LOOK button, each glyph in the math face and its word the hint — ρ · arg ψ · Im ψ / ● · ⊸ · φ; the Gol note's spring open and 120 ms
     close, ← → ↑ ↓ move, Enter or a press picks and closes, Escape or a press elsewhere closes; the look in use is lit.  The molecular looks
     are greyed on the ATOMIC deck (a lone atom has no bonds, and its potential is a monopole). */
  /* iteration 016 L1 · THE SEVENTH TILE, ATOM LABELS (Josh, call 1: "the element letters drawn over the picture, very small, barely readable,
     overlaps allowed"): Aa in STIX, the density picture with each nucleus' symbol (menu-thumbs --style labels); the drop is two centred rows,
     the wave's three looks over the structure's four (● · ⊸ · φ · Aa) */
  const LOOKS = [['density', 'ρ', 'Density · ρ = |ψ|²'], ['phase', 'arg ψ', 'Phase · arg ψ on the colour wheel'], ['im', 'Im ψ', 'Imaginary part · Im ψ, signed'],
    ['balls', '●', 'Balls · space-filling CPK spheres'], ['sticks', '⊸', 'Sticks · the bonds'], ['esp', 'φ', 'Electrostatic potential · φ on the surface'], ['labels', 'Aa', 'Atom labels · each nucleus\u2019 symbol over ρ']];
  const ATOM_LOOKS = new Set(['density', 'phase', 'im']);
  /** the look a deck draws: the reader's pick, else (016 P3) Im ψ on ATOMIC and arg ψ on a molecule (MOLECULAR, a volume, the search) */
  const lookFor = (atomic) => prefs.look || (atomic ? 'im' : 'phase');
  /* the glyph in the math face; ● and ⊸ are not in the shipped STIX subset (lab/fonts is never touched), so they are drawn, in the ink, at the em */
  const SHAPES = { '●': 'balls', '⊸': 'sticks' };   // 021 V2: the table's `balls` and `sticks` (lab/icons.js)
  const glyph = (host, g) => { host.textContent = ''; if (SHAPES[g]) host.innerHTML = glyphSvg(SHAPES[g], 'gly'); else host.textContent = g; return host; };
  const lookOf = () => { const l = lookFor(false); return l !== 'density' ? l : null; };   // a volume tile's style (V.picture), a molecule's look
  const drop = el('div', 'mm-lookdrop lw-menu glass', root); drop.hidden = true; drop.dataset.mirSurface = 'menu';   // 022 P3: a menu pane drop.setAttribute('role', 'radiogroup'); drop.setAttribute('aria-label', 'picture style');
  const lookTiles = LOOKS.map(([id, glyph_, word], i) => { const b = el('button', 'mm-lk', drop); b.type = 'button'; b.dataset.look = id; b.setAttribute('role', 'radio'); b.style.setProperty('--i', String(i));
    b.style.gridRow = i < 3 ? '1' : '2'; b.style.gridColumn = (i < 3 ? 2 + 2 * i : 1 + 2 * (i - 3)) + ' / span 2';   // L1: the bricks, each row centred
    glyph(el('b', 'mm-lk-g', b), glyph_); b.addEventListener('click', () => { if (b.getAttribute('aria-disabled') === 'true') return; setLook(id); closeDrop(true); }); return b; });
  function paintLooks() {
    const atomic = current && current.id === 'atomic', cur = lookFor(atomic);
    for (const b of lookTiles) { const id = b.dataset.look, on = id === cur, off = atomic && !ATOM_LOOKS.has(id), word = LOOKS.find((x) => x[0] === id)[2];
      b.classList.toggle('on', on); b.classList.toggle('off', off); b.setAttribute('aria-checked', String(on)); b.setAttribute('aria-disabled', String(off));
      b.title = off ? word.split(' · ')[0] + ': none for a lone atom' : word; b.setAttribute('aria-label', b.title); b.tabIndex = on ? 0 : -1; }
    const L = LOOKS.find((x) => x[0] === cur) || LOOKS[0]; glyph(lookG, L[1]); lookB.title = 'Look of the pictures · ' + L[2]; lookB.setAttribute('aria-label', lookB.title);
  }
  function setLook(id) {
    if (prefs.look === id) return; prefs.look = id; prefs.lookHand = true; writePrefs(prefs); paintLooks();   // P3: the first write is the reader's
    for (const i of root.querySelectorAll('img.mm-pic[data-mol]')) V.picture(i.dataset.vol, i.dataset.mol, lookOf()).then((u) => { if (u) i.src = u; }, () => {});
    for (const i of root.querySelectorAll('img.mm-pic[data-menu]')) { const { src } = picOf(i.dataset.menu); if (i.getAttribute('src') !== src) i.src = src; }   // M2: every deck of ours
  }
  let dropT = 0;
  const outside = (e) => { if (!drop.contains(e.target) && !lookB.contains(e.target)) closeDrop(); };
  function openDrop() {
    if (!drop.hidden && !drop.classList.contains('out')) return;
    clearTimeout(dropT); paintLooks(); drop.classList.remove('out'); drop.hidden = false;
    const r = lookB.getBoundingClientRect(); drop.style.left = Math.round(r.left + r.width / 2) + 'px'; drop.style.top = Math.round(r.bottom + 10) + 'px';
    drop.classList.remove('in'); void drop.offsetWidth; drop.classList.add('in'); lookB.setAttribute('aria-expanded', 'true');
    addEventListener('pointerdown', outside, true);
    (lookTiles.find((b) => b.classList.contains('on')) || lookTiles[0]).focus({ preventScroll: true });
  }
  function closeDrop(refocus) {
    if (drop.hidden) return; removeEventListener('pointerdown', outside, true); lookB.setAttribute('aria-expanded', 'false');
    drop.classList.remove('in'); drop.classList.add('out'); clearTimeout(dropT);
    dropT = setTimeout(() => { drop.hidden = true; drop.classList.remove('out'); }, RM.matches ? 0 : 120);
    if (refocus) lookB.focus({ preventScroll: true });
  }
  lookB.addEventListener('click', () => (drop.hidden || drop.classList.contains('out') ? openDrop() : closeDrop()));
  drop.addEventListener('keydown', (e) => {
    const k = lookTiles.indexOf(document.activeElement), d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 3, ArrowUp: -3 }[e.key];
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeDrop(true); return; }
    if (d && k >= 0) { e.preventDefault(); e.stopPropagation(); const N = lookTiles.length, j = Math.abs(d) === 1 ? (k + d + N) % N : d > 0 ? (k < 3 ? k + 3 : k) : (k >= 3 ? Math.min(2, k - 3) : k);   // L1: ↓ to the brick under, ↑ to the one over
      const n = lookTiles[j]; n.focus({ preventScroll: true }); if (n.getAttribute('aria-disabled') !== 'true') setLook(n.dataset.look); }
  });
  /* L2: the wheel over the drop or the LOOK button steps one look per detent, over the greyed ones, round the seven */
  const wheelLook = (d) => { const live = lookTiles.filter((b) => b.getAttribute('aria-disabled') !== 'true'), k = live.findIndex((b) => b.dataset.look === lookFor(current && current.id === 'atomic'));
    const n = live[(k + d + live.length) % live.length]; if (!n) return; setLook(n.dataset.look); if (!drop.hidden) n.focus({ preventScroll: true }); };
  wheelSteps(drop, wheelLook); wheelSteps(lookB, (d) => { paintLooks(); wheelLook(d); });
  const setHue = (deg, keep = true) => {
    prefs.hue = ((Math.round(deg) % 360) + 360) % 360; hueShown += ((prefs.hue - hueShown) % 360 + 540) % 360 - 180;
    document.documentElement.style.setProperty('--mol-hue', hueShown + 'deg');   // iteration 013 P2: on the page's root, so MOLECULES' picture (.mol-thumb) turns with the Picker's
    hue.setAttribute('aria-valuenow', String(prefs.hue)); hue.title = 'Hue of the pictures · ' + prefs.hue + '° (double-click: 0)';
    if (keep) writePrefs(prefs);
  };
  setHue(+prefs.hue || 0, false);
  { let y0 = null, h0 = 0;   // the ONE KNOB LAW's vertical drag: a full turn in 360 px, ⅛ with Shift
    hue.addEventListener('pointerdown', (e) => { if (e.button) return; y0 = e.clientY; h0 = prefs.hue; hue.setPointerCapture(e.pointerId); hue.classList.add('drag'); e.preventDefault(); });   // M6: the colours while the hand turns it
    hue.addEventListener('pointermove', (e) => { if (y0 != null) setHue(h0 + (y0 - e.clientY) * (e.shiftKey ? 0.125 : 1)); });
    const end = () => { y0 = null; hue.classList.remove('drag'); }; hue.addEventListener('pointerup', end); hue.addEventListener('pointercancel', end);
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
  /* iteration 015 M2 · THE LOOK EVERYWHERE: a picture of ours is named by its kind and base (`mol:H2O`, `el:Fe:3d_2`, `orb:3d_2`) and drawn in the
     look in use — a catalogue molecule's `<id>.<look>.webp`, an element's or a hydrogen state's `orb-<nl>_<m>.<look>.webp` for ρ and arg ψ (an
     element's picture IS its block orbital's, so the two decks share one file), else the one picture; a missing variant falls back to it */
  const MENU = './img/menu/';
  const picOf = (ref, look) => {
    const [kind, a, b] = ref.split(':'); if (look === undefined) look = lookFor(kind !== 'mol');   // P3: Im ψ for an element or a state, arg ψ for a molecule
    if (kind === 'mol') return { src: look && look !== 'density' ? MENU + a + '.' + look + '.webp' : MENU + a + '.webp', fb: MENU + a + '.webp' };
    const key = kind === 'el' ? b : a, fb = kind === 'el' ? MENU + 'el-' + a + '.webp' : MENU + 'orb-' + key + '.webp';
    return { src: look === 'density' || look === 'phase' ? MENU + 'orb-' + key + '.' + look + '.webp' : fb, fb };
  };
  const hold = (host, i) => { if (i) i.remove(); if (!host.querySelector('.mm-ph')) el('b', 'mm-ph', host, (host.querySelector('.mm-lbl') || {}).textContent || '');  };   // A3: no picture — the formula holds the square
  const pic = (host, src, ref) => { const i = el('img', 'mm-pic', host); i.alt = ''; i.decoding = 'async'; i.loading = hot ? 'eager' : 'lazy'; if (hot) i.fetchPriority = 'high'; i.draggable = false;
    let fb = null; if (ref) { i.dataset.menu = ref; ({ src, fb } = picOf(ref)); }
    i.addEventListener('error', () => { const f = i.dataset.menu ? picOf(i.dataset.menu).fb : null; if (f && i.getAttribute('src') !== f) i.src = f; else hold(host, i); });
    if (src) { develop(i); i.addEventListener('load', () => { const u = i.getAttribute('src'); if (u && u.startsWith(MENU)) keepData(u); }); i.src = src; } return i; };
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
  function deck(host, room = 10) {   // room: the desktop gap between tiles (029 Q: a volume's deck breathes at 16)
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
      const narrow = innerWidth < 700, gap = narrow ? 6 : room;
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
    const d = { wrap, foot, set(l, m) { list = l; make = m; page = 0; per = 1; laid = ''; lay(); }, lay, pageTo, get tiles() { return pages[page] ? [...pages[page].children] : []; }, get count() { return list.length; } };
    decks.push(d); return d;
  }

  /* ── the sections and the tabs (R9: the sliding pill, the approach accent) ── */
  /* 034 M2 (Josh 11-02: "Rename 'Library' section of the picker to be 'Expansions'"): the third deck reads EXPANSIONS; its id, its icon and its
     CSS hooks stay `library`, and the CSB's seat still reads LIBRARY */
  const sections = [['atomic', 'ATOMIC'], ['molecular', 'MOLECULAR'], ['library', 'EXPANSIONS']].map(([id, label]) => {
    const sec = el('section', 'mm-sec mm-' + id, scroller), b = el('button', 'mm-tab', tabs); b.type = 'button'; icon(b, id); el('span', '', b, label);   // iteration 012 L2: I1's icon left of the word
    b.addEventListener('click', () => { showDecks(); if (id === 'library' && current.id === 'library') library.home(); sec.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }); });
    return { id, sec, b };
  });
  const movePill = (b) => { pill.style.setProperty('--px', b.offsetLeft - 10 + 'px'); pill.style.setProperty('--pw', b.offsetWidth + 20 + 'px'); };
  pointerFrame(root, (p) => { for (const { b } of sections) { const r = b.getBoundingClientRect(); b.style.setProperty('--approach', p ? clamp((76 - Math.hypot(p.x - r.left - r.width / 2, p.y - r.top - r.height / 2)) / 58).toFixed(3) : '0'); } });
  tiltPictures(root); holoCards(root);   // 032: the cards' album-art light (a volume's portrait, the tip jar's QR)

  /* ── ATOMIC: 118 squares on the 18-column table, the f rows under it ── */
  const table = el('div', 'mm-table', sections[0].sec);
  for (let Z = 1; Z <= 118; Z++) {
    const [r, c] = seatOf(Z), v = valenceOf(Z), a = ATOMS.find((x) => x.Z === Z), live = !!a, sym = SYM[Z - 1];
    const t = tile(table, 'mm-el', { name: NAMES[Z - 1], sub: v.label, math: true, under: false, note: live ? '' : 'past krypton: not in the ATOM system yet' }, () => goAtom(Z), !live);
    t.style.gridRow = String(r); t.style.gridColumn = String(c);
    pic(t, null, 'el:' + sym + ':' + v.nl + '_' + v.m);   // the block's orbital (011 Q3b: the differentiating subshell — Fe 3d, Ce 4f; the pure orbital of its (n, l, m), cut to show its layers)
    el('b', 'mm-sym', t, sym);   // M3: the symbol alone (Z left the tile: "it shouldn't show the 'z' number")
  }
  /* ── HYDROGEN: THE 140 (iteration 015 M3) — a tile per (n, l, m) label in SPECTRUM's order (hydrogen.js BASIS: n ≤ 6's 91, then n = 7's 49), paged
     like the molecular deck; the label is the state's name in STIX, `3p` large and the m its subscript (names.js atomForms); the picture is the
     pure orbital in the look in use (M2's `orb-<nl>_<m>`).  A press opens HYDROGEN — MOLECULES off, SPECTRUM's system HYDROGEN — with THAT label
     alone populated, through loadPreset's road as a hand's preset (one history row, THE FADE says its name). ── */
  const SUBN = '₀₁₂₃₄₅₆₇₈₉', subOf = (m) => (m < 0 ? '₋' : '') + String(Math.abs(m)).split('').map((d) => SUBN[+d]).join('');
  /* iteration 016 L3 · THE 140 ON ONE PAGE (Josh, call 15: "on ONE page, each the size of a periodic-table cell"): one grid of fourteen columns,
     the periodic cells' --t, no pages and no arrows (14 × 10 at 1600 px); built at its first showing, its pictures lazy */
  const hTable = el('div', 'mm-table mm-htable', sections[0].sec); hTable.setAttribute('role', 'group'); hTable.setAttribute('aria-label', 'every hydrogen state, n ≤ 7');
  let hSet = false;
  const hTile = (b, host) => {
    const nl = b.n + L_LETTERS[b.l], info = { formula: nl + subOf(b.m), sub: `n ${b.n} · ℓ ${b.l} · m ${b.m < 0 ? '−' + -b.m : b.m}`, math: true, under: false };
    const t = tile(host, 'mm-orb', info, () => goHydrogen(b)); pic(t, null, 'orb:' + nl + '_' + b.m);
    const lb = el('b', 'mm-hl', t, nl); el('sub', '', lb, b.m < 0 ? '−' + -b.m : String(b.m)); return t;
  };
  function setAtomic(id, keep = true) {
    prefs.atomic = id === 'hydrogen' ? 'hydrogen' : 'atoms'; if (keep) writePrefs(prefs);
    const h = prefs.atomic === 'hydrogen'; table.hidden = h; hTable.hidden = !h;
    for (const b of amodeBtns) { const on = b.dataset.amode === prefs.atomic; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); }
    if (h && !hSet) { hSet = true; for (const b of BASIS) hTile(b, hTable); }
    if (keep && !root.hidden) enterTiles(h ? [...hTable.children] : [...table.children], (t, i) => (t.classList.contains('mm-el') ? (+t.style.gridColumn || 0) + (+t.style.gridRow || 0) : i % 14 + Math.floor(i / 14)));
  }
  setAtomic(prefs.atomic, false);
  /* ── MOLECULAR: MOLECULES ONLY (iteration 011 Q4, Josh: "remove those 'lattice' and 'heavy' and other downloadable stuff from the molecular
     system, let that be it's own UI system for handling saved/stored/unsaved molecules in the library section").  The catalogue in its
     SECTIONS' order (lab/molecules.js), within a section the dropdown's order (its groups); no heading tile — a heading broke the picture grid,
     so the section rides in the caption's line under a hover instead.  A record-only molecule not yet on this device keeps its picture and
     wears the kit's download glyph (row V's law, the card's glyph); its press opens it, which fetches that one record (chemview's record road).
     A one-atom entry is never listed here: an atom is the ATOMIC table's.  032 (Josh 11-01: "merge all of those to the default molecule
     library … the volumes are the main display"): ORGANIC · BIO · LATTICE · HEAVY are this deck's like every section — THE SECTION INSTALL's
     cards left the LIBRARY; a record downloads on its first press and stays (library.js fetchRecord); MOLECULES' KEEP still keeps a section. ── */
  const GROUP_AT = new Map([...GROUPS, RECORD_GROUP].map((g, i) => [g.id, i])), rank = (p) => (GROUP_AT.has(p.group) ? GROUP_AT.get(p.group) : GROUP_AT.size);
  const secRows = (sec) => CHEM_PRESETS.filter((p) => p.section === sec && !atomZ(p.formula)).sort((a, b) => rank(a) - rank(b));
  const secs = new Map(SECTIONS.map((sec) => { const rows = secRows(sec), recs = rows.flatMap((p) => Object.values(p.records || {}));
    return [sec, { rows, recs }]; }));
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
    pic(t, null, 'mol:' + m.id); el('b', 'mm-lbl', t, info.formula);
    if (!m.disabled && dlRec(m)) { const g = el('i', 'mm-dl', t); icon(g, 'download'); g.title = 'not on this device'; g.hidden = true; away.set(m.id, { t, g, info }); paintAway(m); }
  });

  /** the install's eye: DOWNLOAD while there is something to fetch, TRASH once it is all here (iteration 012 L2, I1's icons) */
  const eye = (i, here) => setGlyph(i, here ? 'trash' : 'download');
  /* the store read each time the MOLECULAR deck or the LIBRARY comes into view (a press, MOLECULES or the browser may have changed it) */
  async function readStore() {
    for (const S of secs.values()) for (const r of S.recs) have.set(r.hash, await installed(r.hash).catch(() => false));
    for (const S of secs.values()) for (const m of S.rows) paintAway(m);
    library.paintDevice();
  }
  /* ── 032 · 034 THE ART OF A CARD: artOf(art, dir, id, themes) puts a card's still in the theme in use into its art (both stills are in the page,
     the CSS shows the theme's; a lazy picture it hides is never asked for) and answers its hero — { play, stop, toggle } — or null and the
     λWAVES palette when `themes` names none; a theme the row does not name shows the other's files (one clip serves both).  The hero is fetched
     on its first play and faded in once it plays; ONE HERO PLAYS AT A TIME in the whole Picker (a play rests the last), never under reduced
     motion.  bindHero: a fine mouse's hover or a key's focus plays it, leaving rests it. ── */
  const theme = () => (document.body.dataset.theme === 'light' ? 'light' : 'dark');
  let liveHero = null; const restHero = () => { if (liveHero) liveHero.stop(); };
  function artOf(art, dir, id, themes) {
    const has = (themes || '').split(' ').filter(Boolean), pick = (th) => (has.includes(th) ? th : has[0]);
    if (!has.length) { art.classList.add('mm-art-plain'); return null; }
    for (const th of ['dark', 'light']) {
      const i = el('img', 'mm-art-still', art); i.alt = ''; i.dataset.theme = th; i.decoding = 'async'; i.loading = 'lazy'; i.draggable = false;
      i.addEventListener('load', () => keepData(i.src), { once: true }); i.src = dir + id + '.' + pick(th) + '.webp';
    }
    let vid = null, want = false;
    const h = {
      play() {
        if (still()) return; if (liveHero && liveHero !== h) liveHero.stop(); liveHero = h; want = true;
        if (!vid) { vid = el('video', 'mm-art-hero', art); vid.muted = vid.defaultMuted = vid.loop = vid.playsInline = true; vid.preload = 'auto'; vid.tabIndex = -1; vid.setAttribute('aria-hidden', 'true');
          vid.addEventListener('playing', () => { if (want) vid.classList.add('on'); }); vid.addEventListener('error', () => { vid.remove(); vid = null; }, { once: true }); }   // no hero: the still stays
        const src = dir + id + '.' + pick(theme()) + '.mp4'; if (vid.getAttribute('src') !== src) vid.src = src;
        const r = vid.play(); if (r && r.catch) r.catch(() => {});
      },
      stop() { want = false; if (liveHero === h) liveHero = null; if (vid) { vid.pause(); vid.classList.remove('on'); } },
      toggle() { if (want) h.stop(); else h.play(); },
    };
    return h;
  }
  const bindHero = (o, hero) => {
    o.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hero.play(); }); o.addEventListener('pointerleave', hero.stop);
    o.addEventListener('focus', () => { if (o.matches(':focus-visible')) hero.play(); }); o.addEventListener('blur', hero.stop);
  };

  /* ── 034 M3 · THE TUTORIAL DECK (Josh 11-02: "If clicking tutorial, it opens a 'hero' video collection you can scroll through. Kind of like how
     the current landing page in the magic commons site looks like … although much more packed"): a grid of 9:16 cards in THE CARD'S LIGHT, one
     per TUTORIAL row in its order, the number and the title at the art's foot and the caption under it ("caption to come" until Josh's words);
     the hero loops while the mouse is on it or a key's focus (the landing page's player: looping, one at a time), a press plays or pauses it
     (a touch's way), as many columns as fit off the racks and two on a phone.  Built at its first showing. ── */
  let tutBuilt = false;
  function showTutorial() {
    showView('tutorial');
    if (!tutBuilt) {
      tutBuilt = true;
      const head = el('div', 'mm-tut-head', tutEl); icon(head, 'film'); el('b', '', head, 'TUTORIAL');
      const grid = el('div', 'mm-tgrid', tutEl);
      TUTORIAL.forEach((t, k) => {
        const c = el('div', 'mm-tcard', grid), o = el('button', 'mm-tcard-open mm-holo', c); o.type = 'button'; o.style.setProperty('--k', String(k % 2));
        const num = String(k + 1).padStart(2, '0'); o.setAttribute('aria-label', num + ' · ' + t.title + (t.caption ? ' — ' + t.caption : ''));   // the words in aria only: no hover hint (034 F1's law)
        el('span', 'mm-halo', o); const art = el('span', 'mm-lit', o); el('span', 'mm-rim', o);
        const hero = artOf(art, './img/menu/tut/', t.id, t.themes); el('span', 'mm-foil', art);
        const foot = el('span', 'mm-art-foot', art); el('i', 'mm-tnum', foot, num); el('b', 'mm-ttitle', foot, t.title);
        el('p', 'mm-tcap' + (t.caption ? '' : ' soon'), c, t.caption || 'caption to come');
        if (hero) { bindHero(o, hero); o.addEventListener('click', hero.toggle); }
      });
    }
    animate(tutEl, [{ opacity: 0, transform: 'translateY(12px) scale(.98)' }], 260);
    enterTiles([...tutEl.querySelectorAll('.mm-tcard')].slice(0, 12));
    const f = tutEl.querySelector('.mm-tcard-open'); if (f) f.focus({ preventScroll: true });
  }

  /* ── LIBRARY: the shelf of volumes; a volume's molecules by their tags ── */
  const library = (() => {
    const sec = sections[2].sec, shelfEl = el('div', 'mm-shelf', sec), devEl = el('div', 'mm-dev', sec), view = el('div', 'mm-volview', sec); view.hidden = true;
    /* iteration 011 Q4: under the shelf, THIS DEVICE (the store's use and quota; iteration 012 L1 cut the heading, the kept counts and the
       persisted line); it stands aside while a volume is open */
    devEl.hidden = true;
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
    const vhead = el('div', 'mm-vhead', view), vdeck = deck(view, 16);
    let woke = false, cur = null, vols = [], mols = [], byId = new Map(), on = new Set(), query = '', tagsEl = null, countEl = null, vq = null, sortBtns = [];
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
      /* 030 (Josh 10-31: "it's making me download the thing even if it's on the system"): a volume that installs from the site and also has an
         archive takes its .lwv from disk too — OPEN FILE… under INSTALL (and a drop on the card); installFile checks every byte against the shelf. */
      const alt = !fromFile && v.archive ? el('button', 'mm-install-alt', host, 'OPEN FILE…') : null, altPick = alt ? el('input', '', host) : null;
      if (alt) { alt.type = 'button'; alt.title = 'Have the .lwv? Open it instead of downloading';
        altPick.type = 'file'; altPick.accept = '.lwv'; altPick.hidden = true; altPick.addEventListener('change', () => { const f = altPick.files && altPick.files[0]; altPick.value = ''; if (f) run(f); });
        alt.addEventListener('click', (e) => { e.stopPropagation(); if (!ctl) altPick.click(); }); }
      let ctl = null; const arm = armer(b, () => paint());
      const paint = async () => {
        const s = await V.installStatus(v.id).catch(() => ({ state: 'absent', n: 0, N: v.count || 0 }));
        const est = fromFile && s.state !== 'installed' ? await navigator.storage?.estimate?.().catch(() => null) : null;
        const tight = est && est.quota && est.quota - (est.usage || 0) < size ? ' · TOO BIG FOR THIS DEVICE' : '';
        b.dataset.state = s.state; if (alt) alt.hidden = s.state === 'installed'; ring.set(s.N ? s.n / s.N : 0, s.state === 'installed' ? 'done' : 'idle'); eye(ico, s.state === 'installed');
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
        const go = () => { if (pick) pick.click(); else run(null); };
        if (TIP_URL && (pick || !tipAsked)) { if (!pick) tipAsked = true; tipSheet(go, !pick); return; }   // 030 THE TIP JAR: a network install is asked once a session; a file volume every press (its file is the tip's thank-you)
        go();
      });
      paint(); return { paint, run };
    }
    /* 030 THE TIP JAR: the colorful QR (img/menu/tip-qr.svg; 032: λWAVES' teal, violet and lilac, no outer glow, THE CARD'S LIGHT on a hover) in a turning ring — a card on the shelf, and once a session a sheet before an install
       with ♥ TIP and NO THANKS; both continue. A file volume (OPEN FILE…) asks on every press: its file is the tip jar's thank-you (Josh
       10-31, B), so the words are THE FILE IS A THANK-YOU · ♥ TIP · I HAVE THE FILE, and its chooser opens on I HAVE THE FILE, Escape or a
       press outside (after ♥ TIP it waits for its own press: the new tab took the gesture). The Drive link is never in the app. */
    let tipAsked = false;
    const tipArt = (host) => { const f = el('span', 'mm-tip-art mm-holo', host); el('span', 'mm-halo', f); const lit = el('span', 'mm-lit', f), img = el('img', '', lit); el('span', 'mm-foil', lit); el('span', 'mm-rim', f);   // 032: the album art's light
      img.src = 'img/menu/tip-qr.svg'; img.alt = 'QR code: the tip jar'; img.width = img.height = 196; img.decoding = 'async'; img.draggable = false; return f; };
    const tipLink = (a) => { a.href = TIP_URL; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; };
    function tipCard() { const c = tipLink(el('a', 'mm-vol mm-tip', shelfEl)); c.title = 'Everything here is free. A tip keeps it growing.'; tipArt(c); el('span', 'mm-tip-word', c, '♥ TIP JAR'); }
    function tipSheet(go, follow) {
      const back = el('div', 'mm-tip-back', root), s = el('div', 'mm-tip-sheet glass', back); s.dataset.mirSurface = 'menu';
      s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-label', 'tip jar');
      tipArt(s); el('span', 'mm-tip-free', s, follow ? 'FREE EITHER WAY' : 'THE FILE IS A THANK-YOU');   // Josh 10-31 (B): a file volume comes with the tip jar's thank-you message
      const row = el('div', 'mm-tip-row', s), yes = tipLink(el('a', 'mm-tip-yes', row, '♥ TIP')), no = el('button', 'mm-tip-no', row, follow ? 'NO THANKS' : 'I HAVE THE FILE'); no.type = 'button';
      yes.title = follow ? 'Opens the tip jar in a new tab; the install goes on' : 'Opens the tip jar; its thank-you message has the file'; no.title = follow ? 'Go on without a tip' : 'Open the file you have';
      const key = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(true); } };
      const done = (cont) => { window.removeEventListener('keydown', key, true); back.remove(); if (cont) go(); };
      yes.addEventListener('click', () => done(follow)); no.addEventListener('click', () => done(true));
      back.addEventListener('click', (e) => { if (e.target === back) done(true); });
      window.addEventListener('keydown', key, true); no.focus();
    }
    /* 032 THE PORTRAIT SHELF (Josh 11-01: "portrait oriented cards with images … 9:16 … the 'Vol. X' text towards the center bottom … a hero
       animation for each one that activates during mouseover … light mode and dark mode versions"): the card is album art — a 9:16 `.mm-holo`
       (THE CARD'S LIGHT, picker-fx.js) whose picture is the volume's still in the theme in use and, while the mouse is on it (or a key's focus),
       its hero, fetched on the first hover and paused on leaving; a volume HEROES does not name wears the λWAVES palette (skin.css).  The
       numeral and its count sit at the art's foot, the WIP cone at its head, the install under the card (iteration 012 L1's words). */
    const HERO = './img/menu/vol/', heroArt = (art, id) => artOf(art, HERO, id, HEROES[id]);
    const heroes = new Set(), rest = () => { for (const h of heroes) h.stop(); };   // a volume opened or the Picker closed: every hero rests
    function card(v, k) {
      const c = el('div', 'mm-vol', shelfEl), o = el('button', 'mm-vol-open mm-holo', c); o.type = 'button'; o.setAttribute('aria-label', 'open ' + volName(v) + (v.title ? ' · ' + v.title : ''));
      o.title = [v.title, v.blurb].filter(Boolean).join(' — '); o.style.setProperty('--k', String(k));
      el('span', 'mm-halo', o); const art = el('span', 'mm-lit', o); el('span', 'mm-rim', o);
      const hero = heroArt(art, v.id); el('span', 'mm-foil', art);
      if (v.wip || v.drawing) {   // iteration 014 C4 (pack.mjs --wip); 030: a volume whose pictures are still being drawn (build-deploy's `drawing`)
        const w = el('span', 'mm-vol-wip', art); icon(w, 'cone'); el('span', '', w, 'WIP');
        w.title = 'Under construction: ' + [v.wip && 'still filling', v.drawing && 'pictures coming'].filter(Boolean).join('; ');
      }
      const foot = el('span', 'mm-art-foot', art); el('b', 'mm-vol-num', foot, volName(v));
      /* iteration 015 M5 · a volume on the shelf before its first molecule (pack.mjs --wip --next: the next volume, still filling) says FILLING:
         nothing to install or open yet */
      if (v.wip && !v.count && !v.index && !v.archive) { c.classList.add('filling'); o.disabled = true; o.title = volName(v) + ' is being filled'; el('span', 'mm-vol-meta', foot, 'FILLING'); return; }
      const meta = [v.count != null ? Number(v.count).toLocaleString('en') + ' molecules' : '', Array.isArray(v.bases) && v.bases.length ? v.bases.length + ' bases' : ''].filter(Boolean).join(' · ');
      if (meta) el('span', 'mm-vol-meta', foot, meta);
      if (hero) { heroes.add(hero); bindHero(o, hero); }
      o.addEventListener('click', () => enter(v));
      const ins = installer(c, v);
      if (v.archive) {   // the card takes a drop of its .lwv (030: every volume with an archive, not only a file volume)
        const files = (e) => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
        c.addEventListener('dragover', (e) => { if (files(e)) { e.preventDefault(); c.classList.add('drop'); } });
        c.addEventListener('dragleave', () => c.classList.remove('drop'));
        c.addEventListener('drop', (e) => { if (!files(e)) return; e.preventDefault(); c.classList.remove('drop'); const f = e.dataTransfer.files[0]; if (f) ins.run(f); });
      }
    }
    async function paintShelf() {
      shelfEl.textContent = ''; shelfEl.hidden = devEl.hidden = false; view.hidden = true; cur = null; root.classList.remove('in-volume');
      let s = { volumes: [] }; try { s = await V.shelf({ fresh: true }); } catch (_) { /* no shelf: said below */ }
      if (!s.volumes.length) {
        const e = el('div', 'mm-empty', shelfEl); el('b', '', e, 'EXPANSIONS');
        el('span', '', e, 'No volume is published yet.');
        return;
      }
      heroes.clear(); vols = s.volumes; s.volumes.forEach(card);
      if (TIP_URL) tipCard();   // 030 THE TIP JAR: the last card on the shelf
      enterTiles([...shelfEl.children]);
    }
    async function enter(v) {
      rest(); cur = v; on.clear(); query = ''; shelfEl.hidden = devEl.hidden = true; view.hidden = false; vhead.textContent = ''; root.classList.add('in-volume');   // the head's SHOW LABELS stands for the one under the tabs
      const back = el('button', 'mm-back', vhead); back.type = 'button'; icon(back, 'arrow-left'); back.setAttribute('aria-label', 'back to the volumes'); back.title = 'back to the volumes'; back.addEventListener('click', () => paintShelf());
      const size = v.index ? v.bytes : v.archive && v.archive.bytes;
      const step = stepper({ aria: 'volume', items: (vols.length ? vols : [v]).filter((x) => x.count || x.index || x.archive).map((x) => ({ id: x.id, label: volName(x) })), value: v.id, list: false, cls: 'mm-vstep',
        onChange: (id) => { const x = vols.find((y) => y.id === id); if (x) enter(x); } });
      step.root.title = [volName(v), size ? fmtBytes(size) : ''].filter(Boolean).join(' · '); vhead.appendChild(step.root); wheelSteps(step.root, (d) => step.step(d));   // L2
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
      byId = new Map(mols.map((m) => [m.id, m])); isoEl.hidden = true;
      if (cur !== v) return;
      paintTags(); filter();
    }
    /* the tags: built once a volume and lit in place (the strip keeps where it was scrolled); two or more intersect, ALL clears them */
    function paintTags() {
      /* iteration 012 L2 · 014 C3 · 029 Q: TWO rows in one sideways strip under its visible scrollbar; each tag in its count's order goes to the row that is shortest so far, so
         every row reads most-common first and they end together.  The chips are the index's words: `tags` (what it is) and `geo` (its shape,
         catalogue/structure_tags.py THE SHAPE WORDS — linear · planar · strained · macrocycle · spiro · bridged · fused · polycyclic · …) */
      tagsEl.textContent = ''; const n = new Map(); for (const m of mols) for (const t of wordsOf(m)) n.set(t, (n.get(t) || 0) + 1);
      const rows = [0, 1].map(() => el('div', 'mm-tagrow', tagsEl)), len = [0, 0];
      const chipOf = (id, label, count) => { const r = len.indexOf(Math.min(...len)); len[r] += String(label).length + String(count).length + 4; const b = el('button', 'mm-tag', rows[r], label); b.type = 'button'; b.dataset.tag = id; el('i', '', b, count.toLocaleString('en'));
        b.addEventListener('click', () => { if (id === '') on.clear(); else if (on.has(id)) on.delete(id); else on.add(id); markTags(); filter(); }); };
      chipOf('', 'all', mols.length);
      for (const [t, k] of [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) chipOf(t, t, k);
      markTags();
    }
    function markTags() { for (const b of tagsEl.querySelectorAll('.mm-tag')) { const isOn = b.dataset.tag ? on.has(b.dataset.tag) : !on.size; b.classList.toggle('on', isOn); b.setAttribute('aria-pressed', String(isOn)); } }
    /* a volume's molecule as a tile; iteration 008 P: a ONE-ATOM entry (VOL. I's Fe · Kr · Zn · Cr · Ni · Ti, PubChem compounds) is an atom: it
       opens the ATOMS road, wearing its element's own picture; past the ATOM system's reach it still opens from the volume.  ISOMERS (iteration
       014 C2): a molecule whose structural isomers (the index's `isomers`, same formula, another connectivity) are in this volume wears a corner
       mark with their count, and its press opens THE ISOMER DECK — the same tiles, the same hue and style — instead of loading at once */
    function molTile(host, m, deep) {
      const z = atomZ(m.formula), atom = z && ATOMS.some((a) => a.Z === z) ? z : 0, isos = deep && !atom ? isomersIn(m) : [];
      const t = tile(host, 'mm-mol', { formula: m.formulaM ? mathPlain(m.formulaM) : m.formula, name: cap(m.name), sub: atom ? volName(cur) + ' · one atom: it opens in ATOMS' : [volName(cur), ...(m.tags || []), isos.length ? (isos.length + 1) + ' isomers' : ''].filter(Boolean).join(' · ') },
        () => { if (atom) goAtom(atom); else if (isos.length) openIsomers(m, isos); else { isoEl.hidden = true; goVolume(cur, m); } });
      el('b', 'mm-lbl', t, m.formulaM ? mathPlain(m.formulaM) : m.formula);
      if (isos.length) { const k = el('span', 'mm-iso', t, String(isos.length + 1)); k.title = (isos.length + 1) + ' structural isomers in ' + volName(cur); }
      if (atom) { const v = valenceOf(atom); pic(t, null, 'el:' + SYM[atom - 1] + ':' + v.nl + '_' + v.m); return t; }
      const i = pic(t, null), ph = () => hold(t, i); i.dataset.vol = cur.id; i.dataset.mol = m.id;
      V.picture(cur.id, m.id, lookOf()).then((u) => { develop(i); i.src = u; }, ph);
      return t;
    }
    const wordsOf = (m) => (m.geo ? [...(m.tags || []), ...m.geo] : m.tags || []);   // C3: a molecule's chips, what it is and its shape
    const isomersIn = (m) => (m.isomers || []).map((id) => byId.get(id)).filter(Boolean);
    /* THE ISOMER DECK: over the volume's deck, the molecule and its isomers (the catalogue's order); a press opens one, ×, Escape or a press on
       the ground puts it away */
    const isoEl = el('div', 'mm-isos glass', view); isoEl.hidden = true; isoEl.dataset.mirSurface = 'menu';   // 022 P3: a menu pane isoEl.setAttribute('role', 'dialog');
    const isoHead = el('div', 'mm-isohead', isoEl), isoGrid = el('div', 'mm-isogrid', isoEl);
    const closeIsomers = () => { if (isoEl.hidden) return; isoEl.hidden = true; const f = vdeck.tiles.find((x) => x.dataset.iso === isoEl.dataset.of); if (f) f.focus({ preventScroll: true }); };
    isoEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeIsomers(); } });
    view.addEventListener('click', (e) => { if (!isoEl.hidden && !isoEl.contains(e.target)) { e.stopPropagation(); e.preventDefault(); closeIsomers(); } }, true);   // the ground around the pane
    function openIsomers(m, isos) {
      isoHead.textContent = ''; isoGrid.textContent = ''; isoEl.dataset.of = m.id;
      el('b', 'mm-isof', isoHead, m.formulaM ? mathPlain(m.formulaM) : m.formula); el('span', 'mm-isocount', isoHead, (isos.length + 1) + ' isomers');
      const x = el('button', 'mm-back mm-isox', isoHead); x.type = 'button'; x.setAttribute('aria-label', 'close the isomers'); x.textContent = '×'; x.addEventListener('click', closeIsomers);
      isoGrid.style.setProperty('--n', String(isos.length + 1));
      for (const y of [m, ...isos]) { const t = molTile(isoGrid, y, false); if (y === m) t.classList.add('here'); }
      const pager = view.querySelector('.mm-pager'); if (pager) { isoEl.style.top = pager.offsetTop + 'px'; isoEl.style.maxHeight = Math.max(200, innerHeight - pager.getBoundingClientRect().top - 24) + 'px'; }   // over the deck, never the head (its tag rows set its height)
      isoEl.hidden = false; enterTiles([...isoGrid.children]);
      const first = isoGrid.firstElementChild; if (first) first.focus({ preventScroll: true });
    }
    function filter() {
      const list = sorted(mols.filter((m) => [...on].every((t) => wordsOf(m).includes(t))
        && (!query || [m.name, m.formula, m.id, ...wordsOf(m)].some((s) => s && String(s).toLowerCase().includes(query)))));
      countEl.textContent = list.length === mols.length ? mols.length.toLocaleString('en') : list.length.toLocaleString('en') + ' / ' + mols.length.toLocaleString('en');
      countEl.title = (on.size ? [...on].join(' + ') : query ? '“' + query + '”' : 'all') + ' · ' + list.length.toLocaleString('en') + ' molecules';
      vdeck.set(list, (m, host) => { const t = molTile(host, m, true); t.dataset.iso = m.id; return t; });
      enterTiles(vdeck.tiles);   // iteration 012 L2: a tag or a search deals the page in (animate() stands down under reduced motion)
    }
    return { wake() { if (!woke) { woke = true; paintShelf(); } }, paintDevice, home() { if (cur) paintShelf(); }, rest };
  })();

  /* ── the tab under the reader's eye ── */
  let current = sections[0]; paintLooks();
  const show = (s) => { if (!s) return; if (s !== current) say(null); current = s; atomOpt.hidden = amode.hidden = s.id !== 'atomic'; molOpt.hidden = s.id === 'atomic'; root.dataset.sec = s.id; paintLooks(); for (const x of sections) x.b.classList.toggle('on', x === s); movePill(s.b); if (s.id === 'library') library.wake(); if (s.id !== 'atomic') readStore(); };
  { const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) show(sections.find((s) => s.sec === e.target)); }, { root: scroller, threshold: 0.55 }); for (const s of sections) io.observe(s.sec); }
  let rf = 0; const ro = new ResizeObserver(() => { if (!rf) rf = requestAnimationFrame(() => { rf = 0; if (!root.hidden) { for (const d of decks) d.lay(); movePill(current.b); } }); });   // observed only while the Picker is open

  /* ── going there ── */
  function goMolecule(id) { close(); const C = app.state.chem; if (!C) return; if (!C.on) C.setOn(true); C.pick(id); }
  function goVolume(v, m) {
    close(); if (app.state.chem) app.state.chem.openVolume(v.id, m.id);   // V2: its record, the lowest rung, MOLECULES on (chemview openVolume)
  }
  function goHydrogen(b) {
    close(); const C = app.state.chem; if (C && C.on) C.setOn(false);
    if (getHamiltonian().id !== 'hydrogen') app.w.switchHamiltonian('hydrogen'); if (app.ui.hamSeg) app.ui.hamSeg.set('hydrogen');
    const name = b.n + L_LETTERS[b.l] + subOf(b.m);
    /* iteration 017 W1 (Josh 2026-10-26: "When clicking on the 140 orbital table … and playing with 'WAVE' it doesn't seem to work like it used to"):
       the pick is the label at phase 0 with the rate and window it always had; WAVE (SPACE · OBSERVABLE · DRAW) stays the reader's — the LOOK is the
       thumbnails' style only (no `view` here, so loadPreset leaves the OBSERVABLE alone) */
    app.ctl.loadPreset({ id: b.id, label: name, note: 'hydrogen · one label, from the Picker', modes: [{ n: b.n, l: b.l, m: b.m, amp: 1, phase: 0 }],
      visual: { rate: 4, window: 4 * Math.PI * b.n * b.n } }, { hand: true });
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
  /* 034 M1: an open lands on THE LANDING FACE, but `{ decks: true }` (the CSB's LIBRARY seat, api.show) opens the decks where the reader left
     them.  The decks' first showing sits on MOLECULAR (ATOMIC above, EXPANSIONS below), laid before the face is up so its first page is asked
     for first.  A first run (the notice's CONTINUE) fades in rather than the iris, and its LIBRARY deals that page in THE ENTRANCE. */
  let seated = false;
  function open(o) {
    if (!root.hidden) return;
    const first = !!(o && o.first), toDecks = !!(o && o.decks);
    const r = home.getBoundingClientRect();
    root.style.setProperty('--ox', r.width ? r.left + r.width / 2 + 'px' : '50%'); root.style.setProperty('--oy', r.width ? r.top + r.height / 2 + 'px' : '50%');
    root.classList.toggle('first', first); if (first) firstDeal = true;
    if (!seated) { current = sections[1]; show(current); }
    root.hidden = false; document.body.classList.add('menu-open'); said = null; say(null); ro.observe(scroller); layer();
    if (!seated) { seated = true; sections[1].sec.scrollIntoView({ block: 'start' }); }
    if (toDecks) showView('decks'); else showFace();
    for (const d of decks) d.lay();
    if (current.id !== 'atomic') readStore();
    if (first) { setTimeout(() => { document.body.classList.remove('lw-notice'); }, 700); setTimeout(() => { root.classList.remove('first'); }, 2600); }
    requestAnimationFrame(() => { root.classList.add('in'); movePill(current.b); if (at === 'decks') enterTiles(current.id === 'atomic' ? (prefs.atomic === 'hydrogen' ? [...hTable.children] : [...table.children]) : current.id === 'molecular' ? molDeck.tiles : [], (t, i) => (t.classList.contains('mm-el') ? (+t.style.gridColumn || 0) + (+t.style.gridRow || 0) : i)); });
  }
  function close() { if (root.hidden) return; closeDrop(); restHero(); library.rest(); ro.unobserve(scroller); root.classList.remove('in'); document.body.classList.remove('menu-open'); root.hidden = true; }
  const toggle = (o) => (root.hidden ? open(o) : close());
  const escape = () => (drop.hidden ? close() : closeDrop(true));   // M1: Escape puts THE LOOK DROP away first
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); escape(); } });
  /* 021 I1: the open Picker is a layer of THE ESCAPE STACK (lab/actions.js): from anywhere, Escape puts its drop away, then the Picker */
  let escDrop = null; const layer = () => { if (escDrop) escDrop(); escDrop = app.sh.ACTIONS.escape.push(() => { escDrop = null; escape(); if (!root.hidden) layer(); }, { alive: () => !root.hidden }); };
  /* the home button by the title: the kit's grid glyph */
  const home = el('button', 'lw-home', document.body); home.id = 'lwHome'; home.type = 'button'; chip(home, 'gallery', 'Picker'); home.title = 'Picker (L)';
  home.addEventListener('click', toggle);
  /** iteration 014 A2 · a suggestion's tile is the Picker's own tile (its picture, its formula, the hue in use) and its press the Picker's road */
  const suggestTile = (host, r) => {
    const info = { formula: mathPlain(r.formula), name: cap(r.name), sub: r.vol ? r.vol.toUpperCase() : '' };
    const t = tile(host, 'mm-mol', info, () => (r.vol ? goVolume(r.v, r.m) : goMolecule(r.id)));
    const i = pic(t, null, r.vol ? null : 'mol:' + r.id); el('b', 'mm-lbl', t, info.formula);
    if (r.vol) { i.dataset.vol = r.vol; i.dataset.mol = r.id; V.picture(r.vol, r.id, lookOf()).then((u) => { i.src = u; }, () => hold(t, i)); }
    return t;
  };
  const api = { open, close, toggle, get shown() { return !root.hidden; }, root, show(id) { if (sections.some((x) => x.id === id)) { open({ decks: true }); showDecks(id); } }, suggest, suggestTile };
  app.state.picker = api;
  if (openAtBoot) open();
  return api;
}
