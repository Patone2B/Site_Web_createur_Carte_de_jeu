const STORAGE_KEY = 'cardforge-studio-state-v2';
const GRID_SIZE = 12;
const MAX_CARDS = 100;

const state = {
  template: 'blank',
  activeFace: 'front',
  activeCardIndex: 0,
  selectedId: null,
  showGrid: false,
  deck: []
};

const el = {
  canvas: document.getElementById('cardCanvas'),
  templateBtns: document.querySelectorAll('.template-btn'),
  faceBtns: document.querySelectorAll('.face-btn'),
  newDeckBtn: document.getElementById('newDeckBtn'),
  batchCount: document.getElementById('batchCount'),
  duplicateBtn: document.getElementById('duplicateBtn'),
  cardPicker: document.getElementById('cardPicker'),
  deleteCardBtn: document.getElementById('deleteCardBtn'),
  prevCardBtn: document.getElementById('prevCardBtn'),
  nextCardBtn: document.getElementById('nextCardBtn'),
  cloneCardBtn: document.getElementById('cloneCardBtn'),
  addTitleBtn: document.getElementById('addTitleBtn'),
  addTextBtn: document.getElementById('addTextBtn'),
  addImageBtn: document.getElementById('addImageBtn'),
  addBadgeBtn: document.getElementById('addBadgeBtn'),
  addShapeBtn: document.getElementById('addShapeBtn'),
  toggleGridBtn: document.getElementById('toggleGridBtn'),
  textContent: document.getElementById('textContent'),
  fontFamily: document.getElementById('fontFamily'),
  fontSize: document.getElementById('fontSize'),
  textColor: document.getElementById('textColor'),
  fillColor: document.getElementById('fillColor'),
  opacity: document.getElementById('opacity'),
  rotation: document.getElementById('rotation'),
  alignLeftBtn: document.getElementById('alignLeftBtn'),
  alignCenterBtn: document.getElementById('alignCenterBtn'),
  alignRightBtn: document.getElementById('alignRightBtn'),
  bringFrontBtn: document.getElementById('bringFrontBtn'),
  sendBackBtn: document.getElementById('sendBackBtn'),
  cardNameInput: document.getElementById('cardNameInput'),
  frontBgColor: document.getElementById('frontBgColor'),
  backBgColor: document.getElementById('backBgColor'),
  clearFaceBtn: document.getElementById('clearFaceBtn'),
  resetTemplateBtn: document.getElementById('resetTemplateBtn'),
  saveBtn: document.getElementById('saveBtn'),
  exportJsonBtn: document.getElementById('exportJsonBtn'),
  importJsonBtn: document.getElementById('importJsonBtn'),
  exportPdfBtn: document.getElementById('exportPdfBtn'),
  workspaceTitle: document.getElementById('workspaceTitle'),
  workspaceMeta: document.getElementById('workspaceMeta'),
  imageUpload: document.getElementById('imageUpload'),
  jsonUpload: document.getElementById('jsonUpload'),
  shapeLibrary: document.getElementById('shapeLibrary')
};

function uid(prefix = 'el') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function blankCard(index = 1) {
  return {
    id: uid('card'),
    name: `Carte ${index}`,
    template: state.template,
    frontBg: '#f7f1dd',
    backBg: '#f7f1dd',
    faces: { front: [], back: [] }
  };
}

function getShapePreset(kind = 'rect') {
  const presets = {
    rect: { w: 180, h: 100, style: { background: '#f5e2ad', border: '2px solid rgba(71,43,17,0.55)', borderRadius: 18 } },
    square: { w: 110, h: 110, style: { background: '#f5e2ad', border: '2px solid rgba(71,43,17,0.55)', borderRadius: 10 } },
    circle: { w: 120, h: 120, style: { background: '#efd58e', border: '2px solid rgba(71,43,17,0.55)', borderRadius: 999 } },
    ellipse: { w: 160, h: 100, style: { background: '#efd58e', border: '2px solid rgba(71,43,17,0.55)', borderRadius: 999 } },
    line: { w: 170, h: 10, style: { background: 'transparent', border: '0 solid transparent', borderRadius: 0 } },
    banner: { w: 180, h: 64, style: { background: '#d8b15d', border: '2px solid rgba(71,43,17,0.55)', borderRadius: 0 } }
  };
  return presets[kind] || presets.rect;
}

