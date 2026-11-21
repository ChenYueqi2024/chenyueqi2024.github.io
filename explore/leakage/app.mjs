import {byId,ratio} from '../lab-utils.mjs';
import {classify, protocols} from './model.mjs';
let data;
const shapes=['圆','方'];
function preview(id, sample) {
  const c=byId(id).getContext('2d');
  const [r,g,b]=sample.tint.map(v=>Math.round(v*255));
  c.fillStyle='rgb('+r+','+g+','+b+')';c.fillRect(0,0,200,120);
  c.strokeStyle='#ffffff42';c.lineWidth=4;
  const spacing=8+sample.pattern*12;
  for(let i=-120;i<200;i+=spacing){c.beginPath();c.moveTo(i,0);c.lineTo(i+sample.stripe*145,120);c.stroke();}
  c.fillStyle='#f4f2e7';
  if(sample.label) c.fillRect(sample.x-12,44,27,27);
  else{c.beginPath();c.arc(sample.x,58,15,0,Math.PI*2);c.fill();}
  byId(id).setAttribute('aria-label','场景 '+(sample.scene+1)+'，第 '+(sample.frame+1)+' 帧，标签 '+shapes[sample.label]);
}
function sample() {
  const rows=data[byId('protocol').value];
  const row=rows[Number(byId('frame').value)];
  for(const [id,item] of [['test-frame',row.frame],['neighbor',row.neighbor]]) preview(id,item);
  const info=f=>'片段 '+(f.scene+1)+' / 第 '+(f.frame+1)+' 帧 / '+shapes[f.label];
  byId('test-label').textContent='测试帧 · '+info(row.frame);
  byId('neighbor-label').textContent='训练近邻 · '+info(row.neighbor);
  byId('pair-note').textContent=(row.frame.scene===row.neighbor.scene?'同一片段，间隔 '+Math.abs(row.frame.frame-row.neighbor.frame)+' 帧。':'不同片段。')+
    '此题'+(row.correct?'答对。':'判错。')+' 模型沿用训练近邻的标签「'+shapes[row.neighbor.label]+'」。';
}
function run() {
  const seed=Number(byId('seed').value), features=byId('features').value;
  const {randomFrames,grouped,external}=protocols(seed);
  const rates=(protocol)=> {
    const rows=classify(protocol.train,protocol.test,features);
    return [rows,ratio(rows.filter(r=>r.correct).length,rows.length),
      String(protocol.test.filter(f=>protocol.train.some(s=>s.scene===f.scene)).length)+' / '+protocol.test.length,
      ratio(classify(protocol.train,external,features).filter(r=>r.correct).length,external.length)];
  };
  const a=rates(randomFrames),b=rates(grouped);
  data={randomFrames:a[0],grouped:b[0]};
  byId('scores').replaceChildren(...[['按帧随机',a],['按片段留出',b]].map(([label,row])=>{
    const tr=document.createElement('tr'), th=document.createElement('th');
    th.scope='row';th.textContent=label;tr.append(th);
    for(const item of row.slice(1)) tr.insertCell().textContent=item;
    return tr;
  }));
  byId('seed-value').textContent=seed;
  sample();
}
for(const id of ['seed','features']) byId(id).addEventListener('input',run);
for(const id of ['frame','protocol']) byId(id).addEventListener('input',sample);
run();
