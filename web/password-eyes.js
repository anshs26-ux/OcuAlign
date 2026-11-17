export function attachPasswordEyes(form){
 for(const field of form.querySelectorAll('input[type=password]')){
 const wrap=document.createElement('span'),b=document.createElement('button');wrap.className='password-field';field.before(wrap);wrap.append(field,b);b.type='button';b.className='password-eye';b.setAttribute('aria-controls',field.id);
 const draw=()=>{const visible=field.type==='text';b.setAttribute('aria-label',visible?'Hide password':'Show password');b.setAttribute('aria-pressed',String(visible));b.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'+(visible?'<path d="m3 3 18 18"/>':'')+'</svg>'};
 b.onpointerdown=e=>e.preventDefault();b.onclick=e=>{e.preventDefault();const start=field.selectionStart,end=field.selectionEnd;field.type=field.type==='password'?'text':'password';field.setSelectionRange(start,end);draw()};draw()
 }
}
