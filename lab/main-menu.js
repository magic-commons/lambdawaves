/* lab/main-menu.js — THE MAIN MENU (iteration 003, Josh 2026-10-16): the lab's front page, over the stage.  Two sections to scroll through,
 * ATOMIC (the whole periodic table, each square its element's last unfilled / valence subshell and that subshell's picture) and MOLECULAR
 * (every molecule in the store as a square picture, 6 × 5 a page, the pages side by side with a dot pager under them).  The pictures are
 * tools/menu-thumbs.mjs' (density · SIGNED · ISO 0.03 · the HSV wheel · the field alone on no ground); a hover or a focus writes the
 * formula on the caption line at the bottom.  A press goes there: MOLECULES mode and the molecule (the card's own hand road, chem.pick),
 * or ATOMS mode and the element in SPECTRUM's ATOM system (the road the card's ‹ ATOMS › tile takes; H–Kr only, the rest dimmed).
 * THE WAY BACK is instant: the DOM is built once and only shown or hidden — the home button by the title, the key (L, keys.js `menu`),
 * WINDOW › MAIN MENU; Escape or a press on the stage's own picture leaves it.  The look: the logo with its word in the theme's ink, frosted
 * glass when the look's FROST is on (body.frost) else the theme's ground, no outline and no border anywhere (skin.css).
 * It opens at boot unless a link, a ?preset= or ?menu=0 opened something.  A plain module: app is read, never extended (app.state.mainMenu). */
import { el, chip, mathPlain } from './mir/kit.js';
import { CHEM_PRESETS } from './chemview.js';
import { ATOMS } from './atoms.js';
import { getHamiltonian } from './hamiltonian.js';

const SYM = ('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe '
  + 'Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr '
  + 'Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og').split(' ');
const L = 'spdf', CAP = [2, 6, 10, 14], SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (k) => String(k).split('').map((d) => SUP[d]).join('');
/* the Madelung order (n + l, then n), filled to Z; past Kr the standard ground-state exceptions move k electrons from one subshell to
   another (Z: from > to, k).  H–Kr read atoms.js' own configurations instead. */
const ORDER = []; for (let s = 1; s <= 8; s++) for (let n = 1; n <= s; n++) { const l = s - n; if (l < n && l <= 3) ORDER.push([n, l]); }
const MOVE = { 41: ['5s', '4d', 1], 42: ['5s', '4d', 1], 44: ['5s', '4d', 1], 45: ['5s', '4d', 1], 46: ['5s', '4d', 2], 47: ['5s', '4d', 1], 57: ['4f', '5d', 1], 58: ['4f', '5d', 1],
  64: ['4f', '5d', 1], 78: ['6s', '5d', 1], 79: ['6s', '5d', 1], 89: ['5f', '6d', 1], 90: ['5f', '6d', 2], 91: ['5f', '6d', 1], 92: ['5f', '6d', 1], 93: ['5f', '6d', 1], 96: ['5f', '6d', 1], 103: ['6d', '7p', 1] };
function configOf(Z) {
  const own = ATOMS.find((a) => a.Z === Z);
  if (own) return own.config.map((c) => ({ n: c.n, l: c.l, occ: c.occ }));
  const c = []; let left = Z; for (const [n, l] of ORDER) { if (left <= 0) break; const k = Math.min(left, CAP[l]); c.push({ n, l, occ: k }); left -= k; }
  const m = MOVE[Z]; if (m) { const key = (s) => s.n + L[s.l], from = c.find((s) => key(s) === m[0]); let to = c.find((s) => key(s) === m[1]);
    if (!to) { to = { n: +m[1][0], l: L.indexOf(m[1][1]), occ: 0 }; c.push(to); } from.occ -= m[2]; to.occ += m[2]; }
  return c.filter((s) => s.occ > 0);
}
/** the subshell that makes the atom: the open one (the highest l, then the latest in the Madelung order), else the last one filled */
function valenceOf(Z) {
  const c = configOf(Z), rank = (s) => (s.n + s.l) * 10 + s.n, sorted = c.slice().sort((a, b) => rank(a) - rank(b));
  const open = sorted.filter((s) => s.occ < CAP[s.l]).sort((a, b) => a.l - b.l || rank(a) - rank(b)); const v = (open.length ? open : sorted).at(-1);   // of two open (Cr 3d⁵ 4s¹, Ce 4f¹ 5d¹) the higher l makes it
  return { nl: v.n + L[v.l], label: v.n + L[v.l] + sup(v.occ) };
}
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

