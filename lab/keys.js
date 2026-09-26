/* keys.js — THE KEYBOARD DISPATCHER: the one window keydown listener that runs the app's rebindable ACTIONS, the
 * key-and-role law that decides whose key a press is (OWNED, seatOf), the chord match, the saved overrides (LS_KEYS) and
 * a binding's printed name.  A seam out of rack.js boot() (optimization 2026-09-24 · wave 130 seam 10, AUDIT-E §6).
 * The ACTIONS table — the app's verbs and the boot bindings they reach — stays in rack.js; installKeys() takes five
 * edges: `ACTIONS`, `layout` (the Escape roads: the keyboard editor, the menubar, the + and ☆ lists), `canvas` and
 * `stageHasFocus` (the stage, and THE TAB RULE's one input) and `refresh` (a rebind repaints the editor: ui.keysRefresh); since
 * 0.3.1 S4 a sixth, `edit(action, run)`, through which every action runs so the host can name and arm a key's history row.
 * It runs where DEFAULT_KEYS stood, so the saved chords are applied and the listener registered in the same order as
 * before, and hands back the three verbs __LW_hooks.keys exposes over storage: bind, conflicts, reset. */
import { bindAction, bindingConflicts, normalizeBinding } from './shortcuts.js';

const LS_KEYS = 'lambdawaves.q0.keys';
const MAC = /Mac|iPhone|iPad/.test((navigator.platform || '') + ' ' + (navigator.userAgent || ''));
export function keyName(a) { if (!a.key) return '—'; const k = a.key.replace(/^Key/, '').replace(/^Digit/, '').replace('Arrow', '').replace('BracketLeft', '[').replace('BracketRight', ']').replace('Slash', '/').replace('Comma', ',');
  const n = (a.ctrl ? (MAC ? '⌘+' : 'Ctrl+') : '') + (a.alt ? (MAC ? '⌥+' : 'Alt+') : '') + (a.shift ? 'Shift+' : '') + k;
  return n === 'Shift+/' ? '?' : n; }

function matches(a, e) { return a.key === e.code && (a.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey)) && !!a.alt === e.altKey && (a.shift === undefined || !!a.shift === e.shiftKey); }
const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const OWNED = {
  slider: new Set([...ARROWS, 'Home', 'End', 'PageUp', 'PageDown', 'Delete', 'Backspace']),


  radio: new Set([...ARROWS, 'Home', 'End', 'Enter']),
  button: new Set(['Enter']),
  /* WAVE 68 · A LINK IS NOT A BUTTON, and the difference is exactly this key.  `a[href]` fell into
     the button set, so Space was taken from the app on all ten anchors in the page — and a link
     does NOT activate on Space (it is the browser's scroll), so those presses reached nobody at
     all.  Enter alone, which is the platform's own contract for an anchor. */
  link: new Set(['Enter']),
};
/** WAVE 68 · WHO THE GUARD IS LOOKING AT.  The selector named the TAG `button` and never
 *  `[role="button"]` — and `#title`, the λWAVES logo, is the one `<div role="button">` wave 62
 *  itself created, so one Space on the focused logo opened the menu AND started the clock
 *  (`playing` false→true, `t` 0 → 1.863 s).  A guard about ROLES has to read roles. */
const seatOf = (el) => {
  const w = el && el.closest && el.closest('[role="slider"],[role="radio"],[role="button"],button,a[href]');
  if (!w) return null;
  /* A CONTROL THAT WILL NOT ACT DOES NOT OWN THE KEYS.  With KEEP FRAMES off — the shipped default —
     the scrub is `aria-disabled` and its own keydown returns; the three knobs that mount disabled do
     the same since kit.js's setDisabled writes the attribute.  Before this, three arrows at such a
     control reached NOBODY: the control refused them and the guard had already taken them from the
     app.  Either say you are disabled or let the app have them — never both. */
  if (w.disabled === true || w.getAttribute('aria-disabled') === 'true') return null;
  const r = w.getAttribute('role');
  return OWNED[r === 'slider' ? 'slider' : r === 'radio' ? 'radio' : (w.tagName === 'A' && r !== 'button') ? 'link' : 'button'] || null;
};

