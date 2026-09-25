import { create } from 'zustand'
import {
  PLANET_RADIUS,
  CHARACTER_CAPSULE_HEIGHT,
  CHARACTER_OFFSET_X,
} from '@/lib/constants'

// Initial surface spawn on the north pole
const INITIAL_SURFACE_Y = PLANET_RADIUS + CHARACTER_CAPSULE_HEIGHT

interface WelcomeSlice {
  introComplete: boolean
  /** Both main characters have loaded and are on screen. The intro's auto-dismiss timer waits for this. */
  charactersReady: boolean
  setCharactersReady: (v: boolean) => void
  /** The opening handshake is running (mirrors lib/greeting.ts for React consumers). */
  greetingActive: boolean
  setGreetingActive: (v: boolean) => void
  setIntroComplete: (v: boolean) => void
}

interface TourSlice {
  isTourActive: boolean
  tourWaypointIndex: number
  currentDialogue: string | null
  visitedDistricts: string[]
  tourCompleted: boolean
  passportStampVisible: boolean
  craneFlyoverTrigger: number
  setTourActive: (v: boolean) => void
  setTourWaypointIndex: (i: number) => void
  setCurrentDialogue: (text: string | null) => void
  markDistrictVisited: (district: string) => void
  setTourCompleted: (v: boolean) => void
  setPassportStampVisible: (v: boolean) => void
  triggerCraneFlyover: () => void
}

interface PlayerSlice {
  position: [number, number, number]
  abdulrahmanPosition: [number, number, number]
  /** World-space unit tangent vector the visitor faces (see settleFacing in sphereMath). */
  facingDir: [number, number, number]
  setPosition: (pos: [number, number, number]) => void
  setAbdulrahmanPosition: (pos: [number, number, number]) => void
  setFacingDir: (dir: [number, number, number]) => void
}

interface UISlice {
  activePanel: string | null
  isReading: boolean
  currentDistrict: string
  districtLabelVisible: boolean
  nearbyPropId: string | null
  setActivePanel: (id: string | null) => void
  setIsReading: (v: boolean) => void
  setCurrentDistrict: (d: string) => void
  setDistrictLabelVisible: (v: boolean) => void
  setNearbyPropId: (id: string | null) => void
}

interface NPCSlice {
  nearbyNPC: string | null
  npcDialogue: string | null
  setNearbyNPC: (id: string | null) => void
  setNpcDialogue: (text: string | null) => void
}

interface DebugSlice {
  debugMode: boolean
  freeFlyMode: boolean
  setDebugMode: (v: boolean) => void
  setFreeFlyMode: (v: boolean) => void
  toggleDebugMode: () => void
  toggleFreeFlyMode: () => void
}

interface ResilienceSlice {
  isTabHidden: boolean
  contextLost: boolean
  setIsTabHidden: (v: boolean) => void
  setContextLost: (v: boolean) => void
}

interface TransitionSlice {
  irisPhase: 'idle' | 'closing' | 'opening'
  triggerIrisTransition: (onMidpoint?: () => void) => void
  cameraImpulse: number  // Q145: increments to trigger micro-camera punch
  triggerCameraImpulse: () => void
}

interface NavigationSlice {
  /** Touch is the visitor's input right now: shows the joystick and touch wording. */
  touchUi: boolean
  setTouchUi: (v: boolean) => void
  /** The full world map is open. */
  mapOpen: boolean
  setMapOpen: (v: boolean) => void
  /** Asks the visitor controller to move to a district; `id` makes repeat requests distinct. */
  travelRequest: { path: string; id: number } | null
  requestTravel: (path: string) => void
  /** Set by the visitor once they have landed, so the guide can join them. */
  travelArrival: { path: string; id: number } | null
  /** The idle tour will not resume before this time (ms since epoch). */
  tourHoldUntil: number
  holdTour: (ms: number) => void
  setTravelArrival: (a: { path: string; id: number }) => void
}

// ─── COMBINED STORE ───────────────────────────────────────

interface WorldStore
  extends WelcomeSlice,
    TourSlice,
    PlayerSlice,
    UISlice,
    NPCSlice,
    DebugSlice,
    ResilienceSlice,
    TransitionSlice,
    NavigationSlice {}

