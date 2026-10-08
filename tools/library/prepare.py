#!/usr/bin/env python
"""Prepare the finite F5 roster. Builds are explicit fallbacks, never experimental claims."""
import json,re,math,shlex,itertools
from pathlib import Path
import numpy as np
from scipy.optimize import minimize
import networkx as nx
from pyscf import gto
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'research/release-0.4.0/library-census'
present=json.loads((OUT/'present-input.json').read_text())['molecules']
refs=json.loads((ROOT/'tools/library/reference-geometries.json').read_text())
def cif_geometry(code):
    if code not in refs:return None
    text=refs[code]['cif'];lines=text.splitlines();cols=[];rows=[];reading=False
    for line in lines:
        if line.startswith('_chem_comp_atom.'):
            cols.append(line.strip());reading=True
        elif reading and line and not line.startswith(('#','loop_','_')):
            t=shlex.split(line)
            if len(t)==len(cols):rows.append(t)
        elif reading and rows:break
    xyz=['_chem_comp_atom.pdbx_model_Cartn_'+q+'_ideal' for q in 'xyz']
    if not all(q in cols for q in xyz) or not rows:return None
    zcol=cols.index('_chem_comp_atom.type_symbol');xyz=[cols.index(q) for q in xyz]
    atoms=[[gto.charge(t[zcol]),*[float(t[j]) for j in xyz]] for t in rows]
    return atoms
def smiles_graph(s):
    # Small explicit parser for the checked strings below; no stereochemical assertion.
    tokens=re.findall(r'\[[^\]]+\]|Cl|Br|Si|[BCNOPSFIbcnops]|[0-9]|[()=#.-]',s)
    assert ''.join(tokens)==s.replace('@','') or ''.join(tokens)==s
    a=[];e=[];current=None;stack=[];rings={};order=None
    for t in tokens:
        if t=='(':stack.append(current)
        elif t==')':current=stack.pop()
        elif t in ['=','#','-']:order={'=':2.,'#':3.,'-':1.}[t]
        elif t=='.':current=None
        elif t.isdigit():
            if t in rings:
                j,o=rings.pop(t);e.append((current,j,order or o or (1.5 if a[current]['arom'] and a[j]['arom'] else 1.)));order=None
            else:rings[t]=(current,order);order=None
        else:
            bracket=t.startswith('[');inner=t[1:-1] if bracket else t
            sym=re.match(r'[A-Z][a-z]?|[a-z]',inner)[0];arom=sym.islower();sym=sym.capitalize()
            hm=re.search(r'H(\d*)',inner);h=int(hm[1] or 1) if hm else (0 if bracket else None)
            j=len(a);a.append({'symbol':sym,'arom':arom,'h':h})
            if current is not None:e.append((current,j,order or (1.5 if arom and a[current]['arom'] else 1.)))
            current=j;order=None
    assert not rings and not stack
    for j,atom in enumerate(list(a)):
        val=sum(o for i,k,o in e if i==j or k==j)
        h=atom['h']
        if h is None:
            target={'C':4,'N':3,'O':2,'S':2,'P':5,'Si':4,'F':1,'Cl':1,'Br':1,'B':3}[atom['symbol']]
            h=max(0,int(round(target-val)))
        for _ in range(h):k=len(a);a.append({'symbol':'H','arom':False,'h':0});e.append((j,k,1.))
    return a,e
