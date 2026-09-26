'use client'

import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm'
import { useVrmaPlayer } from '@/hooks/useVrmaPlayer'
import { GREETING_TIMELINE, greeting, solveRightArm } from '@/lib/greeting'
import type { AnimationState } from '@/hooks/useCharacterAnimations'
import {
  Color,
  Euler,
  Group,
  Material,
  Mesh,
  MeshToonMaterial,
  MeshToonMaterialParameters,
  Texture,
  SkinnedMesh,
  Vector3,
  Quaternion,
  MathUtils,
  Object3D,
} from 'three'

/** The parts of a loaded VRM material this file reads; VRoid's MToon materials carry more than three's base type. */
type LooseMaterial = Material & {
  map?: Texture | null
  color?: Color
  alphaTest?: number
  isOutline?: boolean
  outlineColorFactor?: { set?: (color: string) => void }
}

type ExtendLoader = NonNullable<Parameters<typeof useGLTF.preload>[3]>

type LoaderPlugin = ReturnType<Parameters<Parameters<ExtendLoader>[0]['register']>[0]>

// drei loads through three-stdlib while three-vrm is typed against three's own copy of
// the GLTF loader types. They are the same runtime objects, so bridge the two.
const registerVRM: ExtendLoader = (loader) => {
  loader.register((parser) => new VRMLoaderPlugin(parser as unknown as ConstructorParameters<typeof VRMLoaderPlugin>[0]) as unknown as LoaderPlugin)
}

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
const _lookEuler = new Euler()
const _lookQuat = new Quaternion()
const _handTarget = new Vector3()
const _shoulder = new Vector3()
const _mid = new Vector3()
const _up = new Vector3()
const _parentQuat = new Quaternion()
const _qUpperTarget = new Quaternion()
const _qLowerTarget = new Quaternion()

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
    const [vrm, setVrm] = useState<VRM | null>(null)
    const isVRM = url.endsWith('.vrm')

    // Determine character identity
    const resolvedType = useMemo(() => {
      if (characterType) return characterType
      if (url.includes('abdulrahman')) return 'abdulrahman'
      if (url.includes('visitor')) return 'visitor'
      if (url.includes('joe')) return 'joe'
      return 'npc'
    }, [characterType, url])

    const gltf = useGLTF(
      url,
      undefined,
      undefined,
      isVRM
        ? registerVRM
        : undefined
    )

    const scene = gltf.scene
    const animations = gltf.animations
    const { actions } = useAnimations(animations, scene)

    // ── VRM INITIALIZATION ────────────────────────────
    useEffect(() => {
      if (!isVRM || !gltf) return

      const vrmPlugin = gltf.userData?.vrm || gltf.scene?.userData?.vrm
      if (vrmPlugin) {
        VRMUtils.removeUnnecessaryVertices(vrmPlugin.scene)
        VRMUtils.removeUnnecessaryJoints(vrmPlugin.scene)
        if (vrmPlugin.meta?.metaVersion === '0') {
          VRMUtils.rotateVRM0(vrmPlugin)
        }
        setVrm(vrmPlugin)
      }
    }, [gltf, isVRM])

    // ── MATERIAL CONVERSION ────────────────────────────
    // Each VRoid material (skin, eyes, hair, clothing…) becomes a toon
    // material that keeps its own base texture, tint and transparency, so
    // the parts stay distinct once the Monochrome pass greys them. MToon's
    // inverted-hull outline materials are kept and inked instead.
    useEffect(() => {
      const targetScene = vrm ? vrm.scene : scene
      if (!targetScene) return

      const converted = new Map<Material, Material>()
      const convert = (m: LooseMaterial): Material => {
        const done = converted.get(m)
        if (done) return done
        let next = m
        if (m.isOutline) {
          m.outlineColorFactor?.set?.('#0B0B0B')
        } else if (!(m instanceof MeshToonMaterial)) {
          // Only forward properties the source actually defines — three warns
          // ("parameter 'side' has value of undefined") on explicit undefineds.
          const params: MeshToonMaterialParameters = {
            map: m.map ?? null,
            color: m.map ? (m.color ?? '#FFFFFF') : (m.color ?? color),
            gradientMap,
          }
          if (m.transparent !== undefined) params.transparent = m.transparent
          if (m.alphaTest !== undefined) params.alphaTest = m.alphaTest
          if (m.side !== undefined) params.side = m.side
          if (m.depthWrite !== undefined) params.depthWrite = m.depthWrite
          next = new MeshToonMaterial(params)
          // Free every texture the new material doesn't reuse
          for (const value of Object.values(m)) {
            if (value instanceof Texture && value !== m.map) value.dispose()
          }
          m.dispose?.()
        }
        converted.set(m, next)
        return next
      }

      targetScene.traverse((child) => {
        if (child instanceof Mesh || child instanceof SkinnedMesh) {
          child.material = Array.isArray(child.material)
            ? child.material.map(convert)
            : convert(child.material)
          // The inverted-hull outline shells are only there to be inked: they have no
          // business in the shadow map, where they double the character's cost for nothing.
          const isOutlineShell = (Array.isArray(child.material) ? child.material : [child.material]).some(
            (mat) => (mat as LooseMaterial).isOutline
          )
          child.castShadow = !child.name.includes('Face') && !isOutlineShell
          // Self-shadowing on VRoid meshes produces acne speckle at this scale
          child.receiveShadow = false
          // Keep camera occlusion raycasts from treating characters as walls
          child.userData.isCharacter = true
        }
      })
    }, [scene, vrm, color, gradientMap])

    // ── VRMA CLIPS (public/animations/*.vrma, see docs/ANIMATIONS.md) ──
    // Owns the pose for any state that has a clip; other states fall through
    // to the procedural animation below.
    const vrma = useVrmaPlayer(vrm)

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
        rightHand: vrm.humanoid.getNormalizedBoneNode('rightHand') as Object3D | null,
        leftUpperLeg: vrm.humanoid.getNormalizedBoneNode('leftUpperLeg') as Object3D | null,
        rightUpperLeg: vrm.humanoid.getNormalizedBoneNode('rightUpperLeg') as Object3D | null,
        leftLowerLeg: vrm.humanoid.getNormalizedBoneNode('leftLowerLeg') as Object3D | null,
        rightLowerLeg: vrm.humanoid.getNormalizedBoneNode('rightLowerLeg') as Object3D | null,
      }
    }, [vrm])

    // ── OPENING HANDSHAKE ──────────────────────────────
    // The two main characters tell the greeting director when they have loaded,
    // and take the right-arm pose it drives (see lib/greeting.ts).
    const takesPartInGreeting = resolvedType === 'visitor' || resolvedType === 'abdulrahman'
    useEffect(() => {
      if (vrm && takesPartInGreeting) greeting.ready[resolvedType as 'visitor' | 'abdulrahman'] = true
    }, [vrm, takesPartInGreeting, resolvedType])
    // Bone lengths read from the rig itself: normalised bones sit at their rest offsets
    const armLengths = useMemo(() => {
      if (!bones?.rightLowerArm || !bones.rightHand) return null
      return { upper: bones.rightLowerArm.position.length(), lower: bones.rightHand.position.length() }
    }, [bones])

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

      // A VRMA clip (when one exists for this state) owns the pose; the procedural
      // blocks below only run for states without a clip.
      const clipDriven = vrma.update(dt, animationName as AnimationState)
      const proceduralWalk = !clipDriven && isWalking
      const proceduralSit = !clipDriven && isSeated
      const proceduralIdle = !clipDriven && isIdle

      // ── 1. LOCOMOTION CYCLE ───────────────────────────
      if (proceduralWalk) {
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

        if (bones.leftUpperArm) {
          bones.leftUpperArm.rotation.x = -armSwing
          bones.leftUpperArm.rotation.z = -1.22
        }
        if (bones.rightUpperArm) {
          bones.rightUpperArm.rotation.x = armSwing
          bones.rightUpperArm.rotation.z = 1.22
        }
        if (bones.leftLowerArm) bones.leftLowerArm.rotation.x = 0.3
        if (bones.rightLowerArm) bones.rightLowerArm.rotation.x = 0.3

        // ── WEIGHT TRANSFER ──
        // Character faces +Z with its left at +X. Positive rotation.x swings a leg
        // BACKWARD, so the left foot is forward when sin(t) < 0, and it is the
        // stance foot (moving back under the body) while cos(t) > 0. Legs pass
        // under the body at sin(t) = 0. Signs verified against measured bone
        // positions of a live walk, not derived on paper.
        const sway = Math.sin(t)
        const pass = Math.cos(t)
        if (bones.hips) {
          // Body is highest as the legs pass (sin = 0) and lowest at full stride (double support)
          bones.hips.position.y = Math.abs(pass) * 0.035
          // Pelvis shifts over the stance foot (left stance → +X)
          bones.hips.position.x = pass * 0.018
          // Roll: the swing side drops (left stance → left hip higher → +Z roll)
          bones.hips.rotation.z = pass * 0.03
          // Yaw: the leading hip comes forward (left foot forward when sin < 0)
          bones.hips.rotation.y = sway * 0.09
        }
        // Shoulders counter-rotate against the pelvis, in step with the arm swing
        if (bones.spine) {
          bones.spine.rotation.y = -sway * 0.05
          bones.spine.rotation.x = MathUtils.damp(bones.spine.rotation.x, 0.05, 6, dt) // slight forward lean
        }
        if (bones.chest) bones.chest.rotation.y = -sway * 0.05
      } else if (proceduralSit) {
        // Seated pose for Joe and ambient cafe/library NPCs
        idleTimeRef.current = 0
        activeSecondaryRef.current = null

        if (bones.hips) bones.hips.position.y = -0.32
        if (bones.leftUpperLeg) bones.leftUpperLeg.rotation.x = -1.45
        if (bones.rightUpperLeg) bones.rightUpperLeg.rotation.x = -1.45
        if (bones.leftLowerLeg) bones.leftLowerLeg.rotation.x = 1.48
        if (bones.rightLowerLeg) bones.rightLowerLeg.rotation.x = 1.48
        if (bones.leftUpperArm) {
          bones.leftUpperArm.rotation.x = -0.3
          bones.leftUpperArm.rotation.z = -1.15
        }
        if (bones.rightUpperArm) {
          bones.rightUpperArm.rotation.x = -0.3
          bones.rightUpperArm.rotation.z = 1.15
        }
        if (bones.leftLowerArm) bones.leftLowerArm.rotation.x = 1.25
        if (bones.rightLowerArm) bones.rightLowerArm.rotation.x = 1.25
        if (bones.spine) bones.spine.rotation.x = 0.08
      } else if (!clipDriven) {
        // Return legs and hips to neutral standing pose
        if (bones.leftUpperLeg)
          bones.leftUpperLeg.rotation.x = MathUtils.damp(bones.leftUpperLeg.rotation.x, 0, 10, dt)
        if (bones.rightUpperLeg)
          bones.rightUpperLeg.rotation.x = MathUtils.damp(bones.rightUpperLeg.rotation.x, 0, 10, dt)
        if (bones.leftLowerLeg)
          bones.leftLowerLeg.rotation.x = MathUtils.damp(bones.leftLowerLeg.rotation.x, 0, 10, dt)
        if (bones.rightLowerLeg)
          bones.rightLowerLeg.rotation.x = MathUtils.damp(bones.rightLowerLeg.rotation.x, 0, 10, dt)
        if (bones.hips) {
          bones.hips.position.y = MathUtils.damp(bones.hips.position.y, 0, 10, dt)
          bones.hips.position.x = MathUtils.damp(bones.hips.position.x, 0, 10, dt)
          bones.hips.rotation.y = MathUtils.damp(bones.hips.rotation.y, 0, 10, dt)
          bones.hips.rotation.z = MathUtils.damp(bones.hips.rotation.z, 0, 10, dt)
        }
        if (bones.spine) bones.spine.rotation.y = MathUtils.damp(bones.spine.rotation.y, 0, 10, dt)
        if (bones.chest) bones.chest.rotation.y = MathUtils.damp(bones.chest.rotation.y, 0, 10, dt)
      }

      // ── 2. BASE IDLE BREATHING SWAY ────────────────────
      if (proceduralIdle) {
        idleTimeRef.current += dt
        const breath = Math.sin(idleTimeRef.current * 1.8)

        if (bones.chest) bones.chest.rotation.x = breath * 0.02
        if (bones.spine) bones.spine.rotation.x = MathUtils.damp(bones.spine.rotation.x, breath * 0.012, 8, dt)

        // Default neutral arms hanging relaxed at the sides (VRM upper arms point horizontal at 0, so rotate ~1.25 rad down)
        if (!activeSecondaryRef.current) {
          if (bones.leftUpperArm) {
            bones.leftUpperArm.rotation.x = MathUtils.damp(bones.leftUpperArm.rotation.x, 0.05, 8, dt)
            bones.leftUpperArm.rotation.y = MathUtils.damp(bones.leftUpperArm.rotation.y, 0, 8, dt)
            bones.leftUpperArm.rotation.z = MathUtils.damp(bones.leftUpperArm.rotation.z, -1.25 + breath * 0.02, 8, dt)
          }
          if (bones.rightUpperArm) {
            bones.rightUpperArm.rotation.x = MathUtils.damp(bones.rightUpperArm.rotation.x, 0.05, 8, dt)
            bones.rightUpperArm.rotation.y = MathUtils.damp(bones.rightUpperArm.rotation.y, 0, 8, dt)
            bones.rightUpperArm.rotation.z = MathUtils.damp(bones.rightUpperArm.rotation.z, 1.25 - breath * 0.02, 8, dt)
          }
          if (bones.leftLowerArm) {
            bones.leftLowerArm.rotation.x = MathUtils.damp(bones.leftLowerArm.rotation.x, 0.15, 8, dt)
          }
          if (bones.rightLowerArm) {
            bones.rightLowerArm.rotation.x = MathUtils.damp(bones.rightLowerArm.rotation.x, 0.15, 8, dt)
          }
        }
      }

      // ── 3. Q101: SECONDARY IDLE ANIMATIONS (>8s IDLE) ──
      // Cycle 2 randomized idles per character:
      // Abdulrahman: checks watch / looks at cranes
      // Visitor: stretches / looks around at street architecture
      if (proceduralIdle && idleTimeRef.current > 8.0) {
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
              bones.leftUpperArm.rotation.x = MathUtils.lerp(0.05, -0.75, weight)
              bones.leftUpperArm.rotation.y = MathUtils.lerp(0, 0.45, weight)
              bones.leftUpperArm.rotation.z = MathUtils.lerp(-1.25, -0.4, weight)
            }
            if (bones.leftLowerArm) {
              bones.leftLowerArm.rotation.x = MathUtils.lerp(0.15, 1.35, weight)
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
              bones.leftUpperArm.rotation.x = MathUtils.lerp(0.05, 0.35, weight)
              bones.leftUpperArm.rotation.z = MathUtils.lerp(-1.25, -0.65, weight)
            }
            if (bones.rightUpperArm) {
              bones.rightUpperArm.rotation.x = MathUtils.lerp(0.05, 0.35, weight)
              bones.rightUpperArm.rotation.z = MathUtils.lerp(1.25, 0.65, weight)
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
        if (clipDriven) {
          // Additive: the clip already wrote head/neck this frame, so layer the
          // look-at on top of it instead of overwriting it.
          _lookQuat.setFromEuler(_lookEuler.set(currentHeadPitchRef.current * 0.7, currentHeadYawRef.current * 0.7, 0))
          bones.head.quaternion.premultiply(_lookQuat)
          if (bones.neck) {
            _lookQuat.setFromEuler(_lookEuler.set(currentHeadPitchRef.current * 0.3, currentHeadYawRef.current * 0.3, 0))
            bones.neck.quaternion.premultiply(_lookQuat)
          }
        } else {
          bones.head.rotation.y = currentHeadYawRef.current * 0.7
          bones.head.rotation.x = currentHeadPitchRef.current * 0.7
          if (bones.neck) {
            bones.neck.rotation.y = currentHeadYawRef.current * 0.3
            bones.neck.rotation.x = currentHeadPitchRef.current * 0.3
          }
        }
      }

      // ── OPENING HANDSHAKE: IK the right arm toward the midpoint ──
      // Applied last so it blends over whatever the clip or the procedural
      // animation produced, then fades back out.
      if (greeting.active && takesPartInGreeting && bones.rightUpperArm) {
        greeting.shoulder[resolvedType as 'visitor' | 'abdulrahman'].copy(bones.rightUpperArm.getWorldPosition(_shoulder))
      }
      if (greeting.weight > 0.001 && takesPartInGreeting && armLengths && bones.rightUpperArm && bones.rightLowerArm) {
        // The hands meet halfway between the two real right shoulders, a little
        // lower, pumping along the local up direction.
        const mine = bones.rightUpperArm.getWorldPosition(_shoulder)
        const theirs = greeting.shoulder[resolvedType === 'visitor' ? 'abdulrahman' : 'visitor']
        _mid.copy(mine).add(theirs).multiplyScalar(0.5)
        _up.copy(_mid).normalize()
        _mid.addScaledVector(_up, -GREETING_TIMELINE.handDrop + greeting.pump)
        // world offset from my shoulder → the shoulder bone's parent frame
        _handTarget.copy(_mid).sub(mine)
        bones.rightUpperArm.parent!.getWorldQuaternion(_parentQuat).invert()
        _handTarget.applyQuaternion(_parentQuat)
        solveRightArm(armLengths.upper, armLengths.lower, _handTarget, _qUpperTarget, _qLowerTarget)
        bones.rightUpperArm.quaternion.slerp(_qUpperTarget, greeting.weight)
        bones.rightLowerArm.quaternion.slerp(_qLowerTarget, greeting.weight)
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
        <primitive object={vrm ? vrm.scene : scene} />
      </group>
    )
  }
)

CharacterModel.displayName = 'CharacterModel'

export default CharacterModel

// Preload characters at module load time
useGLTF.preload('/abdulrahman.vrm', undefined, undefined, registerVRM)
useGLTF.preload('/visitor.vrm', undefined, undefined, registerVRM)
useGLTF.preload('/joe.vrm', undefined, undefined, registerVRM)