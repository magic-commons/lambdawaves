// Latest-value painting, shared by rack and notebook drags. A 32 ms timer keeps
// a busy renderer responsive; flush() commits the final position before saving.
export function coalesce(apply) {
  let frame = 0, timer = 0, pending, queued = false;
  const flush = () => {
    if (frame) cancelAnimationFrame(frame);
    if (timer) clearTimeout(timer);
    frame = timer = 0;
    if (!queued) return;
    const value = pending;
    queued = false; pending = undefined;
    apply(value);
  };
  return {
    post(value) {
      pending = value; queued = true;
      if (frame || timer) return;
      frame = requestAnimationFrame(flush);
      timer = setTimeout(flush, 32);
    },
    flush,
  };
}