def embed(s):
    a,e=smiles_graph(s);n=len(a);Z=[gto.charge(x['symbol']) for x in a]
    radii={1:.31,6:.76,7:.71,8:.66,16:1.05,15:1.07,14:1.11,5:.84}
    graph=nx.Graph();graph.add_nodes_from(range(n));graph.add_edges_from((i,j) for i,j,o in e)
    cycles=nx.cycle_basis(graph);smallcycles=[set(c) for c in cycles if len(c) in [5,6]]
    lengths={};restraints=[];bondset=set()
    for i,j,o in e:
        d=(radii[Z[i]]+radii[Z[j]])*({1.:1,1.5:.92,2.:.86,3.:.79}[o]);lengths[frozenset([i,j])]=d
        restraints.append((i,j,d,30.));bondset.add(frozenset([i,j]))
    for j in range(n):
        neighbors=list(graph[j]);sp2=a[j]['arom'] or any(o>=2 for i,k,o in e if i==j or k==j)
        for i,k in itertools.combinations(neighbors,2):
            theta=120. if sp2 else (104.5 if Z[j]==8 else 109.47)
            if a[j]['arom']:
                match=next((c for c in smallcycles if {i,j,k}<=c),None)
                if match is not None:theta=180.-360./len(match)
                elif any(len(c)==5 and j in c for c in smallcycles):theta=126.
            dij=lengths[frozenset([i,j])];dkj=lengths[frozenset([k,j])]
            target=math.sqrt(dij*dij+dkj*dkj-2*dij*dkj*math.cos(math.radians(theta)))
            restraints.append((i,k,target,4.));bondset.add(frozenset([i,k]))
    non=[(i,j,1.25*(radii[Z[i]]+radii[Z[j]])) for i in range(n) for j in range(i) if frozenset([i,j]) not in bondset]
    def fun(v):
        p=v.reshape(n,3);grad=np.zeros_like(p);energy=0.
        for i,j,target,weight in restraints:
            vec=p[i]-p[j];d=max(np.linalg.norm(vec),1e-12);r=d-target;energy+=weight*r*r;v=2*weight*r*vec/d;grad[i]+=v;grad[j]-=v
        for i,j,low in non:
            vec=p[i]-p[j];d=max(np.linalg.norm(vec),1e-12)
            if d<low:r=d-low;energy+=3*r*r;v=6*r*vec/d;grad[i]+=v;grad[j]-=v
        return energy,grad.ravel()
    best=None
    for seed in [1701,1702,1703]:
        pos=np.array(list(nx.spring_layout(graph,seed=seed,dim=3,scale=max(2.,n/8.)).values()))
        opt=minimize(fun,pos.ravel(),jac=True,method='L-BFGS-B',options={'maxiter':1500,'ftol':1e-11})
        if best is None or opt.fun<best.fun:best=opt
    p=best.x.reshape(n,3);p-=p.mean(axis=0)
    return [[z,*v] for z,v in zip(Z,p.tolist())]
def formula(ang):
    counts={}
    for z,*_ in ang:sym=gto.mole._symbol(int(z));counts[sym]=counts.get(sym,0)+1
    keys=(['C']+(['H'] if 'H' in counts else [])+sorted(k for k in counts if k not in ['C','H'])) if 'C' in counts else sorted(counts)
    return ''.join(s+(str(counts[s]) if counts[s]>1 else '') for s in keys)
rows=[]
def add(id,name,section,ang,source,family=None,motifs=None,charge=0,opt=False,mode=None,smiles=None,origin='PLAN F5'):
    rows.append({'id':id,'name':name,'formula':formula(ang) if ang else None,'section':section,'family':family,'charge':charge,'multiplicity':1,'geometry':{'atomsAngstrom':ang,'source':source,'status':'DERIVED' if opt else 'MEASURED','experimentalStatus':'UNVERIFIED' if opt or 'wwPDB' in source else 'UNVERIFIED','why':'Coordinates copied from a reference or built here; experimental attribution is quoted, not independently remeasured.'},'motifs':motifs or [],'optimise':opt,'optimisationMode':mode,'smiles':smiles,'origin':origin})
