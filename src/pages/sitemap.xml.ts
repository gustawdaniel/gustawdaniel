import { getCollection } from "astro:content";
import { locales } from "../locales.ts";

export async function GET() {
    const siteUrl = import.meta.env.SITE;
    const posts = await getCollection('blog');

    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">  
  <url>
    <loc>${siteUrl}/</loc>
      ${locales.map(locale => `<xhtml:link
        rel="alternate"
        hreflang="${locale}"
        href="${siteUrl}/${locale === 'en' ? '' : (locale + '/')}" />`).join('')}
  </url>  
  <url><loc>${siteUrl}/posts/</loc></url>  
  ${posts
            .map((post) => {
                const lastMod = (post.data.publishDate).toISOString();
                const translatedPosts = posts.filter(p => p.data.canonicalName === post.data.canonicalName)

                const alternateLinks = translatedPosts.map(p => {
                    const locale = p.slug.split('/')[0];
                    return `<xhtml:link rel="alternate" hreflang="${locale}" href="${siteUrl}/posts/${p.slug}" />`;
                }).join('\n');

                return `<url>
  <loc>${siteUrl}/posts/${post.slug}</loc>
  <lastmod>${lastMod}</lastmod>
  ${alternateLinks}
</url>`;
            })
            .join('\n')}  
</urlset>`.trim(), {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}
