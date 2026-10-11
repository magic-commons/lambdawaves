# THE ENGINE PLAN (0.6 → 1.0) · NACRE PLANNING — the common file every planner reads first

Claude Sos (Fable 5.1), 2026-10-11. Josh's planning round after NACRE Research Round 1 (Yan, frozen) and Round 2 (Sos, DRAFT-3 00:28).
It plans, by his nacre method, the whole ladder he named in A11 — 0.6 Scientific Engine Upgrade · 0.7 Molecular Physics · 0.8 Quantum Wave
Laboratory · 0.9 Certification · 1.0 standalone + paper — on four axes: THE ENGINE, FEATURES, REPRESENTATIONS, THE CATALOGUE of quantum
systems and situations. The folder is `research/release-0.6.0/` because 0.6.0 is the first cut the plan produces; the plan itself spans the ladder.

## Josh's words, verbatim
> Wow, let's wrap up here. We will continue in this account session so don't worry about Yan but we will definitely compact to get ready for an
> ultrathink planning on the ultimate engine upgrade, feature additions, representations and diverse collections of quantum systems/situations.
> — 2026-10-11 00:38 CDT

> Good morning Claude! Let's continue where we left off — 2026-10-11 morning

Standing words that bind this plan (from the two research rounds and the chat, verbatim where they were given): "Nicely done Claude! …";
"Don't try to go for too many variations of the same molecule, try to be as diverse as possible."; "maybe a bucky-ball as our next milestone";
"Can this be update 0.6.0? We can break up all our work incrementally as we climb the builds. 0.7.0, 0.8.0 and up could be major updates with
0.0.X being merged/commited worktrees/Claude sessions that build into it. I'm saving 1.0.0 for an Apple iOS/iPadOS ready standalone app, STEAM
desktop, and Android when MIR finally gets a Mobile upgrade." (A11); the electrostatics ask of 00:10 ("a secondary cloud with the same fancy
shader/rendering in the molecule model … to show it for every orbital, or electron would be fun to see"); the pitch/song ask (A2); the
quasicrystal and sieve asks (A2, A3); "ChronusQ … we should definitely go forward with it … There will be a research paper along side the public
1.0.0 release of lambdawaves so be ambitious." (A4); "Let's also be holistic and see if we can accomplish our goals with a unified engine" (A8).

## The method (Josh's vault notes, verbatim; the same text 0.5.4's NACRE.md carries)
> - You, Fable 5.1, will ultrathink a plan as you would normally. This will be plan draft 1
>   - Before arriving at draft one, consult Sonnet 5.5 to review pre-draft, then also share ideas, missed spots, for you. Resynthesize and rethink and then
>     that's draft 1. You'll absorb Sonnet 5.5's beginner luck.
> - Then let Opus 5.5 @ High audit and edit the plan with it's own ultrathink and insight. Then review and synthesize on Opus's plan edits to create a plan
>   draft 2 (I don't see this btw, this is between ya'll)
> - Then Sonnet 5.5 @ High will look at draft 2, come up with it's 2 cents and essentially be the junior that has a 'beginner's luck charm' that can add a
>   couple of suggestions to the project. The plan edit goes back to you and you make plan draft 3. This will be how we synthesize plans.

Fable's pre-draft (`PLAN-DRAFT-0.md`) → `REVIEW-SONNET-0.md` → `PLAN-DRAFT-1.md` → `AUDIT-OPUS-1.md` → `PLAN-DRAFT-2.md` → `REVIEW-SONNET-2.md`
→ `PLAN-DRAFT-3.md` (Josh reads) → `PLAN.md` on his word. Claude family only. Each reviewer writes its file in full; nobody edits another's file.

## The question this round answers
What should λWAVES BECOME, release by release from 0.6.0 to 1.0.0, so that ONE scientific architecture carries a DIVERSE collection of quantum
systems and situations, each with its own representation(s), each measured against an oracle, inside Josh's laws (the line law, THE LOCK, the
three scopes, the glass, subtract-don't-add, no stutter)? For every row: what Josh sees · the engine · the gate (a [T] test with an oracle or an
[R] number the app computes) · the place on the ladder · the lines and the subtraction · the model that builds it.

