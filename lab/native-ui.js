/* Native window composition. Deliberately excludes the modulation plugin. */
import { el, seg, sw, chip } from './mir/kit.js';
import { infoPanel, installControlHelp, consolidateWindowHelp } from './mir/control-help.js';
import { planeModel } from './mir/plane-model.js';
export { infoPanel, installControlHelp, consolidateWindowHelp, planeModel };


export function reworkNative({ ui, mat, repaint }) {
  const ids=['spectrum','state','staticfield','palette','observer','camera','clip','slice','settings'];
  for(const id of ids){const d=document.querySelector(`.dev[data-id="${id}"]`);if(!d)continue;d.classList.add('native-clean');
    for(const l of d.querySelectorAll('.grp-lbl')) { l.title=l.textContent;l.textContent=l.textContent.split(/·|  |\(/)[0].trim(); }
  }
  const wave=ui.spaceSeg.root.closest('.dev-body');
  for(const l of wave.querySelectorAll('.grp-lbl'))l.remove();
  for(const k of ['spaceSeg','viewSeg']){const l=ui[k].root.querySelector('.k-lbl');if(l)l.remove();}
  // Shape and finish compose without multiplying the number of style buttons.
  const finish=seg({label:'FINISH',value:mat.finish||'lit',options:[{id:'lit',label:'LIT'},{id:'glass',label:'GLASS'},{id:'matte',label:'MATTE'}],onChange:v=>{mat.finish=v;repaint();}});
  ui.styleSeg.root.after(finish.root);ui.finishSeg=finish;
  for(const k of ['styleSeg','finishSeg']){const l=ui[k].root.querySelector('.k-lbl');if(l)l.style.display='none';}   // iteration 012 R3 (Josh 10-20): the words STYLE and FINISH go; the buttons say what they are.  M1: hidden, not removed — the history still names a press STYLE CLOUD · WAVE from it
  const syncFinish=()=>{const matte=finish.button('matte'),glass=finish.button('glass');
    matte.disabled=![1,3,6,8,11].includes(mat.style);matte.title=matte.disabled?'This shape has no surface lighting to remove':'Unlit surface colour';
    glass.disabled=mat.style===6||mat.style>=8;glass.title=glass.disabled?(mat.style>=9?'A molecule view has no glass finish':(mat.style===8?'SHELL ±':'SHELL')+' already uses translucent glass'):'Use a translucent highlighted finish';
    if((mat.finish==='matte'&&matte.disabled)||(mat.finish==='glass'&&glass.disabled)){mat.finish='lit';finish.set('lit');}
  };
  const setStyle=ui.styleSeg.set;ui.styleSeg.set=v=>{setStyle(v);syncFinish();};
  ui.styleSeg.root.addEventListener('click',syncFinish);ui.styleSeg.root.addEventListener('keydown',syncFinish);syncFinish();

  const waveHelp=[...wave.querySelectorAll('.note:not(.link-note), .sturm-note, .sp-fx')];
  // Row indices are part of the skin (wave-row-2 and wave-row-6 have their own rules), so the material knobs
  // merge into row 2 and row 5 is simply absent: ISO, GRAIN and KNEE sit under EXPOSURE, SOFT and HUE (Josh, 2026-09-10).
  const waveRows=[[0,['spaceSeg']],[1,['viewSeg']],[2,['expK','softK','hueK','isoK','grainK','kneeK']],[3,['styleSeg']],[4,['finishSeg']],[7,['atomSizeK','stickK','probeK','espRangeK']],[8,['espSurfSeg','espLiveSw']]];   // iteration 014 B: THE THREE VIEWS' two rows (shown while BALLS · STICKS · ESP is drawn)   // iteration 008 W: row 6 (DITHER) left for SETTINGS › QUALITY
  const flat=document.createDocumentFragment();
  for(const [i,names] of waveRows){const r=el('div','row tight wave-row wave-row-'+i,flat);for(const name of names)r.appendChild(ui[name].root);}
  wave.replaceChildren(flat);for(const n of waveHelp)wave.appendChild(n);
  const shadow=document.querySelector('.dev[data-id="shadow"] .dev-body');
  const shadowDetails=el('div','shadow-details');shadowDetails.id='shadow-details';shadowDetails.hidden=true;shadow.appendChild(shadowDetails);
  shadowDetails.append(ui.hc.root);for(const n of shadow.querySelectorAll(':scope > .epi'))shadowDetails.appendChild(n);if(ui.shFoot)shadowDetails.appendChild(ui.shFoot);ui.shadowDetails=shadowDetails;   // 0.4.0 S3: the footer (L, T, V, S) runs only while this fold is open
  const shadowRow=ui.shadowSeg.root.parentElement;shadowRow.classList.add('shadow-controls');
  const shadowToggle=el('button','trig shadow-details-toggle lw-fold',shadowRow);shadowToggle.type='button';shadowToggle.dataset.fold='shadow details';chip(shadowToggle,'chevronDown','Show shadow details');shadowToggle.setAttribute('aria-controls',shadowDetails.id);shadowToggle.setAttribute('aria-expanded','false');
  shadowToggle.addEventListener('click',()=>{shadowDetails.hidden=!shadowDetails.hidden;shadowToggle.setAttribute('aria-expanded',String(!shadowDetails.hidden));shadowToggle.setAttribute('aria-label',shadowDetails.hidden?'Show shadow details':'Hide shadow details');});
  const settings=ui.set.body;
  const rows=[...settings.querySelectorAll(':scope > .grp')];
  for(const g of rows){g.classList.add('settings-section');}
  // Honest enum controls replace switches that secretly cycle through three/four modes.
  function enumControl(old,label,options,get,set){const control=seg({label,value:get(),options:options.map(id=>({id,label:id.toUpperCase()})),onChange:set});old.root.replaceWith(control.root);const write=old.set;old.set=v=>{write(v);control.set(get());};return control;}
  ui.frameModeSeg=enumControl(ui.frameSw,'FRAME',['box','lattice','dots','off'],()=>mat.frame===false?'off':mat.frameMode||'box',v=>{mat.frame=v!=='off';if(v!=='off')mat.frameMode=v;ui.frameSw.set(mat.frame);repaint();ui.saveNative();});
  ui.axisModeSeg=enumControl(ui.axisSw,'AXES',['box','corner','off'],()=>mat.axis===false?'off':mat.axisMode||'box',v=>{mat.axis=v!=='off';if(v!=='off')mat.axisMode=v;ui.axisSw.set(mat.axis);repaint();ui.saveNative();});
  // A binary, deliberately stubborn switch: an unsupported canvas cannot claim P3.
  const gamut=ui.gamutSeg;
  const p3=sw({label:'DISPLAY P3',value:gamut.get()==='p3',title:gamut.button('p3').title,
    onChange:on=>{const target=gamut.button(on?'p3':'srgb');if(!target.disabled)target.click();p3.set(gamut.get()==='p3');}});
  gamut.root.replaceWith(p3.root);
  const setGamut=gamut.set;gamut.set=v=>{setGamut(v);p3.set(v==='p3');};
  ui.gamutToggle=p3;
  const oldGroups=[...settings.children];
  // iteration 003: the LOOK page left for MIR OPTIONS (lab/mir-gui.js); SETTINGS is DISPLAY · QUALITY, BASINS' two (app/settings-window.js)
  const tabs=seg({aria:'Settings category',value:'display',options:[{id:'display',label:'DISPLAY'},{id:'quality',label:'QUALITY'}],onChange:id=>{for(const [key,p] of Object.entries(pages))p.hidden=key!==id;}});
  settings.prepend(tabs.root);
  const viewport=el('div','settings-viewport',settings),pages={};
  for(const id of ['display','quality']){pages[id]=el('div','settings-page',viewport);pages[id].hidden=id!=='display';}
  function row(page, names){const r=el('div','row tight',pages[page]);for(const name of names)if(ui[name]?.root)r.appendChild(ui[name].root);}
  row('display',['capSw','audioSw']);ui.capSw.root.parentElement.classList.add('settings-status-grid');if(ui.askUrl)row('display',['askUrl']);row('display',['frameModeSeg','axisModeSeg','axisInkSeg']);row('display',['stageSeat','stageK','gammaK']);row('display',['gamutToggle','p3Seg']);
  const quality=ui.gridSeg.root.closest('.grp');if(quality)pages.quality.appendChild(quality);
  const actions=el('div','row tight settings-actions',pages.display);
  for(const g of oldGroups)for(const b of g.querySelectorAll(':scope > .row > .trig'))actions.appendChild(b);if(!actions.children.length)actions.remove();   // iteration 012 M1: WARNING left for ABOUT
  const help=el('div','settings-help',pages.display);
  for(const g of oldGroups){if(g===quality)continue;for(const n of g.querySelectorAll('.note:not(.link-note), .sturm-note'))help.appendChild(n);g.remove();}
  // iteration 008 S: the rotor grid (ROTATE z · STARK K_z · DEFECT L² over the three SPINs) is FIELD's DRIVES row, built in that order with .native-rotors
  // iteration 014 A0: the transport's tempo pill, its panel (MACROS | CLOCK) and the repeat mathematics are the kit's bar now (lab/shell/transport.js)
  const select=e=>{if(e.target.closest('#modwin')){document.querySelector('.native-selected')?.classList.remove('native-selected');return;}const d=e.target.closest('.dev');if(!d||d.classList.contains('mir-modwindow'))return;document.querySelector('.native-selected')?.classList.remove('native-selected');d.classList.add('native-selected');};document.addEventListener('pointerdown',select);document.addEventListener('focusin',select);
  consolidateWindowHelp();
  installControlHelp();
}
