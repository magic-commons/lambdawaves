// A stopped compositor must reject explicitly, never strand callers forever or
// pretend a timer tick was a rendered frame.
export function waitForPaint(read, request = requestAnimationFrame, cancel = cancelAnimationFrame, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    let frame;
    const timer = setTimeout(() => {
      cancel(frame);
      const state = read();
      reject(new Error('Render did not settle: animation frames stopped' +
        (state.error ? ' — ' + state.error : '') + (state.hidden ? ' (page hidden)' : '')));
    }, timeoutMs);
    frame = request(() => { frame = request(() => {
      clearTimeout(timer); resolve(read().frames);
    }); });
  });
}