# Primary sections are disjoint; original app group is retained separately.
for m in present:
    section={'diatomics':'DIATOMICS','hydrides':'HYDRIDES','triatomics':'HYDRIDES','organics':'ORGANIC','rings':'ORGANIC','ions':'HYDRIDES','heavy':'HEAVY'}[m['group']]
    if m['id'] in ['OH-','CN-']:section='DIATOMICS'
    family='amino-acids' if m['id']=='glycine' else None
    if m['id'] in ['glycine','urea']:section='BIO'
    motifs={'C3H6':['ring:3'],'C4H4O':['ring:5'],'C5H5N':['ring:6'],'C6H6':['ring:6'],'CuH':['d-block'],'ZnH2':['d-block']}.get(m['id'],[])
    add(m['id'],m['name'],section,m['ang'],m['source']+'; immutable input: lab/molecules.js; https://cccbdb.nist.gov/expgeom1x.asp',family,motifs,m['charge'],origin='present entry')
    rows[-1]['appGroup']=m['group'];rows[-1]['presentInstability']=m['instability'];rows[-1]['appPredictedMs']=m['predictedMs']
aa=[('alanine','ALA','N[C@@H](C)C(=O)O'),('arginine','ARG','N[C@@H](CCCNC(=N)N)C(=O)O'),('asparagine','ASN','N[C@@H](CC(=O)N)C(=O)O'),('aspartic acid','ASP','N[C@@H](CC(=O)O)C(=O)O'),('cysteine','CYS','N[C@@H](CS)C(=O)O'),('glutamine','GLN','N[C@@H](CCC(=O)N)C(=O)O'),('glutamic acid','GLU','N[C@@H](CCC(=O)O)C(=O)O'),('histidine','HIS','N[C@@H](Cc1cnc[nH]1)C(=O)O'),('isoleucine','ILE','CC[C@H](C)[C@H](N)C(=O)O'),('leucine','LEU','CC(C)C[C@H](N)C(=O)O'),('lysine','LYS','N[C@@H](CCCCN)C(=O)O'),('methionine','MET','N[C@@H](CCSC)C(=O)O'),('phenylalanine','PHE','N[C@@H](Cc1ccccc1)C(=O)O'),('proline','PRO','O=C(O)[C@@H]1CCCN1'),('serine','SER','N[C@@H](CO)C(=O)O'),('threonine','THR','N[C@@H]([C@H](O)C)C(=O)O'),('tryptophan','TRP','N[C@@H](Cc1c[nH]c2ccccc12)C(=O)O'),('tyrosine','TYR','N[C@@H](Cc1ccc(O)cc1)C(=O)O'),('valine','VAL','CC(C)[C@H](N)C(=O)O')]
for name,code,s in aa:
    ang=cif_geometry(code)
    # ARG and LYS reference protonation is +1; the census fixes neutral free amino acids.
    if code in ['ARG','LYS']:ang=None
    opt=ang is None
    if opt:ang=embed(s)
    src=('optimised here, UNVERIFIED against experiment; built from checked neutral connectivity '+s+'; one conformer, absolute stereochemistry UNVERIFIED; coordinate downloads inaccessible') if opt else 'wwPDB Chemical Component Dictionary '+code+' ideal reference coordinates, free neutral component including leaving atoms; '+refs[code]['url']+'; computed reference, UNVERIFIED against experiment'
    tags=[]
    if name in ['histidine','tryptophan']:tags+=['ring:5']
    if name in ['phenylalanine','tyrosine','tryptophan']:tags+=['ring:6']
    add(name.replace(' ','-'),name,'BIO',ang,src,'amino-acids',tags,opt=opt,smiles=s)
bases=[('adenine','Nc1ncnc2[nH]cnc12'),('guanine','Nc1nc2[nH]cnc2c(=O)[nH]1'),('cytosine','Nc1cc[nH]c(=O)n1'),('thymine','Cc1c[nH]c(=O)[nH]c1=O'),('uracil','O=c1cc[nH]c(=O)[nH]1')]
for name,s in bases:
    add(name,name,'BIO',embed(s),'optimised here, UNVERIFIED against experiment; neutral canonical tautomer connectivity '+s+'; coordinate downloads inaccessible','nucleobases',['nucleobase','ring:6']+(['ring:5'] if name in ['adenine','guanine'] else []),opt=True,smiles=s)
