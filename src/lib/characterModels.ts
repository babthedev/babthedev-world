/**
 * Which model file each character loads.
 *
 * IMPORTANT: one URL means one model in the scene. drei's useGLTF caches a parsed
 * GLTF per URL and the VRM scene is a single object graph, so every component that
 * mounts the same URL mounts the SAME object - the last one to mount takes it and
 * the others render nothing. Pointing the NPCs at the visitor's file made the
 * visitor itself disappear. Each character that must be on screen at the same time
 * therefore needs its own file until per-instance cloning exists.
 *
 * See docs/ASSET_SPEC.md §4 for adding real NPC models.
 */

export const VISITOR_MODEL = '/visitor.vrm'
export const GUIDE_MODEL = '/abdulrahman.vrm'

/** Stand-in for NPCs. A copy of the visitor model, kept as its own file so it renders. */
export const NPC_PLACEHOLDER_MODEL = '/joe.vrm'
