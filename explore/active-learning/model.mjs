import {random,shuffled,sqdist} from '../lab-utils.mjs';
export const methods=['random','uncertainty','coverage'];
export const batchSize=5;
export function makeData(seed, noisier) {
  const rng=random(seed);
  const clean=(n,start)=>Array.from({length:n},(_,i)=>{
    const label=i%2;
    const x = (label ? .54 : -.54) + 1.02*(rng()-.5);
    const y= 2*rng()-1;
    return {id:start+i,point:[x,y],label,noisy:false};
  });
  const all=clean(126,0), test=clean(240,200);
  if(noisier){
    for(let i=0;i<36;i++) {
      all.push({id:126+i,point:[.08*(rng()-.5),.48+.12*(rng()-.5)],
        label:Number(rng()>.5),noisy:true});
    }
  }
  const initial=[all[0],all[1],all[34],all[35],all[72],all[73]];
  return {initial,pool:all.filter(x=>!initial.includes(x)),test};
}

const sigmoid = z => 1/(1+Math.exp(-z));
export const confidence = (w,[x,y]) => sigmoid(w[0]*x+w[1]*y+w[2]);
export function fit(rows) {
  const w=[0,0,0];
  for(let i=0;i<190;i++){
    const g=[.022*w[0],.022*w[1],0];
    for(const {point:[x,y],label} of rows){
      const error=(confidence(w,[x,y])-label)/rows.length;
      g[0]+=error*x;g[1]+=error*y;g[2]+=error;
    }
    for(let j=0;j<3;j++) w[j]-=.28*g[j];
  }
  return w;
}
export function choose(method, labels, pool, weights, rng) {
  if(method==='random') return shuffled(pool,rng).slice(0,batchSize);
  if(method==='uncertainty') return [...pool].sort(
    (a,b)=>Math.abs(confidence(weights,a.point)-.5)-Math.abs(confidence(weights,b.point)-.5)).slice(0,batchSize);
  const chosen=[];
  for(let i=0;i<batchSize;i++){
    const known=[...labels,...chosen];
    let best, max=-1;
    for(const item of pool){
      if(chosen.includes(item)) continue;
      const nearest=Math.min(...known.map(other=>sqdist(item.point,other.point)));
      if(nearest>max){max=nearest;best=item;}
    }
    chosen.push(best);
  }
  return chosen;
}
export function start(data,seed) {
  return Object.fromEntries(methods.map(method=>[method,{
    labels:[...data.initial],pool:[...data.pool],seed:seed+713,accuracy:[],latest:[]
  }]));
}
export function measure(state,test) {
  state.weights=fit(state.labels);
  state.accuracy.push(test.filter(r=>Number(confidence(state.weights,r.point)>=.5)===r.label).length/test.length);
}
export function step(states,test) {
  for(const method of methods){
    const state=states[method];
    state.latest=choose(method,state.labels,state.pool,state.weights,random(state.seed+state.labels.length));
    state.labels.push(...state.latest);
    state.pool=state.pool.filter(item=>!state.latest.includes(item));
    measure(state,test);
  }
}
