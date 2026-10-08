/* MIR · shell/opener.js — THE OPENER: the title screen a cold start opens on.  Starter covers, NEW and RESUME; the app's
 * engine is imported only after the pick.
 *
 * LIFTED FROM BASINS (app/startup.js + startup.css + starter-covers.js, 2026-10-02).  The mechanism is the kit's; the covers
 * and their art, the wordmark, the words of the notice and every look value that was BASINS' are the app's, handed in as
 * options and tokens (shell/opener.css).  BASINS' colour is the default.
 *
 * WHAT IT DOES (BASINS' order)
 *   1. THE NOTICE.  The photosensitivity notice (flash-guard.js) once per browser; `warn: 'every'` is BASINS' every cold
 *      start; `warn: false` never.  `?warn=1` forces it, `?warn=0` (or a test driver) skips it and resumes.
 *   2. THE SWITCHES (core/session.js openerSwitches): `?starter=<id>` opens that start at once ('home' is NEW, 'resume' is
 *      RESUME, or one of the covers); any `direct` switch (BASINS: rmb, classic, nofactory) resumes.
 *   3. THE TITLE SCREEN.  The covers: 9:16 art, a looping video preview that is LAZY (nothing is fetched until it plays) and
 *      PAUSED while the page is hidden, the cover is off screen, a cover is chosen, or motion is reduced.  Hover picks by
 *      LANES: the buttons' slots stay still while a cover grows, so the nearest slot decides and an enlarged cover can
 *      never take its neighbour's hover.  The active cover grows, tilts toward the pointer, drifts its art and its label,
 *      and takes the pointer's light (fx/pointer-light.js, drawn here under overlay: the art is opaque).  The arrow keys
 *      move across the grid (up and down step a row of three), Enter picks, Tab is trapped on the screen.
 *   4. THE PICK.  The chosen cover grows while the rest and the logo fade (420 ms), the screen fades (380 ms), the videos
 *      are emptied, then `onPick(id)` runs — the app imports its engine there.  start() resolves with the id.
 *
 * THE LAWS IT KEEPS
 *   · NOTHING IS DRAWN BEFORE start(): createOpener() builds nothing and touches nothing.
 *   · ONE FRAME.  The pointer's work is one coalesced job of the frame core (core/frame.js), reading the slots' boxes before
 *     it writes; there is no timer of its own but the two one-shot waits above; nothing runs while nothing moves.
 *   · REDUCED MOTION IS A POLICY on <html data-motion> (core/motion.js): not 'full' means the videos stay paused, the pointer
 *     does no tilt, and the sheet draws no transition, no growth and no drift.
 *   · THE WORDS GO THROUGH THE LANGUAGE SEAM; the covers' names are the app's and are never translated.
 *   · IT NEVER TOUCHES THE SESSION: RESUME appears when `session.hasResume()`; the app, once its parts exist, calls
 *     `applyChoice(session, id)` (resume() for 'resume', discard() for anything else).
 *
 * createOpener({ covers, mainCount, session | resume, logo, label, notice, warn, search, webdriver, direct, columns,
 *                onPick, host, light, doc }) → { start() → Promise<id>, root, destroy() }
 *   covers      [{ id, name, art, video?, accent?, foot?, label? }]  the app's: `art` the poster (and the still), `video` an
 *               optional looping preview, `accent` any CSS colour (the glow, the rim), `foot` a string or { text, sup }
 *               drawn under the active cover (BASINS: the depth, 10 and its exponent as a superscript), `label` the
 *               accessible name (default "Open {name}")
 *   mainCount   how many covers are shown (BASINS: 3 of 4: the fourth is reached by ?starter= only); default all
 *   session     a core/session.js createSession(): RESUME shows when it has work.  `resume` instead: a boolean or () => boolean
 *   logo        { src, alt } | Node | string: the wordmark above the covers
 *   label       the screen's accessible name (default "starter projects")
 *   notice      { title, body, accept, art, alt, key } handed to photosensitivityNotice (the app's words and art)
 *   warn        'once' (default) | 'every' | false
 *   columns     the grid's columns, for the up/down arrows (default 3)
 *   onPick      (id) => any: after the screens are gone; awaited
 *   host        where the screen goes (default document.body)
 *   light       an existing createPointerLight(), or false for none; default: one made for the screen's life
 * Pure (node runs them): arrowTarget(count, at, key, columns), nearestSlot(slots, x, y), pointerPose(box, x, y),
 *   footParts(foot), applyChoice(session, id) */
