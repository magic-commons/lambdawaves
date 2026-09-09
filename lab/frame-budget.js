/* rAF intervals measure delivered cadence, not GPU execution time. Learn a
 * conservative refresh ceiling from sustained samples; a stall cannot lower a
 * ceiling already observed. Start at 60 until faster delivery is demonstrated. */
export function createFrameBudget() {
  const samples = new Float64Array(24);
  let n = 0, refreshMs = 1000 / 60;
  return {
    sample(ms) {
      if (!Number.isFinite(ms) || ms < 3 || ms > 250) { n = 0; return; }
      samples[n++] = ms;
      if (n === samples.length) {
        samples.sort();
        // The lower quartile requires several fast frames, not one short callback.
        refreshMs = Math.min(refreshMs, Math.max(1000 / 120, samples[6]));
        n = 0;
      }
    },
    breakSequence() { n = 0; },
    milliseconds(mode) { return mode === '120' ? refreshMs : 1000 / 60; },
  };
}
