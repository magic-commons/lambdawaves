/* render/plan.js — WHAT A RENDER WILL BE, before it runs: the frame plan, the beat range, the bitrate, the encoder ladder, the
 * estimate and the ceiling warning.  Pure: no DOM, node runs it (it imports only the kit's t()).  Harvested from BASINS app/exportcore.js
 * (recordingPlan, pickHighBitrate, RECORD_SIZES, codecCandidates, CAP_MS_DEFAULT), app/render-plan.js (timelinePlan) and
 * app/export.js (the ceiling warning, fmtMs); the arithmetic is BASINS' unchanged.
 *
 *   recordingPlan({ fps, durationS, offsetS }) → { fps, frames, startFrame, durationS, offsetS, lastSourceFrame } | null
 *     Frames are numbered from the play edge, frame zero included; `offsetS` skips to a start frame by stepping the clock.
 *   timelinePlan({ range:{start,end}, bpm, fps }) → recordingPlan + { startBeat, endBeat, bpm, beatAt(i) }   (TIMELINE · ACTIVE /
 *     SELECTION): the range's beats at the fps.  Frame i shows beat (startFrame + i) / fps · bpm / 60.  An empty or unreadable
 *     range refuses with a sentence.
 *   estimateFilm({ frames, fps, width, height, format, bitrate?, msPerFrame? }) → { frames, durationS, bitrate, bytes, rawBytes, renderMs }
 *     `bytes` is the MP4's size at the target bitrate (null for PNG frames: lossless, so unknowable before); `rawBytes` is
 *     the uncompressed size the temporary store must be able to hold; `renderMs` is the capture cost, frames × msPerFrame
 *     (BASINS' measured seed 84 ms, replaced by the device's own after one run).
 *   ceilingWarning(ms, ceilingMs = RUN_CEILING_MS) → '' | a sentence
 *   fmtBytes · fmtMs · fmtClock */

import { t } from '../core/i18n.js';
import { formatSeconds } from '../timeline/time-format.js';

/** the frame rates the panel offers (BASINS: Josh's spec) */
export const RECORD_FPS = Object.freeze([24, 30, 48, 60]);
export const RECORD_RESOLUTIONS = Object.freeze(['current', '1080p', '1440p', '2160p']);
export const RECORD_FORMATS = Object.freeze(['mp4', 'png']);
export const RECORD_SIZES = Object.freeze({ '1080p': [1920, 1080], '1440p': [2560, 1440], '2160p': [3840, 2160] });
/** the longest run the plan allows: 3600 s at 60 fps */
export const MAX_FRAMES = 216000;
/** BASINS' run ceiling (SETTLE_POLL_LIMIT): 20 minutes */
export const RUN_CEILING_MS = 20 * 60 * 1000;
/** the capture cost per frame BASINS measured on its rig (wxmp4 gate, 84.2 ms at 1280×814); the device's own replaces it */
export const CAP_MS_DEFAULT = 84;

export const fmtBytes = (b) => (b >= 1e6 ? (b / 1e6).toFixed(1) + ' MB' : b >= 1e3 ? Math.round(b / 1e3) + ' kB' : Math.round(b) + ' B');
export const fmtMs = (ms) => (ms >= 3600e3 ? (ms / 3600e3).toFixed(1) + ' h' : ms >= 60e3 ? Math.round(ms / 60e3) + ' min' : ms >= 1e3 ? (ms / 1e3).toFixed(1) + ' s' : Math.round(ms) + ' ms');
/** a duration as m:ss, whole seconds TRUNCATED (the timeline's formatSeconds): 59.6 s is 0:59, never 0:60 */
export const fmtClock = (s) => formatSeconds(s);

/** A recording's high-quality master: 0.5 bit per pixel per frame, between 40 and 200 Mbps.  The final bitrate is checked with
 *  VideoEncoder.isConfigSupported before any frame is captured. */
export function pickHighBitrate(w, h, fps) {
  return Math.round(Math.min(200e6, Math.max(40e6, w * h * fps * 0.5)));
}

