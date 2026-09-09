import assert from 'node:assert/strict';
import { encodeState, decodeState } from '../lab/statelink.js';
const state={experiment:{modes:[{id:'h:1:0:0',re:1,im:0}]},presentation:{mat:{style:3,finish:'glass',slice:{mode:2,axis:2,pos:.2,thick:.05,normal:[.6,0,.8]},bow:{gain:2,curve:.75,limit:1.5}}}};
const encoded=encodeState(state).text;
const decoded=decodeState(encoded).state;
assert.equal(decoded.presentation.mat.style,3);
assert.equal(decoded.presentation.mat.finish,'glass');
assert.deepEqual(decoded.presentation.mat.bow,state.presentation.mat.bow);
for(let i=0;i<3;i++)assert.ok(Math.abs(decoded.presentation.mat.slice.normal[i]-state.presentation.mat.slice.normal[i])<1e-6);
assert.equal(encodeState(decoded).text,encoded,'new controls remint without drift');
const legacy={experiment:state.experiment,presentation:{mat:{style:1,slice:{mode:0,axis:2,pos:0,thick:.03}}}};
const plain=encodeState(legacy).text;
legacy.presentation.mat.finish='lit';legacy.presentation.mat.bow={gain:1,curve:1,limit:3};
assert.equal(encodeState(legacy).text,plain,'default controls leave old link bytes unchanged');
for(const finish of ['glass','matte']){state.presentation.mat.finish=finish;assert.equal(decodeState(encodeState(state).text).state.presentation.mat.finish,finish);}
state.presentation.mat.slice.normal=[0,0,0];
assert.throws(()=>decodeState(encodeState(state).text),'degenerate plane cannot silently render');
console.log('PASS native material: combinations, arbitrary plane, bow settings, remint stability and legacy defaults');
