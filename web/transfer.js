import {encode,decode,keyFor,seal,unseal} from './store.js';
const magic='OcuAlign1',uuid=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const fail=()=>{throw Error('Invalid or incomplete OcuAlign transfer file.')};
function frame(box){const size=new Uint8Array(4);new DataView(size.buffer).setUint32(0,box.data.byteLength);return [size,box.iv,box.data]}
export async function pack(row,records,fetchBox,check){
 const parts=[magic,row.id,row.salt,...frame(row.box)];
 for(const p of records.patients)for(const m of p.media){check();const box=await fetchBox(m.id);if(!box)fail();parts.push(...frame(box))}
 check();return new Blob(parts,{type:'application/octet-stream'})
}
export async function merge(file,password,target,key,existing,check){
 let pos=0;const take=async n=>{check();if(n<0||n>file.size-pos)fail();const start=pos;pos+=n;return new Uint8Array(await file.slice(start,pos).arrayBuffer())};
 const str=async n=>new TextDecoder().decode(await take(n));
 const box=async max=>{const size=new DataView((await take(4)).buffer).getUint32(0);if(size<16||size>max)fail();return {iv:await take(12),data:await take(size)}};
 if(await str(magic.length)!==magic)fail();const source=await str(36);if(!uuid.test(source))fail();
 const sk=await keyFor(password,await take(32)),meta=await box(64*1024*1024);
 let src;try{src=decode(await unseal(sk,meta,'vault:'+source))}catch{throw Error('Cannot unlock this copy. Enter the password used on the exporting device, or export again.')}
 const next=structuredClone(existing), people=new Map(next.patients.map(p=>[p.id,p])), owners=new Map(next.patients.flatMap(p=>p.media.map(m=>[m.id,p.id]))),pids=new Set(),mids=new Set(),adds=[];let count=0;
 if(!Array.isArray(src.patients))fail();
 for(const p of src.patients){if(!uuid.test(p.id)||pids.has(p.id)||typeof p.name!=='string'||!Array.isArray(p.media))fail();pids.add(p.id);
 let dest=people.get(p.id);if(!dest){dest={id:p.id,name:p.name,dob:String(p.dob||''),notes:String(p.notes||''),media:[]};next.patients.push(dest);count++}
 for(const m of p.media){if(!uuid.test(m.id)||mids.has(m.id)||!['OD','OS'].includes(m.eye)||!['photo','video'].includes(m.kind)||!(m.kind==='photo'?/^image\/(jpeg|png)$/:/^video\/(mp4|webm)(;|$)/).test(m.type))fail();mids.add(m.id);
 const bytes=await unseal(sk,await box(128*1024*1024),source+':'+p.id+':'+m.id);check();
 if(owners.has(m.id)){if(owners.get(m.id)!==p.id)fail();continue}
 adds.push({id:m.id,box:await seal(key,bytes,target+':'+p.id+':'+m.id)});dest.media.push(m)}
 }if(pos!==file.size)fail();check();return {next,adds,count}
}
