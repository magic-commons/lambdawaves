/* timeline/bind.js — how an app adds the TIMELINE, in one call (the modulation plugin's installModulation, for the
 * second plugin).  It makes the arrangement (model.js), hands it to the modulation clock as its automation (a lane
 * automates a registered parameter: the registry is the targets), registers it as a project part (core/project.js) and,
 * when the app has one, as a domain of its one history; puts the timeline's keys in the app's key table; and mounts the
 * window (window.js createTimeline) with the transport's ONE PLAY in its work bar.
 *
 *   installTimeline({ mount, mod, model?, present?, say?, dock?, storageKey?, store?, initial?, keys?, history?,
 *                     project?, automation?, remap?, transport?, audio?, controller?, scrubLevel?, busy?, moved?, onWindow? }) → tl
 *   tl = createTimeline's { win, root, rail, editor, model, controller, transport, actions, open, close, toggle, isOpen,
 *        paintHead, presentation, restore, shortcuts, destroy } + { keys, automation(id, beat), dispose }
 *
 * WHAT IT DOES, AS BASINS DID IT (app/modulation.js 105–127, shell.js 102, history-window.js 84, save-window.js):
 *   AUTOMATION.  host.clock.setAutomationHold(true) and setAutomation({ value: (id, beat) => model.value(id, beat) }):
 *     the arrangement is the moving baseline under every route, sampled on the modulation tick, never a second clock;
 *     a paused seek previews it.  host.clock.demand('timeline') while an unmuted clip drives a registered target.
 *     `automation: false` leaves this to the app (BASINS keeps its recorder's frozen values and its sampling grid).
 *   THE PROJECT.  registerProjectPart('timeline', …) (`project: false` to keep it out; `remap(id, saved)` for targets
 *     whose ids do not survive a reload).
 *   HISTORY.  With `history` (mir/history createHistory), the timeline is one delegated domain (history.js adoptTimeline).
 *   KEYS.  With `keys` (createKeys), the rows are added to it; without, the timeline makes its own small table on the
 *     document.  The one play's Space row (transportActions) is added when the table has none.
 *   THE MODULATION.  mod.setTimeline(tl) when the seam has it: → TL on the LFO and ENV heads, and the PATTERN's sequencer
 *     reads the pattern clips; dispose() takes it back.
 *   THE TICK.  The playhead paints from the app's present: an app passes `present` to installModulation that calls
 *     tl.paintHead() (BASINS shell.js:60); a modulation seam with onTick(fn) is subscribed directly. */
import { createTimelineModel } from './model.js';
import { registerTimelinePart } from './project.js';
import { adoptTimeline } from './history.js';
import { createTimeline } from './window.js';
import { createKeys, localKeyStorage } from '../shell/keys.js';
import { transportActions, PLAY_ACTION } from '../shell/transport.js';
import { localStore } from '../modulation/bind.js';
import { installAudioDrop } from './audio-drop.js';

export function installTimeline(o) {
  const mod = o.mod, host = mod.host, model = o.model || createTimelineModel();
  const storageKey = o.storageKey || 'mir.timeline';
  const store = o.store || localStore(storageKey);
  const offs = [];
  let au = null;

  /* THE ARRANGEMENT AS THE CLOCK'S AUTOMATION (BASINS modulation.js) */
  const automation = (id, beat) => model.value(id, beat);
  if (o.automation !== false) {
    host.clock.setAutomationHold(true);
    host.clock.setAutomation({ value: automation });
    const demand = () => { host.clock.demand('timeline', model.needsClock((id) => host.registry.has(id))); host.clock.applyAll(false); if (o.present) o.present(); };
    offs.push(model.subscribe(demand));
    offs.push(host.registry.subscribe('*', (ev) => { if (ev.reason === 'register' || ev.reason === 'unregister') demand(); }));
    demand();
  }
  if (o.project !== false) offs.push(registerTimelinePart(model, { remap: o.remap }));
  if (o.history) adoptTimeline(o.history, model);

  /* controller: the app's own one-play controller (timeline/controller.js shape) and its refusal sentences, as createTimeline
     takes it; absent, the timeline makes one from scrubLevel and busy */
  const tl = createTimeline(o.mount, { model, mod, controller: o.controller, present: o.present, say: o.say, dock: o.dock, store, initial: o.initial, keys: o.keys || null,
    transport: o.transport, audio: o.audio === false ? null : { pick: (at) => au && au.pick(at) }, scrubLevel: o.scrubLevel, busy: o.busy, moved: o.moved, onWindow: o.onWindow, storageKey });
  /* THE AUDIO CLIP (docs/AUDIO.md): a file dropped on a lane, ADD AUDIO… in the ⋯ menu, the playback and the asset part, with no app line;
     `audio: false` leaves it out, an object is installAudioDrop's own options */
  if (o.audio !== false) au = tl.audio = installAudioDrop(tl.editor, { mod, controller: tl.controller, say: o.say, busy: o.busy, ...(o.audio && typeof o.audio === 'object' ? o.audio : {}) });
  if (typeof mod.setTimeline === 'function') mod.setTimeline(tl);   // → TL on the device heads; the PATTERN reads its clips (1.5.0-alpha.12)

  /* THE KEYS: rows of the app's one table */
  let keys = o.keys || null, ownKeys = false;
  const play = transportActions(() => tl.transport);
  /* with a history, undo and redo are ITS rows (history/history-list.js historyActions: the one stack, the timeline a domain of
     it), so the timeline's own 'undo' / 'redo' are left out: one owner for each chord, wherever the focus is */
  if (keys) { keys.add(o.history ? tl.actions.filter((a) => a.id !== 'undo' && a.id !== 'redo') : tl.actions); if (!keys.get(PLAY_ACTION)) keys.add(play); }
  else { keys = createKeys({ actions: [...play, ...tl.actions], storage: localKeyStorage(storageKey + '.keys') }); ownKeys = true; }
  if (typeof mod.onTick === 'function') offs.push(mod.onTick(() => tl.paintHead()));

  return Object.assign(tl, {
    keys, automation,
    dispose() {
      for (const off of offs.splice(0)) { try { if (typeof off === 'function') off(); } catch (_) { /* gone */ } }
      if (o.automation !== false) { host.clock.setAutomation(null); host.clock.demand('timeline', false); }
      if (ownKeys) keys.destroy();
      if (au) au.dispose();
      if (typeof mod.setTimeline === 'function' && mod.timeline && mod.timeline() === tl) mod.setTimeline(null);
      tl.destroy();
    },
  });
}
