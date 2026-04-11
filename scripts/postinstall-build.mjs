import { spawn } from 'node:child_process';
import path from 'node:path';

if (process.env.SKIP_POSTINSTALL === 'true') {
  console.log('Skipping postinstall build because SKIP_POSTINSTALL=true');
  process.exit(0);
}

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, 'scripts', 'run-next-build.mjs');

const child = spawn(process.execPath, [scriptPath], {
  cwd: repoRoot,
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => process.exit(code ?? 1));
child.on('error', (error) => {
  console.error('Unable to run postinstall build.', error);
  process.exit(1);
});
