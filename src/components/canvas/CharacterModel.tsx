'use client'

import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import {
  Group,
  Mesh,
  MeshToonMaterial,
  Texture,
  SkinnedMesh,
  Vector3,
  Quaternion,
  MathUtils,
  Object3D,
} from 'three'

interface CharacterModelProps {
  url: string
  color: string
  gradientMap: Texture
  animationName?: string
  characterType?: 'abdulrahman' | 'visitor' | 'joe' | 'npc'
  lookAtTarget?: [number, number, number] | null
}

export interface CharacterModelHandle {
  group: Group | null
}

// Pre-allocated scratch objects to prevent garbage collection in useFrame
const _tempTarget = new Vector3()
const _headWorldPos = new Vector3()
const _lookDirWorld = new Vector3()
const _lookDirLocal = new Vector3()
const _groupWorldQuat = new Quaternion()

const CharacterModel = forwardRef<Group, CharacterModelProps>(
  (
    {
      url,
      color,
      gradientMap,
      animationName = 'idle',
      characterType,
      lookAtTarget = null,
    },
    ref
  ) => {
    const internalRef = useRef<Group | null>(null)
    const [vrm, setVrm] = useState<any>(null)
    const isVRM = url.endsWith('.vrm')

    // Determine character identity
    const resolvedType = useMemo(() => {
      if (characterType) return characterType
      if (url.includes('abdulrahman')) return 'abdulrahman'
      if (url.includes('visitor')) return 'visitor'
      if (url.includes('joe')) return 'joe'
      return 'npc'
    }, [characterType, url])

    const { scene, animations } = useGLTF(
      url,
      undefined,
      undefined,
      isVRM
        ? (loader: any) => {
            loader.register((parser: any) => new VRMLoaderPlugin(parser))
          }
        : undefined
    )

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
          child.receiveShadow = false
          child.material = toonMaterial
        }
      })
    }, [scene, toonMaterial])

    // ── ANIMATION PLAYBACK (IF EMBEDDED CLIPS EXIST) ──
    useEffect(() => {
      const action = actions[animationName]
      if (!action) return

      action.reset().fadeIn(0.2).play()

      return () => {
        action.fadeOut(0.2)
      }
    }, [actions, animationName])

    // ── BONE REFERENCES ───────────────────────────────
    const bones = useMemo(() => {
      if (!vrm?.humanoid) return null
      return {
        head: vrm.humanoid.getNormalizedBoneNode('head') as Object3D | null,
        neck: vrm.humanoid.getNormalizedBoneNode('neck') as Object3D | null,
        chest: vrm.humanoid.getNormalizedBoneNode('chest') as Object3D | null,
        spine: vrm.humanoid.getNormalizedBoneNode('spine') as Object3D | null,
        hips: vrm.humanoid.getNormalizedBoneNode('hips') as Object3D | null,
        leftUpperArm: vrm.humanoid.getNormalizedBoneNode('leftUpperArm') as Object3D | null,
        rightUpperArm: vrm.humanoid.getNormalizedBoneNode('rightUpperArm') as Object3D | null,
        leftLowerArm: vrm.humanoid.getNormalizedBoneNode('leftLowerArm') as Object3D | null,
        rightLowerArm: vrm.humanoid.getNormalizedBoneNode('rightLowerArm') as Object3D | null,
        leftUpperLeg: vrm.humanoid.getNormalizedBoneNode('leftUpperLeg') as Object3D | null,
        rightUpperLeg: vrm.humanoid.getNormalizedBoneNode('rightUpperLeg') as Object3D | null,
        leftLowerLeg: vrm.humanoid.getNormalizedBoneNode('leftLowerLeg') as Object3D | null,
        rightLowerLeg: vrm.humanoid.getNormalizedBoneNode('rightLowerLeg') as Object3D | null,
      }
    }, [vrm])

    // ── PROCEDURAL ANIMATION & Q101/Q102 TRACKERS ──────
    const idleTimeRef = useRef(0)
    const nextIdleTriggerRef = useRef(8.0) // First trigger at >8s idle
    const activeSecondaryRef = useRef<{
      id: 'watch' | 'cranes' | 'stretch' | 'look_around'
      elapsed: number
      duration: number
    } | null>(null)

    const walkCycleTimeRef = useRef(0)
    const currentHeadYawRef = useRef(0)
    const currentHeadPitchRef = useRef(0)

    useFrame((_, delta) => {
      if (!vrm || !bones) return

      // Keep delta bounded during hiccups
      const dt = Math.min(delta, 0.1)

      const isWalking = animationName === 'walk'
      const isSeated = animationName === 'sit'
      const isIdle = !isWalking && !isSeated

      // ── 1. LOCOMOTION CYCLE ───────────────────────────
      if (isWalking) {
        walkCycleTimeRef.current += dt * 7.5
        idleTimeRef.current = 0
        activeSecondaryRef.current = null
        nextIdleTriggerRef.current = 8.0

        const t = walkCycleTimeRef.current
        const legSwing = Math.sin(t) * 0.45
        const armSwing = Math.sin(t) * 0.35

        if (bones.leftUpperLeg) bones.leftUpperLeg.rotation.x = legSwing
        if (bones.rightUpperLeg) bones.rightUpperLeg.rotation.x = -legSwing
        if (bones.leftLowerLeg)
          bones.leftLowerLeg.rotation.x = Math.max(0, -Math.sin(t)) * 0.5
        if (bones.rightLowerLeg)
          bones.rightLowerLeg.rotation.x = Math.max(0, Math.sin(t)) * 0.5

        if (bones.leftUpperArm) bones.leftUpperArm.rotation.x = -armSwing
        if (bones.rightUpperArm) bones.rightUpperArm.rotation.x = armSwing
        if (bones.leftLowerArm) bones.leftLowerArm.rotation.x = 0.25
        if (bones.rightLowerArm) bones.rightLowerArm.rotation.x = 0.25

        if (bones.hips) bones.hips.position.y = Math.abs(Math.sin(t)) * 0.035
        if (bones.spine) bones.spine.rotation.y = Math.sin(t) * 0.04
      } else if (isSeated) {
        // Seated pose for Joe and ambient cafe/library NPCs
        idleTimeRef.current = 0
        activeSecondaryRef.current = null

        if (bones.hips) bones.hips.position.y = -0.32
        if (bones.leftUpperLeg) bones.leftUpperLeg.rotation.x = -1.45
        if (bones.rightUpperLeg) bones.rightUpperLeg.rotation.x = -1.45
        if (bones.leftLowerLeg) bones.leftLowerLeg.rotation.x = 1.48
        if (bones.rightLowerLeg) bones.rightLowerLeg.rotation.x = 1.48
        if (bones.leftUpperArm) bones.leftUpperArm.rotation.x = -0.25
        if (bones.rightUpperArm) bones.rightUpperArm.rotation.x = -0.25
        if (bones.spine) bones.spine.rotation.x = 0.08
      } else {
        // Return legs and hips to neutral standing pose
        if (bones.leftUpperLeg)
          bones.leftUpperLeg.rotation.x = MathUtils.damp(bones.leftUpperLeg.rotation.x, 0, 10, dt)
        if (bones.rightUpperLeg)
          bones.rightUpperLeg.rotation.x = MathUtils.damp(bones.rightUpperLeg.rotation.x, 0, 10, dt)
        if (bones.leftLowerLeg)
          bones.leftLowerLeg.rotation.x = MathUtils.damp(bones.leftLowerLeg.rotation.x, 0, 10, dt)
        if (bones.rightLowerLeg)
          bones.rightLowerLeg.rotation.x = MathUtils.damp(bones.rightLowerLeg.rotation.x, 0, 10, dt)
        if (bones.hips)
          bones.hips.position.y = MathUtils.damp(bones.hips.position.y, 0, 10, dt)
      }

      // ── 2. BASE IDLE BREATHING SWAY ────────────────────
      if (isIdle) {
        idleTimeRef.current += dt
        const breath = Math.sin(idleTimeRef.current * 1.8)

        if (bones.chest) bones.chest.rotation.x = breath * 0.02
        if (bones.spine) bones.spine.rotation.x = breath * 0.012

        // Default neutral arms when no secondary idle is overriding
        if (!activeSecondaryRef.current) {
          if (bones.leftUpperArm) {
            bones.leftUpperArm.rotation.x = MathUtils.damp(bones.leftUpperArm.rotation.x, 0, 8, dt)
            bones.leftUpperArm.rotation.y = MathUtils.damp(bones.leftUpperArm.rotation.y, 0, 8, dt)
            bones.leftUpperArm.rotation.z = MathUtils.damp(bones.leftUpperArm.rotation.z, -0.06 + breath * 0.01, 8, dt)
          }
          if (bones.rightUpperArm) {
            bones.rightUpperArm.rotation.x = MathUtils.damp(bones.rightUpperArm.rotation.x, 0, 8, dt)
            bones.rightUpperArm.rotation.y = MathUtils.damp(bones.rightUpperArm.rotation.y, 0, 8, dt)
            bones.rightUpperArm.rotation.z = MathUtils.damp(bones.rightUpperArm.rotation.z, 0.06 - breath * 0.01, 8, dt)
          }
          if (bones.leftLowerArm) {
            bones.leftLowerArm.rotation.x = MathUtils.damp(bones.leftLowerArm.rotation.x, 0.08, 8, dt)
          }
          if (bones.rightLowerArm) {
            bones.rightLowerArm.rotation.x = MathUtils.damp(bones.rightLowerArm.rotation.x, 0.08, 8, dt)
          }
        }
      }

      // ── 3. Q101: SECONDARY IDLE ANIMATIONS (>8s IDLE) ──
      // Cycle 2 randomized idles per character:
      // Abdulrahman: checks watch / looks at cranes
      // Visitor: stretches / looks around at street architecture
      if (isIdle && idleTimeRef.current > 8.0) {
        if (!activeSecondaryRef.current && idleTimeRef.current >= nextIdleTriggerRef.current) {
          // Trigger a new secondary idle
          const isA = Math.random() > 0.5
          if (resolvedType === 'abdulrahman') {
            activeSecondaryRef.current = {
              id: isA ? 'watch' : 'cranes',
              elapsed: 0,
              duration: isA ? 2.6 : 3.4,
            }
          } else {
            // Visitor / Default
            activeSecondaryRef.current = {
              id: isA ? 'stretch' : 'look_around',
              elapsed: 0,
              duration: isA ? 2.8 : 3.6,
            }
          }
          // Schedule next idle trigger 10-14 seconds later
          nextIdleTriggerRef.current = idleTimeRef.current + activeSecondaryRef.current.duration + 10 + Math.random() * 4
        }

        if (activeSecondaryRef.current) {
          const currentSec = activeSecondaryRef.current
          currentSec.elapsed += dt
          const progress = currentSec.elapsed / currentSec.duration

          // Smooth trapezoidal blend envelope: fade in 0-0.2, hold 0.2-0.8, fade out 0.8-1.0
          let weight = 0
          if (progress < 0.2) {
            weight = progress / 0.2
          } else if (progress <= 0.8) {
            weight = 1.0
          } else if (progress < 1.0) {
            weight = (1.0 - progress) / 0.2
          }

          if (currentSec.id === 'watch') {
            // Abdulrahman: Checks watch on left wrist
            if (bones.leftUpperArm) {
              bones.leftUpperArm.rotation.x = MathUtils.lerp(0, -0.65, weight)
              bones.leftUpperArm.rotation.y = MathUtils.lerp(0, 0.45, weight)
              bones.leftUpperArm.rotation.z = MathUtils.lerp(0, 0.2, weight)
            }
            if (bones.leftLowerArm) {
              bones.leftLowerArm.rotation.x = MathUtils.lerp(0.08, 1.35, weight)
            }
            if (bones.head && !lookAtTarget) {
              bones.head.rotation.x = MathUtils.lerp(0, 0.45, weight)
              bones.head.rotation.y = MathUtils.lerp(0, 0.3, weight)
            }
          } else if (currentSec.id === 'cranes') {
            // Abdulrahman: Looks up at orbital cranes scanning across the sky
            const gazePan = Math.sin(currentSec.elapsed * 1.6) * 0.28
            if (bones.head && !lookAtTarget) {
              bones.head.rotation.x = MathUtils.lerp(0, -0.52, weight)
              bones.head.rotation.y = MathUtils.lerp(0, gazePan, weight)
            }
            if (bones.chest) {
              bones.chest.rotation.x = MathUtils.lerp(0, -0.14, weight)
            }
          } else if (currentSec.id === 'stretch') {
            // Visitor: Stretches arms and arches spine back
            if (bones.leftUpperArm) {
              bones.leftUpperArm.rotation.x = MathUtils.lerp(0, 0.35, weight)
              bones.leftUpperArm.rotation.z = MathUtils.lerp(-0.06, -0.55, weight)
            }
            if (bones.rightUpperArm) {
              bones.rightUpperArm.rotation.x = MathUtils.lerp(0, 0.35, weight)
              bones.rightUpperArm.rotation.z = MathUtils.lerp(0.06, 0.55, weight)
            }
            if (bones.spine) {
              bones.spine.rotation.x = MathUtils.lerp(0, -0.18, weight)
            }
            if (bones.head && !lookAtTarget) {
              bones.head.rotation.x = MathUtils.lerp(0, -0.2, weight)
            }
          } else if (currentSec.id === 'look_around') {
            // Visitor: Looks around at street architecture (smooth left -> right pan)
            const panCycle = Math.sin((currentSec.elapsed / currentSec.duration) * Math.PI * 2) * 0.65
            if (bones.head && !lookAtTarget) {
              bones.head.rotation.y = MathUtils.lerp(0, panCycle, weight)
              bones.head.rotation.x = MathUtils.lerp(0, -0.08, weight)
            }
          }

          if (progress >= 1.0) {
            activeSecondaryRef.current = null
          }
        }
      }

      // ── 4. Q102: NPC HEAD TRACKING (±45° YAW SMOOTH LOOK-AT) ──
      // When visitor is within 4m of Joe or ambient NPCs, smoothly turn head to track
      let targetYaw = 0
      let targetPitch = 0

      if (lookAtTarget && internalRef.current && bones.head) {
        _tempTarget.set(lookAtTarget[0], lookAtTarget[1], lookAtTarget[2])
        bones.head.getWorldPosition(_headWorldPos)
        _lookDirWorld.subVectors(_tempTarget, _headWorldPos)

        // Convert world look direction into character's local orientation
        internalRef.current.getWorldQuaternion(_groupWorldQuat)
        _lookDirLocal.copy(_lookDirWorld).applyQuaternion(_groupWorldQuat.clone().invert()).normalize()

        // Local yaw around character up-axis: atan2(-x, z)
        const rawYaw = Math.atan2(-_lookDirLocal.x, _lookDirLocal.z)
        // Strict ±45° yaw clamp (±PI/4 radians)
        const maxYaw = Math.PI / 4
        targetYaw = MathUtils.clamp(rawYaw, -maxYaw, maxYaw)

        // Local pitch: asin(clamp(y, -1, 1))
        const rawPitch = Math.asin(MathUtils.clamp(_lookDirLocal.y, -0.99, 0.99))
        // Pitch clamp: -15° (-0.26 rad) to +20° (+0.35 rad)
        targetPitch = MathUtils.clamp(rawPitch, -0.26, 0.35)
      }

      // Smoothly lerp head tracking toward target (or back to 0 if out of range)
      currentHeadYawRef.current = MathUtils.damp(
        currentHeadYawRef.current,
        targetYaw,
        7,
        dt
      )
      currentHeadPitchRef.current = MathUtils.damp(
        currentHeadPitchRef.current,
        targetPitch,
        7,
        dt
      )

      if (bones.head && (lookAtTarget || Math.abs(currentHeadYawRef.current) > 0.001)) {
        // Distribute 70% to head, 30% to neck for natural anatomical motion
        bones.head.rotation.y = currentHeadYawRef.current * 0.7
        bones.head.rotation.x = currentHeadPitchRef.current * 0.7
        if (bones.neck) {
          bones.neck.rotation.y = currentHeadYawRef.current * 0.3
          bones.neck.rotation.x = currentHeadPitchRef.current * 0.3
        }
      }

      // Update VRM internals (spring bones, materials, constraints)
      vrm.update(dt)
    })

    return (
      <group ref={(node) => {
        internalRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      }}>
        <primitive object={scene} />
      </group>
    )
  }
)

CharacterModel.displayName = 'CharacterModel'

export default CharacterModel

// Preload characters at module load time
const registerVRM = (loader: any) => {
  loader.register((parser: any) => new VRMLoaderPlugin(parser))
}
useGLTF.preload('/abdulrahman.vrm', undefined, undefined, registerVRM)
useGLTF.preload('/visitor.vrm', undefined, undefined, registerVRM)
useGLTF.preload('/joe.vrm', undefined, undefined, registerVRM)