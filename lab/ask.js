/* lab/ask.js — 0.6.6 G2 THE CLIENT.  ask(text) posts { text, inventory, history } to askUrl (PREFERENCE; tools/gemma/broker.py), runs her
 * verbs — and her notebook block as one more verb — through the verb table as ONE run (who GEMMA: one history row), holds her `say` on
 * the stage until Escape or the next ask, and never throws: a broker that is not there is one line, in the strip and in METERS. */
export const askUrlOf = (ui) => (ui.askUrlIn && ui.askUrlIn.value.trim()) || `${location.protocol}//${location.hostname}:9443/ask`;   // the page’s own scheme (an HTTPS page fetches HTTPS)
export function createAsk(app) {
  const { ui } = app, turns = [], api = { busy: false, last: null, ask };
  let held = null, said = false;
  const dismiss = () => { if (held && app.state.stageText) app.state.stageText.dismiss(held); held = null; };
  addEventListener('keydown', (e) => { if (e.key === 'Escape') dismiss(); });
  async function ask(text) {
    const url = askUrlOf(ui), verbs = app.sh.verbs;
    if (!verbs) return (api.last = { error: 'the verb table is not here' });
    api.busy = true; const ac = new AbortController(), timer = setTimeout(() => ac.abort(), 60000);
    let rep;
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, signal: ac.signal,
        body: JSON.stringify({ text, inventory: verbs.inventory(), history: turns.slice(-6) }) });
      rep = (await r.json()) || {};
    } catch (_) {
      const error = 'Gemma is not reachable at ' + url + ' — start tools/gemma/start.sh';
      if (app.w.wMet) { app.w.wMet.setStatus(error, 'warn'); said = true; }
      return (api.last = { error });
    } finally { clearTimeout(timer); api.busy = false; }
    if (said && app.w.wMet) { app.w.wMet.setStatus('', ''); said = false; }
    const say = typeof rep.say === 'string' ? rep.say : '', list = Array.isArray(rep.verbs) ? rep.verbs.slice() : [];
    if (typeof rep.notebook === 'string' && rep.notebook) list.push({ verb: 'notebook', args: { md: rep.notebook } });
    const res = list.length ? await verbs.run(list, { who: 'GEMMA' }) : { ran: 0, refused: [] }, refused = res.refused || [];
    turns.push({ text, say }); if (turns.length > 6) turns.shift();
    dismiss(); if (say && app.state.stageText && app.state.stageText.announce(say, 0)) held = say;
    const dropped = refused.map((x) => x.verb).join(', ');
    return (api.last = { say, echo: say + (dropped ? ' (dropped: ' + dropped + ')' : ''), ran: res.ran, refused });
  }
  return api;
}
