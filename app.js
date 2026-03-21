
const CARD_W_MM = 63;
const CARD_H_MM = 88;
const MAX_CARDS = 100;
const PX_PER_MM = 3.7795275591;

const state = {
  projectName: 'Mon projet de cartes',
  currentCardId: null,
  currentSide: 'front',
  selectedElementId: null,
  pendingImage: null,
  cards: []
};

const els = {
  cardStage: document.getElementById('cardStage'),
  cardList: document.getElementById('cardList'),
  viewSide: document.getElementById('viewSide'),
  projectName: document.getElementById('projectName'),
  imageUpload: document.getElementById('imageUpload'),
  printSheet: document.getElementById('printSheet'),
  emptySelection: document.getElementById('emptySelection'),
  properties: document.getElementById('properties'),
  propText: document.getElementById('propText'),
  propFont: document.getElementById('propFont'),
  propFontSize: document.getElementById('propFontSize'),
  propColor: document.getElementById('propColor'),
  propFill: document.getElementById('propFill'),
  propStroke: document.getElementById('propStroke'),
  propStrokeWidth: document.getElementById('propStrokeWidth'),
  cardListItemTemplate: document.getElementById('cardListItemTemplate')
};

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function mm(v) { return `${v}mm`; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function defaultCard(template = 'blank', index = 1) {
  const base = {
    id: uid('card'),
    name: `Carte ${index}`,
    template,
    sides: { front: [], back: [] }
  };
  if (template === 'pirate') {
    base.sides.front.push(
      textElement('Capitaine des mers', 8, 5.2, 47, 7, {
        fontFamily: 'Cinzel, serif', fontSize: 16, color: '#f7e8c3', z: 10
      }),
      imageElement('', 8, 16, 47, 30, { z: 4 }),
      textElement('Écrivez ici le texte de votre carte pirate...', 8, 61.5, 47, 18, {
        fontFamily: "'EB Garamond', serif", fontSize: 12, color: '#4a2f10', z: 7
      })
    );
    base.sides.back.push(
      textElement('Verso', 12, 38, 39, 8, {
        fontFamily: 'Cinzel, serif', fontSize: 20, color: '#f7e8c3', z: 10
      })
    );
  }
  return base;
}

function baseStyle(extra = {}) {
  return {
    x: 8, y: 8, w: 18, h: 10,
    rotation: 0,
    fontFamily: 'Inter, sans-serif',
    fontSize: 12,
    color: '#111111',
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 0,
    opacity: 1,
    z: 1,
    ...extra
  };
}

function textElement(text, x, y, w, h, style = {}) {
  return { id: uid('el'), type: 'text', text, style: baseStyle({ x, y, w, h, fill: 'transparent', ...style }) };
}
function imageElement(src, x, y, w, h, style = {}) {
  return { id: uid('el'), type: 'image', src, style: baseStyle({ x, y, w, h, fill: 'transparent', ...style }) };
}
function shapeElement(type, x, y, w, h, style = {}) {
  return { id: uid('el'), type, style: baseStyle({ x, y, w, h, fill: '#d9d9d9', stroke: '#444444', strokeWidth: 0.4, ...style }) };
}

function getCurrentCard() {
  return state.cards.find(c => c.id === state.currentCardId) || null;
}

function getCurrentSideElements() {
  const card = getCurrentCard();
  return card ? card.sides[state.currentSide] : [];
}

function getSelectedElement() {
  return getCurrentSideElements().find(el => el.id === state.selectedElementId) || null;
}

function init() {
  bindUI();
  state.cards.push(defaultCard('blank', 1));
  state.currentCardId = state.cards[0].id;
  renderAll();
}

function bindUI() {
  document.getElementById('templateBlank').addEventListener('click', () => addCard('blank'));
  document.getElementById('templatePirate').addEventListener('click', () => addCard('pirate'));
  document.getElementById('addCard').addEventListener('click', () => addCard(getCurrentCard()?.template || 'blank'));
  document.getElementById('duplicateCard').addEventListener('click', duplicateCard);
  document.getElementById('deleteCard').addEventListener('click', deleteCard);
  document.getElementById('exportPdf').addEventListener('click', exportPdf);
  els.viewSide.addEventListener('change', e => {
    state.currentSide = e.target.value;
    state.selectedElementId = null;
    renderAll();
  });
  els.projectName.addEventListener('input', e => state.projectName = e.target.value);
  els.imageUpload.addEventListener('change', onImageUpload);

  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => addElement(btn.dataset.add));
  });

  els.propText.addEventListener('input', () => updateSelected(el => {
    if ('text' in el) el.text = els.propText.value;
  }));
  els.propFont.addEventListener('change', () => updateSelected(el => el.style.fontFamily = els.propFont.value));
  els.propFontSize.addEventListener('input', () => updateSelected(el => el.style.fontSize = Number(els.propFontSize.value || 12)));
  els.propColor.addEventListener('input', () => updateSelected(el => el.style.color = els.propColor.value));
  els.propFill.addEventListener('input', () => updateSelected(el => el.style.fill = els.propFill.value));
  els.propStroke.addEventListener('input', () => updateSelected(el => el.style.stroke = els.propStroke.value));
  els.propStrokeWidth.addEventListener('input', () => updateSelected(el => el.style.strokeWidth = Number(els.propStrokeWidth.value || 0)));

  document.getElementById('deleteElement').addEventListener('click', deleteSelectedElement);
  document.getElementById('copyElement').addEventListener('click', duplicateSelectedElement);
  document.getElementById('bringFront').addEventListener('click', () => shiftZ(1));
  document.getElementById('sendBack').addEventListener('click', () => shiftZ(-1));
}

