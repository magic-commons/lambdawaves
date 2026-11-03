/* sw-client.js — THE INSTALL LAYER'S INTERFACE HALF (wave 56): the page's side of lab/sw.js — the offer of a waiting build,
 * the press that takes it, what a controllerchange means in THIS tab, the worker's messages, and ABOUT › UPDATE APP's
 * repair road.  A seam out of rack.js boot() (optimization 2026-09-24 · N7 seam 5, AUDIT-E §6); five closure edges,
 * handed in: `buildBadge` (the fifth badge, whose press is the offer), `setStatus` (SETTINGS' status line),
 * `getProjects` (a take asks before discarding an unsaved project), and since wave 133 `untouched` (rack.js' one
 * definition of a session a reload loses nothing from); since 032 the offer is the kit's popup, so it needs no host.  The object
 * it returns IS LW.sw — main.js arms it, gates replace its reload() — so it is created once, where the block stood. */
import { openDialog, confirmDialog } from './mir/shell/dialog.js';
import { BUILD_ID } from './build-id.js';   // 033 THE UPDATER: the page's own build (pwa --write)

/* 033 THE UPDATER (Claude Sos, 2026-11-02; the plan: research/iteration-033/PLAN.md).  Four laws joined this file:
 *   THE PAGE KNOWS ITS BUILD — BUILD_ID (lab/build-id.js) against the controller's `page` in LW_SW_BUILD: a MIXED BUILD is said on the badge
 *     and in ABOUT, reloaded once by an untouched page (sessionStorage lw.mixed keeps it to once), offered to a touched one.
 *   A FAILURE SAYS WHY — LW_SW_INSTALL_FAILED carries the entry and the reason the install was refused; the badge, SETTINGS' status and
 *     the diagnostics say the sentence (for a day of 032 UPDATE FAILED said nothing while Cloudflare 307ed one precached file).
 *   REPAIR TOUCHES THE BUILD, NEVER THE DATA — refresh() ends in a verified state: the registration and the lw-lab-* caches go, the page
 *     reloads (sessionStorage lw.repair = 1), waits for the fresh install to activate, reloads once more (= 2) and says REPAIRED;
 *     lw-data-v1, lw-vol-*, localStorage and the session are never touched.
 *   THE STATE CAN BE SEEN — diagnostics(): one text of the builds, the controller, every cache, every record, the volumes, the app's
 *     own lines (`extra`), the last errors; COPY DIAGNOSTICS puts it on the clipboard and shows it. */
