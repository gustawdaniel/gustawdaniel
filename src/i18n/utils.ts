import {ui} from "./ui.ts";
import {defaultLocale} from "../locales.ts";

export function useTranslations(lang: keyof typeof ui) {
    return function t(key: keyof typeof ui[typeof defaultLocale]) {
        return ui[lang][key] || ui[defaultLocale][key];
    }
}