# λWAVES · FOR JOSH — iteration 029 THE PERFORMANCE PASS (Claude Yan, 2026-10-31)

Where: `yan-c` in `~/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24` (`git log --oneline e9034304..yan-c`), NOT pushed, NO tag;
your 9261 serves the tree. The plan and every measurement: `research/iteration-029/` (PLAN, M0-MEASURE, M4-MEASURE, M6-SYNTHESIS, the BUILD notes,
R-REPO.md). Kit MIR 1.5.6-alpha.20 (three new doors; the bundle for ~/Documents/MIR in `.tmp/it029/kit.bundle`).

## What the lag was, measured on your screen (120 Hz panel, WAVE DANCER with the STAR track live)
| | before 029 | after the script fixes | BALANCED |
|---|---|---|---|
| frame time p95 | 16.5 ms | 14.2 ms | **9.7 ms** |
| dropped frames per 20 s | ≈ 265 | ≈ 265 | **≈ 59** |
| page JavaScript per frame | 3.3 ms | 0.9 ms | 0.9 ms |
| GPU main thread per frame | 8.66 ms | 8.66 ms | **4.36 ms** |

Two causes, in order. (1) Script: one modulated STAGE write repainted every λ mark on the page through a document-wide query; the kit's knob text
writes replaced text nodes and woke three page-wide observers and a forced layout; the modulation window rewrote unchanged text. Fixed (M1, the
three kit doors): 98 % of the DOM churn and half the scripting gone, THE LOCK unmoved. (2) The GPU: Chromium's GPU main thread needs 8.66 ms a frame
and your panel gives 8.33 — the frost glass blurring over the moving picture is about 4.3 ms of it. The field's march is not the stutter; your
molecules are fine. Holding the frost still while the picture moves (the kit's own FROST · STILL) cures it: p95 9.7 ms, the same as a scene where
nothing is written.

## What shipped
- **PERFORMANCE · QUALITY | BALANCED | LIGHT** in SETTINGS › FIELD QUALITY, beside the GOVERNOR (the old "PERFORMANCE FULL | 120 Hz" seg is now called
  READERS; nothing saved changed). BALANCED holds the glass while the picture moves and gives it back at rest. LIGHT adds the canvas at half while
  playing — nothing on the RTX, 3.9× on a software GPU. It is a preference, never a look: FROST stays FROST. METERS says the tier. QUALITY ships by default.
- **The Picker:** two tag rows, a visible rail scrollbar, more room between the thumbnails (the empty band under the search bar was the third tag row).
- **The repo:** one voice in every public text; the AI disclosure is three sentences in nobody's assumed voice; AI_POLICY.md is gone; the release documents
  under docs/release; the serve scripts under tools; the molecular-names suite green again; RELEASING's release-day list carries today's numbers.

## Your calls (each one word)
1. **BALANCED as the shipped default.** One line (`lab/shell/settings.js`, `applySettings`: `|| 'quality'` → `|| 'balanced'`). It changes the interface's
   pixels while playing, never the stage's. The glass is yours. On a 60 Hz panel QUALITY already fits twice over; on 120 Hz it is the eureka for every first run.
2. **The archive.** `research/iteration-029/R-REPO.md` (vault copy "… REPO TABLE 2026-10-31"): SHIPS 55 · MOVES 20 (3,227 research files, REPORT.md's notebook,
   docs/history, five dated docs, store/, the handoffs → the vault; history kept under the tag) · DELETED 3. "Go" = the tag `research-archive-2026-10-30`, then
   `tools/release/archive-research.sh --apply`, then the gates.
3. **The beta tag:** `v0.9.9-beta` (default) or `0.9.9` plain. CITATION.cff and BUILD_LINE move with it.
4. **GitHub:** the one-line `gh repo edit` (description + ten topics) in R-REPO §7; and whether the public side branches with agent-handoff commit subjects stay.
5. **Export "002 WAVE DANCER"** (FILE › EXPORT) if you want your exact scene re-measured; the demo stood in.

## Open, said plainly
- The RTX gain of LIGHT is zero; it exists for weaker GPUs, which this machine cannot measure (no integrated GPU, no 60 Hz panel, no iPad).
- Pre-029 volume installs read as not kept once (the sha header is new); INSTALL re-fetches.
- The old ASK broker (pid 1055617) still listens on 0.0.0.0:9443; `tools/gemma/stop.sh`.
- `@electron/packager` 20.3.0 carries five moderate advisories; the only fix is a forced major downgrade — left.
- FOR-MIR § 029: the live AUDIO band hints still rewrite while their values move; the two tier lines.

## 030
On "cut": the beta tag; your device checks (the installed PWA's update, the iPad); the Cloudflare login and `wrangler deploy` by your hand (DEPLOY.md's three
commands); the kit bundle fetched into MIR; the sibling adoptions' bundles. Then 1.0 by 028's definition.
