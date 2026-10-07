const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../src/domain');

test('视频预设覆盖常用平台并区分未知规格',()=>{
  for(const key of ['seedance25','seedance20','seedance20fast','seedance20mini','minimaxh3','minimaxs3','grok15','grok','wan30','wan30prime','kling3','viduq3','hailuo23','pixversev6','pika22','wan22','ltx2','hunyuanvideo'])assert.ok(C.adapters[key],key);
  assert.equal(C.adapters.hailuo23.max,null);
  assert.match(C.adapters.wan22.note,/不内置模型权重/);
  assert.equal(C.adapters.minimaxs3.max,null);
  assert.match(C.adapters.minimaxs3.note,/未在 MiniMax 官方模型目录确认/);
});
