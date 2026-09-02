// AVS Search client — behavior identical to the legacy script.js, minus the
// dead weight: engine SVGs now live once in src/data/engines.ts and are
// server-rendered, so this bundle clones icons from the DOM instead of
// shipping ~20KB of duplicated icon strings. Single delegated handlers
// replace the old overlapping per-button + document listeners.

// ---------- DOM refs ----------
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const suggestionsContainer = document.getElementById('suggestions') as HTMLElement;
const searchBtn = document.getElementById('search-btn') as HTMLElement;
const engineSelectorContainer = document.getElementById('engine-selector-container') as HTMLElement;
const engineOptions = document.getElementById('engine-options') as HTMLElement;
const circularModal = document.getElementById('engine-circular-modal') as HTMLElement;
const centerEngineIcon = document.getElementById('center-engine-icon') as HTMLElement;
const proPlusToggle = document.getElementById('pro-plus-toggle') as HTMLElement;

// ---------- Engine behavior (icons are cloned from server-rendered DOM) ----------
interface EngineAction {
  bang: string;
  customUrl?: string;
}

const ENGINE_ORDER = [
  'web',
  'reddit',
  'imdb',
  'amazon',
  'youtube',
  'ai',
  'ai-with-search',
  'ai-with-reason',
] as const;

type EngineKey = (typeof ENGINE_ORDER)[number];

const ENGINE_ACTIONS: Record<EngineKey, EngineAction> = {
  web: { bang: '' },
  reddit: { bang: '!r ' },
  imdb: { bang: '!imdb ' },
  amazon: { bang: '!ain ' },
  youtube: { bang: '!yt ' },
  ai: { bang: '!t3 ' },
  'ai-with-search': { customUrl: 'https://t3.chat/new?model=gemini-2.5-flash&q=%s&search=true', bang: '' },
  'ai-with-reason': { customUrl: 'https://chatgpt.com/?q=%s', bang: '' },
};

// ---------- State ----------
let suggestionsData: string[] = [];
let activeIndex = -1;
let currentEngine: EngineKey = 'web';
let isProPlusActive = false;
let isGeminiActive = false;
const clientCache: Record<string, string[]> = {};
let controller: AbortController | null = null;
let inputDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
const SUGGESTION_DEBOUNCE_MS = 150;

