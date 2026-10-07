# λWAVES 0.4.0 · S0 THE TAKE-IN — what the tree builder built (waves 136–139)

Written by the S0 tree builder, 2026-10-07, against `BRIEF-S0.md`. The branch started at `61f7c2c` (the three briefs);
every commit below is on top of it, in the brief's order. Nothing was pushed, tagged, version-bumped or deployed;
`lab/mir/**`, `lab/fonts/**` and `MIR-MANIFEST.json` are byte-identical to `61f7c2c` at the tip.

## Summary (ten lines)

1. Six commits on the S0 branch (C1–C6, waves 136a/136b/136/137/138/139), each green on its own gates; tip = the S0-BUILD commit on `sos-s0` (C6 and this file were committed by Claude Sos after the builder's session ended).
2. Cloud's PR #1 and PR #2 merged (one conflict each, the generated `lab/sw.js`); the forged MIR 1.4.4 manifest and the `lab/mir/palette.js` edit subtracted, Jet Black kept live from `lab/palette-app.js`.
3. Under a molecule EDIT › COPY now copies the molecule's page (`moleculeLatex`: formula, RHF/basis, E, the ε ladder with HOMO/LUMO by index).
4. `.mol-more` is a fold (open on desktop, folded on phone/tablet, saved in the card's WORKSPACE record); MOLECULES' `Aa` shows with HELP off; ATOM brings ATOMS back, QUARKONIUM's button is hidden.
5. Cheap bugs fixed with a test each: CALCULUS ⧉ copies its rows; STATUS TAGS tick with METERS closed; WIGNER/RADIATION stand down under MOLECULES.
6. LINKED: REPRODUCED. Editor closed + nothing routed → the kit refuses the modulation play; the 1 s retry left a stopped transport for up to a second when the editor opened (353 ms measured). Fixed: opening the editor re-arms the link (46 ms / 33 ms).
7. KaTeX and marked load from the kit's `lab/mir/shell/vendor/`; the duplicate is deleted (27 files, 602 870 B off the deploy). Precache 207 files / 4 899 078 B → 182 / 4 607 101 B (−291 977 B); 185 after the demos.
8. `tests/mir-manifest.test.mjs` pins the manifest's sha-256 per accepted version; the `28fe445` forgery fails ("names MIR 1.4.4, which is not an accepted adoption"), and so does a copy relabelled 1.4.3.
9. Three demos made by the app — WATER, BENZENE, N₂ — each opening with MOLECULES on its HOMO, a notebook, and the visitor's settings untouched.
10. Final light check: `bash test.sh node` green (82 suites) on the recovered tree, re-run by Claude Sos; the browser half of §4 was not run by the builder — the S0 release verifier's full gate stands in for it.

## The commits

| # | sha | title |
|---|---|---|
| C1 | `0242bff` | 0.4.0 S0 wave 136a: merge PR #1 (Cloud, 2a03c06) — formula overlay, MO-REGISTRY paint, first-run molecules, legacy hidden, wrangler |
| C2 | `5c7109e` | 0.4.0 S0 wave 136b: merge PR #2 (Cloud, 28fe445) — stage formula + SIZE, SPECTRUM folds, paint everywhere, atom labels, Jet Black |
| C3 | `ebd45d5` | 0.4.0 S0 wave 136: the subtraction — the manifest true, Jet Black by the app's road, the molecule's page, the MORE fold, SPECTRUM's orphans |
| C4 | `1424d9f` | 0.4.0 S0 wave 137: the cheap bugs — CALCULUS's copy, the tags off METERS' tick, WIGNER under MOLECULES, the LINKED bug |
| C5 | `eaecf5e` | 0.4.0 S0 wave 138: wire, don't re-date — one KaTeX and one marked (the kit's), and the MIR manifest pinned |
| C6 | `bff9057` | 0.4.0 S0 wave 139: three demos as content — WATER, BENZENE and N₂ |
| — | (the commit after C6) | 0.4.0 S0: S0-BUILD.md, the tree builder's hand-off |

REPORT.md carries one wave entry per content commit under `## 2026-10-07 · 0.4.0 S0 — THE TAKE-IN` (waves 136–139).
The two merges have no heading of their own: `tools/changelog.mjs` parses `### wave <NN>` only, and wave 136 tells
what the merges brought in and what was kept or subtracted.

## Gates run, per commit (browser suites on LW_PORT=8731 / GD_PORT=5203, one at a time)

| commit | node | browser |
|---|---|---|
| C1 | `bash test.sh node` green (82 suites, 131 PASS lines, no FAIL) | — (the brief gates C1+C2 together) |
| C2 | `bash test.sh node` green (82 suites) | `latex-copy` RED at line 144 as predicted (SPECTRUM folded, not hidden), 8 PASS before it |
| C3 | `pwa --write` (207 entries); `new-project --check` in step (16 829 B); `bash test.sh node` green; `palette` 16 GREEN; `latex-state` + the water page; `first-run` 12 GREEN | `latex-copy` 9/9, `menubar` 8/8, `molecular-names` 5/5, `register` 17/17, `chem` 54/54, `routed-knob` 4/4, `new-project` 8/8 |
| C4 | `pwa --write`; `bash test.sh node` green | `take-in-bugs` 4/4 (new); RED before the LINKED fix (353 ms > 150 ms) |
| C5 | `pwa --write` (182 entries); `bash test.sh node` green; `mir-manifest` PASS pinned; `wiring` PASS (5 allowlisted) | `menubar` 8/8, `latex-copy` 9/9, `current` 15/15; `tools/build-deploy.mjs --no-test` verifies dist/ (203 files, 5.16 MiB) |
| C6 | `pwa --write` (185 entries); `bash test.sh node` green (the demo-look law reads all four demos) | `molecule-demos` 3/3 (new) |

The final light check (brief §4), after C6, one at a time: **NOT RUN by the builder** — its session (the previous Major Session's account) ended at 15:20 with C6 and this file written but uncommitted. Claude Sos recovered both into branch `sos-s0` unchanged, re-ran `node tests/pwa.test.mjs`, `node tools/new-project.mjs --check`, `node tests/mir-manifest.test.mjs` and `bash test.sh node` (all green, exit 0), and handed the browser suites to the release verifier (`BRIEF-S0-VERIFY.md`), which runs every one of them.

Not run, and why: the digest lock (`tools/perf/digest-lock.mjs`) — no edit to `lab/field.js`, a shader or the frame
loop's render order; the one frame-loop change (C4) is a DOM-text tick after the present, beside METERS' own.

## The precache delta (one-off script summing the bytes of every file `lab/sw.js` lists)

| tree | files | bytes |
|---|---|---|
| before C5 (C4 tip) | 207 | 4 899 078 |
| after C5 | 182 | 4 607 101 (−291 977 B, −285 KiB) |
| after C6 (three demos) | 185 | 4 664 889 (+57 788 B: the three demo files) |

The plan's "about 650 KB" is the deploy, not the precache: 27 duplicate files, 602 870 B, leave dist/. The precache
falls by less because the kit's `katex.min.js` and `marked.min.js` were staged (unprecached) and now join it — the
precache derives its staged set from the wiring allowlist, so closing those two rows put them back by itself.

## The forgery proof

From a scratch tree holding `git show 28fe445:MIR-MANIFEST.json` (version 1.4.4, commit `f56cf16e9402`, sha-256
`42b76e5ae433bda7d70a8da3d529cbbe1e071360b1cdc3fe23bf57d995a0aaf0`) beside the real `lab/`:

    AssertionError: MIR-MANIFEST.json names MIR 1.4.4, which is not an accepted adoption (accepted: 1.4.3). A real adoption
    is a two-file edit: the manifest MIR's tools/adopt.mjs writes, and its sha-256 pinned in ACCEPTED in tests/mir-manifest.test.mjs.

The same file relabelled "1.4.3" / `2e6b85a88fce` with its edited palette hash kept (sha-256 `84193a24…8bb0`):

    AssertionError: MIR-MANIFEST.json for MIR 1.4.3 has sha-256 84193a245f123e53f683f7c074b6489a17ad52169b50770e403de5fbf1148bb0,
    not the pinned a4c3b90102d02dcec420fe97a10dbac2a15d93d88ed5bb5f28977ff29f3d2d23. ...

The pinned 1.4.3 manifest: `a4c3b90102d02dcec420fe97a10dbac2a15d93d88ed5bb5f28977ff29f3d2d23`.

## The LINKED verdict

**Reproduced on this tree, fixed in place, guarded.** A real Space (the driver's key) at five starts:

| start | field | modulation |
|---|---|---|
| fresh boot, editor closed, nothing routed | plays | REFUSED `nothing-to-run` (refusedPlays 2 after 0.6 s, 4 after 2 s) |
| the same, then the editor opened while playing | plays | stopped until the next once-a-second retry — **353 ms** measured before the fix |
| reload with the editor left open | plays | plays |
| WAVE DANCER opened (routed) | plays | plays |
| NEW (editor closed, nothing routed) | plays | refused, as at boot |

The refusal is the kit's law (`lab/mir/modulation/host.js` `setPlaying`: with no route, sources only animate their
editor, and a closed editor counts as no live source). The defect a user sees is the next step — open the editor
under a playing field and its transport sat stopped. Fix (`rack.js`, the modwindow's `opened` hook): re-arm the link
(`linkFollowed = null; linkRetryAt = 0`), so the next frame plays it — 46 ms at boot, 33 ms after NEW, asserted ≤ 150
ms by `tests/take-in-bugs.browser-test.mjs`, which also asserts both clocks play at the routed / editor-open starts
and a second Space pauses both. The clocks become one at 0.5.0 (PLAN §3 B0).

## Open items, each with its reason

- **The kit's refusal reads a closed editor as "no sources".** Under LINKED with nothing routed and the editor closed,
  `mod.playing` stays false after Space (nothing would advance). host.js' own comment says presentation "changes
  presentation demand, never transport state"; the refusal gating on `presentationActive` sits oddly beside it. A
  MIR issue (KIT BRIEF material), not an app edit — `lab/mir/**` is not ours.
- **`lab/sw.js` NEVER_PRECACHE prose** still has a `vendor/katex/LICENSE — NO LONGER SKIPPED` row naming the deleted
  path. sw.js is regenerated, not hand-edited, and no check reads that row; the next deliberate edit of sw.js §2 should
  drop it.
- **The MORE chevron wraps to its own line** under MOLECULES' VIEW row on a 1500-px desktop (the VIEW seg + ORBITAL knob
  fill the row). It is the SHADOW details idiom, functional and reachable; a layout tidy is S3's or Josh's call, and the
  glass is not touched.
- **Jet Black is the app's row** until MIR carries it (KIT BRIEF J). When the kit ships it, delete `lab/palette-app.js`
  and its two imports (`rack.js`, `tests/palette.test.mjs`); the module is silent if the kit already has the id.
- **The paint gesture's code** (`lab/paint-stroke.js`) is generic and belongs in MIR; kept as is (audit A.4).
- **Demo notebooks name the HOMO by index**; S1 adds the symmetry names and will revise those lines (brief §3 C6).
- **`dist/`** was assembled once by `build-deploy.mjs --no-test` in this worktree (gitignored, not committed).
