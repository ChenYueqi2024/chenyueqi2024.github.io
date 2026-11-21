import {byId,canvasChart} from '../lab-utils.mjs';
import {tasks,makeIndex,exact,search} from './model.mjs';
const index=makeIndex(), entryPoints={far:1,center:4,edge:5};
for(const [key,task] of Object.entries(tasks))byId('query').add(new Option(task.name,key));
function draw(query,result,truth){
  const c=canvasChart('vector-graph',660,430);
  const p=([x,y])=>[330+72*x,204-46*y];
  const coords=index.nodes.map(v=>p(v.p));
  const line=(a,b,color)=>{
    c.beginPath();c.strokeStyle=color;c.moveTo(...a);c.lineTo(...b);c.stroke();
  };
  for(const id of result.expanded){
    for(const next of index.edges[id])if(result.evaluated.includes(next))line(coords[id],coords[next],'#6c9b91');
  }
  const middles=new Set(result.evaluated), better=new Set(result.best.map(r=>r.id)), good=new Set(truth.map(r=>r.id));
  index.nodes.forEach((node,i)=>{
    const [x,y]=coords[i];
    c.fillStyle=better.has(i)?'#116e58':middles.has(i)?'#739b91':'#c6d7d0';
    c.beginPath();c.arc(x,y,better.has(i)?5:3.5,0,2*Math.PI);c.fill();
    if(good.has(i)){
      c.strokeStyle='#9f4f2e';c.beginPath();c.arc(x,y,7,0,2*Math.PI);c.stroke();
    }
    if(i===query.evidence){
      c.strokeStyle='#80459c';c.lineWidth=2.5;c.strokeRect(x-9,y-9,18,18);c.lineWidth=1;
    }
  });
  const [x,y]=p(query.p);
  line([x-10,y],[x+10,y],'#192c29');line([x,y-10],[x,y+10],'#192c29');
  c.fillStyle='#243d34';c.fillText('+ 查询位置 · 紫框为回答所需证据',22,405);
}
function render(){
  const query=index.queries[byId('query').value], cap=Number(byId('budget').value);
  const truth=exact(index,query), result=search(index,query,entryPoints[byId('entry').value],cap);
  const hits=result.best.filter(row=>truth.some(t=>t.id===row.id)).length;
  const found=result.best.some(row=>row.id===query.evidence);
  byId('budget-value').textContent=cap;
  byId('ann-metrics').textContent='精确近邻召回 '+hits+' / 10 · 距离计算 '+result.evaluated.length+
    ' / '+index.nodes.length+' · 展开 '+result.expanded.length+' 个节点。';
  byId('evidence-status').textContent=found?'已找回这道题的标注证据。':
    '当前结果缺少标注证据。它即使位列精确近邻，也可能没有进入近似结果。';
  byId('neighbors-table').replaceChildren(...result.best.map((row,i)=>{
    const node=index.nodes[row.id], tr=document.createElement('tr');
    tr.insertCell().textContent=i+1;
    tr.insertCell().textContent=node.name;
    tr.insertCell().textContent=truth.some(t=>t.id===row.id)?'是':'否';
    tr.insertCell().textContent=node.note;
    return tr;
  }));
  byId('exact-result').textContent=truth.map(row=>index.nodes[row.id].name).join('、');
  draw(query,result,truth);
}
for(const id of ['query','budget','entry'])byId(id).oninput=render;
byId('complete').onclick=()=>{byId('budget').value=index.nodes.length;render();};
byId('budget').max=index.nodes.length;
render();
