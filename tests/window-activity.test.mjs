/* The presentation scheduler's pure boundary: viewport and chrome state may suspend work, while power and saved
 * switches remain untouched. Intersection is injected exactly as a browser would deliver it. */
import assert from 'node:assert/strict';
import { createWindowActivity } from '../lab/mir/window-activity.js';

class Classes {
  constructor(...names) { this.names = new Set(names); }
  contains(name) { return this.names.has(name); }
  add(name) { this.names.add(name); }
  remove(name) { this.names.delete(name); }
}
class IO {
  constructor(fn) { this.fn = fn; IO.last = this; }
  observe(root) { this.root = root; }
  disconnect() {}
  emit(on) { this.fn([{ target: this.root, isIntersecting: on, intersectionRect: on ? { width: 20, height: 20 } : { width: 0, height: 0 } }]); }
}
class MO { constructor() {} observe() {} disconnect() {} }

const oldIO = globalThis.IntersectionObserver, oldMO = globalThis.MutationObserver;
globalThis.IntersectionObserver = IO; globalThis.MutationObserver = MO;
try {
  const body = { classList: new Classes() };
  const rack = { id: 'rack' };
  const root = { hidden: false, classList: new Classes(), parentElement: rack };
  let changes = 0;
  const activity = createWindowActivity({ body, onChange: () => changes++ });
  activity.track(root);
  assert.deepEqual(activity.state(root), { active: false, intersecting: false, reason: 'offscreen' });

  IO.last.emit(true);
  assert.equal(activity.canPresent(root), true);
  root.classList.add('folded'); assert.equal(activity.state(root).reason, 'folded');
  root.classList.remove('folded'); assert.equal(activity.canPresent(root), true);
  root.classList.add('closed'); assert.equal(activity.state(root).reason, 'closed');
  root.classList.remove('closed'); root.classList.add('compact'); assert.equal(activity.state(root).reason, 'compact');
  root.classList.remove('compact'); body.classList.add('ui-hidden'); assert.equal(activity.state(root).reason, 'interface-hidden');
  body.classList.remove('ui-hidden'); root.hidden = true; assert.equal(activity.state(root).reason, 'hidden');
  root.hidden = false;
  body.classList.add('rack-hidden'); assert.equal(activity.state(root).reason, 'rack-hidden');
  body.classList.add('rack-peek'); assert.equal(activity.canPresent(root), true);
  root.classList.add('off'); assert.equal(activity.state(root).reason, 'powered-off');
  root.classList.remove('off'); IO.last.emit(false);
  assert.equal(activity.state(root).reason, 'offscreen');
  assert.ok(changes >= 1);
  /* presentOffscreen(true) is the proof harness's road past the viewport gate: the window presents while
     off-screen, the structural gates still hold, and switching it off puts the viewport law back. */
  const before = changes;
  assert.equal(activity.presentOffscreen(true), true);
  assert.equal(activity.canPresent(root), true);
  assert.ok(changes > before, 'presenting off-screen windows schedules a present');
  root.classList.add('folded'); assert.equal(activity.canPresent(root), false); root.classList.remove('folded');
  root.classList.add('off'); assert.equal(activity.canPresent(root), false); root.classList.remove('off');
  assert.equal(activity.presentOffscreen(false), false);
  assert.equal(activity.state(root).reason, 'offscreen');
  console.log('GREEN window activity — intersection, fold, rack hide/peek and power suspend presentation without mutation; presentOffscreen lifts only the viewport gate');
} finally {
  globalThis.IntersectionObserver = oldIO; globalThis.MutationObserver = oldMO;
}
