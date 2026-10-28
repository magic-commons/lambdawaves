// 020 S1/S2/S5 · a diagnostic, not a gate: what the stage text does after ONE press.
//   nice env LW_PORT=… GD_PORT=… node tools/stage-probe.mjs [info|rack|queue|seat]
// info  — the CSB INFORMATIONAL button pressed twice (off, back on): per press the re-placements, the KaTeX renders, the block's rest changes
//         (the kit layer's rx/ry), its entrances and the reversals of its motion over 2.5 s.  ONE PRESS, ONE PLACE wants ≤ 1 rest change.
// rack  — the ◧ pressed with a real pointer that then wiggles on the spot for 1.5 s: transport-peek flips, places and the words' rest changes.
// queue — MOLECULES H2O under ESP: field.queueMs / inFlight / paced and the ms from MAP ONLY to the next present that carries it (S2).
// seat  — the words' rect and the ESP bar's rect with the racks shown, hidden, peeking (S5: the same pixels).
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const mode = process.argv[2] || 'info';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT}/lab/?preset=1s%2B2pz`, { width: 1500, height: 1000, script: 120000 });
const out = (k, v) => console.log(k.padEnd(14), JSON.stringify(v));
try {
  await g.waitFor('window.__LW&&__LW.ready', 300, 100);
  await g.ev(`window.__w = (n) => new Promise((r) => setTimeout(r, n));
    window.__mol = async () => { __LW.chem.setOn(true); for (let i = 0; i < 100 && !(__LW.chem.on && __LW.chem.row()); i++) await __w(100); __LW.setStyle('esp'); await __w(1500); };
    /* per animation frame for ms: the newest block's rest and top, and the counters */
    window.__watch = (ms) => new Promise((res) => {
      const S = __LW.stageText, L = S.layer, p0 = S.stats.places, r0 = S.stats.renders, t0 = performance.now(), seen = new Set(), log = [];
      const anims = new Set(), all = new Set(document.getAnimations()); let rest = null, restChanges = 0, entrances = 0, lastTop = null, lastV = 0, reversals = 0, peeks = 0, peekWas = document.body.classList.contains('transport-peek');
      for (const b of L.root.querySelectorAll('.mir-info-block')) seen.add(b);
      const tick = () => {
        const blocks = [...L.root.querySelectorAll('.mir-info-block')], b = blocks.pop();
        for (const x of blocks.concat(b ? [b] : [])) if (!seen.has(x)) { seen.add(x); entrances++; }
        const it = (L.debug().items || []).filter((i) => i.kind !== 'label').pop();
        const k = it ? Math.round(it.rx) + ',' + Math.round(it.ry) : null; if (k !== rest) { if (rest !== null && k !== null) restChanges++; rest = k; }
        const top = b && !L.root.hidden ? b.getBoundingClientRect().top : null;
        if (top !== null && lastTop !== null) { const v = top - lastTop; if (Math.abs(v) > 0.3) { if (lastV && Math.sign(v) !== Math.sign(lastV)) reversals++; lastV = v; } }
        lastTop = top;
        for (const a of L.root.getAnimations({ subtree: true })) if (!anims.has(a)) anims.add(a);
        for (const a of document.getAnimations()) if (!all.has(a)) all.add(a);
        const pk = document.body.classList.contains('transport-peek'); if (pk !== peekWas) { peeks++; peekWas = pk; }
        if (performance.now() - t0 < ms) requestAnimationFrame(tick);
        else res({ places: S.stats.places - p0, renders: S.stats.renders - r0, restChanges, entrances, reversals, peekFlips: peeks, wordAnims: anims.size, pageAnims: all.size, animOn: [...new Set([...all].map((a) => (a.effect && a.effect.target ? (a.effect.target.id || String(a.effect.target.className).slice(0, 24)) : '?') + ':' + (a.transitionProperty || a.animationName || 'waapi')))].slice(0, 14), hidden: L.root.hidden, rest });
      };
      requestAnimationFrame(tick);
    });
    return 1;`);
  if (mode === 'info') {
    await g.ev(`await __mol(); __LW.stageText.prefs.set({ molName: true, status: true, skeleton: true, bead: true }); await __w(1500); return 1;`);
    for (const word of ['off', 'on', 'off', 'on']) {
      await g.ev(`window.__wp = __watch(2500); return 1;`); await g.tap('#transport .csb-info');
      out('INFO ' + word, await g.ev(`return await __wp;`));
    }
  } else if (mode === 'rack') {
    await g.ev(`await __w(800); return 1;`);
    const at = await g.ev(`const r = document.getElementById('rackToggle').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };`);
    for (const word of ['hide', 'show']) {
      /* to show again the pointer leaves the bar's reach and comes back (the peek re-arms), waits for the bar, then presses */
      if (word === 'show') { await drv.actions(g.s, [{ type: 'pointer', id: 'pa', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 200, origin: 'viewport', x: 750, y: 300 },
        { type: 'pointerMove', duration: 200, origin: 'viewport', x: at.x, y: at.y - 2 }, { type: 'pause', duration: 600 }] }]); await drv.relActions(g.s); }
      await g.ev(`window.__wp = __watch(2500); return 1;`);
      await drv.actions(g.s, [{ type: 'pointer', id: 'p' + word, parameters: { pointerType: 'mouse' }, actions: [
        { type: 'pointerMove', duration: 0, origin: 'viewport', x: at.x, y: at.y }, { type: 'pointerDown', button: 0 }, { type: 'pause', duration: 40 }, { type: 'pointerUp', button: 0 },
        ...Array.from({ length: 30 }, (_, i) => ({ type: 'pointerMove', duration: 50, origin: 'viewport', x: at.x + (i % 2 ? 3 : -3), y: at.y })) ] }]);
      await drv.relActions(g.s);
      out('RACK ' + word, { ...(await g.ev(`return await __wp;`)), body: await g.ev(`return document.body.className;`) });
    }
  } else if (mode === 'queue') {
    await g.ev(`await __mol(); return 1;`);
    out('paced', await g.ev(`const f = __LW.field; return { paced: f.paced, inFlight: f.inFlight, queueMs: f.queueMs };`));
    out('queue', await g.ev(`const f = __LW.field, a = []; for (let i = 0; i < 40; i++) { a.push([f.inFlight, Math.round(f.queueMs || 0)]); await __w(100); } return a;`));
    for (let k = 0; k < 4; k++) out('MAP ONLY ' + k, await g.ev(`const f = __LW.field, n0 = __LW.stats ? __LW.stats.presents : 0, t0 = performance.now(), want = !__LW.mat.espBare;
      const w = document.querySelector('.dev[data-id="observer"]'); w.classList.remove('closed', 'folded');
      const sw = [...w.querySelectorAll('.sw')].find((e) => (e.querySelector('.sw-lbl') || {}).textContent === 'MAP ONLY'); sw.querySelector('button').click();
      /* the next frame that the GPU finished after the press: onSubmittedWorkDone of a fresh submit closes the queue */
      await __w(16); await f.device.queue.onSubmittedWorkDone(); const done = performance.now() - t0;
      const fps = []; let n = 0, ts = performance.now(); await new Promise((r) => { const t = () => { n++; if (performance.now() - ts < 2000) requestAnimationFrame(t); else r(); }; requestAnimationFrame(t); });
      return { bare: __LW.mat.espBare === want, queueDrainMs: Math.round(done), inFlight: f.inFlight, queueMs: Math.round(f.queueMs || 0), rafPerS: n / 2, skeleton: !!document.querySelector('#skeleton, canvas.skeleton') };`));
  } else if (mode === 'seat') {
    await g.ev(`await __mol(); return 1;`);
    const seat = `const b = [...__LW.stageText.layer.root.querySelectorAll('.mir-info-block')].pop(), e = document.querySelector('.lw-esp-bar, .esp-bar');
      const R = (x) => { if (!x) return null; const r = x.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
      return { words: R(b), bar: R(e), body: document.body.className.split(' ').filter((c) => /rack|peek/.test(c)).join(' ') };`;
    out('shown', await g.ev(seat));
    await g.ev(`__LW.sh ? 0 : 0; document.getElementById('rackToggle').click(); await __w(1500); return 1;`);
    out('hidden', await g.ev(seat));
    await g.ev(`document.getElementById('rackToggle').click(); await __w(1500); return 1;`);
    out('back', await g.ev(seat));
  }
  out('errors', await g.ev(`return (window.__e || []).slice(0, 5);`));
} finally { await g.close(); }
