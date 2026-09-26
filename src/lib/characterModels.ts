/**
 * Which model file each character loads.
 *
 * The three NPCs — Joe, the library sleeper and the newspaper reader — are meant to
 * have models of their own. Until those are authored they share the visitor's, and
 * pointing them at the visitor's own file means the browser reuses a download it has
 * already made rather than fetching an identical copy under a second name. That is
 * ~2.9 MB, roughly a fifth of everything the site downloads.
 *
 * When real models arrive, drop them in `public/` and give each NPC its own entry
 * here (or set `modelUrl` on that NPC in `worldCoordinates.ts`). Nothing else changes.
 */

export const VISITOR_MODEL = '/visitor.vrm'
export const GUIDE_MODEL = '/abdulrahman.vrm'

/** Stand-in for every NPC that has no model of its own yet. See `docs/ASSET_SPEC.md` §4. */
export const NPC_PLACEHOLDER_MODEL = VISITOR_MODEL
