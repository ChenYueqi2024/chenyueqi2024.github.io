export const byId = id => document.getElementById(id);
export const ratio = (part,total) => (100 * part / total).toFixed(1) + '%';
export const sqdist = (a,b) => a.reduce((sum,x,i) => sum + (x-b[i])**2,0);

export function random(seed) {
  return () => {
    seed = (Math.imul(seed,1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function shuffled(values, rng) {
  const items = values.slice();
  for (let i=items.length-1;i>0;i--) {
    const j = Math.floor(rng() * (i+1));
    [items[i],items[j]] = [items[j],items[i]];
  }
  return items;
}

export function canvasChart(id, width, height) {
  const canvas = byId(id), context = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;
  context.fillStyle = '#eef4f1';
  context.fillRect(0,0,width,height);
  context.font = '14px system-ui';
  return context;
}
