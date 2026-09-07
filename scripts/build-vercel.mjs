import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Building @workspace/creatorpulse...');
execSync('pnpm --filter @workspace/creatorpulse run build', { stdio: 'inherit' });

const src = path.resolve(__dirname, '../artifacts/creatorpulse/dist/public');
const dest = path.resolve(__dirname, '../public');

console.log(`Copying built assets from ${src} to ${dest}...`);
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}
fs.cpSync(src, dest, { recursive: true });
console.log('Build and asset sync to public/ complete!');
