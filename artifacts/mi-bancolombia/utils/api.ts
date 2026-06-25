import { Platform } from "react-native";

// On web (PWA), relative paths work via the Replit reverse proxy.
// On native (APK / iOS), there is no browser origin so we need an absolute URL.
// Set EXPO_PUBLIC_API_URL to your deployed Replit domain in EAS / GitHub Actions:
//   e.g. https://bancolombiabank.bancolombiabankofi-web.replit.app
const _base =
  Platform.OS === "web"
    ? ""
    : (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

/**
 * Returns the full URL for an API path.
 * - Web/PWA:  apiUrl("/api/radicados")  →  "/api/radicados"  (relative, proxied)
 * - APK/iOS:  apiUrl("/api/radicados")  →  "https://your-domain.replit.app/api/radicados"
 */
export function apiUrl(path: string): string {
  return `${_base}${path}`;
}
