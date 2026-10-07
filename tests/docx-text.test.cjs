const test=require('node:test');
const assert=require('node:assert/strict');
const Zip=require('adm-zip');
const {extract}=require('../src/docx-text');
test('DOCX 保留段落、表格、制表、换行和 XML 字符',()=>{const zip=new Zip();zip.addFile('word/document.xml',Buffer.from('<w:document xmlns:w="urn:w"><w:body><w:p><w:r><w:t>雨夜 &amp; 钥匙</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>镜一</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:t>角色</w:t></w:p></w:tc><w:tc><w:p><w:t>陈安&#x5B89;</w:t><w:br/><w:t>抬眼</w:t></w:p></w:tc></w:tr></w:tbl></w:body></w:document>'));const text=extract(zip.toBuffer());assert.match(text,/雨夜 & 钥匙\t镜一/);assert.match(text,/角色/);assert.match(text,/陈安安\n抬眼/);});
test('DOCX 损坏或正文为空会给出可理解错误',()=>{assert.throws(()=>extract(Buffer.from('not a zip')),/无法打开|缺少正文/);const zip=new Zip();zip.addFile('word/document.xml',Buffer.from('<w:document/>'));assert.throws(()=>extract(zip.toBuffer()),/没有可提取/);});
