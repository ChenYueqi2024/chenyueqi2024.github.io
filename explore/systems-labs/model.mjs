const hostPorts = {
  A:['1',10], B:['2',10], E:['3',10], C:['4',20], D:['5',20]
};
const frames = [['A','B'], ['B','A'], ['A','B'], ['C','D'], ['D','C'], ['A','C']];
export function ethernet(segmented, swap = false) {
  const members = Object.entries(hostPorts).map(([host, [port, vlan]]) => ({host, port, vlan:segmented ? vlan : 1}));
  const learned = new Map();
  const order = swap ? [frames[0], frames[2], frames[1], ...frames.slice(3)] : frames;
  return order.map(([source, destination]) => {
    const ingress = members.find(item => item.host === source);
    const destinationEntry = learned.get(ingress.vlan + ':' + destination);
    learned.set(ingress.vlan + ':' + source, ingress);
    const egress = destinationEntry ? [destinationEntry] : members.filter(item => item.vlan === ingress.vlan && item.port !== ingress.port);
    return {source, destination, ingress, egress, known:!!destinationEntry,
      accepted:egress.some(item => item.host === destination), learned:[...learned.values()], members};
  });
}

const routes = [
  ['0.0.0.0', 0, '出口网关', 'fallback'],
  ['192.0.2.0', 24, '校园汇总'],
  ['192.0.2.128', 26, '园区交换区'],
  ['192.0.2.128', 28, '实验室网关', 'specific'],
  ['198.51.100.0', 24, '校外服务网关']
];
const ip = value => value.split('.').reduce((result, octet) => result * 256 + Number(octet), 0);
export const bits = value => ip(value).toString(2).padStart(32, '0');

export function forward(destination, specific, fallback) {
  const destinationBits = bits(destination);
  const rows = routes.filter(([, , , option]) => option === 'specific' ? specific : option === 'fallback' ? fallback : true)
    .map(([prefix, length, next]) => ({prefix, length, next, match: destinationBits.startsWith(bits(prefix).slice(0, length))}));
  const selected = rows.filter(row => row.match).sort((a,b) => b.length - a.length)[0] ?? null;
  return {rows, selected, destinationBits};
}

export function transfer(missing, buffering) {
  const events = [];
  let ack = 1;
  let retrans = 0;
  const buffer = new Set();
  function receive(segment, kind) {
    let result = '按序交付';
    if (kind === '丢失') result = '未到达';
    else if (segment === ack) {
      ack++;
      while (buffer.delete(ack)) ack++;
    } else if (buffering) {
      buffer.add(segment);
      result = '乱序暂存';
    } else result = '乱序丢弃';
    if (kind === '重传') retrans++;
    events.push({ segment, kind, result, ack, buffered: [...buffer], retrans });
  }
  for (let segment = 1; segment <= 5; segment++) {
    receive(segment, segment === missing ? '丢失' : '首次发送');
  }
  while (ack <= 5) receive(ack, '重传');
  return events;
}

export function congestion(service, queueCapacity, rounds, feedback) {
  let pending = 0, offered = 12;
  let totalDelivered = 0, totalDropped = 0, totalPending = 0;
  const history = [];
  for (let round = 1; round <= rounds; round++) {
    const demand = pending + offered;
    const delivered = Math.min(service, demand);
    const remaining = demand - delivered;
    pending = Math.min(queueCapacity, remaining);
    const dropped = remaining - pending;
    history.push({round, offered, delivered, pending, dropped});
    if (feedback) offered = dropped ? Math.max(1, Math.floor(offered / 2)) : offered + 1;
    totalDelivered += delivered;
    totalDropped += dropped;
    totalPending += pending;
  }
  return {history, totalDelivered, totalDropped, meanQueue: totalPending / rounds};
}

const parcelFields = [
  {name:'运单引用', private:true, needed:true},
  {name:'姓名', private:true, needed:false},
  {name:'联系方式', private:true, needed:false}
];
const diagnostic = ['请求编号', '处理结果', '耗时'].map(name => ({name, private:false}));
export function dataPaths(minimize, scrub, age, ttl) {
  const context = [...parcelFields.filter(field => !minimize || field.needed), {name:'配送状态', private:false}];
  const answer = [{name:'配送状态', private:false}];
  const logs = age >= ttl ? [] : scrub ? diagnostic : [...diagnostic, ...context];
  return {context, answer, logs};
}

const qualityGaps = [45, 25, -18, 12, -40, 0, 9, -26];
const verdict = delta => delta > 0 ? 'A' : delta < 0 ? 'B' : '平手';
export function judge(bias, consensus) {
  const rows = qualityGaps.map((gap, index) => {
    const firstA = verdict(gap + bias);
    const firstB = verdict(gap - bias);
    return {index:index + 1, reference:verdict(gap), firstA, firstB,
      automatic: consensus && firstA !== firstB ? null : firstA};
  });
  const covered = rows.filter(row => row.automatic !== null);
  return {rows, changes: rows.filter(row => row.firstA !== row.firstB).length,
    coverage: covered.length, correct: covered.filter(row => row.automatic === row.reference).length};
}

const responses = [
  {name:'简明有据', quick:78, review:69, evidence:96},
  {name:'详细有据', quick:45, review:95, evidence:99},
  {name:'快速猜测', quick:98, review:25, evidence:37}
];
export function align(quick, floor) {
  const rows = responses.map(row => ({...row, score: (row.quick * quick + row.review * (100 - quick)) / 100,
    eligible: !floor || row.evidence >= 90}));
  return {rows, selected: rows.filter(row => row.eligible).sort((a,b) => b.score - a.score)[0]};
}
