/* main.js — boot the lab, then arm the install layer. */
import { boot } from './rack.js';
window.__e = window.__e || [];
addEventListener('error', (e) => __e.push('ERR ' + e.message));
addEventListener('unhandledrejection', (e) => __e.push('REJ ' + String(e.reason && e.reason.message || e.reason)));
const $ = (id) => document.getElementById(id);
boot({ canvas: $('field'), vortex: $('vortex'), particles: $('particles'), kepler: $('kepler'), stage: $('stage'), rack: $('rack'), transport: $('transport'), badges: $('badges'), sheet: $('sheet'), banner: $('banner'), hint: $('hint') })
  .then((LW) => { try { installLayer(LW); } catch (e) { if (LW && LW.sw) { LW.sw.mode = 'failed'; LW.sw.error = String(e && e.message || e); } } })
  .catch((e) => { __e.push('BOOT ' + (e && e.stack || e)); const b = $('banner'); b.hidden = false; b.querySelector('h3').textContent = 'boot failed'; b.querySelector('p').textContent = String(e && e.message || e); });
/* WAVE 59 · THE BANNER'S × IS WIRED HERE TOO, and it must be: this is the ONE path where rack.js never ran
   (boot threw, so showBanner and everything around it does not exist), and it is the path that puts the
   longest message on the screen.  Both wirings are idempotent — each marks the button with data-wired. */
{ const b = $('banner'), x = b && b.querySelector('.banner-x');
  if (x && !x.dataset.wired) { x.dataset.wired = '1'; x.addEventListener('click', () => { b.hidden = true; }); } }

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
 * LW.sw.accept() — a press on the badge, and nothing else.  What a controllerchange MEANS is the page's
 * decision, and rack.js's swClient makes it: the tab that asked reloads, a tab that did not ask is told.
 *
 * THE AUTOMATION BYPASS is exactly the photosensitivity warning's (rack.js `warning.needed`), for a reason
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

    /** OFFER a waiting worker to the interface.  Nothing here takes it; accept() does, on a press. */
    const arm = (w) => { if (w) sw.buildReady(() => w.postMessage({ type: 'LW_SW_SKIP_WAITING' })); };
    const watch = (w) => {
      if (!w) return;
      const check = () => { if (w.state === 'installed' && navigator.serviceWorker.controller) arm(w); };
      w.addEventListener('statechange', check); check();
    };
    if (reg.waiting) arm(reg.waiting); else watch(reg.installing);          // (b): all three states, not two
    reg.addEventListener('updatefound', () => watch(reg.installing));

    navigator.serviceWorker.addEventListener('message', async (ev) => {     // (a): §3's announcement, listened for
      if (sw.message(ev.data) !== 'waiting') return;
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
