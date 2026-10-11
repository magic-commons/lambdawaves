#!/usr/bin/env node
/* tools/orbital-library.mjs — THE GENERATOR IS THE APP (0.4.0 S4a · PLAN B2, F5), and THE SECTIONS (S4b).  It runs the SHIPPED
 * solver in node — the worker's own exported ops, lab/mathworker.js chemGround → chemSpectrum → chemStates / chemStateVectors,
 * which are ensureSolve → lab/rhf-molecule.js moleculeRHF at its defaults → lab/rpa-inspector.js rpa → the canonical gauge — and
 * writes what they answered as a record: lab/library/<sha-256 of the file>.json, plus the catalogue lab/library.json that
 * lab/molecules.js reads.  No second implementation exists to drift: a record IS the worker's reply, re-encoded.
 *
 *   node tools/orbital-library.mjs                 write every record and the catalogue; delete a record file no row reaches
 *   node tools/orbital-library.mjs --check         write nothing; exit 1 unless every byte on disk is what this writes, every
 *                                                  record validates (lab/library.js), every entry passes THE GATE (below), and
 *                                                  lab/library/ holds nothing else
 *   node tools/orbital-library.mjs --only a,b      re-solve only these ids; every other row is re-hashed from disk (with or
 *                                                  without --check — a write keeps the other records byte for byte)
 *   node tools/orbital-library.mjs --gate          THE GATE's verdict on every candidate, in order, and nothing else
 *   node tools/orbital-library.mjs --inputs FILE   the atoms (bohr) of every entry the gate passes, for tools/library/record-oracle.py
 *
 * THE RECORD (schema 1; lab/library.js validateRecord is the reader's law and readers ignore members they do not know):
 *   input     the atoms in bohr exactly as lab/molecules.js moleculeAtoms gives them, the charge, the basis and its file hash
 *   caps      { orbitals, states, rpa, tdhf } — ORBITAL needs ε and C (always); RPA sticks are stored (always); STATES needs the
 *             stored CIS ladder (X is d² doubles: benzene 315² = 794 KB, lysine 960² = 7.4 MB, so it is per entry); TDHF needs
 *             the live ERI and is offered only where the molecule is under the live cap (the integrals are never stored)
 *   ground    chem.ground's reply minus its clocks (names.ms, timings): energy, ε, nocc, nAO, the AO order, the basis hash,
 *             the stability verdict, the solutions, the dipole, the names (lab/names.js, S1) — what MOLECULES and MO-REGISTRY read
 *   orbitals  ε, C (the canonical gauge) and D as f64; spectrum: the RPA sticks and the TDA ladder; states: the canonical ladder
 *   stem      the STEM fields (R-L4): formula, point group and frame, mass, charge and multiplicity, dipole, HOMO–LUMO gap,
 *             geometry source, InChIKey and PubChem CID (checked against PubChem: tools/library/pubchem-ids.json), a two-line
 *             blurb, the curated IEs, the sources — and (S4b, ledger C5) `symmetry`: the molecule's full point group, the group
 *             its orbitals are labelled in BY PROJECTION (lab/names.js at generation: the declared operations, D(R) on the AOs,
 *             Σ_k c_kᵀ S D c_k per level, decomposed against the table), the frame (names.js CONVENTION), the atoms in that
 *             frame, and PySCF's own topgroup / groupname — recorded, never used as a name
 *   page      the molecule's page, lab/latex-state.js moleculeLatex — what EDIT › COPY writes
 *   oracle    an independent energy (PySCF on the same vendored decimals and the same atoms) and the app's distance from it
 *             (≤ 1e-8 Eh, or no record) — tests/fixtures/oracles/library-v1.json, written by tools/library/record-oracle.py
 * Numbers that a clock moves are never written, so --check is byte-exact on one machine; typed arrays are base64 of
 * little-endian bytes, exact.
 *
 * THE GATE (BRIEF-S4-LIBRARY §S4b; Josh: "Don't try to go for too many variations of the same molecule, try to be as diverse as
 * possible").  In order — the six sections in the page turner's order, each in its declared order — a candidate passes if its
 * formula (Hill, with its charge) is new AND it brings a new element, a new point group, or a new tag from the fixed motif list
 * (ring:n, peptide bond, d-block, cluster, cage, nucleobase) — OR it belongs to a declared family (the amino acids, the
 * nucleobases: Leu and Ile share a formula and the family keeps both).  The live table (lab/molecules.js, its declared groups and
 * the motifs below) is what came before the first candidate; only a passing candidate seeds novelty.  A candidate that fails is
 * not built: the gate decides what ships, and the refused stay listed here with the reason the gate prints. */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chemRegister, chemGround, chemSpectrum, chemStates, chemStateVectors, chemOpen, chemSolverCalls } from '../lab/mathworker.js';
import { BASIS_FILES } from '../lab/rhf-molecule.js';
import { ANGSTROM } from '../lab/md.js';
import { MOLECULES, MOLECULE_BY_ID, SECTIONS, COST, eriWork, rpaWork, counts, CAP_MS } from '../lab/molecules.js';
import { CURATED_IE, CONVENTION, operations, frameOf, nameOrbitals, characters, coreCount } from '../lab/names.js';
import { basisFrom, nuclearRepulsion } from '../lab/md.js';
import { evaluator } from '../lab/molecular-field.js';
import { moleculeLatex, stemOf, EV } from '../lab/latex-state.js';   // 0.5.1 D2: the stem's solve-decided members are the lab head's own composition
import { validateRecord, recordPath, SCHEMA, atomsKey as geometryKey } from '../lab/library.js';

const ROOT = new URL('../', import.meta.url), at = (rel) => fileURLToPath(new URL(rel, ROOT));
const LAB = at('lab/'), CATALOGUE = LAB + 'library.json';
const CENSUS_FILE = 'research/release-0.4.0/library-census/census.json', ORACLE_FILE = 'tests/fixtures/oracles/library-v1.json', IDS_FILE = 'tools/library/pubchem-ids.json';
const args = process.argv.slice(2), CHECK = args.includes('--check'), GATE_ONLY = args.includes('--gate');
const argOf = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);
const ONLY = argOf('--only') ? new Set(argOf('--only').split(',')) : null, INPUTS = argOf('--inputs');
const json = (rel) => JSON.parse(readFileSync(at(rel), 'utf8'));
const CENSUS = new Map(json(CENSUS_FILE).rows.map((r) => [r.id, r]));
const ORACLE = existsSync(at(ORACLE_FILE)) ? json(ORACLE_FILE).molecules : {};
const IDS = existsSync(at(IDS_FILE)) ? json(IDS_FILE).molecules : {};

/* ── THE CANDIDATES, in the gate's order.  A row names its geometry (`census`: research/release-0.4.0/library-census/census.json,
   Sol's census, consumed and not redone), its full point group (`group`; C1 when it has none) and, where lab/names.js has no
   table for that group, the subgroup its orbitals are labelled in (`label`); `frame` places the group's axes on the census
   atoms ({ atom: k } from the centre of nuclear charge, { edge: [i, j] } along a bond) — such a row is turned into that frame,
   and `symmetrize` averages it over the group (the shift is stated in its source).  `motifs` are declared from connectivity,
   `family` is the gate's allowance, `stem` carries the identifiers and the two-line blurb. ── */
