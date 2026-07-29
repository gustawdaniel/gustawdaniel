import {defaultLocale} from "../../locales.ts";
import {getCanonicalPath} from "./getCanonicalPath.ts";

export function fixBlogLocale(
    path: string,
    locale: string,
    translatedSlugs?: string[]
): string {
    const canonical = getCanonicalPath(path)

    if (canonical.startsWith('/posts') || canonical.startsWith('/notes')) {
        const prefix = canonical.startsWith('/posts') ? '/posts' : '/notes';
        if(Array.isArray(translatedSlugs)) {
            const targetSlug = translatedSlugs.find(slug => slug.startsWith(locale + '/'));
            if(targetSlug) {
                return `${prefix}/${targetSlug}`
            } else {
                return (locale === defaultLocale ? prefix : `/${locale}${prefix}`)
            }
        } else if(path.startsWith('/' + locale + '/')) {
            return path.replace('/' + locale, '');
        }
    }
    return path;
}