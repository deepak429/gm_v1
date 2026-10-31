// Packages the Vite production build (./dist) into a single zip ready to
// upload to the CrazyGames developer portal.
//
// Usage:  npm run build:crazy
//
// Output: ./shadow-archer-crazygames.zip  (contents expand to:
//   index.html
//   assets/game.js
//   assets/game.css
//   assets/… any other assets)
//
// Requires the `zip` CLI (preinstalled on macOS/Linux). On Windows, install
// 7-Zip and set a ZIP_CMD env var, or run inside WSL.

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const distDir = join(root, 'dist');
const outZip = join(root, 'shadow-archer-crazygames.zip');

if (!existsSync(distDir)) {
  console.error('✘ dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

if (!existsSync(join(distDir, 'index.html'))) {
  console.error('✘ dist/index.html missing — Vite build appears broken.');
  process.exit(1);
}

if (existsSync(outZip)) rmSync(outZip);

// Zip the CONTENTS of dist/ (not the folder itself) — CrazyGames expects
// index.html at the root of the uploaded archive.
console.log('→ Zipping dist/ contents…');
try {
  execSync(`cd "${distDir}" && zip -r -q "${outZip}" .`, { stdio: 'inherit' });
} catch (e) {
  console.error('✘ zip failed. Make sure the `zip` CLI is on your PATH.');
  console.error(e);
  process.exit(1);
}

// Summary
const stat = statSync(outZip);
const sizeMb = (stat.size / 1024 / 1024).toFixed(2);

function treeSize(dir) {
  let total = 0;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    total += s.isDirectory() ? treeSize(p) : s.size;
  }
  return total;
}
const rawSizeMb = (treeSize(distDir) / 1024 / 1024).toFixed(2);

console.log('');
console.log('✓ Package ready for CrazyGames upload');
console.log(`  file:        ${outZip}`);
console.log(`  zipped:      ${sizeMb} MB`);
console.log(`  unpacked:    ${rawSizeMb} MB`);
console.log('');
console.log('Next steps:');
console.log('  1. Go to https://developer.crazygames.com/ and sign in.');
console.log('  2. Create a new game or open your existing one.');
console.log('  3. Upload the ZIP under "Game Build".');
console.log('  4. Fill out title, description, screenshots, icon, orientation.');
console.log('  5. Preview in their built-in player, then submit for review.');
