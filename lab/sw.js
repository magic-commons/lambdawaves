/* sw.js — λWAVES OFFLINE.  The whole lab is local, so the whole lab is precached and the network is never
 * needed again.  Registered by index.html at ./sw.js, so the scope is WHEREVER THE LAB IS SERVED FROM —
 * /lab/ on ./serve.sh, and THE WHOLE ORIGIN at lambdawaves.magic-commons.com, which is the address this
 * app now ships at.  That sentence used to end "so the scope is /lab/ and nothing above it is ours", and
 * §5 enforced it with `startsWith(SCOPE)` — a refusal that refuses NOTHING when SCOPE is "/".  See §5.
 *
 * ── THE ONE LAW ────────────────────────────────────────────────────────────────────────────────────────
 * A NEW BUILD IS NEVER SWAPPED IN UNDER A RUNNING SESSION.  This lab holds unsaved state — a prepared
 * superposition, a notebook page, a layout — and half of an old build talking to half of a new one is the
 * worst failure a cache can cause.  So: no skipWaiting() on install, no clients.claim() ever.  A new worker
 * precaches itself and then WAITS; the old worker keeps serving every byte of the build the session started
 * on until the last tab of that session closes.  The UI is told a build is ready (§5); an untouched session
 * takes it (main.js, rack.js `untouched`), and any other session's USER decides.
 * The price is honest and small: the very first visit runs uncontrolled, so offline works from the SECOND
 * launch onward.  We pay it rather than swap assets under a page that is already running.
 *
 * ── ANTI-PATTERN 6 (docs/ui/ANTI-PATTERNS.md: "a hand-written version in the UI") ──────────────────────
 * There is NO version number here.  §1 is a generated list of [url, content hash]; §2 derives the cache
 * name from those hashes alone.  Change one byte of one file and the hash changes, the cache name changes,
 * and the old cache is collected.  Change nothing and the name is bit-identical — no churn, no stale
 * constant to forget.  A hand-edited `const VERSION` would have gone stale on the first wave that forgot it.
 *
 * ── REGENERATING §1 ────────────────────────────────────────────────────────────────────────────────────
 * `node tests/pwa.test.mjs` walks lab/ itself, re-hashes every file, and FAILS if §1 has a missing entry, a
 * stale entry, or a wrong hash.  `node tests/pwa.test.mjs --write` REWRITES §1 from the directory and then
 * proves the result, so the whole refresh procedure after a wave that touched lab/ is that one command.
 * Without --write it only prints the corrected block, so a gate still fails instead of silently repairing.
 */
'use strict';

/* ── 1. THE PRECACHE — every file under lab/ that the running lab actually loads ────────────────────────
 * [url relative to this worker, first 12 hex of the file's sha-256].  GENERATED — see the header. */
