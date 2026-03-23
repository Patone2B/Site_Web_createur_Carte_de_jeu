const STORAGE_KEY = 'cardSetStudio.sets.v4';
const CARD_W = 252;
const CARD_H = 352;

const state = {
  screen: 'home',
  sets: loadSets(),
  currentSetId: null,
  selectedCardIndex: 0,
  side: 'front',
  selectedElementId: null,
  drag: null,
};

const el = {
  homeScreen: document.getElementById('homeScreen'),
  editorScreen: document.getElementById('editorScreen'),
  savedSetsList: document.getElementById('savedSetsList'),
  refreshSetsBtn: document.getElementById('refreshSetsBtn'),
  createBlankSetBtn: document.getElementById('createBlankSetBtn'),
  createPirateSetBtn: document.getElementById('createPirateSetBtn'),
  importSetBtn: document.getElementById('importSetBtn'),
  importSetInput: document.getElementById('importSetInput'),
  setNameInput: document.getElementById('setNameInput'),
  setStyleSelect: document.getElementById('setStyleSelect'),
  backHomeBtn: document.getElementById('backHomeBtn'),
  saveSetBtn: document.getElementById('saveSetBtn'),
  exportJsonBtn: document.getElementById('exportJsonBtn'),
  printBtn: document.getElementById('printBtn'),
  exportPdfBtn: document.getElementById('exportPdfBtn'),
  addCardBtn: document.getElementById('addCardBtn'),
  duplicateCardBtn: document.getElementById('duplicateCardBtn'),
  deleteCardBtn: document.getElementById('deleteCardBtn'),
  toggleSideBtn: document.getElementById('toggleSideBtn'),
  applyStyleToAllBtn: document.getElementById('applyStyleToAllBtn'),
  cardStats: document.getElementById('cardStats'),
  imageInput: document.getElementById('imageInput'),
  pagesContainer: document.getElementById('pagesContainer'),
  selectionInfo: document.getElementById('selectionInfo'),
  propText: document.getElementById('propText'),
  propFont: document.getElementById('propFont'),
  propFontSize: document.getElementById('propFontSize'),
  propColor: document.getElementById('propColor'),
  propBgColor: document.getElementById('propBgColor'),
  propBorderColor: document.getElementById('propBorderColor'),
  propBorderWidth: document.getElementById('propBorderWidth'),
  propOpacity: document.getElementById('propOpacity'),
  propRotation: document.getElementById('propRotation'),
  propAlign: document.getElementById('propAlign'),
  bringFrontBtn: document.getElementById('bringFrontBtn'),
  sendBackBtn: document.getElementById('sendBackBtn'),
  cloneElementBtn: document.getElementById('cloneElementBtn'),
  removeElementBtn: document.getElementById('removeElementBtn'),
  exportPngBtn: document.getElementById('exportPngBtn'),
  exportJpegBtn: document.getElementById('exportJpegBtn'),
  exportAllPngBtn: document.getElementById('exportAllPngBtn'),
};

init();

function init() {
  bindEvents();
  renderHome();
  updateStorageEstimate();
}

