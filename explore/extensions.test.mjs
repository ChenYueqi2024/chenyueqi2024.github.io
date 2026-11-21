import test from 'node:test';
import assert from 'node:assert/strict';
import {samples,forward,reverse,summarize,score} from './diffusion/model.mjs';
import {scenes,bootstrap,interval} from './paired-evaluation/model.mjs';
import {route,integrate,optimize,rmse} from './pose-graph/model.mjs';
import {makeIndex,exact,search} from './vector-search/model.mjs';

test('diffusion starts at clean points and guidance changes scores and reachable modes',()=>{
  const data=samples(43);
  assert.deepEqual(forward(data,0),data.clean);
  assert.deepEqual(score([0,0],.7),[0,0]);
  const noGuide=summarize(reverse(data.start,32,'left',0).at(-1),'left');
  const guide=summarize(reverse(data.start,32,'left',1).at(-1),'left');
  assert.equal(noGuide.hits,89);
  assert.equal(guide.hits,196);
  assert.ok(guide.effectiveModes<noGuide.effectiveModes);
  assert.ok([noGuide,guide].every(r=>r.counts.reduce((a,b)=>a+b,0)+r.missed===data.start.length));
});

test('repeating records leaves paired mean and cluster interval fixed',()=>{
  const one=bootstrap(scenes(8,1,21),322), repeated=bootstrap(scenes(8,8,21),322);
  const width=value=>value[1]-value[0];
  assert.equal(repeated.count,one.count*8);
  assert.equal(repeated.b-repeated.a,one.b-one.a);
  assert.deepEqual(interval(repeated.byClip),interval(one.byClip));
  assert.ok(width(interval(repeated.byFrame))<width(interval(one.byFrame)));
});

test('loop correction respects the anchor, zero weight, and known endpoint',()=>{
  const data=route(64), raw=integrate(data.measurements);
  const good=optimize(data.measurements,{i:0,j:28,weight:15});
  const bad=optimize(data.measurements,{i:0,j:14,weight:15});
  const zero=optimize(data.measurements,{i:0,j:28,weight:0});
  assert.deepEqual(good[0],[0,0]);
  assert.ok(rmse(zero,raw)<1e-12);
  assert.ok(rmse(good,data.truth)<rmse(raw,data.truth));
  assert.ok(rmse(bad,data.truth)>rmse(raw,data.truth));
});

test('budgeted graph search has unique evaluations and full budget matches exact ranking',()=>{
  const index=makeIndex(), size=index.nodes.length;
  for(const query of Object.values(index.queries)){
    const expected=exact(index,query);
    const low=search(index,query,1,8), all=search(index,query,1,size);
    assert.equal(low.evaluated.length,8);
    assert.equal(new Set(all.evaluated).size,size);
    assert.deepEqual(all.best,expected);
    assert.ok(!low.best.some(row=>row.id===query.evidence));
    assert.ok(expected.some(row=>row.id===query.evidence));
  }
});
