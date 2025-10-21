const webview = document.getElementById('webview');
const urlInput = document.getElementById('url-input');
const backButton = document.getElementById('back');
const forwardButton = document.getElementById('forward');
const reloadButton = document.getElementById('reload');
const homeButton = document.getElementById('home');
const goButton = document.getElementById('go');
const toggleThemeButton = document.getElementById('toggle-theme');
const welcomePanel = document.getElementById('welcome');
const quickLinks = document.querySelectorAll('.quick-links button');

const KONA_SEARCH_BASE = new URL('kona-search.html', window.location.href);
const HOME_URL = KONA_SEARCH_BASE.toString();
let useAltAccent = false;

const buildKonaSearchUrl = (query) => {
  const target = new URL(KONA_SEARCH_BASE.href);
  const trimmed = typeof query === 'string' ? query.trim() : '';
  if (trimmed) {
    target.searchParams.set('q', trimmed);
  }
  return target.toString();
};

const isKonaSearchUrl = (url) => {
  if (!url) return false;
  return url.startsWith(HOME_URL);
};

const getKonaSearchQuery = (url) => {
  if (!isKonaSearchUrl(url)) return null;
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('q') ?? '';
  } catch (_error) {
    return '';
  }
};

const formatUrl = (raw) => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^kona-search:/i.test(trimmed)) {
    const query = trimmed.replace(/^kona-search:/i, '').trim();
    return buildKonaSearchUrl(query);
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^[\w.-]+\.[A-Za-z]{2,}(\/.*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return buildKonaSearchUrl(trimmed);
};

const updateNavigationState = () => {
  backButton.disabled = !webview.canGoBack();
  forwardButton.disabled = !webview.canGoForward();
};

const updateAddress = (url) => {
  if (!url) return;
  const query = getKonaSearchQuery(url);
  if (query !== null) {
    urlInput.value = query || '';
    return;
  }
  urlInput.value = url;
};

const hideWelcome = () => {
  welcomePanel.classList.add('welcome-panel--hidden');
};

const showWelcome = () => {
  welcomePanel.classList.remove('welcome-panel--hidden');
};

const syncWelcome = (url) => {
  if (!url) return;
  if (isKonaSearchUrl(url)) {
    showWelcome();
  } else {
    hideWelcome();
  }
};

const navigateTo = (input) => {
  const target = formatUrl(input);
  if (!target) {
    return;
  }
  syncWelcome(target);
  webview.loadURL(target);
};

webview.addEventListener('did-start-loading', () => {
  document.body.classList.add('loading');
});

webview.addEventListener('did-stop-loading', () => {
  document.body.classList.remove('loading');
  updateNavigationState();
});

webview.addEventListener('did-finish-load', () => {
  updateNavigationState();
});

webview.addEventListener('did-navigate', (event) => {
  syncWelcome(event.url);
  updateAddress(event.url);
  updateNavigationState();
});

webview.addEventListener('did-navigate-in-page', (event) => {
  syncWelcome(event.url);
  updateAddress(event.url);
  updateNavigationState();
});

webview.addEventListener('page-title-updated', (event) => {
  document.title = `${event.title} · Kona Browser`;
});

webview.addEventListener('new-window', (event) => {
  if (window.kona?.openExternal) {
    window.kona.openExternal(event.url);
  }
});

backButton.addEventListener('click', () => {
  if (webview.canGoBack()) {
    webview.goBack();
  }
});

forwardButton.addEventListener('click', () => {
  if (webview.canGoForward()) {
    webview.goForward();
  }
});

reloadButton.addEventListener('click', () => {
  if (webview.isLoading()) {
    webview.stop();
  } else {
    webview.reload();
  }
});

homeButton.addEventListener('click', () => {
  showWelcome();
  webview.loadURL(HOME_URL);
  urlInput.value = '';
});

urlInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    navigateTo(urlInput.value);
  }
});

goButton.addEventListener('click', () => {
  navigateTo(urlInput.value);
});

quickLinks.forEach((button) => {
  button.addEventListener('click', () => {
    navigateTo(button.dataset.url);
  });
});

toggleThemeButton.addEventListener('click', () => {
  useAltAccent = !useAltAccent;
  document.body.classList.toggle('alt-accent', useAltAccent);
});

// initial state
showWelcome();
updateNavigationState();
webview.addEventListener('dom-ready', () => {
  const current = webview.getURL();
  updateAddress(current);
  syncWelcome(current);
});
