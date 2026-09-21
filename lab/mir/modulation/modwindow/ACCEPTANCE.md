# MIR · modulation window — ACCEPTANCE: the geometric test a correct mount passes

**Provenance.** Written on 2026-09-06, when this window was staged from BASINS (the MANDELBROT
project) for λWAVES as a byte-frozen port. Adopted into MIR on 2026-09-10 and corrected for the
kit on 2026-09-16. MIR 1.1.0 retired the byte-frozen law and MIR is now the window's source, so a
number here changes only by a MIR change that says why. **BASINS-era references:** the `source`
column's `anim.js:NNNN` / `index.html:NNNN` are lines of BASINS' own files as of 2026-09-06;
`mbgate/gatekit.mjs` is the MANDELBROT project's gate kit; `_build/smoke.mjs`, `vid/`, `modmap/` and
the EXTRACT files were the extraction's staging artefacts. None of them is in MIR. The literal
counts in §8 were taken on the staged sheet that day.

**This is the reason this port is the last one.** Every number below is a literal in
`modwindow.css` at the line named, or arithmetic from `anim.js`'s own constants. A
re-implementation in a host's idiom cannot pass this table by accident, and it cannot pass
it by trying — the only thing that passes is the window.

Measure at `--ui-scale: 1`, one FULL LFO card, one FULL ENV, one FULL AUDIO and one
MINIMIZED card. `_build/smoke.mjs` beside the staging directory (BASINS-era; not in MIR) is a
working implementation of this gate
(32 assertions, all green against the staged files on 2026-09-06, driven headless through
`mbgate/gatekit.mjs`); the mounting wave should re-run it against the real host rather
than write a new one.

## 0. THE TWO THAT ARE NOT GEOMETRY, AND FAIL FIRST IF THE PORT WENT WRONG

| # | assertion | value |
|---|---|---|
| A0 | the stylesheet parses whole — no rule is dropped by a scoping mistake | the live stylesheet rule count matches the current artifact revision |
| A1 | the material ladder resolves, and the four surfaces are four different values | pane `rgba(31, 35, 41, 0.68)` · chassis `rgba(42, 48, 55, 0.712)` · control `rgba(22, 25, 29, 0.552)` · hero `rgba(10, 13, 15, 0.777)` — at `--m2-blend: .26` |

If A1 gives `rgba(0, 0, 0, 0)` anywhere, a `--m2-mat-*` token was moved off `:root`.

## 1. THE FRAME

| what | value | source |
|---|---|---|
| window border radius | `12px` | `--r-lg`, index.html:887 |
| window border | `0.6px solid` (a browser may report the *used* width as `1px`) | `.glass`, index.html:1290 |
| window box shadow | `inset 0 1px 0 var(--m2-mat-inner), var(--m2-mat-shadow), var(--glass-bevel)` | anim.js:3213 |
| `.kwin-body` padding, this window only | `5px 10px 9px` | index.html:4660 |
| `#modwin` overflow / contain | `visible` / `layout` — **not** `layout paint` | anim.js:1786 |
| chip-rail disc target | `62 × 62` (`max(44px, 62px·scale)`), ink 26 | index.html:847 |
| chip-rail grip dots | `14 × 14`, `repeat(3, 1fr)`, gap 2, dots `2 × 2`, **exactly nine** | index.html:7168 |

## 2. THE WORK-BAR LANE — two boxes, one 52 px lane, a real hole between them

