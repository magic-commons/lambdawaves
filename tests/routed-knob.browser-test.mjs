/* tests/routed-knob.browser-test.mjs — A KNOB WITH A MACRO ON IT (2026-09-18), through real pointer events.
 *
 * What was wrong: the kit seats a range dial beside EVERY routed dial and slides the dial 10 px left to make room, so
 * the dial and its arc sat off-centre under the label, the small dial covered the right of the arc, small dials were
 * scattered over every routed control, and the only ways to take a macro off were a double-tap or a held press on an
 * 8-px ring band.  The laws: a routed dial stays centred in its cell; only the control the hand last touched wears its
 * range dial and its ×; a held press on the DIAL opens the pop-over with REMOVE; the × removes the route.
 */
import { open, judge, done } from '../tools/gate/gatekit.mjs';
const PORT = process.env.LW_PORT || 8706;
const g = await open(`https://127.0.0.1:${PORT}/lab/`, { width: 1500, height: 1150, script: 120000 });
try {
  const boot = await g.waitFor('window.__LW&&__LW.ready', 400, 100);
  judge('K0 boot', boot.ok === 1, boot);
  const r = await g.ev(`
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    document.querySelector('.dev[data-id="chem"]').classList.remove('closed', 'folded');
    const modBtn = [...document.querySelectorAll('#transport button, #transport .trig')].find((b) => /MOD/.test(b.textContent)); if (modBtn) modBtn.click();
    await nap(900);
    const fire = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y, isPrimary: true }));
    const K = (id) => document.querySelector('.k[data-param="' + id + '"]'), ids = ['chem.kick', 'chem.speed'];
    const centre = (id) => { const k = K(id).getBoundingClientRect(), d = K(id).querySelector(':scope > .k-dial').getBoundingClientRect(); return +((d.x + d.width / 2) - (k.x + k.width / 2)).toFixed(2); };
    const vis = (e) => !!e && getComputedStyle(e).display !== 'none';
    const unrouted = ids.map(centre);
    for (const id of ids) {
      const grip = document.querySelector('.m2grip'), gb = grip.getBoundingClientRect(); fire(grip, 'pointerdown', gb.x + 4, gb.y + 4); fire(grip, 'pointerup', gb.x + 4, gb.y + 4); await nap(120);
      const d = K(id).querySelector(':scope > .k-dial'), b = d.getBoundingClientRect(); K(id).scrollIntoView({ block: 'center' }); await nap(60);
      fire(d, 'pointerdown', b.x + 17, b.y + 17); fire(d, 'pointerup', b.x + 17, b.y + 17); await nap(200);
    }
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 5, clientY: 5 })); await nap(80);
    const routed = { rings: __LW.mod.view.rings(), centre: ids.map(centre), ringCentre: ids.map((id) => { const s = K(id).querySelector('.k-ring').getBoundingClientRect(), d = K(id).querySelector(':scope > .k-dial').getBoundingClientRect(); return +(Math.hypot(s.x + s.width / 2 - d.x - d.width / 2, s.y + s.height / 2 - d.y - d.height / 2)).toFixed(2); }),
      badges: ids.map((id) => [vis(K(id).querySelector('.k-route-depth')), vis(K(id).querySelector('.k-route-x'))]) };
    const d0 = K('chem.kick').querySelector(':scope > .k-dial'), b0 = d0.getBoundingClientRect();
    fire(d0, 'pointerdown', b0.x + 17, b0.y + 17); fire(d0, 'pointerup', b0.x + 17, b0.y + 17); await nap(120);
    const touched = ids.map((id) => [K(id).classList.contains('ring-focus'), vis(K(id).querySelector('.k-route-depth')), vis(K(id).querySelector('.k-route-x'))]);
    const before = __LW.chem.kappa; fire(d0, 'pointerdown', b0.x + 17, b0.y + 17); await nap(750); const pop = __LW.mod.view.popState(); fire(d0, 'pointerup', b0.x + 17, b0.y + 17); __LW.mod.view.closePop();
    K('chem.kick').querySelector('.k-route-x').click(); await nap(250);
    return { unrouted, routed, touched, pop, heldMovedValue: __LW.chem.kappa !== before, after: { rings: __LW.mod.view.rings(), hasRing: K('chem.kick').classList.contains('has-ring'), x: !!K('chem.kick').querySelector('.k-route-x') }, errs: window.__e.slice() };`);
  judge('K1 a routed dial stays centred in its cell, its ring concentric with it, and an untouched routed control wears no badge',
    r.routed.rings.length === 2 && r.routed.centre.every((c, i) => Math.abs(c - r.unrouted[i]) < 0.6) && r.routed.ringCentre.every((c) => c < 0.6) && r.routed.badges.every(([a, b]) => !a && !b), r.routed);
  judge('K2 touching one routed control gives THAT control its range dial and its ×, and no other',
    r.touched[0].join() === 'true,true,true' && r.touched[1].join() === 'false,false,false', r.touched);
  judge('K3 a held press on the DIAL opens the pop-over with REMOVE, without moving the value; the × takes the macro off and the ring goes with it',
    r.pop && r.pop.buttons.includes('REMOVE') && r.heldMovedValue === false && r.after.rings.length === 1 && r.after.hasRing === false && r.after.x === false && r.errs.length === 0, { pop: r.pop, after: r.after, errs: r.errs });
} catch (error) {
  judge('gate ran to the end', false, String(error && error.message || error).slice(0, 400));
} finally { await g.close(); }
process.exit(done('routed-knob') ? 1 : 0);
