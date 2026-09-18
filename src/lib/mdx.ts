import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { validateFrontmatter } from './contentSchemas';

const contentDirectory = path.join(process.cwd(), 'src/content');

export function getMdxContent<T = Record<string, any>>(folder: string): Array<{
  slug: string
  frontmatter: T
  content: string
}> {
  const fullPath = path.join(contentDirectory, folder);
  if (!fs.existsSync(fullPath)) return [];

  const fileNames = fs.readdirSync(fullPath);
  return fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const filePath = path.join(fullPath, fileName);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      // Q71: Strict build-time / load-time Zod schema validation
      const validatedFrontmatter = validateFrontmatter(folder, slug, data) as T;

      return {
        slug,
        frontmatter: validatedFrontmatter,
        content,
      };
    });
}
