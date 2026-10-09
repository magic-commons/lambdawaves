/* timeline/readout.js — THE READOUT LAYER: a host-agnostic cursor presenter (harvested whole from BASINS
 * app/readout-layer.js, 2026-10-02; BASINS' note calls it the seed of INFORMATIONAL).  Nodes created once,
 * pointer-events: none, positioned by transform only. Knows nothing about beats, bpm or percent — it paints whatever
 * tuple `resolve(ev)` returns. One frame-coalesced paint per frame (core/frame.js); text only when the string changes
 * (core/perf.js setText). Mount it once per editor; dispose it with that editor.  Its sheet is timeline.css's
 * `.readout-layer` rules. */
import { frame } from '../core/frame.js';
import { setText as perfText } from '../core/perf.js';

const dpr = () => globalThis.devicePixelRatio || 1;
const snap = n => Math.round(n * dpr()) / dpr();
const setText = (node, text) => perfText(node, text || '');
let seq = 0;
/* BASINS' frame-coalescer shape over the kit's one frame: post(arg) keeps the latest, one run per frame */
export function coalesce(fn) {
  const key = 'mir:timeline:' + (++seq); let last;
  return { post(a) { last = a; frame.coalesce(key, () => fn(last)); }, flush() { frame.flush(key); }, cancel() { frame.cancel(key); } };
}

function buildNodes(mount) {
  const root = document.createElement('div'); root.className = 'readout-layer'; root.dataset.state = 'idle';
  const vline = document.createElement('div'); vline.className = 'rl-line rl-vline';
  const hline = document.createElement('div'); hline.className = 'rl-line rl-hline';
  const track = document.createElement('div'); track.className = 'rl-track';
  const trackTime = document.createElement('span'); trackTime.className = 'rl-track-time';
  const trackBar = document.createElement('span'); trackBar.className = 'rl-track-bar';
  track.append(trackTime, trackBar);
  const clipTime = document.createElement('div'); clipTime.className = 'rl-corner rl-clip-time';
  const clipValue = document.createElement('div'); clipValue.className = 'rl-corner rl-clip-value';
  root.append(vline, hline, track, clipTime, clipValue);
  mount.append(root);
  return { root, vline, hline, track, trackTime, trackBar, clipTime, clipValue };
}

function setLine(node, data, mountRect, vertical) {
  if (!data) { node.style.opacity = '0'; return; }
  node.style.opacity = ''; // let [data-state] decide the resting alpha
  node.dataset.tinted = data.ink ? '1' : '0';
  if (data.ink && node.style.color !== data.ink) node.style.color = data.ink;
  if (vertical) { node.style.height = Math.max(0, data.bottom - data.top) + 'px'; node.style.transform = `translate(${snap(data.x - mountRect.left)}px,${snap(data.top - mountRect.top)}px)`; }
  else { node.style.width = Math.max(0, data.right - data.left) + 'px'; node.style.transform = `translate(${snap(data.left - mountRect.left)}px,${snap(data.y - mountRect.top)}px)`; }
}
function setTrack(nodes, data, mountRect) {
  nodes.track.style.opacity = data ? '1' : '0';
  if (!data) return;
  setText(nodes.trackTime, data.text); setText(nodes.trackBar, data.sub);
  const half = nodes.track.offsetWidth / 2 || 30;
  const x = Math.min(mountRect.width - half - 4, Math.max(half + 4, data.x - mountRect.left));
  nodes.track.style.transform = `translate(${snap(x)}px,${snap(data.y - mountRect.top)}px) translate(-50%,0)`;
}
function setCorner(node, clip, mountRect, key, bottom) {
  const show = !!(clip && clip[key]);
  node.style.opacity = show ? '1' : '0';
  if (!show) return;
  setText(node, clip[key]);
  if (node.style.color !== (clip.ink || '')) node.style.color = clip.ink || '';
  const x = clip.rect.right - 4 - mountRect.left, y = (bottom ? clip.rect.bottom - 4 : clip.rect.top + 4) - mountRect.top;
  node.style.transform = `translate(${snap(x)}px,${snap(y)}px) translate(-100%,${bottom ? '-100%' : '0%'})`;
}

