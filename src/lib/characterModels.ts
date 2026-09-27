/**
 * Which model file each character loads.
 *
 * Several characters may share a URL: the file is downloaded once and each character
 * parses its own VRM from those bytes (see lib/vrmInstances). Sharing a *parsed* model
 * is what breaks — that once made the player character invisible — and the loader now
 * makes that impossible.
 *
 * See docs/ASSET_SPEC.md §4 for adding real NPC models.
 */

export const VISITOR_MODEL = '/visitor.vrm'
export const GUIDE_MODEL = '/abdulrahman.vrm'

/** Stand-in for NPCs until each has a model of its own. Costs no extra download. */
export const NPC_PLACEHOLDER_MODEL = VISITOR_MODEL
