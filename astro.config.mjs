import {defineConfig} from "astro/config";
import mdx from "@astrojs/mdx";
import {defaultLocaleSitemapFilter, i18n} from "astro-i18n-aut";
import sitemap from "@astrojs/sitemap";

const defaultLocale = "en";
const locales = {
  en: "en-US", // the `defaultLocale` value must present in `locales` keys
  es: "es-ES",
  fr: "fr-CA",
};

// https://astro.build/config
export default defineConfig({
  site: "https://example.com/",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  integrations: [
    mdx(),
    i18n({
      locales,
      defaultLocale,
      exclude: [
        "pages/api/**/*",
        "pages/rss.xml.ts",
        "pages/[locale]/rss.xml.ts",
      ],
    }),
    sitemap({
      i18n: {
        locales,
        defaultLocale,
      },
      filter: defaultLocaleSitemapFilter({ defaultLocale }),
    }),
  ],
});
