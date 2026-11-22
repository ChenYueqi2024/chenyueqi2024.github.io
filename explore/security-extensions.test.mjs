import test from 'node:test';
import assert from 'node:assert/strict';
import {presets, tracePage} from './network-timing/model.mjs';
import {limit, toyCircuit} from './homomorphic/model.mjs';

test('similar page times can conceal a slow first byte or a slow download', () => {
  const server = tracePage(presets.server);
  const image = tracePage(presets.image);
  assert.ok(Math.abs(server.last.end - image.last.end) < 100);
  assert.ok(server.firstByte - image.firstByte > 1000);
  assert.equal(image.last.name, 'cover.webp');
  const [html, , , js, data] = image.rows;
  assert.equal(js.start, html.end);
  assert.ok(data.start > js.end);
  assert.equal(tracePage(presets.warm).rows[2].local, true);
});

test('QUIC groups the simulated new-connection cost and picture recovery adds its configured RTT', () => {
  const control = tracePage(presets.normal);
  const h3 = tracePage({...presets.normal, connection:'h3', lost:true});
  assert.equal(control.firstByte - h3.firstByte, presets.normal.rtt);
  assert.equal(h3.rows[2].timeline.at(-1).ms - control.rows[2].timeline.at(-1).ms, presets.normal.rtt);
});

test('the toy implements XOR and AND throughout its supported input range', () => {
  for (const gate of ['sum', 'product']) {
    for (const a of [0, 1]) {
      for (const b of [0, 1]) {
        for (let noise = 0; noise <= 6; noise++) {
          const result = toyCircuit({a, b, noise, gate, depth:1});
          assert.ok(result.steps[0].magnitude <= limit);
          assert.equal(result.bit, gate === 'sum' ? a ^ b : a & b);
        }
      }
    }
  }
});

test('twice squaring can fold the residue and flip the decoded bit', () => {
  const options = {a:1, b:0, noise:2, gate:'deep', depth:2};
  const shallow = toyCircuit({...options, depth:1});
  assert.equal(shallow.bit, 1);
  const deep = toyCircuit(options);
  assert.deepEqual(deep.steps.map(({magnitude}) => magnitude), [9n, 81n, 6561n]);
  assert.equal(deep.centered, -1358n);
  assert.equal(deep.expected, 1);
  assert.equal(deep.bit, 0);
});
