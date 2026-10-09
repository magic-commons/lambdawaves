/* timeline/model.js — THE ARRANGEMENT: shared curves, placed instances (clips), and ordered lanes (harvested whole from
 * BASINS app/timeline-model.js, 2026-10-02; its laws, its wire format and its signatures unchanged, so a BASINS project's
 * `timeline` restores here byte for byte).  PURE: no DOM, no clock; node runs it (tests/timeline-*.node.mjs).
 *   createTimelineModel() → { state, serialize, subscribe, beforeReplace, begin, commit, cancel, undo, redo, restore,
 *     addLane, removeLane, create, updateClip, updateCurve, addPoint, movePoint, movePoints, removePoints, drawPoints,
 *     removePoint, setTension, setSegment, deleteClip, deleteClips, copyClips, pasteClips, duplicateClips, moveClips,
 *     duplicate, makeUnique, value(targetId, beat), setActive, activeClips(beat, kind?), needsClock(has), signature,
 *     rederive(patches), lastRefusal }
 *   value(targetId, beat) is the automation the modulation clock samples (host.clock.setAutomation({ value })): the
 *   latest-starting unmuted clip under the beat wins, as a 0..1 value scaled into the curve's OUTPUT RANGE.
 *   Its own 64-row snapshot undo stays (an app with the kit's one history routes it there: timeline/history.js). */
