// iteration 012 M1 · the live key table as the KEYBOARD window reads it
export default { query: '&starter=home&menu=0', scenes: [
  { name: null, js: `return __LW.keys.table.list().map((x) => [x.group, x.id, (x.keys || []).join('/'), x.label].join(' | ')); ` },
  { name: null, js: `return __LW.keys.conflicts ? __LW.keys.conflicts() : null; ` },
]};
