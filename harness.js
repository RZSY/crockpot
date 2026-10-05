const fs=require('fs'),vm=require('vm');
const order=["dictionary","lexicon","spelling-engine","tokenizer","confusables","grammar-rules","esl-rules","parser","punctuation","document-analysis"];
function load(dir){
  const ctx=vm.createContext({console,Set,Map,Math,JSON,RegExp,Object,Array,String,Number});
  // top-level const/let don't attach to ctx; concatenate into one script
  const src=order.map(f=>(fs.existsSync(dir+'/'+f+'.js')?fs.readFileSync(dir+'/'+f+'.js','utf8'):'')).join('\n;\n')+'\n;globalThis.analyze=analyze;';
  vm.runInContext(src,ctx,{filename:'bundle'});
  return ctx.analyze;
}
module.exports={load};
