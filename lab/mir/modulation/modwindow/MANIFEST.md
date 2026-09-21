# MIR · modulation window — MANIFEST: baseline import and shipping revisions

**Provenance.** Written on 2026-09-06, when this window was staged from BASINS (the MANDELBROT
project) for λWAVES, and revised in λWAVES after; adopted into MIR on 2026-09-10 and corrected for
the kit on 2026-09-16. MIR 1.1.0 retired the byte-frozen law, and MIR is now the window's source:
later revisions are in `CHANGELOG.md`, not here. **BASINS-era references:** `anim.js:NNNN`,
`index.html:NNNN`, `glyph.js:NNN`, `colors.js` and `window.js` are BASINS' own files in the
MANDELBROT project as of 2026-09-06; `vid/` and the EXTRACT files (`modwindow-0N-*.css`,
§-numbers) were the extraction's staging artefacts. None of them is in MIR.

`modwindow.css` and `modwindow.js` began as BASINS' modulation window. The table
records the import transformation and the deliberate λWAVES revisions that now
ship with it.

## modwindow.css

| # | change | why |
|---|---|---|
| C1 | The nine `${…}` template holes are substituted with the integers `anim.js` interpolates — 23 occurrences (52, 64, 294, 450, 64, 224, 368, 320, 368). | A `${}` is not CSS. The result is byte-for-byte the text the browser receives in BASINS. |
| C2 | The baseline import rewrote selector text by the six-branch law printed at the head of PART B. Later rules explicitly revise the macro rail layout and controls. | The namespace keeps the portable window isolated while the current builder and stylesheet remain in sync. |
| C10 | The macro rail uses fixed row columns, a dedicated reorder grip over a compact delete action, and labelled `ADD MACRO` / `ADD DEVICE` actions; the redundant `OUT` caption and add-device chip are gone. | Route, master depth and row tools stay fixed when the value face is hidden. Stable macro ids keep routes attached when rows move. |
| C3 | **Not scoped, deliberately:** the five `:root`-subject blocks (the 20 `--m2-mat-*` tokens and the three motion tokens); the 5 `.kwin-chiprail[aria-label="MODULATION window controls"]` rules; 43 selector parts whose subject is `.m2ghost`, `.m2ring*`, `.m2clr*`, `.m2span*` or `[data-m2target]`. | Scoping any of these would **change what paints**. The chip rail is a DOM *sibling* of the window, so tokens on the window root would never reach it. The routing overlays are appended **into the routed control**, which `m2droppables()` takes from the app-wide `kit.controls` registry — in BASINS, `colors.js` registers 8 such controls in another window. Scoping them un-paints routing onto host controls. Every one of these names is already `--m2-*`, `.m2*` or a byte-exact aria-label, so none of them can fight a host. |
| C4 | Restored one character: the `}` that closes `@media (prefers-reduced-motion: reduce)`. | `modwindow-01-anim.css` stops at `anim.js:3306`; the template literal actually runs 1782–**3307**. Without it the sheet is not valid CSS. |
| C5 | 44 chrome rules brought, each labelled with its `index.html` line and its original selector, in ascending source order, **before** PART B. | The window sits in this chrome. Everything else — 117 `:root.skin-frost` rules, `.jwin*`, `.kwin-halo` / `.kwin-grip` / `.kwin-edge` (this window is `resizable:false`), `.kwin-chip-contentbar`, `.klock`, `.cpick`, `#banner-close`, `#zoe`, `#nebula-card`, `.save-sort-chip`, `:root.window-close-mode-*` — is not needed and is not here. Without `.skin-frost` the classic connected form paints, and it is correct and complete. |
| C6 | Five of those 44 come from EXTRACT **file 04**, not file 02: the `.glass, .panel, .chip` recipe and the four `.kctl` rules. | `#modwin` reads its border-width and style from `.glass`; so do `.m2ppick.glass` and `.m2deadpick.glass`. `.kctl` / `.ctl-sel` / `.ctl-round` / `.ksel` come from `registerControl` and file 01 styles them but never declares them. |
| C7 | Two of those 44 come from **`index.html` directly**: `button` (4802) and `button:active` (4812). **They are in no EXTRACT file.** | File 02's filter kept "every rule whose selector names `kwin` or `modwin`", and `index.html` has exactly four bare element selectors — `html`, `body`, `button`, `button:active`. **Measured headless, with and without:** 44 of the window's 48 buttons lose `cursor: pointer`; `.m2zoom`, `.m2audgrip`, `.m2audmac`, `.modxport` and `.modtempo` fall back to the UA font at 13.33 px because they rely on `font: inherit`; `.m2pickb` loses its `5px 9px` padding for the UA's `1px 6px`. |
| C8 | Three chrome selectors trimmed or widened where the port's scope demanded it: `.jwin` dropped from `--glass-bevel` and from `.kwin.resizing`; `.panel, .chip` dropped from the glass recipe; the three `.kwin-tab` rules gained a second arm for the chip rail. | `.jwin`, `.panel` and `.chip` are other BASINS surfaces. The chips **are** `.kwin-tab` (`button.kwin-tab.crail-chip`) and the rail is outside the window, so the descendant scope alone would not reach them. |
| C9 | **NOT added:** `.m2root { --fill: 0; --hit: 0; --signal: 0; --needle: -150deg; }` (EXTRACT §7.8). | It is an added rule, not a scoping change. It is a **required line in `host-contract.md`** instead, quoted verbatim, so the decision stays Josh's. |