const S3 = 'sto-3g';
const AA = (id, blurb, more = {}) => ({ id, census: id, section: 'BIO', family: 'amino-acids', group: 'C1', ...more, stem: { blurb } });
const PAST = 'past the 64-AO field tier: generated now, it draws after S4c\'s 128-AO tier lands';
const CANDIDATES = [
  /* ── ORGANIC: the live table's organics; benzene's record (S4a, the proof) is not a candidate for novelty ── */
  { id: 'C6H6', basis: S3, section: 'ORGANIC', live: true, states: true,
    oracle: { file: 'tests/fixtures/oracles/sto-3g-v1.json', path: ['molecules_extended', 'C6H6', 'energy'], what: 'PySCF 2.14 RHF, cart=True, the vendored STO-3G decimals' },
    stem: { blurb: ['The aromatic ring: six carbons, six π electrons in three bonding orbitals, the HOMO a degenerate pair (1e₁g).',
      'Its RHF/STO-3G record is the library\'s proof — the one molecule here that also solves live, so cached = fresh can be measured.'] } },

  /* ── BIO: the twenty amino acids are one family (glycine is live), smallest first; then the five nucleobases ── */
  AA('alanine', ['The smallest chiral amino acid: glycine with a methyl side chain, L-alanine here (the wwPDB ideal coordinates).',
    'One of the three sizing entries of the library (S4b): 37 Cartesian AOs, just past the benzene cap, so it opens from its record.']),
  AA('serine', ['A polar amino acid: a hydroxymethyl side chain (–CH₂OH) on the glycine backbone, the residue kinases phosphorylate.',
    '42 Cartesian AOs; one conformer relaxed by RHF/STO-3G in the census, UNVERIFIED against experiment.'], { mirror: true }),
  AA('cysteine', ['The thiol amino acid: its –CH₂SH side chain makes the disulfide bridges that hold folded proteins together.',
    '46 Cartesian AOs with sulfur\'s 3s3p shell; one conformer relaxed by RHF/STO-3G in the census.'], { mirror: true }),
  AA('proline', ['The ring amino acid: its side chain closes back onto the backbone nitrogen, a pyrrolidine ring that kinks a protein chain.',
    '49 Cartesian AOs; one conformer relaxed by RHF/STO-3G in the census.'], { motifs: ['ring:5'], mirror: true }),
  AA('threonine', ['A second hydroxyl amino acid, with two stereocentres (2S,3R): –CH(OH)CH₃ on the glycine backbone.',
    '49 Cartesian AOs at the wwPDB THR ideal coordinates — a computed reference, UNVERIFIED against experiment.']),
  AA('valine', ['A branched hydrophobic amino acid: an isopropyl side chain, the kind buried in the core of a folded protein.',
    '51 Cartesian AOs; one conformer relaxed by RHF/STO-3G in the census.'], { mirror: true }),
  AA('aspartic-acid', ['An acidic amino acid: a second carboxyl on the side chain (–CH₂COOH), drawn here in its neutral form.',
    '52 Cartesian AOs; one neutral conformer relaxed by RHF/STO-3G in the census — in water it is ionised.']),
  AA('asparagine', ['The amide of aspartic acid (–CH₂CONH₂), where N-linked sugars attach to proteins.',
    '53 Cartesian AOs at the wwPDB ASN ideal coordinates; glycylglycine shares its formula, and the gate refuses that one.']),
  AA('isoleucine', ['A branched hydrophobic amino acid with a second stereocentre (2S,3S); it has the same formula as leucine.',
    '58 Cartesian AOs at the wwPDB ILE ideal coordinates — the family keeps both isomers, and says so.']),
  AA('leucine', ['Isoleucine\'s isomer, its branch one carbon further out (an isobutyl side chain): the commonest residue in helices.',
    '58 Cartesian AOs; one conformer relaxed by RHF/STO-3G in the census — the same formula as isoleucine, a different molecule.']),
  AA('glutamic-acid', ['An acidic amino acid one CH₂ longer than aspartic acid: the brain\'s main excitatory transmitter, and the G of MSG.',
    '59 Cartesian AOs; one neutral conformer relaxed by RHF/STO-3G in the census.'], { mirror: true }),
  AA('glutamine', ['The amide of glutamic acid (–(CH₂)₂CONH₂), the most abundant free amino acid in blood.',
    '60 Cartesian AOs; one conformer relaxed by RHF/STO-3G in the census.'], { mirror: true }),
  AA('methionine', ['The thioether amino acid (–(CH₂)₂SCH₃): its codon AUG starts almost every protein.',
    '60 Cartesian AOs; one conformer relaxed by RHF/STO-3G in the census.']),
  AA('histidine', ['An imidazole side chain whose pKₐ (about 6) sits near the cell\'s pH, so it passes protons in enzyme active sites.',
    '64 Cartesian AOs, the widest field tier today; one neutral tautomer relaxed by RHF/STO-3G in the census.'], { motifs: ['ring:5'] }),
  AA('lysine', ['An essential amino acid: the backbone of glycine with a four-carbon chain ending in a second amine (ε-NH₂).',
    'At 64 Cartesian AOs it fills the field kernel\'s widest tier exactly; past the live cap, it opens only from this record.'], { mirror: true }),
  AA('phenylalanine', ['An aromatic amino acid: a benzyl side chain, benzene\'s π system hung off the backbone.',
    '71 Cartesian AOs, ' + PAST + '.'], { motifs: ['ring:6'] }),
  AA('arginine', ['The most basic amino acid: a guanidino group at the end of a three-carbon chain, drawn here neutral.',
    '74 Cartesian AOs, ' + PAST + '.'], { mirror: true }),
  AA('tyrosine', ['Phenylalanine with a para-hydroxyl: a phenol side chain, the precursor of dopamine and adrenaline.',
    '76 Cartesian AOs, ' + PAST + '.'], { motifs: ['ring:6'], mirror: true }),
  AA('tryptophan', ['The largest amino acid: an indole side chain (a benzene ring fused to a pyrrole), the strongest UV absorber in proteins.',
    '87 Cartesian AOs, the widest record in the library — ' + PAST + '.'], { motifs: ['ring:5', 'ring:6'] }),
  { id: 'uracil', census: 'uracil', section: 'BIO', family: 'nucleobases', group: 'Cs', motifs: ['nucleobase', 'ring:6'],
    stem: { blurb: ['The RNA base that takes thymine\'s place: a pyrimidine ring with two carbonyls, flat, so its σ and π orbitals are a′ and a″.',
      '44 Cartesian AOs at the Psi4 S22 benchmark coordinates (a computed reference), named in C_s by projection.'] } },
  { id: 'cytosine', census: 'cytosine', section: 'BIO', family: 'nucleobases', group: 'C1', motifs: ['nucleobase', 'ring:6'],
    stem: { blurb: ['A pyrimidine base of DNA and RNA, an amino group and a carbonyl on the ring; it pairs with guanine by three hydrogen bonds.',
      '45 Cartesian AOs; built from its connectivity and relaxed by RHF/STO-3G in the census.'] } },
  { id: 'thymine', census: 'thymine', section: 'BIO', family: 'nucleobases', group: 'C1', motifs: ['nucleobase', 'ring:6'],
    stem: { blurb: ['DNA\'s methylated uracil (5-methyluracil); it pairs with adenine by two hydrogen bonds.',
      '51 Cartesian AOs at the Psi4 S22 benchmark coordinates (a computed reference).'] } },
  { id: 'adenine', census: 'adenine', section: 'BIO', family: 'nucleobases', group: 'C1', motifs: ['nucleobase', 'ring:6', 'ring:5'],
    stem: { blurb: ['A purine base, a pyrimidine fused to an imidazole with an amino group — and the A of ATP.',
      '55 Cartesian AOs at the Psi4 S22 benchmark coordinates (a computed reference).'] } },
  { id: 'guanine', census: 'guanine', section: 'BIO', family: 'nucleobases', group: 'C1', motifs: ['nucleobase', 'ring:6', 'ring:5'],
    stem: { blurb: ['A purine base with a carbonyl and an amino group; it pairs with cytosine by three hydrogen bonds.',
      '60 Cartesian AOs; built from its connectivity and relaxed by RHF/STO-3G in the census.'] } },
  { id: 'Gly-Gly', census: 'Gly-Gly', section: 'BIO', group: 'C1', motifs: ['peptide bond'] },
  { id: 'N-methylacetamide', census: 'N-methylacetamide', section: 'BIO', group: 'C1', motifs: ['peptide bond'], formula: '<m>CH₃CONHCH₃</m>',
    stem: { blurb: ['The smallest model of the peptide bond, CH₃–C(=O)–NH–CH₃: the planar amide that links every protein\'s residues.',
      '32 Cartesian AOs, under the live cap, at the Psi4 S66 benchmark coordinates (a computed reference).'] } },
  { id: 'imidazole', census: 'imidazole', section: 'BIO', group: 'C1', motifs: ['ring:5'] },
  { id: 'indole', census: 'indole', section: 'BIO', group: 'Cs', motifs: ['ring:5', 'ring:6'] },
  { id: 'phosphoric-acid', census: 'phosphoric-acid', section: 'BIO', group: 'C1' },
  { id: 'ribose', census: 'ribose', section: 'BIO', group: 'C1', motifs: ['ring:5'] },
  { id: 'caffeine', census: 'caffeine', section: 'BIO', group: 'C1', motifs: ['ring:5', 'ring:6'] },
  { id: 'DMT', census: 'DMT', section: 'BIO', group: 'C1', motifs: ['ring:5', 'ring:6'] },
  { id: 'A-T', census: 'A-T', section: 'BIO', group: 'C1', motifs: ['nucleobase'] },
  { id: 'G-C', census: 'G-C', section: 'BIO', group: 'C1', motifs: ['nucleobase'] },

  /* ── LATTICE: finite clusters and cages only (the solver has no k-points).  Of the four rock-salt cubes the one past the live cap
     comes first: a record is the only road to it (PLAN §10 N2), where Li₄H₄ (24 AO) would merely save a live solve ── */
  { id: 'Li4F4', census: 'Li4F4', section: 'LATTICE', group: 'Td', motifs: ['cluster'], name: 'lithium fluoride cube', formula: '<m>Li₄F₄</m>',
    stem: { blurb: ['A rock-salt cube cut from the LiF crystal: four Li⁺ and four F⁻ on alternating corners, T_d.',
      'One of the three sizing entries (S4b): the smallest piece of an ionic lattice, its edge relaxed by RHF/STO-3G under T_d.'] } },
  { id: 'Li4H4', census: 'Li4H4', section: 'LATTICE', group: 'Td', motifs: ['cluster'] },
  { id: 'Mg4O4', census: 'Mg4O4', section: 'LATTICE', group: 'Td', motifs: ['cluster'] },
  { id: 'Na2Cl2', census: 'Na2Cl2', section: 'LATTICE', group: 'D2h', motifs: ['cluster'] },
  { id: 'ice-hexamer', census: 'ice-hexamer', section: 'LATTICE', group: 'C6h', label: 'C2h', symmetrize: 'C6h', motifs: ['cluster'],
    indicesOnly: 'C₆h\'s E irreps come in complex pairs, for which lab/names.js has no table; in its largest real subgroup, C₂h, each degenerate level is two irreps, so the projection refuses (all or nothing) — this record carries orbital indices and frontier words, not names', name: 'water hexamer ring', formula: '<m>(H₂O)₆</m>',
    stem: { blurb: ['Six waters in a hydrogen-bonded ring, flat (C₆h) as relaxed here — the hexagonal rings of ice are its puckered relative.',
      '42 Cartesian AOs; C₆h\'s degenerate levels have no name in lab/names.js, so its orbitals go by index and frontier word.'] } },
  { id: 'ice-cube', census: 'ice-cube', section: 'LATTICE', group: 'C1', motifs: ['cluster'] },
  { id: 'adamantane', census: 'adamantane', section: 'LATTICE', group: 'Td', frame: { z: { atom: 9 }, x: { atom: 2 } }, symmetrize: true, motifs: ['ring:6', 'cage'], formula: '<m>C₁₀H₁₆</m>',
    stem: { blurb: ['The diamond lattice\'s smallest cage: ten carbons as three fused chair rings, the parent of the diamondoids.',
      '66 Cartesian AOs, ' + PAST + '; relaxed by RHF/STO-3G and averaged onto T_d.'] } },
  { id: 'cubane', census: 'cubane', section: 'LATTICE', group: 'Oh', frame: { z: { edge: [0, 5] }, x: { edge: [0, 1] } }, symmetrize: true, motifs: ['ring:4', 'cage'], formula: '<m>C₈H₈</m>',
    stem: { blurb: ['Eight carbons on the corners of a cube: 90° bond angles, one of the most strained hydrocarbons that can be bottled.',
      '48 Cartesian AOs; relaxed by RHF/STO-3G and averaged onto O_h, its orbitals named in the full octahedral group.'] } },
  { id: 'B12H12--', census: 'B12H12--', section: 'LATTICE', group: 'Ih', motifs: ['cage'], name: 'closo-dodecaborate', formula: '<m>B₁₂H₁₂²⁻</m>',
    stem: { blurb: ['Twelve borons on an icosahedron, each with an outward hydrogen: the dianion is a three-dimensionally aromatic cage.',
      '72 Cartesian AOs, ' + PAST + '; its orbitals named in the full icosahedral group, I_h.'] } },
  { id: 'C20H20', census: 'C20H20', section: 'LATTICE', group: 'Ih', motifs: ['cage', 'ring:5'] },
  /* C₆₀ is carbon's third allotrope and the unit of the fullerite lattice: it sits with the cages (adamantane is diamond's, B₁₂H₁₂²⁻
     boron's), and the gate would refuse it on novelty (I_h, the cage and both ring sizes are in) — so it ships under a DECLARED
     allowance, the milestone Josh named, and its record is S4c's frontier record (PySCF's eight frontier columns, re-encoded) */
  { id: 'C60', census: 'C60', basis: S3, section: 'LATTICE', group: 'Ih', motifs: ['cage', 'ring:5', 'ring:6'], allowance: 'milestone', name: 'buckminsterfullerene', formula: '<m>C₆₀</m>',
    frontier: { dump: 'research/release-0.4.0/library-census/c60-frontier.json', samples: 'research/release-0.4.0/library-census/c60-pyscf-samples.json' } },
  { id: 'neopentane', census: 'neopentane', section: 'LATTICE', group: 'C1' },
  { id: 'naphthalene', census: 'naphthalene', section: 'LATTICE', group: 'C1', motifs: ['ring:6'] },
  { id: 'Si5H12', census: 'Si5H12', section: 'LATTICE', group: 'C1' },
  { id: 'Na4Cl4', census: 'Na4Cl4', section: 'LATTICE', group: 'Td', motifs: ['cluster'] },

  /* ── HEAVY: the Kr row, then the d-block ("try it and let the stability probe decide").  The vendored STO-3G stops at Kr
     (R-L6, measured by the census: lab/vendor/bse carries no I or Xe and basis_set_exchange is not importable) ── */
  { id: 'KrF2', census: 'KrF2', section: 'HEAVY', group: 'Dinfh', name: 'krypton difluoride', formula: '<m>KrF₂</m>',
    stem: { blurb: ['A noble-gas compound: linear F–Kr–F, a fierce fluorinating agent and one of the few krypton compounds known.',
      '29 Cartesian AOs, under the live cap; krypton is the heaviest element the vendored STO-3G carries.'] } },
  { id: 'SeO2', census: 'SeO2', section: 'HEAVY', group: 'C2v' },
  { id: 'KBr', census: 'KBr', section: 'HEAVY', group: 'Cinfv', name: 'potassium bromide', formula: 'KBr',
    stem: { blurb: ['Potassium bromide as one gas-phase ion pair, K⁺Br⁻ — the salt is the window material of infrared spectroscopy.',
      '32 Cartesian AOs, under the live cap; the bond length relaxed by RHF/STO-3G in the census.'] } },
  { id: 'GeCl4', census: 'GeCl4', section: 'HEAVY', group: 'Td' },
  { id: 'TiCl4', census: 'TiCl4', section: 'HEAVY', group: 'Td', motifs: ['d-block'], name: 'titanium tetrachloride', formula: '<m>TiCl₄</m>',
    stem: { blurb: ['A d⁰ transition-metal halide: Ti(IV) in a tetrahedron of chlorines, a volatile liquid and the Ziegler–Natta precursor.',
      'One of the three sizing entries (S4b): 55 Cartesian AOs with a 3d shell on titanium, the first d-block record of the library.'] } },
  { id: 'NiCO4', census: 'NiCO4', section: 'HEAVY', group: 'Td', symmetrize: true, motifs: ['d-block'], name: 'nickel tetracarbonyl', formula: '<m>Ni(CO)₄</m>',
    stem: { blurb: ['Ni(0) with four CO ligands on a tetrahedron: the volatile intermediate of the Mond process that purifies nickel.',
      '59 Cartesian AOs; a closed-shell d¹⁰ metal, relaxed by RHF/STO-3G in the census.'] } },
  { id: 'FeCO5', census: 'FeCO5', section: 'HEAVY', group: 'D3h', symmetrize: true, motifs: ['d-block'], name: 'iron pentacarbonyl', formula: '<m>Fe(CO)₅</m>',
    stem: { blurb: ['Fe(0) at the centre of a trigonal bipyramid of CO ligands — a straw-coloured liquid, and an 18-electron complex.',
      '69 Cartesian AOs, ' + PAST + '; relaxed by RHF/STO-3G and averaged onto D₃h.'] } },
  { id: 'CrCO6', census: 'CrCO6', section: 'HEAVY', group: 'Oh', motifs: ['d-block'], name: 'chromium hexacarbonyl', formula: '<m>Cr(CO)₆</m>',
    stem: { blurb: ['Cr(0) in an octahedron of CO ligands: the textbook 18-electron complex, σ donation and π back-bonding at once.',
      '79 Cartesian AOs, ' + PAST + '; its orbitals named in the full octahedral group.'] } },
  { id: 'ferrocene', census: 'ferrocene', section: 'HEAVY', group: 'D5h', symmetrize: true, motifs: ['d-block', 'ring:5'],
    unstable: 'the stability probe decided (2026-10-08): RHF/STO-3G at the census geometry is NOT a minimum — the app\'s singlet Hessian has lowest A+B −0.0307 and A−B −0.0586 Eh, and PySCF\'s own rhf_stability on the same atoms finds the internal instability too (lowest eigenvalues −0.1229, a degenerate pair, = 4 × A+B); the census\'s "internalStable: true" for this row is contradicted', name: 'ferrocene (eclipsed)', formula: '<m>Fe(C₅H₅)₂</m>',
    stem: { blurb: ['An iron atom sandwiched between two cyclopentadienyl rings — the molecule that opened organometallic chemistry.',
      '79 Cartesian AOs, ' + PAST + '; the eclipsed D₅h sandwich relaxed by RHF/STO-3G in the census.'] } },
  ...['HI', 'CH3I', 'XeF2', 'XeF4', 'I2'].map((id) => ({ id, census: id, section: 'HEAVY', blocked: 'R-L6: the vendored STO-3G stops at Kr (no I, no Xe) and basis_set_exchange is not importable here — measured by the census; nothing is vendored' })),
];

