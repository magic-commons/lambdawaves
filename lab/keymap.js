

import { el } from './kit.js';

/* ── 1. KEYBOARD LAYOUT DEFINITION (ANSI 5-ROW STRUCTURE) ─────────────────────────────────────── */

const ROWS_SHARED = [
  // Row 0: ESC, Number row, Backspace
  [
    { code: 'Escape', label: 'ESC', flexCls: 'km-key-w-esc' },
    { code: 'Backquote', label: '`', shiftLabel: '~', flexCls: 'km-key-w-1' },
    { code: 'Digit1', label: '1', shiftLabel: '!', flexCls: 'km-key-w-1' },
    { code: 'Digit2', label: '2', shiftLabel: '@', flexCls: 'km-key-w-1' },
    { code: 'Digit3', label: '3', shiftLabel: '#', flexCls: 'km-key-w-1' },
    { code: 'Digit4', label: '4', shiftLabel: '$', flexCls: 'km-key-w-1' },
    { code: 'Digit5', label: '5', shiftLabel: '%', flexCls: 'km-key-w-1' },
    { code: 'Digit6', label: '6', shiftLabel: '^', flexCls: 'km-key-w-1' },
    { code: 'Digit7', label: '7', shiftLabel: '&', flexCls: 'km-key-w-1' },
    { code: 'Digit8', label: '8', shiftLabel: '*', flexCls: 'km-key-w-1' },
    { code: 'Digit9', label: '9', shiftLabel: '(', flexCls: 'km-key-w-1' },
    { code: 'Digit0', label: '0', shiftLabel: ')', flexCls: 'km-key-w-1' },
    { code: 'Minus', label: '-', shiftLabel: '_', flexCls: 'km-key-w-1' },
    { code: 'Equal', label: '=', shiftLabel: '+', flexCls: 'km-key-w-1' },
    { code: 'Backspace', label: 'BKSP', flexCls: 'km-key-w-bksp' },
  ],
  // Row 1: TAB, QWERTY row, Brackets, Backslash
  [
    { code: 'Tab', label: 'TAB', flexCls: 'km-key-w-tab' },
    { code: 'KeyQ', label: 'Q', flexCls: 'km-key-w-1' },
    { code: 'KeyW', label: 'W', flexCls: 'km-key-w-1' },
    { code: 'KeyE', label: 'E', flexCls: 'km-key-w-1' },
    { code: 'KeyR', label: 'R', flexCls: 'km-key-w-1' },
    { code: 'KeyT', label: 'T', flexCls: 'km-key-w-1' },
    { code: 'KeyY', label: 'Y', flexCls: 'km-key-w-1' },
    { code: 'KeyU', label: 'U', flexCls: 'km-key-w-1' },
    { code: 'KeyI', label: 'I', flexCls: 'km-key-w-1' },
    { code: 'KeyO', label: 'O', flexCls: 'km-key-w-1' },
    { code: 'KeyP', label: 'P', flexCls: 'km-key-w-1' },
    { code: 'BracketLeft', label: '[', shiftLabel: '{', flexCls: 'km-key-w-1' },
    { code: 'BracketRight', label: ']', shiftLabel: '}', flexCls: 'km-key-w-1' },
    { code: 'Backslash', label: '\\', shiftLabel: '|', flexCls: 'km-key-w-backslash' },
  ],
  // Row 2: CAPS, Home row, Punctuation, ENTER
  [
    { code: 'CapsLock', label: 'CAPS', flexCls: 'km-key-w-caps' },
    { code: 'KeyA', label: 'A', flexCls: 'km-key-w-1' },
    { code: 'KeyS', label: 'S', flexCls: 'km-key-w-1' },
    { code: 'KeyD', label: 'D', flexCls: 'km-key-w-1' },
    { code: 'KeyF', label: 'F', flexCls: 'km-key-w-1' },
    { code: 'KeyG', label: 'G', flexCls: 'km-key-w-1' },
    { code: 'KeyH', label: 'H', flexCls: 'km-key-w-1' },
    { code: 'KeyJ', label: 'J', flexCls: 'km-key-w-1' },
    { code: 'KeyK', label: 'K', flexCls: 'km-key-w-1' },
    { code: 'KeyL', label: 'L', flexCls: 'km-key-w-1' },
    { code: 'Semicolon', label: ';', shiftLabel: ':', flexCls: 'km-key-w-1' },
    { code: 'Quote', label: "'", shiftLabel: '"', flexCls: 'km-key-w-1' },
    { code: 'Enter', label: 'ENTER', flexCls: 'km-key-w-enter' },
  ],
  // Row 3: Left SHIFT, Bottom letter row, Punctuation, Right SHIFT
  [
    { code: 'ShiftLeft', label: 'SHIFT', isModifier: true, flexCls: 'km-key-w-lshift' },
    { code: 'KeyZ', label: 'Z', flexCls: 'km-key-w-1' },
    { code: 'KeyX', label: 'X', flexCls: 'km-key-w-1' },
    { code: 'KeyC', label: 'C', flexCls: 'km-key-w-1' },
    { code: 'KeyV', label: 'V', flexCls: 'km-key-w-1' },
    { code: 'KeyB', label: 'B', flexCls: 'km-key-w-1' },
    { code: 'KeyN', label: 'N', flexCls: 'km-key-w-1' },
    { code: 'KeyM', label: 'M', flexCls: 'km-key-w-1' },
    { code: 'Comma', label: ',', shiftLabel: '<', flexCls: 'km-key-w-1' },
    { code: 'Period', label: '.', shiftLabel: '>', flexCls: 'km-key-w-1' },
    { code: 'Slash', label: '/', shiftLabel: '?', flexCls: 'km-key-w-1' },
    { code: 'ShiftRight', label: 'SHIFT', isModifier: true, flexCls: 'km-key-w-rshift' },
  ],
];

