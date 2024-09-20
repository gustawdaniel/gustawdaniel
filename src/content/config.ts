import { defineCollection, z } from "astro:content";

function removeDuplicatesAndLowerCase(array: string[]) {
	if (!array.length) return array;
	const lowercaseItems = array.map((str) => str.toLowerCase());
	const distinctItems = new Set(lowercaseItems);
	return Array.from(distinctItems);
}

const post = defineCollection({
	type: "content",
	schema: () =>
		z.object({
			title: z.string().max(80),
			excerpt: z.string().min(50).max(220),
			publishDate: z
				.string()
				.or(z.date())
				.transform((val) => new Date(val)),
			updatedDate: z
				.string()
				.optional()
				.transform((str) => (str ? new Date(str) : undefined)),
			coverImage: z.string().optional(), // image().optional(),
			tags: z.array(z.string()).default([]).transform(removeDuplicatesAndLowerCase),
			ogImage: z.string().optional(),
		}),
});

export const collections = { post };
