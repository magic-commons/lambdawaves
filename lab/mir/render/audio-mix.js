/* render/audio-mix.js — THE MIXDOWN: the KEEP AUDIO clips of a render's range, mixed offline at the same beats the frames read
 * (1.5.6-alpha.13, λWAVES 025 A2).  A render is a DAW's bounce, never a recording of the speakers: the arrangement's audio is
 * placed sample by sample from the same pure placement the live path uses (timeline/audio-playback.js `audioPlacement`), with
 * the render's frame zero as sample zero, and rendered by an OfflineAudioContext as fast as it can — no clock, no latency.
 *
 *   mixFrames(frames, fps, rate = MIX_RATE) → N            the PCM length of a film: round(frames · rate / fps), exactly
 *   mixPlan({ model, startBeat, bpm, frames, fps, rate }) → { rate, frames: N, seconds, clips: [{ id, assetId, name, when, offset,
 *     playRate, length }] }                                PURE (node tests it): every unmuted KEEP clip that sounds inside the range
 *       when     seconds after sample 0 where it starts     offset   the source's seconds it starts from
 *       playRate the varispeed rate (clip.scale · bpm / source.bpm, the tempo law)       length   real seconds it sounds
 *   mixdown(plan, { bytes?, OfflineAudioContext? }) → Promise<{ rate, frames, channels: [Float32Array L, R], clips } | null>
 *     null when no clip sounds in the range (the film has no audio track then).  Each file is decoded by the offline context
 *     itself (so at the mix rate); `bytes(assetId)` defaults to the kit's content-hash asset store.
 *   wavBytes(channels, rate) → Uint8Array                   16-bit PCM WAV (RIFF), N samples exactly: PNG FRAMES' audio
 *
 * THE LEVELS ARE THE ARRANGEMENT'S: each clip at unity gain, as the live path connects it; no normalise, no limiter (Josh 025
 * call 2).  A sample past ±1 is clipped only where it becomes 16-bit (the WAV) or by the encoder.  The tempo is the transport's
 * at the start of the run, as the frame plan reads it (`timelinePlan`'s bpm). */
import { audioPlacement } from '../timeline/audio-playback.js';
import { assets } from '../core/assets.js';

export const MIX_RATE = 48000, MIX_CHANNELS = 2;

export const mixFrames = (frames, fps, rate = MIX_RATE) => Math.round(frames * rate / fps);

export function mixPlan({ model, startBeat = 0, bpm, frames, fps, rate = MIX_RATE } = {}) {
  const N = mixFrames(frames, fps, rate), seconds = N / rate, endBeat = startBeat + seconds * bpm / 60;
  const doc = model.state(), curves = new Map(doc.curves.map((c) => [c.id, c])), clips = [];
  for (const clip of doc.clips) {
    const curve = curves.get(clip.curveId);
    if (!curve || curve.kind !== 'audio' || !curve.keep || clip.mute) continue;
    if (clip.start + clip.duration <= startBeat || clip.start >= endBeat) continue;
    const p = audioPlacement(clip, curve, startBeat, bpm);
    if (!(p.rate > 0) || p.offset >= curve.seconds || p.left <= 0 || p.lead >= seconds) continue;
    /* it sounds until the clip ends, the source runs out (at its own rate), or the range ends — whichever is first */
    const length = Math.min(p.left, (curve.seconds - p.offset) / p.rate, seconds - p.lead);
    if (!(length > 0)) continue;
    clips.push({ id: clip.id, assetId: curve.assetId, name: curve.name || 'AUDIO', when: p.lead, offset: p.offset, playRate: p.rate, length });
  }
  return { rate, frames: N, seconds, startBeat, bpm, clips };
}

export async function mixdown(plan, { bytes = (id) => assets.bytes(id), OfflineAudioContext: OAC = globalThis.OfflineAudioContext } = {}) {
  if (!plan || !plan.clips.length || !(plan.frames > 0)) return null;
  if (typeof OAC !== 'function') throw new Error('This browser cannot mix audio offline (no OfflineAudioContext). Turn AUDIO off.');
  const ctx = new OAC(MIX_CHANNELS, plan.frames, plan.rate), decoded = new Map();
  for (const c of plan.clips) {
    if (!decoded.has(c.assetId)) {
      const b = await bytes(c.assetId);
      if (!b) throw new Error('The audio file of ' + c.name + ' is not in this browser. Drop it on the timeline again, or turn AUDIO off.');
      decoded.set(c.assetId, await ctx.decodeAudioData(b.slice().buffer));
    }
    const src = ctx.createBufferSource();
    src.buffer = decoded.get(c.assetId); src.playbackRate.value = c.playRate;
    src.connect(ctx.destination);
    src.start(c.when, c.offset); src.stop(c.when + c.length);
  }
  const out = await ctx.startRendering();
  return { rate: plan.rate, frames: plan.frames, channels: [out.getChannelData(0), out.getChannelData(1)], clips: plan.clips.map((c) => c.name) };
}

export function wavBytes(channels, rate) {
  const ch = channels.length, n = channels[0].length, data = n * ch * 2, out = new Uint8Array(44 + data), dv = new DataView(out.buffer);
  const str = (at, s) => { for (let i = 0; i < s.length; i++) out[at + i] = s.charCodeAt(i); };
  str(0, 'RIFF'); dv.setUint32(4, 36 + data, true); str(8, 'WAVE');
  str(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, ch, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate * ch * 2, true); dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true);
  str(36, 'data'); dv.setUint32(40, data, true);
  for (let i = 0, at = 44; i < n; i++) for (let c = 0; c < ch; c++, at += 2) {
    const v = Math.max(-1, Math.min(1, channels[c][i]));
    dv.setInt16(at, v < 0 ? Math.round(v * 32768) : Math.round(v * 32767), true);
  }
  return out;
}
