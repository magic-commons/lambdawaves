/* sw-client.js — THE INSTALL LAYER'S INTERFACE HALF (wave 56): the page's side of lab/sw.js — the offer of a waiting build,
 * the press that takes it, what a controllerchange means in THIS tab, the worker's messages, and ABOUT › UPDATE APP's
 * repair road.  A seam out of rack.js boot() (optimization 2026-09-24 · N7 seam 5, AUDIT-E §6); five closure edges,
 * handed in: `buildBadge` (the fifth badge, whose press is the offer), `setStatus` (SETTINGS' status line),
 * `getProjects` (a take asks before discarding an unsaved project), and since wave 133 `untouched` (rack.js' one
 * definition of a session a reload loses nothing from) and `host` (#stage, where the offer's pane lives).  The object
 * it returns IS LW.sw — main.js arms it, gates replace its reload() — so it is created once, where the block stood. */
import { el, trig } from './mir/kit.js';

export function createSwClient({ buildBadge, setStatus, getProjects, untouched, host }) {
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
   * away without being asked, and it can say what happened rather than reload in silence.
   *
   * ── WAVE 133 · THE OFFER ────────────────────────────────────────────────────────────────────────────
   * The badge was the whole offer, and first-run STATUS TAGS hid it, so users stayed on old builds without
   * ever seeing one was waiting.  Now: a session that holds NO work (rack.js `untouched`) takes the build at
   * once and reloads — a QUIET TAKE, which the worker refuses when a second window is open (LW_SW_BUSY).  An
   * untouched session that is only PLAYING, or whose clock has moved, is offered it and takes it the next time the
   * page hides (nobody is watching then, so the clock does not count).  Every
   * other session is OFFERED it — the badge (never hidden by STATUS TAGS) and a pane under it that says what
   * to press, what is kept and what is lost — and keeps its work until a press.  A press on unsaved work asks
   * first, as UPDATE APP always did (it used to ask only in the beforeunload guard, AFTER the swap). */
  let pane = null, onHide = null;
  const PANE_TEXT = [
    'A newer λWAVES is installed and waiting. Press <b>UPDATE</b> — or the badge above — to reload into it. It takes a few seconds.',
    '<b>KEPT:</b> saved projects, settings, keys, the notebook. <b>LOST:</b> unsaved changes and the undo list — save first.',
    '<b>LATER</b> keeps the badge; ABOUT › UPDATE APP works any time.',
  ];
  /* the pane is built here, once, hidden — like #sheet it exists from boot, so rack.js' occlusion burst and its
     observer treat it exactly as they treat #sheet — and offer() only shows it */
  if (host) {
    pane = el('section', 'glass', host); pane.id = 'offer'; pane.hidden = true;
    pane.setAttribute('role', 'region'); pane.setAttribute('aria-label', 'a new build is ready');   // not a live region: wave 62's ceiling is spoken for
    el('h3', '', pane, 'A NEW BUILD IS READY');
    for (const html of PANE_TEXT) el('p', '', pane).innerHTML = html;
    const row = el('div', 'offer-row', pane);
    row.appendChild(trig({ label: 'UPDATE', onFire: () => swClient.accept() }).root);
    /* LATER is the reader's answer, so it also disarms the take-on-hide: the badge stays, and the next take is a press or
       the next launch — not a reload behind their back the moment they switch away (measured: t = 137 → LATER → hidden
       0.9 s later → taken, reloaded to t = 0) */
    row.appendChild(trig({ label: 'LATER', onFire: () => { pane.hidden = true;
      if (onHide) { document.removeEventListener('visibilitychange', onHide); onHide = null; } } }).root);
  }
  const hidePane = () => { if (pane) pane.hidden = true; };
  /* THE CARET IS MEASURED, NOT COMPUTED: the badge's centre minus the pane's left edge, read when the pane is shown and again
     on a resize or a body-class change (STATUS TAGS) while it is up — wherever the row puts the badge (first in it: lab.css `order: -1`), wrapped or not. */
  const aim = () => {
    const b = buildBadge();
    if (!pane || pane.hidden || !b) return;
    const br = b.getBoundingClientRect(), pr = pane.getBoundingClientRect();
    const x = br.left + br.width / 2 - pr.left - pane.clientLeft;
    pane.style.setProperty('--caret-x', Math.round(Math.max(12, Math.min(pane.clientWidth - 12, x))) + 'px');   // kept on the pane's edge
  };
  addEventListener('resize', aim, { passive: true });
  new MutationObserver(aim).observe(document.body, { attributes: true, attributeFilter: ['class'] });   // STATUS TAGS (body.no-badges) moves the badge in its row
  const swClient = {
    state: 'idle',                       // idle → ready (a build is waiting) → taking | replaced | refreshing | failed
    asked: false,                        // did THIS document ask for the swap?
    reloads: 0,
    build: null, cache: null, files: 0,
    mode: 'boot', error: null, registration: null, pending: null,
    take: null,
    checks: 0,                           // the reader's count (main.js): update checks asked on a return to the foreground
    offered: null,                       // the build digest the pane was shown for ('' when the worker named none) — once per waiting build
    /** the one seam a gate replaces — nothing else in the lab reloads the page */
    reload() { location.reload(); },
    say(badge, status) {
      const b = buildBadge();
      if (b) { b.hidden = false; b.lastChild.textContent = badge; }
      setStatus(status);                                   // …and a second place to find it, for a browser with STATUS TAGS off (SETTINGS' status line)
      return badge;
    },
    /** A build is waiting.  An untouched session takes it quietly; one that is only playing (or whose clock moved) is offered it
     *  and takes it when the page next hides; any other session is offered it and keeps its work until a press. */
    buildReady(take) {
      /* a build announced while UPDATE APP runs or a take is under way does not restart the state machine */
      if (swClient.state === 'refreshing' || swClient.state === 'taking') { if (typeof take === 'function') swClient.take = take; return false; }
      if (typeof take === 'function') swClient.take = take;
      if (!swClient.take) return false;
      swClient.state = 'ready';
      if (untouched && untouched(false)) { swClient.accept({ quiet: true }); return true; }
      swClient.offer();
      if (untouched && untouched(true)) {
        if (onHide) document.removeEventListener('visibilitychange', onHide);
        onHide = () => {
          if (document.visibilityState !== 'hidden') return;
          document.removeEventListener('visibilitychange', onHide); onHide = null;   // one shot: the first hide decides
          if (swClient.state === 'ready' && untouched(true)) swClient.accept({ quiet: true });
        };
        document.addEventListener('visibilitychange', onHide);
      }
      return true;
    },
    /** the visible offer: the badge, SETTINGS' status line, and the pane — the pane at most once per waiting build */
    offer() {
      swClient.say('A NEW BUILD IS READY · UPDATE', 'a new build is ready');
      const build = (swClient.pending && swClient.pending.build) || '';
      if (!pane || swClient.offered === build) return false;
      swClient.offered = build; pane.hidden = false; aim();
      return true;
    },
    /** the offer, pressed (the badge, UPDATE) — or, with { quiet: true }, taken for an untouched session */
    accept(opt) {
      /* a tab whose build another tab replaced: the swap has already happened, so its badge's press is a plain reload (the
         beforeunload guard still asks for a dirty project — after the swap, which here is the only order there is) */
      if (swClient.state === 'replaced') { swClient.reload(); return true; }
      if (swClient.state !== 'ready' || !swClient.take) return false;
      const quiet = !!(opt && opt.quiet), projects = getProjects();
      if (projects && projects.dirty) {
        if (quiet) return false;                           // cannot happen — untouched() includes !dirty — but the guard stays
        if (!window.confirm('UPDATE APP WITHOUT SAVING?\nYour unsaved project changes will be lost.')) return false;
        projects.markClean();
      }
      swClient.asked = true; swClient.state = 'taking';
      swClient.say('TAKING THE NEW BUILD…', 'taking the new build');
      hidePane();
      try { swClient.take(quiet ? { alone: true } : {}); } catch (e) { swClient.error = String(e && e.message || e); return false; }
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
            hidePane();
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
      swClient.state = 'replaced'; hidePane();              // wave 133: the offer is void here, so its UPDATE must not stand
      swClient.say('THIS BUILD WAS REPLACED IN ANOTHER TAB · RELOAD WHEN READY', 'replaced in another tab');
      return 'told';
    },
    /** a message from the worker.  LW_SW_WAITING is §3's announcement, which nothing used to listen for.
     *  LW_SW_BUSY (wave 133): the worker refused a quiet take because another window is open — offer it instead. */
    message(d) {
      if (!d || !d.type) return null;
      if (d.type === 'LW_SW_WAITING') { swClient.pending = d; return 'waiting'; }
      if (d.type === 'LW_SW_BUSY') { swClient.asked = false; swClient.state = 'ready'; swClient.offer(); return 'busy'; }
      if (d.type === 'LW_SW_ACTIVE' || d.type === 'LW_SW_BUILD') {
        swClient.build = d.build; swClient.files = d.files || 0; if (d.cache) swClient.cache = d.cache;
        return d.type === 'LW_SW_BUILD' ? 'build' : 'active';
      }
      return null;
    },
  };
  return swClient;
}
