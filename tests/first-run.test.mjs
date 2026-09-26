/* tests/first-run.test.mjs — THE FIRST-RUN MATERIAL (W125, Josh 2026-09-25): a pure function of "is this a phone or a
 * tablet?" feeding rack.js' first-run defaults, and the stored-choice laws that always win over it.
 *   node tests/first-run.test.mjs
 * Oracles: the desktop's official defaults (CLAUDE.md, tests/official-defaults-palette.browser-test.mjs: light /
 * refractive / ALWAYS frost), the phone/tablet's (tinted / frost OFF), and rack.js' own reading laws — a card counts only
 * when this browser SAID it (cardSet, wave 51), a legacy frost `true` is ALWAYS (wave 67), anything unreadable is the
 * default.  And the wiring: rack.js asks with its own crossings and feeds these into defaultCard / frostMode /
 * applySettings (a source read, because rack.js needs a DOM). */
import { readFileSync, readdirSync } from 'node:fs';
import { firstRunMaterial, storedCard, storedFrost, bootMaterial, FIRST_RUN_MATERIAL, firstRunQuality, deviceQuality, GRID_PAIRING, QUALITY_CEILING } from '../lab/first-run.js';

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
    imported: /import \{ firstRunMaterial, storedCard, storedFrost, firstRunQuality, deviceQuality \} from '\.\/first-run\.js'/.test(src),
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
/* ── PACE P2 (2026-09-25): THE FIRST-RUN QUALITY and THE DEVICE'S CEILING ─────────────────────────────────────────────── */
{
  const rows = { desktop: firstRunQuality('desktop'), tablet: firstRunQuality('tablet'), phone: firstRunQuality('phone'), unknown: firstRunQuality(undefined) };
  judge('THE FIRST-RUN QUALITY: a TABLET starts on the GRID pairing\'s 64³ (110 steps × 0.75); a desktop on 64³ × 160 × 1 exactly as before (FA6 is the desktop\'s call); a phone gets the desktop seed because its crossing (enterPhone) applies and gives back its own 110 × 0.75; each call is a fresh object',
    eq(rows.tablet, { res: 64, steps: 110, scale: 0.75 }) && eq(rows.desktop, { res: 64, steps: 160, scale: 1 }) && eq(rows.phone, rows.desktop) && eq(rows.unknown, rows.desktop)
    && eq(rows.tablet, { res: 64, ...GRID_PAIRING[64] }) && firstRunQuality('tablet') !== firstRunQuality('tablet'), rows);
}
{
  const desk128 = { res: 128, steps: 240, scale: 1, auto: false, autoScale: 0.55, minScale: 0.35 };
  const rows = {
    tablet128: deviceQuality(desk128, 'tablet'), tablet96: deviceQuality({ res: 96, steps: 200, scale: 0.9, auto: false }, 'tablet'), tablet64: deviceQuality({ res: 64, steps: 160, scale: 1 }, 'tablet'),
    phone128: deviceQuality(desk128, 'phone'), phone96: deviceQuality({ res: 96, steps: 160, scale: 1 }, 'phone'), phone64: deviceQuality({ res: 64, steps: 240, scale: 1 }, 'phone'),
    desktop128: deviceQuality(desk128, 'desktop'), none: deviceQuality(undefined, 'tablet'), noGrid: deviceQuality({ steps: 90, auto: true }, 'tablet'),
  };
  judge('THE CEILING (deviceQuality, pure): a tablet marches at most 96³ and a phone 64³ — a grid brought down takes THAT grid\'s pairing (128 → 96 × 160 × 1 on a tablet, → 64 × 110 × 0.75 on a phone), a grid within the ceiling keeps the steps and scale it was saved with, a desktop takes the grid as saved, and the runtime keys ride along untouched',
    eq(rows.tablet128, { res: 96, steps: 160, scale: 1, autoScale: 0.55, minScale: 0.35 }) && eq(rows.tablet96, { res: 96, steps: 200, scale: 0.9 }) && eq(rows.tablet64, { res: 64, steps: 160, scale: 1 })
    && eq(rows.phone128, { res: 64, steps: 110, scale: 0.75, autoScale: 0.55, minScale: 0.35 }) && eq(rows.phone96, { res: 64, steps: 110, scale: 0.75 }) && eq(rows.phone64, { res: 64, steps: 240, scale: 1 })
    && eq(rows.desktop128, { res: 128, steps: 240, scale: 1, autoScale: 0.55, minScale: 0.35 }) && eq(rows.none, {}) && eq(rows.noGrid, { steps: 90 })
    && QUALITY_CEILING.tablet === 96 && QUALITY_CEILING.phone === 64 && QUALITY_CEILING.desktop === undefined, rows);
  const autoDropped = ['desktop', 'tablet', 'phone'].every((d) => !('auto' in deviceQuality({ res: 64, auto: false }, d)) && !('auto' in deviceQuality({ res: 64, auto: true }, d)));
  judge('A FILE NEVER CARRIES AUTO SCALE: `auto` is dropped on every device, whether the file says true or false (the switch is the device\'s, in the settings key; serialize() still writes it for older readers)', autoDropped);
  const src = readFileSync(new URL('../lab/rack.js', import.meta.url), 'utf8');
  const demoDir = new URL('../lab/demos/', import.meta.url);
  const demos = readdirSync(demoDir).filter((f) => f.endsWith('.lambdawaves.json')).map((f) => JSON.parse(readFileSync(new URL(f, demoDir), 'utf8')));
  const wires = {
    seed: src.includes("const quality = { ...firstRunQuality(isPhone() ? 'phone' : isTablet() ? 'tablet' : 'desktop'), auto: true, autoScale: 1, minScale: 0.35 };"),
    restore: src.includes("Object.assign(quality, deviceQuality(pr.quality, phone.on ? 'phone' : tablet.on ? 'tablet' : 'desktop'));") && !src.includes('Object.assign(quality, pr.quality'),
    serializeStillWrites: src.includes('quality: { ...quality }'),
    gridPairingAgrees: src.includes('quality.steps = { 64: 110, 96: 160, 128: 240 }[+v]; quality.scale = { 64: 0.75, 96: 1, 128: 1 }[+v];')
      && eq(GRID_PAIRING, { 64: { steps: 110, scale: 0.75 }, 96: { steps: 160, scale: 1 }, 128: { steps: 240, scale: 1 } }),
    demosCarryNoQuality: demos.length > 0 && demos.every((d) => !!d.data && !!d.data.presentation && !('quality' in d.data.presentation)),
  };
  judge('THE WIRING: rack.js seeds `quality` from firstRunQuality with its own crossings (key order res, steps, scale, auto, autoScale, minScale — the serialize bytes), restore() applies a saved quality only through deviceQuality, serialize() still writes the whole block, the GRID segment\'s pairing is the one first-run.js states, and no bundled demo carries a quality (WAVE DANCER\'s desktop 128³ × 240 with AUTO SCALE off is gone)',
    Object.values(wires).every(Boolean), wires);
  /* W129 (2026-09-25): A DEMO CARRIES NO LOOK.  restore() applies each ui/camera key only when the file carries it, and
     every one of these is a key this browser's settings own (saveSettings): opening WAVE DANCER used to write dark /
     refractive / ALWAYS / its accent / friction 0 into the device's STORED choices.  The demo keeps its physics, register,
     modulation, layout, camera POSE (obs, layout.cam's pose), stage (a routed target) and notebook. */
  const LOOK = ['theme', 'card', 'frost', 'disc', 'accent'], FEEL = ['friction', 'spin', 'speed', 'autoRotate', 'dragGain', 'fling'];
  const looks = demos.map((d) => { const P = d.data.presentation;
    return { name: d.name, ui: LOOK.filter((k) => P.ui && k in P.ui), camera: 'camera' in P, camFeel: FEEL.filter((k) => P.layout && P.layout.cam && k in P.layout.cam),
      keeps: !!(P.obs && P.modulation && P.layout && Array.isArray(P.layout.cards) && P.ui && P.ui.stage && d.notebook && d.data.experiment) }; });
  judge('A BUNDLED DEMO CARRIES NO LOOK (W129): no theme, card style, frost policy, disconnected cards or accent in ui, no camera feel (the camera block, layout.cam\'s friction / spin / auto-rotate / drag gain / fling) — the device\'s stored choices stand; the physics, modulation, layout, pose, stage and notebook stay',
    demos.length > 0 && looks.every((r) => !r.ui.length && !r.camera && !r.camFeel.length && r.keeps), looks);
}
console.log((FAILED ? 'RED ' : 'GREEN ') + 'first-run.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
