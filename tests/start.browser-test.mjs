// THE START (0.5.0 C6b; iteration 004: the title screen is gone — its demos and the saves are FOLDERS').  A cold human start opens on the
// kit's photosensitivity notice; after CONTINUE the lab resumes the session when it holds work, else boots (BASINS' no-pick rule).  A test
// driver gets neither; `?opener=1` makes a driven start a human one, which is how this suite sees it.  Every press is a real pointer on a
// target elementFromPoint says is on top (gatekit tap); every key is the driver's own.  Scenes, in one fresh profile, in order:
//   1 the notice comes first (the lab boots behind it, LW.ready waits for the choice), keys do not reach the lab, the front page waits
//     behind it (a pointer reaches CONTINUE), CONTINUE writes `warned`; then no title screen: the boot (ring [boot], clean, armed) and the
//     front page
//   2 an edit, a reload: no notice, no title screen — the session is put back (ring [resume], unsaved) and a waiting build is offered
//   3 the law: a reset notice comes back once; a given start (`&starter=home`) is ready while it is still up and `?play=1` waits for it;
//     dismiss() (the facade over the kit's notice) puts it down and the play starts
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
import { go } from '../tools/gate/drv.mjs';

const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`;
const URL_ = LAB + '?opener=1';
const NOTICE = '.mir-dialog[data-kind="notice"]', CONTINUE = NOTICE + ' .trig[data-kind="primary"]';
const HELP = `window.__w = (n) => new Promise((r) => setTimeout(r, n));
  window.__screen = () => { const n = document.querySelector('${NOTICE}'), m = document.getElementById('lwMenu');
    return { notice: !!n, art: n ? (n.querySelector('img.mir-notice-art') || {}).src || null : null, artW: n ? (n.querySelector('img.mir-notice-art') || {}).naturalWidth || 0 : 0,
      opener: !!document.querySelector('.mir-opener'), front: !!(m && !m.hidden),
      ready: !!(window.__LW && __LW.ready), warned: JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}').warned === true }; };
  window.__lab = () => ({ view: __LW.mat.view, playing: __LW.clock.playing, rows: __LW.history.entries().map((e) => e.label), dirty: __LW.projects.dirty,
    armed: __LW.session.armed(), session: !!__LW.session.read(), errors: __e.slice() });
  window.__offer = () => { const sw = __LW.sw; let took = null; sw.state = 'idle'; sw.asked = false; sw.offered = null; sw.pending = { type: 'LW_SW_WAITING', build: 'start-' + Date.now() };
    sw.buildReady((o) => { took = o || {}; }); const r = { taken: !!took, quiet: !!(took && took.alone), pane: !!__LW.sw.offering };
    sw.state = 'idle'; sw.pending = null; sw.offered = null; sw.closeOffer(); return r; };
  return 1;`;
let n = 0;
const pass = (m) => console.log('PASS ' + ++n + ' ' + m);
const g = await open(URL_, { width: 1300, height: 900, script: 120000 });
let failed = false;
/* 0.5.0: the navigation hops through about:blank after a pause and checks that the new page PAINTS — this headless Firefox leaves the next page's
   requestAnimationFrame dead after a real pointer press or a navigation within a moment of the last frame (v0.4.0-alpha too; the legacy/boot re-aim's
   goPainted, LEGACY-BOOT-REAIM.md), and the kit's entrance and exit motions (the notice's leaving) then never advance */
const nav = async (u) => {
  for (let k = 0; k < 6; k++) {
    await new Promise((r) => setTimeout(r, 1200)); await go(g.s, 'about:blank'); await new Promise((r) => setTimeout(r, 400));
    await go(g.s, u); await g.waitFor('document.readyState !== "loading"', 100, 50); await g.armErrors();
    const painted = await g.ev(`return await Promise.race([new Promise((r) => requestAnimationFrame(() => r(1))), new Promise((r) => setTimeout(() => r(0), 2000))]);`);
    if (painted) return g.ev(HELP);
    console.log('NOTE a navigation came up unpainted (rAF dead); hopping again');
  }
  throw new Error('six navigations came up unpainted');
};
try {
  await g.ev(HELP);
  /* ── 1 · THE NOTICE COMES FIRST, THEN THE LAB ── */
  assert.equal((await g.waitFor(`document.querySelector('${NOTICE}') && window.__LW && __LW.history`, 300, 100)).ok, 1, 'no notice with the lab behind it');
  const s1 = await g.ev(`await __w(300); const v0 = __LW.mat.view; return { ...__screen(), v0 };`);
  assert.deepEqual([s1.notice, s1.opener, s1.front, s1.ready, s1.warned], [true, false, false, false, false], 'the notice, alone, before the choice: ' + JSON.stringify(s1));
  assert.match(String(s1.art), /img\/warning-sign\.webp$/);   // 032: lossless WebP, the same visible pixels (20 KB off the precache) assert.ok(s1.artW > 100, 'the sign did not load');
  await g.press('v'); await g.press('c');
  const s1k = await g.ev(`await __w(200); return { view: __LW.mat.view, playing: __LW.clock.playing, notice: !!document.querySelector('${NOTICE}') };`);
  assert.deepEqual(s1k, { view: s1.v0, playing: false, notice: true }, 'a key reached the lab under the notice');
  assert.equal((await g.tap(CONTINUE)).ok, 1, 'CONTINUE was not pressable');
  assert.equal((await g.waitFor(`window.__LW && __LW.ready && !document.querySelector('${NOTICE}')`, 300, 100)).ok, 1, 'CONTINUE never put the notice down and reached LW.ready');
  const s1b = await g.ev(`await __LW.settle(); return { ...__screen(), ...__lab() };`);
  assert.deepEqual([s1b.notice, s1b.opener, s1b.front, s1b.warned, s1b.rows, s1b.dirty, s1b.armed, s1b.session], [false, false, true, true, ['boot'], false, true, false], JSON.stringify(s1b));
  pass(`the notice first — the λWAVES sign (${s1.artW} px), the lab booting behind it, LW.ready held for the choice, the front page waiting; V and C did not reach the lab; a pointer pressed CONTINUE, which wrote \`warned\`; then no title screen — the boot (ring ["boot"], clean, the session armed) under the front page`);

  /* ── 2 · AN EDIT, A RELOAD: THE SESSION COMES BACK ── */
  const s2a = await g.ev(`__LW.setStage(0.3); __LW.history.flush(); await __w(900); __LW.session.flush(); return { ...__lab(), mix: __LW.serialize().presentation.ui.stage.mix };`);
  assert.deepEqual([s2a.session, s2a.mix, s2a.rows.length], [true, 0.3, 2], JSON.stringify(s2a));
  await nav(URL_);
  assert.equal((await g.waitFor('window.__LW && __LW.ready', 300, 100)).ok, 1, 'the reload never reached ready');
  const s2 = await g.ev(`await __LW.settle(); return { ...__screen(), ...__lab(), mix: __LW.serialize().presentation.ui.stage.mix, offer: __offer() };`);
  assert.deepEqual([s2.notice, s2.opener, s2.rows, s2.mix, s2.dirty, s2.armed], [false, false, ['resume'], 0.3, true, true], JSON.stringify(s2));
  assert.deepEqual([s2.offer.taken, s2.offer.pane], [false, true], 'an edited resumed session was taken: ' + JSON.stringify(s2.offer));
  assert.deepEqual(s2.errors, []);
  pass(`an edit and a reload: no notice, no title screen — the session is put back (stage ${s2.mix}, ring ["resume"], unsaved) and a waiting build is offered, never taken`);

  /* ── 3 · THE LAW ── */
  await g.ev(`__LW.warning.reset(); return 1;`);
  await nav(LAB + '?opener=1&starter=home&play=1');
  assert.equal((await g.waitFor('window.__LW && __LW.ready', 300, 100)).ok, 1, 'a given start never reached ready under the notice');
  const s7 = await g.ev(`return { ...__screen(), playing: __LW.clock.playing, open: __LW.warning.open, needed: __LW.warning.needed(), autoplay: __LW.motion.autoplay,
    publicWarn0: __LW.warning.needed({ driver: false, query: '?warn=0' }), driver: __LW.warning.needed({ driver: true, query: '' }) };`);
  assert.deepEqual([s7.notice, s7.opener, s7.ready, s7.open, s7.playing, s7.warned], [true, false, true, true, false, false], JSON.stringify(s7));
  assert.deepEqual([s7.publicWarn0, s7.driver], [true, false], 'the law: ?warn=0 must not silence a human, a driver skips');
  /* one frame first: headless Firefox can hold its frames for a while after a heavy boot, and the kit's pane enters and leaves by a motion */
  const s7d = await g.ev(`await Promise.race([new Promise((r) => requestAnimationFrame(r)), __w(2000)]);
    const d = __LW.warning.dismiss(); const open = __LW.warning.open; for (let i = 0; i < 100 && document.querySelector('${NOTICE}'); i++) await __w(50);
    return { d, open, ...__screen(), playing: __LW.clock.playing, autoplay: __LW.motion.autoplay };`);
  assert.deepEqual([s7d.d, s7d.open, s7d.notice, s7d.warned, s7d.playing], [true, false, false, true, true], JSON.stringify(s7d));
  pass(`the law: a reset notice comes back; a given start is ready under it (\`?play=1\` ${JSON.stringify(s7.autoplay)}); ?warn=0 does not silence a human; dismiss() put it down, wrote \`warned\` and the play started (${JSON.stringify(s7d.autoplay)})`);
} catch (error) { failed = true; console.error(error); }
finally {
  try { await Promise.race([g.close(), new Promise((_, reject) => setTimeout(() => reject(new Error('driver cleanup timed out')), 10000))]); }
  catch (error) { failed = true; console.error('INFRASTRUCTURE:', error.message); }
  console.log((failed ? 'RED' : 'GREEN') + ' start.browser-test — ' + n + ' of 3 scenes');
  process.exit(failed ? 1 : 0);
}