## modwindow.js

| # | change | why |
|---|---|---|
| J1 | The element helper is `m2mk`, not `mk`. | EXTRACT §7.4: `window.js` exports a different `mk(tag, cls, txt)` whose third argument is TEXT and which does not append. One mechanical rename; zero behaviour change. |
| J2 | `m2mkBarGrip` and `m2preDel` are not built. | Both are dead in the source and both are named as traps. Their CSS travels; their JS must not. |
| J3 | It builds and does not wire. No model, no registry, no persistence, no paint. | The four host edges are the host's. See `host-contract.md`. |
| J4 | Every model-derived `d` attribute is emitted **empty**: the six `.m2gl` preset glyph paths, the editor's `.m2path` / `.m2fill`, `.m2lfominshape > path`, `.m2lfocmpshape > svg > path`. | These are *sampled from the model* so the button can never draw a shape the engine would not produce. Geometry is layout; those paths are not. |
| J5 | `dirPrev` and `dirNext` are added to `GLYPHS`, verbatim from `glyph.js:163` and `:166`. | **They are missing from EXTRACT file 05**, which scanned only the direct `setGlyph(...)` calls; these two reach `setGlyph` through `buildPresetStrip`'s local `btn()` helper (`anim.js:3809, 3811). They are the ◀ ▶ beside the name field in every one of Josh's frames. Without them the two buttons render the literal text `dirPrev` / `dirNext`. |
| J6 | The two visible strings that say **MANDELBROT** become `{factory}`, default `'FACTORY'`, in `COPY`. | EXTRACT §5: "a word, not a mechanism". Set `host.copy.factory` to restore it. |
| J7 | `COPY.knobs[…]` carries BASINS' `.m2kends` range labels as literals though the source derives them from the model (`String(M.ENV_MAX_S) + 's'`, `String(M.STEPS_MAX)`, …). | `#modwin .m2kends { display: none }` — nothing paints them. Overridable through `host.copy`. |
| J8 | `data-reopens-window` on every chip is the literal `'false'`. | That is what all five of this window's chips resolve to (`reopensWindow: false` on the three `chipItems`; drag and close have their own structural paths). |
| J9 | Macro rows expose a two-part reorder/delete tool and no route/OUT text. The rail exposes `ADD MACRO` and `ADD DEVICE`; device construction no longer needs a separate add-chip sentinel. | Reordering remains available after the value face is hidden, compact rows stay aligned, and both creation actions live in one predictable place. |

## COPIED BROKEN — recorded, not fixed. These are Josh's to decide.

