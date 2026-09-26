/* sh.mjs — wave 130's copy of lane N's MIR stylehash driver (port 8747, /tmp/lw130-sh): every window open (the rack reset + unfolded, the hidden legacy card shown,
 * the modulation window, the notebook, the keyboard editor), both themes × card × frost, CONNECTED or DISCONNECTED.
 *   node research/optimization-2026-09-24/probes/N/sh.mjs capture <name> [disc|conn|boot:<path>] [states]
 *   node research/optimization-2026-09-24/probes/N/sh.mjs compare <before> <after> <noise>
 * Serves from http://127.0.0.1:${SH_PORT||8796} (a plain static server over the worktree: 127.0.0.1 is a secure
 * context, so WebGPU is offered; Chromium would refuse the gate server's self-signed TLS). Out dir /tmp/lwN-sh. */
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const TOOL = path.join(os.homedir(), 'Documents/MIR/tools/stylehash.mjs');
const OUT = process.env.SH_OUT || '/tmp/lw130-sh';
const PORT = process.env.SH_PORT || '8747';
const [cmd, a, b, c] = process.argv.slice(2);
const setup = (disc) => `(async () => { try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
  __LW.pause(); __LW.scrub(0); __LW.setDisconnected(${disc});
  __LW.layout.resetLayout();
  for (const d of document.querySelectorAll('.dev')) { d.hidden = false; d.classList.remove('closed'); }
  try { __LW.mod.expand(); } catch (_) {}
  try { __LW.layout.notebook.open('notes'); } catch (_) {}
  try { __LW.layout.keymap.open(); } catch (_) {}
  for (const d of document.querySelectorAll('.dev.lean')) { const x = d.querySelector('.dev-lean'); if (x) x.click(); }
  for (const p of document.querySelectorAll('.settings-page, .camera-export-details, .shadow-details')) p.hidden = false;
  try { const t = document.querySelector('.tempo-expand'); if (t) t.click(); } catch (_) {}
  try { __LW.layout.menu.open(); const b = document.querySelector('#menubar .mb-btn'); if (b) b.click(); } catch (_) {}
  await __LW.settle(); await __LW.settle(); return true; })()`;
let r;
if (cmd === 'capture') {
  /* mode `boot:<path>` — a FIRST VISIT as it boots (nothing opened; the warning dismissed, the clock paused), served from
     <path> (e.g. research/…/probes/N/lab-n8-before/) — the boot-order items' view; `disc` / `conn` — every window open */
  const boot = (b || '').startsWith('boot:'), disc = (b || 'disc') === 'disc';
  const where = boot ? b.slice(5) : 'lab/';
  const args = [TOOL, 'capture', a, `http://127.0.0.1:${PORT}/${where}?preset=1s%2B2pz&sw=0`, OUT,
    '--ready', '!!(window.__LW && __LW.ready && __LW.field.ok)', '--setup', boot ? "(async () => { try { __LW.warning.dismiss(); } catch (_) {} __LW.pause(); __LW.scrub(0); await __LW.settle(); await __LW.settle(); return true; })()" : setup(disc),
    '--theme', '__LW.setTheme(%s)', '--card', '__LW.setCardStyle(%s)', '--frost', "__LW.setFrost(%s ? 'always' : 'off')",
    '--gpu', '1', '--size', '1600x1000'];
  if (c) args.push('--states', c);
  r = spawnSync(process.execPath, args, { stdio: 'inherit' });
} else if (cmd === 'compare') {
  r = spawnSync(process.execPath, [TOOL, 'compare', OUT, a, b, ...(c ? ['--noise', c] : [])], { stdio: 'inherit' });
} else { console.error('usage: sh.mjs capture <name> [disc|conn] [states] | compare <before> <after> [noise]'); process.exit(2); }
process.exit(r.status || 0);
