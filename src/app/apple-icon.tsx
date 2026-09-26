import { ImageResponse } from 'next/og'

// The icon iOS uses when the site is kept on a home screen.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const INK = '#0B0B0B'
const PAPER = '#F3F2ED'

/** The same planet mark as the share card: a ring road, two streets, four districts. */
export default function AppleIcon() {
  const MID = 90
  const ROAD = 13
  const REACH = 62

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
      }}
    />
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: INK,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: MID - 56,
            top: MID - 56,
            width: 112,
            height: 112,
            borderRadius: 56,
            border: `13px solid ${PAPER}`,
          }}
        />
        {street(true)}
        {street(false)}
        <div
          style={{
            position: 'absolute',
            left: MID - 21,
            top: MID - 21,
            width: 42,
            height: 42,
            borderRadius: 21,
            background: PAPER,
          }}
        />
      </div>
    ),
    size
  )
}
