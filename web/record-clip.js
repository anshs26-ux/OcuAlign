// Use the actual camera track and let the browser finalize its container on stop.
export function startClip(stream,events,Recorder=MediaRecorder){
 const track=stream.getVideoTracks()[0];
 if(!track||track.readyState!=='live'||track.muted)throw Error('Camera is not ready. Wait for the live image, then tap Record again.');
 const opts={videoBitsPerSecond:3_000_000},types=['video/mp4','video/webm'].filter(t=>Recorder.isTypeSupported?.(t));
 let last;
 for(const config of [opts,...types.map(mimeType=>({...opts,mimeType})),{}]){
 let r;try{
 r=new Recorder(stream,config);let chunks=[],failed=false;
 r.ondataavailable=({data})=>{if(data?.size&&!failed)chunks.push(data)};
 r.onerror=()=>{if(!failed){failed=true;events.error('Recording was interrupted. Please try again.')}};
 r.onstop=()=>{if(failed)return;
 if(!chunks.length)return events.error('No video frames were recorded. Wait for the live preview to move, then record again.');
 events.ready(new Blob(chunks,{type:r.mimeType||chunks[0].type}))};
 r.start(4000);return r
 }catch(e){last=e;if(r){r.onstop=r.onerror=r.ondataavailable=null;if(r.state==='recording')r.stop()}}
 }throw Error('The browser could not start video recording. '+(last?.message||''))
}