const PRECACHE = [
  ['./ab-patch.json',                                               '5dd0e71d78bf'],
  ['./absorb.js',                                                   '3b0857195bfa'],
  ['./actions.js',                                                  '88d551c6495f'],
  ['./angular-nodes.js',                                            '945796c72ba8'],
  ['./ask.js',                                                      '6e716ccee7ea'],
  ['./atoms.js',                                                    'e132af19a5c8'],
  ['./atomsview.js',                                                '1c5e2acd905f'],
  ['./badges.js',                                                   '450bf312f687'],
  ['./bessel.js',                                                   '0689408ac984'],
  ['./bloch-model.js',                                              '2ffb242ecdbf'],
  ['./bloch.js',                                                    '628d7346cc22'],
  ['./build-line.js',                                               '9ab98af90ecc'],
  ['./busy-mark.js',                                                '73e135b080e2'],
  ['./calculus.js',                                                 '915be59270d6'],
  ['./calculusview.js',                                             '14c1b51d2eda'],
  ['./camera-law.js',                                               'f2fc22d0e16d'],
  ['./canon-gauge.js',                                              'e760a258cd23'],
  ['./capture.js',                                                  '9a4fe540b94a'],
  ['./catalogue.js',                                                '272fd2f38941'],
  ['./central.js',                                                  '0c721b92b0ca'],
  ['./chemview.js',                                                 'eb8a4ed74b2c'],
  ['./chord-audio.js',                                              '015d0dd91a07'],
  ['./clock.js',                                                    '35e6b0ac22aa'],
  ['./context-menus.js',                                            'af4b068753d4'],
  ['./cornell.js',                                                  'd38ee2adee25'],
  ['./csb-favs.js',                                                 '3daf1aaf6183'],
  ['./csb-search.js',                                               '939a2bd20669'],
  ['./csb.css',                                                     'a5570ed910b3'],
  ['./demos/wave-dancer.lambdawaves.json',                          'c8c61c14152c'],
  ['./density.js',                                                  'b7e7f8bde4fb'],
  ['./dft-grid.js',                                                 '4a75ae325355'],
  ['./dynamics.js',                                                 '0821063b67a1'],
  ['./edit-domain.js',                                              'f67311da8412'],
  ['./elements.js',                                                 '3fad3eb4c9ff'],
  ['./emission-map.js',                                             '262d77278b60'],
  ['./emissionview.js',                                             'd384099f998a'],
  ['./eq-audio.js',                                                 '686716c5b301'],
  ['./equalizer.js',                                                'dd4a442671a6'],
  ['./export3d.js',                                                 'd9d9c83c6cd7'],
  ['./field.js',                                                    'fe3ea02e4fbb'],
  ['./film-card.js',                                                '7bad0ead3456'],
  ['./first-run.js',                                                'ebef27ceb60e'],
  ['./flash-law.js',                                                '8f23407a1752'],
  ['./flow-balance.js',                                             '796658f0227d'],
  ['./fold.js',                                                     'fd678bff2827'],
  ['./fonts/LWTitle-title.woff2',                                   '8069abf19624'],
  ['./fonts/Roboto-OFL.txt',                                        '061402327a96'],
  ['./fonts/Roboto-ui.woff2',                                       '5cd6c496e9eb'],
  ['./fonts/STIXTwoMath-OFL.txt',                                   '0c8825913b60'],
  ['./fonts/STIXTwoMath-subset.woff2',                              'ace34bc7ff28'],
  ['./fonts/Spinwerad-OFL.txt',                                     '0c31d0af7f9a'],
  ['./fonts/info/AlegreyaSC-400-latin-ext.woff2',                   '1a7035f212b7'],
  ['./fonts/info/AlegreyaSC-400-latin.woff2',                       'dbdc9b83a7a5'],
  ['./fonts/info/AlegreyaSC-OFL.txt',                               'f6f60d5d4cf4'],
  ['./fonts/info/PlayfairDisplay-700-latin-ext.woff2',              'edb9f5d879b3'],
  ['./fonts/info/PlayfairDisplay-700-latin.woff2',                  '28453852ea16'],
  ['./fonts/info/PlayfairDisplay-700i-latin-ext.woff2',             '8af70f52c55b'],
  ['./fonts/info/PlayfairDisplay-700i-latin.woff2',                 'de2f4041e7ef'],
  ['./fonts/info/PlayfairDisplay-OFL.txt',                          '566be814f8e9'],
  ['./fonts/info/Spectral-400-latin-ext.woff2',                     'fc4b2566ccd9'],
  ['./fonts/info/Spectral-400-latin.woff2',                         'cf8daee3b83c'],
  ['./fonts/info/Spectral-400i-latin-ext.woff2',                    'f554218b51a0'],
  ['./fonts/info/Spectral-400i-latin.woff2',                        'db397149a9f7'],
  ['./fonts/info/Spectral-600-latin-ext.woff2',                     'dea6bd9ca650'],
  ['./fonts/info/Spectral-600-latin.woff2',                         '33faca8b5795'],
  ['./fonts/info/Spectral-600i-latin-ext.woff2',                    '4e3dee09ce15'],
  ['./fonts/info/Spectral-600i-latin.woff2',                        '2a3ef8cf75b8'],
  ['./fonts/info/Spectral-OFL.txt',                                 '501d6ceca8e5'],
  ['./frame-budget.js',                                             'd609c4fc6278'],
  ['./frame-coalescer.js',                                          '2488500d8bc5'],
  ['./frame-settle.js',                                             'a3b2724d2033'],
  ['./frontier.js',                                                 '81a1ed8eb764'],
  ['./gas.js',                                                      '3a97d7c298f0'],
  ['./gpu-boot.js',                                                 '5ea74d0d51a1'],
  ['./h2ci.js',                                                     'a7463f874720'],
  ['./h2curve.js',                                                  'df264cf5a7e3'],
  ['./hamiltonian.js',                                              'd0216c32c068'],
  ['./hydrogen.js',                                                 'fc5e6a37d910'],
  ['./icons.js',                                                    '4e7e8dc25bd9'],
  ['./img/icon-192.png',                                            '7f335219b4d1'],
  ['./img/icon-512.png',                                            '6524e4958e20'],
  ['./img/icon-apple-180.png',                                      '50a76e1103a7'],
  ['./img/icon-maskable-192.png',                                   'c82a55f4af4f'],
  ['./img/icon-maskable-512.png',                                   '4e88ce96e33f'],
  ['./img/icon-maskable.svg',                                       '5695511bc1f4'],
  ['./img/icon.svg',                                                'e59093ac4a71'],
  ['./img/lambdawaves-logo.svg',                                    'fc49b1e62e10'],
  ['./img/warning-sign.png',                                        'df32331830ce'],
  ['./index.html',                                                  'b26a3f9e4cbb'],
  ['./informational.js',                                            '2ee9b2f3099e'],
  ['./kepler.js',                                                   'f8fb43706f76'],
  ['./keplerview.js',                                               '023792d43cfa'],
  ['./key-table.js',                                                '15c5cf530686'],
  ['./keymap.css',                                                  '35f7d7050b4f'],
  ['./kick.js',                                                     '5c17a0cbc2d7'],
  ['./lab.css',                                                     '055f79977369'],
  ['./ladder-model.js',                                             '69199febdca1'],
  ['./ladder.js',                                                   'ab571c69fb38'],
  ['./latex-state.js',                                              '8f4f247a3ac3'],
  ['./lattice-model.js',                                            '76daa383bd32'],
  ['./lattice.js',                                                  '188e45dfce88'],
  ['./lebedev-302.json',                                            '9b9b2215df5f'],
  ['./library.js',                                                  'b7af04c54ea2'],
  ['./library.json',                                                '0a3531a7c866'],
  ['./linalg.js',                                                   'da2367cdcb97'],
  ['./look.js',                                                     '77ad4fd073c0'],
  ['./main.js',                                                     '12bd2115791c'],
  ['./manifest.webmanifest',                                        '975e5f242a0c'],
  ['./mapping.js',                                                  'ed9892761648'],
  ['./mathworker.js',                                               '24e51f82f922'],
  ['./md.js',                                                       'df8fbbb32009'],
  ['./meters.js',                                                   '91a541f346ea'],
  ['./mir-gui.js',                                                  'a017d3b53a4c'],
  ['./mir/control-help.js',                                         '99b5a74c95bd'],
  ['./mir/controls/arc.js',                                         'e82dca6b6007'],
  ['./mir/controls/colour-controls.css',                            'c52f3f82f755'],
  ['./mir/controls/controls.css',                                   '9cf426acc152'],
  ['./mir/controls/factory.js',                                     '04b193617990'],
  ['./mir/controls/gesture.js',                                     '660287dbe42c'],
  ['./mir/controls/lane.js',                                        '5dfa91cc4fce'],
  ['./mir/controls/list.js',                                        'a057a4ea8ed4'],
  ['./mir/controls/number.js',                                      'd38987ba3545'],
  ['./mir/controls/range.js',                                       'a4034a1ddcdf'],
  ['./mir/controls/select.js',                                      'dbeee3d4f4a8'],
  ['./mir/controls/stepper.js',                                     'c4e9c08b5f39'],
  ['./mir/controls/swatch.js',                                      '46e769f76608'],
  ['./mir/controls/xy.js',                                          '7925e758e831'],
  ['./mir/core/assets.js',                                          '35c233a29819'],
  ['./mir/core/core.css',                                           'fe920035d5b4'],
  ['./mir/core/describe.js',                                        'd9fdc1480365'],
  ['./mir/core/envelope.js',                                        'dc107c4b2901'],
  ['./mir/core/frame.js',                                           'cefb154de28e'],
  ['./mir/core/i18n.js',                                            'b125452dd71d'],
  ['./mir/core/intake.js',                                          '96139deffc33'],
  ['./mir/core/kbm.js',                                             '97f7ac5f4ff0'],
  ['./mir/core/look.js',                                            '6f2fcc23eff0'],
  ['./mir/core/motion.js',                                          '9dda4479b952'],
  ['./mir/core/perf.js',                                            '3b3f1b83bcb9'],
  ['./mir/core/png.js',                                             '9e58e798b1a5'],
  ['./mir/core/pointer.js',                                         '903b29573313'],
  ['./mir/core/prefs.js',                                           'a33c1b54f466'],
  ['./mir/core/project.js',                                         '7598a3e62edc'],
  ['./mir/core/proximity.js',                                       '2bcdbd691c69'],
  ['./mir/core/session.js',                                         'c850860f969d'],
  ['./mir/core/wakelock.js',                                        '460826e7310c'],
  ['./mir/core/zip.js',                                             '14a6b76c144c'],
  ['./mir/css/base.css',                                            'a5f965a2c914'],
  ['./mir/css/skin.css',                                            'a94622edbe53'],
  ['./mir/css/tokens.css',                                          '8835e37154af'],
  ['./mir/folders/files.js',                                        '81edd3d3fc39'],
  ['./mir/folders/folders.css',                                     '753ed7d68a98'],
  ['./mir/folders/folders.js',                                      'cd9311540320'],
  ['./mir/folders/gallery.js',                                      '8009684a572e'],
  ['./mir/folders/project.js',                                      'd10ebd3cc79f'],
  ['./mir/folders/save-blob.js',                                    'd9449adac322'],
  ['./mir/folders/seed.js',                                         '14d216632eaf'],
  ['./mir/folders/zip.js',                                          '3fdf0fc07223'],
  ['./mir/fx/fx.css',                                               'd909967e07fe'],
  ['./mir/fx/parallax.js',                                          '917181043f58'],
  ['./mir/fx/pointer-light.js',                                     '34776863cfef'],
  ['./mir/glyph.js',                                                'd9df732f9d74'],
  ['./mir/history/domains.js',                                      '20e80acd0cb2'],
  ['./mir/history/history.css',                                     'abfe9af6e771'],
  ['./mir/history/history.js',                                      '4ec5b905aa9f'],
  ['./mir/info/bodies.js',                                          'ed90b7735c5c'],
  ['./mir/info/faces.css',                                          'cd6a39e8a606'],
  ['./mir/info/info.css',                                           'eed45c8ec632'],
  ['./mir/info/layer.js',                                           'f105e7535407'],
  ['./mir/info/leader.js',                                          'f37ce255f05c'],
  ['./mir/info/seats.js',                                           'b0f0ecdbd8f6'],
  ['./mir/keyboard/keyboard.css',                                   '03e23a55ff47'],
  ['./mir/keyboard/keyboard.js',                                    '5570b4a40d73'],
  ['./mir/kit.js',                                                  '700858a0eda4'],
  ['./mir/locales/locales.css',                                     'cd2925eb7e5a'],
  ['./mir/locales/pseudo.js',                                       '152dbb0290ec'],
  ['./mir/mir.css',                                                 'ba4542bd7f58'],
  ['./mir/modulation/audio-capture.js',                             '5960299735f0'],
  ['./mir/modulation/bind.js',                                      'c2e07e1a78ef'],
  ['./mir/modulation/curve-gesture.js',                             '6022331253e1'],
  ['./mir/modulation/curve.js',                                     'f5ccc9c84f11'],
  ['./mir/modulation/host.js',                                      '14168ad3ca25'],
  ['./mir/modulation/layout-motion.js',                             'bad0ef731bcc'],
  ['./mir/modulation/mod-cursor.js',                                '4984041d0263'],
  ['./mir/modulation/mod.js',                                       '8c7a02ad2c33'],
  ['./mir/modulation/modhost.css',                                  '240c4d18c5d3'],
  ['./mir/modulation/modwindow/modwindow.css',                      '07604199d1b0'],
  ['./mir/modulation/modwindow/modwindow.js',                       '11980fef3cc0'],
  ['./mir/modulation/project.js',                                   '39e2c203e3ed'],
  ['./mir/modulation/registry.js',                                  'ec8d47fcadb5'],
  ['./mir/modulation/window.js',                                    'fce3cac24167'],
  ['./mir/notes/notes.css',                                         'cbe347e37ed0'],
  ['./mir/palette.js',                                              '36dfda19e93d'],
  ['./mir/panels/camera-rig.js',                                    'a4da27733ad0'],
  ['./mir/panels/camera.css',                                       '90483f1e11af'],
  ['./mir/panels/camera.js',                                        'e028c64daf3c'],
  ['./mir/panels/curves.css',                                       '22c3d24fb552'],
  ['./mir/panels/curves.js',                                        'ab8c56be4301'],
  ['./mir/panels/grade.css',                                        'da0334f1bdf9'],
  ['./mir/panels/lanes.css',                                        'f039f68d9930'],
  ['./mir/panels/picture-filter.js',                                'cbb24dae2c65'],
  ['./mir/panels/ramp.css',                                         '9dff67db7447'],
  ['./mir/panels/ramp.js',                                          'b952cb9d4597'],
  ['./mir/panels/xy.css',                                           '4b3f5226b680'],
  ['./mir/pattern/model.js',                                        'c3abd54fdd37'],
  ['./mir/pattern/pattern.css',                                     'df7f4962e01d'],
  ['./mir/plane-model.js',                                          '6cddd5451649'],
  ['./mir/render/audio-mix.js',                                     'f097e98f7b11'],
  ['./mir/render/clock.js',                                         '523f12e590b1'],
  ['./mir/render/encoder.js',                                       '816a31ee381d'],
  ['./mir/render/mp4.js',                                           '784f9a61e601'],
  ['./mir/render/panel.js',                                         '5ba374981fb1'],
  ['./mir/render/plan.js',                                          'e1af78564bb3'],
  ['./mir/render/recorder.js',                                      'b59c4e451dff'],
  ['./mir/render/render.css',                                       '6b98cd69e02e'],
  ['./mir/render/selftest.js',                                      '107919b613ca'],
  ['./mir/render/store-worker.js',                                  '2aa00d1055d0'],
  ['./mir/render/store.js',                                         'eb5e61beaeef'],
  ['./mir/shell/about.js',                                          '5de92bc46bb7'],
  ['./mir/shell/accent.js',                                         '6238840ae47e'],
  ['./mir/shell/assets/mir-dark.svg',                               '7c8dfe83d50f'],
  ['./mir/shell/assets/mir-light.svg',                              'f9d485d59c63'],
  ['./mir/shell/banner.css',                                        '570b1bc5e080'],
  ['./mir/shell/banner.js',                                         'fc41f10262dc'],
  ['./mir/shell/boot.js',                                           '66caee269095'],
  ['./mir/shell/busy.js',                                           '37c73f3b2c24'],
  ['./mir/shell/clipboard.js',                                      '85235a0f7f22'],
  ['./mir/shell/dialog.js',                                         '395bc2d29854'],
  ['./mir/shell/flash-guard.js',                                    'eb3facf99ecd'],
  ['./mir/shell/gui.css',                                           '6f40a082d91d'],
  ['./mir/shell/gui.js',                                            '449cd4cf73ff'],
  ['./mir/shell/keys.js',                                           '83f23ccf5a4a'],
  ['./mir/shell/menubar.js',                                        '7126fa497da2'],
  ['./mir/shell/midi.js',                                           '668a2981eba1'],
  ['./mir/shell/notebook-math.js',                                  'fa1312541d4c'],
  ['./mir/shell/notebook-render.js',                                '60f8e1193c27'],
  ['./mir/shell/notebook.js',                                       'ef2b9c03193e'],
  ['./mir/shell/notice.js',                                         '729f7c83f2be'],
  ['./mir/shell/opener.css',                                        '85ef9ab9e3f7'],
  ['./mir/shell/pages.css',                                         '66dd1f06b643'],
  ['./mir/shell/pages.js',                                          'f7e821b4455a'],
  ['./mir/shell/parts.css',                                         '830878076e9f'],
  ['./mir/shell/rack-scrollbar.js',                                 '6b4949cea403'],
  ['./mir/shell/rack.css',                                          '16b18be4191a'],
  ['./mir/shell/rack.js',                                           '46b732d7d959'],
  ['./mir/shell/scene-guard.js',                                    '0c41641e90c5'],
  ['./mir/shell/shell.css',                                         'f78de40fa27c'],
  ['./mir/shell/stage.css',                                         'db4a83037ab9'],
  ['./mir/shell/themes.js',                                         '8e736e9ba4f3'],
  ['./mir/shell/transport.css',                                     '9a1b24ef5135'],
  ['./mir/shell/transport.js',                                      '6f4754a2e47e'],
  ['./mir/shell/vendor/katex/LICENSE',                              '766ccc1f306c'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_AMS-Regular.woff2',        '0cdd387c9590'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2',   'de7701e42cf1'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2','5d53e70ad607'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2',       '74444efd593c'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2',    '51814d270d06'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Main-Bold.woff2',          '0f60d1b89793'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2',    '99cd42a3c072'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Main-Italic.woff2',        '97479ca6cce9'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Main-Regular.woff2',       'c2342cd8b869'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2',    'dc47344dbb6c'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Math-Italic.woff2',        '7af58c5ec8f1'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2',     'e99ae51144bf'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2',   '00b26ac825e2'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2',  '68e8c73ef42a'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Script-Regular.woff2',     '036d4e95149b'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Size1-Regular.woff2',      '6b47c40166b6'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Size2-Regular.woff2',      'd04c54219f9e'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Size3-Regular.woff2',      '73d591271b16'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Size4-Regular.woff2',      'a4af7d414440'],
  ['./mir/shell/vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2', '71d517d67827'],
  ['./mir/shell/vendor/katex/fonts/OFL.txt',                        'fda55663cd51'],
  ['./mir/shell/vendor/katex/katex.min.css',                        '717bc9ae7853'],
  ['./mir/shell/vendor/katex/katex.min.js',                         'e6bfe5deebd4'],
  ['./mir/shell/vendor/marked-LICENSE.md',                          '8e3a3f82f59a'],
  ['./mir/shell/vendor/marked.min.js',                              '15fabce5b658'],
  ['./mir/shell/window-picker.css',                                 '9d8ae4b0c09f'],
  ['./mir/shell/window-picker.js',                                  '93cfa2c1ae7b'],
  ['./mir/shell/wordmark.js',                                       'f47ed2744692'],
  ['./mir/slider-keys.js',                                          '4e691448ec28'],
  ['./mir/timeline/audio-analysis.js',                              '38fd4dc085d3'],
  ['./mir/timeline/audio-drop.js',                                  'af9b12bc53f2'],
  ['./mir/timeline/audio-kind.js',                                  '71ea92197244'],
  ['./mir/timeline/audio-playback.js',                              '81c9e930fe20'],
  ['./mir/timeline/bind.js',                                        '4c7065072065'],
  ['./mir/timeline/controller.js',                                  '7b75de5244a0'],
  ['./mir/timeline/cursor.js',                                      '2c4a4bd2063b'],
  ['./mir/timeline/curve-view.js',                                  '8432d7c7a10d'],
  ['./mir/timeline/draw.js',                                        'b6997dd5222f'],
  ['./mir/timeline/editor.js',                                      'e8891e06458b'],
  ['./mir/timeline/geometry.js',                                    'c819b1a64c85'],
  ['./mir/timeline/history.js',                                     '5f23e118ee32'],
  ['./mir/timeline/icons.js',                                       'db7295ec5c87'],
  ['./mir/timeline/kinds.js',                                       'aec89844d05a'],
  ['./mir/timeline/knobs.js',                                       '295ba7075b6d'],
  ['./mir/timeline/model.js',                                       '57ff382181ad'],
  ['./mir/timeline/pattern-kind.js',                                '3b1f2f328c3f'],
  ['./mir/timeline/playhead.js',                                    'b918e4f78f01'],
  ['./mir/timeline/project.js',                                     '5333447c0b76'],
  ['./mir/timeline/readout.js',                                     'fd140292555d'],
  ['./mir/timeline/selection.js',                                   '12ffcdb73b0f'],
  ['./mir/timeline/shortcuts.js',                                   '356421e859eb'],
  ['./mir/timeline/slice.js',                                       '54c15da61852'],
  ['./mir/timeline/source.js',                                      'e032fdf2870d'],
  ['./mir/timeline/time-format.js',                                 'bace74d4a020'],
  ['./mir/timeline/timeline.css',                                   '981aac836f2e'],
  ['./mir/timeline/view.js',                                        '938f864a972f'],
  ['./mir/timeline/window.js',                                      '1b5b3f6ca05d'],
  ['./mir/version.js',                                              '2d323693e425'],
  ['./mir/window-activity.js',                                      '8eb6cefdf972'],
  ['./mir/window/dock.js',                                          '6b678fe06223'],
  ['./mir/window/rail.js',                                          '60d28f8f5c58'],
  ['./mir/window/window.css',                                       '17ce139cb1a2'],
  ['./mir/window/window.js',                                        '7a845220ffb3'],
  ['./mir/window/workspaces.js',                                    'ccbc08107b95'],
  ['./mod-port.js',                                                 '9a6b924dec52'],
  ['./modrive.js',                                                  '89b99a6568d1'],
  ['./molecular-field.js',                                          'caa6acc2bd92'],
  ['./molecular-flow.js',                                           '217febb4fa90'],
  ['./molecular-register.js',                                       'c274a236d6ef'],
  ['./molecular-session.js',                                        '9f1933cc6dd1'],
  ['./molecule-state.js',                                           'b6884ee2026f'],
  ['./molecule.js',                                                 'a2f3c70b3705'],
  ['./molecules.js',                                                'feeaf413453c'],
  ['./momentum.js',                                                 'd5dea839eca3'],
  ['./motion-pref.js',                                              '34329c802c8b'],
  ['./names.js',                                                    '5917aa36498d'],
  ['./native-ui.js',                                                '84c61c3f0828'],
  ['./new-project.lambdawaves.json',                                '8f752deb0e08'],
  ['./node-layers.js',                                              '18b70416ea1e'],
  ['./node-prims.js',                                               '97deaf2434b4'],
  ['./node-shader.js',                                              '3489a85e3680'],
  ['./node-types.js',                                               '3c6873fd9734'],
  ['./nodes-compile.js',                                            'fb88659ebcc0'],
  ['./nodes-undo.js',                                               'cfe471461333'],
  ['./nodes-view.js',                                               '8f846ee9915c'],
  ['./nodes.css',                                                   'b9ccc24c94ce'],
  ['./nodes.js',                                                    'da8c608b149c'],
  ['./occlusion.js',                                                'ad36cf08beeb'],
  ['./orbit.js',                                                    '244571342fd8'],
  ['./orbitalsview.js',                                             '8eed34f0879c'],
  ['./pager.js',                                                    'f43978b3808d'],
  ['./paint-stroke.js',                                             'd9489f20de6c'],
  ['./palette-app.js',                                              'a3c1fd9d2bec'],
  ['./particles.js',                                                'abd7e744edb8'],
  ['./period.js',                                                   '395a63570deb'],
  ['./picker-fx.js',                                                '0b9a1f85c4ec'],
  ['./picker.js',                                                   '29d59d22b109'],
  ['./project-store.js',                                            '4cff94c833c7'],
  ['./projects.js',                                                 '178c4bd380cc'],
  ['./qho.js',                                                      'c0dfa6e21c94'],
  ['./rack.js',                                                     '3f0728a7cde7'],
  ['./radiation.js',                                                '4b5a70c9847c'],
  ['./radiationview.js',                                            'abb61c437b49'],
  ['./register-morph.js',                                           'cf0e273be934'],
  ['./registerview.js',                                             'f33451a4b35d'],
  ['./render-exact.js',                                             '0d5484d4e5a8'],
  ['./response-fit.js',                                             'fe7942d74051'],
  ['./rhf-molecule.js',                                             'dcf455482b26'],
  ['./rotor4.js',                                                   '074250aea7e6'],
  ['./rpa-inspector.js',                                            'baf1eaa062e7'],
  ['./scf.js',                                                      '3dc2b4957407'],
  ['./separable.js',                                                'e99b6c67ebd5'],
  ['./settings-store.js',                                           '8178b4e1e687'],
  ['./shadowview.js',                                               'ad101af8b299'],
  ['./shell/controller.js',                                         'c390666dba8d'],
  ['./shell/facade.js',                                             '9941b6cfefba'],
  ['./shell/history.js',                                            'b166d1dd1c91'],
  ['./shell/ink.js',                                                '0c1ee4622c6f'],
  ['./shell/keys.js',                                               'd08bd3959587'],
  ['./shell/links.js',                                              '8e3bc790dcd4'],
  ['./shell/modulation.js',                                         '74e5ed51e04f'],
  ['./shell/notebook.js',                                           '9b7527ad1b17'],
  ['./shell/persist.js',                                            'ac98489f892b'],
  ['./shell/rack-wiring.js',                                        'e469da3bca24'],
  ['./shell/settings.js',                                           '22b4bb9403b2'],
  ['./shell/stage-words.js',                                        '07d732566acb'],
  ['./shell/transport.js',                                          'b25e9957ec32'],
  ['./skeleton.js',                                                 '5f395cf24269'],
  ['./skin.css',                                                    '798cd7f8d6c4'],
  ['./slice.js',                                                    '0fbaa89ce784'],
  ['./sliceview.js',                                                '042dfa4eb967'],
  ['./spectrum.js',                                                 'a46caf2a01bb'],
  ['./stage-gestures.js',                                           '9bb80027fbef'],
  ['./stark.js',                                                    '6ca9675b9d4a'],
  ['./state.js',                                                    '892d7bda23e8'],
  ['./statelink.js',                                                'cdec8e548fd1'],
  ['./statesview.js',                                               'bf31f3eaf392'],
  ['./status.js',                                                   'da2e112c115c'],
  ['./sturmian.js',                                                 '2b96d3759ceb'],
  ['./sturmianreg.js',                                              'cd5a43066d67'],
  ['./sw-client.js',                                                '0f1ffadd0978'],
  ['./tier.js',                                                     '8a0b625a5b35'],
  ['./user-presets.js',                                             '3808f2602145'],
  ['./valence.js',                                                  '3b4e39e5b9b0'],
  ['./vendor/bse/6-31+g-star-v1.json',                              'b38353af756b'],
  ['./vendor/bse/index.json',                                       'fc50107750ef'],
  ['./vendor/bse/sto-3g-v1.json',                                   '22ce59b9ec99'],
  ['./verbs.js',                                                    '7c547209a47f'],
  ['./volumes-format.js',                                           '8763d35dd611'],
  ['./volumes.js',                                                  '536c25756b6b'],
  ['./vortex.js',                                                   'baf5ad65b7ca'],
  ['./well.js',                                                     '82f249acd7df'],
  ['./wigner.js',                                                   '668d13ce809c'],
  ['./wignerview.js',                                               '3206550637de'],
  ['./window-chrome.js',                                            '9755dd32f533'],
  ['./windows/equalizer.js',                                        '026da0904807'],
  ['./windows/film.js',                                             '8d569f7c1bd9'],
  ['./windows/folders.js',                                          '6827d41317a0'],
  ['./windows/gas.js',                                              '22e025085bb1'],
  ['./windows/kepler.js',                                           '504329788c91'],
  ['./windows/material.js',                                         '1375226196d9'],
  ['./windows/molecules.js',                                        'ab31b626a6e8'],
  ['./windows/readouts.js',                                         '08af6ade116d'],
  ['./windows/settings-card.js',                                    '3be6608ef5dd'],
  ['./windows/spectrum.js',                                         '94f92699f720'],
  ['./windows/static-field.js',                                     '3c2a3cf1ac89'],
  ['./windows/transition.js',                                       'fae1b23a47fc'],
  ['./worker-pool.js',                                              'f31d5675dcae'],
];

/* ── 1b. DATA — THE ONE PRECACHE EXEMPTION (0.4.0 S4a · PLAN B2) ──────────────────────────────────────────────────
 * A file under a DATA root is CONTENT-ADDRESSED DEVICE CONTENT: deployed, NEVER precached, fetched when the lab asks for it and
 * kept by the page in DATA_CACHE, a name no build changes — so a new build never clears an installed record (§4 collects only
 * PREFIX caches).  lab/library/<sha-256>.json are the orbital records; lab/library.json, the catalogue that reaches them, is
 * an ordinary precached file.  tests/pwa.test.mjs and tools/build-deploy.mjs READ this list: it is the one rule, and the 0.5.0
 * kit-file policy extends it rather than adding a second:
 * SKIP (0.5.0 A11) — kit data an adoption brings and the lab reads lazily or never: DEPLOYED, NEVER PRECACHED, and nothing more
 * (no cache of its own, no handler: §4 sends it to the network like any URL outside §1).  MIR 1.5's language packs (twelve
 * mir/locales/*.json, 2.24 MB with the token sheet; a pack the network cannot give leaves the words English, which is the kit's
 * own fallback) and mir/tokens.json (the token schema, read by tools, never by a page) took an adopted install from 4.6 to
 * 9.5 MiB, over the 8 MiB ceiling; without them it is 7.3.  `*` is one path segment.  On a 1.4 tree neither exists.
 * THE VOLUMES (iteration 004 V1) are DATA by the same rule: volumes/ (the shelf volumes.json, each volume's index.json and its
 * m/<id>.lwm molecules; in a checkout lab/volumes is the git-ignored dev link to ~/Documents/LAMBDAWAVES-VOLUMES/dist, which no
 * walk follows) and the four basis records only a volume rung needs (STO-6G, 3-21G, 6-31G, 6-31G*: 675 KB the live card never
 * asks for) — fetched with the volume that names them, kept by the page in DATA_CACHE beside it.
 * THE PICTURES (iteration 005 A) are DATA by the same rule: img/menu/ (the Picker's thumbnails, 720 KB) and demos/covers/ (the one
 * demo cover since iteration 009, 20 KB) — deployed, never precached, kept by the page in DATA_CACHE after their first good answer (library.js keepData),
 * so an installed app shows them offline from its second run; a picture not yet held is the tile's own placeholder.
 * THE MEASURED LINES (iteration 016 E3) are DATA by the same rule: vendor/nist/ (NIST ASD's neutral lines, 330 KB, tools/nist-lines.py) — read when
 * EMISSION SPECTRA first meets the ATOM, kept by the page after that answer; HYDROGEN's lines are computed and never need it. */
const DATA = ['library/', 'volumes/', 'vendor/bse/sto-6g-v1.json', 'vendor/bse/3-21g-v1.json', 'vendor/bse/6-31g-v1.json', 'vendor/bse/6-31g-star-v1.json', 'img/menu/', 'demos/covers/', 'vendor/nist/'];
const DATA_CACHE = 'lw-data-v1';
const SKIP = ['mir/locales/*.json', 'mir/tokens.json'];

/* WHAT IS DELIBERATELY *NOT* IN §1, and why.  The test asserts this list is exactly what the walk skips. */
const NEVER_PRECACHE = [
  ['sw.js',                'a worker that caches itself can never be updated: the browser fetches sw.js through its own byte-comparison path, and a Cache API copy in front of that is the classic way to strand a build forever.'],
  ['smoke.html',           'a bench page for the browser proof, not part of the lab; caching it would put a dev harness on the home screen.'],
  ['*.md, *.txt EXCEPT a LICENCE text',
                           'shipped documents (skin-notes, PORT-NOTES, the *-SOURCE.txt build records) are served, never loaded by the running lab — precaching them would make every prose edit a new build. THE LICENCES ARE THE EXCEPTION and they ARE precached (wave 59): the font binaries they cover are in this list, and OFL section 2 says each copy must CONTAIN the licence — an offline install that holds twenty-three fonts and cannot reach one licence is not that copy. It costs 22 KB and licence texts change approximately never.'],
  ['vendor/katex/LICENSE', 'NO LONGER SKIPPED, for the same reason: it is the MIT text for KaTeX\'s code and it is precached with vendor/katex/fonts/OFL.txt beside it.'],
  ['a DATA root (§1b: library/, volumes/, the ladder\'s four basis records, img/menu/, demos/covers/, vendor/nist/)', 'an orbital record is content-addressed device content — installed on a press or by the open that names it, kept in lw-data-v1 across builds, and never a byte of every visitor\'s install; a volume (≈5 GB) and the bases only its rungs use are the same kind of content, and so are the Picker\'s pictures and the demo covers, kept as the page first shows them.'],
  ['a SKIP path (§1b: mir/locales/*.json, mir/tokens.json)', 'kit data an adoption brings that the running lab fetches only when a language is chosen, or never: deployed, never precached, never cached (offline, a language other than English stays English).'],
  ['a module STAGED in tests/wiring.test.mjs ALLOWLIST', 'OPTIMIZATION 2026-09-24 · M10: wiring proves no root reaches it, so no install should fetch it; tests/pwa.test.mjs and tools/build-deploy.mjs READ the set from that list, so a module rejoins this precache the day it is wired and its entry is forced out.'],
  ['an adopted kit module no root reaches (R5-W1)', '0.5.0 C0: MIR is adopted whole, so lab/mir/ holds modules for consumers λWAVES has not reached yet. tests/wiring.test.mjs walks the roots and names them (--unreached-kit); tests/pwa.test.mjs and tools/build-deploy.mjs READ that set, so a kit module joins this precache the day a consumer imports it. Deployed, never precached, never failed (PLAN §9).'],
];

/* AND WHAT THE FETCH HANDLER REFUSES TO CACHE AT RUNTIME (§4), each with its reason. */
const NEVER_CACHE_AT_RUNTIME = [
  ['any method but GET',        'a POST/PUT is a write; replaying one from a cache is a lie about what the server did.'],
  ['a Range request',           'the answer is a 206 with a slice of the body. A partial response stored under a whole-file key is a poisoned entry that fails silently later.'],
  ['a cross-origin request',    'lab/ has none (the test proves it), and an opaque response has status 0 and an unreadable body — it cannot be validated, so it is never kept.'],
  ['any navigation that is not the app entry', '/REPORT.md, /LICENSE, /NOTICE and the eight licence texts ABOUT opens in a new tab are DOCUMENTS, not the lab. They change every wave; a cached build log is a lie. This used to be enforced by a path prefix ("above /lab/"), which silently became a no-op the day the lab moved to its own origin and SCOPE became "/" — every navigation on the hostname was then answered with the lab\'s own index.html, and the nine document links in ABOUT each opened a second copy of the lab. Only the ENTRY set is served: everything else is the network\'s, which is also what restores the real 404 wrangler.jsonc\'s not_found_handling asks for. Offline a document fails, which is honest — it is not the lab.'],
  ['anything not already in §1', 'this worker NEVER grows a runtime cache. The precache is the whole app; a URL that is not in it is a URL the lab does not need, so it goes to the network and nothing is stored.'],
  ['a DATA path (§1b) the page has not installed', 'it is answered from lw-data-v1 when the page has stored it and from the network otherwise — and the worker writes nothing there: the page stores a record only after its bytes match its name (lab/library.js).'],
];

/* ── 2. THE BUILD NAME — a pure function of §1's contents, computed here, written nowhere ───────────────
 * Two interleaved 32-bit mixes over "url@hash" lines; base-36 concatenated. Not cryptographic and does not
 * need to be — it names a cache, and it only has to change when the bytes change and not otherwise. */
function digest(s) {
  let a = 0x811c9dc5, b = 0x9e3779b9;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    a = Math.imul(a ^ ch, 0x01000193) >>> 0;
    b = Math.imul(b + ch, 0x85ebca6b) >>> 0;
    b = (b ^ (b >>> 13)) >>> 0;
  }
  return a.toString(36) + b.toString(36);
}
const PREFIX = 'lw-lab-';
const BUILD  = digest(PRECACHE.map(([u, h]) => u + '@' + h).join('\n'));
const CACHE  = PREFIX + BUILD;