| what | value | source |
|---|---|---|
| `.m2foot` | `flex: 0 0 52px`, height **52**, `z-index: 9`, `pointer-events: none` | anim.js:1795 |
| `.m2workbar` (both) | height **52**, radius **16**, gap 2, padding `2px 7px 3px`, `pointer-events: auto` | anim.js:1800 |
| `.m2prebar` | width **294** (the law clamps its core to [244, 294]) | anim.js:1804 |
| `.m2pre` | width **450**, and it **never changes** | anim.js:1805 |
| `.m2precore` | height **44** | anim.js:1806 |
| `.m2prename` | height **44**, radius 5, `500 10.5px --font-sans`, letter-spacing `.05em`, centred | anim.js:1813 |
| `.m2prenav` / `.m2presave` / `.m2predead` | min-width **44**, height **44** | anim.js:1823 |
| `.m2presave` | `44` square, `border-radius: 50%`, svg `21 × 21` | anim.js:1830 |
| `.m2predead` | `.off` ⇒ `display: none` | anim.js:1844 |
| `.modxport` / `.modtap` / `.modsync` | `44 × 44` each (`var(--touch)`) | anim.js:2396 / 2447 / 2455 |
| `.modtempo` | height **22**, with a `var(--touch)` `::before` band | anim.js:2406 / 2415 |
| `.m2hold` ×2 | min-width **46**, height **44**, radius 7 | anim.js:2946 |
| the strip's order | play · tempo · TAP · WALL · QUARTER · HOLD 1/4 · HOLD 1 | pure install order |

## 3. THE MACROS RAIL

| what | value | source |
|---|---|---|
| `.m2rail` | width **224**, height `var(--m2-view-h)` | anim.js:1903 |
| `.m2railhead` | `700 10.5px --font-sans`, letter-spacing `.13em`, colour `--acc2` | anim.js:1908 |
| `.m2slot` | height **64**, radius 8 | anim.js:1934 |
| `.m2slotrow` | grid `44px 44px minmax(0,1fr) 44px`, height **62** (= 64 − 2) | host macro revision |
| `.m2grip` | **44 × 44**, colour `--acc2`, svg `22 × 22` | anim.js:1944 |
| `.m2numseat` | **44** wide × 100% | anim.js:1950 |
| `.m2num` | `24 × 24` circle, border `1.2px`, `600 10px --font-num` | anim.js:1955 |
| `.m2depthring` | `34 × 34`, left 5, `rotate(-90deg)`, stroke-width `2.2` | anim.js:1960 |
| `.m2vedge` | `7 × 7` circle at `calc(var(--fill,0) * 100%)`, margin-left `-3.5px` | anim.js:1985 |
| `.m2vmeta` | contains the drive/source label; the obsolete `OUT` label is removed | host macro revision |
| `.m2namerow` | left 48, right 48, top 9, height **44** | host macro revision |
| `.m2mclr` | **44 × 44** | anim.js:2012 |
| `.m2macadd` / `.m2devadd` | height **44**, text `ADD MACRO` / `ADD DEVICE` | host macro revision |
| `.m2slottools` | **44 × 44**, fixed final column in full and minimized rows | host macro revision |
| `.m2rowgrip` / `.m2slotx` | **44 × 22** reorder and delete halves | host macro revision |
| the track line | is `.m2signal::before` — **a pseudo-element, not a node** | anim.js:1981 |

## 4. A DEVICE CARD

| what | value | source |
|---|---|---|
| FULL | **360 × 368** | `M2_CARD.E` |
| COMPACT (`.m2cmp`) | **320 × 368** | `M2_CARD.C` |
| MINIMIZED (`.m2min`) | **64 × 368** | `M2_STRIP_W` |
| card radius | **16** | anim.js:2038 |
| `.m2head` | `getComputedStyle(...).height === '48px'`; the **border box is 52** (padding `2px 5px`, and BASINS has no global `border-box`) | anim.js:2046 |
| `.m2body` | height **216** on all three kinds in FULL | 2704 / 2823 / 2972 |
| `.m2kind` | `700 13px --font-sans`, letter-spacing `.09em`, colour `--acc` | anim.js:2049 |
| `.m2bank` | **46 × 44** | anim.js:2052 |
| `.m2ab` (COPY / PASTE) | `28 × 40` ink + a `44` `::before` band | anim.js:2084 |
| `.m2pow` | `40 × 40` circle + a `44 × 44` `::before` band; svg `15 × 15` | anim.js:2163 |
| `.m2x` | `40 × 40` + a `44 × 44` `::before` band | anim.js:2171 |
| `.m2trig` (ENV) | min-width 48, height **44** | anim.js:2156 |
| `.m2grab` | `16 × 40` ink, `::before` spanning `-14px / -14px`, height **44** | anim.js:2201 |
| `.m2seat44` | 100% × **44** | anim.js:2615 |
| `.m2chk` | min-height **44**, lamp `.m2dot` `9 × 9` | anim.js:2265 / 2270 |
| `.m2preset` | **44 × 44**, six of them | anim.js:2184 |
| `.m2mac` | 100% × **44**, border `1.3px`, `600 15px --font-num` | anim.js:2218 |
| `.m2zoom` | 100% × **44**; `.m2fit` is `600 10px` | anim.js:2213 |
| add-device control | the permanent `.m2devadd` rail button; no duplicate device-card chip | host macro revision |
| `.m2edit.m2hero` | min-height 132, radius 7; `.m2svg` is `height: calc(100% - 14px)` | anim.js:2229 / 2234 |
| **`.m2col` / `.m2rt`** | the base `92` / `104` are used by **no FULL card**. Measure per kind: **AUDIO `.m2col` 88**, **ENV `.m2rt` 90**, LFO's `.m2col` and `.m2rt` are full-width grid rows | 2704 / 2823 / 2972 |
| `.m2move` (◂ ▸) | **`display: none` in every mode** — see MANIFEST. *(λWAVES wave 69 showed them in FULL through the host sheet's reach-list 18; wave 78 retired that — the device grip reorders now — so with the kit's `modhost.css` they are hidden in every mode again.)* | anim.js:2597 / 2107 |

