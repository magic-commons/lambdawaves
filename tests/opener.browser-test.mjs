// 0.5.0 C6b · THE OPENER — a cold start opens on the kit's photosensitivity notice, then the kit's title screen: the eleven demos as
// covers, NEW, and RESUME when the session holds work.  A test driver gets neither; `?opener=1` makes a driven start a human one, which
// is how this suite sees them.  Every press is a real pointer on a target elementFromPoint says is on top (gatekit tap); every key is
// the driver's own.  Scenes, in one fresh profile, in order:
//   1 the notice comes first (the lab boots behind it, LW.ready waits for the choice), keys do not reach the lab, CONTINUE writes `warned`
//   2 the title screen: eleven covers named for the demos, NEW, no RESUME on a first visit; keys do not reach the lab while it is up
//   3 NEW boots the shipped scene (ring [boot], clean, the session armed) and the keys are the lab's again
//   4 a reload of a tab that made nothing since NEW shows neither the notice nor the title screen
//   5 an edit, a reload: the title screen with RESUME; RESUME puts the edit back (ring [resume], unsaved) and is OFFERED a build
//   6 a reload: a cover opens its demo (ring [open · WATER]) and is offered a build
//   7 the law: a reset notice comes back once; a given start (`&starter=home`) is ready while it is still up and `?play=1` waits for it;
//     dismiss() (the facade over the kit's notice) puts it down and the play starts
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
import { go } from '../tools/gate/drv.mjs';

