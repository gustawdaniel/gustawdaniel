import type { ImageMetadata } from 'astro';

const images = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/*', { eager: true });

export function getImageAsset(urlOrFilename: string): ImageMetadata | string {
    if (!urlOrFilename) return urlOrFilename;
    const filename = urlOrFilename.split('/').pop()?.split('?')[0];
    if (!filename) return urlOrFilename;

    const key = `/src/assets/images/${filename}`;
    if (key in images) {
        return images[key].default;
    }
    return urlOrFilename;
}
