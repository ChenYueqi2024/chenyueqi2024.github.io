import test from 'node:test';
import assert from 'node:assert/strict';
import { ethernet, forward, transfer, congestion, dataPaths, judge, align } from './systems-labs/model.mjs';

test('the switch learns sources while keeping unknown unicast in the ingress VLAN', () => {
  const events = ethernet(true);
  assert.deepEqual(events[0].egress.map(port => port.host), ['B','E']);
  assert.deepEqual(events[2].egress.map(port => port.host), ['B']);
  assert.ok(events[2].known);
  assert.ok(!events[5].accepted);
  assert.ok(ethernet(false)[5].accepted);
  assert.ok(!ethernet(true, true)[1].known);
});

test('longest IPv4 prefix takes priority and the default can be withdrawn', () => {
  assert.equal(forward('192.0.2.141',true,true).selected.length,28);
  assert.equal(forward('192.0.2.141',false,true).selected.length,26);
  assert.equal(forward('192.0.2.144',true,true).selected.length,26);
  assert.equal(forward('203.0.113.9',true,true).selected.length,0);
  assert.equal(forward('203.0.113.9',true,false).selected,null);
});

test('the cumulative ACK stalls on loss and jumps once the missing segment is recovered', () => {
  const retained = transfer(2,true);
  const discarded = transfer(2,false);
  assert.deepEqual(retained.slice(0,5).map(row => row.ack),[2,2,2,2,2]);
  assert.deepEqual(retained[4].buffered,[3,4,5]);
  assert.equal(retained.at(-1).ack,6);
  assert.equal(retained.at(-1).retrans,1);
  assert.equal(discarded.at(-1).retrans,4);
  assert.equal(transfer(0,true).at(-1).retrans,0);
});

test('the queue conserves segments and AIMD reduces offered load after a drop', () => {
  const trace = congestion(8, 10, 18, true);
  const offered = trace.history.reduce((sum, row) => sum + row.offered, 0);
  assert.equal(offered, trace.totalDelivered + trace.totalDropped + trace.history.at(-1).pending);
  assert.ok(trace.history.every(row => row.pending <= 10 && row.delivered <= 8));
  const dropIndex = trace.history.findIndex(row => row.dropped);
  assert.ok(trace.history[dropIndex+1].offered < trace.history[dropIndex].offered);
});

test('the log controls protect different destinations and expiration removes diagnostics', () => {
  const untreated = dataPaths(false,false,3,7);
  assert.ok(untreated.logs.some(field => field.private));
  assert.ok(!untreated.answer.some(field => field.private));
  const scrubbed = dataPaths(true,true,3,7);
  assert.equal(scrubbed.context.filter(field => field.private).length,1);
  assert.equal(scrubbed.logs.length,3);
  assert.deepEqual(dataPaths(true,true,7,7).logs,[]);
});

test('swapped ordering reveals positional instability while agreement trades coverage for accuracy', () => {
  assert.deepEqual([judge(0,true).changes,judge(0,true).correct],[0,8]);
  const filtered = judge(25,true);
  const firstOnly = judge(25,false);
  assert.equal(filtered.coverage + filtered.changes,8);
  assert.equal(firstOnly.coverage,8);
  assert.ok(filtered.correct / filtered.coverage > firstOnly.correct / firstOnly.coverage);
});

test('population mixing can favor guessing until an independent evidence condition is applied', () => {
  assert.equal(align(50,false).selected.name,'简明有据');
  assert.equal(align(90,false).selected.name,'快速猜测');
  assert.equal(align(90,true).selected.name,'简明有据');
});
