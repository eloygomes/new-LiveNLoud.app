import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    audience: z.enum(['usuario', 'desenvolvedor', 'operacao', 'arquitetura', 'referencia']),
    visibility: z.enum(['public', 'restricted']),
    status: z.enum(['draft', 'review', 'stable', 'deprecated']),
    featureStatus: z.enum(['delivered', 'beta', 'planned', 'legacy']),
    owner: z.enum(['produto', 'tecnico', 'operacao', 'seguranca']),
    validatedAt: z.coerce.date(),
    validatedCommit: z.string().regex(/^[a-f0-9]{7,40}$/),
    reviewers: z.array(z.enum(['produto', 'tecnico', 'operacao', 'seguranca', 'linguagem'])).min(1),
    tags: z.array(z.string()).min(1),
    order: z.number().int().nonnegative(),
  }),
});

export const collections = { docs };
