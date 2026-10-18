# λWAVES — molecular windows, modulation and stage words (DRAFT)

A draft for Josh, written by the iteration-007 architecture scan (2026-10-18). It is not in the repo root: whether λWAVES keeps a `GLOSSARY.md`, and where, is Josh's call. These terms are the ones the rework (MOLECULES · MO-REGISTRY · INFORMATIONAL, `research/iteration-007/JOSH-PROMPT.md`) will name things by. Three words are overloaded today: **register**, **rung** and **A ↔ B**. Each one is split below, and the _Avoid_ lines say how.

## Windows

**MOLECULES**:
The rack card that picks a molecule, its basis and method, and what the field draws of it. Its saved id is `chem`.
_Avoid_: CHEMISTRY (its old name, still in comments), chem window

**MO-REGISTRY**:
The rack card that holds the two molecular registers, each in its own pane. Its saved id is `orbitals`.
_Avoid_: ORBITALS (old name), the register window

**INFORMATIONAL**:
The rack card that says what the stage writes and how: on/off, size, seat.
_Avoid_: stage text settings, STAGE FORMULA window

**section**:
One page of the molecule library (DIATOMICS · HYDRIDES · ORGANIC · BIO · LATTICE · HEAVY, plus ATOMS). MOLECULES' first picker turns the pages.
_Avoid_: group (that is the dropdown's optgroup), category

**picker**:
A kit stepper that chooses one item (‹ NAME ›). MOLECULES has two of them: the section picker and the molecule picker.
_Avoid_: THE PICKER (that is the app's front page), dropdown

## The molecule

**field owner**:
The model whose numbers the stage's volume currently draws. Inside the molecular session the producers are ranked tdhf > states > orbital-packet > ground.
_Avoid_: active window, current source

**ORBITAL dial**:
MOLECULES' knob that chooses which molecular orbital VIEW ORBITAL draws. It counts upward in ε and starts at the HOMO. Its range is the molecule's own.
_Avoid_: orbital index knob, MO slider

**ladder (orbital ladder)**:
The molecule's orbital energies drawn as levels, occupied ones filled. MO-REGISTRY's ORBITAL pane paints into it.
_Avoid_: spectrum (that is the RPA sticks), level list

**basis ladder**:
The fixed order of basis sets a molecule climbs: STO-3G · STO-6G · 3-21G · 6-31G · 6-31G* · 6-31+G*.
_Avoid_: basis list

**rung**:
One basis set of the basis ladder, as a record of a volume molecule.
_Avoid_: rung for a row of the orbital ladder. Call that a **level** (orbitalsview's `state().rungs` is the stray use).

**record**:
A precomputed solve shipped as data and opened with no solver call.
_Avoid_: cache, preset

**volume**:
A large installable shelf of records (VOL. I …). One volume molecule carries all of its rungs.
_Avoid_: pack, DLC

## Registers

**register (atomic)**:
The 91-label coefficient register of the atom (`state.js`). It is the app's authoritative state in ATOMS mode.
_Avoid_: the state

**ORBITAL register**:
MO-REGISTRY's one-electron packet over the molecule's canonical orbitals. It beats at orbital gaps Δε.
_Avoid_: orbital packet (that is its field model's name), ORBITALS

**STATES register**:
MO-REGISTRY's many-electron register over S₀ and the singlet CIS states. It beats where the spectrum's sticks stand.
_Avoid_: CIS register

**store (A, B)**:
A register's snapshot, kept under the letter A or B.
_Avoid_: slot (a lane slot is different), preset

**MORPH / A ↔ B**:
A register playing the normalised path from store A to store B. Its position runs from 0 (A) to 1 (B). There is one per register: the ORBITAL register's and the STATES register's.
_Avoid_: TRANSITION (the atomic A ↔ B of SPECTRUM, driven by Ω RABI), blend, crossfade

## Modulation and the timeline

**target**:
A dial the modulation registry knows by a dotted id (`chem.kick`, `reg.morph`). Modulators route onto it, and the timeline automates it.
_Avoid_: param, parameter (kit internals), slot

**base**:
A target's hand value, the number the hand owns while a modulator moves it. A saved project keeps the base.
_Avoid_: value, default

**route**:
One modulator driving one target, with its depth.
_Avoid_: binding, link (a link is an `lw:` notebook verb)

**macro**:
A modulator whose value is a dial of its own, routed onto targets.
_Avoid_: knob group

**lane**:
One row of the TIMELINE. A lane holds clips and does not by itself name a target.
_Avoid_: track, automation lane (when the lane itself is meant)

**clip (automation clip)**:
A span on a lane that carries a curve for one target.
_Avoid_: region, segment

**automation**:
The curve values a clip writes onto its target while the timeline plays.
_Avoid_: animation, keyframes

## Stage words

**stage words**:
Everything the stage writes in type: the formula, THE FADE, pop-ups and atom labels.
_Avoid_: stage text, overlay, HUD

**formula**:
The standing block that names what plays: the molecule's formula, or SPECTRUM's states.
_Avoid_: title, caption

**THE FADE**:
A hand's preset announced in the formula's seat for 2.4 s, after which the formula returns.
_Avoid_: banner, toast

**pop-up**:
One short line on the side away from the formula, fading out, said when the hand changes something (BASIS · 6-31G*, + 1b1 · HOMO).
_Avoid_: toast, notification

**announcement kind**:
The class of thing a pop-up or fade reports: basis, method, view, registry add, orbital, rate, style, palette, preset, name. INFORMATIONAL's toggles choose kinds.
_Avoid_: event type, category

**head**:
A molecule's five-line summary (formula and name, energy, occupancy and point group, HOMO, STATUS).
_Avoid_: summary card

**hand**:
A change made by the reader's own press, as opposed to a restore, an undo, a project or a link open. Only a hand announces.
_Avoid_: user action, manual

**caption**:
The one plain-Unicode line an exported picture or film carries in place of the stage words.
_Avoid_: subtitle, watermark

## Scopes

**PREFERENCE**:
The reader's furniture, kept on this device and never written into a project, link or history row.
_Avoid_: setting (overloaded)

**WORKSPACE**:
The window arrangement. It travels with a project, and the device remembers the last one.
_Avoid_: layout (that is one of its keys)

**PROJECT**:
The work: what a save writes and the undo ring reads.
_Avoid_: document, session
