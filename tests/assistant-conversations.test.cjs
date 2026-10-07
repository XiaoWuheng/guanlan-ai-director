const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../src/assistant-conversations');
test('旧单条记录迁移到可切换对话且保留文字',()=>{const migrated=C.migrateLegacy([{role:'user',text:'检查项目进度',at:'2026-10-07T00:00:00Z'}]);assert.equal(migrated.conversations.length,1);assert.equal(migrated.conversations[0].messages[0].text,'检查项目进度');assert.equal(migrated.activeId,'chat_legacy');});
test('对话记录拒绝重复编号并裁剪消息字段',()=>{assert.throws(()=>C.clean({activeId:'chat_a',conversations:[{id:'chat_a'},{id:'chat_a'}]}),/编号无效/);const item=C.clean({activeId:'chat_a',conversations:[{id:'chat_a',title:'新对话',messages:[{role:'user',text:'A',secret:'不可保存'}]}]});assert.equal(item.conversations[0].messages[0].secret,undefined);assert.equal(item.conversations[0].messages[0].text,'A');});
