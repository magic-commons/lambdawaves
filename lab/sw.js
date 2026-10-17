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
  ['./angular-nodes.js',                                            '945796c72ba8'],
  ['./ask.js',                                                      'be69c1219826'],
  ['./atoms.js',                                                    '1bfbfc778e10'],
  ['./atomsview.js',                                                'ab7e4a71bbb7'],
  ['./badges.js',                                                   '4f8bf7f8ca87'],
  ['./bessel.js',                                                   '0689408ac984'],
  ['./bloch-model.js',                                              '2ffb242ecdbf'],
  ['./bloch.js',                                                    '628d7346cc22'],
  ['./busy-mark.js',                                                '73e135b080e2'],
  ['./calculus.js',                                                 '915be59270d6'],
  ['./calculusview.js',                                             '8acdfe558f4f'],
  ['./camera-law.js',                                               'c46af991eb4d'],
  ['./canon-gauge.js',                                              'e760a258cd23'],
  ['./capture.js',                                                  '78c25071f769'],
  ['./catalogue.js',                                                '7fd55be3bb31'],
  ['./central.js',                                                  '8bc04367a0d8'],
  ['./chemview.js',                                                 '3964ebd45bb8'],
  ['./chord-audio.js',                                              '02e0021a1c14'],
  ['./clock.js',                                                    '5a0a1e969b46'],
  ['./cornell.js',                                                  'b23e13639027'],
  ['./demos/benzene.lambdawaves.json',                              '5d1e0eb31304'],
  ['./demos/break.lambdawaves.json',                                '04b151b77bed'],
  ['./demos/bucky.lambdawaves.json',                                '89a46b3a5d78'],
  ['./demos/chord.lambdawaves.json',                                'a38bf8a15068'],
  ['./demos/covers/benzene.jpg',                                    '9c2d978c5a88'],
  ['./demos/covers/break.jpg',                                      '09449e1b3397'],
  ['./demos/covers/bucky.jpg',                                      'c68a12d3eb56'],
  ['./demos/covers/chord.jpg',                                      '111b6870dceb'],
  ['./demos/covers/h2-sigma-u.jpg',                                 '6c83746b4730'],
  ['./demos/covers/helium.jpg',                                     '6ba7dc82e567'],
  ['./demos/covers/lda.jpg',                                        'db137233803d'],
  ['./demos/covers/n2.jpg',                                         '6bfdc97a9117'],
  ['./demos/covers/tunnel.jpg',                                     'f865ae96a4ad'],
  ['./demos/covers/water.jpg',                                      '2ee1f544c7e7'],
  ['./demos/covers/wave-dancer.jpg',                                'b55edf8e021a'],
  ['./demos/h2-sigma-u.lambdawaves.json',                           '4e848867fbfb'],
  ['./demos/helium.lambdawaves.json',                               'dd757c51054a'],
  ['./demos/lda.lambdawaves.json',                                  '80e70c4094af'],
  ['./demos/n2.lambdawaves.json',                                   '88c3ea3d412e'],
  ['./demos/tunnel.lambdawaves.json',                               '715761aff6d4'],
  ['./demos/water.lambdawaves.json',                                'f6e2e0ff464f'],
  ['./demos/wave-dancer.lambdawaves.json',                          '7719ad53af12'],
  ['./density.js',                                                  'b7e7f8bde4fb'],
  ['./dft-grid.js',                                                 '4a75ae325355'],
  ['./dynamics.js',                                                 '3570435459e7'],
  ['./edit-domain.js',                                              'f67311da8412'],
  ['./eq-audio.js',                                                 '56211bd23b6d'],
  ['./equalizer.js',                                                'f0f52fa15e7c'],
  ['./export3d.js',                                                 'c6e3391d751b'],
  ['./field.js',                                                    '1947a2ddc867'],
  ['./film-card.js',                                                '436a9ff4bfe9'],
  ['./first-run.js',                                                'eea3bf08de18'],
  ['./flash-law.js',                                                '8f23407a1752'],
  ['./flow-balance.js',                                             '796658f0227d'],
  ['./fold.js',                                                     '676151c1bbd9'],
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
  ['./frontier.js',                                                 '43b8e981dbb2'],
  ['./gas.js',                                                      '79afcb52deb1'],
  ['./gpu-boot.js',                                                 '5ea74d0d51a1'],
  ['./h2ci.js',                                                     'a7463f874720'],
  ['./h2curve.js',                                                  'df264cf5a7e3'],
  ['./hamiltonian.js',                                              '521a696e901a'],
  ['./hydrogen.js',                                                 '0e9915154ccc'],
  ['./img/icon-192.png',                                            '7f335219b4d1'],
  ['./img/icon-512.png',                                            '6524e4958e20'],
  ['./img/icon-apple-180.png',                                      '50a76e1103a7'],
  ['./img/icon-maskable-192.png',                                   'c82a55f4af4f'],
  ['./img/icon-maskable-512.png',                                   '4e88ce96e33f'],
  ['./img/icon-maskable.svg',                                       '5695511bc1f4'],
  ['./img/icon.svg',                                                'e59093ac4a71'],
  ['./img/lambdawaves-logo.svg',                                    'fc49b1e62e10'],
  ['./img/menu/AlH3.webp',                                          'a66f7ad9ad05'],
  ['./img/menu/AsH3.webp',                                          'ec7a8e7215a6'],
  ['./img/menu/B12H12--.webp',                                      '8dcd49f0d727'],
  ['./img/menu/B2.webp',                                            '0e74ec2cc410'],
  ['./img/menu/BF3.webp',                                           '6e242d30cf87'],
  ['./img/menu/BH3.webp',                                           '8bfb78d7c908'],
  ['./img/menu/BeH2.webp',                                          '079666e4dad2'],
  ['./img/menu/Br2.webp',                                           '993c5ebdf785'],
  ['./img/menu/C2H2.webp',                                          'b1a932cb1a82'],
  ['./img/menu/C2H4.webp',                                          '1df5b0d068b4'],
  ['./img/menu/C2H6.webp',                                          '95992e32a37c'],
  ['./img/menu/C3H6.webp',                                          'b8f6726270da'],
  ['./img/menu/C4H4O.webp',                                         'de840e10d633'],
  ['./img/menu/C4H6.webp',                                          'e36c76ff0fdd'],
  ['./img/menu/C5H5N.webp',                                         '9fa83752ec93'],
  ['./img/menu/C60.webp',                                           '07b61c87f841'],
  ['./img/menu/C6H6.webp',                                          '9fcf12f2f890'],
  ['./img/menu/CF4.webp',                                           '00fb87148911'],
  ['./img/menu/CH3.webp',                                           'e3232dd09c54'],
  ['./img/menu/CH3CN.webp',                                         'f12efa17a937'],
  ['./img/menu/CH3OH.webp',                                         '244f1fd87b76'],
  ['./img/menu/CH4.webp',                                           '223e72f16a86'],
  ['./img/menu/CN-.webp',                                           'f9cff42d0843'],
  ['./img/menu/CO.webp',                                            '01fd15782855'],
  ['./img/menu/CO2.webp',                                           'fd5a04d5eccc'],
  ['./img/menu/Cl2.webp',                                           '54820a0e9320'],
  ['./img/menu/CrCO6.webp',                                         '3c3a37df742f'],
  ['./img/menu/F2.webp',                                            '7a3646a1bdbc'],
  ['./img/menu/FeCO5.webp',                                         '6478b3ac02e7'],
  ['./img/menu/GeH4.webp',                                          '6481a64f145e'],
  ['./img/menu/H2.webp',                                            '95870cc2552f'],
  ['./img/menu/H2CO.webp',                                          'b40fd10ce49f'],
  ['./img/menu/H2O.webp',                                           '31276450c804'],
  ['./img/menu/H2O2.webp',                                          '4ef1e987ad6e'],
  ['./img/menu/H2S.webp',                                           '814acc4e56a7'],
  ['./img/menu/H2Se.webp',                                          '1dcb916a9724'],
  ['./img/menu/H3O+.webp',                                          '631330b45e44'],
  ['./img/menu/HBr.webp',                                           'b83f96a824e4'],
  ['./img/menu/HCN.webp',                                           'f20af7179991'],
  ['./img/menu/HCOOH.webp',                                         '579a8f2db87d'],
  ['./img/menu/HCl.webp',                                           'bf393a0bddf2'],
  ['./img/menu/HF.webp',                                            '523e57015b98'],
  ['./img/menu/KBr.webp',                                           'fa566e67cdcc'],
  ['./img/menu/KrF2.webp',                                          '6340499a9bf7'],
  ['./img/menu/Li4F4.webp',                                         '335fc4e13450'],
  ['./img/menu/LiF.webp',                                           'e907e2599572'],
  ['./img/menu/LiH.webp',                                           '5dffd6654693'],
  ['./img/menu/MgH2.webp',                                          'edee3919e0b6'],
  ['./img/menu/N-methylacetamide.webp',                             'd98a47cf4dcc'],
  ['./img/menu/N2.webp',                                            '7c0dd2040aab'],
  ['./img/menu/N2O.webp',                                           'ef469aec8a95'],
  ['./img/menu/NH2.webp',                                           'aba9a4bdfa7f'],
  ['./img/menu/NH3.webp',                                           '55f5da822871'],
  ['./img/menu/NH4+.webp',                                          '7d75ea341d05'],
  ['./img/menu/NO.webp',                                            '9605cc669931'],
  ['./img/menu/NO2.webp',                                           '2dfa2ccd05c8'],
  ['./img/menu/NaCl.webp',                                          '2dcf8515ea31'],
  ['./img/menu/NaH.webp',                                           '3ba7b7931ad7'],
  ['./img/menu/NiCO4.webp',                                         '7e9b3a116762'],
  ['./img/menu/O2.webp',                                            'f7e0b60aedca'],
  ['./img/menu/O3.webp',                                            'ae22cba0ec0d'],
  ['./img/menu/OH-.webp',                                           '401dd56d44fc'],
  ['./img/menu/OH.webp',                                            '04f443264f34'],
  ['./img/menu/PH3.webp',                                           'a0ffebc37f22'],
  ['./img/menu/SO2.webp',                                           '9fb03ba307bb'],
  ['./img/menu/SiH4.webp',                                          '4be53bbc6be0'],
  ['./img/menu/TiCl4.webp',                                         '290ab7438053'],
  ['./img/menu/adamantane.webp',                                    '651d5f06485f'],
  ['./img/menu/adenine.webp',                                       '72d66516e842'],
  ['./img/menu/alanine.webp',                                       'cb258fe9b700'],
  ['./img/menu/arginine.webp',                                      '579cd89f5393'],
  ['./img/menu/asparagine.webp',                                    '2637780cb2d2'],
  ['./img/menu/aspartic-acid.webp',                                 'e546c168e97c'],
  ['./img/menu/cubane.webp',                                        'f3d602a6d94e'],
  ['./img/menu/cysteine.webp',                                      'a3f8a4330a18'],
  ['./img/menu/cytosine.webp',                                      'b74d6ca65a26'],
  ['./img/menu/glutamic-acid.webp',                                 '2fa8bcb37263'],
  ['./img/menu/glutamine.webp',                                     'd46a9e51a93a'],
  ['./img/menu/glycine.webp',                                       '0977a26dfcc3'],
  ['./img/menu/guanine.webp',                                       '1bf4b307bf05'],
  ['./img/menu/histidine.webp',                                     '28362b4281e9'],
  ['./img/menu/ice-hexamer.webp',                                   '5238d16e317d'],
  ['./img/menu/isoleucine.webp',                                    '30ab0137da08'],
  ['./img/menu/leucine.webp',                                       'd58c7450f1c9'],
  ['./img/menu/lysine.webp',                                        '917066cdef73'],
  ['./img/menu/manifest.json',                                      '9d650039e1a0'],
  ['./img/menu/methionine.webp',                                    '44e8bb3eb50b'],
  ['./img/menu/orb-1s.webp',                                        '23e46b7b9f1c'],
  ['./img/menu/orb-2p.webp',                                        '5f539cd54e33'],
  ['./img/menu/orb-2s.webp',                                        '85f9e91c21e1'],
  ['./img/menu/orb-3d.webp',                                        '98f64e7c952f'],
  ['./img/menu/orb-3p.webp',                                        '2d0dd4d174a2'],
  ['./img/menu/orb-3s.webp',                                        '81b0c228d87f'],
  ['./img/menu/orb-4d.webp',                                        '4033ae5b7144'],
  ['./img/menu/orb-4f.webp',                                        '51febdac17ec'],
  ['./img/menu/orb-4p.webp',                                        'c55acaca68a2'],
  ['./img/menu/orb-4s.webp',                                        'a64f31ff7628'],
  ['./img/menu/orb-5d.webp',                                        '0524c0603244'],
  ['./img/menu/orb-5f.webp',                                        '187190354e8e'],
  ['./img/menu/orb-5p.webp',                                        '6d881bf9817b'],
  ['./img/menu/orb-5s.webp',                                        '6bc4cf092c1a'],
  ['./img/menu/orb-6d.webp',                                        'a4b1dfa27e55'],
  ['./img/menu/orb-6p.webp',                                        '2a835558711b'],
  ['./img/menu/orb-6s.webp',                                        'be32ff2dcfa7'],
  ['./img/menu/phenylalanine.webp',                                 '417ec334063d'],
  ['./img/menu/proline.webp',                                       '645223418b14'],
  ['./img/menu/serine.webp',                                        '3189d899e9c7'],
  ['./img/menu/threonine.webp',                                     '254400a3ef29'],
  ['./img/menu/thymine.webp',                                       '6b0f69ef49d0'],
  ['./img/menu/tryptophan.webp',                                    '27e64936ca91'],
  ['./img/menu/tyrosine.webp',                                      '19fc4a2db8f5'],
  ['./img/menu/uracil.webp',                                        'a5e82239acdb'],
  ['./img/menu/urea.webp',                                          'a26acea74988'],
  ['./img/menu/valine.webp',                                        'b924d01ac57a'],
  ['./img/warning-sign.png',                                        '736485228bdb'],
  ['./index.html',                                                  '0c2db1468861'],
  ['./informational.js',                                            '008e91f4f4ef'],
  ['./kepler.js',                                                   '11e0235e3f0d'],
  ['./keplerview.js',                                               '0b2d7636992f'],
  ['./key-table.js',                                                'dbdf0c4a7de0'],
  ['./kick.js',                                                     'ec9416252fd8'],
  ['./lab.css',                                                     'dd7d2104fbc2'],
  ['./ladder-model.js',                                             '69199febdca1'],
  ['./ladder.js',                                                   'ab571c69fb38'],
  ['./latex-state.js',                                              '4ab3fd7b1394'],
  ['./lattice-model.js',                                            '32fddccdfe0e'],
  ['./lattice.js',                                                  'b5e9e81f3d77'],
  ['./lebedev-302.json',                                            '9b9b2215df5f'],
  ['./library.js',                                                  '24cc656b9157'],
  ['./library.json',                                                '0a3531a7c866'],
  ['./linalg.js',                                                   'da2367cdcb97'],
  ['./look.js',                                                     'b3d232becd4e'],
  ['./main-menu.js',                                                '6366ad27ec5d'],
  ['./main.js',                                                     '2b262710e93f'],
  ['./manifest.webmanifest',                                        '4771fb9dfe63'],
  ['./mathworker.js',                                               '24be7393432f'],
  ['./md.js',                                                       'df8fbbb32009'],
  ['./meters.js',                                                   '227aa1cdb552'],
  ['./mir-gui.js',                                                  '43a37668a45f'],
  ['./mir/control-help.js',                                         'a28d8922cdca'],
  ['./mir/controls/arc.js',                                         'e82dca6b6007'],
  ['./mir/controls/colour-controls.css',                            'c52f3f82f755'],
  ['./mir/controls/controls.css',                                   '95e6bb8a9b9c'],
  ['./mir/controls/factory.js',                                     '04b193617990'],
  ['./mir/controls/gesture.js',                                     '660287dbe42c'],
  ['./mir/controls/lane.js',                                        '5dfa91cc4fce'],
  ['./mir/controls/list.js',                                        'a057a4ea8ed4'],
  ['./mir/controls/number.js',                                      'd38987ba3545'],
  ['./mir/controls/range.js',                                       'a4034a1ddcdf'],
  ['./mir/controls/select.js',                                      '2909ab11814e'],
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
  ['./mir/core/look.js',                                            'd8165b55068b'],
  ['./mir/core/motion.js',                                          '9dda4479b952'],
  ['./mir/core/perf.js',                                            '3b3f1b83bcb9'],
  ['./mir/core/png.js',                                             '9e58e798b1a5'],
  ['./mir/core/pointer.js',                                         '903b29573313'],
  ['./mir/core/prefs.js',                                           'cb425c74b9f2'],
  ['./mir/core/project.js',                                         '7598a3e62edc'],
  ['./mir/core/proximity.js',                                       '2bcdbd691c69'],
  ['./mir/core/session.js',                                         'e420ffcd3718'],
  ['./mir/core/wakelock.js',                                        '460826e7310c'],
  ['./mir/core/zip.js',                                             '14a6b76c144c'],
  ['./mir/css/base.css',                                            'cd9298663b6b'],
  ['./mir/css/skin.css',                                            '6d37eea39f57'],
  ['./mir/css/tokens.css',                                          'd2f047775c58'],
  ['./mir/folders/files.js',                                        '81edd3d3fc39'],
  ['./mir/folders/folders.css',                                     '7b3e889fefe6'],
  ['./mir/folders/folders.js',                                      '0523a1aa313d'],
  ['./mir/folders/gallery.js',                                      'd62355220c5e'],
  ['./mir/folders/project.js',                                      'd10ebd3cc79f'],
  ['./mir/folders/save-blob.js',                                    'd9449adac322'],
  ['./mir/folders/seed.js',                                         '14d216632eaf'],
  ['./mir/folders/zip.js',                                          '3fdf0fc07223'],
  ['./mir/fx/fx.css',                                               'd909967e07fe'],
  ['./mir/fx/parallax.js',                                          '917181043f58'],
  ['./mir/fx/pointer-light.js',                                     '34776863cfef'],
  ['./mir/glyph.js',                                                'b282c554f87e'],
  ['./mir/history/domains.js',                                      '20e80acd0cb2'],
  ['./mir/history/history.css',                                     'abfe9af6e771'],
  ['./mir/history/history.js',                                      '4ec5b905aa9f'],
  ['./mir/info/bodies.js',                                          'ed90b7735c5c'],
  ['./mir/info/faces.css',                                          'cd6a39e8a606'],
  ['./mir/info/info.css',                                           'eed45c8ec632'],
  ['./mir/info/layer.js',                                           '42551c99ee92'],
  ['./mir/info/leader.js',                                          'f37ce255f05c'],
  ['./mir/info/seats.js',                                           'b0f0ecdbd8f6'],
  ['./mir/keyboard/keyboard.css',                                   'c1ad0ed41067'],
  ['./mir/keyboard/keyboard.js',                                    '0e59546dfe76'],
  ['./mir/kit.js',                                                  '57333afad940'],
  ['./mir/locales/locales.css',                                     'cd2925eb7e5a'],
  ['./mir/locales/pseudo.js',                                       '152dbb0290ec'],
  ['./mir/mir.css',                                                 'ce22eac321f2'],
  ['./mir/modulation/audio-capture.js',                             '5960299735f0'],
  ['./mir/modulation/bind.js',                                      'c2e07e1a78ef'],
  ['./mir/modulation/curve-gesture.js',                             '6022331253e1'],
  ['./mir/modulation/curve.js',                                     'f5ccc9c84f11'],
  ['./mir/modulation/host.js',                                      '14168ad3ca25'],
  ['./mir/modulation/layout-motion.js',                             'bad0ef731bcc'],
  ['./mir/modulation/mod-cursor.js',                                '4984041d0263'],
  ['./mir/modulation/mod.js',                                       '8c7a02ad2c33'],
  ['./mir/modulation/modhost.css',                                  'ca03b2efb348'],
  ['./mir/modulation/modwindow/modwindow.css',                      '6a8e34de3c74'],
  ['./mir/modulation/modwindow/modwindow.js',                       'ba87946b95b3'],
  ['./mir/modulation/project.js',                                   '39e2c203e3ed'],
  ['./mir/modulation/registry.js',                                  '1fb9c97b41dd'],
  ['./mir/modulation/window.js',                                    'fc89361f5032'],
  ['./mir/notes/notes.css',                                         'cbe347e37ed0'],
  ['./mir/palette.js',                                              '36dfda19e93d'],
  ['./mir/panels/camera-rig.js',                                    '23609501fb0d'],
  ['./mir/panels/camera.css',                                       'a7bb44f9271f'],
  ['./mir/panels/camera.js',                                        '57f72e8128c5'],
  ['./mir/panels/curves.css',                                       '22c3d24fb552'],
  ['./mir/panels/curves.js',                                        '0df113000391'],
  ['./mir/panels/grade.css',                                        'da0334f1bdf9'],
  ['./mir/panels/lanes.css',                                        'f039f68d9930'],
  ['./mir/panels/picture-filter.js',                                'cd45299da223'],
  ['./mir/panels/ramp.css',                                         '9dff67db7447'],
  ['./mir/panels/ramp.js',                                          '2c2d147ee98e'],
  ['./mir/panels/xy.css',                                           '4b3f5226b680'],
  ['./mir/pattern/model.js',                                        'c3abd54fdd37'],
  ['./mir/pattern/pattern.css',                                     '09c0f37f9b0e'],
  ['./mir/plane-model.js',                                          '6824b88b33ca'],
  ['./mir/render/clock.js',                                         '523f12e590b1'],
  ['./mir/render/encoder.js',                                       'c903b688f1ab'],
  ['./mir/render/mp4.js',                                           '1d9621eab1b9'],
  ['./mir/render/panel.js',                                         '5ba374981fb1'],
  ['./mir/render/plan.js',                                          'e1af78564bb3'],
  ['./mir/render/recorder.js',                                      '801572cb4d03'],
  ['./mir/render/render.css',                                       '6b98cd69e02e'],
  ['./mir/render/selftest.js',                                      '107919b613ca'],
  ['./mir/render/store-worker.js',                                  '2aa00d1055d0'],
  ['./mir/render/store.js',                                         '6b9b0705103f'],
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
  ['./mir/shell/gui.css',                                           'bd1203bce2e8'],
  ['./mir/shell/gui.js',                                            '12fc9592987a'],
  ['./mir/shell/keys.js',                                           '3405f3f01ddb'],
  ['./mir/shell/menubar.js',                                        '6ea4a008e968'],
  ['./mir/shell/notebook-math.js',                                  'fa1312541d4c'],
  ['./mir/shell/notebook-render.js',                                '60f8e1193c27'],
  ['./mir/shell/notebook.js',                                       'ef2b9c03193e'],
  ['./mir/shell/notice.js',                                         '729f7c83f2be'],
  ['./mir/shell/opener.css',                                        '85ef9ab9e3f7'],
  ['./mir/shell/pages.css',                                         '66dd1f06b643'],
  ['./mir/shell/pages.js',                                          'f7e821b4455a'],
  ['./mir/shell/parts.css',                                         '830878076e9f'],
  ['./mir/shell/rack-scrollbar.js',                                 '79a3cd1ec59a'],
  ['./mir/shell/rack.css',                                          '39a035955065'],
  ['./mir/shell/rack.js',                                           '6bbebac01568'],
  ['./mir/shell/scene-guard.js',                                    '0c41641e90c5'],
  ['./mir/shell/shell.css',                                         '48f2f875d824'],
  ['./mir/shell/stage.css',                                         'db4a83037ab9'],
  ['./mir/shell/themes.js',                                         'f811f9ba3e50'],
  ['./mir/shell/transport.css',                                     '0fbb6bfe341d'],
  ['./mir/shell/transport.js',                                      'df602dd57309'],
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
  ['./mir/timeline/knobs.js',                                       'a58be3d0e053'],
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
  ['./mir/timeline/window.js',                                      '68082a149adb'],
  ['./mir/version.js',                                              'ff577b1f0695'],
  ['./mir/window-activity.js',                                      '8eb6cefdf972'],
  ['./mir/window/dock.js',                                          '6b678fe06223'],
  ['./mir/window/rail.js',                                          '60d28f8f5c58'],
  ['./mir/window/window.css',                                       'caec49352b98'],
  ['./mir/window/window.js',                                        '7587cddda52a'],
  ['./mir/window/workspaces.js',                                    '060feaa914d7'],
  ['./mod-port.js',                                                 '0f4692bd04ec'],
  ['./modrive.js',                                                  '89b99a6568d1'],
  ['./molecular-field.js',                                          'caa6acc2bd92'],
  ['./molecular-flow.js',                                           '89e7476defe3'],
  ['./molecular-register.js',                                       'c274a236d6ef'],
  ['./molecular-session.js',                                        '73c9422639b0'],
  ['./molecule-state.js',                                           'b6884ee2026f'],
  ['./molecule.js',                                                 'a2f3c70b3705'],
  ['./molecules.js',                                                'feeaf413453c'],
  ['./momentum.js',                                                 '0b32cc20e73a'],
  ['./motion-pref.js',                                              '34329c802c8b'],
  ['./names.js',                                                    'b86365c82584'],
  ['./native-ui.js',                                                '4cd67ee746f0'],
  ['./new-project.lambdawaves.json',                                '1134ce61cd21'],
  ['./occlusion.js',                                                'd9d6c6d5b7c6'],
  ['./orbit.js',                                                    '244571342fd8'],
  ['./orbitalsview.js',                                             'b285d4f9b149'],
  ['./paint-stroke.js',                                             'cbfdfa8270c5'],
  ['./palette-app.js',                                              '3d150ac4b027'],
  ['./particles.js',                                                '639d5fc3f9dd'],
  ['./period.js',                                                   'd1a5945d9701'],
  ['./project-store.js',                                            '0104d6574b00'],
  ['./projects.js',                                                 '73fbe35b271a'],
  ['./qho.js',                                                      'c53df7146830'],
  ['./rack.js',                                                     '6be696543452'],
  ['./radiation.js',                                                '7f5588694aea'],
  ['./radiationview.js',                                            '9b58ca5dd321'],
  ['./registerview.js',                                             'bda848c349e4'],
  ['./render-exact.js',                                             'ba2c25105cb5'],
  ['./response-fit.js',                                             'fe7942d74051'],
  ['./rhf-molecule.js',                                             '0f171d6be838'],
  ['./rotor4.js',                                                   '074250aea7e6'],
  ['./rpa-inspector.js',                                            'baf1eaa062e7'],
  ['./scf.js',                                                      '3dc2b4957407'],
  ['./separable.js',                                                '7270826b4c3d'],
  ['./settings-store.js',                                           'afddb78069e2'],
  ['./shadowview.js',                                               'ad101af8b299'],
  ['./shell/controller.js',                                         'eec96f66027c'],
  ['./shell/facade.js',                                             '00d626c0d545'],
  ['./shell/history.js',                                            'f5cb12c3a702'],
  ['./shell/ink.js',                                                'a6eb4a1b482e'],
  ['./shell/keys.js',                                               '48009d7b0094'],
  ['./shell/links.js',                                              '511228c2f630'],
  ['./shell/modulation.js',                                         '3f4d83dfaa55'],
  ['./shell/notebook.js',                                           '76d466cde89e'],
  ['./shell/persist.js',                                            '0783700f37e0'],
  ['./shell/rack-wiring.js',                                        '2b03548254dc'],
  ['./shell/settings.js',                                           '9fe007cff59d'],
  ['./shell/stage-words.js',                                        '3129096af9c4'],
  ['./shell/transport.js',                                          'e5ade0b011d2'],
  ['./skeleton.js',                                                 '3a2da750378b'],
  ['./skin.css',                                                    '573a70c24ea8'],
  ['./slice.js',                                                    '3bab50c848d6'],
  ['./sliceview.js',                                                '42b8617991bb'],
  ['./spectrum.js',                                                 '593f9100b49b'],
  ['./stage-gestures.js',                                           '82fdea3cadbd'],
  ['./stark.js',                                                    'c376066a7e2f'],
  ['./state.js',                                                    '9cfce483234b'],
  ['./statelink.js',                                                '95ab7b495303'],
  ['./statesview.js',                                               'c6508e6a0a57'],
  ['./status.js',                                                   '5eff2b81e0ba'],
  ['./sturmian.js',                                                 '47ed5b7c81da'],
  ['./sturmianreg.js',                                              '1ce5f44b2fae'],
  ['./sw-client.js',                                                '0f1ffadd0978'],
  ['./vendor/bse/6-31+g-star-v1.json',                              'ddcbd84daf46'],
  ['./vendor/bse/index.json',                                       'ed5f82e3438e'],
  ['./vendor/bse/sto-3g-v1.json',                                   '22ce59b9ec99'],
  ['./verbs.js',                                                    '38947225690e'],
  ['./vortex.js',                                                   'ac9be4da361b'],
  ['./well.js',                                                     'fb6041eac116'],
  ['./wigner.js',                                                   '668d13ce809c'],
  ['./wignerview.js',                                               '1c7aad8eea42'],
  ['./window-chrome.js',                                            'd9970bf0ad11'],
  ['./windows/film.js',                                             'ec2b5d6ecb4c'],
  ['./windows/kepler.js',                                           '2d9fcc1f083d'],
  ['./windows/material.js',                                         '0cda2baabea6'],
  ['./windows/molecules.js',                                        '719a973de123'],
  ['./windows/readouts.js',                                         '52a3d253558e'],
  ['./windows/settings-card.js',                                    'a583eece1050'],
  ['./windows/spectrum.js',                                         '8fbbbea4e95c'],
  ['./windows/state.js',                                            'c486efd7a2d4'],
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
 * 9.5 MiB, over the 8 MiB ceiling; without them it is 7.3.  `*` is one path segment.  On a 1.4 tree neither exists. */
