import {stripLang} from "./stripLang.ts";

export function fixBlogLocale(
    path: string,
    locale: string,
    translatedSlugs?: string[]
): string {
    if (path.includes('posts')) {
        path = stripLang(path);
        const components = path.split('/');
        components[2] = locale;
        path = components.join('/');

        if(Array.isArray(translatedSlugs)) {
            if(!translatedSlugs.includes(components[2] + '/' + components[3])) {
                return '/' + locale + '/blog'
            }
        }
    }
    return path;
}