function addCard(template) {
  if (state.cards.length >= MAX_CARDS) return;
  const card = defaultCard(template, state.cards.length + 1);
  state.cards.push(card);
  state.currentCardId = card.id;
  state.selectedElementId = null;
  renderAll();
}

function duplicateCard() {
  const card = getCurrentCard();
  if (!card || state.cards.length >= MAX_CARDS) return;
  const copy = JSON.parse(JSON.stringify(card));
  copy.id = uid('card');
  copy.name = `${card.name} copie`;
  ['front','back'].forEach(side => copy.sides[side].forEach(el => el.id = uid('el')));
  state.cards.push(copy);
  state.currentCardId = copy.id;
  state.selectedElementId = null;
  renderAll();
}

function deleteCard() {
  if (state.cards.length <= 1) return;
  const idx = state.cards.findIndex(c => c.id === state.currentCardId);
  if (idx === -1) return;
  state.cards.splice(idx, 1);
  state.currentCardId = state.cards[Math.max(0, idx - 1)].id;
  state.selectedElementId = null;
  renderAll();
}

function addElement(type) {
  const items = getCurrentSideElements();
  if (!items) return;
  let el;
  switch (type) {
    case 'title': el = textElement('Nouveau titre', 8, 8, 35, 8, { fontFamily: 'Cinzel, serif', fontSize: 18, fill: 'transparent', z: 10 }); break;
    case 'text': el = textElement('Votre texte', 8, 20, 40, 12, { fill: 'transparent', z: 10 }); break;
    case 'image': el = imageElement(state.pendingImage || '', 8, 18, 30, 24, { z: 8 }); break;
    case 'rect': el = shapeElement('rect', 10, 16, 18, 12, { z: 5 }); break;
    case 'square': el = shapeElement('square', 10, 16, 16, 16, { z: 5 }); break;
    case 'circle': el = shapeElement('circle', 10, 16, 16, 16, { z: 5 }); break;
    case 'ellipse': el = shapeElement('ellipse', 10, 16, 22, 14, { z: 5 }); break;
    case 'line': el = shapeElement('line', 10, 16, 26, 1.2, { z: 5 }); break;
    default: return;
  }
  items.push(el);
  state.selectedElementId = el.id;
  renderAll();
}

function onImageUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { state.pendingImage = reader.result; };
  reader.readAsDataURL(file);
}

function renderAll() {
  renderCardList();
  renderStage();
  renderProperties();
}

function renderCardList() {
  els.cardList.innerHTML = '';
  state.cards.forEach(card => {
    const node = els.cardListItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector('.card-name').textContent = card.name;
    node.querySelector('.card-template').textContent = card.template;
    if (card.id === state.currentCardId) node.classList.add('active');
    node.addEventListener('click', () => {
      state.currentCardId = card.id;
      state.selectedElementId = null;
      renderAll();
    });
    els.cardList.appendChild(node);
  });
}

