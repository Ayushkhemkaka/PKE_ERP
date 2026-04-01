import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

async function ensureBuildCache() {
  await mkdir(path.join(repoRoot, '.next', 'cache'), { recursive: true });
}

async function runBuild() {
  await ensureBuildCache();

  const nextBinary = path.join(repoRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawn(process.execPath, [nextBinary, 'build'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_CACHE_DIR: path.join(repoRoot, '.next', 'cache')
    }
  });

  child.on('exit', (code) => {
    process.exit(code ?? 1);
  });

  child.on('error', (error) => {
    console.error('Unable to start the Next.js build process.', error);
    process.exit(1);
  });
}

runBuild();
