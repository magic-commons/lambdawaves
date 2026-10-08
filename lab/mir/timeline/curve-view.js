// A DOM-free plot description. Paint and hit testing consume the same visible
// nodes, musical coordinates and MIR evaluator, including cropped source tails.
import { createClipCoordinates } from './geometry.js';
import { evaluateTimelineSource } from './source.js';

export function createTimelinePlot(clip, source, pixelsPerBeat, height) {
  const geometry = createClipCoordinates(clip, source.length, pixelsPerBeat, height);
  const { width, firstTime, lastTime, xAtTime, yAtValue } = geometry;
  const value = t => evaluateTimelineSource(source, t * source.length);
  const visible = t => xAtTime(t) >= -1e-7 && xAtTime(t) <= width + 1e-7;
  const points = source.points.flatMap((p, i) => visible(p.t)
    ? [{ x: xAtTime(p.t), y: yAtValue(p.v), i }] : []);
  const handles = source.points.slice(0, -1).flatMap((p, i) => {
    const next = source.points[i + 1], t = (p.t + next.t) / 2;
    return p.segment !== 'hold' && next.t - p.t > 1e-9 && visible(t)
      ? [{ x: xAtTime(t), y: yAtValue(value(t)), i }] : [];
  });

  // Sample only visible intervals. A long hidden source must not spend the
  // plot's entire resolution budget on data outside the clip.
  const breaks = [...new Set([firstTime, ...source.points.map(p => p.t).filter(t => t > firstTime && t < lastTime), lastTime])];
  const resolution = Math.min(2048, Math.max(24, Math.ceil(width)));
  const samples = [];
  for (let i = 0; i < breaks.length - 1; i++) {
    const a = breaks[i], b = breaks[i + 1];
    const count = Math.max(1, Math.ceil(resolution * (b - a) / (lastTime - firstTime)));
    for (let k = 0; k < count; k++) {
      const t = a + (b - a) * k / count;
      samples.push([xAtTime(t), yAtValue(value(t))]);
    }
    // Draw a true vertical jump, never a diagonal across the last sample.
    // A cropped held interval also remains horizontal at the clip boundary.
    const preceding = source.points.findLast(p => p.t < b);
    if (preceding?.segment === 'hold' && b <= source.points.at(-1).t)
      samples.push([xAtTime(b), yAtValue(preceding.v)]);
    else if (preceding && source.points.some(p => p.t === b)) {
      const firstAtBoundary = source.points.find(p => p.t === b);
      samples.push([xAtTime(b), yAtValue(firstAtBoundary.v)]);
    }
  }
  samples.push([width, yAtValue(value(lastTime))]);
  const path = samples.map(([x, y], i) => (i ? 'L' : 'M') + x + ',' + y).join('');
  return { geometry, points, handles, path, fill: path + `L${width},${height}L0,${height}Z` };
}
