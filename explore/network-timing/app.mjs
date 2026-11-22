import {byId} from '../lab-utils.mjs';
import {presets, tracePage} from './model.mjs';

const sliders = ['rtt', 'origin', 'rate'];
const labels = {dns: 'DNS', connect: '建立连接', tls: 'TLS', wait: '等待响应', download: '下载'};
const buttons = document.querySelectorAll('[data-preset]');
let selected = 0;
let preset = 'normal';
const ms = value => value.toLocaleString('zh-CN') + ' ms';

function readControls() {
  return {
    rtt: Number(byId('rtt').value), origin: Number(byId('origin').value), rate: Number(byId('rate').value),
    connection: byId('connection').value, dns: byId('dns-cache').checked,
    assets: byId('asset-cache').checked, lost: byId('lost').checked
  };
}

function describe(row, protocol) {
  const parts = row.timeline.filter(item => item.ms).map(({id, ms: duration}) => {
    const name = id === 'download' && row.local ? '本地读取' :
      id === 'connect' && protocol === 'h3' ? 'QUIC（含 TLS）' : labels[id];
    return name + ' ' + ms(duration);
  });
  byId('timing-detail').textContent = row.name + ' · 起点 ' + ms(row.start) + ' · 完成 ' + ms(row.end) +
    ' · ' + row.kb + ' kB。' + parts.join('、') + '。';
}

function render() {
  const controls = readControls();
  const {rows, firstByte, last} = tracePage(controls);
  const endpoint = Math.ceil(last.end / 400) * 400;
  for (const name of sliders) byId(name + '-value').value = controls[name] + (name === 'rate' ? ' Mb/s' : ' ms');
  for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.preset === preset));
  byId('dns-cache').disabled = controls.connection === 'reuse';
  byId('lost').disabled = controls.assets;
  byId('first-byte').textContent = ms(firstByte);
  byId('load-end').textContent = ms(last.end);
  byId('last-resource').textContent = last.name;

  const axis = document.createElement('div');
  axis.className = 'waterfall-axis';
  for (const mark of [0, endpoint / 2, endpoint]) {
    const text = document.createElement('span');
    text.textContent = ms(mark);
    axis.append(text);
  }
  const chart = byId('waterfall');
  chart.replaceChildren(document.createElement('div'), axis);
  const rowButtons = [];
  rows.forEach((row, index) => {
    const name = document.createElement('button');
    name.type = 'button';
    name.className = 'waterfall-name';
    name.textContent = row.name;
    name.addEventListener('click', () => {
      selected = index;
      rowButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      describe(row, controls.connection);
    });
    name.setAttribute('aria-pressed', String(index === selected));
    rowButtons.push(name);
    const track = document.createElement('div');
    track.className = 'waterfall-track';
    track.setAttribute('aria-hidden', 'true');
    let cursor = row.start;
    for (const stage of row.timeline) {
      if (stage.ms === 0) continue;
      const bar = document.createElement('span');
      bar.className = 'waterfall-bar stage-' + stage.id;
      bar.style.left = (cursor / endpoint * 100) + '%';
      bar.style.width = (stage.ms / endpoint * 100) + '%';
      track.append(bar);
      cursor += stage.ms;
    }
    chart.append(name, track);
  });
  describe(rows[selected], controls.connection);
}

function applyPreset(provided) {
  preset = provided;
  selected = 0;
  const values = presets[preset];
  for (const name of sliders) byId(name).value = values[name];
  byId('connection').value = values.connection;
  byId('dns-cache').checked = values.dns;
  byId('asset-cache').checked = values.assets;
  byId('lost').checked = values.lost;
  render();
}

buttons.forEach(button => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
for (const id of [...sliders, 'connection', 'dns-cache', 'asset-cache', 'lost']) {
  byId(id).addEventListener('input', () => {
    preset = '';
    render();
  });
}
applyPreset('normal');
byId('timing-workbench').hidden = false;

