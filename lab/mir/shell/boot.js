/* MIR · shell/boot.js — THE BOOT CARD: what a WebGPU app shows while it starts, and THE BOOT FAILURE in plain words.
 *
 * Harvested from NEBULA's `#bootStatus` (lab/main.js:519-522, nebula.css:90-92: "WebGPU unavailable … The interface
 * remains available"), SOLEIL's full-screen black `#fail` (sol.css:106-107, not taken: a dark layer) and EARTH's
 * boot link-failure voice (a module that did not load).  Every app wrote its own; most said nothing useful when the
 * adapter was missing, which on this machine is usually a cold-boot race that a reload fixes (NEBULA-REDUX lab4.js:911).
 *
 * THE LAWS IT KEEPS
 *   · A PANE, NOT A PAGE.  A card in the middle of the stage at pane height, CARD STYLE's material, no scrim behind it.
 *   · THE LOADING MARK IS THE DIAMOND (shell/busy.js, seat 'inline'); no other spinner.
 *   · A FAILURE SAYS WHAT HAPPENED AND WHAT TO DO, in plain words, and offers COPY DETAILS (the message, the stack, the
 *     steps done, the browser) and RETRY when the app gives one.  `explainBoot(error)` is the pure half: node tests it.
 *   · ENGLISH IN, through the language seam; the app's name is never translated.
 *
 * bootCard({ name, steps, host = document.body }) → { root, step(text?), done(), fail(error, { retry }), destroy() }
 *   step()      → the next of `steps`;  step('Compiling shaders') → that text
 * explainBoot(error) → { code: 'nogpu' | 'noadapter' | 'lost' | 'link' | 'exception', what, todo }
 * bootDetails(error, { name, steps }) → the text COPY DETAILS puts on the clipboard
 *
 * THE BOOT VEIL (BASINS app/main.js armVeil / dismissVeil, overlay.js veilStat, the inline `#veil` of index.html)
 *   bootVeil({ ready, el, host, timeout = 8000 }) → { el, stat, dismiss(via), done }
 *   One opaque layer over the stage until THE FIRST REAL FRAME: not `load`, not the end of boot — a configured WebGPU
 *   canvas is opaque black until something is presented, which is the flash the veil exists to hide.
 *   · ready   () → true once a picture has been SUBMITTED (BASINS: the pyramid's present count ≥ 1), asked once a frame by
 *             a rAF chain that stops dead when it fires or times out (so it can never become a poll); or a Promise.
 *   · ONE MORE FRAME after ready: submitted is not composited.  Then a 160 ms opacity fade (the sheet's --veil-fade),
 *     and `hidden` 220 ms later.  document.startViewTransition() is a garnish around a no-op where the platform has it,
 *     never the thing the dismissal waits for (a skipped transition must not leave the veil up).
 *   · NO MINIMUM TIME, no spinner, no logo.  After `timeout` (8 s) it comes down anyway and says so (`via: 'timeout'`).
 *   · MEASURED: stat { firstPresentMs (navigation start → ready), dismissedMs, frames, dismissed, via, timeoutMs }, and a
 *     `boot veil` line in every dump (core/describe.js registerDumpLines).
 *   · el: the page's own veil (BASINS' `#veil`, or a `.mir-veil`); one is made in `host` when the page has none. */
import { el, label, trig } from '../kit.js';
import { presence } from '../core/motion.js';
import { registerDumpLines } from '../core/describe.js';
import { busyMark } from './busy.js';
import { notice } from './notice.js';
import { copyText } from './clipboard.js';

/* `t` here only MARKS a sentence for the catalogue (tools/i18n-extract.mjs reads t('…')); it returns the English, and the
   card translates it where it writes it (label()), so a language change rewrites it in place. */