organics=[('Gly-Gly','glycylglycine','BIO','NCC(=O)NCC(=O)O',['peptide bond']),('N-methylacetamide','N-methylacetamide','BIO','CNC(C)=O',['peptide bond']),('imidazole','imidazole','BIO','c1ncc[nH]1',['ring:5']),('indole','indole','BIO','c1ccc2[nH]ccc2c1',['ring:5','ring:6']),('phosphoric-acid','phosphoric acid','BIO','OP(=O)(O)O',[]),('ribose','ribose (ribofuranose conformer)','BIO','OCC1OC(O)C(O)C1O',['ring:5']),('cubane','cubane','LATTICE','C12C3C4C1C5C2C3C45',['ring:4','cage']),('neopentane','neopentane','LATTICE','CC(C)(C)C',[]),('naphthalene','naphthalene','LATTICE','c1ccc2ccccc2c1',['ring:6']),('Si5H12','neopentasilane','LATTICE','Si[Si](Si)(Si)Si',[]),('adamantane','adamantane','ORGANIC','C1C2CC3CC1CC(C2)C3',['ring:6','cage']),('caffeine','caffeine','BIO','Cn1c(=O)c2c(ncn2C)n(C)c1=O',['ring:5','ring:6']),('DMT','N,N-dimethyltryptamine','BIO','CN(C)CCc1c[nH]c2ccccc12',['ring:5','ring:6'])]
for id,name,sec,s,tags in organics:
    add(id,name,sec,embed(s),'optimised here, UNVERIFIED against experiment; built connectivity '+s+'; coordinate downloads inaccessible; conformer/stereochemistry not experimentally verified',motifs=tags,opt=True,smiles=s)
def cube(za,zb,edge):return [[za if sum(t)>0 and int(sum(t)) in [-3,1] else zb,*[edge*x/2 for x in t]] for t in itertools.product([-1,1],repeat=3)]
# Parity assigns four atoms of each kind; preserve finite cube topology during optimisation.
def cube(za,zb,edge):return [[za if np.prod(t)>0 else zb,*[edge*x/2 for x in t]] for t in itertools.product([-1,1],repeat=3)]
for id,za,zb,edge in [('Li4H4',3,1,1.9),('Li4F4',3,9,1.9),('Mg4O4',12,8,2.0),('Na4Cl4',11,17,2.5)]:
    add(id,id+' finite alternating cube','LATTICE',cube(za,zb,edge),'optimised here, UNVERIFIED against experiment; finite alternating cube; scalar edge-length RHF optimisation under Td symmetry',motifs=['cluster'],opt=True,mode='scale')
ang=[[11,-1.25,-1.25,0],[17,1.25,-1.25,0],[11,1.25,1.25,0],[17,-1.25,1.25,0]]
add('Na2Cl2','disodium dichloride finite square','LATTICE',ang,'optimised here, UNVERIFIED against experiment; alternating square, RHF edge-length optimisation under D2h symmetry',motifs=['cluster'],opt=True,mode='scale')
water=np.array(next(m['ang'] for m in present if m['id']=='H2O'));wxyz=water[:,1:]-water[0,1:]
for n in [6,8]:
    ang=[]
    if n==6:
        centers=np.array([[2.8*math.cos(k*math.pi/3),2.8*math.sin(k*math.pi/3),0] for k in range(6)])
    else:centers=np.array(list(itertools.product([-1.4,1.4],repeat=3)))
    for k,center in enumerate(centers):
        u=centers[(k+1)%n]-center;u/=np.linalg.norm(u);ref=np.array([0.,0.,1.])
        if abs(u@ref)>.9:ref=np.array([0.,1.,0.])
        v=np.cross(u,ref);v/=np.linalg.norm(v)
        h1=center+.958*u;h2=center+.958*(math.cos(math.radians(104.5))*u+math.sin(math.radians(104.5))*v)
        ang.extend([[8,*center],[1,*h1],[1,*h2]])
    add('ice-hexamer' if n==6 else 'ice-cube','water '+('hexamer ring' if n==6 else 'octamer cube'),'LATTICE',ang,'optimised here, UNVERIFIED against experiment; built finite hydrogen-bonded '+('hexamer ring' if n==6 else 'octamer cube')+'; unconstrained RHF relaxation, topology must be reviewed',motifs=['cluster']+(['ring:6'] if n==6 else []),opt=True)
