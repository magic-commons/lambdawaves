/* rack-menus.js — THE TWO LISTS UNDER THE HIDE BUTTON: + (the closed windows, reopened into the rack they came from, a
 * SHIFT-queue that opens several in the order picked) and ☆ (the four favourite layouts: save, load, forget).  A seam out
 * of rack.js boot() (optimization 2026-09-24 · N7 seam 7, AUDIT-E §6); four closure edges, handed in: `layout` (reopen,
 * the layout slots — and the two handles this installs on it, layout.addMenu and layout.favMenu), `readSettings`, `winHint`
 * and `LAYOUT_SLOTS`.  installRackMenus() runs where the block stood, so its document/window listeners are registered in
 * the same order as before. */
import { el, chip } from './mir/kit.js';

export function installRackMenus({ layout, readSettings, winHint, LAYOUT_SLOTS }) {
  const add = document.getElementById('rackAdd'), list = document.getElementById('rackAddList');
  if (add && list) {
    chip(add, 'plus', 'reopen a closed window');   // wave 55: glyph.js's own chip, "for ADD COLOUR and any other 'one more of these' chip"
    const addShown = (v) => { list.hidden = !v; add.setAttribute('aria-expanded', String(!!v)); };
    add.setAttribute('aria-haspopup', 'true'); add.setAttribute('aria-expanded', 'false');


    let queue = [];
    const renumber = () => {
      for (const b of list.querySelectorAll('.mb-item')) {
        const k = queue.indexOf(b.dataset.win);
        b.classList.toggle('queued', k >= 0);
        let n = b.querySelector('.mb-num');
        if (k < 0) { if (n) n.remove(); continue; }
        if (!n) { n = el('span', 'mb-num', b); }
        n.textContent = String(k + 1);
      }
    };
    const clearQueue = () => { queue = []; renumber(); };
    const flushQueue = () => {
      if (!queue.length) return false;
      /* ⚠ OPENED IN REVERSE, SO THE NUMBERS READ DOWN THE RACK.  `layout.reopen` PREPENDS each
         window to the top of its rack, so replaying the pick order puts the FIRST one chosen at
         the BOTTOM — measured: picking slice · shadow · vortex left the rack reading shadow,
         vortex, slice.  Walking the queue backwards makes the badge order and the rack order the
         same list, which is the only reading of "remember the order" a user can actually see. */
      const ids = queue.slice(); clearQueue(); addShown(false);
      for (let i = ids.length - 1; i >= 0; i--) layout.reopen(ids[i], 'R');
      return true;
    };
    add.addEventListener('click', (e) => {
      e.stopPropagation(); if (!list.hidden) { clearQueue(); addShown(false); return; }
      list.innerHTML = ''; clearQueue();


      const favIds = (() => {
        const m = readSettings().layouts || {};
        let best = null, at = -1;
        for (const k of Object.keys(m)) { const L = m[k]; if (L && (L.at || 0) > at) { at = L.at || 0; best = L; } }
        if (!best || !Array.isArray(best.cards)) return null;
        return new Set(best.cards.filter((c) => !c.closed).map((c) => c.id));
      })();
      const nameOf = (d) => (d.querySelector('.dev-eyebrow').textContent || d.dataset.id || '').trim();
      const closed = [...document.querySelectorAll('.dev.closed:not([hidden])')]
        .sort((a, b) => nameOf(a).localeCompare(nameOf(b), undefined, { sensitivity: 'base' }));
      if (!closed.length) el('div', 'rack-add-none', list, 'nothing is closed — × on a window closes it');
      for (const d of closed) {
        const it = el('button', 'mb-item', list, '⊕  ' + d.querySelector('.dev-eyebrow').textContent);
        it.type = 'button'; it.dataset.win = d.dataset.id;
        if (favIds && favIds.has(d.dataset.id)) {
          const st = el('span', 'mb-fav', it, '★');
          st.title = 'Included in the most recently saved layout';
          st.setAttribute('aria-label', 'in the saved favourite layout');
        }
        it.title = winHint(d) + '  ·  SHIFT-click to queue several; they open in the order you picked them when you let SHIFT go';
        it.addEventListener('click', (ev) => {
          ev.stopPropagation();
          if (ev.shiftKey) {
            const i = queue.indexOf(d.dataset.id);
            if (i >= 0) queue.splice(i, 1); else queue.push(d.dataset.id);
            renumber(); return;
          }
          clearQueue(); layout.reopen(d.dataset.id, 'R'); addShown(false);
        });
      }
      addShown(true);
    });
    /* the COMMIT.  `key` rather than `code`, so either Shift answers. */
    window.addEventListener('keyup', (ev) => { if (ev.key === 'Shift' && !list.hidden) flushQueue(); });
    document.addEventListener('pointerdown', (ev) => { if (!list.hidden && !list.contains(ev.target) && ev.target !== add) { clearQueue(); addShown(false); } });
    layout.addMenu = { open: () => { add.click(); return true; }, close: () => { clearQueue(); addShown(false); return true; }, get shown() { return !list.hidden; },
      /* the queue, readable — a gate should not have to infer an order from four animations */
      get queued() { return queue.slice(); }, commit: flushQueue };
  }


  const favBtn = document.getElementById('rackFav'), favList = document.getElementById('rackFavList');
  if (favBtn && favList) {
    const draw = () => {
      favList.innerHTML = '';
      const saved = layout.layouts();
      const save = el('button', 'mb-item', favList, '☆  SAVE LAYOUT' + (saved.length >= LAYOUT_SLOTS ? '  ·  replaces the oldest' : ''));
      save.type = 'button'; save.title = 'Save the current window arrangement';
      save.addEventListener('click', (ev) => { ev.stopPropagation(); layout.saveLayout(); draw(); });
      el('div', 'rack-fav-head', favList, saved.length ? 'LOAD LAYOUT' : 'nothing saved yet');
      for (const L of saved) {
        const it = el('button', 'mb-item', favList, '⊙  ' + L.label);
        it.type = 'button'; it.title = 'Restore this window layout';
        const x = el('span', 'fav-x', it, '×'); x.title = 'forget this layout';
        it.addEventListener('click', (ev) => { ev.stopPropagation(); if (ev.target === x) { layout.forgetLayout(L.slot); draw(); return; } layout.loadLayout(L.slot); favShown(false); });
      }
      return saved.length;
    };
    const favShown = (v) => { favList.hidden = !v; favBtn.setAttribute('aria-expanded', String(!!v)); };
    favBtn.setAttribute('aria-haspopup', 'true'); favBtn.setAttribute('aria-expanded', 'false');
    favBtn.addEventListener('click', (e) => { e.stopPropagation(); if (!favList.hidden) { favShown(false); return; } list.hidden = true; draw(); favShown(true); });
    document.addEventListener('pointerdown', (ev) => { if (!favList.hidden && !favList.contains(ev.target) && ev.target !== favBtn) favShown(false); });
    layout.favMenu = { open: () => { list.hidden = true; draw(); favShown(true); return true; }, close: () => { favShown(false); return true; },
      get shown() { return !favList.hidden; }, get items() { return [...favList.querySelectorAll('.mb-item')].map((b) => b.textContent); }, redraw: draw };
  }
}
