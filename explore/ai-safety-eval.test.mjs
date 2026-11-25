import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, policies, workloads } from './ai-safety-eval/model.mjs';

test('earlier retrieval filtering protects context while keeping the same authorization decisions', () => {
  const late = evaluate(policies.late, workloads.balanced);
  const layered = evaluate(policies.layered, workloads.balanced);
  assert.deepEqual(late.exposures, [2, 2]);
  assert.deepEqual(layered.exposures, [0, 2]);
  assert.deepEqual(layered.unauthorized, [0, 5]);
  assert.deepEqual(layered.completed, [4, 4]);
  assert.deepEqual(late.rows.map(row => row.allowed), layered.rows.map(row => row.allowed));
  assert.equal(layered.rows.at(-1).allowed, false);
});

test('blocking every share trades away authorized utility without changing context exposure', () => {
  const reading = evaluate(policies.readonly, workloads.reading);
  const sharing = evaluate(policies.readonly, workloads.sharing);
  const trusted = evaluate(policies.trust, workloads.sharing);
  assert.deepEqual(reading.completed, [20, 21]);
  assert.deepEqual(sharing.completed, [6, 12]);
  assert.deepEqual(sharing.exposures, [0, 2]);
  assert.equal(sharing.falseRefusals, 6);
  assert.deepEqual(trusted.unauthorized, [13, 13]);
});
