import { byId as get } from '../lab-utils.mjs';
import { ethernet, forward, transfer, congestion, dataPaths, judge, align } from './model.mjs';

const lab = document.body.dataset.lab;
const value = id => get(id).value;
const number = id => Number(value(id));
const checked = id => get(id).checked;
function node(tag, text, css) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (css) element.className = css;
  return element;
}

function display(elements, summary) {
  get('visual').replaceChildren(...elements);
  get('result').textContent = summary;
}

function table(title, headings, entries, highlight = () => false) {
  const region = node('div', undefined, 'table-scroll');
  region.setAttribute('role', 'region');
  region.setAttribute('aria-label', title);
  region.tabIndex = 0;
  const t = node('table', undefined, 'lesson-table sim-table');
  const header = t.createTHead().insertRow();
  for (const label of headings) {
    const field = node('th', label);
    field.scope = 'col';
    header.append(field);
  }
  const body = t.createTBody();
  for (const [i, fields] of entries.entries()) {
    const row = body.insertRow();
    const key = node('th', fields[0]);
    key.scope = 'row';
    row.append(key);
    for (const field of fields.slice(1)) row.insertCell().textContent = field;
    if (highlight(i)) row.classList.add('sim-highlight');
  }
  region.append(t);
  return region;
}

function card(title, list, text) {
  const box = node('article', undefined, 'lesson-card');
  box.append(node('h3', title), list, node('p', text, 'lesson-muted'));
  return box;
}

function chips(items) {
  const list = node('ul', undefined, 'chips');
  for (const item of items) list.append(node('li', item));
  return list;
}

function tracePanel(title, data, index, capacity) {
  const graph = node('div', undefined, 'sim-queue');
  graph.setAttribute('role', 'img');
  graph.setAttribute('aria-label', title + '的每轮积压。');
  const maximum = Math.max(1, capacity);
  for (const item of data.history) {
    const column = node('span', undefined, item.round === index ? 'sim-focused' : '');
    const fill = node('i');
    fill.style.height = (item.pending / maximum * 100) + '%';
    if (item.dropped) fill.classList.add('sim-drop');
    column.title = '第 ' + item.round + ' 轮积压 ' + item.pending + '，丢弃 ' + item.dropped;
    column.append(fill);
    graph.append(column);
  }
  return card(title, graph, '读数到第 ' + index + ' 轮 · 总交付 ' + data.totalDelivered + '，总丢弃 ' +
    data.totalDropped + '，平均积压 ' + data.meanQueue.toFixed(1) + ' 段。');
}

