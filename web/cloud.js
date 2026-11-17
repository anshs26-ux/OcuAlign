import {uuid,keyFor,seal,unseal,encode,decode} from './store.js';
export function validWorkEmail(value){return typeof value==='string' && value.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value)}
export async function account(){const r=await fetch('/api/account',{cache:'no-store'});if(r.status===401)return null;if(!r.ok)throw Error('Shared sign-in is unavailable.');return r.json()}
export async function connect(owner,name,credential=null){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(name));
 const url=(credential?'/api/personal/':'/api/v1/')+Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('')+'/';
 const api=async(path,method='GET',body,headers={})=>{const r=await fetch(url+path,{method,body,cache:'no-store',headers:{...(credential?{'X-Ocu-Credential':credential}:{'X-Vault-Owner':owner}),...headers}});if(r.status===404&&method==='GET')return null;if(!r.ok)throw Error(r.status===409?'Another device saved first. Sign out and sign in again before retrying.':r.status===401||r.status===403?'Incorrect username or password.':'Account storage unavailable ('+r.status+'). Check your connection before retrying.');return r};
 const box=b=>({iv:b.slice(0,12),data:b.slice(12)}),blob=b=>new Blob([b.iv,b.data]);
 return {async open(name,pw,create,check,profile=null){const r=await api('vault');let row,key,data;
 if(!r){if(!create)throw Error('Account not found. Check your username or create an account.');row={id:uuid(),salt:crypto.getRandomValues(new Uint8Array(32)),tag:null};key=await keyFor(pw,row.salt);data={username:name,patients:[],migrations:[]};if(profile){for(const field of ['firstName','lastName']){const value=profile[field]?.trim();if(!value||value.length>100)throw Error('Enter your first and last name.');data[field]=value}if(!validWorkEmail(profile.workEmail))throw Error('Enter a valid work email address.');data.workEmail=profile.workEmail}row.box=await seal(key,encode(data),'vault:'+row.id);check();row.tag=await this.head(row)}
 else{const b=new Uint8Array(await r.arrayBuffer());row={id:new TextDecoder().decode(b.slice(0,36)),salt:b.slice(36,68),box:box(b.slice(68)),tag:r.headers.get('ETag')};key=await keyFor(pw,row.salt);try{data=decode(await unseal(key,row.box,'vault:'+row.id));if(data.username!==name)throw Error()}catch{throw Error('Incorrect username or password.')}}return {row,key,data}},
 async head(row){const r=await api('vault','PUT',new Blob([row.id,row.salt,blob(row.box)]),row.tag?{'If-Match':row.tag}:{'If-None-Match':'*'});return r.headers.get('ETag')},
 async media(id){const r=await api(id);if(!r)throw Error('Shared capture missing.');return box(new Uint8Array(await r.arrayBuffer()))},
 async save(row,key,next,adds,check){const media=new Map(next.patients.flatMap(p=>p.media.map(m=>[m.id,m])));const staged=[];let committing=false;try{for(const a of adds){check();const m=media.get(a.id);if(a.file){m.parts=[];const stride=8*1024*1024,total=Math.ceil(a.file.size/stride);for(let i=0;i<total;i++){check();a.progress?.(i+1,total);const encrypted=await seal(key,await a.file.slice(i*stride,(i+1)*stride).arrayBuffer(),a.aad+':'+i);check();const ref=uuid();await api(ref,'PUT',blob(encrypted),{'If-None-Match':'*'});staged.push(ref);m.parts.push(ref)}}else{const ref=uuid();await api(ref,'PUT',blob(a.box),{'If-None-Match':'*'});staged.push(ref);m.cloudRef=ref}}
 const nr={...row,box:await seal(key,encode(next),'vault:'+row.id)};check();committing=true;nr.tag=await this.head(nr);return nr}catch(e){if(!committing)for(const ref of staged)await this.remove(ref).catch(()=>{});throw e}},
 async remove(ref){await api(ref,'DELETE')}
 }
}

export async function personal(name,password){
 const enc=new TextEncoder(),key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 const proof=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:600000,salt:enc.encode('OcuAlign/account/access/v1/'+name)},key,256);
 return connect(null,name,Array.from(new Uint8Array(proof),v=>v.toString(16).padStart(2,'0')).join(''))
}