function createCanvas(card, side, interactive = true) {
  const canvas = document.createElement('div');
  canvas.className = `card-canvas ${card.template}`;
  if (card.template === 'pirate') {
    canvas.appendChild(makeDiv('pirate-overlay'));
    canvas.appendChild(makeDiv('pirate-title-bar'));
    canvas.appendChild(makeDiv('pirate-parchment'));
    ['tl','tr','bl','br'].forEach(pos => {
      const c = makeDiv(`pirate-corner ${pos}`);
      canvas.appendChild(c);
    });
  }
  const elements = [...card.sides[side]].sort((a, b) => a.style.z - b.style.z);
  elements.forEach(el => canvas.appendChild(renderElement(el, interactive)));
  if (interactive) {
    canvas.addEventListener('pointerdown', (e) => {
      if (e.target === canvas) {
        state.selectedElementId = null;
        renderProperties();
        renderStage();
      }
    });
  }
  return canvas;
}

function renderStage() {
  els.cardStage.innerHTML = '';
  const card = getCurrentCard();
  if (!card) return;
  els.cardStage.appendChild(createCanvas(card, state.currentSide, true));
}

function renderElement(el, interactive) {
  const node = document.createElement('div');
  node.className = `element ${elementClass(el)}`;
  if (el.id === state.selectedElementId && interactive) node.classList.add('selected');
  applyStyle(node, el);

  if (el.type === 'text') {
    node.textContent = el.text;
  } else if (el.type === 'image') {
    if (el.src) {
      const img = document.createElement('img');
      img.src = el.src;
      node.appendChild(img);
    } else {
      node.textContent = 'Image';
      node.style.display = 'flex';
      node.style.alignItems = 'center';
      node.style.justifyContent = 'center';
      node.style.color = '#555';
      node.style.background = 'rgba(255,255,255,.45)';
    }
  }

  if (interactive) {
    node.addEventListener('pointerdown', (e) => startDragElement(e, el.id));
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.addEventListener('pointerdown', (e) => startResizeElement(e, el.id));
    node.appendChild(handle);
  }
  return node;
}

function elementClass(el) {
  switch (el.type) {
    case 'text': return 'text-element';
    case 'image': return 'image-element';
    case 'rect': return 'shape-rect';
    case 'square': return 'shape-square';
    case 'circle': return 'shape-circle';
    case 'ellipse': return 'shape-ellipse';
    case 'line': return 'shape-line';
    default: return '';
  }
}

function applyStyle(node, el) {
  const s = el.style;
  node.style.left = mm(s.x);
  node.style.top = mm(s.y);
  node.style.width = mm(s.w);
  node.style.height = mm(s.h);
  node.style.opacity = s.opacity;
  node.style.zIndex = s.z;
  node.style.transform = `rotate(${s.rotation}deg)`;
  node.style.color = s.color;
  node.style.background = s.fill;
  node.style.border = `${s.strokeWidth}mm solid ${s.stroke}`;
  node.style.fontFamily = s.fontFamily;
  node.style.fontSize = `${s.fontSize / 3.2}mm`;
  if (el.type === 'line') node.style.borderTop = `${Math.max(0.5, s.strokeWidth || 0.6)}mm solid ${s.stroke}`;
  if (el.type === 'line') node.style.border = 'none';
}

function updateSelected(mutator) {
  const el = getSelectedElement();
  if (!el) return;
  mutator(el);
  renderAll();
}

function renderProperties() {
  const el = getSelectedElement();
  const has = Boolean(el);
  els.emptySelection.classList.toggle('hidden', has);
  els.properties.classList.toggle('hidden', !has);
  if (!has) return;
  els.propText.parentElement.classList.toggle('hidden', !('text' in el));
  if ('text' in el) els.propText.value = el.text;
  els.propFont.value = el.style.fontFamily;
  els.propFontSize.value = el.style.fontSize;
  els.propColor.value = normalizeColor(el.style.color);
  els.propFill.value = normalizeColor(el.style.fill === 'transparent' ? '#ffffff' : el.style.fill);
  els.propStroke.value = normalizeColor(el.style.stroke);
  els.propStrokeWidth.value = el.style.strokeWidth;
}

function normalizeColor(v) {
  if (!v || v === 'transparent') return '#ffffff';
  return v;
}

