// Prove the adopted bytes against the committed inventory without needing a
// sibling MIR checkout. The upstream adoption tool writes this manifest.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
/* THE PIN (0.4.0 S0 · wave 138).  The checks below hash the adopted files against THIS manifest, so a commit that edits a kit
   file AND rewrites the manifest ("1.4.4", 2026-10-05, a release MIR never cut) passed them.  Each accepted MIR version
   pins the sha-256 of the manifest's own bytes: a forged version fails here, in every checkout and every CI, and a real
   adoption is a visible TWO-file edit — MIR-MANIFEST.json (written by MIR's tools/adopt.mjs) and its row below. */
const ACCEPTED = {
  /* 021 K4 · KIT DAY: MIR 1.5.5, the first shipped 1.5 — the λWAVES lift (alpha.25–33 built here under the retired trickle-down rule,
     folded home and cut as kit commit a7fba3995839, tag v1.5.5), adopted by MIR's tools/adopt.mjs.  From here the kit sentence (CLAUDE.md:6):
     lab/mir is written by adopt.mjs alone, a λWAVES need is an additive door 1.5.6-alpha.N, and each adoption pins its row here. */
  /* 031 · THE KIT IS 1.5.5, LITERALLY (Josh 2026-10-31: "Call this version of MIR 1.5.5"): the twenty doors alpha.1–20 fold into the 1.5.5 cut
     of 2026-10-31 (kit commit 3051daf, tag v1.5.5; the 10-27 lift is tag v1.5.5-lift, its manifest sha f7c96a12a28cc07cf5c4e981e5f79903e9e8f62fe7aaaaec0f35004a4538ebb7).
     A new door continues from 1.5.6-alpha.21. */
  '1.5.5': 'e622ad104cd7832bd802c3f362490a8cdf21565017e0f2f0947f1ec672f1de9d',
  /* 032 TIMELINE REDUX · MIR 1.5.6-alpha.21 … 28 on the clone road (kit branch kit-032 @ 27dadc0, from the 1.5.5 cut): the arrangement's law (the highest lane
     wins, extent, stretch, a curve's steps), the event target (banded options), the timeline's hands (Shift selects and fines, Ctrl shapes), the loop,
     the work lane's face, the route from a clip, the send disarms, the card's × and the bare pop. The cut to a named number is Josh's. */
  '1.5.6-alpha.28': '01d16927392f7f8735d70545e34a4cae605f27057dcdf144b6159ebdb0b1cc11',
  /* 032 · MIR 1.5.6 CUT (Josh 2026-11-01, "Cut the kit as 1.5.6 and push it"): the eight doors as 1.5.6 — kit commit cdf20ae, tag v1.5.6, branch kit-1.5.6 on
     github.com/magic-commons/mir. A new door continues from 1.5.7-alpha.1. */
  '1.5.6': 'de0ac92dda7ab61901efb41c0e6aa4a81b972e60398d769c2ff780b3a344a6c3',
  /* 021 R1 · the first door on the clone road: MIR 1.5.6-alpha.1 (kit commit 7f052d5bd1e2 — a failed resume never arms, core/session.js) */
  '1.5.6-alpha.1': '753de766e65104997d49e8f5f2e8b472f2e6943be81a01f592116b94e4799c82',
  /* 021 I2/I3 · MIR 1.5.6-alpha.2 on the clone road: the keyboard window's panels, MORE KEYS, media keys, RESERVED_BY_BROWSER, the event maps,
     the MIDI door (kit d798ebc + cbd721f), and I3's menubar submenus, checks, radios and glyphs (kit ace143d, dd7f48c, 92674bc) */
  '1.5.6-alpha.2': '4db1788a7fcc489668155216c9bc50fe1c2d75e3e5ce14d45550c43fcfcfacf9',
  /* 021 V1 · MIR 1.5.6-alpha.3 on the clone road (kit 67dcbfc + 7da3c09): registerGlyphs, windowGlyphs, glyph on createWindow / device / trig, windows() hidden,
     the tall-window clamp, fitFree places again, .k-lbl's ellipsis */
  '1.5.6-alpha.3': '17b45f4a38478e05b69998e209ed8d0a2eabc0bd6ed187b92b382e8fbe2b2bc7',
  /* 022 P1 · MIR 1.5.6-alpha.4 on the clone road (kit 4654cb8, 0d98cc8): contextMenu, holdTap / onContext (TAP.hold · TAP.slop), ONE KNOB MENU, --surface-menu-floor,
     the kit's popups on the menu surface, a list row's picture */
  '1.5.6-alpha.4': '2e2ddd2a07c4c6a4eed431c2d5e914a7ea35ff8c8ca550c1ffedd132b6393f39',   // 022 P3 re-pin (kit 0d98cc8: select's repick, a list row's picture)
  /* 022 S1 · MIR 1.5.6-alpha.5 on the clone road (kit 3e6f5cc): RELIEF IS TIGHT (a 1–2 px raise, a grey dark highlight, the shine a hairline,
     SHINE SOFT 0–6, the light lift ≤ 45 %) and THE MENU'S INK (--surface-menu-tint, --surface-menu-edge; the floor on the menubar lists and the hint) */
  '1.5.6-alpha.5': 'b208cdbf993e49fe208d768f7931bdc20d4bf5071de1a9e6031dab7333fe6592',
  /* 022 F1 · MIR 1.5.6-alpha.6 on the clone road (kit 19c89e3, 6a8cd78): THE FIT ROW (.row.fit, row(parent, { fit, cellMin, knob, cls })) and its tokens
     --cell-min --knob-min --knob --knob-max --row-gap */
  '1.5.6-alpha.6': 'f0189191f314c0429f942704403e4c07d1299c1370f3c426f93a688fcb83e4cc',   // 022 F2 re-pin (kit 6a8cd78: the cells stretch, a stretched switch centres its words)
  /* 022 C1 · MIR 1.5.6-alpha.7 on the clone road (kit eef6443): THE SURFACE PARTS (section · knobBank · meter · lamp), one meter in the modulation
     window, macroRail({ face: 'knob' }) · macroKnob, the well and section inner surfaces, --xport-well --xport-section --xport-grid --xport-led(-off) */
  '1.5.6-alpha.7': '59d60b70070060b8b476959944c9839e1c1a34ad5946260be92a5f872daaf38f',   // 022 C2 re-pin (kit a547da5: a face's span, the asked page, values at rest, the one-line foot)
  /* 022 E1 · MIR 1.5.6-alpha.8 on the clone road (kit d5d8149): EVERY DISABLED CONTROL KEEPS ITS HINT (a greyed knob, fader, switch or trigger takes
     the pointer on its root and refuses the press) and FROST is TEXT AUTO (call 14: black ink in light, white in dark as before) */
  '1.5.6-alpha.8': '47c7c8e4108589a1eb91085486ea6634c0f4b8ca0b2aed5ff106378c8ff35801',
  /* 023 D · MIR 1.5.6-alpha.9 on the clone road (kit e826ec2 · 1f094a5 · e4d00e4 · dfd71cb · 3c24473 · 3ce9bc2): BEHIND IS DOTTED (camera sphere and plane model),
     THE FACE TABS WEAR GLYPHS (a keyboard face's icon, the kit glyph keys), THE CHIPS' MOTION (the modulation rail), ONE NOTCH IS ONE BPM (wheelNotches) */
  '1.5.6-alpha.9': 'ee57f02e34595e6199c9b2c9583962537add9f31e0579b280f940d469eb6dc69',   // D4 re-pin (kit 3ce9bc2: the wheel is bindTempoField's, the modulation window's own tempo too)
  /* 023 B1 · MIR 1.5.6-alpha.10 on the clone road (kit 0272f11): THE PILLS ON CALL (createRackPills().show(), rack.showPills() — λWAVES' EXPAND ALL) */
  '1.5.6-alpha.10': '16b410f1039f9795ee18f2365aca0aa109743bc9e5c22241efda442dade055c8',
  /* 023 R7 · MIR 1.5.6-alpha.11 on the clone road (kit c18957a): THE WORDS LAND (viewChanged({ land: true }) — the stage words' re-seat lands at once) */
  '1.5.6-alpha.11': 'fe6f4b26077f40194675d7d6d0920d13a3f966507826d8b747c33b88b785c6ea',
  /* 025 A1 · MIR 1.5.6-alpha.12 on the clone road (kit 6b3c933): THE AUDIO TRACK IN THE MUXER (mp4Parts({ audio }): mp4a+esds or Opus+dOps, elst + roll, interleaved chunks) */
  '1.5.6-alpha.12': '0ba21c6108c34fdd540251567ec7c128c6dba7670a9c8552fc49df2eacf2df20',
  /* 025 A2 · MIR 1.5.6-alpha.13 on the clone road: THE MIXDOWN (render/audio-mix.js: mixPlan, mixdown at 48 kHz offline, wavBytes) */
  '1.5.6-alpha.13': 'a0d21aaa63bee654f8cdb359a679892c7f30776df0a7d77e128835ab52541222',
  /* 025 A3 · MIR 1.5.6-alpha.14 on the clone road: THE AUDIO ENCODE (AAC → Opus ladder, the priming measured, store.saveAudio, run({ audio }), PNG audio.wav) */
  '1.5.6-alpha.14': 'f612c7c9eda4ff9a19362cf69ae9b74683335862ccc77f4cf57f7ae6c677dc71',
  /* 025 A4 · MIR 1.5.6-alpha.15 on the clone road: THE AUDIO ROW (the render panel's AUDIO ON · OFF, the estimate names the clips and the codec, the live-microphone refusal said so) */
  '1.5.6-alpha.15': 'b0571eea857a7ef633cc7b9a204802a32cabd46352dd9b54e079f7f114d2a83f',
  /* 025 A5 · MIR 1.5.6-alpha.16 on the clone road: THE ALIGNMENT PROOF (selftest audioAlignment: clicks at beats 0·1·2 within one sample of their frames) */
  '1.5.6-alpha.16': '3908370e824e5a44eb68691c11f6460c907ea50e905d544bb9f1a7a2112f8800',
  /* 025 C3 · MIR 1.5.6-alpha.17 on the clone road: THE EVEN ROWS (the render panel's `even` · `ranges` · `controls.switches`) */
  '1.5.6-alpha.17': 'd4bc54b78ed65730c29f527040f077525e3b440745ee384740b33fb5b4027009',
  /* 029 M2 · M3 · M1 · MIR 1.5.6-alpha.18–.20 on the clone road: A TEXT WRITE KEEPS ITS NODE (setText → characterData), THE MODULATION WINDOW
     WRITES ONLY WHAT CHANGED, THE STAGE RE-INKS ONE MARK (accent.paintInk); adopted once, at .20 */
  '1.5.6-alpha.20': '3f1940761b40e84cf9d6afc19f5166a5469ae3d5d501cf7710b15f26101d78bf',
  '1.4.3': 'a4c3b90102d02dcec420fe97a10dbac2a15d93d88ed5bb5f28977ff29f3d2d23',
  /* 0.5.0 C0 · R5-G1: λWAVES was PINNED to MIR 1.5.0-alpha.24 (kit commit 1b7ae99b9905, line 1.5), adopted by the 1.5 worktree's own
     tools/adopt.mjs */
  '1.5.0-alpha.24': '3f969725fe44715bb96a42fc56d668defc9b9cfceeb4219d146ecd24cad35351' };
