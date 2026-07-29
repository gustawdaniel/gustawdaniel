import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const dir = path.resolve('src/assets/images');
const files = fs.readdirSync(dir);

async function main() {
    let created = 0;
    let skipped = 0;

    for (const file of files) {
        if (file.startsWith('thumb_') || file.endsWith('.svg')) continue;
        const ext = path.extname(file);
        if (!['.avif', '.png', '.jpg', '.jpeg', '.webp'].includes(ext.toLowerCase())) continue;

        const thumbName = `thumb_${file}`;
        const inputPath = path.join(dir, file);
        const outputPath = path.join(dir, thumbName);

        if (!fs.existsSync(outputPath)) {
            try {
                await sharp(inputPath)
                    .resize({ width: 480, withoutEnlargement: true })
                    .toFormat('avif', { quality: 75 })
                    .toFile(outputPath);
                created++;
            } catch (err) {
                console.error(`Error processing ${file}:`, err.message);
            }
        } else {
            skipped++;
        }
    }

    console.log(`Thumbnails ready: ${created} created, ${skipped} already existed.`);
}

main();