function startDragElement(e, elementId) {
  if (e.target.classList.contains('resize-handle')) return;
  e.preventDefault();
  state.selectedElementId = elementId;
  renderProperties();
  renderStage();
  const el = getSelectedElement();
  const canvas = els.cardStage.querySelector('.card-canvas');
  if (!el || !canvas) return;
  const startX = e.clientX;
  const startY = e.clientY;
  const startPos = { x: el.style.x, y: el.style.y };
  const scale = getPreviewScale(canvas);

  function move(ev) {
    const dx = (ev.clientX - startX) / PX_PER_MM / scale;
    const dy = (ev.clientY - startY) / PX_PER_MM / scale;
    el.style.x = clamp(startPos.x + dx, 0, CARD_W_MM - el.style.w);
    el.style.y = clamp(startPos.y + dy, 0, CARD_H_MM - el.style.h);
    renderStage();
  }
  function up() {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    renderAll();
  }
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function startResizeElement(e, elementId) {
  e.preventDefault();
  e.stopPropagation();
  state.selectedElementId = elementId;
  renderProperties();
  renderStage();
  const el = getSelectedElement();
  const canvas = els.cardStage.querySelector('.card-canvas');
  if (!el || !canvas) return;
  const startX = e.clientX;
  const startY = e.clientY;
  const start = { w: el.style.w, h: el.style.h };
  const scale = getPreviewScale(canvas);

  function move(ev) {
    let dw = (ev.clientX - startX) / PX_PER_MM / scale;
    let dh = (ev.clientY - startY) / PX_PER_MM / scale;
    let newW = Math.max(4, start.w + dw);
    let newH = Math.max(4, start.h + dh);

    if (el.type === 'square' || el.type === 'circle') {
      const side = Math.max(newW, newH);
      newW = side; newH = side;
    }
    if (el.type === 'line') {
      newH = 1.2;
    }

    el.style.w = clamp(newW, 2, CARD_W_MM - el.style.x);
    el.style.h = clamp(newH, 1.2, CARD_H_MM - el.style.y);
    renderStage();
  }
  function up() {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    renderAll();
  }
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function getPreviewScale(canvas) {
  const matrix = new DOMMatrixReadOnly(getComputedStyle(canvas).transform);
  return matrix.a || 1;
}

function deleteSelectedElement() {
  const items = getCurrentSideElements();
  const idx = items.findIndex(el => el.id === state.selectedElementId);
  if (idx === -1) return;
  items.splice(idx, 1);
  state.selectedElementId = null;
  renderAll();
}

function duplicateSelectedElement() {
  const el = getSelectedElement();
  const items = getCurrentSideElements();
  if (!el || !items) return;
  const copy = JSON.parse(JSON.stringify(el));
  copy.id = uid('el');
  copy.style.x = clamp(copy.style.x + 2, 0, CARD_W_MM - copy.style.w);
  copy.style.y = clamp(copy.style.y + 2, 0, CARD_H_MM - copy.style.h);
  items.push(copy);
  state.selectedElementId = copy.id;
  renderAll();
}

function shiftZ(amount) {
  updateSelected(el => el.style.z = Math.max(1, el.style.z + amount));
}

function makeDiv(className) {
  const d = document.createElement('div');
  d.className = className;
  return d;
}

function exportPdf() {
  buildPrintSheet();
  window.print();
}

function buildPrintSheet() {
  els.printSheet.innerHTML = '';

  const fronts = state.cards.map(card => createPrintCard(card, 'front'));
  const backs = state.cards.map(card => createPrintCard(card, 'back'));

  chunk(fronts, 9).forEach(group => els.printSheet.appendChild(createSheetPage(group)));
  if (backs.some(Boolean)) {
    chunk(backs, 9).forEach(group => els.printSheet.appendChild(createSheetPage(group)));
  }
}

function createPrintCard(card, side) {
  const wrap = document.createElement('div');
  wrap.className = 'print-card';
  wrap.appendChild(createCanvas(card, side, false));
  const canvas = wrap.firstElementChild;
  canvas.style.position = 'relative';
  canvas.style.left = '0';
  canvas.style.top = '0';
  canvas.style.transform = 'none';
  canvas.style.boxShadow = 'none';
  return wrap;
}

function createSheetPage(cards) {
  const page = document.createElement('section');
  page.className = 'sheet-page';
  cards.forEach(card => page.appendChild(card));
  return page;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

init();

