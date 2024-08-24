import {getCollection} from "astro:content";
import {locales} from "../locales.ts";

export async function GET() {
    const siteUrl = import.meta.env.SITE;
    const posts = await getCollection('blog');

    const result = `  
<?xml version="1.0" encoding="UTF-8"?>  

  `.trim();

    // <urlset
    //     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    // xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd
    // http://www.w3.org/1999/xhtml http://www.w3.org/2002/08/xhtml/xhtml1-strict.xsd"
    //     xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    // xmlns:xhtml="http://www.w3.org/1999/xhtml"
    //     >

    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">  
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
                return `<url><loc>${siteUrl}/posts/${post.slug}/</loc><lastmod>${lastMod}</lastmod></url>`;
            })
            .join('\n')}  
</urlset>`.trim(), {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}