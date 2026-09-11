// One-shot: compress oversized images/4k/*.jpg -> max width 1600, mozjpeg q72.
// Writes compressed copies to Downloads/mdi-4k-out/ (OneDrive locks source
// files in place, so copy results back after pausing sync or via Explorer).
// Filenames identical, no HTML changes. Safe to re-run (skips <= 1600px).
// Run: node scripts/compress-4k.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const dir = path.resolve(here, '..', 'images', '4k');
const outDir = 'C:/Users/digit/Downloads/mdi-4k-out';
fs.mkdirSync(outDir, { recursive: true });
let before = 0, after = 0, done = 0, skipped = 0;
for (const name of fs.readdirSync(dir)) {
  if (!/\.jpe?g$/i.test(name)) { skipped++; continue; }
  const p = path.join(dir, name);
  const meta = await sharp(p).metadata();
  before += fs.statSync(p).size;
  if ((meta.width || 0) <= 1600) { after += fs.statSync(p).size; skipped++; continue; }
  const buf = await sharp(p).resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 72, mozjpeg: true, progressive: true }).toBuffer();
  fs.writeFileSync(path.join(outDir, name), buf);
  after += buf.length; done++;
  console.log(`compressed ${name}: ${meta.width}px -> 1600px, ${(buf.length / 1024).toFixed(0)} KB`);
}
console.log(`done=${done} skipped=${skipped} before=${(before / 1048576).toFixed(1)}MB after=${(after / 1048576).toFixed(1)}MB`);
