import {random,shuffled} from '../lab-utils.mjs';
const effects=[7,-5,6,-6,6,-3,5,-4];
const framesPerScene=40;

export function scenes(count,repeats,seed){
  const rng=random(seed);
  return Array.from({length:count},(_,i)=>{
    const baseCount=24+i%4, change=effects[i%effects.length];
    const base=shuffled(Array.from({length:framesPerScene},(_,j)=>j),rng);
    const a=new Set(base.slice(0,baseCount));
    const b=new Set(base.slice(0,baseCount+change));
    return base.flatMap(frame=>Array.from({length:repeats},()=>({
      a:Number(a.has(frame)),b:Number(b.has(frame)),delta:Number(b.has(frame))-Number(a.has(frame))
    })));
  });
}
const mean=values=>values.reduce((sum,value)=>sum+value,0)/values.length;

export function bootstrap(groups,seed,trials=800){
  const rng=random(seed), clipRandom=random(seed+1);
  const frames=groups.flat(), count=frames.length;
  const negative=frames.filter(row=>row.delta===-1).length/count;
  const neutral=frames.filter(row=>row.delta===0).length/count;
  const clipMeans=groups.map(group=>mean(group.map(row=>row.delta)));
  const byFrame=[], byClip=[];
  for(let trial=0;trial<trials;trial++){
    let total=0;
    for(let i=0;i<count;i++){
      const x=rng(); total+=x<negative?-1:x<negative+neutral?0:1;
    }
    byFrame.push(total/count);
    let sum=0;
    for(let i=0;i<groups.length;i++) sum+=clipMeans[Math.floor(clipRandom()*groups.length)];
    byClip.push(sum/groups.length);
  }
  return {a:mean(frames.map(row=>row.a)),b:mean(frames.map(row=>row.b)),count,clipMeans,byFrame,byClip};
}

export function interval(values){
  const sorted=[...values].sort((a,b)=>a-b);
  return [.025,.975].map(p=>{
    const offset=p*(sorted.length-1), i=Math.floor(offset);
    return sorted[i]+(sorted[i+1]-sorted[i])*(offset-i);
  });
}
