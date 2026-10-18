# Iteration 007 — Josh's prompt, kept for the next session (2026-10-18, Claude Sos)

Josh: "We should dwell on this prompt after compaction though/next session" and, for the DNA part, "We will ultrathink on that prompt next session."
Process for next session: brainstorm (play back each part, settle the open questions below) → Josh approves the design → plan → build. Nothing here is built yet.

## Verbatim
> yeah, mostly picking molecules, basis, and density/orbital, I have a lot of fun with the registry. For molecules window move 'installed' and 'molecules on' buttons to the top. The two pickers could be on top of each other. Order from top to bottom of the last sections should be basis, view, then method. Have orbital knob be modulatable from min max of the knob by the modulation window and timeline. Add screenshots to all of those poor molecules with no thumbnail, this will bloat the download more but it's ok. Let A to/back B knob from registry be also modulatable and timeline clippable. Reorganize the 'view' section in the molecule window to not be so top-heavy. In informational, let there be a plethora of options like: toggle show registry orbital adds or something, toggle show 'wave' changes, toggle orbital change (when dialing the molecules orbital knob), toggle show time multiplier or something, toggle mouse cursor dynamics like the text moving out of the way of the cursor. Toggle show style changes from wave and palette shown. Toggle show name of the molecule (not the formula), and have some size knobs, padding, positioning for some too. Rework the entire informational window to make this a clean and unified look with all of the existing MIR components. We should dwell on this prompt after compaction though/next session. Also... just for an ambition past buckball...... how do you feel about a 3 codon length molecule to solve on different types of DNA, and RNA, mRNA and such? We will ultrathink on that prompt next session

Earlier the same day: "The molecules window has too many controls to find anything." What he uses: picking molecules, BASIS, DENSITY/ORBITAL; he has a lot of fun with MO-REGISTRY.

## The reading (Sos's — to confirm with Josh)
**MOLECULES (`lab/chemview.js`, `lab/windows/molecules.js`; 61 controls, 1,254 px unfolded — screenshots beside this file)**
1. INSTALLED and MOLECULES ON move to the TOP of the card (today they sit between the section stepper and the molecule stepper).
2. The two pickers — the section stepper (‹ ORGANIC ›) and the molecule stepper (‹ C₆H₆ · 36 AO ›) — sit directly one above the other.
3. The sections below run BASIS → VIEW → METHOD (today BASIS → METHOD → VIEW).
4. VIEW is re-laid so it is not top-heavy (today DENSITY · ORBITAL · Δρ · ESP · SPIN on one row and Δ LDA-RHF alone below).
5. The ORBITAL dial becomes a modulation target over its whole range (min → max) — the modulation window's routes and the TIMELINE. Today the only `chem.*` targets are `chem.kick`, `chem.speed` (`lab/shell/modulation.js` defs).

**MO-REGISTRY (`lab/orbitalsview.js`, `lab/registerview.js`; 59 controls)**
6. The ORBITAL register's A ↔ B knob (MORPH, `orbitalsview.js:116`, `morphK`) becomes modulatable AND "timeline clippable". Today `reg.morph` points at the STATES register's morph only.

**THE LIBRARY**
7. Every molecule without a picture gets one (`tools/menu-thumbs.mjs --volume vol-1`; ~2,800 now, more as the solvers finish) — the bigger download is accepted.

**INFORMATIONAL (`lab/informational.js`, the stage words `lab/shell/stage-words.js`, the kit's info layer `lab/mir/info/`)**
8. A plethora of toggles for what the stage announces: registry orbital adds; WAVE changes; orbital changes (dialling the molecule's ORBITAL knob); the time multiplier (RATE); WAVE style and PALETTE changes; the molecule's NAME (not only the formula); and the cursor dynamics (the words moving out of the cursor's way — the kit's info layer has following/drift/avoidance features that λWAVES switched off).
9. Size knobs, padding and positioning for some of them.
10. The whole INFORMATIONAL window reworked into one clean, unified look built from the existing MIR components.

## Open questions for the dwell (one at a time)
- "Timeline clippable" for A ↔ B: a CLIP placed on the timeline that plays A → B over its length (like PLACE ONE PERIOD's `lw-period` clip), an automation lane on the knob, or both?
- The ORBITAL dial under modulation: does it step through orbitals (integer, each a different picture) or sweep continuously between neighbours (a cross-fade)?
- INFORMATIONAL: which toggles default ON for a first run?
- "Two pickers on top of each other": stacked, or merged into one picker with the section as its heading?

## THE AMBITION PAST THE BUCKYBALL — a 3-codon nucleic acid (to ultrathink next session)
First take (numbers to check): a codon is 3 nucleotides, so 3 codons = 9 nucleotides. One residue ≈ 20 heavy atoms (+ ≈ 12 H); a 9-nt single strand ≈ 185 heavy atoms / ≈ 300 atoms, net charge −8 (the phosphodiesters); a 9-bp duplex ≈ 370 heavy / ≈ 600 atoms, −16. Basis sizes (Cartesian): STO-3G ≈ 1,000 AO (single strand) / 2,100 (duplex); 6-31G* ≈ 3,000 / 6,000 AO; 6-31+G* ≈ 3,700 / 7,400 AO. For scale: C₆₀ at 6-31G* is 900 AO (6 min on the 3070). So STO-3G/3-21G of a single strand is a 3070 job (hours); 6-31G* is a Rent-A-GPU job (an A100: ~minutes to a few hours); 6-31+G* will almost surely be refused by the linear-dependence rule (λmin(S) < 1e-9), as C₆₀'s was.
Physics to settle: a gas-phase polyanion has unbound occupied orbitals — neutralise (protonated phosphates), add counter-ions (Na⁺; Mg²⁺ for RNA), or an implicit solvent (PySCF's PCM/ddCOSMO; gpu4pyscf has PCM). Geometry: ideal fibre models for B-, A- and Z-DNA, the A-form RNA duplex, a single-stranded mRNA triplet, a DNA·RNA hybrid (a builder such as x3DNA's fibre models or NAB). App side: a "giant" tier — C at f32 is 4·nAO² bytes a rung (6,000 AO → 144 MB), DENSITY over ~1,000 occupied orbitals per voxel needs the GPU road and a frontier window of orbitals; the volume format may want f16 C or frontier columns for this tier.
