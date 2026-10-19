# Q · THE SMALL CUTS OF 10-19 — build note (iteration 008, branch `it008-cuts` from `07591a7`, gate 9691 / GD 5691)

Josh answered three of the FOR-JOSH calls on 2026-10-19. This branch builds the three, one commit each.

| # | commit | what |
|---|---|---|
| 1 | `e22db68` | LOAD VALENCE loads every subshell outside the noble-gas core |
| 2 | `738c2cb` | FIELD stays closed for a profile older than it |
| 3 | `a1986e7` | KNEE's default 0.6 → **3**, measured; THE LOCK's knee-moved readbacks re-captured by name |

## 1 · LOAD VALENCE loads every valence subshell

Josh: "Load all the subshells, the thumbnail only shows the highest orbital."

- **`atoms.js` `valenceShells(Z)`** (new, pure; Z = 1 … 118). It takes `groundConfig(Z)`, removes the shells of the last noble gas below
  Z (H and He have no core), and returns the rest in Madelung order (n + l, then n). Examples: Fe 4s² 3d⁶, Cu 4s¹ 3d¹⁰, Pd 4d¹⁰,
  Au 6s¹ 4f¹⁴ 5d¹⁰, Rn 6s² 4f¹⁴ 5d¹⁰ 6p⁶, Fr 7s¹. The core uses the same rule as each ATOMS record's `core` string, and that string is
  unchanged. `NOBLE` gained `[86, 'Rn']` so Fr and later have a core. ATOMS (Z ≤ 86) is unaffected because its rule is `z < Z`.
- **`fillValence`** keeps its name. The Picker's press (`goAtom`) and the ATOMS window's LOAD VALENCE still both call it. It now loads
  every held valence subshell:
  - Each shell's weight is its share of the valence electrons, `occ / N`, spread equally over its 2l + 1 values of m.
  - All amplitudes are real and in phase.
  - The register comes out at unit norm: Fe 1, Au 0.9999999999999999.
  - The status line names the shells. Live strings: "Fe · 4s² 3d⁶ loaded · 6 labels, in phase", "Au · 6s¹ 4f¹⁴ 5d¹⁰ loaded · 13 labels,
    in phase", "Ne · 2s² 2p⁶ loaded · 4 labels, in phase", "H · 1s¹ loaded · 1 label, in phase".
  - The return value keeps `{ n, l, labels }` (n and l are now the last shell loaded) and adds `shells` and `past`.
- **A shell past the basis** is one with no n ≤ 6 label (`stateOf(n, l, 0)` is undefined). It is left out, and the line says
  "· 7s¹ past the basis (n ≤ 6), not loaded". That cannot happen at ZMAX = 86, but the road is ready for A7.
- **`valence.js` is untouched.** The Picker's tile still shows the highest orbital alone. Text that described the old one-shell fill was
  updated: the LOAD VALENCE hint (`atomsview.js`), the Picker's comment, the helium demo's notebook sentence, the `menu-thumbs.mjs` header,
  and the legacy boot gate's Ne row (now 2s and three 2p, so 4 labels).
- Screenshot: `q-shots/fe-loaded.png` shows SPECTRUM's grid with 4s₀ and the five 3d chips lit, and the stage formula
  "4s₀, 3d₋₂, 3d₋₁, 3d₀, 3d₁, and 3d₂".

## 2 · FIELD stays closed for an older profile

**How INFORMATIONAL does it** (`shell/settings.js` applySettings, `shell/stage-words.js` `infoKnown`). The saved `closed[]` is applied
exactly, with one exception: a card the profile is older than stays closed, as on a first run. INFORMATIONAL knows a profile is older by
the absence of something its own generation always writes. Today that is its record `lambdawaves.q0.info`. Before iteration 007 it was
the blob's `atomLabels`.

**FIELD uses the same road with a key that already exists.** FIELD has no record of its own. But `saveSettings` has written `dither` into
the blob on every save since 008 W (W's own lift reads its absence as "older than W"), and W merged after FIELD (S, `17711b9` before
`ea16a69`). So a blob with no `dither` was never saved by a build that had FIELD. applySettings now builds one table,
`older = { informational: !infoKnown(), staticfield: !('dither' in s) }`, and a card closes if `closed[]` names it or `older[id]` is
true. I added no key and no family. `saveSettings` stays guarded until applySettings has run, so the blob it reads is the profile as it was
left.

