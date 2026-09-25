/* sw-client.js — THE INSTALL LAYER'S INTERFACE HALF (wave 56): the page's side of lab/sw.js — the offer of a waiting build,
 * the press that takes it, what a controllerchange means in THIS tab, the worker's messages, and ABOUT › UPDATE APP's
 * repair road.  A seam out of rack.js boot() (optimization 2026-09-24 · N7 seam 5, AUDIT-E §6); three closure edges,
 * handed in: `buildBadge` (the fifth badge, whose press is the offer), `setStatus` (SETTINGS' status line) and
 * `getProjects` (UPDATE APP asks before discarding an unsaved project).  The object it returns IS LW.sw — main.js
 * arms it, gates replace its reload() — so it is created once, where the block stood. */
export function createSwClient({ buildBadge, setStatus, getProjects }) {
  /* ── WAVE 56 · THE INSTALL LAYER'S INTERFACE HALF (board #56) ─────────────────────────────────────────
   * lab/sw.js precaches the whole lab and then WAITS: it never calls skipWaiting() by itself, never claims
   * a client, and has no timer.  The ONE thing that can end a session's build is a press, and this is it.
   *
   * THE LAW THE WORKER CANNOT KEEP ALONE — found by the adversarial review of 2026-09-05 §2.2, and it is
   * right.  skipWaiting() activates the new worker, and the spec's Activate algorithm then re-points EVERY
   * client in scope and fires `controllerchange` in all of them, not only in the tab that consented.  So
   * "a new build is never swapped in under a running session" can only be true per TAB, and only if each
   * tab decides for itself what a controllerchange MEANS.  That is what `asked` is:
   *     the tab that PRESSED reloads, once — it asked for exactly this;
   *     a tab that did NOT ask is TOLD and keeps running, with its unsaved superposition, its notebook page
   *     and its layout intact, until its own press.
   * The second tab is now standing on a controller whose activate has already collected the cache it booted
   * on, so what it is told says exactly that.  A page cannot prevent it; it can refuse to throw the work
   * away without being asked, and it can say what happened rather than reload in silence. */
  const swClient = {
    state: 'idle',                       // idle → ready (a build is waiting) → taking | replaced
    asked: false,                        // did THIS document ask for the swap?
    reloads: 0,
    build: null, cache: null, files: 0,
    mode: 'boot', error: null, registration: null, pending: null,
    take: null,
    /** the one seam a gate replaces — nothing else in the lab reloads the page */
    reload() { location.reload(); },
    say(badge, status) {
      const b = buildBadge();
      if (b) { b.hidden = false; b.lastChild.textContent = badge; }
      setStatus(status);                                   // …and a second place to find it, for a browser with STATUS TAGS off (SETTINGS' status line)
      return badge;
    },
    /** OFFER a waiting build.  It never takes it: `take` is called by the press and by nothing else. */
    buildReady(take) {
      if (typeof take === 'function') swClient.take = take;
      if (!swClient.take) return false;
      swClient.state = 'ready';
      swClient.say('A NEW BUILD IS READY · RELOAD', 'a new build is ready');
      return true;
    },
    /** the offer, pressed */
    accept() {
      if (swClient.state !== 'ready' || !swClient.take) return false;
      swClient.asked = true; swClient.state = 'taking';
      swClient.say('TAKING THE NEW BUILD…', 'taking the new build');
      try { swClient.take(); } catch (e) { swClient.error = String(e && e.message || e); return false; }
      return true;
    },
    /** Explicit repair path from ABOUT > UPDATE APP. First ask the registration for a new worker. If
     *  one installs, take it through the normal safe handoff. If the server has the same worker, remove
     *  this app's registration and Cache Storage, then reload from the network; the next boot precaches
     *  a clean copy. Project data lives in localStorage and is never touched here. */
    async refresh() {
      if (swClient.state === 'refreshing' || swClient.state === 'taking') return false;
      let discardApproved = false;
      const projects = getProjects();
      if (projects && projects.dirty) {
        if (!window.confirm('UPDATE APP WITHOUT SAVING?\nYour unsaved project changes will be lost.')) return false;
        discardApproved = true;
      }
      swClient.state = 'refreshing';
      swClient.say('CHECKING FOR A NEW BUILD…', 'checking for a new build');
      try {
        const reg = swClient.registration || (navigator.serviceWorker && await navigator.serviceWorker.getRegistration('./'));
        if (reg) {
          await reg.update();
          const installing = reg.installing;
          if (installing && !['installed', 'activated', 'redundant'].includes(installing.state)) {
            await Promise.race([
              new Promise((resolve) => installing.addEventListener('statechange', () => {
                if (['installed', 'activated', 'redundant'].includes(installing.state)) resolve();
              })),
              new Promise((resolve) => setTimeout(resolve, 15000)),
            ]);
          }
          if (reg.waiting) {
            if (discardApproved) projects.markClean();
            swClient.asked = true; swClient.state = 'taking';
            swClient.say('TAKING THE NEW BUILD…', 'taking the new build');
            reg.waiting.postMessage({ type: 'LW_SW_SKIP_WAITING' });
            return true;
          }
          await reg.unregister();
        }
        if ('caches' in globalThis) {
          const names = await caches.keys();
          await Promise.all(names.filter((name) => name.startsWith('lw-lab-')).map((name) => caches.delete(name)));
        }
        if (discardApproved) projects.markClean();
        swClient.asked = true;
        swClient.say('CACHE CLEARED · RELOADING…', 'cache cleared; reloading');
        swClient.reload();
        return true;
      } catch (e) {
        swClient.error = String(e && e.message || e); swClient.state = 'failed';
        swClient.say('UPDATE FAILED · TRY AGAIN', 'update failed: ' + swClient.error);
        return false;
      }
    },
    /** the controller under this document changed.  ONLY the document that asked may reload. */
    controllerChanged() {
      if (swClient.asked) { if (swClient.reloads++ === 0) swClient.reload(); return 'reloaded'; }
      swClient.state = 'replaced';
      swClient.say('THIS BUILD WAS REPLACED IN ANOTHER TAB · RELOAD WHEN READY', 'replaced in another tab');
      return 'told';
    },
    /** a message from the worker.  LW_SW_WAITING is §3's announcement, which nothing used to listen for. */
    message(d) {
      if (!d || !d.type) return null;
      if (d.type === 'LW_SW_WAITING') { swClient.pending = d; return 'waiting'; }
      if (d.type === 'LW_SW_ACTIVE' || d.type === 'LW_SW_BUILD') {
        swClient.build = d.build; swClient.files = d.files || 0; if (d.cache) swClient.cache = d.cache;
        return d.type === 'LW_SW_BUILD' ? 'build' : 'active';
      }
      return null;
    },
  };
  return swClient;
}