const t = (en) => en;
const WORDS = {
  nogpu: { what: t('This browser has no WebGPU, which this app draws with.'),
    todo: t('Open it in a current Chrome, Edge or Safari, or turn WebGPU on in this browser\'s settings.') },
  noadapter: { what: t('The browser has WebGPU but found no graphics adapter to use.'),
    todo: t('Reload the page: on a cold start the adapter is sometimes late. If it happens again, turn on hardware acceleration in the browser\'s settings or update the graphics driver.') },
  lost: { what: t('The graphics device was lost: the GPU was reset, its driver changed, or it ran out of memory.'),
    todo: t('Reload to start again. Your saved work in this browser is kept.') },
  link: { what: t('A file the app needs did not load.'),
    todo: t('Check the connection and reload. If you serve the app yourself, check that every file was copied.') },
  exception: { what: t('Something went wrong while the app was starting.'),
    todo: t('Reload. If it happens again, press {:COPY DETAILS} and send them to the author.') }
};

/** explainBoot(error) → { code, what, todo } (English; the card translates it) */
export function explainBoot(error) {
  const m = String((error && (error.message || error.reason)) || error || '');
  const n = String((error && error.name) || '');
  let code = 'exception';
  if (/navigator\.gpu|webgpu (is )?not (supported|available)|webgpu unavailable|no webgpu/i.test(m)) code = 'nogpu';
  else if (/adapter/i.test(m)) code = 'noadapter';
  else if (/device (was |is )?lost|context lost|devicelost|lost the device|destroyed/i.test(m) || /DeviceLost/i.test(n)) code = 'lost';
  else if (/dynamically imported module|importing a module script failed|failed to fetch|error loading|networkerror|404/i.test(m)) code = 'link';
  return { code, ...WORDS[code] };
}

/** bootDetails(error, { name, steps }) → plain text for a bug report */
export function bootDetails(error, { name = '', steps = [] } = {}) {
  const e = error || {}, nav = globalThis.navigator || {};
  return [
    (name || 'app') + ' could not start · ' + new Date().toISOString(),
    'kind: ' + explainBoot(error).code,
    'error: ' + String(e.message || e),
    e.stack ? 'stack:\n' + String(e.stack).split('\n').slice(0, 12).join('\n') : '',
    steps.length ? 'steps done: ' + steps.join(' → ') : 'steps done: none',
    'webgpu: ' + (nav.gpu ? 'present' : 'absent'),
    'browser: ' + (nav.userAgent || 'unknown')
  ].filter(Boolean).join('\n');
}

export function bootCard({ name = 'MIR', steps = [], host = document.body } = {}) {
  const root = el('div', 'mir-boot glass'); root.setAttribute('role', 'status'); root.setAttribute('aria-live', 'polite'); root.dataset.state = 'boot';
  const title = el('h2', 'mir-boot-name', root, name); title.translate = false;
  const mark = busyMark(root, { size: 28 });
  const line = el('p', 'mir-boot-step', root);
  const count = el('span', 'mir-boot-count', root);
  const done = [];
  let i = -1;
  root.hidden = true; host.appendChild(root); presence(root, true); mark.start();
  const paintCount = () => { if (steps.length) label(count, '{step} of {total}', { step: Math.min(i + 1, steps.length), total: steps.length }); };

  const api = {
    root,
    step(text) {
      if (root.dataset.state !== 'boot') return;
      if (i >= 0) done.push(line.dataset.t || line.textContent);
      i++;
      const s = text !== undefined ? text : steps[i];
      label(line, s === undefined ? '' : String(s));
      paintCount();
    },
    done() {
      if (root.dataset.state === 'gone') return;
      root.dataset.state = 'gone'; mark.stop();
      presence(root, false).then(() => root.remove());
    },
    fail(error, { retry } = {}) {
      if (root.dataset.state === 'gone') return;
      if (root.dataset.state === 'boot' && i >= 0) done.push(line.dataset.t || line.textContent);
      root.dataset.state = 'fail'; mark.destroy();
      root.setAttribute('role', 'alert');
      const x = explainBoot(error);
      root.dataset.code = x.code;
      title.translate = true; label(title, '{name} could not start', { name });   // a plain var is written as it is: the name stays
      line.remove(); count.remove();
      label(el('p', 'mir-boot-what', root), x.what);
      label(el('p', 'mir-boot-todo', root), x.todo);
      const acts = el('div', 'mir-boot-acts', root);
      const copy = trig({ label: 'COPY DETAILS', onFire: async () => {
        const text = bootDetails(error, { name, steps: done });
        if (await copyText(text)) notice('The details are on the clipboard.', { kind: 'ok' });
        else { notice('The clipboard refused; the details are in the console.', { kind: 'warn' }); console.info(text); }
      } });
      acts.appendChild(copy.root);
      if (typeof retry === 'function') {
        const again = trig({ label: 'RETRY', onFire: () => { api.destroy(); retry(); } });
        again.root.dataset.kind = 'primary';
        acts.appendChild(again.root);
      }
      copy.root.focus({ preventScroll: true });
    },
    destroy() { root.dataset.state = 'gone'; mark.stop(); root.remove(); }
  };
  return api;
}

