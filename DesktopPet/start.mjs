// Node removes the type annotations so the Mac's web view can run pet.ts.
import { page } from './page.mjs';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

if (process.platform !== 'darwin') throw new Error('Ghosty needs macOS.');
const folder = mkdtempSync(join(tmpdir(), 'ghosty-'));
const pagePath = join(folder, 'pet.html');
writeFileSync(pagePath, page);
const app = spawn('/usr/bin/osascript', ['-l', 'JavaScript',
  fileURLToPath(new URL('window.js', import.meta.url)), pagePath], { stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => app.kill(signal));
app.on('exit', code => {
  rmSync(folder, { recursive: true, force: true });
  process.exitCode = code ?? 0;
});