function createElement(type, overrides = {}) {
  const base = {
    id: uid(type),
    type,
    x: 20,
    y: 20,
    w: 120,
    h: type === 'text' ? 80 : 40,
    rotation: 0,
    opacity: 1,
    z: 1,
    text: '',
    src: '',
    shapeKind: 'rect',
    style: {
      fontFamily: 'Georgia',
      fontSize: 18,
      color: '#2b1d0f',
      background: 'transparent',
      textAlign: 'left',
      borderRadius: 8,
      border: 'none',
      padding: 8,
      fontWeight: 400,
      fontStyle: 'normal'
    }
  };

  const presets = {
    title: {
      w: 240, h: 48, x: 40, y: 20,
      text: 'Titre',
      style: { fontFamily: 'Georgia', fontSize: 26, color: '#3d240c', textAlign: 'center', fontWeight: 700, background: 'transparent', padding: 6 }
    },
    text: {
      w: 220, h: 90, x: 40, y: 310,
      text: 'Votre texte ici',
      style: { fontFamily: 'Georgia', fontSize: 18, color: '#2b1d0f', textAlign: 'left', background: 'transparent', padding: 8 }
    },
    image: { w: 240, h: 170, x: 40, y: 80 },
    badge: {
      w: 70, h: 70, x: 18, y: 18,
      text: '★',
      style: { fontFamily: 'Impact', fontSize: 34, color: '#fff7e4', textAlign: 'center', background: '#8e5a25', padding: 8, borderRadius: 999 }
    },
    shape: {
      w: 250, h: 120, x: 35, y: 290,
      shapeKind: 'rect',
      style: { background: '#f5e2ad', border: '2px solid rgba(71,43,17,0.55)', borderRadius: 18, padding: 8 }
    }
  };

  const merged = {
    ...base,
    ...(presets[type] || {}),
    ...overrides,
    style: {
      ...base.style,
      ...((presets[type] || {}).style || {}),
      ...(overrides.style || {})
    }
  };

  if (type === 'shape') {
    const shapePreset = getShapePreset(merged.shapeKind);
    merged.w = overrides.w ?? shapePreset.w;
    merged.h = overrides.h ?? shapePreset.h;
    merged.style = { ...merged.style, ...shapePreset.style, ...(overrides.style || {}) };
  }

  return merged;
}

function pirateTemplateCard(index = 1) {
  const card = blankCard(index);
  card.template = 'pirate';
  card.frontBg = '#e7d1a3';
  card.backBg = '#d8c08f';
  card.faces.front = [
    createElement('title', { text: 'Nom de la carte', x: 35, y: 20, w: 260, h: 46, z: 3, style: { color: '#4c2a08', fontFamily: 'Georgia', fontSize: 28, textAlign: 'center' } }),
    createElement('image', { x: 35, y: 78, w: 260, h: 200, z: 2 }),
    createElement('shape', { x: 28, y: 290, w: 274, h: 120, z: 1, shapeKind: 'rect', style: { background: '#f3dfaa', border: '2px solid rgba(92,56,21,0.5)', borderRadius: 18, padding: 12 } }),
    createElement('text', { text: 'Description, effet, histoire ou règle de la carte.', x: 42, y: 305, w: 248, h: 95, z: 3, style: { color: '#432612', fontFamily: 'Palatino Linotype', fontSize: 17, background: 'transparent', textAlign: 'left' } }),
    createElement('badge', { text: '☠', x: 248, y: 18, w: 46, h: 46, z: 4, style: { background: '#8b5a2b', color: '#fff2c9', fontSize: 24 } })
  ];
  card.faces.back = [
    createElement('title', { text: 'Verso', x: 55, y: 36, w: 220, h: 50, z: 2, style: { fontSize: 30, color: '#4c2a08' } }),
    createElement('shape', { x: 42, y: 110, w: 246, h: 240, z: 1, shapeKind: 'rect', style: { background: '#efd69a', border: '3px solid rgba(92,56,21,0.5)', borderRadius: 24 } }),
    createElement('text', { text: 'Ajoutez ici le dos de carte, un résumé, une rareté, un logo ou des règles.', x: 58, y: 132, w: 214, h: 190, z: 3, style: { fontFamily: 'Garamond', fontSize: 22, textAlign: 'center', color: '#513113' } })
  ];
  return card;
}