// ---------- Helpers ----------
function isMobileDevice(): boolean {
  return (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

function clearSuggestions(): void {
  suggestionsContainer.innerHTML = '';
  suggestionsData = [];
  activeIndex = -1;
}

function getSuggestionCacheKey(query: string): string {
  return query.trim().toLowerCase();
}

function areSuggestionsEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((s, i) => s === b[i]);
}

// ---------- Engine icons (single source: server-rendered buttons) ----------
function iconFor(key: string): string {
  const src = document.querySelector(`.engine-option[data-engine="${key}"]`);
  return src ? src.innerHTML : '';
}

function updateCenterIcon(): void {
  if (centerEngineIcon) centerEngineIcon.innerHTML = iconFor(currentEngine);
}

function updateEngineIcon(): void {
  const el = document.getElementById('current-engine-icon');
  if (el) {
    const holder = document.createElement('div');
    holder.innerHTML = iconFor(currentEngine);
    const svg = holder.firstElementChild;
    if (svg) {
      (svg as Element).id = 'current-engine-icon';
      const cls = el.getAttribute('class');
      if (cls) svg.setAttribute('class', cls);
      el.replaceWith(svg);
    }
  }
  updateCenterIcon();
}

// ---------- Transient engine notice ----------
const engineNotifyWrapper = document.querySelector('.w-full.max-w-2xl.text-center.mb-12') as HTMLElement | null;
if (engineNotifyWrapper) engineNotifyWrapper.style.position = 'relative';

let currentNoticeTimeout: ReturnType<typeof setTimeout> | null = null;
let currentNotice: HTMLElement | null = null;

function showTransientEngineName(): void {
  if (!engineNotifyWrapper) return;
  const h1 = engineNotifyWrapper.querySelector('h1.metallic-text') as HTMLElement | null;
  if (!h1) return;
  const offset = h1.offsetHeight + parseFloat(getComputedStyle(h1).marginBottom);

  if (currentNotice) {
    currentNotice.remove();
    currentNotice = null;
  }
  if (currentNoticeTimeout) {
    clearTimeout(currentNoticeTimeout);
    currentNoticeTimeout = null;
  }

  const notice = document.createElement('div');
  const label =
    document.querySelector(`.engine-option[data-engine="${currentEngine}"]`)?.getAttribute('data-tooltip') ||
    currentEngine;
  notice.textContent = label;
  Object.assign(notice.style, {
    position: 'absolute',
    top: `${offset}px`,
    left: '50%',
    transform: 'translateX(-50%) translateY(-0.5rem)',
    opacity: '0',
    background: 'rgba(0,0,0,0.7)',
    color: '#60a5fa',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    zIndex: '1000',
  });
  engineNotifyWrapper.appendChild(notice);
  currentNotice = notice;

  requestAnimationFrame(() => {
    notice.style.opacity = '1';
    notice.style.transform = 'translateX(-50%) translateY(0)';
  });

  currentNoticeTimeout = setTimeout(() => {
    if (notice.parentNode) {
      notice.style.opacity = '0';
      notice.style.transform = 'translateX(-50%) translateY(-0.5rem)';
      currentNoticeTimeout = setTimeout(() => {
        if (notice.parentNode) notice.remove();
        if (currentNotice === notice) currentNotice = null;
        currentNoticeTimeout = null;
      }, 300);
    }
  }, 1500);
}

// ---------- Engine selection (one path for click, keys, and modal) ----------
function closeEngineOptions(): void {
  engineSelectorContainer.classList.remove('expanded');
  searchInput.setAttribute('placeholder', 'Search anything...');
}

function selectEngine(key: string, notify = true): void {
  if (!(key in ENGINE_ACTIONS)) return;
  currentEngine = key as EngineKey;
  updateEngineIcon();
  closeEngineOptions();
  if (notify) showTransientEngineName();
}

function cycleSearchEngine(): void {
  const idx = ENGINE_ORDER.indexOf(currentEngine);
  selectEngine(ENGINE_ORDER[(idx + 1) % ENGINE_ORDER.length]);
}

engineSelectorContainer.addEventListener('click', (e) => {
  e.stopPropagation();
  if (isMobileDevice()) {
    openCircularModal();
    return;
  }
  engineSelectorContainer.classList.toggle('expanded');
  searchInput.setAttribute(
    'placeholder',
    engineSelectorContainer.classList.contains('expanded') ? 'Choose Engine' : 'Search anything...',
  );
});

// Single delegated handler (replaces the old per-button + document listeners
// that both fired on every click).
engineOptions.addEventListener('click', (e) => {
  e.stopPropagation();
  const option = (e.target as HTMLElement).closest('.engine-option') as HTMLElement | null;
  if (option?.dataset.engine) selectEngine(option.dataset.engine);
});

// ---------- Suggestions ----------
function fetchSuggestions(query: string): Promise<string[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    clearSuggestions();
    return Promise.resolve([]);
  }

  const cacheKey = getSuggestionCacheKey(trimmedQuery);
  if (clientCache[cacheKey]) {
    const cached = clientCache[cacheKey];
    if (!areSuggestionsEqual(suggestionsData, cached)) {
      suggestionsData = cached;
      activeIndex = -1;
      renderSuggestions();
    }
    return Promise.resolve(suggestionsData);
  }

  if (controller) controller.abort();
  controller = new AbortController();

  return fetch(`/api/suggestions?q=${encodeURIComponent(trimmedQuery)}`, {
    signal: controller.signal,
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  })
    .then((res) => res.json())
    .then((data: unknown) => {
      if (searchInput.value.trim() !== trimmedQuery) return suggestionsData;
      if (!searchInput.value.trim()) {
        clearSuggestions();
        return [];
      }
      const next: string[] = Array.isArray(data) ? (data as string[]) : [];
      clientCache[cacheKey] = next;
      if (areSuggestionsEqual(suggestionsData, next)) return suggestionsData;
      suggestionsData = next;
      activeIndex = -1;
      renderSuggestions();
      return suggestionsData;
    })
    .catch((error: unknown) => {
      if ((error as Error).name !== 'AbortError') console.error('Error fetching suggestions:', error);
      return suggestionsData;
    });
}

function renderSuggestions(): void {
  if (!searchInput.value.trim()) {
    clearSuggestions();
    return;
  }
  if (!suggestionsData.length) {
    suggestionsContainer.replaceChildren();
    return;
  }
  const fragment = document.createDocumentFragment();
  suggestionsData.forEach((suggestion) => {
    const element = document.createElement('div');
    element.className = 'suggestion p-2 cursor-pointer hover:bg-blue-900/70 transition-colors';
    element.textContent = suggestion;
    element.onclick = () => {
      searchInput.value = suggestion;
      performSearch(suggestion);
    };
    fragment.appendChild(element);
  });
  suggestionsContainer.replaceChildren(fragment);
}

