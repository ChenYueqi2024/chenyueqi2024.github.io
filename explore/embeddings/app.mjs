import {byId,canvasChart,random} from '../lab-utils.mjs';
import {patches,standardized,pca,tsne,nearest} from './model.mjs';
const data=patches(712), vectors=standardized(data.map(x=>x.vector));
const family=['竖条纹','斜条纹','横条纹','反斜条纹'];
const palettes=['#4c73bd','#b4523b','#3a9b78','#9571b3'];
const select=byId('node');
for(const item of data) select.add(new Option('图块 '+(item.id+1)+' · '+family[item.family],item.id));
let positions, screen, run=0;
function preview(sample){
  const canvas=byId('document-patch'), context=canvas.getContext('2d');
  const image=context.createImageData(12,12);
  sample.image.forEach((pixel,i)=>{
    pixel.forEach((v,j)=>{image.data[i*4+j]=Math.round(v*255);});
    image.data[i*4+3]=255;
  });
  context.putImageData(image,0,0);
  canvas.setAttribute('aria-label','图块 '+(sample.id+1)+' · '+family[sample.family]);
}
function render(){
  if(!positions) return;
  const node=Number(select.value), k=Number(byId('neighbors').value), width=680,height=440;
  const raw=nearest(vectors,node,k), projected=nearest(positions,node,k);
  const shared=projected.filter(id=>raw.includes(id));
  const c=canvasChart('points',width,height);
  const x=positions.map(p=>p[0]), y=positions.map(p=>p[1]);
  const fromX=Math.min(...x), fromY=Math.min(...y);
  const factor=Math.min((width-50)/(Math.max(...x)-fromX),(height-48)/(Math.max(...y)-fromY));
  const midX=(Math.max(...x)+fromX)/2, midY=(Math.max(...y)+fromY)/2;
  screen=positions.map(([u,v])=>[width/2+(u-midX)*factor,height/2-(v-midY)*factor]);
  const [sx,sy]=screen[node];
  for(const id of new Set([...raw,...projected])){
    const [nx,ny]=screen[id];
    c.beginPath();c.strokeStyle=shared.includes(id)?'#0b6854':raw.includes(id)?'#704399':'#c06436';
    c.setLineDash(shared.includes(id)?[]:[4,3]);c.moveTo(sx,sy);c.lineTo(nx,ny);c.stroke();
  }
  c.setLineDash([]);
  screen.forEach(([u,v],i)=>{
    c.fillStyle=palettes[data[i].family];c.beginPath();c.arc(u,v,5,0,2*Math.PI);c.fill();
    if(i===node || raw.includes(i) || projected.includes(i)){
      c.lineWidth=i===node?3:2;c.strokeStyle=i===node?'#0d3029':shared.includes(i)?'#0b6854':raw.includes(i)?'#704399':'#c06436';
      c.beginPath();c.arc(u,v,8,0,2*Math.PI);c.stroke();
    }
  });
  byId('overlap').textContent='共同邻居 '+shared.length+' / '+k+'。紫色只在原空间入选，橙色只在二维入选，绿色为共同邻居。';
  byId('neighbor-count').textContent=k;
  for(const [id,items] of [['original-neighbors',raw],['projected-neighbors',projected]]) {
    byId(id).replaceChildren(...items.map(i=>{
      const li=document.createElement('li'),button=document.createElement('button');
      button.textContent='图块 '+(i+1);button.setAttribute('aria-label','选中图块 '+(i+1));
      button.onclick=()=>{select.value=i;render();select.focus();};li.append(button);return li;
    }));
  }
  preview(data[node]);
}
function compute(){
  const method=byId('projector').value, parameter=byId('parameter');
  parameter.disabled=method==='pca';
  byId('algorithm-param').textContent=method==='tsne'?'Perplexity':method==='umap'?'图邻居数':'PCA 无局部参数';
  byId('parameter-value').textContent=method==='pca'?'—':parameter.value;
  byId('projection-status').textContent='正在计算投影…';
  const thisRun=++run, value=Number(parameter.value), seed=Number(byId('seed').value);
  setTimeout(()=>{
    if(thisRun!==run)return;
    try{
      if(method==='pca') positions=pca(vectors);
      else if(method==='tsne') positions=tsne(vectors,value,seed);
      else positions=new window.UMAP.UMAP({nNeighbors:value,nComponents:2,nEpochs:220,random:random(seed)}).fit(vectors);
      byId('projection-status').textContent=({pca:'PCA',tsne:'t-SNE',umap:'UMAP'})[method]+' · 60 个图块';
      render();
    }catch{byId('projection-status').textContent='投影未完成，请切换方法后重试。';}
  },20);
}
byId('points').onclick=event=>{
  if(!screen)return;
  const r=event.target.getBoundingClientRect(), [x,y]=[(event.clientX-r.left)*680/r.width,(event.clientY-r.top)*440/r.height];
  let min=625, hit=-1;
  screen.forEach(([a,b],i)=>{const distance=(a-x)**2+(b-y)**2;if(distance<min){min=distance;hit=i;}});
  if(hit>=0){select.value=hit;render();}
};
for(const id of ['node','neighbors']) byId(id).oninput=render;
for(const id of ['projector','seed','parameter']) byId(id).onchange=compute;
compute();
