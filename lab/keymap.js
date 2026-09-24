

import { el } from './mir/kit.js';

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
  povIn: 'POV tighter',
  povOut: 'POV wider',
  dollyZoomIn: 'dolly zoom in',
  dollyZoomOut: 'dolly zoom out',
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
  redoY: 'redo',
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
  if (!spec.key) return '—';
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
  const root = el('div', 'km-panel glass', host);
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Keyboard shortcuts and bindings');
  root.setAttribute('aria-modal', 'false');

  // ── Header
  const header = el('div', 'km-header', root);
  el('span', 'km-drag-mark', header, '⠿').setAttribute('aria-hidden', 'true');
  const titles = el('div', 'km-header-titles', header);
  el('h2', 'km-title', titles, 'KEYBOARD');

  const closeBtn = el('button', 'km-close', header, '×');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close keybindings editor');
  closeBtn.addEventListener('click', () => close());

  const POSITION_KEY = 'lw.keyboard.position.v1';
  let position = null;
  try { const saved = JSON.parse(localStorage.getItem(POSITION_KEY) || 'null');
    if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) position = saved; } catch (_) {}
  function place() {
    if (root.hidden) return;
    const width = root.offsetWidth, height = root.offsetHeight;
    const x = position ? position.x : (window.innerWidth - width) / 2;
    const y = position ? position.y : (window.innerHeight - height) / 2;
    position = { x: Math.max(8, Math.min(x, Math.max(8, window.innerWidth - width - 8))),
      y: Math.max(8, Math.min(y, Math.max(8, window.innerHeight - height - 8))) };
    root.style.left = `${position.x}px`;
    root.style.top = `${position.y}px`;
    if (options.onMove) options.onMove();
  }
  let dragging = null;
  header.addEventListener('pointerdown', e => {
    if (e.button || e.target.closest('button')) return;
    e.preventDefault();
    place();
    dragging = { x: e.clientX - position.x, y: e.clientY - position.y };
    header.setPointerCapture(e.pointerId);
    root.classList.add('km-dragging');
  });
  header.addEventListener('pointermove', e => {
    if (!dragging) return;
    position = { x: e.clientX - dragging.x, y: e.clientY - dragging.y };
    place();
  });
  const stopDrag = () => {
    if (!dragging) return;
    dragging = null;
    root.classList.remove('km-dragging');
    try { localStorage.setItem(POSITION_KEY, JSON.stringify(position)); } catch (_) {}
  };
  header.addEventListener('pointerup', stopDrag);
  header.addEventListener('pointercancel', stopDrag);
  window.addEventListener('resize', place);

  // ── Two Columns
  const cols = el('div', 'km-columns', root);

  // Left Column: Keyboard Layout
  const colLeft = el('div', 'km-col km-col-left', cols);
  const leftHeader = el('div', 'km-col-header', colLeft);

  // A single low chrome row: legend first, platform marks at the far edge.
  const legend = el('div', 'km-legend', leftHeader);
  el('span', 'km-legend-dot km-legend-active', legend);
  el('span', 'km-legend-text', legend, 'Active');
  el('span', 'km-legend-dot km-legend-unbound', legend);
  el('span', 'km-legend-text', legend, 'Unbound');
  el('span', 'km-legend-shift-sample', legend, '⇧');
  el('span', 'km-legend-text', legend, 'Shift');
  el('span', 'km-legend-ctrl-sample', legend, '⌃');
  el('span', 'km-legend-text', legend, 'Ctrl / ⌘');

  const switchBox = el('div', 'km-platform-switch', leftHeader);
  const btnMac = el('button', 'km-platform-btn', switchBox);
  btnMac.type = 'button';
  btnMac.title = 'Mac / iPad';
  btnMac.setAttribute('aria-label', 'Show Mac / iPad modifier names (⌘ and ⌥)');
  el('span', 'km-os-mac', btnMac, '⌘').setAttribute('aria-hidden', 'true');
  btnMac.addEventListener('click', () => setPlatform('mac'));

  const btnWin = el('button', 'km-platform-btn', switchBox);
  btnWin.type = 'button';
  btnWin.title = 'Windows';
  btnWin.setAttribute('aria-label', 'Show Windows modifier names (Ctrl and Alt)');
  const winMark = el('span', 'km-os-windows', btnWin);
  winMark.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 4; i++) el('span', '', winMark);
  btnWin.addEventListener('click', () => setPlatform('windows'));

  // Keyboard Container
  const kbContainer = el('div', 'km-keyboard', colLeft);

  // Right Column: Actions List
  const colRight = el('div', 'km-col km-col-right', cols);
  const editorActions = el('div', 'km-editor-actions', colRight);

  const recBtn = el('button', 'km-btn km-btn-record', editorActions);
  recBtn.type = 'button';
  recBtn.setAttribute('aria-pressed', 'false');
  const recMain = el('span', 'km-btn-main', recBtn, 'RECORD INPUT');
  recBtn.addEventListener('click', () => {
    if (recording) cancelRecording('button');
    else startRecording('button');
  });

  const resetBtn = el('button', 'km-btn km-btn-reset', editorActions);
  resetBtn.type = 'button';
  el('span', 'km-btn-main', resetBtn, 'RESET TO DEFAULT');
  resetBtn.addEventListener('click', () => resetAll('button'));

  const statusEl = el('div', 'km-status', colRight, '');
  statusEl.hidden = true;

  const searchEl = el('input', 'km-search', colRight);
  searchEl.type = 'search';
  searchEl.placeholder = 'Find an action or key…';
  searchEl.setAttribute('aria-label', 'Find a keyboard action');
  searchEl.addEventListener('input', () => renderActionsList());

  const listEl = el('div', 'km-list', colRight);

  /* ── 4. DOM REPAINT & INTERACTION LOGIC ─────────────────────────────────────────────────────── */

  function setStatus(text, isConflict = false) {
    statusEl.textContent = text || '';
    statusEl.className = 'km-status' + (isConflict ? ' km-status-conflict' : '');
    statusEl.hidden = !text;
  }

  function setPlatform(p) {
    if (platform === p) return;
    platform = p;
    paintPlatform();
    refresh();
    setStatus('');
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

  function categoryOf(a) {
    if (['play','home','stepBack','stepFwd','modArm','modBar'].includes(a.id)) return 'TRANSPORT';
    if (['zoomIn','zoomOut','yawL','yawR','pitchUp','pitchDn','dollyIn','dollyOut','povIn','povOut','dollyZoomIn','dollyZoomOut','camReset'].includes(a.id)) return 'CAMERA';
    if (['axisX','axisY','axisZ','rotorBoth','rotorPlus','rotorMinus','rotorK','turnNeg','turnPos','slap','reseed'].includes(a.id)) return 'STATE';
    if (['undo','redo','redoY','historyUndo','save','saveAs'].includes(a.id)) return 'PROJECT';
    return 'WINDOWS & DISPLAY';
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
              const layers = [...new Set(matching.map(a => (a.ctrl ? (isMac ? '⌘' : '⌃') : '') + (a.alt ? '⌥' : '') + (a.shift ? '⇧' : '')))].filter(Boolean);
              if (!isSelected && layers.length > 1) {
                badge.textContent = layers.join(' · ');
                badge.classList.add('km-badge-combo');
                badge.hidden = false;
              } else if (hasCtrl && hasShift) {
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

            btn.title = matching.map(a => `${formatChord(a, platform)} · ${a.label}`).join('\n');
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

    const allActions = getActions();
    const term = searchEl.value.trim().toLowerCase();
    const order = ['TRANSPORT', 'CAMERA', 'STATE', 'WINDOWS & DISPLAY', 'PROJECT'];
    const actions = (term ? allActions.filter(a => (a.label + ' ' + formatChord(a, platform)).toLowerCase().includes(term)) : [...allActions])
      .sort((a, b) => order.indexOf(categoryOf(a)) - order.indexOf(categoryOf(b)));
    const isMac = platform === 'mac';
    let lastCategory = '';

    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      const category = categoryOf(a);
      if (category !== lastCategory) el('div', 'km-action-group', listEl, category);
      lastCategory = category;
      const isSel = a.id === selectedActionId;

      const row = el('button', 'km-action-row' + (isSel ? ' km-action-row-selected' : ''), listEl);
      row.type = 'button';
      row.dataset.id = a.id;
      row.setAttribute('aria-selected', isSel ? 'true' : 'false');

      if (isSel && recording) {
        row.classList.add('km-action-row-recording');
      }

      // The action names form one aligned column; chords form the centered right column.
      const textWrap = el('span', 'km-action-text', row);
      const shortName = deriveShortName(a);
      el('span', 'km-action-label', textWrap, shortName.toUpperCase());
      if (a.label.toLowerCase() !== shortName.toLowerCase()) el('span', 'km-action-desc', textWrap, a.label);
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
    recBtn.classList.toggle('km-btn-recording', recording);
    recBtn.setAttribute('aria-pressed', recording ? 'true' : 'false');
    recMain.textContent = recording ? 'LISTENING…' : 'RECORD INPUT';
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
      setStatus('');
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

  }

  function clearHover() {
    for (const btns of keyDomMap.values()) {
      for (const b of btns) b.classList.remove('km-key-hovered');
    }
    for (const row of rowDomMap.values()) {
      row.classList.remove('km-action-row-hovered');
    }
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
      const conflict = keys.conflicts(sel.id, proposed)[0];
      const chordStr = formatChord(proposed, platform);

      if (conflict) {
        if (
          pendingSteal &&
          pendingSteal.actionId === sel.id &&
          pendingSteal.conflictingId === conflict.id &&
          isSameChord(pendingSteal.binding, proposed)
        ) {
          // Second identical press: confirm the steal!
          const result = keys.bind(sel.id, proposed, { steal: true });
          if (!result.ok) { setStatus(result.reason, true); return; }
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
      const result = keys.bind(sel.id, proposed);
      if (!result.ok) { setStatus(result.reason, true); return; }
      recording = false;
      refresh();
      setStatus(`“${sel.label}” is now bound to ${chordStr}`);
      return;
    }

    // Outside recording: Escape closes the panel
    if (e.code === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (document.activeElement === searchEl && searchEl.value) { searchEl.value = ''; renderActionsList(); }
      else close();
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
    place();
    refresh();
    const sel = getSelectedAction();
    setStatus('');
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
    window.removeEventListener('resize', place);
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
