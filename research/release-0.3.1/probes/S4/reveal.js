// S4 follow-up probe: a jump made while the HISTORY card is CLOSED — is the current row in the list's view when it reopens?
const w = (n) => new Promise((r) => setTimeout(r, n)), frame = () => new Promise((r) => requestAnimationFrame(() => r()));
const H = __LW.history, dev = document.querySelector('.dev[data-id="history"]'), list = dev.querySelector('.hist-list');
dev.classList.remove('closed'); if (dev.classList.contains('folded')) dev.querySelector('.dev-fold').click(); dev.scrollIntoView({ block: 'center' });
for (let i = 1; i <= 25; i++) { __LW.setStage(0.2 + i / 100); H.flush(); }
await frame(); await w(100);
list.scrollTop = 0; dev.classList.add('closed'); await frame(); H.goto(1); await frame(); await w(50);
__LW.layout.reopen('history'); await frame(); await frame(); await w(150);
const here = list.querySelector('[aria-current]'), L = list.getBoundingClientRect(), R = here.getBoundingClientRect();
return { current: +here.querySelector('.hist-i').textContent, shown: R.top >= L.top - 0.5 && R.bottom <= L.bottom + 0.5, scrollTop: list.scrollTop };
