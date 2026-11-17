export function exposureTools(host,track,caps,apply,report,preview){
 const row=document.createElement('div');row.className='row photo-adjust';host.append(row);
 const val=document.createElement('span');row.append(val);let busy=false;
 function button(label,action){const el=document.createElement('button');el.type='button';el.textContent=label;el.onclick=async()=>{if(busy)return;busy=true;draw();try{await action()}catch(e){report(e.message)}finally{busy=false;draw()}};row.append(el);return el}
 const cfg=caps.exposureCompensation,range=Number.isFinite(cfg?.min)&&Number.isFinite(cfg.max)&&cfg.max>cfg.min;
 let level=0,photo=true;
 const software=!(range&&Number.isFinite(track.getSettings().exposureCompensation));
 const note=document.createElement('small');if(software)host.append(note);
 const delta=dir=>{if(software){level=Math.max(-4,Math.min(4,level+dir));preview.style.filter='brightness('+2**(level/2)+')';return}const v=track.getSettings().exposureCompensation,step=cfg.step>0?cfg.step:1/3;return apply({exposureCompensation:Math.min(cfg.max,Math.max(cfg.min,+(v+dir*step).toFixed(6)))})};
 const minus=button('− EV',()=>delta(-1)),plus=button('+ EV',()=>delta(1));
 function draw(){const s=track.getSettings(),v=s.exposureCompensation;val.textContent=Number.isFinite(v)?'Exposure '+Number(v.toFixed(2))+' EV':'Exposure — EV';
 minus.disabled=busy||!range||!Number.isFinite(v)||v<=cfg.min||s.exposureMode==='manual';plus.disabled=busy||!range||!Number.isFinite(v)||v>=cfg.max||s.exposureMode==='manual';
 if(software){val.textContent='Photo brightness '+(level>0?'+':'')+(photo?level/2:0)+' stops';minus.textContent='− Brightness';plus.textContent='+ Brightness';minus.disabled=busy||!photo||level<=-4;plus.disabled=busy||!photo||level>=4}
 if(software)note.textContent=photo?'Brightness adjusts the preview and saved photo digitally.':'Video uses the camera’s automatic exposure; digital brightness is photo only.';
 }
 draw();
 return {setMode(m){photo=m==='photo';if(software)preview.style.filter=photo?'brightness('+2**(level/2)+')':'';draw()},get stops(){return software&&photo?level/2:0}}
}

export function focusTools(host,track,caps,apply,preview){
 const group=document.createElement('div');group.className='focus-tools';host.append(group);
 const row=document.createElement('div');row.className='row';group.append(row);
 function button(label){const b=document.createElement('button');b.type='button';b.textContent=label;row.append(b);return b}
 const lock=button('Lock focus');
 const hint=document.createElement('small');group.append(hint);
 const modes=caps.focusMode||[],initial=track.getSettings().focusMode;
 const auto=[initial,'continuous','single-shot'].find(m=>(m==='continuous'||m==='single-shot')&&modes.includes(m));
 let supported=!!auto&&modes.includes('manual');
 const range=caps.focusDistance;let busy=false,slider,label;
 if(!supported){group.remove();return}
 if(supported&&Number.isFinite(range?.min)&&Number.isFinite(range.max)&&range.max>range.min){
 label=document.createElement('label');label.textContent='Focus distance';slider=document.createElement('input');slider.type='range';slider.min=range.min;slider.max=range.max;slider.step=range.step>0?range.step:'any';label.append(slider);group.append(label);
 slider.onchange=()=>change({focusMode:'manual',focusDistance:Number(slider.value)})
 }
 function draw(error){const s=track.getSettings(),locked=supported&&s.focusMode==='manual';
 lock.disabled=!supported||busy;lock.textContent=locked?'Unlock focus':'Lock focus';lock.setAttribute('aria-pressed',String(locked));
 if(label){label.hidden=!locked||!Number.isFinite(s.focusDistance);slider.disabled=busy;if(!label.hidden)slider.value=s.focusDistance}
 hint.textContent=error||(locked?'Focus locked. Keep the camera at the same distance.':'When the image is sharp, tap Lock focus.');
 }
 async function change(o){if(busy)return;busy=true;draw();let error;try{await apply(o)}catch(e){error=e.message||'Could not change focus.'}finally{busy=false;draw(error)}}
 lock.onclick=()=>{const s=track.getSettings();return change(s.focusMode==='manual'?{focusMode:auto,focusDistance:undefined}:{focusMode:'manual',...(Number.isFinite(s.focusDistance)&&range?{focusDistance:s.focusDistance}:{})})};
 draw()
}
