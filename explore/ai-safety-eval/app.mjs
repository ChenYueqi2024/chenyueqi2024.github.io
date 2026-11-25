import { byId } from '../lab-utils.mjs';
import { evaluate, policies, workloads } from './model.mjs';

const metrics = [
  ['exposures', '上下文曝光'],
  ['unauthorized', '越权放行'],
  ['completed', '正常任务完成']
];

function fillSelect(id, choices, value) {
  const field = byId(id);
  Object.entries(choices).forEach(([key, choice]) => field.add(new Option(choice.name, key)));
  field.value = value;
  field.addEventListener('change', render);
}

function scorecard(label, policy, result) {
  const card = document.createElement('article');
  card.className = 'lesson-card';
  const heading = document.createElement('h3');
  heading.textContent = label + ' · ' + policy.name;
  const list = document.createElement('dl');
  for (const [id, name] of metrics) {
    const pair = document.createElement('div');
    const title = document.createElement('dt');
    const value = document.createElement('dd');
    const [numerator, denominator] = result[id];
    title.textContent = name;
    value.textContent = numerator + ' / ' + denominator + '（' + (100 * numerator / denominator).toFixed(1) + '%）';
    pair.append(title, value);
    list.append(pair);
  }
  card.append(heading, list);
  return card;
}

function describe(row) {
  return row.reason + (row.exposed ? '；内部资料进入上下文' : row.exposureOpportunity ? '；拦下内部候选' : '');
}

function render() {
  const a = policies[byId('policy-a').value];
  const b = policies[byId('policy-b').value];
  const workload = workloads[byId('workload').value];
  const left = evaluate(a, workload);
  const right = evaluate(b, workload);
  byId('scorecards').replaceChildren(scorecard('策略 A', a, left), scorecard('策略 B', b, right));
  byId('summary').textContent = workload.name + ' · 共 ' + left.total + ' 次请求。策略 A 误拒 ' +
    left.falseRefusals + ' 次，策略 B 误拒 ' + right.falseRefusals + ' 次。';

  const rows = left.rows.map((item, index) => {
    const row = document.createElement('tr');
    const title = document.createElement('th');
    title.scope = 'row';
    title.textContent = item.name;
    row.append(title);
    for (const value of [item.weight, item.expected ? '允许' : '拒绝候选', describe(item), describe(right.rows[index])]) {
      row.insertCell().textContent = value;
    }
    return row;
  });
  byId('cases').replaceChildren(...rows);
}

fillSelect('policy-a', policies, 'late');
fillSelect('policy-b', policies, 'layered');
fillSelect('workload', workloads, 'balanced');
render();
byId('experiment').hidden = false;

