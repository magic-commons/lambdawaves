/* research/iteration-011/q4-shots/shoot.mjs — Q4's proof shots (THE LIBRARY OWNS THE INSTALLS), headless Firefox through tools/gate/gatekit.
 *   LW_PORT=9431 GD_PORT=5431 node research/iteration-011/q4-shots/shoot.mjs deck <tag> <width> <height>   the MOLECULAR deck, the page(s) holding LATTICE / HEAVY
 *   LW_PORT=9431 GD_PORT=5431 node research/iteration-011/q4-shots/shoot.mjs library                        the LIBRARY: uninstalled · mid-download · installed · two-press REMOVE
 *   LW_PORT=9431 GD_PORT=5431 node research/iteration-011/q4-shots/shoot.mjs carry-old    (no server running: it serves the old tree, then this one)
 *     LATTICE installed through the OLD build's heading tile, the server swapped to this build on the same origin, the LIBRARY read */
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { open } from '../../../tools/gate/gatekit.mjs';
import { go } from '../../../tools/gate/drv.mjs';

const [mode = 'deck', tag = 'after', W = '1500', H = '1000'] = process.argv.slice(2);
const LAB = `https://127.0.0.1:${process.env.LW_PORT || 9431}/lab/`, OUT = new URL('./', import.meta.url).pathname;
const w8 = (n) => new Promise((r) => setTimeout(r, n));
const shot = async (g, name) => { writeFileSync(OUT + name + '.png', Buffer.from(await g.snap(), 'base64')); console.log('shot ' + name); };
/* carry-old serves the OLD tree (.tmp/base, fb91c44's lab/) itself, then THIS tree on the same port — the same origin, the same profile */
const ROOT = new URL('../../../', import.meta.url).pathname, serve = (dir) => spawn('python3', [ROOT + 'tools/gate/server.py', dir, String(process.env.LW_PORT || 9431)], { stdio: 'ignore' });
let srv = mode === 'carry-old' ? serve(ROOT + '.tmp/base') : null; if (srv) await w8(2500);
const g = await open(LAB, { width: +W, height: +H, script: 240000,
  prefs: { 'dom.storageManager.prompt.testing': true, 'dom.storageManager.prompt.testing.allow': true } });
const HELP = `window.__w = (n) => new Promise((r) => setTimeout(r, n));
  window.__open = async (tab) => { const m = document.getElementById('lwMenu'); if (m.hidden) document.getElementById('lwHome').click(); await __w(400);
    const t = [...m.querySelectorAll('.mm-tab')].find((b) => b.textContent === tab); t.click(); await __w(1600); return 1; };
  window.__card = (sec) => { const c = document.querySelector('#lwMenu .mm-scard[data-section="' + sec + '"]'); const b = c && c.querySelector('.mm-sinstall');
    return c ? { meta: c.querySelector('.mm-vol-meta').textContent, word: b ? b.querySelector('.mm-install-word').textContent : null, state: b ? b.dataset.state : null } : null; };
  return 1;`;
