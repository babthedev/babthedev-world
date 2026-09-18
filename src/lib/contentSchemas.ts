import { z } from 'zod'

export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

export const EssayFrontmatterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: DateStringSchema,
  description: z.string().optional(),
  readingTime: z.number().positive().optional(),
})

export const ProjectFrontmatterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: DateStringSchema,
  category: z.string().min(1, 'Category is required'),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  description: z.string().optional(),
})

export const BioFrontmatterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  role: z.string().min(1, 'Role is required'),
  location: z.string().min(1, 'Location is required'),
})

export const BookFrontmatterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: DateStringSchema,
  chapters: z.array(z.string()).optional(),
})

export type EssayFrontmatter = z.infer<typeof EssayFrontmatterSchema>
export type ProjectFrontmatter = z.infer<typeof ProjectFrontmatterSchema>
export type BioFrontmatter = z.infer<typeof BioFrontmatterSchema>
export type BookFrontmatter = z.infer<typeof BookFrontmatterSchema>

export function validateFrontmatter(
  folder: 'essays',
  slug: string,
  rawFrontmatter: unknown
): EssayFrontmatter
export function validateFrontmatter(
  folder: 'projects',
  slug: string,
  rawFrontmatter: unknown
): ProjectFrontmatter
export function validateFrontmatter(
  folder: 'bio',
  slug: string,
  rawFrontmatter: unknown
): BioFrontmatter
export function validateFrontmatter(
  folder: 'books',
  slug: string,
  rawFrontmatter: unknown
): BookFrontmatter
export function validateFrontmatter(
  folder: string,
  slug: string,
  rawFrontmatter: unknown
): Record<string, any>
export function validateFrontmatter(
  folder: string,
  slug: string,
  rawFrontmatter: unknown
): any {
  let schema: z.ZodSchema
  switch (folder) {
    case 'essays':
      schema = EssayFrontmatterSchema
      break
    case 'projects':
      schema = ProjectFrontmatterSchema
      break
    case 'bio':
      schema = BioFrontmatterSchema
      break
    case 'books':
      schema = BookFrontmatterSchema
      break
    default:
      // Fallback permissive schema for unrecognized folders
      schema = z.record(z.string(), z.any())
  }

  const result = schema.safeParse(rawFrontmatter)
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - [${issue.path.join('.')}]: ${issue.message}`)
      .join('\n')
    throw new Error(
      `\n[MDX Frontmatter Validation Error]\nFile: src/content/${folder}/${slug}.mdx\n${errorDetails}\n`
    )
  }

  return result.data
}
