// TODO:NEW
import { defaultLang, ui } from "./ui";
import { locales } from "@/data/locales";

function getLocale(url: string) {}

export function getLangFromUrl(url: URL) {
  // const [, lang] = url.pathname.split("/");
  const locale = getLocale(url);

  if (locale && locale in ui) return locale as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export const showDefaultLang = false;

export function useTranslatedPath(lang: keyof typeof ui) {
  return function translatePath(path: string, l: string = lang) {
    const pathWithLanguage =
      !showDefaultLang && l === defaultLang ? path : `/${l}${path}`;
    return pathWithLanguage.replace(/\/$/, "") || "/";
  };
}

function stringToLang(lang?: string): keyof typeof locales {
  switch (lang) {
    case "pl":
      return "pl";
    case "es":
      return "es";
    case "ru":
      return "ru";
    case "de":
      return "de";
    default:
      return "en";
  }
}

export function getLangAndSlugFromUrl(slugWithLang: string): {
  lang: keyof typeof locales;
  slug: string | undefined;
} {
  const [lang, ...slug] = slugWithLang.split("/");
  return { lang: stringToLang(lang), slug: slug.join("/") || undefined };
}