import { clipKind, isKindCurve } from './kinds.js';
import './pattern-kind.js';                 // the kit's two kinds are registered before any model restores a project
import { audioBudgetAdding } from './audio-kind.js';   // registers the audio kind, and holds the one budget every way of making an audio clip answers to
import { normalizeTimelinePoints, evaluateTimelineSource, addTimelinePoint, moveTimelinePoint, slideTimelinePoint, moveTimelinePoints, removeTimelinePoints, drawTimelinePoints, removeTimelinePoint, setTimelineTension, setTimelineSegment, TIMELINE_MAX_TOTAL_POINTS } from './source.js';
const clone = v => JSON.parse(JSON.stringify(v));
const finite = (n, d = 0) => Number.isFinite(n) ? n : d;
const clamp = n => Math.max(0, Math.min(1, finite(n)));
export const DEFAULT_TIMELINE_COLOR = '#a7adb8';
export const TIMELINE_HISTORY_BYTES = 16 * 1024 * 1024;
export const TIMELINE_HISTORY_LIMIT = 64;
const color = value => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : DEFAULT_TIMELINE_COLOR;
const empty = () => ({ v: 1, seq: 4, meter: 4, lanes: [1,2,3,4].map(i => ({ id: 'lane'+i, name: 'LANE '+i })), curves: [], clips: [] });
export function createTimelineModel() {
  let data = empty(), before = null, refusal = null;
  const listeners = new Set(), resetListeners = new Set(), undo = [], redo = [];
  const encoder = new TextEncoder();
  let historyBytes = 0;
  let byTarget = new Map();
  const index = () => { byTarget = new Map(); const curves = new Map(data.curves.map(c=>[c.id,c]));
    for (const clip of data.clips) { const curve=curves.get(clip.curveId); if (!curve) continue; if (!byTarget.has(curve.targetId)) byTarget.set(curve.targetId,[]); byTarget.get(curve.targetId).push({clip,curve}); } };
  // The index holds live clip/source references. Field edits keep those
  // identities; only structural edits or snapshot replacement rebuild it.
  const notify = (rebuild = true) => { if (rebuild) index(); for (const fn of listeners) fn(); };
  function clearHistory(list) { for (const entry of list) historyBytes -= entry.bytes; list.length = 0; }
  function takeHistory(list, first = false) {
    const entry = first ? list.shift() : list.pop();
    if (entry) historyBytes -= entry.bytes;
    return entry;
  }
  function pushHistory(list, text) {
    const entry = { text, bytes: encoder.encode(text).byteLength };
    list.push(entry); historyBytes += entry.bytes; return entry;
  }
  function boundHistory(latest) {
    // Both past and future count toward one budget. Preserve the latest
    // recovery state, even when that single snapshot exceeds the byte cap.
    while (undo.length + redo.length > 1 && (undo.length + redo.length > TIMELINE_HISTORY_LIMIT || historyBytes > TIMELINE_HISTORY_BYTES)) {
      if (undo.length && undo[0] !== latest) takeHistory(undo, true);
      else if (redo.length && redo[0] !== latest) takeHistory(redo, true);
      else break;
    }
  }
  const remember = text => { clearHistory(redo); boundHistory(pushHistory(undo, text)); };
  function edit(fn, rebuild = true) {
    const old = before ? null : JSON.stringify(data), result = fn(data);
    if (before) { if (result !== false) notify(rebuild); }
    else if (old !== JSON.stringify(data)) { remember(old); notify(rebuild); }
    return result;
  }
  const id = kind => kind + (++data.seq);
  /* THE AUDIO BUDGET, however the clip is made (64 clips, 20 minutes of distinct audio): create, paste, duplicate and so slice all ask
     it BEFORE their one edit, so a refusal is whole (nothing half-applied) and says why in `lastRefusal` (the caller toasts it). */
  const refuseAudio = (curves) => { refusal = null; const adds = curves.filter(c => c && c.kind === 'audio').map(c => ({ assetId: c.assetId, seconds: c.seconds })); if (!adds.length) return false;
    const b = audioBudgetAdding(data, adds); if (b.ok) return false; refusal = { why: b.why, vars: b.vars }; return true; };
  function cleanCurves() { const used = new Set(data.clips.map(c => c.curveId)); data.curves = data.curves.filter(c => used.has(c.id)); }
  function fitsPoints(curveId, points) { return data.curves.reduce((count, c) => count + (c.id === curveId ? points.length : c.points.length), 0) <= TIMELINE_MAX_TOTAL_POINTS; }
  function applySource(curve, points, length) {
    const grew = length > curve.length;
    curve.points = points; curve.length = length;
    if (grew) for (const clip of data.clips) if (clip.curveId === curve.id && clip.followSourceEnd)
      clip.duration = Math.max(clip.duration, (curve.length - clip.offset) / clip.scale);
  }
  function editPoint(curveId, operation) {
    const curve = data.curves.find(c => c.id === curveId);
    if (!curve) return null;
    const result = operation(curve);
    if (result.source === curve) return { ...result, source: clone(curve), points: clone(curve.points) };
    if (!fitsPoints(curveId, result.points)) return { source: clone(curve), points: clone(curve.points), length: curve.length, index: -1, full: true };
    return edit(() => {
      applySource(curve, result.points, result.length);
      // Returned snapshots are safe for pointer-down drag state; callers may
      // never mutate the model through an editor-held source object.
      return { ...result, source: clone(curve), points: clone(curve.points) };
    }, false);
  }
  const api = {
    state: () => clone(data), serialize: () => clone(data),
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    beforeReplace(fn) { resetListeners.add(fn); return () => resetListeners.delete(fn); },
    begin() { refusal = null; if (!before) before = JSON.stringify(data); },   // a new gesture forgets the last refusal (a slice that never reaches duplicate must not report a stale one)
    commit() { if (before && before !== JSON.stringify(data)) remember(before); before = null; },
    cancel() { if (before) { data = JSON.parse(before); before = null; notify(); } },
    undo() { for(const fn of resetListeners)fn(); api.cancel(); if (!undo.length) return false; const previous=takeHistory(undo),latest=pushHistory(redo,JSON.stringify(data)); data=JSON.parse(previous.text); boundHistory(latest); notify(); return true; },
    redo() { for(const fn of resetListeners)fn(); api.cancel(); if (!redo.length) return false; const next=takeHistory(redo),latest=pushHistory(undo,JSON.stringify(data)); data=JSON.parse(next.text); boundHistory(latest); notify(); return true; },
    restore(input, remap = id => id) {
      let next = empty();
      if (input != null) {
        try {
          if (input.v !== 1 || !Array.isArray(input.lanes) || !input.lanes.length || input.lanes.length > 32 ||
              !Array.isArray(input.curves) || input.curves.length > 1024 || !Array.isArray(input.clips) || input.clips.length > 4096) return false;
          next = clone(input); delete next.paletteIds;
          if (next.lanes.some(l => !l || typeof l.id !== 'string') || new Set(next.lanes.map(l=>l.id)).size !== next.lanes.length) return false;
          if (next.curves.some(c => !c || typeof c.id !== 'string' || typeof c.targetId !== 'string' || !Number.isFinite(c.length) || c.length <= 0 || (isKindCurve(c) ? !(clipKind(c)?.validate?.(c) ?? false) : !normalizeTimelinePoints(c.points))) || next.curves.reduce((n,c)=>n+(c.points?.length||0),0)>TIMELINE_MAX_TOTAL_POINTS) return false;
          if (new Set(next.curves.map(c=>c.id)).size !== next.curves.length || new Set(next.clips.map(c=>c.id)).size !== next.clips.length) return false;
          const lanes = new Set(next.lanes.map(l=>l.id)), curves = new Set(next.curves.map(c=>c.id));
          if (next.clips.some(c => !c || typeof c.id !== 'string' || !lanes.has(c.laneId) || !curves.has(c.curveId) || ![c.start,c.duration,c.offset,c.scale].every(Number.isFinite) || c.start < 0 || c.duration <= 0 || c.offset < 0 || c.scale <= 0 || c.followSourceEnd!=null && typeof c.followSourceEnd!=='boolean')) return false;
          next.meter = [1,2,3,4,5,6,7,8,12].includes(next.meter) ? next.meter : 4;
          if (next.active != null && !(Number.isFinite(next.active.start) && Number.isFinite(next.active.end) && next.active.end > next.active.start && next.active.start >= 0)) delete next.active;
          next.seq = Math.max(4,Math.floor(finite(next.seq,4)), ...[...next.lanes,...next.curves,...next.clips].map(c=>Number(c.id.match(/\d+$/)?.[0])||0));
          for (const c of next.curves) { c.targetId = remap(c.targetId) || c.targetId; c.name = String(c.name || c.targetId).slice(0,80); c.color = color(c.color); c.points = isKindCurve(c) ? (Array.isArray(c.points) ? normalizeTimelinePoints(c.points) || [] : []) : normalizeTimelinePoints(c.points); c.min = clamp(c.min ?? 0); c.max = clamp(c.max ?? 1); }
        } catch (_) { return false; }
      }
      for(const fn of resetListeners)fn();
      data = next; before = null; clearHistory(undo); clearHistory(redo); notify(); return true;
    },
    addLane() { if (data.lanes.length >= 32) return false; return edit(d => { const l = { id: id('lane'), name: 'LANE '+(d.lanes.length+1) }; d.lanes.push(l); return l.id; }); },
    removeLane(laneId, confirmed = false) {
      const lane = data.lanes.find(l => l.id === laneId), count = data.clips.filter(c => c.laneId === laneId).length;
      if (!lane || data.lanes.length === 1) return { ok: false };
      if (count && !confirmed) return { ok: false, confirm: true, count, laneId, name: lane.name };
      return edit(d => { d.clips = d.clips.filter(c => c.laneId !== laneId); d.lanes = d.lanes.filter(l => l.id !== laneId); cleanCurves(); return { ok: true, count }; });
    },
    create({ targetId, name, value, start = 0, duration = data.meter, laneId, source = null }) {
      refusal = null;
      if (source && source.kind && source.kind !== 'curve' && !(clipKind(source)?.validate?.({ ...source, targetId, length: duration }) ?? false)) return null;
      if (source && refuseAudio([source])) return null;
      if (!targetId || !Number.isFinite(value) || !Number.isFinite(start) || !Number.isFinite(duration) || duration <= 0) return null;
      start = Math.max(0,start);
      const free = lane => !data.clips.some(c=>c.laneId===lane.id && c.start < start+duration && c.start+c.duration > start);
      const lane = data.lanes.find(l=>l.id===laneId && free(l)) || data.lanes.find(free);
      if (!lane || data.curves.length >= 1024 || data.clips.length >= 4096 || data.curves.reduce((n,c)=>n+c.points.length,0)+2 > TIMELINE_MAX_TOTAL_POINTS) return null;
      return edit(d => { const curve = { id: id('curve'), targetId, name: name || targetId, color: DEFAULT_TIMELINE_COLOR, length: duration, min: 0, max: 1,
        points: [{t:0,v:clamp(value),tension:0},{t:1,v:clamp(value),tension:0}] , ...(source || {}), ...(isKindCurve(source) && !Array.isArray(source.points) ? { points: [] } : {}), length: duration };
        const clip = { id: id('clip'), curveId: curve.id, laneId: lane.id, start, duration, offset: 0, scale: 1, mute: false, followSourceEnd: true };
        d.curves.push(curve); d.clips.push(clip); return clip.id; });
    },
    updateClip(clipId, patch) { return edit(d=> { const c=d.clips.find(c=>c.id===clipId); if(!c)return false;
      const p = {...c,...patch}; if (!d.lanes.some(l=>l.id===p.laneId) || ![p.start,p.duration,p.offset,p.scale].every(Number.isFinite) || p.start<0 || p.duration<=0 || p.offset<0 || p.scale<=0) return false;
      for(const k of ['start','duration','offset','scale','laneId','mute']) c[k]=p[k];
      if(Object.hasOwn(patch,'duration') || Object.hasOwn(patch,'offset') || Object.hasOwn(patch,'scale')) c.followSourceEnd=false;
      return true; }, false); },
    updateCurve(curveId, patch) { return edit(d=>{const c=d.curves.find(c=>c.id===curveId);if(!c)return false;
      const points=patch.points==null?c.points:normalizeTimelinePoints(patch.points);
      // Source length and normalized points must be updated atomically. A raw
      // length-only patch would silently stretch all authored musical times.
      if(!points || !fitsPoints(curveId,points) || patch.length!=null && (!patch.points || !Number.isFinite(patch.length) || patch.length<c.length)) return false;
      if(patch.points)applySource(c,points,patch.length??c.length);
      if(patch.name!=null)c.name=String(patch.name).slice(0,80);
      if(patch.color!=null)c.color=color(patch.color);
      if(patch.min!=null)c.min=clamp(patch.min);if(patch.max!=null)c.max=clamp(patch.max);return true; }, false); },
    addPoint(curveId, sourceBeat, value, tension = 0) { return editPoint(curveId, c => addTimelinePoint(c, sourceBeat, value, tension)); },
    movePoint(curveId, index, sourceBeat, value, { slide = false } = {}) { return editPoint(curveId, c => (slide ? slideTimelinePoint : moveTimelinePoint)(c, index, sourceBeat, value)); },
    movePoints(curveId, indices, beatDelta, valueDelta, options = {}) { return editPoint(curveId, c => {
      const result=moveTimelinePoints(options.original || c, indices, beatDelta, valueDelta, options);
      if(result.invalid)return { ...result,source:c,points:c.points,length:c.length };
      // Pointer-down snapshots prevent cumulative group movement. A retreating
      // drag must still retain source runway grown by an earlier pointer move.
      if(result.length<c.length){result.points=normalizeTimelinePoints(result.points.map(p=>({...p,t:p.t*result.length/c.length})));result.length=c.length;result.source={...result.source,points:result.points,length:c.length};}
      return result;
    }); },
    removePoints(curveId, indices) { return editPoint(curveId, c => removeTimelinePoints(c, indices)); },
    drawPoints(curveId, samples, options) { return editPoint(curveId, c => drawTimelinePoints(c, samples, options)); },
    removePoint(curveId, index) { return editPoint(curveId, c => removeTimelinePoint(c, index)); },
    setTension(curveId, index, tension) { return editPoint(curveId, c => setTimelineTension(c, index, tension)); },
    setSegment(curveId, index, segment) { return editPoint(curveId, c => setTimelineSegment(c, index, segment)); },
    deleteClip(clipId) { return edit(d=>{d.clips=d.clips.filter(c=>c.id!==clipId);cleanCurves();}); },
    deleteClips(ids) {
      const chosen=new Set(ids);if(!chosen.size||[...chosen].some(id=>!data.clips.some(c=>c.id===id)))return false;
      return edit(d=>{d.clips=d.clips.filter(c=>!chosen.has(c.id));cleanCurves();return true;});
    },
    copyClips(ids) {
      const chosen=new Set(ids), clips=data.clips.filter(c=>chosen.has(c.id));
      if(!clips.length||clips.length!==chosen.size)return null;
      const firstLane=Math.min(...clips.map(c=>data.lanes.findIndex(l=>l.id===c.laneId))),start=Math.min(...clips.map(c=>c.start));
      return {v:1,start,laneId:data.lanes[firstLane].id,entries:clips.map(c=>({clip:clone(c),curve:clone(data.curves.find(x=>x.id===c.curveId)),laneOffset:data.lanes.findIndex(l=>l.id===c.laneId)-firstLane}))};
    },
    pasteClips(bundle, { start=bundle?.start, laneId=bundle?.laneId } = {}) {
      const lane=data.lanes.findIndex(l=>l.id===laneId),entries=bundle?.entries;
      if(bundle?.v!==1||!Array.isArray(entries)||!entries.length||lane<0||!Number.isFinite(start)||start<0||!Number.isFinite(bundle.start))return null;
      const prepared=[];
      for(const e of entries){
        const c=e?.clip,curve=e?.curve,points=isKindCurve(curve)?(clipKind(curve)?.validate?.(curve)?(Array.isArray(curve.points)?curve.points:[]):null):normalizeTimelinePoints(curve?.points),index=lane+e?.laneOffset;
        if(!c||!curve||!points||!Number.isInteger(e.laneOffset)||e.laneOffset<0||index>=data.lanes.length||typeof curve.targetId!=='string'||!curve.targetId||
          ![curve.length,c.start,c.duration,c.offset,c.scale].every(Number.isFinite)||curve.length<=0||c.duration<=0||c.offset<0||c.scale<=0||!Number.isFinite(start+c.start-bundle.start)||start+c.start-bundle.start<0)return null;
        prepared.push({clip:{...clone(c),start:start+c.start-bundle.start,laneId:data.lanes[index].id},curve:{...clone(curve),points}});
      }
      if(refuseAudio(prepared.map(e=>e.curve)))return null;
      if(data.clips.length+prepared.length>4096||data.curves.length+prepared.length>1024||data.curves.reduce((n,c)=>n+c.points.length,0)+prepared.reduce((n,e)=>n+e.curve.points.length,0)>TIMELINE_MAX_TOTAL_POINTS)return null;
      return edit(d=>prepared.map(e=>{e.curve.id=id('curve');e.clip.id=id('clip');e.clip.curveId=e.curve.id;d.curves.push(e.curve);d.clips.push(e.clip);return e.clip.id;}));
    },
    duplicateClips(ids, { delta } = {}) {
      const bundle=api.copyClips(ids);if(!bundle)return null;
      const shift=delta??Math.max(...bundle.entries.map(e=>e.clip.start+e.clip.duration))-bundle.start;
      return api.pasteClips(bundle,{start:bundle.start+shift});
    },
    moveClips(ids, { beatDelta=0, laneDelta=0, originals } = {}) {
      const chosen=new Set(ids),clips=originals||data.clips.filter(c=>chosen.has(c.id));
      if(!chosen.size||clips.length!==chosen.size||clips.some(c=>!chosen.has(c.id)||!data.clips.some(x=>x.id===c.id))||!Number.isFinite(beatDelta)||!Number.isInteger(laneDelta))return false;
      const lanes=clips.map(c=>data.lanes.findIndex(l=>l.id===c.laneId));if(lanes.some(i=>i<0))return false;
      const dt=Math.max(-Math.min(...clips.map(c=>c.start)),beatDelta),dl=Math.min(data.lanes.length-1-Math.max(...lanes),Math.max(-Math.min(...lanes),laneDelta));
      if(clips.some(c=>!Number.isFinite(c.start+dt)))return false;
      return edit(d=>{clips.forEach((c,i)=>{const live=d.clips.find(x=>x.id===c.id);live.start=c.start+dt;live.laneId=d.lanes[lanes[i]+dl].id;});return {beatDelta:dt,laneDelta:dl};},false);
    },
    duplicate(clipId, unique=false) { { const c=data.clips.find(c=>c.id===clipId); if(c&&refuseAudio([data.curves.find(x=>x.id===c.curveId)]))return null; } return edit(d=>{const c=d.clips.find(c=>c.id===clipId);if(!c || d.clips.length>=4096)return null;
      const original=d.curves.find(x=>x.id===c.curveId);
      if(unique && (d.curves.length>=1024 || d.curves.reduce((n,x)=>n+x.points.length,0)+original.points.length>TIMELINE_MAX_TOTAL_POINTS))return null;
      const copy={...c,id:id('clip'),start:c.start+c.duration};
      if(unique){const curve={...clone(d.curves.find(x=>x.id===c.curveId)),id:id('curve')};d.curves.push(curve);copy.curveId=curve.id;}d.clips.push(copy);return copy.id;}); },
    makeUnique(clipId) { return edit(d=>{const c=d.clips.find(c=>c.id===clipId);if(!c)return false;
      if(d.clips.filter(x=>x.curveId===c.curveId).length===1)return true;
      const original=d.curves.find(x=>x.id===c.curveId);
      if(d.curves.length>=1024 || d.curves.reduce((n,x)=>n+x.points.length,0)+original.points.length>TIMELINE_MAX_TOTAL_POINTS)return false;
      const curve={...clone(original),id:id('curve')};d.curves.push(curve);c.curveId=curve.id;cleanCurves();return true;}); },
    value(targetId, beat) {
      let winner = null;
      for (const {clip,curve} of byTarget.get(targetId) || []) {
        if (clip.mute || beat < clip.start || beat >= clip.start+clip.duration) continue;
        if (!winner || clip.start > winner.clip.start || (clip.start === winner.clip.start && clip.id.localeCompare(winner.clip.id,undefined,{numeric:true}) > 0)) winner={clip,curve};
      }
      if (!winner) return null;
      const {clip,curve}=winner;
      const sourceBeat=(beat-clip.start)*clip.scale+clip.offset;
      const kind=clipKind(curve); if(kind){const v=kind.value?kind.value(curve,clip,sourceBeat):null; return Number.isFinite(v)?curve.min+(curve.max-curve.min)*v:null;}
      return curve.min+(curve.max-curve.min)*evaluateTimelineSource(curve,sourceBeat);
    },
    setActive(r) { return edit(d => { if (r && Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start) d.active = { start: Math.max(0, r.start), end: r.end }; else delete d.active; return !!d.active; }); },
    activeClips(beat, kind = null) { const out=[]; const curves=new Map(data.curves.map(c=>[c.id,c])); for(const clip of data.clips){ if(clip.mute||beat<clip.start||beat>=clip.start+clip.duration)continue; const curve=curves.get(clip.curveId); if(!curve||(kind&&(curve.kind||'curve')!==kind))continue; out.push({clip,curve}); } return out; },
    needsClock(has = () => true) { for (const [target,list] of byTarget) if (has(target) && list.some(({clip})=>!clip.mute)) return true; return false; },
    /** rederive([[clipId, { scale, duration, … }]]) — DERIVED fields, not an edit: the audio clips' scale and beat length after a tempo change
     *  (audio-drop.js).  It adds no undo row (it is not the person's act) and refuses while a gesture is open (false: ask again). */
    rederive(patches) { if (before) return false; let n = 0; for (const [clipId, patch] of patches) { const c = data.clips.find(c => c.id === clipId); if (!c) continue;
      const p = { ...c, ...patch }; if (![p.start, p.duration, p.offset, p.scale].every(Number.isFinite) || p.start < 0 || p.duration <= 0 || p.offset < 0 || p.scale <= 0) continue;
      for (const k of ['duration', 'offset', 'scale']) c[k] = p[k]; c.followSourceEnd = false; n++; }
      if (n) notify(false); return n > 0; },
    /** why the last create / paste / duplicate was refused for the audio budget: { why, vars } (English key and its values), or null */
    get lastRefusal() { return refusal; },
    signature: () => JSON.stringify(data)
  };
  return api;
}

export function isTimelineSnapshot(input) { return input == null || createTimelineModel().restore(input); }