def td(za,zb,r):return [[za,0,0,0]]+[[zb,*[r*v/math.sqrt(3) for v in t]] for t in [(1,1,1),(1,-1,-1),(-1,1,-1),(-1,-1,1)]]
add('TiCl4','titanium tetrachloride','HEAVY',td(22,17,2.170),'NIST CCCBDB experimental Ti-Cl bond length, Td reconstruction; https://cccbdb.nist.gov/exp2x.asp?casno=7550450; DOI https://doi.org/10.1063/1.1727535',motifs=['d-block'])
add('GeCl4','germanium tetrachloride','HEAVY',td(32,17,2.11),'optimised here, UNVERIFIED against experiment; experimental coordinate fetch inaccessible; tetrahedral RHF bond-length optimisation',opt=True,mode='ligand-scale')
add('KrF2','krypton difluoride','HEAVY',[[36,0,0,0],[9,0,0,1.89],[9,0,0,-1.89]],'optimised here, UNVERIFIED against experiment; experimental coordinate fetch inaccessible; linear RHF bond-length optimisation',opt=True,mode='ligand-scale')
add('SeO2','selenium dioxide','HEAVY',[[34,0,0,0],[8,0,1.41,1.02],[8,0,-1.41,1.02]],'optimised here, UNVERIFIED against experiment; experimental coordinate fetch inaccessible; bent RHF optimisation',opt=True)
add('KBr','potassium bromide','HEAVY',[[19,0,0,0],[35,0,0,2.82]],'optimised here, UNVERIFIED against experiment; experimental coordinate fetch inaccessible; diatomic RHF optimisation',opt=True,mode='ligand-scale')
# S4c explicitly names these classes. Carbonyl class is expanded into three declared representatives.
for id,z,dirs in [('NiCO4',28,[(1,1,1),(1,-1,-1),(-1,1,-1),(-1,-1,1)]),('FeCO5',26,[(0,0,1),(0,0,-1),(1,0,0),(-.5,math.sqrt(3)/2,0),(-.5,-math.sqrt(3)/2,0)]),('CrCO6',24,[(1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1)])]:
    ang=[[z,0,0,0]]
    for v in dirs:
        u=np.array(v)/np.linalg.norm(v);ang.extend([[6,*(1.85*u)],[8,*(3.0*u)]])
    add(id,id+' carbonyl representative','HEAVY',ang,'optimised here, UNVERIFIED against experiment; class representative built here; RHF optimisation with retained point symmetry',motifs=['d-block'],opt=True)
ang=[[26,0,0,0]]
for height in [-1.66,1.66]:
    for k in range(5):
        t=k*2*math.pi/5;ang.extend([[6,1.21*math.cos(t),1.21*math.sin(t),height],[1,2.3*math.cos(t),2.3*math.sin(t),height]])
