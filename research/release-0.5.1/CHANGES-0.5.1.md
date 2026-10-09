# λWAVES 0.5.1 Informational Update — what changed, in plain words

Josh's ruling (0.5.0 PLAN §9, 2026-10-09): a changelog of just the major feature changes at each release, separate from the tag-generated
`CHANGELOG.md`. This file collects the user-facing changes of 0.5.1 as each row merges; it is finished and mirrored to the vault at the cut. One line
per feature, no code names; the row that brought it in brackets.

- A modulated brightness control can no longer flash the picture: an LFO on EXPOSURE, GAMMA, KNEE or the STAGE ground that would swing the
  picture by a tenth or more faster than three times a second is held to three swings a second, the dial shows the held value, and METERS says
  so (`FLASH GUARD · EXPOSURE 10.0 Hz held to 3/s`) until it calms. Your own hand on a dial, slow or shallow sweeps, and every other control are
  never touched. This guard sees only those four controls; a fast sweep of the register, a kick or the camera is not judged yet. (D10-19)

- On a phone every control is now a real finger target: the transport's buttons and tempo chip are 44 px tall, the small segments and triggers in
  OBSERVER, CAMERA, RENDER, SPECTRUM and SETTINGS are 44 px, and stacked dials have a little more air so two rings never overlap. Desktop and iPad are
  unchanged. The STATE card's momentum kick is called IMPULSE again (the group, its readout `LAST IMPULSE`, the knobs' hints); the trigger still says
  RELEASE. (D10-F)

- The words on the stage, the molecule's formula or the playing states, are now written by MIR's own INFORMATIONAL layer: ink with a soft shade in
  the kit's serif face, sitting still at the top of the free stage between the racks, never under the transport or the TIMELINE; a hand's preset
  still announces itself over them for a moment and fades back. Holding I keeps the words still. The element letters on each nucleus are as they were.
  The old renderer is gone, and the picture costs nothing more while the camera turns. (D1)
