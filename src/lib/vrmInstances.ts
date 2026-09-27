import { Material, Mesh, Texture } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm'

/**
 * One download, many characters.
 *
 * A parsed glTF is a single object graph. Two components that mount the same parsed
 * model mount the *same* object, so the last one to mount takes it and the others
 * render nothing — which is how pointing the NPCs at the visitor's file once made the
 * player character itself disappear.
 *
 * So the file is fetched once and kept as bytes, and every character parses its own
 * VRM from those bytes. Each instance gets its own scene, skeleton, humanoid rig and
 * spring bones, which is what the animation and handshake code expects, and no
 * character needs a duplicate file on the server.
 */

/** The bytes of each model, fetched at most once per URL. */
const buffers = new Map<string, Promise<ArrayBuffer>>()

function modelBytes(url: string): Promise<ArrayBuffer> {
  let pending = buffers.get(url)
  if (!pending) {
    pending = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`Could not load ${url}: ${res.status}`)
      return res.arrayBuffer()
    })
    // A failed fetch must not poison the cache for later attempts
    pending.catch(() => buffers.delete(url))
    buffers.set(url, pending)
  }
  return pending
}

/** Warm the download before anything asks to render, so the first character is not waiting on the network. */
export function preloadVrm(url: string): void {
  void modelBytes(url).catch(() => {})
}

function buildLoader(): GLTFLoader {
  const loader = new GLTFLoader()
  // The models are meshopt-compressed (EXT_meshopt_compression is *required*), so
  // without this the parse throws.
  loader.setMeshoptDecoder(MeshoptDecoder)
  loader.register((parser) => new VRMLoaderPlugin(parser))
  return loader
}

/**
 * Texture slots a VRM material may carry. Every one of these is a full image in GPU
 * memory, so they are the expensive part of a character by a wide margin.
 */
const TEXTURE_SLOTS = [
  'map',
  'normalMap',
  'emissiveMap',
  'alphaMap',
  'aoMap',
  'roughnessMap',
  'metalnessMap',
  'lightMap',
] as const

type TexturedMaterial = Material & Partial<Record<(typeof TEXTURE_SLOTS)[number], Texture | null>>

/** One copy of each image per file, keyed by the name the file gives it. */
const sharedTextures = new Map<string, Texture>()
/** Every texture handed out above, so disposal never frees one another character is using. */
const sharedTextureIds = new Set<string>()

function eachMaterial(vrm: VRM, visit: (m: TexturedMaterial) => void) {
  vrm.scene.traverse((o) => {
    const mesh = o as Mesh
    if (!mesh.material) return
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const m of mats) visit(m as TexturedMaterial)
  })
}

/**
 * Parsing a file per character gives each its own textures, which is the whole cost of
 * the approach: ten characters measured 650 MB of GPU images. The images are identical,
 * so the first instance keeps them and every later one points at the same objects. The
 * glTF names each image ("_01", "_02"), and those names are stable across parses, so the
 * match is by name rather than by traversal order.
 */
function shareTextures(url: string, vrm: VRM): void {
  eachMaterial(vrm, (m) => {
    for (const slot of TEXTURE_SLOTS) {
      const texture = m[slot]
      if (!texture?.name) continue
      const key = `${url}::${slot}::${texture.name}`
      const already = sharedTextures.get(key)
      if (!already) {
        sharedTextures.set(key, texture)
        sharedTextureIds.add(texture.uuid)
      } else if (already !== texture) {
        m[slot] = already
        texture.dispose() // this instance's copy; nothing else has seen it
      }
    }
  })
}

/** Builds a VRM of its own from the shared bytes. Dispose it with `disposeVrm` when done. */
export async function createVrm(url: string): Promise<VRM> {
  const bytes = await modelBytes(url)
  // Parse from a copy: the meshopt decoder reads through views of the buffer, and a
  // shared buffer must stay intact for every later instance.
  const gltf = await buildLoader().parseAsync(bytes.slice(0), '')
  const vrm = (gltf.userData as { vrm?: VRM }).vrm
  if (!vrm) throw new Error(`${url} parsed but carries no VRM`)

  VRMUtils.removeUnnecessaryVertices(vrm.scene)
  VRMUtils.removeUnnecessaryJoints(vrm.scene)
  if (vrm.meta?.metaVersion === '0') VRMUtils.rotateVRM0(vrm)
  shareTextures(url, vrm)

  return vrm
}

/**
 * Releases what this instance alone owns. Deliberately not VRMUtils.deepDispose: that
 * frees every texture it finds, and these are shared, so one character leaving would
 * blank the rest. (Material.dispose does not touch textures, so materials are safe.)
 */
export function disposeVrm(vrm: VRM): void {
  eachMaterial(vrm, (m) => {
    for (const slot of TEXTURE_SLOTS) {
      const texture = m[slot]
      if (texture && !sharedTextureIds.has(texture.uuid)) texture.dispose()
    }
    m.dispose()
  })
  vrm.scene.traverse((o) => {
    const mesh = o as Mesh
    mesh.geometry?.dispose()
  })
}
