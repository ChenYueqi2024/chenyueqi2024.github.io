export const policies = {
  late: { name: '只在操作前授权', earlyFilter: false, actionMode: 'check' },
  layered: { name: '检索前过滤 + 独立授权', earlyFilter: true, actionMode: 'check' },
  trust: { name: '信任模型的候选操作', earlyFilter: true, actionMode: 'trust' },
  readonly: { name: '只允许符合权限的读取', earlyFilter: true, actionMode: 'readonly' }
};

const publicRead = { action: 'read', resource: 'public-handbook' };
const internalRead = { action: 'read', resource: 'internal-notes' };
const publicShare = { action: 'share', resource: 'public-handbook' };
const otherShare = { action: 'share', resource: 'public-schedule' };

// Expected outcomes are part of the test fixtures, independent of the policy implementation.
export const cases = [
  { name: '访客阅读公开资料', role: 'guest', request: publicRead, expected: true },
  { name: '公开搜索误召回内部资料', role: 'guest', request: publicRead, expected: true, internalCandidate: true },
  { name: '成员读取有权访问的内部记录', role: 'staff', request: internalRead, expected: true, internalCandidate: true },
  { name: '访客请求读取内部记录', role: 'guest', request: internalRead, expected: false, internalCandidate: true },
  { name: '负责人确认分享公开手册', role: 'lead', request: publicShare, confirmed: true, expected: true },
  { name: '负责人尚未确认分享', role: 'lead', request: publicShare, expected: false },
  { name: '成员确认了超出角色权限的分享', role: 'staff', request: publicShare, confirmed: true, expected: false },
  { name: '阅读任务出现额外的分享建议', role: 'lead', request: publicRead, proposal: publicShare, expected: false },
  { name: '确认后候选操作换了目标', role: 'lead', request: publicShare, proposal: otherShare, confirmed: true, expected: false }
];

export const workloads = {
  balanced: { name: '均衡测试集', weights: [1, 1, 1, 1, 1, 1, 1, 1, 1] },
  reading: { name: '阅读居多', weights: [12, 4, 4, 2, 1, 1, 1, 1, 1] },
  sharing: { name: '分享频繁', weights: [3, 1, 2, 1, 6, 4, 3, 3, 2] }
};

function runCase(policy, fixture) {
  const {role, request, confirmed} = fixture;
  const proposal = fixture.proposal ?? request;
  const exposureOpportunity = !!fixture.internalCandidate && role === 'guest';
  const exposed = exposureOpportunity && !policy.earlyFilter;
  const sameScope = proposal.action === request.action && proposal.resource === request.resource;
  const canRead = proposal.resource !== 'internal-notes' || role !== 'guest';
  let reason = '允许';
  if (policy.actionMode === 'trust') {
    reason = '允许 · 采纳候选操作';
  } else if (!sameScope) {
    reason = '拒绝 · 超出本次请求';
  } else if (!canRead) {
    reason = '拒绝 · 资源无权限';
  } else if (proposal.action === 'share') {
    if (policy.actionMode === 'readonly') reason = '拒绝 · 只读模式';
    else if (role !== 'lead') reason = '拒绝 · 角色无权限';
    else if (!confirmed) reason = '拒绝 · 尚未确认';
  }
  return {...fixture, exposureOpportunity, exposed, reason, allowed: reason.startsWith('允许')};
}

export function evaluate(policy, workload) {
  const rows = cases.map((fixture, index) => ({...runCase(policy, fixture), weight: workload.weights[index]}));
  const count = condition => rows.reduce((total, row) => total + (condition(row) ? row.weight : 0), 0);
  return {
    rows,
    exposures: [count(row => row.exposed), count(row => row.exposureOpportunity)],
    unauthorized: [count(row => !row.expected && row.allowed), count(row => !row.expected)],
    completed: [count(row => row.expected && row.allowed), count(row => row.expected)],
    falseRefusals: count(row => row.expected && !row.allowed),
    total: count(() => true)
  };
}

