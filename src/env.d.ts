// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client-image" />

import { locales } from "@/data/locales";

interface ImportMetaEnv {
	readonly PUBLIC_LANG: keyof typeof locales;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
