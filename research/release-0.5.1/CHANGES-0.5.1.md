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
