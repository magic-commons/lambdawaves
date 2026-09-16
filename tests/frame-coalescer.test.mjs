import assert from 'node:assert/strict';
import { coalesce } from '../lab/frame-coalescer.js';

const original = Object.fromEntries(['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'].map(key => [key, globalThis[key]]));
const frames = new Map(), timers = new Map(); let id = 0;
globalThis.requestAnimationFrame = fn => { frames.set(++id, fn); return id; };
globalThis.cancelAnimationFrame = key => frames.delete(key);
globalThis.setTimeout = fn => { timers.set(++id, fn); return id; };
globalThis.clearTimeout = key => timers.delete(key);
try {
  const paints = [], pump = coalesce(value => paints.push(value));
  // A burst paints once with its latest value, never once per pointer event.
  for (let i = 0; i < 40; i++) pump.post(i);
  assert.equal(frames.size, 1); assert.equal(timers.size, 1); assert.deepEqual(paints, []);
  [...frames.values()][0](); assert.deepEqual(paints, [39]);
  assert.equal(frames.size + timers.size, 0);
  // A release flushes before persistence and cancels both queued callbacks.
  pump.post(40); pump.flush(); pump.flush(); assert.deepEqual(paints, [39, 40]);
  assert.equal(frames.size + timers.size, 0);
  // A stalled renderer still receives the final value via the fallback timer.
  pump.post(41); [...timers.values()][0](); assert.deepEqual(paints, [39, 40, 41]);
  assert.equal(frames.size + timers.size, 0);
} finally {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
}
console.log('PASS frame coalescer: 40 events, one paint; synchronous final flush; stalled-frame fallback; no pending idle callbacks');
