---
name: Mi Bancolombia APK native URLs
description: How API URLs are handled for web (PWA) vs native (APK) in the Expo app
---

# APK vs PWA API URL routing

## The rule
All `fetch()` calls in the Expo app **must** use `apiUrl(path)` from `@/utils/api`, never bare relative strings like `"/api/..."`.

**Why:** On web/PWA, relative URLs work via the Replit reverse proxy. On Android/iOS native builds, there is no browser origin, so relative paths fail silently. `apiUrl()` detects `Platform.OS` and prepends `EXPO_PUBLIC_API_URL` on native.

## How to apply
- `import { apiUrl } from "@/utils/api"` in any file that calls `fetch("/api/...")`
- `apiUrl("/api/radicados")` → `"/api/radicados"` on web, `"https://domain.replit.app/api/radicados"` on native
- `EXPO_PUBLIC_API_URL` must be set in EAS Build env / GitHub Actions secrets to the deployed Replit `.replit.app` URL
- The helper lives in `artifacts/mi-bancolombia/utils/api.ts`

## Files already fixed (as of 2026-06-25)
- `context/AppContext.tsx` — apiFetch() uses apiUrl()
- `app/admin/radicado.tsx` — 3 direct fetch calls
- `app/admin/usuarios.tsx` — 1 direct fetch call
- `components/UnblockProcessModal.tsx` — 2 direct fetch calls
