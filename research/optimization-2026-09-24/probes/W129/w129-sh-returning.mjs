/* w129-sh-returning.mjs — MIR stylehash for a RETURNING desktop user: the page is booted once, a stored settings key is
 * written (compact furniture, a closed list with MOLECULES and MO-REGISTRY closed, a remembered notebook size, its own
 * theme/card/frost/accent), and the page is reloaded before anything is captured; the notebook is then opened so its
 * remembered size is in the picture.  Served over plain HTTP on 127.0.0.1 (a secure context; Chromium refuses the gate
 * server's self-signed TLS), as probes/N/sh.mjs does.
 *   node research/optimization-2026-09-24/probes/W129/w129-sh-returning.mjs capture <name> <path-under-server>
 *   node research/optimization-2026-09-24/probes/W129/w129-sh-returning.mjs compare <before> <after> <noise>
 * SH_PORT (default 18744), SH_OUT (default /tmp/w129-sh-out). */
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const TOOL = path.join(os.homedir(), 'Documents/MIR/tools/stylehash.mjs');
const OUT = process.env.SH_OUT || '/tmp/w129-sh-out', PORT = process.env.SH_PORT || '18744';
const CLOSED = ['transport', 'orbit', 'vortex', 'dynamics', 'slice', 'qcd', 'molecule', 'helium', 'h2', 'chem', 'orbitals', 'calculus', 'meters', 'ladder', 'atoms', 'field', 'wigner', 'radiation', 'history'];
const SETTINGS = { warned: true, nativeLayout: 1, closed: CLOSED, nbW: 500, nbH: 400, abW: 470, abH: 670, theme: 'dark', card: 'tinted', cardSet: true, frost: 'still', accent: [40, 250, 0.5], friction: 0.8, spin: 0.6 };
const READY = `(() => { if (!localStorage.getItem('w129-returning')) { localStorage.setItem('lambdawaves.q0.settings', ${JSON.stringify(JSON.stringify(SETTINGS))}); localStorage.setItem('w129-returning', '1'); location.reload(); return false; } return !!(window.__LW && __LW.ready && __LW.field.ok); })()`;
const SETUP = `(async () => { try { __LW.warning.dismiss(); } catch (_) {} __LW.pause(); __LW.scrub(0); try { __LW.layout.notebook.open('notes'); } catch (_) {} for (let i = 0; i < 2; i++) { try { await __LW.settle(); } catch (_) { await new Promise((r) => setTimeout(r, 1000)); } } return true; })()`;   /* a settle that times out on a busy shared GPU is retried, not fatal */
const [cmd, a, b, c] = process.argv.slice(2);
let r;
if (cmd === 'capture') r = spawnSync(process.execPath, [TOOL, 'capture', a, `http://127.0.0.1:${PORT}/${b}?preset=1s%2B2pz&sw=0`, OUT, '--ready', READY, '--setup', SETUP,
  '--theme', '__LW.setTheme(%s)', '--card', '__LW.setCardStyle(%s)', '--frost', "__LW.setFrost(%s ? 'always' : 'off')", '--gpu', '1', '--size', '1600x1000'], { stdio: 'inherit' });
else if (cmd === 'compare') r = spawnSync(process.execPath, [TOOL, 'compare', OUT, a, b, ...(c ? ['--noise', c] : [])], { stdio: 'inherit' });
else { console.error('usage: capture <name> <path> | compare <before> <after> [noise]'); process.exit(2); }
process.exit(r.status || 0);
