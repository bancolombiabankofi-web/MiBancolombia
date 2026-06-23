const { spawn } = require("child_process");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

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

  console.error(
    "ERROR: No deployment domain found. Set REPLIT_INTERNAL_APP_DOMAIN, REPLIT_DEV_DOMAIN, or EXPO_PUBLIC_DOMAIN",
  );
  process.exit(1);
}

function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      cwd: projectRoot,
      env,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command "${cmd} ${args.join(" ")}" exited with code ${code}`));
    });
    child.on("error", reject);
  });
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

  console.log("PWA build complete! Output: dist/");
}

main().catch((err) => {
  console.error("Build failed:", err.message);
  process.exit(1);
});
