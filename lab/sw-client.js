/* sw-client.js — THE INSTALL LAYER'S INTERFACE HALF (wave 56): the page's side of lab/sw.js — the offer of a waiting build,
 * the press that takes it, what a controllerchange means in THIS tab, the worker's messages, and ABOUT › UPDATE APP's
 * repair road.  A seam out of rack.js boot() (optimization 2026-09-24 · N7 seam 5, AUDIT-E §6); five closure edges,
 * handed in: `buildBadge` (the fifth badge, whose press is the offer), `setStatus` (SETTINGS' status line),
 * `getProjects` (a take asks before discarding an unsaved project), and since wave 133 `untouched` (rack.js' one
 * definition of a session a reload loses nothing from); since 032 the offer is the kit's popup, so it needs no host.  The object
 * it returns IS LW.sw — main.js arms it, gates replace its reload() — so it is created once, where the block stood. */
import { openDialog } from './mir/shell/dialog.js';

export function createSwClient({ buildBadge, setStatus, getProjects, untouched }) {
  /* ── WAVE 56 · THE INSTALL LAYER'S INTERFACE HALF (board #56) ─────────────────────────────────────────
   * lab/sw.js precaches the whole lab and then WAITS: it never calls skipWaiting() by itself, never claims
   * a client, and has no timer.  The ONE thing that can end a session's build is a press, and this is it.
   *
   * THE LAW THE WORKER CANNOT KEEP ALONE — found by the adversarial review of 2026-09-05 §2.2, and it is
   * right.  skipWaiting() activates the new worker, and the spec's Activate algorithm then re-points EVERY
   * client in scope and fires `controllerchange` in all of them, not only in the tab that consented.  So
   * a tab that did not ask is left on a controller whose activate has collected the cache it booted on, and its
   * next lazy import is answered by the NEW build (or a 404).  So since iteration 028 (R-03) the worker refuses
   * ANY take while a second window is open (LW_SW_BUSY), and this pane re-offers it as "n other windows are
   * open — UPDATE ALL, or close them first"; only UPDATE ALL sends `force: true`.  Each tab still decides what
   * a controllerchange MEANS — that is what `asked` is:
   *     the tab that PRESSED reloads, once — it asked for exactly this;
   *     a tab that did NOT ask reloads at once when it holds no work (rack.js `untouched`), and otherwise is
   *     TOLD to reload now and keeps its unsaved superposition, notebook page and layout until it does —
   *     never thrown away without being asked.
   *
   * ── WAVE 133 · THE OFFER ────────────────────────────────────────────────────────────────────────────
   * The badge was the whole offer, and first-run STATUS TAGS hid it, so users stayed on old builds without
   * ever seeing one was waiting.  Now: a session that holds NO work (rack.js `untouched`) takes the build at
   * once and reloads — a QUIET TAKE, which the worker refuses when a second window is open (LW_SW_BUSY), as it
   * refuses a press.  An
   * untouched session that is only PLAYING, or whose clock has moved, is offered it and takes it the next time the
   * page hides (nobody is watching then, so the clock does not count).  Every
   * other session is OFFERED it — the badge (never hidden by STATUS TAGS) and a pane under it that says what
   * to press, what is kept and what is lost — and keeps its work until a press.  A press on unsaved work asks
   * first, as UPDATE APP always did (it used to ask only in the beforeunload guard, AFTER the swap).
   *
   * ── 032 · THE OFFER IS A POPUP (Josh 11-01: "a full popup … similar to the photosensitivity warning that says an update is
   * available with a reload page button") ──────────────────────────────────────────────────────────────────
   * The pane under the badge became the kit's notice (mir/shell/dialog.js, the warning's own look): λWAVES' icon, UPDATE
   * AVAILABLE, what is kept and lost, RELOAD PAGE (RELOAD ALL when other windows are open) and LATER. Escape or a press outside is
   * LATER. A "no" to the unsaved-project question puts the popup back. The badge stays the second road to the same press. */
  let onHide = null, quietTake = false, dlg = null;
  const ART = './img/icon.svg';
  const BODY = 'A newer λWAVES is ready. Reload the page to start using it; it takes a few seconds. Saved projects, settings and the notebook are kept; unsaved changes are lost, so save first.';
  /* iteration 028 R-03: a press refused because other windows are open — the popup says so, and RELOAD PAGE becomes RELOAD ALL */
  const busyText = (n) => n + ' other window' + (n > 1 ? 's are' : ' is') + ' open on this build. RELOAD ALL reloads ' + (n > 1 ? 'them' : 'it')
    + ' too (a window holding work is told to reload instead), or close ' + (n > 1 ? 'them' : 'it') + ' first.';
  /** LATER (or Escape, or a press outside): the badge stays, and it also disarms the take-on-hide — the next take is a press or the next
      launch, not a reload behind the reader's back the moment they switch away (measured: t = 137 → LATER → hidden 0.9 s later → taken) */
  const later = () => { if (onHide) { document.removeEventListener('visibilitychange', onHide); onHide = null; } };
  const hidePane = () => { if (dlg) { const d = dlg; dlg = null; d.close('gone'); } };
  const swClient = {
    state: 'idle',                       // idle → ready (a build is waiting) → taking | replaced | refreshing | failed
    asked: false,                        // did THIS document ask for the swap?
    reloads: 0,
    build: null, cache: null, files: 0,
    mode: 'boot', error: null, registration: null, pending: null,
    take: null,
    checks: 0,                           // the reader's count (main.js): update checks asked on a return to the foreground
    offered: null,                       // the build digest the pane was shown for ('' when the worker named none) — once per waiting build
    others: 0,                           // the other windows the worker counted when it refused a press (LW_SW_BUSY); UPDATE then says UPDATE ALL
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
      swClient.state = 'ready'; swClient.others = 0;
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
    /** the visible offer: the badge, SETTINGS' status line, and the popup — the popup at most once per waiting build */
    offer() {
      swClient.say('A NEW BUILD IS READY · UPDATE', 'a new build is ready');
      const build = (swClient.pending && swClient.pending.build) || '';
      if (swClient.offered === build) return false;
      swClient.offered = build; hidePane();
      const art = document.createElement('img'); art.className = 'mir-notice-art lw-update-art'; art.src = ART; art.alt = ''; art.draggable = false;
      const others = swClient.others;
      const d = dlg = openDialog({ title: 'UPDATE AVAILABLE', body: others ? busyText(others) : BODY, kind: 'notice', mark: art,
        actions: [{ label: others ? 'RELOAD ALL' : 'RELOAD PAGE', kind: 'primary', value: 'reload' }, { label: 'LATER', value: 'later' }] });
      d.result.then((v) => {
        if (v === 'gone') return;                          // put away by the page (a take began, the build was replaced, another offer)
        if (dlg === d) dlg = null;
        if (v !== 'reload') { later(); return; }
        if (!swClient.accept(others ? { force: true } : undefined) && swClient.state === 'ready') { swClient.offered = null; swClient.offer(); }   // a "no" to the unsaved question: the offer stands
      });
      return true;
    },
    /** the popup put away by the page (a gate's reset) */
    closeOffer() { hidePane(); },
    /** the popup on show (its root), or null — none, leaving, or waiting behind another dialog */
    get offering() { return (dlg && dlg.root) || null; },
    /** the offer, pressed (the badge, UPDATE) — or, with { quiet: true }, taken for an untouched session, or with { force: true }
     *  UPDATE ALL (the user's yes for every open window) */
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
      swClient.asked = true; swClient.state = 'taking'; quietTake = quiet;
      swClient.say('TAKING THE NEW BUILD…', 'taking the new build');
      hidePane();
      try { swClient.take(quiet ? { alone: true } : opt && opt.force ? { force: true } : {}); } catch (e) { swClient.error = String(e && e.message || e); return false; }
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
          if (reg.waiting) {                               // the press's own road, so a refusal (other windows) is offered the same way
            const w = reg.waiting;
            if (!swClient.take) swClient.take = (o) => w.postMessage({ type: 'LW_SW_SKIP_WAITING', ...o });
            if (discardApproved) projects.markClean();
            swClient.state = 'ready';
            return swClient.accept();
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
    /** the controller under this document changed: the document that asked reloads; one that did not reloads at once when it
     *  holds no work (its lazy imports now reach the new build), and otherwise is told to — its work is never thrown away unasked */
    controllerChanged() {
      if (swClient.asked || (untouched && untouched(false))) { if (swClient.reloads++ === 0) swClient.reload(); return 'reloaded'; }
      swClient.state = 'replaced'; hidePane();              // wave 133: the offer is void here, so its UPDATE must not stand
      swClient.say('THIS BUILD WAS REPLACED IN ANOTHER TAB · RELOAD NOW', 'replaced in another tab; reload now');
      return 'told';
    },
    /** a message from the worker.  LW_SW_WAITING is §3's announcement, which nothing used to listen for.
     *  LW_SW_BUSY: the worker refused the take because another window is open — a quiet take is offered instead (wave 133), and a
     *  refused PRESS is re-offered with the count and UPDATE ALL (iteration 028 R-03). */
    message(d) {
      if (!d || !d.type) return null;
      if (d.type === 'LW_SW_WAITING') { swClient.pending = d; return 'waiting'; }
      if (d.type === 'LW_SW_BUSY') {
        swClient.asked = false; swClient.state = 'ready';
        if (!quietTake) { swClient.others = Math.max(1, (d.windows || 2) - 1); swClient.offered = null; }
        swClient.offer(); return 'busy';
      }
      if (d.type === 'LW_SW_ACTIVE' || d.type === 'LW_SW_BUILD') {
        swClient.build = d.build; swClient.files = d.files || 0; if (d.cache) swClient.cache = d.cache;
        return d.type === 'LW_SW_BUILD' ? 'build' : 'active';
      }
      return null;
    },
  };
  return swClient;
}
