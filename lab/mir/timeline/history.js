/* timeline/history.js — THE TIMELINE AS ONE DOMAIN of the app's one history (mir/history/history.js), harvested whole
 * from BASINS app/history.js adoptTimeline (2026-10-02; docs/HISTORY.md said it stays in the app because it reads the
 * timeline model: the model is the kit's now, so it comes too).
 *
 * The model keeps its own 64-entry snapshot undo (model.js); a row here is that undo, called.  Every mutator is wrapped:
 * an edit outside a gesture that changed the document pushes one row, a begin…commit pushes one row at the commit, a
 * cancel pushes none; the model's own undo/redo route through the one stack, so the timeline's Ctrl+Z and the app's are
 * the same key; a replaced document (restore) takes its rows with it.  Row names are English keys (`timelineLabel`),
 * translated where the history list shows them (t()).
 *   adoptTimeline(history, model, name = 'timeline') → { raw, name }  (idempotent per model) */
import { t } from '../core/i18n.js';

const READS = new Set(['state', 'serialize', 'subscribe', 'beforeReplace', 'value', 'activeClips', 'needsClock', 'signature', 'copyClips']);
const OWN = new Set(['begin', 'commit', 'cancel', 'undo', 'redo', 'restore']);
/* the row names, BASINS' words, each the name of a timeline edit in the history list */
const NAMES = {
  create: () => t('NEW CLIP', null, 'history'), addClip: () => t('NEW CLIP', null, 'history'), addLane: () => t('ADD LANE', null, 'history'),   // tr: a history row: a timeline edit's name
  removeLane: () => t('REMOVE LANE', null, 'history'), updateClip: () => t('EDIT CLIP', null, 'history'), updateCurve: () => t('EDIT CURVE', null, 'history'),   // tr: a history row: a timeline edit's name
  addPoint: () => t('ADD POINT', null, 'history'), movePoint: () => t('MOVE POINT', null, 'history'), movePoints: () => t('MOVE POINTS', null, 'history'),   // tr: a history row: a timeline edit's name
  removePoints: () => t('DELETE POINTS', null, 'history'), removePoint: () => t('DELETE POINT', null, 'history'), drawPoints: () => t('DRAW', null, 'history'),   // tr: a history row: a timeline edit's name
  setTension: () => t('TENSION', null, 'history'), setSegment: () => t('SEGMENT', null, 'history'), deleteClip: () => t('DELETE CLIP', null, 'history'),   // tr: a history row: a timeline edit's name
  deleteClips: () => t('DELETE CLIPS', null, 'history'), pasteClips: () => t('PASTE', null, 'history'), duplicateClips: () => t('DUPLICATE', null, 'history'),   // tr: a history row: a timeline edit's name
  moveClips: () => t('MOVE CLIPS', null, 'history'), duplicate: () => t('DUPLICATE', null, 'history'), makeUnique: () => t('MAKE UNIQUE', null, 'history'),   // tr: a history row: a timeline edit's name
  setActive: () => t('ACTIVE RANGE', null, 'history'), edit: () => t('EDIT', null, 'history') };   // tr: a history row: a timeline edit's name
const fallback = (method) => String(method).replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
/** the row's name: BASINS' '<WHAT> · TIMELINE', in the page's language */
export const timelineLabel = (method) => t('{what} · TIMELINE', { what: NAMES[method] ? NAMES[method]() : fallback(method) });   // tr: a history row: what was done, then the window it was done in

export function adoptTimeline(history, model, name = 'timeline') {
  if (model.__history) return model.__history;
  const raw = {};
  let depth = 0, gesture = null;
  history.register(name, { delegated: true });
  const push = (label, size) => history.push({ domain: name, domains: [name], label, size, undo: () => raw.undo(), redo: () => raw.redo() });
  for (const [k, fn] of Object.entries(model)) {
    if (typeof fn !== 'function' || READS.has(k) || OWN.has(k)) continue;
    raw[k] = fn;
    model[k] = (...args) => {
      if (gesture && !gesture.label) gesture.label = timelineLabel(k);
      if (gesture || depth || history.applying) { depth++; try { return fn(...args); } finally { depth--; } }
      const before = model.signature();
      depth++;
      let out; try { out = fn(...args); } finally { depth--; }
      const after = model.signature();
      if (after !== before) push(timelineLabel(k), 2 * after.length);
      return out;
    };
  }
  for (const k of OWN) raw[k] = model[k];
  model.begin = (...a) => { if (!gesture && !history.applying) gesture = { sig: model.signature(), label: null }; return raw.begin(...a); };
  model.commit = (...a) => {
    const g = gesture; gesture = null;
    const out = raw.commit(...a);
    if (g) { const after = model.signature(); if (after !== g.sig) push(g.label || timelineLabel('edit'), 2 * after.length); }
    return out;
  };
  model.cancel = (...a) => { gesture = null; return raw.cancel(...a); };
  model.undo = () => history.undo();
  model.redo = () => history.redo();
  model.restore = (...a) => { gesture = null; const ok = raw.restore(...a); if (ok) history.forget(name); return ok; };
  model.__history = { raw, name };
  return model.__history;
}
