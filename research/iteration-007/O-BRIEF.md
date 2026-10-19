# O · THE ORBITAL DIAL AS A STEPPED TARGET (iteration 007, branch `it007-orbital`, gate server 9631 / GD 5631; from M's merge)

ADR: `architecture/ADR-draft-0001-orbital-index-is-a-stepped-target.md` — ACCEPTED with Josh's ruling: **"Orbitals should be steps and I
think it could handle it at lower frequencies"** — integer steps, never a cross-fade, and a step-rate cap because each step rebuilds the
volume.

## Build
- The MOLECULES ORBITAL dial (`lab/chemview.js`, `span()` at :547, the dial rebuilt by `replaceWith` at :561-568 — which drops
  `data-param`; fix that, the stamp must survive a molecule change) becomes the target **`chem.orbital`**: the kit registry's `integer`
  map (`lab/mir/modulation/registry.js:160-165`: integer min < max, step 1), min 1, max the molecule's span (or the record's columns), the
  dial's own get/set. **Hot re-registration** on each landing (registry.js:252-256 replaces the descriptor, keeps the base and the routes)
  through the door that exists (`__LW.mod.register`, `facade.js:135-138`), since the static `defs` table is installed once
  (`modulation.js:154`) and a range that depends on the molecule cannot live there.
- **The step-rate cap**: the setter coalesces — the latest value wins, applied at most once per rebuild interval (start at 120 ms; if the
  volume's rebuild is slower on the measured machine, the interval follows it), so an LFO at 20 Hz steps the orbital at the cap and a lane
  at 0.5 Hz steps every orbital it crosses. Say the measured rebuild time per step for benzene STO-3G and a 6-31G* molecule in the build note.
- Its base in a saved project / undo row: a `modSeats` row (`lab/shell/persist.js:25-36`); a project that saved a route or a clip on
  `chem.orbital` reopens with it on the molecule it names (a different molecule clamps to its span — said in STATE's status, never thrown).
- The old comment at `modulation.js:115-119` ("changes WHICH quantity the volume means …") is rewritten to this ADR, or a later review
  will "fix" it back.
- The TIMELINE lane comes free from the registration and the stamp (`lab/mir/timeline/knobs.js:18-22`); route and lane are either-or.

## Laws
`chem.kick`, `chem.speed` stable; M's layout is the base — the dial's seat is where M put it; the hinge: windows/molecules.js ≤ 25,
shell/modulation.js ≤ 25; no new test files; never `lab/mir/**`; `research/release-0.5.2/lw-facade.json` re-captured with `--write` only if
the facade changes, with the diff said.

## Light check
A screenshot of a lane on the ORBITAL dial stepping benzene's orbitals (and the dial's number following), an LFO route at 20 Hz held to
the cap (METERS' FRAME PROFILE steady), a molecule change re-registering the range; `tests/timeline.browser-test.mjs`, `routed-knob`,
`molecule-head`, `./test.sh node`, rack-deps. Report: worktree · branch · commits · tests · blockers · next.
