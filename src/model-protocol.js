// Protocol selection is explicit so private gateways can choose their actual wire format.
exports.request=(s,input,limit,key)=>{
 const headers={'Content-Type':'application/json'};
 if(s.chatAdapter==='anthropic'){
  if(key)headers['x-api-key']=key;headers['anthropic-version']='2023-06-01';
  const content=[{type:'text',text:input.user},...(input.images||[]).map(url=>{const m=/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/s.exec(url);if(!m)throw Error('Claude 图片须为已保存的PNG/JPEG/WebP');return {type:'image',source:{type:'base64',media_type:m[1],data:m[2]}};})];
  return {path:'/messages',headers,body:{model:s.model,system:input.system,messages:[{role:'user',content}],max_tokens:limit,stream:false}};
 }
 if(key)headers.Authorization='Bearer '+key;
 const content=input.images?.length?[{type:'text',text:input.user},...input.images.map(url=>({type:'image_url',image_url:{url}}))]:input.user;
 return {path:'/chat/completions',headers,body:{model:s.model,stream:s.stream!==false,[s.chatAdapter==='openai'?'max_completion_tokens':'max_tokens']:limit,messages:[{role:'system',content:input.system},{role:'user',content}]}};
};
exports.response=(s,json)=>{
 if(json.error)throw Error(json.error.message||'服务端错误');
 if(json.choices?.[0]?.finish_reason==='length'||json.stop_reason==='max_tokens')throw Error('输出截断：增加输出预留或缩小任务，不会采用不完整结果');
 const textContent=v=>Array.isArray(v)?v.filter(x=>x.type==='text').map(x=>x.text).join(''):v||'';
 return s.chatAdapter==='anthropic'?{text:textContent(json.content),usage:json.usage?{prompt_tokens:json.usage.input_tokens,completion_tokens:json.usage.output_tokens}:null}:{text:textContent(json.choices?.[0]?.message?.content),usage:json.usage};
};
