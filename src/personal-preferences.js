const color=(v,f)=>/^#[a-f\d]{6}$/i.test(String(v))?v:f;
const media=v=>/^director-media:\/\/image\/[a-f0-9]{64}\.(png|jpeg|webp)$/.test(String(v))?v:'';
module.exports=input=>({
 name:String(input.name||'').trim().slice(0,60),studio:String(input.studio||'').trim().slice(0,80),role:String(input.role||'').slice(0,60),bio:String(input.bio||'').slice(0,400),
 theme:['light','dark','system'].includes(input.theme)?input.theme:'dark',
 skin:['default','deepsea','ink','stellar'].includes(input.skin)?input.skin:(Object.keys(input).length?'default':'deepsea'),
 bootStyle:['tide','ink','stellar'].includes(input.bootStyle)?input.bootStyle:'tide',
 // Existing profiles retain their on/off preference; new profiles play once.
 bootFrequency:['once','always','never'].includes(input.bootFrequency)?input.bootFrequency:(Object.hasOwn(input,'bootEnabled')?(input.bootEnabled===false?'never':'always'):'once'),
 bootEnabled:input.bootEnabled!==false,
 bootVideo:/^director-video:\/\/clip\/[a-f0-9]{64}\.(mp4|webm)$/.test(String(input.bootVideo||''))?input.bootVideo:'',
 skinVideo:/^director-video:\/\/clip\/[a-f0-9]{64}\.(mp4|webm)$/.test(String(input.skinVideo||''))?input.skinVideo:'',
 density:input.density==='compact'?'compact':'standard',scale:[90,100,110,125].includes(Number(input.scale))?Number(input.scale):100,
 assetMode:input.assetMode==='grid'?'grid':'list',home:['dashboard','assets','workbench','film'].includes(input.home)?input.home:'dashboard',
 accent:color(input.accent,'#75bcae'),surface:color(input.surface,''),opacity:Math.max(94,Math.min(100,Number(input.opacity)||100)),
 backgroundOpacity:Math.max(0,Math.min(12,Number(input.backgroundOpacity)||0)),blur:Math.max(0,Math.min(4,Number(input.blur)||0)),
 background:media(input.background),avatar:media(input.avatar),sidebarCollapsed:!!input.sidebarCollapsed,neutralPreview:input.neutralPreview!==false
});
