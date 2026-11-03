/**
 * Konversi PNG sumber di public/images menjadi WebP agar halaman ringan.
 * Jalankan: node scripts/images-to-webp.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const dir = 'public/images';
const wide = new Set(['hero-mecca.png']);

for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.png'))) {
  const src = path.join(dir, file);
  const dest = path.join(dir, file.replace(/\.png$/, '.webp'));
  const isWide = wide.has(file);
  await sharp(src)
    .resize({ width: isWide ? 1024 : 512, withoutEnlargement: true })
    .webp({ quality: isWide ? 80 : 84, effort: 6 })
    .toFile(dest);
  const before = Math.round(fs.statSync(src).size / 1024);
  const after = Math.round(fs.statSync(dest).size / 1024);
  console.log(`${dest}: ${before}KB -> ${after}KB`);
}