function bindEvents() {
  el.createBlankSetBtn.addEventListener('click', () => createNewSet('blank'));
  el.createPirateSetBtn.addEventListener('click', () => createNewSet('pirate'));
  el.refreshSetsBtn.addEventListener('click', renderHome);
  el.backHomeBtn.addEventListener('click', () => {
    saveCurrentSet();
    showScreen('home');
  });
  el.saveSetBtn.addEventListener('click', () => {
    saveCurrentSet();
    alert('Set sauvegardé localement.');
  });
  el.exportJsonBtn.addEventListener('click', exportCurrentSetJson);
  el.exportPdfBtn.addEventListener('click', exportCurrentSetPdf);
  el.printBtn.addEventListener('click', () => window.print());
  el.addCardBtn.addEventListener('click', addCard);
  el.duplicateCardBtn.addEventListener('click', duplicateCard);
  el.deleteCardBtn.addEventListener('click', deleteCard);
  el.toggleSideBtn.addEventListener('click', toggleSide);
  el.applyStyleToAllBtn.addEventListener('click', applyStyleToAllCards);
  el.setNameInput.addEventListener('input', () => {
    const set = currentSet();
    if (!set) return;
    set.name = el.setNameInput.value.trim() || 'Set sans nom';
    touchSet(set);
    renderEditorMeta();
  });
  el.setStyleSelect.addEventListener('change', () => {
    const set = currentSet();
    if (!set) return;
    set.style = el.setStyleSelect.value;
    touchSet(set);
    renderEditor();
  });
  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => addElement(btn.dataset.add));
  });
  el.imageInput.addEventListener('change', handleImageSelected);
  el.propText.addEventListener('input', () => updateSelectedElement('text', el.propText.value));
  el.propFont.addEventListener('change', () => updateSelectedElement('fontFamily', el.propFont.value));
  el.propFontSize.addEventListener('input', () => updateSelectedElement('fontSize', Number(el.propFontSize.value)));
  el.propColor.addEventListener('input', () => updateSelectedElement('color', el.propColor.value));
  el.propBgColor.addEventListener('input', () => updateSelectedElement('backgroundColor', el.propBgColor.value));
  el.propBorderColor.addEventListener('input', () => updateSelectedElement('borderColor', el.propBorderColor.value));
  el.propBorderWidth.addEventListener('input', () => updateSelectedElement('borderWidth', Number(el.propBorderWidth.value)));
  el.propOpacity.addEventListener('input', () => updateSelectedElement('opacity', Number(el.propOpacity.value) / 100));
  el.propRotation.addEventListener('input', () => updateSelectedElement('rotation', Number(el.propRotation.value)));
  el.propAlign.addEventListener('change', () => updateSelectedElement('textAlign', el.propAlign.value));
  el.cloneElementBtn.addEventListener('click', cloneSelectedElement);
  el.removeElementBtn.addEventListener('click', removeSelectedElement);
  el.bringFrontBtn.addEventListener('click', () => changeLayer(1));
  el.sendBackBtn.addEventListener('click', () => changeLayer(-1));
  el.exportPngBtn.addEventListener('click', () => exportVisibleCard('png'));
  el.exportJpegBtn.addEventListener('click', () => exportVisibleCard('jpeg'));
  el.exportAllPngBtn.addEventListener('click', exportAllCardsPng);
  el.importSetBtn.addEventListener('click', () => el.importSetInput.click());
  el.importSetInput.addEventListener('change', importSetFromFile);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', stopInteraction);
}

function loadSets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.sets));
  updateStorageEstimate();
}

function updateStorageEstimate() {
  const raw = localStorage.getItem(STORAGE_KEY) || '[]';
  const kb = Math.round(new Blob([raw]).size / 1024);
  const info = document.getElementById('storageInfo');
  if (!info) return;
  info.textContent = `Espace occupé actuellement par les sets : environ ${kb} Ko. Le localStorage tourne souvent autour de 5 Mo selon le navigateur. Avec 100 cartes et beaucoup d’images intégrées, la limite peut arriver vite. Pour une vraie sauvegarde durable, utilisez aussi le fichier JSON du set.`;
}

function uid(prefix='id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function defaultSet(style='blank') {
  return {
    id: uid('set'),
    name: style === 'pirate' ? 'Nouveau set pirate' : 'Nouveau set vierge',
    style,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cards: [defaultCard(style)],
  };
}

function defaultCard(style='blank') {
  return {
    id: uid('card'),
    front: starterElements(style, 'front'),
    back: starterElements(style, 'back'),
  };
}

