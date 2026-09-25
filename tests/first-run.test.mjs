/* tests/first-run.test.mjs — THE FIRST-RUN MATERIAL (W125, Josh 2026-09-25): a pure function of "is this a phone or a
 * tablet?" feeding rack.js' first-run defaults, and the stored-choice laws that always win over it.
 *   node tests/first-run.test.mjs
 * Oracles: the desktop's official defaults (CLAUDE.md, tests/official-defaults-palette.browser-test.mjs: light /
 * refractive / ALWAYS frost), the phone/tablet's (tinted / frost OFF), and rack.js' own reading laws — a card counts only
 * when this browser SAID it (cardSet, wave 51), a legacy frost `true` is ALWAYS (wave 67), anything unreadable is the
 * default.  And the wiring: rack.js asks with its own crossings and feeds these into defaultCard / frostMode /
 * applySettings (a source read, because rack.js needs a DOM). */
import { readFileSync } from 'node:fs';
import { firstRunMaterial, storedCard, storedFrost, bootMaterial, FIRST_RUN_MATERIAL } from '../lab/first-run.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 400)));
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
{
  const d = bootMaterial({}, false), m = bootMaterial({}, true), dn = bootMaterial(null, false), mn = bootMaterial(undefined, true);
  judge('A NEW BROWSER: the desktop gets REFRACTIVE + FROST ALWAYS, a phone or tablet TINTED + FROST OFF (no settings key, or an empty one)',
    eq(d, { card: 'refractive', frost: 'always' }) && eq(m, { card: 'tinted', frost: 'off' }) && eq(dn, d) && eq(mn, m)
    && eq(firstRunMaterial(false), FIRST_RUN_MATERIAL.desktop) && eq(firstRunMaterial(true), FIRST_RUN_MATERIAL.mobile) && Object.isFrozen(FIRST_RUN_MATERIAL.mobile),
    { d, m });
}
{
  const back = { card: 'refractive', cardSet: true, frost: 'always' }, desk = { card: 'tinted', cardSet: true, frost: 'off' }, still = { frost: 'still' };
  const rows = {
    mobileKeepsRefractiveAlways: bootMaterial(back, true), desktopKeepsTintedOff: bootMaterial(desk, false),
    stillOnBoth: [bootMaterial(still, false).frost, bootMaterial(still, true).frost],
    storedOffOnDesktop: bootMaterial({ frost: 'off' }, false).frost, storedAlwaysOnMobile: bootMaterial({ frost: 'always' }, true).frost,
  };
  judge('A STORED CHOICE WINS over both defaults: a returning phone keeps REFRACTIVE + ALWAYS, a returning desktop keeps TINTED + OFF, STILL stays STILL on either, a stored OFF / ALWAYS beats the device',
    eq(rows.mobileKeepsRefractiveAlways, { card: 'refractive', frost: 'always' }) && eq(rows.desktopKeepsTintedOff, { card: 'tinted', frost: 'off' })
    && eq(rows.stillOnBoth, ['still', 'still']) && rows.storedOffOnDesktop === 'off' && rows.storedAlwaysOnMobile === 'always', rows);
}
{
  const rows = {
    savedNotSaid: [bootMaterial({ card: 'refractive' }, true).card, bootMaterial({ card: 'tinted', cardSet: false }, false).card],
    corruptSaid: [storedCard({ card: 'glass', cardSet: true }, 'tinted'), storedCard({ card: 'glass', cardSet: true }, undefined)],
    legacyTrue: [storedFrost({ frost: true }, 'off'), storedFrost({ frost: true }, 'always')],
    unreadable: [storedFrost({ frost: false }, 'off'), storedFrost({ frost: false }, 'always'), storedFrost({ frost: 'nonsense' }, 'always'), storedFrost({}, 'still')],
  };
  judge('THE READING LAWS rack.js always used: a card saved but not SAID follows the device (wave 51), a said-but-unknown card is the fallback, a legacy frost `true` is ALWAYS (wave 67), `false` / absent falls to the default, and every result is one of the three seats',
    eq(rows.savedNotSaid, ['tinted', 'refractive']) && eq(rows.corruptSaid, ['tinted', undefined]) && eq(rows.legacyTrue, ['always', 'always'])
    && eq(rows.unreadable, ['off', 'always', 'off', 'still']), rows);
}
{
  const src = readFileSync(new URL('../lab/rack.js', import.meta.url), 'utf8');
  const wires = {
    imported: /import \{ firstRunMaterial, storedCard, storedFrost \} from '\.\/first-run\.js'/.test(src),
    asksCrossings: /const FIRST_RUN = firstRunMaterial\(isPhone\(\) \|\| isTablet\(\)\);/.test(src),
    tabletBeforeAsk: src.indexOf('const isTablet = () =>') > 0 && src.indexOf('const isTablet = () =>') < src.indexOf('const FIRST_RUN = '),
    oneTabletPredicate: src.split('const isTablet = () =>').length === 2,
    defaultCard: /const defaultCard = \(\) => FIRST_RUN\.card;/.test(src),
    frostSeed: /let frostMode = FIRST_RUN\.frost;/.test(src),
    applyFrost: src.includes('setFrost(storedFrost(s, frostMode), { quiet: true });'),
    applyCard: src.includes('setCardStyle(storedCard(s, undefined));'),
    phoneOverrideKept: src.includes("phone.wasFrost = frostMode; setFrost('off', { quiet: true });"),
  };
  judge('THE WIRING: rack.js asks with its own crossings (isPhone() || isTablet(), one tablet predicate, declared before the ask), seeds defaultCard and frostMode from the answer, reads stored choices through storedFrost / storedCard, and the phone crossing\'s FROST OFF override is untouched',
    Object.values(wires).every(Boolean), wires);
}
console.log((FAILED ? 'RED ' : 'GREEN ') + 'first-run.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