function buildCardFromTemplate(template, index) {
  return template === 'pirate' ? pirateTemplateCard(index) : blankCard(index);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.deck) && saved.deck.length) {
        Object.assign(state, saved);
        return;
      }
    } catch {}
  }
  state.deck = [buildCardFromTemplate(state.template, 1)];
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentCard() { return state.deck[state.activeCardIndex]; }
function currentElements() { return currentCard().faces[state.activeFace]; }
function selectedElement() { return currentElements().find(elm => elm.id === state.selectedId) || null; }
function sortByZ(a, b) { return a.z - b.z; }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function snap(v) { return state.showGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v; }

function renderPicker() {
  el.cardPicker.innerHTML = '';
  state.deck.forEach((card, i) => {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `${i + 1}. ${card.name}`;
    if (i === state.activeCardIndex) option.selected = true;
    el.cardPicker.appendChild(option);
  });
}

function applyCanvasBackground() {
  const card = currentCard();
  el.canvas.style.background = state.activeFace === 'front' ? card.frontBg : card.backBg;
}

function renderPirateDecor(target = el.canvas, card = currentCard()) {
  if (card.template !== 'pirate') return;
  const frame = document.createElement('div');
  frame.className = 'pirate-frame';
  target.appendChild(frame);
  ['tl', 'tr', 'bl', 'br'].forEach(pos => {
    const corner = document.createElement('div');
    corner.className = `pirate-corner ${pos}`;
    target.appendChild(corner);
  });
}

function renderCanvas() {
  const card = currentCard();
  const elements = [...currentElements()].sort(sortByZ);
  el.canvas.innerHTML = '';
  el.canvas.classList.toggle('show-grid', state.showGrid);
  applyCanvasBackground();
  renderPirateDecor();

  elements.forEach(item => {
    const node = document.getElementById('elementTemplate').content.firstElementChild.cloneNode(true);
    node.dataset.id = item.id;
    node.dataset.shapeKind = item.shapeKind || '';
    node.classList.add(item.type);
    node.style.left = `${item.x}px`;
    node.style.top = `${item.y}px`;
    node.style.width = `${item.w}px`;
    node.style.height = `${item.h}px`;
    node.style.zIndex = item.z;
    node.style.opacity = item.opacity;
    node.style.transform = `rotate(${item.rotation}deg)`;
    node.style.fontFamily = item.style.fontFamily;
    node.style.fontSize = `${item.style.fontSize}px`;
    node.style.color = item.style.color;
    node.style.background = item.style.background;
    node.style.textAlign = item.style.textAlign;
    node.style.borderRadius = `${item.style.borderRadius || 0}px`;
    node.style.border = item.style.border || 'none';
    node.style.padding = `${item.style.padding || 0}px`;
    node.style.fontWeight = item.style.fontWeight || 400;
    node.style.fontStyle = item.style.fontStyle || 'normal';

    if (item.type === 'image') {
      node.insertAdjacentHTML('afterbegin', `<img alt="image carte" src="${item.src || ''}">`);
    } else if (item.type !== 'shape') {
      node.insertAdjacentText('afterbegin', item.text || '');
    }

    if (state.selectedId === item.id) node.classList.add('selected');
    bindElementInteractions(node, item);
    el.canvas.appendChild(node);
  });

  renderUiState();
}