export function createMainMenu(app, { open: openAtBoot = true } = {}) {
  const root = el('div', 'lw-menu', document.body); root.id = 'lwMenu'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'main menu');
  const top = el('div', 'mm-top', root), logo = el('div', 'mm-logo', top);
  fetch('./img/lambdawaves-logo.svg').then((r) => r.text()).then((t) => { logo.innerHTML = t.replace(/fill="#f0f4f7"/g, 'fill="currentColor"'); const s = logo.querySelector('svg'); if (s) { s.setAttribute('aria-label', 'λWAVES'); s.setAttribute('role', 'img'); } }).catch(() => { logo.textContent = 'λWAVES'; });
  const tabs = el('div', 'mm-tabs', top), scroller = el('div', 'mm-scroll', root), caption = el('div', 'mm-caption', root);
  const say = (t, sub) => { caption.textContent = ''; if (t) { el('b', '', caption, t); if (sub) el('span', '', caption, sub); } };
  const sections = [['atomic', 'ATOMIC'], ['molecular', 'MOLECULAR']].map(([id, label]) => {
    const sec = el('section', 'mm-sec mm-' + id, scroller), b = el('button', 'mm-tab', tabs, label); b.type = 'button';
    b.addEventListener('click', () => sec.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
    return { id, sec, b };
  });
  { const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) for (const s of sections) s.b.classList.toggle('on', s.sec === e.target); }, { root: scroller, threshold: 0.55 }); for (const s of sections) io.observe(s.sec); }
  const pic = (host, src) => { const i = el('img', 'mm-pic', host); i.alt = ''; i.decoding = 'async'; i.loading = 'lazy'; i.draggable = false; i.src = src; i.addEventListener('error', () => { i.remove(); }); return i; };
  const tile = (host, cls, { title, sub, go, off }) => {
    const b = el('button', 'mm-tile ' + cls, host); b.type = 'button'; if (off) { b.classList.add('off'); b.setAttribute('aria-disabled', 'true'); }
    b.setAttribute('aria-label', title + (sub ? ' — ' + sub : ''));
    const hi = () => say(title, sub); b.addEventListener('pointerenter', hi); b.addEventListener('focus', hi);
    b.addEventListener('click', () => { if (!off) go(); });
    return b;
  };

  /* ── ATOMIC: 118 squares on the 18-column table, the f rows under it ── */
  const table = el('div', 'mm-table', sections[0].sec);
  for (let Z = 1; Z <= 118; Z++) {
    const [r, c] = seatOf(Z), v = valenceOf(Z), a = ATOMS.find((x) => x.Z === Z), live = !!a;
    const t = tile(table, 'mm-el', { title: SYM[Z - 1] + (a ? ' · ' + a.name : '') + ' · Z ' + Z, sub: v.label + (live ? '' : ' · the record vendors H–Kr'), off: !live, go: () => goAtom(Z) });
    t.style.gridRow = String(r); t.style.gridColumn = String(c);
    pic(t, './img/menu/orb-' + v.nl + '.webp');
    el('i', 'mm-z', t, String(Z)); el('b', 'mm-sym', t, SYM[Z - 1]); el('i', 'mm-val', t, v.label);
  }
  /* ── MOLECULAR: 6 × 5 a page, the store's own order, a dot per page ── */
  const pagesEl = el('div', 'mm-pages', sections[1].sec), dots = el('div', 'mm-dots', sections[1].sec), PER = 30, pages = [];
  CHEM_PRESETS.forEach((m, i) => {
    if (i % PER === 0) { pages.push(el('div', 'mm-page', pagesEl)); const d = el('button', 'mm-dot', dots); d.type = 'button'; d.setAttribute('aria-label', 'page ' + pages.length); const k = pages.length - 1; d.addEventListener('click', () => pageTo(k)); }
    const t = tile(pages.at(-1), 'mm-mol', { title: mathPlain(m.formula) + ' · ' + m.name, sub: m.disabled ? m.reason : m.recordOnly ? 'from its record' : '', off: !!m.disabled, go: () => goMolecule(m.id) });
    pic(t, './img/menu/' + m.id + '.webp');
  });
  let page = 0;
  const pageTo = (k) => { page = Math.max(0, Math.min(pages.length - 1, k)); pagesEl.scrollTo({ left: page * pagesEl.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); paintDots(); };
  const paintDots = () => [...dots.children].forEach((d, i) => d.classList.toggle('on', i === page));
  pagesEl.addEventListener('scroll', () => { const k = Math.round(pagesEl.scrollLeft / Math.max(1, pagesEl.clientWidth)); if (k !== page) { page = k; paintDots(); } }, { passive: true });
  paintDots();

  /* ── going there ── */
  function goMolecule(id) { close(); const C = app.state.chem; if (!C) return; if (!C.on) C.setOn(true); C.pick(id); }
  function goAtom(Z) {
    close(); const C = app.state.chem; if (C && C.on) C.setOn(false);
    app.w.setElement(Z); if (getHamiltonian().id !== 'atom') app.w.switchHamiltonian('atom'); if (app.ui.hamSeg) app.ui.hamSeg.set('atom');
    if (app.w.fillValence) app.w.fillValence();                         // the valence shell that makes the atom, every m equal and in phase (SPECTRUM's own road)
  }
  /* ── open / close: shown or hidden, nothing rebuilt ── */
  function open() { if (!root.hidden) return; root.hidden = false; document.body.classList.add('menu-open'); requestAnimationFrame(() => root.classList.add('in')); say(''); }
  function close() { if (root.hidden) return; root.classList.remove('in'); document.body.classList.remove('menu-open'); root.hidden = true; }
  const toggle = () => (root.hidden ? open() : close());
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && pagesEl.contains(document.activeElement)) { e.preventDefault(); pageTo(page + (e.key === 'ArrowRight' ? 1 : -1)); }
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !root.hidden) close(); });
  /* the home button by the title: the kit's grid glyph */
  const home = el('button', 'lw-home', document.body); home.id = 'lwHome'; home.type = 'button'; chip(home, 'gallery', 'Main menu'); home.title = 'Main menu (L)';
  home.addEventListener('click', toggle);
  const api = { open, close, toggle, get shown() { return !root.hidden; }, root };
  app.state.mainMenu = api;
  if (openAtBoot) open();
  return api;
}
