---
name: Mi Bancolombia PWA build
description: How the PWA build pipeline works and key pitfalls for the install button.
---

## Rule
`+html.tsx` is NOT applied when running `expo export --platform web` with Metro bundler (SPA mode). All PWA customizations (meta tags, manifest link, service worker registration, `beforeinstallprompt` capture script) must be injected by post-processing `dist/index.html` in `scripts/build.js` after the export.

**Why:** Metro's web export generates a bare HTML shell; the `+html.tsx` component is only used in the Expo dev server and in static rendering mode (`web.output: "static"`).

## Asset path
Built assets land in `dist/assets/` (not `dist/assets_expo/`). `findIconPath()` in `build.js` checks both paths as a fallback. The pwa-icon hash is stable across builds unless the source file changes.

## Install button rule
The "Descargar app" button must ONLY be shown when `window.__pwaInstallPrompt` is non-null (i.e., Chrome has fired `beforeinstallprompt`). Showing the button before the prompt is ready causes it to fall through to `navigator.share()`, which opens a "share link" dialog instead of installing. Listen for the `pwa-prompt-ready` custom event dispatched by the inline script in `index.html`.

**How to apply:** In `login.tsx`, start `showInstallBtn = false`, set to `true` only inside the `pwa-prompt-ready` handler or when checking `window.__pwaInstallPrompt` on mount. No fallback — if prompt is null, button stays hidden.
