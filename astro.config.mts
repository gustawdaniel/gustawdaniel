import { defineConfig } from 'astro/config';
import { defaultLocale, locales } from "./src/locales.ts";
import tailwind from "@astrojs/tailwind";
import alpinejs from "@astrojs/alpinejs";
import type { Locales } from "astro";
import { redirects } from "./src/helpers/redirects.ts";
import pagefind from "astro-pagefind";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
// redirect /author/daniel/
// https://astro.build/config
export default defineConfig({
  site: 'https://gustawdaniel.com',
  redirects,
  image: {
    domains: ['ucarecdn.com', 'preciselab.fra1.digitaloceanspaces.com']
  },
  i18n: {
    defaultLocale,
    locales: locales as unknown as Locales
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    alpinejs(),
    pagefind(),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      // Choose from Shiki's built-in themes (or add your own)
      // https://shiki.style/themes
      // theme: 'dracula',
      // Alternatively, provide multiple themes
      // See note below for using dual light/dark themes
      themes: {
        light: 'tokyo-night',
        // light: 'snazzy-light',
        // 'github-light',
        dark: 'dracula'
      },
      // Disable the default colors
      // https://shiki.style/guide/dual-themes#without-default-color
      // (Added in v4.12.0)
      // defaultColor: 'dark',
      // Add custom languages
      // Note: Shiki has countless langs built-in, including .astro!
      // https://shiki.style/languages
      // @ts-ignore
      langs: ['js'],
      // Enable word wrap to prevent horizontal scrolling
      wrap: true,
      // Add custom transformers: https://shiki.style/guide/transformers
      // Find common transformers: https://shiki.style/packages/transformers
      transformers: []
    }
  }
});