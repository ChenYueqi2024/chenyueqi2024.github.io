import {byId} from '../lab-utils.mjs';
const choices=[["读到半路被改过的消息","应该发现改动并拒绝交付明文。","密码学比较从摘要过渡到认证加密。可以用可信来源提供的摘要核对差异，认证加密则用密钥验证消息完整性。",1],["接入未知网络的服务","需要建立共享会话密钥，并知道对端是谁。","公钥协商解决「秘密如何一起得到」。TLS 典型证书握手进一步确认自己正在同谁通信。",2],["员工只想读某份内部资料","需要按人、设备和资源的策略重新核对。","能进入网络并不产生所有资源的读取权限。先作细粒度授权，再从记录中复核判定。",3],["保护长期存放的数据","需要考虑加密数据的保密寿命和公钥算法迁移。","盘点密钥交换和签名依赖，对照 ML-KEM 与 ML-DSA 的区别，比较迁移前后的兼容性。",4],["给能读网页的模型接工具","检索可见范围、答案证据和真实操作的授权需要分开。","工具服务应判断用户、动作与资源；让模型少看、多核对，并使操作可追踪。",5]];
const controls=byId('history-controls'), result=byId('history-result'), jump=byId('history-jump');
function select(index){
  const [label,goal,reason,era]=choices[index];
  for(const [i,button] of Array.from(controls.children).entries()){
    button.setAttribute('aria-pressed',String(i===index));
  }
  result.textContent=goal+' '+reason;
  const anchor=jump.querySelector('a');
  anchor.href='#era-'+era;
  anchor.textContent='阅读「'+byId('era-'+era).querySelector('h3').textContent+'」';
  for(const card of document.querySelectorAll('.security-timeline li')){
    card.classList.toggle('selected-era',card.id==='era-'+era);
  }
}
for(const [i,[label]] of choices.entries()){
  const button=document.createElement('button');
  button.type='button';button.textContent=label;button.onclick=()=>select(i);
  controls.append(button);
}
for(const item of [controls,result,jump])item.hidden=false;
select(0);
