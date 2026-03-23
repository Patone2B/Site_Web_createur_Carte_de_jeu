const STORAGE_KEY = 'cardSetStudio.sets.v4';
const LEGACY_STORAGE_KEYS = ['cardSetStudio.sets.v3', 'cardSetStudio.sets.v2'];
const CARD_W = 252;
const CARD_H = 352;
const MIN_SIZE = 24;
const LINE_MIN_H = 8;

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
  migrateIfNeeded();
  bindEvents();
  renderHome();
  updateStorageEstimate();
}

function bindEvents() {
  el.createBlankSetBtn?.addEventListener('click', () => createNewSet('blank'));
  el.createPirateSetBtn?.addEventListener('click', () => createNewSet('pirate'));
  el.refreshSetsBtn?.addEventListener('click', renderHome);
  el.backHomeBtn?.addEventListener('click', () => {
    saveCurrentSet();
    showScreen('home');
  });
  el.saveSetBtn?.addEventListener('click', () => {
    saveCurrentSet();
    alert('Set sauvegardé localement.');
  });
  el.exportJsonBtn?.addEventListener('click', exportCurrentSetJson);
  el.printBtn?.addEventListener('click', () => window.print());
  el.addCardBtn?.addEventListener('click', addCard);
  el.duplicateCardBtn?.addEventListener('click', duplicateCard);
  el.deleteCardBtn?.addEventListener('click', deleteCard);
  el.toggleSideBtn?.addEventListener('click', toggleSide);
  el.applyStyleToAllBtn?.addEventListener('click', applyStyleToAllCards);

  el.setNameInput?.addEventListener('input', () => {
    const set = currentSet();
    if (!set) return;
    set.name = el.setNameInput.value.trim() || 'Set sans nom';
    touchSet(set, false);
    renderEditorMeta();
  });

  el.setStyleSelect?.addEventListener('change', () => {
    const set = currentSet();
    if (!set) return;
    set.style = el.setStyleSelect.value;
    touchSet(set);
    renderEditor();
  });

  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => addElement(btn.dataset.add));
  });

  el.imageInput?.addEventListener('change', handleImageSelected);
  el.propText?.addEventListener('input', () => updateSelectedElement('text', el.propText.value));
  el.propFont?.addEventListener('change', () => updateSelectedElement('fontFamily', el.propFont.value));
  el.propFontSize?.addEventListener('input', () => updateSelectedElement('fontSize', Number(el.propFontSize.value)));
  el.propColor?.addEventListener('input', () => updateSelectedElement('color', el.propColor.value));
  el.propBgColor?.addEventListener('input', () => updateSelectedElement('backgroundColor', el.propBgColor.value));
  el.propBorderColor?.addEventListener('input', () => updateSelectedElement('borderColor', el.propBorderColor.value));
  el.propBorderWidth?.addEventListener('input', () => updateSelectedElement('borderWidth', Number(el.propBorderWidth.value)));
  el.propOpacity?.addEventListener('input', () => updateSelectedElement('opacity', Number(el.propOpacity.value) / 100));
  el.propRotation?.addEventListener('input', () => updateSelectedElement('rotation', Number(el.propRotation.value)));
  el.propAlign?.addEventListener('change', () => updateSelectedElement('textAlign', el.propAlign.value));

  el.cloneElementBtn?.addEventListener('click', cloneSelectedElement);
  el.removeElementBtn?.addEventListener('click', removeSelectedElement);
  el.bringFrontBtn?.addEventListener('click', () => changeLayer(1));
  el.sendBackBtn?.addEventListener('click', () => changeLayer(-1));
  el.exportPngBtn?.addEventListener('click', () => exportVisibleCard('png'));
  el.exportJpegBtn?.addEventListener('click', () => exportVisibleCard('jpeg'));
  el.exportAllPngBtn?.addEventListener('click', exportAllCardsPng);
  el.importSetBtn?.addEventListener('click', () => el.importSetInput.click());
  el.importSetInput?.addEventListener('change', importSetFromFile);

  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', stopInteraction);
  document.addEventListener('keydown', onGlobalKeyDown);
}

function migrateIfNeeded() {
  if (localStorage.getItem(STORAGE_KEY)) {
    state.sets = normalizeSets(loadSets());
    saveSets();
    return;
  }

  for (const key of LEGACY_STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        state.sets = normalizeSets(parsed);
        saveSets();
        return;
      }
    } catch {
      // ignore invalid legacy payload
    }
  }

  state.sets = normalizeSets(state.sets);
  saveSets();
}

