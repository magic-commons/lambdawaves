/* MIR · shell/menubar.js — FILE · EDIT · VIEW · WINDOW · ABOUT, opened by the wordmark.
 *
 * Ported from λWAVES rack.js ("the logo opens FILE · EDIT · WINDOW", waves 53–106, its Escape at wave 62 and its
 * phone crossing at wave 106), with the one thing BASINS' copy added: a menu item that throws cannot leave the bar
 * stuck open.
 *
 * THE LAWS IT CARRIES (λWAVES' own words where they exist)
 *   · Hovering the wordmark shows the bar; leaving both for 400 ms hides it.  A touch never opens it by hover.
 *   · It is a DISCLOSURE, not an ARIA menubar: the wordmark is a role=button with aria-expanded, a keyboard open
 *     moves focus to the first group, and Tab walks the rest (λWAVES wave 62 says why the full menubar contract
 *     earns nothing for a duplicate surface).
 *   · The bar is placed from geometry the wordmark's transform cannot move: its left edge + untransformed width + 8,
 *     centred on its vertical middle.
 *   · Each list is FILLED WHEN IT OPENS, so every label says the live state (a recent file, a disabled UNDO).
 *   · Hovering another group while one is open switches to it; a press outside closes everything.
 *   · Escape closes it and gives focus back to the wordmark.
 *   · On a phone the bar is always shown: crossing into the phone breakpoint shows and places it on the next frame.
 *     "Phone" is the kit's sentinel — skin.css raises `--phone` to 1 at its breakpoint — or `body.phone` where an
 *     app sets that class itself.
 *
 * MENUS ARE DATA.  `menus` maps a group name to a function returning entries, each either `null` (a separator) or
 *   [label, run, disabled?, hint?]   label may carry a key after a TAB: 'SAVE project\tCtrl+S';
 *                                    disabled is a boolean or a function asked each time the list opens
 *
 * createMenubar({ opener, host, menus, label, phone, keep }) → { open(focus?), close(), openGroup(name), isOpen, items, bar, destroy() }
 *   One menubar per page: it owns the id `menubar`.  destroy() removes the bar and every listener it added.
 *   opener  the wordmark element (shell/wordmark.js)
 *   host    where the <nav id="menubar"> is appended (λWAVES: #lab)
 *   label   the opener's aria-label (default: '<word> — the <GROUPS> menus')
 *   phone   () => boolean, the phone law (default: the --phone sentinel, or body.phone)
 *   keep    () => Element[] — presses inside these do not close the bar (λWAVES: #rackToggle) */
import { el } from '../kit.js';

