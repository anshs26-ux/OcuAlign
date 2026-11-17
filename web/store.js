const enc=new TextEncoder(),dec=new TextDecoder();
export const uuid=()=>crypto.randomUUID();
export async function keyFor(password,salt){
 const material=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function seal(key,bytes,label){const iv=crypto.getRandomValues(new Uint8Array(12));return {iv,data:await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(label)},key,bytes)}}
export function unseal(key,box,label){return crypto.subtle.decrypt({name:'AES-GCM',iv:box.iv,additionalData:enc.encode(label)},key,box.data)}
let db;export function init(){return new Promise((ok,no)=>{const q=indexedDB.open('ocualign-web-v1',1);q.onupgradeneeded=()=>{q.result.createObjectStore('vault');q.result.createObjectStore('media')};q.onsuccess=()=>{db=q.result;ok()};q.onerror=()=>no(q.error)})}
export function read(store,id){return new Promise((ok,no)=>{let q=db.transaction(store).objectStore(store).get(id);q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)})}
export const encode=x=>enc.encode(JSON.stringify(x)),decode=x=>JSON.parse(dec.decode(x));
export function write(oldRev,row,add,remove=[]){return new Promise((ok,no)=>{const t=db.transaction(['vault','media'],'readwrite'),v=t.objectStore('vault'),m=t.objectStore('media'),r=v.get('main');let conflict=false;r.onsuccess=()=>{if((r.result?.rev??0)!==oldRev){conflict=true;t.abort();return}v.put(row,'main');if(add)for(const item of Array.isArray(add)?add:[add])m.add(item.box,item.id);for(const id of remove)m.delete(id)};t.oncomplete=ok;t.onabort=()=>no(new Error(conflict?'Vault changed in another tab. Lock and sign in again.':'Could not save to browser storage. Check available space and retry.'))})}