## 5. THE KNOBS — per kind and per mode, and they are all different on purpose

| selector | `.m2kd` size |
|---|---|
| base `.m2kd` | `44 × 44`, `border-radius: 50%` |
| LFO full | **48 × 48**, RATE **56 × 56**; grid `1.24fr repeat(3, minmax(0,1fr))`, gap 3, padding `5px 7px 4px` |
| LFO compact | `40 × 40`, RATE `44 × 44`; grid `repeat(2,1fr) / repeat(2,1fr)`, gap 2 |
| ENV full | **42 × 42**, A/D/R **48 × 48**; grid `1.12fr .9fr 1.12fr .9fr 1.12fr .9fr`, gap 2 |
| ENV compact | `40 × 40` all; grid `repeat(3,1fr) / repeat(2,1fr)`, gap `2px 3px` |
| AUDIO full | **50 × 50**, SENS **56 × 56**; grid `repeat(3, minmax(0,1fr))`, gap 4 |
| AUDIO compact | `46 × 46` all; gap 3 |

Arc geometry: `r1 = 40`, `r2 = 49`, every circle `transform="rotate(-240 50 50)"`
(span 300, start −150). Track stroke-width 6, band 4. `.ckval` is `600 7.5px --font-num`
inside `#modwin`. `.m2kends` is `display: none` inside `#modwin` — the range words never
paint.

## 6. THE FOLDED STRIP (the compact rail)

| what | value |
|---|---|
| card | **64 × 368** |
| head | flex **column**, gap 4, padding `4px 2px 2px`; `.m2headl` / `.m2headr` become `display: contents` |
| order | grab 1 · fold 2 · bay 3 · power 4 · status 5 · numeral 6 · × 7 — **AUDIO puts × at 6 and hides the numeral** |
| `.m2meter` | **11** wide, radius 6 |
| `.m2minname` | `writing-mode: vertical-rl`, `rotate(180deg)`, `600 9px --font-sans` |
| `.m2minstatus` | `flex: 0 0 18px`, `700 6px/18px --font-num` |
| `.m2minnum` | 100% × **44**, `700 21px --font-num`, colour `--acc` |
| `.m2lfominshape` | **22** wide, stroke-width 4, `vector-effect: non-scaling-stroke` |
| `.m2envminprog` | **5** wide, radius 3 |
| `.m2audminleds` | 8 wide, gap 4; each `i` **7 × 22** radius 3; HIT **9 × 9** radius 1, `rotate(45deg)` |
| `.m2tdot` (comet) | `7 × 7`, ten of them, opacity `(0.10 + 0.90·k²)`, scale `0.32 + 0.68·k` |

## 7. THE SIZE LAWS — arithmetic, never a measurement of the live window

```
width  = max(360, round(22·scale) + (ribbon ? 58 : 224) + 14 + 89 + Σ card + n·7)
height = round(98·scale) + 368                                     = 466
minH   = round(98·scale) + 220                                     = 318
maxHFrac = 0.86 ;  minW = 360 ;  --m2-view-h clamped to [220, 368]
```

