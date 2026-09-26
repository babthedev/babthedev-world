import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SITE_NAME, SITE_ROLE, SITE_TAGLINE, SITE_URL } from '@/lib/site'

// The card people see when the link is pasted into a message, a post or a chat.
// Drawn here rather than screenshotted so it stays crisp and on-brand at any size.
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const INK = '#0B0B0B'
const PAPER = '#F3F2ED'
const GROUND = '#D9D7D0'

/** The world font, if it is readable at build time. Falling back to the default never fails the build. */
async function worldFont() {
  try {
    const data = await readFile(join(process.cwd(), 'public', 'fonts', 'Geist-Regular.ttf'))
    return [{ name: 'Geist', data, style: 'normal' as const, weight: 400 as const }]
  } catch {
    return undefined
  }
}

/** A mark echoing the in-world minimap: the ring road, two crossed streets, four districts. */
function GlobeMark() {
  const SIZE = 248
  const INNER = SIZE - 16 // inside the 8px rim
  const MID = INNER / 2
  const ROAD = 13
  const REACH = 92 // how far a street runs from the centre
  const DIST = 24 // district diamond

  const street = (vertical: boolean) => (
    <div
      key={vertical ? 'v' : 'h'}
      style={{
        position: 'absolute',
        left: vertical ? MID - ROAD / 2 : MID - REACH,
        top: vertical ? MID - REACH : MID - ROAD / 2,
        width: vertical ? ROAD : REACH * 2,
        height: vertical ? REACH * 2 : ROAD,
        background: PAPER,
        border: `3px solid ${INK}`,
      }}
    />
  )
  const district = (dx: number, dy: number) => (
    <div
      key={`${dx}-${dy}`}
      style={{
        position: 'absolute',
        left: MID + dx - DIST / 2,
        top: MID + dy - DIST / 2,
        width: DIST,
        height: DIST,
        background: INK,
        border: `4px solid ${PAPER}`,
        transform: 'rotate(45deg)',
      }}
    />
  )

  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        background: GROUND,
        border: `8px solid ${INK}`,
        overflow: 'hidden',
      }}
    >
      {/* ring road */}
      <div
        style={{
          position: 'absolute',
          left: MID - 84,
          top: MID - 84,
          width: 168,
          height: 168,
          borderRadius: 84,
          border: `13px solid ${PAPER}`,
        }}
      />
      {street(true)}
      {street(false)}
      {/* the hub plaza */}
      <div
        style={{
          position: 'absolute',
          left: MID - 27,
          top: MID - 27,
          width: 54,
          height: 54,
          borderRadius: 27,
          background: PAPER,
          border: `4px solid ${INK}`,
        }}
      />
      {district(0, -REACH)}
      {district(0, REACH)}
      {district(-REACH, 0)}
      {district(REACH, 0)}
    </div>
  )
}

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: PAPER,
          padding: 56,
          fontFamily: 'Geist, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            border: `10px solid ${INK}`,
            background: PAPER,
            padding: '52px 60px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 620, marginRight: 44 }}>
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                background: INK,
                color: PAPER,
                fontSize: 26,
                letterSpacing: 8,
                padding: '10px 20px',
                marginBottom: 30,
              }}
            >
              {SITE_ROLE}
            </div>
            <div style={{ display: 'flex', fontSize: 86, lineHeight: 1, color: INK, letterSpacing: -2 }}>
              ABDULRAHMAN
            </div>
            <div style={{ display: 'flex', width: 190, height: 10, background: INK, margin: '30px 0' }} />
            <div style={{ display: 'flex', fontSize: 34, lineHeight: 1.32, color: INK, opacity: 0.82 }}>
              {SITE_TAGLINE}
            </div>
            <div style={{ display: 'flex', marginTop: 38, fontSize: 25, letterSpacing: 4, color: INK, opacity: 0.6 }}>
              {SITE_URL.replace(/^https?:\/\//, '')}
            </div>
          </div>
          <GlobeMark />
        </div>
      </div>
    ),
    { ...size, fonts: await worldFont() }
  )
}