Measured with `.tmp/q-field.mjs` (Firefox, 9691):

| profile | FIELD | blob afterwards |
|---|---|---|
| first run (nothing stored) | closed | — |
| older (closed[] without staticfield, no dither, INFORMATIONAL record present) | **closed** | unchanged until the first save |
| older, reloaded with no save in between | closed | — |
| FIELD opened by hand (`layout.reopen`) | open | dither written, staticfield not in closed[] |
| reloaded after that | **open** | — |

Screenshot: `q-shots/field-older-vs-saved-open.png` (right rack, older profile on the left, the saved open layout on the right). Once an
older profile saves anything, closed[] lists staticfield and dither is present, so FIELD stays closed until a hand opens it.

## 3 · KNEE's default: somewhat opaque, slightly see-through

**The measure.** I used G's own probe (`g-probe.mjs`, copied into `.tmp/`):
- The field alone through `field.readPixels(…, keep)`, jitter seed 13, 64³ / 160 steps, PHASE · CLOUD, every other knob at its shipped
  default (EXPOSURE 1, SOFT 0.7). Subjects: hydrogen 2pz at t = 3.7, and benzene's HOMO (`1e1g (b) · HOMO`, from its record).
- Each candidate was rendered twice, over a white ground and over a black one. The output is `col + bg·T` at gamma 1, so the ray's
  transmission per pixel is **T = (I_white − I_black)/255**. Away from the field it reads 1.
- "Core" means the densest 0.1 % of rays at 0.6, followed at every candidate (`.tmp/q-trans.py`).

| KNEE | H 2pz core T (median) | H 2pz min T | C₆H₆ HOMO core T | C₆H₆ min T |
|---|---|---|---|---|
| 0.6 (old) | 0.7 % | 0.4 % | 0.8 % | 0.4 % |
| 1 | 3.0 % | 1.2 % | 5.1 % | 2.7 % |
| 1.5 | 6.7 % | 3.3 % | 9.0 % | 5.2 % |
| 2 | 9.2 % | 4.8 % | 11.5 % | 6.5 % |
| 2.5 | 11.0 % | 6.1 % | 13.3 % | 7.6 % |
| **3** | **12.3 %** | **6.9 %** | **14.6 %** | **8.2 %** |
| 4 | 14.4 % | 8.5 % | 16.7 % | 9.4 % |
| 6 | 16.9 % | 10.1 % | 19.3 % | 10.8 % |

**Chosen: KNEE = 3.**
- Both subjects' cores sit inside the asked 10–20 % band, toward its low end ("slightly see-through").
- 2.5 puts hydrogen at the band's edge (11.0 %).
- 4 and above read "see-through" rather than "slightly".
- Pictures:
  - `q-shots/knee-candidates.png`: both subjects at 0.6 · 1.5 · 2 · 2.5 · 3 · 4.
  - `q-shots/knee-core-crops.png`: H 2pz's core ×2 at 0.6 · 2.5 · 3 · 4.
  - `q-shots/knee-0.6-vs-3.png`: 0.6 beside 3 on both subjects, plus H 2pz on black, where the see-through core is plain.

**Where the default lives now.**
- `field.js` exports `KNEE_DEFAULT = 3`, and `kneeQ` reads it for an absent knee. The pivot is unchanged: q = ln(KNEE/0.6), so 0.6 is
  still the plain exponential drawn by the old arithmetic, and the shader's per-step bound `knee = 0.6` stays.
- The boot's `mat` (`rack.js`) and the KNEE knob's `value` (`windows/material.js`) read `KNEE_DEFAULT`. The knob's hint and the DRAW note
  now name the default.
- `tools/new-project.mjs` writes `knee: 3`. `lab/new-project.lambdawaves.json` was rewritten (one line moved) and `--check` is in step.
  `tests/new-project.test.mjs` does not name the number.

