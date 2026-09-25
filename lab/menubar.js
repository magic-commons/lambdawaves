/* menubar.js — THE LOGO'S BAR (waves 25/27, 53, 62, 79, 88, 106): the disclosure under #title — its chips, their lists
 * (filled from the app's MENUS table on each open), the pointer and keyboard roads, the one placement, and a row's act
 * run inside try/finally (N1).  A seam out of rack.js boot() (optimization 2026-09-24 · N7 seam 8, AUDIT-E §6), after N1.
 * The MENUS table — the app's verbs, and the eighteen boot bindings they reach — stays in rack.js; this module takes
 * three things: `title` (the opener), `host` (#lab, where the bar is appended) and `menus` (the table).  It hands back
 * layout.menu and the phone crossing's showMenuBar.  (MIR 1.4.2 stages a shared lab/mir/shell/menubar.js; this is the
 * app's own, extracted as it stands.) */
import { el } from './mir/kit.js';

export function installMenubar({ title, host, menus }) {
  const bar = el('nav', 'menubar', host); bar.id = 'menubar'; bar.setAttribute('popover','manual');bar.hidden = true;
  let openList = null;
  const closeLists = () => { for (const l of bar.querySelectorAll('.mb-list')) l.hidden = true; for (const b of bar.querySelectorAll('.mb-btn')) b.setAttribute('aria-expanded', 'false'); openList = null; };


  const LOGO_SCALE = 1.04;
  /* ── WAVE 62 · THE OPENER IS OPERABLE, AND IT IS A DISCLOSURE, NOT AN ARIA MENUBAR ────────────
   * A conformant role="menubar" needs role="menu"/"menuitem", a roving tabindex across five chips,
   * Left/Right between menus with the open list following, Up/Down within, Home/End, first-letter
   * typeahead, Escape at two levels, aria-haspopup, focus return — and, decisively, menu items must
   * be UNREACHABLE BY TAB, which means rewriting fill() and every item handler.  That is days, and
   * it earns nothing here, because the bar is a DUPLICATE surface: THEME is a seg in SETTINGS,
   * raise() is duplicated by #rackAdd, the project verbs are in the notebook's PROJECTS face, and
   * everything else has a key.  What was actually broken is that a <div> opener cannot be reached
   * at all — so #title becomes operable WITHOUT becoming a <button> (it carries the wordmark, the
   * nine-square SVG, the subtitle and wave 53's menu-open scale, all of which UA button styling
   * would drag on), the bar takes focus on open, and Tab walks the rest, because Tab IS the
   * disclosure pattern's own answer and arrows without the rest of the contract are worse. */
  title.tabIndex = 0;
  title.setAttribute('role', 'button');
  title.setAttribute('aria-haspopup', 'true');
  title.setAttribute('aria-expanded', 'false');
  title.setAttribute('aria-label', 'λWAVES — the FILE, EDIT, VIEW, WINDOW and ABOUT menus');
  /* `bar.hidden` is written in exactly ONE place (wave 53 made barShown the single point of truth
     for the open state), so `aria-expanded` can only be written there too and can never disagree. */


  const barShown = (v) => { const want = document.body.classList.contains('phone') ? true : !!v;
    bar.hidden = !want;if(want&&!bar.matches(':popover-open'))bar.showPopover();else if(!want&&bar.matches(':popover-open'))bar.hidePopover(); title.classList.toggle('menu-open', want); title.setAttribute('aria-expanded', String(want)); };
  for (const name of Object.keys(menus)) {
    const grp = el('div', 'mb-group', bar);
    const btn = el('button', 'mb-btn', grp, name); btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
    const list = el('div', 'mb-list', grp); list.hidden = true;
    const fill = () => { list.innerHTML = ''; for (const entry of menus[name]()) { if (!entry) { const sep = el('div', 'mb-sep', list); sep.setAttribute('role', 'separator'); continue; } const [label, run, dis, hint] = entry; const it = el('button', 'mb-item', list); const kk = label.split('\t'); el('span', 'mb-lbl', it, kk[0]); if (kk[1]) el('span', 'mb-key', it, kk[1]); it.type = 'button'; if (hint) it.title = hint; if (dis && dis()) it.disabled = true;
      /* N1 · A ROW THAT THROWS STILL CLOSES THE MENU.  `.click()` on a trigger swallowed a listener's exception
         (dispatch reports it and returns), so the close below always ran; a direct call propagates, so the close and
         the focus hand-back sit in a `finally`.  Focus returns to the opener only if it was left on the vanished
         item (or on nothing): an act that moved focus on purpose (the keyboard editor, the notebook) keeps it. */
      it.addEventListener('click', (e) => { e.stopPropagation(); try { run(); } finally { closeLists(); barShown(false); const f = document.activeElement; if (!f || f === document.body || bar.contains(f)) title.focus({ preventScroll: true }); } }); } };
    btn.addEventListener('click', (e) => { e.stopPropagation(); const was = openList === list; closeLists(); if (!was) { fill(); list.hidden = false; btn.setAttribute('aria-expanded', 'true'); openList = list; } });
    btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'touch' || !openList || openList === list) return; closeLists(); fill(); list.hidden = false; btn.setAttribute('aria-expanded', 'true'); openList = list; });
  }
  let barTimer = 0;
  /* THE BAR IS PLACED FROM THE GEOMETRY THE SCALE CANNOT MOVE.  The logo grows from `left center`, so its left
     edge and its vertical centre are invariant under the transform while the 120 ms runs; the right edge is the
     untransformed width times the scale.  Measuring r.right instead would put the chips wherever the transition
     happened to be on the frame the menu opened. */
  const showBar = (focusIt) => { clearTimeout(barTimer); barShown(true); const r = title.getBoundingClientRect();
    bar.style.left = (r.left + title.offsetWidth + 8) + 'px';   /* WAVE 79 DELETED THE ENLARGE AND THIS TERM OUTLIVED IT: with nothing scaling, the FINAL right edge IS the plain one, and the LOGO_SCALE factor reserved 11 px for chips whose law is 8 */ bar.style.top = (r.top + r.height / 2 - bar.offsetHeight / 2) + 'px';
    /* the bar is appended to #lab AFTER both racks, so its DOM position would put it 400 stops away.
       Moving focus into it on a keyboard open is what makes that position irrelevant — and it is
       only ever done for the KEYBOARD, so a pointer hover never steals the seat under the hand. */
    if (focusIt) { const first = bar.querySelector('.mb-btn'); if (first) first.focus(); } };
  const hideBarSoon = () => { clearTimeout(barTimer); barTimer = setTimeout(() => { if (!openList) barShown(false); }, 400); };
  title.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') showBar(); });
  title.addEventListener('click', () => { if (bar.hidden) showBar(); else { closeLists(); barShown(false); } });
  title.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code !== 'Enter' && e.code !== 'NumpadEnter') return;   // wave 88: Space is the transport's — a numeric keypad's Return is 'NumpadEnter'
    e.preventDefault();
    if (bar.hidden) showBar(true); else { closeLists(); barShown(false); }
  });
  title.addEventListener('pointerleave', hideBarSoon);
  bar.addEventListener('pointerenter', () => clearTimeout(barTimer));
  bar.addEventListener('pointerleave', hideBarSoon);


  const rackToggleEl = () => document.getElementById('rackToggle');
  document.addEventListener('pointerdown', (e) => { const rt = rackToggleEl();
    if (!bar.hidden && !bar.contains(e.target) && !title.contains(e.target) && !(rt && rt.contains(e.target))) { closeLists(); barShown(false); } });
  /* wave 106: the phone crossing needs to PLACE the bar, not merely un-hide it — `barShown` above
     only writes `hidden`, and the left/top are computed here from the logo's live rect.  Handed back
     rather than duplicated (rack.js hangs it on its hooks table), so there is one placement. */
  return { menu: { open: showBar, close: () => { closeLists(); barShown(false); }, get isOpen() { return !bar.hidden; },
    get scale() { return LOGO_SCALE; }, get enlarged() { return title.classList.contains('menu-open'); } },
    showMenuBar: () => showBar(false) };
}
