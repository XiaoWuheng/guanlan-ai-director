const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');

test('澜芯记录随资料库迁移，原资料保留',async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'guanlan-history-source-'));
 const target=await fs.mkdtemp(path.join(os.tmpdir(),'guanlan-history-target-'));
 const location=require('../src/data-location')(base);
 await location.ready();
 const messages=[{role:'user',text:'如何做空间调度？',at:'2026-10-05T00:00:00.000Z'}];
 await fs.writeFile(path.join(base,'assistant-history.json'),JSON.stringify(messages));
 await location.migrate(target);
 assert.deepEqual(JSON.parse(await fs.readFile(path.join(target,'assistant-history.json'),'utf8')),messages);
 assert.deepEqual(JSON.parse(await fs.readFile(path.join(base,'assistant-history.json'),'utf8')),messages);
});