**Where it did not move, and why.**
- **`material.knee`'s row in `modulation.js` has no `def`.** Its base is seeded from `get: () => mat.knee`, so it follows the boot's
  value. Adding a `def` would put a new RESET button in the modulation window. That would be a new feature, so I did not add it.
- **`statelink.js` keeps `num(mat.knee, 0.6)`.** That is only the encoder's value for a mat with no knee. Moving it to 3 turned
  `statelink.test` S2 red ("a link minted before the shift … mints the very bytes": its mat has no knee). Old link bytes win, and every
  live mat carries a knee.
- **Saved projects keep their own knee.** All eleven demos say `"knee": 0.6` and open exactly as before. Only the boot, NEW and the knob's
  first position move. Re-saving the demos at 3 would be Josh's call.
- **slice.js and sliceview.js** use `knee 0.6` in PLANE's per-sample transfer. That is a separate formula, not this default.

**THE FLASH GUARD.** `tools/flash-calibrate.mjs` takes the knee step at the route's default (its rule), so the operating point moved:
- `KNEE0 = 3`, `Q0 = ln 5`. The search is now |Δq| from q0, with `STEP_KNEE = 0.6` kept for the shader's fixed per-step bound.
- **The knee step moved 0.2723 → 0.4902** (in ln KNEE). The q-exponential is flatter at q0 = ln 5. The ray check reads `kneeMax` 0.1.
- `FLASH_STEP['material.knee']` = 0.4902. `tests/flash-routes.test.mjs` §5's KNEE pair moved to the default ([4.2, 2.1] trips,
  [3.1, 2.9] passes). PASS, and the four guarded routes are still four.
- **For Josh:** at the new step, a modulator swinging around KNEE 0.6 can move L by up to 20 % before it is held (it was 10 % at 0.6 with
  the old step). Below the default this was already true: at 0.1, the old step allowed 43 %. To hold everywhere instead, the step would
  be taken at the range's hard end. That would be a rule change, so I did not make it.

## THE LOCK ×2 (9691, `--query gastab=0`, RTX 3070, Firefox 158)

THE KNEE bends every compositing style: G's design names CLOUD, SOLID, SIGNED, SHELL, DUST and BANDS. So the brief's expectation that
only the CLOUD rows move, and that the iso-style, flag, line and state rows hold, cannot be met with a new default. Every readback that
composites the volume moves. I proved it is only that, in four runs:

| run | 843 (`digest-lock-base.json`) | 987 (`digest-lock-s4a.json`) |
|---|---|---|
| KNEE_DEFAULT = 3, before the re-capture | RED · 175 readback differences · 0 record-byte | (193, by the scratch diff) |
| **the proof: KNEE_DEFAULT put back to 0.6 (scratch, uncommitted)** | **GREEN 843 / 0** | **GREEN 987 / 0** |
| KNEE_DEFAULT = 3, after the by-name re-capture | **GREEN 843 / 0** · 0 record-byte · no unrepeatable · 0 page errors (65 s) | **GREEN 987 / 0** (61 s) |

With the default at 0.6 the tree is bit-identical, so the default is the only thing in this branch that moves a pixel.

**The re-capture:**
- A scratch `--write --fixture .tmp/lock-fresh.json` at KNEE 3. Then exactly the differing leaves were copied into each fixture by name
  (`.tmp/q-relock.mjs`, G's `g-relock` road), with the tool's own writer, after checking that it round-trips each fixture's bytes. Never
  `--write` over a fixture.
- Each fixture's git diff is exactly two lines per leaf (350 = 2 × 175 and 386 = 2 × 193).

**Moved, by name (843 fixture: 175 leaves; 987 fixture: 193):**
- `states.<s>.<64|96|128>.rp` and `.rpL`, the PHASE · CLOUD readbacks at 320×240 and 1024×640. Every state the fixture holds: 10 × 3 × 2
  = 60 in the 843 (1s+2pz, rydberg, h91, box, gas, momentum, oscillator, quarkonium, sturmian, chem). The 987 adds chemC6H6, chemLys and
  chemLysHomo, for 78.
- `styles.<view>/<style>` for every style but additive: cloud, solid, grain, signed, bands, dust and glass across the 5 views, 35 rows.
- Every flag row but its additive one: `bow`, `dither`, `finish-glass`, `finish-matte`, `invert`, `palette-on`, `palette-off`,
  `slice-clip`, `slice-slab`. That is 6 rows each, 54 in all.
- `lines.<row>.rp`, the 26 line rows' composite readback (the volume under the frame).

**Held to the bit:**
- Every state's `digest` (the field's texels), `integral`, `maxRho`, `nan`, `half`, `nonBlack`, `pack` and `count` (the CPU record bytes).
- Every additive row: the 5 views plus 9 flags on `imag/additive`. ADD has no opacity.
- Every linePixels hash and bucket of the 26 line rows (`line`, `darkest`, and the 7 colour buckets).
- The counts are 843 and 987, as before.

