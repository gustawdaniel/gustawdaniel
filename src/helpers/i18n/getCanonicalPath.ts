
export function getCanonicalPath(path: string): string {
    return path.replace(/^\/pl/, '').replace(/^\/es/, '') || '/';
}