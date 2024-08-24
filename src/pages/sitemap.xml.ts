import {getCollection} from "astro:content";
import {locales} from "../locales.ts";

function getLangFromPath(path: string): string {
    const langCandidate = path.split('/')[1];
    return (locales as unknown as string[]).includes(langCandidate) ? langCandidate : 'en';
}

function getCanonicalPath(path: string): string {
    return path.replace(/^\/pl/, '').replace(/^\/es/, '') || '/';
}

import {execSync} from 'child_process';
import path from "node:path";

function getImageLinks(markdown: string): string[] {
    // Regular expression to match image links
    const imageRegex = /!\[.*?\]\((.*?)\)/g;
    const imageLinks: string[] = [];
    let match: RegExpExecArray | null;

    // Execute regex to find all matches
    while ((match = imageRegex.exec(markdown)) !== null) {
        // Extract the URL from the match and add it to the array
        imageLinks.push(match[1]);
    }

    return imageLinks;
}

export async function GET() {
    const siteUrl = import.meta.env.SITE;
    const posts = await getCollection('blog');


    const glob = await import.meta.glob('./**/*.{astro,md,mdx}');
    const pages: { page: string, lastModified: string }[] =
        Object.keys(glob)
            .map(page => {
                const lastModified = execSync(`git --no-pager log -1 --pretty="format:%cI" ${path.resolve()}/src/pages/${page}`).toString();
                page = page.replace(/.astro$/, '')
                    .replace(/.mdx$/, '')
                    .replace(/.md$/, '')
                    .replace(/^.\//, '/')
                    .replace(/\/index$/, '');

                return {page, lastModified};
            }).filter(({page}) => !page.startsWith('/posts/'))
            .map(({page, lastModified}) => ({page: page || '/', lastModified}));

    const response = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">  
${pages.sort((a, b) => {
        const aLang = getLangFromPath(a.page);
        const bLang = getLangFromPath(b.page);

        if (aLang === bLang)
            return a.page.localeCompare(b.page)

        return aLang.localeCompare(bLang);
    }).map(({page, lastModified}) => {

        const canonical = getCanonicalPath(page);
        const alternateLinks = pages.filter(p => getCanonicalPath(p.page) === canonical).map(p => {
            return `<xhtml:link rel="alternate" hreflang="${getLangFromPath(p.page)}" href="${siteUrl}${p.page}" />`
        }).join('\n  ');

        return `<url>
  <loc>${siteUrl}${page || '/'}</loc>
  <lastmod>${lastModified}</lastmod>
  ${alternateLinks}
</url>`;
    }).join('\n')}
${posts
        .map((post) => {
            const lastModified = execSync(`git --no-pager log -1 --pretty="format:%cI" ${path.resolve()}/src/content/blog/${post.id}`).toString();
            // const lastMod = (post.data.publishDate).toISOString();
            const translatedPosts = posts.filter(p => p.data.canonicalName === post.data.canonicalName)

            const images = getImageLinks(post.body);

            const imagesLinks = images.map(image => `<image:image><image:loc>${encodeURI(image).replaceAll('&', '&amp;')}</image:loc></image:image>`).join('\n  ');

            const alternateLinks = translatedPosts.map(p => {
                const locale = p.slug.split('/')[0];
                return `<xhtml:link rel="alternate" hreflang="${locale}" href="${siteUrl}/posts/${p.slug}" />`;
            }).join('\n  ');

            return `<url>
  <loc>${siteUrl}/posts/${post.slug}</loc>
  <lastmod>${lastModified}</lastmod>
  ${alternateLinks}
  ${imagesLinks}
</url>`;
        })
        .join('\n')}  
</urlset>`.split('\n').filter(l => l.trim()).join('\n').trim();



    return new Response(
        response, {
            headers: {
                'Content-Type': 'application/xml',
            },
        });
}
