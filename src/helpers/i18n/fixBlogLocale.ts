import {defaultLocale} from "../../locales.ts";
import {getCanonicalPath} from "./getCanonicalPath.ts";

export function fixBlogLocale(
    path: string,
    locale: string,
    translatedSlugs?: string[]
): string {
    const canonical = getCanonicalPath(path)

    console.log(path, locale, translatedSlugs, canonical)

    if (canonical.startsWith('/posts')) {
        if(Array.isArray(translatedSlugs)) {
            const targetSlug = translatedSlugs.find(slug => slug.startsWith(locale + '/'));
            if(targetSlug) {
                return `/posts/${targetSlug}`
            } else {
                return `/` + (locale === defaultLocale ? '' : (locale))
            }
        } else if(path.startsWith('/' + locale + '/')) {
            return path.replace('/' + locale, '');
        }
    } else if (canonical.startsWith('/notes') && locale !== defaultLocale) {
        return `/${locale}/notes`;

    }
    return path;
}