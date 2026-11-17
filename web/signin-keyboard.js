// All edits stay in the existing form fields, including masked password fields.
export function editKey(input,key){
 let a=input.selectionStart??input.value.length,b=input.selectionEnd??a;
 if(key==='Delete'){if(a===b&&a){const prev=Array.from(input.value.slice(0,a)).pop();a-=prev.length}key=''}
 if(input.maxLength>=0&&input.value.length-(b-a)+key.length>input.maxLength)return;
 input.setRangeText(key,a,b,'end');input.dispatchEvent(new Event('input',{bubbles:true}))
}
export function syncKeyboard(form,flipped){
 if(!form)return;form.endKeyboard?.();if(!flipped)return;
 const fields=Array.from(form.querySelectorAll(form.id==='patientForm'?'#name,#notes':form.id==='save'?'textarea#caption':'input')),panel=document.createElement('div');
 panel.className=form.id==='patientForm'?'signin-keys patient-keys':'signin-keys';panel.hidden=true;panel.setAttribute('role','group');panel.setAttribute('aria-label',form.id==='patientForm'?'Rotated patient file keyboard':form.id==='save'?'Rotated capture note keyboard':'Rotated sign-in keyboard');
 const viewport=document.getElementById('page-viewport');viewport.append(panel);
 const observer=new MutationObserver(()=>{if(!form.isConnected)form.endKeyboard?.()});observer.observe(document.getElementById('app'),{childList:true,subtree:true});
 const abort=new AbortController(),opts={signal:abort.signal};let current,shift=false,symbols=false,native=false;
 const preference='ocu-flipped-keyboard';try{native=localStorage.getItem(preference)==='device'}catch{}
 const restore=document.createElement('button');restore.type='button';restore.textContent='Use rotated keyboard';restore.hidden=!native;form.append(restore);
 function chooseNative(value){native=value;restore.hidden=!value;panel.hidden=true;try{localStorage.setItem(preference,value?'device':'rotated')}catch{}fields.forEach(f=>{if(value)f.removeAttribute('inputmode');else f.inputMode='none'});const field=current||fields[0];field.blur();field.focus()}
 restore.onclick=()=>chooseNative(false);
 let repeat=0,repeatId=null;function stopRepeat(){clearTimeout(repeat);repeatId=null}
 for(const type of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(type,e=>{if(e.pointerId===repeatId)stopRepeat()},{...opts,capture:true});
 window.addEventListener('blur',stopRepeat,opts);
 const vv=window.visualViewport,scroller=document.getElementById('page-scroll');
 function fit(){if(panel.hidden)return;viewport.style.setProperty('--key-vh',(vv?.height||window.innerHeight)+'px');viewport.style.setProperty('--key-top',(vv?.offsetTop||0)+'px')}
 vv?.addEventListener('resize',fit,opts);vv?.addEventListener('scroll',fit,opts);window.addEventListener('resize',fit,opts);
 fields.forEach(field=>{if(!native)field.inputMode='none';field.addEventListener('focus',()=>{current=field;if(!native){panel.hidden=false;draw();fit();requestAnimationFrame(()=>{if(!field.isConnected||document.activeElement!==field)return;const a=field.getBoundingClientRect(),b=scroller.getBoundingClientRect();if(a.top<b.top)scroller.scrollTop+=b.top-a.top+8;else if(a.bottom>b.bottom)scroller.scrollTop-=a.bottom-b.bottom+8})}},opts)});
 function draw(){panel.replaceChildren();
 const row=()=>{const r=document.createElement('div');panel.append(r);return r};
 function key(r,text,fn,aria){const b=document.createElement('button');b.type='button';b.textContent=text;if(aria)b.setAttribute('aria-label',aria);
 if(aria==='Dismiss keyboard'){b.onclick=e=>{e.preventDefault();e.stopPropagation();fn()};r.append(b);return}
 b.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();stopRepeat();
 if(aria==='Delete previous character'){repeatId=e.pointerId;b.setPointerCapture?.(e.pointerId);const again=()=>{if(!b.isConnected||panel.hidden||current!==document.activeElement){stopRepeat();return}fn();repeat=setTimeout(again,75)};repeat=setTimeout(again,420)}
 fn()};
 b.onclick=e=>{if(e.detail===0||!window.PointerEvent)fn()};r.append(b)}
 const rows=symbols?['1234567890','!@#$%^&*()','-_=+[]{}',';:,.?/~|',String.fromCharCode(39,34,92,96,60,62)]:['qwertyuiop','asdfghjkl','zxcvbnm'];
 const bar=row();bar.className='keys-bar';
 const jump=offset=>fields[fields.indexOf(current)+offset]?.focus();
 const done=()=>{stopRepeat();panel.hidden=true;current?.blur();current=null;form.tabIndex=-1;form.focus({preventScroll:true})};
 if(form.id==='patientForm'||(current.tagName==='TEXTAREA'&&!current.value)){for(const word of ['I','The','And'])key(bar,word,()=>{editKey(current,word+' ');draw()});bar.classList.add('keys-words')}
 if(fields.length>1&&form.id!=='patientForm'){key(bar,'⌃',()=>jump(-1),'Previous field');key(bar,'⌄',()=>jump(1),'Next field')}key(bar,'✓',done,'Dismiss keyboard');
 for(const [i,letters] of rows.entries()){const r=row();if(!symbols&&i===1)r.className='keys-inset';
 if(!symbols&&i===2)key(r,shift?'⬆':'⇧',()=>{shift=!shift;draw()},'Shift');
 for(const c of letters){const ch=shift&&!symbols?c.toUpperCase():c;key(r,ch,()=>{editKey(current,ch);if(shift){shift=false;draw()}})}
 if(i===rows.length-1)key(r,'⌫',()=>editKey(current,'Delete'),'Delete previous character')}
 const r=row();r.className='keys-bottom';key(r,symbols?'ABC':'123',()=>{symbols=!symbols;shift=false;draw()});key(r,'',()=>editKey(current,' '),'Space');key(r,'↵',()=>{if(current.tagName==='TEXTAREA')editKey(current,'\n');else if(fields[fields.indexOf(current)+1])jump(1);else done()},'Return');
 const foot=row();foot.className='keys-foot';key(foot,'Device keyboard',()=>chooseNative(true));

 }
 form.dismissTyping=()=>{stopRepeat();panel.hidden=true;current?.blur();current=null};
 form.endKeyboard=()=>{delete form.dismissTyping;stopRepeat();restore.remove();observer.disconnect();abort.abort();panel.remove();fields.forEach(f=>f.removeAttribute('inputmode'));viewport.style.removeProperty('--key-vh');viewport.style.removeProperty('--key-top');delete form.endKeyboard};
 if(fields.includes(document.activeElement)){current=document.activeElement;current.blur();current.focus()}
}
