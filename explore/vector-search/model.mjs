import {random,sqdist} from '../lab-utils.mjs';
export const tasks={
  loan:{point:[2.8,2.2],name:'现行设备借期',evidence:'借期定稿：现行便携仪器可借 7 天。'},
  training:{point:[-2.4,2.4],name:'实操考试用时',evidence:'实操考核手册：对准实操限 45 分钟。'},
  budget:{point:[2.6,-1.9],name:'设备实付金额',evidence:'经费定稿：2025 年设备实付 100 万元。'}
};
const clusters=[[-2.4,2.4],[-2.3,-2.5],[2.8,2.2],[2.6,-1.9],[0,.4],[.2,-3.2]];
const names=['培训材料','馆藏公告','借用资料','经费资料','活动回顾','申请指南'];
const vector=([x,y])=>[x,y,.31*x*y,.24*x*x,.23*y*y,Math.sin(x),Math.cos(y),.55*Math.sin(x+y)];
const rank=(nodes,query)=>nodes.map(node=>({id:node.id,distance:sqdist(node.vector,query)}))
  .sort((a,b)=>a.distance-b.distance||a.id-b.id);

export function makeIndex(seed=751){
  const rng=random(seed);
  const nodes=Array.from({length:144},(_,id)=>{
    const family=id%6, c=clusters[family], p=c.map(v=>v+1.85*(rng()-.5));
    return {id,p,vector:vector(p),name:names[family]+' '+(Math.floor(id/6)+1),note:'合成资料；没有为当前查询标注事实。'};
  });
  const queries={};
  for(const [key,task] of Object.entries(tasks)){
    const decoyPoint=task.point.map((v,i)=>v+(i?.011:.025));
    const p=task.point.map((v,i)=>v+(i?.08:.12));
    nodes.push({id:nodes.length,p:decoyPoint,vector:vector(decoyPoint),name:task.name+' · 待核版本',
      note:'旧稿、草案或索引条目，不能作为这道题所需的证据。'});
    const evidence=nodes.length;
    nodes.push({id:evidence,p,vector:vector(p),name:task.name+' · 已标注证据',note:task.evidence});
    queries[key]={vector:vector(task.point),p:task.point,evidence};
  }
  const edges=nodes.map(node=>new Set(rank(nodes,node.vector).filter(r=>r.id!==node.id).slice(0,4).map(r=>r.id)));
  edges.forEach((neighbors,i)=>{for(const j of neighbors)edges[j].add(i);});
  // Neighbor links teach local exploration. A scan-order chain keeps the toy graph connected.
  const chain=[...nodes].sort((a,b)=>a.p[0]-b.p[0]||a.id-b.id);
  chain.slice(1).forEach((node,i)=>{
    const prev=chain[i].id;
    edges[node.id].add(prev);edges[prev].add(node.id);
  });
  return {nodes,edges:edges.map(neighbors=>[...neighbors]),queries};
}

export function exact(index,query,k=10){
  return rank(index.nodes,query.vector).slice(0,k);
}

export function search(index,query,start,limit,k=10){
  const evaluated=new Map(), expanded=[];
  const enqueue=id=>{
    if(!evaluated.has(id) && evaluated.size<limit)
      evaluated.set(id,{id,distance:sqdist(index.nodes[id].vector,query.vector),expanded:false});
  };
  enqueue(start);
  while(evaluated.size<limit){
    const next=[...evaluated.values()].filter(row=>!row.expanded)
      .sort((a,b)=>a.distance-b.distance||a.id-b.id)[0];
    if(!next)break;
    next.expanded=true;
    expanded.push(next.id);
    for(const id of index.edges[next.id])enqueue(id);
  }
  const best=[...evaluated.values()].sort((a,b)=>a.distance-b.distance||a.id-b.id)
    .slice(0,k).map(({id,distance})=>({id,distance}));
  return {best,evaluated:[...evaluated.keys()],expanded};
}
