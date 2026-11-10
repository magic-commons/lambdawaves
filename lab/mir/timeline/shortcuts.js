/* timeline/shortcuts.js — THE TIMELINE'S KEYS, AS ROWS OF THE APP'S ONE KEY TABLE, AND THE SHEET MADE FROM THEM
 * (harvested from BASINS app/timeline-shortcuts.js and the keydown handler of app/timeline-editor.js, 2026-10-02).
 *
 * In BASINS the keys were a hand-written keydown handler beside a display table (TIMELINE_KEYS), kept in step by a test.
 * In the kit THE TABLE IS THE ONE SOURCE: timelineActions(get) are rows for createKeys (docs/KEYS.md), gated to the
 * timeline's surface with `when` (the window open, the focus in the surface, not in a field or the transport), so a key
 * is rebindable in the KEYBOARD window, shown in menus and hints, and the SHORTCUTS sheet (and docs/TIMELINE.md's table)
 * are generated from the same rows, with the user's own bindings.
 *   timelineActions(get) → [{ id, label, group, keys, hint, note, run, when }]   get() → the timeline (window.js) or null
 *   TIMELINE_POINTER  [{ label: gesture, hint: what it does, t: its FL / BASINS note }] — the pointer and touch law, which no key table holds
 *   TIMELINE_FIXED    [{ label: key, hint, t }] — Escape (the kit keeps it) and Space (the one play: the transport's row,
 *                     transportActions); hiding the interface ends a gesture or a menu by itself, on whatever key 'hide' has
 *   shortcutRows(actions, keys?) → [{ keys, label, hint, note }]  ·  openTimelineShortcuts({ actions, keys, x, y }) → root
 *   renderShortcutsMarkdown(actions) → the markdown table docs/TIMELINE.md carries (tests/timeline-ticks.node.mjs)
 * Words are English keys, translated where they are shown; a key cap is never translated (keys.js displayChord). */
import { el, label, ariaLabel } from '../kit.js';
import { cssZoom } from '../core/zoom.js';
import { displayChord, normalize, EDIT_KEYS } from '../shell/keys.js';