function loadSets() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
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
  info.textContent = `Espace occupé actuellement par les sets : environ ${kb} Ko. Le localStorage tourne souvent autour de 5 Mo selon le navigateur. Avec 100 cartes et beaucoup d’images intégrées, la limite peut arriver vite.`;
}

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function defaultSet(style = 'blank') {
  return normalizeSet({
    id: uid('set'),
    name: style === 'pirate' ? 'Nouveau set pirate' : 'Nouveau set vierge',
    style,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cards: [defaultCard(style)],
  });
}

function defaultCard(style = 'blank') {
  return normalizeCard({
    id: uid('card'),
    front: starterElements(style, 'front'),
    back: starterElements(style, 'back'),
  });
}

function starterElements(style, side) {
  if (style !== 'pirate') return [];

  if (side === 'front') {
    return [
      makeElement('title', { x: 26, y: 18, w: 200, h: 34, text: 'Titre de carte', fontFamily: 'Pirata One', fontSize: 24, color: '#5a381f', backgroundColor: 'transparent', borderWidth: 0, textAlign: 'center' }),
      makeElement('image', { x: 28, y: 62, w: 196, h: 148, src: '', placeholder: 'Image', borderWidth: 1, borderColor: '#866544' }),
      makeElement('banner', { x: 46, y: 220, w: 160, h: 28, text: 'Capitaine', fontFamily: 'Cinzel', fontSize: 16, color: '#fff9ec', backgroundColor: '#8a5a2b', borderColor: '#5b3f21', borderWidth: 2 }),
      makeElement('text', { x: 30, y: 262, w: 192, h: 56, text: 'Ajoutez ici la description pirate ou la capacité spéciale.', fontFamily: 'IM Fell English', fontSize: 16, color: '#4a2f1a', backgroundColor: 'transparent', borderWidth: 0 }),
    ];
  }

  return [
    makeElement('title', { x: 26, y: 34, w: 200, h: 34, text: 'Verso', fontFamily: 'Pirata One', fontSize: 26, color: '#5a381f', backgroundColor: 'transparent', borderWidth: 0, textAlign: 'center' }),
    makeElement('text', { x: 40, y: 112, w: 172, h: 120, text: 'Texte de verso, règles, rareté, notes ou effet.', fontFamily: 'Libre Baskerville', fontSize: 15, color: '#4a2f1a', backgroundColor: 'rgba(255,248,234,0.35)', borderColor: '#8f6a42', borderWidth: 1 }),
    makeElement('badge', { x: 76, y: 272, w: 100, h: 36, text: 'Trésor', fontFamily: 'Cinzel', fontSize: 16, color: '#fff9ec', backgroundColor: '#7a532a', borderColor: '#5b3f21', borderWidth: 2 }),
  ];
}

function makeElement(type, overrides = {}) {
  const shapeTypes = ['rect', 'square', 'circle', 'ellipse', 'badge', 'banner'];
  const base = {
    id: uid('el'),
    type,
    x: 34,
    y: 34,
    w: type === 'line' ? 140 : 120,
    h: type === 'title' ? 34 : type === 'text' ? 60 : type === 'line' ? 10 : 80,
    text: type === 'title' ? 'Titre' : type === 'text' ? 'Votre texte' : type === 'badge' ? 'Badge' : type === 'banner' ? 'Bannière' : '',
    fontFamily: type === 'title' ? 'Cinzel' : 'Inter',
    fontSize: type === 'title' ? 24 : 16,
    color: '#1f2937',
    backgroundColor: shapeTypes.includes(type) ? '#d6b66f' : 'transparent',
    borderColor: '#5b4630',
    borderWidth: type === 'image' ? 1 : shapeTypes.includes(type) ? 2 : 0,
    textAlign: type === 'title' ? 'center' : 'left',
    opacity: 1,
    rotation: 0,
    src: '',
    placeholder: 'Image',
    z: 1,
  };
  return normalizeElement({ ...base, ...overrides });
}

