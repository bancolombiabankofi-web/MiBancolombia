const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const publicDir = path.join(projectRoot, "public");

function stripProtocol(domain) {
  let s = domain.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  return new URL(s).host;
}

function getDeploymentDomain() {
  const raw =
    process.env.REPLIT_INTERNAL_APP_DOMAIN ||
    process.env.REPLIT_DEV_DOMAIN ||
    process.env.EXPO_PUBLIC_DOMAIN;
  if (raw) return stripProtocol(raw);
  console.error("ERROR: No deployment domain found.");
  process.exit(1);
}

function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", cwd: projectRoot, env });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`"${cmd} ${args.join(" ")}" exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

// --- Find the pwa-icon hash from the built assets ---
// Expo export puts assets under assets/assets/images/ (Metro web export).
function findIconPath() {
  const candidates = [
    path.join(distDir, "assets", "assets", "images"),
    path.join(distDir, "assets_expo", "assets", "images"),
  ];
  for (const dir of candidates) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    const icon = files.find((f) => f.startsWith("pwa-icon") && f.endsWith(".png"));
    if (icon) {
      const relDir = path.relative(distDir, dir).replace(/\\/g, "/");
      return `/${relDir}/${icon}`;
    }
  }
  return null;
}

// --- Patch dist/index.html after expo export ---
function patchIndexHtml() {
  const indexPath = path.join(distDir, "index.html");
  let html = fs.readFileSync(indexPath, "utf-8");

  const iconPath = findIconPath() || "/favicon.ico";

  const pwaMeta = `
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Mi Bancolombia" />
    <meta name="theme-color" content="#0F0F0F" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="${iconPath}" />`;

  // Script: capture beforeinstallprompt before React boots + register SW
  const pwaScript = `
  <script>
    (function () {
      window.__pwaInstallPrompt = null;
      window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        window.__pwaInstallPrompt = e;
        window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
      });
      window.addEventListener('appinstalled', function () {
        window.__pwaInstallPrompt = null;
        window.dispatchEvent(new CustomEvent('pwa-installed'));
      });
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js');
        });
      }
    })();
  </script>`;

  // Replace the default narrow viewport meta and inject ours
  html = html.replace(
    /<meta name="viewport"[^>]*>/,
    ""
  );

  // Inject PWA meta + script right after <head>
  html = html.replace("<head>", `<head>${pwaMeta}${pwaScript}`);

  // Fix lang attribute
  html = html.replace('<html lang="en">', '<html lang="es">');

  fs.writeFileSync(indexPath, html);
  console.log("Patched index.html with PWA meta, manifest link, and SW registration.");
}

// --- Copy public/ assets into dist/ and patch manifest icon path ---
function copyPublicAssets() {
  if (!fs.existsSync(publicDir)) return;
  const iconPath = findIconPath() || "/favicon.ico";
  const files = fs.readdirSync(publicDir);
  for (const file of files) {
    const src = path.join(publicDir, file);
    const dest = path.join(distDir, file);
    if (file === "manifest.json") {
      // Patch the icon path to match the actual hashed filename from this build.
      const manifest = JSON.parse(fs.readFileSync(src, "utf-8"));
      manifest.icons = manifest.icons.map((icon) => ({ ...icon, src: iconPath }));
      fs.writeFileSync(dest, JSON.stringify(manifest, null, 2));
      console.log(`Copied public/manifest.json → dist/manifest.json (icon: ${iconPath})`);
    } else {
      fs.copyFileSync(src, dest);
      console.log(`Copied public/${file} → dist/${file}`);
    }
  }
}

async function main() {
  console.log("Building Mi Bancolombia PWA (web export)...");

  const domain = getDeploymentDomain();
  const replId = process.env.REPL_ID || process.env.EXPO_PUBLIC_REPL_ID || "";
  console.log(`Domain: ${domain}`);

  const env = {
    ...process.env,
    EXPO_PUBLIC_DOMAIN: domain,
    EXPO_PUBLIC_REPL_ID: replId,
  };

  await run("pnpm", ["exec", "expo", "export", "--platform", "web"], env);

  console.log("Post-processing dist/...");
  copyPublicAssets();
  patchIndexHtml();

  console.log("PWA build complete! Output: dist/");
}

main().catch((err) => {
  console.error("Build failed:", err.message);
  process.exit(1);
});
