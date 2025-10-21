# Kona Browser

Kona Browser is a kawaii, Konata Izumi-inspired Electron web browser prototype. It features a pastel UI with quick navigation controls, a welcome hub, and a built-in webview so you can surf the web without leaving the anime vibes.

## Features

- 🎀 Pastel anime-themed shell with Konata-inspired accent art
- 🧭 Navigation controls (back, forward, reload/stop, home)
- 🔎 Smart address bar with automatic search via DuckDuckGo
- ⭐ Quick links to anime-focused destinations
- 🌙 Accent toggle to switch between aqua and pink highlights

## Getting started

> **Note:** Electron is listed as a development dependency. Run the installation step before starting the app.

```bash
npm install
npm start
```

The start script launches the Electron client and loads the Kona Browser UI. Feel free to swap the placeholder artwork in `src/assets/konata-badge.svg` with your own Konata Izumi illustrations.

## Project structure

```text
kona-browser/
├── main.js          # Electron main process
├── preload.js       # Secure bridge exposing limited APIs to the renderer
├── src/
│   ├── index.html   # Browser chrome + welcome panel
│   ├── renderer.js  # UI logic for navigation and theming
│   ├── styles.css   # Pastel anime styling
│   └── assets/
│       └── konata-badge.svg
└── package.json
```
