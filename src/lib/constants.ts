// ============================================================
// BABTHEDEV WORLD — CONSTANTS
// All tunable values live here. Edit freely.
// ============================================================

// --- PHYSICS ---
export const GRAVITY = 0                       // Linear gravity disabled; radial gravity used instead
export const RADIAL_GRAVITY = 35               // m/s² pulling toward sphere center
export const VISITOR_SPEED = 3                 // Base speed (Q18: 3 units/sec, ~52s planet lap)
export const VISITOR_BOOST_SPEED = 4           // Subtle boost after 10s of wandering without interaction
export const ABDULRAHMAN_SPEED = 3             // Matches visitor base speed
export const TETHER_DISTANCE = 2
export const CATCH_UP_DISTANCE = 15
export const LINEAR_DAMPING = 4

// --- SPHERICAL WORLD ---
export const PLANET_RADIUS = 25                // 50m diameter sphere
export const SPHERE_SEGMENTS = 128             // Smooth sphere mesh resolution

// --- CAMERA ---
// Messenger framing: low and close, a wide lens aimed past the character
// so the curved horizon drops and buildings lean in overhead.
export const CAMERA_HEIGHT = 1.75               // above the visitor's capsule origin, along the normal
export const CAMERA_BACK = 3.9
export const CAMERA_FOV = 68
export const CAMERA_FOV_KICK = 3.5           // extra degrees of FOV at full walking speed: a sense of momentum
export const CAMERA_LOOK_HEIGHT = 1.35
export const CAMERA_LOOK_AHEAD = 2.2
// Q143/Q144, re-tuned for the closer/wider framing (was 6m @ 60° FOV,
// now 3.9m @ 68°) so both effects read on screen the same as before.
// Dialogue pull is a % of the shot distance, so it scales with CAMERA_BACK
// directly: 1m / 6m ≈ 16.7% of the old distance.
export const CAMERA_DIALOGUE_PULL = CAMERA_BACK * 0.167   // ~0.65m
// Reading-panel pan is a lateral offset judged by the screen-space angle
// it subtends, so it scales by both distance and FOV:
// old angle = atan(1.5/6) ≈ 14.0°, as a fraction of the old half-FOV (30°) ≈ 46.8%
// new pan = tan(46.8% × new half-FOV 34°) × 3.9m ≈ 1.1m
export const CAMERA_READING_PAN = 1.1
// Q11: the camera holds its heading while you move and gently orbits toward the
// facing direction when idle. While moving it only follows the FORWARD part of
// the input, slowly, so W+D steers in an arc but pure strafe / back go straight
// (following those would make the visitor circle).
export const CAMERA_FOLLOW_IDLE = 1.5    // 1/s
export const CAMERA_FOLLOW_TOUR = 4.5    // 1/s, on the guided tour: the visitor steers themselves, so the camera can keep up
export const CAMERA_FOLLOW_MOVING = 1.2  // 1/s, scaled by the forward component of the input
export const CAMERA_LERP = 5
export const CAMERA_NEAR = 0.1
export const CAMERA_FAR = 200
export const CAMERA_PITCH_MIN = -15 * (Math.PI / 180)   // Q142: -15° down
export const CAMERA_PITCH_MAX = 60 * (Math.PI / 180)    // Q142: +60° up
export const CAMERA_IMPULSE = 0.03                       // Q145: micro-impulse distance (m)

// --- TOON SHADER ---
// Two tones: surfaces facing away from the sun get ambient only, which
// matches cast shadows exactly — Messenger's flat lit/shadow split.
export const TOON_GRADIENT_STEPS = new Uint8Array([0, 255])
export const OUTLINE_COLOR = '#0B0B0B'
export const OUTLINE_THICKNESS = 1.7          // drawing-buffer pixels at close range
export const OUTLINE_DEPTH_THRESHOLD = 0.06   // relative linear-depth Laplacian
export const OUTLINE_NORMAL_THRESHOLD = 0.3   // 1 - cos(angle) between neighbour normals
export const OUTLINE_BOIL_PX = 1.1            // max line wobble, pixels

// --- MONOCHROME GRADE (perceptual 0..1) ---
export const MONO_BLACK = 0.04
export const MONO_WHITE = 0.97
// Tone curve applied after the levels. The first calibration (gamma 2.1) matched
// Messenger's histogram: median ~150/255, over half the pixels in the mid-tones.
// That reads as muddy. The grade is now a light gamma plus an S-curve (see
// MONO_CONTRAST), so lights are clean paper white, darks are deep ink, and the
// middle is thin.
export const MONO_GAMMA = 1.3
export const MONO_STEPS = 7                   // value bands
export const MONO_POSTERIZE = 0.75            // 0 = smooth, 1 = hard bands
export const MONO_CONTRAST = 1.7              // S-curve strength: >1 separates darks from lights, 1 = off
export const MONO_PIVOT = 0.55                // where the S-curve crosses over

// --- WORLD / PAPER PALETTE ---
export const PAPER_BACKGROUND = '#F2F1EC'     // slightly warm off-white, not pure white
export const GROUND_COLOR = '#D4D1C3'         // distinct warm paper tone with visible horizon contrast
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
export const FOG_NEAR = 45
export const FOG_FAR = 120

// --- LIGHTING ---
// Three's lights carry a 1/π Lambert factor, so ambient + sun ≈ π keeps a
// lit albedo at its authored value; ambient alone lands shadows at ~60%
// of the lit tone in display (sRGB) terms.
// Shade sits near 45% of the lit tone after the curve: a clear step from light to
// dark, so planes separate. (It was ~70% when matching Messenger's soft shade.)
export const AMBIENT_INTENSITY = 1.0
export const DIRECTIONAL_INTENSITY = 2.25
export const SUN_TILT = 1.25                  // tangent lean; min sun elevation = atan(1/tilt) ≈ 39°
export const SUN_DISTANCE = 40
export const SHADOW_EXTENT = 18               // half-size of the shadow frustum around the visitor

// --- SKY ---
export const SKY_COLOR = '#A9A8A2'            // soft mid-grey overhead, so white buildings read against it
export const SKY_HORIZON_COLOR = '#D3D2CC'
export const CLOUD_COLOR = '#F7F6F2'

// --- UI ---
export const PANEL_SLIDE_MS = 300
export const TOAST_DURATION_MS = 2000
export const HUD_ICON_SIZE = 44

// --- WORLD SCALE ---
export const GROUND_SIZE = 500
export const CHARACTER_CAPSULE_RADIUS = 0.4
export const CHARACTER_CAPSULE_HEIGHT = 1.0

