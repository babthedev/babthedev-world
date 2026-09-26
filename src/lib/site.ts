/**
 * One source of truth for how the site describes itself: page metadata, the share
 * card, the sitemap and the RSS feed all read from here, so they can never drift.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://babthedev.com'

export const SITE_NAME = "Abdulrahman's Hub"

export const AUTHOR = 'Abdulrahman Bello'

/** Under 160 characters, so search results and link previews show it whole. */
export const SITE_DESCRIPTION =
  'An interactive portfolio you walk through: a hand-inked black-and-white planet of projects, essays and ideas by Abdulrahman Bello.'

/** Shown on the share card, where there is room for a sentence rather than a summary. */
export const SITE_TAGLINE = 'Walk a hand-inked planet of projects, essays and ideas.'

export const SITE_ROLE = 'SPATIAL PORTFOLIO'

export const KEYWORDS = [
  'Abdulrahman Bello',
  'portfolio',
  'interactive portfolio',
  'WebGL',
  'three.js',
  'creative developer',
  'software engineer',
  '3D web',
  'essays',
]

/** Every route worth indexing, with how it should be titled and described. */
export const ROUTES = [
  {
    path: '/',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    priority: 1,
  },
  {
    path: '/projects',
    title: 'Projects Exhibition',
    description: 'Case studies from the exhibition district: what Abdulrahman Bello built, and how each piece works.',
    priority: 0.8,
  },
  {
    path: '/essays',
    title: 'The Library',
    description: 'Essays and notes on systems, craft and the 3D web, read from the library district.',
    priority: 0.8,
  },
  {
    path: '/bio',
    title: 'Welcome Terrace',
    description: 'Who Abdulrahman Bello is, what he works on, and how to get in touch.',
    priority: 0.7,
  },
] as const
