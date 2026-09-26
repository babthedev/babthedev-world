import { AUTHOR, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site'

/**
 * Schema.org data describing who this is and what the site is, so a search result can
 * show a person rather than an anonymous page. Rendered as JSON-LD in the document head.
 */
export default function StructuredData() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#person`,
        name: AUTHOR,
        alternateName: 'Abdulrahman',
        url: SITE_URL,
        jobTitle: 'Software Engineer',
        description: SITE_DESCRIPTION,
        knowsAbout: ['Software engineering', 'WebGL', 'Three.js', 'Interactive 3D', 'Systems design'],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: 'en',
        publisher: { '@id': `${SITE_URL}/#person` },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${SITE_URL}/#profile`,
        url: SITE_URL,
        name: SITE_NAME,
        about: { '@id': `${SITE_URL}/#person` },
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is data, not markup; "<" is escaped so it can never close the tag
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, '\\u003c') }}
    />
  )
}