function normalizeSets(sets) {
  return (Array.isArray(sets) ? sets : []).map(normalizeSet).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

function normalizeSet(set) {
  const style = set?.style === 'pirate' ? 'pirate' : 'blank';
  const cards = Array.isArray(set?.cards) && set.cards.length ? set.cards.map(normalizeCard) : [defaultCard(style)];
  return {
    id: set?.id || uid('set'),
    name: set?.name || 'Set sans nom',
    style,
    createdAt: set?.createdAt || new Date().toISOString(),
    updatedAt: set?.updatedAt || new Date().toISOString(),
    cards,
  };
}

function normalizeCard(card) {
  return {
    id: card?.id || uid('card'),
    front: normalizeElements(card?.front),
    back: normalizeElements(card?.back),
  };
}

function normalizeElements(elements) {
  const list = (Array.isArray(elements) ? elements : []).map(normalizeElement);
  normalizeZ(list);
  return list;
}

function normalizeElement(item) {
  if (!item || typeof item !== 'object') return makeElement('rect');
  const type = item.type || 'rect';
  const fallback = makeElement(type);
  return {
    ...fallback,
    ...item,
    id: item.id || uid('el'),
    type,
    x: clamp(numberOr(item.x, fallback.x), 0, CARD_W - MIN_SIZE),
    y: clamp(numberOr(item.y, fallback.y), 0, CARD_H - MIN_SIZE),
    w: Math.max(type === 'line' ? MIN_SIZE : MIN_SIZE, numberOr(item.w, fallback.w)),
    h: Math.max(type === 'line' ? LINE_MIN_H : MIN_SIZE, numberOr(item.h, fallback.h)),
    fontSize: Math.max(8, numberOr(item.fontSize, fallback.fontSize)),
    borderWidth: Math.max(0, numberOr(item.borderWidth, fallback.borderWidth)),
    opacity: clamp(numberOr(item.opacity, fallback.opacity), 0.05, 1),
    rotation: numberOr(item.rotation, fallback.rotation),
    z: Math.max(1, numberOr(item.z, fallback.z)),
  };
}

function createNewSet(style) {
  const set = defaultSet(style);
  state.sets.unshift(set);
  openSet(set.id);
  saveSets();
}

function showScreen(name) {
  state.screen = name;
  el.homeScreen?.classList.toggle('active', name === 'home');
  el.editorScreen?.classList.toggle('active', name === 'editor');

  if (name === 'home') {
    renderHome();
  } else {
    renderEditor();
  }
}

function renderHome() {
  state.screen = 'home';
  el.homeScreen?.classList.add('active');
  el.editorScreen?.classList.remove('active');

  if (!el.savedSetsList) return;
  const sets = normalizeSets(state.sets);
  state.sets = sets;

  if (!sets.length) {
    el.savedSetsList.innerHTML = '<div class="empty-message">Aucun set sauvegardé pour le moment.</div>';
    return;
  }

  el.savedSetsList.innerHTML = sets.map(set => `
    <article class="saved-set-card">
      <div>
        <h3>${escapeHtml(set.name)}</h3>
        <p>Style : ${set.style === 'pirate' ? 'Pirate' : 'Vierge'} · ${set.cards.length} carte(s)</p>
        <p>Mis à jour : ${escapeHtml(formatDate(set.updatedAt))}</p>
      </div>
      <div class="stack-actions compact">
        <button class="primary small" data-open-set="${set.id}">Ouvrir</button>
        <button class="ghost small" data-export-set="${set.id}">JSON</button>
        <button class="ghost small" data-copy-set="${set.id}">Dupliquer</button>
        <button class="danger small" data-delete-set="${set.id}">Supprimer</button>
      </div>
    </article>
  `).join('');

  el.savedSetsList.querySelectorAll('[data-open-set]').forEach(btn => btn.addEventListener('click', () => openSet(btn.dataset.openSet)));
  el.savedSetsList.querySelectorAll('[data-export-set]').forEach(btn => btn.addEventListener('click', () => exportSetJsonById(btn.dataset.exportSet)));
  el.savedSetsList.querySelectorAll('[data-copy-set]').forEach(btn => btn.addEventListener('click', () => duplicateSet(btn.dataset.copySet)));
  el.savedSetsList.querySelectorAll('[data-delete-set]').forEach(btn => btn.addEventListener('click', () => deleteSet(btn.dataset.deleteSet)));
}

function renderEditor() {
  const set = currentSet();
  if (!set) return showScreen('home');

  el.homeScreen?.classList.remove('active');
  el.editorScreen?.classList.add('active');
  state.screen = 'editor';

  renderEditorMeta();
  renderCards();
  syncPropertiesPanel();
}

function renderEditorMeta() {
  const set = currentSet();
  if (!set) return;
  if (el.setNameInput) el.setNameInput.value = set.name;
  if (el.setStyleSelect) el.setStyleSelect.value = set.style;
  if (el.cardStats) {
    el.cardStats.innerHTML = `
      <div><strong>${set.cards.length}</strong> carte(s)</div>
      <div>Face affichée : <strong>${state.side === 'front' ? 'Recto' : 'Verso'}</strong></div>
      <div>Carte active : <strong>${state.selectedCardIndex + 1}</strong></div>
    `;
  }
  if (el.toggleSideBtn) {
    el.toggleSideBtn.textContent = state.side === 'front' ? 'Voir le verso' : 'Voir le recto';
  }
}

function renderCards() {
  const set = currentSet();
  if (!set || !el.pagesContainer) return;

  el.pagesContainer.innerHTML = set.cards.map((card, index) => {
    const selected = index === state.selectedCardIndex;
    const face = state.side === 'front' ? card.front : card.back;
    const styleClass = set.style === 'pirate' ? 'pirate' : 'blank';
    return `
      <section class="page-wrap" data-card-index="${index}">
        <div class="page-label">Carte ${index + 1}${selected ? ' · active' : ''} · ${state.side === 'front' ? 'Recto' : 'Verso'}</div>
        <div class="card-page">
          <div class="card-canvas ${styleClass}" data-canvas-card-index="${index}">
            ${set.style === 'pirate' ? pirateDecorHtml() : ''}
            ${renderElements(face, index)}
          </div>
        </div>
      </section>
    `;
  }).join('');

  bindCardDomEvents();
  renderEditorMeta();
}

function pirateDecorHtml() {
  return `
    <div class="pirate-decor-top">✦ Carte Pirate ✦</div>
    <div class="pirate-decor-bottom"><span>⚓</span><span>☠</span><span>⚓</span></div>
  `;
}

function renderElements(elements, cardIndex) {
  const sorted = [...elements].sort((a, b) => (a.z || 0) - (b.z || 0));
  return sorted.map(item => renderElement(item, cardIndex)).join('');
}

function renderElement(item, cardIndex) {
  const selected = cardIndex === state.selectedCardIndex && item.id === state.selectedElementId;
  const commonStyle = [
    `left:${item.x}px`,
    `top:${item.y}px`,
    `width:${item.w}px`,
    `height:${item.h}px`,
    `z-index:${item.z || 1}`,
    `transform:rotate(${item.rotation || 0}deg)`,
    `opacity:${item.opacity ?? 1}`,
    `color:${item.color || '#1f2937'}`,
  ].join(';');

  const borderWidth = item.borderWidth || 0;
  const borderColor = item.borderColor || '#5b4630';
  const bg = item.backgroundColor || 'transparent';
  const font = cssSafe(item.fontFamily || 'Inter');
  const fontSize = item.fontSize || 16;
  const textAlign = item.textAlign || 'left';

  const contentStyle = [
    `background:${bg}`,
    `border:${borderWidth}px solid ${borderColor}`,
    `font-family:${font}`,
    `font-size:${fontSize}px`,
    `text-align:${textAlign}`,
    styleForType(item),
  ].join(';');

  let inner = '';
  if (item.type === 'image') {
    inner = item.src
      ? `<img src="${escapeHtml(item.src)}" alt="Image" draggable="false" />`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:Inter, sans-serif;font-size:14px;color:#6b7280;background:#f6f1e5">${escapeHtml(item.placeholder || 'Image')}</div>`;
  } else if (item.type === 'line') {
    inner = `<div class="line-bar" style="height:${Math.max(1, borderWidth || 4)}px;background:${item.color || '#1f2937'}"></div>`;
  } else {
    inner = `<div style="width:100%;white-space:pre-wrap;word-break:break-word;">${escapeHtml(item.text || '')}</div>`;
  }

  const handles = selected
    ? ['nw', 'ne', 'sw', 'se'].map(dir => `<span class="resize-handle ${dir}" data-resize-dir="${dir}" data-card-index="${cardIndex}" data-element-id="${item.id}"></span>`).join('')
    : '';

  return `
    <div
      class="element ${item.type} ${selected ? 'selected' : ''}"
      data-card-index="${cardIndex}"
      data-element-id="${item.id}"
      style="${commonStyle}"
    >
      <div class="content" style="${contentStyle}">${inner}</div>
      ${handles}
    </div>
  `;
}

function styleForType(item) {
  switch (item.type) {
    case 'badge':
      return 'border-radius:999px;display:flex;align-items:center;justify-content:center;padding:6px 12px;';
    case 'rect':
    case 'square':
      return 'border-radius:0;';
    case 'circle':
    case 'ellipse':
      return 'border-radius:999px;';
    case 'banner':
      return 'display:flex;align-items:center;justify-content:center;padding:6px 10px;';
    case 'title':
      return 'padding:4px 6px;font-weight:700;';
    case 'text':
      return 'padding:6px;';
    case 'image':
      return 'padding:0;';
    default:
      return '';
  }
}

function bindCardDomEvents() {
  document.querySelectorAll('.card-canvas').forEach(canvas => {
    canvas.addEventListener('pointerdown', onCanvasPointerDown);
  });

  document.querySelectorAll('.element').forEach(node => {
    node.addEventListener('pointerdown', onElementPointerDown);
  });

  document.querySelectorAll('.resize-handle').forEach(node => {
    node.addEventListener('pointerdown', onResizeHandlePointerDown);
  });
}

function onCanvasPointerDown(e) {
  const canvas = e.currentTarget;
  const cardIndex = Number(canvas.dataset.canvasCardIndex);
  state.selectedCardIndex = cardIndex;

  if (e.target.closest('.element')) return;

  state.selectedElementId = null;
  renderEditor();
}

function onElementPointerDown(e) {
  const handle = e.target.closest('.resize-handle');
  if (handle) return;

  const node = e.currentTarget;
  const cardIndex = Number(node.dataset.cardIndex);
  const elementId = node.dataset.elementId;
  const item = getElementById(elementId, cardIndex);

  state.selectedCardIndex = cardIndex;
  if (!item) {
    state.selectedElementId = null;
    return renderEditor();
  }

  state.selectedElementId = elementId;
  state.drag = {
    mode: 'move',
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    cardIndex,
    elementId,
    start: { x: item.x, y: item.y, w: item.w, h: item.h },
  };

  node.setPointerCapture?.(e.pointerId);
  renderCards();
  syncPropertiesPanel();
  e.stopPropagation();
}

function onResizeHandlePointerDown(e) {
  const node = e.currentTarget;
  const cardIndex = Number(node.dataset.cardIndex);
  const elementId = node.dataset.elementId;
  const dir = node.dataset.resizeDir;
  const item = getElementById(elementId, cardIndex);
  if (!item) return;

  state.selectedCardIndex = cardIndex;
  state.selectedElementId = elementId;
  state.drag = {
    mode: 'resize',
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    cardIndex,
    elementId,
    dir,
    start: { x: item.x, y: item.y, w: item.w, h: item.h },
  };

  node.setPointerCapture?.(e.pointerId);
  e.stopPropagation();
  e.preventDefault();
}

function onPointerMove(e) {
  const drag = state.drag;
  if (!drag) return;
  if (drag.pointerId != null && e.pointerId !== drag.pointerId) return;

  const item = getElementById(drag.elementId, drag.cardIndex);
  if (!item) return;

  const dx = e.clientX - drag.startX;
  const dy = e.clientY - drag.startY;

  if (drag.mode === 'move') {
    item.x = clamp(drag.start.x + dx, 0, CARD_W - item.w);
    item.y = clamp(drag.start.y + dy, 0, CARD_H - item.h);
  }

  if (drag.mode === 'resize') {
    resizeItem(item, drag.start, drag.dir, dx, dy);
  }

  renderCards();
  syncPropertiesPanel();
}

function resizeItem(item, start, dir, dx, dy) {
  let x = start.x;
  let y = start.y;
  let w = start.w;
  let h = start.h;

  if (dir.includes('e')) w = start.w + dx;
  if (dir.includes('s')) h = start.h + dy;
  if (dir.includes('w')) {
    w = start.w - dx;
    x = start.x + dx;
  }
  if (dir.includes('n')) {
    h = start.h - dy;
    y = start.y + dy;
  }

  const minH = item.type === 'line' ? LINE_MIN_H : MIN_SIZE;
  w = Math.max(MIN_SIZE, w);
  h = Math.max(minH, h);

  if (x < 0) {
    w += x;
    x = 0;
  }
  if (y < 0) {
    h += y;
    y = 0;
  }

  if (x + w > CARD_W) w = CARD_W - x;
  if (y + h > CARD_H) h = CARD_H - y;

  item.x = clamp(x, 0, CARD_W - MIN_SIZE);
  item.y = clamp(y, 0, CARD_H - minH);
  item.w = Math.max(MIN_SIZE, w);
  item.h = Math.max(minH, h);
}

function stopInteraction() {
  if (!state.drag) return;
  touchSet(currentSet(), false);
  state.drag = null;
}

function onGlobalKeyDown(e) {
  const tag = document.activeElement?.tagName;
  const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
  if (isTyping) return;

  if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedElementId) {
    e.preventDefault();
    removeSelectedElement();
    return;
  }

  if (!state.selectedElementId) return;
  const item = getElementById(state.selectedElementId);
  if (!item) return;

  let moved = false;
  const step = e.shiftKey ? 10 : 1;
  switch (e.key) {
    case 'ArrowLeft':
      item.x = clamp(item.x - step, 0, CARD_W - item.w);
      moved = true;
      break;
    case 'ArrowRight':
      item.x = clamp(item.x + step, 0, CARD_W - item.w);
      moved = true;
      break;
    case 'ArrowUp':
      item.y = clamp(item.y - step, 0, CARD_H - item.h);
      moved = true;
      break;
    case 'ArrowDown':
      item.y = clamp(item.y + step, 0, CARD_H - item.h);
      moved = true;
      break;
  }

  if (moved) {
    e.preventDefault();
    touchSet(currentSet(), false);
    renderCards();
    syncPropertiesPanel();
  }
}

