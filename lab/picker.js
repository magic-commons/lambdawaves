/* lab/picker.js — THE PICKER (iteration 004, Josh 2026-10-17; iteration 003's MAIN MENU): λWAVES' front page, over the stage.  Three
 * sections in one vertical snap — ATOMIC (the periodic table: each live element H–Kr its own picture, exactly what a press opens, seen
 * from the corner; the elements past Kr their valence subshell's), MOLECULAR (every molecule in the store, the pages sized to the screen,
 * ‹ › beside them) and LIBRARY (THE VOLUMES, lab/volumes.js: VOL. I, VOL. II … — each a card that installs with one press; inside a
 * volume its molecules grouped by their plain tags, two tags intersect, a search line).  The pictures are tools/menu-thumbs.mjs' and each
 * volume's own (t/<id>.webp).  A hover or a focus moves ONLY the picture (lab/picker-fx.js: the spring tilt and a zoom — no background,
 * no tint), writes the name under the tile, and swaps the large caption at the foot.  A press goes there: ATOMS mode and the element
 * (goAtom), MOLECULES mode and the molecule (chem.pick), or a volume's molecule (chem.openVolume).  THE WAY BACK is instant: the DOM is
 * built once and only shown or hidden — the home button (the iris opens from it), L (keys.js `menu`), WINDOW › PICKER; Escape leaves.
 * FOLDERS (the projects and the demos) has its door at the top left.  It opens at boot once the photosensitivity notice is accepted,
 * unless a link, a ?preset= or ?menu=0 opened something (rack.js).  A plain module: app is read, never extended (app.state.picker). */
import { el, chip, mathPlain } from './mir/kit.js';
import { CHEM_PRESETS } from './chemview.js';
import { ATOMS } from './atoms.js';
import { getHamiltonian } from './hamiltonian.js';
import { RM, animate, pointerFrame, tiltPictures, enterTiles, develop, swapLine, installRing, clamp } from './picker-fx.js';
import * as V from './volumes.js';

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


