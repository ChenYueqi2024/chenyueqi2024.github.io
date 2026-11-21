import {byId,canvasChart,ratio} from '../lab-utils.mjs';
import {methods,makeData,start,measure,step} from './model.mjs';
const names={random:'随机',uncertainty:'最犹豫',coverage:'最远优先'};
const colors={random:'#385cb3',uncertainty:'#a65a28',coverage:'#0e7763'};
let round, states, dataset;
const symbols=['#3059b0','#b4532b'];
function pool() {
  const selected=byId('strategy').value, state=states[selected];
  const c=canvasChart('pool',560,330);
  const p=([x,y])=>[280+x*249,165-y*143];
  const dot=(item,tint,r)=>{
    const [x,y]=p(item.point);
    c.beginPath();c.fillStyle=tint;c.arc(x,y,r,0,2*Math.PI);c.fill();
  };
  const [w0,w1,b]=state.weights;
  if(Math.abs(w0)>.001){
    const [x1,y1]=p([(-b-w1)/w0,1]),[x2,y2]=p([(-b+w1)/w0,-1]);
    c.strokeStyle='#546761';c.setLineDash([5,4]);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.setLineDash([]);
  }
  state.pool.forEach(item=>dot(item,item.noisy?'#bf9d95':'#8ca9a2',3.2));
  state.labels.forEach(item=>dot(item,symbols[item.label],5));
  state.latest.forEach(item=>{
    const [x,y]=p(item.point);c.strokeStyle='#152e29';c.beginPath();c.arc(x,y,8,0,Math.PI*2);c.stroke();
  });
  byId('pool-note').textContent=names[selected]+'选样 · 最后一批是黑圈。累计选中 '+state.labels.filter(x=>x.noisy).length+' 个模糊样本。';
}
function chart(){
  const c=canvasChart('learning',560,330);
  const pos=(x,y)=>[52+x*121,274-y*230];
  for(const value of [0,.25,.5,.75,1]){
    const [x,y]=pos(0,value);
    c.strokeStyle='#c9d8d2';c.beginPath();c.moveTo(x,y);c.lineTo(pos(4,value)[0],y);c.stroke();
    c.fillStyle='#293c37';c.fillText(Math.round(value*100)+'%',6,y+4);
  }
  for(let i=0;i<=4;i++) c.fillText(String(i*5),pos(i,0)[0]-4,298);
  c.fillText('新增标签数',242,321);
  for(const method of methods){
    c.strokeStyle=colors[method];c.fillStyle=colors[method];c.lineWidth=2;c.beginPath();
    states[method].accuracy.forEach((v,i)=>{
      const [x,y]=pos(i,v);if(i)c.lineTo(x,y);else c.moveTo(x,y);
    });c.stroke();
    states[method].accuracy.forEach((v,i)=>{const [x,y]=pos(i,v);c.beginPath();c.arc(x,y,4,0,2*Math.PI);c.fill();});
  }
}
function render(){
  byId('labels-used').textContent=round*5+' / 20';
  byId('step').disabled=round===4;
  byId('all').disabled=round===4;
  const tbody=byId('results');
  tbody.replaceChildren(...methods.map(method=>{
    const state=states[method], tr=document.createElement('tr'), th=document.createElement('th');
    th.textContent=names[method];th.scope='row';tr.append(th);
    tr.insertCell().textContent=ratio(state.accuracy.at(-1),1);
    tr.insertCell().textContent=state.labels.filter(x=>x.noisy).length;
    return tr;
  }));
  pool();chart();
}
function restart(){
  const seed=Number(byId('seed').value);
  dataset=makeData(seed,byId('noisy').checked);
  states=start(dataset,seed);
  methods.forEach(key=>measure(states[key],dataset.test));
  round=0;render();
}
function advance(){if(round<4){round++;step(states,dataset.test);}}
byId('step').onclick=()=>{advance();render();};
byId('all').onclick=()=>{while(round<4)advance();render();};
for(const id of ['seed','noisy']) byId(id).onchange=restart;
byId('reset').onclick=restart;
byId('strategy').onchange=pool;
restart();
