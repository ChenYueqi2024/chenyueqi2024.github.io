const input = document.getElementById('experiment-query');
const status = document.getElementById('search-status');
const empty = document.getElementById('empty');
const chapters = Array.from(document.querySelectorAll('.chapter'), section => ({
  section,
  tiles: Array.from(section.querySelectorAll('.tile'), tile => ({
    tile, text:(section.querySelector('h2').textContent + ' ' + tile.textContent + ' ' + tile.dataset.search)
      .normalize('NFKC').toLowerCase()
  }))
}));

function search() {
  const terms = input.value.normalize('NFKC').toLowerCase().trim().split(/\s+/u).filter(Boolean);
  let shown = 0;
  for (const {section, tiles} of chapters) {
    let matches = 0;
    for (const {tile, text} of tiles) {
      const match = terms.every(term => text.includes(term));
      tile.hidden = !match;
      if (match) matches++;
    }
    for (const group of section.querySelectorAll('.subtopic')) {
      group.hidden = !group.querySelector('.tile:not([hidden])');
    }
    section.hidden = matches === 0;
    shown += matches;
  }
  empty.hidden = shown !== 0;
  status.textContent = terms.length ? '找到 ' + shown + ' 个条目' : '';
}
input.closest('.search').hidden = false;
input.addEventListener('input', search);
for (const link of document.querySelectorAll('.directory-tools nav a, .jump')) {
  link.addEventListener('click', () => {
    if (input.value) {
      input.value = '';
      search();
    }
  });
}
search();