import { el, label, ariaLabel } from '../kit.js';
import { frame } from '../core/frame.js';
import { rect, setVar, setAttr } from '../core/perf.js';
import { motionPolicy, parseDuration } from '../core/motion.js';
import { openerSwitches } from '../core/session.js';
import { createPointerLight, watchFxMedia } from '../fx/pointer-light.js';
import { photosensitivityNotice } from './flash-guard.js';

const JOB = 'mir:opener';
const POSE = ['--art-x', '--art-y', '--label-x', '--label-y', '--tilt-x', '--tilt-y', '--pointer-x', '--pointer-y'];
const FOCUSABLE = 'button:not([disabled])';
const clamp01 = (n) => Math.max(0, Math.min(1, n));

/* ── the pure part ─────────────────────────────────────────────────────────────────────────────────────────── */
/** arrowTarget(count, at, key, columns) → the index the arrow moves focus to (it wraps), or -1 when the key is not an arrow */
export function arrowTarget(count, at, key, columns = 3) {
  if (!count || at < 0 || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) return -1;
  const direction = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
  const step = direction * (count > columns && (key === 'ArrowUp' || key === 'ArrowDown') ? columns : 1);
  return (((at + step) % count) + count) % count;
}
/** nearestSlot(slots, x, y) → the index of the slot box { left, top, width, height } whose centre is nearest (-1: none) */
export function nearestSlot(slots, x, y) {
  let at = -1, best = Infinity;
  slots.forEach((r, i) => { const d = Math.hypot(x - r.left - r.width / 2, y - r.top - r.height / 2); if (d < best) { best = d; at = i; } });
  return at;
}
/** pointerPose(box, x, y) → the cover's pose for a pointer at (x, y) over its slot: BASINS' numbers, as CSS values */
export function pointerPose(box, x, y) {
  const u = clamp01((x - box.left) / box.width), v = clamp01((y - box.top) / box.height);
  return {
    '--pointer-x': `${(u * 100).toFixed(1)}%`, '--pointer-y': `${(v * 100).toFixed(1)}%`,
    '--art-x': `${((u - .5) * -8).toFixed(1)}px`, '--art-y': `${((v - .5) * -8).toFixed(1)}px`,
    '--label-x': `${((u - .5) * 24).toFixed(1)}px`, '--label-y': `${((v - .5) * 18).toFixed(1)}px`,
    '--tilt-x': `${((.5 - v) * 12).toFixed(2)}deg`, '--tilt-y': `${((u - .5) * 16).toFixed(2)}deg`,
  };
}
/** footParts(foot) → { text, sup } from a string or { text, sup } (what is drawn under the active cover) */
export function footParts(foot) {
  if (foot === undefined || foot === null || foot === '') return null;
  if (typeof foot === 'object') return { text: String(foot.text ?? ''), sup: foot.sup === undefined || foot.sup === null ? '' : String(foot.sup) };
  return { text: String(foot), sup: '' };
}
/** applyChoice(session, id) — once the app's parts exist: RESUME restores the work, anything else starts fresh */
export function applyChoice(session, id) { if (!session) return null; return id === 'resume' ? session.resume() : session.discard(); }

