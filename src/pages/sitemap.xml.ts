import nunjucks from 'nunjucks';
import {type CollectionEntry, getCollection} from "astro:content";
import {execSync} from "child_process";
import path from "node:path";
import {getCanonicalPath} from "../helpers/i18n/getCanonicalPath.ts";
import {locales} from "../locales.ts";

interface AlternateLink {
    hreflang: string;
    href: string;
}

interface ImageLink {
    loc: string;
}

interface SitemapItem {
    loc: string;
    lastMod: string;
    alternateLinks: AlternateLink[],
    imagesLinks?: ImageLink[]
}

function getLangFromPath(path: string): string {
    const langCandidate = path.split('/')[1];
    return (locales as unknown as string[]).includes(langCandidate) ? langCandidate : 'en';
}

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

const template = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
{% for page in pages %}
<url>
  <loc>{{ page.loc }}</loc>
  <lastmod>{{ page.lastMod }}</lastmod>
  {% for link in page.alternateLinks %}
  <xhtml:link rel="alternate" hreflang="{{ link.hreflang }}" href="{{ link.href }}" />
  {% endfor %}
  {% for image in page.imagesLinks %}
  <image:image><image:loc>{{ image.loc }}</image:loc></image:image>
  {% endfor %}
</url>
{% endfor %}
</urlset>`;

function getPages(): SitemapItem[] {
    const siteUrl = import.meta.env.SITE;
    const glob = import.meta.glob('./**/*.{astro,md,mdx}');

    const pages = Object.keys(glob)
        .map(page => {
            const lastModified = execSync(`git --no-pager log -1 --pretty="format:%cI" ${path.resolve()}/src/pages/${page}`).toString();
            page = page.replace(/.astro$/, '')
                .replace(/.mdx$/, '')
                .replace(/.md$/, '')
                .replace(/^.\//, '/')
                .replace(/\/index$/, '');

            return {page, lastModified};
        })
            .filter(({page}) => !page.startsWith('/posts/') && !page.startsWith('/notes/'))
        .map(({page, lastModified}) => ({page: page || '/', lastModified}));

    return pages.sort((a, b) => {
        const aLang = getLangFromPath(a.page);
        const bLang = getLangFromPath(b.page);

        if (aLang === bLang)
            return a.page.localeCompare(b.page)

        return aLang.localeCompare(bLang);
    }).map(({page, lastModified}): SitemapItem => {

        const canonical = getCanonicalPath(page);

        return {
            loc: `${siteUrl}${page || '/'}`,
            lastMod: lastModified,
            alternateLinks: pages
                .filter(p => getCanonicalPath(p.page) === canonical)
                .map((p): AlternateLink => ({
                        hreflang: getLangFromPath(p.page), href: siteUrl + p.page
                    })
                )
        }
    });
}

async function getPosts(): Promise<SitemapItem[]> {
    const siteUrl = import.meta.env.SITE;
    const posts: CollectionEntry<"blog">[] = await getCollection('blog');

    return posts.map((post) => {
        const lastModified = execSync(`git --no-pager log -1 --pretty="format:%cI" ${path.resolve()}/src/content/blog/${post.id}`).toString();
        // const lastMod = (post.data.publishDate).toISOString();
        const translatedPosts = posts.filter(p => p.data.canonicalName === post.data.canonicalName)

        const images = getImageLinks(post.body);

        return {
            loc: `${siteUrl}/posts/${post.slug}`,
            lastMod: lastModified,
            alternateLinks: translatedPosts.map((p): AlternateLink => {
                const locale = p.slug.split('/')[0];
                return {hreflang: locale, href: `${siteUrl}/posts/${p.slug}`};
            }),
            imagesLinks: images.map(image => ({loc: encodeURI(image)}))
        }
    })
}

async function getNotes(): Promise<SitemapItem[]> {
    const siteUrl = import.meta.env.SITE;
    const notes: CollectionEntry<"note">[] = await getCollection('note');

    return notes.map((note) => {
        const lastModified = execSync(`git --no-pager log -1 --pretty="format:%cI" ${path.resolve()}/src/content/note/${note.id}`).toString();

        return {
            loc: `${siteUrl}/notes/${note.slug}`,
            lastMod: lastModified,
            alternateLinks: [{hreflang: 'en', href: `${siteUrl}/notes/${note.slug}`}],
        }
    })
}


export async function GET() {

    nunjucks.configure({autoescape: true});

    const pages: SitemapItem[] = getPages();
    const posts: SitemapItem[] = await getPosts();
    const notes: SitemapItem[] = await getNotes();

    console.log('pages', pages);

    const data: { pages: SitemapItem[] } = {pages: [...pages, ...posts, ...notes]};
    const output:string = nunjucks.renderString(template, data);

    return new Response(output.split('\n').filter((l:string) => l.trim()).join('\n').trim(), {
        headers: {
            'Content-Type': 'application/xml',
        }
    });
}