/**
 * Row 4 is the one row where platform naming varies.
 * On Windows: CTRL, WIN, ALT, SPACE, ALT, CTRL, ←, ↓, →
 * On Mac/iPad: CTRL, ⌘, ⌥, SPACE, ⌥, CTRL, ←, ↓, →
 */
function getBottomRow(platform) {
  const isMac = platform === 'mac';
  return [
    { code: 'ControlLeft', label: 'CTRL', isModifier: true, flexCls: 'km-key-w-ctrl' },
    { code: 'MetaLeft', label: isMac ? '⌘' : 'WIN', isModifier: true, flexCls: 'km-key-w-win' },
    { code: 'AltLeft', label: isMac ? '⌥' : 'ALT', isModifier: true, flexCls: 'km-key-w-alt' },
    { code: 'Space', label: 'SPACE', flexCls: 'km-key-w-space' },
    { code: 'AltRight', label: isMac ? '⌥' : 'ALT', isModifier: true, flexCls: 'km-key-w-alt' },
    { code: 'ControlRight', label: 'CTRL', isModifier: true, flexCls: 'km-key-w-ctrl' },
    { code: 'ArrowLeft', label: '←', flexCls: 'km-key-w-arrow' },
    { code: 'ArrowDown', label: '↓', flexCls: 'km-key-w-arrow' },
    { code: 'ArrowRight', label: '→', flexCls: 'km-key-w-arrow' },
  ];
}

function getKeyboardRows(platform) {
  return [...ROWS_SHARED, getBottomRow(platform)];
}

/* ── 2. MODIFIER AND ACTION DISPLAY FORMATTING ────────────────────────────────────────────────── */

const MODIFIER_CODES = new Set([
  'ControlLeft', 'ControlRight',
  'ShiftLeft', 'ShiftRight',
  'AltLeft', 'AltRight',
  'MetaLeft', 'MetaRight',
]);

const KNOWN_SHORTS = {
  play: 'play',
  fullscreen: 'fullscreen',
  notebook: 'notebook',
  home: 'zero',
  stepBack: 'step back',
  stepFwd: 'step fwd',
  zoomIn: 'zoom in',
  zoomOut: 'zoom out',
  yawL: 'yaw left',
  yawR: 'yaw right',
  pitchUp: 'pitch up',
  pitchDn: 'pitch down',
  dollyIn: 'dolly in',
  dollyOut: 'dolly out',
  camReset: 'cam reset',
  axisX: 'axis X',
  axisY: 'axis Y',
  axisZ: 'axis Z',
  rotorBoth: 'rotor both',
  rotorPlus: 'rotor +',
  rotorMinus: 'rotor −',
  rotorK: 'rotor K',
  turnNeg: 'turn −',
  turnPos: 'turn +',
  slap: 'slap',
  style: 'style',
  view: 'view',
  palette: 'palette',
  hideUI: 'hide UI',
  nextWindow: 'next win',
  prevWindow: 'prev win',
  reseed: 'reseed',
  keysheet: 'keys',
  notes: 'notes',
  rack: 'rack',
  dock: 'dock',
  modArm: 'mod arm',
  modBar: 'bar lock',
  undo: 'undo',
  redo: 'redo',
  save: 'save',
  saveAs: 'save as',
};

function displayKey(code) {
  if (!code) return '';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const map = {
    Space: 'Space',
    Home: 'Home',
    End: 'End',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Slash: '/',
    Backquote: '`',
    Minus: '-',
    Equal: '=',
    Semicolon: ';',
    Quote: "'",
    Comma: ',',
    Period: '.',
    Enter: 'Enter',
    Tab: 'Tab',
    Escape: 'Esc',
    Backspace: 'Bksp',
    CapsLock: 'Caps',
  };
  return map[code] || code;
}

function detectPlatform() {
  try {
    const p = (navigator.platform || '') + ' ' + (navigator.userAgent || '');
    return /Mac|iPhone|iPad|iPod/i.test(p) ? 'mac' : 'windows';
  } catch (_) {
    return 'windows';
  }
}

function getActionLabelAndDesc(a) {
  if (!a) return { label: '', desc: '' };
  if (a.description) return { label: a.label || '', desc: a.description };
  if (a.desc) return { label: a.label || '', desc: a.desc };
  if (a.note) return { label: a.label || '', desc: a.note };
  const raw = String(a.label || '');
  const mParen = raw.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (mParen) return { label: mParen[1].trim(), desc: mParen[2].trim() };
  const mDash = raw.match(/^([^—]+)\s*—\s*(.+)$/);
  if (mDash) return { label: mDash[1].trim(), desc: mDash[2].trim() };
  return { label: raw, desc: '' };
}

function deriveShortName(a) {
  if (!a) return '';
  if (a.short) return a.short;
  if (KNOWN_SHORTS[a.id]) return KNOWN_SHORTS[a.id];
  const { label } = getActionLabelAndDesc(a);
  const cleaned = label
    .replace(/^(the|open the|cycle the|toggle the|toggle|hide \/ show the|show \/ hide the|hide \/ show|show \/ hide|reset the|step time)\s+/i, '')
    .trim();
  const words = cleaned.split(/[\s/—·-]+/).filter(Boolean);
  return words.slice(0, 2).join(' ').toLowerCase();
}

