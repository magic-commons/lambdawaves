/* tools/gemma/replay.mjs — THE FIRST PROTOTYPE (0.6.6 G3): Gemma's job without Gemma.  A canned verb list goes to the page through
 * `__LW.verbs.run(list, { who: 'REPLAY' })` — the same road the ASK box takes with her answer — and the stage is photographed.  If the
 * verbs can build it headless, the model only has to emit the JSON.
 *
 *   node tools/gemma/replay.mjs [--port 9351] [--list benzene.json] [--out .tmp/gemma-replay.png]
 *
 * --port   the served tree (https://127.0.0.1:<port>/lab/); when nothing answers there, this tool serves the repo itself with
 *          tools/gate/server.py on that port and stops it by pid at the end
 * --list   a JSON file: [{ "verb": "molecule", "args": { "id": "C6H6" } }, …] (the broker's `verbs` shape); default = benzene from NEW
 * GD_PORT  the geckodriver port (default 4451 here, so a gate on 4444 is never touched)
 * Exit 0 = the list ran and the picture was taken; 2 = the page has no verb table (G1's lab/verbs.js has not landed in this tree). */
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import https from 'node:https';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const PORT = Number(arg('--port', 9351));
const OUT = resolve(ROOT, arg('--out', '.tmp/gemma-replay.png'));
process.env.GD_PORT = process.env.GD_PORT || '4451';            // gatekit's snap() reads it; set before the kit is imported
const { open } = await import('../gate/gatekit.mjs');

const BENZENE = [
  { verb: 'new', args: {} },
  { verb: 'molecule', args: { id: 'C6H6' } },
  { verb: 'view', args: { id: 'density' } },
  { verb: 'camera', args: { pitch: 0.5, autoRotate: true } },
  { verb: 'say', args: { md: 'Benzene: six carbons in a ring, the density is the sum of 21 occupied orbitals.' } },
  { verb: 'notebook', args: { md: '## Benzene\nSix carbons and six hydrogens in a plane, 42 electrons in 21 doubly occupied orbitals (RHF/STO-3G). The ring of density is what the π system shares.' } },
];
const LIST = arg('--list') ? JSON.parse(readFileSync(resolve(arg('--list')), 'utf8')) : BENZENE;

const answers = () => new Promise((res) => {
  const r = https.get({ host: '127.0.0.1', port: PORT, path: '/lab/', rejectUnauthorized: false, timeout: 2000 }, (x) => { x.resume(); res(x.statusCode === 200); });
  r.on('error', () => res(false)); r.on('timeout', () => { r.destroy(); res(false); });
});
let server = null;
if (!(await answers())) {
  server = spawn('python3', [join(ROOT, 'tools/gate/server.py'), ROOT, String(PORT)], { stdio: 'ignore' });
  for (let i = 0; i < 40 && !(await answers()); i++) await new Promise((r) => setTimeout(r, 250));
  console.log(`served ${ROOT} on ${PORT} (pid ${server.pid}, stopped at the end)`);
}

let code = 0, g = null;
try {
  g = await open(`https://127.0.0.1:${PORT}/lab/`, { width: 1500, height: 1000, script: 300000 });
  if ((await g.waitFor('window.__LW&&__LW.ready', 600, 100)).ok !== 1) throw new Error('the lab never became ready');
  const has = await g.ev(`return !!(window.__LW && __LW.verbs && typeof __LW.verbs.run === 'function' && typeof __LW.verbs.inventory === 'function');`);
  if (!has) { console.log('RED   the verb table is not here — __LW.verbs.run is missing (G1 lands lab/verbs.js; run this after the merge)'); code = 2; }
  else {
    const ran = await g.ev(`window.confirm = () => true;
      const r = await __LW.verbs.run(${JSON.stringify(LIST)}, { who: 'REPLAY' });
      const w = (n) => new Promise((ok) => setTimeout(ok, n));
      /* a molecule in the list: wait for its solve to land and own the field, then for the frame to settle */
      if (${JSON.stringify(LIST.some((v) => v.verb === 'molecule'))}) { let st = __LW.chem.state();
        for (let i = 0; i < 900 && !(st.on && st.fieldOwner && st.nocc); i++) { await w(100); st = __LW.chem.state(); } }
      if (__LW.settle) await __LW.settle(); await w(1500);
      return { result: r === undefined ? null : JSON.parse(JSON.stringify(r)), errors: window.__e || [] };`);
    console.log('run →', JSON.stringify(ran, null, 1).slice(0, 2000));
    const png = await g.snap();
    mkdirSync(dirname(OUT), { recursive: true }); writeFileSync(OUT, Buffer.from(png, 'base64'));
    console.log('stage →', OUT);
    const inv = await g.ev('return __LW.verbs.inventory();');
    console.log('inventory →', JSON.stringify(inv, null, 1));
    if (ran && ran.E) { console.log('RED   the run threw: ' + ran.E); code = 1; }
  }
} catch (e) { console.log('RED   ' + (e && e.message || e)); code = 1; }
finally {
  if (g) await g.close();
  if (server) server.kill();
}
process.exit(code);
