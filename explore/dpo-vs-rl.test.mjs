import test from 'node:test';
import assert from 'node:assert/strict';
import { compare, dpoLoss, rewardObjective } from './dpo-vs-rl/model.mjs';

const standard = {reference:0.5, preference:0.8, beta:0.7, independentGap:-1.4, rounds:60, seed:42};
const logit = p => Math.log(p / (1-p));

test('DPO uses the derivative of the fixed preference cross-entropy', () => {
  const beta = 0.7, ref = -0.2, delta = 1e-5;
  const actual = dpoLoss(0.6, ref, beta, 0.8);
  const numerical = (dpoLoss(0.6+delta, ref, beta, 0.8).loss -
    dpoLoss(0.6-delta, ref, beta, 0.8).loss) / (2*delta);
  assert.ok(Math.abs(actual.gradient-numerical) < 1e-9);
});

test('matched preference probabilities and rewards have the same optimum', () => {
  const run = compare({...standard, reference:0.35, matched:true});
  assert.equal(run.dpoTarget, run.rlTarget);
  const theta = logit(run.rlTarget);
  const quality = trial => rewardObjective(trial, 0.35, standard.beta, run.rewardGap);
  assert.ok(quality(theta) > quality(theta-0.2) && quality(theta) > quality(theta+0.2));
  assert.ok(Math.abs(dpoLoss(theta,logit(0.35),0.7,0.8).gradient) < 1e-12);
  assert.equal(run.dpo[0].p,0.35);
  assert.equal(run.rl[0].p,0.35);
});

test('conflicting feedback reverses the RL update without changing fixed-data DPO', () => {
  const conflict = compare({...standard, matched:false});
  const alternative = compare({...standard, matched:true, seed:127});
  assert.deepEqual(conflict.dpo, alternative.dpo);
  assert.ok(conflict.dpo.at(-1).p > 0.5);
  assert.ok(conflict.rl.at(-1).p < 0.5);
  assert.notDeepEqual(conflict.rl, compare({...standard, matched:false,seed:127}).rl);
  assert.deepEqual(conflict.rl, compare({...standard, matched:false}).rl);
});
