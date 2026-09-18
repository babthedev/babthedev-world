# BabWorld — Authoring Guide & Editorial Handbook

Welcome to the BabWorld editorial manual. This guide describes how to write, format, validate, and publish content to BabWorld.

---

## 1. Quick Start: 1-Command Publish Flow

1. Create a `.mdx` file in the appropriate folder under `src/content/`:
   - `src/content/essays/`
   - `src/content/projects/`
   - `src/content/bio/`
   - `src/content/books/`
2. Run the pre-commit quality gate:
   ```bash
   pnpm pre-commit
   ```
   *(This validates all frontmatter with Zod, runs math unit tests, and verifies TypeScript types)*.
3. Build and verify:
   ```bash
   pnpm build
   ```
   *(This automatically regenerates `public/feed.xml` RSS and builds static pages)*.
4. Commit and push:
   ```bash
   git add src/content/...
   git commit -m "content(essays): add my new essay"
   git push origin main
   ```

---

## 2. Content Types & Frontmatter Schemas

Every MDX file must contain frontmatter strictly adhering to its Zod schema defined in `src/lib/contentSchemas.ts`.

### A. Essays (`src/content/essays/`)

```yaml
---
title: "The Case for Brutalist Web Architecture"
date: "2026-09-15"
description: "Why high-contrast monochrome design outlasts transient UI trends."
readingTime: 6
---
```

### B. Projects (`src/content/projects/`)

```yaml
---
title: "The Archive"
date: "2026-09-17"
category: "Data Systems"
url: "https://github.com/example/archive"
description: "High-speed document indexing and technical search engine."
---
```

### C. Biography & Profile (`src/content/bio/`)

```yaml
---
title: "Abdulrahman — Curriculum Vitae"
role: "Full-Stack & Graphics Engineer"
location: "London / Remote"
---
```

### D. Books & Long-Form Volumes (`src/content/books/`)

```yaml
---
title: "Spatial Computation on Curved Surfaces"
date: "2026-09-18"
chapters:
  - "Geodesics and Tangent Space"
  - "Radial Physics Systems"
  - "Post-Processing in Monochromatic Realms"
---
```

---

## 3. Curated Monochrome Components

You can use specialized brutalist markdown components inline in your MDX files:

### Callouts
```mdx
<Callout type="note" title="Engineering Constraint">
Radial gravity requires applying forces per-tick toward (0,0,0).
</Callout>
```

### Editorial Pull Quotes
```mdx
<Blockquote author="Dieter Rams" citation="Less, but better">
Good design is as little design as possible.
</Blockquote>
```

### Captioned Images with Fullscreen Lightbox
```mdx
![50m Sphere Wireframe Diagram](/kenney/Textures/colormap.png "Figure 1: Normal-aligned tangent projection grid")
```

### 1-Click Code Copy Blocks
Standard triple backtick blocks automatically render with a 1-click clipboard copy button:
````md
```typescript
const normal = position.clone().normalize();
```
````

---

## 4. Media & Asset Standards

- **Asset Storage:** All images must be placed in `/public/images/` or `/public/kenney/`. Zero external CDNs.
- **Image Formats:** WebP or PNG preferred. Maximum width: 1920px. Keep file size under 400KB per image.
- **Audio Foley:** Procedural Web Audio is used by default. Any external sound stems must be Opus (`.webm`) with AAC/MP3 fallback under 600KB total budget.

---

## 5. Verification Commands

| Command | Action |
|---|---|
| `pnpm validate:content` | Runs Zod frontmatter validation across all `.mdx` files |
| `pnpm generate:rss` | Builds `public/feed.xml` RSS 2.0 feed |
| `pnpm test` | Runs sphere mathematics test suite |
| `pnpm pre-commit` | Runs validation + tests + TypeScript check |
| `pnpm build` | Full production build with Turbopack |