/* the live table's motifs, declared from connectivity like the candidates' (the census's own declarations) */
const LIVE_MOTIFS = { C3H6: ['ring:3'], C4H4O: ['ring:5'], C5H5N: ['ring:6'], C6H6: ['ring:6'], CuH: ['d-block'], ZnH2: ['d-block'] };
const MOTIF = /^(ring:\d+|peptide bond|d-block|cluster|cage|nucleobase)$/, FAMILIES = new Set(['amino-acids', 'nucleobases']);
/* the gate's second exception kind, beside a family: a DECLARED allowance, named and sourced, so the gate stays mechanical */
const GATE_ALLOWANCE = { milestone: 'Josh\'s named milestone — "maybe a bucky-ball as our next milestone" (research/release-0.4.0/NACRE.md l.34, HANDOFF.md §5) — with PLAN §9 R-L2 = YES (its HOMO and LUMO in 0.4.0); entered by the integrator\'s ruling of 2026-10-08, Josh may overrule' };
const DBLOCK = (Z) => (Z >= 21 && Z <= 30);

/* standard atomic weights (IUPAC conventional values), Z ≤ 36 — the vendored STO-3G's reach */
const MASS = [0, 1.008, 4.0026, 6.94, 9.0122, 10.81, 12.011, 14.007, 15.999, 18.998, 20.180, 22.990, 24.305, 26.982, 28.085, 30.974, 32.06,
  35.45, 39.95, 39.098, 40.078, 44.956, 47.867, 50.942, 51.996, 54.938, 55.845, 58.933, 58.693, 63.546, 65.38, 69.723, 72.630, 74.922, 78.971, 79.904, 83.798];
