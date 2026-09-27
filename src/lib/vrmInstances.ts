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

  return vrm
}

/** Releases everything the instance owns: geometries, materials and its own textures. */
export function disposeVrm(vrm: VRM): void {
  VRMUtils.deepDispose(vrm.scene)
}
