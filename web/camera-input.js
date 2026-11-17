export function standardRear(devices){
 const valid=devices.filter(({label='',deviceId})=>deviceId&&!/front|avant|user|facetime|truedepth|ultra|macro|tele|dual|triple|composite|virtual|multiple|0[.,]5\s*[×x]/i.test(label)&&/back|rear|arrière|environment/i.test(label));
 return (valid.find(d=>/wide|main|standard|grand.angle|\b1\s*[×x]/i.test(d.label))||valid.find(d=>/^(back camera|rear camera|caméra arrière)$/i.test(d.label.trim())))?.deviceId||''
}
export function videoOpts(id,facing){return {...(id?{deviceId:{exact:id}}:{facingMode:{ideal:facing}}),width:{ideal:1920},height:{ideal:1440}}}
export function aimPoint(x,y,r,w,h,flipped=false){
 if(!r.width||!r.height||!w||!h)return null;const scale=Math.min(r.width/w,r.height/h),a=(x-r.left-(r.width-w*scale)/2)/(w*scale),b=(y-r.top-(r.height-h*scale)/2)/(h*scale);return a<0||a>1||b<0||b>1?null:{x:flipped?1-a:a,y:flipped?1-b:b}
}

export function cameraSettings(track,caps,base,active){
 let desired={},queue=Promise.resolve();
 return update=>{
 const task=queue.then(async()=>{
 if(!active())return;
 const next={...desired,...update};for(const k of Object.keys(next))if(next[k]===undefined)delete next[k];
 const advanced={...next},constraints={...base};
 for(const k of ['focusMode','focusDistance'])if(k in advanced){constraints[k]={exact:advanced[k]};delete advanced[k]}
 await track.applyConstraints({...constraints,...(Object.keys(advanced).length?{advanced:[advanced]}:{})});
 if(!active())return;
 const actual=track.getSettings();for(const [p,v] of Object.entries(next)){if(p==='pointsOfInterest')continue;if(typeof v==='number'?Math.abs((actual[p]??Infinity)-v)>Math.max(.001,(caps[p]?.step||0)/2):actual[p]!==v)throw Error('The camera did not apply '+p+'.')}
 desired=next;
 });queue=task.catch(()=>{});return task
 }
}
