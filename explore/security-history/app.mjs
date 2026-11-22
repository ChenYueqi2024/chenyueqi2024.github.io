import {byId} from '../lab-utils.mjs';

const choices = [
  ['路上的消息被改了', 'era-1', '先核对认证标签。密钥、nonce 和拒绝路径都影响认证加密能否按预期工作。'],
  ['确认正在访问的是谁', 'era-2', '先核对实际访问的域名及其证书。再检查账号认证与业务授权，避免把连接成功当成授权证据。'],
  ['让云计算保留输入隐私', 'encrypted-compute', '先分清谁持有解密密钥、计算方收到什么和谁能看到结果。输出本身也可能泄露输入。'],
  ['员工只该读一份资料', 'era-3', '先看服务端是否对当前主体和目标资源作了授权。再查网络分段和审计记录。'],
  ['软件更新来自多个依赖方', 'supply-chain', '追踪从来源到构建、签名和发布的证据。验证签名之后，仍需审查构建过程和组件。'],
  ['保护长期存放的数据', 'era-4', '先明确资料需要保密多久，再盘点当前密钥建立机制及其依赖，安排迁移和互操作测试。'],
  ['给能读网页的模型接工具', 'era-5', '先记录资料可见范围、答案证据和允许的工具动作。任何真实操作都由独立的服务校验权限。']
];
const controls = byId('history-controls');
const result = byId('history-result');
const jump = byId('history-jump');
const link = jump.querySelector('a');
const cards = document.querySelectorAll('.security-timeline > li');
const buttons = choices.map(([label, target, explanation]) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', () => select(target, explanation));
  return button;
});

function select(target, explanation) {
  buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(choices[i][1] === target)));
  result.textContent = explanation;
  link.href = '#' + target;
  link.textContent = '阅读「' + byId(target).querySelector('h3').textContent + '」';
  cards.forEach(card => card.classList.toggle('selected-era', card.id === target));
}

controls.append(...buttons);
select(choices[0][1], choices[0][2]);
for (const item of [controls, result, jump]) item.hidden = false;