const SYMBOL = ['X', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
  'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr'];
const DEBYE = 2.541746473;                                         // debye per atomic unit of dipole (e·a₀)
const sha = (b) => createHash('sha256').update(b).digest('hex');
const f64 = (a) => ({ $f64: Buffer.from(Float64Array.from(a).buffer).toString('base64') });
const i32 = (a) => ({ $i32: Buffer.from(Int32Array.from(a).buffer).toString('base64') });
const bse = Object.fromEntries(Object.entries(BASIS_FILES).map(([k, f]) => [k, { file: 'lab/vendor/bse/' + f, text: readFileSync(LAB + 'vendor/bse/' + f, 'utf8') }]));
for (const [k, b] of Object.entries(bse)) chemRegister(k, JSON.parse(b.text));
/** Hill order with the charge: the gate's formula key */
function hill(ang, charge) {
  const n = {}; for (const [Z] of ang) n[Z] = (n[Z] || 0) + 1;
  const rank = (Z) => (n[6] ? (Z === 6 ? 0 : Z === 1 ? 1 : 2) : 2);          // carbon first, then hydrogen, when there is carbon
  const keys = Object.keys(n).map(Number).sort((a, b) => rank(a) - rank(b) || SYMBOL[a].localeCompare(SYMBOL[b]));
  return keys.map((Z) => SYMBOL[Z] + (n[Z] > 1 ? n[Z] : '')).join('') + (charge ? (charge > 0 ? '+' : '-').repeat(Math.abs(charge)) : '');
}

/* ── THE GEOMETRY: the census atoms, turned into the declared frame and (where said) averaged over the group ── */
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function geometry(e) {
  if (e.live) { const m = MOLECULE_BY_ID.get(e.id); return { ang: m.ang, charge: m.charge || 0, source: m.source, symmetry: m.symmetry, name: m.name, formula: m.formula, molecule: m }; }
  const c = CENSUS.get(e.census); if (!c) throw new Error(`orbital-library: ${e.id}: no census row '${e.census}'`);
  let ang = c.geometry.atomsAngstrom.map((a) => a.slice()), source = c.geometry.source, note = '';
  if (e.mirror) {                                                  // the census built this one as the D-enantiomer (its builder dropped the SMILES' stereo)
    ang = ang.map(([Z, x, y, z]) => [Z, -x, y, z]);
    note += ' · MIRRORED here (x → −x): the census row is the D-enantiomer — its builder did not keep the SMILES\' stereo (the generator\'s CORN check found it); a reflection leaves every RHF energy and orbital energy unchanged';
  }
  const group = e.label || e.group, P = (a) => [a[1], a[2], a[3]];
  if (e.frame) {                                                   // into the frame: the centre of nuclear charge at 0, the axes x, y, z
    const Ztot = ang.reduce((s, a) => s + a[0], 0), cen = [0, 1, 2].map((q) => ang.reduce((s, a) => s + a[0] * a[q + 1], 0) / Ztot);
    const vec = (f) => (Array.isArray(f) ? f : f.edge ? sub3(P(ang[f.edge[1]]), P(ang[f.edge[0]])) : sub3(P(ang[f.atom]), cen));
    const fr = frameOf(ang.map(([Z, x, y, z]) => ({ Z, x, y, z })), { z: vec(e.frame.z), x: vec(e.frame.x) });
    ang = ang.map(([Z, ...p]) => { const d = sub3(p, fr.c); return [Z, dot3(d, fr.x), dot3(d, fr.y), dot3(d, fr.z)]; });
    note += ` · turned into the ${group} frame (${CONVENTION[group]}), the centre of nuclear charge at the origin — a rigid rotation, the energy unchanged`;
  }
  if (e.symmetrize) {                                              // the average over the group's images: exact symmetry, the shift stated
    const cnh = (n) => [...Array(n).keys()].flatMap((k) => { const c = Math.cos(2 * Math.PI * k / n), s = Math.sin(2 * Math.PI * k / n); return [[c, -s, 0, s, c, 0, 0, 0, 1], [c, -s, 0, s, c, 0, 0, 0, -1]]; });
    const full = e.symmetrize === 'C6h' ? 'C6h' : group, ops = full === 'C6h' ? cnh(6) : operations(group).map((o) => o.R);   // Cₙh = Cₙ × {E, σh}
    const img = (R, p) => [R[0] * p[0] + R[1] * p[1] + R[2] * p[2], R[3] * p[0] + R[4] * p[1] + R[5] * p[2], R[6] * p[0] + R[7] * p[1] + R[8] * p[2]];
    let shift = 0;
    const out = ang.map(([Z, ...p]) => {
      const s = [0, 0, 0];
      for (const R of ops) {
        const q = img(R, p); let best = -1, bd = Infinity;
        ang.forEach(([Zb, ...pb], k) => { if (Zb !== Z) return; const d = Math.hypot(...sub3(pb, q)); if (d < bd) { bd = d; best = k; } });
        if (bd > 1e-3) throw new Error(`orbital-library: ${e.id} is ${bd.toExponential(2)} Å from its group — too far to symmetrize`);
        const back = img([R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]], P(ang[best]));   // Rᵀ applied to the image atom
        for (let q2 = 0; q2 < 3; q2++) s[q2] += back[q2] / ops.length;
      }
      shift = Math.max(shift, Math.hypot(...sub3(s, p)));
      return [Z, ...s];
    });
    ang = out;
    note += ` · averaged over the ${ops.length} operations of ${full} (largest shift ${shift.toExponential(1)} Å), so the declared group holds exactly`;
  }
  const charge = c.charge || 0;
  return { ang, charge, source: source + note, symmetry: { group: group }, name: e.name || c.name, formula: e.formula || '<m>' + hill(ang, 0).replace(/\d+/g, (d) => [...d].map((x) => '₀₁₂₃₄₅₆₇₈₉'[+x]).join('')) + '</m>' };
}

/* ── THE HAND OF AN AMINO ACID: the sense of (carboxyl C, side-chain atom, N) about Cα — the CORN rule — held against the wwPDB's
   L-alanine (the census's alanine row is its ideal coordinates).  The identifiers name L-forms; a D-form geometry is refused. */
