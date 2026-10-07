const test=require('node:test');
const assert=require('node:assert/strict');
const {subtitleToScript}=require('../src/script-import');

test('SRT 时间与对白保留为可编辑原文，编号和格式标签不污染正文',()=>{
 const source='\uFEFF1\r\n00:00:01,200 --> 00:00:03,400\r\n<i>甲：</i>钥匙还你。\r\n\r\n2\r\n00:00:03,500 --> 00:00:04,800\r\n乙：好。';
 assert.equal(subtitleToScript(source),'[00:00:01,200–00:00:03,400] 甲：钥匙还你。\n[00:00:03,500–00:00:04,800] 乙：好。');
});

test('无可用字幕时明确拒绝，避免建立空脚本',()=>{
 assert.throws(()=>subtitleToScript('只有文字，没有时间码'),/没有可识别的时间码/);
});
