const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const asar=require('@electron/asar');
const pkg=require('../package.json');

const output=path.resolve(__dirname,'../dist-public-current');
const archive=path.join(output,'win-unpacked','resources','app.asar');
const portable=path.join(output,`观澜-${pkg.version}-公开便携版.exe`);
assert.ok(fs.existsSync(archive),'公开版 app.asar 尚未构建');
assert.ok(fs.existsSync(portable),'公开版便携程序尚未构建');
const files=asar.listPackage(archive).map(file=>file.replace(/^[/\\]/,'').replaceAll('\\','/'));
for(const privateFile of ['src/builtin-knowledge.json','src/builtin-course.json','src/private-feedback.json']){
 assert.ok(!files.includes(privateFile),`公开包包含本机私人文件：${privateFile}`);
}
const builtPackage=JSON.parse(asar.extractFile(archive,'package.json').toString('utf8'));
assert.equal(builtPackage.version,pkg.version,'公开包版本与源码不一致');
for(const name of ['yt-dlp.exe','yt-dlp-LICENSE','yt-dlp-THIRD_PARTY_LICENSES.txt','ffmpeg/ffmpeg.exe','ffmpeg/ffprobe.exe','ffmpeg/avcodec-62.dll','ffmpeg/LICENSE.txt','ffmpeg/COPYING.GPLv3','ffmpeg/NOTICE.txt'])assert.ok(fs.existsSync(path.join(output,'win-unpacked','resources','runtime',name)),'公开包缺少运行组件或许可：'+name);
console.log(`PUBLIC PACKAGE PASS: ${pkg.version}, 3 private files excluded, portable artifact present`);