function renderUiState() {
  const card = currentCard();
  el.workspaceTitle.textContent = `${card.name} — ${state.activeFace === 'front' ? 'Recto' : 'Verso'}`;
  el.workspaceMeta.textContent = `Modèle : ${card.template === 'pirate' ? 'pirate' : 'vierge'} • ${state.deck.length} carte(s)`;
  el.cardNameInput.value = card.name;
  el.frontBgColor.value = card.frontBg;
  el.backBgColor.value = card.backBg;

  el.templateBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.template === state.template));
  el.faceBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.face === state.activeFace));

  const sel = selectedElement();
  const disabled = !sel;
  [el.textContent, el.fontFamily, el.fontSize, el.textColor, el.fillColor, el.opacity, el.rotation].forEach(input => input.disabled = disabled);

  if (sel) {
    el.textContent.value = sel.text || '';
    el.fontFamily.value = sel.style.fontFamily || 'Georgia';
    el.fontSize.value = sel.style.fontSize || 18;
    el.textColor.value = normalizeColor(sel.style.color || '#2b1d0f');
    el.fillColor.value = normalizeColor(sel.style.background === 'transparent' ? '#ffffff' : sel.style.background || '#ffffff');
    el.opacity.value = Math.round((sel.opacity || 1) * 100);
    el.rotation.value = sel.rotation || 0;
  } else {
    el.textContent.value = '';
  }

  renderPicker();
  saveState();
}

function normalizeColor(value) {
  if (!value || value === 'transparent') return '#ffffff';
  const s = new Option().style;
  s.color = value;
  return s.color.startsWith('rgb') ? rgbToHex(s.color) : value;
}

function rgbToHex(rgb) {
  const m = rgb.match(/\d+/g);
  if (!m) return '#ffffff';
  return '#' + m.slice(0, 3).map(v => Number(v).toString(16).padStart(2, '0')).join('');
}

function bindElementInteractions(node, item) {
  node.addEventListener('mousedown', startMoveOrResize);
  node.addEventListener('click', (event) => {
    event.stopPropagation();
    state.selectedId = item.id;
    renderCanvas();
  });
  node.addEventListener('dblclick', () => {
    state.selectedId = item.id;
    if (item.type !== 'image' && item.type !== 'shape') {
      const next = prompt('Modifier le texte', item.text || '');
      if (next !== null) {
        item.text = next;
        renderCanvas();
      }
    }
  });
}

