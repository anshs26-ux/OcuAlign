export const monthLength=(y,m)=>new Date(y,m+1,0).getDate();
export const isoDay=(y,m,d)=>[String(y).padStart(4,'0'),String(m+1).padStart(2,'0'),String(d).padStart(2,'0')].join('-');
export function birthCalendar(input,flipped){
 if(!input)return;input.removeCalendar?.();if(!flipped)return;
 const el=(tag,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;return e};
 const label=input.closest('label'),form=input.form,box=el('div','dob-field'),title=el('strong'),trigger=el('button');
 title.textContent=input.required?'Date of birth':'Date of birth (optional)';trigger.type='button';box.append(title,trigger);label.hidden=true;label.after(box);
 const months=Array.from({length:12},(_,m)=>new Date(2000,m,1).toLocaleString(undefined,{month:'long'}));
 const today=new Date();let layer,picker,y,m,day,draft,wheels,observer,flush;
 function update(){trigger.textContent=input.value?new Date(input.value+'T12:00:00').toLocaleDateString():'Choose date';trigger.setAttribute('aria-expanded',String(!!layer));trigger.setAttribute('aria-label','Date of birth: '+trigger.textContent)}
 function close(focus=true){observer?.disconnect();layer?.remove();layer=null;flush=null;update();if(focus)trigger.focus({preventScroll:true})}
 function button(host,text,fn,aria){const b=el('button');b.type='button';b.textContent=text;b.onclick=fn;if(aria)b.setAttribute('aria-label',aria);host.append(b);return b}
 function draw(){picker.replaceChildren();flush=null;const head=el('div','birth-head'),body=el('div',wheels?'birth-wheels':'birth-days'),foot=el('div','birth-foot');picker.append(head,body,foot);
 const h=button(head,months[m]+' '+y,()=>{flush?.();wheels=!wheels;draw()});h.className=wheels?'expanded':'';
 if(!wheels){for(const n of [-1,1])button(head,n<0?'❮':'❯',()=>{const dt=new Date(y,m+n,1);y=dt.getFullYear();m=dt.getMonth();draw()},n<0?'Previous month':'Next month');
 for(const s of ['SUN','MON','TUE','WED','THU','FRI','SAT']){const t=el('small');t.textContent=s;body.append(t)}
 for(let i=0;i<new Date(y,m,1).getDay();i++)body.append(el('span'));
 for(let d=1;d<=monthLength(y,m);d++){const v=isoDay(y,m,d);button(body,String(d),()=>{day=d;draft=v;draw()},v).setAttribute('aria-pressed',String(draft===v))}}
 else{const start=Math.min(today.getFullYear()-180,y),end=Math.max(today.getFullYear()+5,y);
 const makeWheel=(values,index,name)=>{const w=el('div','birth-wheel');w.tabIndex=0;w.setAttribute('role','spinbutton');w.setAttribute('aria-label',name);body.append(w);
 values.forEach((v,i)=>button(w,String(v),()=>{w.scrollTop=i*34;sync()},String(v)).tabIndex=-1);
 w.scrollTop=index*34;w.onkeydown=e=>{if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();w.scrollTop+=e.key==='ArrowUp'?-34:34;sync()}};return w};
 const mw=makeWheel(months,m,'Month'),yw=makeWheel(Array.from({length:end-start+1},(_,i)=>start+i),y-start,'Year');
 function sync(){m=Math.max(0,Math.min(11,Math.round(mw.scrollTop/34)));y=start+Math.max(0,Math.min(end-start,Math.round(yw.scrollTop/34)));day=Math.min(day,monthLength(y,m));draft=isoDay(y,m,day);h.textContent=months[m]+' '+y;for(const [w,i,v] of [[mw,m,months[m]],[yw,y-start,y]]){w.querySelector('.chosen')?.classList.remove('chosen');w.children[i]?.classList.add('chosen');w.setAttribute('aria-valuetext',String(v));w.setAttribute('aria-valuenow',String(w===mw?m+1:y))}}
 mw.onscroll=yw.onscroll=sync;flush=sync;sync()}
 button(foot,'Reset',()=>{draft='';y=today.getFullYear();m=today.getMonth();day=today.getDate();wheels=false;draw()});
 button(foot,'✓',()=>{flush?.();input.value=draft;input.dispatchEvent(new Event('change',{bubbles:true}));close()},'Confirm date of birth')
 }
 trigger.onclick=()=>{form.dismissTyping?.();const seed=input.value?new Date(input.value+'T12:00:00'):today;y=seed.getFullYear();m=seed.getMonth();day=seed.getDate();draft=isoDay(y,m,day);wheels=false;layer=el('div','birth-layer');picker=el('div','birth-popup');picker.setAttribute('role','dialog');picker.setAttribute('aria-label','Date of birth');layer.append(picker);document.getElementById('page-viewport').append(layer);layer.onclick=e=>{if(e.target===layer)close()};layer.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();close()}};observer=new MutationObserver(()=>{if(!form.isConnected)close(false)});observer.observe(document.getElementById('app'),{childList:true,subtree:true});update();draw();picker.querySelector('button').focus({preventScroll:true})};
 const invalid=e=>{e.preventDefault();trigger.setAttribute('aria-invalid','true');if(!layer)trigger.click()};input.addEventListener('invalid',invalid);const changed=()=>trigger.removeAttribute('aria-invalid');input.addEventListener('change',changed);
 input.removeCalendar=()=>{input.removeEventListener('invalid',invalid);input.removeEventListener('change',changed);close(false);box.remove();label.hidden=false;delete input.removeCalendar};update()
}