/* ── the screen ────────────────────────────────────────────────────────────────────────────────────────────── */
export function createOpener(o = {}) {
  const covers = (Array.isArray(o.covers) ? o.covers : []).filter((c) => c && c.id);
  const shown = covers.slice(0, Number.isFinite(o.mainCount) ? o.mainCount : covers.length);
  const columns = o.columns || 3;
  const hasResume = () => {
    if (o.session && typeof o.session.hasResume === 'function') { try { return !!o.session.hasResume(); } catch (_) { return false; } }
    return typeof o.resume === 'function' ? !!o.resume() : o.resume === true;
  };
  let screen = null, ended = false;

  /** the title screen → Promise<id> (resolved after the fade and the videos' release) */
  function choose() {
    const doc = o.doc || document, host = o.host || doc.body, win = doc.defaultView;
    const life = new AbortController(), on = { signal: life.signal };
    const root = el('div', 'mir-opener', host);
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); ariaLabel(root, o.label || 'starter projects');
    const card = el('div', 'mir-opener-card', root);
    if (o.logo) {
      const l = o.logo;
      if (typeof l === 'string') label(el('div', 'mir-opener-logo', card), l);
      else if (l.nodeType) { l.classList.add('mir-opener-logo'); card.appendChild(l); }
      else { const img = el('img', 'mir-opener-logo', card); img.src = l.src; img.alt = l.alt || ''; img.draggable = false; }
    }
    const choices = el('div', 'mir-opener-covers', card); ariaLabel(choices, 'Starter projects');
    const actions = el('div', 'mir-opener-actions', card);
    const slots = [];                                                // { button, cover, video? }
    const previews = new Map();                                      // video → is it on screen
    let active = null, launching = false, done = null;
    const light = o.light === false ? null : (o.light || createPointerLight({ doc }));

    const reduced = () => motionPolicy() !== 'full';
    const playVisible = () => {
      for (const [video, visible] of previews) {
        if (launching || doc.hidden || reduced() || !visible) video.pause();
        else if (video.paused) { const r = video.play(); if (r && r.catch) r.catch(() => {}); }     // the poster stays if playback is unavailable
        if (reduced()) video.classList.remove('is-playing');
      }
    };
    const observer = typeof win.IntersectionObserver === 'function' ? new win.IntersectionObserver((entries) => {
      for (const e of entries) if (previews.has(e.target)) previews.set(e.target, e.isIntersecting);
      playVisible();
    }, { threshold: .05 }) : null;
    const unwatch = watchFxMedia(doc, playVisible);                  // the motion media query: the videos re-ask
    doc.addEventListener('visibilitychange', playVisible, on);

    const clearPose = () => { frame.cancel(JOB); for (const s of slots) for (const n of POSE) setVar(s.button, n, null); };
    const setActive = (button) => {
      if (launching || active === button) return;
      if (active) setAttr(active, 'data-active', null);
      active = button;
      if (active) setAttr(active, 'data-active', '');
      setAttr(choices, 'data-has-active', button ? '' : null);
    };
    const slotAt = (x, y) => { const at = nearestSlot(slots.map((s) => rect(s.button)), x, y); return at < 0 ? null : slots[at]; };

    /* the pointer: ONE coalesced job of the frame — read every slot, then write the active cover's pose */
    let px = 0, py = 0;
    const work = () => {
      const boxes = slots.map((s) => rect(s.button)), at = nearestSlot(boxes, px, py);
      if (at < 0) return;
      const s = slots[at];
      setActive(s.button);
      if (reduced()) return;
      const pose = pointerPose(boxes[at], px, py);
      for (const n of POSE) setVar(s.button, n, pose[n]);
    };
    const track = (e) => { if (launching || e.pointerType === 'touch') return; px = e.clientX; py = e.clientY; frame.coalesce(JOB, work); };
    choices.addEventListener('pointerenter', track, on);
    choices.addEventListener('pointermove', track, on);
    choices.addEventListener('pointerleave', () => { clearPose(); setActive(choices.querySelector('.mir-opener-option:focus-visible')); }, on);

    const select = async (id, button) => {
      if (launching) return;
      setActive(button); launching = true; clearPose(); playVisible();
      for (const b of card.querySelectorAll('button')) b.disabled = true;
      if (button) setAttr(button, 'data-chosen', '');
      setAttr(card, 'data-launching', '');
      const cs = win.getComputedStyle(root), launch = parseDuration(cs.getPropertyValue('--opener-launch'), 420), fade = parseDuration(cs.getPropertyValue('--opener-fade'), 380);
      if (!reduced()) await new Promise((r) => setTimeout(r, launch));
      doc.removeEventListener('keydown', trap, true); doc.removeEventListener('focusin', keep, true);
      if (!reduced()) { setAttr(root, 'data-fading', ''); await new Promise((r) => setTimeout(r, fade)); }
      release();
      done(id);
    };

    /* the focus is trapped on the screen: Tab cycles its buttons, and focus that leaves is brought back */
    const buttons = () => [...root.querySelectorAll(FOCUSABLE)];
    const trap = (e) => {
      if (e.key !== 'Tab') return;
      const b = buttons(); if (!b.length) return;
      const first = b[0], last = b[b.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    const keep = (e) => { if (!root.contains(e.target)) { const b = buttons()[0]; if (b) b.focus(); } };
    doc.addEventListener('keydown', trap, true); doc.addEventListener('focusin', keep, true);

    function release() {
      life.abort(); unwatch(); if (observer) observer.disconnect();
      doc.removeEventListener('keydown', trap, true); doc.removeEventListener('focusin', keep, true);
      frame.cancel(JOB);
      for (const v of previews.keys()) { v.pause(); v.removeAttribute('src'); v.load(); }
      previews.clear();
      if (light && !o.light) light.destroy();
      root.remove();
    }

    shown.forEach((c, index) => {
      const button = el('button', 'mir-opener-option', choices); button.type = 'button';
      setVar(button, '--index', String(index)); button.dataset.cover = c.id;
      if (c.accent) setVar(button, '--cover-accent', c.accent);
      if (c.label) button.setAttribute('aria-label', c.label); else ariaLabel(button, 'Open {name}', { name: c.name });   // the app's own name is never translated
      const cover = el('span', 'mir-opener-cover', button); cover.setAttribute('data-light', '');
      const media = el('span', 'mir-opener-media', cover);
      const img = el('img', 'mir-opener-art', media); img.src = c.art; img.alt = ''; img.draggable = false;
      const slot = { button, cover };
      if (c.video) {
        const video = el('video', 'mir-opener-art mir-opener-preview', media);
        video.muted = true; video.defaultMuted = true; video.playsInline = true; video.loop = true;
        video.preload = 'none'; video.poster = c.art; video.src = c.video;
        video.setAttribute('aria-hidden', 'true'); video.tabIndex = -1;
        video.addEventListener('playing', () => video.classList.add('is-playing'));
        previews.set(video, false); if (observer) observer.observe(video); slot.video = video;
      }
      const meta = el('span', 'mir-opener-meta', button); meta.setAttribute('aria-hidden', 'true');
      el('strong', 'mir-opener-title', meta).textContent = c.name;
      const foot = footParts(c.foot);
      if (foot) { const f = el('span', 'mir-opener-foot', meta); f.append(foot.text); if (foot.sup) el('sup', null, f).textContent = foot.sup; }
      button.addEventListener('pointerenter', (e) => { if (e.pointerType === 'touch') setActive(button); }, on);
      button.addEventListener('focus', () => { if (button.matches(':focus-visible')) setActive(button); }, on);
      button.addEventListener('blur', () => { if (active === button) setActive(null); }, on);
      button.addEventListener('click', (e) => {
        /* a mouse click picks by the same lanes the hover used, so the cover you see grown is the cover you get */
        const chosen = e.detail > 0 && e.pointerType !== 'touch' ? slotAt(e.clientX, e.clientY) || slot : slot;
        select(chosen.button.dataset.cover, chosen.button);
      }, on);
      slots.push(slot);
    });

    const act = (cls, text, id) => { const b = label(el('button', 'mir-opener-btn ' + cls, actions), text); b.type = 'button'; b.addEventListener('click', () => select(id, null), on); return b; };
    act('mir-opener-home', 'NEW', 'home');
    if (hasResume()) act('mir-opener-resume', 'RESUME', 'resume');

    choices.addEventListener('keydown', (e) => {
      const list = [...choices.querySelectorAll('button')], to = arrowTarget(list.length, list.indexOf(doc.activeElement), e.key, columns);
      if (to >= 0) { list[to].focus(); e.preventDefault(); }
    }, on);

    root.tabIndex = -1; root.focus({ preventScroll: true });          // BASINS: the screen has the focus, not a cover (no ring until a key)
    screen = { root, release };
    return new Promise((resolve) => { done = resolve; });
  }

  /** start() → Promise<id>: the notice, the switches, the title screen, then onPick(id) */
  async function start() {
    if (ended) throw new Error('this opener was destroyed');
    const doc = o.doc || document, search = o.search !== undefined ? o.search : (doc.defaultView ? doc.defaultView.location.search : '');
    const q = new URLSearchParams(search instanceof URLSearchParams ? search.toString() : String(search || ''));
    const sw = openerSwitches(q, { ids: ['home', 'resume', ...covers.map((c) => c.id)], direct: o.direct || [],
      webdriver: o.webdriver !== undefined ? o.webdriver : !!(doc.defaultView && doc.defaultView.navigator && doc.defaultView.navigator.webdriver === true) });
    const body = doc.body, was = body.style.overflow;
    body.style.overflow = 'hidden';
    let id;
    try {
      if (sw.warning && o.warn !== false) await photosensitivityNotice({ ...(o.notice || {}), every: o.warn === 'every', force: q.get('warn') === '1' });
      id = sw.choice !== null && sw.choice !== undefined ? sw.choice : await choose();
    } finally { body.style.overflow = was; screen = null; }
    if (typeof o.onPick === 'function') await o.onPick(id);
    return id;
  }
  return { start, get root() { return screen ? screen.root : null; }, destroy() { ended = true; if (screen) screen.release(); screen = null; } };
}
