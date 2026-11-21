export const size = 32;
export const cells = Array.from({length:size ** 3}, (_, i) => [
  i % size, Math.floor(i/size) % size, Math.floor(i/(size*size))
]);
export function objects() {
  const solid = Uint8Array.from(cells, ([x,y,z]) => Number(
    x>=5 && x<=26 && y>=5 && y<=26 && Math.abs(x-15.5)+Math.abs(y-15.5)<=18 && z>=5 && z<=24));
  const hollow = Uint8Array.from(solid,(v,i) => {
    const [x,y,z] = cells[i];
    return v && !(x>=12 && x<=20 && y>=12 && y<=20 && z>=16) ? 1 : 0;
  });
  return {solid, hollow};
}

export const screen = 56;
export function views(count, distribution) {
  return Array.from({length:count}, (_, i) => {
    const az = distribution === 'even' ? 2*Math.PI*i/count : .83*i/Math.max(1,count-1);
    const tilt = i%3 === 2 ? .48 : .1;
    const projection = Uint16Array.from(cells, ([x,y,z]) => {
      const u = Math.cos(az)*(x-15.5) - Math.sin(az)*(y-15.5);
      const v = Math.cos(tilt)*(z-15.5) - Math.sin(tilt)*(Math.sin(az)*(x-15.5)+Math.cos(az)*(y-15.5));
      return Math.round(u+27.5) + screen*Math.round(v+27.5);
    });
    return {az,tilt,projection};
  });
}

export function silhouette(shape, projection) {
  const image = new Uint8Array(screen*screen);
  for (let i=0;i<shape.length;i++) if (shape[i]) image[projection[i]]=1;
  return image;
}
export function carve(shape, cameras) {
  const images = cameras.map(({projection}) => silhouette(shape,projection));
  const volume = Uint8Array.from(shape, (_,i) => Number(cameras.every(
    ({projection},j) => images[j][projection[i]])));
  let intersection = 0, union = 0, extra = 0;
  for (let i = 0; i < volume.length; i++) {
    intersection += Number(Boolean(volume[i] && shape[i]));
    union += Number(Boolean(volume[i] || shape[i]));
    extra += Number(Boolean(volume[i] && !shape[i]));
  }
  return {volume,images,intersection,union,extra};
}
