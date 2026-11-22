import { byId } from '../lab-utils.mjs';

const http3 = {
  'transport-label': 'QUIC · 由 UDP 数据报承载',
  transport: 'UDP 提供数据报，QUIC 在其上实现连接、可靠流、流量控制和拥塞控制。一个流丢失的片段不会像 TCP 的字节序那样直接卡住其他流的交付，共用的链路拥塞仍会影响整条连接。',
  'identity-label': 'TLS 1.3 · 整合在 QUIC 握手中',
  identity: 'QUIC 在连接建立时携带 TLS 握手消息，浏览器仍核对证书链和站点名。上一步与这一步是同一握手的两个视角。应用数据由 QUIC 的包保护机制加密。',
  'http-label': 'HTTP/3 · 在 QUIC 流之上',
  http: 'HTTP 的请求、响应和状态码仍有同样的含义，HTTP/3 将每个请求及其响应映射到 QUIC 流。浏览器需已知站点支持 HTTP/3。若 QUIC 无法连接，浏览器可改用基于 TCP 的 HTTP。',
  'packet-transport': 'UDP · 源端口 51234 → 目的端口 443',
  'packet-payload': '承载加密 HTTP/3 数据的 QUIC 包'
};
const cachedDns = '浏览器或操作系统仍持有有效的地址记录，这次直接复用。当前分支无需向递归解析器发出新的 DNS 查询。';
const copyFields = Array.from(document.querySelectorAll('[data-copy]'), element => ({
  element, key: element.dataset.copy, initial: element.textContent
}));
const dnsText = document.querySelector('[data-copy="dns"]');
const uncachedDns = dnsText.textContent;
const stages = Array.from(byId('stages').children);
const transport = byId('transport');
const cached = byId('cached');

function buttonFor(label, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

const stepButtons = stages.map((stage, index) => {
  const button = buttonFor(stage.dataset.step, () => renderStage(index));
  button.setAttribute('aria-controls', stage.id);
  const item = document.createElement('li');
  item.append(button);
  byId('stage-picker').append(item);
  return button;
});

let step = 0;
function renderStage(index) {
  step = index;
  const hit = cached.checked;
  const quic = transport.value === 'h3';
  for (const { element, key, initial } of copyFields) {
    element.textContent = (quic ? http3[key] : undefined) ?? initial;
  }
  dnsText.textContent = hit ? cachedDns : uncachedDns;
  stepButtons[2].textContent = hit ? '解析名字（复用）' : '解析名字';
  stepButtons[2].dataset.skipped = String(hit);
  stages.forEach((stage, i) => {
    stage.hidden = i !== step;
    stepButtons[i].setAttribute('aria-pressed', String(i === step));
  });

  const chosen = stages[step];
  const notes = {
    'stage-dns': hit ? ' · 不发出新查询' : ' · 向递归解析器查询',
    'stage-route': ' · DNS 查询和后续网站通信都可能经过 IP 转发',
    'stage-connect': quic ? ' · QUIC 与 TLS 共同完成握手' : ' · 先建立 TCP 连接',
    'stage-identity': quic ? ' · 与建立 QUIC 连接属于同一次握手' : ' · 在已建立的 TCP 连接上握手'
  };
  byId('path-status').textContent = '第 ' + (step + 1) + ' / ' + stages.length + ' 步 · ' + chosen.dataset.step + (notes[chosen.id] ?? '');
}

transport.addEventListener('change', () => renderStage(step));
cached.addEventListener('change', () => renderStage(step));
renderStage(0);
byId('path-controls').hidden = false;

const packetCards = Array.from(document.querySelectorAll('.packet-card'));
const hopNotes = [
  '客户端要访问异地 IP，其首跳帧交给默认网关。',
  '默认网关递减 TTL，再为下一段链路封装新的帧。比较三张卡片里的端点 IP 与端口。',
  '经过示例路径的六次路由转发，站点入口收到 TTL 58 的包。外层的下一跳地址已多次改变。'
];
const hopButtons = packetCards.map((card, index) => buttonFor(card.dataset.hop, () => inspectHop(index)));
byId('packet-actions').append(...hopButtons);

function inspectHop(index) {
  packetCards.forEach((card, i) => {
    card.classList.toggle('is-inspected', i === index);
    hopButtons[i].setAttribute('aria-pressed', String(i === index));
  });
  byId('packet-status').textContent = hopNotes[index];
}

inspectHop(0);
byId('packet-actions').hidden = false;
byId('packet-status').hidden = false;

const cases = [
  {
    name: '只在这个 Wi-Fi 上网关变了',
    evidence: '终端接入同一个受管 Wi-Fi 后，地址还在原子网，默认网关与 DNS 解析器却同时变了。无线连接一直很稳定，别的网段没有异常。',
    stage: 'stage-config',
    reason: '先对照终端拿到的租约、可信 DHCP 服务记录和受管交换机记录，确认当时发出的配置与网段规划一致。'
  },
  {
    name: '两个解析器给出不同地址',
    evidence: '在同一台设备上，已知签名区域的站点通过一个解析器能得到预期地址，另一个解析器报签名验证错误。接入状态和默认网关均正常。',
    stage: 'stage-dns',
    reason: '先对照解析器配置、签名有效期与权威回答。地址不同有时是正常的 CDN 调度，这里的验证失败提供了更具体的线索。'
  },
  {
    name: '只有部分运营商连不上',
    evidence: '不同地点查得相同站点地址，但只有部分运营商的用户超时。运营人员的独立路由观测同时发现，前缀起源与预期授权不符。',
    stage: 'stage-route',
    reason: '先核对授权记录、变更工单和不同自治系统看到的路由。单靠超时很难判断，独立的前缀起源变化把调查方向指向转发与路由。'
  },
  {
    name: '服务器回复了握手，但页面打不开',
    evidence: '名字解析和 TCP 建连都正常，浏览器随后报告证书中的站点名与所访问的名称不一致。',
    stage: 'stage-identity',
    reason: '先核对浏览器请求的名称、站点入口实际提供的证书及代理配置。这个现象也可能来自证书部署错误。'
  },
  {
    name: '连接正常，却看到了别人的记录',
    evidence: 'DNS、连接和 HTTPS 身份验证均成功。审计发现应用返回了属于其他账户的记录，服务端没有相应的授权记录。',
    stage: 'stage-http',
    reason: '先检查应用是否对当前用户与每个请求对象做了服务端授权。HTTPS 保护数据在传输中的机密性和完整性，业务权限由应用判定。'
  }
];
const caseControl = byId('case');
const guess = byId('guess');
const check = byId('check');
const result = byId('diagnosis-result');

cases.forEach((example, index) => caseControl.add(new Option(example.name, index)));
stages.forEach(stage => guess.add(new Option(stage.dataset.step, stage.id)));

function loadCase() {
  byId('evidence').textContent = cases[caseControl.selectedIndex].evidence;
  guess.value = '';
  check.disabled = true;
  result.hidden = true;
}
caseControl.addEventListener('change', loadCase);
guess.addEventListener('change', () => {
  check.disabled = guess.value === '';
  result.hidden = true;
});
check.addEventListener('click', () => {
  const example = cases[caseControl.selectedIndex];
  const label = byId(example.stage).dataset.step;
  const verdict = guess.value === example.stage ? '判断吻合。' : '还有更直接的线索。';
  result.hidden = false;
  result.textContent = verdict + '优先查「' + label + '」。' + example.reason;
});
loadCase();
byId('quiz').hidden = false;
