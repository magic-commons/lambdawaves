/* main.js — decide the start (the notice, then the session or the boot), boot the lab behind it, then arm the install layer. */
import { boot } from './rack.js';
import { createSession } from './mir/core/session.js';   // 0.5.0 C6b: THE SESSION, the live project kept over the one part
import { photosensitivityNotice } from './mir/shell/flash-guard.js';   // 0.5.0 C6b: the kit's notice, under λWAVES' law
import { createSettingsStore } from './settings-store.js';   // 0.5.0 C6b: the notice's seen-flag is the blob's `warned`
import { STARTERS } from './project-store.js';   // the eleven demos' ids are `?starter=`'s (their covers are FOLDERS' DEMOS pictures, iteration 004)
import { installBanner } from './mir/shell/banner.js';   // 0.5.0 C6b: THE BANNER is the kit's
import { bootVeil } from './mir/shell/boot.js';   // 0.5.0 C6b: THE BOOT VEIL, down at the first real frame
window.__e = window.__e || [];
addEventListener('error', (e) => __e.push('ERR ' + e.message));
addEventListener('unhandledrejection', (e) => __e.push('REJ ' + String(e.reason && e.reason.message || e.reason)));
const $ = (id) => document.getElementById(id);
/* 0.5.0 C6b · THE SESSION (MIR core/session.js): the one part's capture in `lambdawaves.q0.session` (PROJECT), written once the part
   says it changed (the kit's quiet 300 ms) and at once on pagehide; never a ring row, never an edit; nothing is written until armed */
const session = createSession({ key: 'lambdawaves.q0.session' });
/* THE PHOTOSENSITIVITY LAW (waves 57/59) IS λWAVES', NOT THE KIT'S: a human visitor reads the notice once per browser before anything
   animates, and NO query string silences it for a human (the kit's ?warn=0 is not honoured here); only a test driver skips it — ?warn=1
   forces it there, ?opener=1 makes a driven start a human one.  The notice is the kit's photosensitivityNotice; its seen-flag is the
   settings blob's `warned` (a Storage-shaped adapter, so FORGET clears it and SHOW THE WARNING AGAIN resets it), and `warning` keeps
   every member tests and tools call.  The kit's notice cannot be closed from code: dismiss() presses its CONTINUE. */
const blob = createSettingsStore();
const warned = { getItem: () => (blob.read().warned === true ? '1' : null), setItem: () => blob.write({ ...blob.read(), warned: true }),
  removeItem: () => blob.write({ ...blob.read(), warned: false }) };
const warning = (() => {
  let open = false; const accepted = [];
  const accept = () => { if (!open) return; open = false; warned.setItem(); while (accepted.length) { try { accepted.shift()(); } catch (_) {} } };
  const press = (n) => { const b = document.querySelector('.mir-dialog[data-kind="notice"] .trig[data-kind="primary"]'); if (b) b.click(); else if (n) setTimeout(() => press(n - 1), 50); };
  return {
    needed(o) { const q = new URLSearchParams(o && o.query !== undefined ? o.query : location.search);
      return (o && o.driver !== undefined ? o.driver : navigator.webdriver === true) && q.get('opener') !== '1' ? q.get('warn') === '1' : !warned.getItem(); },
    show() { if (open) return false; open = true;
      photosensitivityNotice({ key: 'warned', storage: warned, force: true, art: './img/warning-sign.png', alt: 'Caution triangle filled with a λWAVES orbital, the exclamation mark knocked out of it' }).then(accept);
      return true; },
    dismiss() { if (!open) return false; accept(); press(40); return true; },
    onAccept(fn) { if (open) accepted.push(fn); else fn(); return true; },
    reset() { warned.removeItem(); return true; },
    get seen() { return !!warned.getItem(); }, get remembered() { return !!warned.getItem(); }, get open() { return open; },
  };
})();
/* THE START (C6-DESIGN §5; iteration 004: no title screen — Josh 2026-10-17, "Delete the original saves/preset thing in the beginning";
   the demos and the saves are FOLDERS').  A test driver (unless ?opener=1), a link in the fragment, ?preset= or ?view= go straight in:
   the choice is ?starter= (home · resume · a demo id) or the boot (the session armed, nothing restored).  A human start waits for the
   notice when it is needed, then takes BASINS' no-pick rule (B:main.js, the kit's openerSwitches): RESUME when the session holds work,
   else the boot — never `boot` over a saved session, whose next pagehide flush would overwrite it.  The boot runs behind and awaits the
   choice before LW.ready; the notice never holds LW.ready for a given choice (the CDP tools' `&starter=home` relies on it). */
