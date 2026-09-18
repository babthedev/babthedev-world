// ============================================================
// BABTHEDEV WORLD — CONSTANTS
// All tunable values live here. Edit freely.
// ============================================================

// --- PHYSICS ---
export const GRAVITY = 0                       // Linear gravity disabled; radial gravity used instead
export const RADIAL_GRAVITY = 35               // m/s² pulling toward sphere center
export const VISITOR_SPEED = 5
export const ABDULRAHMAN_SPEED = 5
export const TETHER_DISTANCE = 2
export const CATCH_UP_DISTANCE = 15
export const LINEAR_DAMPING = 4

// --- SPHERICAL WORLD ---
export const PLANET_RADIUS = 25                // 50m diameter sphere
export const SPHERE_SEGMENTS = 128             // Smooth sphere mesh resolution

// --- CAMERA ---
export const CAMERA_HEIGHT = 3
export const CAMERA_BACK = 6
export const CAMERA_FOV = 60
export const CAMERA_LERP = 5
export const CAMERA_NEAR = 0.1
export const CAMERA_FAR = 200

// --- TOON SHADER ---
export const TOON_GRADIENT_STEPS = new Uint8Array([80, 150, 210, 255])
export const OUTLINE_COLOR = '#0B0B0B'
export const OUTLINE_THICKNESS = 1.4          // pixels, used by Sobel effect
export const OUTLINE_DEPTH_THRESHOLD = 0.0008 // edge sensitivity

// --- WORLD / PAPER PALETTE ---
export const PAPER_BACKGROUND = '#F2F1EC'     // slightly warm off-white, not pure white
export const GROUND_COLOR = '#E4E2D8'
export const INK_COLOR = '#0B0B0B'

// --- CHARACTER COLORS ---
export const ABDULRAHMAN_COLOR = '#8C8A80'    // mid grey, reads against paper
export const VISITOR_COLOR = '#F5F5F0'
export const CHARACTER_OFFSET_X = 0.7

// --- DIALOGUE TIMING ---
export const WORDS_PER_MS = 250
export const DIALOGUE_BUFFER_MS = 1000
export const INTRO_AUTO_DISMISS_MS = 7000
export const IDLE_RESUME_TOUR_MS = 2000

// --- INTERACTION ---
export const INTERACTION_RADIUS = 3
export const NPC_TRIGGER_RADIUS = 3
export const NPC_SPEAK_RADIUS = 1.5
export const DISTRICT_SENSOR_HALF_EXTENT = 5

// --- RENDERING ---
export const MAX_PIXEL_RATIO = 1.5
export const SHADOW_MAP_SIZE = 2048
export const FOG_NEAR = 15
export const FOG_FAR = 40

// --- AMBIENT LIGHT ---
export const AMBIENT_INTENSITY = 0.4
export const DIRECTIONAL_INTENSITY = 2.0

// --- UI ---
export const PANEL_SLIDE_MS = 300
export const TOAST_DURATION_MS = 2000
export const HUD_ICON_SIZE = 44

// --- WORLD SCALE ---
export const GROUND_SIZE = 500
export const CHARACTER_CAPSULE_RADIUS = 0.4
export const CHARACTER_CAPSULE_HEIGHT = 1.0

