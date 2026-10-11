/* tests/first-run.test.mjs — THE FIRST-RUN MATERIAL (W125, Josh 2026-09-25): a pure function of "is this a phone or a
 * tablet?" feeding rack.js' first-run defaults, and the stored-choice laws that always win over it.
 *   node tests/first-run.test.mjs
 * Oracles: the desktop's official defaults (CLAUDE.md, tests/official-defaults-palette.browser-test.mjs: light /
 * refractive / ALWAYS frost), the phone/tablet's (tinted / frost OFF), and rack.js' own reading laws — a card counts only
 * when this browser SAID it (cardSet, wave 51), a legacy frost `true` is ALWAYS (wave 67), anything unreadable is the
 * default.  0.5.0 C2: those laws are the look lift's (lab/look.js liftLook: an older blob into the kit's `mir.gui`, once), and
 * the device's material is the look store's defaults.  And the wiring: rack.js asks with its own crossings and feeds these
 * into the look store (a source read, because rack.js needs a DOM). */
import { readFileSync, readdirSync } from 'node:fs';
import { firstRunMaterial, FIRST_RUN_MATERIAL, firstRunQuality, deviceQuality, GRID_PAIRING, QUALITY_CEILING } from '../lab/first-run.js';
import { liftLook, LOOK_ROWS, BLOB_LOOK } from '../lab/look.js';
import { appSource } from './helpers/app-source.mjs';   // 0.5.2: the app's source — rack.js and the modules it dissolves into
import { repair } from '../lab/mir/core/prefs.js';
import { lookSchema } from '../lab/mir/shell/gui.js';
/** what a boot wears (0.5.0 C2): an older blob lifted (liftLook), repaired by the kit's own LOOK_SCHEMA rows, over the device's
 *  first-run material as their defaults — rack.js' LOOK_DEFAULTS into createLook */
