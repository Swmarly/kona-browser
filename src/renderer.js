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

const HOME_URL = 'https://duckduckgo.com/?q=Konata+Izumi';
let useAltAccent = false;

const formatUrl = (raw) => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^[\w.-]+\.[A-Za-z]{2,}(\/.*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  const encoded = encodeURIComponent(trimmed);
  return `https://duckduckgo.com/?q=${encoded}`;
};

const updateNavigationState = () => {
  backButton.disabled = !webview.canGoBack();
  forwardButton.disabled = !webview.canGoForward();
};

const updateAddress = (url) => {
  if (url) {
    urlInput.value = url;
  }
};

const hideWelcome = () => {
  welcomePanel.classList.add('welcome-panel--hidden');
};

const showWelcome = () => {
  welcomePanel.classList.remove('welcome-panel--hidden');
};

const syncWelcome = (url) => {
  if (!url) return;
  if (url.startsWith(HOME_URL)) {
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