const RCOV = { 1: 0.31, 6: 0.76, 7: 0.71, 8: 0.66, 16: 1.05 };
function hand(ang) {
  const P = ang.map((a) => [a[1], a[2], a[3]]), near = (i) => ang.map((_, j) => j).filter((j) => j !== i && Math.hypot(...sub3(P[i], P[j])) < 1.2 * (RCOV[ang[i][0]] + RCOV[ang[j][0]]));
  let cooh = -1, ca;                                                   // the carboxyl whose carbon neighbour carries the amine
  for (let i = 0; i < ang.length && ca === undefined; i++) if (ang[i][0] === 6 && near(i).filter((j) => ang[j][0] === 8).length === 2) { cooh = i; ca = near(i).find((j) => ang[j][0] === 6 && near(j).some((k) => ang[k][0] === 7)); }
  if (ca === undefined) throw new Error('orbital-library: no Cα beside a carboxyl');
  const n = near(ca).find((j) => ang[j][0] === 7), r = near(ca).find((j) => j !== cooh && j !== n && ang[j][0] !== 1);
  if (r === undefined) return 0;                                       // glycine: two hydrogens, no hand
  const u = sub3(P[cooh], P[ca]), v = sub3(P[r], P[ca]), w = sub3(P[n], P[ca]);
  return Math.sign(u[0] * (v[1] * w[2] - v[2] * w[1]) - u[1] * (v[0] * w[2] - v[2] * w[0]) + u[2] * (v[0] * w[1] - v[1] * w[0]));
}
const L_HAND = hand(CENSUS.get('alanine').geometry.atomsAngstrom);

/* ── THE GATE ── */
function gate(cands) {
  const formulas = new Set(), elements = new Set(), groups = new Set(), motifs = new Set();
  for (const m of MOLECULES) {
    formulas.add(hill(m.ang, m.charge)); for (const [Z] of m.ang) elements.add(Z);
    if (m.symmetry.group !== 'C1') groups.add(m.symmetry.group); for (const t of LIVE_MOTIFS[m.id] || []) motifs.add(t);
  }
  return cands.map((e) => {
    if (e.live) return { e, pass: true, why: 'the live table\'s own molecule (its record is not a new entry)' };
    if (e.blocked) return { e, pass: false, blocked: true, why: e.blocked };
    if (e.unstable) return { e, pass: false, blocked: true, probe: true, why: e.unstable };
    const g = geometry(e), key = hill(g.ang, g.charge), els = [...new Set(g.ang.map(([Z]) => Z))];
    const bad = (e.motifs || []).filter((t) => !MOTIF.test(t));
    if (bad.length) throw new Error(`orbital-library: ${e.id}: '${bad.join(', ')}' is not on the fixed motif list`);
    if ((e.motifs || []).includes('d-block') !== els.some(DBLOCK)) throw new Error(`orbital-library: ${e.id}: the d-block tag must say whether a d-block atom is present`);
    const unique = !formulas.has(key), newEls = els.filter((Z) => !elements.has(Z)), newGroup = e.group !== 'C1' && !groups.has(e.group);
    const newMotifs = (e.motifs || []).filter((t) => !motifs.has(t)), fam = e.family && FAMILIES.has(e.family), named = e.allowance && GATE_ALLOWANCE[e.allowance];
    if (e.allowance && !named) throw new Error(`orbital-library: ${e.id}: '${e.allowance}' is not a declared allowance`);
    const pass = fam || !!named || (unique && (newEls.length > 0 || newGroup || newMotifs.length > 0));
    const why = named ? `the declared ${e.allowance} allowance: ${named}` : fam ? `the declared ${e.family} family` + (unique ? '' : ` (shares ${key} — the family keeps it)`)
      : !unique ? `${key} is already in the library`
      : pass ? [newEls.length ? 'new element ' + newEls.map((Z) => SYMBOL[Z]).join(', ') : '', newGroup ? 'new point group ' + e.group : '', newMotifs.length ? 'new motif ' + newMotifs.join(', ') : ''].filter(Boolean).join('; ')
      : `${key}: no new element, point group (${e.group}) or motif (${(e.motifs || []).join(', ') || 'none'})`;
    if (pass) { formulas.add(key); for (const Z of els) elements.add(Z); if (e.group !== 'C1') groups.add(e.group); for (const t of e.motifs || []) motifs.add(t); }
    return { e, pass, why, key };
  });
}