/* ── THE BOOT VEIL ────────────────────────────────────────────────────────────────────────────────────────── */
/** veilLine(stat) → the dump's line, BASINS' words (debug.js 'boot veil') */
export function veilLine(s) {
  return 'boot veil   ' + (s.dismissed
    ? 'down after ' + s.firstPresentMs.toFixed(1) + ' ms (nav -> first present)   dismissed at ' + s.dismissedMs.toFixed(1) +
      ' ms via ' + s.via + ', ' + s.frames + ' frames waited'
    : 'UP (no present yet, ' + s.frames + ' frames waited)');
}

export function bootVeil({ ready = null, el: given = null, host = null, timeout = 8000 } = {}) {
  const doc = document;
  let v = given || doc.getElementById('veil') || doc.querySelector('.mir-veil');
  if (!v) { v = el('div', 'mir-veil', host || doc.getElementById('stage') || doc.body); v.setAttribute('aria-hidden', 'true'); }
  const stat = { firstPresentMs: 0, dismissedMs: 0, frames: 0, dismissed: false, via: null, timeoutMs: timeout };
  registerDumpLines('veil', () => [veilLine(stat)]);
  let settle = null;
  const done = new Promise((r) => { settle = r; });

  function dismiss(via = 'fade') {
    if (stat.dismissed) return;
    stat.dismissed = true; stat.dismissedMs = performance.now(); stat.via = via;
    /* the fade runs unconditionally and at once; `hidden` only after it, so the transition has something to run on */
    v.classList.add('gone');
    setTimeout(() => { v.hidden = true; settle(stat); }, 220);
    /* the garnish: a platform that has view transitions gets the cross-fade; a hidden document rejects its promises */
    if (typeof doc.startViewTransition === 'function') {
      stat.via = via + '+view-transition';
      if (!doc.hidden) try { const vt = doc.startViewTransition(() => {}); for (const k of ['ready', 'finished', 'updateCallbackDone']) vt[k]?.catch?.(() => {}); } catch (_) { /* the fade already ran */ }
    }
  }
  const t0 = performance.now();
  let seen = false;
  const fired = () => { seen = true; stat.firstPresentMs = performance.now(); requestAnimationFrame(() => dismiss('fade')); };   // ONE MORE FRAME: submitted is not composited
  if (ready && typeof ready.then === 'function') ready.then(() => { if (!seen && !stat.dismissed) fired(); }, () => {});
  const tick = () => {
    if (stat.dismissed || seen) return;
    stat.frames++;
    if (typeof ready === 'function') { let ok = false; try { ok = !!ready(); } catch (_) { ok = false; } if (ok) { fired(); return; } }
    if (performance.now() - t0 > timeout) { stat.firstPresentMs = 0; dismiss('timeout'); return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return { el: v, stat, dismiss, done };
}
