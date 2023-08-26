import { defaultLang, locales } from "@/data/locales";

// TODO:NEW

// function getLocale(url: string) {}
//
// export function getLangFromUrl(url: URL) {
// 	// const [, lang] = url.pathname.split("/");
// 	const locale = getLocale(url);
//
// 	if (locale && locale in ui) return locale as keyof typeof ui;
// 	return defaultLang;
// }
//
// export function useTranslations(lang: keyof typeof ui) {
// 	return function t(key: keyof (typeof ui)[typeof defaultLang]) {
// 		return ui[lang][key] || ui[defaultLang][key];
// 	};
// }

export function useTranslatedPath(lang: keyof typeof locales) {
	return function translatePath(path: string, l = lang) {
		const site = import.meta.env.SITE;
		const domain = site.replace(
			/https:\/\/(pl|de|ru|es)?\.?([\w.])/,
			`https://${l === defaultLang ? "" : l + "."}$2`
		);

		return `${domain}${path}`;
	};
}

// function stringToLang(lang?: string): keyof typeof locales {
// 	switch (lang) {
// 		case "pl":
// 			return "pl";
// 		case "es":
// 			return "es";
// 		case "ru":
// 			return "ru";
// 		case "de":
// 			return "de";
// 		default:
// 			return "en";
// 	}
// }
//
// export function getLangAndSlugFromUrl(slugWithLang: string): {
// 	lang: keyof typeof locales;
// 	slug: string | undefined;
// } {
// 	const [lang, ...slug] = slugWithLang.split("/");
// 	return { lang: stringToLang(lang), slug: slug.join("/") || undefined };
// }