The tool's header gained an ITERATION 008 Q paragraph saying all of this.

## Tests

| run | result |
|---|---|
| `./test.sh node` | **exit 0** on the final tree (the first run had one red, `statelink` S2, from moving the link encoder's fallback; I reverted that move and `statelink.test` then read 22/22 GREEN) |
| `node tests/atoms.test.mjs` | GREEN 29/29 |
| `node tests/flash-routes.test.mjs` | PASS |
| `node tests/new-project.test.mjs` · `node tools/new-project.mjs --check` | GREEN · in step (16098 B) |
| `node tools/rack-deps.mjs --classes --no-write` | exit 0 |
| `field-law` (browser) | GREEN 9/9: hydrogen RMS 2.34e-6, worst 1.68e-4; water RMS 8.31e-4. The field maths is untouched |
| `new-project` (browser) | GREEN |
| `history` (browser) | GREEN, exit 0 |
| `start` (browser) | GREEN 3/3 |
| THE LOCK ×2 | GREEN 843/0 and 987/0 (above) |
| light check | Fe/Au/Ne/H/Pd LOAD VALENCE (`.tmp/q-fe.mjs`, 0 page errors); FIELD's four profiles (`.tmp/q-field.mjs`, 0 page errors); the KNEE pictures |

## Decisions

1. **Weights.** A shell's share of the valence electrons, so the register's probability per shell is occ/N. I read the brief's "each
   shell's electrons' weight in phase" that way. It is the closest a single coherent register comes to the valence density. A coherent sum
   over m is not spherical, as with the old one-shell fill. Each shell's total probability is right; the cross terms remain.
2. **Order in the status line:** Madelung order, as the brief quotes it ("Fe · 4s² 3d⁶"). The ATOMS records' `core` keeps (n, l) order.
3. **FIELD's signal is `dither`**, not a new key. It is exactly INFORMATIONAL's original road (a key its generation always writes). If
   `dither` ever leaves `saveSettings`, this line must move with it; the comment at the line says so.
4. **KNEE 3**, by the table. The demos stay at 0.6. The flash step follows the guard's own "at the default" rule.

## Proposed CLAUDE.md sentences

- THE PICKER paragraph: "… while a press still opens goAtom's fillValence — **every subshell outside the noble-gas core (atoms.js
  `valenceShells`: Fe 4s and 3d, Au 6s, 4f and 5d), each at its electrons' weight, every m, in phase; the status line names them; a shell
  past the basis is said, not loaded (008 Q)**; Josh 10-18/10-19)".
- After the FIELD mention (S's paragraph, or the scopes): "FIELD (`staticfield`) is closed on a first run and for a profile older than it,
  by INFORMATIONAL's road: applySettings' `older` table, a blob with no `dither` (written on every save since 008 W, which followed FIELD)
  (008 Q)."
- THE LOCK paragraph: "… (843 + 987 values …); **iteration 008 Q moved the default KNEE 0.6 → 3 (field.js `KNEE_DEFAULT`), so every
  readback that composites the volume was re-captured by name (175 + 193: states' rp/rpL, every style and flag row but ADD's, the line
  rows' rp); field digests, record bytes, ADD rows and linePixels held, and the tree at KNEE 0.6 read 843/0 and 987/0.**"
- THE FLASH GUARD paragraph: "`material.knee`'s step is taken at the default KNEE 3 (0.4902 in ln KNEE; 0.2723 at 0.6)."
