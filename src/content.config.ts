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
        date: z.string().regex(/^(\d{4}(-(?:0[1-9]|1[0-2]))?)?$/, "date must be YYYY, YYYY-MM, or empty"),
        image: z.string(),
        technologies: z.array(z.string()),
    }),
});

export const collections = {
    works,
};