const manifestBytes = readFileSync(path.join(root, 'MIR-MANIFEST.json'));
const manifest = JSON.parse(manifestBytes.toString('utf8'));
assert.equal(manifest.kit, 'MIR');
/* 0.5.0 A10 · the canary's red 3: a 1.5 adoption names a pre-release ("1.5.0-alpha.24") and its LINE ("line": "1.5", MIR
   docs/LINES.md).  The shape widens; the pin below does not — a version is accepted only with its manifest's sha-256 in ACCEPTED. */
assert.match(manifest.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z][0-9A-Za-z.-]*)?$/);
if (Object.hasOwn(manifest, 'line')) assert.equal(manifest.line, manifest.version.split('.').slice(0, 2).join('.'), 'MIR-MANIFEST.json: "line" must be its own version\'s major.minor');
const manifestSha = createHash('sha256').update(manifestBytes).digest('hex');
assert.ok(Object.hasOwn(ACCEPTED, manifest.version), 'MIR-MANIFEST.json names MIR ' + manifest.version + ', which is not an accepted adoption (accepted: ' + Object.keys(ACCEPTED).join(', ') + '). A real adoption is a two-file edit: the manifest MIR\'s tools/adopt.mjs writes, and its sha-256 pinned in ACCEPTED in tests/mir-manifest.test.mjs.');
assert.equal(manifestSha, ACCEPTED[manifest.version], 'MIR-MANIFEST.json for MIR ' + manifest.version + ' has sha-256 ' + manifestSha + ', not the pinned ' + ACCEPTED[manifest.version] + '. The manifest was edited without re-adoption; a real adoption is a two-file edit: the manifest MIR\'s tools/adopt.mjs writes, and its pin in ACCEPTED.');
assert.ok(manifest.files && typeof manifest.files === 'object' && !Array.isArray(manifest.files));
/* 021 K4: the kit has one version — the adopted tokens.json names the same kit the manifest does (MIR tests/version.node.mjs holds it at home) */
assert.equal(JSON.parse(readFileSync(path.join(root, 'lab/mir/tokens.json'), 'utf8')).kit, manifest.version, 'lab/mir/tokens.json "kit" is not the adopted MIR version');

function inventory(relative) {
  return readdirSync(path.join(root, relative), { withFileTypes: true }).flatMap(entry => {
    const name = relative + '/' + entry.name;
    if (entry.isDirectory()) return inventory(name);
    assert.ok(entry.isFile(), 'adopted assets must be regular files: ' + name);
    return [name];
  });
}
const files = ['lab/mir', 'lab/fonts'].flatMap(inventory).sort();
assert.deepEqual(Object.keys(manifest.files).sort(), files,
  'MIR inventory must cover every adopted file, with no missing or stale entries');
for (const file of files) {
  assert.match(manifest.files[file], /^[a-f0-9]{16}$/, 'invalid content hash: ' + file);
  const actual = createHash('sha256').update(readFileSync(path.join(root, file))).digest('hex').slice(0, 16);
  assert.equal(actual, manifest.files[file], 'MIR bytes changed without re-adoption: ' + file);
}
console.log(`PASS MIR ${manifest.version}: all ${files.length} adopted files match the committed manifest, and the manifest is the pinned one (sha-256 ${manifestSha.slice(0, 12)}…)`);
