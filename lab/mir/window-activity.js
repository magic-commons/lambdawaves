/* window-activity.js — one visibility law for work whose only product is a window or its stage overlay.
 *
 * A device's power state and its presentation state are deliberately separate.  Scrolling, folding, closing,
 * compacting, hiding the racks, or pressing H suspends presentation work without changing the project or the
 * switch the user chose.  IntersectionObserver supplies the clipped viewport result without a layout read in
 * the frame loop.  A newly tracked window starts suspended until the observer has measured it; this also avoids
 * the old boot stampede where every reader rendered once before the first screen was painted.
 */

const rootOf = (windowOrRoot) => windowOrRoot && (windowOrRoot.root || windowOrRoot);

export function createWindowActivity({ body = document.body, onChange = () => {} } = {}) {
  const records = new WeakMap();
  const roots = new Set();
  const IO = globalThis.IntersectionObserver;
  const MO = globalThis.MutationObserver;
  let changes = 0;
  let offscreenOk = false;   // a proof harness may present windows the viewport cannot see; nothing else sets this

  const structurallyAvailable = (root) => {
    if (!root || root.hidden || body.classList.contains('ui-hidden')) return false;
    if (root.classList.contains('off') || root.classList.contains('closed') ||
        root.classList.contains('folded') || root.classList.contains('compact')) return false;
    const host = root.parentElement;
    if (host && (host.id === 'rack' || host.id === 'rackL') &&
        body.classList.contains('rack-hidden') && !body.classList.contains('rack-peek')) return false;
    return true;
  };

  const refresh = (root, notify = true) => {
    const rec = records.get(root); if (!rec) return false;
    const active = (rec.intersecting || offscreenOk) && structurallyAvailable(root);
    if (active === rec.active) return false;
    rec.active = active; changes++;
    if (notify) onChange();
    return true;
  };

  const intersection = IO ? new IO((entries) => {
    let changed = false;
    for (const entry of entries) {
      const rec = records.get(entry.target); if (!rec) continue;
      rec.intersecting = !!entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0;
      changed = refresh(entry.target, false) || changed;
    }
    if (changed) onChange();
  }) : null;

  const mutations = MO ? new MO((entries) => {
    let changed = false;
    for (const entry of entries) {
      if (entry.target === body) { for (const root of roots) changed = refresh(root, false) || changed; }
      else changed = refresh(entry.target, false) || changed;
    }
    if (changed) onChange();
  }) : null;
  if (mutations) mutations.observe(body, { attributes: true, attributeFilter: ['class'] });

  function track(windowOrRoot) {
    const root = rootOf(windowOrRoot); if (!root || records.has(root)) return root;
    const rec = { intersecting: !intersection, active: false };
    records.set(root, rec); roots.add(root);
    if (intersection) intersection.observe(root);
    if (mutations) mutations.observe(root, { attributes: true, attributeFilter: ['class', 'hidden'] });
    refresh(root, true);
    return root;
  }

  function canPresent(windowOrRoot) {
    const root = track(windowOrRoot); if (!root) return false;
    /* Read cheap state flags synchronously. Mutation delivery normally precedes rAF, but callers outside the
       frame loop are entitled to the current answer in the same task that changed a class. */
    refresh(root, true);
    return records.get(root).active;
  }

  function state(windowOrRoot) {
    const root = track(windowOrRoot); if (!root) return { active: false, reason: 'missing' };
    refresh(root, false);
    const rec = records.get(root);
    let reason = '';
    if (body.classList.contains('ui-hidden')) reason = 'interface-hidden';
    else if (root.hidden) reason = 'hidden';
    else if (root.classList.contains('off')) reason = 'powered-off';
    else if (root.classList.contains('closed')) reason = 'closed';
    else if (root.classList.contains('folded')) reason = 'folded';
    else if (root.classList.contains('compact')) reason = 'compact';
    else if (root.parentElement && (root.parentElement.id === 'rack' || root.parentElement.id === 'rackL') &&
        body.classList.contains('rack-hidden') && !body.classList.contains('rack-peek')) reason = 'rack-hidden';
    else if (!rec.intersecting) reason = 'offscreen';
    return { active: rec.active, intersecting: rec.intersecting, reason };
  }

  /** Treat every tracked window as intersecting the viewport. Structural gates (hidden, closed, folded, off,
   *  ui-hidden, rack-hidden) still apply. For proof harnesses whose probes read windows below the fold. */
  function presentOffscreen(on) {
    offscreenOk = !!on;
    let changed = false;
    for (const root of roots) changed = refresh(root, false) || changed;
    if (changed) onChange();
    return offscreenOk;
  }

  return {
    track, canPresent, state, presentOffscreen,
    get tracked() { return roots.size; },
    get changes() { return changes; },
    disconnect() { if (intersection) intersection.disconnect(); if (mutations) mutations.disconnect(); roots.clear(); },
  };
}
