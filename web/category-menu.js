// Keep the popup inside the rotated viewport, outside the scrolling form.
let closeActive;
export function bubble(trigger,title,items,selected,choose){
 closeActive?.();
 const view=document.getElementById('page-viewport'),layer=document.createElement('div'),list=document.createElement('div');
 layer.className='bubble-layer';list.className=title==='Category'?'bubble-list apple-category':'bubble-list';list.setAttribute('role','group');list.setAttribute('aria-label',title);
 layer.append(list);view.append(layer);trigger.setAttribute('aria-expanded','true');
 const controller=new AbortController(),opts={signal:controller.signal};
 const observer=new MutationObserver(()=>{if(!trigger.isConnected)close(false)});
 function close(refocus=true){controller.abort();observer.disconnect();layer.remove();trigger.setAttribute('aria-expanded','false');if(refocus&&trigger.isConnected)trigger.focus({preventScroll:true});closeActive=null}
 closeActive=close;observer.observe(document.getElementById('app'),{childList:true,subtree:true});
 let active;for(const item of items){const b=document.createElement('button');b.type='button';b.textContent=item.text;b.setAttribute('aria-pressed',String(item.value===selected));if(item.value===selected)active=b;list.append(b);b.onclick=()=>{close();choose(item.value)}}
 function place(){const p=layer.getBoundingClientRect(),t=trigger.getBoundingClientRect(),flipped=view.classList.contains('flipped');
 const x=flipped?p.right-t.right:t.left-p.left,y=flipped?p.bottom-t.bottom:t.top-p.top;
 const clamp=(v,m)=>Math.max(8,Math.min(v,m-8));
 list.style.left=clamp(x+(t.width-list.offsetWidth)/2,p.width-list.offsetWidth)+'px';list.style.top=clamp(title==='Category'?y+t.height/2-10-((active?.offsetTop||10)-10)-21:y-6,p.height-list.offsetHeight)+'px'}
 place();layer.onpointerdown=e=>{if(e.target===layer){e.preventDefault();close()}};
 layer.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();close()}else if(['ArrowUp','ArrowDown','Home','End','Tab'].includes(e.key)){const bs=[...list.children],i=bs.indexOf(document.activeElement);const n=e.key==='Home'?0:e.key==='End'?bs.length-1:(i+((e.key==='ArrowUp'||e.shiftKey)?-1:1)+bs.length)%bs.length;e.preventDefault();bs[n].focus()}};
 window.addEventListener('resize',place,opts);(active||list.firstChild)?.focus({preventScroll:true})
}
export function syncCategoryMenu(select){
 if(!select)return;
 const apple=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const native=apple&&!document.getElementById('page-viewport').classList.contains('flipped');
 const frame=select.parentElement,overlay=frame.querySelector('.category-hit');
 if(native){if(overlay){closeActive?.(false);overlay.remove();select.removeAttribute('aria-hidden');select.removeAttribute('tabindex');frame.replaceWith(select)}select.oninvalid=null;return}
 if(overlay)return;
 const wrap=document.createElement('span'),btn=document.createElement('button');
 wrap.className='category-field';select.before(wrap);wrap.append(select,btn);
 select.tabIndex=-1;select.setAttribute('aria-hidden','true');btn.type='button';btn.className='category-hit';btn.setAttribute('aria-expanded','false');
 const update=()=>btn.setAttribute('aria-label','Category: '+select.selectedOptions[0].textContent);
 btn.onclick=e=>{e.preventDefault();bubble(btn,'Category',[...select.options].map(o=>({value:o.value,text:o.textContent})),select.value,v=>{select.value=v;update();select.dispatchEvent(new Event('change',{bubbles:true}))})};
 select.oninvalid=e=>{e.preventDefault();btn.click()};update()

}
export function playback(video){
 if(video.tagName!=='VIDEO')return;video.controls=false;
 const player=document.createElement('div'),bar=document.createElement('div');player.className='clip-player';bar.className='playback-bar';video.before(player);player.append(video,bar);
 const btn=text=>{const b=document.createElement('button');b.type='button';b.textContent=text;bar.append(b);return b};
 const play=btn('Play');play.onclick=()=>video.paused?video.play().catch(()=>{}):video.pause();
 const center=document.createElement('div');center.className='clip-transport';player.append(center);
 const svg=body=>'<svg aria-hidden="true" viewBox="0 0 32 32" width="32" height="32">'+body+'</svg>';
 const icon=(text,body)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',text);b.innerHTML=svg(body);center.append(b);return b};
 const skip=forward=>icon(forward?'Forward 10 seconds':'Rewind 10 seconds','<g '+(forward?'transform="translate(32 0) scale(-1 1)"':'')+' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 5a12 12 0 1 1-9.5 4.5M16 1l-5 4 5 4"/></g><text x="16" y="22" fill="currentColor" text-anchor="middle" font-size="13" font-weight="700">10</text>');
 const back=skip(false),toggle=icon('Play',''),ahead=skip(true);
 toggle.onclick=play.onclick;
 const state=()=>{const name=video.paused?'Play':'Pause';play.textContent=name;toggle.setAttribute('aria-label',name);toggle.innerHTML=svg(video.paused?'<path fill="currentColor" d="M8 4l20 12L8 28z"/>':'<path fill="currentColor" d="M7 5h7v22H7zm12 0h7v22h-7z"/>')};state();
 const stamp=n=>{n=Math.max(0,Math.floor(n||0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
 const clock=()=>{const t=document.createElement('span');t.className='clip-clock';bar.append(t);return t},elapsed=clock();
 const seek=document.createElement('input');seek.type='range';seek.min=0;seek.step='any';seek.value=0;seek.setAttribute('aria-label','Video position');bar.append(seek);const remaining=clock();
 let observedEnd=0;
 const end=()=>Number.isFinite(video.duration)&&video.duration>0?video.duration:observedEnd||(video.seekable?.length?video.seekable.end(video.seekable.length-1):0);
 const time=()=>{
  const now=Math.max(0,video.currentTime||0);
  if(video.ended&&!observedEnd)observedEnd=now;
  const limit=end(),pos=video.ended&&limit?limit:Math.min(now,limit||now);
  seek.disabled=!limit;seek.max=limit||1;seek.value=pos;
  elapsed.textContent=stamp(pos);remaining.textContent=limit?'−'+stamp(Math.ceil(Math.max(0,limit-pos))):'–:––';
  back.disabled=pos<=0;ahead.disabled=!limit||pos>=limit;
 };
 video.onloadedmetadata=video.ondurationchange=video.ontimeupdate=video.onprogress=video.onseeking=video.onseeked=time;
 video.onplay=video.onpause=video.onended=()=>{state();time()};time();
 seek.oninput=()=>{video.currentTime=+seek.value};
 back.onclick=()=>{video.currentTime=Math.max(0,video.currentTime-10)};ahead.onclick=()=>{video.currentTime=Math.min(end(),video.currentTime+10)};
 const speed=btn('Speed: 1×');speed.setAttribute('aria-expanded','false');speed.onclick=()=>bubble(speed,'Playback speed',[0.25,0.5,0.75,1,1.25,1.5,1.75,2].map(v=>({value:v,text:v===1?'1× (Normal)':v+'×'})),video.playbackRate,v=>{video.playbackRate=v;speed.textContent='Speed: '+v+'×'});
 // Expand the inline player so the browser cannot replace its rotation or controls.
 const full=btn('Full screen');full.className='clip-size';play.className='clip-inline-play';speed.className='clip-rate';full.setAttribute('aria-expanded','false');
 function expand(open){
  player.classList.toggle('clip-expanded',open);full.textContent=open?'×':'Full screen';full.setAttribute('aria-label',open?'Exit full screen':'Full screen');full.setAttribute('aria-expanded',String(open));full.focus({preventScroll:true});
 }
 full.onclick=()=>expand(!player.classList.contains('clip-expanded'));
 player.onkeydown=e=>{if(e.key==='Escape'&&player.classList.contains('clip-expanded')){e.preventDefault();expand(false)}};
}
