/* MIR · folders/project.js — THE PROJECT ADAPTER: the one seam between FOLDERS and the app (pure: no DOM, no storage).
 *
 * WHAT FOLDERS ASKS OF AN APP, AND NOTHING MORE
 *   capture(presence?) → data          the work, as JSON (by default: every registered project part, core/project.js)
 *   restore(data, entry?) → ok          put that work on screen.  `false`, `{ ok: false, why }` or `{ failed: [names] }`
 *                                      (what core/project.js restoreProject returns) all mean "it did not take"
 *   signature()        → string        a cheap fingerprint: "is what is on screen what was saved?"
 *   thumbnail()        → canvas | blob | data URL | null      the picture a saved project wears (optional)
 *   empty()            → ok            the empty project (default: every part restored with null)
 *   subscribe(fn)      → off           "something changed", so the unsaved mark can repaint (optional)
 * By default it IS core/project.js (`captureProject` / `restoreProject` / `projectSignature` / `subscribeProject`),
 * so an app that registers its parts gets saving for free and FOLDERS never learns what a part is.
 *
 * THE THREE-SCOPE LAW, AS λWAVES 0.3.1 HAS IT (docs/STATE-SCOPES.md there; survey C)
 *   · NEW is THE EMPTY PROJECT: every part is restored with null, so each part says what "nothing" is for it.
 *   · AN OPEN THAT FAILS ROLLS BACK: before an open, what is on screen is captured; if the restore does not take, the
 *     capture is restored, and the result says so (`rolledBack`), with the parts that failed.  If even the rollback
 *     fails, the result says that too.  Nothing here throws.
 *   · Preferences are never in a project: that is the app's to keep out of its parts.
 *
 * createProjectAdapter(opts?) → adapter        openWithRollback(adapter, data, ctx?) → Promise<result>
 * emptyProject(adapter) → Promise<result>      restoreOk(r) → { ok, failed, why }   — every result is
 * { ok, why?, failed: [names], rolledBack?, rollbackFailed? } */
import { captureProject, restoreProject, projectSignature, subscribeProject } from '../core/project.js';
import { t, tn } from '../core/i18n.js';

/** restoreOk(r) — what a restore returned, read as { ok, failed, why } */
export function restoreOk(r) {
  if (r === false) return { ok: false, failed: [], why: 'the app refused it' };
  if (r && typeof r === 'object') {
    const failed = Array.isArray(r.failed) ? r.failed.map(String) : [];
    if (r.ok === false) return { ok: false, failed, why: r.why ? String(r.why) : failed.length ? partsSay(failed) : 'the app refused it' };
    if (failed.length) return { ok: false, failed, why: partsSay(failed) };
  }
  return { ok: true, failed: [] };
}
const partsSay = (names) => tn(names.length, 'the part {names} could not take it', 'the parts {names} could not take it', { names: names.map((n) => '“' + n + '”').join(', ') });
const errWhy = (e) => String((e && e.message) || e || 'unknown').slice(0, 200);

/** createProjectAdapter({ capture, restore, signature, thumbnail, empty, subscribe }) — any hook left out is the kit's */
export function createProjectAdapter(o = {}) {
  const capture = typeof o.capture === 'function' ? o.capture : () => ({ parts: captureProject() });
  const restore = typeof o.restore === 'function' ? o.restore : (data) => restoreProject(data && data.parts ? data.parts : null);
  return {
    capture, restore,
    signature: typeof o.signature === 'function' ? o.signature : projectSignature,
    thumbnail: typeof o.thumbnail === 'function' ? o.thumbnail : () => null,
    empty: typeof o.empty === 'function' ? o.empty : () => restore(null),
    subscribe: typeof o.subscribe === 'function' ? o.subscribe : (o.capture ? null : subscribeProject),
    facts: typeof o.facts === 'function' ? o.facts : () => ({}),
  };
}

/** apply(adapter, fn) — run a restore-shaped step, catching a throw as a failure */
async function attempt(fn) {
  try {
    const v = await fn(), r = restoreOk(v);
    if (r.ok && typeof v === 'string' && v) r.said = v;            // an app's own sentence (BASINS' NEW: "New fractal — …")
    return r;
  } catch (e) { return { ok: false, failed: [], why: errWhy(e) }; }
}
/** the shared core of open and NEW: take a snapshot, try `step`, roll back to the snapshot if it did not take */
async function guarded(adapter, step) {
  let before;
  try { before = await adapter.capture(); } catch (e) { return { ok: false, failed: [], why: 'what is on screen could not be kept for a rollback (' + errWhy(e) + ') — nothing was opened' }; }
  const r = await attempt(step);
  if (r.ok) return r;
  const back = await attempt(() => adapter.restore(before));
  if (back.ok) return { ...r, rolledBack: true, why: t('{why} — what was open before is back', { why: r.why }) };
  return { ...r, rolledBack: false, rollbackFailed: back.failed, why: t('{why}, and putting back what was open before failed too ({back})', { why: r.why, back: back.why }) };
}
/** openWithRollback(adapter, data, ctx) — open a saved project (ctx: the library entry, for an app that reads it); a failed open puts back what was there */
export const openWithRollback = (adapter, data, ctx) => guarded(adapter, () => adapter.restore(data, ctx));
/** emptyProject(adapter) — NEW: the empty project; if a part refuses its null, what was there comes back */
export const emptyProject = (adapter) => guarded(adapter, () => adapter.empty());
