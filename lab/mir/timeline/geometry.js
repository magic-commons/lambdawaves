/* timeline/geometry.js — musical clip geometry, independent of the editor's zoom and pointer device (harvested whole
 * from BASINS app/timeline-geometry.js, 2026-10-02).  PURE. */
export const TIMELINE_TAB_HEIGHT = 18;
/* the curve editor's two pointer numbers, BASINS' app/curve-view.js CURVE_VIEW (the modulation window's curve keeps
   its own): the hit radius of a point or a handle, and the travel of a full tension swing, in px */
export const TIMELINE_CURVE_GRAB = 20;
export const TIMELINE_TENSION_TRAVEL = 114;
export const TIMELINE_ROW_GAP = 2; // Together: 20 px of negative space between panes.
// Timeline's own point/tension radii: bigger than the shared modulation-window CURVE_VIEW
// (app/curve-view.js), which stays untouched for the modulation window.
export const TIMELINE_POINT_RADIUS = 6;
export const TIMELINE_TENSION_RADIUS = 5;
export function timelineLaneHeight(viewportHeight, laneCount, rulerHeight = 32) {
  return Math.max(48, (viewportHeight - rulerHeight - laneCount * TIMELINE_TAB_HEIGHT - (laneCount - 1) * TIMELINE_ROW_GAP) / laneCount);
}

// NEAREST LANE: the row whose title+pane block is closest to a content-coordinate y, clamped to
// the first/last lane. The decision boundary between two lanes lands exactly on the midpoint of
// the 16px gap between them, so a drag crossing a gap or leaving the window never flickers or
// jumps to an unrelated lane; it changes once, at that midpoint.
export function nearestTimelineLane(y, laneCount, laneHeight) {
  const rowHeight = TIMELINE_TAB_HEIGHT + laneHeight, stride = rowHeight + TIMELINE_ROW_GAP;
  const index = Math.round((y - rowHeight / 2) / stride);
  return Math.max(0, Math.min(laneCount - 1, index));
}

// One musical-to-pixel mapping for drawing, hit testing and pointer edits. Clip
// bounds crop source time; their width never rescales the authored points.
export function createClipCoordinates(clip, sourceLength, pixelsPerBeat, height) {
  const width = clip.duration * pixelsPerBeat;
  const sourceBeatAtX = x => clip.offset + x / pixelsPerBeat * clip.scale;
  const xAtSourceBeat = beat => (beat - clip.offset) / clip.scale * pixelsPerBeat;
  return {
    width, height,
    sourceBeatAtX, xAtSourceBeat,
    timeAtX: x => sourceBeatAtX(x) / sourceLength,
    xAtTime: t => xAtSourceBeat(t * sourceLength),
    worldBeatAtX: x => clip.start + x / pixelsPerBeat,
    sourceBeatAtWorldBeat: beat => clip.offset + (beat - clip.start) * clip.scale,
    valueAtY: y => 1 - y / height,
    yAtValue: value => height * (1 - value),
    firstTime: clip.offset / sourceLength,
    lastTime: (clip.offset + clip.duration * clip.scale) / sourceLength
  };
}

export function snapTimelineBeat(beat, snap, bypass = false) {
  return Math.max(0, snap && !bypass ? Math.round(beat / snap) * snap : beat);
}

// Snap the edge actually being held, including fractional starts/durations.
export function timelineResizeDelta(clip, edge, pointerDelta, snap, bypass = false) {
  const anchor = clip.start + (edge === 'right' ? clip.duration : 0);
  return snapTimelineBeat(anchor + pointerDelta, snap, bypass) - anchor;
}

// Right edge reveals/trims the tail. Left edge is a ripple edit: the source
// travels with the start, while the old right boundary remains anchored.
export function resizeTimelineClip(clip, edge, delta, minimum = 1 / 16) {
  if (edge === 'right') return { duration: Math.max(minimum, clip.duration + delta) };
  const movement = Math.max(-clip.start, Math.min(clip.duration - minimum, delta));
  return { start: clip.start + movement, duration: clip.duration - movement };
}

// Chrome's early tabs: rounded shoulders, sloping sides, a flat joined foot.
// Use CSS pixel geometry so the corners stay rounded as clips grow or shrink.
export function timelineTabPath(width, height = TIMELINE_TAB_HEIGHT) {
  const slope = Math.min(height / 2, width / 4), foot = Math.min(4, width / 8), shoulder = Math.min(4, width / 8);
  return `M0 ${height} Q${foot} ${height} ${slope / 2} ${height - 3} L${slope} 3 Q${slope + shoulder / 2} 1 ${slope + shoulder} 1 H${width - slope - shoulder} Q${width - slope - shoulder / 2} 1 ${width - slope} 3 L${width - slope / 2} ${height - 3} Q${width - foot} ${height} ${width} ${height} Z`;
}
