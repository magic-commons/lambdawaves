import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readProjectCollection } from '../lab/project-storage.js';
const key = 'projects';
let disk = null;
let fail = false;
const storage = {
 getItem() { return disk; },
 setItem(_key, value) { if (fail) throw new Error('quota'); disk = value; },
};
assert.deepEqual(readProjectCollection(storage, key), { items: {}, recent: [] });
for (const broken of ['{', 'null', '{"items":null}', '{"items":{},"recent":5}',
 '{"items":{"bad":{"path":"bad","data":{},"notebook":{},"saved":4}}}']) {
 disk = broken;
 assert.throws(() => readProjectCollection(storage, key));
 assert.equal(disk, broken);
}

// Exercise the current rack's real save/delete/list methods with storage seams.
const rack = readFileSync(new URL('../lab/rack.js', import.meta.url), 'utf8');
const read = rack.split('\n').find(l => l.includes('const pjRead ='));
const write = rack.split('\n').find(l => l.includes('const pjWrite ='));
const touch = rack.split('\n').find(l => l.includes('const pjTouch ='));
// 2026-09-11: save() composes the file through projectSnapshot(), which sits above the projects object; bring just that function
const snapStart = rack.indexOf('function projectSnapshot()'), snapEnd = rack.indexOf('function projectKey()', snapStart);
const start = rack.indexOf('const projects = {');
const end = rack.indexOf('function renderProjects()', start);
const source = rack.slice(snapStart, snapEnd) + '\n' + rack.slice(start, end);
const create = new Function('readProjectCollection', 'localStorage', `
 const PJ_KEY='projects'; let pjCurrent=null, status='', renders=0;
 const titleIn={value:'NOTEBOOK'},ta={value:'notes'},subIn={value:'subtitle'};
 const serialize=()=>({experiment:{modes:[],t:0},presentation:{quality:{},obs:{},mat:{slice:{}},ui:{stage:{}},rotationRates:{},ab:{},domain:{}}}), modulationBases=()=>null;
 const modHost=null, modSyncBases=()=>{}, projectClean=()=>{};
 const renderProjects=()=>renders++, pjStatus=s=>status=s;
 ${read}\n${write}\n${touch}\n${source}
 return {projects,status:()=>status,renders:()=>renders};
`);
const ui = create(readProjectCollection, storage);
disk = null;
assert.equal(ui.projects.save('new/project'), true);
const saved = disk;
assert.equal(ui.projects.current, 'new/project');
fail = true;
assert.equal(ui.projects.remove('new/project'), false);
assert.equal(disk, saved); assert.equal(ui.projects.current, 'new/project');
assert.match(ui.status(), /save failed/);
assert.equal(ui.projects.save('another'), false);
assert.equal(disk, saved); assert.equal(ui.projects.current, 'new/project');
fail = false;
assert.equal(ui.projects.remove('new/project'), true);
assert.equal(ui.projects.current, null); assert.deepEqual(ui.projects.list(), []);
assert.equal(ui.projects.save('__proto__'), true);
assert.ok(Object.hasOwn(JSON.parse(disk).items, '__proto__'));
assert.equal(ui.projects.remove('toString'), false);
assert.equal(ui.projects.exportText('toString'), null);
disk = '{"items":null}';
assert.deepEqual(ui.projects.list(), []); assert.deepEqual(ui.projects.recent(), []);
assert.equal(ui.projects.save('new'), false); assert.equal(disk, '{"items":null}');
assert.match(ui.status(), /left untouched/);
console.log('GREEN project storage: new save/delete success, quota failures, malformed storage and safe project names');

const keyStart = rack.indexOf('function projectKey() {');
const keyEnd = rack.indexOf('const projectClean =', keyStart);
let state = {experiment:{t:0},presentation:{quality:{autoScale:1},domain:{auto:true,half:7},
 obs:{},mat:{slice:{}},rotationRates:{}}};
const subtitle={value:''};
const makeKey = new Function('serialize','titleIn','subIn','ta','modHost',
 `const modulationBases=()=>null;${rack.slice(snapStart,snapEnd)}\n${rack.slice(keyStart,keyEnd)};return projectKey;`);   // projectKey() reads through projectSnapshot() since 2026-09-11
const projectKey=makeKey(()=>structuredClone(state),{value:'Study'},subtitle,{value:'notes'},null);
const baseline=projectKey();
state.presentation.domain.half=16;
state.experiment.t=42;
state.presentation.quality.autoScale=.5;
assert.equal(projectKey(),baseline,'automatic sizing/time/scale must not dirty a new project');
subtitle.value='New subtitle'; assert.notEqual(projectKey(),baseline);
subtitle.value=''; state.presentation.domain.auto=false;
const manual=projectKey(); state.presentation.domain.half=17;
assert.notEqual(projectKey(),manual,'manual domain edit must remain dirty');
console.log('GREEN project dirty state: automatic domain stable; subtitles and manual domain edits tracked');
