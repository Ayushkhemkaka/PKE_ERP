import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const nextBinary = path.join(repoRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
const cacheDir = path.join(repoRoot, '.next', 'cache');

const ignoredSegments = ['.git', '.next', 'node_modules'];
const watchedExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.css', '.json', '.sql']);

let serverProcess = null;
let isBuilding = false;
let rebuildQueued = false;
let debounceTimer = null;

const buildEnv = {
  ...process.env,
  NEXT_CACHE_DIR: cacheDir
};

function shouldWatchFile(filePath = '') {
  if (!filePath) {
    return false;
  }

  const normalizedPath = filePath.replaceAll('\\', '/');
  if (ignoredSegments.some((segment) => normalizedPath.includes(`/${segment}/`) || normalizedPath.startsWith(`${segment}/`))) {
    return false;
  }

  return watchedExtensions.has(path.extname(normalizedPath).toLowerCase());
}

function runCommand(commandArgs, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, commandArgs, {
      cwd: repoRoot,
      stdio: 'inherit',
      env: buildEnv
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} exited with code ${code ?? 1}`));
    });

    child.on('error', reject);
  });
}

async function ensureCache() {
  await mkdir(cacheDir, { recursive: true });
}

async function stopServer() {
  if (!serverProcess) {
    return;
  }

  const processToStop = serverProcess;
  serverProcess = null;

  await new Promise((resolve) => {
    processToStop.once('exit', () => resolve());
    processToStop.kill();
    setTimeout(() => resolve(), 4000);
  });
}

function startServer() {
  serverProcess = spawn(process.execPath, [nextBinary, 'start'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: buildEnv
  });

  serverProcess.on('exit', (code, signal) => {
    if (serverProcess && code !== 0 && signal !== 'SIGTERM') {
      console.error(`next start exited unexpectedly with code ${code ?? 'unknown'}.`);
    }
  });
}

async function buildAndRestart(trigger = 'initial') {
  if (isBuilding) {
    rebuildQueued = true;
    return;
  }

  isBuilding = true;
  rebuildQueued = false;

  try {
    console.log(`[watch] Starting ${trigger} build...`);
    await ensureCache();
    await runCommand([nextBinary, 'build'], 'next build');
    await stopServer();
    startServer();
    console.log('[watch] Build completed and server restarted.');
  } catch (error) {
    console.error('[watch] Build failed:', error.message);
  } finally {
    isBuilding = false;
    if (rebuildQueued) {
      await buildAndRestart('queued');
    }
  }
}

function scheduleRebuild(filePath) {
  if (!shouldWatchFile(filePath)) {
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    buildAndRestart(`change in ${filePath}`);
  }, 400);
}

async function main() {
  await buildAndRestart();

  const watcher = watch(repoRoot, { recursive: true }, (_, fileName) => {
    scheduleRebuild(fileName);
  });

  const shutdown = async () => {
    watcher.close();
    clearTimeout(debounceTimer);
    await stopServer();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Unable to start the auto-build runner.', error);
  process.exit(1);
});
