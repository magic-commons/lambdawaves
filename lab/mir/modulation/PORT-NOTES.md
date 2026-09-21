# MIR · modulation — the port notes

*What was vendored, from where, what was forced, and what was deliberately left alone.
Read this before you touch `mod.js` or `curve.js`. Nothing in this directory is committed
by the wave that wrote it.*

**Provenance.** Written in λWAVES as `lab/mir/PORT-NOTES.md`, when these files were a port of
BASINS' (MANDELBROT) modulation model inside λWAVES; "ours", "here", "the lab" and the wave
numbers are λWAVES'. Adopted into MIR on 2026-09-10, when `lab/mir/` became the kit's
`mir/modulation/` (and `glyph.js` the kit's `mir/glyph.js`), and corrected for the kit on
2026-09-16: a file only λWAVES has is marked "(λWAVES)", and so are its gates (`tests/*.mjs`,
`B129`). **The counts in this file — eight forced edits, eight hunks, 98 gates — are the port
as of 2026-09-05…09-07.** They have not been re-measured since `mod.js` changed in MIR 1.1.0
and 1.4.0; treat them as history, and run the diff before trusting a number.

## What is here

| File | Origin | Status |
|---|---|---|
| `mod.js` | vendored | the modulation model — LFO, ENV, AUDIO, macros, routes, transport arithmetic, serialization, presets |
| `curve.js` | vendored | the breakpoint-curve mathematics `mod.js` leans on |
| `glyph.js` | vendored | **wave 55** — Josh's own glyph library: one SVG drawing per meaning, on a 24-unit grid. The rack's header chips and the two new float chips are drawn from it. *In the kit it is `mir/glyph.js`, one level up.* |
| `registry.js` | **ours** | MIR edge 1 — the parameter registry |
| `host.js` | **ours** | MIR edges 2, 3 and 4 — target host, clock, presentation |
| `PORT-NOTES.md` | **ours** | this file |

*(Also in the kit's `mir/modulation/`, and not vendored: `modhost.css`, the host seat — λWAVES'
`lab/modhost.css` — and `modwindow/`, BASINS' window as ported on 2026-09-06, whose source MIR
has been since 1.1.0.)*

Proof: `node tests/mir.test.mjs` (λWAVES) — 98 gates (53 at the port, 71 after wave 60's curve
section, 75 after wave 61's bipolar route, 87 after wave 63's model version and header count,
98 after wave 65's arm and resume law). It was deliberately not in `test.sh` when this
was written; **wave 52 adopted it** (`MI_RC`, folded into `NODE_RC`), because wiring it in
belonged to the rack wave, which owns that file.

## Provenance

Both vendored files were taken on **2026-09-05** from the MANDELBROT project's `app/` directory —
`$MB/app/`, where **`MB` is wherever that repository is checked out on the machine doing the merge**.

*(WAVE 68: this document and the three vendored headers used to print an absolute path from the
machine they were taken on. These files SHIP — λWAVES' `dist/` serves them publicly — and dossier §27 asks
for no accidental directory leakage, while this build's own `NOT SHIPPED` list gives "names local
absolute paths" as a reason to withhold a directory. Either the rule applies or it does not. The
provenance is unchanged and the diff command below still works; it takes `MB` from the environment
instead of from one person's home directory.)*

| File | Lines at take | sha256 of the source |
|---|---|---|
| `mod.js` | 2978 | `d76cc74f886357a35794519e0a953f8f0328abea91443a47811e26dec5777b74` |
| `curve.js` | 416 | `9991eb71da046385d43cd51c8b63ab81bb2aac82fdd122a08d1dbaa7d089b485` |
| `glyph.js` | 453 | `513cd3120ec539f13e139d940d089f29cf71cbbc5cad427445351fb6c3ab3831` |

*(2026-09-16: `mir/glyph.js` is 399 lines and no longer carries its provenance header. A λWAVES
pass on 2026-09-09, before the extraction, removed that header, the source's 40-line header
comment and the comments on three glyphs (`render`, `compact`, `save`). The two marked edits are
still there, and a diff against the source still shows no drawing, viewBox, stroke weight or name
changed; the table above is where its provenance now lives.)*

## THE LAW

*(Status, 2026-09-16: this law, its hunk count and §16's undo describe the port as λWAVES held it
on 2026-09-05…09-07. `mod.js` has since changed beyond its eight marked edits: the matrix/audio
extensions its header names (λWAVES `docs/mir-matrix-patch.json`), the audio device work MIR
1.1.0 took back from λWAVES. The law is still the right way to take an upstream fix, and λWAVES'
§16 still proves the eight edits by their exact text — which is why MIR 1.4.0 left `mod.js` untouched
rather than make the preset key injectable. The counts below are not re-measured.)*

**These two files are maintained by DIFF against their source, never rewritten.**

An upstream fix has to still be a three-line patch a year from now. So:

- do not reformat, re-order, tidy, or "improve a comment" in either file;
- do not point a linter or a formatter at this directory;
- every forced change is **one line of code**, carries a `λWAVES: forced edit n/N` marker in
  a comment on the line(s) above it, and is listed in the table below with its reason;
- if you need different behaviour, **change `host.js`** — the host is ours, those two
  files are theirs.

Taking an upstream fix:

```sh
MB="${MB:?set MB to your local checkout of the MANDELBROT project}"
diff -u "$MB/app/mod.js" mir/modulation/mod.js   # EIGHT hunks when measured, 2026-09-06, on λWAVES' lab/mir/mod.js; not re-measured since (see the status note)
```

Eight and not nine for eight edits: `7/8` and `8/8` sit three lines apart, so `diff -u`'s context
merges them into one hunk. If that command ever prints more than **eight** hunks in `mod.js`,
somebody broke the law and the next upstream merge is going to be archaeology.  Every one of the eight is a marked line next to a
comment that names its number, and `tests/mir.test.mjs §16` (λWAVES) UNDOES all eight by their exact text and
asserts the result is byte-identical to the source — so the law is gated, not merely written down.
**And wave 63 gated the one thing §16 could not see**: it strips the provenance header before it
diffs, so the header's own *"Forced 1 edit — every other byte below this header is the source"* stayed
in the file for a whole wave with six edits under it.  §16 now reads the number out of the header and
fails unless it equals the markers in the body and the entries in its own table. **If you add an
edit, the header's count is part of the edit.**

## The forced edit list — 10 edits, total

`mod.js` carries **eight**, numbered `1/8` … `8/8` in the file itself. `glyph.js` carries two,
which are a dead import and its one call site and are not numbered because they are not a
behaviour change.

| # | File | Line (ours) | Change | Why it was forced |
|---|---|---|---|---|
| 1/8 | `mod.js` | `PRESET_LS` | `'mandel.modpresets'` → `'lambdawaves.q0.modpresets'` | The boundary law is that MIR never carries a Card's identity, and this is a live `localStorage` key. Left alone, a λWAVES build would read and write BASINS's preset store. `PRESET_LS` is an exported `const` string, so there is no way to override it from the host — it is the one thing in the file that cannot be injected. Our house namespace is `lambdawaves.q0.*` (`lab/rack.js` (λWAVES): `LS_EXP`, `LS_PRES`, `SETTINGS_KEY`). *(Still true in MIR 1.4.0, by choice: making the key injectable is a `mod.js` edit, and it waits for λWAVES' §16 byte gate to retire so the gate is not broken by an adopt.)* |
| 2/8 | `mod.js` | `newRoute` | `bi: !!o.bi,` added to the route record | **wave 61 · THE BIPOLAR ROUTE.** See the block below. |
| 3/8 | `mod.js` | `routeInfluence` | `lerped - r.min` → `lerped - (r.bi ? (r.min + r.max) / 2 : r.min)` | The one expression the flag is read in. |
| 4/8 | `mod.js` | `setRouteRange` | `if (patch.bi !== undefined) r.bi = !!patch.bi;` | The flag is patchable, exactly like `min` and `max`. |
| 5/8 | `mod.js` | `serialize()` | `bi: r.bi ? 1 : undefined` on the route record | It travels. `undefined` is dropped by `JSON.stringify`, so a rack with no bipolar route is byte-identical on the wire to one written before the edit existed. |
| 6/8 | `mod.js` | `deserialize()` | `{ id: String(r.id), bi: !!r.bi }` | It comes back. **A flag that does not survive a preset does not change a control, it changes the sound of every patch ever saved with it.** |
| 7/8 | `mod.js` | `MOD_STATE_V` | `4` → `104` | **wave 63 · THE VERSION THE BIPOLAR FLAG MADE NECESSARY.** See the block below. |
| 8/8 | `mod.js` | `MOD_STATE_READS` | `[3, 4]` → `[3, 4, 104]` | So this build still reads every rack and preset written before wave 61. The refusal only runs the other way. |
| g1 | `glyph.js` | `import { publishM4 }` | commented out | `overlay.js` is MANDELBROT's M4 diagnostics sink and has no counterpart in this lab. An unresolvable import is a module that does not load at all, so this one is not optional. |
| g2 | `glyph.js` | `try { publishM4(…) }` | commented out (the two lines of the one statement) | The same sink at its one call site. Our gate reads the DOM — `data-gly` on every chip — rather than a published surface, so nothing is lost. |

### Why the bipolar route had to be a model edit (wave 61)

Josh's brief for the macro router: *"clicking can choose 'center of dial' or 'highest dial'
(where the arc goes from 0 to the dial current)."*  With
`offset(m) = (r.max − r.min) · m · masterDepth` the second of those is already expressible
(`min = b, max = 0`), and so is its opposite (`min = 0, max = 1 − b`).  **The first is not**,
because the model's offset is **always 0 when the macro reads 0** — so a route whose base is
the CENTRE of the swing needs a negative offset at `m = 0`, which the arithmetic cannot
produce.

Three workarounds were tried before the file was touched, and all three fail honestly:
inverting the source still yields 0 … 1; two opposed routes both start at offset 0; and
shifting the base down by a half-span would produce the right *picture* by **destroying the
user's number** — which is precisely the failure `registry.js` exists to prevent
(*"the base is the only copy of that number in the program"*, ANTI-PATTERN 13).

So four touches, in five new hunks, each marked and each undone by the gate.  `diff -u` against
the source grew from **two hunks to seven** — the provenance header plus the six marked ones — and
an upstream fix is still a patch.  **Half of what Josh asked for is not worth protecting a
two-hunk diff.**

### Why the model version had to move, and why it moved to 104 (wave 63)

Edits 2/8 and 6/8 changed **what a stored route means**. A rack carrying `bi`, read by a build that
took an upstream `mod.js` and did not re-apply those two markers, drops the flag; `routeInfluence`
then measures from `r.min` again and the base walks from the *centre* of the swing to its *floor* —
**30 % of scale at the macro's middle**, silently, on the second open. Measured:

```
THIS build (bi honoured):  macro 0 -> 0.2000   0.5 -> 0.5000   1 -> 0.8000
without 2/8 + 6/8:         macro 0 -> 0.5000   0.5 -> 0.8000   1 -> 1.1000
```

A version stamp is the only thing such a build already reads, and at `MOD_STATE_V = 4` the change was
**version-indistinguishable**. It is 104 now, and `MOD_STATE_READS` is `[3, 4, 104]`:

- **our preset opened by a build without the edits** — `modStateReadable(104)` is false against that
  build's `[3, 4]`, so `presetApply` refuses it *loudly*, by machinery that was already there;
- **an upstream v4 rack opened here** — still read, and there is nothing to migrate: a rack with no
  `bi` on any route is byte-identical on the wire to one written before the flag existed;
- **a future upstream v5 opened here** — refused rather than half-read, which is correct, because we
  have never seen it. **That is why the number is 104 and not 5.** The λWAVES model-version namespace
  is `100 + the upstream version this model is derived from`, so ours can never collide with an
  upstream sequence, and the divergence is legible in the number itself.

**The rack road needed a second half, because it carries no stamp at all.** `mod.js` stamps `modV` on
a PRESET record only; the model's own `serialize()` emits no version and `deserialize()` checks none —
so a project file and this browser's `localStorage`, the road the lab uses every session, were
version-blind. `lab/rack.js` (λWAVES) stamps `v` onto the rack it writes (an additive key the model ignores in
both directions) and `restoreModulation()` **refuses a stamp this build cannot honour**, saying both
numbers on the card. An **absent** `v` is not a refusal: every rack written before wave 63 has none
and means "predates the stamp", which is the reading `mod.js` prescribes for an absent preset stamp.
`rack.js` is ours, so that guard survives an upstream re-take of the vendored file — which is exactly
the scenario this file warns about.

What was NOT edited, and why it does not need to be:
- **`targetPos` / `targetValue`** only sum `influence`, so they follow for free.
- **The `firstLerp` compatibility branch** (`!Number.isFinite(base)`) is no longer *the* lerp
  for a bipolar route. That branch exists only for callers that omit `base`, which the engine
  never does — it is stated here rather than pretended to be unaffected.
- **`dump()`'s route block** carries no `bi`. `routeList()` hands back the live route objects,
  so `r.bi` is readable without a sixth touch in a diagnostics-only serializer.
- **Per-route BYPASS** (`r.off`) is Serum's second useful menu item and there is no field for
  it. It is **not** in v1: it would have been a fifth touch bought for a convenience, where
  `bi` bought a mode Josh named.

`curve.js`: **zero** content edits. It is leaf mathematics with no identity of its own.

`glyph.js`: **zero drawings touched.** Not one path, viewBox, stroke weight or name was changed — these are
Josh's own marks and the whole point of vendoring rather than copying is that a correction to one of them
upstream is still a three-line patch here. Sizing is the CALLER's by the module's own design (width/height
are presentation attributes, the lowest-priority source of a value), so `mir/css/base.css` (λWAVES' `lab/lab.css §55b`) sizes every chip
and no call site in this lab passes a pixel count.

Both files also carry a prepended provenance header. That is the only other difference,
it is one hunk at line 1, and it is what makes the diff above legible.

### The module system forced nothing

`mod.js`'s only import is `./curve.js`, and `curve.js` sits beside it here, so the import
graph needed no edit at all. `mod.js` boots under node **verbatim**, including
`presetList()` — its `localStorage` reads are already inside a `try` that returns `null`
when there is no storage. *(So the one-line summary under `mod.js`'s header — "Pure: no DOM, no
renderer, no storage" — is the source's, and true of the model but not of its presets: those
read and write `localStorage` under `PRESET_LS`.)*

## What was deliberately NOT edited

- **`FACTORY_PRESETS`** (≈90 lines of data, ids `freq` · `phase` · `bright` ·
  `pal.e1.phase` · `pal.e2.phase`). These are BASINS target ids and they do not exist
  here. Editing that block would be the rewrite this port exists to avoid, and it is not
  needed: every route in them lands on a target our registry does not have, so
  `syncDormant()` marks them **dormant** on the first `targets.sync()` and they sit there
  inert, keeping their settings, exactly as the dormancy law intends. That is the designed
  behaviour for a preset written against a foreign target set, not a bug we are tolerating.
- **`PRESET_FOLDER_FACTORY = 'MANDELBROT'`.** Left as the honest provenance of the presets
  it names. Relabelling that folder `λWAVES` while its contents route to `pal.e1.phase`
  would be a *worse* lie than the foreign name. If the rack wave wants the factory folder
  gone from the preset sheet it should filter `presetList()` on `factory: 1` in the view,
  or empty the exported `FACTORY_PRESETS` array in place from `host.js` — both are host
  decisions and neither is a file edit. *(A third — renaming the folder from the host — waits with the
  injectable key, see 1/8.)*
- **`PRESET_FOLDER_DEFAULT = "Josh's Collection"`.** Correct in both projects.
- **The AUDIO model.** `mod.js` carries the whole normalized follower/band/onset model.
  It has no browser dependency (that lives in their `audio.js`, which we did not take) and
  costs nothing dormant. If λWAVES ever wants audio-reactive modulation it is already here.

### What glyph.js was taken FOR (wave 55)

The lab was spelling its header marks as literal characters — `×`, `▾`, `⇄`, `i`, `+`, `⇱`, `⤢`. Every one of
those is a request to whichever font the device resolves, and glyph.js's own header lists the three ways that
goes wrong (iOS substitutes a colour emoji; the advance width is the font's business, not the layout's; a
missing codepoint is a notdef box). Wave 55 replaced the ones with a drawn equivalent and left the ones
without, and REPORT.md wave 55 (λWAVES) lists both sides of that line so the polish wave knows what is outstanding.
The two NEW chips this wave needed — pop-out / dock, and compact / full — were already in the library:
`north` and `reopen`, `compact` and `expand`.

## THE THREE DIVERGENCES (wave 69) — the plugin's own defects, fixed HERE, and the diff for the port back

`modwindow/ACCEPTANCE.md` §9 asks a mount to **reproduce** three measured defects, on the
stated grounds that a mount rendering them correctly has silently redesigned the window. **Josh has
ruled the other way**, 2026-09-06: *"The modulation window is broken when we were even working on it
on basins so whatever problem it has we will try to fix here."*

So all three are fixed — and **the artifact's own two source files, `modwindow.js` and
`modwindow.css`, are still byte-identical to the staged copy** (only `ACCEPTANCE.md` gains a note
saying its §9 is superseded for this mount, so a future reader is not left with a spec that
contradicts a gate), because every correction is written in `lab/modhost.css`, which is ours. That is what keeps the
reciprocal port back to MANDELBROT a **diff of three lines in a host sheet** rather than archaeology
in a 132 KB stylesheet. Each is numbered in the reach list there (16, 17, 18) with its reasoning.
*(In the kit: that host sheet is `mir/modulation/modhost.css`. Its later waves moved two of the
three: 16 is superseded by 21 (wave 70 — the sheet wears the house glass), and 18 is retired
(wave 78 — the device grip reorders, so the arrows are hidden again); 17 stands. "Still
byte-identical" was true on 2026-09-06; MIR 1.1.0 changed `modwindow.js` and `modwindow.css`, and
MIR is their source now.)*

| # | The defect, as measured | The fix, and where it lives |
|---|---|---|
| D1 | **`.m2pick` renders fully transparent.** The ADD LFO / ADD ENV / ADD AUDIO sheet and the macro sheet beside it read `--m2-plate`, declared on `.m2root`; both are appended to the WINDOW root, a *sibling* subtree. Invalid at computed-value time → `background` falls back to transparent. `vid/f02.png`. | `modhost.css` 16: `background-color: var(--m2-plate, var(--m2-mat-chassis))`. The fallback names the ladder's own chassis, which IS declared in this build's seat and IS themed, so the sheet wears exactly the plate it was written for. A `.m2pick` inside `.m2root` is unchanged. |
| D2 | **`.m2clr` has the identical defect.** It reads `--m2-recess-deep` from `.m2root` while `m2ensureClear()` appends it INTO the routed control, which for a host-registered control is outside `.m2root` — so every CLEAR on a control outside the plugin is transparent. `anim.js:5114`. | `modhost.css` 17: `background-color: var(--m2-recess-deep, var(--glass-well))`. Outside the window the fallback is the HOUSE recess, which is themed and is the right answer twice over — a button that lands on a λWAVES dial should wear the λWAVES well. Nothing in this build BUILDS one (the overlay split, wave 64), so this is a fix for the port back and for any host that does route the artifact's own overlay. |
| D3 | **The ◂ ▸ reorder arrows have never painted a pixel.** Built by `buildDevice()`, wired here to `M.moveSource`, and hidden by three rules that between them cover every mode: `.m2dev.m2cmp .m2move` (776), `.m2dev.m2min .m2move` (813) and `.m2dev:not(.m2min) .m2move` (1303). | `modhost.css` 18 brings them back in **FULL mode only**. Only 1303 is the accident; the other two are the artifact's own stated reasoning (*"Compact spends header room on identity and status, not clipboard/reorder"*, and a 64-px folded strip has no room) and they STAY. The run order that IS the fire order is now changeable without a drag. |

**AND `modwindow/MANIFEST.md`'s PRESCRIPTION FOR THE FIRST TWO IS WRONG FOR THIS MOUNT**, which is worth
writing down because it is the obvious thing to try and it fails silently. It says the fix is *"one
word: add `glass` to the class string, exactly as `.m2ppick` and `.m2deadpick` already do."* Those two
sheets carry **no background of their own**, which is the whole reason `glass` works for them.
`.m2pick` does — `.mir-modwindow .m2pick { background: var(--m2-plate) }` at (0,2,0) — and **a
declaration that is invalid at computed-value time still WINS the cascade first and only then computes
to `unset`**. `.glass` is (0,1,0) and loses; `.m2clr`'s own (0,1,0) beats `.glass` on source order,
since `modwindow.css` loads after `skin.css`. The word would have changed nothing and the gate would
have stayed green on `rgba(0, 0, 0, 0)`. **Give the var a reachable value instead.**

**The gate that used to pin them is the gate that now proves them fixed.** `B129`'s (λWAVES) `copiedBroken`
arm is `fixed` and asserts the opposite of what it asserted, and `B131`'s clear-button measurement
asserts a real plate. A gate that pins a defect is the defect (ANTI-PATTERN 13), and the way to
retire one is to invert it in the same wave that fixes what it pinned — not to delete it.

## THE PLUGIN WEARS THE HOUSE GLASS (wave 69)

Josh, three times, most recently against his own screen recordings: the ABOUT card and the KEYS sheet
wear our glass with the field's colour coming through them, and the plugin beside them was *"a flat
dark slab"*. It was never a colour mismatch — wave 66's `hsl(212 14% 13%)` and the house's
`hsl(214 16% 13%)` are `rgb(28, 33, 38)` either way. It was that **reach-list 15 pinned the window
opaque at a specificity CARD STYLE cannot reach**, so every other card in the lab went REFRACTIVE and
this one stayed a plate. The seat's private `--glass-hue / -sat-tint / -lum / -tint / -opacity` are
deleted, `--m2-mat-pane` is `hsl(var(--glass-tint) / var(--m2-scrim))` with the house's own tokens,
and `#modwin` answers the card switch like `.dev` does. **One exception, stated in the sheet**: on the
LIGHT theme it keeps a pane, because the artifact's ink ladder is 52 white-alpha rungs on both themes
by the port's own standing decision, and white ink on a transparent card over a near-white stage is
not a style. Flip the ink and that exception goes.

## What we did NOT port, and will not

- **`anim.js` (9573 lines) — their modulation WINDOW.** Josh's word for its macro surface
  is *buggy*. Board #34 writes our own view in kit.js idiom. *(Overtaken on 2026-09-06: the
  window was then ported from `anim.js` after all, as an artifact — `modwindow/` — because
  three re-implementations had each lost it; `docs/STYLE-LOCK.md` § THE PORTED-WINDOW EXCEPTION.)*
- **`window.js` (4727 lines) — their WindowKit.** Our rack (λWAVES' `rack.js`) is our window kit.
- **`basins-modulation-{host,targets,presentation}.js`.** Read as the specification of
  what a host must supply; `host.js` is our answer to the same question. Their
  `entryFreqPos`/`entryFreqRaw` constants (0.05 – 20 Hz) are reproduced exactly so a rack
  serialized in one project reads the same in the other.

## The one behavioural thing the vendored file does that will surprise you

`M.advance(dt, wall)` treats its two arguments completely differently depending on the
sync mode:

- **wall sync** (the default): `beats` is *derived* from the absolute wall stamp —
  `anchorBeats + bpm/60 * (wall − anchorAt)`. Clamping `dt` does nothing to it. Only
  `reanchorTransport()` moves it.
- **free sync**: `beats` is *accumulated* from `dt`. Clamping `dt` loses time here, which
  is precisely what the clamp is for.
- **envelope time** is `dt`, always, in both modes.

`host.js` documents this at length because it is the trap in the whole architecture.

---

# What the rack wave must know (λWAVES)

*The integration notes for λWAVES' own rack (`lab/rack.js`, `lab/clock.js`, `lab/render-exact.js`,
and the wave-52 face `lab/modview.js`, since replaced by the ported window — all λWAVES). The laws
about the kit's `host.js` and `mod.js` hold for any host; the wiring is λWAVES'.*

## 1. The clock is not the clock

λWAVES already has a `Clock` (`lab/clock.js`). **It must not be given this job.** They are
two logical times over one wall clock:

| | `lab/clock.js` (λWAVES) | `mir/modulation/host.js` `createModClock()` |
|---|---|---|
| owns | physics time *t*, atomic units | modulation time: beats, seconds, phases |
| advances at | `rate` a.u. per wall second | BPM, or free Hz, per wall second |
| paused by | the transport button | its own `playing`, and the availability gate |

If they were one clock: pausing the physics would freeze an LFO that is animating the
camera, and `transport.rate` — which is itself a modulation **target** in the shipped
catalogue — would be modulating the thing that decides how fast the modulator runs.
`tests/mir.test.mjs` gate 15 demonstrates exactly that, with an LFO swinging the physics
rate from 4 to 100 a.u./s while the modulation transport keeps advancing 0.125 beats per
0.125 s step.

The rack's job is to call **one** function, once per frame, with a monotonic wall stamp
in **seconds**:

```js
clock.advanceTo(performance.now() / 1000);
```

and to pass `present: (reason) => schedule(TIER.PRESENT)`.

## 2. The six meanings of `dt`

Documented at length in `host.js`'s header. The trap in one line: **clamping `dt` does
not slow a wall-synced LFO**, because under wall sync `beats` is derived from the
absolute stamp. Only `reanchorTransport()` moves it. The 0.25 s clamp (`MAX_WALL_STEP`,
the source's own number) bites free sync and envelope time and nothing else.

## 3. The pause law is four lines and all four matter — and wave 65 put a FIFTH above them

Ported verbatim from the source's `livePos()` into `createModClock`:

1. `targetValue()` returns **NaN** → no live route, or every route bypassed → the
   parameter goes back to the user's knob.
2. not source-driven (a hand macro) → keep the modulated value, **even stopped**. A hand
   does not let go because the clock did.
3. running → the modulated value.
4. stopped and source-driven → `HOLD` freezes it, `BASE` returns it to the knob.
   **`BASE` is what ships.**

**THE ARM (wave 65) IS NOT A PAUSE, AND LINE 2 IS THE WHOLE REASON IT CANNOT BE ONE.**
Josh asked for a MOD button beside play/pause: *"When this is on, the modulations are
active and the parameters move on all the racks."*  Off has to mean every routed control
sits on the number the hand left it on — and a stopped transport does **not** deliver
that, because line 2 keeps a hand macro's value on its target for as long as the macro
holds it.  So `clock.setEnabled(false)` sits ABOVE all four lines and returns the base for
every target, hand macros included.  It deliberately does **not** touch `playing`: the
modulation transport keeps its own position through a disarm, so re-arming picks up the
rack the user left rather than one that quietly stopped.

**THE ONE EXEMPTION IS `stepping`, AND IT IS THE RECORDER'S.**  `render-exact.js`'s
`modulation: 'drive'` pin stops the clock and then calls `step(1/fps)` per frame, and that
door applies as though running (line 3's `stepping > 0`).  An arm that reached inside
`step` would render an exact-period take with every modulator flat while every witness the
renderer checks — `LW.mod.running` false throughout — still passed.  The arm is therefore
read only where `stepping === 0`, and `tests/mir.test.mjs §23b` proves 40 steps are
**byte-identical** armed and disarmed, and that a 120-frame bar still closes either way.

## 3b. The resume law (wave 65): three chips, and the beat is the one thing that is GLOBAL

`resumeGrid(sources)` in `host.js` is a PURE read of the rack that says which of the
ported window's own chips claims the play edge.  Two of the three were already the model's:
**ANCH** is `modPlayEdge`'s middle branch plus the re-anchor (the beat is continuous, so
the phase resumes exactly where the pause caught it), and **TRIG** is its first branch
(`triggerSource` rewinds the phase).  **BPM** is the one this file adds: under a bar sync
mode a synced source's phase IS `frac(beats / beatsPerCycle)`, so "jump to the truncated
note" cannot be done per source — it is a move of the one global beat, floored to the
COARSEST live note, which is the only grid on which every faster note also has a boundary.
ANCH outranks it; TRIG on a **synced** source claims the grid at its own note, because
there a rewind the next frame overwrites is a control that changes nothing.  Under FREE
sync the beat is left alone: the phase is the source's own there and `modPlayEdge` already
floors it.  `applyResume()` runs before `modPlayEdge`, and `placeOnResume()` after it —
a `dt = 0` EDIT that puts every synced source where the beat says it is, so the resume's
own `applyAll(true)` does not push one frame of a transient 0 out onto every dial.

## 4. `mod.js` is a module SINGLETON

There is one rack per page. Two modulation windows would share one model. Every test rig
calls `M.modReset()` first for exactly this reason. If per-Card modulation is ever
wanted, that is a model-factory extraction — the source project lists it as its own step 8
and rates it RED.

## 5. A rack serialized MID-RUN is idempotent, not byte-identical

A source-driven macro's `value` is a live read-out of its source, and a load starts at bar
1 with phase 0 (the model's own documented law). So `serialize → deserialize → serialize`
differs on that one field the first time and is stable thereafter. **Do not write a
"modulation is dirty" check that compares serializations of a running rack.** A rack at
rest round-trips byte for byte.

## 6. Two things the rack must wire that are stubbed here

- **`available()`** — the capability gate, BASINS's `flowActive`. Defaults to `true`.
  The right answer is probably "is the field reader live", the same question
  `wState`/`gov` already answer. Until it is wired, modulation will run while the
  instrument cannot show it.
- **`present(reason)`** — defaults to a counted no-op. `schedule(TIER.PRESENT)` goes
  here. The reasons already emitted are `transport-start` · `transport-stop` ·
  `modulation-output` · `manual-step` · `paused-wall` · `transport-bpm` · `pause-mode` ·
  `hold-start` · `hold-end` · `mod-arm` · `mod-disarm` (wave 65), plus `initial-output`
  from whatever installs the rack.

## 7. Things this wave deliberately did not do

- No UI, no window, no chips, no CSS, no `kit.js` change — board #34's business.
  (**Done by wave 52**: `lab/modview.js` is the face, and `REPORT.md` carries the MIR block.)
- `tests/mir.test.mjs` was **not** wired into `test.sh`, and `REPORT.md` had no MIR block.
  Both files belonged to the wave running beside this one, and **wave 52 wrote both**.
- `labParameters()` in `host.js` is the *shape* of the shipped catalogue, written against
  the real `obs` / `mat` / `quality` / `clock` objects in `rack.js`, and nothing in the
  rack calls it. **Wave 52 chose the offered set and wrote the real adapters in `rack.js`**
  instead: modulation there is an OBSERVER instrument (camera, material, the physics RATE),
  every offered setter is a `TIER.PRESENT`, the ranges are the shipped dials' own rather
  than the illustrative ones here, and `field.resolution` / `field.steps` and the whole of
  `state.mode.*` are deliberately NOT offered (a rebuild per frame, and a `reg.version`
  bump per frame into the undo ring). This function stays as the shape.
- The AUDIO source needs `audio.js` (not ported) before it does anything; the model side
  of it is present and inert.
