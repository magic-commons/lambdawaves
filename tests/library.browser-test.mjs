// THE LIBRARY in the browser (0.4.0 S4a · PLAN B2, F5): install → open offline → evict → "not installed".
//   1 · DOWNLOAD, never DISABLED: lysine (64 AO, past the cap) is an enabled row that says DOWNLOAD; nothing is in lw-data-v1.
//   2 · CACHED = FRESH, ZERO SOLVER CALLS: benzene solved live, then INSTALLED and opened from its record through chem.open — the
//       same energy, ε, C and D, the same names, the same RPA sticks — and the chem worker's own ledger (solverCalls) does not move.
//   3 · INSTALL by a press: picking lysine downloads its record (checked against its sha-256 name, kept in lw-data-v1), asks
//       navigator.storage.persist() once and shows the answer and the quota; its row stops saying DOWNLOAD; zero solver calls;
//       a basis change on it and a KICK are refused with a sentence, not a solve.
//   4 · OPEN OFFLINE: with the network refusing every library/ fetch, a project naming lysine opens it from the device, the rest
//       of the project restores, and the settings stay byte-identical outside the WORKSPACE keys.
//   5 · EVICT → NOT INSTALLED: the record removed, the same project offline restores everything else and MOLECULES names the part
//       that refused; the row says DOWNLOAD again; nothing throws.
//   6 · THE SECTIONS (0.4.0 S4b): the page turner holds one section in the dropdown; each section's header names its records, its
//       bytes and how many are on this device; INSTALLED installs the whole section (0 solver calls) and lights its lamp, and
//       removes it again; a section with no record offers nothing to keep.  The three sizing entries (alanine, Li₄F₄, TiCl₄)
//       open from their records in Firefox, timed (BRIEF-S4-LIBRARY §S4b).
//   7 · THE TWO-PRESS RACE (the S4a verifier's BLOCKER B1, fixed by Claude Sos on sos-s0): benzene and lysine both installed, benzene
//       pressed and lysine pressed before benzene's open lands — lysine must stay the molecule in the worker: 0 solver calls through
//       its spectrum, and a KICK on it refused with a sentence, never a live solve of a past-the-cap molecule.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { open } from '../tools/gate/gatekit.mjs';

