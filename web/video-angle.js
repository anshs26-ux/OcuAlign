// Keep the raw camera track for upright recordings. Rotate only the encoded copy.
export function videoInput(video,raw,flipped){
 const direct={stream:raw,angle:flipped?180:0,stop(){}};
 if(!flipped)return direct;
 const c=document.createElement('canvas');if(!c.captureStream||!video.videoWidth)return direct;
 c.width=video.videoWidth;c.height=video.videoHeight;
 let stream,raf,stopped=false;
 const stop=()=>{stopped=true;cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop())};
 try{const ctx=c.getContext('2d');ctx.setTransform(-1,0,0,-1,c.width,c.height);
 const paint=()=>{if(stopped)return;ctx.drawImage(video,0,0,c.width,c.height);raf=requestAnimationFrame(paint)};
 stream=c.captureStream(30);if(!stream.getVideoTracks().length){stop();return direct}paint();return {stream,angle:0,stop}
 }catch{stop();return direct}
}
