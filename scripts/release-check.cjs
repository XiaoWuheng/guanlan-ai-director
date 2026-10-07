const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
(async()=>{const asar=await import('@electron/asar'),pkg=require('../package.json'),artifacts=[];
 for(const [dir,edition] of [[pkg.build.directories.output,'统一版']]){
  const archive=path.resolve(dir,'win-unpacked/resources/app.asar'),entries=asar.listPackage(archive),packed=JSON.parse(asar.extractFile(archive,'package.json').toString());assert.equal(packed.version,pkg.version);
  for(const name of entries){const rel=name.replaceAll('\\','/').replace(/^\//,'');if(!rel.startsWith('src/')||!(await fs.stat(rel)).isFile())continue;const actual=await fs.readFile(rel);assert.ok(actual.equals(asar.extractFile(archive,path.normalize(rel))),'打包源文件不一致：'+rel);}
  assert.ok(entries.some(x=>x.replaceAll('\\','/').endsWith('/src/upgrade-ui.js')));
  for(const coreFile of ['builtin-course.json','builtin-knowledge.json'])assert.ok(entries.some(x=>x.endsWith(coreFile)),'缺少平台核心资料：'+coreFile);
  assert.ok(!entries.some(x=>/storage-location\.json|project\.sqlite|settings\.json$|model-connections\.json$|personal\.json$|assistant-(history|skills|files|conversations)\.json$|feedback-draft\.json$|\.env$/.test(x)),'不能打包用户数据或密钥配置');
  const runtime=path.resolve(dir,'win-unpacked/resources/runtime');for(const name of ['yt-dlp.exe','yt-dlp-LICENSE','yt-dlp-THIRD_PARTY_LICENSES.txt','ffmpeg/ffmpeg.exe','ffmpeg/ffprobe.exe','ffmpeg/avcodec-62.dll','ffmpeg/LICENSE.txt','ffmpeg/COPYING.GPLv3','ffmpeg/NOTICE.txt'])assert.ok((await fs.stat(path.join(runtime,name))).isFile(),'运行组件缺失：'+name);const downloaderHash=crypto.createHash('sha256').update(await fs.readFile(path.join(runtime,'yt-dlp.exe'))).digest('hex');assert.equal(downloaderHash,'52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8','解析组件校验失败');
  const files=(await fs.readdir(dir)).filter(x=>x.includes(pkg.version)&&x.endsWith('.exe'));assert.equal(files.length,1,'每版应有一个当前便携程序');
  const file=path.resolve(dir,files[0]),bytes=await fs.readFile(file);artifacts.push({edition,file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }
 const report={version:pkg.version,at:new Date().toISOString(),checks:['版本一致','关键升级文件存在','打包源码与当前源码逐文件一致','平台核心资料完整，个人数据不入包','未打包用户设置与数据库','内置视频解析组件和许可证完整且校验通过','程序SHA256'],signing:'未配置代码签名；不视作正式商业发布通过',artifacts};const evidence=path.resolve('audit-evidence/visual-'+pkg.version.replaceAll('.',''));await fs.mkdir(evidence,{recursive:true});await fs.writeFile(path.join(evidence,'release-manifest.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(process.argv.includes('--public-release'))throw Error('正式公开发布门禁未通过：尚未配置和验证代码签名证书');
})().catch(e=>{console.error(e);process.exitCode=1;});

