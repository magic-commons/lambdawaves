/* a probe kind for chain W's checks before the real kinds exist (loaded by a <script type="module" src> so it shares the page's module map) */
import { registerKind } from '/lab/widgets.js';
registerKind({ kind: 'probe', label: 'PROBE', glyph: 'molecule', size: { w: 0.1, h: 0.1 }, mount: (el) => { el.textContent = 'P'; return {}; } });
window.__probeKind = true;
