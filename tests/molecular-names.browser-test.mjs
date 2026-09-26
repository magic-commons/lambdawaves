// The visible molecular names may change, while CSS hooks and project keys stay stable.
// W129: MOLECULES and MO-REGISTRY are off the first-run rack, available in + and WINDOW, on the rack after an add, and back
// on the rack for a project whose field owner is MOLECULES (MO-REGISTRY too when its register is on) — the H₂⁺ card's law.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`, { script: 30000 });
try {
  assert.equal((await g.waitFor('window.__LW?.ready', 150, 100)).ok, 1);
  const boot = await g.ev(`
    const card = id => document.querySelector('.dev[data-id="' + id + '"]');
    __LW.layout.addMenu.open();
    const choices = [...document.querySelectorAll('#rackAddList .mb-item')].map(b => b.dataset.win);
    __LW.layout.addMenu.close();
    __LW.layout.menu.open();
    const win = [...document.querySelectorAll('#menubar .mb-btn')].find(b => b.textContent === 'WINDOW'); win.click();
    const windows = [...win.parentElement.querySelectorAll('.mb-item .mb-lbl')].map(l => l.textContent);
    __LW.layout.menu.close();
    const saved = __LW.serialize();
    return {
      names: ['molecule', 'chem', 'orbitals'].map(id => card(id).querySelector('.dev-eyebrow').textContent),
      oldHidden: card('molecule').hidden && getComputedStyle(card('molecule')).display === 'none',
      offRack: ['chem', 'orbitals'].map(id => card(id).classList.contains('closed') && getComputedStyle(card(id)).display === 'none'),
      choices, windows, ids: saved.presentation.layout.cards.map(c => c.id),
      records: Object.keys(saved.presentation.instruments), errors: __e.slice()
    };
  `);
  assert.deepEqual(boot.names, ['H₂⁺ · LEGACY', 'MOLECULES', 'MO-REGISTRY']);
  assert.equal(boot.oldHidden, true);
  assert.deepEqual(boot.offRack, [true, true]);
  assert.equal(boot.choices.includes('molecule'), false);
  assert.equal(boot.choices.includes('chem'), true);
  assert.equal(boot.choices.includes('orbitals'), true);
  assert.equal(boot.windows.includes('⊕  MOLECULES'), true);
  assert.equal(boot.windows.includes('⊕  MO-REGISTRY'), true);
  for (const id of ['molecule', 'chem', 'orbitals']) {
    assert.equal(boot.ids.includes(id), true);
    assert.equal(boot.records.includes(id), true);
  }
  assert.deepEqual(boot.errors, []);
  console.log('PASS Molecules and MO-Registry start off the rack, offered by + and WINDOW, with stable saved IDs');

  const added = await g.ev(`
    const card = id => document.querySelector('.dev[data-id="' + id + '"]'), on = id => !card(id).classList.contains('closed') && !!card(id).closest('#rack, #rackL');
    __LW.layout.addMenu.open(); document.querySelector('#rackAddList .mb-item[data-win="chem"]').click();
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

  const legacy = await g.ev(`
    __LW.molecule.setOn(true);
    const saved = __LW.serialize();
    saved.presentation.layout.cards.find(c => c.id === 'molecule').closed = true;
    __LW.molecule.setOn(false);
    const ok = __LW.restore(saved), old = document.querySelector('.dev[data-id="molecule"]');
    return { ok, on: __LW.molecule.on, visible: !old.hidden && !old.classList.contains('closed'),
      savedOn: __LW.serialize().presentation.instruments.molecule.on, errors: __e.slice() };
  `);
  assert.equal(legacy.ok, true);
  assert.equal(legacy.on, true);
  assert.equal(legacy.visible, true);
  assert.equal(legacy.savedOn, true);
  assert.deepEqual(legacy.errors, []);
  console.log('PASS an active legacy H₂⁺ project restores with its controls reachable');
} finally { await g.close(); }