export function createSwClient({ buildBadge, setStatus, getProjects, untouched, extra = null }) {
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
  const brief = (why) => { const w = String(why || '').replace(/^precache \.\//, '').replace(/\s+/g, ' '); return w.length > 72 ? w.slice(0, 69) + '…' : w; };   // 033: the badge's share of a reason
  const ART = './img/icon.svg';
  const UNSAVED = 'Your unsaved project changes will be lost. Save first, or go on without them.';
  const BODY = 'A newer λWAVES is ready. Reload the page to start using it; it takes a few seconds. Saved projects, settings, the notebook and your installed volumes are kept; unsaved changes are lost, so save first.';
  /* iteration 028 R-03: a press refused because other windows are open — the popup says so, and RELOAD PAGE becomes RELOAD ALL */
  const busyText = (n) => n + ' other window' + (n > 1 ? 's are' : ' is') + ' open on this build. RELOAD ALL reloads ' + (n > 1 ? 'them' : 'it')
    + ' too (a window holding work is told to reload instead), or close ' + (n > 1 ? 'them' : 'it') + ' first.';
  /** LATER (or Escape, or a press outside): the badge stays, and it also disarms the take-on-hide — the next take is a press or the next
      launch, not a reload behind the reader's back the moment they switch away (measured: t = 137 → LATER → hidden 0.9 s later → taken) */
  const later = () => { if (onHide) { document.removeEventListener('visibilitychange', onHide); onHide = null; } };
  const hidePane = () => { if (dlg) { const d = dlg; dlg = null; d.close('gone'); } };
  const swClient = {
    state: 'idle',                       // idle → ready (a build is waiting) → taking | replaced | refreshing | failed
    page: BUILD_ID, workerPage: null,    // 033: the build this page was loaded from, and the build its controller serves (LW_SW_BUILD)
    failure: null,                       // 033: the last LW_SW_INSTALL_FAILED sentence
    asked: false,                        // did THIS document ask for the swap?
    reloads: 0,
    build: null, cache: null, files: 0,
    mode: 'boot', error: null, registration: null, pending: null,
    take: null,
    checks: 0,                           // the reader's count (main.js): update checks asked on a return to the foreground
    offered: null,                       // the build digest the pane was shown for ('' when the worker named none) — once per waiting build
    repairWaits: false,                  // 034 F8: REPAIR's fresh install waits for another window (repairBoot) — the offer says so
    others: 0,                           // the other windows the worker counted when it refused a press (LW_SW_BUSY); UPDATE then says UPDATE ALL
    /** the one seam a gate replaces — nothing else in the lab reloads the page */
    reload() { location.reload(); },
    say(badge, status) {
      const b = buildBadge();
      if (b) { b.hidden = false; b.lastChild.textContent = badge; }
      setStatus(status);                                   // …and a second place to find it, for a browser with STATUS TAGS off (SETTINGS' status line)
      swClient.paintBuild();
      return badge;
    },
    /** 033 · ABOUT's build line: the page's build, the worker's, the install's state — one sentence, rewritten on every event */
    paintBuild() {
      const n = document.querySelector('.ab-build'); if (!n) return;
      const ctl = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
      const w = swClient.workerPage;
      const state = swClient.failure ? 'INSTALL FAILED: ' + swClient.failure
        : swClient.state === 'mixed' ? 'MIXED BUILD — reload'
        : ctl && w && w !== BUILD_ID ? 'MIXED BUILD — reload'
        : ctl ? 'offline ready' + (swClient.files ? ' · ' + swClient.files + ' files' : '')
        : swClient.mode === 'automation' || swClient.mode === 'declined' ? 'worker off (' + swClient.mode + ')'
        : swClient.mode === 'unsupported' ? 'no service worker in this browser'
        : 'first launch — offline from the next launch';
      const text = 'build ' + BUILD_ID + (w ? ' · worker ' + w : '') + ' · ' + state;
      if (n.textContent !== text) n.textContent = text;
    },
    /** 033 · THE PAGE KNOWS ITS BUILD: the controller named a different page build — this document is a MIXED BUILD */
    mixed() {
      if (swClient.state === 'taking' || swClient.state === 'refreshing' || swClient.state === 'mixed') return false;
      swClient.state = 'mixed';
      swClient.say('MIXED BUILD · RELOAD', 'this page is not the build the worker serves: reload');
      let once = null; try { once = sessionStorage.getItem('lw.mixed'); } catch (_) {}
      if (!once && untouched && untouched(false)) { try { sessionStorage.setItem('lw.mixed', BUILD_ID); } catch (_) {} swClient.reload(); return true; }
      return false;
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
      if (swClient.repairWaits) swClient.say('REPAIR · WAITING FOR THE OTHER WINDOW', 'repair: the build installed and waits for the other λWAVES window — reload all, or close it');   // 034 F8
      else swClient.say('A NEW BUILD IS READY · UPDATE', 'a new build is ready');
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
        Promise.resolve(swClient.accept(others ? { force: true } : undefined)).then((ok) => { if (!ok && swClient.state === 'ready') { swClient.offered = null; swClient.offer(); } });   // a "no" to the unsaved question: the offer stands
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
      const go = () => {
        swClient.asked = true; swClient.state = 'taking'; quietTake = quiet;
        swClient.say('TAKING THE NEW BUILD…', 'taking the new build');
        hidePane();
        try { swClient.take(quiet ? { alone: true } : opt && opt.force ? { force: true } : {}); } catch (e) { swClient.error = String(e && e.message || e); return false; }
        return true;
      };
      if (projects && projects.dirty) {
        if (quiet) return false;                           // cannot happen — untouched() includes !dirty — but the guard stays
        /* 033: the question is the kit's dialog, never a native confirm — an alert over the app, which headless Firefox (and a
           distracted hand) answers with cancel; the upgrade rig found the take dying on it.  → a Promise<boolean> on this road only */
        return confirmDialog(UNSAVED, { title: 'UPDATE WITHOUT SAVING?', yes: 'UPDATE ANYWAY', no: 'KEEP WORKING', danger: true })
          .then((ok) => { if (!ok || swClient.state !== 'ready') return false; projects.markClean(); return go(); });
      }
      return go();
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
        if (!(await confirmDialog(UNSAVED, { title: 'REPAIR WITHOUT SAVING?', yes: 'REPAIR ANYWAY', no: 'KEEP WORKING', danger: true }))) return false;   // 033: the kit's dialog
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
        try { sessionStorage.setItem('lw.repair', '1'); } catch (_) {}   // 033: the repair road continues after the reload (repairBoot)
        swClient.say('REPAIR · CACHE CLEARED · RELOADING…', 'repair: the build cache cleared; reloading (your volumes, projects and settings are untouched)');
        swClient.reload();
        return true;
      } catch (e) {
        swClient.error = String(e && e.message || e); swClient.state = 'failed';
        swClient.say('UPDATE FAILED · ' + brief(swClient.error) + ' · TRY AGAIN', 'update failed: ' + swClient.error);
        return false;
      }
    },
    /** 033 REPAIR, after the reload (main.js, once the registration exists): lw.repair = 1 → wait for the fresh install to activate, then
     *  reload once more as 2 → say REPAIRED (the page is controlled by a verified build) or why not. */
    repairBoot(reg) {
      let flag = null; try { flag = sessionStorage.getItem('lw.repair'); } catch (_) {}
      if (!flag) return 'none';
      const done = () => { try { sessionStorage.removeItem('lw.repair'); } catch (_) {} };
      if (flag === '2') {
        done();
        if (navigator.serviceWorker.controller) swClient.say('REPAIRED · THIS BUILD IS INSTALLED', 'repaired: the build is installed and serves this page');
        else swClient.say('REPAIR DID NOT TAKE · TRY AGAIN', 'repair: the page is still uncontrolled after the reinstall');
        return flag;
      }
      const again = () => { try { sessionStorage.setItem('lw.repair', '2'); } catch (_) {} swClient.asked = true; swClient.say('REPAIR · INSTALLED · RELOADING…', 'repair: the build installed; reloading once more'); swClient.reload(); };
      const w = reg.installing || reg.waiting;
      if (!w && reg.active && reg.active.state === 'activated') { again(); return flag; }
      /* 034 F8 · a fresh build installed while another λWAVES window still holds the old one WAITS (the one law: no skipWaiting) — it gets
         the normal offer road (a quiet take, else RELOAD / RELOAD ALL) and the badge says why, never a silence */
      const waits = () => {
        if (w.state !== 'installed' || !reg.active || reg.active === w || swClient.repairWaits) return;
        swClient.repairWaits = true; swClient.buildReady((o) => w.postMessage({ type: 'LW_SW_SKIP_WAITING', ...o }));
      };
      if (w) { w.addEventListener('statechange', () => {
        if (w.state === 'activated') again();
        else if (w.state === 'redundant') { done(); swClient.say('REPAIR FAILED · ' + brief(swClient.failure || 'the install was refused') + ' · TRY AGAIN', 'repair failed: ' + (swClient.failure || 'the install was refused')); }
        else waits();
      }); waits(); }
      else { done(); swClient.say('REPAIR DID NOT START · TRY AGAIN', 'repair: no worker is installing'); }
      return flag;
    },
    /** 033 · THE STATE CAN BE SEEN: one text — the builds, the controller, the registration, storage, every cache, every record, the
     *  volumes, the app's lines, the last errors, the browser. */
    async diagnostics() {
      const L = [], MB = (b) => (b / 1048576).toFixed(1) + ' MiB';
      L.push('λWAVES DIAGNOSTICS · ' + new Date().toISOString() + ' · ' + location.origin + location.pathname);
      L.push('page build ' + BUILD_ID + ' · worker ' + (swClient.workerPage || '—') + (swClient.build ? ' · cache build ' + swClient.build : '') + (swClient.files ? ' · ' + swClient.files + ' files' : ''));
      const ctl = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
      L.push('controller ' + (ctl ? 'yes' : 'NO (first launch, a hard reload, or no install)') + ' · mode ' + swClient.mode + ' · state ' + swClient.state + (swClient.failure ? ' · last install failure: ' + swClient.failure : '') + (swClient.error ? ' · error: ' + swClient.error : ''));
      try { const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration('./'); L.push('registration ' + (reg ? ['active', 'waiting', 'installing'].map((k) => k + ' ' + (reg[k] ? reg[k].state : '—')).join(' · ') : 'none')); } catch (e) { L.push('registration: ' + String(e && e.message || e)); }
      try { const est = await navigator.storage.estimate(); const p = navigator.storage.persisted ? await navigator.storage.persisted() : null; L.push('storage ' + MB(est.usage || 0) + ' of ' + MB(est.quota || 0) + (p === null ? '' : ' · persisted ' + p)); } catch (_) {}
      try { for (const n of (await caches.keys()).sort()) { const c = await caches.open(n); L.push('cache ' + n + ' · ' + (await c.keys()).length + ' entries'); } } catch (e) { L.push('caches: ' + String(e && e.message || e)); }
      try { const V = await import('./volumes.js'); const sh = await V.shelf(); for (const v of (sh && sh.volumes) || []) { const st = await V.installStatus(v.id).catch(() => null); L.push('volume ' + v.id + ' VOL. ' + v.numeral + ' · ' + (st ? st.state + ' ' + st.n + '/' + st.N : '?')); } } catch (e) { L.push('volumes: ' + String(e && e.message || e)); }
      try { const ls = localStorage, keys = Array.from({ length: ls.length }, (_, i) => ls.key(i)).filter((k) => /^(lambdawaves\.|lw\.|mir\.)/.test(k)).sort(); for (const k of keys) L.push('record ' + k + ' · ' + (ls.getItem(k) || '').length + ' chars'); } catch (e) { L.push('records: ' + String(e && e.message || e)); }
      try { const raw = localStorage.getItem('lambdawaves.q0.session'); if (raw) { const o = JSON.parse(raw); L.push('session · v ' + o.v + ' · ' + raw.length + ' chars · keys ' + Object.keys(o).join(' ') + (o.parts ? ' · parts ' + Object.keys(o.parts).join(' ') : '')); } } catch (_) {}
      try { if (extra) for (const line of extra() || []) L.push(line); } catch (e) { L.push('app: ' + String(e && e.message || e)); }
      const errs = (globalThis.__e || []); L.push('errors ' + (errs.length ? errs.length + ' · ' + errs.slice(-8).join(' | ') : 'none'));
      L.push('browser ' + navigator.userAgent + ' · ' + screen.width + '×' + screen.height + ' @' + devicePixelRatio + (navigator.webdriver ? ' · webdriver' : ''));
      return L.join('\n');
    },
    /** COPY DIAGNOSTICS (HELP › COPY DIAGNOSTICS, the registry row `diagnostics`): the text to the clipboard, and shown, so it can be pasted into a report */
    async copyDiagnostics() {
      const t = await swClient.diagnostics();
      let copied = false; try { await navigator.clipboard.writeText(t); copied = true; } catch (_) {}
      const pre = document.createElement('pre'); pre.className = 'lw-diag'; pre.textContent = t;
      const d = openDialog({ title: copied ? 'DIAGNOSTICS COPIED' : 'DIAGNOSTICS', body: pre, kind: 'notice', actions: [{ label: 'COPY', kind: 'primary', value: 'copy' }, { label: 'CLOSE', value: 'close' }] });
      d.result.then(async (v) => { if (v === 'copy') { try { await navigator.clipboard.writeText(t); setStatus('diagnostics copied'); } catch (_) { setStatus('the clipboard refused: select the text and copy it'); } } });
      return t;
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
      if (d.type === 'LW_SW_INSTALL_FAILED') {                                   // 033: the reason, kept and said
        swClient.failure = d.why || 'the install was refused'; swClient.error = swClient.failure;
        if (swClient.state !== 'taking' && swClient.state !== 'refreshing') swClient.state = 'failed';
        swClient.say('UPDATE FAILED · ' + brief(swClient.failure) + ' · TRY AGAIN', 'update failed: ' + swClient.failure);
        return 'failed';
      }
      if (d.type === 'LW_SW_ACTIVE' || d.type === 'LW_SW_BUILD') {
        swClient.build = d.build; swClient.files = d.files || 0; if (d.cache) swClient.cache = d.cache; if (d.page) swClient.workerPage = d.page;
        if (d.type === 'LW_SW_BUILD' && d.page && d.page !== BUILD_ID && navigator.serviceWorker && navigator.serviceWorker.controller) swClient.mixed();   // the controller's answer to HELLO
        else if (d.type === 'LW_SW_ACTIVE' && !(navigator.serviceWorker && navigator.serviceWorker.controller) && swClient.state === 'idle') setStatus('installed: offline from the next launch');
        swClient.paintBuild();
        return d.type === 'LW_SW_BUILD' ? 'build' : 'active';
      }
      return null;
    },
  };
  return swClient;
}