function handleInput(): void {
  const query = searchInput.value.trim();
  if (inputDebounceTimeout) {
    clearTimeout(inputDebounceTimeout);
    inputDebounceTimeout = null;
  }
  if (!query) {
    if (controller) controller.abort();
    clearSuggestions();
    return;
  }
  const cacheKey = getSuggestionCacheKey(query);
  if (clientCache[cacheKey] && !areSuggestionsEqual(suggestionsData, clientCache[cacheKey])) {
    suggestionsData = clientCache[cacheKey];
    activeIndex = -1;
    renderSuggestions();
  }
  inputDebounceTimeout = setTimeout(() => {
    void fetchSuggestions(query);
  }, SUGGESTION_DEBOUNCE_MS);
}

function updateActiveSuggestion(): void {
  suggestionsContainer.querySelectorAll('.suggestion').forEach((element, index) => {
    element.classList.toggle('active', index === activeIndex);
  });
}

// ---------- Search routing (unchanged behavior) ----------
function getNavigableUrl(input: string): string | null {
  const candidate = input.trim();
  if (!candidate || candidate.startsWith('!') || /\s/.test(candidate)) return null;

  const firstColon = candidate.indexOf(':');
  const firstDot = candidate.indexOf('.');
  const hasSchemeLikePrefix = firstColon > -1 && (firstDot === -1 || firstColon < firstDot);
  const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(candidate);
  const hasLocalhost = /^localhost(?::\d+)?(?:[/?#]|$)/i.test(candidate);
  const hasIPv4 = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:[/?#]|$)/.test(candidate);
  const hasDomainDot = /^(?:www\.)?[^/?#.]+\.[^/?#]+(?:[/?#]|$)/i.test(candidate);

  if (hasSchemeLikePrefix && !hasProtocol && !hasLocalhost) return null;
  if (!hasProtocol && !hasLocalhost && !hasIPv4 && !hasDomainDot) return null;

  try {
    const url = new URL(hasProtocol ? candidate : `https://${candidate}`);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function performSearch(rawQuery: string): void {
  if (!rawQuery) return;
  let query = rawQuery;

  const navigableUrl = getNavigableUrl(query);
  if (navigableUrl) {
    window.location.href = navigableUrl;
    return;
  }

  if (isGeminiActive) {
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}&udm=50`;
    return;
  }

  const action = ENGINE_ACTIONS[currentEngine];
  if (action.customUrl) {
    window.location.href = action.customUrl.replace('%s', encodeURIComponent(query));
    return;
  }

  if (isProPlusActive && currentEngine === 'web') {
    window.location.href = `https://kagi.com/search?q=${encodeURIComponent(query)}`;
    return;
  }

  if (currentEngine !== 'web' && !query.startsWith('!')) query = action.bang + query;
  window.location.href = `https://unduck.link?q=${encodeURIComponent(query)}`;
}

// ---------- Input events ----------
searchInput.addEventListener('input', handleInput);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (activeIndex >= 0 && activeIndex < suggestionsData.length) {
      searchInput.value = suggestionsData[activeIndex];
    }
    performSearch(searchInput.value.trim());
    return;
  }
  const count = suggestionsContainer.querySelectorAll('.suggestion').length;
  if (!count) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex = (activeIndex + 1) % count;
    updateActiveSuggestion();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex = activeIndex <= 0 ? count - 1 : activeIndex - 1;
    updateActiveSuggestion();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    clearSuggestions();
  }
});

searchBtn.addEventListener('click', () => {
  performSearch(searchInput.value.trim());
});

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (!searchInput.contains(target) && !suggestionsContainer.contains(target)) clearSuggestions();
  if (
    circularModal.classList.contains('active') &&
    target === circularModal &&
    !target.closest('.engine-circle-option')
  ) {
    closeEngineModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    cycleSearchEngine();
  } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
    e.preventDefault();
    toggleGeminiMode();
  } else if (e.key === 'Escape' && circularModal.classList.contains('active')) {
    closeEngineModal();
  }
});

