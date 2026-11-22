export const presets = {
  normal: {rtt: 60, origin: 120, rate: 20, connection: 'h2', dns: false, assets: false, lost: false},
  server: {rtt: 60, origin: 1460, rate: 20, connection: 'h2', dns: false, assets: false, lost: false},
  image: {rtt: 60, origin: 120, rate: 4, connection: 'h2', dns: false, assets: false, lost: false},
  warm: {rtt: 60, origin: 120, rate: 20, connection: 'reuse', dns: true, assets: true, lost: false}
};

export function tracePage({rtt, origin, rate, connection, dns, assets, lost}) {
  const stage = (id, ms) => ({id, ms});
  function resource(name, start, kb, stages, recovered = false, local = false) {
    const download = local ? 4 : Math.round(kb * 8 / rate) + (recovered ? rtt : 0);
    const timeline = [...stages, stage('download', download)];
    return {name, start, kb, local, timeline, end: start + timeline.reduce((elapsed, item) => elapsed + item.ms, 0)};
  }

  const documentStages = [
    stage('dns', dns || connection === 'reuse' ? 0 : 40),
    stage('connect', connection === 'reuse' ? 0 : rtt),
    stage('tls', connection === 'h2' ? rtt : 0),
    stage('wait', rtt + origin)
  ];
  const html = resource('index.html', 0, 35, documentStages);
  const at = html.end;
  const css = resource('styles.css', at, 22, assets ? [] : [stage('wait', rtt + 14)], false, assets);
  const image = resource('cover.webp', at, 780, assets ? [] : [stage('wait', rtt + 18)], lost, assets);
  const js = resource('app.js', at, 100, [stage('wait', rtt + 20)]);
  const data = resource('data.json', js.end + 25, 12, [stage('wait', rtt + 45)]);
  const rows = [html, css, image, js, data];
  const last = rows.reduce((a, b) => a.end >= b.end ? a : b);
  return {rows, firstByte: documentStages.reduce((elapsed, item) => elapsed + item.ms, 0), last};
}