function starterElements(style, side) {
  if (style !== 'pirate') return [];
  if (side === 'front') {
    return [
      makeElement('title', { x: 26, y: 18, w: 200, h: 34, text: 'Titre de carte', fontFamily: 'Pirata One', fontSize: 24, color: '#5a381f', backgroundColor: 'transparent', borderWidth: 0, textAlign: 'center' }),
      makeElement('image', { x: 28, y: 62, w: 196, h: 148, src: '', placeholder: 'Image' }),
      makeElement('banner', { x: 46, y: 220, w: 160, h: 28, text: 'Capitaine', fontFamily: 'Cinzel', fontSize: 16, color: '#fff9ec', backgroundColor: '#8a5a2b', borderColor: '#5b3f21' }),
      makeElement('text', { x: 30, y: 262, w: 192, h: 56, text: 'Ajoutez ici la description pirate ou la capacité spéciale.', fontFamily: 'IM Fell English', fontSize: 16, color: '#4a2f1a', backgroundColor: 'transparent', borderWidth: 0 }),
    ];
  }
  return [
    makeElement('title', { x: 26, y: 34, w: 200, h: 34, text: 'Verso', fontFamily: 'Pirata One', fontSize: 26, color: '#5a381f', backgroundColor: 'transparent', borderWidth: 0, textAlign: 'center' }),
    makeElement('text', { x: 40, y: 112, w: 172, h: 120, text: 'Texte de verso, règles, rareté, notes ou effet.', fontFamily: 'Libre Baskerville', fontSize: 15, color: '#4a2f1a', backgroundColor: 'rgba(255,248,234,0.35)', borderColor: '#8f6a42', borderWidth: 1 }),
    makeElement('badge', { x: 76, y: 272, w: 100, h: 36, text: 'Trésor', fontFamily: 'Cinzel', fontSize: 16, color: '#fff9ec', backgroundColor: '#7a532a', borderColor: '#5b3f21' }),
    ];
  }

function makeElement(type, overrides = {}) {
  const base = {
    id: uid('el'),
    type,
    x: 34,
    y: 34,
    w: type === 'line' ? 140 : 120,
    h: type === 'title' ? 34 : type === 'text' ? 60 : type === 'circle' || type === 'square' ? 72 : type === 'line' ? 12 : 80,
    text: type === 'title' ? 'Titre' : type === 'text' ? 'Votre texte' : type === 'badge' ? 'Badge' : '',
    fontFamily: type === 'title' ? 'Cinzel' : 'Inter',
    fontSize: type === 'title' ? 24 : 16,
    color: '#1f2937',
    backgroundColor: ['rect','square','circle','ellipse','badge','banner'].includes(type) ? '#d6b66f' : 'transparent',
    borderColor: '#5b4630',
    borderWidth: ['image','text','title','line'].includes(type) ? 0 : 2,
    textAlign: 'left',
    opacity: 1,
    rotation: 0,
    src: '',
    placeholder: 'Image',
  };
  return { ...base, ...overrides };
}

function createNewSet(style) {
  const set = defaultSet(style);
  state.sets.unshift(set);
  state.currentSetId = set.id;
  state.selectedCardIndex = 0;
  state.side = 'front';
  state.selectedElementId = null;
  saveSets();
  showScreen('editor');
}

function showScreen(name) {
  state.screen = name;
  el.homeScreen.classList.toggle('active', name === 'home');
  el.editorScreen.classList.toggle('active', name === 'editor');
  if (name === 'home') renderHome();
  if (name === 'editor') renderEditor();
}

function renderHome() {
  const sets = state.sets;
  if (!sets.length) {
    el.savedSetsList.innerHTML = '<div class="empty-message">Aucun set sauvegardé pour le moment.</div>';
    return;
  }
  el.savedSetsList.innerHTML = sets.map(set => `
    <article class="saved-card">
      <div class="saved-card-head">
        <div>
          <h3>${escapeHtml(set.name)}</h3>
          <div class="saved-meta">Style : ${set.style === 'pirate' ? 'Pirate' : 'Vierge'} · ${set.cards.length} carte(s) · MAJ ${formatDate(set.updatedAt)}</div>
        </div>
      </div>
      <div class="saved-actions">
        <button class="primary small" data-open="${set.id}">Ouvrir</button>
        <button class="ghost small" data-duplicate-set="${set.id}">Dupliquer</button>
        <button class="danger small" data-delete-set="${set.id}">Supprimer</button>
      </div>
    </article>
  `).join('');

  el.savedSetsList.querySelectorAll('[data-open]').forEach(btn => btn.onclick = () => openSet(btn.dataset.open));
  el.savedSetsList.querySelectorAll('[data-delete-set]').forEach(btn => btn.onclick = () => deleteSet(btn.dataset.deleteSet));
  el.savedSetsList.querySelectorAll('[data-duplicate-set]').forEach(btn => btn.onclick = () => duplicateSet(btn.dataset.duplicateSet));
}