const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
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

  /* ── the caption: the formula (STIX), the name (LW Title), the line under them; R6's swap ── */
  let said = null;
  const say = (t) => {
    const key = t ? [t.formula, t.name, t.sub].join('|') : '';
    if (key === said) return; said = key;
    swapLine(caption, (line) => { if (!t) return; if (t.formula) el('b', 'mm-cap-f', line, t.formula); if (t.name) el('span', 'mm-cap-n', line, t.name); if (t.sub) el('i', 'mm-cap-s', line, t.sub); });
  };
  /* ── a tile: the picture moves, the name shows under it; nothing else changes on a hover ── */
  const pic = (host, src) => { const i = el('img', 'mm-pic', host); i.alt = ''; i.decoding = 'async'; i.loading = 'lazy'; i.draggable = false; i.addEventListener('error', () => { i.remove(); }); if (src) { develop(i); i.src = src; } return i; };
  const tile = (host, cls, info, go, off) => {
    const b = el('button', 'mm-tile ' + cls, host); b.type = 'button';
    if (off) { b.classList.add('off'); b.setAttribute('aria-disabled', 'true'); }
    b.setAttribute('aria-label', [info.name, info.formula, info.sub].filter(Boolean).join(' — '));
    el('span', 'mm-under', b, info.under || info.name);
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
      let rows = H >= 640 ? 4 : H >= 420 ? 3 : 2, t = Math.min(260, (H - (rows - 1) * gap) / rows);
      let cols = Math.max(3, Math.min(12, Math.floor((W + gap) / (t + gap))));
      const want = narrow ? 3 : 8;   // Josh: bigger AND more columns — a desktop page is at least eight across while a tile stays ≥ 150 px
      if (cols < want && (W - (want - 1) * gap) / want >= (narrow ? 80 : 150)) cols = want;
      t = Math.min(t, (W - (cols - 1) * gap) / cols); rows = Math.max(2, Math.min(6, Math.floor((H + gap) / (t + gap))));
      return { cols, rows, t: Math.floor(t), gap };
    }
    function lay() {
      if (root.hidden || !make || !host.getClientRects().length) return;
      const first = page * per, g = size(); per = g.cols * g.rows;
      pagesEl.style.setProperty('--t', g.t + 'px'); pagesEl.style.setProperty('--cols', String(g.cols)); pagesEl.style.setProperty('--gap', g.gap + 'px');
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
    const t = tile(table, 'mm-el', { formula: sym, name: a ? cap(a.name) : '', sub: 'Z ' + Z + ' · ' + v.label + (live ? '' : ' · past krypton: not in the ATOM system yet'), under: a ? cap(a.name) : sym + ' · Z ' + Z }, () => goAtom(Z), !live);
    t.style.gridRow = String(r); t.style.gridColumn = String(c);
    pic(t, './img/menu/' + (live ? 'el-' + sym : 'orb-' + v.nl) + '.webp');
    el('i', 'mm-z', t, String(Z)); el('b', 'mm-sym', t, sym);
  }
  /* ── MOLECULAR: the store's own order ── */
  const molDeck = deck(sections[1].sec);
  molDeck.set(CHEM_PRESETS, (m, host) => {
    const t = tile(host, 'mm-mol', { formula: mathPlain(m.formula), name: cap(m.name), sub: m.disabled ? m.reason : '' }, () => goMolecule(m.id), !!m.disabled);
    pic(t, './img/menu/' + m.id + '.webp');
  });

  /* ── LIBRARY: the shelf of volumes; a volume's molecules by their tags ── */
  const library = (() => {
    const sec = sections[2].sec, shelfEl = el('div', 'mm-shelf', sec), view = el('div', 'mm-volview', sec); view.hidden = true;
    const vhead = el('div', 'mm-vhead', view), tagsEl = el('div', 'mm-tags', view), group = el('div', 'mm-group', view), vdeck = deck(view);
    let woke = false, cur = null, mols = [], on = new Set(), query = '';
    function installer(host, v) {
      const b = el('button', 'mm-install', host); b.type = 'button';
      const ringHost = el('span', 'mm-ring-host', b), ring = installRing(ringHost), word = el('span', 'mm-install-word', b);
      let ctl = null, arm = 0;
      const paint = async () => {
        const s = await V.statusOf(v.id).catch(() => ({ state: 'absent', n: 0, N: v.count || 0 }));
        b.dataset.state = s.state; ring.set(s.N ? s.n / s.N : 0, s.state === 'installed' ? 'done' : 'idle');
        word.textContent = s.state === 'installed' ? 'INSTALLED · REMOVE' : s.state === 'partial' ? `RESUME · ${s.n.toLocaleString('en')} / ${s.N.toLocaleString('en')}` : 'INSTALL' + (v.bytes ? ' · ' + fmtBytes(v.bytes) : '');
      };
      b.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (ctl) { ctl.abort(); return; }
        if (b.dataset.state === 'installed') {   // two presses remove: no window.confirm
          if (Date.now() - arm > 3000) { arm = Date.now(); word.textContent = 'REMOVE ' + volName(v) + '? PRESS AGAIN'; return; }
          arm = 0; await V.remove(v.id); await paint(); return;
        }
        ctl = new AbortController(); b.dataset.state = 'busy';
        const r = await V.install(v.id, { signal: ctl.signal, onProgress: (p) => { ring.set(p.ratio, 'busy'); word.textContent = Math.round(p.ratio * 100) + '% · ' + fmtBytes(p.bytes) + ' OF ' + fmtBytes(p.total) + ' · CANCEL'; } })
          .catch((err) => ({ ok: false, why: String(err && err.message || err) }));
        ctl = null; await paint();
        if (r && r.why && !r.cancelled) say({ formula: volName(v), name: v.title || '', sub: r.why });
      });
      paint(); return { paint };
    }
    function card(v) {
      const c = el('div', 'mm-vol', shelfEl), o = el('button', 'mm-vol-open', c); o.type = 'button'; o.setAttribute('aria-label', 'open ' + volName(v) + (v.title ? ' · ' + v.title : ''));
      el('b', 'mm-vol-num', o, volName(v)); if (v.title) el('span', 'mm-vol-title', o, v.title);
      const meta = [v.count != null ? Number(v.count).toLocaleString('en') + ' molecules' : '', v.bytes ? fmtBytes(v.bytes) : '', Array.isArray(v.bases) && v.bases.length ? v.bases.length + ' bases' : ''].filter(Boolean).join(' · ');
      if (meta) el('span', 'mm-vol-meta', o, meta);
      if (v.blurb) el('span', 'mm-vol-blurb', o, v.blurb);
      o.addEventListener('pointerenter', () => say({ formula: volName(v), name: v.title || '', sub: meta }));
      o.addEventListener('click', () => enter(v));
      installer(c, v);
    }
    async function paintShelf() {
      shelfEl.textContent = ''; shelfEl.hidden = false; view.hidden = true; cur = null;
      let s = { volumes: [] }; try { s = await V.shelf({ fresh: true }); } catch (_) { /* no shelf: said below */ }
      if (!s.volumes.length) {
        const e = el('div', 'mm-empty', shelfEl); el('b', '', e, 'LIBRARY');
        el('span', '', e, 'No volume is published yet. A volume is an expansion library — thousands of molecules, each solved in every basis from STO-3G to 6-31+G* — installed on this device with one press.');
        return;
      }
      for (const v of s.volumes) card(v);
      enterTiles([...shelfEl.children]);
    }
    async function enter(v) {
      cur = v; on.clear(); query = ''; shelfEl.hidden = true; view.hidden = false;
      vhead.textContent = ''; tagsEl.textContent = ''; group.textContent = '';
      const back = el('button', 'mm-back', vhead, '‹ LIBRARY'); back.type = 'button'; back.addEventListener('click', () => paintShelf());
      el('b', 'mm-vol-num', vhead, volName(v)); if (v.title) el('span', 'mm-vol-title', vhead, v.title);
      installer(vhead, v);
      const q = el('input', 'mm-search', vhead); q.type = 'search'; q.placeholder = 'search ' + volName(v); q.setAttribute('aria-label', 'search ' + volName(v));
      q.addEventListener('input', () => { query = q.value.trim().toLowerCase(); filter(); });
      q.addEventListener('keydown', (e) => e.stopPropagation());
      animate(view, [{ opacity: 0, transform: 'translateY(12px) scale(.98)' }], 260);
      try { mols = (await V.index(v.id)).molecules; } catch (err) { mols = []; group.textContent = String(err && err.message || err); }
      if (cur !== v) return;
      paintTags(); filter();
    }
    function paintTags() {
      tagsEl.textContent = ''; const n = new Map(); for (const m of mols) for (const t of m.tags || []) n.set(t, (n.get(t) || 0) + 1);
      const chipOf = (label, count, isOn, act) => { const b = el('button', 'mm-tag' + (isOn ? ' on' : ''), tagsEl, label); b.type = 'button'; el('i', '', b, count.toLocaleString('en')); b.addEventListener('click', act); };
      chipOf('all', mols.length, !on.size, () => { on.clear(); paintTags(); filter(); });
      for (const [t, k] of [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) chipOf(t, k, on.has(t), () => { if (on.has(t)) on.delete(t); else on.add(t); paintTags(); filter(); });
    }
    function filter() {
      const list = mols.filter((m) => [...on].every((t) => (m.tags || []).includes(t))
        && (!query || [m.name, m.formula, m.id, ...(m.tags || [])].some((s) => s && String(s).toLowerCase().includes(query))));
      group.textContent = (on.size ? [...on].join(' + ') : query ? '“' + query + '”' : 'all') + ' · ' + list.length.toLocaleString('en');
      vdeck.set(list, (m, host) => {
        const t = tile(host, 'mm-mol', { formula: m.formulaM ? mathPlain(m.formulaM) : m.formula, name: cap(m.name), sub: [volName(cur), ...(m.tags || [])].join(' · ') }, () => goVolume(cur, m));
        const i = pic(t, null), ph = () => { i.remove(); el('b', 'mm-ph', t, m.formulaM ? mathPlain(m.formulaM) : m.formula); };   // no picture yet: the formula holds the square
        if (!m.thumb) ph(); else V.picture(cur.id, m.id).then((u) => { if (u) { develop(i); i.src = u; } else ph(); }, ph);
      });
    }
    return { wake() { if (!woke) { woke = true; paintShelf(); } } };
  })();

  /* ── the tab under the reader's eye ── */
  let current = sections[0];
  const show = (s) => { if (!s) return; if (s !== current) say(null); current = s; for (const x of sections) x.b.classList.toggle('on', x === s); movePill(s.b); if (s.id === 'library') library.wake(); };
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
