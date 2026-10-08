/* timeline/project.js — THE TIMELINE AS A PROJECT PART (core/project.js), so FOLDERS (or any save window) saves and opens
 * the arrangement without knowing it exists.  BASINS wrote the timeline into its project by hand (save-window.js:123,
 * :151, :188, :232, :255, :274; timeline-project.js); this is that, as the kit's one seam.
 *
 *   timelinePart(model, { remap }) → { capture, restore, signature, subscribe }
 *     capture()        the model's serialize(), or null while the arrangement is empty (no clip, the four default lanes)
 *                      so an untouched timeline is not project content
 *     restore(saved)   model.restore(saved, remap); null clears it (a project that never had a timeline opens empty)
 *     remap(id, saved) the PORT for target ids that do not survive a reload: BASINS' palette entries are re-made with
 *                      new ids, so it binds a curve by the saved palette position (remapTimelineTarget, which stays
 *                      BASINS'); default: ids are stable
 *   registerTimelinePart(model, options, register = registerProjectPart) → unregister
 * PURE but for the registry it is handed. */
import { registerProjectPart } from '../core/project.js';

const DEFAULT_LANES = 4;
const isEmpty = (doc) => !doc.clips.length && doc.lanes.length === DEFAULT_LANES && doc.active == null && doc.meter === 4;

export function timelinePart(model, { remap = null } = {}) {
  return {
    capture: () => { const doc = model.serialize(); return isEmpty(doc) ? null : doc; },
    restore: (saved) => model.restore(saved == null ? null : saved, remap ? (id) => remap(id, saved) : undefined),
    signature: () => model.signature(),
    subscribe: (fn) => model.subscribe(fn),
  };
}

export function registerTimelinePart(model, options = {}, register = registerProjectPart) {
  return register(options.name || 'timeline', timelinePart(model, options));
}