const DATA = ['library/'];
const DATA_CACHE = 'lw-data-v1';
const SKIP = ['mir/locales/*.json', 'mir/tokens.json'];

/* WHAT IS DELIBERATELY *NOT* IN §1, and why.  The test asserts this list is exactly what the walk skips. */
const NEVER_PRECACHE = [
  ['sw.js',                'a worker that caches itself can never be updated: the browser fetches sw.js through its own byte-comparison path, and a Cache API copy in front of that is the classic way to strand a build forever.'],
  ['smoke.html',           'a bench page for the browser proof, not part of the lab; caching it would put a dev harness on the home screen.'],
  ['*.md, *.txt EXCEPT a LICENCE text',
                           'shipped documents (skin-notes, PORT-NOTES, the *-SOURCE.txt build records) are served, never loaded by the running lab — precaching them would make every prose edit a new build. THE LICENCES ARE THE EXCEPTION and they ARE precached (wave 59): the font binaries they cover are in this list, and OFL section 2 says each copy must CONTAIN the licence — an offline install that holds twenty-three fonts and cannot reach one licence is not that copy. It costs 22 KB and licence texts change approximately never.'],
  ['vendor/katex/LICENSE', 'NO LONGER SKIPPED, for the same reason: it is the MIT text for KaTeX\'s code and it is precached with vendor/katex/fonts/OFL.txt beside it.'],
  ['a DATA root (§1b: library/)', 'an orbital record is content-addressed device content — installed on a press or by the open that names it, kept in lw-data-v1 across builds, and never a byte of every visitor\'s install.'],
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