function bootMaterial(s, mobile) {
  const d = firstRunMaterial(mobile), rows = lookSchema().filter((r) => LOOK_ROWS.includes(r.key)).map((r) => (r.key in d ? { ...r, default: d[r.key] } : r));
  const st = repair(liftLook(s || {}), rows); return { card: st.card, frost: st.frost };
}

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
    corruptSaid: [bootMaterial({ card: 'glass', cardSet: true }, true).card, liftLook({ card: 'glass', cardSet: true }).card],
    legacyTrue: [bootMaterial({ frost: true }, true).frost, bootMaterial({ frost: true }, false).frost],
    unreadable: [bootMaterial({ frost: false }, true).frost, bootMaterial({ frost: false }, false).frost, bootMaterial({ frost: 'nonsense' }, false).frost, liftLook({}).frost],
  };
  judge('THE READING LAWS rack.js always used, now the lift\'s (liftLook): a card saved but not SAID follows the device (wave 51), a said-but-unknown card is not lifted, a legacy frost `true` is ALWAYS (wave 67), an unknown one OFF, `false` / absent is not lifted (the device\'s default stands), and every result is one of the three seats',
    eq(rows.savedNotSaid, ['tinted', 'refractive']) && eq(rows.corruptSaid, ['tinted', undefined]) && eq(rows.legacyTrue, ['always', 'always'])
    && eq(rows.unreadable, ['off', 'always', 'off', undefined]), rows);
}
{
  const rows = {
    fresh: [liftLook({}), liftLook({}, null)],
    theme: ['light', 'dark', 'system', 'sepia'].map((t) => liftLook({ theme: t }).theme),
    rest: liftLook({ disc: false, blur: 14, accent: [12, '200', null], badges: true, controlHints: false }, 'on'),
    hints: [liftLook({ controlHints: true, hint: false }).hints, liftLook({ hint: false }).hints, liftLook({ hint: 1 }).hints, liftLook({ badges: 'yes' }).badges],
    help: [liftLook({}, 'off').help, liftLook({}, 'maybe').help],
    blobLook: BLOB_LOOK,
  };
  judge('THE LOOK LIFT (0.5.0 C2): a fresh profile lifts nothing; an unknown theme was DARK; DISCONNECTED, BLUR, the accents, STATUS TAGS, CONTROL HINTS (or the legacy `hint`) and HELP (its own key, on / off) are read as rack.js and native-ui.js read them; BLOB_LOOK names every blob key the lift reads',
    eq(rows.fresh, [{}, {}]) && eq(rows.theme, ['light', 'dark', 'system', 'dark'])
    && eq(rows.rest, { disconnected: false, blur: 14, accentA: 12, accentB: 200, vivid: 0, badges: true, hints: false, help: true })
    && eq(rows.hints, [true, false, true, false]) && eq(rows.help, [false, undefined])
    && eq(rows.blobLook, ['theme', 'card', 'cardSet', 'frost', 'disc', 'blur', 'accent', 'badges', 'controlHints', 'hint']), rows);
}
{
  const src = appSource();
  const wires = {
    imported: /import \{ firstRunMaterial, firstRunQuality \} from '\.\/first-run\.js'/.test(src) && /import \{ deviceQuality \} from '\.\.\/first-run\.js'/.test(src),   // 0.5.2 R3a: restore()'s deviceQuality left with it (lab/shell/persist.js)
    asksCrossings: /const FIRST_RUN = firstRunMaterial\(isPhone\(\) \|\| isTablet\(\)\);/.test(src),
    tabletBeforeAsk: src.indexOf('const isTablet = () =>') > 0 && src.indexOf('const isTablet = () =>') < src.indexOf('const FIRST_RUN = '),
    oneTabletPredicate: src.split('const isTablet = () =>').length === 2,
    /* 0.5.0 C2: the first-run material is the look store's `defaults` (lab/look.js, mir.gui); a stored choice is the store's */
    lookDefaults: src.includes("const LOOK_DEFAULTS = { theme: 'light', card: FIRST_RUN.card, frost: FIRST_RUN.frost, blur: 22, vivid: 0.5, disconnected: true };"),
    storeTakesThem: src.includes('createLook({ settings: settingsStore, defaults: LOOK_DEFAULTS,'),
    unnamedCardIsTheDevices: src.includes("look.set({ card: id === 'tinted' || id === 'refractive' ? id : FIRST_RUN.card })"),
    phoneOverrideKept: src.includes("phone.wasFrost = look.get('frost'); setFrost('off');"),
    foldsFromSeed: src.includes('const fold=FIRST_RUN.folded.includes(id);') && !src.includes("const fold=['settings','state']"),
  };
  judge('THE WIRING: rack.js asks with its own crossings (isPhone() || isTablet(), one tablet predicate, declared before the ask), seeds the look store\'s card and frost defaults (0.5.0 C2: LOOK_DEFAULTS → createLook, mir.gui) and the furniture\'s folds from the answer, an unnamed card is the device\'s, and the phone crossing\'s FROST OFF override is kept',
    Object.values(wires).every(Boolean), wires);
}
{
  const rows = { desktop: firstRunMaterial(false).folded, mobile: firstRunMaterial(true).folded };
  judge('THE FIRST-RUN FOLDS (W129; 2026-10): the furniture folds SETTINGS and STATE on every device, and SHADOW, MOLECULES and MO-REGISTRY too on a phone or tablet; the desktop\'s list is exactly the one it always folded; both frozen',
    eq(rows.desktop, ['settings', 'state']) && eq(rows.mobile, ['settings', 'state', 'shadow', 'chem', 'orbitals']) && Object.isFrozen(rows.desktop) && Object.isFrozen(rows.mobile), rows);
}
{
  const rows = { desktop: firstRunMaterial(false).more, mobile: firstRunMaterial(true).more, wired: appSource().includes('moreOpen: FIRST_RUN.more') };
  judge('THE MOLECULES MORE FOLD (0.4.0 S0): KICK / RUN / TDA / the spectra are OPEN on a desktop and folded on a phone or tablet, and rack.js hands the answer to the card',
    rows.desktop === true && rows.mobile === false && rows.wired, rows);
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
  const src = appSource();
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
  /* 0.3.1 · S2: …AND NO PREFERENCE KEY AT ALL — the field chrome in mat too (S1's FIELD_CHROME, D1), which restore() now ignores:
     WAVE DANCER's dead frame / axis / invert / axisInk / cornerSide went.  tests/new-project.test.mjs holds the empty project to
     these same three lists. */
  const LOOK = ['theme', 'card', 'frost', 'disc', 'accent'], FEEL = ['friction', 'spin', 'speed', 'autoRotate', 'dragGain', 'fling', 'camLock'],   // 0.5.3 M6: the LOCK is feel too
    CHROME = ['frame', 'axis', 'frameMode', 'axisMode', 'cornerSide', 'invert', 'axisInk'];
  const looks = demos.map((d) => { const P = d.data.presentation;
    return { name: d.name, ui: LOOK.filter((k) => P.ui && k in P.ui), camera: 'camera' in P, camFeel: FEEL.filter((k) => P.layout && P.layout.cam && k in P.layout.cam),
      chrome: CHROME.filter((k) => P.mat && k in P.mat),
      keeps: !!(P.obs && P.modulation && P.layout && Array.isArray(P.layout.cards) && P.ui && P.ui.stage && d.notebook && d.data.experiment) }; });
  judge('A BUNDLED DEMO CARRIES NO LOOK (W129, 0.3.1 · S2): no theme, card style, frost policy, disconnected cards or accent in ui, no camera feel (the camera block, layout.cam\'s friction / spin / auto-rotate / drag gain / fling), no field chrome in mat (frame / axis / frameMode / axisMode / cornerSide / invert / axisInk) — the device\'s stored choices stand; the physics, modulation, layout, pose, stage and notebook stay',
    demos.length > 0 && looks.every((r) => !r.ui.length && !r.camera && !r.camFeel.length && !r.chrome.length && r.keeps), looks);
}
console.log((FAILED ? 'RED ' : 'GREEN ') + 'first-run.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
