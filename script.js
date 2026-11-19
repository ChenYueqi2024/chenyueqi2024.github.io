document.documentElement.classList.add('js');

// Keep the navigation and all content usable even when JavaScript is disabled.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
if (menuButton && navigation) {
  menuButton.hidden = false;
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
}

const compareControls = document.querySelector('.compare-controls');
const compareImage = document.querySelector('#compare-image');
if (compareControls && compareImage) {
  compareControls.hidden = false;
  const labels = {
    before: '迁移前：浅色背景上的三组原始正文与数字',
    after: '迁移后：正文采用蓝色学院模板，文字保持可编辑'
  };
  compareControls.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      compareImage.src = `../assets/slidepatch-${button.dataset.compare}.webp`;
      compareImage.alt = labels[button.dataset.compare];
      compareControls.querySelectorAll('button').forEach(item => {
        item.setAttribute('aria-pressed', String(item === button));
      });
    });
  });
}

const filters = document.querySelector('.honor-filters');
if (filters) {
  filters.hidden = false;
  const awards = [...document.querySelectorAll('.award')];
  const status = document.querySelector('#filter-status');
  filters.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      awards.forEach(award => {
        award.hidden = button.dataset.filter !== 'all' && award.dataset.category !== button.dataset.filter;
      });
      filters.querySelectorAll('button').forEach(item => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      status.textContent = `正在显示${button.textContent}，共 ${awards.filter(award => !award.hidden).length} 项。`;
    });
  });
}

const randomStory = document.querySelector('#random-story');
if (randomStory) {
  randomStory.hidden = false;
  const stories = [...document.querySelectorAll('.life-story')];
  let previous = -1;
  randomStory.addEventListener('click', () => {
    const choices = stories.map((_, index) => index).filter(index => index !== previous);
    const selected = choices[Math.floor(Math.random() * choices.length)];
    previous = selected;
    const target = stories[selected];
    target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center'});
    target.setAttribute('tabindex', '-1');
    target.focus({preventScroll: true});
    target.classList.add('random-spotlight');
    setTimeout(() => target.classList.remove('random-spotlight'), 1700);
  });
}
