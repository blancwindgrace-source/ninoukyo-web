(() => {
  'use strict';
  document.documentElement.classList.add('js');
  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const grid = document.getElementById('memberGrid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('.member')];
  const search = document.getElementById('memberSearch');
  const clearSearch = document.getElementById('clearSearch');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const count = document.getElementById('resultCount');
  const empty = document.getElementById('emptyState');
  let selectedFilter = 'present';

  // Hiragana/katakana and full-width/half-width characters match alike.
  const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase('ja')
    .replace(/[ァ-ヶ]/g, (letter) => String.fromCharCode(letter.charCodeAt(0) - 0x60));
  const searchableCards = cards.map((card) => ({
    card,
    text: normalize([
      card.querySelector('.castBtn').dataset.name,
      card.querySelector('.castBtn').dataset.reading,
      card.querySelector('.badge').textContent,
      card.querySelector('.memberMeta').textContent,
      card.querySelector('.memberBio').textContent,
    ].join(' ')),
  }));
  document.querySelectorAll('[data-count]').forEach((node) => {
    node.textContent = String(cards.filter((card) => node.dataset.count === 'all' || card.dataset.state === node.dataset.count).length);
  });
  function filterMembers() {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    searchableCards.forEach(({card, text}) => {
      const matches = (selectedFilter === 'all' || card.dataset.state === selectedFilter)
        && terms.every((term) => text.includes(term));
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    count.textContent = `${cards.length}名中 ${visible}名を表示`;
    empty.hidden = visible > 0;
    clearSearch.hidden = search.value.length === 0;
    filters.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === selectedFilter)));
  }
  search.addEventListener('input', filterMembers);
  filters.forEach((button) => button.addEventListener('click', () => {
    selectedFilter = button.dataset.filter;
    filterMembers();
  }));
  clearSearch.addEventListener('click', () => {
    search.value = '';
    filterMembers();
    search.focus();
  });
  document.getElementById('resetFilters').addEventListener('click', () => {
    search.value = '';
    selectedFilter = 'all';
    filterMembers();
    search.focus();
  });
  filterMembers();

  grid.querySelectorAll('.memberPhoto > img').forEach((image) => {
    image.addEventListener('error', () => {
      image.hidden = true;
      const placeholder = image.parentElement.querySelector('.photoPlaceholder');
      if (!placeholder.querySelector('.unpublished')) {
        const label = document.createElement('span');
        label.className = 'unpublished';
        label.textContent = '写真未掲載';
        placeholder.append(label);
      }
    });
  });

  const modal = document.getElementById('castModal');
  const title = document.getElementById('mTitle');
  const subtitle = document.getElementById('mSub');
  const image = document.getElementById('mImg');
  const placeholder = document.getElementById('modalPlaceholder');
  const imageLoading = document.getElementById('imageLoading');
  const content = document.getElementById('mContent');
  const badges = document.getElementById('mBadges');
  const links = document.getElementById('mLinks');
  let opener = null;
  function openProfile(card, trigger) {
    const data = card.querySelector('.castBtn').dataset;
    opener = trigger;
    title.textContent = data.name;
    subtitle.textContent = data.reading;
    badges.textContent = card.querySelector('.badge').textContent;
    content.replaceChildren(
      card.querySelector('.memberMeta').cloneNode(true),
      card.querySelector('.memberBio').cloneNode(true),
    );
    links.replaceChildren();
    if (data.x) {
      const account = document.createElement('a');
      account.className = 'textLink';
      account.href = data.x;
      account.target = '_blank';
      account.rel = 'noopener noreferrer';
      account.textContent = 'Xアカウントを見る ↗';
      account.setAttribute('aria-label', `${data.name}のXアカウント（新しいタブ）`);
      links.append(account);
    }
    image.onload = null;
    image.onerror = null;
    image.removeAttribute('src');
    image.alt = `${data.name}の写真`;
    image.hidden = true;
    placeholder.hidden = Boolean(data.img);
    imageLoading.hidden = !data.img;
    if (data.img) {
      image.onload = () => {
        imageLoading.hidden = true;
        image.hidden = false;
      };
      image.onerror = () => {
        imageLoading.hidden = true;
        image.hidden = true;
        placeholder.hidden = false;
      };
      image.src = data.img;
    }
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    document.body.classList.add('dialogOpen');
  }
  document.querySelectorAll('[data-profile]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      const card = document.getElementById(`member-${trigger.dataset.profile}`);
      if (!card || typeof modal.showModal !== 'function') return;
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openProfile(card, trigger);
    });
  });
  document.getElementById('mClose').addEventListener('click', () => modal.close());
  modal.addEventListener('click', (event) => {
    if (event.target !== modal) return;
    const rect = modal.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close();
  });
  modal.addEventListener('close', () => {
    document.body.classList.remove('dialogOpen');
    image.onload = null;
    image.onerror = null;
    image.removeAttribute('src');
    if (opener && opener.isConnected) opener.focus({preventScroll: true});
  });
  function openLinkedProfile() {
    const hashId = location.hash.slice(1);
    if (!hashId.startsWith('member-')) return;
    const linkedCard = document.getElementById(hashId);
    if (linkedCard && linkedCard.classList.contains('member') && typeof modal.showModal === 'function') {
      if (linkedCard.hidden) {
        search.value = '';
        selectedFilter = linkedCard.dataset.state;
        filterMembers();
      }
      openProfile(linkedCard, linkedCard.querySelector('.castBtn'));
    }
  }
  window.addEventListener('hashchange', openLinkedProfile);
  openLinkedProfile();
})();
