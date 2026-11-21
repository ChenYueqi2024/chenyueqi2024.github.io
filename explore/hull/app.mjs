import {byId, ratio} from '../lab-utils.mjs';
import {size, screen, objects, views, carve, silhouette} from './model.mjs';
const source = objects();
const {solid,hollow} = source;
const ctx = id => byId(id).getContext('2d');
let current, cameras, shape;
function section(id, volume, trueVolume, index, axis) {
  const c=ctx(id), s=8;
  c.fillStyle='#ecf4ef';c.fillRect(0,0,256,256);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){
    const v = axis==='top' ? index*size*size+y*size+x : y*size*size+index*size+x;
    if(!volume[v]) continue;
    c.fillStyle=trueVolume[v] ? '#117665' : '#b6522d';
    c.fillRect(x*s,(size-y-1)*s,s,s);
  }
  c.strokeStyle='#a2b4ae';
  for(let i=0;i<=size;i+=4){c.beginPath();c.moveTo(i*s,0);c.lineTo(i*s,256);c.moveTo(0,i*s);c.lineTo(256,i*s);c.stroke();}
}
function renderSlice() {
  const slice=Number(byId('slice').value), axis=byId('axis').value;
  byId('level').textContent=slice;
  section('truth',shape,shape,slice,axis);
  section('estimate',current.volume,shape,slice,axis);
}
function renderCamera() {
  const i=Number(byId('camera').value)-1, image=current.images[i], c=ctx('mask');
  c.fillStyle='#eaf2ee';c.fillRect(0,0,224,224);
  c.fillStyle='#203a34';
  for(let y=0;y<screen;y++) for(let x=0;x<screen;x++) if(image[y*screen+x]) c.fillRect(x*4,(screen-1-y)*4,4,4);
  const layout=ctx('camera-map');
  layout.fillStyle='#eaf2ee';layout.fillRect(0,0,224,224);
  layout.strokeStyle='#9cb7ae';layout.beginPath();layout.arc(112,112,79,0,2*Math.PI);layout.stroke();
  layout.fillStyle='#117665';layout.fillRect(95,95,34,34);
  cameras.forEach(({az},j) => {
    layout.beginPath();layout.fillStyle=j===i?'#b6522d':'#254b8c';
    layout.arc(112+79*Math.sin(az),112+79*Math.cos(az),7,0,2*Math.PI);layout.fill();
  });
  byId('camera-number').textContent=String(i+1);
}
function update() {
  shape=source[byId('shape').value];
  const count=Number(byId('views').value);
  byId('views-value').textContent=count;
  cameras=views(count,byId('spread').value);
  current=carve(shape,cameras);
  let changed=0;
  cameras.forEach(({projection},i)=>{
    const alt=silhouette(shape===solid?hollow:solid,projection);
    changed+=current.images[i].reduce((sum,v,j)=>sum+Number(v!==alt[j]),0);
  });
  const camera=byId('camera');camera.max=count;camera.value=Math.min(Number(camera.value),count);
  byId('hull-score').textContent='三维重叠率（IoU） '+ratio(current.intersection,current.union)+
    ' · 多保留 '+current.extra+' 个体素 · 两物体在当前视角下 '+changed+' 个轮廓格不同';
  renderSlice();renderCamera();
}
for(const id of ['shape','views','spread']) byId(id).addEventListener('input',update);
for(const id of ['axis','slice']) byId(id).addEventListener('input',renderSlice);
byId('camera').addEventListener('input',renderCamera);
update();
