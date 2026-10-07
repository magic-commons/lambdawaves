# 0.4.0 · NACRE PLANNING — the common file every planner reads first

Fable, 2026-10-07. λWAVES 0.4.0-alpha is planned by layers, Josh's way ("nacre"): Fable's pre-draft → Sonnet's review →
DRAFT 1 → Opus (high) audits and edits → DRAFT 2 → Sonnet (high) adds a junior's two cents → DRAFT 3. Optionally once more
with internet research (`DESIGN BOOSTER.md` in the vault). Josh sees DRAFT 3 and the final; the rounds between are ours.

## Files
- `survey/MIR-1.5.md`, `survey/SIBLINGS.md`, `survey/LWAVES-AUDIT.md`, `survey/VAULT.md` — the ground truth, read-only
  digests (2026-10-07). Read them before any draft. Where a draft contradicts a survey, the survey wins unless the draft
  says why.
- `PLAN-DRAFT-0.md` (Fable's pre-draft) → `REVIEW-SONNET-0.md` → `PLAN-DRAFT-1.md` → `AUDIT-OPUS-1.md` (Opus's edited
  plan, full text, with its changes marked) → `PLAN-DRAFT-2.md` → `REVIEW-SONNET-2.md` → `PLAN-DRAFT-3.md` → `PLAN.md`.
- Each reviewer writes its file in full; the hand-back message is a ≤300-word summary. Nobody edits another's file.