/* ── ONE RECORD ── */
function build(e) {
  const row = geometry(e), charge = row.charge, sym = row.symmetry || { group: 'C1' };
  const atoms = row.ang.map(([Z, x, y, z]) => ({ Z, x: x * ANGSTROM, y: y * ANGSTROM, z: z * ANGSTROM }));   // moleculeAtoms' own arithmetic
  const msg = { atoms, basis: e.basis || S3, charge, symmetry: sym }, basis = msg.basis, t0 = performance.now();
  const g = chemGround(msg), sp = chemSpectrum(msg);
  const st = e.states ? chemStates(msg) : null, X = st ? chemStateVectors({ ks: [...Array(st.count).keys()] }).X : null;
  const ms = performance.now() - t0, n = g.nAO, nocc = g.nocc, d = nocc * (n - nocc);
  if (!g.converged) throw new Error(`orbital-library: ${e.id} did not converge — never a record that fails`);
  if (g.stability && g.stability.minimum === false) throw new Error(`orbital-library: ${e.id}'s RHF reference is not a minimum`);
  const O = ORACLE[e.id], group = e.group || sym.group;
  if (!O || O.key !== atomsKey(atoms)) throw new Error(`orbital-library: ${e.id} has no PySCF oracle on these atoms — run --inputs, then tools/library/record-oracle.py`);
  const oracleE = e.oracle ? e.oracle.path.reduce((o, k) => o[k], json(e.oracle.file)) : O.energy;
  const delta = g.energy - oracleE;
  if (!(Math.abs(delta) <= 1e-8)) throw new Error(`orbital-library: ${e.id} is ${delta} Eh from its oracle — no record`);
  /* the ground as the wire carries it, minus the clocks */
  const { timings, stage, eps, C, D, shells, ...wire } = g, names = { ...wire.names }; delete names.ms;
  if (sym.group !== 'C1' && !names.reliable && !e.indicesOnly) throw new Error(`orbital-library: ${e.id}: the projection named nothing in ${sym.group} — ${names.reason}`);
  const dom = (k) => { const q = []; for (let r = 0; r < d; r++) for (let j = 0; j < 4; j++) { const p = sp.roots[r].dominant[j]; q.push(p ? k(p) : (k === domI || k === domA ? -1 : 0)); } return q; };
  const domI = (p) => p.i, domA = (p) => p.a;
  const S = stemOf({ eps: g.eps, nocc, names }), ie = CURATED_IE[e.id];
  const over = predicted(row.ang, charge) > CAP_MS * 1.02;
  const fr = frameOf(atoms, sym.frame), ids = IDS[e.id] || null;
  const chirality = e.family === 'amino-acids' ? hand(row.ang) : null;
  if (chirality !== null && chirality !== L_HAND) throw new Error(`orbital-library: ${e.id}'s geometry is not the L-form its identifiers name`);
  const record = {
    schema: SCHEMA, kind: 'lambdawaves.orbital-record', id: e.id, basis, name: row.name, formula: row.formula,
    generator: 'tools/orbital-library.mjs — lab/mathworker.js chemGround → chemSpectrum' + (st ? ' → chemStates / chemStateVectors' : '') + ' in node',
    input: { atoms, atomsSha256: geometryKey(atoms), charge, multiplicity: 1, basis, basisFile: bse[basis].file, basisSha256: sha(bse[basis].text), symmetry: sym },
    caps: { orbitals: true, states: !!st, rpa: true, tdhf: !over },
    ground: { ...wire, names },
    orbitals: { eps: f64(g.eps), C: f64(g.C), D: f64(g.D) },
    spectrum: { omega: f64(sp.roots.map((r) => r.omega)), omegaTDA: f64(sp.roots.map((r) => r.omegaTDA)), f: f64(sp.roots.map((r) => r.f)),
      mu: f64(sp.roots.flatMap((r) => Array.from(r.mu))), domI: i32(dom(domI)), domA: i32(dom(domA)), domX: f64(dom((p) => p.x)), domY: f64(dom((p) => p.y)),
      tdaOmega: f64(sp.tda.map((r) => r.omega)), tdaF: f64(sp.tda.map((r) => r.f)), tdaMu: f64(sp.tda.flatMap((r) => Array.from(r.mu))),
      gauge: 'ω and f are gauge-free; inside a DEGENERATE root the μ vectors and the dominant pairs are the eigensolver\'s own basis, not a canonical gauge — compare them as a subspace (the STATES ladder, where stored, is canonical)' },
    ...(st ? { states: { d: st.count, omega: f64(st.omega), f: f64(st.f), mu: f64(st.mu), cluster: i32(st.cluster), size: i32(st.size), pivot: f64(st.pivot), X: f64(X), rMO: f64(st.rMO) } } : {}),
    stem: { formula: row.formula, pointGroup: S.pointGroup, frame: names.frame || null, approximate: !!names.approximate,
      mass: +atoms.reduce((s, a) => s + MASS[a.Z], 0).toFixed(3), massUnit: 'u (IUPAC conventional atomic weights)', charge, multiplicity: 1,
      dipoleDebye: +(Math.hypot(...g.dipole) * DEBYE).toFixed(4),
      gapEh: S.gapEh, gapEv: S.gapEv, homo: S.homo, geometrySource: row.source,
      inchiKey: (ids && !ids.none && ids.inchiKey) || null, pubchemCid: (ids && !ids.none && ids.cid) || null,
      identifiers: !ids ? 'UNVERIFIED: no PubChem identifiers recorded for this entry (tools/library/pubchem-ids.json)' : ids.none ? 'none: ' + ids.none : ids.status || 'UNVERIFIED: not yet asked of PubChem', blurb: e.stem.blurb,
      ...(chirality !== null ? { chirality: 'L at Cα: the sense of carboxyl C → side chain → N about Cα is the wwPDB L-alanine\'s (the CORN rule, checked by the generator)' } : {}),
      ies: ie ? { ev: ie.ev, source: ie.source, status: 'UNCHECKED: entered from memory in S1 (S1-NAMES-BUILD.md); verify against NIST SRD 101 and the LEGAL-PROVENANCE reading before any store build' } : null,
      symmetry: {
        pointGroup: group, labelledIn: names.reliable ? names.group : null, why: e.indicesOnly ? e.indicesOnly + ' (' + names.reason + ')' : names.reliable ? (e.label ? `lab/names.js has no ${group} table: the orbitals are labelled by projection in its subgroup ${e.label}` : 'labelled by projection in the full group (lab/names.js at generation)') : names.reason,
        frame: CONVENTION[sym.group] || null, axes: { x: fr.x, y: fr.y, z: fr.z, centre: fr.c },
        atomsInFrame: atoms.map((a) => { const p = sub3([a.x, a.y, a.z], fr.c); return [a.Z, dot3(p, fr.x), dot3(p, fr.y), dot3(p, fr.z)]; }),
        pyscf: { topgroup: O.topgroup, groupname: O.groupname, orbsymOccupied: O.orbsym && O.orbsym.occupied ? O.orbsym.occupied : null,
          use: 'recorded — PySCF\'s own detection on these atoms and its orbsym (occupied orbitals per irrep of its Abelian groupname, from its own symmetry-adapted SCF), never a name' } },
      sources: ['geometry: ' + row.source, 'energy oracle: ' + (e.oracle ? e.oracle.file : ORACLE_FILE + ' (tools/library/record-oracle.py, PySCF on these atoms)'), 'basis: ' + bse[basis].file + ' (Basis Set Exchange, vendored)',
        ...(e.live ? [] : ['census: ' + CENSUS_FILE + ' row ' + e.census + ' (S4 census, Sol; spot-checked by Claude Sos)'])] },
    page: moleculeLatex({ molecule: row, basis, charge, ground: { energy: g.energy, eps: g.eps, nocc, nAO: n, names } }),
    oracle: { energy: oracleE, source: e.oracle ? e.oracle.file + ' ' + e.oracle.path.join('.') : ORACLE_FILE + ' molecules.' + e.id + '.energy', what: e.oracle ? e.oracle.what : 'PySCF RHF, cart=True, the vendored STO-3G decimals, on the record\'s own atoms in bohr', delta },
  };
  if (pyGroup(O.topgroup) !== group) throw new Error(`orbital-library: ${e.id}: declared ${group}, PySCF detects ${O.topgroup} on the same atoms`);
  const text = JSON.stringify(record, null, 1) + '\n', bytes = Buffer.from(text), hash = sha(bytes);
  const bad = validateRecord(JSON.parse(text));
  if (bad.length) throw new Error(`orbital-library: ${e.id} fails validation — ${bad.join('; ')}`);
  /* the record opens through the worker's own chem.open with no solver call, and answers what it was made from */
  const before = chemSolverCalls(), lib = JSON.parse(text), t1 = performance.now(), o = chemOpen({ lib, hash, basis }), openMs = performance.now() - t1;
  if (chemSolverCalls() !== before || o.energy !== g.energy || o.C.some((v, i) => v !== g.C[i])) throw new Error(`orbital-library: ${e.id}'s record does not open to its own solve`);
  const catalogue = { id: e.id, basis, hash, bytes: bytes.length, section: e.section, nAO: n, nocc, caps: record.caps, ...contract(row.source, record.oracle, 'MEASURED'),
    ...(e.live ? {} : { molecule: { name: row.name, formula: row.formula, charge, symmetry: sym, source: row.source, ang: row.ang } }) };
  return { text, hash, catalogue, ms, openMs, nAO: n, d, energy: g.energy, delta };
}
const pyGroup = (g) => ({ Dooh: 'Dinfh', Coov: 'Cinfv' }[g] || g);
/* THE CONTRACT (0.5.4 P3 · PLAN §D-1): what a catalogue row says about itself without opening a 1.2 MB record — its oracle, the
 * class of its geometry and a per-quantity status.  ONE classifier; the source strings it matches are written beside it (row.source,
 * as the record's stem.geometrySource holds it), and an unmatched source THROWS — never a silent UNKNOWN.  The app writes MEASURED
 * (its solve against PySCF, δ ≤ 1e-8 Eh) or IMPORTED (PySCF's own number, δ = 0 by construction: C₆₀); never CERTIFIED, which is a
 * mathematical judgment only a pilot-signed member may carry.  derivatives are UNKNOWN: nothing here computes them.
 *   experimental        'CCCBDB experimental …' (benzene) · 'NIST CCCBDB experimental …' (TiCl₄)                                    2
 *   optimised-here      'optimised here, UNVERIFIED against experiment; …'                                                       26
 *   computed-reference  'wwPDB Chemical Component Dictionary … ideal reference coordinates' · 'https://raw.githubusercontent.com/psi4/…'   9
 *   draft               'DRAFT GEOMETRY, NOT A MEASUREMENT: …' (C₆₀)                                                              1 */
const GEOMETRY_CLASSES = [['experimental', /^(NIST )?CCCBDB experimental /], ['optimised-here', /^optimised here, UNVERIFIED/],
  ['computed-reference', /^(wwPDB Chemical Component Dictionary |https:\/\/raw\.githubusercontent\.com\/psi4\/)/], ['draft', /^DRAFT GEOMETRY/]];
const contract = (source, o, energy) => {
  const c = GEOMETRY_CLASSES.find(([, re]) => re.test(source));
  if (!c) throw new Error(`orbital-library: no geometry class matches the source "${source.slice(0, 80)}…" — add it to GEOMETRY_CLASSES`);
  return { oracle: { what: o.what, delta: o.delta }, geometry: c[0], status: { energy, geometry: c[0], derivatives: 'UNKNOWN' } };
};
/** the key the oracle file holds for the atoms it was computed on: a mismatch means the oracle is stale */
function atomsKey(atoms) { return geometryKey(atoms).slice(0, 16); }
/** the live-cost prediction for a molecule lab/molecules.js does not list (lab/molecules.js does the same for its rows) */
function predicted(ang, charge) { const c = counts(ang), nocc = (c.nElec - charge) / 2; return COST.a * eriWork(c.widths) + COST.b * rpaWork(c.nAO, nocc) + COST.c; }

/* ── the run ── */
const order = (e) => SECTIONS.indexOf(e.section);
if (CANDIDATES.some((e) => order(e) < 0)) throw new Error('orbital-library: a candidate names no section of lab/molecules.js SECTIONS');
const verdicts = gate([...CANDIDATES].sort((a, b) => order(a) - order(b)));
if (GATE_ONLY) {
  for (const v of verdicts) console.log(`${v.pass ? 'PASS   ' : v.probe ? 'PROBE  ' : v.blocked ? 'BLOCKED' : 'REFUSE '} ${v.e.section.padEnd(9)} ${v.e.id.padEnd(18)} ${v.why}`);
  console.log(`THE GATE: ${verdicts.filter((v) => v.pass).length} pass, ${verdicts.filter((v) => !v.pass && !v.blocked).length} refused, ${verdicts.filter((v) => v.blocked && !v.probe).length} blocked by the basis, ${verdicts.filter((v) => v.probe).length} refused by the stability probe`); process.exit(0);
}
const ENTRIES = verdicts.filter((v) => v.pass).map((v) => v.e), FIX = argOf('--fixture');
if (INPUTS) {
  const rows = (FIX ? [fixtureEntry(FIX)] : ENTRIES.filter((e) => !e.frontier && (!ONLY || ONLY.has(e.id)))).map((e) => {
    const g = geometry(e), atoms = g.ang.map(([Z, x, y, z]) => ({ Z, x: x * ANGSTROM, y: y * ANGSTROM, z: z * ANGSTROM }));
    return { id: e.id, charge: g.charge, group: e.group || g.symmetry.group, key: atomsKey(atoms), atoms: atoms.map((a) => [a.Z, a.x, a.y, a.z]) };
  });
  writeFileSync(INPUTS, JSON.stringify({ basis: 'lab/vendor/bse/sto-3g-v1.json', unit: 'bohr', rows }, null, 1) + '\n');
  console.log(`orbital-library: ${rows.length} inputs → ${INPUTS}`); process.exit(0);
}
/* ── 0.4.0 S4c · THE TEST FIXTURES (S4c's own road, beside the catalogue: never ENTRIES, never the gate, never lab/library.json) ──
 *   node tools/orbital-library.mjs --fixture tryptophan [--check]      (and C20H20)
 * ONE schema-1 record by the same build() above, from a census row at C1 — its PySCF oracle on these atoms first
 * (`--inputs F --fixture id`, then tools/library/record-oracle.py) — written to tests/fixtures/record-<id>.json: the 87- and 120-AO
 * inputs the cap-128 χ tier is checked against (tools/perf/s4c-kernel.mjs).  Never shipped.  `--check` re-solves and compares the
 * bytes.  S4b's tryptophan record supersedes the first as content; C₂₀H₂₀ is refused by the gate and stays a fixture only. */
