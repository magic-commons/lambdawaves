# 0.6.5 X2 — THE CARD ROAD + THE VIEW (build report)

Opus 5.5 builder, worktree `agent-a2ba36c2dd4bac17e`, branch `x2-card-road` from `fdc3b49` (the 0.6.4 cut tip). Not pushed, not merged.

## Seats (line numbers at this commit)
- `lab/field.js`
  - 326–347 `CARD_WGSL`, derived from `MOL_HEAD`. The regex drops bindings 1–3 and keeps `P` (MP), `mat` (binding 4, the volume), `outTex` (5) and `stats` (6).
  - 1075–1076 the card state: `card`, `cardDirty`, `cardBuf`, `cardPipe`, `cardBind`, `cardParams`.
  - 1127 `setResolution` sets `cardDirty = !!card` and drops the bind group, which holds the old `psiTex`.
  - 1181 `encodeCard(enc)`: writes the params (MP's n and half, slot 0, r0 = N, r1 = the card's half), zeroes `stats[0]`, runs one dispatch of ⌈res/4⌉³, clears `cardDirty` and moves `generation`.
  - 1415 THE THIRD OWNER ARM in `frame()`: `if (card) { if (cardDirty) encodeCard(enc); } else if (molOn) … else …`. While a card is set, neither the eigenmode kernel nor the molecular kernel runs.
  - 1619 `setMolecule(anything)` sets `card = null`. A card belongs to the molecule it was computed for, so a re-upload or a drop lets it go.
  - 1741 `setDomain` sets `cardDirty`.
  - 1744–1750 `setCard({ N, half, data } | null)`. On the first card it compiles the pipeline and makes the 32-byte params block. It makes ONE storage buffer of N³·4 bytes (1 MB at 64³) and reuses it; it is remade only for a bigger N. The upload is `queue.writeBuffer`, never `writeTexture`. `setCard(null)` hands the volume back with `molDirty = !!molSpec`.
  - `cardBuf` is destroyed on device teardown.
- `lab/molecular-session.js`: the session stays the one owner of the field.
  - 153 `card(c)` puts the selected model's volume on the field. It is idempotent for the same object and model, so a re-push does not re-upload 1 MB.
  - 141 when ANY other model publishes, the card hands the volume back.
  - 109 and 121: adopt and drop forget the card. The field has already released it through `setMolecule`.
- `lab/chemview.js`, kept to the seams X2 owns:
  - 167 VIEW gains `esp` with the plan's title.
  - 367 `views()` disables ESP without D, as it does DIFF.
  - 488–497 `esp`, `was`, `espOn()`, `drawn()`, `molView()` ('real' once the card has landed), `sgn`, and the consumer `onEsp(reply)`.
  - In `pushMatrix` the product follows `drawn()`: the previous view (`was`) stays while ESP computes. At 522, once the card has landed it is put on the field through the session (`s.card(esp.card)`, the density published under view 'real'). While computing, it calls `espPump()` if X1's exists (`typeof`, so this branch runs without it). On leaving ESP it calls `s.card(null)`.
  - 637 the status line shows `ESP computing…`, then `ESP 64³ in N ms`.
  - 642 `tell()` passes `esp` to `statusOf`.
  - 909 the returned `onEsp` and `espCaption()`.
  - 945 `setView` accepts 'esp'.
- `lab/status.js`: the `esp` VIEW row and an `esp` argument. Before landing the line is `ESP · NUMERICAL · Φ at nuclei exact`; after landing it is `ESP · NUMERICAL · 64³ grid · Φ at nuclei exact · −0.11 a.u. min`. `statusOf` stays pure.
- `lab/shell/stage-words.js` 30: the export caption carries `app.state.chem.espCaption()`, for example `H₂O · ESP · 64³ · min −0.11 · max +… a.u. · STO-3G · NUMERICAL`.
- The subtraction:
  - `lab/shadow.js` is moved to `tests/lib/shadow.js` (`git mv`, unchanged).
  - `lab/shadowview.js` now has `const SQRT2 = Math.SQRT2`, which was shadow.js' own definition.
  - `tests/hydrogen.test.mjs` imports `./lib/shadow.js`.
  - `pwa --write` dropped it from `lab/sw.js`, which now precaches 378 files.
  - Nothing else imported it.