function currentSet() {
  return state.sets.find(set => set.id === state.currentSetId) || null;
}

function currentCard() {
  const set = currentSet();
  return set?.cards?.[state.selectedCardIndex] || null;
}

function currentElements() {
  const card = currentCard();
  return card?.[state.side] || null;
}

function getElementById(id, cardIndex = state.selectedCardIndex) {
  const set = currentSet();
  const card = set?.cards?.[cardIndex];
  return card?.[state.side]?.find(item => item.id === id) || null;
}

function openSet(setId) {
  const set = state.sets.find(item => item.id === setId);
  if (!set) return;
  state.currentSetId = set.id;
  state.selectedCardIndex = 0;
  state.selectedElementId = null;
  state.side = 'front';
  showScreen('editor');
}

function duplicateSet(setId) {
  const source = state.sets.find(item => item.id === setId);
  if (!source) return;
  const copy = normalizeSet(JSON.parse(JSON.stringify(source)));
  copy.id = uid('set');
  copy.name = `${source.name} (copie)`;
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = new Date().toISOString();
  copy.cards = copy.cards.map(card => ({ ...card, id: uid('card') }));
  state.sets.unshift(copy);
  saveSets();
  renderHome();
}

function deleteSet(setId) {
  const set = state.sets.find(item => item.id === setId);
  if (!set) return;
  const ok = window.confirm(`Supprimer le set "${set.name}" ?`);
  if (!ok) return;
  state.sets = state.sets.filter(item => item.id !== setId);
  if (state.currentSetId === setId) {
    state.currentSetId = null;
    state.selectedElementId = null;
    state.selectedCardIndex = 0;
    state.side = 'front';
  }
  saveSets();
  renderHome();
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

  const copy = normalizeCard(JSON.parse(JSON.stringify(card)));
  copy.id = uid('card');
  copy.front.forEach(item => item.id = uid('el'));
  copy.back.forEach(item => item.id = uid('el'));

  set.cards.splice(state.selectedCardIndex + 1, 0, copy);
  state.selectedCardIndex += 1;
  state.selectedElementId = null;
  touchSet(set);
  renderEditor();
  scrollToCard(state.selectedCardIndex);
}

