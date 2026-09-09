'use client'

import { forwardRef, useEffect, useMemo, useState } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { Group, Mesh, MeshToonMaterial, Texture, SkinnedMesh } from 'three'

interface CharacterModelProps {
  url: string
  color: string
  gradientMap: Texture
  animationName?: string
}

export interface CharacterModelHandle {
  group: Group | null
}

const CharacterModel = forwardRef<Group, CharacterModelProps>(
  ({ url, color, gradientMap, animationName = 'idle' }, ref) => {
    const [vrm, setVrm] = useState<any>(null)
    const isVRM = url.endsWith('.vrm')

    const { scene, animations } = useGLTF(url, isVRM ? {
      plugins: [VRMLoaderPlugin],
    } : undefined)

    const { actions, mixer: _mixer } = useAnimations(animations, scene)

    // ── VRM INITIALIZATION ────────────────────────────
    useEffect(() => {
      if (!isVRM || !scene) return

      const vrmPlugin = scene.userData.vrm
      if (vrmPlugin) {
        VRMUtils.removeUnnecessaryVertices(vrmPlugin.scene)
        VRMUtils.removeUnnecessaryJoints(vrmPlugin.scene)
        setVrm(vrmPlugin)
      }
    }, [scene, isVRM])

    // ── MATERIAL OVERRIDE ─────────────────────────────
    // Every mesh in the GLB/VRM gets replaced with MeshToonMaterial.
    // This is what makes mixed asset sources look visually identical.
    const toonMaterial = useMemo(
      () =>
        new MeshToonMaterial({
          color,
          gradientMap,
        }),
      [color, gradientMap]
    )

    useEffect(() => {
      scene.traverse((child) => {
        if (child instanceof Mesh || child instanceof SkinnedMesh) {
          child.castShadow = true
          child.receiveShadow = false // characters don't self-shadow (per spec)
          child.material = toonMaterial
        }
      })
    }, [scene, toonMaterial])

    // ── ANIMATION PLAYBACK ────────────────────────────
    useEffect(() => {
      const action = actions[animationName]
      if (!action) return

      action.reset().fadeIn(0.2).play()

      return () => {
        action.fadeOut(0.2)
      }
    }, [actions, animationName])

    return <primitive ref={ref} object={scene} />
  }
)

CharacterModel.displayName = 'CharacterModel'

export default CharacterModel

// Preload both characters at module load time
useGLTF.preload('/abdulrahman.vrm', { plugins: [VRMLoaderPlugin] })
useGLTF.preload('/visitor.vrm', { plugins: [VRMLoaderPlugin] })
useGLTF.preload('/joe.vrm', { plugins: [VRMLoaderPlugin] })