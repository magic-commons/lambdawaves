/* timeline/audio-playback.js — KEEP AUDIO: THE TRANSPORT'S BEATS PLACE THE FILE (harvested from BASINS app/audio-playback.js,
 * 2026-10-05).  One WebAudio buffer source per sounding clip.  No second clock: every node is re-derived from the
 * transport's beat on each tick, re-placed when its position drifts more than 60 ms from the beat, and LEASED: a node
 * that a stopped tick forgets (a recording, a hidden tab, a pause that bypassed the controller) ends by itself within
 * AUDIO_LEASE seconds, so nothing can keep sounding on its own.
 *
 *   createAudioPlayback({ model, mod, controller, retempo, busy }) → { sync(), stopAll(), state(), dispose() }
 *   model        timeline/model.js; the clips of kind 'audio' with `keep` sound, the others never make a context
 *   mod          installModulation's result: host.clock (the running state), host.model.transport (beats, bpm), onTick(fn)
 *   controller   timeline/controller.js: its scrub silences the file, a seek re-places it
 *   retempo()    called before every placement so a tempo change re-derives the clips first (audio-drop.js)
 *   busy()       true while a recorder owns the clock: the file is muted then (it records no audio) — and the lease ends
 *                what was already playing within a second
 *   audioPlacement(clip, curve, beat, bpm) → { rate, lead, offset, left }   the pure placement (node tests it)
 *   audioContext(), decodeAudio(bytes), rememberAudioBuffer(id, buffer), forgetAudioBuffer(id)
 *
 * THE PLAYBACK RATE is clip.scale · bpm / source.bpm: varispeed (pitch follows), the tempo law of audio-kind.js.  A 200 ms
 * lookahead gives a clean onset.  SIGNAL ONLY never creates an AudioContext: it is born only when a KEEP clip must sound. */
import { assets } from '../core/assets.js';

export const AUDIO_LEASE = 1, AUDIO_LOOKAHEAD = 0.2, AUDIO_DRIFT = 0.06, AUDIO_TAIL = 0.03;
let ctx = null;
const buffers = new Map(), ready = new Map();
export const audioContext = () => ctx ||= new (globalThis.AudioContext || globalThis.webkitAudioContext)();
export const decodeAudio = (bytes) => audioContext().decodeAudioData(bytes.slice().buffer);
export function rememberAudioBuffer(id, buffer) { ready.set(id, buffer); buffers.set(id, Promise.resolve(buffer)); }
export function forgetAudioBuffer(id) { ready.delete(id); buffers.delete(id); }
function want(id, then) {
  if (!buffers.has(id)) buffers.set(id, assets.bytes(id).then((b) => (b ? decodeAudio(b) : null)).catch(() => null)
    .then((buffer) => { if (buffer) ready.set(id, buffer); else buffers.delete(id); then(); return buffer; }));
  return ready.get(id) || null;
}

/** the clip's place at a transport beat: audio seconds where it sounds, the varispeed rate, real seconds left */
export function audioPlacement(clip, curve, beat, bpm) {
  const rate = clip.scale * bpm / curve.bpm, from = Math.max(beat, clip.start);
  return { rate, lead: Math.max(0, (clip.start - beat) * 60 / bpm),
    offset: ((from - clip.start) * clip.scale + clip.offset) * 60 / curve.bpm,
    left: (clip.start + clip.duration - from) * 60 / bpm };
}

export function createAudioPlayback({ model, mod, controller, retempo = () => {}, busy = () => false }) {
  const live = new Map();
  let disposed = false, starts = 0;
  const transport = () => mod.host.model.transport;
  const wanted = () => !disposed && mod.host.clock.isRunning() && !mod.host.clock.isRealtimeSuspended?.() && !controller?.isScrubbing?.() &&
    !busy() && !mod.deterministicClock?.active?.() && !mod.videoClock?.active?.() && !globalThis.document?.hidden;
  function stop(id) {
    const n = live.get(id); if (!n) return;
    live.delete(id); try { n.node.onended = null; n.node.stop(); } catch (_) { /* already ended */ } try { n.node.disconnect(); } catch (_) { /* gone */ }
  }
  const stopAll = () => { for (const id of [...live.keys()]) stop(id); };
  function sync() {
    if (!wanted()) { stopAll(); return; }
    const { beats: beat, bpm } = transport(), seen = new Set();
    const pairs = new Map([...model.activeClips(beat, 'audio'), ...model.activeClips(beat + AUDIO_LOOKAHEAD * bpm / 60, 'audio')].map((p) => [p.clip.id, p]));
    let c = null, now = 0;
    for (const { clip, curve } of pairs.values()) {
      if (!curve.keep) continue;
      const p = audioPlacement(clip, curve, beat, bpm);
      if (curve.seconds - p.offset <= AUDIO_TAIL || p.left <= AUDIO_TAIL || !(p.rate > 0)) continue;
      const buffer = want(curve.assetId, sync); if (!buffer) continue;
      if (!c) { c = audioContext(); if (c.state === 'suspended') c.resume?.().catch(() => {}); now = c.currentTime; }
      seen.add(clip.id);
      const key = [clip.start, clip.duration, clip.offset, clip.scale, curve.assetId, p.rate].join('|'), n = live.get(clip.id);
      const drift = n && c.state === 'running' && p.lead === 0 && now >= n.at ? Math.abs(n.offset + (now - n.at) * n.rate - p.offset) : 0;
      if (n && n.key === key && drift <= AUDIO_DRIFT) { try { n.node.stop(Math.min(n.at + n.left, now + p.lead + AUDIO_LEASE)); } catch (_) { /* already ended */ } continue; }
      stop(clip.id);
      const node = c.createBufferSource(), at = now + p.lead; node.buffer = buffer; node.playbackRate.value = p.rate; node.connect(c.destination);
      node.start(at, p.offset); node.stop(Math.min(at + p.left, at + AUDIO_LEASE)); starts++;
      const entry = { node, key, at, offset: p.offset, rate: p.rate, left: p.left };
      node.onended = () => { if (live.get(clip.id) === entry) live.delete(clip.id); };
      live.set(clip.id, entry);
    }
    for (const id of [...live.keys()]) if (!seen.has(id)) stop(id);
  }
  const tick = () => { retempo(); sync(); };
  const offTick = mod.onTick?.(tick);
  const offModel = model.subscribe(() => sync());
  const offTransport = controller?.subscribe?.((reason) => { retempo(); if (reason === 'seek' || reason === 'scrub' || reason === 'scrub-end') stopAll(); sync(); });
  const onVisible = () => sync();
  globalThis.document?.addEventListener('visibilitychange', onVisible);
  return {
    sync, stopAll,
    state: () => ({ context: ctx?.state || 'none', starts, live: [...live].map(([id, n]) => ({ id, at: n.at, offset: n.offset, rate: n.rate })) }),
    dispose() { disposed = true; stopAll(); offTick?.(); offModel(); offTransport?.(); globalThis.document?.removeEventListener('visibilitychange', onVisible); },
  };
}
