import { PLANET_RADIUS } from './constants'
import { polarToCartesian, getSurfaceNormal } from './sphereMath'
import type { DistrictName } from './worldCoordinates'

/**
 * Content type determines the visual representation in the 3D world.
 * Each type maps to a different Kenney asset and placement style.
 */
export type ContentType = 'essay' | 'project' | 'book' | 'video'

/**
 * A content placement describes where a piece of content should appear
 * on the sphere surface. Generated automatically from MDX frontmatter.
 */
export interface ContentPlacement {
  slug: string
  title: string
  type: ContentType
  district: DistrictName
  /** Spherical coordinates: theta (azimuth), phi (inclination from north pole) */
  theta: number
  phi: number
  /** Computed Cartesian position on the sphere surface */
  position: [number, number, number]
  /** Kenney model to use as the pedestal/prop */
  model: string
  /** Whether this content is interactive (opens ReadingPanel) */
  interactive: boolean
  /** Panel slug for ReadingPanel */
  panelId: string
}

/**
 * District configuration for content auto-placement.
 * Each district occupies a wedge of the sphere, defined by an angular range.
 */
interface DistrictWedge {
  district: DistrictName
  /** Center azimuth angle in radians */
  thetaCenter: number
  /** Angular spread in radians (content distributed within ± spread/2) */
  thetaSpread: number
  /** Latitude band: phi range from north pole */
  phiMin: number
  phiMax: number
}

/**
 * District wedge assignments on the sphere.
 * Hub is at the north pole, districts fan out around the equator.
 *
 * Layout (top-down view, north pole at center):
 *   - Hub: north pole area (phi 0 to PI/6)
 *   - Bio: west quadrant (theta ~PI, phi PI/4 to PI/2)
 *   - Projects: east quadrant (theta ~0, phi PI/4 to PI/2)
 *   - Essays: south quadrant (theta ~PI/2, phi PI/4 to PI/2)
 */
const DISTRICT_WEDGES: DistrictWedge[] = [
  {
    district: '/bio',
    thetaCenter: Math.PI,           // West
    thetaSpread: Math.PI / 3,       // 60° wide
    phiMin: Math.PI / 4,
    phiMax: Math.PI / 2,
  },
  {
    district: '/projects',
    thetaCenter: 0,                 // East
    thetaSpread: Math.PI / 3,
    phiMin: Math.PI / 4,
    phiMax: Math.PI / 2,
  },
  {
    district: '/essays',
    thetaCenter: -Math.PI / 2,      // South (in XZ plane)
    thetaSpread: Math.PI / 3,
    phiMin: Math.PI / 4,
    phiMax: Math.PI / 2,
  },
]

/** Map content type to a Kenney model for the pedestal/prop */
const TYPE_MODELS: Record<ContentType, string> = {
  essay: 'construction-barrier.glb',
  project: 'construction-cone.glb',
  book: 'construction-barrier.glb',
  video: 'light-square.glb',
}

/**
 * Infer content type from the MDX folder name.
 */
function inferContentType(folder: string): ContentType {
  switch (folder) {
    case 'essays':
      return 'essay'
    case 'projects':
      return 'project'
    default:
      return 'essay'
  }
}

/**
 * Infer the district from the content folder.
 */
function inferDistrict(folder: string): DistrictName {
  switch (folder) {
    case 'bio':
      return '/bio'
    case 'projects':
      return '/projects'
    case 'essays':
      return '/essays'
    default:
      return '/'
  }
}

/**
 * Given an array of content items (from getMdxContent), automatically
 * generate sphere-surface placements distributed within each district's
 * angular wedge.
 *
 * Items within the same district are evenly spaced along the azimuth
 * within the wedge, with a slight phi offset for visual variety.
 */
export function autoPlaceContent(
  items: Array<{
    slug: string
    frontmatter: Record<string, any>
    folder: string
  }>
): ContentPlacement[] {
  // Group items by district
  const grouped = new Map<DistrictName, typeof items>()
  for (const item of items) {
    const district = inferDistrict(item.folder)
    if (!grouped.has(district)) grouped.set(district, [])
    grouped.get(district)!.push(item)
  }

  const placements: ContentPlacement[] = []

  for (const wedge of DISTRICT_WEDGES) {
    const districtItems = grouped.get(wedge.district) ?? []
    const count = districtItems.length
    if (count === 0) continue

    districtItems.forEach((item, i) => {
      // Distribute azimuthally within the wedge
      const thetaOffset = count === 1
        ? 0
        : (i / (count - 1) - 0.5) * wedge.thetaSpread
      const theta = wedge.thetaCenter + thetaOffset

      // Alternate phi slightly for visual variety
      const phiRange = wedge.phiMax - wedge.phiMin
      const phi = wedge.phiMin + phiRange * (0.3 + 0.4 * (i % 2))

      // Compute Cartesian position on sphere surface
      const pos = polarToCartesian(theta, phi, PLANET_RADIUS)

      const contentType = inferContentType(item.folder)

      placements.push({
        slug: item.slug,
        title: item.frontmatter.title ?? item.slug,
        type: contentType,
        district: wedge.district,
        theta,
        phi,
        position: [pos.x, pos.y, pos.z],
        model: TYPE_MODELS[contentType],
        interactive: true,
        panelId: item.slug,
      })
    })
  }

  return placements
}
