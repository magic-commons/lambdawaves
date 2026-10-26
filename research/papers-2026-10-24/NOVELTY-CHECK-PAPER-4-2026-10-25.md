# Novelty check: Paper 4, *Knotted Zeros in Seven Levels* (25 October 2026)

This is a priority search for four claims of `04-KNOTTED-ZEROS/MANUSCRIPT.md` (Draft 01). The proving lab's record is `knots/KNOTS.md`. The manuscript was not edited.

## Bottom line

- No paper found puts a trefoil or a Hopf link in a hydrogen eigen-superposition below Berry's n = 7 and n = 6.
- No paper found states a level formula like n_G(p, q).
- No paper found proves the H₂ or the polynomial × e^{−r/n} statements.
- The published expectation runs the other way. Enciso, Hartley and Peralta-Salas (2018, pp. 2–3) write: "Berry's construction suggests that one probably needs eigenfunctions with high n to realize complicated knots; e.g., for the trefoil knot he needs at least n = 7."
- **One partial prior the paper should acknowledge.** The mechanism of Proposition 6 is not new as a structure. In it the loop has m₀ = 0, it vanishes to order p, and the perturbation carries the twist in its own e^{im₁φ}. That is exactly the shape of the Milnor polynomial u^p − v^q, which underlies the optical vortex knots of Dennis, King, Jack, O'Holleran and Padgett (2010). Its m = 0 part u² vanishes to second order on the unit circle. Its perturbation v³ ∝ (x + iy)³ carries e^{3iφ}. What appears new is carrying that idea into one degenerate hydrogen level, the level count that results, and the explicit verified states.
- The paper's §2.1 currently says "a knot in a level must be made another way". That is true of the polynomials themselves, but not of the twist-in-the-perturbation idea, which the two constructions share.

## Method

The search was run on 25 October 2026.

1. **Forward citations through OpenAlex** (api.openalex.org, `filter=cites:`). Both lists were read in full.
   - Berry, Found. Phys. 31, 659 (2001), doi:10.1023/A:1017521126923: 40 citing records (OpenAlex W1501436026).
   - Enciso–Hartley–Peralta-Salas, Rev. Mat. Iberoam. 34, 1361 (2018), doi:10.4171/RMI/1026: 8 citing records (OpenAlex W2597903573).
   - Abstracts were read for every hit that deals with nodal lines of eigenfunctions.
2. **Semantic Scholar citations endpoint**: it returned HTTP 429 (rate limited) on six retries over several minutes, so it was **not available**. OpenAlex stood in for it. Semantic Scholar's index overlaps OpenAlex heavily but not completely.
3. **arXiv**: the arXiv API, both through the MCP tool and directly at export.arxiv.org, timed out or returned 429 for the whole session. **No arXiv metadata or full-text search could be run.** In its place:
   - WebSearch restricted to `site:arxiv.org` with the task's phrases;
   - the arXiv abstract page of 1603.03214;
   - the full text of 1603.03214 (EHP) and of 1512.01012 (Maucher et al.).
4. **Keyword search in OpenAlex** (title and abstract), each read to 15 results:
   - "knotted nodal lines hydrogen"
   - "knotted zeros Coulomb eigenfunctions"
   - "trefoil nodal line hydrogen atom"
   - "torus knot nodal line hydrogen"
   - "vortex knots hydrogen atom wavefunction"
   - "knotted vortex lines atomic orbitals"
   - "nodal lines hydrogen superposition degenerate states vortex"
5. **Google Scholar**: no direct access. WebSearch (standard and extended) stood in, with these queries:
   - "knotted nodal lines hydrogen atom eigenfunction trefoil lower principal quantum number"
   - "\"knotted zeros\" hydrogen Berry trefoil n=7 Hopf link n=6 improvement"
   - "hydrogen atom stationary state knotted vortex line trefoil n = 4"
   - "site:arxiv.org knotted nodal lines hydrogen eigenfunctions Berry torus knot lower energy level"
   - "\"Knotted zeros in the quantum states of hydrogen\" cited by 2022 … 2026"
   - the Taylor thesis
   - the Dennis 2010 mode weights
6. **Texts read beyond abstracts:**
   - EHP 2018 (arXiv:1603.03214v2), introduction and outline: on what level their theorem needs, and what they say about Berry's n.
   - Taylor & Dennis 2016 (PMC4974566), Discussion: on hydrogen, and the lowest energies at which knots were seen.
   - Kauffman & Lomonaco 2019 (ar5iv): on hydrogen and on polynomials times exponentials.
   - Maucher, Gardiner & Hughes 2016 (arXiv:1512.01012) §2.2 and §3.2: the Milnor polynomial (their eqs. 12–15) and the trefoil's LG weights (eq. 38) as taken from Dennis et al. 2010.
