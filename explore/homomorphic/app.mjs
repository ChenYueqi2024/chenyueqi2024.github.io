import {byId} from '../lab-utils.mjs';
import {limit, toyCircuit} from './model.mjs';

const value = id => Number(byId(id).value);
const operationNames = {
  sum: '直接相加两份密文。',
  product: '直接相乘两份密文。',
  deep: '先相加，再把上一步得到的密文与自身相乘。'
};

function render() {
  const gate = byId('gate').value;
  const noise = value('noise');
  const depth = value('depth');
  byId('noise-value').value = noise;
  byId('depth-value').value = depth;
  byId('depth-control').hidden = gate !== 'deep';
  const data = toyCircuit({a: value('bit-a'), b: value('bit-b'), noise, gate, depth});
  byId('cipher-a').textContent = data.aCipher;
  byId('cipher-b').textContent = data.bCipher;
  byId('cipher-op').textContent = operationNames[gate];
  byId('cipher-result').textContent = data.result;
  byId('centered').textContent = data.centered;
  byId('plaintext-check').textContent = data.bit + ' / ' + data.expected;
  const rows = data.steps.map(({label, magnitude}) => {
    const row = document.createElement('tr');
    for (const entry of [label, magnitude.toString(), magnitude <= limit ? '是' : '否 · 可能解错']) {
      row.insertCell().textContent = entry;
    }
    return row;
  });
  byId('he-steps').replaceChildren(...rows);
  const wrapped = data.steps.at(-1).magnitude > limit;
  byId('he-status').textContent = !wrapped
    ? '解密值与明文对照相同。余量落在允许范围内。'
    : data.bit === data.expected
      ? '余量已超出保证正确解密的范围。这一次解密的奇偶性恰好正确，下一组输入可能出错。'
      : '解密失败。余量折返改变了奇偶性，得到 ' + data.bit + '，明文对照为 ' + data.expected + '。';
}

for (const id of ['bit-a', 'bit-b', 'noise', 'depth', 'gate']) byId(id).addEventListener('input', render);
render();
byId('he-workbench').hidden = false;