/* createReadoutLayer({ mount, resolve }) → { refresh(), dispose() }
   mount: the element to paint into (position: relative/absolute ancestor; overflow decides the clip).
   resolve(ev): PointerEvent → cursor | null. The cursor shape:
     { state: 'hover'|'held',
       track: null | { x, y, text, sub },                 // client-space anchor + two ready strings
       vLine: null | { x, top, bottom },                   // client-space hairline, or null to hide
       hLine: null | { y, left, right },
       clip:  null | { rect: DOMRect, ink, timeText, valueText } }
   A touch pointer only shows while a 'held' cursor is live, and for 600ms after.
   refresh(): re-resolve the last known pointer position on demand — call it whenever the host's own
   model/view repaints independently of a pointer event (its coalescer can commit later than this one's). */
export function createReadoutLayer({ mount, resolve }) {
  const nodes = buildNodes(mount);
  let lastEvent = null, pointerType = 'mouse', touchActive = false, touchGraceUntil = 0, graceTimer = 0;
  function render(ev) {
    let cursor = ev ? resolve(ev) : null;
    if (cursor && pointerType === 'touch' && cursor.state !== 'held' && !touchActive && performance.now() > touchGraceUntil) cursor = null;
    const state = cursor ? cursor.state : 'idle';
    if (nodes.root.dataset.state !== state) nodes.root.dataset.state = state;
    const mountRect = cursor ? mount.getBoundingClientRect() : null;   // nothing to place, nothing to read (a layer mounted mid-build forced a layout)
    setLine(nodes.vline, cursor && cursor.vLine, mountRect, true);
    setLine(nodes.hline, cursor && cursor.hLine, mountRect, false);
    setTrack(nodes, cursor && cursor.track, mountRect);
    setCorner(nodes.clipTime, cursor && cursor.clip, mountRect, 'timeText', true);
    setCorner(nodes.clipValue, cursor && cursor.clip, mountRect, 'valueText', false);
  }
  const updates = coalesce(render);
  const handle = ev => {
    lastEvent = ev; pointerType = ev.pointerType || pointerType;
    if (ev.type === 'pointerdown' && ev.pointerType === 'touch') touchActive = true;
    if ((ev.type === 'pointerup' || ev.type === 'pointercancel') && ev.pointerType === 'touch') {
      touchActive = false; touchGraceUntil = performance.now() + 600;
      clearTimeout(graceTimer); graceTimer = setTimeout(() => updates.post(ev), 620); // nothing to follow: force the hide once the grace elapses
    }
    updates.post(ev);
  };
  const types = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'];
  for (const type of types) document.addEventListener(type, handle, { passive: true });
  const leave = () => { lastEvent = null; updates.post(null); };
  const refresh = () => { if (lastEvent) updates.post(lastEvent); };
  mount.addEventListener('pointerleave', leave);
  mount.addEventListener('wheel', refresh, { passive: true });
  mount.addEventListener('scroll', refresh, { capture: true, passive: true });
  const ro = new ResizeObserver(refresh); ro.observe(mount);
  const bodyObserver = new MutationObserver(refresh); // e.g. a global hide-UI toggle, with no pointer event of its own
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  render(null);
  return { refresh, dispose() {
    for (const type of types) document.removeEventListener(type, handle);
    mount.removeEventListener('pointerleave', leave);
    mount.removeEventListener('wheel', refresh);
    mount.removeEventListener('scroll', refresh, { capture: true });
    ro.disconnect(); bodyObserver.disconnect(); updates.cancel(); clearTimeout(graceTimer); nodes.root.remove();
  } };
}