const CAT = JSON.parse(readFileSync(new URL('../lab/library.json', import.meta.url), 'utf8'));
const HASH = Object.fromEntries(CAT.rows.map((r) => [r.id, r.hash])), SEC = Object.fromEntries(CAT.rows.map((r) => [r.id, r.section]));
const LYS_E = JSON.parse(readFileSync(new URL('../lab/library/' + HASH.lysine + '.json', import.meta.url), 'utf8')).oracle.energy;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`, { width: 1500, height: 1000, script: 240000,
  prefs: { 'dom.storageManager.prompt.testing': true, 'dom.storageManager.prompt.testing.allow': true } });
let failed = false;
const pass = (s) => console.log('PASS ' + s);
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 300, 100)).ok, 1);
  await g.ev(`window.__w = (n) => new Promise((r) => setTimeout(r, n));
    window.__ws = () => { const o = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}'); for (const k of ['closed', 'nbW', 'nbH', 'abW', 'abH', 'modwin', 'layouts', 'phoneTr', 'phoneRack']) delete o[k]; return JSON.stringify(o); };
    window.__calls = async () => (await __LW.chem.workerStat()).solverCalls;
    window.__sec = ${JSON.stringify(SEC)};   /* 0.4.0 S4b: the dropdown holds one section — turn to the row's page first */
    window.__opt = (id) => { if (__sec[id]) __LW.chem.section(__sec[id]); return [...document.querySelectorAll('#transport .mol-pick option')].find((o) => o.value === id); };
    window.__real = window.fetch;
    window.__offline = (on) => { window.fetch = on ? (u, o) => (/\\/library\\//.test(String(u && u.url || u)) ? Promise.reject(new TypeError('NetworkError: the gate is offline')) : __real(u, o)) : __real; };
    for (const k of await caches.keys()) if (k === 'lw-data-v1') await caches.delete(k);
    localStorage.removeItem('lambdawaves.q0.library');
    return 1;`);

  /* 1 · DOWNLOAD, never DISABLED */
  const one = await g.ev(`const rows = await __LW.chem.records(), o = __opt('lysine');
    return { rows: rows.map((r) => [r.id, r.installed, r.recordOnly]), text: o.textContent, disabled: o.disabled, group: o.parentElement.label, store: (await caches.keys()).includes('lw-data-v1') && (await (await caches.open('lw-data-v1')).keys()).some((q) => q.url.includes('/library/')), errs: __e.slice() };`);   // 017 R2: the boot's demo cover (projects.js keepData, a DATA file) may land after the setup's delete — the law is that LOOKING keeps no record
  assert.ok(one.rows.length === CAT.rows.length && one.rows.every((r) => r[1] === false), 'nothing is installed at first: ' + JSON.stringify(one));
  assert.deepEqual(['C6H6', 'lysine', 'C60'].map((id) => one.rows.find((r) => r[0] === id)), [['C6H6', false, false], ['lysine', false, true], ['C60', false, true]], JSON.stringify(one));   // C60: S4c's frontier record
  assert.equal(one.text, 'C₆H₁₄N₂O₂ · 64 AO · record · DOWNLOAD'); assert.equal(one.disabled, false);
  assert.equal(one.store, false, 'looking at the store kept a record in lw-data-v1 at boot'); assert.deepEqual(one.errs, []);
  pass(`DOWNLOAD, never DISABLED: lysine's row "${one.text}" (${one.group}) is enabled; nothing is installed and boot created no store`);

  /* 2 · CACHED = FRESH, ZERO SOLVER CALLS (benzene: live first, then from its installed record).  The record was made by the
       generator in NODE (V8); this live solve runs in Firefox (SpiderMonkey), whose Math.exp and friends round the last ulp
       differently — so here cached = fresh is to the solver's own convergence, measured and bounded (in node, on one engine,
       tests/library.test.mjs holds it bit for bit): E, ε, D, the degenerate subspaces' projectors, every signed C entry that
       matters, the names (every label), the RPA sticks. */
  const two = await g.ev(`const pick = () => { const s = __LW.chem.solution(); return { E: s.energy, eps: Array.from(s.eps), C: Array.from(s.C), D: Array.from(s.D),
      config: s.names && s.names.config, labels: s.names && s.names.mos.map((m) => m.label + '|' + m.frontier).join(' '), roots: (s.roots || []).map((r) => [r.omega, r.f]), record: s.record || null }; };
    const c0 = await __calls(); await __LW.chem.solve('C6H6', { force: true }); const live = pick(), c1 = await __calls();
    const inst = await __LW.chem.install('C6H6');
    const t0 = performance.now(); await __LW.chem.solve('C6H6', { force: true }); const ms = performance.now() - t0;
    const rec = pick(), c2 = await __calls(), st = __LW.chem.state();
    const mx = (a, b) => a.length !== b.length ? Infinity : a.reduce((m, v, i) => Math.max(m, Math.abs(v - b[i])), 0), n = live.eps.length;
    /* the degenerate subspaces (|Δε| < 1e-8): the projector Σ_k C_k C_kᵀ is the gauge-free statement, compared entry by entry */
    let proj = 0, clusters = 0;
    for (let s = 0; s < n;) { let e = s + 1; while (e < n && live.eps[e] - live.eps[e - 1] < 1e-8) e++;
      if (e - s > 1) { clusters++; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let p = 0, q = 0; for (let k = s; k < e; k++) { p += live.C[i * n + k] * live.C[j * n + k]; q += rec.C[i * n + k] * rec.C[j * n + k]; } proj = Math.max(proj, Math.abs(p - q)); } }
      s = e; }
    const signs = live.C.every((v, i) => Math.abs(v) < 1e-4 || Math.sign(v) === Math.sign(rec.C[i]));
    return { liveCalls: c1 - c0, recCalls: c2 - c1, inst: { ok: inst.ok, from: inst.from, bytes: inst.bytes, persisted: inst.storage && inst.storage.persisted },
      E: [live.E, rec.E], dE: Math.abs(live.E - rec.E), dEps: mx(live.eps, rec.eps), dC: mx(live.C, rec.C), dD: mx(live.D, rec.D), proj, clusters, signs,
      names: live.config === rec.config && live.labels === rec.labels && !!rec.config,
      dOmega: mx(live.roots.map((r) => r[0]), rec.roots.map((r) => r[0])), dF: mx(live.roots.map((r) => r[1]), rec.roots.map((r) => r[1])), nRoots: rec.roots.length,
      record: rec.record, ms, status: st.status, stRecord: st.record, ref: __LW.serialize().presentation.instruments.chem.library,
      asked: JSON.parse(localStorage.getItem('lambdawaves.q0.library') || 'null'), errs: __e.slice() };`);
  const w2 = JSON.stringify({ ...two, status: two.status });
  assert.equal(two.liveCalls, 2, 'a live benzene is one SCF and one RPA: ' + w2);
  assert.equal(two.recCalls, 0, 'ZERO solver calls on the record\'s open: ' + w2);
  assert.ok(two.inst.ok && two.inst.from === 'network' && two.inst.bytes === CAT.rows.find((r) => r.id === 'C6H6').bytes, w2);
  assert.ok(two.dE < 1e-10 && two.dEps < 1e-8 && two.dD < 1e-8 && two.proj < 1e-8 && two.dC < 1e-6 && two.signs && two.names
    && two.nRoots === 315 && two.dOmega < 1e-8 && two.dF < 1e-7 && two.clusters >= 10, 'cached ≠ fresh: ' + w2);
  assert.deepEqual(two.record, { id: 'C6H6', hash: HASH.C6H6, caps: { orbitals: true, states: true, rpa: true, tdhf: true } }, w2);
  /* the project's reference: { id, hash, nameKey } — the orbital (benzene's HOMO, 1e₁g) by its S1 name, the portable half */
  assert.ok(two.ref && two.ref.id === 'C6H6' && two.ref.hash === HASH.C6H6 && two.ref.nameKey && two.ref.nameKey.group === 'D6h' && /e1g/i.test(two.ref.nameKey.irrep) && two.ref.nameKey.count === 1, 'the project reference: ' + w2);
  assert.ok(/from its record \(\d+ KB, on this device\)/.test(two.status) && /no solver call/.test(two.status), w2);
  assert.ok(two.asked && two.asked.asked, 'persist() was not asked on the install press: ' + w2); assert.deepEqual(two.errs, []);
  pass(`cached = fresh: benzene live in Firefox (${two.liveCalls} solver calls) then installed (${two.inst.bytes} B, persisted ${two.inst.persisted}) and opened from its node-made record in ${two.ms.toFixed(0)} ms with 0 solver calls — |ΔE| ${two.dE.toExponential(1)}, |Δε| ${two.dEps.toExponential(1)}, |ΔD| ${two.dD.toExponential(1)}, ${two.clusters} degenerate projectors ${two.proj.toExponential(1)}, |ΔC| ${two.dC.toExponential(1)} with every sign kept, every name the same, 315 sticks |Δω| ${two.dOmega.toExponential(1)} |Δf| ${two.dF.toExponential(1)}; status "${two.status}"`);

  /* 3 · INSTALL BY A PRESS: lysine downloads, opens with 0 solver calls; a basis change and a KICK are refused with a sentence */
  const three = await g.ev(`const c0 = await __calls(); const sel = document.querySelector('#transport .mol-pick select');
    __opt('lysine'); sel.value = 'lysine'; sel.dispatchEvent(new Event('change'));   // S4b: turn to BIO first — the dropdown holds one section
    let st = __LW.chem.state(); for (let i = 0; i < 300 && !(st.nAO === 64 && st.roots); i++) { await __w(100); st = __LW.chem.state(); }
    await __w(200); st = __LW.chem.state();
    const c1 = await __calls(), label = __opt('lysine').textContent, statusOpen = st.status;
    await __LW.chem.setBasis('6-31+g-star'); const basisAfter = __LW.chem.basis, basisStatus = __LW.chem.state().status, b6 = [...document.querySelectorAll('.dev[data-id="chem"] .seg-b')].find((b) => b.textContent === '6-31+G*');
    const k = await __LW.chem.kick(); const kickStatus = __LW.chem.state().status, c2 = await __calls();
    const ref = __LW.serialize().presentation.instruments.chem.library;
    return { calls: [c1 - c0, c2 - c1], st: { preset: st.preset, nAO: st.nAO, nocc: st.nocc, energy: st.energy, roots: st.roots, record: st.record }, label, statusOpen,
      basisAfter, basisStatus, b6disabled: b6 && b6.disabled, kick: k, kickStatus, running: __LW.chem.state().running, ref, errs: __e.slice() };`);
  const w3 = JSON.stringify(three);
  assert.deepEqual(three.calls, [0, 0], 'a record past the cap ran the solver: ' + w3);
  assert.ok(three.st.nAO === 64 && three.st.nocc === 40 && Math.abs(three.st.energy - LYS_E) < 1e-8 && three.st.roots === 960 && three.st.record.from === 'network', w3);
  assert.equal(three.label, 'C₆H₁₄N₂O₂ · 64 AO · record', 'the row still says DOWNLOAD after the install: ' + w3);
  assert.ok(/downloaded/.test(three.statusOpen) && /persisted|not persisted|Safari/.test(three.statusOpen) && /MB used/.test(three.statusOpen), 'the persisted answer and the quota are shown: ' + w3);
  assert.ok(three.basisAfter === 'sto-3g' && /past the live cap and opens only from its STO-3G record/.test(three.basisStatus) && three.b6disabled === true, 'a basis change on a record-only molecule: ' + w3);
  assert.ok(three.kick === null && /TDHF/.test(three.kickStatus) && /past the live cap/.test(three.kickStatus) && three.running === false, 'a KICK past the cap: ' + w3);
  /* C₁ names nothing beyond the index (S1: "an orbital has only its index"), so lysine's portable key is null and the index rides alone */
  assert.ok(three.ref && three.ref.id === 'lysine' && three.ref.hash === HASH.lysine && three.ref.nameKey === null, 'the project reference: ' + w3);
  assert.deepEqual(three.errs, []);
  pass(`INSTALL by a press: lysine (${three.st.nAO} AO, E ${three.st.energy}) downloaded and opened with 0 solver calls, its row now "${three.label}"; the project holds ${JSON.stringify(three.ref).slice(0, 120)}…; 6-31+G* refused ("${three.basisStatus.slice(0, 90)}…"), KICK refused ("${three.kickStatus.slice(0, 80)}…")`);

  /* 4 · OPEN OFFLINE: the network refuses every library/ fetch; the project opens lysine from the device; the rest restores */
  const four = await g.ev(`__LW.chem.setOn(true); await __w(300);
    const file = __LW.serialize(); file.presentation.paletteId = file.presentation.paletteId === 'prism' ? 'sea' : 'prism'; const wantPal = file.presentation.paletteId;
    __LW.chem.setOn(false); await __LW.chem.solve('H2O'); await __w(200);
    __LW.saveSettings(); await __w(50); const before = __ws(); __offline(true);
    const c0 = await __calls(); __LW.restore(file);
    let st = __LW.chem.state(); for (let i = 0; i < 300 && !(st.nAO === 64 && st.roots); i++) { await __w(100); st = __LW.chem.state(); }
    await __w(300); const c1 = await __calls();
    return { calls: c1 - c0, st: { preset: st.preset, on: st.on, owner: st.fieldOwner, energy: st.energy, record: st.record }, pal: __LW.serialize().presentation.paletteId, wantPal,
      settingsSame: __ws() === before, file, errs: __e.slice() };`);
  const w4 = JSON.stringify({ ...four, file: undefined });
  assert.equal(four.calls, 0, w4);
  assert.ok(four.st.preset === 'lysine' && four.st.on && Math.abs(four.st.energy - LYS_E) < 1e-8 && four.st.record.from === 'device', 'offline open from the device: ' + w4);
  assert.equal(four.pal, four.wantPal, 'the rest of the project did not restore: ' + w4);
  assert.equal(four.settingsSame, true, 'the open wrote the settings outside the WORKSPACE keys: ' + w4); assert.deepEqual(four.errs, []);
  pass(`OPEN OFFLINE: every library/ fetch refused, the project opened lysine from lw-data-v1 (0 solver calls, field owner ${four.st.owner}), its palette restored, settings byte-identical outside the WORKSPACE keys`);

  /* 5 · EVICT → NOT INSTALLED: the same project offline restores the rest and names what refused; the row says DOWNLOAD again */
  const five = await g.ev(`const file = ${JSON.stringify(four.file)}; __LW.chem.setOn(false); await __LW.chem.solve('H2O'); await __w(200);
    const removed = await __LW.chem.remove('lysine'), rows = await __LW.chem.records();
    file.presentation.paletteId = file.presentation.paletteId === 'prism' ? 'sea' : 'prism'; const wantPal = file.presentation.paletteId;
    const c0 = await __calls(); __LW.restore(file);
    let st = __LW.chem.state(); for (let i = 0; i < 100 && !/not open/.test(st.status); i++) { await __w(100); st = __LW.chem.state(); }
    await __w(300); const c1 = await __calls(); __offline(false);
    return { removed, installed: rows.find((r) => r.id === 'lysine').installed, calls: c1 - c0, status: st.status, nAO: st.nAO, preset: st.preset, label: __opt('lysine').textContent,
      disabled: __opt('lysine').disabled, pal: __LW.serialize().presentation.paletteId, wantPal, errs: __e.slice() };`);
  const w5 = JSON.stringify(five);
  assert.ok(five.removed && five.installed === false, w5);
  assert.equal(five.calls, 0, 'an evicted record past the cap was solved: ' + w5);
  assert.ok(/lysine's record is not open: the network refused it \(offline\)/.test(five.status) && /opens only from its record/.test(five.status), 'the refusal is not named: ' + w5);
  assert.ok(five.preset === 'lysine' && five.nAO === 0 && five.label === 'C₆H₁₄N₂O₂ · 64 AO · record · DOWNLOAD' && five.disabled === false, 'not installed, not broken: ' + w5);
  assert.equal(five.pal, five.wantPal, 'the rest of the project did not restore: ' + w5); assert.deepEqual(five.errs, []);
  pass(`EVICT → NOT INSTALLED: lysine removed; offline, the project restored everything else (palette ${five.pal}) and MOLECULES says "${five.status.slice(0, 120)}…"; the row says DOWNLOAD again, enabled; no page error`);
  /* 6 · THE SECTIONS: the page turner, the header, INSTALLED for a whole section, and the three sizing entries opened, timed */
  const six = await g.ev(`await __w(4000); __offline(false);
    const card = document.querySelector('.dev[data-id="chem"]'), sel = document.querySelector('#transport .mol-pick select');
    const dia = __LW.chem.section('DIATOMICS');
    const prev = card.querySelector('.mol-section .mir-step-b[data-step="-1"]'), next = card.querySelector('.mol-section .mir-step-b[data-step="1"]');   // 0.5.3 M8: the kit's stepper, PALETTE's look
    next.click(); const turned = __LW.chem.section().name; prev.click(); const back = __LW.chem.section().name;
    const before = __LW.chem.section('LATTICE'), opts = [...sel.options].map((o) => o.value), c0 = await __calls();
    const kept = await __LW.chem.keep(true), on = __LW.chem.section('LATTICE');
    const removed = await __LW.chem.keep(false), off = __LW.chem.section('LATTICE'), c1 = await __calls();
    const timed = [];
    for (const id of ['alanine', 'Li4F4', 'TiCl4']) {
      const inst = await __LW.chem.install(id); const t0 = performance.now(); await __LW.chem.solve(id, { force: true }); const ms = performance.now() - t0;
      const st = __LW.chem.state(); timed.push({ id, bytes: inst.bytes, ok: inst.ok, nAO: st.nAO, open: st.record && st.record.ms, from: st.record && st.record.from, wall: +ms.toFixed(1), E: st.energy, group: st.names && st.names.group });
    }
    const c2 = await __calls();
    for (const id of ['alanine', 'Li4F4', 'TiCl4']) await __LW.chem.remove(id);
    return { dia, turned, back, before, opts, kept, on, removed, off, calls: [c1 - c0, c2 - c1], timed, errs: __e.slice() };`);
  const w6 = JSON.stringify(six);
  const LAT = CAT.rows.filter((r) => r.section === 'LATTICE');
  assert.ok(six.dia.records === 0 && six.dia.keepOffered === false && /molecules, all live/.test(six.dia.sub), 'a section with no record offers nothing to keep: ' + w6);
  assert.ok(six.turned === 'HYDRIDES' && six.back === 'DIATOMICS', 'the turner ‹ › moves one section: ' + w6);
  assert.ok(six.before.records === LAT.length && six.before.bytes === LAT.reduce((t, r) => t + r.bytes, 0) && six.before.installed === 0 && six.before.lamp === false && six.before.keepOffered
    && LAT.every((r) => six.opts.includes(r.id)) && six.opts.length === six.before.molecules.length, 'the LATTICE header: ' + w6);
  assert.ok(six.kept.installed === LAT.length && six.on.installed === LAT.length && six.on.lamp === true && new RegExp(LAT.length + ' here$').test(six.on.sub), 'INSTALLED kept the section: ' + w6);
  assert.ok(six.removed.installed === 0 && six.off.installed === 0 && six.off.lamp === false, 'INSTALLED off removed the section: ' + w6);
  assert.deepEqual(six.calls, [0, 0], 'installing a section or opening its records ran the solver: ' + w6);
  for (const t of six.timed) assert.ok(t.ok && t.from === 'device' && Number.isFinite(t.open) && Math.abs(t.E - JSON.parse(readFileSync(new URL('../lab/library/' + HASH[t.id] + '.json', import.meta.url), 'utf8')).oracle.energy) < 1e-8, w6);
  assert.deepEqual(six.errs, []);
  pass(`THE SECTIONS: ‹ › turns DIATOMICS → HYDRIDES → DIATOMICS; DIATOMICS offers nothing to keep ("${six.dia.sub}"); LATTICE "${six.before.sub}" → INSTALLED: "${six.on.sub}", lamp on → off: ${six.off.installed} kept; 0 solver calls; the sizing entries opened in Firefox: ${six.timed.map((t) => `${t.id} ${t.nAO} AO ${t.bytes} B, the worker's open ${t.open} ms, solve() whole ${t.wall} ms`).join(' · ')}`);
  /* 7 · THE TWO-PRESS RACE: benzene then lysine, both from the device; lysine wins, 0 solver calls, a KICK on it refused */
  const seven = await g.ev(`await __LW.chem.install('C6H6'); await __LW.chem.install('lysine'); await __LW.chem.solve('H2O'); await __w(300);
    const c0 = await __calls();
    const a = __LW.chem.solve('C6H6', { press: true }), b = __LW.chem.solve('lysine', { press: true });
    await Promise.all([a, b]); await __w(1500);
    let st = __LW.chem.state(); for (let i = 0; i < 100 && !(st.nAO === 64 && st.roots); i++) { await __w(100); st = __LW.chem.state(); }
    const c1 = await __calls(), k = await __LW.chem.kick(), kickStatus = __LW.chem.state().status, c2 = await __calls();
    await __LW.chem.remove('C6H6'); await __LW.chem.remove('lysine'); await __LW.chem.solve('H2O');
    return { calls: [c1 - c0, c2 - c1], preset: st.preset, nAO: st.nAO, roots: st.roots, record: st.record, kick: k, kickStatus, errs: __e.slice() };`);
  const w7 = JSON.stringify(seven);
  assert.ok(seven.preset === 'lysine' && seven.nAO === 64 && seven.roots === 960 && seven.record && seven.record.from === 'device', 'lysine is not the molecule after the race: ' + w7);
  assert.deepEqual(seven.calls, [0, 0], 'the race ran the solver on a record-only molecule: ' + w7);
  assert.ok(seven.kick === null && /past the live cap/.test(seven.kickStatus), 'a KICK on lysine after the race was not refused: ' + w7);
  assert.deepEqual(seven.errs, []);
  pass(`THE TWO-PRESS RACE: benzene then lysine pressed together, lysine opened from the device with ${seven.roots} sticks, 0 solver calls, KICK refused ("${seven.kickStatus.slice(0, 80)}…")`);
} catch (e) { failed = true; console.error('FAIL', e && e.message || e); }
finally { await g.close(); }
console.log(failed ? 'RED library' : 'GREEN library — install → open offline → evict → "not installed" → the sections → the two-press race');
process.exit(failed ? 1 : 0);
