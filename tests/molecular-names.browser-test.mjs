// The visible molecular names may change, while CSS hooks and project keys stay stable.
// 2026-10 (supersedes W129's first-run rule): MOLECULES and MO-REGISTRY start OPEN on the first-run LEFT rack under SPECTRUM;
// closed, + and WINDOW bring them back; a project whose field owner is MOLECULES brings them back onto the rack (MO-REGISTRY
// too when its register is on) — the H₂⁺ card's law.  HELIUM, H₂ and ELECTROSTATICS are hidden LEGACY windows (QCD was deleted in 0.5.0 D9); ATOMS is back
// (0.4.0 S3 · R-A2) as the periodic table, with its own row in + and WINDOW.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`, { script: 30000 });
try {
  assert.equal((await g.waitFor('window.__LW?.ready', 150, 100)).ok, 1);
  const boot = await g.ev(`
    const card = id => document.querySelector('.dev[data-id="' + id + '"]');
    __LW.layout.addMenu.open();
    const choices = [...document.querySelectorAll('[data-rack-list="add"] .mb-item')].map(b => b.dataset.win);
    __LW.layout.addMenu.close();
    __LW.layout.menu.open();
    const win = [...document.querySelectorAll('#menubar .mb-btn')].find(b => b.dataset.menu === 'WINDOW'); win.click();
    const windows = [...win.parentElement.querySelectorAll('.mb-item .mb-lbl')].map(l => l.textContent);
    __LW.layout.menu.close();
    const saved = __LW.serialize();
    return {
      names: ['chem', 'orbitals'].map(id => card(id).querySelector('.dev-eyebrow').textContent),
      oldGone: !card('molecule'),
      onLeft: ['chem', 'orbitals'].map(id => !card(id).classList.contains('closed') && card(id).parentElement.id === 'rackL'),
      underSpectrum: (() => { const L = [...document.querySelectorAll('#rackL > .dev')].map(d => d.dataset.id); const i = L.indexOf('spectrum'); return L.slice(i + 1, i + 3); })(),
      legacyGone: ['h2', 'field'].map(id => !card(id)), qcdGone: !card('qcd'), heliumGone: !card('helium'), atomsSeat: !card('atoms').hidden && card('atoms').querySelector('.dev-eyebrow').textContent,
      choices, windows, ids: saved.presentation.layout.cards.map(c => c.id),
      records: Object.keys(saved.presentation.instruments), errors: __e.slice()
    };
  `);
  assert.deepEqual(boot.names, ['MOLECULES', 'MO-REGISTRY']);
  assert.equal(boot.oldGone, true, 'the H₂⁺ card is deleted (0.5.0 D9)');
  assert.deepEqual(boot.onLeft, [true, true]);                       // 2026-10: the first-run LEFT rack, under SPECTRUM
  assert.deepEqual(boot.underSpectrum, ['chem', 'orbitals']);
  assert.deepEqual(boot.legacyGone, [true, true], 'the H₂ and ELECTROSTATICS windows are deleted (0.5.0 D9b)');
  assert.equal(boot.qcdGone, true, 'the QCD window is deleted (0.5.0 D9)');
  assert.equal(boot.heliumGone, true, 'the HELIUM window is deleted (0.5.0 D9)');
  assert.equal(boot.atomsSeat, 'ATOMS');
  assert.equal(boot.choices.includes('atoms'), true, 'ATOMS has no row in +: ' + JSON.stringify(boot.choices));
  assert.equal(boot.windows.some((w) => /ATOMS$/.test(w)), true, 'ATOMS has no row in WINDOW: ' + JSON.stringify(boot.windows));
  assert.equal(boot.choices.includes('molecule'), false);
  for (const id of ['qcd', 'helium', 'h2', 'field']) assert.equal(boot.choices.includes(id), false);   // qcd, helium (D9), h2, field (D9b): deleted, so no row either
  assert.equal(boot.windows.includes('↑  MOLECULES'), true);
  assert.equal(boot.windows.includes('↑  MO-REGISTRY'), true);
  for (const id of ['chem', 'orbitals']) {
    assert.equal(boot.ids.includes(id), true);
    assert.equal(boot.records.includes(id), true);
  }
  assert.equal(boot.ids.includes('molecule') || boot.records.includes('molecule'), false, 'the deleted H₂⁺ card has no seat and no record');
  assert.deepEqual(boot.errors, []);
  console.log('PASS Molecules and MO-Registry start on the left rack under SPECTRUM, the legacy windows are hidden, ATOMS has its + and WINDOW rows, saved IDs are stable');

  /* 0.4.0 S0 · wave 136 (audit F6): SPECTRUM's two orphaned operators — QUARKONIUM's button is hidden while QCD is, but the
     value still restores; a press on ATOM opens ATOMS, the periodic table (0.4.0 S3) */
  const ops = await g.ev(`
    const card = id => document.querySelector('.dev[data-id="' + id + '"]');
    const btns = [...card('spectrum').querySelectorAll('.segw')].find(s => (s.querySelector('.k-lbl') || {}).textContent === 'OPERATOR').querySelectorAll('.seg-b');
    const b = (label) => [...btns].find(x => x.textContent === label);
    const quarkHidden = b('QUARKONIUM').hidden && getComputedStyle(b('QUARKONIUM')).display === 'none';
    __LW.setHamiltonian('cornell'); await __LW.settle(); const cornellRestores = __LW.hamiltonian === 'cornell';
    __LW.setHamiltonian('hydrogen'); await __LW.settle();
    const atomsHidden = card('atoms').classList.contains('closed') && !card('atoms').hidden; b('ATOM').click(); await __LW.settle();
    const atomsBack = !card('atoms').hidden && !card('atoms').classList.contains('closed'), op = __LW.hamiltonian;
    /* 0.4.0 S3: the Z stepper is a periodic table — 36 cells in 4 periods; a press puts the element in force and lights its cell */
    const A = card('atoms'); if (A.classList.contains('folded')) A.querySelector('.dev-fold').click(); await __LW.settle();
    const cells = [...A.querySelectorAll('.atm-table .pk-c')], periods = [...A.querySelectorAll('.atm-table .pk-n')].map((p) => p.querySelectorAll('.pk-c').length);
    cells.find((b) => b.textContent === 'Na').click(); await __LW.settle(); await __LW.settle();
    const table = { cells: cells.length, periods, Z: __LW.atomZ, lit: [...A.querySelectorAll('.atm-table .pk-c.on')].map((b) => b.textContent), stepper: [...A.querySelectorAll('.trig')].some((t) => /Z ▸|◂ Z/.test(t.textContent)) };
    __LW.setHamiltonian('hydrogen'); card('atoms').querySelector('.dev-close').click(); await __LW.settle();
    return { quarkHidden, cornellRestores, atomsHidden, atomsBack, op, table, errors: __e.slice() };
  `);
  assert.deepEqual(ops, { quarkHidden: true, cornellRestores: true, atomsHidden: true, atomsBack: true, op: 'atom', table: { cells: 36, periods: [2, 8, 8, 18], Z: 11, lit: ['Na'], stepper: false }, errors: [] });
  console.log('PASS SPECTRUM\'s QUARKONIUM button is hidden (the cornell value still restores) and ATOM opens the closed ATOMS window; its periodic table (2 · 8 · 8 · 18 cells) puts Na in force and lights it');

  const added = await g.ev(`
    const card = id => document.querySelector('.dev[data-id="' + id + '"]'), on = id => !card(id).classList.contains('closed') && !!card(id).closest('#rack, #rackL');
    card('chem').querySelector('.dev-close').click();                 // it starts on the rack now: take it off first
    __LW.layout.addMenu.open(); document.querySelector('[data-rack-list="add"] .mb-item[data-win="chem"]').click();
    const chem = on('chem'); card('chem').querySelector('.dev-close').click();
    return { chem, closedAgain: !on('chem'), errors: __e.slice() };
  `);
  assert.equal(added.chem, true);
  assert.equal(added.closedAgain, true);
  assert.deepEqual(added.errors, []);
  console.log('PASS + puts MOLECULES on the rack');

  const owner = await g.ev(`
    const card = id => document.querySelector('.dev[data-id="' + id + '"]'), on = id => !card(id).classList.contains('closed') && !!card(id).closest('#rack, #rackL');
    const base = __LW.serialize(), file = (mut) => { const s = JSON.parse(JSON.stringify(base)); mut(s.presentation); return s; };
    const closeBoth = (pr) => { for (const c of pr.layout.cards) if (c.id === 'chem' || c.id === 'orbitals') c.closed = true; };
    const rows = {};
    rows.closed = __LW.restore(file((pr) => { pr.instruments.chem.on = true; closeBoth(pr); })) && [on('chem'), on('orbitals'), __LW.chem.on];
    __LW.restore(file(closeBoth));
    rows.atomic = [on('chem'), on('orbitals'), __LW.chem.on];
    rows.omitted = __LW.restore(file((pr) => { pr.instruments.chem.on = true; pr.layout.cards = pr.layout.cards.filter((c) => c.id !== 'chem' && c.id !== 'orbitals'); })) && [on('chem'), on('orbitals'), __LW.chem.on];
    __LW.restore(file(closeBoth));
    rows.register = __LW.restore(file((pr) => { pr.instruments.chem.on = true; pr.instruments.orbitals.on = true; closeBoth(pr); })) && [on('chem'), on('orbitals'), __LW.chem.on];
    __LW.restore(file(closeBoth));
    return { ...rows, errors: __e.slice() };
  `);
  assert.deepEqual(owner.closed, [true, false, true]);
  assert.deepEqual(owner.atomic, [false, false, false]);
  assert.deepEqual(owner.omitted, [true, false, true]);
  assert.deepEqual(owner.register, [true, true, true]);
  assert.deepEqual(owner.errors, []);
  console.log('PASS a MOLECULES-owned project brings its card back onto the rack (and MO-REGISTRY when its register is on), whatever its layout says');

  /* 0.4.0 S1 · THE NAMES: the worker names the solve (ground.names, timed); the ORBITAL knob reads `1b1 · HOMO` (a dial
     takes the plain form), the lane and the rung read the typeset one, a degenerate HOMO is ONE HOMO, the CORE fold */
  const named = await g.ev(`
    const card = id => document.querySelector('.dev[data-id="' + id + '"]');
    await __LW.chem.solve('H2O'); await __LW.settle();
    const knobText = [...card('chem').querySelectorAll('.k')].find(k => (k.querySelector('.k-lbl') || {}).textContent === 'ORBITAL').querySelector('.k-val').textContent;
    const O = __LW.orbitals; O.clear(); O.select(4); await __LW.settle();
    const lane = card('orbitals').querySelector('.orb-lane .sp-nm');
    const water = { knob: knobText, lane: lane ? lane.textContent : null, sub: lane ? !!lane.querySelector('sub') : false, rungs: O.state().rungs,
      core: O.state().coreOpen, coreBtn: !card('orbitals').querySelector('.orb-core-toggle').hidden, about: O.ladder()[4].about, ms: __LW.chem.solution().timings.names };
    card('orbitals').querySelector('.orb-core-toggle').click(); const opened = [O.state().coreOpen, O.state().rungs[0]];
    const ws = __LW.serialize().presentation.layout.cards.find(c => c.id === 'orbitals').core;
    card('orbitals').querySelector('.orb-core-toggle').click();
    await __LW.chem.solve('CH4'); await __LW.settle();
    const ch4 = __LW.orbitals.ladder().slice(2, 5).map(r => r.name);
    await __LW.chem.solve('C6H6'); await __LW.settle();
    const benz = { ms: __LW.chem.solution().timings.names, homo: __LW.orbitals.ladder().slice(19, 21).map(r => r.name), about: __LW.orbitals.ladder()[19].about };
    await __LW.chem.solve('H2O'); await __LW.settle();
    return { water, opened, ws, ch4, benz, errors: __e.slice() };
  `);
  assert.equal(named.water.knob, '1b1 · HOMO');
  assert.equal(named.water.lane, '1b1 · HOMO'); assert.equal(named.water.sub, true);    // the 1 sits in a <sub>
  assert.deepEqual(named.water.rungs, ['core ×1', '2a1', '1b2', '3a1', '1b1 · HOMO', '4a1 · LUMO', '2b2']);
  assert.equal(named.water.core, false); assert.equal(named.water.coreBtn, true);
  assert.ok(/C2v .*computed/.test(named.water.about), named.water.about);
  assert.deepEqual(named.opened, [true, '1a1']); assert.equal(named.ws, true);         // open, and a WORKSPACE key
  assert.deepEqual(named.ch4, ['1t2 (a) · HOMO', '1t2 (b) · HOMO', '1t2 (c) · HOMO']);
  assert.deepEqual(named.benz.homo, ['1e1g (a) · HOMO', '1e1g (b) · HOMO']);
  assert.ok(/two real combinations of the degenerate pair/.test(named.benz.about), named.benz.about);
  assert.ok(named.benz.ms > 0 && named.benz.ms <= 10, 'benzene named in ' + named.benz.ms + ' ms');
  assert.deepEqual(named.errors, []);
  console.log(`PASS the names: the knob reads "1b1 · HOMO", CH₄'s three HOMO members all read HOMO, the CORE fold opens (a WORKSPACE key), benzene named in ${named.benz.ms} ms`);

  /* 0.5.0 D9: the H₂⁺ card is deleted; a record whose field it owned restores as MOLECULES · H₂ on σu (its `kind`), the card
     itself nowhere, MOLECULES reachable on the rack even under a layout that closed it, and STATE names what happened */
  const legacy = await g.ev(`
    const saved = __LW.serialize();
    saved.presentation.instruments.molecule = { on: true, R: 2, kind: 'sigma_u' };
    saved.presentation.layout.cards.find(c => c.id === 'chem').closed = true;
    const ok = __LW.restore(saved), chem = document.querySelector('.dev[data-id="chem"]');
    let st = __LW.chem.state(); for (let i = 0; i < 100 && !(st.on && st.nocc); i++) { await new Promise(r => setTimeout(r, 100)); st = __LW.chem.state(); }
    const out = { ok, gone: !document.querySelector('.dev[data-id="molecule"]'), on: st.on, preset: __LW.chem.preset(), view: st.view, orbital: st.orbital,
      visible: !chem.hidden && !chem.classList.contains('closed'), status: document.querySelector('.dev[data-id="state"] .dev-stat').textContent,
      saved: Object.keys(__LW.serialize().presentation.instruments).includes('molecule'), errors: __e.slice() };
    __LW.chem.setOn(false); await __LW.settle();
    return out;
  `);
  assert.deepEqual(legacy, { ok: true, gone: true, on: true, preset: 'H2', view: 'orbital', orbital: 2, visible: true,
    status: 'retired in 0.5.0: H₂⁺ (opened as MOLECULES · H₂ σu)', saved: false, errors: [] }, JSON.stringify(legacy));
  console.log('PASS an active legacy H₂⁺ record restores as MOLECULES · H₂ on σu, its controls reachable, STATE saying so in one line');
} finally { await g.close(); }