const BASE  = self.location.href;                              // …/lab/sw.js — or …/sw.js at an origin root
const SCOPE = new URL('./', BASE).pathname;                    // '/lab/' on the dev server, '/' deployed
const INDEX = new URL('./index.html', BASE).pathname;
/* THE APP ENTRY — the only two paths a navigation may be answered from the precache with (§5).  It is a
   SET of paths and not a prefix on purpose: a prefix is what stopped working when the prefix became '/'. */
const ENTRY = new Set([SCOPE, INDEX]);
/* pathname → the request we stored it under.  Query and hash never take part: the precache fetches with a
   ?__rev= buster (§3) but PUTS under the clean URL, so a plain request finds it. */
const BY_PATH = new Map(PRECACHE.map(([u]) => [new URL(u, BASE).pathname, new URL(u, BASE).href]));
const BYTES_HINT = PRECACHE.length;

/* ── 3. INSTALL — fill the cache, then WAIT.  No skipWaiting(). ─────────────────────────────────────────
 * Each file is fetched with `cache: 'reload'` AND a ?__rev=<content hash> so neither the HTTP cache nor any
 * proxy in between can hand us yesterday's bytes; the response is then PUT under the clean URL. If a single
 * file fails, the whole install rejects and the browser throws the new worker away — the old one keeps
 * serving, which is exactly the outcome we want from a half-uploaded deploy. */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const already = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
    await Promise.all(PRECACHE.map(async ([url, rev]) => {
      const href = new URL(url, BASE).href;
      if (already.has(new URL(href).pathname)) return;          // a re-install of the same build is free
      const res = await fetch(new Request(href + (href.includes('?') ? '&' : '?') + '__rev=' + rev, { cache: 'reload' }));
      if (!res || !res.ok) throw new Error('precache ' + url + ' → ' + (res && res.status));
      await cache.put(new Request(href), res);
    }));
    /* THE SIGNAL (§5): if a worker is already live, this install is an UPDATE and the sessions running on
       the old build are told — while they keep running on it. A first install announces nothing. */
    if (self.registration && self.registration.active) await announce({ type: 'LW_SW_WAITING', build: BUILD, files: PRECACHE.length });
  })());
});