function deleteCard() {
  const set = currentSet();
  if (!set || set.cards.length <= 1) {
    alert('Le set doit garder au moins une carte.');
    return;
  }
  set.cards.splice(state.selectedCardIndex, 1);
  state.selectedCardIndex = clamp(state.selectedCardIndex, 0, set.cards.length - 1);
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
  const card = currentCard();
  if (!set || !card) return;

  set.cards.forEach((target, idx) => {
    if (idx === state.selectedCardIndex) return;
    if (!target[state.side]?.length) {
      target[state.side] = JSON.parse(JSON.stringify(card[state.side] || []));
      target[state.side].forEach(item => item.id = uid('el'));
    }
  });

  touchSet(set);
  renderEditor();
  alert('Style appliqué aux autres cartes seulement si la face était vide.');
}

function addElement(type) {
  if (type === 'image') {
    el.imageInput?.click();
    return;
  }

  const elements = currentElements();
  if (!elements) return;

  const next = makeElement(type);
  next.x = clamp(46 + (elements.length % 4) * 14, 0, CARD_W - next.w);
  next.y = clamp(46 + (elements.length % 5) * 14, 0, CARD_H - next.h);
  next.z = maxZ(elements) + 1;

  if (type === 'square') {
    next.w = 80;
    next.h = 80;
  }
  if (type === 'circle') {
    next.w = 80;
    next.h = 80;
  }
  if (type === 'ellipse') {
    next.w = 110;
    next.h = 72;
  }
  if (type === 'line') {
    next.h = 10;
    next.borderWidth = 4;
    next.backgroundColor = 'transparent';
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
    const elements = currentElements();
    if (!elements) return;
    const imageEl = makeElement('image', {
      src: reader.result,
      w: 150,
      h: 110,
      x: 50,
      y: 50,
      borderWidth: 1,
      borderColor: '#8c6d47',
      z: maxZ(elements) + 1,
    });
    elements.push(imageEl);
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
    if (el.selectionInfo) el.selectionInfo.textContent = 'Aucun élément sélectionné.';
    if (el.propText) el.propText.value = '';
    if (el.propFontSize) el.propFontSize.value = '24';
    if (el.propBorderWidth) el.propBorderWidth.value = '0';
    return;
  }

  const borderHint = ['rect', 'square', 'circle', 'ellipse', 'badge', 'banner', 'image'].includes(item.type)
    ? ` · Bord ${Math.round(item.borderWidth || 0)} px`
    : '';

  el.selectionInfo.textContent = `Élément : ${labelForType(item.type)} · Position ${Math.round(item.x)}, ${Math.round(item.y)} · Taille ${Math.round(item.w)} × ${Math.round(item.h)}${borderHint}`;
  el.propText.value = item.text || '';
  el.propFont.value = item.fontFamily || 'Inter';
  el.propFontSize.value = String(item.fontSize || 16);
  el.propColor.value = normalizeColor(item.color, '#1f2937');
  el.propBgColor.value = normalizeColor(item.backgroundColor, '#d6b66f');
  el.propBorderColor.value = normalizeColor(item.borderColor, '#5b4630');
  el.propBorderWidth.value = String(item.borderWidth || 0);
  el.propOpacity.value = String(Math.round((item.opacity ?? 1) * 100));
  el.propRotation.value = String(item.rotation || 0);
  el.propAlign.value = item.textAlign || 'left';
}