function fixtureEntry(id) {
  const row = CENSUS.get(id);
  if (!row || !row.converged || !row.geometry || !Array.isArray(row.geometry.atomsAngstrom)) throw new Error(`orbital-library: no converged census row '${id}'`);
  return { id, census: id, section: 'S4C-FIXTURE', group: pyGroup(row.topgroup || 'C1'), label: 'C1', fixture: true,   // its full group is PySCF's, recorded; labelled C1 here
    stem: { blurb: [row.name + ' at ' + row.nAO_STO3G + ' Cartesian AOs: an input for the field kernel\'s cap-128 tier (0.4.0 S4c), not library content.',
      'Point group taken as C1 here; the energy agrees with PySCF on these atoms (tests/fixtures/oracles/library-v1.json) or there is no file.'] } };
}
/* ── 0.4.0 S4c · THE FRONTIER RECORD (S4c's own road: a separate function, never ENTRIES, never the gate) ──────────────────
 * C₆₀ is 300 AOs: no live road solves it and no χ tile holds its density, so its record is PySCF's, re-encoded — Sol's dump
 * research/release-0.4.0/library-census/c60-frontier.json (PySCF 2.14 direct RHF on the vendored STO-3G decimals, the HOMO set
 * h_u ×5 and the LUMO set t1u ×3 ALREADY in the app's AO order and normalisation, its water conversion proof inside at
 * 1.03e-12).  caps: orbitals ONLY — ε for all 300 and the eight frontier columns (`ground.cols`), no D, no spectrum, no
 * states; the field draws them through ORB_WGSL.  The geometry is Sol's DRAFT (equal-edge ideal I_h, experimental status
 * UNVERIFIED) and the record says so; the I_h names are 0.4.1 BUCKYBALL, so the levels are named by energy only.
 * Checked here or there is no file: the basis file's sha-256 is the dump's, the app's own AOs (md.js basisFrom +
 * molecular-field.js evaluator) contracted with the columns answer PySCF's GTOval_cart at Sol's 92 points
 * (c60-pyscf-samples.json) to ≤ 1e-10, and every level's spread is under names.js's 2e-10 Eh. */
function buildFrontier(e) {
  const read = (p) => JSON.parse(readFileSync(fileURLToPath(new URL('../' + p, import.meta.url)), 'utf8'));
  const F = read(e.frontier.dump), P = read(e.frontier.samples), b0 = bse[e.basis || S3];
  if (F.basis.sha256 !== sha(b0.text)) throw new Error(`orbital-library: ${e.id}'s dump was made on another basis file`);
  const ang = F.geometry.atomsAngstrom, atoms = ang.map(([Z, x, y, z]) => ({ Z, x: x * ANGSTROM, y: y * ANGSTROM, z: z * ANGSTROM }));
  const b = basisFrom(atoms, JSON.parse(b0.text), { cart: true }), n = b.n, eps = F.solver.orbitalEnergiesEh, nocc = F.solver.occupations.filter((o) => o === 2).length;
  const sets = [F.frontier.HOMO, F.frontier.LUMO], cols = sets.flatMap((s) => s.indices), cs = sets.flatMap((s) => s.coefficientColumns), m = cols.length;
  if (eps.length !== n || cs.some((c) => c.length !== n) || !F.solver.converged) throw new Error(`orbital-library: ${e.id}'s dump does not fit ${n} AOs`);
  const ev = evaluator(b.shells); let worst = 0;
  P.pointsBohr.forEach((p, q) => { const a = ev.ao(p); cs.forEach((c, j) => { let s = 0; for (let i = 0; i < n; i++) s += c[i] * a[i]; worst = Math.max(worst, Math.abs(s - P.signedValues[q][j])); }); });
  if (!(worst <= 1e-10)) throw new Error(`orbital-library: ${e.id}'s columns on the app's AOs miss PySCF's orbital by ${worst} — the AO order or normalisation is not the app's`);
  const C = new Float64Array(n * m); cs.forEach((c, j) => { for (let i = 0; i < n; i++) C[i * m + j] = c[i]; });   // row-major n × m, as C is n × n
  const names = nameOrbitals({ atoms, eps, nocc, basis: b, converged: true }, null), ch = characters({ atoms, basis: b }, names);
  names.mos.forEach((mo, i) => { mo.character = ch[i]; }); names.core = Math.min(coreCount(atoms), nocc); delete names.axes; delete names.ms;
  names.reason = 'C₆₀\'s I_h names are 0.4.1 BUCKYBALL (Sol computed and checked them: HOMO 6h_u, LUMO 7t₁u); here the levels are named by energy';
  for (const s of sets) if (!(s.energySpreadEh < 2e-10)) throw new Error(`orbital-library: ${e.id}'s ${s.irrep} set spreads ${s.energySpreadEh} Eh`);
  const ids = IDS[e.id] || null, half = atoms.reduce((s, a) => Math.max(s, Math.abs(a.x), Math.abs(a.y), Math.abs(a.z)), 0) + 6, gap = eps[nocc] - eps[nocc - 1];
  const source = `DRAFT GEOMETRY, NOT A MEASUREMENT: ${F.geometry.why} (${F.geometry.source}; experimental status ${F.geometry.experimentalStatus})`;
  const molecule = { name: e.name, formula: e.formula, charge: 0, symmetry: { group: 'C1' }, source, ang };
  const ground = { energy: F.solver.energyEh, Enuc: nuclearRepulsion(atoms), nocc, nAO: n, order: b.order, hash: b.hash, basis: e.basis, charge: 0,
    electrons: 2 * nocc, converged: true, dipole: [0, 0, 0], half, stability: null, solutions: [], names, cols };
  const record = {
    schema: SCHEMA, kind: 'lambdawaves.orbital-record', id: e.id, basis: e.basis, name: e.name, formula: e.formula,
    generator: 'tools/orbital-library.mjs buildFrontier — PySCF\'s orbitals re-encoded (' + e.frontier.dump + '); no app solve: 300 AOs are past every live road',
    input: { atoms, atomsSha256: geometryKey(atoms), charge: 0, multiplicity: 1, basis: e.basis, basisFile: b0.file, basisSha256: sha(b0.text), symmetry: molecule.symmetry },
    caps: { orbitals: true, states: false, rpa: false, tdhf: false },
    ground, orbitals: { eps: f64(eps), C: f64(C) },
    stem: { formula: e.formula, pointGroup: null, frame: null, approximate: false, mass: +atoms.reduce((s, a) => s + MASS[a.Z], 0).toFixed(3), massUnit: 'u (IUPAC conventional atomic weights)',
      charge: 0, multiplicity: 1, dipoleDebye: 0, gapEh: gap, gapEv: +(gap * EV).toFixed(4), homo: `HOMO (${F.frontier.HOMO.irrep} ×5) · LUMO (${F.frontier.LUMO.irrep} ×3)`, geometrySource: source,
      inchiKey: (ids && ids.inchiKey) || null, pubchemCid: (ids && ids.cid) || null, identifiers: ids ? ids.status || 'UNVERIFIED: not yet asked of PubChem' : 'UNVERIFIED: no PubChem identifiers recorded (tools/library/pubchem-ids.json)',
      symmetry: { pointGroup: e.group, labelledIn: null, why: 'a FRONTIER record (S4c): its levels are named by energy only — C₆₀\'s I_h names are 0.4.1 BUCKYBALL (lab/names.js has the I_h table; this record carries 8 columns, not the whole C the projection needs)',
        frame: CONVENTION.Ih, atomsInFrame: null, pyscf: null, allowance: GATE_ALLOWANCE[e.allowance] || null },
      blurb: ['Sixty carbons on a truncated icosahedron: the HOMO a five-fold h_u set, the LUMO a three-fold t₁u set — eight orbitals drawn by the field\'s orbital-only kernel.',
        'Its density, its I_h names and a geometry checked against experiment are 0.4.1 BUCKYBALL; this record carries the frontier orbitals only.'],
      ies: null, sources: ['geometry: ' + source, 'orbitals and energy: ' + e.frontier.dump + ' (PySCF ' + F.solver.pyscf + ', ' + F.solver.method + ')', 'field check: ' + e.frontier.samples, 'basis: ' + b0.file + ' (Basis Set Exchange, vendored)'] },
    page: moleculeLatex({ molecule: { id: e.id, ...molecule }, basis: e.basis, charge: 0, ground: { energy: ground.energy, eps, nocc, nAO: n, names } }),
    oracle: { energy: F.solver.energyEh, source: e.frontier.dump + ' solver.energyEh', what: 'PySCF ' + F.solver.pyscf + ' — the record IS PySCF\'s; its check is the field at Sol\'s 92 points', delta: 0, fieldMaxAbsErr: worst },
  };
  const text = JSON.stringify(record, null, 1) + '\n', bytes = Buffer.from(text), hash = sha(bytes);
  const bad = validateRecord(JSON.parse(text));
  if (bad.length) throw new Error(`orbital-library: ${e.id} fails validation — ${bad.join('; ')}`);
  const before = chemSolverCalls(), t1 = performance.now(), o = chemOpen({ lib: JSON.parse(text), hash, basis: e.basis }), openMs = performance.now() - t1;
  if (chemSolverCalls() !== before || o.energy !== ground.energy) throw new Error(`orbital-library: ${e.id}'s frontier record does not open to its own energy with 0 solver calls`);
  const catalogue = { id: e.id, basis: e.basis, hash, bytes: bytes.length, section: e.section, nAO: n, nocc, caps: record.caps, ...contract(source, record.oracle, 'IMPORTED'), molecule };
  return { text, hash, catalogue, ms: 0, openMs, nAO: n, d: 0, energy: ground.energy, delta: 0, fieldErr: worst };
}
if (FIX) {
  const id = FIX, e = fixtureEntry(id), r = build(e);
  const file = fileURLToPath(new URL(`../tests/fixtures/record-${id}.json`, import.meta.url));
  console.log(`${id} · ${r.nAO} AO · d ${r.d} · E ${r.energy.toFixed(12)} (oracle Δ ${r.delta.toExponential(1)}) · ${(r.text.length / 1024).toFixed(1)} KB · generated in ${(r.ms / 1000).toFixed(1)} s · ${r.hash.slice(0, 12)}`);
  if (CHECK) { const same = existsSync(file) && readFileSync(file, 'utf8') === r.text; console.log(same ? `fixture ${id}: in step` : `fixture ${id}: OUT OF STEP`); process.exit(same ? 0 : 1); }
  writeFileSync(file, r.text); console.log('wrote', file); process.exit(0);
}