function openSet(id) {
  state.currentSetId = id;
  state.selectedCardIndex = 0;
  state.side = 'front';
  state.selectedElementId = null;
  showScreen('editor');
}

function deleteSet(id) {
  if (!confirm('Supprimer ce set localement ?')) return;
  state.sets = state.sets.filter(s => s.id !== id);
  saveSets();
  renderHome();
}

function duplicateSet(id) {
  const set = state.sets.find(s => s.id === id);
  if (!set) return;
  const copy = JSON.parse(JSON.stringify(set));
  copy.id = uid('set');
  copy.name = `${set.name} (copie)`;
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = new Date().toISOString();
  state.sets.unshift(copy);
  saveSets();
  renderHome();
}

function currentSet() {
  return state.sets.find(s => s.id === state.currentSetId) || null;
}

function currentCard() {
  const set = currentSet();
  return set?.cards[state.selectedCardIndex] || null;
}

function currentElements() {
  const card = currentCard();
  return card ? card[state.side] : [];
}

function renderEditor() {
  renderEditorMeta();
  renderCards();
  syncPropertiesPanel();
}

function renderEditorMeta() {
  const set = currentSet();
  if (!set) return;
  el.setNameInput.value = set.name;
  el.setStyleSelect.value = set.style;
  el.toggleSideBtn.textContent = state.side === 'front' ? 'Voir le verso' : 'Voir le recto';
  el.cardStats.textContent = `Carte ${state.selectedCardIndex + 1} / ${set.cards.length} · Face actuelle : ${state.side === 'front' ? 'Recto' : 'Verso'}`;
}

