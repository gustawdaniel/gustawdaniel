import rss from '@astrojs/rss';
import {getCollection, type CollectionEntry} from "astro:content";
import type {AstroConfig} from "astro";

export async function GET(context: AstroConfig) {
    const blog: CollectionEntry<"blog">[] = await getCollection('blog');

    return rss({
        stylesheet: '/pretty-feed-v3.xsl',
        // `<title>` field in output xml
        title: 'Daniel Gustaw',
        // `<description>` field in output xml
        description: 'Programmers Blog',
        // Pull in your project "site" from the endpoint context
        // https://docs.astro.build/en/reference/api-reference/#contextsite
        site: context.site ?? import.meta.env.SITE,
        // Array of `<item>`s in output xml
        // See "Generating items" section for examples using content collections and glob imports
        items: blog
            .filter(({slug}: CollectionEntry<"blog">): boolean => slug.startsWith('en/'))
            .map((post: CollectionEntry<"blog">) => ({
                title: post.data.title,
                pubDate: post.data.publishDate,
                description: post.data.description,
                // customData: post.data.customData,
                content: post.body,
                // Compute RSS link from post `slug`
                // This example assumes all posts are rendered as `/blog/[slug]` routes
                link: `/posts/${post.slug}/`,
            })),
        // (optional) inject custom xml
        customData: `<language>en-us</language>`,
    });
}