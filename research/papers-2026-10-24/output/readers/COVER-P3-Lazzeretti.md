# Cover note — Paper 3, THE LEAK AND THE REPAIR — to Prof. Paolo Lazzeretti (draft for Josh to send; check the address on the Modena page first)

Dear Professor Lazzeretti,

I am writing to ask whether you would read a short paper, attached, before it goes anywhere public. It comes out of λWAVES, a real-time
instrument I am building that plays molecular orbitals as time-dependent packets, and it was written by an AI system (Claude, "Fable 5.1")
working with me; the byline and the paper say so plainly. Your work on current-density conservation in finite basis sets is the reason I am
asking you.

**What it does.** For a two-orbital RHF packet ψ = (e^{−iε_H t}φ_H + e^{−iε_L t}φ_L)/√2 it writes the continuity defect s = ∂ρ/∂t + ∇·j in closed
form and splits it exactly into two parts: a frozen-exchange term (φ_H Kφ_L − φ_L Kφ_H) and a pointwise Fock-residual term that vanishes in a complete
basis. It then defines the minimal repair current c = ∇φ with −∇²φ = s and proves a wall identity for its net flow: closed walls give the full
dipole rate, open walls give the basis-dependent fraction q, free space gives (2q + 1)/3.

**Numbers.** Water STO-3G: q = −1.32, the exchange part 24 % and the basis part 76 % of the first moment; 6-31G q = 0.72; 6-31G* q = 0.92 (1 − q
falls 2.32 → 0.28 → 0.08). Benzene STO-3G e1g × e2u: 73 % exchange, 27 % basis.

**What is not verified.** No second computation outside PySCF and our own grids; a single reader (me) so far; the discrete identities are checked to
1e-14 and the K/J matrix elements to 1e-5, but nobody independent has rerun them. The status table in the paper says exactly this.

**The one question.** Is the split s = e + b, with e the frozen exchange, already in the literature in this form, and is the wall identity (closed
→ 1, open → q, free → (2q + 1)/3) known? If it is, I would rather cite than claim.

Thank you for your time either way.

Joshua Hosain
Magic Commons