function renderCards() {
  const set = currentSet();
  if (!set) return;
  el.pagesContainer.innerHTML = set.cards.map((card, index) => {
    const elements = card[state.side].slice().sort((a,b) => (a.z || 0) - (b.z || 0));
    return `
      <div class="page-wrap" data-card-index="${index}">
        <p class="page-label">Page ${index + 1} · ${state.side === 'front' ? 'Recto' : 'Verso'}</p>
        <div class="card-page ${index === state.selectedCardIndex ? 'active-page' : ''}">
          <div class="card-canvas ${set.style}" data-canvas-card-index="${index}">
            ${set.style === 'pirate' ? `<div class="pirate-decor-top">✦ Carte Pirate ✦</div><div class="pirate-decor-bottom"><span>⚓</span><span>☠</span><span>⚓</span></div>` : ''}
            ${elements.map(item => renderElement(item, index)).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');

  el.pagesContainer.querySelectorAll('.card-canvas').forEach(canvas => {
    canvas.addEventListener('pointerdown', onCanvasPointerDown);
  });
  el.pagesContainer.querySelectorAll('.element').forEach(node => {
    node.addEventListener('pointerdown', onElementPointerDown);
  });
}

function renderElement(item, cardIndex) {
  const isSelected = cardIndex === state.selectedCardIndex && item.id === state.selectedElementId;
  const style = [
    `left:${item.x}px`, `top:${item.y}px`, `width:${item.w}px`, `height:${item.h}px`,
    `color:${item.color}`,
    `background:${item.backgroundColor}`,
    `border:${item.borderWidth}px solid ${item.borderColor}`,
    `opacity:${item.opacity}`,
    `transform:rotate(${item.rotation}deg)`,
    `font-family:${cssSafe(item.fontFamily)}`,
    `font-size:${item.fontSize}px`,
    `text-align:${item.textAlign}`,
    `border-radius:${borderRadiusForType(item.type)}`,
    `z-index:${item.z || 1}`,
  ].join(';');

  let content = '';
  if (item.type === 'image') {
    content = item.src
      ? `<div class="content"><img src="${item.src}" alt="image" /></div>`
      : `<div class="content" style="border:1px dashed rgba(0,0,0,.2); color:#6b7280; font-size:13px;">${escapeHtml(item.placeholder || 'Image')}</div>`;
  } else if (item.type === 'line') {
    content = `<div class="content"><div class="line-bar"></div></div>`;
  } else {
    content = `<div class="content">${escapeHtml(item.text || '')}</div>`;
  }

  const handles = isSelected ? `
    <span class="resize-handle nw" data-dir="nw"></span>
    <span class="resize-handle ne" data-dir="ne"></span>
    <span class="resize-handle sw" data-dir="sw"></span>
    <span class="resize-handle se" data-dir="se"></span>
  ` : '';

  return `<div class="element ${item.type} ${isSelected ? 'selected' : ''}" data-element-id="${item.id}" data-card-index="${cardIndex}" style="${style}">${content}${handles}</div>`;
}

function borderRadiusForType(type) {
  if (type === 'circle') return '999px';
  if (type === 'ellipse') return '999px';
  if (type === 'badge') return '999px';
  if (type === 'banner') return '0';
  return '8px';
}

function onCanvasPointerDown(e) {
  if (e.target.closest('.element')) return;
  const canvas = e.currentTarget;
  state.selectedCardIndex = Number(canvas.dataset.canvasCardIndex);
  state.selectedElementId = null;
  renderEditor();
}

function onElementPointerDown(e) {
  e.stopPropagation();
  const node = e.currentTarget;
  const cardIndex = Number(node.dataset.cardIndex);
  const elementId = node.dataset.elementId;
  state.selectedCardIndex = cardIndex;
  state.selectedElementId = elementId;
  const handle = e.target.closest('.resize-handle');
  const item = getElementById(elementId, cardIndex);
  if (!item) return renderEditor();
  const canvasRect = node.parentElement.getBoundingClientRect();
  state.drag = {
    mode: handle ? 'resize' : 'move',
    dir: handle?.dataset.dir || null,
    startX: e.clientX,
    startY: e.clientY,
    startItem: { ...item },
    cardIndex,
    elementId,
    canvasRect,
  };
  renderEditor();
}

function onPointerMove(e) {
  if (!state.drag) return;
  const dx = e.clientX - state.drag.startX;
  const dy = e.clientY - state.drag.startY;
  const item = getElementById(state.drag.elementId, state.drag.cardIndex);
  if (!item) return;

  if (state.drag.mode === 'move') {
    item.x = clamp(state.drag.startItem.x + dx, 0, CARD_W - item.w);
    item.y = clamp(state.drag.startItem.y + dy, 0, CARD_H - item.h);
  } else {
    resizeItem(item, state.drag.startItem, state.drag.dir, dx, dy);
  }
  touchSet(currentSet());
  renderCards();
  syncPropertiesPanel();
}

function resizeItem(item, start, dir, dx, dy) {
  let { x, y, w, h } = start;
  if (dir.includes('e')) w = start.w + dx;
  if (dir.includes('s')) h = start.h + dy;
  if (dir.includes('w')) { w = start.w - dx; x = start.x + dx; }
  if (dir.includes('n')) { h = start.h - dy; y = start.y + dy; }

  if (item.type === 'square' || item.type === 'circle') {
    const size = Math.max(24, Math.min(w, h));
    w = size; h = size;
    if (dir.includes('w')) x = start.x + (start.w - size);
    if (dir.includes('n')) y = start.y + (start.h - size);
  }
  if (item.type === 'line') h = 12;
  w = Math.max(24, Math.min(w, CARD_W - x));
  h = Math.max(item.type === 'line' ? 12 : 24, Math.min(h, CARD_H - y));
  x = clamp(x, 0, CARD_W - w);
  y = clamp(y, 0, CARD_H - h);
  item.x = x; item.y = y; item.w = w; item.h = h;
}

function stopInteraction() {
  state.drag = null;
}

function getElementById(id, cardIndex = state.selectedCardIndex) {
  const set = currentSet();
  return set?.cards[cardIndex]?.[state.side].find(el => el.id === id) || null;
}

function addCard() {
  const set = currentSet();
  if (!set) return;
  set.cards.push(defaultCard(set.style));
  state.selectedCardIndex = set.cards.length - 1;
  state.selectedElementId = null;
  touchSet(set);
  renderEditor();
  scrollToCard(state.selectedCardIndex);
}

function duplicateCard() {
  const set = currentSet();
  const card = currentCard();
  if (!set || !card) return;
  const copy = JSON.parse(JSON.stringify(card));
  copy.id = uid('card');
  set.cards.splice(state.selectedCardIndex + 1, 0, copy);
  state.selectedCardIndex += 1;
  state.selectedElementId = null;
  touchSet(set);
  renderEditor();
  scrollToCard(state.selectedCardIndex);
}

function deleteCard() {
  const set = currentSet();
  if (!set || set.cards.length === 1) return alert('Le set doit garder au moins une carte.');
  set.cards.splice(state.selectedCardIndex, 1);
  state.selectedCardIndex = Math.max(0, state.selectedCardIndex - 1);
  state.selectedElementId = null;
  touchSet(set);
  renderEditor();
}

function toggleSide() {
  state.side = state.side === 'front' ? 'back' : 'front';
  state.selectedElementId = null;
  renderEditor();
}

function applyStyleToAllCards() {
  const set = currentSet();
  if (!set) return;
  set.cards.forEach(card => {
    if (card === currentCard()) return;
    if (!card[state.side].length) {
      card[state.side] = JSON.parse(JSON.stringify(currentCard()[state.side] || []));
    }
  });
  touchSet(set);
  renderEditor();
  alert('Style appliqué aux autres cartes seulement si la face était vide.');
}

function addElement(type) {
  if (type === 'image') return el.imageInput.click();
  const elements = currentElements();
  if (!elements) return;
  const next = makeElement(type);
  next.x = 48 + (elements.length % 4) * 14;
  next.y = 46 + (elements.length % 5) * 14;
  next.z = elements.length + 1;
  if (type === 'banner') {
    next.text = 'Bannière'; next.w = 140; next.h = 32; next.color = '#fff8ed'; next.backgroundColor = '#8a5a2b';
  }
  elements.push(next);
  state.selectedElementId = next.id;
  touchSet(currentSet());
  renderEditor();
}

function handleImageSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const imageEl = makeElement('image', { src: reader.result, w: 150, h: 110, x: 50, y: 50, z: currentElements().length + 1 });
    currentElements().push(imageEl);
    state.selectedElementId = imageEl.id;
    touchSet(currentSet());
    renderEditor();
    el.imageInput.value = '';
  };
  reader.readAsDataURL(file);
}

function syncPropertiesPanel() {
  const item = getElementById(state.selectedElementId);
  if (!item) {
    el.selectionInfo.textContent = 'Aucun élément sélectionné.';
    el.propText.value = '';
    return;
  }
  el.selectionInfo.textContent = `Élément : ${labelForType(item.type)} · Position ${Math.round(item.x)}, ${Math.round(item.y)} · Taille ${Math.round(item.w)} × ${Math.round(item.h)}`;
  el.propText.value = item.text || '';
  el.propFont.value = item.fontFamily || 'Inter';
  el.propFontSize.value = item.fontSize || 16;
  el.propColor.value = normalizeColor(item.color, '#1f2937');
  el.propBgColor.value = normalizeColor(item.backgroundColor, '#d6b66f');
  el.propBorderColor.value = normalizeColor(item.borderColor, '#5b4630');
  el.propBorderWidth.value = item.borderWidth || 0;
  el.propOpacity.value = Math.round((item.opacity ?? 1) * 100);
  el.propRotation.value = item.rotation || 0;
  el.propAlign.value = item.textAlign || 'left';
}

function updateSelectedElement(key, value) {
  const item = getElementById(state.selectedElementId);
  if (!item) return;
  item[key] = value;
  if (item.type === 'line' && key === 'borderWidth') item.borderWidth = 0;
  touchSet(currentSet());
  renderCards();
  syncPropertiesPanel();
}

function cloneSelectedElement() {
  const item = getElementById(state.selectedElementId);
  if (!item) return;
  const copy = JSON.parse(JSON.stringify(item));
  copy.id = uid('el');
  copy.x = clamp(item.x + 12, 0, CARD_W - item.w);
  copy.y = clamp(item.y + 12, 0, CARD_H - item.h);
  copy.z = (maxZ(currentElements()) + 1);
  currentElements().push(copy);
  state.selectedElementId = copy.id;
  touchSet(currentSet());
  renderEditor();
}

function removeSelectedElement() {
  const elements = currentElements();
  const index = elements.findIndex(e => e.id === state.selectedElementId);
  if (index < 0) return;
  elements.splice(index, 1);
  state.selectedElementId = null;
  touchSet(currentSet());
  renderEditor();
}

function changeLayer(direction) {
  const item = getElementById(state.selectedElementId);
  const elements = currentElements();
  if (!item || !elements) return;
  item.z = Math.max(1, (item.z || 1) + direction);
  normalizeZ(elements);
  touchSet(currentSet());
  renderEditor();
}

function normalizeZ(elements) {
  elements.sort((a,b) => (a.z || 0) - (b.z || 0)).forEach((item, i) => item.z = i + 1);
}

function maxZ(elements) {
  return Math.max(0, ...elements.map(e => e.z || 0));
}

function touchSet(set) {
  if (!set) return;
  set.updatedAt = new Date().toISOString();
  saveSets();
}

function saveCurrentSet() {
  const set = currentSet();
  if (!set) return;
  touchSet(set);
}

function exportCurrentSetJson() {
  const set = currentSet();
  if (!set) return;
  const payload = prepareSetForFile(set);
  downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), safeName(set.name) + '.json');
}

function prepareSetForFile(set) {
  return JSON.parse(JSON.stringify({
    app: 'Card Set Studio',
    version: 1,
    exportedAt: new Date().toISOString(),
    set,
  }));
}

async function exportCurrentSetPdf() {
  const set = currentSet();
  if (!set) return;
  if (!window.jspdf?.jsPDF) {
    alert("La librairie PDF n'est pas chargée.");
    return;
  }

  const previousSelection = state.selectedElementId;
  state.selectedElementId = null;
  renderCards();

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const cardWidthMm = 63;
    const cardHeightMm = 88;
    const marginX = 10;
    const marginY = 10;
    const gapX = 4;
    const gapY = 4;
    const cols = Math.max(1, Math.floor((pageWidth - (marginX * 2) + gapX) / (cardWidthMm + gapX)));
    const rows = Math.max(1, Math.floor((pageHeight - (marginY * 2) + gapY) / (cardHeightMm + gapY)));
    const perPage = cols * rows;

    for (let i = 0; i < set.cards.length; i++) {
      if (i > 0 && i % perPage === 0) pdf.addPage('a4', 'portrait');
      const slot = i % perPage;
      const col = slot % cols;
      const row = Math.floor(slot / cols);
      const x = marginX + col * (cardWidthMm + gapX);
      const y = marginY + row * (cardHeightMm + gapY);
      const targetNode = document.querySelector(`.card-canvas[data-canvas-card-index="${i}"]`);
      if (!targetNode) continue;
      const canvas = await html2canvas(targetNode, { backgroundColor: '#ffffff', scale: 3, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', x, y, cardWidthMm, cardHeightMm, undefined, 'FAST');
    }

    pdf.save(`${safeName(set.name)}-${state.side}.pdf`);
  } catch (error) {
    console.error(error);
    alert('Export PDF impossible.');
  } finally {
    state.selectedElementId = previousSelection;
    renderCards();
  }
}

async function exportVisibleCard(format = 'png') {
  const canvasNode = document.querySelector(`.card-canvas[data-canvas-card-index="${state.selectedCardIndex}"]`);
  if (!canvasNode) return;
  const oldSelected = state.selectedElementId;
  state.selectedElementId = null;
  renderCards();
  const targetNode = document.querySelector(`.card-canvas[data-canvas-card-index="${state.selectedCardIndex}"]`);
  const canvas = await html2canvas(targetNode, { backgroundColor: null, scale: 3, useCORS: true });
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const filename = `${safeName(currentSet().name)}-carte-${state.selectedCardIndex + 1}-${state.side}.${format === 'jpeg' ? 'jpg' : 'png'}`;
  canvas.toBlob(blob => downloadBlob(blob, filename), mime, 0.95);
  state.selectedElementId = oldSelected;
  renderCards();
}

async function exportAllCardsPng() {
  const prevCard = state.selectedCardIndex;
  const prevSel = state.selectedElementId;
  state.selectedElementId = null;
  for (let i = 0; i < currentSet().cards.length; i++) {
    state.selectedCardIndex = i;
    renderCards();
    const targetNode = document.querySelector(`.card-canvas[data-canvas-card-index="${i}"]`);
    const canvas = await html2canvas(targetNode, { backgroundColor: null, scale: 3, useCORS: true });
    await new Promise(resolve => canvas.toBlob(blob => { downloadBlob(blob, `${safeName(currentSet().name)}-carte-${i + 1}-${state.side}.png`); resolve(); }, 'image/png'));
  }
  state.selectedCardIndex = prevCard;
  state.selectedElementId = prevSel;
  renderEditor();
}

async function importSetFromFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const raw = JSON.parse(text);
    const imported = normalizeImportedPayload(raw);
    imported.id = uid('set');
    imported.name = imported.name ? `${imported.name} (importé)` : 'Set importé';
    imported.createdAt = new Date().toISOString();
    imported.updatedAt = new Date().toISOString();
    state.sets.unshift(imported);
    saveSets();
    renderHome();
    openSet(imported.id);
  } catch (error) {
    console.error(error);
    alert('Import impossible : fichier JSON invalide ou incompatible.');
  } finally {
    e.target.value = '';
  }
}

function normalizeImportedPayload(raw) {
  const data = raw?.set && Array.isArray(raw?.set?.cards) ? raw.set : raw;
  if (!data || typeof data !== 'object' || !Array.isArray(data.cards)) {
    throw new Error('format invalide');
  }

  const set = JSON.parse(JSON.stringify(data));
  set.style = set.style === 'pirate' ? 'pirate' : 'blank';
  set.cards = set.cards.map(card => ({
    id: card.id || uid('card'),
    front: normalizeElements(card.front),
    back: normalizeElements(card.back),
  }));
  return set;
}

function normalizeElements(elements) {
  if (!Array.isArray(elements)) return [];
  return elements.map((item, index) => {
    const safe = makeElement(item?.type || 'text');
    return {
      ...safe,
      ...item,
      id: item?.id || uid('el'),
      x: clamp(Number(item?.x ?? safe.x), 0, CARD_W - 24),
      y: clamp(Number(item?.y ?? safe.y), 0, CARD_H - 24),
      w: Math.max(24, Number(item?.w ?? safe.w)),
      h: Math.max(item?.type === 'line' ? 12 : 24, Number(item?.h ?? safe.h)),
      z: Number(item?.z ?? (index + 1)),
      opacity: Math.min(1, Math.max(0.1, Number(item?.opacity ?? safe.opacity))),
      rotation: Number(item?.rotation ?? safe.rotation),
      text: item?.text ?? safe.text,
      src: item?.src ?? safe.src,
    };
  });
}

function scrollToCard(index) {
  document.querySelector(`.page-wrap[data-card-index="${index}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function labelForType(type) {
  return ({ title: 'Titre', text: 'Texte', image: 'Image', badge: 'Badge', rect: 'Rectangle', square: 'Carré', circle: 'Cercle', ellipse: 'Ellipse', line: 'Ligne', banner: 'Bannière' }[type]) || type;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('fr-FR');
  } catch {
    return iso;
  }
}

function safeName(value) {
  return (value || 'set').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').toLowerCase();
}

function cssSafe(v) { return String(v).includes(' ') ? `'${v}'` : v; }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function escapeHtml(str) { return String(str ?? '').replace(/[&<>"]/g, s => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[s])); }
function normalizeColor(value, fallback) {
  if (!value || value === 'transparent' || value.startsWith('rgba')) return fallback;
  return value;
}
function downloadBlob(blob, filename) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
