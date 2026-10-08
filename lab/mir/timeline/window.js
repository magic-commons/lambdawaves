/* timeline/window.js — THE TIMELINE WINDOW: the kit's second plugin (docs/PLUGIN-CONTRACT.md), on the kit's one window
 * (harvested from BASINS app/timeline-window.js, 2026-10-02, where it was kwin + snapWindow + rack-bounds + a cloned
 * material).  The window is window/window.js `createWindow` with `material: 'modulation'` (the rail, its chips, the
 * controls and the resize corner wear the modulation window's material, nothing cloned); it docks at the top or the
 * bottom of the app's one span (and onto an anchor), floats, resizes, and its chips relocate by Shift-drag, a long press
 * or the keyboard — all the window set's.  Inside it: the editor (editor.js), the transport in its work-bar form
 * (shell/transport.js `bar: 'work'`) carrying THE ONE PLAY, the readout layer and the held-knob popup.
 *
 *   createTimeline(host, port) → tl
 *     host    the element the window and its rail go in (the app's float layer)
 *     port    { model, mod, controller?, present?, say?, dock?, store?, size?, min?, keys?, transport?, audio?, id?, title?,
 *               remap? }  (docs/TIMELINE.md: the port)
 *   tl: { win, root, rail, editor, model, controller, transport, open, close, toggle, isOpen, paintHead, presentation,
 *         restore, shortcuts(x, y), destroy }
 *
 * THE LAWS IT ADDS TO THE EDITOR'S
 *   ONE PLAY.  The transport's play is the controller's (the timeline's): Space and ▶ start and stop the app's one clock;
 *     modulation's power only bypasses its routes (Josh, 2026-10-01).
 *   THE WORK LANE.  WORK BARS cycles top → bottom → hidden (BASINS' order and pressed: top false, bottom true, hidden
 *     mixed), remembered with the window's shape.
 *   ONE STORE.  The window's shape and the work lane persist through `store` ({ read, write }); the arrangement is the
 *     project's (project.js), never the window's. */
import { createWindow } from '../window/window.js';
import { glyphSvg } from '../glyph.js';
import { createTransport } from '../shell/transport.js';
import { t } from '../core/i18n.js';
import { buildTimelineEditor } from './editor.js';
import { createTransportController } from './controller.js';
import { installTimelineKnobs } from './knobs.js';
import { createTimelineCursor } from './cursor.js';
import { createReadoutLayer } from './readout.js';
import { openTimelineShortcuts, timelineActions } from './shortcuts.js';

/* BASINS' timeline-mounted transport: play, power, the BPM pill, the app's own readout (BASINS' 10ⁿ depth), to-start; then
   send-to-rack (only with a rack) and the logo door */
export const TIMELINE_TRANSPORT = Object.freeze([{ group: 'native-play-row', items: ['play', 'power', 'tempo', 'app:readout', 'rewind'] }, 'dock', 'door']);
export const TIMELINE_SIZE = Object.freeze({ w: 1080, h: 440 }), TIMELINE_MIN = Object.freeze({ w: 320, h: 400 });