function formatChord(spec, platform) {
  const isMac = platform === 'mac';
  const parts = [];
  if (spec.ctrl) parts.push(isMac ? '⌘' : 'Ctrl');
  if (spec.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (spec.shift) parts.push('⇧');
  parts.push(displayKey(spec.key));
  return parts.join('+');
}

function isSameChord(b1, b2) {
  if (!b1 || !b2) return false;
  const s1 = b1.shift === undefined ? false : !!b1.shift;
  const s2 = b2.shift === undefined ? false : !!b2.shift;
  return b1.key === b2.key && !!b1.ctrl === !!b2.ctrl && !!b1.alt === !!b2.alt && s1 === s2;
}

/* ── 3. EXPORTED BUILDER ──────────────────────────────────────────────────────────────────────── */

/**
 * createKeymap(host, keys)
 * Builds the visual keybinding editor inside `host` and binds to the `keys` model.
 * Returns: { root, refresh(), open(), close(), destroy() }
 */
export function createKeymap(host, keys, options = {}) {
  let isOpen = false;
  let platform = detectPlatform();
  let selectedActionId = null;
  let recording = false;
  let pendingSteal = null; // { actionId, conflictingId, binding }

  // Mapping: key definition object -> array of DOM key button elements
  const keyDomMap = new Map();
  // Mapping: action id -> row DOM element
  const rowDomMap = new Map();

  // Root screen
  const root = el('div', 'km-panel', host);
  root.hidden = true;

  // ── Header
  const header = el('div', 'km-header', root);
  const titles = el('div', 'km-header-titles', header);
  el('div', 'km-eyebrow', titles, 'λWAVES · CONTROLS');
  el('h2', 'km-title', titles, 'CUSTOMIZE KEYBINDS');

  const closeBtn = el('button', 'km-close', header, '×');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close keybindings editor');
  closeBtn.addEventListener('click', () => close());

  // ── Two Columns
  const cols = el('div', 'km-columns', root);

  // Left Column: Keyboard Layout
  const colLeft = el('div', 'km-col km-col-left', cols);
  const leftHeader = el('div', 'km-col-header', colLeft);
  el('span', 'km-col-title', leftHeader, 'KEYBOARD LAYOUT');

  // Platform Segmented Switch
  const switchBox = el('div', 'km-platform-switch', leftHeader);
  const btnMac = el('button', 'km-platform-btn', switchBox, 'MAC / IPAD');
  btnMac.type = 'button';
  btnMac.setAttribute('aria-label', 'Show Mac / iPad modifier names (⌘ and ⌥)');
  btnMac.addEventListener('click', () => setPlatform('mac'));

  const btnWin = el('button', 'km-platform-btn', switchBox, 'WINDOWS');
  btnWin.type = 'button';
  btnWin.setAttribute('aria-label', 'Show Windows modifier names (Ctrl and Alt)');
  btnWin.addEventListener('click', () => setPlatform('windows'));

  // Legend
  const legend = el('div', 'km-legend', colLeft);
  el('span', 'km-legend-dot km-legend-active', legend);
  el('span', 'km-legend-text', legend, 'Active');
  el('span', 'km-legend-dot km-legend-unbound', legend);
  el('span', 'km-legend-text', legend, 'Unbound');
  el('span', 'km-legend-shift-sample', legend, '⇧');
  el('span', 'km-legend-text', legend, 'Shift');

  // Keyboard Container
  const kbContainer = el('div', 'km-keyboard', colLeft);

  // Right Column: Actions List
  const colRight = el('div', 'km-col km-col-right', cols);
  const rightHeader = el('div', 'km-col-header', colRight);
  el('span', 'km-col-title', rightHeader, 'ACTIONS LIST');
  const countEl = el('span', 'km-count', rightHeader, '0 BINDINGS');

  const listEl = el('div', 'km-list', colRight);

  // ── Footer
  const footer = el('div', 'km-footer', root);
  const footerActions = el('div', 'km-footer-actions', footer);

  // Button 1: RECORD INPUT
  const recBtn = el('button', 'km-btn km-btn-record', footerActions);
  recBtn.type = 'button';
  recBtn.setAttribute('aria-pressed', 'false');
  el('span', 'km-btn-main', recBtn, 'RECORD INPUT');
  const recSub = el('span', 'km-btn-sub', recBtn, 'choose an action first');
  recBtn.addEventListener('click', () => {
    if (recording) cancelRecording('button');
    else startRecording('button');
  });

  // Button 2: RESET TO DEFAULT
  const resetBtn = el('button', 'km-btn km-btn-reset', footerActions);
  resetBtn.type = 'button';
  el('span', 'km-btn-main', resetBtn, 'RESET TO DEFAULT');
  el('span', 'km-btn-sub', resetBtn, 'every key as shipped');
  resetBtn.addEventListener('click', () => resetAll('button'));

  // Footer Right Messages (Ordinary text nodes — never live regions)
  const footerInfo = el('div', 'km-footer-info', footer);
  const statusEl = el('div', 'km-status', footerInfo, '');
  const hintEl = el('div', 'km-hint', footerInfo, 'Tap an action, RECORD INPUT, then press its new key · hover any key to see what it does');

  /* ── 4. DOM REPAINT & INTERACTION LOGIC ─────────────────────────────────────────────────────── */

  function setStatus(text, isConflict = false) {
    statusEl.textContent = text || '';
    statusEl.className = 'km-status' + (isConflict ? ' km-status-conflict' : '');
  }

  function setPlatform(p) {
    if (platform === p) return;
    platform = p;
    paintPlatform();
    refresh();
    setStatus(platform === 'mac' ? 'Mac / iPad layout · modifier displayed as ⌘' : 'Windows layout · modifier displayed as Ctrl');
  }

  function paintPlatform() {
    const isMac = platform === 'mac';
    btnMac.setAttribute('aria-pressed', isMac ? 'true' : 'false');
    btnMac.className = 'km-platform-btn' + (isMac ? ' km-platform-active' : '');
    btnWin.setAttribute('aria-pressed', !isMac ? 'true' : 'false');
    btnWin.className = 'km-platform-btn' + (!isMac ? ' km-platform-active' : '');
  }

  function getActions() {
    return Array.isArray(keys && keys.actions) ? keys.actions : [];
  }

  function getSelectedAction() {
    const acts = getActions();
    return selectedActionId ? (acts.find((a) => a.id === selectedActionId) || null) : null;
  }

  function buildKeyboardDom() {
    kbContainer.textContent = '';
    keyDomMap.clear();

    const rows = getKeyboardRows(platform);
    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const rowDef = rows[rIdx];
      const rowDiv = el('div', 'km-kb-row', kbContainer);

      for (let kIdx = 0; kIdx < rowDef.length; kIdx++) {
        const kDef = rowDef[kIdx];
        const keyBtn = el('button', 'km-key ' + kDef.flexCls, rowDiv);
        keyBtn.type = 'button';
        keyBtn.dataset.code = kDef.code;

        // Top flex row: shift symbol + modifier badge
        const topRow = el('div', 'km-key-top', keyBtn);
        el('span', 'km-key-shift-char', topRow, kDef.shiftLabel || '');
        const badge = el('span', 'km-badge', topRow, '');
        badge.hidden = true;

        // Main key label
        el('span', 'km-key-cap', keyBtn, kDef.label);

        // Action sub-label
        const subLabel = el('span', 'km-key-sub', keyBtn, '');

        // Hover events show what the key does
        keyBtn.addEventListener('pointerenter', () => highlightHoverKey(kDef));
        keyBtn.addEventListener('pointerleave', () => clearHover());
        keyBtn.addEventListener('focus', () => highlightHoverKey(kDef));
        keyBtn.addEventListener('blur', () => clearHover());

        // Clicking a bound key selects its action
        keyBtn.addEventListener('click', () => {
          const acts = getActions().filter((a) => a.key === kDef.code);
          if (acts.length === 0) return;
          if (acts.length === 1) {
            selectAction(acts[0].id, 'key');
          } else {
            // If already on one of these actions, cycle to the next; else pick the first
            const idx = acts.findIndex((a) => a.id === selectedActionId);
            const next = idx >= 0 ? (idx + 1) % acts.length : 0;
            selectAction(acts[next].id, 'key');
          }
        });

        if (!keyDomMap.has(kDef.code)) keyDomMap.set(kDef.code, []);
        keyDomMap.get(kDef.code).push(keyBtn);
      }
    }
  }

  function syncKeyboard() {
    const actions = getActions();
    const sel = getSelectedAction();
    const isMac = platform === 'mac';

    for (const [code, btns] of keyDomMap.entries()) {
      const matching = actions.filter((a) => a.key === code);
      const isBound = matching.length > 0;
      const isSelected = sel && sel.key === code;

      // Check modifier bindings for lit modifier keys
      let isLitModifier = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        isLitModifier = actions.some((a) => a.shift);
      } else if (code === 'ControlLeft' || code === 'ControlRight') {
        isLitModifier = actions.some((a) => a.ctrl);
      } else if (code === 'MetaLeft') {
        isLitModifier = isMac ? actions.some((a) => a.ctrl) : false;
      } else if (code === 'AltLeft' || code === 'AltRight') {
        isLitModifier = actions.some((a) => a.alt);
      }

      for (const btn of btns) {
        const badge = btn.querySelector('.km-badge');
        const sub = btn.querySelector('.km-key-sub');

        // Reset classes
        btn.classList.remove('km-key-bound', 'km-key-unbound', 'km-key-selected', 'km-key-recording');

        if (isBound || isLitModifier) {
          btn.classList.add('km-key-bound');
          btn.tabIndex = 0;
          btn.setAttribute('aria-disabled', 'false');

          if (isBound) {
            // Derive short name
            const activeAction = isSelected ? sel : matching[0];
            const shortName = deriveShortName(activeAction);
            if (sub) {
              if (recording && isSelected) {
                sub.textContent = 'press a key…';
                btn.classList.add('km-key-recording');
              } else {
                sub.textContent = matching.length > 1 && !isSelected ? matching.map(deriveShortName).join(' · ') : shortName;
              }
            }

            // Modifier badge in top-right corner
            if (badge) {
              const rep = isSelected ? sel : matching[0];
              const hasCtrl = rep.ctrl;
              const hasShift = rep.shift;
              const hasAlt = rep.alt;

              badge.className = 'km-badge';
              if (hasCtrl && hasShift) {
                badge.textContent = (isMac ? '⌘' : 'Ctrl') + '+⇧';
                badge.classList.add('km-badge-combo');
                badge.hidden = false;
              } else if (hasCtrl) {
                badge.textContent = isMac ? '⌘' : 'Ctrl';
                badge.classList.add('km-badge-ctrl');
                badge.hidden = false;
              } else if (hasShift) {
                badge.textContent = '⇧';
                badge.classList.add('km-badge-shift');
                badge.hidden = false;
              } else if (hasAlt) {
                badge.textContent = isMac ? '⌥' : 'Alt';
                badge.classList.add('km-badge-alt');
                badge.hidden = false;
              } else {
                badge.hidden = true;
              }
            }

            btn.title = `${matching.map((a) => a.label).join(' · ')}`;
          } else {
            // Lit modifier key
            if (sub) sub.textContent = '';
            if (badge) badge.hidden = true;
            btn.title = `${btn.querySelector('.km-key-cap').textContent} modifier`;
          }
        } else {
          // Unbound key
          btn.classList.add('km-key-unbound');
          btn.tabIndex = -1;
          btn.setAttribute('aria-disabled', 'true');
          if (sub) sub.textContent = '';
          if (badge) badge.hidden = true;
          btn.title = `${btn.querySelector('.km-key-cap').textContent} (unbound)`;
        }

        // Highlight selected key cap(s)
        if (isSelected) {
          btn.classList.add('km-key-selected');
        }

        // Highlight modifier keys if selected action uses them
        if (sel) {
          if (sel.shift && (code === 'ShiftLeft' || code === 'ShiftRight')) {
            btn.classList.add('km-key-selected');
          }
          if (sel.ctrl && (code === 'ControlLeft' || code === 'ControlRight' || (isMac && code === 'MetaLeft'))) {
            btn.classList.add('km-key-selected');
          }
          if (sel.alt && (code === 'AltLeft' || code === 'AltRight')) {
            btn.classList.add('km-key-selected');
          }
        }
      }
    }
  }

  function renderActionsList() {
    listEl.textContent = '';
    rowDomMap.clear();

    const actions = getActions();
    countEl.textContent = `${actions.length} BINDINGS`;
    const isMac = platform === 'mac';

    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      const isSel = a.id === selectedActionId;

      const row = el('button', 'km-action-row' + (isSel ? ' km-action-row-selected' : ''), listEl);
      row.type = 'button';
      row.dataset.id = a.id;
      row.setAttribute('aria-selected', isSel ? 'true' : 'false');

      if (isSel && recording) {
        row.classList.add('km-action-row-recording');
      }

      // Left: key chips
      const chips = el('span', 'km-chips', row);
      if (isSel && recording) {
        el('span', 'km-chip km-chip-recording', chips, 'press a key…');
      } else {
        if (a.ctrl) el('span', 'km-chip km-chip-mod', chips, isMac ? '⌘' : 'Ctrl');
        if (a.alt) el('span', 'km-chip km-chip-mod', chips, isMac ? '⌥' : 'Alt');
        if (a.shift) el('span', 'km-chip km-chip-mod', chips, '⇧');
        if (a.key) el('span', 'km-chip km-chip-key', chips, displayKey(a.key));
        else el('span', 'km-chip km-chip-unbound', chips, '—');
      }

      // Middle: action label middot description
      const textWrap = el('span', 'km-action-text', row);
      const { label, desc } = getActionLabelAndDesc(a);
      el('span', 'km-action-label', textWrap, label);
      if (desc) {
        el('span', 'km-action-sep', textWrap, ' · ');
        el('span', 'km-action-desc', textWrap, desc);
      }

      // Interaction
      row.addEventListener('click', () => selectAction(a.id, 'row'));
      row.addEventListener('pointerenter', () => highlightHoverAction(a));
      row.addEventListener('pointerleave', () => clearHover());
      row.addEventListener('focus', () => highlightHoverAction(a));
      row.addEventListener('blur', () => clearHover());

      rowDomMap.set(a.id, row);
    }
  }

  function paintRecordBtn() {
    const sel = getSelectedAction();
    recBtn.classList.toggle('km-btn-recording', recording);
    recBtn.setAttribute('aria-pressed', recording ? 'true' : 'false');

    if (recording) {
      recSub.textContent = pendingSteal ? 'press again to confirm steal · Esc cancels' : 'press a key… · Esc cancels';
    } else if (sel) {
      recSub.textContent = `for “${deriveShortName(sel) || sel.label}”`;
    } else {
      recSub.textContent = 'choose an action first';
    }
  }

  /* ── 5. TWO-WAY SELECTION & HOVER HIGHLIGHTING ──────────────────────────────────────────────── */

  function selectAction(id, via) {
    if (selectedActionId === id && !recording) return;
    if (recording) cancelRecording('reselect');

    selectedActionId = id;
    pendingSteal = null;

    syncKeyboard();

    for (const [aId, row] of rowDomMap.entries()) {
      const isSel = aId === id;
      row.classList.toggle('km-action-row-selected', isSel);
      row.setAttribute('aria-selected', isSel ? 'true' : 'false');
    }

    const sel = getSelectedAction();
    if (sel) {
      paintRecordBtn();
      setStatus(`Selected “${sel.label}” (${formatChord(sel, platform)}) · press RECORD INPUT to rebind`);
      if (via === 'key') {
        const row = rowDomMap.get(id);
        if (row) {
          try { row.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (_) {}
        }
      }
    }
  }

  function highlightHoverKey(kDef) {
    clearHover();
    const btns = keyDomMap.get(kDef.code) || [];
    for (const b of btns) b.classList.add('km-key-hovered');

    const acts = getActions().filter((a) => a.key === kDef.code);
    if (acts.length > 0) {
      for (const a of acts) {
        const row = rowDomMap.get(a.id);
        if (row) row.classList.add('km-action-row-hovered');
      }
      hintEl.textContent = `${kDef.label} · ${acts.map((a) => a.label).join(' · ')}`;
    } else {
      hintEl.textContent = `${kDef.label} (unbound)`;
    }
  }

  function highlightHoverAction(a) {
    clearHover();
    const row = rowDomMap.get(a.id);
    if (row) row.classList.add('km-action-row-hovered');

    if (a.key) {
      const btns = keyDomMap.get(a.key) || [];
      for (const b of btns) b.classList.add('km-key-hovered');
    }
    const isMac = platform === 'mac';
    if (a.shift) {
      for (const b of (keyDomMap.get('ShiftLeft') || [])) b.classList.add('km-key-hovered');
      for (const b of (keyDomMap.get('ShiftRight') || [])) b.classList.add('km-key-hovered');
    }
    if (a.ctrl) {
      for (const b of (keyDomMap.get('ControlLeft') || [])) b.classList.add('km-key-hovered');
      for (const b of (keyDomMap.get('ControlRight') || [])) b.classList.add('km-key-hovered');
      if (isMac) {
        for (const b of (keyDomMap.get('MetaLeft') || [])) b.classList.add('km-key-hovered');
      }
    }
    if (a.alt) {
      for (const b of (keyDomMap.get('AltLeft') || [])) b.classList.add('km-key-hovered');
      for (const b of (keyDomMap.get('AltRight') || [])) b.classList.add('km-key-hovered');
    }

    hintEl.textContent = `“${a.label}” · shortcut: ${formatChord(a, platform)}`;
  }

  function clearHover() {
    for (const btns of keyDomMap.values()) {
      for (const b of btns) b.classList.remove('km-key-hovered');
    }
    for (const row of rowDomMap.values()) {
      row.classList.remove('km-action-row-hovered');
    }
    hintEl.textContent = 'Tap an action, RECORD INPUT, then press its new key · hover any key to see what it does';
  }

  /* ── 6. RECORDING ENGINE & CONFLICT RESOLUTION ──────────────────────────────────────────────── */

  function startRecording(via) {
    const sel = getSelectedAction();
    if (!sel) {
      setStatus('Choose an action in the list first, then press RECORD INPUT');
      return false;
    }
    recording = true;
    pendingSteal = null;
    paintRecordBtn();
    renderActionsList();
    syncKeyboard();
    setStatus(`Listening for “${sel.label}” — press the new key with any modifiers, or Esc to cancel`);
    return true;
  }

  function cancelRecording(via) {
    if (!recording) return false;
    recording = false;
    pendingSteal = null;
    paintRecordBtn();
    renderActionsList();
    syncKeyboard();
    const sel = getSelectedAction();
    setStatus(sel ? `Cancelled · “${sel.label}” keeps its binding` : 'Recording cancelled');
    return true;
  }

  function onWindowKeyDown(e) {
    if (!isOpen) return;

    if (recording) {
      e.preventDefault();
      e.stopPropagation();

      if (e.repeat) return;
      if (e.code === 'Escape') {
        cancelRecording('escape');
        return;
      }
      // Tab must remain focus navigation in every editor, including this visual one.
      // The host's settings recorder already reserves it; this path must honor that law.
      if (e.code === 'Tab') { setStatus('Tab is reserved for focus navigation. Choose another key.', true); return; }
      // Modifier keys held down alone: keep waiting for the companion stroke
      if (MODIFIER_CODES.has(e.code)) return;

      const proposed = {
        key: e.code,
        ctrl: !!(e.ctrlKey || e.metaKey),
        alt: !!e.altKey,
        shift: !!e.shiftKey,
      };

      const sel = getSelectedAction();
      if (!sel) {
        cancelRecording('lost-selection');
        return;
      }

      // Check if proposed combination is identical to what the action already has
      if (isSameChord(sel, proposed)) {
        recording = false;
        pendingSteal = null;
        paintRecordBtn();
        renderActionsList();
        syncKeyboard();
        setStatus(`“${sel.label}” already has ${formatChord(proposed, platform)}`);
        return;
      }

      // Check for collision with another action
      const conflict = getActions().find((a) => a.id !== sel.id && isSameChord(a, proposed));
      const chordStr = formatChord(proposed, platform);

      if (conflict) {
        if (
          pendingSteal &&
          pendingSteal.actionId === sel.id &&
          pendingSteal.conflictingId === conflict.id &&
          isSameChord(pendingSteal.binding, proposed)
        ) {
          // Second identical press: confirm the steal!
          try {
            keys.bind(conflict.id, { key: null, ctrl: false, alt: false, shift: false });
          } catch (_) {}
          keys.bind(sel.id, proposed);
          recording = false;
          pendingSteal = null;
          refresh();
          setStatus(`Reassigned ${chordStr} to “${sel.label}” (stolen from “${conflict.label}”)`);
        } else {
          // First press: refuse silent theft, show collision message, require second press
          pendingSteal = {
            actionId: sel.id,
            conflictingId: conflict.id,
            binding: proposed,
          };
          setStatus(`${chordStr} is already bound to “${conflict.label}” — press again to confirm steal, or Esc to cancel`, true);
          paintRecordBtn();
        }
        return;
      }

      // No collision: bind immediately through host API
      pendingSteal = null;
      keys.bind(sel.id, proposed);
      recording = false;
      refresh();
      setStatus(`“${sel.label}” is now bound to ${chordStr}`);
      return;
    }

    // Outside recording: Escape closes the panel
    if (e.code === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  }

  function resetAll(via) {
    if (recording) cancelRecording('reset');
    pendingSteal = null;
    try {
      keys.reset();
    } catch (_) {}
    refresh();
    setStatus('Restored every keybinding back to default factory shipped settings');
  }

  /* ── 7. PUBLIC INTERFACE ────────────────────────────────────────────────────────────────────── */

  function refresh() {
    paintPlatform();
    buildKeyboardDom();
    syncKeyboard();
    renderActionsList();
    paintRecordBtn();
  }

  function open() {
    if (!root) return false;
    isOpen = true;
    root.hidden = false;
    refresh();
    const sel = getSelectedAction();
    setStatus(sel ? `“${sel.label}” selected · press RECORD INPUT to rebind` : 'Ready · tap an action or key to inspect and rebind');
    return true;
  }

  function close() {
    if (recording) cancelRecording('close');
    isOpen = false;
    clearHover();
    if (root) root.hidden = true;
    if (options.onClose) options.onClose();
    return false;
  }

  function destroy() {
    close();
    window.removeEventListener('keydown', onWindowKeyDown, { capture: true });
    if (root && root.parentNode) {
      root.parentNode.removeChild(root);
    }
    keyDomMap.clear();
    rowDomMap.clear();
    return true;
  }

  // Register outer capture listener on window
  window.addEventListener('keydown', onWindowKeyDown, { capture: true });

  // Initial paint
  paintPlatform();
  buildKeyboardDom();
  syncKeyboard();
  renderActionsList();
  paintRecordBtn();

  return {
    root,
    refresh,
    open,
    close,
    destroy,
  };
}

/* ════════════════════════════════════════════════════════════════════════════════
 * STYLESHEET SPECIFICATION FOR lab/keymap.js
 * Every class used in this module is prefixed with `km-`.  The visual design
 * contract below defines the layout, geometry, typography, and contrast rules:
 *
 * .km-panel                 - Full-panel overlay container filling the host or viewport with a deep frosted glass background (rgba(11, 15, 25, 0.94), backdrop-filter: blur(28px)), dark border, flex column.
 * .km-header                - Top title bar flex row with space-between alignment, padding 20px 24px, subtle bottom divider line rgba(255,255,255,0.08).
 * .km-header-titles         - Vertical flex container holding the dim eyebrow and bright headline with a 4px gap.
 * .km-eyebrow               - Uppercase dim letter-spaced kicker text (font-size 11px, font-weight 600, letter-spacing 0.12em, color #94a3b8).
 * .km-title                 - Prominent headline text (font-size 22px, font-weight 700, letter-spacing 0.03em, color #f8fafc).
 * .km-close                 - Round 44×44px button with centered cross glyph ('×'), border-radius 50%, glass background rgba(255,255,255,0.08), hover glow.
 * .km-columns               - Flex row container (flex: 1) dividing the screen into left keyboard column and right actions list with 24px column gap, padding 20px 24px.
 * .km-col                   - Flex column card with background rgba(255,255,255,0.02), border 1px solid rgba(255,255,255,0.06), border-radius 12px, padding 18px.
 * .km-col-left              - Left column wrapper sized to house the drawn keyboard comfortably (flex: 1.4).
 * .km-col-right             - Right column wrapper housing the scrollable action rows and count header (flex: 1.0, min-width 360px).
 * .km-col-header            - Header flex row within each column with space-between alignment and margin-bottom 14px.
 * .km-col-title             - Small-caps column section heading (font-size 11px, font-weight 700, letter-spacing 0.1em, color #94a3b8).
 * .km-platform-switch       - Two-seat segmented button switch with capsule border (border-radius 24px), background rgba(255,255,255,0.05), padding 3px.
 * .km-platform-btn          - Segmented button seat with min 44px touch target, border-radius 20px, font-size 11px, font-weight 600, padding 6px 14px, color #94a3b8.
 * .km-platform-active       - Active switch seat state with bright contrast fill (background rgba(255,255,255,0.18)), color #ffffff, box-shadow.
 * .km-legend                - Horizontal legend flex row displaying indicator dots and labels (font-size 11px, color #94a3b8, gap 12px, align-items center, margin-bottom 14px).
 * .km-legend-dot            - 7×7px circular dot indicator.
 * .km-legend-active         - Glowing emerald/cyan dot (#34d399) indicating active bound keys on the keyboard.
 * .km-legend-unbound        - Dim slate dot (#475569) indicating unbound keys.
 * .km-legend-shift-sample   - Small blue badge sample matching Shift badges (#2563eb, color #fff, border-radius 3px, padding 1px 5px, font-size 10px, font-weight 700).
 * .km-legend-text           - Caption text following legend indicator dots.
 * .km-keyboard              - Flex column holding the 5 drawn keyboard rows with a consistent 6px row gap.
 * .km-kb-row                - Flex row containing key buttons with a consistent 6px horizontal gap between keys.
 * .km-key                   - Interactive key cap button with minimum 44×44px hit area provided via a padded ::before pseudo-element, border-radius 6px, flex-column alignment.
 * .km-key-w-1               - Standard 1.0 flex unit width for alphanumeric keys.
 * .km-key-w-esc             - 1.25 flex unit width for the Escape key in row 0.
 * .km-key-w-bksp            - 1.6 flex unit width for the Backspace key in row 0.
 * .km-key-w-tab             - 1.5 flex unit width for the Tab key in row 1.
 * .km-key-w-backslash       - 1.35 flex unit width for the Backslash key in row 1.
 * .km-key-w-caps            - 1.8 flex unit width for the Caps Lock key in row 2.
 * .km-key-w-enter           - 2.05 flex unit width for the Enter key in row 2.
 * .km-key-w-lshift          - 2.2 flex unit width for the left Shift key in row 3.
 * .km-key-w-rshift          - 1.8 flex unit width for the right Shift key in row 3.
 * .km-key-w-ctrl            - 1.4 flex unit width for Control modifier keys in row 4.
 * .km-key-w-win             - 1.3 flex unit width for Windows/Meta/Command keys in row 4.
 * .km-key-w-alt             - 1.3 flex unit width for Alt/Option modifier keys in row 4.
 * .km-key-w-space           - 5.2 flex unit width for the Space bar in row 4.
 * .km-key-w-arrow           - 1.0 flex unit width for arrow navigation keys in row 4.
 * .km-key-bound             - Bound key state: raised dark keycap surface (background #1e2536, border 1px solid #3b4660, text #f8fafc).
 * .km-key-unbound           - Unbound key state: flat, dim surface (background rgba(255,255,255,0.02), border 1px solid rgba(255,255,255,0.05), text #475569).
 * .km-key-selected          - High-contrast selection outline (outline 2px solid #38bdf8, box-shadow 0 0 14px rgba(56,189,248,0.4)).
 * .km-key-hovered           - Brightened keycap background and border glow when hovered or focused.
 * .km-key-recording         - Flashing amber/red border (2px solid #f59e0b) indicating this key is actively waiting for input.
 * .km-key-top               - Flex row at the top of a key cell with space-between alignment for shift character on left and badge on right.
 * .km-key-shift-char        - Dim tiny shifted symbol (font-size 10px, opacity 0.5) in the top-left of a keycap.
 * .km-key-cap               - Large, bright primary key character (font-size 13px, font-weight 700, color #ffffff, text-align center).
 * .km-key-sub               - Tiny dim action name (font-size 9px, color #94a3b8, letter-spacing 0.02em, text-overflow ellipsis) at bottom of keycap.
 * .km-badge                 - Pill badge in top-right corner of keycap (font-size 9px, font-weight 700, padding 1px 4px, border-radius 3px).
 * .km-badge-ctrl            - Amber modifier badge (background #d97706, color #ffffff) for Control or ⌘.
 * .km-badge-shift           - Blue modifier badge (background #2563eb, color #ffffff) for Shift (⇧).
 * .km-badge-alt             - Purple modifier badge (background #7c3aed, color #ffffff) for Alt or ⌥.
 * .km-badge-combo           - Gradient or dual-tint badge for combinations requiring both Control and Shift.
 * .km-count                 - Small-caps count readout (font-size 11px, font-weight 600, color #94a3b8) in actions list header.
 * .km-list                  - Vertically scrolling container for action rows (flex: 1, overflow-y: auto, scrollbar-width: thin, gap 4px).
 * .km-action-row            - Interactive action row button (width 100%, min-height 44px, padding 8px 12px, border-radius 6px, flex row, align-items center).
 * .km-action-row-selected   - Selected row highlight: accent background (rgba(56,189,248,0.12)), bright border (1px solid #38bdf8), bright text.
 * .km-action-row-hovered    - Hovered action row background highlight (rgba(255,255,255,0.06)).
 * .km-action-row-recording  - Recording state for action row: amber background glow with pulsing highlight.
 * .km-chips                 - Horizontal flex container holding the key chips on the left of an action row (gap 4px, min-width 90px).
 * .km-chip                  - Pill-shaped key chip (padding 3px 7px, font-size 11px, font-weight 600, border-radius 4px, font-family monospace).
 * .km-chip-mod              - Modifier key chip (background rgba(255,255,255,0.1), border 1px solid rgba(255,255,255,0.18), color #e2e8f0).
 * .km-chip-key              - Main key chip (background #1e293b, border 1px solid #475569, color #ffffff, box-shadow 0 1px 2px rgba(0,0,0,0.3)).
 * .km-chip-unbound          - Dim dash placeholder for actions lacking a binding.
 * .km-chip-recording        - Flashing amber chip displaying "press a key…" during active recording.
 * .km-action-text           - Text container for action sentence and description (flex: 1, font-size 12px, text-align left, margin-left 10px).
 * .km-action-label          - Bold readable action title (font-weight 500, color #f1f5f9).
 * .km-action-sep            - Dim middot character (' · ') separating action label and description (color #64748b).
 * .km-action-desc           - Dim muted description text (color #94a3b8, font-weight 400).
 * .km-footer                - Bottom bar flex row with space-between alignment, padding 18px 24px, border-top 1px solid rgba(255,255,255,0.08).
 * .km-footer-actions        - Flex row container holding the RECORD INPUT and RESET TO DEFAULT action buttons with a 12px gap.
 * .km-btn                   - Two-line action button with 44px min height, padding 8px 18px, border-radius 8px, frosted glass background, flex-column layout.
 * .km-btn-main              - Upper bold uppercase button label (font-size 12px, font-weight 700, letter-spacing 0.05em, color #f8fafc).
 * .km-btn-sub               - Lower secondary button caption (font-size 10px, opacity 0.65, color #cbd5e1).
 * .km-btn-record            - Primary action button styling for RECORD INPUT with accent border (border 1px solid #38bdf8).
 * .km-btn-recording         - Active recording state for RECORD INPUT button: flashing red/amber border (1px solid #f59e0b) and glowing text.
 * .km-btn-reset             - Secondary action button styling for RESET TO DEFAULT with neutral frosted glass appearance.
 * .km-footer-info           - Right-aligned vertical flex container holding the status message and usage hint.
 * .km-status                - High-contrast message line for rebind confirmations, collision alerts, and recording status (font-size 12px, font-weight 600, color #38bdf8).
 * .km-status-conflict       - Amber warning text color (#fbbf24) when a key collision requires confirmation.
 * .km-hint                  - Dim usage guidance hint (font-size 11px, color #64748b, letter-spacing 0.02em).
 * ════════════════════════════════════════════════════════════════════════════════ */

