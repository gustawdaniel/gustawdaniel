import {z, defineCollection} from 'astro:content';

const blogCollection = defineCollection({
    type: 'content', // v2.5.0 and later
    schema: z.object({
        title: z.string(),
        canonicalName: z.string(),
        publishDate: z.date(),
        description: z.string(),
        author: z.string(),
        coverImage: z.string().url(),
        tags: z.array(z.string())
    })
});

const noteCollection = defineCollection({
    type: 'content', // v2.5.0 and later
    schema: z.object({
        title: z.string(),
        publishDate: z.date(),
    })
});

export const collections = {
    'blog': blogCollection,
    'note': noteCollection,
};
