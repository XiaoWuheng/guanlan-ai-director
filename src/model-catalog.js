(function(root){
const text=(id,name,baseUrl,model,extra={})=>({id,name,kind:'chat',provider:'cloud',baseUrl,model,contextTokens:65536,outputTokens:8192,stream:true,vision:false,...extra});
const image=(id,name,baseUrl,model,adapter,sizes)=>({id,name,kind:'image',provider:'cloud',baseUrl,model,adapter,sizes});
const presets=[
 text('qwen-plus','通义千问 · Qwen Plus','https://dashscope.aliyuncs.com/compatible-mode/v1','qwen-plus'),
 text('qwen-vl-plus','通义千问 · Qwen VL Plus（看图分析）','https://dashscope.aliyuncs.com/compatible-mode/v1','qwen-vl-plus',{vision:true}),
 text('qwen-max','通义千问 · Qwen Max','https://dashscope.aliyuncs.com/compatible-mode/v1','qwen-max'),
 text('deepseek-flash','DeepSeek · Flash','https://api.deepseek.com','deepseek-flash'),
 text('deepseek-pro','DeepSeek · V4 Pro','https://api.deepseek.com','deepseek-v4-pro'),
 text('kimi','Kimi · K2.5','https://api.moonshot.cn/v1','kimi-k2.5',{vision:true}),
 text('local','本机服务 · 自填已安装模型','http://localhost:11434/v1','',{provider:'local',localUrl:'http://localhost:11434/v1'}),
 text('custom-chat','自定义 · Chat Completions 接口','',''),
 image('gpt-image-2','OpenAI · GPT Image 2','https://api.openai.com/v1','gpt-image-2','standard',['1024x1024','1536x1024','1024x1536']),
 image('gpt-image-15','OpenAI · GPT Image 1.5','https://api.openai.com/v1','gpt-image-1.5','standard',['1024x1024','1536x1024','1024x1536']),
 image('qwen-image','阿里云 · 千问 Image Plus','https://dashscope.aliyuncs.com/api/v1','qwen-image-plus','dashscope',['1328x1328','1664x928','928x1664','1472x1104','1104x1472']),
 image('wan26','阿里云 · 万相2.6（文生图）','https://dashscope.aliyuncs.com/api/v1','wan2.6-t2i','dashscope',['1280x1280','1696x960','960x1696']),
 image('kolors','硅基流动 · Kolors','https://api.siliconflow.cn/v1','Kwai-Kolors/Kolors','siliconflow',['1024x1024','768x1024','1024x768']),
 image('flux','硅基流动 · FLUX.1 schnell','https://api.siliconflow.cn/v1','black-forest-labs/FLUX.1-schnell','siliconflow',['1024x1024','768x1024','1024x576','576x1024']),
 image('cogview','智谱 · CogView 4','https://open.bigmodel.cn/api/paas/v4','cogview-4','standard',['1024x1024']),
 image('custom-image','自定义 · Images Generations 接口','','','standard',['1024x1024','1536x1024','1024x1536'])
];

// Catalog entries are editable connection templates, never installed weights.
const bases={qwen:'https://dashscope.aliyuncs.com/compatible-mode/v1',openai:'https://api.openai.com/v1',gemini:'https://generativelanguage.googleapis.com/v1beta/openai',claude:'https://api.anthropic.com/v1',glm:'https://open.bigmodel.cn/api/paas/v4',ark:'https://ark.cn-beijing.volces.com/api/v3'};
const addText=(family,models,base,extra={})=>models.forEach(([model,label])=>presets.push(text('preset-'+model,family+' · '+label,base,model,{family,...extra})));
addText('通义千问',[['qwen3.8-max','Qwen3.8 Max'],['qwen3-max','Qwen3 Max']],bases.qwen);
addText('通义千问',[['qwen3.5-plus','Qwen3.5 Plus'],['qwen3.5-flash','Qwen3.5 Flash']],bases.qwen,{vision:true});
addText('OpenAI',[['gpt-5.4','GPT-5.4'],['gpt-5.4-mini','GPT-5.4 Mini'],['gpt-5.2','GPT-5.2']],bases.openai,{vision:true,chatAdapter:'openai'});
addText('OpenAI',[['gpt-4.1','GPT-4.1'],['gpt-4.1-mini','GPT-4.1 Mini']],bases.openai,{vision:true});
addText('Google Gemini',[['gemini-3.8-flash','Gemini 3.8 Flash']],bases.gemini,{vision:true});
addText('Anthropic Claude',[['claude-sonnet-5-5','Sonnet 5.5'],['claude-opus-5-5','Opus 5.5'],['claude-fable-5-1','Fable 5.1'],['claude-haiku-4-5','Haiku 4.5']],bases.claude,{vision:true,chatAdapter:'anthropic',stream:false,note:'使用原生 Messages 接口。当前同步返回；旧型号的可用期以控制台为准。'});
addText('智谱 GLM',[['glm-5','GLM-5']],bases.glm);
addText('MiniMax',[['MiniMax-M2.7','M2.7'],['MiniMax-M2.5','M2.5']],'https://api.minimax.io/v1');
addText('豆包',[['doubao-seed-2-0-pro-260215','Seed 2.0 Pro']],bases.ark,{vision:true,note:'可替换为账号内实际可用的 Model ID 或 ep- 接入点。'});
addText('腾讯混元',[['hunyuan-turbos-latest','TurboS'],['hunyuan-t1-latest','T1']],'https://api.hunyuan.cloud.tencent.com/v1');
addText('百度文心',[['ernie-5.0','ERNIE 5.0']],'https://qianfan.baidubce.com/v2',{note:'请按账号所在区域核对基础地址与型号。'});
addText('xAI Grok',[['grok-4.7','Grok 4.7']],'https://api.x.ai/v1');
addText('Mistral',[['mistral-large-latest','Large'],['mistral-small-latest','Small']],'https://api.mistral.ai/v1');
presets.push(
 image('qwen-image-max','阿里云 · 千问 Image Max','https://dashscope.aliyuncs.com/api/v1','qwen-image-max','dashscope',['1328x1328','1664x928','928x1664']),
 image('qwen-image-20','阿里云 · 千问 Image 2.0 Pro','https://dashscope.aliyuncs.com/api/v1','qwen-image-2.0-pro','dashscope',['2048x2048','2368x1728','1728x2368']),
 image('seedream-40','豆包 · Seedream 4.0',bases.ark,'doubao-seedream-4-0-250828','seedream',['2048x2048','2560x1440','1440x2560']),
 image('seedream-50','豆包 · Seedream 5.0 Flash',bases.ark,'doubao-seedream-5-0-flash-260915','seedream',['2048x2048','2560x1440','1440x2560']),
 image('gemini-image','Google · Gemini Flash Image',bases.gemini,'gemini-2.5-flash-image','gemini',['1024x1024']),
 image('gemini-pro-image','Google · Gemini Pro Image（预览）',bases.gemini,'gemini-3-pro-image-preview','gemini',['1024x1024'])
);
for(const [id,name,base]of [['lmstudio','LM Studio','http://localhost:1234/v1'],['vllm','vLLM / SGLang','http://localhost:8000/v1']])presets.push(text(id,'本机 / 私有 · '+name,base,'',{family:'本机与私有部署',provider:'local',note:'先启动服务，再填写实际加载的模型ID。支持Qwen、Llama、Gemma、GLM、DeepSeek等兼容部署；不自动安装模型。'}));
presets.push(text('private-chat','私有 / 微调模型 · 自定义接口','','',{family:'本机与私有部署',note:'填写私有HTTPS服务或兼容网关地址、实际部署ID和密钥。原生其他协议需由网关转换为支持的协议。'}));
presets.push({...image('private-image','私有生图 · 自定义接口','','','standard',['1024x1024']),family:'本机与私有部署',note:'适用于通过同步Images API暴露的私有生图服务；ComfyUI工作流不能直接当作此协议。'});
for(const p of presets){p.family||=p.name.split(' · ')[0];p.chatAdapter||='standard';p.note||=p.kind==='image'?'文生图预设；请核对区域、模型权限和尺寸，单次生成1张。':'地址、型号、能力与预算均可修改；默认预算不代表模型最大能力。';}
const legacy=presets.find(p=>p.id==='gpt-image-15');legacy.name+='（旧版）';legacy.note='保留旧版迁移入口；官方已标记弃用，优先使用账号仍可调用的新版型号。';
const groups=kind=>[...new Set(presets.filter(p=>p.kind===kind).map(p=>p.family))];

const value={presets,groups,checkedAt:'2026-10-04'};
if(typeof module!=='undefined')module.exports=value;else root.ModelCatalog=value;
})(globalThis);
