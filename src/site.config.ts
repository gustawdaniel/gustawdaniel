import type { SiteConfig } from "@/data/types";

export const siteConfig: SiteConfig = {
  author: "Daniel Gustaw",
  // Meta property used to construct the meta title property, found in src/components/BaseHead.astro L:11
  title: "Programmers blog",
  // Meta property used as a default description meta property
  description:
    "Blog about scraping, data processing and programming in node js, typescript, perl, php, python technologies.",
  // HTML lang property, found in src/layouts/Base.astro L:18
  lang: "en-GB",
  // Meta property, found in src/components/BaseHead.astro L:42
  ogLocale: "en_GB",
  // Date.prototype.toLocaleDateString() parameters, found in src/utils/date.ts.
  date: {
    locale: "en-GB",
    options: {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  },
};

// Used to generate links in both the Header & Footer.
export const menuLinks: Array<{ title: string; path: string }> = [
  {
    title: "Home",
    path: "/",
  },
  {
    title: "About",
    path: "/about/",
  },
  {
    title: "Blog",
    path: "/posts/",
  },
];
