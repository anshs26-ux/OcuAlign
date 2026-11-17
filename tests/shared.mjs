import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
import {connect,account,personal} from '../web/cloud.js';
import {uuid,encode,seal,unseal} from '../web/store.js';
const data=new Map(),env={BUCKET:{async head(k){return data.get(k)},async get(k){const a=data.get(k);return a&&{...a,body:a.body.slice(0)}},async put(k,body,{onlyIf:h,customMetadata}){const a=data.get(k);if(h.has('If-Match')&&h.get('If-Match')!==a?.httpEtag||h.has('If-None-Match')&&a)return null;const obj={customMetadata,body:await new Response(body).arrayBuffer(),httpEtag:'"'+uuid()+'"'};data.set(k,obj);return obj},async delete(k){data.delete(k)}}};
let user='A';globalThis.fetch=async(path,o={})=>{const h=new Headers(o.headers);if(user){h.set('oai-authenticated-user-id',user);h.set('oai-authenticated-user-email',user+'@example.test')}if(o.body)h.set('Content-Length',o.body.size);h.set('Origin','https://test.local');return worker.fetch(new Request('https://test.local'+path,{...o,headers:h}),env)};
const ck=()=>{},login=async()=>connect((await account()).owner,'demo'),a=await login(),s=await a.open('demo','vault-password',true,ck),id=uuid(),p=uuid(),next=structuredClone(s.data),label='vault-image';next.patients.push({id:p,name:'sample',media:[{id}]});const b=await login(),stale=await b.open('demo','vault-password',false,ck);
await a.save(s.row,s.key,next,[{id,box:await seal(s.key,encode('image'),label)}],ck);
const other=await b.open('demo','vault-password',false,ck);assert.equal(other.data.patients[0].name,'sample');const ref=other.data.patients[0].media[0].cloudRef;assert.deepEqual(new Uint8Array(await unseal(other.key,await b.media(ref),label)),encode('image'));await assert.rejects(b.save(stale.row,stale.key,stale.data,[],ck),/saved first/);await assert.rejects(b.open('demo','wrong-password',false,ck),/Incorrect/);
user='B';await assert.rejects(b.media(ref));const unrelated=await login();await assert.rejects(unrelated.open('demo','vault-password',false,ck),/Account not found/);user=null;assert.equal(await account(),null);console.log('Two clients, encrypted media, password, stale save and account isolation passed.')

const first=await personal('tester','correct-password');
await assert.rejects(first.open('tester','correct-password',false,ck),/Account not found/);
await assert.rejects(first.open('tester','correct-password',true,ck,{firstName:' ',lastName:'Test'}),/first and last name/);
for(const workEmail of ['', 'wrong', 'name@'])await assert.rejects(first.open('tester','correct-password',true,ck,{firstName:'Sample',lastName:'Test',workEmail}),/valid work email/);
const start=await first.open('tester','correct-password',true,ck,{firstName:' Sample ',lastName:'Test',workEmail:'sample@example.org'});
const reopened=await first.open('tester','correct-password',false,ck);assert.equal(reopened.data.workEmail,'sample@example.org');assert.equal(reopened.data.firstName,'Sample');assert.equal(reopened.data.lastName,'Test');
const patient=uuid(),photo=uuid(),label2=start.row.id+':'+patient+':'+photo;
const n=structuredClone(start.data);n.patients.push({id:patient,name:'Test patient',media:[{id:photo}]});
await first.save(start.row,start.key,n,[{id:photo,box:await seal(start.key,encode('image bytes'),label2)}],ck);
const second=await personal('tester','correct-password'),loaded=await second.open('tester','correct-password',false,ck);
assert.deepEqual(loaded.data,n);
const mediaRef=n.patients[0].media[0].cloudRef;assert.deepEqual(new Uint8Array(await unseal(loaded.key,await second.media(mediaRef),label2)),encode('image bytes'));
const wrong=await personal('tester','incorrect-password');await assert.rejects(wrong.open('tester','incorrect-password',true,ck),/Incorrect/);await assert.rejects(wrong.media(mediaRef),/Incorrect/);await assert.rejects(wrong.remove(mediaRef),/Incorrect/);
const different=await personal('tester2','correct-password');await assert.rejects(different.media(mediaRef));console.log('Personal accounts: independent clients without ChatGPT, saved capture decryption, wrong-password and cross-account isolation passed.');
