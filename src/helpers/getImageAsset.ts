export function getImageAsset(urlOrFilename: string): string {
    if (!urlOrFilename) return urlOrFilename;
    const filename = urlOrFilename.split('/').pop()?.split('?')[0];
    if (!filename) return urlOrFilename;
    return `https://preciselab.fra1.digitaloceanspaces.com/blog/img/${filename}`;
}
