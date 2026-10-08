/* tests/helpers/dom-shim.mjs — the smallest DOM a kit control is built in under node (0.5.0 A10): elements are EventTargets
 * with attributes, a class list, a style that takes any property, children and a parent; nothing is laid out or painted.
 * It exists so a node suite can READ what a control renders (its role, its aria-valuetext) instead of regexing kit source. */
class ClassList {
  constructor() { this.s = new Set(); }
  add(...c) { for (const x of c) this.s.add(x); } remove(...c) { for (const x of c) this.s.delete(x); }
  contains(c) { return this.s.has(c); } toggle(c, on) { const v = on === undefined ? !this.s.has(c) : !!on; if (v) this.s.add(c); else this.s.delete(c); return v; }
  get value() { return [...this.s].join(' '); } [Symbol.iterator]() { return this.s[Symbol.iterator](); }
}
export class El extends EventTarget {
  constructor(tag) {
    super(); this.tagName = String(tag).toUpperCase(); this.nodeType = 1; this.attrs = new Map(); this.children = []; this.parentNode = null;
    this.classList = new ClassList(); this._text = '';
    const props = new Map();
    this.style = new Proxy({ setProperty: (k, v) => props.set(k, String(v)), removeProperty: (k) => props.delete(k), getPropertyValue: (k) => props.get(k) || '' },
      { get: (t, k) => (k in t ? t[k] : props.get(k) || ''), set: (t, k, v) => { props.set(k, String(v)); return true; } });
    const self = this;
    this.dataset = new Proxy({}, { get: (_, k) => self.getAttribute('data-' + String(k).replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())) ?? undefined,
      set: (_, k, v) => { self.setAttribute('data-' + String(k).replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()), v); return true; } });
  }
  get className() { return this.classList.value; } set className(v) { this.classList = new ClassList(); this.classList.add(...String(v).split(/\s+/).filter(Boolean)); }
  get parentElement() { return this.parentNode; }
  get firstChild() { return this.children[0] || null; } get lastChild() { return this.children[this.children.length - 1] || null; }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(''); }
  set textContent(v) { this.children = []; this._text = String(v ?? ''); }
  get innerHTML() { return this.textContent; } set innerHTML(v) { this.textContent = String(v).replace(/<[^>]*>/g, ''); }
  setAttribute(k, v) { this.attrs.set(k, String(v)); if (k === 'class') this.className = v; }
  getAttribute(k) { return this.attrs.has(k) ? this.attrs.get(k) : null; }
  hasAttribute(k) { return this.attrs.has(k); } removeAttribute(k) { this.attrs.delete(k); }
  toggleAttribute(k, on) { const v = on === undefined ? !this.attrs.has(k) : !!on; if (v) this.attrs.set(k, ''); else this.attrs.delete(k); return v; }
  appendChild(c) { if (c.parentNode) c.remove(); c.parentNode = this; this.children.push(c); return c; }
  append(...cs) { for (const c of cs) this.appendChild(typeof c === 'string' ? Object.assign(new El('#text'), { _text: c }) : c); }
  prepend(...cs) { for (const c of cs.reverse()) { if (c.parentNode) c.remove(); c.parentNode = this; this.children.unshift(c); } }
  insertBefore(c, ref) { if (!ref) return this.appendChild(c); if (c.parentNode) c.remove(); c.parentNode = this; this.children.splice(Math.max(0, this.children.indexOf(ref)), 0, c); return c; }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; return c; }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  contains(n) { for (let x = n; x; x = x.parentNode) if (x === this) return true; return false; }
  closest() { return null; } querySelector() { return null; } querySelectorAll() { return []; } matches() { return false; }
  getBoundingClientRect() { return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 }; }
  focus() { globalThis.document.activeElement = this; } blur() { if (globalThis.document.activeElement === this) globalThis.document.activeElement = globalThis.document.body; }
  setPointerCapture() {} releasePointerCapture() {} hasPointerCapture() { return false; } animate() { return { cancel() {}, finished: Promise.resolve() }; }
  get offsetWidth() { return 0; } get offsetHeight() { return 0; } get clientWidth() { return 0; } get clientHeight() { return 0; }
}
/** install() → the document: a body and an html element, createElement / createElementNS / createTextNode, and the few
 *  window members a control's builder touches (matchMedia never matches; animation frames never fire). */
export function install() {
  const document = Object.assign(new EventTarget(), {
    createElement: (t) => new El(t), createElementNS: (_, t) => new El(t), createTextNode: (s) => Object.assign(new El('#text'), { _text: String(s) }),
    documentElement: new El('html'), body: new El('body'), head: new El('head'),
    querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, hidden: false, visibilityState: 'visible',
  });
  document.activeElement = document.body;
  Object.assign(globalThis, { document, HTMLElement: El, Element: El, Node: El,
    window: globalThis.window || globalThis, getComputedStyle: () => new Proxy({}, { get: () => '' }),
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {} });
  if (!globalThis.matchMedia) globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  if (!globalThis.localStorage) { const m = new Map(); globalThis.localStorage = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear() }; }
  return document;
}
