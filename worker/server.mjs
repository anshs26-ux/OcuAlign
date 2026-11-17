const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');
const reply=(body,status=200,extra={})=>new Response(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',...extra}});
export default {async fetch(req,env){
 const u=new URL(req.url),path=u.pathname==='/'?'/index.html':u.pathname;
 if(path==='/adapter.webp'&&req.method==='GET')return reply(Uint8Array.from(atob(assets[path]),c=>c.charCodeAt(0)),200,{'Content-Type':'image/webp'});
 if(Object.hasOwn(assets,path)&&req.method==='GET')return reply(assets[path],200,{'Content-Type':(path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'text/html')+'; charset=utf-8'});
 if(!path.startsWith('/api/'))return reply(null,404);
 const personal=/^\/api\/personal\/([a-f0-9]{64})\/(vault|[a-f0-9-]{36})$/.exec(path);
 let key,m,verifier;const bucket=env.BUCKET;if(!bucket)return reply(null,503);
 if(personal){
 m=personal;const proof=req.headers.get('X-Ocu-Credential');if(!/^[a-f0-9]{64}$/.test(proof||''))return reply(null,401);
 const base='personal/'+m[1]+'/';verifier=await hash('credential:'+proof);
 const head=await bucket.head(base+'vault');
 if(head&&head.customMetadata?.verifier!==verifier)return reply(null,401);
 if(!head&&!(m[2]==='vault'&&req.method==='PUT'&&req.headers.get('If-None-Match')==='*'))return reply(null,404);
 key=base+m[2];
 }else{
 const id=req.headers.get('oai-authenticated-user-id'),email=req.headers.get('oai-authenticated-user-email');if(!id||!email)return reply(null,401);
 const owner=await hash(id);
 if(path==='/api/account'&&req.method==='GET')return reply(JSON.stringify({owner,email}),200,{'Content-Type':'application/json'});
 if(req.headers.get('X-Vault-Owner')!==owner)return reply(null,403);
 m=/^\/api\/v1\/([a-f0-9]{64})\/(vault|[a-f0-9-]{36})$/.exec(path);if(!m)return reply(null,404);
 key=owner+'/'+m[1]+'/'+m[2];
 }
 if(req.method==='GET'){const obj=await bucket.get(key);return obj?reply(obj.body,200,{'ETag':obj.httpEtag,'Content-Type':'application/octet-stream'}):reply(null,404)}
 if(req.headers.get('Origin')!==u.origin)return reply(null,403);
 if(req.method==='DELETE'&&m[2]!=='vault'){await bucket.delete(key);return reply(null,204)}
 if(req.method!=='PUT')return reply(null,405);
 const size=Number(req.headers.get('Content-Length'));if(!size||size>32*1024*1024)return reply(null,413);
 const h=new Headers();if(req.headers.get('If-None-Match')==='*')h.set('If-None-Match','*');else if(m[2]==='vault'&&/^"[a-f0-9-]+"$/i.test(req.headers.get('If-Match')||''))h.set('If-Match',req.headers.get('If-Match'));else return reply(null,428);
 const o=await bucket.put(key,req.body,{onlyIf:h,...(personal&&m[2]==='vault'?{customMetadata:{verifier}}:{})});return o?reply(null,200,{'ETag':o.httpEtag}):reply(null,409)
}}
