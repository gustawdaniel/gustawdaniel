import { defineConfig, sharpImageService } from "astro/config";
import { defaultLocaleSitemapFilter, i18n } from "astro-i18n-aut/integration";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import prefetch from "@astrojs/prefetch";
import remarkUnwrapImages from "remark-unwrap-images";
import { locales } from "./src/data/locales";

const defaultLocale = "en";

// https://astro.build/config
export default defineConfig({
	// ! Please remember to replace the following site property with your own domain
	site: "https://gustawdaniel.com",
	trailingSlash: "never",
	build: {
		format: "file",
	},
	markdown: {
		remarkPlugins: [remarkUnwrapImages],
		shikiConfig: {
			theme: "dracula",
			wrap: true,
		},
	},
	experimental: {
		assets: true,
	},
	image: {
		// https://docs.astro.build/en/guides/assets/#using-sharp
		service: sharpImageService(),
	},
	integrations: [
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		i18n({
			locales,
			defaultLocale,
		}),
		mdx({}),
		tailwind({
			applyBaseStyles: false,
		}),
		sitemap({
			i18n: {
				locales,
				defaultLocale,
			},
			filter: defaultLocaleSitemapFilter({ defaultLocale }),
		}),
		prefetch(),
	],
	compressHTML: true,
	vite: {
		optimizeDeps: {
			exclude: ["@resvg/resvg-js"],
		},
	},
});
