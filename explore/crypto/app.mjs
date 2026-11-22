import {byId} from '../lab-utils.mjs';
import {symmetric,hybrid,hashPair,sign,flip,hex} from './model.mjs';

const descriptions={
  symmetric:'同一把 AES 密钥加密两次，每次生成新的 96 位 IV。对比密文，再翻转一个位，看认证是否通过。',
  hybrid:'先用随机 AES 密钥加密正文，再用接收方 RSA 公钥保护这把短密钥。接收方用私钥打开密钥包，然后恢复正文。',
  hash:'对原文和末尾加 ! 的版本分别计算 SHA-256。比较两个 256 位摘要的不同位数。',
  signature:'持有 ECDSA 私钥的一方签名，持有公钥的一方核验。再把原文末尾加 !，用原来的签名重新核验。'
};
const snippet=value=>hex(value.slice(0,40))+(value.length>40?'…':'');
let experiment,mode,message;
const validators={
  symmetric:async()=>decode(await experiment.open(experiment.cipher)),
  hybrid:async()=>decode(await experiment.open(experiment.cipher)),
  signature:async()=>await experiment.verify(message)?'原文通过验签。':'原文未通过验签。'
};
function decode(result){return '认证通过，恢复明文：「'+new TextDecoder().decode(result)+'」。';}
function describe(items){
  const rows=items.map(([name,value])=>{
    const line=document.createElement('div'),label=document.createElement('dt'),data=document.createElement('dd');
    label.textContent=name;data.textContent=value;line.append(label,data);return line;
  });
  byId('crypto-results').replaceChildren(...rows);
}
function select(){
  byId('crypto-description').textContent=descriptions[byId('algorithm').value];
  experiment=null;
  byId('tamper').disabled=true;
  byId('restore').disabled=true;
  byId('crypto-state').textContent='点击运行计算。';
  describe([]);
}
async function run(){
  if(!crypto.subtle){byId('crypto-state').textContent='此浏览器环境缺少 Web Crypto，请通过 HTTPS 或 localhost 打开。';return;}
  mode=byId('algorithm').value;
  message=byId('plain').value;
  const controls=['algorithm','plain','run','tamper','restore'];
  controls.forEach(id=>byId(id).disabled=true);
  byId('crypto-state').textContent='正在由浏览器计算…';
  experiment=null;
  try{
    if(mode==='hash'){
      const r=await hashPair(message);
      describe([['原文摘要',hex(r.original)],['追加 ! 后的摘要',hex(r.changed)]]);
      byId('crypto-state').textContent='256 位中有 '+r.changedBits+' 位不同。每次改变文本，实测位数可能变化。';
      return;
    }
    if(mode==='signature'){
      experiment=await sign(message);
      describe([['ECDSA P-256 签名',snippet(experiment.signature)],['签名字节数',String(experiment.signature.length)]]);
    }else{
      experiment=await (mode==='symmetric'?symmetric(message):hybrid(message));
      const fields=[['第一次 IV',hex(experiment.iv)],['正文密文与认证标签',snippet(experiment.cipher)],
        ['明文和密文字节数',experiment.bytes+' / '+experiment.cipher.length]];
      if(experiment.second){
        fields.push(['第二次 IV（同一把密钥）',hex(experiment.second.iv)],
          ['第二次密文与认证标签',snippet(experiment.second.cipher)]);
      }else fields.push(['RSA-OAEP 密钥包',snippet(experiment.wrapped)],['密钥包大小',experiment.wrapped.length+' 字节']);
      describe(fields);
    }
    byId('crypto-state').textContent=await validators[mode]();
  }catch{
    experiment=null;
    byId('crypto-state').textContent='该算法没有在当前环境完成。请切换算法重试。';
  }finally{
    for(const id of ['algorithm','plain','run'])byId(id).disabled=false;
    for(const id of ['tamper','restore'])byId(id).disabled=!experiment;
  }
}
async function inspect(tamper){
  byId('run').disabled=byId('algorithm').disabled=byId('plain').disabled=true;
  byId('tamper').disabled=byId('restore').disabled=true;
  try{
    let outcome;
    if(!tamper)outcome=await validators[mode]();
    else if(mode==='signature'){
      outcome=await experiment.verify(message+'!')?'修改后的消息通过验签。':'验签失败。原签名与加了 ! 的消息不匹配。';
    }else{
      outcome=decode(await experiment.open(flip(experiment.cipher)));
    }
    byId('crypto-state').textContent=outcome;
  }catch{
    byId('crypto-state').textContent=tamper && mode!=='signature'
      ? '密文改变了 1 位。认证解密拒绝，浏览器没有交付明文。'
      : '当前核验未完成。可以重新运行计算。';
  }finally{
    for(const id of ['run','plain','algorithm','tamper','restore'])byId(id).disabled=false;
  }
}
byId('run').onclick=run;
byId('algorithm').onchange=select;
byId('plain').oninput=select;
byId('tamper').onclick=()=>inspect(true);
byId('restore').onclick=()=>inspect(false);
select();