const out = [], fail = [];
for (const v of verdicts) if (!v.pass) console.log(`${v.probe ? 'refused by the stability probe' : v.blocked ? 'blocked' : 'refused by the gate'}: ${v.e.id} — ${v.why}`);
const disk = existsSync(CATALOGUE) ? JSON.parse(readFileSync(CATALOGUE, 'utf8')) : { rows: [] };
for (const e of ENTRIES) {
  if (ONLY && !ONLY.has(e.id)) {                                      // re-hashed from disk, not re-solved
    const r = disk.rows.find((x) => x.id === e.id && x.basis === (e.basis || S3));
    if (!r) { fail.push(`${e.id}: not in the catalogue on disk`); continue; }
    out.push({ catalogue: r, hash: r.hash, text: readFileSync(LAB + recordPath(r.hash), 'utf8'), skipped: true }); continue;
  }
  let r; try { r = e.frontier ? buildFrontier(e) : build(e); } catch (err) { fail.push(String(err && err.message || err)); console.log('FAILED ' + e.id + ': ' + (err && err.message || err)); continue; }
  out.push(r); if (!CHECK) { mkdirSync(LAB + 'library', { recursive: true }); writeFileSync(LAB + recordPath(r.hash), r.text); }   // written as it lands
  console.log(`${e.id.padEnd(12)} ${e.section.padEnd(9)} ${r.nAO} AO · d ${r.d} · E ${r.energy.toFixed(12)} (oracle Δ ${r.delta.toExponential(1)}) · ${r.catalogue.bytes} B · caps ${Object.entries(r.catalogue.caps).filter(([, v]) => v).map(([k]) => k).join('+')} · generated in ${(r.ms / 1000).toFixed(2)} s · opened in ${r.openMs.toFixed(1)} ms · ${r.hash.slice(0, 12)}`);
}
/* THE LIVE-ONLY ORACLES (0.5.4 P3): a molecule MOLECULES solves live has no row, but PySCF's energy for it is in the fixture, inlined here by id so
 * the app adds no request on boot (lab/molecules.js reads this file already).  Not rows: tests/molecule-head.test pins 38.  No delta — the live
 * solve is what it is compared against, where it runs. */
const SB = json('tests/fixtures/oracles/sto-3g-v1.json'), rowIds = new Set(out.map((r) => r.catalogue.id));
const oracles = Object.fromEntries(MOLECULES.filter((m) => !rowIds.has(m.id)).map((m) => {
  if (!SB.library[m.id]) throw new Error(`orbital-library: ${m.id} solves live and has no oracle in sto-3g-v1.json`);
  return [m.id, { what: `PySCF ${SB.provenance.library.pyscf} RHF, cart=True, the vendored STO-3G decimals, on the menu's own atoms`, energy: SB.library[m.id].energy }];
}));
const catalogueText = JSON.stringify({ schema: SCHEMA, generator: 'tools/orbital-library.mjs', note: 'the catalogue lab/molecules.js reads; each row\'s record is lab/library/<hash>.json — deployed, never precached (sw.js DATA)',
  rows: out.map((r) => r.catalogue), oracles }, null, 1) + '\n';
const want = new Set(out.map((r) => recordPath(r.hash).slice('library/'.length)));
const present = existsSync(LAB + 'library') ? readdirSync(LAB + 'library') : [];
const sizes = SECTIONS.map((s) => { const rs = out.filter((r) => r.catalogue.section === s); return `${s} ${rs.length} records ${rs.reduce((t, r) => t + r.catalogue.bytes, 0)} B`; }).join(' · ');
if (CHECK) {
  for (const r of out) {
    const p = LAB + recordPath(r.hash);
    if (!existsSync(p)) fail.push(`${r.catalogue.id}: ${recordPath(r.hash)} is missing`);
    else if (sha(readFileSync(p)) !== r.hash) fail.push(`${r.catalogue.id}: ${recordPath(r.hash)} does not hash to its name`);
    else if (!r.skipped && readFileSync(p, 'utf8') !== r.text) fail.push(`${r.catalogue.id}: the record on disk is not what the solver writes`);
    else { const bad = validateRecord(JSON.parse(readFileSync(p, 'utf8'))); if (bad.length) fail.push(`${r.catalogue.id}: ${bad.join('; ')}`); }
  }
  for (const r of disk.rows) if (!ENTRIES.some((e) => e.id === r.id)) fail.push(`${r.id}: in the catalogue but not an entry the gate passes`);
  if (!existsSync(CATALOGUE) || readFileSync(CATALOGUE, 'utf8') !== catalogueText) fail.push('lab/library.json is out of step');
  for (const f of present) if (!want.has(f)) fail.push(`lab/library/${f} is reached by no catalogue row`);
  if (fail.length) { console.log('orbital-library: OUT OF STEP — run `node tools/orbital-library.mjs`\n  ' + fail.join('\n  ')); process.exit(1); }
  console.log(`orbital-library: in step — ${out.length} records, ${out.reduce((s, r) => s + Buffer.byteLength(r.text), 0)} B, lab/library.json ${catalogueText.length} B, nothing else in lab/library/; the gate passes every entry\n  ${sizes}`);
} else {
  mkdirSync(LAB + 'library', { recursive: true });
  for (const f of present) if (!want.has(f)) { unlinkSync(LAB + 'library/' + f); console.log('removed lab/library/' + f + ' (no row reaches it)'); }
  writeFileSync(CATALOGUE, catalogueText);
  console.log(`orbital-library: wrote ${out.filter((r) => !r.skipped).length} records (${out.length} in the catalogue) and lab/library.json — now run node tests/pwa.test.mjs --write\n  ${sizes}`);
  if (fail.length) { console.log(`orbital-library: ${fail.length} NOT WRITTEN — the catalogue lists only what was built; fix them and run --only them\n  ` + fail.join('\n  ')); process.exit(1); }
}