function updateSelectedElement(key, value) {
  const item = getElementById(state.selectedElementId);
  if (!item) return;

  item[key] = value;

  if (key === 'borderWidth') {
    item.borderWidth = Math.max(0, numberOr(value, item.borderWidth));
  }
  if (key === 'fontSize') {
    item.fontSize = Math.max(8, numberOr(value, item.fontSize));
  }
  if (key === 'opacity') {
    item.opacity = clamp(numberOr(value, item.opacity), 0.05, 1);
  }
  if (key === 'rotation') {
    item.rotation = numberOr(value, item.rotation);
  }

  touchSet(currentSet(), false);
  renderCards();
  syncPropertiesPanel();
}

function cloneSelectedElement() {
  const item = getElementById(state.selectedElementId);
  const elements = currentElements();
  if (!item || !elements) return;

  const copy = normalizeElement(JSON.parse(JSON.stringify(item)));
  copy.id = uid('el');
  copy.x = clamp(item.x + 12, 0, CARD_W - item.w);
  copy.y = clamp(item.y + 12, 0, CARD_H - item.h);
  copy.z = maxZ(elements) + 1;
  elements.push(copy);
  state.selectedElementId = copy.id;
  touchSet(currentSet());
  renderEditor();
}

function removeSelectedElement() {
  const elements = currentElements();
  if (!elements || !state.selectedElementId) return;

  const index = elements.findIndex(item => item.id === state.selectedElementId);
  if (index === -1) return;

  elements.splice(index, 1);
  normalizeZ(elements);
  state.selectedElementId = null;
  touchSet(currentSet());
  renderEditor();
}