const G = 'TIMELINE';   // tr: the key table's group for the timeline's keys
/* one row: id, the label (short, for menus and the drawn board), the hint (BASINS' sentence), the FL note, the chords, the verb */
const row = (w, keys, run) => ({ id: 'timeline.' + w.id, label: w.label, group: G, hint: w.hint, note: w.t, keys, run });
export function timelineActions(get) {
  const live = () => { const tl = get(); return !!(tl && tl.editor && tl.editor.keysLive()); };
  const A = (fn) => (e) => { const tl = get(); if (tl && tl.editor) fn(tl.editor.act, e); };
  const rows = [
    row({ id: 'select-all', label: 'SELECT ALL', hint: 'Select all clips', t: 'FL — Select All' }, ['Mod+A'], A((a) => a.selectAll())),
    row({ id: 'deselect', label: 'DESELECT', hint: 'Deselect', t: 'FL — Deselect selection' }, ['Mod+D'], A((a) => a.deselect())),
    row({ id: 'duplicate', label: 'DUPLICATE', hint: 'Duplicate the selection, placed to its right', t: 'BASINS — FL documents no Ctrl+B; every copy gets an independent source, never a linked one' }, ['Mod+B'], A((a) => a.duplicate())),
    row({ id: 'copy', label: 'COPY', hint: 'Copy the selection', t: 'FL — Copy selection' }, ['Mod+C'], A((a) => a.copy())),
    row({ id: 'cut', label: 'CUT', hint: 'Cut the selection', t: 'FL — Cut selection' }, ['Mod+X'], A((a) => a.cut())),
    row({ id: 'paste', label: 'PASTE', hint: 'Paste at the playhead, into the active lane', t: 'FL — Paste selection' }, ['Mod+V'], A((a) => a.paste())),
    /* UNDO / REDO are the app's one pair ('undo', 'redo': shell/keys.js EDIT_KEYS), not the timeline's own: with a history
       they are the history's rows and these are left out (bind.js); without one, these are them */
    { ...row({ id: 'undo', label: 'UNDO', hint: 'Undo', t: 'standard — not an FL Playlist binding' }, EDIT_KEYS.undo.slice(), A((a) => a.undo())), id: 'undo', group: 'EDIT' },
    { ...row({ id: 'redo', label: 'REDO', hint: 'Redo', t: 'standard — not an FL Playlist binding' }, EDIT_KEYS.redo.slice(), A((a) => a.redo())), id: 'redo', group: 'EDIT' },
    row({ id: 'range-to-selection', label: 'RANGE TO SELECTION', hint: 'Set the time range to the selection’s span', t: 'BASINS' }, ['Mod+Enter'], A((a) => a.rangeToSelection())),
    row({ id: 'range-back', label: 'RANGE BACK', hint: 'Slide the time range back by its own width', t: 'BASINS' }, ['Mod+ArrowLeft'], A((a) => a.slideRange(-1))),
    row({ id: 'range-forward', label: 'RANGE FORWARD', hint: 'Slide the time range forward by its own width', t: 'BASINS' }, ['Mod+ArrowRight'], A((a) => a.slideRange(1))),
    row({ id: 'delete', label: 'DELETE', hint: 'Delete the selection', t: 'BASINS — FL’s Backspace toggles Global Snap; not adopted, since an iPad keyboard has no forward Delete' }, ['Delete', 'Backspace'], A((a) => a.deleteSelection())),
    row({ id: 'home', label: 'TO START', hint: 'Seek to the beginning', t: 'FL — Move playback marker to start' }, ['Home'], A((a) => a.home())),
    row({ id: 'next-bar', label: 'NEXT BAR', hint: 'Seek to the next measure', t: 'FL — Next bar' }, ['NumpadMultiply'], A((a) => a.bar(1))),
    row({ id: 'prev-bar', label: 'PREVIOUS BAR', hint: 'Seek to the previous measure', t: 'FL — Previous bar' }, ['NumpadDivide'], A((a) => a.bar(-1))),
    row({ id: 'center', label: 'CENTER PLAYHEAD', hint: 'Center the view on the playhead', t: 'BASINS' }, ['Shift+Digit0'], A((a) => a.centerPlayhead())),
    row({ id: 'zoom-1', label: 'ZOOM 1', hint: 'Zoom to 12px per beat', t: 'FL — Horizontal Zoom level 1' }, ['Shift+Digit1'], A((a) => a.zoomLevel(1))),
    row({ id: 'zoom-2', label: 'ZOOM 2', hint: 'Zoom to 20px per beat', t: 'FL — Horizontal Zoom level 2' }, ['Shift+Digit2'], A((a) => a.zoomLevel(2))),
    row({ id: 'zoom-3', label: 'ZOOM 3', hint: 'Zoom to 40px per beat', t: 'FL — Horizontal Zoom level 3' }, ['Shift+Digit3'], A((a) => a.zoomLevel(3))),
    row({ id: 'zoom-all', label: 'ZOOM ALL', hint: 'Zoom to show the whole arrangement', t: 'FL — Horizontal Zoom, show all' }, ['Shift+Digit4'], A((a) => a.zoomAll())),
    row({ id: 'zoom-selection', label: 'ZOOM TO SELECTION', hint: 'Zoom to the selection', t: 'FL — Zoom to selection (Shift+5); Shift+Z is BASINS’ own, kept beside it' }, ['Shift+Digit5', 'Shift+KeyZ'], A((a) => a.zoomSelection())),
    row({ id: 'invert', label: 'INVERT SELECTION', hint: 'Invert the clip selection', t: 'FL — Invert selection' }, ['Shift+KeyI'], A((a) => a.invert())),
    row({ id: 'zoom-in', label: 'ZOOM IN', hint: 'Zoom in', t: 'FL — Zoom in' }, ['PageUp'], A((a) => a.zoomStep(1))),
    row({ id: 'zoom-out', label: 'ZOOM OUT', hint: 'Zoom out', t: 'FL — Zoom out' }, ['PageDown'], A((a) => a.zoomStep(-1))),
    row({ id: 'nudge-back', label: 'MOVE EARLIER', hint: 'Move the selection earlier by the snap (Alt: a sixteenth)', t: 'FL — Shift+arrows move clips' }, ['Shift+ArrowLeft', 'Alt+Shift+ArrowLeft'], A((a, e) => a.nudge(-1, 0, !!(e && e.altKey)))),
    row({ id: 'nudge-forward', label: 'MOVE LATER', hint: 'Move the selection later by the snap (Alt: a sixteenth)', t: 'FL — Shift+arrows move clips' }, ['Shift+ArrowRight', 'Alt+Shift+ArrowRight'], A((a, e) => a.nudge(1, 0, !!(e && e.altKey)))),
    row({ id: 'lane-up', label: 'LANE UP', hint: 'Move the selection up a lane', t: 'BASINS — FL has no lane axis to move on' }, ['Shift+ArrowUp'], A((a) => a.nudge(0, -1))),
    row({ id: 'lane-down', label: 'LANE DOWN', hint: 'Move the selection down a lane', t: 'BASINS — FL has no lane axis to move on' }, ['Shift+ArrowDown'], A((a) => a.nudge(0, 1))),
    row({ id: 'tool-select', label: 'SELECT MODE', hint: 'Select mode', t: 'FL — Select tool' }, ['KeyE'], A((a) => a.tool('select'))),
    row({ id: 'tool-edit', label: 'PENCIL MODE', hint: 'Pencil mode', t: 'FL — Draw tool (P)' }, ['KeyP'], A((a) => a.tool('edit'))),
    row({ id: 'tool-scrub', label: 'PREVIEW MODE', hint: 'Preview mode: a press plays from there while held, a drag scrubs', t: 'FL — Playback tool (Y)' }, ['KeyY'], A((a) => a.tool('scrub'))),
    row({ id: 'tool-slice', label: 'SLICE MODE', hint: 'Slice mode', t: 'FL — Slice tool' }, ['KeyC'], A((a) => a.tool('slice'))),
    /* THE OTHER MODES (1.5.7-alpha.49, THE MODE MENU): rows with no key of their own — FL's B · N · D · T · Z are the kit's and the apps' (B the rack,
       T the transport's dock …) — so the KEYBOARD window can give them one; THE MODE MENU and the bar's MODE chip choose them meanwhile */
    row({ id: 'tool-paint', label: 'PAINT MODE', hint: 'Paint mode: drag to lay the last clip end to end', t: 'FL — Paint tool (B); unbound in MIR' }, [], A((a) => a.tool('paint'))),
    row({ id: 'tool-paintadd', label: 'PAINT ADD MODE', hint: 'Paint Add mode: lay the last clip a snap step long, step by step', t: 'FL — Paint in drum-sequencer mode (N); unbound in MIR' }, [], A((a) => a.tool('paintadd'))),
    row({ id: 'tool-delete', label: 'DELETE MODE', hint: 'Delete mode: the left button deletes what it crosses', t: 'FL — Delete tool (D); unbound in MIR' }, [], A((a) => a.tool('delete'))),
    row({ id: 'tool-mute', label: 'MUTE MODE', hint: 'Mute mode: a press mutes or unmutes a clip', t: 'FL — Mute tool (T); unbound in MIR' }, [], A((a) => a.tool('mute'))),
    row({ id: 'tool-zoom', label: 'ZOOM MODE', hint: 'Zoom mode: drag a range to zoom to it, click to zoom out', t: 'FL — Zoom tool (Z); unbound in MIR' }, [], A((a) => a.tool('zoom'))),
    row({ id: 'slice', label: 'SLICE AT PLAYHEAD', hint: 'Slice every selected clip at the playhead (one undo)', t: 'BASINS — FL slices with the tool; Insert cuts the selection at the playhead' }, ['Insert'], A((a) => a.sliceAtPlayhead())),
    row({ id: 'stretch-audio', label: 'STRETCH AUDIO', hint: 'Fit each selected audio clip’s remaining audio into its length (varispeed)', t: 'BASINS — Shift+T' }, ['Shift+KeyT'], A((a) => a.stretchAudio())),
  ];
  for (const r of rows) r.when = live;
  return rows;
}