function startMoveOrResize(event) {
  const target = event.currentTarget;
  const id = target.dataset.id;
  const item = currentElements().find(e => e.id === id);
  if (!item) return;
  state.selectedId = id;

  const canvasRect = el.canvas.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const start = { x: item.x, y: item.y, w: item.w, h: item.h };
  const handle = event.target.closest('.resize-handle');
  const dir = handle?.dataset.dir || null;

  const onMove = (ev) => {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;

    if (!dir) {
      item.x = clamp(snap(start.x + dx), 0, canvasRect.width - item.w);
      item.y = clamp(snap(start.y + dy), 0, canvasRect.height - item.h);
      renderCanvas();
      return;
    }

    let nextX = start.x;
    let nextY = start.y;
    let nextW = start.w;
    let nextH = start.h;
    const minW = item.type === 'shape' && ['circle', 'square'].includes(item.shapeKind) ? 24 : 22;
    const minH = minW;

    if (dir.includes('e')) nextW = start.w + dx;
    if (dir.includes('s')) nextH = start.h + dy;
    if (dir.includes('w')) {
      nextX = start.x + dx;
      nextW = start.w - dx;
    }
    if (dir.includes('n')) {
      nextY = start.y + dy;
      nextH = start.h - dy;
    }

    if (item.type === 'shape' && item.shapeKind === 'square') {
      const size = Math.max(minW, Math.max(nextW, nextH));
      if (dir.includes('w')) nextX = start.x + (start.w - size);
      if (dir.includes('n')) nextY = start.y + (start.h - size);
      nextW = size;
      nextH = size;
    }
    if (item.type === 'shape' && item.shapeKind === 'circle') {
      const size = Math.max(minW, Math.max(nextW, nextH));
      if (dir.includes('w')) nextX = start.x + (start.w - size);
      if (dir.includes('n')) nextY = start.y + (start.h - size);
      nextW = size;
      nextH = size;
      item.style.borderRadius = 999;
    }
    if (item.type === 'shape' && item.shapeKind === 'line') {
      nextH = 10;
      if (dir.includes('n')) nextY = start.y;
    }

    nextW = clamp(snap(nextW), minW, canvasRect.width);
    nextH = clamp(snap(nextH), minH, canvasRect.height);
    nextX = clamp(snap(nextX), 0, canvasRect.width - nextW);
    nextY = clamp(snap(nextY), 0, canvasRect.height - nextH);

    item.x = nextX;
    item.y = nextY;
    item.w = nextW;
    item.h = nextH;
    renderCanvas();
  };

  const onUp = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

function addElement(type, overrides = {}) {
  const list = currentElements();
  const topZ = list.length ? Math.max(...list.map(i => i.z)) + 1 : 1;
  const item = createElement(type, { z: topZ, ...overrides });
  list.push(item);
  state.selectedId = item.id;
  renderCanvas();
}

function addShapeFromLibrary(kind, x = 40, y = 40) {
  addElement('shape', { shapeKind: kind, x, y });
}

function createNewDeck() {
  state.deck = [buildCardFromTemplate(state.template, 1)];
  state.activeCardIndex = 0;
  state.activeFace = 'front';
  state.selectedId = null;
  renderCanvas();
}

function duplicateCards(count) {
  const source = currentCard();
  const currentCount = state.deck.length;
  const allowed = Math.min(count, MAX_CARDS - currentCount);
  for (let i = 0; i < allowed; i++) {
    const clone = deepClone(source);
    clone.id = uid('card');
    clone.name = `${source.name} copie ${i + 1}`;
    Object.values(clone.faces).forEach(face => face.forEach(elm => elm.id = uid(elm.type)));
    state.deck.push(clone);
  }
  state.activeCardIndex = state.deck.length - 1;
  state.selectedId = null;
  renderCanvas();
  if (count > allowed) alert(`Limite atteinte : ${MAX_CARDS} cartes maximum.`);
}

function cloneCurrentCard() { duplicateCards(1); }

function deleteCurrentCard() {
  if (state.deck.length === 1) return alert('Il doit rester au moins une carte.');
  state.deck.splice(state.activeCardIndex, 1);
  state.activeCardIndex = Math.max(0, state.activeCardIndex - 1);
  state.selectedId = null;
  renderCanvas();
}

function resetCurrentToTemplate() {
  const index = state.activeCardIndex;
  const name = currentCard().name;
  state.deck[index] = buildCardFromTemplate(state.template, index + 1);
  state.deck[index].name = name;
  state.selectedId = null;
  renderCanvas();
}

function clearFace() {
  currentCard().faces[state.activeFace] = [];
  state.selectedId = null;
  renderCanvas();
}

function updateSelected(mutator) {
  const sel = selectedElement();
  if (!sel) return;
  mutator(sel);
  renderCanvas();
}

function uploadImages(files) {
  [...files].forEach(file => {
    const reader = new FileReader();
    reader.onload = () => addElement('image', { src: reader.result, x: 40, y: 90, w: 220, h: 160 });
    reader.readAsDataURL(file);
  });
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cardforge-deck.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported.deck) || !imported.deck.length) throw new Error('deck absent');
      Object.assign(state, imported);
      state.activeCardIndex = 0;
      state.activeFace = 'front';
      state.selectedId = null;
      renderCanvas();
    } catch {
      alert('Fichier JSON invalide.');
    }
  };
  reader.readAsText(file);
}