/* ── 4. ACTIVATE — collect the caches no worker will ever read again.  No clients.claim(). ──────────────
 * Because §3 never calls skipWaiting(), activate can only run when the previous worker has been released —
 * i.e. when no page is left on the old build. So this sweep can never delete the cache a live session is
 * reading. The one exception is the user-driven path in §6, and §5's cache miss falls through to the
 * network, so even that page degrades to "slower" and never to "broken". */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith(PREFIX) && n !== CACHE).map((n) => caches.delete(n)));
    await announce({ type: 'LW_SW_ACTIVE', build: BUILD, files: PRECACHE.length });
  })());
});

/* ── 5. FETCH — cache-first over §1, and nothing else is ever stored ────────────────────────────────────
 * The refusals above, in order, then: a navigation TO THE APP ENTRY gets index.html, and a precached URL
 * gets its stored copy. A miss inside the precache cannot happen in a healthy install, but if storage was
 * evicted we go to the network rather than fail.
 *
 * ── WAVE 68 · THE NAVIGATION RULE, AND THE RULE THAT REPLACED A COINCIDENCE ────────────────────────────
 * This arm used to be "any navigation in scope gets index.html", refused above it by
 * `startsWith(SCOPE)`. At /lab/ that refusal did the work; at the origin root SCOPE is '/' and
 * `startsWith('/')` refuses NOTHING, so from the second launch onward EVERY navigation on the hostname —
 * /LICENSE, /NOTICE, /REPORT.md, a typo — was answered from the cache with the lab. Measured in real
 * Firefox against `wrangler dev`. The nine document links in the ABOUT face each opened a second copy of
 * λWAVES, which is a GPL-3.0 §4 and OFL §2 REACHABILITY problem and not a cosmetic one, and
 * `not_found_handling: "404-page"` was defeated for every controlled visitor.
 * THE RULE IS NOW ON THE PATH ITSELF: a navigation is answered from the precache only when it names the
 * app entry (SCOPE or SCOPE + 'index.html'). The app has NO path routing at all — state travels in the
 * fragment (statelink.js) — so nothing is lost, and every other URL reaches the network exactly as this
 * file's own §NEVER_CACHE_AT_RUNTIME prose has always said it should. The scope check stays: it is still
 * the right refusal at /lab/, and it costs nothing at the root.
 * The general shape, and it is the second time this tree has met it: A RULE ENFORCED BY A COINCIDENCE OF
 * THE ADDRESS STOPS BEING A RULE WHEN THE ADDRESS CHANGES, silently and with the comment still standing.
 * tests/pwa.test.mjs now runs its whole fetch matrix AT BOTH MOUNTS, which is what closes the class. */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                                     // never a write
  if (req.headers && req.headers.get && req.headers.get('range')) return;   // never a 206
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;                      // never cross-origin / opaque
  if (!url.pathname.startsWith(SCOPE)) return;                          // never above the mount (a no-op at an origin root — see above)
  if (req.mode === 'navigate') { if (!ENTRY.has(url.pathname)) return; event.respondWith(serve(INDEX, req)); return; }   // the APP ENTRY only; a document is the network's
  if (DATA.some((d) => url.pathname.startsWith(SCOPE + d))) {           // §1b: a record — the device's copy, else the network; stored by the page only
    event.respondWith(caches.open(DATA_CACHE).then((c) => c.match(url.origin + url.pathname)).then((hit) => hit || fetch(req))); return;
  }
  if (!BY_PATH.has(url.pathname)) return;                               // not ours: network, and store nothing
  event.respondWith(serve(url.pathname, req));
});

