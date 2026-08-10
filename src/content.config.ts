import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const works = defineCollection({
    loader: glob({
        pattern: "**/*.md",
        base: "./src/content/works",
    }),

    schema: z.object({
        title: z.string(),
        description: z.string(),
        year: z.number(),
        image: z.string(),
        technologies: z.array(z.string()),
    }),
});

export const collections = {
    works,
};