export const useWorldStore = create<WorldStore>((set) => ({
  // Navigation
  touchUi: false,
  setTouchUi: (v) => set({ touchUi: v }),
  mapOpen: false,
  setMapOpen: (v) => set({ mapOpen: v }),
  travelRequest: null,
  tourHoldUntil: 0,
  holdTour: (ms) => set({ tourHoldUntil: Date.now() + ms }),
  travelArrival: null,
  setTravelArrival: (a) => set({ travelArrival: a }),
  requestTravel: (path) => set((s) => ({ travelRequest: { path, id: (s.travelRequest?.id ?? 0) + 1 } })),

  // Resilience
  isTabHidden: false,
  contextLost: false,
  setIsTabHidden: (v) => set({ isTabHidden: v }),
  setContextLost: (v) => set({ contextLost: v }),

  // Debug
  debugMode: false,
  freeFlyMode: false,
  setDebugMode: (v) => set({ debugMode: v }),
  setFreeFlyMode: (v) => set({ freeFlyMode: v }),
  toggleDebugMode: () => set((s) => ({ debugMode: !s.debugMode })),
  toggleFreeFlyMode: () => set((s) => ({ freeFlyMode: !s.freeFlyMode })),

  // Welcome
  introComplete: false,
  charactersReady: false,
  setCharactersReady: (v) => set({ charactersReady: v }),
  greetingActive: false,
  setGreetingActive: (v) => set({ greetingActive: v }),
  setIntroComplete: (v) => set({ introComplete: v }),

  // Tour
  isTourActive: true,
  tourWaypointIndex: 0,
  currentDialogue: null,
  visitedDistricts: [],
  tourCompleted: false,
  passportStampVisible: false,
  craneFlyoverTrigger: 0,
  setTourActive: (v) => set({ isTourActive: v }),
  setTourWaypointIndex: (i) => set({ tourWaypointIndex: i }),
  setCurrentDialogue: (text) => set({ currentDialogue: text }),
  markDistrictVisited: (district) =>
    set((state) => ({
      visitedDistricts: state.visitedDistricts.includes(district)
        ? state.visitedDistricts
        : [...state.visitedDistricts, district],
    })),
  setTourCompleted: (v) => set({ tourCompleted: v }),
  setPassportStampVisible: (v) => set({ passportStampVisible: v }),
  triggerCraneFlyover: () =>
    set((s) => ({ craneFlyoverTrigger: s.craneFlyoverTrigger + 1 })),

  // Player — spawned on sphere surface at the North pole
  position: [0, INITIAL_SURFACE_Y, 0],
  abdulrahmanPosition: [CHARACTER_OFFSET_X, INITIAL_SURFACE_Y, 0],
  facingDir: [0, 0, 1],
  setPosition: (pos) => set({ position: pos }),
  setAbdulrahmanPosition: (pos) => set({ abdulrahmanPosition: pos }),
  setFacingDir: (dir) => set({ facingDir: dir }),

  // UI
  activePanel: null,
  isReading: false,
  currentDistrict: '/',
  districtLabelVisible: false,
  nearbyPropId: null,
  setActivePanel: (id) => set((s) => {
    // Q145: Trigger micro-camera impulse when closing a panel
    const closing = id === null && s.activePanel !== null
    return {
      activePanel: id,
      isReading: id !== null,
      ...(closing ? { cameraImpulse: s.cameraImpulse + 1 } : {}),
    }
  }),
  setIsReading: (v) => set({ isReading: v }),
  setCurrentDistrict: (d) => set({ currentDistrict: d }),
  setDistrictLabelVisible: (v) => set({ districtLabelVisible: v }),
  setNearbyPropId: (id) => set({ nearbyPropId: id }),

  // NPC
  nearbyNPC: null,
  npcDialogue: null,
  setNearbyNPC: (id) => set({ nearbyNPC: id }),
  setNpcDialogue: (text) => set({ npcDialogue: text }),

  // Transitions (Q70: Circular ink-drop iris wipe)
  irisPhase: 'idle',
  triggerIrisTransition: (onMidpoint) => {
    set({ irisPhase: 'closing' })
    setTimeout(() => {
      onMidpoint?.()
      set({ irisPhase: 'opening' })
      setTimeout(() => {
        set({ irisPhase: 'idle' })
      }, 360)
    }, 320)
  },

  // Q145: Micro-camera impulse
  cameraImpulse: 0,
  triggerCameraImpulse: () =>
    set((s) => ({ cameraImpulse: s.cameraImpulse + 1 })),
}))

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  ;(window as unknown as Record<string, unknown>).__WORLD_STORE__ = useWorldStore
}