function preparePrintDeck() {
  document.getElementById('printDeck')?.remove();
  const container = document.createElement('div');
  container.id = 'printDeck';
  container.style.display = 'none';

  const makePrintCard = (card, faceName) => {
    const face = card.faces[faceName].slice().sort(sortByZ);
    const cardEl = document.createElement('div');
    cardEl.className = 'print-card';
    cardEl.style.background = faceName === 'front' ? card.frontBg : card.backBg;

    renderPirateDecor(cardEl, card);

    face.forEach(item => {
      const node = document.createElement('div');
      node.className = `print-element ${item.type}`;
      node.dataset.shapeKind = item.shapeKind || '';
      node.style.left = `${item.x / 3.4}mm`;
      node.style.top = `${item.y / 3.4}mm`;
      node.style.width = `${item.w / 3.4}mm`;
      node.style.height = `${item.h / 3.4}mm`;
      node.style.opacity = item.opacity;
      node.style.transform = `rotate(${item.rotation}deg)`;
      node.style.fontFamily = item.style.fontFamily;
      node.style.fontSize = `${Math.max(2.2, item.style.fontSize / 3.4)}mm`;
      node.style.color = item.style.color;
      node.style.background = item.style.background;
      node.style.textAlign = item.style.textAlign;
      node.style.borderRadius = `${(item.style.borderRadius || 0) / 3.4}mm`;
      node.style.border = item.style.border || 'none';
      node.style.padding = `${(item.style.padding || 0) / 3.4}mm`;
      node.style.fontWeight = item.style.fontWeight || 400;
      if (item.type === 'shape' && ['circle', 'ellipse'].includes(item.shapeKind)) node.style.borderRadius = '999mm';
      if (item.type === 'shape' && item.shapeKind === 'line') {
        node.style.background = 'transparent';
        node.style.borderWidth = '0 0 0.7mm 0';
      }
      if (item.type === 'shape' && item.shapeKind === 'banner') {
        node.style.clipPath = 'polygon(0 0, 100% 0, 89% 50%, 100% 100%, 0 100%, 11% 50%)';
      }
      if (item.type === 'image') node.innerHTML = `<img alt="image" src="${item.src}">`;
      else if (item.type !== 'shape') node.textContent = item.text || '';
      cardEl.appendChild(node);
    });

    return cardEl;
  };

  state.deck.forEach(card => container.appendChild(makePrintCard(card, 'front')));
  const pageBreak = document.createElement('div');
  pageBreak.className = 'print-page-break';
  container.appendChild(pageBreak);
  state.deck.forEach(card => container.appendChild(makePrintCard(card, 'back')));
  document.body.appendChild(container);
}

function exportPdf() {
  preparePrintDeck();
  window.print();
}

function setupShapeDragAndDrop() {
  el.shapeLibrary.querySelectorAll('.shape-chip').forEach(chip => {
    chip.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', chip.dataset.shape);
      event.dataTransfer.effectAllowed = 'copy';
    });
    chip.addEventListener('click', () => addShapeFromLibrary(chip.dataset.shape, 40, 40));
  });

  el.canvas.addEventListener('dragover', (event) => {
    event.preventDefault();
    el.canvas.classList.add('drop-target');
    event.dataTransfer.dropEffect = 'copy';
  });
  el.canvas.addEventListener('dragleave', () => el.canvas.classList.remove('drop-target'));
  el.canvas.addEventListener('drop', (event) => {
    event.preventDefault();
    el.canvas.classList.remove('drop-target');
    const shape = event.dataTransfer.getData('text/plain');
    if (!shape) return;
    const rect = el.canvas.getBoundingClientRect();
    addShapeFromLibrary(shape, clamp(event.clientX - rect.left - 60, 0, rect.width - 20), clamp(event.clientY - rect.top - 40, 0, rect.height - 20));
  });

  el.canvas.addEventListener('click', (event) => {
    if (event.target === el.canvas) {
      state.selectedId = null;
      renderCanvas();
    }
  });
}

