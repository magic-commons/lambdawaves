// S4 probe: does a rotation rate move the register (the edit scope) while the field clock is PAUSED?  And while playing?
const w = (n) => new Promise((r) => setTimeout(r, n));
const H = __LW.history, ser = () => JSON.stringify(__LW.serialize({ scope: 'edit' }));
__LW.loadPreset('2px'); __LW.pause(); await w(200); H.flush(); await w(450); H.flush();
const out = { playing0: __LW.clock.playing };
__LW.setRotRate('z', 0.3); await w(100);
const a = ser(); await w(800); const b = ser(); await w(800); const c = ser();
out.paused = { playing: __LW.clock.playing, driving: __LW.rotDriving, moved1: a !== b, moved2: b !== c, regMoved: JSON.stringify(JSON.parse(a).experiment) !== JSON.stringify(JSON.parse(b).experiment) };
__LW.play(); await w(200); const d = ser(); await w(800); const e = ser();
out.playing = { playing: __LW.clock.playing, moved: d !== e };
__LW.pause(); __LW.setRotRate('z', 0); await w(300); H.flush();
out.errs = __e.slice();
return out;
