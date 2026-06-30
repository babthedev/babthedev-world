import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'src/content');

export function getMdxContent(folder: string) {
  const fullPath = path.join(contentDirectory, folder);
  if (!fs.existsSync(fullPath)) return [];

  const fileNames = fs.readdirSync(fullPath);
  return fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => {
      const filePath = path.join(fullPath, fileName);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug: fileName.replace(/\.mdx$/, ''),
        frontmatter: data,
        content,
      };
    });
}
