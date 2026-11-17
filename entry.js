import app from './worker/index.js';
// ChatGPT identity headers are not trusted on an independently hosted service.
export default {fetch(request, env) {
 const headers=new Headers(request.headers);
 headers.delete('oai-authenticated-user-id');
 headers.delete('oai-authenticated-user-email');
 return app.fetch(new Request(request,{headers}),env);
}};