const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`;
const URL_ = LAB + '?opener=1';
const NOTICE = '.mir-dialog[data-kind="notice"]', CONTINUE = NOTICE + ' .trig[data-kind="primary"]';
const HELP = `window.__w = (n) => new Promise((r) => setTimeout(r, n));
  window.__screen = () => { const o = document.querySelector('.mir-opener'), n = document.querySelector('${NOTICE}');
    return { notice: !!n, art: n ? (n.querySelector('img.mir-notice-art') || {}).src || null : null, artW: n ? (n.querySelector('img.mir-notice-art') || {}).naturalWidth || 0 : 0,
      opener: !!o, covers: o ? [...o.querySelectorAll('.mir-opener-option')].map((b) => b.dataset.cover + '=' + b.querySelector('.mir-opener-title').textContent) : [],
      home: !!(o && o.querySelector('.mir-opener-home')), resume: !!(o && o.querySelector('.mir-opener-resume')),
      ready: !!(window.__LW && __LW.ready), warned: JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}').warned === true }; };
  window.__lab = () => ({ view: __LW.mat.view, playing: __LW.clock.playing, rows: __LW.history.entries().map((e) => e.label), dirty: __LW.projects.dirty,
    armed: __LW.session.armed(), session: !!__LW.session.read(), errors: __e.slice() });
  window.__offer = () => { const sw = __LW.sw; let took = null; sw.state = 'idle'; sw.asked = false; sw.offered = null; sw.pending = { type: 'LW_SW_WAITING', build: 'opener-' + Date.now() };
    sw.buildReady((o) => { took = o || {}; }); const r = { taken: !!took, quiet: !!(took && took.alone), pane: !document.getElementById('offer').hidden };
    sw.state = 'idle'; sw.pending = null; sw.offered = null; document.getElementById('offer').hidden = true; return r; };
  return 1;`;
let n = 0;
const pass = (m) => console.log('PASS ' + ++n + ' ' + m);
const g = await open(URL_, { width: 1300, height: 900, script: 120000 });
let failed = false;
/* the title screen scrolls (two rows of 9 : 16 covers, then NEW / RESUME): the target is scrolled into view as a reader would, then tapped */
const press = async (sel) => {
  /* the covers' entrance first (.6 s + a stagger, an opacity animation): headless Firefox can hold its frames for seconds while the lab's
     pipelines compile behind the screen, so the wait is for the target's own opacity, by timers */
  await g.ev(`const e = document.querySelector('${sel}'); if (e) e.scrollIntoView({ block: 'center' });
    for (let i = 0; i < 160 && e && getComputedStyle(e).opacity !== '1'; i++) await __w(50); await __w(450); return 1;`);
  const r = await g.tap(sel); if (!r || !r.ok) throw new Error(sel + ' was not pressable: ' + JSON.stringify(r)); return r; };
/* 0.5.0: the navigation hops through about:blank after a pause and checks that the new page PAINTS — this headless Firefox leaves the next page's
   requestAnimationFrame dead after a real pointer press or a navigation within a moment of the last frame (v0.4.0-alpha too; the legacy/boot re-aim's
   goPainted, LEGACY-BOOT-REAIM.md), and the kit's entrance and exit motions (the covers' backwards-filled fade, the notice's leaving) then never advance */
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
  /* ── 1 · THE NOTICE COMES FIRST ── */
  assert.equal((await g.waitFor(`document.querySelector('${NOTICE}') && window.__LW && __LW.history`, 300, 100)).ok, 1, 'no notice with the lab behind it');
  const s1 = await g.ev(`await __w(300); const v0 = __LW.mat.view; return { ...__screen(), v0 };`);
  assert.deepEqual([s1.notice, s1.opener, s1.ready, s1.warned], [true, false, false, false], 'the notice, alone, before the choice: ' + JSON.stringify(s1));
  assert.match(String(s1.art), /img\/warning-sign\.png$/); assert.ok(s1.artW > 100, 'the sign did not load');
  await g.press('v'); await g.press('c');
  const s1k = await g.ev(`await __w(200); return { view: __LW.mat.view, playing: __LW.clock.playing, notice: !!document.querySelector('${NOTICE}') };`);
  assert.deepEqual(s1k, { view: s1.v0, playing: false, notice: true }, 'a key reached the lab under the notice');
  assert.equal((await g.tap(CONTINUE)).ok, 1, 'CONTINUE was not pressable');
  assert.equal((await g.waitFor(`!document.querySelector('${NOTICE}') && document.querySelector('.mir-opener-option')`, 100, 50)).ok, 1, 'no title screen after CONTINUE');
  pass(`the notice first — the λWAVES sign (${s1.artW} px), the lab booting behind it, LW.ready held for the choice; V and C did not reach the lab; CONTINUE put it down and wrote \`warned\``);

  /* ── 2 · THE TITLE SCREEN ── */
  const s2 = await g.ev(`await __w(500); const v0 = __LW.mat.view; return { ...__screen(), v0 };`);
  assert.deepEqual(s2.covers, ['wave-dancer=WAVE DANCER', 'water=WATER', 'benzene=BENZENE', 'n2=N₂', 'h2-sigma-u=H₂ σu', 'helium=HELIUM', 'chord=CHORD', 'bucky=BUCKY', 'break=BREAK', 'tunnel=TUNNEL', 'lda=LDA']);
  assert.deepEqual([s2.home, s2.resume, s2.warned, s2.ready], [true, false, true, false], JSON.stringify(s2));
  await g.press(' '); await g.press('v');
  const s2k = await g.ev(`await __w(200); return { view: __LW.mat.view, playing: __LW.clock.playing, up: !!document.querySelector('.mir-opener') };`);
  assert.deepEqual(s2k, { view: s2.v0, playing: false, up: true }, 'a key reached the lab behind the title screen');
  pass(`the title screen: eleven covers (${s2.covers.map((c) => c.split('=')[1]).join(', ')}), NEW, no RESUME on a first visit; Space and V did not reach the lab behind it`);

  /* ── 3 · NEW ── */
  assert.equal((await press('.mir-opener-home')).ok, 1, 'NEW was not pressable');
  assert.equal((await g.waitFor('window.__LW && __LW.ready && !document.querySelector(".mir-opener")', 300, 100)).ok, 1, 'NEW never reached LW.ready');
  const s3 = await g.ev(`await __LW.settle(); return __lab();`);
  assert.deepEqual([s3.rows, s3.dirty, s3.armed, s3.session], [['boot'], false, true, false], JSON.stringify(s3));
  await g.press(' ');   // the control: the same key reaches the lab once the screen is gone (a play is not an edit: the ring stays ["boot"])
  const s3p = await g.ev(`await __w(300); const p = __LW.clock.playing; return p;`);
  await g.press(' ');
  /* a key's name waits one quiet window (400 ms) for its edit; a reload inside it is not untouched and would show the title screen */
  const s3q = await g.ev(`await __w(900); return { playing: __LW.clock.playing, rows: __LW.history.entries().map((e) => e.label) };`);
  assert.deepEqual([s3p, s3q.playing, s3q.rows], [true, false, ['boot']], 'Space did not reach the lab once the screen was gone (the control)');
  pass('NEW boots the shipped scene: ring ["boot"], clean, the session armed with nothing kept yet; Space is the lab\'s again (played, paused)');

  /* ── 4 · A RELOAD AFTER NEW ── */
  await nav(URL_);
  assert.equal((await g.waitFor('window.__LW && __LW.ready', 300, 100)).ok, 1, 'the reload after NEW never reached ready: ' + JSON.stringify(await g.ev(`return { ...__screen(), ss: sessionStorage.getItem('lambdawaves.opener') };`)));
  const s4 = await g.ev(`return { ...__screen(), ...__lab() };`);
  assert.deepEqual([s4.notice, s4.opener, s4.rows], [false, false, ['boot']], JSON.stringify(s4));
  pass('a reload of a tab that made nothing since NEW opens straight on NEW: no notice (warned holds), no title screen, ring ["boot"]');

  /* ── 5 · AN EDIT, A RELOAD, RESUME ── */
  const s5a = await g.ev(`__LW.setStage(0.3); __LW.history.flush(); await __w(900); __LW.session.flush(); return { ...__lab(), mix: __LW.serialize().presentation.ui.stage.mix };`);
  assert.deepEqual([s5a.session, s5a.mix, s5a.rows.length], [true, 0.3, 2], JSON.stringify(s5a));
  await nav(URL_);
  assert.equal((await g.waitFor('document.querySelector(".mir-opener-resume")', 300, 100)).ok, 1, 'no RESUME after an edit and a reload');
  const s5b = await g.ev(`return __screen();`);
  assert.deepEqual([s5b.notice, s5b.covers.length, s5b.home, s5b.resume], [false, 11, true, true]);   // the eleven starters (0.7.2 L2: TUNNEL joined BREAK; 0.7.3 K2: LDA)
  assert.equal((await press('.mir-opener-resume')).ok, 1, 'RESUME was not pressable');
  assert.equal((await g.waitFor('window.__LW && __LW.ready', 300, 100)).ok, 1, 'RESUME never reached ready');
  const s5 = await g.ev(`await __LW.settle(); return { ...__lab(), mix: __LW.serialize().presentation.ui.stage.mix, offer: __offer() };`);
  assert.deepEqual([s5.rows, s5.mix, s5.dirty, s5.armed], [['resume'], 0.3, true, true], JSON.stringify(s5));
  assert.deepEqual([s5.offer.taken, s5.offer.pane], [false, true], 'a resumed session was taken: ' + JSON.stringify(s5.offer));
  assert.deepEqual(s5.errors, []);
  pass(`an edit and a reload show the title screen with RESUME; RESUME puts the edit back (stage ${s5.mix}, ring ["resume"], unsaved) and a waiting build is offered, never taken`);

  /* ── 6 · A COVER ── */
  await nav(URL_);
  assert.equal((await g.waitFor('document.querySelector(".mir-opener-option[data-cover=water]")', 300, 100)).ok, 1, 'no title screen after a resumed session');
  assert.equal((await press('.mir-opener-option[data-cover=water]')).ok, 1, 'the WATER cover was not pressable');
  assert.equal((await g.waitFor('window.__LW && __LW.ready', 600, 100)).ok, 1, 'the WATER cover never reached ready');
  const s6 = await g.ev(`await __LW.settle(); await __w(900); return { ...__lab(), preset: __LW.chem.save().preset, offer: __offer(), kept: (__LW.session.read() || {}).parts ? Object.keys(__LW.session.read().parts) : null };`);
  assert.deepEqual([s6.rows, s6.preset], [['open · WATER'], 'H2O'], JSON.stringify(s6));
  assert.deepEqual([s6.offer.taken, s6.offer.pane], [false, true], 'a cover was taken: ' + JSON.stringify(s6.offer));
  assert.deepEqual(s6.kept, ['lambdawaves'], 'the session did not keep the opened demo');
  assert.deepEqual(s6.errors, []);
  pass(`a cover opens its demo: ring ["open · WATER"], MOLECULES · ${s6.preset}; the session keeps it (parts ${JSON.stringify(s6.kept)}) and a waiting build is offered, never taken`);

  /* ── 7 · THE LAW ── */
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
  console.log((failed ? 'RED' : 'GREEN') + ' opener.browser-test — ' + n + ' of 7 scenes');
  process.exit(failed ? 1 : 0);
}
