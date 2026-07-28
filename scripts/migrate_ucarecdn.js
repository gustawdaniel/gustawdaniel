import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ucareRegex = /https:\/\/ucarecdn\.com\/([a-f0-9\-]+)(?:\/[^\s\)\"]*)?/g;

function getMarkdownFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getMarkdownFiles(filePath));
        } else if (filePath.endsWith('.md')) {
            results.push(filePath);
        }
    }
    return results;
}

async function migrate() {
    const files = getMarkdownFiles('src/content');
    console.log(`Found ${files.length} Markdown files.`);

    const urlMap = new Map(); // fullUrl -> uuid

    for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        let match;
        ucareRegex.lastIndex = 0;
        while ((match = ucareRegex.exec(content)) !== null) {
            const fullUrl = match[0];
            const uuid = match[1];
            if (!urlMap.has(fullUrl)) {
                urlMap.set(fullUrl, uuid);
            }
        }
    }

    console.log(`Found ${urlMap.size} unique Uploadcare URLs.`);

    const uniqueUuids = new Set(urlMap.values());
    console.log(`Downloading and converting ${uniqueUuids.size} unique images...`);

    const uuidToAssetPath = new Map();

    for (const uuid of uniqueUuids) {
        const downloadUrl = `https://ucarecdn.com/${uuid}/`;
        console.log(`Fetching ${downloadUrl}...`);

        try {
            const response = await fetch(downloadUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (!response.ok) {
                console.error(`Failed to fetch ${downloadUrl}: ${response.status}`);
                continue;
            }

            const contentType = response.headers.get('content-type') || '';
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            let ext = 'avif';
            let targetFilename = `${uuid}.avif`;
            let targetPath = path.join('src/assets/images', targetFilename);

            if (contentType.includes('svg') || downloadUrl.endsWith('.svg')) {
                ext = 'svg';
                targetFilename = `${uuid}.svg`;
                targetPath = path.join('src/assets/images', targetFilename);
                fs.writeFileSync(targetPath, buffer);
                console.log(`Saved SVG -> ${targetPath}`);
            } else {
                await sharp(buffer)
                    .avif({ quality: 80 })
                    .toFile(targetPath);
                console.log(`Converted to AVIF -> ${targetPath}`);
            }

            uuidToAssetPath.set(uuid, `/src/assets/images/${targetFilename}`);
        } catch (err) {
            console.error(`Error processing ${uuid}:`, err);
        }
    }

    console.log('Replacing Uploadcare URLs in Markdown files...');
    let replacedTotal = 0;

    for (const filePath of files) {
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;

        content = content.replace(ucareRegex, (fullMatch, uuid) => {
            const localPath = uuidToAssetPath.get(uuid);
            if (localPath) {
                modified = true;
                replacedTotal++;
                return localPath;
            }
            return fullMatch;
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf-8');
            console.log(`Updated ${filePath}`);
        }
    }

    console.log(`Migration complete! Replaced ${replacedTotal} Uploadcare URL instances.`);
}

migrate().catch(console.error);