## Josh's ask, verbatim (2026-10-07)
> Let's do even further ultrathink-ing planning. Let this also be a pre-refactor to get ready for MIR 1.5. This will be our
> 0.4.0 alpha update. Cheat, look into our newer MIR projects (Although MIR 1.4) for more ideas for idea integration in
> 'AUTOMATA', 'EARTH', 'SOLEIL', and 'NEBULA'. Take the MIR flagship status from 'BASINS' to Lambdawaves!
>
> MORE IDEAS
> - Treat the caching like expansions and that the codebase is ready for a smooth transition with handling metadata, STEM
>   information, and copy/LaTeX integration for our markdown journal.
> - Let it keep true human information or fill in the gaps for Molecular orbitals, STO-3G vs 6-31+G^* sets of orbitals.
>   Show their true ladder names in the orbitals for Molecule window (The knob currently reads HOMO-1, HOMO-2, if available
>   we should let it read like 1a1, 1b2, kinda like Water's STO-3G's orbitals, no?). Caching these will be useful for
>   future informationals
> - Wave indexing the presolved orbitals (similar to renormalization in the mandelbrot set (check out 'FABLE's ZOETROPE' in
>   obsidian)) so that we could do some future ideas like attempts of dynamic waves with true electrostatics like a higher
>   level QHO but based on taylor 3D shells. Anything you can think of.
> - Don't try to go for too many variations of the same molecule, try to be as diverse as possible.
> - Let some things in the cache to be able to utilize special layouts similar to the spectrum window's buttons, like a
>   vertical periodic table, Large/heavy atoms, crystal lattices section, or a biology section (all amino acids, small
>   chains, anything small from this video https://www.youtube.com/watch?v=HZAmbbTcQ3M especially towards the end), maybe
>   a bucky-ball as our next milestone. (Remember how Benzene was the weird un-accomplish-able goal? We can do this!)
> - Have some engine upgrades for: much larger atom/electron count, heavier atoms, (frontier mathematics on cyclotomic
>   scaling? We can do a math frontier thing with Sol 6.1 on Codex. We can research cyclotomy and our own 'DISK' corpus for
>   some engine saving framing features because the lower orbitals are gonna go nuts)
>
> INFORMATIONAL and OTHER REQUESTS
> - Check the new live github version of LWAVES... we've added an atom and formula text in the bottom. We made this without
>   MIR standards because Claude Cloud cannot look inside my computer.
> - MIR 1.5 has a new feature in a rack window called 'INFORMATIONAL' - The philosophy of the informational is that it's a
>   real-time video overlay like a manim video with interactable and mouse-cursor aware animation dynamics. The atom and
>   formula is the first taste of it. It will dynamically change as things and settings (educational-wise... maybe
>   non-educational like the palette, camera stuff can be an MIR informational... a tutorial but using the same
>   informational engine? who knows...) in the rack windows are changed. Like if Winding or HOMO/LUMO presets are picked in
>   'registry' then it shows in the main screen at the top and then fades away. Other elements could do that too.
> - There's also a cursor dynamic one that's floating diagonal and hori, verti lines to the floating text. All the texts in
>   the informational (should upgrade the live one's "hot-add") should be using the markdown engine... because it can
>   display proper math. Title, heading, and body styles are preserved in "typomagical". Use the different text size styles
>   accordingly between different elements of the informational/screen/video overlay.
> - Optimize the informational engine for GPU screen recording.
> - Camera pan feature so that a large zoom could be off centered like looking at a planet photo with max FOV set, ya know?
>   Upgrade the camera window with the new dot matrix'd XY controller
>
> ANCIENT/LEGACY WINDOWS
> - We have a new 'dot matrix' cursor interactive thing you could use for all the inlays for interactive stuffs. Inspired by
>   Basin's XY camera grid. Check out the code to get a better picture. Make it a little less intense and smaller circles
>   for Lambdawaves.
>   - We need these window's features audited and checked if the newer windows already do more of the features and if they
>     could be consolidated with more of the popular windows. State as well needs to be audited.
> - (Audit this window and its features; upgrade it to what it could do now with the modern engine) Calculus could be a
>   video overlay, use proper latex and upgrade its current copy feature to copy everything in its window's content as a
>   markdown already in latex. Have it some premade math/physics body like text like a 'Figure (wordbreak...yadda
>   yadda..(First calculus row, yadda yadda, second calculus row, as the information goes on) combine whatever rows are
>   together. It's useful when taking copy of the calculus window of now with its proper $ and double $ LaTeX... and having
>   a built in markdown journal too? Something cool to cook up throughout the app)
> - (Audit this window and its features; upgrade it to what it could do now with the modern engine) Same with Dynamics,
>   Meters, Wigner(?), Radiation, (I like this one's UI design, maybe make Calculus like this but with two columns of
>   information? 3 where possible? Maybe with narrow elements?)
> - Rename 'slice' to 'PLANE'? (Is it okay to call it that? If you have a better name then go for it)
> - Shadow window. Orbit, Slice or whatever window could get super cool visual overlays too on the informational. It will
>   show up as a layer active on the informational. (Audit this window and its features; upgrade it to what it could do now
>   with the modern engine) Also, let the user be able to move the text around.
> - It would be cool if these windows could be somewhat realtime but that would be cost heavy. We must leverage the power
>   button feature on these windows in order to save resources.
> - Leverage the 'Display' setting in the Settings rack window (Not MIR options)
>
> NACRE PLANNING (In terms of the entire goal *you* think Josh is trying to achieve, how to make this user friendly
> (leverage the 'rack window'). How to execute this cleanly. The infrastructure/baseline changes needed to pull this off,
> keeping optimizations and speed clean and smooth with no FPS stutters, and utilizing, updating and upgrading already
> existing machinery in the UI)

## The standing laws every draft obeys
- **Subtract, don't add.** No machinery for speed; remove, merge, simplify. Diagnostics live in `tools/`, never `lab/`.
- **Only the engine is the app's.** Field, register, solvers, palette are λWAVES'; every other window, chrome, overlay or
  behaviour is kit work (MIR 1.5), and a feature built for one of the big four goes to all four through the kit.
- **The glass is Josh's.** No repainting; the look comes from the kit's settings.
- **The three scopes** (`docs/STATE-SCOPES.md`): PREFERENCE / WORKSPACE / PROJECT, and this plan adds LIBRARY.
- **The service worker's law**: the precache is the whole app and every build refetches it; data lives elsewhere.
- **No FPS stutter**: nothing new on the frame path; anything heavy in the maths worker, in idle slices, or behind a
  window's POWER.
- **Never edit `lab/mir/**`**; 1.5 is adopted, not patched. The 1.4.3 copies stay until adoption.
- **Verification dial**: one light check per stage; a verifier agent only for frame-path, worker, storage and release
  changes.
- **Opus builds**; Sonnet reviews and plays the junior; Fable orchestrates and writes the drafts.

## What a draft must contain
1. THE GOAL in Josh's terms and in one paragraph of ours.
2. THE SHAPE: engine / kit / content — what λWAVES keeps, what moves to the kit, what is content (.md pages, library).
3. THE BASELINE CHANGES (infrastructure first): the merge of Cloud's commits, the pre-refactor seams, the data cache,
   LIBRARY, the informational engine's seat, the frame-path budget.
4. THE FEATURES, each with: what the reader sees · which window · kit or app · cost · what it must not do.
5. THE STAGES with acceptance in one line each, and the order's reason.
6. RULINGS FOR JOSH (each flips one line).
7. WHAT IS NOT CLAIMED.