export function createMenubar({ opener, host, menus, label, phone, keep } = {}) {
  if (!opener || !menus) return null;
  const isPhone = phone || (() => document.body.classList.contains('phone') || (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--phone')) || 0) >= 1);
  const life = new AbortController(), on = { signal: life.signal };
  const keepers = keep || (() => [document.getElementById('rackToggle')].filter(Boolean));
  const bar = el('nav', 'menubar', host || document.body); bar.id = 'menubar';
  try { bar.setAttribute('popover', 'manual'); } catch (_) {}
  bar.hidden = true;
  const canPop = typeof bar.showPopover === 'function';
  let openList = null;
  const closeLists = () => { for (const l of bar.querySelectorAll('.mb-list')) l.hidden = true; for (const b of bar.querySelectorAll('.mb-btn')) b.setAttribute('aria-expanded', 'false'); openList = null; };

  const names = Object.keys(menus);
  const word = (opener.querySelector('.lam') ? opener.querySelector('.lam').textContent : '') + (opener.querySelector('.word') ? opener.querySelector('.word').textContent : '');
  opener.tabIndex = 0;
  opener.setAttribute('role', 'button');
  opener.setAttribute('aria-haspopup', 'true');
  opener.setAttribute('aria-expanded', 'false');
  opener.setAttribute('aria-label', label || `${word} — the ${names.slice(0, -1).join(', ')}${names.length > 1 ? ' and ' : ''}${names[names.length - 1]} menus`);

  /* `bar.hidden` is written in exactly ONE place, so aria-expanded can never disagree with it */
  const barShown = (v) => {
    const want = isPhone() ? true : !!v;
    bar.hidden = !want;
    if (canPop) { try { if (want && !bar.matches(':popover-open')) bar.showPopover(); else if (!want && bar.matches(':popover-open')) bar.hidePopover(); } catch (_) {} }
    opener.classList.toggle('menu-open', want); opener.setAttribute('aria-expanded', String(want));
  };
  for (const name of names) {
    const grp = el('div', 'mb-group', bar);
    const btn = el('button', 'mb-btn', grp, name); btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
    const list = el('div', 'mb-list', grp); list.hidden = true;
    const fill = () => {
      list.innerHTML = '';
      for (const entry of menus[name]()) {
        if (!entry) { const sep = el('div', 'mb-sep', list); sep.setAttribute('role', 'separator'); continue; }
        const [text, run, dis, hint] = entry;
        const it = el('button', 'mb-item', list); it.type = 'button';
        const kk = String(text).split('\t');
        el('span', 'mb-lbl', it, kk[0]);
        if (kk[1]) el('span', 'mb-key', it, kk[1]);
        if (hint) it.title = hint;
        if (typeof dis === 'function' ? dis() : dis === true) it.disabled = true;
        it.addEventListener('click', (e) => { e.stopPropagation(); closeLists(); barShown(false); try { if (run) run(); } catch (err) { console.warn('menu: ' + kk[0], err); } });   // the item dies with the list
      }
    };
    btn.addEventListener('click', (e) => { e.stopPropagation(); const was = openList === list; closeLists(); if (!was) { fill(); list.hidden = false; btn.setAttribute('aria-expanded', 'true'); openList = list; } });
    btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'touch' || !openList || openList === list) return; closeLists(); fill(); list.hidden = false; btn.setAttribute('aria-expanded', 'true'); openList = list; });
  }
  let barTimer = 0;
  const place = () => {
    const r = opener.getBoundingClientRect();
    bar.style.left = (r.left + opener.offsetWidth + 8) + 'px';
    bar.style.top = (r.top + r.height / 2 - bar.offsetHeight / 2) + 'px';
  };
  const showBar = (focusIt) => {
    clearTimeout(barTimer); barShown(true); place();
    /* the bar sits late in the DOM; moving focus into it on a KEYBOARD open makes that irrelevant, and a pointer
       hover never steals the seat under the hand */
    if (focusIt) { const first = bar.querySelector('.mb-btn'); if (first) first.focus(); }
  };
  const hide = () => { closeLists(); barShown(false); };
  const hideBarSoon = () => { clearTimeout(barTimer); barTimer = setTimeout(() => { if (!openList) barShown(false); }, 400); };
  opener.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') showBar(); }, on);
  opener.addEventListener('click', () => { if (bar.hidden) showBar(); else hide(); }, on);
  opener.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code !== 'Enter' && e.code !== 'NumpadEnter') return;   // Space belongs to the app (λWAVES: the transport)
    e.preventDefault();
    if (bar.hidden) showBar(true); else hide();
  }, on);
  opener.addEventListener('pointerleave', hideBarSoon, on);
  bar.addEventListener('pointerenter', () => clearTimeout(barTimer));
  bar.addEventListener('pointerleave', hideBarSoon);
  document.addEventListener('pointerdown', (e) => {
    if (bar.hidden || bar.contains(e.target) || opener.contains(e.target)) return;
    if (keepers().some((k) => k && k.contains(e.target))) return;
    hide();
  }, on);
  /* λWAVES wave 62: Escape closes the bar and the wordmark takes the focus back, so the keyboard is where it was */
  window.addEventListener('keydown', (e) => { if (e.code === 'Escape' && !bar.hidden && !e.defaultPrevented) { e.preventDefault(); hide(); opener.focus(); } }, on);
  /* THE PHONE CROSSING (λWAVES wave 106): entering the breakpoint shows and PLACES the bar on the next frame;
     leaving it lets the bar go unless a list is open */
  let wasPhone = isPhone();
  const syncPhone = () => { const now = isPhone(); if (now === wasPhone) return; wasPhone = now; if (now) requestAnimationFrame(() => { if (isPhone()) showBar(false); }); else if (!openList) barShown(false); };
  window.addEventListener('resize', syncPhone, { passive: true, signal: life.signal });
  window.addEventListener('orientationchange', syncPhone, { passive: true, signal: life.signal });
  if (wasPhone) requestAnimationFrame(() => { if (isPhone()) showBar(false); });
  /* a bar placed before the wordmark's face has loaded sits where the fallback font ended (measured: 3 px right on a
     phone), and one left up through a resize sits where the old layout put it — so a shown bar is placed again */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!life.signal.aborted && !bar.hidden) place(); });
  window.addEventListener('resize', () => { if (!bar.hidden) place(); }, { passive: true, signal: life.signal });
  return {
    bar,
    open: showBar,
    close: () => { hide(); return true; },
    get isOpen() { return !bar.hidden; },
    /** open the bar and one group, as a click would */
    openGroup(name) { showBar(false); const b = [...bar.querySelectorAll('.mb-btn')].find((x) => x.textContent === name); if (b && (!openList || openList !== b.nextElementSibling)) b.click(); return !!b; },
    get items() { return openList ? [...openList.querySelectorAll('.mb-item')].map((b) => b.textContent) : []; },
    destroy() { clearTimeout(barTimer); life.abort(); try { if (canPop && bar.matches(':popover-open')) bar.hidePopover(); } catch (_) {} bar.remove();
      opener.classList.remove('menu-open'); for (const a of ['tabindex', 'role', 'aria-haspopup', 'aria-expanded', 'aria-label']) opener.removeAttribute(a); },
  };
}