*(Decided, 2026-09-06: Josh ruled the first three fixed — "whatever problem it has we will try to
fix here". The fixes are in the host sheet, `mir/modulation/modhost.css`, not in this directory:
`.m2pick` wears the house glass (reach-list 21), `.m2clr` gets a reachable recess (17), and the
◂ ▸ arrows were shown in FULL (18) until λWAVES wave 78 hid them again because the device grip
reorders. The one-word prescription below for `.m2pick` is wrong — ANTI-PATTERNS 22 and
`mir/modulation/PORT-NOTES.md` § THE THREE DIVERGENCES say why. The `.m2ribbon` row: `modwindow.js`
still never applies the class, but λWAVES' host controller, `lab/modwindow.js` (λWAVES), toggles it on
the rack root from a RIBBON chip, so in that mount the 21 rules paint.)*

| what | evidence |
|---|---|
| **`.m2pick` renders with no plate.** It reads `--m2-plate`, declared on `.m2root`; both `.m2pick` sheets are appended to the `.kwin` root, a *sibling ancestor* of `.m2root`. The substitution is invalid at computed-value time and `background` falls back to transparent. | `vid/f02.png` — the ADD LFO / ADD ENV / ADD AUDIO sheet has the cards showing through it. Measured in the staged copy: `rgba(0, 0, 0, 0)`. The fix, if wanted, is one word: add `glass` to the class string, exactly as `.m2ppick` and `.m2deadpick` already do. |
| **`.m2clr` has the same defect, and the extraction does not name it.** `.m2clr { background: var(--m2-recess-deep) }` (file 01 line 603) and `--m2-recess-deep` is declared on `.m2root`; `m2ensureClear(targetId, host)` appends the button **into the routed control**, which for a host-registered control is outside `.m2root`. | `anim.js:5114`. Every CLEAR button on a control outside the modulation window is transparent. |
| **The ◂ ▸ reorder buttons never paint, in any mode.** `.m2dev:not(.m2min) .m2move { display: none }` (`anim.js:2597`) and `.m2dev.m2min .m2move` is in the folded-strip hide list (`anim.js:2107`). | Measured: `display: none` in both `full` and `minimized`. `.m2grab`'s own aria-label still promises "The arrow buttons beside it do the same thing one place at a time." The buttons are built and wired; the CSS hides them. |
| **The `.m2ribbon` class is never applied to anything.** `m2SetRibbon` only *removes* it, from `panelWin.root` and from `m2root`, "defensively". | `anim.js:7118–7119`, whose own comment says the ribbon name "no longer creates a second CSS presentation". The 21 `.m2ribbon …` rules in this sheet are dead, and EXTRACT §3.4's "ribbon form" table describes a form that cannot be reached. They are copied anyway, and cost nothing. |

## THINGS IN THE EXTRACTION THAT TURNED OUT WRONG

1. `modwindow-01-anim.css` is **missing its last line** — the `}` closing the reduced-motion `@media`. See C4.
2. `modwindow-04-material.css` **is not valid CSS**: an orphan `html, body {` at line 60 with no declarations and no close, and an unclosed `@supports` at line 210. Brace-matching runs to EOF; the five rules taken from it were lifted by anchored regex instead.
3. `modwindow-05-glyphs.js` misses **`dirPrev` and `dirNext`**. See J5.
4. `modwindow-02-chrome.css` misses the **`button` reset**, which its own filter could not see. See C7.
5. §3.4's 44-px table names nine `::before` hit bands "on `.m2fold`, `.m2ab`, `.m2move`, `.m2pow`, `.m2x`, `.m2grab`, `.m2ring`, `.m2clr` and **`.m2swapbadge`**". `.m2swapbadge` is not a hit band — it is a `pointer-events: none` 44 × 44 indicator. The ninth `::before` is **`.modtempo`**, which the same paragraph then describes separately. The count of nine is right; one name is wrong. All nine are present and verified.
6. §3.4 gives `.m2col { width: 92px }` and `.m2rt { width: 104px }`. Those are base values that **no FULL card uses** — each kind re-grids the body. Measured: AUDIO `.m2col` 88, ENV `.m2rt` 90, LFO's `.m2col` and `.m2rt` are full-width grid rows (346 at a 360 card).
7. §3.4's frame table gives `.m2head` height 48 px. That is the **content** box: `.m2head` also carries `padding: 2px 5px` and there is **no global `box-sizing: border-box` in BASINS** (the only bare `*` rule in `index.html` sets `transition-duration`), so the border box is 52. Measure `getComputedStyle(...).height`, not the rect.
