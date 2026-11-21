import test from 'node:test';
import assert from 'node:assert/strict';
import {objects,views,silhouette,carve} from './hull/model.mjs';
import {protocols,classify} from './leakage/model.mjs';
import {entries,answer} from './table-rag/model.mjs';
import {methods,makeData,start,measure,step} from './active-learning/model.mjs';
import {patches,standardized,pca,tsne,nearest} from './embeddings/model.mjs';

test('silhouettes leave a blind recess unresolved even after a sweep of cameras',()=>{
  const {solid,hollow}=objects(), cameras=views(12,'even');
  for(const {projection} of cameras) {
    assert.deepEqual(silhouette(solid,projection),silhouette(hollow,projection));
  }
  const fitted=carve(hollow,cameras);
  assert.deepEqual(fitted.volume,carve(solid,cameras).volume);
  assert.equal(fitted.intersection,hollow.reduce((a,b)=>a+b,0));
  assert.ok(fitted.extra>=729);
  assert.ok(carve(hollow,cameras.slice(0,3)).extra>=fitted.extra);
});

test('leakage protocols hold sample and class budgets steady and external scenes are unseen',()=>{
  for(const seed of [1,5,20]) {
    const {randomFrames,grouped,external}=protocols(seed);
    for(const {train,test:internal} of [randomFrames,grouped]) {
      assert.equal(train.length,96);
      assert.equal(train.filter(row=>row.label===0).length,48);
      assert.equal(internal.length,48);
      assert.equal(internal.filter(row=>row.label===0).length,24);
      assert.ok(!internal.some(frame=>train.includes(frame)));
      assert.ok(!external.some(frame=>train.some(row=>row.scene===frame.scene)));
    }
    assert.ok(!grouped.test.some(frame=>grouped.train.some(row=>row.scene===frame.scene)));
  }
  const {randomFrames,grouped}=protocols(5);
  assert.equal(classify(randomFrames.train,randomFrames.test).filter(x=>x.correct).length,48);
  assert.equal(classify(grouped.train,grouped.test).filter(x=>x.correct).length,14);
});

test('table answers track the actual template formula and require the evidence that matters',()=>{
  assert.equal(answer('growth',entries).value,25);
  assert.equal(answer('total',entries).value,1350000);
  assert.equal(answer('difference',entries).value,200000);
  const noUnit=entries.filter(item=>item.id!=='unit');
  assert.equal(answer('growth',noUnit).value,25);
  assert.deepEqual(answer('difference',noUnit),{missing:['unit']});
  assert.deepEqual(answer('growth',entries.filter(e=>!['old','header'].includes(e.id))).missing,['header','old']);
});

test('active learning uses the same initial data and never labels the same pool item twice',()=>{
  const data=makeData(81,true), states=start(data,81);
  methods.forEach(method=>measure(states[method],data.test));
  for(let i=0;i<4;i++)step(states,data.test);
  for(const method of methods) {
    const state=states[method];
    assert.equal(state.labels.length,26);
    assert.equal(new Set(state.labels.map(x=>x.id)).size,26);
    assert.equal(state.accuracy.length,5);
    assert.ok(state.labels.every(x=>!data.test.includes(x)));
  }
  assert.ok(states.uncertainty.labels.filter(x=>x.noisy).length>
    states.coverage.labels.filter(x=>x.noisy).length);
});

test('projections keep sample identities and nearest-neighbor lists exclude the query itself',()=>{
  const rows=standardized(patches(712).map(x=>x.vector));
  for(const projected of [pca(rows),tsne(rows,12,71)]) {
    assert.equal(projected.length,60);
    assert.ok(projected.every(p=>p.length===2 && p.every(Number.isFinite)));
    const neighbors=nearest(projected,0,6);
    assert.equal(neighbors.length,6);
    assert.ok(!neighbors.includes(0));
    assert.notDeepEqual(neighbors,nearest(rows,0,6));
  }
});
