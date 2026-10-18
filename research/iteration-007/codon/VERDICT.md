# THE 3-CODON NUCLEIC ACID — the verdict (Claude Sos, 2026-10-18; the facts are FACTS.md beside this file)

Josh: "just for an ambition past buckball... how do you feel about a 3 codon length molecule to solve on different types of DNA, and RNA, mRNA and such?"

## How I feel about it
Yes, and it is two projects, not one. SOLVING a 9-nt nucleic acid is an ordinary PySCF RHF of 3,000–6,000 Cartesian AO: a few hours on the 3070 for a strand, a day or two for a duplex, or an hour of a rented A100 for the lot. SHOWING it is a new tier of the app: every rung of every 9-mer is past the ORBITAL kernel's 768-AO cap and far past DENSITY's 128-AO tile, so the molecule cannot be decoded the way the other 2,800 are. The buckyball was the last molecule the present roads could carry; the codon is the first that needs a road of its own.

## What the fact-check changed in the first take
- The counts hold (a strand ≈ 290 atoms, a duplex ≈ 570; STO-3G ≈ 1,050 / 2,100 AO; 6-31G* ≈ 3,000 / 6,000 AO), but "about 1,000 occupied orbitals" was wrong: 712–740 for a strand, 1,410–1,458 for a duplex. Every case is closed-shell.
- The refusal claim was wrong: no 6-31+G* rung is refused (λmin(S) 1e-7 for strands, 5e-9–1e-8 for duplexes). Still, the duplexes sit within a decade of the rule and the diffuse functions on an anion are an artefact, so the ladder STOPS AT 6-31G* for this tier.
- Real geometries are cheap: pip `pymol-open-source` (`fnab`) builds B-/A-DNA and a single RNA strand in a second; AmberTools' `fd_helix` builds the A-RNA duplex. Thirteen models are in this folder.

## The species (the decision that matters most)
A bare −8 / −16 anion in vacuum has a POSITIVE HOMO: the top occupied orbitals are phosphate lone pairs that are unbound, and the picture a viewer gets is a basis artefact, not the bases' π. Three remedies; my recommendation is the first:
1. **Protonate the phosphates — the neutral (acid) form.** Closed-shell, neutral, gas phase like every other molecule in the library; HOMO/LUMO are the bases' π/π* (the chemistry); < 1 % more AO; `solve.py` and the refusal rule unchanged. Label it "neutral (acid) form" — it is the free acid, not the physiological species.
2. Na⁺ (Mg²⁺) counter-ions: in vacuum the cations' empty states fall into the gap, so the LUMO a viewer sees is a sodium orbital. No.
3. PCM water on the true anion: the best physics; gpu4pyscf 1.8.1 has C-PCM/IEF-PCM/SMD in a low-memory mode, but the pipeline needs a solvent field and its CPU energy re-evaluation a PCM term. The later "solvated" edition, for a Rent-A-GPU day.

## The solve plan (nothing runs until Josh says so — compute is paused)
- Four molecules first: ssRNA 9-nt AUG·CGA·UAA (the mRNA triplet: start, Arg, stop), ssDNA ATG·CGA·TAA, the B-DNA 9-bp duplex, the A-RNA 9-bp duplex. Later: A-DNA, the DNA·RNA hybrid. Z-DNA is not physical for this sequence.
- Ladder STO-3G · STO-6G · 3-21G · 6-31G · 6-31G*; no 6-31+G*.
- Where: strands' lower rungs on the 3070 (hours); every 6-31G* and both duplex ladders on Rent-A-GPU day (A100: 4–9 min per strand rung, 20–40 min per duplex rung; direct SCF, no density fitting — the DF tensor would be 85–530 GB).
- Pipeline changes: a `--giant` record kind in THE VOLUME FORMAT (below); the species tag and the label; the geometry builder (pymol-open-source + fd_helix) as a catalogue source.

## The app plan — THE GIANT TIER (a design, to brainstorm after the MOLECULES rework)
1. **A frontier window instead of the whole C.** Ship HOMO−K … LUMO+K columns in f32 (K = 32: 64 columns × 6,081 × 4 B ≈ 1.6 MB for the duplex, against 140 MB for all of C). The ORBITAL dial, MO-REGISTRY's ladder and the A ↔ B morph work over that window unchanged in meaning; the dial's range is the window.
2. **DENSITY baked in the pipeline**, not summed on the GPU: ρ on a 128³ grid (≈ 0.25 Å voxels over a 30 Å molecule) as f16 ≈ 4 MB per rung, shipped as a volume. The per-frame GPU sum over 1,400 occupied orbitals is 1e13–4e13 FLOP a frame: a one-off on a desktop GPU, never a WebGPU frame.
3. **An ORBITAL kernel with spatial shell screening** (cell lists: a voxel visits only the shells of the 30–60 nearby atoms), and storage buffers past today's 256 shells / 2,048 primitives / 8,192 weights. This is the one real piece of shader work, in `lab/field.js` (1,906 lines — the Pocock scan should cover it before this build).
4. **The VOLUME FORMAT v2 record**: `kind: 'giant'`, the frontier columns, the baked ρ per rung, the species tag; v1 readers skip it. The Picker shows a GIANT badge and the molecule's length in Å.
5. Not f16 C: the split-valence rungs' large cancelling coefficients lose too much at an 11-bit mantissa; frontier columns are the right cut.

## Questions for Josh (one at a time, when we get there)
- The species: the neutral acid form first (my recommendation), with the solvated anion as a later edition?
- Which four sequences first — the ones above, or his own (a real gene's first three codons)?
- Is a 128³ baked DENSITY (0.25 Å voxels) enough, or does he want 192³ (≈ 14 MB f16)?
- The frontier window K: 32 (64 orbitals) or 64 (128 orbitals, 3.2 MB)?

## Order
After the MOLECULES / MO-REGISTRY / INFORMATIONAL rework and the target seam (Pocock candidate 1), because the giant tier's dial and registry ride on them. The solve itself can run earlier, on Rent-A-GPU day, since the records keep in the raw catalogue until the app can read them.