async function serve(pathname, req) {
  const href = BY_PATH.get(pathname);
  if (href) {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(new Request(href));
    if (hit) return hit;
  }
  return fetch(req);
}

/* ── 6. THE UI CHANNEL — how the lab asks, and how the USER (never the worker) takes an update ──────────
 *   page → worker  { type: 'LW_SW_HELLO' }         → replies { type:'LW_SW_BUILD', build, files, cache }
 *   page → worker  { type: 'LW_SW_SKIP_WAITING' }  → this waiting worker takes over; the page reloads on
 *                                                    navigator.serviceWorker's 'controllerchange'.  A PRESS.
 *   page → worker  { type: 'LW_SW_SKIP_WAITING', alone: true }
 *                                                  → a QUIET TAKE (wave 133: an untouched session) — taken
 *                                                    only while ONE window is in scope, else refused with:
 *   worker → page  { type: 'LW_SW_BUSY', windows }  → the quiet take was refused; the page offers it instead.
 *   worker → page  { type: 'LW_SW_WAITING', build } → a new build finished installing and is waiting (§3).
 *   worker → page  { type: 'LW_SW_ACTIVE',  build } → a build took over (first install, or after a skip).
 * SKIP_WAITING is the ONLY thing in this file that can end a session's build, and only the interface can
 * send it — the worker never sends it to itself, and no timer sends it either. */