const renders = {
  'ethernet-switching'() {
    const event = ethernet(checked('vlan'), checked('swap'))[number('frame') - 1];
    display([
      table('交换机端口', ['主机', '端口', 'VLAN', '当前帧'], event.members.map(item => [
        item.host, item.port, item.vlan, item.port === event.ingress.port ? '进入' : event.egress.includes(item) ? '送出' : '不发送'
      ]), i => event.egress.includes(event.members[i])),
      table('目前学到的 MAC 表', ['地址标签', '端口', 'VLAN'], event.learned.map(item => [item.host, item.port, item.vlan]))
    ], event.source + ' → ' + event.destination + '：' + (event.known ? '已知单播' : '未知单播，按本 VLAN 泛洪') +
      '。出端口 ' + event.egress.map(item => item.port).join('、') + '。目的主机' + (event.accepted ? '收到帧。' : '未收到帧。'));
  },
  'packet-forwarding'() {
    const destination = value('destination');
    const {rows, selected, destinationBits} = forward(destination, checked('specific'), checked('fallback'));
    const split = selected?.length ?? 0;
    const prefix = node('code', undefined, 'sim-bits');
    prefix.append(node('strong', destinationBits.slice(0, split)), node('span', destinationBits.slice(split)));
    display([node('p', '目的地址二进制，彩色部分是所选匹配前缀。'), prefix,
      table('IPv4 转发表', ['目的网络', '下一跳', '比较结果'], rows.map(row => [
        row.prefix + '/' + row.length, row.next, row === selected ? '选中' : row.match ? '匹配' : '不匹配'
      ]), index => rows[index] === selected)],
      selected ? destination + ' 选中 /' + selected.length + '，交给' + selected.next + '。' : '没有匹配路由，本例无法转发。');
  },
  'reliable-transfer'() {
    const events = transfer(number('missing'), checked('buffer'));
    const input = get('step');
    input.max = events.length;
    const stage = Math.min(number('step'), events.length);
    input.value = stage;
    get('advance').disabled = stage === events.length;
    const event = events[stage - 1];
    const timeline = table('传输事件回放', ['步', '事件', '接收端', '当前 ACK'], events.slice(0, stage).map((item, i) => [
      i + 1, item.kind + ' · 段 ' + item.segment, item.result, item.ack
    ]), i => i === stage - 1);
    const strip = chips(Array.from({length:5}, (_, i) => {
      const segment = i + 1;
      return '段 ' + segment + ' · ' + (segment < event.ack ? '已交付' : event.buffered.includes(segment) ? '已暂存' : '待补齐');
    }));
    display([strip, timeline], '接收端下一步等 ' + event.ack + '。已交付 ' + (event.ack - 1) + ' / 5 段，已重传 ' + event.retrans + ' 段。' +
      (stage === events.length ? ' 本轮传输结束。' : ''));
  },
  'congestion-queue'() {
    const service = number('service'), capacity = number('queue'), step = number('round');
    const traces = [congestion(service, capacity, step, false), congestion(service, capacity, step, true)];
    const labels = ['固定发送', '简化 AIMD'];
    const panels = node('div', undefined, 'lesson-grid');
    traces.forEach((trace, index) => panels.append(tracePanel(labels[index], trace, step, capacity)));
    const stats = table('当前轮次', ['策略', '本轮发送', '本轮交付', '轮末积压', '本轮丢弃'],
      traces.map(({history}, i) => {
        const {offered, delivered, pending, dropped} = history.at(-1);
        return [labels[i], offered, delivered, pending, dropped];
      }));
    display([node('p', '每根柱表示一轮结束时的积压。橙色柱对应当轮出现丢弃。空队列显示为基线。'), panels, stats],
      '到第 ' + step + ' 轮，固定发送链路利用率 ' + Math.round(traces[0].totalDelivered / (service * step) * 100) +
      '%，简化 AIMD 为 ' + Math.round(traces[1].totalDelivered / (service * step) * 100) + '%。');
  },
  'ai-data-boundary'() {
    const result = dataPaths(checked('minimize'), checked('scrub'), number('age'), number('ttl'));
    const panels = node('div', undefined, 'lesson-grid three');
    for (const [key, title] of [['context','模型上下文'],['answer','用户回复'],['logs','诊断日志']]) {
      const items = result[key];
      const privateCount = items.filter(item => item.private).length;
      const list = items.length ? chips(items.map(item => item.name + (item.private ? ' · 私有' : ''))) : node('p', '记录已到期');
      panels.append(card(title, list, '私有字段 ' + privateCount + ' 项。'));
    }
    const diagnostic = result.logs.filter(item => ['请求编号', '处理结果', '耗时'].includes(item.name)).length;
    display([panels], '用户回复没有私有字段。诊断日志当前有 ' + diagnostic + ' / 3 个排查所需字段。');
  },
  'ai-judge-bias'() {
    const {rows, changes, coverage, correct} = judge(number('bias'), checked('consensus'));
    const verdicts = table('按答案身份对照评审', ['案例', '人工基准', 'A 先展示', 'B 先展示', '最终处理'],
      rows.map(row => [row.index, row.reference, row.firstA, row.firstB, row.automatic ?? '人工复核']),
      index => rows[index].firstA !== rows[index].firstB);
    display([verdicts], changes + ' / ' + rows.length + ' 个案例因换序改判。自动覆盖 ' +
      coverage + ' / ' + rows.length + '，其中 ' + correct + ' 个符合人工基准。');
  },
  'ai-alignment'() {
    const {rows, selected} = align(number('quick'), checked('floor'));
    display([table('偏好与证据对照', ['回答策略', '速查组', '复核组', '混合偏好分', '证据通过率', '可选'],
      rows.map(row => [row.name, row.quick, row.review, row.score.toFixed(1), row.evidence + '%', row.eligible ? '是' : '否']),
      index => rows[index] === selected)],
      '推荐「' + selected.name + '」，偏好分 ' + selected.score.toFixed(1) + '，证据通过率 ' + selected.evidence + '%。');
  }
};

function render() {
  renders[lab]();
  for (const output of document.querySelectorAll('output[data-unit]')) {
    output.value = value(output.htmlFor[0]) + output.dataset.unit;
  }
}
for (const input of document.querySelectorAll('.lab-controls input, .lab-controls select')) {
  input.addEventListener('input', () => {
    if (lab === 'reliable-transfer' && input.id !== 'step') get('step').value = 1;
    render();
  });
}
if (lab === 'reliable-transfer') {
  get('advance').addEventListener('click', () => { get('step').stepUp(); render(); });
  get('restart').addEventListener('click', () => { get('step').value = 1; render(); });
}
render();
get('experiment').hidden = false;

