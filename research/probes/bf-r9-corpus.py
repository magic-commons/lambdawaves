#!/usr/bin/env python
"""BF R9 (Opus, QCD) — probe 5: the corpus arithmetic.

Corpus (YMD-DISK-01 COMPENDIUM.md, Y-0138/0139/0140/0151) asserts, all with b_0 = 11/(24 pi^2):
    R = exp(-beta/(8 b_0)) = exp(-C/g^2),   C = 3/(16 b_0) = 9 pi^2/22 = 4.0375654368
    1/(8 b_0) = 3 pi^2/11 = 2.6917102912
    exp(-C/6) = exp(-3 pi^2/44) = 0.5102127044
Test the internal consistency of R = exp(-beta/8b_0) = exp(-C/g^2) under beta = 2N/g^2.
"""
import mpmath as mp
mp.mp.dps = 50

print("="*78); print("BF R9 probe 5 — the corpus's b_0 and C"); print("="*78)

for N in (2, 3):
    b0 = mp.mpf(11)*N/(48*mp.pi**2)
    print("\nSU(%d): b_0 = 11N/(48 pi^2) = %s" % (N, mp.nstr(b0, 12)))
    print("   1/(2 b_0) = %s   [one-loop action: Lambda = mu exp(-1/(2 b_0 g^2))]"
          % mp.nstr(1/(2*b0), 12))
    print("   beta = 2N/g^2 = %d/g^2  ->  a Lambda_L = exp(-beta/(%d b_0)) ; coefficient 1/(%d b_0) = %s"
          % (2*N, 4*N, 4*N, mp.nstr(1/(4*N*b0), 12)))
    print("   3/(16 b_0) = %s" % mp.nstr(3/(16*b0), 12))

b0 = mp.mpf(11)/(24*mp.pi**2)
C_corpus = 9*mp.pi**2/22
C_forced = 1/(2*b0)
print("\n--- SU(2), b_0 = 11/(24 pi^2) = %s (Y-0140's corrected value)" % mp.nstr(b0, 12))
print("   corpus 1/(8 b_0) = 3 pi^2/11 = %s      <-- CORRECT (coefficient of beta)"
      % mp.nstr(1/(8*b0), 12))
print("   corpus C = 3/(16 b_0) = 9 pi^2/22 = %s" % mp.nstr(C_corpus, 12))
print("   FORCED  C = 1/(2 b_0) = 12 pi^2/11 = %s   (from beta = 4/g^2 in exp(-beta/8b_0))"
      % mp.nstr(C_forced, 12))
print("   ratio corpus/forced = %s = 3/8 exactly? %s"
      % (mp.nstr(C_corpus/C_forced, 12), mp.nstr(C_corpus/C_forced - mp.mpf(3)/8, 5)))
print("   the corpus writes 3/(16 b_0) where beta = 4/g^2 forces 8/(16 b_0).")
print("   For 3/(16 b_0) to be right one needs beta = 3/(2 g^2), not 2N/g^2.")

print("\n--- consequence for Y-0138's Delta_C sigma_0 = 0 (Borel lattice of sigma_0 is 2N):")
for nm, C in (("corpus  C = 9 pi^2/22 ", C_corpus), ("forced  C = 12 pi^2/11", C_forced)):
    half = C/2
    near = 2*round(float(half))
    print("   %s = %-14s  C/2 = %-14s nearest lattice point %d, miss %.4f%%"
          % (nm, mp.nstr(C, 10), mp.nstr(half, 10), near, 100*abs(C-near)/near))
print("   => the corrected C is 10.3% from the nearest point 6 x 2 ... let us be exact:")
for C in (C_corpus, C_forced):
    ds = [(abs(C-2*k)/(2*k)*100, 2*k) for k in range(1, 8)]
    m = min(ds)
    print("      C = %-14s nearest 2k = %d, relative miss %.4f%%" % (mp.nstr(C, 10), m[1], m[0]))

print("\n--- the exp(-C/6) 'level-gap residue':")
print("   corpus exp(-C/6) = exp(-3 pi^2/44) = %s" % mp.nstr(mp.e**(-C_corpus/6), 12))
print("   forced  exp(-C/6) = exp(-2 pi^2/11) = %s" % mp.nstr(mp.e**(-C_forced/6), 12))

print("\n--- the corpus's SU(2) strong-coupling gap  a m = -4 log(I_2/I_1) ~ 6/beta (Y-0084):")
for bb in (2, 5, 10, 20, 50, 100):
    s0 = -mp.log(mp.besseli(2, bb)/mp.besseli(1, bb))
    print("   beta=%3d : a^2 sigma = -log(I2/I1) = %.8f ; 4 x that = %.8f ; 6/beta = %.8f"
          % (bb, s0, 4*s0, mp.mpf(6)/bb))
print("   CONFIRMED: 4 sigma_0 -> 6/beta since s_1 = 3/2. (Y-0084 arithmetic stands.)")

print("\n--- the Bessel action in the continuum coupling:")
print("   A = 2 in 1/beta  <=>  exp(-2 beta) = exp(-8/g^2) at beta = 4/g^2.")
print("   corpus C = 4.0376: 8/C = %s   (the 0.94%% 'near-miss to 2' Y-0138 firewalls)"
      % mp.nstr(8/C_corpus, 10))
print("   forced  C = 10.767: 8/C = %s   (no near-miss at all)" % mp.nstr(8/C_forced, 10))
print("   SU(2) one-instanton action 8 pi^2/g^2 = %s /g^2" % mp.nstr(8*mp.pi**2, 10))
print("   => three distinct actions in 1/g^2: Bessel 8, gap %s, instanton %s"
      % (mp.nstr(C_forced, 8), mp.nstr(8*mp.pi**2, 8)))