self.addEventListener('message', (event) => {
  const d = event.data || {};
  if (d.type === 'LW_SW_SKIP_WAITING') { const p = takeover(event, d); if (event.waitUntil) event.waitUntil(p); return; }
  if (d.type === 'LW_SW_HELLO') {
    const msg = { type: 'LW_SW_BUILD', build: BUILD, files: PRECACHE.length, cache: CACHE };
    const port = event.ports && event.ports[0];
    if (port) port.postMessage(msg);
    else if (event.source && event.source.postMessage) event.source.postMessage(msg);
  }
});

/* A QUIET TAKE (page: an untouched session) asks with `alone: true` and is refused when another window is in scope —
   skipWaiting() re-points every client, and the second window may hold work.  A PRESS never asks; the user said yes.
   The press path reaches skipWaiting() without an await, so it is taken in the same turn as the message. */
async function takeover(event, d) {
  if (d.alone) {
    const windows = (await self.clients.matchAll({ includeUncontrolled: true, type: 'window' })).length;
    if (windows > 1) { if (event.source && event.source.postMessage) event.source.postMessage({ type: 'LW_SW_BUSY', windows }); return; }
  }
  self.skipWaiting();
}

async function announce(msg) {
  if (!self.clients || !self.clients.matchAll) return;
  const list = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const c of list) c.postMessage(msg);
}

/* Read by tests/pwa.test.mjs, which loads this file for real and drives the handlers above. */
self.LW_SW = { PREFIX, BUILD, CACHE, PRECACHE, NEVER_PRECACHE, NEVER_CACHE_AT_RUNTIME, SCOPE, INDEX, ENTRY, BY_PATH, DATA, DATA_CACHE, digest };
