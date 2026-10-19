# X7 · SHELL SIGNED: a new draw style, SHELL ±

Branch `it010-shellsigned` from 5a1a318. Josh's request, 2026-10-19:

> "For 'Shell' can there be a 'signed' version of 'Shell'? Because currently it's just acting as Solid but see through. Like 'Shell Signed', Shell look with the Signed geometry."

## What was built

The new style is `glassSigned`, STYLE **8**. It is appended to `STYLE` and `STYLE_NAMES`, and no existing style was renumbered. Its seg label is **SHELL ±**, placed right after SHELL, with the title "Render the signed lobes as a translucent shell: SHELL's look on SIGNED's geometry".

| where | what |
|---|---|
| `lab/field.js:32-35` | `STYLE.glassSigned = 8`, `STYLE_NAMES[8] = 'glassSigned'`, plus a comment about older builds |
| `lab/field.js:687-702` | the shader branch `style == 8u`. It is **inserted** after the glass-finish block and before the MATTE line, so no existing line moved |
| `lab/windows/material.js:45` | the seg option. The DRAW note now says ISO also sets the SHELL ± surface |
| `lab/native-ui.js:21-22` | FINISH: MATTE is allowed on 8, as on SOLID, SIGNED and SHELL. GLASS is disabled on 8 ("SHELL ± already uses translucent glass") |
| `tools/perf/digest-lock.mjs:193` | THE LOCK's style rows read `STYLE_NAMES.slice(0, 8)`, the eight styles the lock was captured on. Without this, the appended style would add five `*/glassSigned` leaves, and those would read as RED |
| `CLAUDE.md` (the DRAW-styles paragraph) | the sentences below |
| `lab/sw.js` | `pwa.test.mjs --write`: three content hashes |

