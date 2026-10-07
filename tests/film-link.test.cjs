const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const dns=require('node:dns/promises');
const https=require('node:https');
const {EventEmitter}=require('node:events');
const {PassThrough}=require('node:stream');
const FilmLink=require('../src/film-link');

test('分享文字提取链接，并拒绝本机、内网和非 HTTPS 地址',async()=>{
 assert.equal(FilmLink.extractUrl('看看这条 https://example.com/scene.mp4，挺好看'),'https://example.com/scene.mp4');
 assert.equal(FilmLink.publicAddress('127.0.0.1'),false);
 assert.equal(FilmLink.publicAddress('192.168.1.8'),false);
 assert.equal(FilmLink.publicAddress('93.184.216.34'),true);
 await assert.rejects(()=>FilmLink.checkedUrl('http://example.com/a.mp4'),/HTTPS/);
 await assert.rejects(()=>FilmLink.checkedUrl('https://127.0.0.1/a.mp4'),/公网/);
});

test('公开视频直链限量下载并交给拉片库，保留源链接',async()=>{
 const lookup=dns.lookup,get=https.get;
 dns.lookup=async()=>[{address:'93.184.216.34',family:4}];
 https.get=(_url,options,callback)=>{options.lookup('example.com',{all:true},(error,addresses)=>{assert.equal(error,null);assert.equal(addresses[0].address,'93.184.216.34');});const req=new EventEmitter();req.setTimeout=()=>{};req.destroy=()=>{};queueMicrotask(()=>{const res=new PassThrough();res.statusCode=200;res.headers={'content-type':'video/mp4','content-length':'2048'};callback(res);res.end(Buffer.alloc(2048,7));});return req;};
 try{const result=await FilmLink.importLink('https://example.com/my-scene.mp4',{importVideo:async(file,meta)=>({bytes:(await fs.stat(file)).size,...meta})});assert.equal(result.bytes,2048);assert.equal(result.title,'my-scene');assert.equal(result.sourceUrl,'https://example.com/my-scene.mp4');}
 finally{dns.lookup=lookup;https.get=get;}
});
