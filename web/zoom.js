export function zoomButtons(host,track,range,apply,report){
 if(!range||!Number.isFinite(range.min)||!Number.isFinite(range.max)||range.min>=range.max)return;
 const {min,max}=range,step=range.step>0?range.step:0;
 const clamp=v=>Math.min(max,Math.max(min,v)),snap=v=>+clamp(step?min+Math.round((clamp(v)-min)/step)*step:v).toFixed(6);
 const increment=step?Math.max(1,Math.round(.25/step))*step:.25;
 const initial=snap(track.getSettings().zoom??clamp(1));let wanted=initial,actual=initial,pending=false;
 const box=document.createElement('div');box.className='zoom-pad';box.setAttribute('role','group');box.setAttribute('aria-label','Camera zoom');host.append(box);
 const title=document.createElement('strong');title.textContent='Zoom';box.append(title);
 const btn=(text,name,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',name);b.onclick=fn;box.append(b);return b};
 const minus=btn('−','Zoom out',()=>set(wanted-increment)),out=document.createElement('output');box.append(out);
 const plus=btn('+','Zoom in',()=>set(wanted+increment)),reset=btn('Reset','Reset zoom to starting level',()=>set(initial));
 function draw(){out.textContent=Number(actual.toFixed(2))+'×';minus.disabled=snap(wanted-increment)===wanted;plus.disabled=snap(wanted+increment)===wanted;reset.disabled=wanted===initial}
 async function set(value){wanted=snap(value);draw();if(pending)return;pending=true;
 try{let target;do{target=wanted;await apply({zoom:target});actual=track.getSettings().zoom??target}while(wanted!==target&&box.isConnected)}
 catch(e){actual=track.getSettings().zoom??actual;if(box.isConnected)report(e.message)}
 finally{wanted=snap(actual);pending=false;draw()}}
 draw()
}
