import {defaultLocale} from "../../locales.ts";

export function fixBlogLocale(
    path: string,
    locale: string,
    translatedSlugs?: string[]
): string {
    if (path.includes('posts')) {
        if(Array.isArray(translatedSlugs)) {
            const targetSlug = translatedSlugs.find(slug => slug.startsWith(locale + '/'));
            if(targetSlug) {
                return `/posts/${targetSlug}`
            } else {
                return `/` + (locale === defaultLocale ? '' : (locale))
            }
        }
    }
    return path;
}