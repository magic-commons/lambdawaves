/* window/workspaces.js — two big workspaces that stack like legos, and the MIR switch between them.
 *
 * Josh (BASINS PC, ≤ 2026-10-01): "Add the MIR Logo to the mod window placed to the right of the preset picker arrows …
 * This will swap between the two; however they can exist at the same time if called by the other means like 'M' or
 * through the menu bar, if that's the case, make it snap to the top of the timeline, so they're like legos.  Do not
 * change any Modulation window geometry rules."
 *
 * Harvested from BASINS shell.js (syncWorkspaceStack, workspaceMoved, layout.switchWorkspace), modwindow.js
 * (stackAbove, the switch in the preset bar) and timeline-window.js (reserveTop); docs/UI-UPGRADES-2026-10-01.md.
 *
 * THE LAWS IT KEEPS
 *   1. THE SWITCH SWAPS; ANY OTHER OPENER ADDS.  show('lower') closes the upper and opens the lower, and back.  An app's
 *      own opener (M, a menu row, a latch) opens one without closing the other: then they stack.
 *   2. BOTH OPEN, THEY STACK: the upper (MODULATION) seats 8 px above the lower (TIMELINE), its left edge on the lower's,
 *      and the lower keeps that band free at its top (reserveTop) — docked at the top too.  The upper's own geometry
 *      rules are untouched: only its place moves.
 *   3. DRAGGED AWAY, THE UPPER LEAVES THE STACK (its grip ends it); the lower gives the band back.  Opening or closing
 *      either one stacks them again.
 *   4. A REPORT NEVER RE-PLACES ITS REPORTER.  moved('upper') only resizes the lower's band; moved('lower') re-seats the
 *      upper — at once, unless the upper's own report is what moved the lower, then one frame later (BASINS guarded
 *      the loop with `followingStack` and still re-placed the reporter inside its own report).
 *   5. NOTHING POLLS: it runs on the two windows' reports.  Wire each window's onMoved to moved(), and its onOpen and
 *      onClose to sync() (BASINS: workspaceChanged); an open or a close seen only by moved() re-plans one frame later.
 *
 *   createWorkspaces({ upper, lower, gap }) → { sync(), moved(which, rect | null), show(which), stacked, destroy() }
 *     upper   { isOpen(), open(), close(), stackAbove(anchor | null), isStacked, stackHeight() } — a kit window
 *             (window.js) or the modulation window
 *     lower   { isOpen(), open(), close(), rect(), reserveTop(px) } — a kit window (the timeline's `tl.win`)
 *   workspaceSwitch({ run, title }) → { root, destroy() } — the MIR switch (BASINS `.m2-workspace-switch`): the
 *     palette diamond in a 44 × 34 seat.  The app seats it (the modulation preset bar, after the picker arrows).
 */
import { frame } from '../core/frame.js';
import { ariaLabel } from '../kit.js';
import { createMirDiamond } from '../shell/wordmark.js';
import { stackedAt } from './window.js';

export { stackedAt };
/** the stack's gap (BASINS: SNAP.edge, "Modulation seats above Timeline with an 8 px gap") */
export const WORKSPACE = Object.freeze({ gap: 8 });
export const WHICH = Object.freeze(['upper', 'lower']);

/** stackPlan(upperOpen, lowerOpen) — the pure rule: stack when both are open */
export const stackPlan = (u, l) => !!(u && l);

export function createWorkspaces({ upper, lower, gap = WORKSPACE.gap } = {}) {
  let busy = null, wasU = null, wasL = null, dead = false;
  const open = (w) => { try { return !!(typeof w.isOpen === 'function' ? w.isOpen() : w.isOpen); } catch { return false; } };
  const anchor = () => (open(lower) ? lower.rect() : null);
  const band = () => Math.round((+upper.stackHeight() || 0) + gap);
  /** sync() — stack them when both are open, else release both (BASINS syncWorkspaceStack) */
  function sync() {
    if (dead) return false;
    wasU = open(upper); wasL = open(lower);
    if (stackPlan(wasU, wasL)) { lower.reserveTop(band()); upper.stackAbove(anchor); return true; }
    upper.stackAbove(null); lower.reserveTop(0); return false;
  }
  const follow = () => { if (!dead && upper.isStacked && open(upper)) upper.stackAbove(anchor); };
  /** moved(which, rect | null) — wire each window's onMoved here.  An open or a close re-plans the stack */
  function moved(which, rect) {
    if (dead || busy === which) return;
    if (open(upper) !== wasU || open(lower) !== wasL) { frame.coalesce('mir.workspaces.sync', sync); return; }   // an open or a close: re-plan next frame (onOpen / onClose → sync() does it at once)
    const was = busy; busy = which;
    try {
      if (which === 'upper') lower.reserveTop(upper.isStacked ? band() : 0);   // the band only; the upper stays where it put itself
      else if (which === 'lower' && upper.isStacked) {
        if (was === 'upper') frame.coalesce('mir.workspaces.follow', follow);  // the upper is mid-report: follow next frame
        else follow();
      }
    } finally { busy = was; }
  }
  /** show('upper' | 'lower') — the MIR switch: close one, open the other (BASINS layout.switchWorkspace) */
  function show(which) {
    if (which === 'lower') { upper.close(); lower.open(); } else { lower.close(); upper.open(); }
    sync();
    return which;
  }
  return { sync, moved, show, get stacked() { return !!upper.isStacked; }, destroy() { if (dead) return; upper.stackAbove(null); lower.reserveTop(0); dead = true; } };
}

/** workspaceSwitch({ run, title }) — BASINS modwindow.js `workspaceButton`: a 44 × 34 seat holding the MIR palette
 *  diamond (it cycles under a mouse).  A press runs `run` (show the other workspace). */
export function workspaceSwitch({ run, title = 'Switch to Timeline' } = {}) {
  const root = document.createElement('button'); root.type = 'button'; root.className = 'm2-workspace-switch mir-workspace-switch';
  root.title = title; ariaLabel(root, title);
  const mark = createMirDiamond(root);
  const life = new AbortController();
  root.addEventListener('click', () => { if (run) run(); }, { signal: life.signal });
  return { root, destroy() { life.abort(); mark.destroy(); root.remove(); } };
}