// Pointer and touch gestures, from BASINS docs/TIMELINE-PLAYHEAD-SELECTION-2026-10-01.md §2 and the MIR curve law; THE HANDS
// (1.5.6-alpha.23, λWAVES 032): one modifier table — Shift selects and fines, Ctrl shapes, Alt bypasses Snap and deletes.
export const TIMELINE_POINTER = [   // tr: the timeline's pointer gestures: the gesture, what it does, its FL Studio counterpart
  { label: 'Middle button, hold + drag', hint: 'Pan time and tracks', t: 'FL — Middle-Mouse-Click pans' },
  { label: 'Middle click on the lanes · middle + right together · the bar’s MODE chip', hint: 'Open THE MODE MENU: the nine modes (the left button’s tool) and this window’s menus', t: 'FL — Middle-Mouse-Click + Right-Click opens the context tool-menu; the lone middle click and the chip are MIR’s' },
  { label: 'Wheel over the timeline', hint: 'Scroll time (Shift + wheel too; with more lanes than fit, the wheel scrolls the lanes); Ctrl/Cmd + wheel zooms', t: 'FL — the wheel scrolls the playlist, Ctrl + wheel zooms' },
  { label: 'Drag past the left or right edge', hint: 'Scroll time while you hold it there (the playhead, a range, a move, a trim, a stretch)', t: 'FL — the playlist scrolls under a drag held at its edge' },
  { label: 'Right-button drag on empty lane space (or between lanes)', hint: 'Delete every clip the pointer crosses, tab or body (one undo); down on a tab deletes it at once', t: 'FL — right-click deletes a clip; MIR sweeps while the button is held' },
  { label: 'Shift + drag (empty)', hint: 'Rectangle-select clips or points', t: 'adapted — FL’s Ctrl+drag; in MIR Shift selects' },
  { label: 'Ctrl/Cmd + Shift + drag', hint: 'Add to the rectangle selection', t: 'FL — Ctrl+Shift+drag adds' },
  { label: 'Shift + click a clip', hint: 'Toggle it in the selection', t: 'adapted — FL’s Ctrl+click toggles' },
  { label: 'Shift + drag a clip', hint: 'Duplicate the selection (the clip joins it) and move the copies (tab or body)', t: 'FL — Shift-drag clones a clip' },
  { label: 'Ctrl/Cmd + drag a clip', hint: 'Duplicate the selection while moving it (title or body): an alias of Shift + drag, kept', t: 'adapted — FL’s Shift-drag clones; MIR’s Ctrl alias stays' },
  { label: 'Drag a clip’s edge', hint: 'Trim it: the curve keeps its beats; every selected clip trims with it, each from its own start. The zone is centred on the edge; where two clips meet, the side you are on names the clip, and its edge lights first', t: 'FL — drag a clip’s edge; a selection resizes together; the lit edge is the one that moves' },
  { label: 'Ctrl/Cmd + drag a clip’s edge', hint: 'Stretch it: the curve keeps its shape; several selected close their gaps, then stretch as one', t: 'MIR — length and speed change together' },
  { label: 'Ctrl/Cmd + Shift + drag a clip’s edge', hint: 'Stretch it finely (⅛, free of Snap)', t: 'MIR — Shift is the fine gear' },
  { label: 'Pencil: click empty lane space', hint: 'Place the clip last pressed there (the same curve, shared)', t: 'FL — the pencil places the last clip; MAKE UNIQUE detaches it' },
  { label: 'Paint: drag over empty lane space', hint: 'Lay the clip last pressed end to end, a copy in every slot the pointer passes (one undo); on a clip it is the pencil', t: 'FL — the Paint tool paints clips while dragging' },
  { label: 'Paint Add: drag over empty lane space', hint: 'Lay the clip last pressed one snap step long on the grid, its shape squeezed into the step; a press on a clip mutes or unmutes it', t: 'FL — Paint in drum-sequencer mode: one step a click, a click on a note mutes it' },
  { label: 'Delete: press or drag', hint: 'Delete every clip the pointer crosses (one undo): the right button’s sweep on the left button', t: 'FL — the Delete tool' },
  { label: 'Mute: press or drag', hint: 'Mute or unmute a clip; a drag gives every clip it crosses the state the first took (one undo). A muted clip is hollow and plays nothing', t: 'FL — the Mute tool' },
  { label: 'Zoom: drag a range · click', hint: 'Zoom to the range dragged; a click zooms out to the whole arrangement', t: 'FL — the Zoom tool: drag zooms to the selection, a click zooms out' },
  { label: 'Preview: press · drag', hint: 'Play from the press while it is held; a drag scrubs (the hand leads)', t: 'FL — the Playback tool: a click plays from there, a drag scrubs' },
  { label: 'Shift + drag the ruler', hint: 'Select a time range; + Ctrl/Cmd extends it', t: 'adapted — FL selects by dragging the bar-ruler' },
  { label: 'Select: drag the ruler', hint: 'Select a time range (no key, so touch can); a tap seeks and keeps the range', t: 'FL — dragging the bar-ruler selects time' },
  { label: 'Drag the ruler', hint: 'Scrub: the playhead follows the hand, free of Snap; the range stays', t: 'BASINS — the hand leads' },
  { label: 'Double-click the ruler', hint: 'Clear the time range (two presses within 300 ms at one spot); no single click clears it', t: 'MIR — Josh 2026-11-09; FL clears the selection on a click' },
  { label: 'Ctrl/Cmd + vertical drag on the ruler', hint: 'Zoom time around the pointer’s beat (up = in)', t: 'BASINS — a touch-friendly zoom; a horizontal Ctrl-drag scrubs on Snap' },
  { label: 'Hold a knob', hint: 'Create a timeline clip from it, or locate its clips', t: 'BASINS' },
  { label: 'ACTIVE (toolbar)', hint: 'Mark the ruler’s range, or the whole arrangement, as the active range; again to clear', t: 'BASINS — the range the record window renders' },
  { label: 'Slice: click a clip · drag down the lanes', hint: 'Cut the clip at the pointer’s beat (Snap applies, Alt bypasses); a drag cuts every clip its line crosses there (one undo)', t: 'FL — the Slice tool: click and drag vertically to slice' },
  { label: 'Drag a pattern / audio clip body', hint: 'Move it (Shift or Ctrl copies, right-button deletes); it has no points', t: 'FL — pattern clips move from their body' },
  { label: 'Right-drag empty clip space', hint: 'Add and place a point', t: 'FL — Right-Click + drag adds a point' },
  { label: 'Shift + right-click a clip', hint: 'Add a point that preserves its current value', t: 'FL — Shift+Right-Click is non-destructive add' },
  { label: 'Left-drag a point or tension handle', hint: 'Move it', t: 'FL — drag a node or a tension handle' },
  { label: 'Shift (held) while dragging a point or tension', hint: 'Fine-tune it (⅛; a point’s time is free of Snap)', t: 'adapted — FL fines tension with Ctrl; Shift is MIR’s fine gear' },
  { label: 'Ctrl/Cmd (held) while moving a point', hint: 'Lock its time', t: 'FL — Ctrl locks horizontal' },
  { label: 'Ctrl/Cmd + drag a tension handle', hint: 'Repeat the segment between its two points: up adds copies of its shape (one per 24 px), down makes mirrored copies, or takes back copies made going up', t: 'MIR — Ctrl shapes (Josh, 040)' },
  { label: 'Right-click a tension handle', hint: 'Reset it', t: 'BASINS — FL’s right-click opens a Delete menu instead' },
  { label: 'Alt + left-click a point', hint: 'Delete it', t: 'adapted — FL’s manual names Right-Alt+click specifically' },
  { label: 'Alt (held)', hint: 'Bypass Snap for the gesture in progress', t: 'FL — Alt temporarily sets snap to none' },
];
export const TIMELINE_FIXED = [   // tr: keys the timeline keeps outside the key table: the key, what it does, a note
  { label: 'Space', hint: 'Play / pause, exact resume', t: 'BASINS — the transport’s one play (transportActions); FL’s Space stops to the start position instead' },
  { label: 'Escape', hint: 'Cancel the gesture in flight, close menus, rewind a cancelled scrub', t: 'BASINS — active wherever the timeline is open' },
];   // H is no longer here: hiding the interface (the table's 'hide', on whatever key) releases any open menu or gesture