Worked cases a correct mount reproduces exactly:

| rack | width × height |
|---|---|
| one FULL card | **716 × 466** |
| three FULL + one MINIMIZED | **1521 × 466** |

The work-bar law, with `ext = 46` when any send is dormant and `0` otherwise:

```
right = max(244 + ext + 7 + 450, min(max(rackRight, 294 + ext + 16 + 450), viewport))
width = 450               left = right − 450
coreW = clamp(244, 294, left − ext − 7)         presetW = coreW + ext
```

## 8. THE 44 px LAW — the assertion that catches a re-implementation

> Every interactive element in this window is at least **44 px** on its short axis, and
> where the ink is smaller the target is restored by a `::before` pseudo-element.

| count | what |
|---|---|
| **135** | occurrences of the literal `44px` in the window's own sheet |
| **33** | occurrences of `min-height: 44px` |
| **9** | `::before` hit-band restorations — on `.m2fold`, `.m2ab`, `.m2move`, `.m2pow`, `.m2x`, `.m2grab`, `.m2ring`, `.m2clr` and **`.modtempo`** |

Assert all three counts, and assert that every seat, check, preset, bank, hold, transport
button, macro grip, numbered seat, name field and clear button measures ≥ 44 on its short
axis in the live DOM. **The `::before` bands mean the INK of `.m2ab`, `.m2move`, `.m2pow`
and `.m2x` measures 40, not 44** — a mount that "fixes" that to 44 has changed the window.

## 9. THE THREE COPIED DEFECTS — assert they are still there

> **SUPERSEDED FOR THIS MOUNT, 2026-09-06 (wave 69), BY JOSH:** *"The modulation window is broken when
> we were even working on it on basins so whatever problem it has we will try to fix here."*  All three
> are FIXED in λWAVES and the three assertions below are INVERTED in `B129` (λWAVES).  The corrections are in
> `lab/modhost.css` (reach-list 16, 17, 18) and **not one byte of this directory changed**, so this
> table is still the right acceptance test for a mount that has not been told otherwise, and
> `lab/mir/PORT-NOTES.md` § THE THREE DIVERGENCES carries the diff for the port back.
>
> **In MIR (2026-09-16):** that host sheet is `mir/modulation/modhost.css` and the notes are
> `mir/modulation/PORT-NOTES.md`. A mount that loads the kit's sheets gets D1 fixed (reach-list 21,
> the house glass, which superseded 16) and D2 fixed (17). D3 went back on purpose: λWAVES wave 78
> retired reach-list 18 because the device grip reorders, so the arrows are hidden in every mode and
> D3's assertion holds on a kit mount as written. "Not one byte of this directory changed" was true
> on 2026-09-06; MIR 1.1.0 changed `modwindow.js` and `modwindow.css`.

A mount that renders these correctly has silently redesigned the window.

| # | assertion |
|---|---|
| D1 | `getComputedStyle(.m2pick).backgroundColor === 'rgba(0, 0, 0, 0)'` — the ADD LFO / ADD ENV / ADD AUDIO sheet has no plate, as in `vid/f02.png` |
| D2 | a `.m2clr` on a control **outside** `.m2root` also has a transparent background, for the same reason |
| D3 | `getComputedStyle(.m2move).display === 'none'` in both `full` and `minimized` |

## 10. THE STRING

```
.kwin-chiprail[aria-label="MODULATION window controls"]
```

Assert the rail's `aria-label` is that string **byte for byte**, and that
`getComputedStyle(.crail-chip, '::before').backgroundColor` is the pane value from A1 and
not `rgba(0, 0, 0, 0)`. This is the one failure mode with no visual hint beyond "the chips
look wrong".

## 11. GROUND TRUTH

`vid/f01.png` … `f07.png` and `modmap/{lfo,env,audio}-card.png`,
`modmap/macros-transport.png`, at 100 % (BASINS-era staging files; not in MIR). If the table above passes and the screenshot
still does not match, the answer is in EXTRACT files 01–05 — **not in a redesign.**
