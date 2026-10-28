// 020 S1/S2/S5 · a diagnostic, not a gate: what the stage text does after ONE press.
//   nice env LW_PORT=… GD_PORT=… node tools/stage-probe.mjs [info|rack|queue|seat]
// info  — the CSB INFORMATIONAL button pressed twice (off, back on): per press the re-placements, the KaTeX renders, the block's rest changes
//         (the kit layer's rx/ry), its entrances and the reversals of its motion over 2.5 s.  ONE PRESS, ONE PLACE wants ≤ 1 rest change.
// rack  — the ◧ pressed with a real pointer that then wiggles on the spot for 1.5 s: transport-peek flips, places and the words' rest changes.
// queue — MOLECULES H2O under ESP: field.queueMs / inFlight / paced and the ms from MAP ONLY to the next present that carries it (S2).
// seat  — the words' rect and the ESP bar's rect with the racks shown, hidden, peeking (S5: the same pixels).
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';
import { writeFileSync } from 'node:fs';
/* a picture: the driver's composite, the PNG to /tmp/s-shot-<name>.png and the crop box printed (S-BUILD's pictures are cut from it) */
const shot = async (name, box) => { writeFileSync(`/tmp/s-shot-${name}.png`, Buffer.from(await g.snap(), 'base64')); console.log('shot'.padEnd(14), name, JSON.stringify(box || null)); };

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
    /* the backlog in ms: a fresh onSubmittedWorkDone's wait (Firefox answers on its ~100 ms poll, so ≈100 is an empty queue); the fps the
       field presented; and MAP ONLY → its frame done, while playing (the field presents every frame) */
    const N = process.argv[3] || '64';
    await g.ev(`await __mol(); __LW.quality.res = ${N}; __LW.quality.steps = ${process.argv[4] || 160}; __LW.quality.auto = false; __LW.quality.scale = ${process.argv[5] || 1}; __LW.schedule(4); await __w(2500); return 1;`);
    const res = await g.ev(`const f = __LW.field; return { paced: f.paced, res: f.resolution, canvas: [f.canvas ? f.canvas.width : 0] };`);
    out('field', res);
    for (const play of [false, true]) {
      out(play ? 'PLAYING' : 'IDLE', await g.ev(`const f = __LW.field, q = f.device.queue; if (__LW.clock.playing !== ${play}) __LW.togglePlay(); await __w(1500);
        const wait = async () => { const t = performance.now(); await q.onSubmittedWorkDone(); return Math.round(performance.now() - t); };
        const p0 = f.stats.presents, t0 = performance.now(), backlog = []; for (let i = 0; i < 10; i++) { backlog.push(await wait()); await __w(50); }
        const fps = +((f.stats.presents - p0) / ((performance.now() - t0) / 1000)).toFixed(1);
        const w = document.querySelector('.dev[data-id="observer"]'); w.classList.remove('closed', 'folded');
        const sw = [...w.querySelectorAll('.sw')].find((e) => (e.querySelector('.sw-lbl') || {}).textContent.trim() === 'MAP ONLY');
        const lat = []; for (let k = 0; k < 4; k++) { const t = performance.now(); sw.click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          await q.onSubmittedWorkDone(); lat.push(Math.round(performance.now() - t)); await __w(400); }
        return { fps, backlogMs: backlog, mapOnlyMs: lat, inFlight: f.inFlight, cap: f.inFlightCap, queueMs: Math.round(f.queueMs), skipped: __LW.stats.skipped, w: f.canvas ? f.canvas.width : 0, encodeMs: +f.stats.lastEncodeMs.toFixed(2), espMs: f.stats.espMs, espRuns: f.stats.espRuns };`));
    }
  } else if (mode === 'sticks') {   // MAP ONLY and BALL AND STICK's 2-D canvas: its inked pixels before, under MAP ONLY, after
    out('skeleton', await g.ev(`await __mol(); __LW.stageText.prefs.set({ skeleton: true }); await __w(1200);
      const c = document.getElementById('skeleton'), ink = () => { const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < x.length; i += 4) if (x[i]) n++; return n; };
      const before = ink(); __LW.mat.espBare = true; __LW.schedule(2); await __w(300); const bare = ink(); __LW.mat.espBare = false; __LW.schedule(2); await __w(300);
      return { before, bare, back: ink() };`));
  } else if (mode === 'camera') {   // S3: the CAMERA card's verbs, every button and switch whole (no text past its box) at the rack's width
    const r = await g.ev(`const card = document.querySelector('.dev[data-id="camera"]'); card.classList.remove('closed'); if (card.classList.contains('folded')) card.querySelector('.dev-fold').click();
      card.scrollIntoView({ block: 'start' }); await __w(600);
      const rows = [...card.querySelectorAll('.cam-verbs')].map((v) => [...v.children].map((c) => { const b = c.getBoundingClientRect(), p = v.getBoundingClientRect();
        return { t: c.textContent.trim(), w: Math.round(b.width), clipped: c.scrollWidth > c.clientWidth + 1 || b.right > p.right + 0.5 || b.left < p.left - 0.5 }; }));
      const b = card.getBoundingClientRect(); return { rows, card: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(Math.min(b.height, 420))] };`);
    out('camera', r.rows); await shot('camera', r.card);
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