/** shortcutRows(actions, keys?) → the sheet's keyboard rows: the user's chords when a table is given, else the declared ones */
export function shortcutRows(actions, keys = null, platform = 'other') {
  return actions.map((a) => {
    const chords = keys && typeof keys.chords === 'function' ? keys.chords(a.id) : a.keys.map((k) => normalize(k, platform)).filter(Boolean);
    return { id: a.id, keys: chords.map((c) => displayChord(c, platform)).join(' · ') || '—', label: a.label, hint: a.hint, note: a.note };
  });
}

function sheetRow(parent, cols, id) {
  const r = el('div', 'tl-shortcut-row', parent); if (id) r.dataset.id = id;
  cols.forEach(([text, raw], i) => { const c = el('span', 'tl-shortcut-col', r); if (raw) c.textContent = text; else label(c, text); if (i === 0) c.dir = 'ltr'; });
  return r;
}
/** openTimelineShortcuts({ actions, keys, x, y, platform }) — the sheet near (x, y): the house's menu pane, clamped in the
 *  viewport; it closes on Escape or a press outside it.  → its root */
export function openTimelineShortcuts({ actions, keys = null, x = 16, y = 16, platform = keys?.platform || 'other' }) {
  const root = el('div', 'tl-pop tl-shortcuts glass', document.body);
  root.dataset.mirSurface = 'menu'; root.setAttribute('role', 'dialog'); ariaLabel(root, 'Timeline shortcuts');
  label(el('div', 'tl-pop-title', root), 'SHORTCUTS');
  const list = el('div', 'tl-shortcuts-list', root);
  label(el('div', 'tl-shortcuts-section', list), 'KEYBOARD');
  for (const r of shortcutRows(actions, keys, platform)) sheetRow(list, [[r.keys, true], [r.hint], [r.note]], r.id);
  for (const r of TIMELINE_FIXED) sheetRow(list, [[r.label, true], [r.hint], [r.t]]);
  label(el('div', 'tl-shortcuts-section', list), 'POINTER');
  for (const r of TIMELINE_POINTER) sheetRow(list, [[r.label], [r.hint], [r.t]]);
  const close = () => { root.remove(); document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey, true); };
  const onDown = (e) => { if (!root.contains(e.target)) close(); };
  const onKey = (e) => { if (e.code === 'Escape') close(); };
  document.addEventListener('pointerdown', onDown, true);
  document.addEventListener('keydown', onKey, true);
  const r = root.getBoundingClientRect(), z = cssZoom(root);   // seen; written ÷ UI SCALE
  root.style.left = Math.max(8, Math.min(innerWidth - r.width - 8, x)) / z + 'px';
  root.style.top = Math.max(8, Math.min(innerHeight - r.height - 8, y)) / z + 'px';
  root.close = close;
  return root;
}

/** renderShortcutsMarkdown(actions) — the table docs/TIMELINE.md carries between its SHORTCUTS markers (English, the
 *  declared keys in the non-Mac spelling); tests/timeline-ticks.node.mjs keeps the two in step */
export function renderShortcutsMarkdown(actions) {
  const section = (title, rows) => `### ${title}\n\n| Key | Action | FL / BASINS |\n|---|---|---|\n` + rows.map(([k, a, n]) => `| ${k} | ${a} | ${n} |`).join('\n') + '\n';
  return section('Keyboard: rows of the app’s key table, live while the timeline’s surface has the focus', [
    ...shortcutRows(actions).map((r) => [r.keys, r.hint, r.note]), ...TIMELINE_FIXED.map((r) => [r.label, r.hint, r.t])]) + '\n' + section('Pointer and touch', TIMELINE_POINTER.map((r) => [r.label, r.hint, r.t]));
}
