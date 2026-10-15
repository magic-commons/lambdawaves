# 0.6.1 Factor Road — what changed (plain words; one line per merged row)

THE ENGINE PLAN's second cut (`../release-0.6.0/PLAN.md` D.2), built by `BUILD-PLAN.md` on Josh's word of 2026-10-15 ("continue with the next builds once it's
done" under "keep the builds tight … just build the features"). Nothing pushed, nothing deployed; the cut is local.

- **F2 THE SYMMETRY CERTIFICATE (Opus 5.5, `50c7a57`, merged `1040ab6`).** `names.js` gains `symmetryDefects`: for every operation of the molecule's declared
  group, ε_g = max|M(g)ᵀ S D S M(g) − S D S| / max|S D S| in double precision, S rebuilt exactly from the wire's shells. MOLECULES' fold gains the SYMMETRY readout,
  written once per landing of a density and at most five times a second while a run plays: benzene still reads "D₆h · 24 of 24 kept · worst 2·10⁻¹⁴"; the RING
  playing reads "Cs · {E, σh} kept · 22 broken"; a z-kick reads "broken by 0.0034 after the kick"; water "C₂v"; a C1 record says so. The MO-REGISTRY's state hands
  its ΔD to the certificate through one line.
- **F1 THE FACTOR ROAD + FROZEN-CORE COLUMNS + BUCKY (Opus 5.5, `22d4b51`, merged `aa2343c`).** C₆₀'s record now carries every occupied column (the 180
  occupied plus the LUMO set, 183 of 300, PySCF's own re-run: −2244.018782476829 Eh in 239 s on twelve threads, each sampled column agreeing with PySCF's
  values at 92 points to 10⁻¹⁶). A FACTOR kernel derived from the orbital kernel's shell loop draws ρ = 2 Σ_k φ_k² straight from the columns, 32 at a time in
  registers — 40 ms at 96³, 12.5 ms at 64³ — through the session's new product kind; benzene drawn by both roads agrees to 3.5·10⁻⁷ of max √ρ (one f16 ulp).
  MOLECULES offers DENSITY for a record without a density matrix, and VALENCE through the same road (the valence columns only, exact: "120 valence orbitals
  summed · 60 core frozen"); the STATUS line reads "DENSITY · exact · 180 orbitals summed". The BUCKY demo (C₆₀'s density from its record) joins the title
  screen as the eighth cover; on a fresh device the demo fetches the record (707 KB) over the network.
- **Lines:** 28,289 → 28,371 (+82; cap 28,571). Both locks 0/0 at the cut (benzene and lysine stay on the χ tile; no locked state takes the factor road).
- **Deferred:** E0 THE FIELD OWNER (still unneeded); M5a THE MIRROR HALF (a speed-up, not a feature).
