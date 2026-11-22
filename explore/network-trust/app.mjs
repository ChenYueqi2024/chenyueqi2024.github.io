import {byId} from '../lab-utils.mjs';

function renderDns() {
  const scenario = byId('dns-scenario').value;
  const elapsed = Number(byId('dns-time').value);
  byId('dns-time-control').hidden = scenario !== 'migrate';
  byId('validate-label').hidden = scenario !== 'signature';
  byId('dns-clock').value = elapsed + ' 秒';
  let a, b, outcome;
  if (scenario === 'migrate') {
    const answer = expires => elapsed < expires
      ? '192.0.2.10 · 旧缓存还可用 ' + (expires - elapsed) + ' 秒'
      : '192.0.2.20 · 从权威记录得到最新地址';
    a = answer(30);
    b = answer(90);
    outcome = elapsed >= 30 && elapsed < 90
      ? '此刻两台解析器回答不同。B 按 TTL 继续使用旧记录，等缓存过期才更新。'
      : '此刻两台解析器回答相同。移动时间到 30 至 89 秒，比较地址切换的过渡期。';
  } else if (scenario === 'cdn') {
    a = '192.0.2.20 · 甲地边缘节点';
    b = '198.51.100.20 · 乙地边缘节点';
    outcome = '两地查询都得到了授权发布的答案。要判断差异，先比对调度规则与签名状态。';
  } else {
    const validated = byId('validate').checked;
    a = '192.0.2.20 · 有效签名的答案';
    b = validated ? '拒绝交付地址 · 签名验证失败' : '198.51.100.77 · 返回未经验证的地址';
    outcome = validated ? 'B 拒绝了签名异常的答案。实际排查还需核对签名期限、密钥和发布过程。'
      : '关闭验证后，B 继续交付答案。仅凭返回了地址，无法确认签名数据的完整性。';
  }
  byId('dns-a').textContent = a;
  byId('dns-b').textContent = b;
  byId('dns-outcome').textContent = outcome;
}

const tlsObservations = {
  ok: {
    browser: '浏览器是 TLS 端点，发出明文请求供 TLS 加密，并在解密后读到响应。',
    wire: '链路上可以观察目标 IP、包大小和时序。HTTP 正文在这段连接中以密文传输。',
    edge: 'CDN 是首段连接的终止点，处理明文 HTTP，再通过另一条 HTTPS 连接转发请求。',
    origin: '校园源站终止第二条 TLS 连接，读取 CDN 转来的请求。第二条连接有自己的密钥与校验。'
  },
  mismatch: {
    browser: '浏览器发现证书的名字与访问目标不符。本例中止握手结果，不发送应用请求。',
    wire: '能观察到连接和握手相关的流量，无后续 HTTP 请求正文。',
    edge: '证书被浏览器拒绝，本例没有 HTTP 请求交给 CDN 处理。',
    origin: '浏览器在前一段就中止，本例没有请求转发到源站。'
  },
  different: {
    browser: '浏览器校验了实际访问域名的证书。证书只为那个域名建立身份，无法推断它是用户原本要找的站点。',
    wire: '链路仍保护正文，但目的地址指向另一个站点。线路保密并不能替用户选择业务对象。',
    edge: '校园 CDN 在本例没有收到请求，访问落在另一个站点的 TLS 终止点。',
    origin: '校园源站没有收到请求。用户选择的 URL 决定浏览器向哪个身份发起连接。'
  }
};

function renderTls() {
  byId('tls-outcome').textContent = tlsObservations[byId('tls-scenario').value][byId('tls-position').value];
}

function renderSegment() {
  const role = byId('role').value;
  const target = byId('target').value;
  const blocked = byId('segmented').checked && target === 'admin' && role !== 'operator';
  const authorized = target === 'public' || (target === 'records' && role === 'student') || (target === 'admin' && role === 'operator');
  byId('network-decision').textContent = blocked ? '拒绝 · 来源不在管理网' : '允许 · 请求可到应用';
  byId('app-decision').textContent = blocked ? '未执行 · 请求被上游拦下' :
    authorized ? '允许 · 身份满足此操作所需权限' : '拒绝 · 当前角色无权访问此数据或操作';
  byId('segment-outcome').textContent = blocked ? '流量停在网络边界，应用尚未看到请求。'
    : authorized ? '网络可达且应用授权，本例允许访问。'
      : '连接能到达应用，当前身份仍无权访问。局域网位置无法取代业务授权。';
}

for (const [panel, controls, render] of [
  ['dns-experiment', ['dns-scenario', 'dns-time', 'validate'], renderDns],
  ['tls-experiment', ['tls-scenario', 'tls-position'], renderTls],
  ['segment-experiment', ['role', 'target', 'segmented'], renderSegment]
]) {
  for (const id of controls) byId(id).addEventListener('input', render);
  render();
  byId(panel).hidden = false;
}

