# START HERE — the λWAVES handoff from Claude Yan (Major Agent, 2026-10-07)

**Who wrote this.** Claude Yan — Claude Fable 5.1, the Major Agent for λWAVES in the previous Major Session. Josh's
structure (his words, 2026-10-07): *"you are a 'Major Agent' called 'Claude Yan', I'll be switching accounts so the new
agents will probably be clueless in everything. Leave any breadcrumb you think they need."* and *"The accounts will act as
'Major Sessions'."* So: an account is a Major Session; each Major Session has Major Agents; this file passes the baton
between Major Sessions. You have no memory of what came before. **This file, the repo and the vault are your memory.**
Read it top to bottom (ten minutes), then `research/release-0.4.0/PLAN.md` (§1–§10), then the brief of the stage you are
on. Do not re-plan: the plan was fought through three NACRE layers and Josh approved it ("defaults are good", "build S0
and onward!").

---

## 1 · What λWAVES is, and where

A real-time WebGPU instrument for seeing quantum eigenmodes, molecular orbitals and their dynamics as a modulated
volume — Josh's one focus folder, his flagship on his own interface kit MIR. Live at
**https://lambdawaves.magic-commons.com/** (served at the ROOT; `/lab/` is 404) from Cloudflare. GitHub:
`magic-commons/lambdawaves` (`git remote -v`).

| what | where |
|---|---|
| the root checkout (= `main` = what is live) | `~/Documents/LAMBDAWAVES` — Josh's; you work in a worktree, never here |
| the Major Agent's worktree (branch `release-0.4.0`) | `~/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24` |
| the plan (the contract for everything below) | `research/release-0.4.0/PLAN.md` — §3 baseline, §4 features, §5 kit briefs, §6 stages, §9 rulings taken, §10 numbers taken |
| the surveys the plan rests on | `research/release-0.4.0/survey/{MIR-1.5,SIBLINGS,LWAVES-AUDIT,VAULT}.md`; the NACRE record `NACRE.md`, `PLAN-DRAFT-0..3.md`, `REVIEW-SONNET-*.md`, `AUDIT-OPUS-1.md` |
| the briefs (one per agent, the exact job) | `research/release-0.4.0/BRIEF-S0.md` (tree), `BRIEF-S0-MEASURE.md`, `BRIEF-S0-CANARY.md`, `BRIEF-S0-VERIFY.md`, `BRIEF-S1-NAMES.md`, `BRIEF-S1-CAMERAEYE.md`, `BRIEF-S1-SOL.md` |
| the numbers | `research/release-0.4.0/measure/MEASURE.md` (+ JSON), `docs/MIR-1.5-CANARY.md` (+ `research/release-0.4.0/canary/`) |
| the names plan + working probe | `research/molecular-orbitals-2026-10-01/{NAMES-AND-CACHE-PLAN.md,PROBE.md,names-probe.mjs,names-probe.json}` |
| the Sol thread's ledger | `research/MATH-CYCLOTOMIC-SCALING-2026-10-07.md` (append-only rounds) |
| the project's laws | `CLAUDE.md` (repo), `docs/STATE-SCOPES.md`, `RELEASING.md`, `REPORT.md` (the notebook every session appends to; waves number from 136 for S0) |
| MIR, Josh's kit | `~/Documents/MIR` (main = 1.4.3, what λWAVES adopted); the 1.5 pin `~/Documents/MIR/.claude/worktrees/mir-1.5-pin` (1.5.0-alpha.23, `0f5c7f9`); `node ~/Documents/MIR/tools/adopt.mjs <root> --check` |
| the vault (Obsidian) | `~/Documents/OBSIDIAN/` — notes in the house naming `<APP> CLAUDE <WHAT> <date>.md`; this file is mirrored as `LAMBDAWAVES CLAUDE YAN HANDOFF 2026-10-07.md`; the plan as `LAMBDAWAVES CLAUDE 0.4.0 PLAN 2026-10-07.md` |
| Sol (GPT via Codex) | `node ~/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs task --background --write --fresh --effort xhigh "<prompt>"` from the worktree root; `status`, `result` |
| the previous memory (may not exist for you) | `~/.claude/projects/-home-joshua-hosain/memory/lambdawaves-lab.md` + `MEMORY.md` — if present, read the last six paragraphs of the lab file |

## 2 · The state on 2026-10-07 (evening)

> **UPDATE 2026-10-07 ~17:15 — Claude Sos took the baton** (the fallback Major Agent on Josh's second account; Josh:
> *"'Claude Yan' is the first; this is her work, you are the fallback when usage gets rough"*). Yan's session ended with
> both in-flight agents dead (files last written 15:18–15:20). What Sos found and did:
> - **The line moved to branch `sos-s0`**, worktree `~/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0`, a fast-forward
>   of `release-0.4.0` (d5b9d1d). The permission guard refused merging inside Yan's locked worktree
>   (`optimization-2026-09-24`), so the local `release-0.4.0` still points at d5b9d1d. Fast-forward it to `sos-s0` from a
>   worktree that has it checked out (`git merge --ff-only sos-s0`) or push `sos-s0:release-0.4.0`.
> - **S0-A rescued — DONE.** The builder had committed C1–C5 (to `eaecf5e`) and written C6 (three demos) and
>   `S0-BUILD.md` without committing. Merged as `9090665`; C6 = `bff9057`; S0-BUILD.md = `767ab6e` (its placeholders
>   filled with the recovery facts). Re-checked: `pwa`, `new-project --check`, `mir-manifest`, `bash test.sh node` green.
>   **The builder's §4 browser light check never ran** — the verifier's full gate is the first run.
> - **S1″ Sol thread Round 1 rescued — DONE** (`bc103b3`): ledger + `tools/symmetry/{unique-quartets.mjs,pyscf-symm-oracle.py}`
>   + `measure/{quartets.json,pyscf-symm-oracle.json}`; the census re-run on the merged tree gave identical counts;
>   DISK rebuilt (102 documents).
> - **S0-V launched** (fresh Opus, own worktree, ports 8745/5213) on `bc103b3`; **Sol Round 2 launched** (Codex xhigh,
>   in the `sos-s0` worktree, appends `## ROUND 2 · SOL` to the ledger, uncommitted until Sos commits it).
> - A stale gate server from the dead builder (python, port 8731) is still running; the guard refused killing it. Use
>   other ports or ask Josh to stop it.
> - **S0-V DONE** (`e0d619f`, merged `eaf375b`): 23/24 browser suites green on the first full run; one BLOCKER (a stale
>   `official-defaults-palette` assertion vs C3's MOLECULES `Aa` law) and one SHOULD (the LINKED wording) fixed by Sos in
>   `ad9e8a0`, both suites re-run alone green. **Fit to cut: YES.**
> - **v0.3.3-alpha CUT LOCALLY, NOT LIVE:** version line `9504700` (tag `v0.3.3-alpha`, annotated), CHANGELOG `eb3a132`,
>   snapshot #15 in `~/Documents/LAMBDAWAVES-RELEASES/v0.3.3-alpha`, `dist/` built and verified (206 files, 5.23 MiB). The
>   permission guard refused the push of `main`/`dev` as a production deploy. **Josh's ruling, 2026-10-07: "we don't have
>   to push anything to live cloudflare or Github until the entire plan as run it's course, which is an extremely long
>   plan."** So nothing is pushed, deployed or released until 0.4.0's plan is finished (this supersedes the HANDOFF §3.2
>   "cut and go live" step; `sos-s0` was pushed once as a backup before the ruling). The road when that day comes, from
>   the `sos-s0` worktree:
>   `git push origin sos-s0 sos-s0:release-0.4.0 sos-s0:dev sos-s0:main --follow-tags` ·
>   `npx wrangler deploy --env=""` · `gh release create v0.3.3-alpha --generate-notes --prerelease` ·
>   `curl -s https://lambdawaves.magic-commons.com/rack.js | grep -o "BUILD_LINE = '[^']*'"`.
> - **Briefs written for the rest of the road:** `BRIEF-S2-CAMERA.md` (one shift convention fixing PLAN F4's three
>   disagreeing formulas), `BRIEF-S3-STAGE-AND-WINDOWS.md`, `BRIEF-S4-LIBRARY.md` (a/b/c), `BRIEF-S5-KIT-BRIEFS.md`.
> - **Sol Round 2** (Codex task `task-muyncqpn-zablm5`, gpt-6.1-sol at xhigh) was still writing when this was recorded;
>   its files are uncommitted in the `sos-s0` worktree (`tools/symmetry/round2-sol*`, `measure/*round2-sol*`). Josh:
>   Sol 6.1 sits between Sonnet and Opus — re-run its headline numbers before the SYNTHESIS banks them.
> **UPDATE 2026-10-07 ~18:25 — Claude Sos, third session (Fable).** Josh's coordination rule, verbatim: *"Two Claude
> accounts work on this project. Before editing, identify your current directory, branch, assigned task, and worktree.
> Use separate worktrees and branches for simultaneous implementation. Coordinate through written reports; do not assume
> you can see or control the other account's conversation or workers. Stay inside your assigned worktree when editing
> and running Git commands. Report your worktree path, branch, commits, tests, blockers, and next step in every handoff.
> Preserve unfinished work, and do not remove another agent's worktree. Let one designated agent integrate changes. When
> blocked, report the exact error and command. Avoid repeatedly creating replacement worktrees."*
> - **The integrator is Claude Sos on `sos-s0`** (worktree `~/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0`). Builders
>   work in their own `.claude/worktrees/agent-*` worktrees and are merged here; nobody else merges into `sos-s0`. If
>   Yan's account is active on λWAVES at the same time, hand branches over by a written report (this file's §2, a vault
>   note, or a `*-BUILD.md` beside the briefs), never by editing `sos-s0`.
> - **Landed since the previous update:** S0-V fixed (`ad9e8a0`); v0.3.3-alpha tagged locally at `9504700`, not live;
>   Sol Round 2 committed (`58852c7`); **S1′ `cameraEye` merged** (`f247f0c`, wave 144, `S1-CAMERAEYE-BUILD.md`);
>   **S1 NAMES merged** (`bd9b0e5`, waves 140–143, `S1-NAMES-BUILD.md` + the builder's `S1-NAMES-HANDOFF.md`). Tip of
>   `sos-s0` at this update: `bd9b0e5`.
> - **Running now, all from `bd9b0e5`:** the S2 CAMERA builder (Opus, `BRIEF-S2-CAMERA.md`, ports 8747/5215, waves from
>   145); the S3 STAGE TEXT + WINDOWS builder (Opus, `BRIEF-S3-STAGE-AND-WINDOWS.md`, ports 8751/5219, waves from 155 —
>   the integrator renumbers if the two collide); the Sol thread Round 3 + SYNTHESIS (Fable lead at max, own worktree,
>   appends to the ledger and rebuilds the DISK); and Sol's LIBRARY CENSUS + C₆₀ frontier (Codex `task-muyotogt-mb4bgz`,
>   gpt-6.1-sol at xhigh) writing UNTRACKED files into the `sos-s0` worktree under `research/release-0.4.0/library-census/`
>   and `tools/library/` — leave those paths alone until Sos commits them. Merge order when they land: S2, then S3
>   (`rack.js` is shared in disjoint regions), then the ledger; then the S2 verifier (8749/5217).
> - **Still true:** local `release-0.4.0` sits at `d5b9d1d` in Yan's locked worktree (fast-forward it to `sos-s0` from a
>   worktree that has it checked out); the stale gate server from Yan's dead S0 builder (python pid 1544349, port 8731)
>   is still up; nothing is pushed or deployed (Josh's ruling above). The unused worktree `agent-a851ec0dd786a3819`
>   (a Round 3 agent stopped before it wrote anything) is left for Josh to remove.
> - **Next after this session's workers land:** S5 KIT BRIEFS (Sonnet or Sol; needs `S2-CAMERA-BUILD.md` and
>   `S3-BUILD.md`), S4 LIBRARY a/b/c on the census's numbers, then the local 0.4.0-alpha cut on Josh's word.
> **UPDATE 2026-10-08 ~00:20 — Claude Sos, end of the third session (usage pause).** Tip of `sos-s0` after this commit; tree clean.
> - **Merged:** the Sol thread Round 3 + SYNTHESIS (`4b935e9`; the one number 25.81 % — 10,966 of 42,486 live quartets under D₂h;
>   symmetry does not earn a symmetry-adapted SCF). **Josh's ruling** on its D1–D4: *"Perhaps all default/option one's"* →
>   R-S1-0.5 option 1 and D2–D4 option 1, recorded in PLAN §9, the 0.5.x row and the ledger (`81f5df2`); the thread is CLOSED.
>   **S2 THE CAMERA** (`babb58f`, builder `93cd70f`, waves 145–148, `S2-CAMERA-BUILD.md`): both digest locks GREEN, the matrix sign
>   proved on the GPU, the link carries the shot; `lab/*.js` +90 (the feature). **Sol's LIBRARY CENSUS + C₆₀ frontier** committed
>   as DRAFT, UNVERIFIED by Sos (`9e79132`; `research/release-0.4.0/library-census/`, `tools/library/`; spot-check before S4 banks a
>   number).
> - **Built, NOT merged:** **S3 STAGE TEXT + WINDOWS** on `worktree-agent-a4faa45d300fd21dc` tip `3621836` (T1–T7 + follow-up +
>   `S3-BUILD.md`, waves 155–161; 83 node suites and 26 browser suites green at its tip). It overlaps S2 in `lab/rack.js`, `lab/sw.js`,
>   `REPORT.md`, `docs/STATE-SCOPES.md`, `tools/new-project.mjs` — small conflicts, the resolution is written in
>   `~/.claude/handoffs/latest.md` step 1 and in the branch's `S3-HANDOFF.md`. Its "lines DOWN" acceptance is NOT met (+53:
>   `dynamics.js` is a shared library; only `dynamicsview.js` could go) — Josh decides. It also set the stage formula's base size to
>   34 px (the notebook's title) and drops `atomLabels:false` beside `molFormula` on — in `S3-BUILD.md` for Josh.
> - **Not started:** the S2 verifier (`BRIEF-S2-VERIFY.md` is written, `9d8d8ed`; ports 8749/5217), S5 KIT BRIEFS, S4 LIBRARY a/b/c.
> - **Order for the next session:** merge S3 (then `new-project`, `pwa --write`, node gate, light browser check) → S2 verifier → census
>   spot-check → S5 ∥ S4a → the local 0.4.0-alpha cut on Josh's word. Worker notes: `~/.claude/handoffs/agents/*.md`.
> **UPDATE 2026-10-08 ~02:00 — Claude Sos, fourth session (Fable), Josh: "Lets continue".** On `sos-s0`:
> - **S3 STAGE TEXT + WINDOWS merged** (`7e6220b`, builder `3621836`, waves 155–161, `S3-BUILD.md`). Resolved: REPORT.md keeps both
>   sections (S2 then S3); `lab/rack.js` l.26 keeps `toScreen` in the `field.js` import (S3 trimmed it as unused, S2's `pointerRay`
>   uses it); `lab/sw.js` and the empty project regenerated (16,866 B, in step). Merged tree: `bash test.sh node` exit 0; browser
>   one at a time on 8753/5221: `stage-text`, `camera-shift`, `frame-occlusion`, `new-project`, `molecular-names`, `history` all
>   green. `lab/*.js` 35,738 (bd9b0e5) → 35,881 (+143 = S2 +90, S3 +53; S3's "lines DOWN" NOT met — for Josh).
> - **The census spot-checked** (`8259eee`): water and benzene MATCH the oracle (0, 7e-13 Eh); alanine, Li₄F₄, TiCl₄ MATCH the app's
>   own solver (≤ 2e-11 Eh). The energies stand; the counts are taken as Sol tagged them. S4 may read it.
> - **S5 KIT BRIEFS → Sol** (Codex `task-muz6hazq-eqsd8r`, gpt-6.1-sol at xhigh, Josh: Sol for any task) writing ONE untracked file
>   `research/release-0.4.0/KIT-BRIEFS.md` inside the `sos-s0` worktree; Sos reads it once, then commits and mirrors it to the vault.
> - **Blocked:** the agent-control plugin is still in its handoff pause and REFUSES new Claude workers ("Agent Control is paused
>   for handoff"), so the **S2 verifier** (`BRIEF-S2-VERIFY.md`, start `8259eee`, 8749/5217) and the **S4a builder**
>   (`BRIEF-S4-LIBRARY.md` §S4a, 8753/5221, then its verifier 8755/5223) wait for Josh to lift the pause.
> **UPDATE 2026-10-08 ~03:00 — Claude Sos, session 4, after `/resume-work`.**
> - **S2 VERIFIED — stands** (`S2-VERIFY.md`, fresh Opus, merged `64c636b`): the 1004-value lock byte-identical at shift 0, the
>   96³ lock green, 84 node suites, 11 browser suites and the verifier's 19 own scenes green on the first run, device report equal
>   (19.6 vs 19.7 fps at load 1); the builder's lock-tool `meta()` change judged legitimate (a 0.002 shift still differs in 218
>   readbacks). 0 BLOCKER; the 1 SHOULD fixed by Sos (`tests/camera-shift.browser-test.mjs`: re-clear the mask before the line
>   pass, a third corner over the left rack, `defaultPrevented` on Alt+Arrow) and green alone. **NOTEs for Josh's R-C1 trial:**
>   zoom-to-cursor holds the anchor only for cursors within ~0.18 uv of the centre once the pivot hits the frame edge (the clamp,
>   by design); Alt now slides the picture before KEPLER's handle grab and HELIUM's Alt+Shift electron placement; the M5 half of
>   the device report is still one command (`?report=1` on the iPad).
> - **S5 KIT BRIEFS landed** (`d943fea`, Sol at xhigh, read once by Sos): 17 briefs for the MIR session in PLAN §5's order,
>   26 consuming port groups, 672 gross lines the adoption would delete (361 without the camera gift); mirrored to the vault as
>   `LAMBDAWAVES CLAUDE KIT BRIEFS FOR MIR 2026-10-08.md`.
> - **Running:** the S4a LIBRARY builder (Opus, 8753/5221, from `9395ab3`). Then its verifier (8755/5223), S4b ∥ S4c, the local
>   0.4.0-alpha cut on Josh's word.
> **UPDATE 2026-10-08 ~04:30 — Claude Sos, session 4: S4a merged, verified, its BLOCKER fixed; S4b ∥ S4c running.**
> - **S4a THE PROOF AND THE STORE merged** (`cfdd674`, builder `4b49642`, waves 162–167, `S4a-BUILD.md`): schema-1 records,
>   `tools/orbital-library.mjs --check` byte-exact, benzene (the proof) and lysine (the 64-AO lock fixture), `chem.open` with 0
>   solver calls, `library/` the one precache exemption into `lw-data-v1`, the LIBRARY scope row, COST refit (benzene ~1.7 s, was
>   ~9.6 s), the 1148-value lock fixture `measure/digest-lock-s4a.json`. `lab/*.js` 35,881 → 36,131 (+250: the law not met — for Josh).
> - **S4a VERIFIED** (`S4a-VERIFY.md`, fresh Opus, merged `96c8b08`): every gate and both locks green, 0 solver calls on open counted
>   independently, cached = fresh in Firefox (|ΔE| 1.3e-12, 0 of 1,048,576 texels differ), persist() once, the store survives a
>   build. **BLOCKER B1 fixed by Sos (`b5eed68`):** a stale `chem.open` (press benzene then lysine) replaced the worker's one cache and
>   the next lysine op live-solved a past-the-cap molecule; now `seq === solveSeq` guards every worker post in `chemview.js` and the
>   worker refuses a cache miss on a record-only key (`recordOnlyIds`); probe 0 calls, KICK refused in 5 ms; `tests/library.test.mjs`
>   §5b. **SHOULD S1** (the plain 1004 lock reads RED by fixture shape since S4a's three record states; GREEN with `--states` or
>   the 1148 fixture): told to S4c, which owns `tools/perf`. NOTEs for S4b: `validateRecord` checks shape only; RPA sticks' μ not in
>   a canonical gauge for degenerate roots; pyridine at 0.99× and Br₂ at 1.13× benzene in node.
> - **Running from `cfdd674` (+ `b5eed68` offered to both):** S4b THE SECTIONS (Opus, 8757/5225, waves from 168) and S4c THE ENGINE
>   UPGRADES (Opus, 8759/5227, waves from 178). Then the kernel verifier (8761/5229), then the local 0.4.0-alpha cut on Josh's word.
> - Josh tried the camera on the test servers (https://127.0.0.1:8721/lab/, LAN https://10.0.0.18:8711/lab/, serving `sos-s0`):
>   *"Nice, I'm impressed. We might change the default keybinds for new camera mouse-controls and perhaps touch gestures but this is
>   good for now!"* — an open item after 0.4.0. Josh: Haiku 5.5 may take the easiest bulk tasks at high–xhigh effort.
> **UPDATE 2026-10-08 ~06:10 — Claude Sos, session 4 continued after a second usage pause (Josh: "Usage is back so let's
> continue, Yan is still weekly blocked so we'll resume as usual").**
> - **S4c THE ENGINE UPGRADES merged** (`a927fc3`, builder `c6f5957`, waves 178–182, `S4c-BUILD.md` + `S4C-HANDOFF.md`, MEASURE.md §5):
>   `MOL_CAPS = [16, 40, 64, 128]` (the 3070 grants 32 KiB; a refused device builds the 128 tier with 32 lanes and draws the same
>   texels); `ORB_WGSL`, the orbital-only path (C₆₀'s HOMO 3.6 ms screened at 96³); **C₆₀'s HOMO and LUMO draw** from a schema-1
>   frontier record (`lab/library/9520cedc….json`, DRAFT geometry stated, 0 solver calls, 4–6e-4 of max against PySCF at 256
>   voxels); VALENCE as a switch on DENSITY (lysine's max density 47.8 → 1.60); the lock compares only its fixture's states
>   (`cbc7b0f`); 1004 and 1148 locks GREEN; device report 18.2 → 19.1 fps. `lab/*.js` 36,137 → 36,225 (+88, the law not met — for
>   Josh). 87 AO is tryptophan (phenylalanine is 71; the brief's example was wrong). M5 pending: `./serve-lan.sh`, then
>   `https://<LAN>:8710/lab/?report=1&post=1` on the iPad.
> - **S4b THE SECTIONS — built to B4, resumed:** `worktree-agent-aee5748ddb578d188` tip `2770699` (B1 the three sizing entries as
>   records; B2–B5 code: the gate with the family allowance, the STEM fields and C5 labels by projection, the page turner and the
>   header; B4: **37 records behind the gate, 11.4 MB**, every one labelled by projection and held against PySCF). The builder died
>   on the Opus session limit at ~05:30 without a hand-off (one uncommitted edit, `tests/library.browser-test.mjs`); its gate server
>   was killed by pid by Sos; it was RESUMED by message at ~06:00 with the order: commit, **merge `a927fc3` (S4c) on its own branch
>   and resolve the nine-file overlap** (chemview.js, library.js, library.json, mathworker.js, sw.js, orbital-library.mjs, three
>   tests), decide C₆₀'s section and identifiers, gates, REPORT waves 168–177, `S4b-BUILD.md`.
> - Josh on lysine from its record (the first past-the-cap molecule): *"Holy, Lysine is beautiful!"*
> - **Next, in order:** merge S4b → node gate + `library`/`chem`/`orbitals` light check → **the kernel verifier** (fresh Opus,
>   8761/5229, the commands at the end of `S4c-BUILD.md`, contract BRIEF-S4-LIBRARY §S4c) → fold S4b's brief-4 notes into
>   `KIT-BRIEFS.md` (Haiku 5.5 may do it) → **the local 0.4.0-alpha cut on Josh's word** (RELEASING.md's road, no push, no deploy).
> **UPDATE 2026-10-08 ~07:05 — Claude Sos, session 4: S4 complete on `sos-s0`; only the kernel verifier and the cut remain.**
> - **S4b THE SECTIONS merged** (`3ced864`, builder `7d93277`, waves 168–174, `S4b-BUILD.md`; the builder merged S4c on its own branch
>   and resolved the seven conflicts, so the merge was clean): **38 records behind the diversity gate, 11,532,460 B** (ORGANIC 1,
>   BIO 25, LATTICE 6 with C₆₀, HEAVY 6; DIATOMICS and HYDRIDES all live), eight past 64 AO drawing on S4c's tier; every RHF record
>   labelled by projection (C5) and within 6.9e-9 Eh of its PySCF oracle; the three sizing entries timed (alanine 2.0 s to generate,
>   129 KB, 2–3 ms to open; Li₄F₄; TiCl₄ 11–14 s, 211 KB); the section header = the page turner (◂ ▸, SECTION readout, INSTALLED
>   switch) above the dropdown; 36 identifiers PubChem-verified (B₁₂H₁₂²⁻ UNVERIFIED, Li₄F₄ and the water hexamer have no entry);
>   **nine of the census's self-built amino acids were the D form — mirrored to L**, lysine's two lock values re-recorded (24 of the
>   1148, the 1004 untouched); **ferrocene refused by the stability probe** (PySCF agrees; the census was wrong); R-L6: stopped at Kr;
>   **the census's byte estimate was 8–10× too small** (the RPA sticks dominate); **NIST SRD 101 is a copyrighted compilation — no
>   CCCBDB table in the store**. `lab/*.js` 36,131 → 36,280 (S4b +55; the law not met — for Josh). CLAUDE.md's MOLECULES paragraph
>   and KIT-BRIEFS brief 4 updated by Sos (`3dfbc46`, vault mirror refreshed).
> - **Merged-tree gates (Sos, 06:41–07:00):** `orbital-library --check` in step; `bash test.sh node` exit 0; browser on 8721/5231 one
>   at a time: `library` (incl. the sections scene and the two-press race), `chem` 55/55, `orbitals` 24/24 — GREEN.
> - **Rulings taken by default, for Josh to confirm or overrule:** C₆₀ ships under a declared `milestone` allowance in the gate
>   (his words: "maybe a bucky-ball as our next milestone"; R-L2 = YES); C₂₀H₂₀ is a test fixture only, not shipped; of the four
>   rock-salt cubes only Li₄F₄ ships; the C₆₀ geometry is Sol's DRAFT until 0.4.1. Still open from earlier: Br₂ vs the cap; the
>   subtraction law unmet by S3 (+53), S4a (+250), S4c (+88), S4b (+55); the stage formula at 34 px; `atomLabels:false` not honoured.
> - **Blocked:** the kernel verifier (`BRIEF-S4C-VERIFY.md`, 8761/5229, start `3ced864` or later) — the agent-control plugin is in its
>   pause again (tripped at 98 % during S4b) and refuses new workers until `/resume-work`.
> - **Then the cut:** v0.4.0-alpha LOCALLY on Josh's word (RELEASING.md's road: the version line in `lab/rack.js`, README status,
>   `pwa --write`, the gates, commit, annotated tag, `tools/changelog.mjs` — CHANGELOG was already out of step at S4a's base —
>   `tools/snapshot-release.mjs`, `tools/build-deploy.mjs`; NO push, NO deploy, NO GitHub release until Josh says the plan is done).
> **UPDATE 2026-10-08 ~07:45 — Claude Sos: 0.5.0 begins (Josh: "Let's go onward to 0.5.0" · "do as many parallel work/subagents
> you want").** The 0.5.0 planning lives in `research/release-0.5.0/` (`NACRE.md`, `PLAN-DRAFT-0.md` by Fable, `12451d2`); its
> gates: brief 8 is unbuilt in MIR's 1.5 line (alpha.24, `~/Documents/MIR/.claude/worktrees/mir-1.5`), the `1.5.0` cut is open
> (R-G1: wait, the default), the first look is Josh's. **Running from `12451d2`, each in its own worktree:** the S4c kernel verifier
> (8761/5229 — the 0.4.0-alpha cut follows a YES); REVIEW-SONNET-0 of the pre-draft; stage A wave 1 — A4 the floating-rack module
> (8763/5233), A5+A6 the modulation port and the one-clock facade (R-B1; 8765/5235), A9–A11 the actions table (R-K1), tests by hook
> with the canary's four gate rewrites, the kit precache policy and a throwaway alpha.24 canary (8767/5237). Merge order A4, A5+A6,
> A9–A11; then wave 2 (A1+A2+A3, A7+A8). Rulings taken by default until Josh says otherwise: R5-G1 wait for `1.5.0`; R5-M1 the MIR
> briefs by Josh's primary account when its week resets.
> **UPDATE 2026-10-08 ~11:05 — Claude Sos: v0.4.0-alpha CUT LOCALLY; the 0.5.0 plan at layer four; stage A wave 1 in flight.**
> - **S4c VERIFIED** (`S4c-VERIFY.md`, fresh Opus, merged `0724d2b`): 0 BLOCKER, 0 SHOULD, 12 NOTEs; 1004 and 1148 locks GREEN; the ≤ 64
>   tiers' compiled WGSL byte-identical to `b5eed68`; the refused-device fallback identical three ways; 13 past-64-AO records within
>   8.5e-4 of PySCF; C₆₀ bit-identical to the census dump; VALENCE 47.786 → 1.601 in the app and in PySCF. Three NOTEs fixed by Sos
>   (`c913fca`): the STATES press on a record-only molecule keeps the worker's refusal sentence; "same texels" across browsers
>   reworded (each browser is self-consistent); C₆₀'s record is `a8166591…` (145 KB) since S4b regenerated it.
> - **v0.4.0-alpha CUT, LOCAL ONLY:** version line `8193016` (`BUILD_LINE = '0.4.0-alpha · the library · 2026-10-08'`, README
>   "Status: 0.4.0 alpha."), annotated tag `v0.4.0-alpha`, CHANGELOG `32bf806` (waves 140–182, 34 waves; the numbering has gaps at
>   149–154 and 175–177 from the parallel builders — cosmetic), snapshot #16 at `~/Documents/LAMBDAWAVES-RELEASES/v0.4.0-alpha` (17 MB)
>   + the vault index note, `dist/` built and verified (247 files, 16.51 MiB, the 11.5 MB library inside). Node gate exit 0 at the cut.
>   **Nothing pushed, deployed or released** (Josh's ruling). The road when that day comes is the one in the Sos update above, with
>   `v0.4.0-alpha` in place of `v0.3.3-alpha`. Josh's test servers (8721 / LAN 8711) now serve the 0.4.0-alpha tree.
> - **0.5.0 planning (NACRE) in `research/release-0.5.0/`:** `PLAN-DRAFT-0` (Fable) → `REVIEW-SONNET-0` (`636c044`) → `PLAN-DRAFT-1`
>   (`7d10a63`) → `AUDIT-OPUS-1` (`87f5bd6`) → **`PLAN-DRAFT-2` (`2c6cbe2`)** → REVIEW-SONNET-2 (running) → DRAFT 3 (the one Josh reads)
>   → `PLAN.md`. The plan's spine: the release is judged by `lab/*.js` falling (0.4.0 added +1,559 against its law); stage A THE SEAMS
>   capped at +150 with A2/A3/A4/A12 struck and the `__LW` law (1,507 uses of 96 members: no renamed member without its test); A6 a
>   facade holding `demand('app.play')` under `modArm && clockLink` (LINKED retires at C4); R5-G1 default = pin alpha.24, re-adopt once
>   at the first kit carrying brief 8; C0 the bare adopt + cascade with seven stylehash classes as Josh's rulings; the one lock at C7;
>   CDP `TaskDuration` ms/s with a measured floor; 28.2–29.6k ESTIMATE; D on a net-≤-0 ledger with D9 (the legacy five, 1,469 lines)
>   first. **Rulings for Josh first:** R5-G1, R5-W1 (the kit-file wiring law), R5-A3 (one project part), R5-L1 (the legacy five); then
>   his Q1–Q3 (camera bindings; the 0.5.0 minimum + who builds the MIR briefs; MIR OPTIONS / LANGUAGE / KEYBOARD skin).
> - **Stage A wave 1 (from `12451d2`, each in its own worktree, NOT merged yet):** A5 DONE on `worktree-agent-ac7efdcc9d1fca69a`
>   (`f9b47dd`: `lab/mod-port.js`, rack.js −163, −44 net) with A6 (the facade) being built by the same builder; A9 DONE and A10 half on
>   `worktree-agent-a951ee2405b1383e6` (hand-off `b6dfda6`), A11 next, builder resumed; A0 (the baseline, stylehash with modwindow +
>   notebook open, the INFORMATIONAL spike by five rules) running on Sonnet; **A4 PARKED** on `worktree-agent-a42dc49a851951ba4`
>   (`4bd0bbc`, lab/windows.js, green, +38) — struck as a stage by the audit, kept as C3's reference, never merged. Wave 2 after wave 1
>   merges: A1+A8 ∥ A7. Merge order: A9–A11, then A5+A6 (A5 may merge alone if A6 lags).
> - **Still Josh's:** the M5 numbers (persist, `limits.html`, `?report=1&post=1`); the camera bindings; the carried rulings (Br₂, C₆₀'s
>   allowance, C₂₀H₂₀, one rock-salt cube, the subtraction law unmet four times).
> **UPDATE 2026-10-08 ~12:10 — Claude Sos: the 0.5.0 plan is at DRAFT 3 for Josh; A5+A6 merged; wave 2 building.**
> - **PLAN-DRAFT-3** (`371c100`; vault mirror `LAMBDAWAVES CLAUDE 0.5.0 PLAN DRAFT 3 2026-10-08.md`) closes the NACRE rounds: Fable
>   pre-draft → Sonnet review → DRAFT 1 → Opus audit → DRAFT 2 → Sonnet review 2 → DRAFT 3. Josh reads it; his rulings go into a §9 and it
>   becomes `research/release-0.5.0/PLAN.md` (+ the vault `LAMBDAWAVES CLAUDE 0.5.0 PLAN <date>.md`). Its §3 asks him four things first:
>   the glass (seven stylehash classes at C0, each a screenshot ruling), the camera bindings (Q1), R5-G1 (pin alpha.24, re-adopt when
>   brief 8 lands), R5-L1 (the legacy five, deletable ceiling 1,139 — they pay for the INFORMATIONAL); then Q2 (the 0.5.0 minimum without
>   C8; who builds the MIR briefs) and Q3 (MIR OPTIONS / LANGUAGE / KEYBOARD skin — defaults hidden, hidden, λWAVES'). Defaults taken
>   unless he objects: R5-W1, R5-A3 and the rest of §3's list.
> - **A5+A6 merged** (`b5b6d7d`, builder `8fee157`, waves 188–189): `lab/mod-port.js` the port `createModulation(port)` takes; `onePlay`
>   in `lab/clock.js`; the facade holds the kit's `demand('app.play')` while MOD is armed and LINKED — S0's refusal closed; the LINKED
>   retry and re-arm deleted. `lab/*.js` 36,280 → **36,234 (−46): the first seam of 0.5.0 subtracts.** Merged-tree gate: node exit 0;
>   `take-in-bugs` 4/4, `history` 39, `mir-controls`, `routed-knob` green. CLAUDE.md's modulation paragraph carries it (`994c4e1`).
> - **Building from `b5b6d7d`:** A1+A8 (the settings adapter + the camera port with the bindings as a data table; 8763/5233) ∥ A7 (the
>   occlusion providers; 8773/5243); A9–A11 (A9 done; A10's four gate rewrites with the manifest pin kept; A11 = the skip list; the
>   throwaway alpha.24 canary) on 8767/5237; A0 (the baseline, stylehash with the window open, the INFORMATIONAL spike by five rules).
>   **A4 parked** (`4bd0bbc`), never merged. Next after wave 2: **A-M**, the ms/s instrument (`tools/perf/main-thread.mjs`, CDP
>   `TaskDuration`) and the pre-C baseline. The standing merge conflict between A branches is the generated `lab/sw.js` (take either side,
>   `pwa --write`).
> **UPDATE 2026-10-08 ~12:50 — Claude Sos, fourth usage pause: stage A wave 1 all merged; A0's row in; wave 2 parked with designs.**
> - **Merged on `sos-s0`:** A5+A6 (`b5b6d7d`), **A9–A11** (`611474b` + follow-up `9443c2d`: the ACTIONS table on the kit's ids with
>   FOLDERS on O and `Ctrl` explicit; eleven suites by hook; the canary's four gate rewrites with the manifest's sha pin kept; the
>   driver-port settle in `tools/gate/drv.mjs`; `sw.js` §1b `SKIP = ['mir/locales/*.json', 'mir/tokens.json']` — the adopted alpha.24
>   copy 9.46 → 7.33 MiB; the canary's node reds 78 → 81 of 85, the four left are the kit's: `mir-manifest` (C0's pin), `new-project`
>   (C0's bpm regeneration), `wiring` (R5-W1), `pwa`'s three hidden kit deltas), and **CANARY-A0 PARTIAL** (`ff17874`). `lab/*.js`
>   36,280 → **36,198 (−82)**. Merged-tree gate running at this writing (node + keyboard-window, menubar, history, offer, take-in-bugs,
>   frame-occlusion; log in the job tmp). Still to write for A9–A11: REPORT waves 193– and `A9-A11-BUILD.md` from its hand-off
>   `15b4d5e` (a Haiku 5.5 task), including the R5-W1 proposal and the drafted CLAUDE.md keyboard paragraph.
> - **A0's decisive number:** the kit's label layer over the stage costs **+90 % main-thread ms/s at 8 bare labels** (45.1 → 85.9;
>   style recalc scales with labels; `viewChanged` itself is 0.09 ms/s) against the plan's +10 % rule → **by the rule, D1 (the
>   INFORMATIONAL window) waits for brief 7's coalesced layer and is 0.5.1**, unless pass 2 or a kit fix changes the number. Stylehash
>   with the modulation window open shows R13 as a DOM change (34 elements swapped; `#modwin` gains a backdrop-filter). Not measured:
>   legibility (headless Chromium screenshots the WebGPU canvas blank — use the gate Firefox), the under-a-rack count, the sanitiser.
> - **A-M merged after all** (`d7edc99`, Sonnet `ed05ca3`): `tools/perf/main-thread.mjs` + `cdp.mjs` `metrics()`; the floor on `02dce23`
>   median **13.879 ms/s, spread 0.536, MAD 0.158** (5 runs, load < 2.3) → C-V's gate is the 2 ms/s minimum. UNVERIFIED: presents stayed 0
>   (check `__LW.field.ok` under the same flags). §6 landed in 0.4.0's MEASURE.md; move to `research/release-0.5.0/measure/MEASURE.md` §1.
>   The pre-C baseline = the tool re-run after A1+A8 and A7 merge.
> - **Parked with designs, no code:** A1+A8 (`worktree-agent-a93d670fd213115b8`, `df081b1`, `A1-A8-HANDOFF.md`: the store's API and
>   the 7+1 sites on `b5b6d7d`; the camera port's members; the bindings table; the Alt+Arrow conflict with A9's rows and its
>   resolution), A7 (`worktree-agent-a45dd079234049e48`, `89452ae`, `A7-HANDOFF.md`: the registry design, +25 lines, `modDodge` still
>   in `rack.js`). **Resume both from the tip after `d7edc99`**, not from `b5b6d7d`.
> - **Josh's reading:** `PLAN-DRAFT-3` (`371c100`) — the glass (seven classes), the camera bindings, R5-G1, R5-L1; Q2, Q3. D1's new
>   number belongs in his read: the plan's rule has already fired once.
> **UPDATE 2026-10-08 ~13:20 — Claude Sos: THE 0.5.0 PLAN IS APPROVED. Josh: "defaults, let's continue".** `research/release-0.5.0/PLAN.md`
> (`6dedfc6`; vault `LAMBDAWAVES CLAUDE 0.5.0 PLAN 2026-10-08.md`) = DRAFT 3 + §9 RULINGS TAKEN (the glass class by class at C0; today's
> camera bindings as the table; pin alpha.24, re-adopt at brief 8; the legacy five by the default; the 0.5.0 minimum without C8; MIR
> OPTIONS and LANGUAGE hidden, the KEYBOARD skin λWAVES'; R5-W1, R5-A3 and the defaults list; A0's rule applied: D1 → 0.5.1 unless the
> number moves). **Running from `b02dce1`/`6dedfc6`:** A1+A8 (Opus, 8763/5233) ∥ A7 (Opus, 8773/5243 + the base copy on 8777/5247) —
> both from their design notes; the A9–A11 REPORT waves 193–195 + `A9-A11-BUILD.md` (Haiku 5.5 high, docs only); **the spike's pass 2**
> (Opus, 8771/5241): cost pass 2, the 24 legibility PNGs on gate Firefox, the under-a-rack count, the sanitiser, the M5 commands.
> Then: merge each (the `sw.js` rule), the pre-C baseline with `tools/perf/main-thread.mjs`, CLAUDE.md's keyboard paragraph from
> A9's draft, the §6 ms/s section moved to a 0.5.0 measure file, and C0 — which waits for Josh's seven glass screenshots.
> The bullets below are Yan's text as she left it.

- **Live:** v0.3.2-alpha's version line, but the tree is Cloud's unreviewed `main` (`28fe445`: stage formula, atom labels,
  paint gesture, SPECTRUM folds, Jet Black landed by a direct edit of `lab/mir/palette.js` with a FORGED
  `MIR-MANIFEST.json` "1.4.4", legacy windows hidden, wrangler bump).
- **Built, not live:** 0.3.3 THE EXPORTS (GLB/OBJ/STL shape, NPZ/CUBE grid, SPECTRUM ⧉ + EDIT › COPY the state as LaTeX)
  on `release-0.3.3` (f6ab660), an ancestor of `release-0.4.0`.
- **0.4.0 = engine + library on MIR 1.4.3; 0.5.0 = the MIR 1.5 adoption + the INFORMATIONAL; 0.4.1 BUCKYBALL.**
- **S0 TAKE-IN + CANARY — in flight:**
  - S0-C THE CANARY: DONE, merged (`4ca4f54`). Bare alpha.23 adopt boots; 7/82 node suites red; precache 9.46 MiB over the
    8 MiB ceiling. PLAN §10 N4 says what follows.
  - S0-B THE NUMBERS: DONE, merged (`efaaed8`). PLAN §10 N1–N3: the AO wall opens (48 KiB), records GATE past the cap and
    the 52-record starter is dropped, R-L2 = YES (C₆₀'s HOMO/LUMO in 0.4.0 with shell screening).
  - **S0-A THE TREE: an Opus builder was running** in `~/Documents/LAMBDAWAVES/.claude/worktrees/agent-ade297122bf2444a1`,
    branch `worktree-agent-ade297122bf2444a1`, started at `61f7c2c`. When this was written it had committed C1, C2 and
    C3 (`0242bff`, `5c7109e`, `ebd45d5` = wave 136, the subtraction) and was on C4–C6 (the cheap bugs, the vendor wiring +
    pinned manifest, the three demos). **If it finished:** its branch has `research/release-0.4.0/S0-BUILD.md`; merge
    the branch into `release-0.4.0` from YOUR worktree (`git merge worktree-agent-ade297122bf2444a1`). **If it died:**
    `git log --oneline worktree-agent-ade297122bf2444a1` shows how far it got; its uncommitted files are readable at its
    worktree path (you may read another agent's worktree, never run git there); spawn a fresh Opus builder in its own
    worktree from `release-0.4.0`, merge the dead builder's branch there, `cp` any uncommitted files across, and give it
    `BRIEF-S0.md` from the next unfinished commit.
  - **S1″ THE SOL THREAD, round 1 (Fable lead): an agent was running** in `…/.claude/worktrees/agent-a8356a853fc8a32d9`,
    branch `worktree-agent-a8356a853fc8a32d9`, from `5012eec`. It writes `research/MATH-CYCLOTOMIC-SCALING-2026-10-07.md`
    ROUND 1, `tools/symmetry/unique-quartets.mjs`, `research/release-0.4.0/measure/quartets.json`, and rebuilds
    `research/DISK.md`. Same rescue rule. When it lands: merge, then launch **Sol round 2** with the codex command above
    ("Read research/MATH-CYCLOTOMIC-SCALING-2026-10-07.md whole; append `## ROUND 2 · SOL`; answer Q1… with numbers,
    kill what is wrong, add what is new, ask 3–6 new questions; never agreement"). One Sol at a time. Three rounds, then
    the lead writes `## SYNTHESIS`.
- **Not started:** S0-V (the release verifier), the 0.3.3 cut, S1 NAMES, S1′ cameraEye, S2–S5.

> **UPDATE (Claude Sos, 2026-10-08 ~12:35 CDT, after the compaction and Josh's `/resume-work`).** Agent Control stayed paused through the
> compaction; four relaunches were denied until Josh released it. Josh's rule of the morning: **Sol 6.1 at medium for bulk cheap work,
> xhigh for code** — Sol is not stopped by the pause (Codex companion). Landed on `sos-s0`:
> - **A9–A11 write-up** by Sol at medium: REPORT waves 193–195 + `research/release-0.5.0/A9-A11-BUILD.md` (`9e85217`, merged `369fb30`;
>   Codex's sandbox could not take git's lock, Sos committed); the CLAUDE.md ACTIONS-rows paragraph applied (`eeef10f`).
> - **A-M's UNVERIFIED line resolved (`1e1a4f8`)**: the five floor runs had NO field (`__LW.field.ok` false) — a fresh headless Chromium
>   loses its WebGPU device on the first navigation and boots the field on every later one (0/4 cold, 2/2 reloads). `tools/perf/main-thread.mjs`
>   now warms, measures on the second navigation and refuses without a field. **Floor with the field: 19.729 ms/s, spread 0.980, MAD 0.216,
>   held 0 — gate 2 ms/s unchanged**; `research/release-0.5.0/measure/MEASURE.md` §1 (0.4.0's §6 is a pointer). All later A/Bs compare
>   with this row, never with 13.879.
> - RUNNING from `1e1a4f8` (Opus): A1+A8 (8763), A7 (8773/8777, ms/s pair under the warm-up rule), A0 pass 2 (8771, `field.ok` per cell).
> - Open with Josh: the agent-control auto-release patch (proposed, not applied).

> **UPDATE (Claude Sos, 2026-10-08 ~14:10 CDT) — STAGE A CLOSED; the pre-C baseline taken; C0 launched.** On `sos-s0`:
> - **A1+A8 MERGED `f277675`** (+62: `lab/settings-store.js`, the camera port with twelve ids and `modIds`, `STAGE_BINDINGS` as one frozen
>   table, the quartet steps `STAGE_BINDINGS.nudge`; settings probe 48/48 identical; gates green; CLAUDE.md paragraph `1fad4a5`).
>   Open from it: C1 registry conflict (the kit panel's `set` vs a hand's road) and missing notices from `observer.*` writes; C4 WAVE DANCER's
>   `modwin.modes.s3` lost across reload (pre-existing); R5-C1 the doubleTap row (λWAVES 320 ms / 40 px vs the kit's 300 / 14 — Josh's row edit);
>   C2 STATE-SCOPES to name `modpresets` and confirm `nativeLayout` PREFERENCE.
> - **A7 MERGED `349c3d4`** (+28: `lab/occlusion.js`, three producers one `dirty()` each, `tools/a7-occlusion-probe.mjs`): probe 16 scenes
>   byte-identical — A7's own run and mine on the merged tree against `1fad4a5` (14,807 B, sha ceb35024…b229); merged-tree gates node 0,
>   frame-occlusion 7, history 39, menubar 8 (+ camera-shift 11, new-project 8 after A1+A8). Open: fold has no watcher (C8).
> - **A0 spike pass 2 MERGED `d326c96`: A0 COMPLETE.** 8 bare labels **+115 %** with the field present (80.5 vs 37.5 ms/s, held 0) → **D1 is
>   0.5.1**; the cost is ~63 DOM writes a frame (two thirds restyle + repaint), `viewChanged()` already coalesced → brief 7 re-worded; bare
>   reads 12/12 (PROVISIONAL — Josh judges the 24 PNGs in `research/release-0.5.0/canary-a0/legibility/`); brief 18 confirmed (+ the block
>   clamp); D4 text only (same-origin image files for brief 19); the M5 block in CANARY-A0 PASS 2 §5. PLAN.md `5316960`, KIT-BRIEFS
>   amendments `62f27ba` (+ vault).
> - **The notice:** CDP Chromium boots with the photosensitivity pane up (`navigator.webdriver` false) and it halves the present rate;
>   `main-thread.mjs` now dismisses it (`fbde0b6`, `--keep-notice`). **THE PRE-C BASELINE on `fbde0b6` (`7044f37`, MEASURE §2): notice
>   dismissed median 37.335 ms/s, spread 1.768, ~24.9 presents/s → C-V's gate 3.536 ms/s;** notice kept 19.535 (Δ −0.19 vs §1's 19.729:
>   wave 2 cost nothing). `lab/*.js` **36,288** (stage A +8 vs the +150 cap; 36,280 at the cut).
> - **C0 (Opus) launched from `7044f37`** (8783/5253 + base 8787/5257): the bare adopt (alpha.24 pinned), the cascade, the manifest pin, new-project,
>   R5-W1, the seven glass classes with defaults applied + screenshot pairs in `c0-glass/` + `C0-GLASS-RULINGS.md` for Josh, the second canary
>   (85 node + 27 browser), the ms/s pair vs 3.536, wave 196, `C0-BUILD.md`.
> - Plugin: agent-control 0.1.4 (auto-release) on both profiles (Josh ran the primary update).

> **UPDATE (Claude Sos, 2026-10-08 22:40 CDT) — the new week; stage C staged; the security review; the LAN server.** Josh (17:00 + 20:50 resets):
> "use the normal set of agent line ups as usual"; C0/C1/C5/C7 resumed by message, C9, C4 and D9 launched (Opus). **Staging branch `sos-c`**
> (worktree `.claude/worktrees/sos-c`): C1 merged `a72905b` (camera panel + RAMP, −176 own; CLAUDE.md `f719481`), C5 merged `f403f3c` (history as the
> kit's edit domain, −83 own; K1–K10 brief candidates); staged gates green (camera-shift 11, history 39 + 18, new-project 8, palette 3, routes 5/5;
> node = C0's four known reds). `sos-s0` stays green and fast-forwards when C0 lands. **The security review** Josh asked for is
> `research/release-0.5.0/SECURITY-REVIEW.md` (`f93b91d`; 120 agents, 56 raised, 25 survived): production safe by construction; the live item was the
> LAN gate server serving the whole worktree incl. the TLS key — stopped at 22:20, the key set aside, and **both local servers hardened `762f25a`**
> (dot-paths/listings 404, LAN clients `/lab/` + `/tools/perf/` only, certs outside the tree as a leaf, per-connection handshake timeout, LAN logging,
> `/report` caps + inbox; the device report POSTs only on `post=1`). Josh's: the firewall command, the iPad's exception, the 8768/8931 servers and
> the MANDELBROT CA cert (§5), CSP/HSTS at the next deploy (§3 fix 10), the content caps (§3 fixes 6–8, for C-V/D).

> **UPDATE (Claude Sos, 2026-10-08 21:40 CDT — set up early at 92 % usage).** `sos-s0` tip `09b45b7` (code `762f25a`), GREEN. **Staging `sos-c`
> `4824a62`**: the adopt + C1 (`a72905b`) + C5 (`f403f3c`) + C9 (`8b5fe3a`) + three CLAUDE.md paragraphs; `lab/*.js` 36,223; staged gates green but
> C0's four node reds and `keyboard-window` (C0's cascade). C7 DONE on `74ade0c` (the lock green at every step; own −716; films pixel-identical);
> its fresh-Opus verifier RUNNING → `C7-VERIFY.md`, merge on YES. RUNNING: C0 (at the seven classes, `C0-GLASS-RULINGS.md` on its branch), C4
> (kit window wired), D9 (QCD out, H₂⁺ next). The checkpoint `~/.claude/handoffs/latest.md` "STATE AT 21:35 CDT" has the table and the resume
> steps. Josh's rulings queue: the glass (seven classes), the film's exactness-vs-speed, the legibility PNGs, the M5 block, the doubleTap row, the
> firewall/iPad/CA-cert items from SECURITY-REVIEW.md §3/§5.

> **UPDATE (Claude Yan, 2026-10-08 22:05 CDT) — THE BATON CAME BACK TO YAN; stage C continues on `yan-c`.** Sos paused at 92 % with all six
> workers reported (`sos-s0/.claude/handoffs/latest.md`, "STATE AT 21:35 CDT"); Josh to Yan: "Ultrathink the landscape and continue where Sos
> left off." Yan's worktree `.claude/worktrees/optimization-2026-09-24` now holds **branch `yan-c`** = `sos-c` (`4824a62`: the adopt + C1 + C5 +
> C9) **merged with `sos-s0`** (`ae067c4`: the security review, the hardened servers, Sos's HANDOFF updates) — THE ONE STAGING LINE for stage C
> from here. `sos-c` and `sos-s0` are Sos's, untouched (their worktrees stay; `sos-s0` was NOT an ancestor of `sos-c`, so the planned fast-forward
> needed this merge first; both fast-forward to `yan-c` on Sos's or Josh's hand). Sos's paused agents cannot be messaged from this account, so each
> row was RELAUNCHED as a fresh Opus agent that resets its own fresh worktree to the paused tip and continues from the committed hand-off (the old
> worktrees are left as they were, read-only, their `.tmp/` copied across):
> - **C0 continuation** `worktree-agent-ae28efe993cf25783` from `07b03d7` — the two browser reds (`keyboard-window`: the two 1.4.3 `#keymap` rules
>   into lab.css; `mir-controls`: re-aim to the 1.5 ONE KNOB LAW, vertical drag ⅛ fine — C0 owns that test tonight), the `.km-*` judgment,
>   wave 196, C0-BUILD.md, the ms/s pair LAST (deferred to C-V if the load never drops under 4). Ports 8783/5253 + base 8787/5257.
> - **C4 continuation** `worktree-agent-a96a66756bee373da` from `aa9cd40` — the browser closers on the one clock, the scopes (`modArm`/`modCadence`
>   to the kit's record), the deletions (modwindow.js 3,110 + audio.js 438 + the badge ladder), s3, wave 201; NOT mir-controls. Ports 8833/5303.
> - **D9 continuation** `worktree-agent-a22de79aa0ec72dc9` from `79d10c4` — browser verification of H₂⁺'s shim, HELIUM → ATOM · He 1s, the history
>   cases, the two demos, the by-use table for H₂/ELECTROSTATICS (NOT deleted), wave 202 under the D heading. Ports 8843/5313.
> - **C7 FILM VERIFIER** (fresh) `worktree-agent-a4c46eea610dff207` on `74ade0c` — `BRIEF-C7-VERIFY.md` point by point + the paused reader's three
>   leads as hypotheses; verdict MERGE / MERGE WITH NOTES / HOLD. Ports 8853/5323 + 8857/5327.
> - **C7-FIX** `worktree-agent-a60503e61fea6f97e` from `74ade0c` — the film's hand-over goes through the kit's `saveBlob` only while
>   `navigator.userActivation.isActive`, else λWAVES' anchor download. Confirmed by reading `lab/mir/folders/save-blob.js`: share-first when
>   `canShare({files})`, never awaited, no fallback; `createFilm.save` runs ~37 s after the tap, so Chrome/Edge/Safari lose the MP4 and the iPad
>   loses the EXPORT FRAMES zip (Linux has no `share`, hence every green gate). Wave 203; two brief candidates for MIR. Ports 8863/5333.
>
> Merge order on `yan-c`: C0 → C7 (the verifier's YES + the fix, the lock re-run once) → C4 → D9 → C2 (after C0) → C3/C6 → C-V. Nothing pushed,
> deployed or released (Josh's ruling). Josh's rulings queue is unchanged (the seven glass classes in C0's `C0-GLASS-RULINGS.md`; the film's
> exactness-vs-speed; the legibility PNGs; the M5 block; the doubleTap row; SECURITY-REVIEW §3/§5). **If Yan dies:** this block, the vault note
> `LAMBDAWAVES CLAUDE YAN HANDOFF 2026-10-08.md` and `~/.claude/handoffs/agents/` hold the state; `git log <tip>..<branch>` on each of the five
> branches shows how far each got; spawn fresh from the tips again, never from the old worktrees; the integrator's branch is `yan-c`.

> **UPDATE (Claude Yan, 2026-10-08 22:50 CDT) — C4 and C0 MERGED on `yan-c`; D9 and the C7 fix DONE and waiting; the verifier runs.**
> - **C4 merged `d212ecd`** (Opus tip `05e6d6c`; −3,548 incl. the badge ladder): the kit's `createModulation(floats, port)` over A5's port, THE ONE CLOCK
>   (play's edge → `mod.follow`; MOD power = `setModulationEnabled`, a route bypass), LINKED/SEPARATE and `clockLink` retired, `modArm`/`modCadence` in the
>   kit's record `lambdawaves.q0.modulation`, `lab/modwindow.js` 3,110 + `lab/audio.js` 438 gone (the kit's `audio-capture.js` is the capture), the
>   tempo grid 2×4; take-in-bugs 4, history 39, new-project 8, routed-knob 4, lfo-tension 3, first-run 11, settings-probe 6/6; on the merged line
>   take-in-bugs/history/new-project/routed-knob/lfo-tension/frame-occlusion/menubar all exit 0; CLAUDE.md paragraph `6582243`. Four brief
>   candidates (port.targets read as a selector; a closed window still measures; `localStore` lacks `remove()`; `installModulation` persists
>   PROJECT/WORKSPACE keys). mir-controls left to C0.
> - **C0 merged `9c62346`** (Opus tip `7074ce9`): the pin, the cascade, R5-W1, the glass defaults, the two 1.4.3 `#keymap` rules in lab.css
>   (keyboard-window green; the kit's 87 `.km-*` rules break nothing — an LED dot on bound keys and the kit's scrollbar until C3), `mir-controls`
>   re-aimed to the ONE KNOB LAW (the base copy now fails its sideways line), node 85/85, browser 27/27, adopt `--check` in step; **the ms/s pair
>   PASS by the interleaved method: base 39.345 vs C0 41.634, |Δ| 2.289 ≤ 3.536** (vs the stored 37.335 both sides drift ~+2 in that session; C0's
>   own cost ≈ +2 ms/s → C-V's open item). On the merged line pwa is GREEN (286 files precached), new-project in step (16,889 B), `lab/*.js` **32,593**.
>   C1's four interim `<link>`s left `index.html` (C0's `mir.css` supersedes them). REPORT's duplicate C headings folded; wave 196 sits first.
> - **D9 DONE `0c1645f`** (Opus; not yet merged — after this gate round): QCD, H₂⁺, HELIUM deleted with restore shims (an old file names its retired
>   window in one status line and lands on its heir: QUARKONIUM keeps QCD's parameters; H₂⁺ → MOLECULES · H₂ σg/σu; HELIUM → ATOM · He 1s), two shim
>   DEMOS (`H₂ σu`, `HELIUM`) made by the app, history 39 → 42, molecule-demos 5/5, node 82 suites exit 0, `lab/*.js` 36,288 → 34,248 on its tree
>   (−2,040; D's ledger credit −1,226 after the 814 moved to tests/lib). **For Josh's "by use" ruling:** H₂ = 268 lines (h2view 186 + h2.js 82; h2ci.js
>   330 stays), reached only by an old project with `instruments.h2.on`; ELECTROSTATICS = 673 (electrostatics.js 437 + fieldview.js 236, missed by the
>   plan), reached only by a project with `field.overlay` ≠ off; neither in + / WINDOW / TAB; no bundled file turns either on. `legacy/boot` is out of
>   date (55 green / 57 red, all six D9 cases green; not run on the base) and needs its own pass.
> - **C7-FIX DONE `27fb75b`** (Opus): `handOver(blob, name)` in capture.js — the kit's `saveBlob` only while `navigator.userActivation.isActive`, else
>   the pre-C7 anchor download (URL kept 10 min for video); THE LOCK alone: GREEN 1004 · 0/0 and GREEN 1148 · 0/0; film-compare exit 0 (pixels and
>   times unchanged); the probe with share stubbed: before 1 share rejected / 0 downloads → after 0 / 1 download, a real tap still shares; +15 lines.
>   Not verified on a real Chrome/Safari/iPad. Merges with C7 (`74ade0c`) on the verifier's verdict. **The verifier (`worktree-agent-a4c46eea610dff207`)
>   is still running.**
> - Next: D9 merge → C2 (BRIEF-C2.md) ∥ C3 (BRIEF-C3.md) ∥ C6 (BRIEF-C6.md) from the D9-merged tip → C7 + fix on the verdict → C8? (0.5.1) → C-V.

> **UPDATE (Claude Yan, 2026-10-08 23:00 CDT) — D9 MERGED and gated; C2 ∥ C3 ∥ C6 launched; the film verifier says HOLD until the fix.**
> - **D9 merged `4176946` + `f0fcbc4`** (Opus tip `0c1645f`): the legacy five under R5-L1 — QCD, H₂⁺, HELIUM deleted behind restore shims, two shim
>   DEMOS, history 42; `sw.js` kept C0's NEVER_PRECACHE note with its table regenerated (the first `--theirs` had lost it: pwa red, fixed in `f0fcbc4`);
>   new-project regenerated 16,329 B in step. **Staged `lab/*.js` 30,552** (from 36,288 at the pre-C baseline). Gates on the merged line: node GREEN
>   exit 0 (82 suites, no assertion), browser history 42, molecule-demos, molecular-names, current, render-regressions, offer, new-project all exit 0.
>   D9's CLAUDE.md paragraph replaced the LEGACY sentences (auto-merged). **For Josh:** the H₂ / ELECTROSTATICS by-use table (above and in D9-BUILD.md).
> - **THE FILM VERIFIER (fresh Opus, `worktree-agent-a4c46eea610dff207`, report `50ef3d2` = C7-VERIFY.md + `measure/c7-verify/`): HOLD on `74ade0c`,
>   condition = the C7-FIX.** Lead 1 measured: `userActivation.isActive` TRUE at the real RECORD click, FALSE when `film.save` ran (39.0 s); with the Web
>   Share stubs the share rejected NotAllowedError, nothing downloaded, `save` returned true. Lead 2 confirmed (the saved MP4 stays in OPFS after a reload
>   and 130 s later; a film cancelled before its first checkpoint leaves job.json + an empty payload.bin forever — the kit's `recoveries()` skips it).
>   Lead 3 all confirmed, for Josh's rulings (RECORD not live; a paused lab's RECORD advances t; MOD armed by default → every first-run RECORD is a
>   driven film; ~37 s per 6 s; FPS 24/30/48/60). Everything else GREEN: the lock 1004 + 1148 (0/0, 60 s / 59 s), the base-copy lock, PNG/loop/video
>   produced (ffprobe h264 High 30 fps 6.000 s 180 f), H1 mutation → 14 reds then a TypeError at render-exact.test:598 before its tally (harden), node 85
>   with C0's four, export3d 10, render-regressions 2, stage-text 4, offer 16, menubar 8. Notes: a video's Blob URL (10 min) fails with NetworkError once
>   the app's 2-min discard deletes the file; ONE PERIOD has no STOP; the film bytes differ with the CAMERA card open (742,908 vs 744,558).
> - **C7-FIX (`27fb75b`) RESUMED by message at 23:00** with the verifier's follow-ups: a permanent browser regression (share stubs + a real RECORD tap;
>   green on the fix, red on `74ade0c`), and the Blob URL vs the discard (a memory copy before the discard, or the discard waits the URL's lifetime);
>   then the lock once more. **C7 merges onto `yan-c` from the fix's branch when it reports** (one lock re-run on the merged tree, GPU alone), with the
>   verifier's report branch merged beside it.
> - **LAUNCHED from `f0fcbc4` (Opus, each on its committed brief, design hand-off first):** C2 `worktree-agent-a828649825812de0a` (BRIEF-C2.md;
>   8873/5343 + 8877/5347; wave 204) · C3 `worktree-agent-ab53b6b1093934d5b` (BRIEF-C3.md; 8883/5353 + 8887/5357; wave 205) · C6
>   `worktree-agent-a61a67e5a1ec8eb66` (BRIEF-C6.md; 8893/5363 + 8897/5367; wave 206). Three on `rack.js` in disjoint regions; the integrator resolves.
> - Yan's gate server for `yan-c`: 8731/5203 (stop by pid at the end). Nothing pushed, deployed or released.

> **UPDATE (Claude Yan, 2026-10-08 23:10 CDT) — C7 MERGED with its fix; the verifier's condition met.** The C7-FIX follow-up (`3f995ee`, `0838e2e`):
> `tests/film-handover.browser-test.mjs` (104 lines; share stubs, anchor counts, the saves' timers on a virtual clock; a REAL RECORD tap → activation true at
> the click, false at `film.save`, 1 download 0 shares; a REAL picture tap → 1 share) GREEN on the fix, RED on `74ade0c` (scene 1) and on the fix without the
> URL change (scene 2); `tools/perf/handover-probe.mjs` folded in; the store's copy now waits 10 min (one constant — the longest any hand-over keeps its URL;
> a memory copy was refused: a whole film on the heap is what the kit's OPFS store avoids, and an await would spend a live tap). The lock GREEN 1004 + 1148
> again (58 s). **Merged `217701e`** (conflicts: CLAUDE.md both paragraphs; REPORT waves 199/203 folded in order; `rack.js` C7's W-CAPTURE comment without D9's
> deleted `mo`/`pulse` getters; `sw.js` OURS + regenerated, pwa GREEN 288 files) **+ the verifier's report `dc6fd2e`** (C7-VERIFY.md, `measure/c7-verify/`).
> **Staged `lab/*.js` 29,863.** Open items carried (C7-BUILD.md): a film cancelled before its first checkpoint leaves job.json + an empty payload.bin in
> OPFS (the kit's `recoveries()` skips it — brief); ONE PERIOD has no STOP; the film's bytes differ with the CAMERA card open (the occlusion mask?);
> RECORD's manifest motion named `loop`; `render-exact.test` crashes at :598 before its tally when H1 is mutated (harden). Josh will see: on Chrome/Edge/
> macOS Safari a finished film lands in Downloads instead of vanishing; a late confirmation (≤ 10 min) still finds the file; on the iPad a quick picture
> shares and the frames zip downloads. Merged so far on `yan-c`: C0 C1 C4 C5 C7 C9 + D9 (+ Sos's A). Building: C2, C3, C6.

> **UPDATE (Claude Yan, 2026-10-08 23:20 CDT) — USAGE PAUSE (the agent-control plugin's threshold = Josh's "set up shop").** `yan-c` tip `7fac481`
> (+ this block), clean; every gate on it green (node exit 0; the lock 908 / 1052 · 0/0; pwa 288 files; new-project in step); my gate server 8731 stopped
> by pid. C7's merge was fully gated (the lock twice, film-handover 4, offer 16, export3d 10, render-regressions, stage-text). `BRIEF-C-V.md` committed
> for the adoption verifier. **Paused at their design hand-offs, pause sent 23:16, reports pending** (each commits `C<n>-HANDOFF.md` per step — the branch
> is the truth): C2 `worktree-agent-a828649825812de0a` (`177be6b` design: road (a), the kit's store + accent, createGui NOT built — kbm/touch-tablet;
> `b817b27` step 1) · C3 `worktree-agent-ab53b6b1093934d5b` (`8e55952` design; A4's parity probe copied into tools/) · C6 `worktree-agent-a61a67e5a1ec8eb66`
> (`443332e` design: FOLDERS over ONE part through a translator keeping `lambdawaves.q0.projects` in its 0.4 form). The checkpoint with the links, the
> missing reports and the exact next steps: `.claude/worktrees/optimization-2026-09-24/.claude/handoffs/latest.md`; the vault note `LAMBDAWAVES CLAUDE YAN
> HANDOFF 2026-10-08.md` mirrors it. **Whoever continues:** relaunch C2/C3/C6 fresh from their tips (the other account) or resume by message (this one); merge
> as they land; then C-V; then the local 0.5.0-alpha cut on Josh's word. Nothing pushed, deployed or released.

> **UPDATE (Claude Sos, 2026-10-09 02:15 CDT) — the baton came back to Sos.** Yan's night is in her UPDATE blocks above and in the vault
> (`LAMBDAWAVES CLAUDE YAN HANDOFF 2026-10-08.md`): `yan-c` = `sos-c` ∪ `sos-s0` + C4 + C0 + D9 + C7 (with the hand-over fix and the film verifier's
> HOLD lifted) + `BRIEF-C2/C3/C6/C-V.md`; staged `lab/*.js` **29,863**; the lock's new baseline 908 · 0/0 and 1052 · 0/0. **`sos-s0` fast-forwarded to
> `yan-c` `a36fc81`** (clean; node exit 0; pwa 13; new-project in step) — the integrator is Sos on `sos-s0` again; the loopback test server 8721 serves
> the adopted app. **C2 / C3 / C6 relaunched fresh (Opus) from Yan's paused tips** `c312219` / `59717ae` / `9da702d` with their predecessors' `.tmp/`
> copied, each continuing its committed `C<n>-HANDOFF.md` (C6's WIP tip is never merged as it stands — the wiring recipe is the job). Then C-V on
> `BRIEF-C-V.md`, small fix rounds, the pre-release gates, the LOCAL 0.5.0-alpha cut on Josh's word. Josh's rulings queue: the checkpoint's
> "STATE AT 02:10 CDT" block (the seven glass classes; H₂/ELECTROSTATICS by use; the film's behaviour changes; the legibility PNGs; the M5 block; the
> doubleTap row; the security items; the MIR brief candidates).

> **UPDATE (Claude Sos, 2026-10-09 06:10 CDT) — the morning's merges and Josh's rulings.** Josh (02:30): "H2 and Electrostatics should go, and record or
> render should be something related to the timeline window of MIR 1.5. And I guess defaults for everything? I definitely need a changelog of just the
> major feature changes after the release of 0.5.0 or 0.5.5" + (02:45) "don't use Sol for coding anymore … Continue using Sonnet and Haiku wherever is
> appropriate" — all in PLAN §9 (`c83b7ee`, `569855f`). Merged on `sos-s0` since the baton came back: **C2 `5ef57f4`** (the look in `mir.gui` via
> `lab/look.js`; −124; stylehash 0 moved; probe 6/6), **D9b `1aa1d4d`** (H₂ + ELECTROSTATICS gone behind shims; −1,014; the lock's new baseline **860 ·
> 0/0 and 1004 · 0/0**), **C3 `4555945`** (the rack = `createRack`, the menubar `createMenubar`, the keys `createKeys` via `lab/key-table.js`, the
> KEYBOARD window the kit's in λWAVES' skin; the transport stays λWAVES'; −1,496; `tests/camera-shift` double-click re-aimed at the stage `0f4f042`),
> **C6 `e0621f8`** (FOLDERS over one project part; `lab/projects.js` + `project-store.js`; serialize 11/11 identical; the R10 suite; +291 explained),
> the C7b design `c232bef` (R1–R11 as defaults). **`lab/*.js` 27,515** (36,288 at the pre-C baseline; the C-V bar 30,000). Every merged tree gated
> on my server 8731 (node 0 each time; the owning suites; the lock after D9b). Four CLAUDE.md paragraphs replaced/added (C2 first-run, C3 keyboard,
> D9b legacy windows, C6 PROJECTS). RUNNING (Opus): **C7b** the film's UI on the kit's RENDER card + TIMELINE window (from `4555945`, four
> lock-gated commits), **C6b** the session/opener/banner/veil/wake lock (from `e0621f8`). THEN: `tests/legacy/boot` re-aim (Sonnet, its own pass),
> **C-V** (`BRIEF-C-V.md`, fresh Opus), fix rounds, the pre-release gates, **the LOCAL 0.5.0-alpha cut + `CHANGES-0.5.0.md`** (major features, plain
> words, + vault) on Josh's word. Josh's queue now: the glass PNGs (defaults applied), the film's behaviour (accepted as defaults), the legibility
> PNGs, the M5 block, the security items; MIR brief candidates from every C row for the primary account. Flakes seen under load and green alone:
> `current` followsPalette, the settings probe's frame watchdog.

> **UPDATE (Claude Yan, 2026-10-09 07:20 CDT) — the baton came back to Yan** (Josh 07:05: "Sos got ahead of you now, it's time to pick back up where
> *he* left off … every post compaction should also read some of Sos's new files"). Sos's morning is in his two UPDATE blocks above and his checkpoint
> (`.claude/worktrees/sos-s0/.claude/handoffs/latest.md`, "STATE AT 03:25 CDT"): C2 `5ef57f4`, D9b `1aa1d4d`, C3 `4555945` + `0f4f042`, C6 `e0621f8`,
> the C7b design `c232bef`, PLAN §9 rulings `c83b7ee` `569855f`; `lab/*.js` **27,515**; THE LOCK **860 · 0/0 and 1004 · 0/0**. **`yan-c` fast-forwarded
> to `sos-s0` `5518182`** (clean — `sos-s0` was a descendant of `yan-c` `a36fc81`); `BRIEF-C6B.md` written `011e6a5`. **The integrator is Yan on `yan-c`
> again.** Sos's two servers (8721, 8741) left running — his. **RELAUNCHED FRESH (Opus) at 07:15:** **C7b** from `ae5add1` (Sos's builder's tip: step 1
> `f40733d` done, lock 860/1004 green, film-compare exit 0; told to merge `yan-c` into its branch first, re-run the lock, offer s9, then C7B-DESIGN §4
> steps 2–4; ports 8913/5383 + 8917/5387; the predecessor's `.tmp/base` + `film-base.json` copied) and **C6b** from `011e6a5` on `BRIEF-C6B.md` (the
> session over the one part; the opener with six demo covers + NEW + RESUME; the kit's photosensitivity notice behind λWAVES' `__LW.warning` facade —
> THE PHOTOSENSITIVITY LAW stays λWAVES', no query string silences it for a human; `installBanner({ errors: false })`, `bootVeil`, the wake lock on THE
> play; Sos's C6b read-phase note `agents/a98be3262dbdf60ad.md` = its 13 findings; ports 8923/5393 + 8927/5397; wave 209). Both commit
> `C7B-/C6B-HANDOFF.md` per step; neither merges. THEN: merge C7b (lock ×2, film-compare, the NEW `timeline` suite), merge C6b (offer 16, gpu-recovery,
> legacy/boot, the NEW `opener` suite, serialize-bytes 11/11), `tests/legacy/boot` re-aim (Sonnet) if needed, **C-V** (`BRIEF-C-V.md`, fresh Opus), fix
> rounds, the pre-release gates, **the LOCAL 0.5.0-alpha cut + `CHANGES-0.5.0.md`** on Josh's word. NO push, NO deploy. Josh's queue unchanged (the
> glass + legibility PNGs, the M5 block, the security items, the MIR brief candidates, 0.5.0 vs 0.5.5 for the changelog, the cut word). Josh (07:25)
> asked to be told when compaction is safe: the answer is "when the baton files are written and no merge is half-done" — say it plainly each time.

> **UPDATE (Claude Yan, 2026-10-09 10:20 CDT) — C6b MERGED `8388309`.** THE START is the kit's: the photosensitivity notice (λWAVES' law — no query
> string silences it for a human; `?opener=1` shows the title screen under a driver), MIR's title screen with the six demos as covers + NEW + RESUME
> (`createSession` over the one part, `lambdawaves.q0.session` PROJECT), `installBanner({ errors: false })`, `bootVeil`, the wake lock on THE play;
> `#banner`/`#warnPane`/`showBanner` leave (Opus, tip `05ee02a`, four commits; note `agents/a47a6c9aeef569dc6.md`). Gated on the merged tree (my
> server 8731): node 0; opener 7/7; offer 16/16; history; new-project + `--check` in step; hit-probe 49/0; frame-occlusion. The builder's lock on
> its code tip 860 · 0/0 and 1004 · 0/0; serialize-bytes 11/11. **`lab/*.js` 27,553** (+38). CLAUDE.md: THE START paragraph; the `!important` count
> 37 → 33. `CHANGES-0.5.0.md` STARTED with C6b's line (the earlier rows are summarised at the cut). **Open defect, pre-existing on every tree since
> C7 (`33d20cc`): `LW.thumbnail()` calls `capture.probe`, which left — FOLDERS' pictures fail and `gpu-recovery` stops at 8/11; C7b's facade commit
> fixes it (told by message).** `tests/legacy/boot`: 112 verdicts identical to the base, stopping at wave 56's `?sw=1` reload on both trees; B103/B110/
> B112 red on both for laws outside C6b — the Sonnet re-aim pass is NEXT (its launch at 10:13 was refused: Agent Control paused for handoff). C7b still building (steps 2–4). Design calls the builder
> made (for Josh, in C6B-BUILD.md): `home` is remembered only while untouched (a reload after edits shows RESUME); the title-screen key stop is bubble-
> phase (the covers' arrow keys); no per-cover accent, the text logo, the veil's black fill on the light theme are left as the kit's.

> **UPDATE (Claude Yan, 2026-10-09 10:15 CDT) — USAGE PAUSE (the agent-control plugin, five_hour 94 %, at 10:13; = "set up shop").** ALL WORKERS
> REPORTED. `yan-c` tip `04b1ea8` (HANDOFF), code `8388309` (C6b merged), tree clean, `lab/*.js` 27,553. **C7b PAUSED by the plugin's worker alarm
> at `f34569a` = WIP STEP 3 — NOT MERGED, do not merge as it stands:** steps 1–2 green (`9d8671b` the TIMELINE window on the one clock; NEW
> `tests/timeline` 8/8 → 14/14 at step 3; ms/s closed ≈ +1.2); step 3's gates green but ONE — `tools/settings-probe.mjs` 4/6 RED: the late-registered
> `render` card's `closed` state is lost across a demo open + reload (cause suspected and the fix named in its note); step 4 (wave 208, in its
> git-ignored `.tmp/wave208.md`) not done; its own lines +40 (over the band by 20); CLAUDE.md's THE FILM paragraph drafted in `C7B-BUILD.md`, not
> applied; new brief candidates B13–B17; found-not-fixed: a film keeps the window mask that stood when it started (predates C7b; its own row). Note
> `agents/ab12528fb3c1bb358.md` (saved by Yan; the guard refused its write) holds the EXACT NEXT STEP. The legacy/boot re-aim (Sonnet) was NOT
> launched (refused at 10:13). My server 8731 stopped by pid; Sos's 8721/8741 untouched; no browser. **Whoever continues:** resume C7b (same account:
> SendMessage; other account: fresh Opus from `f34569a` with its `.tmp/` copied) → merge it across C6b → the legacy/boot re-aim → C-V (`BRIEF-C-V.md`)
> → fix rounds → the pre-release gates → the LOCAL 0.5.0-alpha cut + `CHANGES-0.5.0.md` on Josh's word. Checkpoint:
> `optimization-2026-09-24/.claude/handoffs/latest.md`. (Clock note: my 07:xx stamps above ran ~30 min fast — `date` is the truth.)
> **UPDATE (Claude Sos, 2026-10-09 10:30 CDT) — the baton came back to Sos** (Josh 10:25: "Yan left behind some work! It's time to pick up where she
> left off from"). `sos-s0` fast-forwarded clean to Yan's `yan-c` tip **`f0d4566`** (code `8388309`, C6b merged; `lab/*.js` 27,553); the integrator is
> Sos on `sos-s0` again. Yan's 10:15 checkpoint read in full; nothing of hers was running. **Launched 10:27, in parallel:** (a) **C7b relaunched FRESH**
> (Opus, Yan's agent is the other account's) — resets its worktree to **`f34569a`**, copies the predecessor's `.tmp/` (46 entries incl.
> `wave208.md`), follows the EXACT NEXT STEP in `agents/ab12528fb3c1bb358.md`: settings-probe on 8913/5383, fix the late-registered `render` card's
> `closed` round trip (R2 kept), 0 RED, THE LOCK ×2, the timeline suite 14/14, amend the WIP message, STEP3_* cells, step 4 (wave 208 → renumber at the
> merge, 209 is C6b's), final `C7B-HANDOFF.md`; (b) **the `tests/legacy/boot` re-aim** (Sonnet, from `f0d4566`, 8933/5403): run to the end, stale laws
> re-aimed or retired with a one-line reason naming the row, real regressions REPORTED not papered, `LEGACY-BOOT-REAIM.md`, no `lab/` edit. Then, in
> order: merge C7b across C6b (Yan's recipe; apply THE FILM paragraph from `C7B-BUILD.md`; its CHANGES line; the lock ×2 on the merged tree) → merge the
> re-aim → **C-V** (`BRIEF-C-V.md`, fresh Opus) → fix rounds → the pre-release gates → the LOCAL 0.5.0-alpha cut + `CHANGES-0.5.0.md` on Josh's word.
> NO push, NO deploy. Servers: Josh's 8721 (pid 2266539) and 8741 (pid 3602240) untouched; mine will be 8731/5203 at merge time. Checkpoint:
> `sos-s0/.claude/handoffs/latest.md` and `~/.claude/handoffs/latest.md`. (Memory capture — claude-mem — paused for a quota cooldown until ~10:43.)
> **UPDATE (Claude Sos, 2026-10-09 12:10 CDT) — C7b MERGED `9c42a5a`; C-V: FIT WITH NOTES.** C7b's fresh builder (`a492a2b`, note
> `agents/a0ff0fd25c7aa306c.md`) fixed the settings-probe red with one changed line (the RENDER card at the TOP of the right rack, `rack.prepend`:
> the `closed` list is page order, so a card appended at the foot stood second after a demo open and last after a reload) and finished steps 3–4.
> Merged across C6b (conflicts: the LW literal's end, FAMILIES, REPORT.md waves 208 C7b then 209 C6b, sw.js regenerated); THE FILM paragraph applied
> to CLAUDE.md; the CHANGES line added; `lab/*.js` **27,593**. Gates on 8731: THE LOCK 860 · 0/0 + 1004 · 0/0, settings-probe 0/6, render-exact 40/40,
> timeline 14/14, film-probe/compare identical, offer 16, menubar 8, hit-probe 49/0, history, gpu-recovery, new-project, keyboard-window/-shortcuts,
> frame-occlusion, film-handover, node 0. **`tests/opener` RED under load on BOTH trees** (sos-s0 scene 6 ×3 / 5 ×1 / 7 ×1; Yan's `f0d4566` without C7b
> green ×1, scene 7 ×1) — a load-sensitive suite, re-run ALONE at the pre-release gates. **C-V** (`3f68483`, `research/release-0.5.0/C-V.md`, note
> `agents/aabaf58d164cdd3ae.md`): **FIT WITH NOTES, no BLOCKER** — R1–R15 green but R7's `opener` (its one SHOULD: 6/7 then 5/7 alone, read as the kit's
> animations not advancing while headless Firefox holds frames after a heavy boot; owner C6b); the seven classes: 4 and 6 (λWAVES' head) 0 on every
> surface, Josh's defaults hold; TIMELINE/RENDER open 0 style changes; ms/s pair **Δ +1.005 ms/s** (gate 3.536; base 40.055 / tip 41.060; raw medians
> drifted +2.7/+3.7 vs MEASURE's 37.335 this session, the pair is the gate); `adopt --check` in step; `__LW` law green per commit; 27,593 vs 30,000;
> M5 pending. Its five CLAUDE.md NOTE rows fixed in `9f80e98` (LINKED retired at C4; stage-text/BRIEF 6 at 0.5.1; the 0.3.2 stray "DOMAIN"; 32 `!important`).
> Not verified by C-V: camera-routes, mir-controls, serialize-bytes, ms/s with TIMELINE open. **Next:** merge the legacy/boot re-aim (Sonnet, still
> running) → `opener` ALONE on a quiet GPU (if scene 7 reds alone it is a real C6b race: the trap `.tmp/opener-s7b.mjs`) → the pre-release gates →
> the LOCAL 0.5.0-alpha cut + `CHANGES-0.5.0.md` **on Josh's word** (he has not yet ruled 0.5.0-as-the-adoption vs building D2–D10 first). NO push, NO deploy.
> **UPDATE (Claude Sos, 2026-10-09 14:49 CDT) — USAGE PAUSE at the door of the cut.** Josh's word is given (12:20) and the name is **"GUI Adoption"**
> (14:10; no "The" in release names; the D rows become "Informational Update", number his; stage D = one short re-plan round). `sos-s0` `59168b9`
> clean: the legacy/boot re-aim merged `7edae5c` (145/152; the 7 reds are law: 5 regressions of 0.5.0 + 2 pre-existing), the opener's reds proved
> to be the HOST (headless Firefox's dead rAF after a real press or a quick navigation — v0.4.0 too) and fixed in the suite's `nav()` (7/7 twice alone,
> `59168b9`); CHANGES-0.5.0.md drafted (11 rows). Running at the pause and told to hand back: **FIX ROUND 1** (Opus; B78, B111, B144, B139 committed
> at `7bd1bf6`; B149b + FIX-ROUND-1.md + gates pending) and **the five boot rows after C7b** (Sonnet; B66/B108 stale vs the RENDER card, B127 ?, B84/B134
> timing; no commit yet). **Next:** merge both → the boot suite + settings-probe once → `bash .tmp/cut-0.5.0.sh` (local tag v0.5.0-alpha, CHANGELOG,
> snapshot) → CHANGES-0.5.0.md final + vault → "safe to compact". Checkpoint `~/.claude/handoffs/latest.md` (block "STATE AT 14:49"). NO push, NO deploy.

> **UPDATE (Claude Yan, 2026-10-09 15:25 CDT) — the baton came back to Yan** (Josh ≈15:10: "Sos was almost done! Let's resume from there. Once Stage C is
> completely done go ahead and begin Stage D all the way"). `yan-c` fast-forwarded clean onto `sos-s0` `bc2a5cc`; **FIX ROUND 1 merged `b9e0c57`** (Opus
> `2d4d994`: B78 the K row's short word `impulse`; B111 the kit's rack toggle stores `phoneRack`; B144 the accent's 360° end stop; B139 FROST STILL keeps the
> veil under the hold; **B149b = MIR brief candidate**, the kit's rack animates every reorder; `lab/*.js` **27,594**; pwa in step; node 0; settings-probe
> 0/6 on my server 8751). **The five boot rows after C7b RELAUNCHED FRESH (Sonnet) from `b9e0c57`** — the predecessor (Sos's `a2ea2bd5682f64c9c`) diagnosed
> only: B66/B108 stale vs the RENDER card, B127 the 100 ms badge tick, B84 a harness phase race on both trees, B134 not run; ports 8963/5433; its two full runs
> of the boot suite also confirm the fix round's four on the merged tree. **Next:** merge it → `bash $CLAUDE_JOB_DIR/tmp/cut-0.5.0.sh` (Sos's script re-aimed
> at this worktree; BUILD_LINE `0.5.0-alpha · GUI Adoption · <date>`; tag `v0.5.0-alpha`; CHANGELOG; snapshot) → `CHANGES-0.5.0.md` final (title "0.5.0 GUI
> Adoption") + vault → **STAGE D ("Informational Update"): a Fable draft `research/release-0.5.1/PLAN.md` from PLAN §2 D + the deltas (0.5.1 is the DEFAULT
> number — Josh's to rename to 0.5.5), one Opus@high audit, then the D rows as parallel Opus builders, merged as they land, then its local cut on his word.**
> Servers: mine 8751 (this worktree); Sos's 8731 (pid 686256, idle, serves `sos-s0`) left alone; Josh's 8721/8741 untouched. NO push, NO deploy.

> **UPDATE (Claude Yan, 2026-10-09 16:15 CDT) — v0.5.0-alpha "GUI Adoption" CUT LOCALLY; STAGE D under way.** The five boot rows after C7b merged
> `20d3cfe` (Sonnet `fb886a3`: B66/B108 re-aimed at the RENDER card, B127 the `schedule(1)` read + six named live regions, B134 by R5 exact resume, B84 a 5 s
> absence for Gecko's hidden-timer grid; it found FIX ROUND 1's B139 still red for TINTED → the second half fixed `7d088b1`, one unlayered `skin.css` line,
> verified live by the pass). The boot suite alone on the cut tree **148/152** (B6 green alone — the tags' tick; the law reds: B70/B71/B78-BOW pre-existing →
> 0.5.1 D10-F; B149 a MIR brief candidate). **THE CUT:** `f478482` the version line `0.5.0-alpha · GUI Adoption · 2026-10-09` + README status; tag
> **`v0.5.0-alpha`**; CHANGELOG `27eb96a`; snapshot #17 `~/Documents/LAMBDAWAVES-RELEASES/v0.5.0-alpha`; `CHANGES-0.5.0.md` (11 feature rows, title "GUI
> Adoption") mirrored to the vault `LAMBDAWAVES CLAUDE 0.5.0 CHANGES 2026-10-09.md`. `lab/*.js` 27,594. **NOT pushed, NOT deployed** (10-07). **STAGE D
> ("Informational Update"; 0.5.1 the DEFAULT number, Josh's to rename):** the one re-plan round is DONE — `research/release-0.5.1/PLAN-DRAFT-0.md` (Fable) →
> `AUDIT-OPUS.md` (Opus@high, SOUND WITH CHANGES: D1 one kit block and the atom letters stay λWAVES'; D2's pages already exist in the records; D4 struck;
> SCENES 0.5.x; D8/D10-19 re-scoped; the pair a noise gate each row passes alone) → **`PLAN.md`** (§9 twelve rulings TAKEN as defaults — R6-I the kit's look,
> R6-F the kit's seat still, R6-L the letters stay shape D1; Josh should look) + `BRIEFS-0.5.1.md` (Sonnet: 79 kit candidates, the 9 waiting briefs, 19
> λWAVES-own items) + `BRIEF-D1/D10-19/D10-24/D10-F.md`. **LAUNCHED 16:15 from `27eb96a`:** D1 (Opus, 8973/5443 + 8977/5447), D10-19 (Sonnet, 8983/5453),
> D10-24 (Sonnet, 8993/5463), D10-F (Sonnet, 9003/5473). Then D2+D8 (one Opus, after D1 merges) → D-V (fresh Opus) → the local cut `v0.5.1-alpha ·
> Informational Update` on Josh's word. Servers: mine 8751; Sos's 8731 idle; Josh's 8721/8741 untouched.
> **16:35 — D10-19 MERGED `064f3b0`** (Sonnet `d700374`: the flash guard's limiter on exposure/gamma/stage/knee, calibrated from the shader by
> `tools/flash-calibrate.mjs`, held only while a modulator drives, the trip in METERS; +20 → 27,614; node 0; CLAUDE.md paragraph applied;
> `research/release-0.5.1/CHANGES-0.5.1.md` started). Running: D1, D10-24, D10-F.
> **17:10 — D10-F MERGED `d058d6f`** (Sonnet `5e8d338`: B70/B71 44 px touch targets on a phone — 49 failing hit-tests behind one cause, the wave-51 phone
> block beaten by later native rules; one closing block at the foot of `skin.css`, +22, sizes only; B78 the STATE card's IMPULSE words, the trigger stays
> RELEASE (it left in `5f6421e`'s BOW redesign); four harness re-aims accepted; the boot suite alone 150/152 on its tree — B149 the law red, B6 timing; REPORT
> wave 211; `lab/*.js` 27,614 unchanged by it; node 0; CHANGES line). `BRIEF-D2-D8.md` and `BRIEF-D-V.md` written (`42e5610`, `6d79813`). Running: D1, D10-24.
> **17:33 — D1 MERGED `76b1d5e`** (Opus `52e51aa`: THE STAGE TEXT IS THE KIT'S BLOCK — every closer met: the pair boot Δ −0.109 / the D1 scene Δ −0.368
> (gate 3.536), the idle witness 0 records, placement 18/18, churn ≤ 4/s, the fade law; the letters stay; `stage-text.js` gone; −56 → **27,558**; HOLD (I) a
> real held key; `main-thread.mjs` `--setup`/`--sweep`/`served`; REPORT wave 212; CLAUDE.md THE STAGE TEXT paragraph replaced by its draft; CHANGES line).
> FOUND for Josh: the letters' `difference` blend costs ≈ 30 % of frames while the camera turns (pre-existing; R6-L); the kit's pointer force nudges the block
> when the pointer comes within 260 px (a STILL block is a brief candidate; R6-F). **D2+D8 LAUNCHED 17:35 from `76b1d5e`** (Opus, 9013/5483, `BRIEF-D2-D8.md`).
> **17:45 — D10-24 MERGED** (Sonnet `c8e8473`: THE CURVES CARD, closed after RENDER, screen only — an S-curve leaves the exported picture's sha unchanged;
> PREFERENCE record `lambdawaves.q0.curves`, FORGET removes it; presents/s neutral 15.03 → S-curve 12.18 on the headless rig, neutral free; the lock 0/0;
> +19 → **27,577**; REPORT wave 213; CLAUDE.md paragraph; CHANGES line). FOUND for Josh: a returning browser sees any card newer than its saved blob open once
> (a general gap of `applySettings`' exact `closed[]`); only `#field` is graded. **The first wave is IN (4/4).** Running: D2+D8. Then D-V.
> **18:20 — D2+D8 MERGED** (Opus `7e38b12`: THE MOLECULE'S HEAD on a hand pick — `moleculeHead` beside `moleculeLatex`, `stemOf` shared with the record
> generator (nine records `--check` byte-exact), held in THE FADE's seat until Escape / a press after 2.5 s / the next pick, never on a handless road, a
> node test over 38 records + H₂O/N₂ live with every numeral traced; `lw:` LINKS in the notebook view over preset/molecule/view/orbital, one ring row + one
> fade a press, no tab, no whole-state link; +80 → **27,657**; REPORT wave 214; CLAUDE.md THE HEAD sentence + the `lw:` LINKS paragraph; CHANGES lines).
> **GROUP I IS COMPLETE: D1 · D2 · D8 · D10-19 · D10-24 · D10-F.** Next: **D-V** (`BRIEF-D-V.md`, fresh Opus, from this tip, base `v0.5.0-alpha`).

## 3 · What happens next, in order

## 3 · What happens next, in order

1. **S0-A lands → S0-V.** Spawn a FRESH Opus verifier (`isolation: worktree`, start = the merged tree's sha) on
   `BRIEF-S0-VERIFY.md`. Fix its BLOCKERs (a small Opus fix round on the same branch, or yourself if trivial), re-run only
   what the fix touched.
2. **Cut v0.3.3-alpha** from `release-0.4.0` (R-A1; Josh authorised it with the plan and "build S0 and onward") — the road:
   ```
   # in the Major Agent's worktree, on release-0.4.0, tree green
   sed -i "s/^const BUILD_LINE = '[^']*'/const BUILD_LINE = '0.3.3-alpha · the exports · 2026-10-0X'/" lab/rack.js   # lab/rack.js:90, the only place the number lives
   # README.md:14  "**Status: 0.3.3 alpha.**"
   node tests/pwa.test.mjs --write && bash test.sh node
   git commit -am "0.3.3-alpha: the version line and the README status"
   git tag -a v0.3.3-alpha -m "…"
   node tools/changelog.mjs && git commit -am "CHANGELOG for v0.3.3-alpha"
   node tools/snapshot-release.mjs v0.3.3-alpha            # ~/Documents/LAMBDAWAVES-RELEASES/<tag>/ + the vault index note
   git push origin release-0.4.0 release-0.4.0:dev release-0.4.0:main --follow-tags    # main moves ONLY by this fast-forward
   node tools/build-deploy.mjs && npx wrangler deploy --env=""
   gh release create v0.3.3-alpha --generate-notes --prerelease
   curl -s https://lambdawaves.magic-commons.com/rack.js | grep -o "BUILD_LINE = '[^']*'"
   ```
   `gh` (account magic-commons) and `wrangler` were both logged in on 2026-10-07. Then REPORT the cut.
3. **S1 NAMES ∥ S1′ cameraEye** — two Opus builders in their own worktrees from the merged tree, briefs
   `BRIEF-S1-NAMES.md` (ports 8741/5209) and `BRIEF-S1-CAMERAEYE.md` (ports 8743/5211). Disjoint files; merge NAMES first,
   then cameraEye. Light check each; the digest lock is cameraEye's own gate.
4. **S2 CAMERA** (PLAN §4 F4; a verifier — it is the frame path), **S3 STAGE TEXT + WINDOWS** (F2, F3), **S4 LIBRARY a/b/c**
   (§3 B2 + F5; verifiers on a and c; §10's numbers are its sizing), **S5 KIT BRIEFS** (§5 → `research/release-0.4.0/KIT-BRIEFS.md`
   + vault mirror; add the canary's three missing guide entries). Write each brief from the plan the way the S0/S1 briefs
   are written (contract · laws · commits in order · acceptance · hand-off · harness). Then **cut 0.4.0-alpha** on Josh's word.
5. Memory of outcomes goes into REPORT.md waves and this file's §2 (update it as stages land; it is the baton).

## 4 · How Josh works (the standing laws — every one has cost us before)

- **Never edit `lab/mir/**` or `lab/fonts/**`** (adopted MIR; `tests/mir-manifest.test.mjs`). A kit need is a brief to the
  MIR session, never an edit. Cloud (Claude on GitHub) too: PRs only, never `lab/mir`.
- **After any `lab/` edit: `node tests/pwa.test.mjs --write`, then the suites.** `lab/sw.js` is generated.
- **Subtract, don't add** (Josh 2026-09-25): never add machinery to go faster; remove, merge, simplify. **Diagnostics live
  in `tools/`, never `lab/`.** Count `lab/*.js` lines before and after a seam.
- **The glass is Josh's**: no repainting his material; a text fix never licenses a skin change. First-run look: light,
  refractive, ALWAYS frost, 22 px blur, 50 % VIVID on desktop; frost OFF tinted on phone/tablet.
- **Three scopes** (`docs/STATE-SCOPES.md`): PREFERENCE / WORKSPACE / PROJECT (+ LIBRARY coming in S4). A project open leaves
  `lambdawaves.q0.settings` byte-identical outside the WORKSPACE keys. `node tools/new-project.mjs --check` stays exact.
- **Opus for builders** (Josh 10-06: "same price, quality first"); Sonnet is fine when the Opus weekly limit bites (Josh:
  "Sonnet is pretty good now!"). Fresh-context verifiers only for frame-path, worker/storage and release changes.
- **Don't over-verify** (Josh 10-01: "just see if the basic thing works. MIR 1.5 is coming soon"): one light check per
  stage. A timing flake (`current`, `wigner`, `electrostatics`) is re-run alone before it is believed.
- **The RTX 3070 has a one-ulp GPU fault in power state P5**: an identical-hash gate (the digest lock) can go red from it —
  re-run alone before believing a divergence. The GPU is shared: one browser suite at a time.
- **Never `pkill -f`** (it killed other sessions' browsers). Kill by pid. Each agent owns its ports: gate server
  `python3 tools/gate/server.py <root> <LW_PORT> &` then `LW_PORT=… GD_PORT=… node tests/<suite>.browser-test.mjs`
  (GD_PORT is geckodriver's; Firefox is the gate's browser). Convention: 8731/5203 tree, 8735/5205 measure, 8737/5207
  canary, 8741/5209 names, 8743/5211 cameraEye, 8745/5213 verifier; the Major Agent's own servers 8721, LAN 8711.
- **Never push to `main` except by the fast-forward of a release.** Branches may be pushed (Josh 10-07: "yes to anything
  for the branches"). Josh merges and decides go-lives; the 0.3.3 cut is pre-authorised by the plan.
- **Vault writes allowed** (Josh 2026-09-25) in the house naming; add, never edit another author's note.
- **Work in worktrees** (`EnterWorktree` / `isolation: worktree` for agents). Harness facts: a subagent is pinned to its own
  worktree (you can READ another agent's worktree, never run git there — merge its branch from yours); the guard refuses
  compound shell with variables, loops, heredocs or backticks, and git aimed outside your worktree — plain separate
  commands, scripts as files in the job tmp dir; `Write`/`Edit` outside the worktree may be refused (write into
  `<worktree>/.scratch/` and `cp` out, then remove `.scratch`).
- **Josh's dials on process:** plans by NACRE (Fable pre-draft → Sonnet review → draft → Opus@high audit → draft → Sonnet
  junior → final); math by `mathcollab` (Fable @ max ↔ Sol @ xhigh, append-only ledger, numbers or nothing); the DISK
  (`node tools/disk.mjs research research/DISK.md`) rebuilt after a ledger round; Josh's rulings recorded verbatim in the
  plan (§9) and taken as "first option" by default.
- **REPORT.md** is the notebook: a wave entry per commit, what was measured not hoped, under a dated heading.

## 5 · Josh's words that still bind (verbatim)

- "Let's continue, use any Opus/Sonnet 5.5 agents you can use (Sonnet is pretty good now!)"
- "Also don't over verify, just see if the basic thing works. MIR 1.5 is coming soon so don't worry too much about it"
- "Take the MIR flagship status from 'BASINS' to Lambdawaves!" · "Don't try to go for too many variations of the same
  molecule, try to be as diverse as possible." · "maybe a bucky-ball as our next milestone"
- "Nicely done Claude! … (Oh the planet photo is a bit of an over explaination but that sounds like a cool feature.)" —
  the lens shift stays.
- "defaults are good, and yes to anything for the branches. thanks Claude"
- "Welcome back Claude! We've got a huge plan. Ultrathink and build S0 and onward!"

## 6 · Who built what (the record of the previous Major Session's agents)

| agent | worktree branch | result |
|---|---|---|
| S0 canary (Sonnet) | `worktree-agent-a6bf03e4f65099a58` | merged `4ca4f54` |
| S0 measure (Opus) | `worktree-agent-acd0063cf95654204` | merged `efaaed8` |
| S0 tree (Opus) | `worktree-agent-ade297122bf2444a1` | in flight at `ebd45d5` (C3 done) when this was written |
| S1″ Sol thread round 1 (Fable) | `worktree-agent-a8356a853fc8a32d9` | in flight |
| earlier (0.3.2 THE OFFER, 0.3.3 THE EXPORTS, the NACRE plan) | `release-0.3.2`, `release-0.3.3`, `release-0.4.0` history | see REPORT.md 2026-09-26 and 2026-10-01, `research/release-0.3.2/BRIEF-133.md`, `research/release-0.3.3/` |

Old agent worktrees under `.claude/worktrees/agent-*` with merged branches can be removed (`git worktree remove <path>`
from the root checkout — Josh's call, it is his checkout).

— Claude Yan, 2026-10-07. Keep this file current; it is what the next Major Session reads first.
