const STORAGE_KEY = 'cardforge-studio-v1';
const MAX_CARDS = 100;
const GRID_SIZE = 12;

const state = {
  template: 'blank',
  activeCardIndex: 0,
  activeFace: 'front',
  selectedId: null,
  showGrid: false,
  deck: []
};

const el = {
  canvas: document.getElementById('cardCanvas'),
  templateBtns: document.querySelectorAll('.template-btn'),
  faceBtns: document.querySelectorAll('.face-btn'),
  cardPicker: document.getElementById('cardPicker'),
  batchCount: document.getElementById('batchCount'),
  textContent: document.getElementById('textContent'),
  fontFamily: document.getElementById('fontFamily'),
  fontSize: document.getElementById('fontSize'),
  textColor: document.getElementById('textColor'),
  fillColor: document.getElementById('fillColor'),
  opacity: document.getElementById('opacity'),
  rotation: document.getElementById('rotation'),
  workspaceTitle: document.getElementById('workspaceTitle'),
  workspaceMeta: document.getElementById('workspaceMeta'),
  cardNameInput: document.getElementById('cardNameInput'),
  frontBgColor: document.getElementById('frontBgColor'),
  backBgColor: document.getElementById('backBgColor'),
  imageUpload: document.getElementById('imageUpload'),
  jsonUpload: document.getElementById('jsonUpload')
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
      style: { background: '#f5e2ad', border: '2px solid rgba(71,43,17,0.55)', borderRadius: 18, padding: 8 }
    }
  };

  return {
    ...base,
    ...(presets[type] || {}),
    ...overrides,
    style: {
      ...base.style,
      ...((presets[type] || {}).style || {}),
      ...(overrides.style || {})
    }
  };
}