const q = new URLSearchParams(location.search);
const DEMO_IDS = STARTERS.map((s) => s.file);
const given = ['home', 'resume', ...DEMO_IDS].includes(q.get('starter')) ? q.get('starter')
  : (navigator.webdriver === true && q.get('opener') !== '1') || /(^|&)s=/.test(location.hash.slice(1)) || q.has('preset') || q.has('view') ? 'boot' : null;
let pick; const choice = new Promise((r) => { pick = r; });
/* 0.5.0 C6b · THE BANNER is the kit's (shell/banner.js: BASINS' maroon pane, role="alert", its own × and ink on both themes): the GPU
   and boot failures in λWAVES' words, nothing else (errors: false).  THE BOOT VEIL (bootVeil) hides the black of a configured WebGPU
   canvas until the first picture is presented (8 s at most); neither is a window, so neither is in the stage's mask */
const banner = installBanner({ errors: false });
bootVeil({ ready: () => !!(window.__LW && __LW.stats.presents) });
boot({ canvas: $('field'), vortex: $('vortex'), particles: $('particles'), flow: $('flow'), kepler: $('kepler'), stage: $('stage'), rack: $('rack'), transport: $('transport'), badges: $('badges'), sheet: $('sheet'), banner, start: { session, warning, choice } })
  .then((LW) => { try { installLayer(LW); } catch (e) { if (LW && LW.sw) { LW.sw.mode = 'failed'; LW.sw.error = String(e && e.message || e); } } })
  .catch((e) => { __e.push('BOOT ' + (e && e.stack || e)); banner.fail('boot failed', String(e && e.message || e)); });
/* the boot has run to its first await, so the look is on: the notice wears this browser's glass.  While it is up no key reaches the
   lab (the kit's dialog keeps its keys inside itself) and the front page waits for its CONTINUE (rack.js) */
if (warning.needed()) warning.show();
if (given) pick(given);
else warning.onAccept(() => pick(session.hasResume() ? 'resume' : 'boot'));

/* ══ WAVE 56 · THE INSTALL LAYER (board #56) ══════════════════════════════════════════════════════════
 * lab/manifest.webmanifest, lab/sw.js, the icons and tests/pwa.test.mjs were all built and proved a wave
 * before anything referenced them: until these lines landed, NOTHING called navigator.serviceWorker.register
 * anywhere in lab/ and the site shipped as an ordinary web page.  This is that call, and the three holes the
 * adversarial review of 2026-09-05 §2.5 found in the wiring the suite's own closing comment prescribed.
 *
 *   (a) THE SIGNAL WAS ORPHANED.  sw.js §3 posts LW_SW_WAITING to every client when an UPDATE finishes
 *       installing, and the prescribed snippet added no `message` listener at all — two mechanisms, one
 *       wired.  It is listened for here, and because it is sent from inside install's waitUntil the worker
 *       is still `installing` at that instant (registration.waiting is null), the handler waits for
 *       `waiting` to catch up rather than trusting either one alone.
 *   (b) A LOST UPDATE.  A worker already in the `installing` state when register() resolves is in neither
 *       prescribed branch: reg.waiting is null and `updatefound` has already fired.  All three of
 *       installing / waiting / updatefound are read.
 *   (c) A LOST REGISTRATION.  addEventListener('load') added AFTER an awaited async boot() never fires if
 *       `load` has already gone by — and boot() initialises WebGPU, so on a slow machine that is the normal
 *       case.  readyState decides.
 *
 * THE ONE LAW, and the half of it that is this file's: the worker never takes itself (no skipWaiting on
 * install, no clients.claim, no timer), and the only message that can end a session's build is sent from
 * LW.sw.accept().  Since wave 133 the page may send it FOR AN UNTOUCHED SESSION (rack.js `untouched`: a
 * reload would lose nothing) as a quiet take, `alone: true`, which the worker refuses while a second window
 * is open; otherwise only on a press — the badge or the offer's UPDATE.  What a controllerchange MEANS is
 * the page's decision, and sw-client.js makes it: the tab that asked reloads, a tab that did not ask is told.
 *
 * THE AUTOMATION BYPASS is exactly the photosensitivity warning's (main.js `warning.needed`), for a reason
 * of the same size: a worker installed on the gate's origin would serve every later navigation out of a
 * cache, and one stale entry in sw.js §1 would make the whole browser suite silently measure yesterday's
 * build.  `?sw=1` forces it — that is how the gate proves the real thing — and `?sw=0` refuses it. */