## The ground (read before any draft; where a draft contradicts the ground, the ground wins unless the draft says why)
1. Round 2 `DRAFT-3.md` §A/§F/§5/§6/§G — `~/Documents/OBSIDIAN/LAMB of WAVES/for CLAUDE/CLAUDE YAN — NACRE RESEARCH ROUND 2 — 2026-10-10/`
   (the vision: two data shapes, three contractions, the texel's kinds, the worker plane, the flash law, the lines table; sixteen rows C1–C7, N1–N9).
2. Round 1 `DRAFT-3.md` §A/§C/§D/§F — `…/CLAUDE YAN — NACRE RESEARCH 0.6.0 — 2026-10-10/` (FROZEN; T1–T11; the four 0.6.x releases; the deferred list).
3. `research/release-0.5.4/PLAN-DRAFT-3.md` — THE CONTRACT LAYER (awaits Josh; builds after 0.5.3 Rack Tune).
4. The four sweeps in Round 2's `sweep/` — `MAP-CODEBASE.md` §9 (ten facts), `SWEEP-CORPUS.md` §6, `SWEEP-SOL.md` §6, `SWEEP-OPENAI.md` §4 (nothing to carry).
5. `research/release-0.5.4/survey/CHAT-AND-ASKS.md` §1 — Josh's eleven asks verbatim and Sol's answers; §4 his standing ambitions.
6. Round 2's `measure/` (38 measurements, every script beside its JSON) and Round 1's.
7. THIS ROUND's two censuses, read-only on the tree, in `census/`: `SYSTEMS.md` (every quantum system and situation the tree holds, held, or lacks)
   and `REPRESENTATIONS.md` (every view, style, kind, overlay, readout; the gaps).

## Decisions already taken by default (Josh said nothing; the starred answers of both rounds stand)
Round 1 §F 1–12 and Round 2 §F 1–11 as starred. The plan RECORDS each where it bears and lists them again in its own §F so Josh can flip any.

## The laws every draft keeps
- Never edit `lab/mir/**` or `lab/fonts/**`. Subtract, don't add; diagnostics in `tools/`; the glass is Josh's. Three scopes; `new-project --check` exact; serialize 11/11.
- THE LOCK: 1,004 distinct values on 13 still states, same-machine, in no CI job; the presenter is INSIDE it (120 style values). Never re-baked by a maths row;
  a row that changes the physics on purpose re-bakes with the reason written and Josh's word. "THE LOCK unchanged" is a row's precondition, never its gate.
- The line law: cap = the last cut × 1.01; 233 left on the v0.5.2 base today; ≈ 280 per cut; every engine row names its subtraction. `lab/sw.js` (593, generated)
  is counted until Josh rules (Round 2 §F-8).
- Every gate is [T] (a test with an oracle: PySCF, a closed form, expm, a re-solve, an RT-TDHF run) or [R] (a number the app computes live). No gate needs the
  exact answer at run time. Claim tags: KNOWN · DERIVED-HERE · MEASURED · UNVERIFIED. Nothing is "novel" without a prior-art pass.
- Nothing runs in the frame loop that a row did not price; a worker that fails HOLDS and says so (0.5.4 P6); the flash law for every beating picture.
- Opus builds; Sonnet/Haiku lighter rows; one fresh verifier for frame-path, worker/storage and release changes; don't over-verify. Names one or two words, no "The".
- NO push, NO deploy, NO gh release until the whole plan has run (Josh 10-07); cuts are local. Plans record Josh's words verbatim and take his defaults.
- Read-only everywhere but this folder; no script of Sol's, the pilot's or OpenAI's is run; the vault's `for CODEX/` is another author's.

## Files (this folder)
`NACRE.md` (this) · `census/SYSTEMS.md`, `census/REPRESENTATIONS.md` (+ their data) · `PLAN-DRAFT-0.md` → `REVIEW-SONNET-0.md` → `PLAN-DRAFT-1.md` →
`AUDIT-OPUS-1.md` → `PLAN-DRAFT-2.md` → `REVIEW-SONNET-2.md` → `PLAN-DRAFT-3.md` → (Josh) → `PLAN.md`. Scratch in the job tmp, copied in when it matters.
