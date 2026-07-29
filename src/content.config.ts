import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
    schema: z.object({
        title: z.string(),
        canonicalName: z.string(),
        publishDate: z.date(),
        description: z.string(),
        author: z.string(),
        coverImage: z.string(),
        tags: z.array(z.string())
    })
});

const note = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/note' }),
    schema: z.object({
        title: z.string(),
        publishDate: z.date(),
    })
});

export const collections = {
    blog,
    note
};