export function createTimeline(host, port) {
  const { model, mod } = port;
  const present = port.present || (() => {});
  const say = port.say || (() => {});
  const store = port.store || { read: () => null, write: () => {} };
  const size = port.size || TIMELINE_SIZE, min = port.min || TIMELINE_MIN;
  const saved = (() => { let r = null; try { r = store.read(); } catch (_) { /* storage refused */ } return r && Object.keys(r).length ? r : { ...(port.initial || {}) }; })();
  const controller = port.controller || createTransportController({ mod, scrubLevel: port.scrubLevel, busy: port.busy,
    onRefusedPlay: () => say(t('Nothing to run.')) });
  let editor = null, workLane = ['top', 'bottom', 'hidden'].includes(saved.workLane) ? saved.workLane : 'top', transport = null, readout = null, cursor = null;
  const writeShape = (shape) => { try { store.write({ ...shape, workLane }); } catch (_) { /* storage refused */ } };
  /* the shared transport's seat: the work lane while the window is open and the lane shows, else the stage */
  let seatShared = null;
  const seatBar = () => { if (seatShared && editor) seatShared.mountIn(win.isOpen() && editor.workLane() !== 'hidden' ? editor.transportHost : null); };

  const win = createWindow({
    id: port.id || 'timeline', title: port.title || 'TIMELINE', host, size, min, resizable: true, material: 'modulation',
    dock: port.dock || null, persist: { read: () => saved, write: writeShape }, onMoved: port.moved,
    chips: [
      { name: 'workbars', kind: 'cycle', state: workLane, states: [   // BASINS' cycle and its pressed: top → bottom → hidden
        { id: 'top', pressed: false, label: 'Work bars: top', glyph: 'barsTop' },
        { id: 'bottom', pressed: true, label: 'Work bars: bottom', glyph: 'barsTop' },
        { id: 'hidden', pressed: 'mixed', label: 'Work bars: hidden', glyph: 'barsTop' }],
        press: (state) => { workLane = state; if (editor) editor.setWorkLane(state); writeShape(win.state()); } },
      { name: 'addLane', kind: 'action', label: 'Add automation lane', glyph: 'plus', press: () => editor && editor.addLane() },
      { name: 'removeLane', kind: 'action', label: 'Remove bottom automation lane', text: '−', press: () => editor && editor.removeLane() },
      { name: 'resetSize', kind: 'action', label: 'Reset window size', glyph: 'compact', press: (s, w) => w.place({ width: size.w, height: size.h }) },
    ],
    onOpen: () => { if (editor) editor.paint(); seatBar(); showReadout(true); if (transport) transport.sync(); if (port.onWindow) port.onWindow(true); present(); },
    onClose: () => { if (editor) editor.close(); seatBar(); showReadout(false); if (port.onWindow) port.onWindow(false); present(); },
  });
  win.root.classList.add('mir-timeline');
  const minus = win.rail.chip('removeLane'); if (minus) { const ink = minus.querySelector('.mir-chip-text'); if (ink) ink.outerHTML = glyphSvg('minus', 'mir-chip-ink gly gly-minus', 26); }   // an action is inked once

  editor = buildTimelineEditor({ body: win.body, root: win.root, rail: win.rail, isOpen: win.isOpen, open: win.open }, { model, mod, controller, present, say, audio: port.audio || null,
    keys: () => (tl && tl.keys) || port.keys || null });   // the table's chords beside ⋯'s rows (bind.js sets tl.keys: the app's, or the timeline's own)
  editor.setWorkLane(workLane);

  /* THE ONE PLAY, in the work bar: the kit's transport in BASINS' timeline form */
  const clock = {
    play: () => controller.play(true), pause: () => controller.play(false), toggle: () => controller.toggle(),
    isPlaying: () => mod.host.clock.isPlaying(), seek: (b) => controller.seek(b),
    onChange(fn) { const a = mod.onPlay ? mod.onPlay(fn) : null, b = controller.subscribe(fn); return () => { if (a) a(); b(); }; },
  };
  const tp = port.transport === false ? false : port.transport || {};
  const shared = tp && tp.shared && typeof tp.shared.mountIn === 'function' ? tp.shared : null;
  if (shared) {
    /* THE ONE BAR (BASINS transport-placement.js): the app's own transport moves into the work lane while it shows */
    transport = shared; seatShared = shared;
    win.root.addEventListener('timeline-work-lane', seatBar);
    seatBar();
  } else if (tp !== false) {
    const seat = document.createElement('div'); seat.className = 'tl-transport'; editor.transportHost.appendChild(seat);
    const layout = (tp.layout || TIMELINE_TRANSPORT).filter((x) => x !== 'dock' || tp.rack);
    transport = createTransport({ root: seat, host: editor.transportHost, bar: 'work', opener: false, clock, mod, layout, nodes: tp.nodes || {},
      rack: tp.rack || null, keys: port.keys || null, key: (port.storageKey || 'mir.timeline') + '.transport' });
    transport.start();   // a click on the BPM pill types the tempo: shell/transport.js does it for `bar: 'work'` (BASINS' timeline form)
  }

  /* THE CURSOR + THE READOUT LAYER: one tuple, resolved from the pointer or the edit in flight */
  /* it follows the pointer only while the window is open (wave 18: closed, it handled every move of a pan, 20 ms/s, for
     a layer nobody could see): mounted on open, disposed on close, as the modulation window's editors' readouts are */
  cursor = createTimelineCursor({ editor, mod });
  function showReadout(on) {
    if (on && !readout && cursor) readout = createReadoutLayer({ mount: editor.view.shell, resolve: (ev) => {
      if (document.body.classList.contains('ui-hidden') || document.querySelector('.tl-pop, .tl-confirm')) return null;
      return cursor.gesture() || cursor.resolve(ev);
    } });
    else if (!on && readout) { readout.dispose(); readout = null; }
  }
  showReadout(win.isOpen());
  const offReadout = model.subscribe(() => { if (readout) readout.refresh(); });
  const offKnobs = installTimelineKnobs({ registry: mod.registry, editor });
  const actions = timelineActions(() => tl);
  const shortcuts = (x, y) => openTimelineShortcuts({ actions, keys: port.keys || null, x, y });
  editor.onShortcuts = shortcuts;

  const tl = {
    win, root: win.root, rail: win.rail, editor, model, controller, transport, actions,
    open: () => win.open(), close: () => win.close(), toggle: () => win.toggle(), isOpen: () => win.isOpen(),
    /** paint the playhead: call it from the app's present (BASINS shell.js) or hand it to installModulation's tick */
    paintHead: () => editor.paintHead(),
    presentation: () => ({ ...win.state(), workLane }),
    /** restore(p) — the work lane and a floating rect; a dock is the window's own (dragged, or its persisted shape) */
    restore(p) { if (!p) return; if (p.workLane) { workLane = p.workLane; editor.setWorkLane(workLane); win.setChip('workbars', workLane); }
      if (Number.isFinite(p.x) && Number.isFinite(p.y)) win.place({ x: p.x, y: p.y, w: p.w ?? size.w, h: p.h ?? size.h }); if (p.open) win.open(); },
    shortcuts,
    destroy() { offReadout(); offKnobs(); showReadout(false); if (seatShared) { win.root.removeEventListener('timeline-work-lane', seatBar); seatShared.mountIn(null); } else if (transport) transport.destroy(); editor.dispose(); win.destroy(); if (!port.controller) controller.dispose(); },
  };
  return tl;
}
