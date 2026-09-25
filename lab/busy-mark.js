/* busy-mark.js — THE BUSY MARK (wave 48): the nine-square mark that follows the pointer while the lab is working — a
 * nesting counter (`busy.n`), a time window (`busy.until`, the frame-gap rule's flash), the one DOM host (#busyMark,
 * a clone of the header's mark) and the pointer position it rides at.  A seam out of rack.js boot() (optimization
 * 2026-09-24 · N7 seam 2, AUDIT-E §6): two closure edges, handed in — `paintMarks` (the clone takes the wheel's
 * colours) and `ensureTurnCSS` (the loop animates the CURRENT palette).  `busy` is returned as the same live object
 * boot()'s callers bump (setElement, a project open) and LW.busy reads.  The pointermove listener is registered
 * here, at the moment boot() calls createBusyMark — where the block used to register it. */
export function createBusyMark({ paintMarks, ensureTurnCSS }) {
  const busy = { n: 0, until: 0, shown: false, x: -200, y: -200, host: null, moves: 0, timer: 0 };
  function busyHost() {
    if (busy.host) return busy.host;
    const h = document.getElementById('busyMark'); if (!h) return null;
    const src = document.querySelector('#title .mark');
    if (src && !h.children.length) { h.appendChild(src.cloneNode(true)); paintMarks(); }
    busy.host = h; return h;
  }
  function busySync() {
    const want = busy.n > 0 || performance.now() < busy.until;
    if (want === busy.shown) return;
    busy.shown = want;
    const h = busyHost(); if (h) { h.hidden = !want; if (want) busyWrite(); }
    if (want) ensureTurnCSS();                                    // the loop reads the CURRENT palette's keyframes
    const m = document.querySelector('#title .mark'); if (m) m.classList.toggle('busy', want);
  }
  function busyWrite() { const h = busy.host; if (!h) return; h.style.setProperty('--cx', busy.x + 'px'); h.style.setProperty('--cy', busy.y + 'px'); }
  /** raise the mark for `ms` from now — the frame-gap rule and any caller that cannot bracket its own work */
  function busyFlash(ms) { const t = performance.now() + ms; if (t > busy.until) busy.until = t; busySync();
    clearTimeout(busy.timer); busy.timer = setTimeout(() => { busy.timer = 0; busySync(); }, Math.max(0, busy.until - performance.now()) + 30); }   // the window has to close itself: nothing else would ask again
  /** bracket a promise (or a synchronous function) with the mark */
  function busyWrap(p) { busy.n++; busySync(); const done = () => { busy.n = Math.max(0, busy.n - 1); busySync(); }; if (p && typeof p.then === 'function') { p.then(done, done); return p; } done(); return p; }
  function cardLoading(w, key) {
    let on = false;
    return (v) => { const next = !!v; if (next === on) return; on = next; w.setLoading(next, key); if (next) { busy.n++; busySync(); } else { busy.n = Math.max(0, busy.n - 1); busySync(); } };
  }
  window.addEventListener('pointermove', (e) => {                       // the position: two writes, no read, and only while it is up
    busy.x = e.clientX; busy.y = e.clientY;
    if (busy.shown) { busy.moves++; busyWrite(); }
  }, { passive: true });
  return { busy, busyHost, busySync, busyFlash, busyWrap, cardLoading };
}
