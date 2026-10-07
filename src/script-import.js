/* Turn caption cues into editable, time-anchored source text without inventing shots. */
function subtitleToScript(value){
 const source=String(value||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
 if(!source)return '';
 const blocks=source.split(/\n\s*\n/),rows=[];
 for(const block of blocks){const lines=block.split('\n').map(x=>x.trim()).filter(Boolean);const index=lines.findIndex(x=>/^(?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{1,3}\s*-->\s*(?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{1,3}/.test(x));if(index<0)continue;const text=lines.slice(index+1).filter(x=>!/^NOTE\b/i.test(x)).join(' ').replace(/<[^>]+>/g,'').trim();if(!text)continue;const span=lines[index].split(/\s*-->\s*/);rows.push('['+span[0].replace('.',',')+'–'+String(span[1]||'').split(/\s+/)[0].replace('.',',')+'] '+text);}
 if(!rows.length)throw Error('字幕文件没有可识别的时间码和正文，请检查 SRT 格式');
 return rows.join('\n');
}
module.exports={subtitleToScript};
