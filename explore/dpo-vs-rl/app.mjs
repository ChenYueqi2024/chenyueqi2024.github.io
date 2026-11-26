import { byId as get, canvasChart } from '../lab-utils.mjs';
import { compare } from './model.mjs';

const maximum = 60;
const num = id => Number(get(id).value);
const fmt = value => value.toFixed(3);
const pct = value => (value * 100).toFixed(1) + '%';

function draw(trajectories, cursor) {
  const width = 760, height = 300;
  const ctx = canvasChart('trajectory', width, height);
  const x = step => 58 + step / maximum * 674;
  const y = p => 249 - p * 216;
  ctx.fillStyle = '#344751';
  ctx.fillText('选择 A 的概率', 58, 21);
  for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
    ctx.strokeStyle = '#c9d8d2';
    ctx.beginPath();
    ctx.moveTo(x(0), y(fraction));
    ctx.lineTo(x(maximum), y(fraction));
    ctx.stroke();
    ctx.fillText(Math.round(fraction * 100) + '%', 10, y(fraction) + 5);
  }
  for (const step of [0, 15, 30, 45, 60]) ctx.fillText(step, x(step) - 8, 272);
  ctx.fillText('更新步数', width / 2 - 30, 292);
  const traces = [
    { points:trajectories.dpo, target:trajectories.dpoTarget, color:'#16776a' },
    { points:trajectories.rl, target:trajectories.rlTarget, color:'#a44e2a' }
  ];
  for (const {points, target, color} of traces) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(x(0), y(target));
    ctx.lineTo(x(maximum), y(target));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x(0), y(points[0].p));
    for (let i = 1; i <= cursor; i++) ctx.lineTo(x(i), y(points[i].p));
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x(cursor), y(points[cursor].p), 4.5, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function render() {
  const cursor = num('step');
  const reference = num('reference') / 100;
  const votes = num('votes');
  const matched = get('matched').checked;
  const traces = compare({reference, preference:votes / 20, beta:num('beta'), independentGap:num('gap'),
    matched, rounds:cursor, seed:num('seed')});
  get('gap').disabled = matched;
  get('gap-value').value = fmt(traces.rewardGap);
  get('one').disabled = get('ten').disabled = cursor === maximum;
  get('reset').disabled = cursor === 0;
  for (const output of document.querySelectorAll('[data-unit]')) {
    output.value = get(output.htmlFor[0]).value + output.dataset.unit;
  }
  draw(traces, cursor);
  const dpo = traces.dpo.at(-1);
  const rl = traces.rl.at(-1);
  get('dpo-readout').textContent = '当前选择 A ' + pct(dpo.p) + ' · 理论最优 ' + pct(traces.dpoTarget);
  get('rl-readout').textContent = '当前选择 A ' + pct(rl.p) + ' · 理论最优 ' + pct(traces.rlTarget);
  get('dpo-update').textContent = cursor ? '上一步用固定标签 ' + votes + ' 对 ' + (20-votes) +
    '。更新前偏好预测 ' + pct(dpo.prediction) + '，损失 ' + fmt(dpo.loss) + '，梯度 ' + fmt(dpo.gradient) + '。' : '等待第一次更新。';
  get('rl-update').textContent = cursor ? '上一步采样 A 共 ' + rl.drawsA + ' / ' + rl.batch +
    ' 次，批均奖励 ' + fmt(rl.reward) + '，扣除 KL 后的梯度 ' + fmt(rl.gradient) + '。' : '等待第一次采样。';
  get('status').textContent = '第 ' + cursor + ' 步 · ' + (matched ?
    '两边的反馈按同一偏好模型匹配，因此理论最优相同。' :
    '偏好标签和在线奖励独立设置，可分别改变两个目标。');
}

for (const input of document.querySelectorAll('#experiment input, #experiment select')) input.addEventListener('input', render);
for (const [button, advance] of [['one', 1], ['ten', 10], ['reset', 0]]) {
  get(button).addEventListener('click', () => {
    get('step').value = advance ? Math.min(maximum, num('step') + advance) : 0;
    render();
  });
}
render();
get('experiment').hidden = false;
