// The visible molecular names may change, while CSS hooks and project keys stay stable.
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
    const saved = __LW.serialize();
    return {
      names: ['molecule', 'chem', 'orbitals'].map(id => card(id).querySelector('.dev-eyebrow').textContent),
      oldHidden: card('molecule').hidden && getComputedStyle(card('molecule')).display === 'none',
      choices, ids: saved.presentation.layout.cards.map(c => c.id),
      records: Object.keys(saved.presentation.instruments), errors: __e.slice()
    };
  `);
  assert.deepEqual(boot.names, ['H₂⁺ · LEGACY', 'MOLECULES', 'MO-REGISTRY']);
  assert.equal(boot.oldHidden, true);
  assert.equal(boot.choices.includes('molecule'), false);
  assert.equal(boot.choices.includes('chem'), true);
  assert.equal(boot.choices.includes('orbitals'), true);
  for (const id of ['molecule', 'chem', 'orbitals']) {
    assert.equal(boot.ids.includes(id), true);
    assert.equal(boot.records.includes(id), true);
  }
  assert.deepEqual(boot.errors, []);
  console.log('PASS Molecules and MO-Registry are the visible choices, with stable saved IDs');

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