async function boot() {
  if (!(await g.waitFor('window.__LW&&__LW.ready', 400, 100)).ok) throw new Error('no LW.ready');
  await g.ev(HELP); await g.ev('await __LW.settle(); return 1;').catch(() => 0);
}
try {
  if (mode === 'deck') {
    await boot(); await g.ev(`await __open('MOLECULAR'); return 1;`);
    /* every page whose tiles hold a LATTICE or HEAVY molecule (Li4F4 … C60, KrF2 …) — Josh's screenshot was such a page */
    const pages = await g.ev(`const d = [...document.querySelectorAll('#lwMenu .mm-molecular .mm-dot')]; return d.length || 1;`);
    let k = 0;
    for (let i = 0; i < pages; i++) {
      const r = await g.ev(`const d = [...document.querySelectorAll('#lwMenu .mm-molecular .mm-dot')]; if (d[${i}]) d[${i}].click(); await __w(1400);
        const ps = [...document.querySelectorAll('#lwMenu .mm-molecular .mm-page')], p = ps[${i}] || ps[0];
        const tiles = [...p.children]; return { n: tiles.length, heads: tiles.filter((t) => t.classList.contains('mm-shead')).length, away: tiles.filter((t) => t.classList.contains('away')).length,
          names: tiles.map((t) => (t.querySelector('.mm-under') || {}).textContent || (t.querySelector('.mm-shead-n') || {}).textContent).join(', ') };`);
      console.log(`page ${i + 1}/${pages}: ${r.n} tiles, ${r.heads} heading tiles, ${r.away} wearing the download glyph — ${r.names}`);
      if (r.heads || r.away || i === pages - 1) { await shot(g, `deck-${tag}-${W}-p${i + 1}`); k++; }
    }
  } else if (mode === 'library') {
    await boot();
    await g.ev(`for (const k of await caches.keys()) if (k === 'lw-data-v1') await caches.delete(k); return 1;`);
    /* HEAVY kept through the card's road (__LW.chem.keep, unchanged), so the LIBRARY reads one installed section */
    console.log(JSON.stringify(await g.ev(`__LW.chem.section('HEAVY'); return await __LW.chem.keep(true);`)));
    await g.ev(`await __open('LIBRARY'); if (innerWidth < 700) { document.querySelector('#lwMenu .mm-scard[data-section="LATTICE"]').scrollIntoView({ block: 'center' }); await __w(900); } return 1;`);
    console.log('A', JSON.stringify(await g.ev(`return { BIO: __card('BIO'), LATTICE: __card('LATTICE'), HEAVY: __card('HEAVY'), dev: document.querySelector('#lwMenu .mm-dev').textContent };`)));
    await shot(g, `library-${W}-a-heavy-installed`);
    /* LATTICE pressed with every record fetch held 1.5 s: n / N · CANCEL and the ring mid-way */
    await g.ev(`window.__real = window.fetch; window.fetch = async (u, o) => { if (/\\/library\\//.test(String(u && u.url || u))) await __w(1500); return __real(u, o); }; return 1;`);
    await g.tap('#lwMenu .mm-scard[data-section="LATTICE"] .mm-sinstall');
    await w8(3400);
    console.log('B', JSON.stringify(await g.ev(`return { LATTICE: __card('LATTICE'), HEAVY: __card('HEAVY'), BIO: __card('BIO') };`)));
    await shot(g, `library-${W}-b-lattice-mid-download`);
    await g.tap('#lwMenu .mm-scard[data-section="HEAVY"] .mm-sinstall'); await w8(300);
    console.log('C', JSON.stringify(await g.ev(`return { HEAVY: __card('HEAVY') };`)));
    await shot(g, `library-${W}-c-heavy-remove-armed`);
    await g.tap('#lwMenu .mm-scard[data-section="HEAVY"] .mm-sinstall');
    await g.waitFor(`__card('LATTICE').state === 'installed' && __card('HEAVY').state === 'absent'`, 300, 100);
    await g.ev(`window.fetch = __real; await __w(600); return 1;`);
    console.log('D', JSON.stringify(await g.ev(`return { LATTICE: __card('LATTICE'), HEAVY: __card('HEAVY'), dev: document.querySelector('#lwMenu .mm-dev').textContent, lamp: __LW.chem.section('LATTICE') };`)));
    await shot(g, `library-${W}-d-heavy-removed-lattice-installed`);
    /* the deck reads the store again: LATTICE's molecules lose the glyph, HEAVY's wear it */
    console.log('E', JSON.stringify(await g.ev(`await __open('MOLECULAR'); await __w(800); const t = [...document.querySelectorAll('#lwMenu .mm-molecular .mm-mol')];
      return { away: t.filter((x) => x.classList.contains('away')).map((x) => x.querySelector('.mm-under').textContent) };`)));
    console.log('errors', JSON.stringify(await g.errors()));
  } else if (mode === 'shelf') {
    /* the volume shelf as it stands (before / after): and a volume entered hides RECORDS and THIS DEVICE, ‹ LIBRARY brings them back */
    await boot(); await g.ev(`await __open('LIBRARY'); await __w(800); return 1;`);
    await shot(g, `shelf-${tag}-${W}`);
    console.log(JSON.stringify(await g.ev(`const vis = (s) => { const e = document.querySelector(s); return !!e && !e.hidden; };
      document.querySelector('#lwMenu .mm-vol-open').click(); await __w(1500); const inside = { cat: vis('#lwMenu .mm-cat'), dev: vis('#lwMenu .mm-dev'), view: vis('#lwMenu .mm-volview'), tiles: document.querySelectorAll('#lwMenu .mm-volview .mm-mol').length };
      document.querySelector('#lwMenu .mm-back').click(); await __w(1200); return { inside, back: { cat: vis('#lwMenu .mm-cat'), dev: vis('#lwMenu .mm-dev'), shelf: vis('#lwMenu .mm-shelf') } };`)));
  } else if (mode === 'carry-old') {
    /* the OLD build (fb91c44): LATTICE installed through its MOLECULAR deck's heading tile — the press Josh's screenshot shows */
    await boot();
    await g.ev(`for (const k of await caches.keys()) if (k === 'lw-data-v1') await caches.delete(k); await __open('MOLECULAR'); return 1;`);
    for (let i = 0; i < 8; i++) {
      const hit = await g.ev(`const h = [...document.querySelectorAll('#lwMenu .mm-shead')].find((x) => x.querySelector('.mm-shead-n').textContent === 'LATTICE');
        if (h && h.getBoundingClientRect().width && h.closest('.mm-page').getBoundingClientRect().left >= 0 && h.getBoundingClientRect().left < innerWidth) return 1;
        const d = [...document.querySelectorAll('#lwMenu .mm-molecular .mm-dot')]; if (d[${i}]) d[${i}].click(); await __w(1200); return 0;`);
      if (hit) break;
    }
    await g.ev(`const h = [...document.querySelectorAll('#lwMenu .mm-shead')].find((x) => x.querySelector('.mm-shead-n').textContent === 'LATTICE'); h.querySelector('.mm-sinstall').click(); return 1;`);
    const r = await g.waitFor(`[...document.querySelectorAll('#lwMenu .mm-shead')].some((x) => x.querySelector('.mm-shead-n').textContent === 'LATTICE' && x.querySelector('.mm-sinstall').dataset.state === 'installed')`, 300, 100);
    console.log('old build: LATTICE installed by its heading tile', r.ok, JSON.stringify(await g.ev(`return __LW.chem.section('LATTICE');`)));
    await shot(g, 'carry-1-old-build-lattice-installed');
    /* a new build: the old service worker and its precache go (a real update replaces them); lw-data-v1 and lw-vol-* are kept, as every build keeps them */
    console.log('caches', JSON.stringify(await g.ev(`for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
      for (const k of await caches.keys()) if (k !== 'lw-data-v1' && !/^lw-vol-/.test(k)) await caches.delete(k); return await caches.keys();`)));
    srv.kill(); await w8(800); srv = serve(ROOT); await w8(2500);   // the same port, this build
    for (let k = 0; k < 6; k++) { await w8(1200); await go(g.s, 'about:blank'); await w8(400); await go(g.s, LAB); if ((await g.waitFor('window.__LW&&__LW.ready', 400, 100)).ok) break; }
    await g.armErrors(); await g.ev(HELP);
    const v = await g.ev(`const b = !!document.querySelector('#lwMenu .mm-shead'); await __open('LIBRARY'); await __w(1200);
      return { newBuild: !!document.querySelector('#lwMenu .mm-cat'), headTilesLeft: !b, LATTICE: __card('LATTICE'), section: __LW.chem.section('LATTICE'), caches: await caches.keys() };`);
    console.log('new build:', JSON.stringify(v));
    await shot(g, 'carry-2-new-build-lattice-still-installed');
  }
} catch (e) { console.error('FAIL', e && e.stack || e); process.exitCode = 1; }
finally { await g.close(); if (srv) srv.kill(); }
