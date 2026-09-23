/* One binding law for the keyboard window, saved overrides and the dispatcher. */
const MODIFIER_CODES = new Set(['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight',
  'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight']);

export function normalizeBinding(action, spec = {}) {
  return {
    key: Object.hasOwn(spec, 'key') ? spec.key : action.key,
    ctrl: Object.hasOwn(spec, 'ctrl') ? !!spec.ctrl : !!action.ctrl,
    alt: Object.hasOwn(spec, 'alt') ? !!spec.alt : !!action.alt,
    shift: Object.hasOwn(spec, 'shift') ? (spec.shift === undefined ? undefined : !!spec.shift) : action.shift,
  };
}

export function bindingOverlap(a, b) {
  return !!a.key && a.key === b.key && !!a.ctrl === !!b.ctrl && !!a.alt === !!b.alt &&
    (a.shift === undefined || b.shift === undefined || !!a.shift === !!b.shift);
}

export function bindingError(action, binding) {
  if (binding.key === null) return null; // An action displaced by an explicit steal is visibly unbound.
  if (!binding.key || MODIFIER_CODES.has(binding.key)) return 'Choose a non-modifier key.';
  if (binding.key === 'Escape') return 'Escape is reserved for closing windows.';
  if (binding.key === 'Tab' && !action.stage) return 'Tab is reserved for focus navigation.';
  if (action.stage && binding.key !== 'Tab') return 'Window cycling is only available on Tab from the stage.';
  return null;
}

export function bindingConflicts(actions, id, binding) {
  return actions.filter(a => a.id !== id && bindingOverlap(a, binding));
}

export function bindAction(actions, id, spec, options = {}) {
  const action = actions.find(a => a.id === id);
  if (!action) return { ok: false, reason: 'Unknown action.' };
  const binding = normalizeBinding(action, spec);
  const reason = bindingError(action, binding);
  if (reason) return { ok: false, reason };
  const conflicts = bindingConflicts(actions, id, binding);
  if (conflicts.length && !options.steal) return { ok: false, conflicts: conflicts.map(a => a.id), reason: 'Shortcut already assigned.' };
  if (options.steal) for (const other of conflicts) other.key = null;
  Object.assign(action, binding);
  return { ok: true, conflicts: conflicts.map(a => a.id) };
}
