import { locales } from '../../locales';

export function stripLang(path: string): string {
    let clearPath = path;
    for(const locale of locales) {
        if (clearPath.startsWith(`/${locale}/`)) {
            clearPath = clearPath.substring(locale.length + 1)
        } else if (clearPath.startsWith(`${locale}/`)) {
            clearPath = clearPath.substring(locale.length)
        }
    }
    return clearPath;
}