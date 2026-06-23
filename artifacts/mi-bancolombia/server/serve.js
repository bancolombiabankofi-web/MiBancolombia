/**
 * Production server for Mi Bancolombia PWA.
 *
 * Serves the output of `expo export --platform web` (dist/) as a static site
 * with SPA fallback (all unknown paths → index.html) and proper PWA headers.
 * Zero external dependencies — uses only Node.js built-ins.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const DIST_ROOT = path.resolve(__dirname, "..", "dist");
const basePath = (process.env.BASE_PATH || "/").replace(/\/+$/, "");
const port = parseInt(process.env.PORT || "3000", 10);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let pathname = url.pathname;

  // Strip base path prefix
  if (basePath && pathname.startsWith(basePath + "/")) {
    pathname = pathname.slice(basePath.length) || "/";
  } else if (basePath && pathname === basePath) {
    pathname = "/";
  }

  if (!pathname.startsWith("/")) {
    pathname = "/" + pathname;
  }

  const safePath = path.normalize(pathname);
  const filePath = path.join(DIST_ROOT, safePath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(DIST_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  let targetPath = filePath;

  // If path is a directory, try index.html inside it
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
    targetPath = path.join(targetPath, "index.html");
  }

  // SPA fallback: serve root index.html for any unmatched route
  if (!fs.existsSync(targetPath)) {
    targetPath = path.join(DIST_ROOT, "index.html");
  }

  if (!fs.existsSync(targetPath)) {
    res.writeHead(404);
    res.end("Not Found — dist/ not built yet");
    return;
  }

  const ext = path.extname(targetPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  const headers = {
    "content-type": contentType,
    // Allow service workers to intercept requests from root scope
    "service-worker-allowed": basePath || "/",
  };

  // HTML must never be cached so the app always loads fresh
  if (ext === ".html") {
    headers["cache-control"] = "no-cache, no-store, must-revalidate";
    headers["pragma"] = "no-cache";
    headers["expires"] = "0";
  } else {
    // Static assets (JS, CSS, images) can be cached aggressively
    headers["cache-control"] = "public, max-age=31536000, immutable";
  }

  const content = fs.readFileSync(targetPath);
  res.writeHead(200, headers);
  res.end(content);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Mi Bancolombia PWA serving from dist/ on port ${port}`);

  if (!fs.existsSync(DIST_ROOT)) {
    console.warn(
      "WARNING: dist/ directory not found. Run `pnpm --filter @workspace/mi-bancolombia run build` first.",
    );
  }
});
