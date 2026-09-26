// S4 VERIFY item 1: with the rack SCROLLED (every card open, the HISTORY card part-way down), 30 edits and goto(3) / goto(28)
// move the list's own scrollTop and never the rack's or the document's
const w = (n) => new Promise((r) => setTimeout(r, n)), raf = () => new Promise((r) => requestAnimationFrame(() => r()));
const H = __LW.history, d = document.querySelector('.dev[data-id="history"]'), list = d.querySelector('.hist-list');
for (const x of document.querySelectorAll('#rack .dev')) { x.hidden = false; x.classList.remove('closed'); }
await w(400);
const rack = d.parentElement; const scrollable = rack.scrollHeight > rack.clientHeight;
/* put the history card's list about a third of the way into the rack's view */
rack.scrollTop += list.getBoundingClientRect().top - rack.getBoundingClientRect().top - rack.clientHeight / 3; await w(100);
const sc = () => [Math.round(document.scrollingElement.scrollTop), Math.round(rack.scrollTop)];
H.flush(); await w(450); H.flush(); H.clear();
const s0 = sc();
for (let i = 1; i <= 30; i++) { __LW.setStage(0.2 + i / 100); H.flush(); await raf(); }
const s1 = sc(), l1 = list.scrollTop;
H.goto(3); await raf(); await raf(); const s2 = sc(), l2 = list.scrollTop;
H.goto(28); await raf(); await raf(); const s3 = sc(), l3 = list.scrollTop;
const c = list.querySelector('[aria-current="true"]'), L = list.getBoundingClientRect(), R = c.getBoundingClientRect();
return { rack: rack.id, scrollable, rackH: [rack.clientHeight, rack.scrollHeight], before: s0, after30: s1, afterGoto3: s2, afterGoto28: s3, listScroll: [l1, l2, l3], curInView: R.top >= L.top - 0.5 && R.bottom <= L.bottom + 0.5 };