/** Frames are numbered from the first Space play edge, including frame zero. */
export function recordingPlan({ durationS, offsetS = 0, fps } = {}) {
  const rate = Number(fps), duration = Number(durationS), offset = Number(offsetS);
  if (!RECORD_FPS.includes(rate) || !(duration > 0) || !(offset >= 0) || !Number.isFinite(duration) || !Number.isFinite(offset)) return null;
  const frames = Math.max(1, Math.round(duration * rate));
  const startFrame = Math.round(offset * rate);
  if (!Number.isSafeInteger(frames) || !Number.isSafeInteger(startFrame)) return null;
  return { fps: rate, frames, startFrame, durationS: frames / rate, offsetS: startFrame / rate, lastSourceFrame: startFrame + frames - 1 };
}

/** TIMELINE · ACTIVE and TIMELINE · SELECTION: a range of BEATS rendered through the deterministic clock.  Frame zero is beat
 *  zero (the clock's play edge); the run seeks by stepping to the range's first frame, so the rack and the arrangement
 *  replay exactly, then records to the range's end (exclusive) at the fps. */
export function timelinePlan({ range, bpm, fps = 30 } = {}) {
  const start = Number(range?.start), end = Number(range?.end), rate = Number(fps), tempo = Number(bpm);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || !(end > start)) throw new Error('The range is empty — select a span of the timeline first');
  if (!(tempo > 0) || !Number.isFinite(tempo)) throw new Error('The tempo is unreadable');
  const secondsPerBeat = 60 / tempo;
  const startFrame = Math.round(start * secondsPerBeat * rate), endFrame = Math.round(end * secondsPerBeat * rate);
  const plan = recordingPlan({ fps: rate, durationS: Math.max(1, endFrame - startFrame) / rate, offsetS: startFrame / rate });
  if (!plan) throw new Error('Choose a frame rate of 24, 30, 48 or 60');
  return { ...plan, startBeat: start, endBeat: end, bpm: tempo, beatAt: (i) => (plan.startFrame + i) / rate / secondsPerBeat };
}

/** The avc1 profile/level ladder by output size: candidates for isConfigSupported, strongest first.  High 5.1 carries
 *  4096×2304@30; High 4.0 carries 1080p; the Main/Baseline tail is for encoders that refuse High. */
export function codecCandidates(w, h) {
  const px = w * h, list = [];
  if (px > 1920 * 1088) list.push('avc1.640034');   // High 5.2 (4K60)
  if (px > 1920 * 1088) list.push('avc1.640033');   // High 5.1
  list.push('avc1.64002a');                          // High 4.2 (1080p60)
  list.push('avc1.640028');                          // High 4.0
  list.push('avc1.64001f');                          // High 3.1
  list.push('avc1.4d0028');                          // Main 4.0
  list.push('avc1.42002a');                          // Baseline 4.2
  return list;
}

export function estimateFilm({ frames, fps, width, height, format = 'mp4', bitrate, msPerFrame } = {}) {
  const n = Math.max(0, Math.floor(Number(frames) || 0)), rate = Number(fps) || 30;
  const rate_ = Number(bitrate) > 0 ? Number(bitrate) : pickHighBitrate(width, height, rate);
  const durationS = n / rate;
  const rawBytes = width * height * 4 * n;
  return { frames: n, durationS, bitrate: rate_, rawBytes,
    bytes: format === 'mp4' ? Math.round(rate_ / 8 * durationS) : null,
    renderMs: n * (Number(msPerFrame) > 0 ? Number(msPerFrame) : CAP_MS_DEFAULT) };
}

/** The pre-run half of the ceiling law: a projection that already exceeds the run ceiling says so before the tap. */
export function ceilingWarning(ms, ceilingMs = RUN_CEILING_MS) {
  if (!(ms > ceilingMs)) return '';
  return ' — ' + t('LONGER than {limit}: keep this page open and visible (the screen is held awake), or shorten it; a failed render keeps its completed frames to recover', { limit: fmtMs(ceilingMs) });
}
