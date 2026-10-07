const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../src/domain');
require('../src/spatial').install(C);

test('空间规则扩展后，刚确认的片段不被误判为依据变化',()=>{
 const p=C.normalize({id:'p_review',name:'复核',script:'示例',analysis:'示例',style:'写实',assets:[],sequences:[{id:'s_review',title:'场景',assetIds:[],segments:[{id:'g_review',duration:10,sourceText:'示例',startState:'',endState:'',stageStart:[],stageEnd:[],shots:[]}]}]});
 const s=p.sequences[0],g=s.segments[0];
 g.reviewed=true;
 g.basisFingerprint=C.dependencyStamp(p,s,g);
 assert.ok(!C.audit(p,s,g).some(issue=>issue.includes('审核依据已经变化')));
 p.style='手绘';
 assert.ok(C.audit(p,s,g).some(issue=>issue.includes('审核依据已经变化')));
});