// ---------- Mode toggles ----------
function showModeNotification(id: string, message: string): void {
  document.getElementById(id)?.remove();
  const notification = document.createElement('div');
  notification.id = id;
  notification.style.cssText = [
    'position: fixed',
    'top: 20px',
    'left: 50%',
    'transform: translateX(-50%)',
    'background: rgba(13, 25, 45, 0.95)',
    'color: #60a5fa',
    'padding: 16px 24px',
    'border-radius: 8px',
    'box-shadow: 0 0 20px rgba(59, 130, 246, 0.4)',
    'z-index: 10000',
    'font-weight: 600',
    'font-size: 16px',
    'backdrop-filter: blur(10px)',
    "font-family: 'Space Grotesk', sans-serif",
    'opacity: 0',
    'transition: all 0.3s ease-in-out',
  ].join(';');
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '1';
  }, 10);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function updatePoweredByText(): void {
  const poweredBySpan = document.querySelector('.flex.justify-center.space-x-6 span:first-child');
  if (!poweredBySpan) return;
  poweredBySpan.textContent = isGeminiActive
    ? 'POWERED BY: AI MODE'
    : isProPlusActive
      ? 'POWERED BY: KAGI SEARCH'
      : 'POWERED BY: UNDUCK';
}

function toggleGeminiMode(): void {
  isGeminiActive = !isGeminiActive;
  document.getElementById('gemini-indicator')?.style.setProperty('opacity', isGeminiActive ? '1' : '0');
  updatePoweredByText();
  showModeNotification(
    'gemini-notification',
    isGeminiActive ? '🤖 AI Mode ENABLED - Using Gemini Search' : '🤖 AI Mode DISABLED - Using Standard Search',
  );
}

proPlusToggle.addEventListener('click', (e) => {
  e.preventDefault();
  isProPlusActive = !isProPlusActive;
  document.getElementById('pro-plus-indicator')?.style.setProperty('opacity', isProPlusActive ? '1' : '0');
  updatePoweredByText();
  showModeNotification(
    'pro-plus-notification',
    isProPlusActive ? 'Pro Mode ENABLED - Using Kagi Search' : 'Pro Mode DISABLED - Using Unduck Search',
  );
});

// ---------- Mobile circular modal ----------
// The modal ships as icon-less shells (see EngineModal.astro) to avoid
// sending every engine SVG twice; hydrate them once from the
// server-rendered desktop buttons before anything can open the modal.
document.querySelectorAll('.engine-circle-option').forEach((button) => {
  const key = (button as HTMLElement).dataset.engine;
  if (key && !button.querySelector('svg')) {
    button.insertAdjacentHTML('afterbegin', iconFor(key));
  }
});

function openCircularModal(): void {
  updateCenterIcon();
  circularModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeEngineModal(): void {
  circularModal.classList.remove('active');
  document.body.style.overflow = '';
}

circularModal.querySelectorAll('.engine-circle-option').forEach((button) => {
  button.addEventListener('click', () => {
    const key = (button as HTMLElement).dataset.engine;
    if (!key) return;
    button.classList.add('selected');
    setTimeout(() => button.classList.remove('selected'), 600);
    selectEngine(key);
    setTimeout(closeEngineModal, 300);
  });
});

circularModal.querySelector('.engine-modal-close')?.addEventListener('click', closeEngineModal);

window.addEventListener('resize', () => {
  if (isMobileDevice() && engineSelectorContainer.classList.contains('expanded')) closeEngineOptions();
  if (!isMobileDevice() && circularModal.classList.contains('active')) closeEngineModal();
});

// ---------- Init ----------
function updateToggleIndicators(): void {
  document.getElementById('pro-plus-indicator')?.style.setProperty('opacity', isProPlusActive ? '1' : '0');
  document.getElementById('gemini-indicator')?.style.setProperty('opacity', isGeminiActive ? '1' : '0');
}

function prefetchCommonSuggestions(): void {
  for (const term of ['a', 'how', 'what', 'why', 'cricbuzz']) {
    fetch(`/api/suggestions?q=${term}`)
      .then((res) => res.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) clientCache[getSuggestionCacheKey(term)] = data as string[];
      })
      .catch(() => {});
  }
}

function whenIdle(fn: () => void): void {
  if ('requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void, opts?: object) => void }).requestIdleCallback(fn, {
      timeout: 2000,
    });
  } else {
    setTimeout(fn, 1000);
  }
}

document.addEventListener('DOMContentLoaded', updateToggleIndicators);

window.addEventListener('load', () => {
  searchInput.setAttribute('autocomplete', 'off');
  searchInput.focus();
  updateEngineIcon();
  document.getElementById('gemini-search-btn')?.addEventListener('click', toggleGeminiMode);
  whenIdle(prefetchCommonSuggestions);
});