function changeLayer(direction) {
  const item = getElementById(state.selectedElementId);
  const elements = currentElements();
  if (!item || !elements || elements.length < 2) return;

  normalizeZ(elements);
  if (direction > 0) {
    item.z = maxZ(elements) + 1;
  } else {
    item.z = 0;
  }

  normalizeZ(elements);
  touchSet(currentSet(), false);
  renderCards();
  syncPropertiesPanel();
}

function normalizeZ(elements) {
  elements.sort((a, b) => (a.z || 0) - (b.z || 0)).forEach((item, index) => {
    item.z = index + 1;
  });
}

function maxZ(elements) {
  return Math.max(0, ...elements.map(item => item.z || 0));
}

function touchSet(set, persist = true) {
  if (!set) return;
  set.updatedAt = new Date().toISOString();
  state.sets = normalizeSets(state.sets);
  if (persist) saveSets();
}

function saveCurrentSet() {
  const set = currentSet();
  if (!set) return;
  touchSet(set);
}

function exportSetJsonById(setId) {
  const set = state.sets.find(item => item.id === setId);
  if (!set) return;
  downloadBlob(new Blob([JSON.stringify(set, null, 2)], { type: 'application/json' }), `${safeName(set.name)}.json`);
}

function exportCurrentSetJson() {
  const set = currentSet();
  if (!set) return;
  exportSetJsonById(set.id);
}