7. **Not re-read by me:**
   - Berry 2001 and Berry–Dennis 2001 (paywalled). For what they contain I rely on the proving lab's reading in KNOTS.md §8: Berry read in full; Berry–Dennis §§1–3 read, the appendices not.
   - Dennis et al. 2010's main text. Its trefoil field's structure is confirmed through Maucher et al.'s eqs. (12)–(15) and (38), which cite it as ref. [7].

**How hard this was.** The citation graph of the one prior hydrogen-knot paper (Berry) was searched in full through one database. The theorem paper (EHP) was read for its level discussion. Seven keyword searches ran in a second database and five web searches stood in for Scholar. arXiv full text was **not** searched because of rate limits. That is the gap to close before priority is claimed in print: one arXiv full-text pass for "hydrogen" ∧ ("knot" ∨ "trefoil" ∨ "Hopf link") ∧ "nodal", and a Google Scholar "cited by" pass on Berry 2001 (Scholar's count is about 43, OpenAlex has 40).

## Hit list

These are the hits that bear on knotted nodal sets of eigenfunctions, plus the optical construction that shares the mechanism. Each DOI or arXiv id was confirmed in OpenAlex or Crossref.

| # | Work | Venue, year | DOI / arXiv | Relevance |
|---|---|---|---|---|
| H1 | M. V. Berry, Knotted zeros in the quantum states of hydrogen | Found. Phys. 31, 659–667 (2001) | 10.1023/A:1017521126923 | The baseline: the Hopf link at n ≥ 6 and the trefoil at n ≥ 7, with twist from the loop's m and perturbation by ψ_{n00}; "a recipe is given for constructing any torus knot" |
| H2 | M. V. Berry, M. R. Dennis, Knotted and linked phase singularities in monochromatic waves | Proc. R. Soc. A 457, 2251 (2001) | 10.1098/rspa.2001.0826 | Helmholtz waves: a strength-n loop threaded by a strength-m line, then perturbed, gives the (m, n) torus knot. Per KNOTS.md §8, their perturbations are ones "that do not themselves possess dislocation lines threading L_n" |
| H3 | M. V. Berry, M. R. Dennis, Knotting and unknotting of phase singularities … | J. Phys. A 34, 8877 (2001) | 10.1088/0305-4470/34/42/311 | Reconnection and destruction of knots in polynomial waves; not hydrogen |
| H4 | M. R. Dennis, Braided nodal lines in wave superpositions | New J. Phys. 5, 134 (2003) | 10.1088/1367-2630/5/1/134 | Borromean braid in Helmholtz waves; not hydrogen |
| H5 | M. R. Dennis, R. P. King, B. Jack, K. O'Holleran, M. J. Padgett, Isolated optical vortex knots | Nature Phys. 6, 118–121 (2010) | 10.1038/nphys1504 | **Partial prior for the mechanism.** The trefoil field is u² − v³ (Hopf link u² − v²), with u = (r² − 1 + 2iz)/(r² + 1) and v = 2(x + iy)/(r² + 1). The m = 0 part u² vanishes to order 2 on the unit circle, and v^q supplies the e^{iqφ} twist; its LG content is ℓ = 0 (p = 0…3) and ℓ = 3 (p = 0), weights 1.51, −5.06, 7.23, −2.03, −3.97 (per H11 eq. 38). Paraxial optics, not a hydrogen level |
| H6 | A. Enciso, D. Hartley, D. Peralta-Salas, Laplace operators with eigenfunctions whose nodal set is a knot | J. Funct. Anal. 271, 182 (2016) | 10.1016/j.jfa.2016.04.016 · arXiv:1505.06684 | General 3-manifolds and metrics; not hydrogen |
| H7 | A. J. Taylor, M. R. Dennis, Vortex knots in tangled quantum eigenfunctions | Nat. Commun. 7, 12346 (2016) | 10.1038/ncomms12346 · arXiv:1608.00909 | Random eigenfunctions of the 3-torus, the 3D harmonic oscillator (a 3₁#3₁ at N = 4, "extremely rare") and the 3-sphere. The Discussion mentions "preliminary numerical studies of vortex knots in random eigenfunctions of hydrogen", with knots "typically beyond a certain energy"; no levels or states are published |
| H8 | A. Enciso, D. Hartley, D. Peralta-Salas, A problem of Berry and knotted zeros in the eigenfunctions of the harmonic oscillator | J. Eur. Math. Soc. 20, 301 (2018) | 10.4171/JEMS/767 · arXiv:1503.05101 | Every link occurs in the oscillator at high energy; no level |
| H9 | A. Enciso, D. Hartley, D. Peralta-Salas, Dislocations of arbitrary topology in Coulomb eigenfunctions | Rev. Mat. Iberoam. 34, 1361–1371 (2018) | 10.4171/RMI/1026 · arXiv:1603.03214 | Every finite link occurs in hydrogen for every n past some n(L), by approximating a solution of (Δ + 2/\|x\|)φ = 0 as n → ∞. It gives no explicit level, and pp. 2–3 expect high n (quoted above) |
| H10 | L. H. Kauffman, S. J. Lomonaco, Quantum knots and knotted zeros | Proc. SPIE 10984 (2019) | 10.1117/12.2518685 · arXiv:1904.07229 | Every knot is f⁻¹(0) for some smooth f: ℝ³ → ℂ. It "leaves open the question of characterizing just when such f are wave-functions"; no hydrogen levels |
| H11 | F. Maucher, S. A. Gardiner, I. G. Hughes, Excitation of knotted vortex lines in matter waves | New J. Phys. 18, 063016 (2016) | 10.1088/1367-2630/18/6/063016 · arXiv:1512.01012 | Read for its explicit statement of H5's Milnor polynomial and LG weights |
| H12 | B. Bode, M. R. Dennis and coauthors: lemniscate knots (2017), 5₂ (2017), any knot (2019), and Bode's complex optical vortex knots (2025) | Proc. R. Soc. A 2017; J. Phys. A 2017; JKTR 2019; Proc. R. Soc. A 2025 | 10.1098/rspa.2016.0829; 10.1088/1751-8121/aa6cbe; 10.1142/S0218216518500827; 10.1098/rspa.2024.0605 | Polynomial and paraxial constructions; none in a hydrogen level |
| H13 | A. Enciso, D. Peralta-Salas, F. Torres de Lizaur, High-energy eigenfunctions of the Laplacian on the torus and the sphere with nodal sets of complicated topology | Springer Proc. Math. Stat. (2021) | 10.1007/978-981-33-4822-6_7 · arXiv:1810.09277 | High energy only; not Coulomb |
| H14 | H. Kedia, D. Foster, M. R. Dennis, W. T. M. Irvine, Weaving knotted vector fields with tunable helicity | Phys. Rev. Lett. 117, 274501 (2016) | 10.1103/PhysRevLett.117.274501 | Knotted vector fields from Milnor-type maps; not eigenfunctions of a level. Checked for scope only |

These were checked and are not relevant:
- M. Spera (2023) and G. Barbieri & M. Spera (2024): the Clebsch geometry of a knotted zero set, with no construction.
- I. R. C. Buckley, Zenodo 10.5281/zenodo.21480634 (2026): a numerological map (n, ℓ) → torus knots; no nodal sets; under audit.
- N. Rosanov et al., arXiv:2606.08528 (2026): knotted expectation-value hodographs, not nodal lines.

The rest of the 40 + 8 citing records are optics, BEC, Beltrami-field or approximation-theory papers with no hydrogen nodal construction.

## Verdict per claim

### (1) A trefoil nodal line in a hydrogen eigen-superposition at n = 4, the twist moved into the perturbation: NO PRIOR FOUND for hydrogen; PARTIAL prior for the mechanism

- No work found builds a hydrogen trefoil below n = 7. EHP 2018 (H9, pp. 2–3) states the opposite expectation: "Berry's construction suggests that one probably needs eigenfunctions with high n to realize complicated knots; e.g., for the trefoil knot he needs at least n = 7."
- EHP's theorem gives existence for all n ≥ n(L) with no bound, so it neither anticipates nor contradicts n = 4.
- **Partial prior.** Moving the twist into the perturbation is the structure of the Milnor polynomial u^p − v^q used for optical knots (H5; the form is written out in H11 eqs. 12–15). There, an m = 0 term vanishing to order p on a circle is perturbed by a term carrying e^{iqφ}, giving T(p, q). For the trefoil, p = 2 and q = 3.
- In H2 (Helmholtz) and H1 (hydrogen), by contrast, the threading line belongs to the unperturbed field and the perturbation does not thread the loop.
- So the new step is putting that structure inside one degenerate Coulomb level, where the polynomials themselves are unavailable (Proposition 2), using the exact n = 4 loop (4s₀, 4p₀, 4d₀, 4f₀) twisted by 4f₃.

### (2) The Hopf link at n = 4: NO PRIOR FOUND for hydrogen; PARTIAL prior for the mechanism

The status is the same as (1). Berry's hydrogen link is at n = 6 (H1). The optical analogue of the paper's construction is u² − v² (H5, H11 eq. 15 with n = 2).

### (3) The level formula n_G(p, q) = min_a max(a + 2p, |q − a| + 1) against Berry's n_B: NO PRIOR FOUND; PARTIAL context

- No work found gives any explicit level at which a torus knot occurs in hydrogen other than Berry's own recipe (H1).
- H2 gives the general (m, n) → torus knot unfolding for Helmholtz waves, with no level count, since that setting has none.
- H9 gives existence beyond an unspecified level.
- H7 reports hydrogen knots only qualitatively, "beyond a certain energy".
- The formula is an upper bound under hypotheses checked case by case, and the paper says so. That framing should stay.

### (4a) "Level 2 holds no knot or link": NO PRIOR FOUND as a stated result

- The argument is elementary (Proposition 4). No source was found stating it, nor any explicit lower bound for knotted nodal lines in hydrogen.
- Context: H7 reports that knots are rare at the lowest energies of other systems. In the 3D oscillator a composite 3₁#3₁ was seen at N = 4. That is a different system, but a reader may ask the analogous least-level question.

### (4b) "Polynomial knots times e^{−r/n} are not hydrogen states": NO PRIOR FOUND as a stated proposition; the content is close to textbook

- That P e^{−r/n} ∈ H_n iff P is harmonic and homogeneous of degree n − 1 is the characterisation of the l = n − 1 (circular, radially nodeless) states r^{n−1}Y_{n−1}^m e^{−r/n}, which are standard. The "only if" direction, stated and proved as here, was not found in print.
- No published work was found claiming that the optical polynomials times e^{−r/n} *are* hydrogen states.
- So this is not the refutation of a literature claim. It refutes the authors' own working guess, which the manuscript already says ("corrects a guess one of us made").
- It also answers, for one narrow class, the question H10 leaves open: when a knot-classifying map is a wavefunction.

## What the status table (Table 4) should say

Replace the last row ("Novelty of the lowered levels … Not established") with these rows:

| Claim | Where | Status |
|---|---|---|
| Hydrogen trefoil and Hopf link at n = 4 (Berry 2001: n = 7, n = 6) | §4, Table 1 | No prior found (forward citations of Berry 2001 and of Enciso–Hartley–Peralta-Salas 2018 through OpenAlex, and keyword and web searches, 25 Oct 2026; arXiv full text not yet searched). Enciso–Hartley–Peralta-Salas 2018 expect "high n … for the trefoil knot he needs at least n = 7" |
| Twist carried by the perturbation's own m | Proposition 6 | The structure is that of the Milnor polynomials u^p − v^q of optical vortex knots (Dennis et al. 2010); new here in a single hydrogen level |
| Level formula n_G(p, q) | Corollary 7 | No prior found; upper bound under hypotheses checked case by case |
| H₂ holds no knot or link; P e^{−r/n} ∈ H_n iff harmonic homogeneous of degree n − 1 | Propositions 2, 4 | Proved; no prior statement found; elementary (the second characterises the circular l = n − 1 states) |
| The least level of each knot; knots in H₃; non-torus knots; the GPU kernel; a native picture | — | Not established |

The last sentence of the abstract would then read: "No earlier hydrogen knot below Berry's levels was found in a forward-citation search of Berry 2001 and of Enciso, Hartley and Peralta-Salas 2018; the twist-in-the-perturbation structure is that of the Milnor polynomials of optical vortex knots."

In §1, the sentence "no forward-citation search has yet been made" would become "a forward-citation search (25 October 2026, OpenAlex; arXiv full text pending) found none."

In §2.1 or §3.2, add one sentence: the n = 4 construction is the hydrogen analogue of u² − v³ (Dennis et al. 2010), with the m = 0 loop as u² and the twisting label as v³.

## Open before print

1. An arXiv full-text search, which could not run because of rate limits.
2. A Google Scholar "cited by" pass on Berry 2001: about 43 records there against OpenAlex's 40.
3. Read Berry–Dennis 2001's appendices and §4 onward, to confirm they never perturb with a threading term. KNOTS.md read §§1–3 only.
4. Read Berry 2001's closing "recipe for any torus knot" paragraph again, specifically for any remark on twisted perturbations.
