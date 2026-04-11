import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const repoRoot = process.cwd();
const buildIdPath = path.join(repoRoot, '.next', 'BUILD_ID');

if (!fs.existsSync(buildIdPath)) {
  console.error("Production build not found. Run `npm run build` before starting the server.");
  process.exit(1);
}

const host = process.env.HOSTNAME || '0.0.0.0';
const port = process.env.PORT || '3000';
const nextBin = path.join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'next.cmd' : 'next');

const child = spawn(nextBin, ['start', '-H', host, '-p', String(port)], {
  cwd: repoRoot,
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => process.exit(code ?? 1));
child.on('error', (error) => {
  console.error('Unable to start Next.js production server.', error);
  process.exit(1);
});