async function exportVisibleCard(format = 'png') {
  const oldSelected = state.selectedElementId;
  state.selectedElementId = null;
  renderCards();

  const targetNode = document.querySelector(`.card-canvas[data-canvas-card-index="${state.selectedCardIndex}"]`);
  if (!targetNode) return;

  const canvas = await html2canvas(targetNode, { backgroundColor: null, scale: 3, useCORS: true });
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const filename = `${safeName(currentSet().name)}-carte-${state.selectedCardIndex + 1}-${state.side}.${format === 'jpeg' ? 'jpg' : 'png'}`;

  canvas.toBlob(blob => {
    downloadBlob(blob, filename);
    state.selectedElementId = oldSelected;
    renderCards();
  }, mime, 0.95);
}

async function exportAllCardsPng() {
  const set = currentSet();
  if (!set) return;

  const prevCard = state.selectedCardIndex;
  const prevSel = state.selectedElementId;
  state.selectedElementId = null;

  for (let i = 0; i < set.cards.length; i += 1) {
    state.selectedCardIndex = i;
    renderCards();
    const targetNode = document.querySelector(`.card-canvas[data-canvas-card-index="${i}"]`);
    if (!targetNode) continue;
    const canvas = await html2canvas(targetNode, { backgroundColor: null, scale: 3, useCORS: true });
    await new Promise(resolve => {
      canvas.toBlob(blob => {
        downloadBlob(blob, `${safeName(set.name)}-carte-${i + 1}-${state.side}.png`);
        resolve();
      }, 'image/png');
    });
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
    const data = JSON.parse(text);
    const imported = normalizeSet(data?.set && data?.app ? data.set : data);
    imported.id = uid('set');
    imported.name = imported.name ? `${imported.name} (importé)` : 'Set importé';
    imported.createdAt = new Date().toISOString();
    imported.updatedAt = new Date().toISOString();

    state.sets.unshift(imported);
    saveSets();
    openSet(imported.id);
  } catch {
    alert('Import impossible : fichier JSON invalide.');
  } finally {
    e.target.value = '';
  }
}

function scrollToCard(index) {
  document.querySelector(`.page-wrap[data-card-index="${index}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function labelForType(type) {
  return ({
    title: 'Titre',
    text: 'Texte',
    image: 'Image',
    badge: 'Badge',
    rect: 'Rectangle',
    square: 'Carré',
    circle: 'Cercle',
    ellipse: 'Ellipse',
    line: 'Ligne',
    banner: 'Bannière',
  }[type]) || type;
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

function cssSafe(v) {
  const value = String(v || 'Inter');
  return value.includes(' ') ? `'${value}'` : value;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function numberOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s]));
}

function normalizeColor(value, fallback) {
  if (!value || value === 'transparent' || String(value).startsWith('rgba')) return fallback;
  return value;
}

function downloadBlob(blob, filename) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
