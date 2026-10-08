/* occlusion.js — 0.5.0 A7 · THE OCCLUSION PROVIDERS: what paints over the stage, asked once per burst.
 * The field's frame, axes and slice outline skip PAINTED surfaces, never a transparent layout box (CLAUDE.md).  Each window
 * species registers a provider answering its painted rects in viewport CSS pixels, already clipped; the host (rack.js
 * refreshOcclusion) converts them to the canvas, keeps the hidden-interface clearing and hands them to field.setOcclusion,
 * which keeps the first 32.  KIT BRIEF 8's `paintedSpace({ rack, layer, extra })` is the twin, and C8 makes these ONE
 * subscription to it:   layer ← 'modwin' + 'chiprail' + 'floats'  ·  rack ← 'rack' (its columns stand in past the cap)
 *   ·  extra() ← 'extra' (transport, notebook, sheet, offer, rackAddList, rackFavList) + 'keymap'
 *   ·  subscribe(fn) ← dirty() + watch(): the one producer, which asks for a PRESENT even while paused. */
const CAP = 32;   // the field's uniform block (field.js setOcclusion)

/** null when hidden, `visibility: hidden` or under 2 px; else the element's rect, clipped by `clip`'s.  The clip is taken here,
 *  in viewport pixels, before the host's canvas shift: max/min commute with subtracting one number, so it is bitwise the old one. */
export function paintedRect(el, clip) {
  if (!el || el.hidden || getComputedStyle(el).visibility === 'hidden') return null;
  const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return null;
  const c = clip && clip.getBoundingClientRect();
  return c ? { left: Math.max(r.left, c.left), top: Math.max(r.top, c.top), right: Math.min(r.right, c.right), bottom: Math.min(r.bottom, c.bottom) } : r;
}

/** `dirty` marks the block stale and schedules a PRESENT.  register(name, rects, { standIn }): `rects()` answers rects or nulls.
 *  rects(map) runs each through `map` (viewport → canvas, null drops it) BEFORE counting; a provider with a stand-in goes after
 *  every other, and when its own rects would carry the block past 32 its stand-in's replace them (the rack's columns, today). */
export function createOcclusion(dirty) {
  const providers = new Map();
  let mo = null;
  const into = (out, list, map) => { for (const r of list) { const c = r && map(r); if (c) out.push(c); } return out; };
  return {
    register(name, rects, { standIn = null } = {}) { providers.set(name, { rects, standIn }); },
    unregister(name) { return providers.delete(name); },
    rects(map) {
      const out = [], all = [...providers.values()];
      for (const p of all) if (!p.standIn) into(out, p.rects(), map);
      for (const p of all) if (p.standIn) { const own = into([], p.rects(), map); if (out.length + own.length <= CAP) out.push(...own); else into(out, p.standIn(), map); }
      return out;
    },
    dirty,
    /** a mutation on `el` (`opts` as MutationObserver.observe takes them) dirties the block; one observer serves every call */
    watch(el, opts) { if (el) (mo || (mo = new MutationObserver(dirty))).observe(el, opts); }
  };
}