No changes were needed in persistence, links, badges or the C key. Persistence and links store the index (`mat.style`, the link's u8). Restore maps it through `drawStyle()` → `STYLE_NAMES[8]` = `glassSigned`. The C key's cycle is unchanged, as asked; SHELL is not in it either. The INFORMATIONAL word is built from the button's own text, so it reads `STYLE · SHELL ±`.

## The transfer, and why

SHELL ± takes **SIGNED's measure** and puts it through **SHELL's transfer**:

- **The measure is SIGNED's own** (`mag`): |ψ| under DENSITY and PHASE, and |Re ψ| or |Im ψ| under RE and IM. Each signed lobe is therefore its own body, and the nodal surfaces stay open between the lobes.
- **The transfer is SHELL's.**
  - `exp(-((m² − L²)/(0.32·L²))²)` is SHELL's Gaussian of relative width 0.32, read on the measure squared, the way SHELL reads ρ.
  - `wEff = 0.7·shell`, `c = mix(c, white, 0.65·lit)`.
  - The GLASS finish does not apply: `c` restarts from `baseColour` and `wEff` is overwritten.
  - MATTE drops the light, exactly as it does for SHELL.
  - KNEE and EXPOSURE act through the same compositing that every non-ADD style uses.
  - SOFT has no effect. It does not move SHELL either, or SIGNED, because those transfers overwrite `w`. The proof shots show the SOFT 0.3 and 2.2 hashes equal to the default hash for both SHELL ± and SHELL.
- **The level is L = 2.5·ISO on the amplitude.** SIGNED's surface is `smoothstep(1.5·ISO, 5·ISO, mag)`, so its visible edge lies somewhere inside that ramp. I measured the vertical silhouette extent (px, 360×300 panels) at five candidate levels:

| case | SIGNED | SHELL | K 1.5 | K 2 | **K 2.5** | K 3.25 | K 5 |
|---|---|---|---|---|---|---|---|
| 2p₀ arg ψ | 176 | 161 | 201 | 188 | **176** | 167 | 156 |
| 2p₀ Re ψ | 171 | 163 | 196 | 182 | **172** | 165 | 155 |
| 3d₂ arg ψ | 173 | 162 | 187 | 180 | **175** | 168 | 157 |
| 3d₂ Re ψ | 165 | 161 | 176 | 169 | **164** | 158 | 148 |

  At 2.5 the shell sits on SIGNED's surface to within 2 px. In other words, it is "SIGNED's geometry, in SHELL's look". ISO moves it the way it moves SIGNED: higher ISO pulls the shell inward.
- **Palettes follow the view.** The colour comes from the view and palette code shared with SIGNED: the palette's ±π/2 pair under Re/Im, the phase hue under arg ψ, and θ = 0 under ρ. Under jetblack (FLAT) the body is black and the light whitens the shell, as it does for SHELL.

## THE LOCK and the digests

- **THE LOCK ×2**, gate-lock.sh's two lines on 9391/5391:
  - `--check --query gastab=0` gives **GREEN 843 values · 0 readback · 0 record-byte** differences.
  - Adding `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` gives **GREEN 987 · 0 · 0**.
  - Page errors 0. No leaf was added; the fixture count is unchanged.
- **SIGNED and SHELL before and after**: `x7-shots/before-digests.json` (base 5a1a318) and `after-digests.json` (this tree). These are THE LOCK's pinned readback (seed 13, warmed pipelines, 96³, 1024×640) on 2p₀ and 3d₂ at t 3.7, in every view {ρ, arg ψ, Re ψ, Im ψ}, light and dark. **32/32 held.** For example:
  - light 2p₀: SIGNED ρ `9387330c`, arg `bba36453`, Re `a4130d5e`; SHELL ρ `eca98d4a`, arg `2c859cf1`, Re `2bbdfbc7`.
  - dark 2p₀: SIGNED arg `fac726d8`; SHELL arg `794455a1`.

  The 16 new `glassSigned` digests are in the after file.

## Old builds and saved files

A project or link with SHELL ± writes `mat.style: 8`. On this tree, restore gives `drawStyle(8)` → `glassSigned`. The probe saved, set CLOUD, restored, and got style 8 back with the seg on SHELL ±.

**On the base build the same file opens as CLOUD.** I proved this with the base's own table, `drawStyle(8) = cloud → 0`, which is drawStyle's unknown-style law. Indices 0–7 map the same on both builds.

## Proof shots (`research/iteration-010/x7-shots/`, headless Firefox 158, THE LOCK's pinned readback at 96³)

- `2p0-dark.png`, `2p0-light.png`, `3d2-dark.png`, `3d2-light.png`: SIGNED | SHELL | SHELL ± on arg ψ, then on Re ψ. On 3d₂ Re ψ, SHELL draws one torus; SHELL ± draws the four signed lobes as translucent shells, with the nodal planes open.
- `benzene-homo-dark.png`, `benzene-homo-light.png`: benzene's HOMO (k 21, from its record, 36 AO). SIGNED | SHELL | SHELL ± on arg ψ, SHELL ± on Re ψ, and SHELL ± at ISO 0.02.
- `3d2-iso-soft-dark.png` (SHELL ±) and `3d2-iso-soft-shell-dark.png` (SHELL): ISO 0.02 / 0.06 / 0.15, SOFT 0.3 / 2.2, KNEE 0.6, EXPOSURE 3.
- `jetblack-2p0-light.png`: the FLAT palette on SIGNED, SHELL and SHELL ±.
- `app-shell-signed-selected.png`: the app after a real pointer press on SHELL ±. The style is 8, the seg is on SHELL ±, and GLASS is disabled.

## Gate

| check | result |
|---|---|
| `node tests/pwa.test.mjs --write`, then a re-run | 0 FAIL |
| `./test.sh node` | exit 0 |
| `node tools/rack-deps.mjs --classes --no-write` | exit 0 |
| `node tools/new-project.mjs --check` | in step (16098 B): a new style changes no default |
| THE LOCK ×2 | 843/0 and 987/0 |
| field-law | GREEN |
| render-regressions | PASS |
| project-formats | 5/5 |
| history | PASS |
| current | PASS |
| official-defaults-palette | **exit 1, already failing on the base 5a1a318** (run on the base tree with this patch reverted): `vivid is undefined`. The test looks up a VIVID knob under SETTINGS that the tree no longer has there. It is not this row's failure and was not touched |

## CLAUDE.md (the sentences added, after the DRAW-styles paragraph)

SHELL ± (iteration 010 X7, Josh 10-19: "For 'Shell' can there be a 'signed' version of 'Shell'? Because currently it's just acting as Solid but see through. Like 'Shell Signed', Shell look with the Signed geometry.") is the style `glassSigned`, STYLE 8 — APPENDED to `field.js` `STYLE`/`STYLE_NAMES`, never renumbered — seated after SHELL in the seg (`lab/windows/material.js`): SIGNED's measure (|ψ| under DENSITY and PHASE, |Re ψ| or |Im ψ| under RE and IM) through SHELL's transfer (its Gaussian of relative width 0.32 on the measure squared, weight 0.7, light toward white, no GLASS finish, MATTE drops the light), centred at 2.5·ISO on the amplitude, where its silhouette meets SIGNED's; SOFT moves it no more than it moves SHELL (neither reads it). It is not in the C key's cycle (SHELL is not either). A project or link saves the index 8, which opens by name here and as CLOUD on any older build (`drawStyle()`'s unknown-style road). THE LOCK holds the eight styles it was captured on (`digest-lock.mjs` reads `STYLE_NAMES.slice(0, 8)`), so an appended style adds no leaf; the new branch is inserted after the glass-finish block and moved no existing line, 843/0 and 987/0.
