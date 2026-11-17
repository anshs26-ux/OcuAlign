import fs from 'node:fs';
const assets=Object.fromEntries(fs.readdirSync('web').map(f=>['/'+f,fs.readFileSync('web/'+f,f.endsWith('.webp')?'base64':'utf8')]));
fs.writeFileSync('worker/index.js','const assets='+JSON.stringify(assets)+';\n'+fs.readFileSync('worker/server.mjs','utf8'))
