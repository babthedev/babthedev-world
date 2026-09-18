import { create } from 'zustand'

// ─── SLICES ───────────────────────────────────────────────

interface WelcomeSlice {
  introComplete: boolean
  setIntroComplete: (v: boolean) => void
}

interface TourSlice {
  isTourActive: boolean
  tourWaypointIndex: number
  currentDialogue: string | null
  visitedDistricts: string[]
  setTourActive: (v: boolean) => void
  setTourWaypointIndex: (i: number) => void
  setCurrentDialogue: (text: string | null) => void
  markDistrictVisited: (district: string) => void
}

interface PlayerSlice {
  position: [number, number, number]
  abdulrahmanPosition: [number, number, number]
  facingAngle: number
  setPosition: (pos: [number, number, number]) => void
  setAbdulrahmanPosition: (pos: [number, number, number]) => void
  setFacingAngle: (angle: number) => void
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
    TransitionSlice {}

export const useWorldStore = create<WorldStore>((set) => ({
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
  setIntroComplete: (v) => set({ introComplete: v }),

  // Tour
  isTourActive: true,
  tourWaypointIndex: 0,
  currentDialogue: null,
  visitedDistricts: [],
  setTourActive: (v) => set({ isTourActive: v }),
  setTourWaypointIndex: (i) => set({ tourWaypointIndex: i }),
  setCurrentDialogue: (text) => set({ currentDialogue: text }),
  markDistrictVisited: (district) =>
    set((state) => ({
      visitedDistricts: state.visitedDistricts.includes(district)
        ? state.visitedDistricts
        : [...state.visitedDistricts, district],
    })),

  // Player
  position: [0, 0, 0],
  abdulrahmanPosition: [0.7, 0, 0],
  facingAngle: 0,
  setPosition: (pos) => set({ position: pos }),
  setAbdulrahmanPosition: (pos) => set({ abdulrahmanPosition: pos }),
  setFacingAngle: (angle) => set({ facingAngle: angle }),

  // UI
  activePanel: null,
  isReading: false,
  currentDistrict: '/',
  districtLabelVisible: false,
  nearbyPropId: null,
  setActivePanel: (id) => set({ activePanel: id, isReading: id !== null }),
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
}))