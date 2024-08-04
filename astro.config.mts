import { defineConfig } from 'astro/config';
import {locales} from "./src/locales.ts";

// https://astro.build/config
export default defineConfig({
    i18n: {
        defaultLocale: "en",
        locales,
    }
});
