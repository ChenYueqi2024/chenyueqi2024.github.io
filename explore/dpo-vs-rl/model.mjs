import { random } from '../lab-utils.mjs';

const sigmoid = margin => 1 / (1 + Math.exp(-margin));
const logOdds = p => Math.log(p / (1 - p));
const batch = 12;
const rate = 0.4;

export function dpoLoss(theta, referenceLogit, beta, preference) {
  const margin = beta * (theta - referenceLogit);
  const prediction = sigmoid(margin);
  const loss = Math.max(0, margin) + Math.log1p(Math.exp(-Math.abs(margin))) - preference * margin;
  return { loss, prediction, gradient: beta * (prediction - preference) };
}

export function rewardObjective(theta, reference, beta, gap) {
  const p = sigmoid(theta);
  const expected = (p - 0.5) * gap;
  const kl = p * Math.log(p / reference) + (1 - p) * Math.log((1 - p) / (1 - reference));
  return expected - beta * kl;
}

export function compare({reference, preference, beta, independentGap, matched, rounds, seed}) {
  const start = logOdds(reference);
  const impliedGap = logOdds(preference);
  const rewardGap = matched ? impliedGap : independentGap;
  const rng = random(seed);
  const dpo = [{p:reference}], rl = [{p:reference}];
  let dpoLogit = start, rlLogit = start;
  for (let step = 1; step <= rounds; step++) {
    const update = dpoLoss(dpoLogit, start, beta, preference);
    dpoLogit -= rate * update.gradient;
    dpo.push({p:sigmoid(dpoLogit), ...update});

    const last = sigmoid(rlLogit);
    let drawsA = 0, rewardSum = 0, rewardGradient = 0;
    for (let draw = 0; draw < batch; draw++) {
      const a = Number(rng() < last);
      const reward = (a - 0.5) * rewardGap;
      drawsA += a;
      rewardSum += reward;
      rewardGradient += reward * (a - last);
    }
    const penalty = beta * last * (1 - last) * (rlLogit - start);
    const gradient = rewardGradient / batch - penalty;
    rlLogit += rate * gradient;
    rl.push({p:sigmoid(rlLogit), drawsA, batch, reward:rewardSum / batch, gradient});
  }
  return { dpo, rl, rewardGap,
    dpoTarget:sigmoid(start + impliedGap / beta), rlTarget:sigmoid(start + rewardGap / beta) };
}
