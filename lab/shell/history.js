/* lab/shell/history.js — §25 THE TRUE HISTORY and its card (0.5.2 R3a; moved verbatim out of lab/rack.js boot()).  createHistory(app)
 * runs at the seat, so the HISTORY card's device / appendChild / register keep their place in the rack; serialize / restore (persist's),
 * esc (the links') and rotDriving are read live at use (app.sh.x, app.ctl.rotDriving). */
import { el, trig } from '../mir/kit.js';
import { rackPager } from '../pager.js';
import { createEditHistory } from '../edit-domain.js';   // 0.5.0 C5: the one `edit` domain on the kit's stack (mir/history/history.js); lab/history.js left
export function createHistory(app) {
  const { device, reg, hNote } = app; const { rack } = app.host; const { rk } = app.sh; const { wState } = app.w;
  /* 0.3.1 · S3 THE TRUE HISTORY: one reader, writer and key over the edit scope (the chrome, a PREFERENCE, left with the hand-kept
     lists); the key is FNV-1a over the record's JSON, taken at a commit and by canUndo / canRedo — never per frame.  0.5.0 C5: the
     rows are the kit's stack (mir/history/history.js), this record its one `edit` domain (lab/edit-domain.js) */
  const hKey = (j) => { let h = 0x811c9dc5; for (let i = 0; i < j.length; i++) h = Math.imul(h ^ j.charCodeAt(i), 0x01000193); return (h >>> 0).toString(36) + ':' + j.length; };
  let __hver = reg.version;
  Object.defineProperty(reg, 'version', { configurable: true, get() { return __hver; }, set(v) { __hver = v; if (!app.state.rotTicking) hNote(); } });
  /* the LIST repaints itself whenever the ring moves — `onChange` is the ring's own hook and fires on
     every commit, undo, redo, goto and clear, so nothing polls and nothing can drift out of step. */
  let hRender = null;
  app.state.history = createEditHistory({ read: () => { const S = app.sh.serialize({ scope: 'edit' }); S.key = hKey(JSON.stringify(S)); return S; },
    write: (S) => app.sh.restore(S, { history: true }), liveKey: () => hKey(JSON.stringify(app.sh.serialize({ scope: 'edit' }))), depth: 60, quiet: 400, driven: () => app.state.rotMoved && app.ctl.rotDriving(),
    onChange: () => { if (hRender) hRender(); } });
  /* ══ WAVE 106 · THE ROWS GET THEIR NAMES FROM THE THING THE HAND TOUCHED ════════════════════════
     An FL-style list is only worth having if a row says what it was — "Move Pattern", not "edit #17".
     The ring can carry a label now; the question was where a name could come from without touching
     every one of the hundreds of setters in this file.
       It comes from the GESTURE.  This handler already fires on the way down for every control in the
     lab, and the event knows what was pressed — so the name is read off the DOM at exactly the moment
     the coalescing window opens, and every control in the instrument is named for free, including the
     ones written after today.  A knob gives its own caption, a switch and a trigger their word, a
     segment the button plus the group it belongs to; the WINDOW's title comes along so two knobs
     called RATE in different cards do not read as one thing.
       An UNNAMED gesture leaves the ring's default alone rather than blanking a name — a press on the
     card's background should not erase what the drag before it was called. */
  const hTouchName = (t) => {
    if (!t || !t.closest) return '';
    /* the EYEBROW, not the title: `.dev-eyebrow` is the card's short name (ORBIT, WAVE, CLIP) while
       `.dev-title` is its full sentence — measured, a title gave rows like
       "EXPOSURE · SPACE · DRAW · WHAT IS DRAWN OVER THE FIELD", which is a paragraph in a list column.
       This is the same `nameOf` the WINDOW menu already uses for the same reason. */
    const txt = (e) => (e && (e.textContent || '').trim().replace(/\s+/g, ' ')) || '';
    const dev = t.closest('.dev'), mw = !dev && t.closest('#modwin');   // S3: a float, titled by its .kwin-title
    const win = dev ? ((dev.querySelector('.dev-eyebrow') || {}).textContent || dev.dataset.id || '') : mw ? txt(mw.querySelector('.kwin-title')) : '';
    let what = '';
    const k = t.closest('.k');
    if (k) what = txt(k.querySelector('.k-lbl')) || k.getAttribute('aria-label') || 'knob';
    if (!what) { const sw = t.closest('.sw'); if (sw) what = txt(sw.querySelector('.sw-lbl')) || 'switch'; }
    /* a SEG labels itself with `.k-lbl` too (kit.js builds both from the same helper) — on the `.segw` that wraps the
       `.seg` (S4: `closest('.seg, .segw')` stopped at the `.seg`, so a row read DARK, not THEME DARK); safe because
       the knob branch above already claimed anything inside a .k */
    if (!what) { const sb = t.closest('.seg-b'); if (sb) { const g = sb.closest('.segw') || sb.closest('.seg');
      const gl = g ? txt(g.querySelector('.k-lbl')) : ''; what = (gl ? gl + ' ' : '') + txt(sb); } }
    if (!what) { const tr = t.closest('.trig'); if (tr) what = txt(tr.querySelector('.trig-l')) || txt(tr); }
    if (!what) { const fd = t.closest('.fd'); if (fd) what = txt(fd.querySelector('.fd-lbl')) || fd.getAttribute('aria-label') || 'fader'; }
    if (!what) { const f = t.closest('select, input'); if (f && f.type !== 'text' && f.type !== 'search') what = (f.getAttribute('aria-label') || f.title || (f.type === 'color' ? 'colour' : '')).toUpperCase(); }   // S3: a colour well or a <select>
    /* S3 · the MODULATION window's controls: a dial by device and caption (LFO RATE), the rest by device or macro slot and short
       label (LFO SINE, MACRO 1 DEPTH); a label too long for a list gives its first word (LFO BYPASS).  S4 · the curve editor (the
       `.m2svg` of an LFO or ENV; an AUDIO editor is a meter) names its source: its label, else its kind and its place among that
       kind in the window — CURVE · LFO 1 · MODULATION */
    if (!what && mw) {
      const d = t.closest('.m2dev'), slot = t.closest('.m2slot'), k2 = t.closest('.m2k'), c = t.closest('button, input, [aria-label]');
      const curve = d && t.closest('.m2svg') && ['lfo', 'env'].find((x) => d.classList.contains(x));
      if (curve) {
        const own = txt(d.querySelector('.m2minname')).toUpperCase(), K = curve.toUpperCase();
        what = 'CURVE · ' + (own && own !== K ? own : K + ' ' + ([...mw.querySelectorAll('.m2dev.' + curve)].indexOf(d) + 1));
      } else {
        let word = k2 ? txt(k2.querySelector('.m2kcap')) : c ? (c.getAttribute('aria-label') || txt(c)).split(' — ')[0] : '';
        if (word.length > 24) word = word.split(' ')[0];
        const owner = (d ? txt(d.querySelector('.m2kind')) : slot ? txt(slot.querySelector('.m2vname')) : '').toUpperCase();
        word = word.toUpperCase(); what = owner && !word.includes(owner) ? (owner + ' ' + word).trim() : word;
      }
    }
    if (!what) return '';
    const w = (win || '').trim();
    return w && w.toUpperCase() !== what.toUpperCase() ? what + ' · ' + w : what;
  };
  const heldPointers = new Set();
  /* S4 · the RIGHT button is a gesture too: MIR's curve editor adds and places a point by right-drag and resets a tension handle by
     right-click, so button 2 is held and released like button 0 (one row, named).  A pointer already held here lost its up (a
     native context menu can take it): that hold is released first, so a stale count never outlives the next press. */
  document.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.button !== 2) return;
    if (heldPointers.has(e.pointerId)) releasePointer(e);
    heldPointers.add(e.pointerId); app.state.pointerHeld = true;
    app.state.history.hold(hTouchName(e.target));
  }, true);
  const releasePointer = e => {
    if (!heldPointers.delete(e.pointerId)) return;
    app.state.pointerHeld = heldPointers.size > 0;
    app.state.history.release(); // Commits on the next task, after the control's onChange.
  };
  // Capture also sees releases that a control stops from bubbling. An implicit
  // lost capture after pointerup must not release a second finger's undo hold.
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) document.addEventListener(type, releasePointer, true);
  /* S3 · …and the form fields a pointer does not frame (a colour picker, a <select>, a typed name land after the pointerup): their
     input/change events arm the ring, named like a press (notebook typing moves no edit key: no row) */
  for (const type of ['input', 'change']) document.addEventListener(type, (e) => app.state.history.note(hTouchName(e.target)), true);
  const releasePointers = () => { for (const pointerId of heldPointers) releasePointer({ pointerId }); };
  window.addEventListener('blur', releasePointers);
  window.addEventListener('pagehide', releasePointers);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releasePointers(); });
  const historyApi = {
    undo() { const ok = app.state.history.undo(); if (ok) wState.setStatus('undone · ' + app.state.history.depth + ' back, ' + app.state.history.redoDepth + ' forward', 'live'); return ok; },
    redo() { const ok = app.state.history.redo(); if (ok) wState.setStatus('redone · ' + app.state.history.depth + ' back, ' + app.state.history.redoDepth + ' forward', 'live'); return ok; },
    historyUndo() { const ok = app.state.history.historyUndo(); if (ok) wState.setStatus('returned from history jump', 'live'); return ok; },
    get canUndo() { return app.state.history.canUndo; }, get canRedo() { return app.state.history.canRedo; },
    get canHistoryUndo() { return app.state.history.canHistoryUndo; },
    get depth() { return app.state.history.depth; }, get redoDepth() { return app.state.history.redoDepth; }, get limit() { return app.state.history.limit; },
    clear() { app.state.history.clear(); }, flush() { return app.state.history.flush(); }, note(name) { app.state.history.note(name); },
    /* wave 106: the three the LIST needs — the rows, where the instrument is standing, and the jump.
       `goto` commits first (that is the ring's own rule), so jumping away from an unbanked edit banks
       it rather than losing it. */
    entries() { return app.state.history.entries(); }, get cursor() { return app.state.history.cursor; },
    render() { if (hRender) hRender(true); },   // S4: now (the ring's own onChange waits for the next frame)
    goto(i) { const ok = app.state.history.goto(i); if (ok) wState.setStatus('history · row ' + (app.state.history.cursor + 1) + ' of ' + app.state.history.entries().length, 'live'); return ok; },
    label(name) { app.state.history.label(name); },
  };


  const wHist = device({ id: 'history', eyebrow: 'HISTORY', status: '' });
  rack.appendChild(wHist.root); rk.register({ id: 'history', el: wHist, title: 'HISTORY', hint: 'HISTORY' });   // C3: registered where it is built (A4's open item)
  const histList = el('div', 'hist-list', wHist.body);
  /* iteration 017 R2 · HISTORY IN PAGES (Josh: "avoid scrolling in rack windows"; call 4: 12 a page): the list shows twelve rows, newest first,
     and the rack pager (pager.js) turns the rest; every change of the ring shows the page that holds the row you stand on, a turn holds until then */
  const HIST_PAGE = 12; let histAt = -1;
  const histPg = rackPager({ aria: 'History page', cls: 'hist-pager', onPage: (k) => { histAt = k; renderHistory(true); } });
  histList.after(histPg.root);
  let histUndoBtn = null, histRedoBtn = null, histReturnBtn = null;
  {
    const rh = wHist.row('tight hist-actions');
    histUndoBtn = trig({ label: 'UNDO', title: 'step back one row (Ctrl+Z)', onFire: () => historyApi.undo() }).root; rh.appendChild(histUndoBtn).dataset.keyAction = 'undo';
    histRedoBtn = trig({ label: 'REDO', title: 'step forward one row (Ctrl+Shift+Z, Ctrl+Y)', onFire: () => historyApi.redo() }).root; rh.appendChild(histRedoBtn).dataset.keyAction = 'redo';
    histReturnBtn = trig({ label: 'HISTORY UNDO', title: 'return once to the timeline from before the last history jump (Ctrl+Alt+Z)', onFire: () => historyApi.historyUndo() }).root; rh.appendChild(histReturnBtn);
    rh.appendChild(trig({ label: 'CLEAR', title: 'Clear history without changing the state', onFire: () => { historyApi.clear(); } }).root);
    el('div', 'note', wHist.body).innerHTML = '<b>History.</b> Every edit to the project is a row, newest at the top. The last ' + historyApi.limit + ' are kept for Undo and Redo; older ones fall off the bottom. Select a row to jump there. HISTORY UNDO returns once to the timeline from before that jump, even after a new edit. Preferences, the camera, the windows and the notebook are not edits.';
  }
  /* S4 · newest at the top; the list is ONE string with ONE click listener, and onChange asks for ONE repaint per frame (a full ring built node
     by node, a listener each, made one flush 2.6–3.9 ms on the desktop, past S3's < 2 ms).  Since 017 R2 a page of twelve, never a scroller. */
  histList.addEventListener('click', (e) => { const b = e.target.closest('.hist-row'); if (b) historyApi.goto(+b.dataset.i); });
  function renderHistory(turned) {
    histRaf = 0;
    const rows = historyApi.entries(), n = Math.max(1, Math.ceil(rows.length / HIST_PAGE));
    const ci = rows.findIndex((r) => r.state === 'current'), hereAt = ci < 0 ? 0 : Math.floor((rows.length - 1 - ci) / HIST_PAGE);
    histAt = Math.max(0, Math.min(n - 1, turned === true && histAt >= 0 ? histAt : hereAt));
    const top = rows.length - 1 - histAt * HIST_PAGE;
    let h = '';
    for (let j = top; j >= 0 && j > top - HIST_PAGE; j--) {
      const r = rows[j], name = app.sh.esc(r.label || 'edit');   /* the title is the WHOLE name (a key's row is a long sentence the column cuts) */
      h += '<button type="button" class="hist-row hist-' + r.state + '" data-i="' + r.i + '"' + (r.state === 'current' ? ' aria-current="true"' : '')
        + ' title="' + name.replace(/"/g, '&quot;') + (r.state === 'current' ? ' — where the instrument is standing' : ' — land on this moment') + '"><span class="hist-i">' + r.i + '</span><span class="hist-lbl">' + name + '</span></button>';
    }
    histList.innerHTML = h; histPg.paint(histAt, n);
    if (histUndoBtn) histUndoBtn.disabled = !historyApi.canUndo;
    if (histRedoBtn) histRedoBtn.disabled = !historyApi.canRedo;
    if (histReturnBtn) histReturnBtn.disabled = !historyApi.canHistoryUndo;
    wHist.setStatus(rows.length + ' kept  ·  on ' + (historyApi.cursor + 1), 'live');
  }
  let histRaf = 0;
  hRender = (now) => { if (now) { cancelAnimationFrame(histRaf); renderHistory(); } else if (!histRaf) histRaf = requestAnimationFrame(renderHistory); };
  renderHistory();
  return { historyApi };
}
