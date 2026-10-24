"""summarize.py — one line per leak_*.json (leak_any.py and leak_repair.py results)."""
import os, json, glob
HERE = os.path.dirname(os.path.abspath(__file__))
for p in sorted(glob.glob(os.path.join(HERE, 'leak_*.json'))):
    d = json.load(open(p)); comp = d.get('component', 0); r = d['repair']
    mom = lambda k: d[k]['r'][comp] if 'r' in d[k] else d[k]['xyz'[comp]]
    print(os.path.basename(p), '| nAO', d.get('nAO'), 'E', d.get('E_RHF'), 'pair', d.get('pair'), 'axis', 'xyz'[comp], 'half', round(d['half'], 3), 'h', round(d['h'], 3), 't', round(d['time_total_s']), 's')
    print('   dE', round(d['dEps'], 5), 'x_HL', round(d['x_HL'], 5), 'g_HL', round(d['g_HL'], 5), 'q', round(d['q'], 4), '| int r s', round(mom('leak_s'), 6), 'analytic', round(d['first_moment_analytic'], 6),
          '| share exch/basis', round(d['first_moment_share']['exchange'], 4), round(d['first_moment_share']['basis'], 4))
    print('   L1 s/e/b', round(d['leak_s']['L1'], 4), round(d['exchange_e']['L1'], 4), round(d['basis_b']['L1'], 4), 'near-nucleus s/e/b', *[round(v, 3) for v in d['L1_share_within_0.3_bohr_of_a_nucleus'].values()], 'max s', round(d['leak_s']['max'], 2))
    print("   q' closed", round(r['neumann']['q_repaired'], 6), 'open', round(r['dirichlet']['q_repaired'], 4), '|c|/|j|', round(r['neumann']['norm_c_over_norm_j'], 4),
          'K check', '%.1e' % d['check_exchange_matrix_grid_vs_int2e']['max_abs_diff'], 'J check', '%.1e' % d['check_hartree_matrix_grid_vs_int2e']['max_abs_diff'])
    if 'frontier_pairs' in d:
        for k, v in d['frontier_pairs'].items(): print('   pair', k, 'dE', round(v['dEps'], 5), 'x', [round(a, 5) for a in v['x_HL']], 'g', [round(a, 5) for a in v['g_HL']], 'q', None if v['q'] is None else round(v['q'], 4))
