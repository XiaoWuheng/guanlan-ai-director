const base=require('./package.json').build;

module.exports={
 ...base,
 files:[...base.files,'!src/builtin-knowledge.json','!src/builtin-course.json','!src/private-feedback.json'],
 directories:{...base.directories,output:'dist-public-current'},
 win:{...base.win,artifactName:'观澜-${version}-公开便携版.${ext}'}
};
