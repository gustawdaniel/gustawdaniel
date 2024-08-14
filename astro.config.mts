import { defineConfig } from 'astro/config';
import { locales } from "./src/locales.ts";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  i18n: {
    defaultLocale: "en",
    locales
  },
  integrations: [
      tailwind({
        applyBaseStyles: false
      })
  ]
});