function pirateTemplateCard(index = 1) {
  const card = blankCard(index);
  card.template = 'pirate';
  card.frontBg = '#e7d1a3';
  card.backBg = '#d8c08f';
  card.faces.front = [
    createElement('title', { text: 'Nom de la carte', x: 35, y: 20, w: 260, h: 46, z: 3, style: { color: '#4c2a08', fontFamily: 'Georgia', fontSize: 28, textAlign: 'center' } }),
    createElement('image', { x: 35, y: 78, w: 260, h: 200, z: 2 }),
    createElement('shape', { x: 28, y: 290, w: 274, h: 120, z: 1, style: { background: '#f3dfaa', border: '2px solid rgba(92,56,21,0.5)', borderRadius: 18, padding: 12 } }),
    createElement('text', { text: 'Description, effet, histoire ou règle de la carte.', x: 42, y: 305, w: 248, h: 95, z: 3, style: { color: '#432612', fontFamily: 'Palatino Linotype', fontSize: 17, background: 'transparent', textAlign: 'left' } }),
    createElement('badge', { text: '☠', x: 248, y: 18, w: 46, h: 46, z: 4, style: { background: '#8b5a2b', color: '#fff2c9', fontSize: 24 } })
  ];
  card.faces.back = [
    createElement('title', { text: 'Verso', x: 55, y: 36, w: 220, h: 50, z: 2, style: { fontSize: 30, color: '#4c2a08' } }),
    createElement('shape', { x: 42, y: 110, w: 246, h: 240, z: 1, style: { background: '#efd69a', border: '3px solid rgba(92,56,21,0.5)', borderRadius: 24 } }),
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

function currentCard() {
  return state.deck[state.activeCardIndex];
}

function currentElements() {
  return currentCard().faces[state.activeFace];
}

function selectedElement() {
  return currentElements().find(elm => elm.id === state.selectedId) || null;
}

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

function renderPirateDecor() {
  if (currentCard().template !== 'pirate') return;
  const frame = document.createElement('div');
  frame.className = 'pirate-frame';
  el.canvas.appendChild(frame);
  ['tl', 'tr', 'bl', 'br'].forEach(pos => {
    const corner = document.createElement('div');
    corner.className = `pirate-corner ${pos}`;
    el.canvas.appendChild(corner);
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
      node.innerHTML = `<img alt="image carte" src="${item.src || ''}"><div class="resize-handle"></div>`;
    } else if (item.type === 'shape') {
      node.innerHTML = `<div class="resize-handle"></div>`;
    } else {
      node.prepend(document.createTextNode(item.text || '')); 
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
  return '#' + m.slice(0,3).map(v => Number(v).toString(16).padStart(2,'0')).join('');
}

function bindElementInteractions(node, item) {
  node.addEventListener('mousedown', startMoveOrResize);
  node.addEventListener('click', () => {
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
  const resizing = event.target.classList.contains('resize-handle');

  const onMove = (ev) => {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    if (resizing) {
      item.w = clamp(snap(start.w + dx), 28, canvasRect.width - item.x);
      item.h = clamp(snap(start.h + dy), 28, canvasRect.height - item.y);
    } else {
      item.x = clamp(snap(start.x + dx), 0, canvasRect.width - item.w);
      item.y = clamp(snap(start.y + dy), 0, canvasRect.height - item.h);
    }
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

function cloneCurrentCard() {
  duplicateCards(1);
}

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
    reader.onload = () => {
      addElement('image', { src: reader.result, x: 40, y: 90, w: 220, h: 160 });
    };
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

    if (card.template === 'pirate') {
      const frame = document.createElement('div');
      frame.className = 'pirate-frame';
      cardEl.appendChild(frame);
      ['tl','tr','bl','br'].forEach(pos => {
        const c = document.createElement('div');
        c.className = `pirate-corner ${pos}`;
        cardEl.appendChild(c);
      });
    }

    face.forEach(item => {
      const node = document.createElement('div');
      node.className = `print-element ${item.type}`;
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
      if (item.type === 'image') node.innerHTML = `<img alt="image" src="${item.src}">`;
      else node.textContent = item.text || '';
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

function bindControls() {
  el.templateBtns.forEach(btn => btn.addEventListener('click', () => {
    state.template = btn.dataset.template;
    renderCanvas();
  }));

  el.faceBtns.forEach(btn => btn.addEventListener('click', () => {
    state.activeFace = btn.dataset.face;
    state.selectedId = null;
    renderCanvas();
  }));

  document.getElementById('newDeckBtn').addEventListener('click', createNewDeck);
  document.getElementById('duplicateBtn').addEventListener('click', () => duplicateCards(Number(el.batchCount.value || 1)));
  document.getElementById('cloneCardBtn').addEventListener('click', cloneCurrentCard);
  document.getElementById('deleteCardBtn').addEventListener('click', deleteCurrentCard);
  document.getElementById('prevCardBtn').addEventListener('click', () => {
    state.activeCardIndex = Math.max(0, state.activeCardIndex - 1);
    state.selectedId = null;
    renderCanvas();
  });
  document.getElementById('nextCardBtn').addEventListener('click', () => {
    state.activeCardIndex = Math.min(state.deck.length - 1, state.activeCardIndex + 1);
    state.selectedId = null;
    renderCanvas();
  });
  el.cardPicker.addEventListener('change', () => {
    state.activeCardIndex = Number(el.cardPicker.value);
    state.selectedId = null;
    renderCanvas();
  });

  document.getElementById('addTitleBtn').addEventListener('click', () => addElement('title'));
  document.getElementById('addTextBtn').addEventListener('click', () => addElement('text'));
  document.getElementById('addImageBtn').addEventListener('click', () => el.imageUpload.click());
  document.getElementById('addBadgeBtn').addEventListener('click', () => addElement('badge'));
  document.getElementById('addShapeBtn').addEventListener('click', () => addElement('shape'));
  document.getElementById('toggleGridBtn').addEventListener('click', () => { state.showGrid = !state.showGrid; renderCanvas(); });
  el.imageUpload.addEventListener('change', () => uploadImages(el.imageUpload.files));

  el.textContent.addEventListener('input', () => updateSelected(sel => { sel.text = el.textContent.value; }));
  el.fontFamily.addEventListener('change', () => updateSelected(sel => { sel.style.fontFamily = el.fontFamily.value; }));
  el.fontSize.addEventListener('input', () => updateSelected(sel => { sel.style.fontSize = Number(el.fontSize.value); }));
  el.textColor.addEventListener('input', () => updateSelected(sel => { sel.style.color = el.textColor.value; }));
  el.fillColor.addEventListener('input', () => updateSelected(sel => { sel.style.background = el.fillColor.value; }));
  el.opacity.addEventListener('input', () => updateSelected(sel => { sel.opacity = Number(el.opacity.value) / 100; }));
  el.rotation.addEventListener('input', () => updateSelected(sel => { sel.rotation = Number(el.rotation.value); }));

  document.getElementById('alignLeftBtn').addEventListener('click', () => updateSelected(sel => { sel.style.textAlign = 'left'; }));
  document.getElementById('alignCenterBtn').addEventListener('click', () => updateSelected(sel => { sel.style.textAlign = 'center'; }));
  document.getElementById('alignRightBtn').addEventListener('click', () => updateSelected(sel => { sel.style.textAlign = 'right'; }));
  document.getElementById('bringFrontBtn').addEventListener('click', () => updateSelected(sel => { sel.z = Math.max(...currentElements().map(i => i.z)) + 1; }));
  document.getElementById('sendBackBtn').addEventListener('click', () => updateSelected(sel => { sel.z = 1; currentElements().forEach(i => { if (i.id !== sel.id) i.z += 1; }); }));

  el.cardNameInput.addEventListener('input', () => { currentCard().name = el.cardNameInput.value || `Carte ${state.activeCardIndex + 1}`; renderUiState(); });
  el.frontBgColor.addEventListener('input', () => { currentCard().frontBg = el.frontBgColor.value; applyCanvasBackground(); saveState(); });
  el.backBgColor.addEventListener('input', () => { currentCard().backBg = el.backBgColor.value; applyCanvasBackground(); saveState(); });

  document.getElementById('clearFaceBtn').addEventListener('click', clearFace);
  document.getElementById('resetTemplateBtn').addEventListener('click', resetCurrentToTemplate);
  document.getElementById('saveBtn').addEventListener('click', () => { saveState(); alert('Projet sauvegardé localement dans votre navigateur.'); });
  document.getElementById('exportJsonBtn').addEventListener('click', exportJson);
  document.getElementById('importJsonBtn').addEventListener('click', () => el.jsonUpload.click());
  el.jsonUpload.addEventListener('change', () => { if (el.jsonUpload.files[0]) importJson(el.jsonUpload.files[0]); });
  document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);

  el.canvas.addEventListener('click', (ev) => {
    if (ev.target === el.canvas) {
      state.selectedId = null;
      renderCanvas();
    }
  });
}

loadState();
bindControls();
renderCanvas();