add('ferrocene','ferrocene (eclipsed)','HEAVY',ang,'optimised here, UNVERIFIED against experiment; eclipsed D5h built sandwich, RHF optimisation',motifs=['d-block','ring:5'],opt=True)
phi=(1+math.sqrt(5))/2;ico=np.array([(0,a,b) for a in [-1,1] for b in [-phi,phi]]+[(b,0,a) for a in [-1,1] for b in [-phi,phi]]+[(a,b,0) for a in [-1,1] for b in [-phi,phi]])
add('B12H12--','closo-dodecaborate dianion','ORGANIC',[[5,*(1.0*v)] for v in ico]+[[1,*((1.+1.19/np.linalg.norm(v))*v)] for v in ico],'optimised here, UNVERIFIED against experiment; ideal icosahedral borane cage built here; RHF relaxation',charge=-2,motifs=['cage'],opt=True)
from scipy.spatial import ConvexHull
verts=np.array([np.mean(ico[list(f)],axis=0) for f in ConvexHull(ico).simplices]);dist=np.linalg.norm(verts[:,None]-verts[None,:],axis=2);edge=dist[dist>1e-5].min();verts*=1.54/edge
ang=[[6,*v] for v in verts]+[[1,*(v+1.09*v/np.linalg.norm(v))] for v in verts]
add('C20H20','dodecahedrane','ORGANIC',ang,'optimised here, UNVERIFIED against experiment; ideal dodecahedral carbon cage built here; RHF relaxation',motifs=['cage','ring:5'],opt=True)
old=json.loads((ROOT/'research/release-0.4.0/measure/round2-sol-exact.json').read_text())['directC60']
add('C60','buckminsterfullerene (equal-edge reference fixture)','ORGANIC',[[6,*v] for v in old['coordinatesAngstrom']],'Round 2 reference geometry: tools/symmetry/round2-sol-exact.py and research/release-0.4.0/measure/round2-sol-exact.json; ideal truncated icosahedron, equal C-C edges; DERIVED, UNVERIFIED against experiment',motifs=['cage','ring:5','ring:6'],mode='frontier')
# Conditional candidates are inventoried, not silently solved with a different basis.
for id,ang in [('HI',[[1,0,0,0],[53,0,0,1.61]]),('CH3I',[[6,0,0,0],[53,0,0,2.14],[1,1.03,0,-.36],[1,-.515,.892,-.36],[1,-.515,-.892,-.36]]),('XeF2',[[54,0,0,0],[9,0,0,2.0],[9,0,0,-2.0]]),('XeF4',[[54,0,0,0],[9,2,0,0],[9,-2,0,0],[9,0,2,0],[9,0,-2,0]]),('I2',[[53,0,0,-1.33],[53,0,0,1.33]])]:
    add(id,id+' conditional MODEL','HEAVY',ang,'UNVERIFIED initial model coordinates only; cannot optimise on the required vendored STO-3G because iodine/xenon are absent; not a usable geometry record')
    rows[-1]['conditionalBasisBlocked']=True;rows[-1]['geometry']['status']='UNVERIFIED'
# Base-pair rows are built by the solver after separately optimising their monomers.
for id,name,aa,bb in [('A-T','adenine-thymine base pair','adenine','thymine'),('G-C','guanine-cytosine base pair','guanine','cytosine')]:
    a=next(r for r in rows if r['id']==aa);b=next(r for r in rows if r['id']==bb);p=np.array(a['geometry']['atomsAngstrom']);q=np.array(b['geometry']['atomsAngstrom']);q[:,1]+=6.
    add(id,name,'BIO',p.tolist()+q.tolist(),'optimised here, UNVERIFIED against experiment; assembled neutral monomers, intermolecular RHF relaxation; Watson-Crick hydrogen-bond topology UNVERIFIED',motifs=['nucleobase'],opt=True,mode='pair')
    rows[-1]['monomers']=[aa,bb]
ids=[r['id'] for r in rows];assert len(ids)==len(set(ids))
with (OUT/'census-input.json').open('x') as f:json.dump({'numericStatus':'Geometry seeds DERIVED or UNVERIFIED; computed reference coordinates MEASURED as fetched, UNVERIFIED against experiment; formulas and charges DERIVED','rows':rows},f,indent=2,allow_nan=False);f.write('\n')
print(json.dumps({'rows':len(rows),'referenceAminoAcids':[(r['id'],len(r['geometry']['atomsAngstrom'])) for r in rows if 'wwPDB' in r['geometry']['source']],'fallbacks':sum(r['optimise'] for r in rows),'formulas':[(r['id'],r['formula']) for r in rows if r['origin']!='present entry']}))