function installLayer(LW) {
  const sw = LW && LW.sw;
  if (!sw) return 'no client';
  if (!('serviceWorker' in navigator)) return (sw.mode = 'unsupported');
  const q = new URLSearchParams(location.search);
  if (q.get('sw') === '0') return (sw.mode = 'declined');
  if (q.get('sw') !== '1' && navigator.webdriver === true) return (sw.mode = 'automation');

  const go = async () => {
    let reg;
    /* RELATIVE, both of them — and wave 68 corrects the REASON, which described an architecture that was
       reversed two waves before this comment was read again.  λWAVES ships on its OWN hostname
       (lambdawaves.magic-commons.com), so the scope IS the origin root and that is correct here: the
       hostname is this lab and nothing else.  Relative is still the only spelling to keep, because the
       same bytes have to serve from /lab/ on ./serve.sh, from the LAN server, from `wrangler dev` and
       from the root — and because the day λWAVES were ever put back under a shared origin's path, an
       absolute '/sw.js' is exactly how a root scope would sneak back in over somebody else's app. */
    try { reg = await navigator.serviceWorker.register('./sw.js', { scope: './' }); }
    catch (e) { sw.mode = 'failed'; sw.error = String(e && e.message || e); return; }
    sw.registration = reg; sw.mode = 'registered';

    /** OFFER a waiting worker to the interface.  Nothing here takes it; accept() does — on a press, or quietly
        (`alone`) for an untouched session.  ONCE PER WORKER (wave 133): `reg.waiting`, the install's statechange and §3's
        LW_SW_WAITING can all name the same worker, and a second buildReady re-ran the quiet take — measured on the real
        worker in a second window: a second SKIP_WAITING, a second BUSY, and the pane hidden with only the badge left. */
    let armed = null;
    const arm = (w) => {
      if (!w || w === armed) return;
      armed = w;
      sw.buildReady((opt) => w.postMessage(opt && opt.alone ? { type: 'LW_SW_SKIP_WAITING', alone: true } : { type: 'LW_SW_SKIP_WAITING' }));
    };
    const watch = (w) => {
      if (!w) return;
      const check = () => { if (w.state === 'installed' && navigator.serviceWorker.controller) arm(w); };
      w.addEventListener('statechange', check); check();
    };
    if (reg.waiting) arm(reg.waiting); else watch(reg.installing);          // (b): all three states, not two
    reg.addEventListener('updatefound', () => watch(reg.installing));

    navigator.serviceWorker.addEventListener('message', async (ev) => {     // (a): §3's announcement, listened for
      const kind = sw.message(ev.data); if (kind !== 'waiting') return;     // LW_SW_BUSY ('busy') is handled inside sw.message
      for (let i = 0; i < 40 && !reg.waiting; i++) await new Promise((r) => setTimeout(r, 250));
      arm(reg.waiting);
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => sw.controllerChanged());

    /* WHICH BUILD AM I ON?  §6's handshake, answered by the ACTIVE worker — the one this session booted on,
       which is the only honest answer to that question. */
    if (navigator.serviceWorker.controller) {
      const ch = new MessageChannel();
      ch.port1.onmessage = (e) => sw.message(e.data);
      navigator.serviceWorker.controller.postMessage({ type: 'LW_SW_HELLO' }, [ch.port2]);
    }

    /* WAVE 133 · THE READER.  The browser byte-compares sw.js only at a navigation, so a tab left open — or a home-screen
       app switched back to and never relaunched — never asked again.  A return to the foreground asks, at most once per
       30 minutes: a user coming back after a while gets the check once, and one flipping between tabs does not fetch
       33 KB each time.  There is no timer, deliberately: a hidden page must not touch the network, and the visible
       moment is the one that matters.  A new worker found here installs and reaches buildReady through `updatefound`. */
    let checked = performance.now();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || performance.now() - checked < 30 * 60e3) return;
      checked = performance.now(); sw.checks++;
      reg.update().catch(() => {});
    });
  };
  /* Installing the first worker precaches the whole local lab. Starting those fetches at the ready boundary used
     to compete with WebGPU's first field and the user's first gesture, especially in mobile Safari. Give the live
     instrument a short quiet lead, then register in browser-declared idle time. The timeout still guarantees that
     a continuously busy session becomes installable and offline; ?sw=1 exercises this same deferred road. */
  const afterFirstField = () => setTimeout(() => {
    if ('requestIdleCallback' in globalThis) requestIdleCallback(() => go(), { timeout: 6500 });
    else setTimeout(go, 0);
  }, 1500);
  if (document.readyState === 'complete') afterFirstField();                // (c): `load` may be long gone
  else addEventListener('load', afterFirstField, { once: true });
  return (sw.mode = 'arming');
}