function bindControls() {
  el.templateBtns.forEach(btn => btn.addEventListener('click', () => { state.template = btn.dataset.template; renderCanvas(); }));
  el.faceBtns.forEach(btn => btn.addEventListener('click', () => { state.activeFace = btn.dataset.face; state.selectedId = null; renderCanvas(); }));
  el.newDeckBtn.addEventListener('click', createNewDeck);
  el.duplicateBtn.addEventListener('click', () => duplicateCards(Number(el.batchCount.value) || 1));
  el.cloneCardBtn.addEventListener('click', cloneCurrentCard);
  el.deleteCardBtn.addEventListener('click', deleteCurrentCard);
  el.prevCardBtn.addEventListener('click', () => { state.activeCardIndex = Math.max(0, state.activeCardIndex - 1); state.selectedId = null; renderCanvas(); });
  el.nextCardBtn.addEventListener('click', () => { state.activeCardIndex = Math.min(state.deck.length - 1, state.activeCardIndex + 1); state.selectedId = null; renderCanvas(); });
  el.cardPicker.addEventListener('change', () => { state.activeCardIndex = Number(el.cardPicker.value); state.selectedId = null; renderCanvas(); });
  el.addTitleBtn.addEventListener('click', () => addElement('title'));
  el.addTextBtn.addEventListener('click', () => addElement('text'));
  el.addImageBtn.addEventListener('click', () => el.imageUpload.click());
  el.addBadgeBtn.addEventListener('click', () => addElement('badge'));
  el.addShapeBtn.addEventListener('click', () => addElement('shape'));
  el.toggleGridBtn.addEventListener('click', () => { state.showGrid = !state.showGrid; renderCanvas(); });
  el.imageUpload.addEventListener('change', () => uploadImages(el.imageUpload.files));
  el.textContent.addEventListener('input', () => updateSelected(sel => sel.text = el.textContent.value));
  el.fontFamily.addEventListener('change', () => updateSelected(sel => sel.style.fontFamily = el.fontFamily.value));
  el.fontSize.addEventListener('input', () => updateSelected(sel => sel.style.fontSize = Number(el.fontSize.value)));
  el.textColor.addEventListener('input', () => updateSelected(sel => {
    if (sel.type === 'shape') sel.style.border = `2px solid ${el.textColor.value}`;
    else sel.style.color = el.textColor.value;
  }));
  el.fillColor.addEventListener('input', () => updateSelected(sel => sel.style.background = el.fillColor.value));
  el.opacity.addEventListener('input', () => updateSelected(sel => sel.opacity = Number(el.opacity.value) / 100));
  el.rotation.addEventListener('input', () => updateSelected(sel => sel.rotation = Number(el.rotation.value)));
  el.alignLeftBtn.addEventListener('click', () => updateSelected(sel => sel.style.textAlign = 'left'));
  el.alignCenterBtn.addEventListener('click', () => updateSelected(sel => sel.style.textAlign = 'center'));
  el.alignRightBtn.addEventListener('click', () => updateSelected(sel => sel.style.textAlign = 'right'));
  el.bringFrontBtn.addEventListener('click', () => updateSelected(sel => sel.z = Math.max(...currentElements().map(i => i.z), 0) + 1));
  el.sendBackBtn.addEventListener('click', () => updateSelected(sel => sel.z = Math.min(...currentElements().map(i => i.z), 1) - 1));
  el.cardNameInput.addEventListener('input', () => { currentCard().name = el.cardNameInput.value || 'Carte sans nom'; renderCanvas(); });
  el.frontBgColor.addEventListener('input', () => { currentCard().frontBg = el.frontBgColor.value; renderCanvas(); });
  el.backBgColor.addEventListener('input', () => { currentCard().backBg = el.backBgColor.value; renderCanvas(); });
  el.clearFaceBtn.addEventListener('click', clearFace);
  el.resetTemplateBtn.addEventListener('click', resetCurrentToTemplate);
  el.saveBtn.addEventListener('click', saveState);
  el.exportJsonBtn.addEventListener('click', exportJson);
  el.importJsonBtn.addEventListener('click', () => el.jsonUpload.click());
  el.jsonUpload.addEventListener('change', () => importJson(el.jsonUpload.files[0]));
  el.exportPdfBtn.addEventListener('click', exportPdf);

  window.addEventListener('keydown', (event) => {
    if ((event.key === 'Delete' || event.key === 'Backspace') && state.selectedId && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
      currentCard().faces[state.activeFace] = currentElements().filter(item => item.id !== state.selectedId);
      state.selectedId = null;
      renderCanvas();
    }
  });
}

loadState();
bindControls();
setupShapeDragAndDrop();
renderCanvas();