## The WGSL pass
```wgsl
let pos = (vec3<f32>(gid) + 0.5) / f32(P.n) * (2.0 * P.half) - P.half;          // the kernels' own domain mapping
let g = clamp((pos / P.r1 + 1.0) * 0.5 * P.r0 - 0.5, 0, P.r0 - 1);           // → the card's cell-centre index space
let i0 = min(vec3<u32>(floor(g)), N - 2); let f = g - vec3<f32>(i0);
v = Σ_{8 corners} w.x·w.y·w.z · mat[q.x + N(q.y + N q.z)];                     // trilinear
textureStore(outTex, gid, (v, 0, 0, 0)); stats[slot] ← atomicMax bitcast(max v²)   // 'real' divides by sqrt(stats) = max |Φ|
```
Outside the card's box the edge cell holds. This is the sampler's clamp-to-edge.

## Checks
- **Node gate:** `node tests/pwa.test.mjs --write`, then `./test.sh node`: exit 0, 0 red.
- **1s hand check.** Throwaway script, not committed. A CPU ψ = e^{−r}/√π on 64³ cell centres over half 7 went through `setCard` and was compared with the eigenmode kernel's 1s through `readGrid` (f16 texels decoded):
  - at res 64 the cell centres coincide: max|Δ|/max = 5.1e-7 (one f16 ulp), RMS 7e-9;
  - at res 96 (a true trilinear resample): max|Δ|/max = 6.1e-2, at the 1s cusp, where the 64³ centres sit 0.19 bohr from the nucleus. Beyond 0.5 bohr it is 9.8e-3; RMS 3.3e-4;
  - Im of the card texels is 0, and √stats[0] = max |v|.
- **Frame cost.** `field.stats.lastEncodeMs`, mean of 60 frames at 96³; Firefox reduces timer precision to 0.1 ms:
  - no card: present 0.1 ms, reconstruct-tier 0.13 ms;
  - card set: present 0.1 ms, reconstruct-tier 0.1 ms;
  - 0 card passes ran in 120 frames while `cardDirty` was false. The arm adds ≈ 0 ms, and a set card also skips the kernel a reconstruct tier would have run.
- **The consumer** (throwaway, a synthetic signed Φ on water through `__LW.chem.onEsp`):
  - while computing the previous view stays (mat.view 0, density);
  - after the reply lands: mat.view 2 ('real'). The said line reads `ESP · NUMERICAL · 64³ grid · Φ at nuclei exact · −3.15 a.u. min` and the caption `ESP · 64³ · min −3.15 · max +33.98 a.u.`. √stats = max|Φ| (33.982). 0 molecular dispatches, and 0 card passes in 30 frames;
  - leaving to DENSITY gives back the molecular kernel (1 dispatch) and mat.view 0;
  - OFF then ON on the same solve re-asserts the same card (still valid for that solve);
  - no page errors.
- **Browser:**
  - `tests/official-defaults-palette.browser-test.mjs`: 3 PASS, exit 0;
  - `tests/molecule-demos.browser-test.mjs`: GREEN, 5 PASS.
- **THE LOCK** (`LW_PORT=9341 GD_PORT=4541 node tools/perf/digest-lock.mjs --check --query gastab=0`): GREEN. 860 values compared, 0 readback differences, 0 record-byte differences, nothing unrepeatable, 0 page errors, 60 s.

## Lines (`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`)
28,711 before. +64 for the card road, the view, the status, the session and the caption (the budget was ≤ +75). −97 for shadow.js, −1 for sw.js. **28,678 after (−33).**

## Deferred / for the integrator
- **The wire.** X1's `espPump()` and its reply call `onEsp(reply)` where X1 leaves `// 0.6.5 X2: field.setCard(reply)`. Wire it as `onEsp(reply)`, not `field.setCard`: the consumer keeps the session as the owner and the caption and status in step. `pushMatrix` already calls `espPump()` when VIEW = ESP and no card has landed for this solve. If X1 also calls its pump on the view change, one of the two calls goes.
- **The computing note** is on MOLECULES' status line (`ESP computing…`, then `ESP 64³ in N ms`), not under the VIEW row: the kit's `seg` has no note slot.
- **The scale.** The 'real' view divides by max |Φ|, so the near-nucleus maximum (clamped Z/r, tens of a.u.) sets the scale. The −0.1 a.u. lone-pair lobes will read faint. A symmetric or log-scaled presentation is a later row, not this cut.
- **A live run.** ESP is the still molecule's Φ. Under a live TDHF run the card keeps the field: each push re-asserts it under the selected model. A per-landing ESP is not in this cut.