export function installKeys({ ACTIONS, layout, canvas, stageHasFocus, refresh, edit = (a, run) => run() }) {
  const DEFAULT_KEYS = Object.fromEntries(ACTIONS.map((a) => [a.id, { key: a.key, ctrl: !!a.ctrl, alt: !!a.alt, shift: a.shift }]));
  /* Saved chords pass the same collision/reservation law as a live edit. Old corrupt
     overrides cannot silently shadow a newer default action. */
  try { const ov = JSON.parse(localStorage.getItem(LS_KEYS) || '{}'); for (const a of ACTIONS) if (ov[a.id]) bindAction(ACTIONS, a.id, ov[a.id]); } catch (_) {}
  function saveKeys() { try { const ov = {}; for (const a of ACTIONS) { const d = DEFAULT_KEYS[a.id]; if (a.key !== d.key || !!a.ctrl !== d.ctrl || !!a.alt !== d.alt || a.shift !== d.shift) ov[a.id] = { key: a.key, ctrl: !!a.ctrl, alt: !!a.alt, shift: a.shift }; } localStorage.setItem(LS_KEYS, JSON.stringify(ov)); } catch (_) {} }
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';


    /* Project save and Settings escape a text field. This return sits above every modifier
       test, so Ctrl+S pressed with the caret in the project's name field or the notebook — the two
       places a hand most plausibly is when it reaches for save — reached nobody at all.
         IT IS AN ALLOWLIST AND NOT A LOOSENING.  Ctrl+Z inside the notebook still does the TEXTAREA'S
       undo and not the register's. Save and the platform-standard Settings shortcut have no useful
       text-editing meaning, so they stay global while the caret is active. */
    const appCommandFromText = (e.ctrlKey || e.metaKey) && !e.altKey && (e.code === 'KeyS' || e.code === 'Comma');
    if ((tag === 'INPUT' || tag === 'TEXTAREA') && !appCommandFromText) return;
    if (tag === 'SELECT' && e.code !== 'Space') return;
    if (e.code === 'Escape' && layout.keymap && layout.keymap.isOpen) { e.preventDefault(); layout.keymap.close(); return; }   // wave 106: the manual closes on Escape (layout.keysheet is this same object)
    if (e.code === 'Escape' && stageHasFocus()) { try { canvas.blur(); } catch (_) {} return; }   // wave 57: the keyboard way OFF the stage — the next Tab then walks the interface
    if (e.code === 'Escape' && layout.menu && layout.menu.isOpen) { e.preventDefault(); layout.menu.close(); const t = document.getElementById('title'); if (t) t.focus(); return; }   // wave 62: the ONE new key in the whole wave
    if (e.code === 'Escape' && layout.addMenu && layout.addMenu.shown) { e.preventDefault(); layout.addMenu.close(); const b = document.getElementById('rackAdd'); if (b) b.focus(); return; }
    if (e.code === 'Escape' && layout.favMenu && layout.favMenu.shown) { e.preventDefault(); layout.favMenu.close(); const b = document.getElementById('rackFav'); if (b) b.focus(); return; }
    /* ── WAVE 62 · WHOSE KEY IS THIS? ─────────────────────────────────────────────────────────────
     * THE LAW: a key belongs to the focused control WHEN THAT CONTROL'S ROLE WOULD USE IT.  Every
     * other key is the app's shortcut, including the bare letters, and including Space on a slider.
     * Not "any control swallows everything" — that would take H, N, B and ? away from a keyboard user
     * the moment they touched a knob — and not a `{ global: true }` flag on 38 actions, which is
     * annotation to maintain and gets forgotten on the 39th.  It is a property of THE KEY AND THE
     * ROLE, so it is one Set lookup, and it degrades correctly when an action is added.
     *   Space on a focused MUTE presses MUTE and does not touch the transport (a button owns Space);
     *   Space on a focused KNOB still plays (a slider has no use for Space);
     *   ArrowRight on a focused knob turns the knob; ArrowRight on a focused SWITCH still steps time.
     * MODIFIERS ARE NEVER OWNED — Ctrl/⌘+Z undoes from inside a knob, ? opens the sheet from inside a
     * button — but Shift IS let through, because Shift+Arrow is the fine step and Shift+Tab is the
     * browser's.  The guard returns WITHOUT preventDefault(): that is the whole point, because what
     * runs next is the button's own native activation or the slider's own handler.  (The keyboard editor
     * records its chords with its own listener while it is open: lab/keymap.js.) */
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      const own = seatOf(e.target);                                // wave 68: roles, not tags — and never a control that will not act
      if (own && own.has(e.code)) return;
    }
    /* ── WAVE 68 · TWO LAWS THE ACTIONS LOOP HAS TO OBEY BEFORE IT RUNS ANYTHING ──────────────────
     * (1) A HANDLED EVENT IS HANDLED.  `#title`'s own keydown calls preventDefault() on Space and the
     *     loop never asked, so both ran: one press opened the menu and started the physics clock.
     *     The guard above is the general answer and this is the safety net under it — any element in
     *     this lab that answers a key and says so is now believed, whatever its role happens to be.
     * (2) TAB OFF THE STAGE IS THE BROWSER'S, WHATEVER THE TABLE SAYS.  Wave 57 removed a keyboard
     *     trap by stage-gating the two window-cycle actions; wave 62's `continue` (which is correct,
     *     and stays) let a LATER action reached by the same key claim it, so two clicks in the shipped
     *     KEYS panel — bind NOTES to Tab — put the trap straight back, persisted to localStorage.
     *     Wave 57's rule was never a property of those two actions: it is a property of THE KEY, and
     *     it is enforced here where no binding can get underneath it.  Shift+Tab with it, because
     *     backwards walking is the same promise.  (The binding law refuses it too — lab/shortcuts.js
     *     bindingError, the one road of the keyboard editor, the saved overrides and keys.bind — so
     *     nothing offers a chord that could never fire; but the trap is closed even if it did.) */
    if (e.defaultPrevented) return;
    if (e.code === 'Tab' && !stageHasFocus()) return;
    /* WAVE 88 · AND THE NATIVE ACTIVATION IS CANCELLED HERE.  Taking Space out of OWNED above stops
       the guard HANDING it to the control; it does not stop the browser, which fires a <button>'s
       click from Space on its own.  One preventDefault at the top of the dispatch does, and it must
       be before the loop rather than inside a matched action, so the cancellation does not depend on
       Space still being bound to something. */
    if (e.code === 'Space') e.preventDefault();
    const fine = e.shiftKey ? 0.25 : 1;
    for (const a of ACTIONS) {
      if (!matches(a, e)) continue;
      if (a.stage && !stageHasFocus()) continue;                   // wave 57: TAB is the browser's unless the hands are on the world — see THE TAB RULE.  wave 62: `continue`, not `return` — a `return` abandoned the whole loop rather than skipping this one action, which is harmless only while Tab is the sole stage: true binding
      e.preventDefault();
      edit(a, () => a.run(fine));                                   // 0.3.1 · S4: the host names and arms the key's edit (rack.js keyEdit)
      return;
    }
  });
  return {
    bind(id, b, options) { const result = bindAction(ACTIONS, id, b, options); if (result.ok) { saveKeys(); refresh(); } return result; },
    conflicts(id, b) { const a = ACTIONS.find(x => x.id === id); return a ? bindingConflicts(ACTIONS, id, normalizeBinding(a, b)) : []; },
    reset() { for (const a of ACTIONS) Object.assign(a, DEFAULT_KEYS[a.id]); try { localStorage.removeItem(LS_KEYS); } catch (_) {} refresh(); },
  };
}
