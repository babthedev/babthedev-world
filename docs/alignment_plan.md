# BabWorld — Alignment Plan

> Living document. Updated as decisions are locked in through the Q&A process.
> Last updated: 2026-09-17

---

## Project Identity

- **What it is:** A monochrome (black & white) spatial portfolio — a guided tour experience
- **What it is NOT:** A game. No combat, inventory, scores, fail states
- **Core dynamic:** Abdulrahman (guide) + Visitor (you) walk through the world together
- **Visual target:** Messenger by Abeto — same feel, same density, same hand-drawn quality — but monochrome
- **Success metric:** Content consumption time — the 3D world is the hook, reading essays/projects is the goal

---

## Batch 1 — World Foundations

### Q1. World Geometry → TRUE SPHERE

**Decision:** True sphere with radial gravity. Not flat, not vertex-bent illusion.

**Rationale:**
- Messenger is confirmed (across Wikipedia, Aftermath, multiple sources) to use a true spherical planet with radial gravity
- A prior coding session already implemented radial gravity correctly using Rapier per-frame impulses — this is being restored, not invented from scratch
- Radial gravity + surface-normal camera + tangent-plane movement
- No invisible walls needed — walk in any direction and you loop back
- Creates the intimate, contained, "tiny world" feel that defines Messenger

**Impact on codebase:**
- **Full rework needed:** `World.tsx` (planet mesh + gravity), both character controllers (tangent-plane movement, normal alignment), `CameraController.tsx` (up-vector = surface normal), `TriggerZones.tsx` (sensors as spheres, not boxes), `worldCoordinates.ts` (positions become sphere-surface coordinates, not XZ)
- **Stays intact:** `CharacterModel.tsx`, dialogue system, `ReadingPanel.tsx`, `HUDIcons.tsx`, audio manager, content-slot system logic, Sobel/Squigglevision/PaperGrain shaders, all MDX content

---

### Q2. World Scale → TINY PLANET (~50m diameter)

**Decision:** Small planet, roughly 50m diameter. Full guided tour completable in 5-8 minutes.

**Rationale:**
- Messenger's planet is described as "the size of a bigger game's city block" — comically small, curvature visible just metres ahead
- This is a portfolio, not a game — visitors (recruiters, collaborators) won't spend 30 minutes
- Tight scale forces density — every square metre must have something to see
- Previous 500x500 unit flat plane was far too large and sparse

---

### Q3. World Topology → LINEAR WINDING PATH WITH LOOP

**Decision:** A single winding street that passes through districts in sequence and loops back to start. Not hub-and-spoke.

**Rationale:**
- A guided tour has a narrative arc — beginning, middle, end
- Hub-and-spoke lets visitors scatter in any direction, undermining the tour flow
- On a sphere, a winding path naturally wraps around the planet and returns to start — poetic, satisfying
- Abdulrahman's tour sequence: Bio (introduction) -> Projects (what I've built) -> Library (what I think) -> back to start (thanks for visiting)
- Still allows free-roam — visitor can leave the path, but the tour follows this route

---

### Q4. Street Width & Enclosure → NARROW STREETS + OPEN PLAZAS

**Decision:** Mix — narrow connecting streets (6-8 units wide) between districts, opening into small plazas at each district center.

**Rationale:**
- Both reference images (Messenger + Roccasecca) show tight street-level corridors with buildings flanking both sides
- Constant narrow corridors feel claustrophobic; constant openness feels empty
- Alternating compression and release creates rhythm and anticipation
- Narrow streets: "what's around the corner?" -> Plaza: breathe, explore, read content
- Mirrors real town design (Italian piazza pattern)

---

### Q5. Ground Surfaces → 3 TONES

**Decision:** Three surface types — road, sidewalk/path, and ground — distinguished by grey tone.

**Rationale:**
- Even in monochrome, varied ground tones give spatial legibility
- Visitor intuitively knows "this is the path" vs "I'm wandering off-road"
- No complex textures needed — just 3 tones of grey with existing toon material
- Road = darkest (#1A1A1A), path/sidewalk = mid (#C8C8C0), ground = lightest (#E4E2D8)
- On a sphere, these would be painted/UV-mapped onto the planet surface or applied as decal strips

---

## Batch 2 — Visual Style & Rendering

### Q6. Planet Mesh → SMOOTH SPHERE (high subdivision, ~128 segments)

**Decision:** Smooth sphere, not faceted low-poly.

**Rationale:**
- The hand-drawn look comes from post-processing (Sobel, squigglevision, paper grain) — not raw geometry
- Faceted geometry fights with the Sobel shader, creating outline noise on every triangle edge
- A smooth sphere lets outlines appear only where they matter — building edges, character silhouettes, prop boundaries
- Messenger uses smooth geometry with the hand-drawn look coming entirely from shaders

---

### Q7. Outline Rendering → DEPTH + NORMAL EDGE DETECTION

**Decision:** Extend existing Sobel pass to sample both depth and normal buffers.

**Rationale:**
- Current depth-only Sobel misses inner detail edges (window frames, clothing folds, surface creases)
- Messenger has outlines on *everything* — inner edges included
- Adding a normal buffer sample detects edges where surface angle changes sharply, even if depth is continuous
- Existing shader just needs a second Sobel pass on the normal buffer, combined with the depth result

---

### Q8. Outline Thickness → DISTANCE-ADAPTIVE (clamped range)

**Decision:** Slightly distance-adaptive — thicker on close objects, thinner on distant ones, with a minimum floor. Range: 1.0px (far) to 2.0px (near).

**Rationale:**
- Pure uniform thickness looks flat and makes distant geometry noisy
- Scaling thickness by depth gives a natural ink-on-paper feel — closer things drawn heavier, distant things are lighter sketches
- Clamped min/max prevents outlines from disappearing at distance or becoming chunky up close

---

### Q9. Color Palette → WARM MONOCHROME (existing, confirmed)

**Decision:** Keep `PAPER_BACKGROUND = '#F2F1EC'` (warm off-white) and `INK_COLOR = '#0B0B0B'` (near-black).

**Rationale:**
- Warm off-white reads as "drawn on real paper" — not clinical, not nostalgic
- Cold grey feels sterile; sepia feels vintage; warm off-white + near-black feels *present* and *intentional*
- Already correctly set in constants — no change needed

---

### Q10. Toon Shading Steps → 4 STEPS, WIDER SPREAD

**Decision:** Keep 4 steps but widen the value spread: `[80, 150, 210, 255]` (was `[180, 210, 235, 255]`).

**Rationale:**
- 4 steps is the sweet spot — enough to read depth/form, few enough to stay graphic
- Previous values were clustered too tight at the bright end — insufficient contrast on a white background
- New spread gives: proper dark shadow (80), mid-shadow (150), lit surface (210), highlight (255)
- All four tones will read clearly against the paper background

## Batch 3 — Camera, Lighting & Atmosphere

### Q11. Camera Style → FIXED THIRD-PERSON WITH REACTIVE ADJUSTMENTS

**Decision:** Over-the-shoulder follow camera (height 3, back 6, lerp-smoothed) with two reactive tweaks: auto-raise in narrow streets, gentle orbit toward facing direction when idle. On a sphere, camera up-vector aligns to surface normal.

**Rationale:**
- Consistent base behavior prevents disorientation
- Reactive adjustments (raise in corridors, orbit when idle) keep it feeling alive
- Surface-normal up-vector is mandatory on a sphere and naturally creates the Messenger "world curves away from you" effect

---

### Q12. Lighting Model → SINGLE HARD DIRECTIONAL, STATIC, LOW-ANGLE

**Decision:** Static golden-hour-angle directional light (greyscale), lower elevation (~15° instead of ~60°) for longer, more dramatic shadows. No time-of-day cycle.

**Rationale:**
- Time-of-day cycles hurt readability at certain hours — bad for a portfolio
- Static lighting guarantees consistent toon shading and shadow quality
- Lower angle creates dramatic elongated shadows on paper-white ground — makes toon shading pop
- On a sphere, directional light naturally creates shadows that curve with the surface

---

### Q13. Fog Behavior → RADIAL, TIGHTER RANGE (15/40)

**Decision:** Radial fog from camera. Fade starts at ~15 units, full white-out by ~40 units (was 25/90).

**Rationale:**
- 50m-diameter sphere means far side is only ~75 units away — old range was too wide
- Tight fog creates an intimate pocket of detail around the visitor
- The sphere's curvature handles the rest — things naturally dip below the horizon
- World dissolves into paper-white in every direction, matching the monochrome aesthetic

---

### Q14. Sky Rendering → SUBTLE GRADIENT DOME

**Decision:** Inverted sphere with gradient shader — `#F2F1EC` (paper white) at horizon fading to `#D8D6CE` (warm grey) at zenith. No clouds, no color.

**Rationale:**
- Looking straight up at flat white from a tiny planet = white void, no sense of space
- Gradient gives sky *presence* without adding color or competing with the monochrome palette
- Reads as "overcast paper sky" — subtle sense of up/down orientation
- Implement as large inverted sphere with gradient shader or desaturated drei `<Sky>`

---

### Q15. Shadow Style → HARD-EDGED, BasicShadowMap

**Decision:** Hard-edged shadows using `BasicShadowMap`. No PCF softening. Keep 2048 shadow map resolution.

**Rationale:**
- Soft shadows look photorealistic — wrong for hand-drawn toon style
- Hard shadows look like ink marks / drawn shadows — matches Sobel outlines and paper grain
- On a sphere with low-angle lighting, hard shadows cast dramatic stripes across curved ground
- 2048 shadow map is sufficient resolution for a small planet

---

## Batch 4 — Characters & Movement

### Q16. Character Format → OPTIMIZED GLBs (converted from VRM)

**Decision:** Convert VRM files to compressed GLBs using `gltf-transform`. Target ~1-2MB per character. Strip unused blend shapes, compress with Draco/meshopt, bake only needed animations (idle, walk). Keep VRM sources in `/source-assets/` for re-export.

**Rationale:**
- Current VRMs are ~16MB each (3 files = ~50MB) — Messenger's entire initial load is 5.7MB
- VRM carries interoperability overhead (blend shapes, spring bones, metadata) not needed here
- 90% load time reduction from this single change
- Fast first paint is critical for a portfolio — visitors won't wait

---

### Q17. Sphere Movement → CHARACTER ALIGNS TO SURFACE NORMAL

**Decision:** Character's local up-vector always equals the sphere's surface normal at their position. Input is projected onto the tangent plane (perpendicular to normal).

**Rationale:**
- Standard approach for sphere-walking (Messenger, Mario Galaxy, GitHub clones all use this)
- Alternative (world rotates under character) breaks with multiple characters and props
- Prior session already implemented this with radial gravity impulses — restoring that approach
- Natural, intuitive feel — character walks "over" the curve

---

### Q18. Movement Speed → ~3 UNITS/SEC (with idle speed boost)

**Decision:** Base walking speed 3 units/sec. Full planet lap ~52 seconds. Subtle speed boost to 4 units/sec after 10 seconds of no interaction.

**Rationale:**
- At 50m diameter, 5 units/sec (old value) makes a full lap in 31 seconds — too fast, world feels rushable
- 3 units/sec gives 3-4 minutes of pure walking through the tour path, stretching to 5-8 minutes with dialogue and content pauses
- Speed boost for non-interacting visitors respects "I'm trying to get somewhere" intent
- Responsive enough to feel good, slow enough to absorb the environment

---

### Q19. Abdulrahman Follow Behavior → TETHERED OFFSET + COLLISION RAYCAST

**Decision:** Keep tether logic, add raycast for wall detection. If wall between characters, Abdulrahman offsets perpendicular to wall normal. If separation exceeds `CATCH_UP_DISTANCE`, teleport with smoke puff VFX.

**Rationale:**
- Simple tether will clip through walls on a sphere with narrow streets
- Full A* pathfinding is overkill for a tiny planet with a single winding path
- Raycast + offset is cheap and handles 95% of cases (visitor is almost always on/near the road)
- Smoke puff teleport already noted in existing code comments — just needs implementing

---

### Q20. Visitor Character → FIXED APPEARANCE, NO CUSTOMIZATION

**Decision:** Single fixed model, lighter grey than Abdulrahman. No customization options.

**Rationale:**
- This is a portfolio, not a social platform — customization adds complexity, load time, and decision fatigue
- The visitor is a lens, not a character — clean, neutral silhouette
- Visual distinction from Abdulrahman via lighter grey tone is sufficient
- One model, one look — keeps it simple and anonymous

---

## Batch 5 — Districts & Environment Design

### Q21. District Count → KEEP ALL 5 + ORYZON, REFRAMED AS STREET STOPS

**Decision:** Keep Hub, Bio, Projects, Library, 404, and locked Oryzon. Reframe as named stops along one winding street, not separate neighborhoods. Each "district" is ~8-12 meters of street frontage.

**Rationale:**
- On a tiny 50m sphere, these aren't neighborhoods — they're rooms along a corridor
- Single winding street with named sections: cafe (Bio) → exhibition hall (Projects) → reading room (Library)
- 404 is an off-path dead-end alley; Oryzon is a fenced construction zone visible from the path
- Each stop is dense and compact, not sprawling

---

### Q22. Building Assets → KENNEY AS SCAFFOLDING, CUSTOM LATER

**Decision:** Phase approach — use Kenney assets for initial build (spatial layout, physics, systems). Flag all as `placeholder: true`. Replace with custom/sourced assets in a later visual pass.

**Rationale:**
- Kenney assets are correctly sized, loaded, and allow fast density prototyping
- But their modern American city vibe doesn't match the Messenger/Roccasecca aesthetic
- Final visual pass needs narrow townhouses, awnings, shuttered windows, hanging signs
- 3D art production work happens after systems are proven — don't block engineering on art

---

### Q23. Prop Density → 8-12 PROPS PER 5 METERS OF STREET

**Decision:** Target 8-12 distinct props per 5m of visible street frontage. ~60-100 total placed props across the planet.

**Categories:**
- Street furniture: lamps, benches, bins
- Building dressing: awnings, signs, AC units
- Ground detail: road markings, drain covers
- Atmosphere: paper stacks, coffee cups, scattered items that tell micro-stories

**Rationale:**
- Messenger shows ~10-15 props per 5m of street — that's what makes it feel "lived in"
- Current world has ~3 props per district across 40+ meters — orders of magnitude too sparse
- Each prop is a simple low-poly mesh with toon material — cheap individually, dense collectively

---

### Q24. Vegetation → SPARSE AND STYLIZED (3-5 trees, small grass patches)

**Decision:** 3-5 stylized trees (sphere-on-cylinder silhouettes, toon material) at key moments. Small grass patches (lighter ground tone + vertex-displaced sway) at district plazas.

**Rationale:**
- Pure concrete everywhere feels oppressive even in monochrome
- Sparse trees create breathing points at landmarks (cafe terrace, library entrance)
- On a tiny planet, 3-5 trees is a forest — each one is a landmark, not decoration
- Grass is just subtle vertex displacement on lighter-toned planes — minimal cost

---

### Q25. The 404 Dead End → PHYSICAL ALLEY + URL ERROR SPAWN

**Decision:** Both — a 3-meter dead-end alley branching off the main path (flickering lamp, scrawled "404" on wall) AND the spawn point for invalid URLs.

**Rationale:**
- Discoverable through exploration — rewards the curious
- Functional as error state — invalid URL spawns you there
- On a tiny planet, it's just a 3-meter spur — almost nothing to build
- Flickering lamp and wall scrawl make it atmospheric with minimal assets

---

## Batch 6 — Content System & Interaction

### Q26. Content Auto-Placement → BUILD-TIME STATIC GENERATION

**Decision:** Next.js reads all MDX at build time, counts items per type, generates placement coordinates. World is pre-baked. New content requires redeploy (or ISR trigger).

**Rationale:**
- No runtime content fetching, no layout shift, no loading spinners for prop placement
- Matches existing MDX pipeline and keeps client simple
- World is a snapshot at deploy time — "a notebook that grows" with each publish
- Publishing a new essay = redeploy = world physically grows

---

### Q27. Reading Panel → 2D HTML OVERLAY (existing, confirmed)

**Decision:** Keep the 2D HTML overlay panel that slides in. World pauses behind it, Abdulrahman enters idle-waiting animation.

**Rationale:**
- MDX content with code blocks, images, long-form text is unreadable on in-world 3D planes
- The 3D world is the hook, but content is the *product* — needs clean typographic experience
- Messenger uses 2D HTML overlays for dialogue too — same pattern
- Panel already built, just needs content-type variations

---

### Q28. Video Interaction → EMBEDDED PLAYER INSIDE READING PANEL

**Decision:** Same overlay panel as essays/projects, but with responsive `<iframe>` or `<video>` element. Title, date, description below the player from frontmatter.

**Rationale:**
- Don't link out — every external link is a visitor lost
- Don't build in-world TV — same readability/aspect-ratio issues as in-world text
- Panel is already built — swap the content slot based on `type: "video"` in frontmatter
- Keeps all content consumption in one consistent UI pattern

---

### Q29. Interaction Input → PROXIMITY HINT + EXPLICIT PRESS

**Decision:** Walk within `INTERACTION_RADIUS` → "E" hint floats above prop. Press E (or tap on mobile) to interact. No auto-trigger, no click-on-object raycasting.

**Rationale:**
- Auto-trigger is annoying — opens panels just walking past things
- Click-on-object requires raycasting precision that's frustrating on mobile
- Proximity + explicit press is the genre standard (Messenger, Zelda, every 3D adventure)
- Balances discoverability (hint appears) with intentionality (must press to open)
- `InteractHint.tsx` already exists for this pattern

---

### Q30. Content Freshness → INTERACTION-DRIVEN, 14-DAY CAP

**Decision:** Track per-item interaction in localStorage (Set of opened content IDs). NEW tag + darker ink appears if item is unopened AND published after last visit. Fades on open, or after 14 days regardless.

**Rationale:**
- Engagement-driven freshness, not just time-based
- Visitor who reads everything sees no stale NEW tags
- 14-day cap handles the case where visitor never opens something — "new" loses meaning after two weeks
- Simple localStorage implementation — Set of IDs + lastVisitTimestamp

---

## Batch 7 — Dialogue, Narrative & NPCs

### Q31. Dialogue Display → BOTTOM-SCREEN PANEL (Messenger-style)

**Decision:** Fixed HTML overlay panel at bottom of viewport. Name tag on the left ("Abdulrahman"), text in center, advance arrow on right. Not a 3D billboard above the character.

**Rationale:**
- Speech bubbles above 3D characters have readability issues — scale with distance, rotate with camera
- Fixed bottom panel is always readable, always same size, supports longer text
- Feels more "guided tour" than "game NPC"
- Matches Messenger's dialogue pattern exactly (white box, name label, text, advance button)

---

### Q32. Dialogue Pacing → MANUAL ADVANCE WITH AUTO-FALLBACK

**Decision:** Visitor clicks advance arrow (or E / tap) to continue. Arrow pulses as hint after 8 seconds of inactivity. Auto-advances after 15 seconds to prevent stalling. First-time tooltip: "Press E to continue."

**Rationale:**
- Auto-advance risks visitors missing lines if distracted
- Pure manual risks visitors not knowing to click
- Hybrid respects reading speed while preventing deadlocks
- 8-second hint + 15-second auto-advance covers all cases

---

### Q33. NPC Count → 4-5 TOTAL (2 interactable, 2-3 ambient)

**Decision:** Joe (cafe, interactable with dialogue) + 1 Library NPC (interactable, comments on writing). 2-3 ambient NPCs (seated/standing, idle animation, no dialogue — pure atmosphere).

**Rationale:**
- Tiny planet — more than 5 characters feels crowded
- Joe has personality and a name — he matters as a character
- Library NPC adds life to the reading room
- Ambient NPCs make the world feel inhabited without interaction overload
- Each ambient NPC = one idle animation, zero dialogue

---

### Q34. Tour vs Free-Roam → TOUR AUTO-STARTS, BREAKABLE BY WALKING AWAY

**Decision:** Welcome screen → Start → intro dialogue → Abdulrahman leads tour along winding path. Walking away from Abdulrahman (exceeds tether for 3+ seconds) pauses tour — "I'll be here when you're ready" — switches to follow/free-roam. Walking back near unvisited waypoint resumes tour. Returning visitors skip to free-roam with "Welcome back."

**Rationale:**
- Tour is a suggestion, not a rail — respects visitor autonomy
- First-time visitors get the full guided experience
- Returning visitors (localStorage detection) aren't forced to repeat
- Graceful pause/resume keeps the tour recoverable, not all-or-nothing

---

### Q35. Milestone Tracking → localStorage SET + BUILD-TIME COUNTS

**Decision:** Build-time manifest bakes total content counts per type (e.g., `{ essays: 7, books: 1 }`). Client compares against localStorage Set of fired milestone IDs. Milestones fire during tour or on next district visit. Never fire twice.

**Rationale:**
- Simple, no backend needed
- Build-time counts are always accurate — no runtime fetching
- localStorage Set persists across visits — milestones are one-time events
- Fires contextually (during tour or district visit), not randomly

---

## Batch 8 — Audio & Animation

### Q36. Music → SUBTLE AMBIENT SOUNDTRACK, MUTED BY DEFAULT

**Decision:** Gentle looping lo-fi/ambient track (piano, soft pads, no beats). Muted by default — speaker icon in HUD to toggle. Environmental SFX (footsteps, paper rustling, wind) play regardless of music toggle. One track, ~2-3 minutes, seamless loop.

**Rationale:**
- Browsers auto-block audio; unexpected soundtrack on a portfolio feels intrusive
- Muted-by-default respects the visitor; toggle empowers those who want atmosphere
- Environmental SFX are always on — they ground the experience without demanding attention
- Single track keeps audio budget small (~300KB compressed)

---

### Q37. Footsteps → SURFACE-AWARE, 3 VARIANTS

**Decision:** One footstep sound per ground type: harder tap (road), softer pad (path/sidewalk), muffled crunch (grass/ground). Synced to walk animation cycle. 2-3 alternating samples per variant (~9 tiny audio clips total).

**Rationale:**
- Surface-aware footsteps are the single most impactful audio detail in a walking experience
- Low effort (9 clips) for high immersion
- Synced to animation, not distance — feels natural
- Alternating samples prevent robotic repetition

---

### Q38. Animation States → 5 STATES (idle, walk, interact, wait, sit)

**Decision:**
- **Idle:** standing, subtle breathing sway
- **Walk:** standard locomotion loop
- **Interact:** brief reach-forward gesture (0.5s) when activating props
- **Wait:** Abdulrahman's pose while visitor reads (weight shifted, arms crossed/pockets)
- **Sit:** for seated NPCs (Joe, ambient characters)

All baked into optimized GLBs.

**Rationale:**
- 5 states covers every scenario without bloat
- Wait state keeps Abdulrahman present but unobtrusive during reading
- Sit state needed for Joe and ambient NPCs
- Interact gives tactile feedback on prop activation

---

### Q39. Animation Blending → FAST CROSSFADE (0.15s)

**Decision:** 150ms crossfade between animation states. Not hard cut, not slow blend.

**Rationale:**
- Hard cuts in 3D read as bugs, not style — unlike 2D cel animation
- 150ms is snappy enough to feel intentional, long enough to avoid mesh popping
- 12fps Squigglevision already provides the hand-drawn feel — don't need janky transitions on top
- Messenger uses smooth blends despite stylized visuals — same approach

---

### Q40. Paper Cranes → KEEP, PLANET-ORBITING AT LOW ALTITUDE

**Decision:** Keep 5-8 cranes orbiting the sphere at ~3-5 units above surface in lazy, slightly randomized paths. Adjust flight from flat-world linear to sphere-orbiting arcs.

**Rationale:**
- Paper cranes fit the "drawn on paper" metaphor perfectly — literally folded paper
- More thematically coherent than butterflies (Messenger) because this world IS paper
- Distinctive signature element — one of the most unique things in the codebase
- On a sphere, orbiting cranes visible from the ground read as birds drifting across the sky

---

## Batch 9 — UI, HUD & Onboarding

### Q41. HUD Elements → 3 ELEMENTS ONLY (Audio, District Label, Mini-Compass)

**Decision:** Minimal persistent HUD: Audio mute/unmute toggle (top-right), dynamic District Label fading in/out upon entering new zones, and a subtle mini-compass indicating the forward direction of the tour path.

**Rationale:**
- Preserves cinematic immersion and keeps screen clutter to zero — it's a portfolio, not an RPG
- No health bars, inventory, or complex minimaps
- On a sphere, a subtle directional indicator/compass prevents disorientation while keeping UI quiet

---

### Q42. Welcome Screen → FROSTED OVERLAY OVER LIVE 3D WORLD

**Decision:** The 3D scene renders immediately behind a semi-transparent frosted overlay. Displays "BabTheDev", subtitle ("A guided tour through my work"), and a "Begin" button. Clicking "Begin" smoothly dissolves the overlay as the visitor character walks in.

**Rationale:**
- Eliminates the jarring transition of traditional double loading/splash screens
- Gives the visitor immediate visual reward (ambient cranes, soft shadows) while assets finalize in the background
- Sets the tone of entering a living notebook

---

### Q43. Loading Strategy → 3-TIER LOADING (Critical, Deferred, Lazy)

**Decision:**
- **Tier 1 (Critical):** Planet mesh, character models, spawn area props, core shaders (blocks "Begin", target <3MB).
- **Tier 2 (Deferred):** Full district architecture, ambient props, secondary NPC models (streams in background after start).
- **Tier 3 (Lazy):** Audio tracks, high-res MDX assets, video embeds (fetched on demand).

**Rationale:**
- Guarantees fast initial interaction time (clickable within 3s on decent connection)
- Prevents initial bundle bloat while ensuring smooth tour progression without pop-in

---

### Q44. Mobile Controls → VIRTUAL JOYSTICK + TOUCH INTERACT BUTTON

**Decision:** Virtual floating joystick on the bottom-left for tangent-plane locomotion; a single responsive "Interact" (E) button on the bottom-right. Hidden on desktop/keyboard devices.

**Rationale:**
- Tap-to-move with curved sphere raycasting and obstacle avoidance is brittle and error-prone
- Virtual thumbstick gives tactile, direct control matching console/analog handheld feel (like Messenger)
- Clean, minimal 2-touch setup

---

### Q45. Responsive Reading Panel → FULL-SCREEN SHEET (Mobile) vs. 40% SIDE PANEL (Desktop)

**Decision:**
- **Desktop (>768px):** Slides in from the right covering ~40% width, leaving 60% viewport showing the 3D scene with Abdulrahman in his waiting idle pose.
- **Mobile (<768px):** Slides up as a full-screen drawer/sheet with a distinct close/swipe-down handle.

**Rationale:**
- On mobile, split screens ruin typography and readability; text deserves full focus
- On desktop, retaining the 3D world in view maintains spatial continuity and charm

---

## Batch 10 — State, Spatial Routing & URL Synchronization

### Q46. Spatial URL Synchronization → SILENT replaceState ON DISTRICT ENTRY

**Decision:** Update browser URL silently using `window.history.replaceState({}, '', districtPath)` whenever the character crosses into a district zone. No full Next.js page transitions or WebGL re-mounts.

**Rationale:**
- Keeps URL shareable at any point during exploration without dropping WebGL context
- Frictionless for visitors — no page reload flicker or audio interruption
- Pasting a copied link allows others to land directly at that specific district

---

### Q47. Deep-Linking Behavior → DIRECT SPAWN AT DISTRICT WITH CONTEXTUAL GREETING

**Decision:** When loading a specific URL (e.g. `/projects` or `/essays`), spawn both characters directly at that district's sphere coordinates. Skip generic Hub welcome and play that district's entry dialogue instead.

**Rationale:**
- Prioritizes user intent — recruiters or readers arriving via direct link shouldn't be forced through an introductory commute
- Visitors remain free to turn around and explore the rest of the planet at their own pace

---

### Q48. State Management Architecture → BOUND ZUSTAND STORE WITH DOMAIN SLICES

**Decision:** Maintain one root hook `useWorldStore`, internally composed of domain slices (`usePlayerSlice`, `useTourSlice`, `useUISlice`, `useAudioSlice`).

**Rationale:**
- Single source of truth for high-frequency updates in R3F render loops
- Allows atomic cross-domain state changes (e.g. `openReadingPanel` simultaneously pauses player input, triggers companion waiting pose, and logs telemetry) without multiple dispatch calls

---

### Q49. LocalStorage Persistence → NON-SPATIAL PREFERENCES & MILESTONES ONLY

**Decision:** Persist `hasCompletedIntro`, `audioMuted`, `lastVisitTimestamp`, `readContentIds`, and `firedMilestoneIds`. Strictly never persist raw 3D coordinates.

**Rationale:**
- Prevents visitors from spawning inside geometry if buildings or props are moved in future updates
- Spawns always happen at verified, safe landmark waypoints
- Preserves user preferences and engagement history reliably

---

### Q50. Browser History & Back Button → CLOSE MODAL FIRST, THEN PREVIOUS DISTRICT

**Decision:** Pushing history entry on opening the reading panel. Clicking browser "Back" closes the panel first. If roaming freely, "Back" moves camera/character back to previous district landmark.

**Rationale:**
- Matches intuitive mobile & desktop UX where Back dismisses overlays rather than exiting the website
- Drastically reduces bounce rates from accidental back-button navigation

---

## Batch 11 — Collisions, Physics Boundaries & Movement Mechanics on a Sphere

### Q51. Collider Architecture on Sphere → ORIENTED CUBOIDS FOR BUILDINGS, PASS-THROUGH PROPS

**Decision:** Simplified oriented cuboid colliders for buildings/walls aligned to the surface tangent normal; completely disable colliders on small decorative street props (trash cans, mailboxes, paper stacks). No trimesh colliders.

**Rationale:**
- Trimesh colliders in Rapier cause characters to snag on mesh seams and impose heavy CPU/WASM overhead
- Oriented cuboids offer frictionless sliding along street walls
- Decorative props stay purely visual, preventing clutter jams in narrow corridors

---

### Q52. Street Boundary Enforcement → TALL BUILDING COLLIDERS + INVISIBLE CORRIDOR WALLS

**Decision:** Building colliders extend 8-10m upward, backed by continuous invisible curved perimeter collision barriers lining the street edges.

**Rationale:**
- Preserves intentional street framing and prevents visitors from climbing onto roofs or wandering behind building backfaces
- Protects the hand-drawn illusion and keeps the camera framed cleanly

---

### Q53. Character-to-Character Collision → GHOSTING / PASS-THROUGH (NO MUTUAL COLLISION)

**Decision:** Abdulrahman and the Visitor collide with architecture and terrain, but pass freely through each other without physical collision.

**Rationale:**
- In narrow 6-8m streets, mutual character collision frequently causes pinning and traps
- Ensures companion following never blocks or frustrates the visitor

---

### Q54. Incline, Curb & Step Handling → CAPSULE COLLIDER + 0.3M AUTO-STEPPING

**Decision:** Character uses a capsule collider with rounded bottom, equipped with Rapier auto-step (max step height 0.3m, 45° max slope).

**Rationale:**
- Allows smooth transitions between asphalt street, sidewalks, and curb edges without hitching or snagging
- Rounded bottom glides naturally over surface curvature

---

### Q55. Jump Mechanic → STRICTLY GROUNDED LOCOMOTION (NO JUMP)

**Decision:** No jump button. Locomotion is strictly grounded walking and slope traversal.

**Rationale:**
- Matches Messenger (which has no jumping) and maintains a calm, museum-like walking pace
- Eliminates edge cases of visitors jumping onto roofs or getting wedged on props
- Keeps mobile touch controls simple (no jump button clutter)

---

## Batch 12 — Performance, Shaders, Mobile Optimization & Asset Pipeline

### Q56. Draw Call Optimization → INSTANCED PROPS (`<Instances>` / `InstancedMesh`)

**Decision:** Group repeated identical street props (lamps, cones, bollards, barriers, benches) into `InstancedMesh` clusters with transforms baked per district.

**Rationale:**
- Reduces draw calls from ~150+ to ~15-20
- Mobile WebGL is heavily bottlenecked by CPU draw call overhead, not triangle counts
- Guarantees 60 FPS on mid-tier mobile hardware

---

### Q57. Post-Processing Quality Tiers → 2-TIER ADAPTIVE STACK

**Decision:**
- **Tier 1 (Desktop / High):** Full stack (SMAA + Sobel + PaperGrain + Squigglevision).
- **Tier 2 (Mobile / Battery Saver / Low FPS):** Sobel + PaperGrain only; disable Squigglevision and SMAA. Auto-demote if FPS drops below 40 for >2s.

**Rationale:**
- Sobel and PaperGrain provide 95% of the distinctive ink aesthetic
- Squigglevision and SMAA are fill-rate intensive; dropping them on mobile saves massive battery without breaking the visual style

---

### Q58. 3D Asset Compression → MESHOPT (`gltf-transform optimize --compress meshopt`)

**Decision:** Standardize on Meshopt compression over Draco across all GLBs.

**Rationale:**
- Draco incurs a heavy CPU decoding pause on main thread during mobile startup
- Meshopt decodes at near memory bandwidth (~1GB/s) in WebAssembly without main thread freeze
- Fast, instant asset unpacking on initial page load

---

### Q59. Interaction Queries → RAPIER SPHERICAL TRIGGER SENSORS

**Decision:** Proximity detection uses lightweight Rapier spherical sensors (`<BallCollider args={[INTERACTION_RADIUS]} sensor />`) attached to interactive props. No per-frame CPU raycasting.

**Rationale:**
- Near zero CPU cost — Rapier's spatial hash handles detection naturally during physics steps
- Eliminates per-frame Three.js raycaster overhead

---

### Q60. High-DPI & DPR Throttling → STRICT DPR CAP AT 1.5

**Decision:** Clamp canvas DPR to `Math.min(window.devicePixelRatio, 1.5)`.

**Rationale:**
- Retinas at 3x/4x quadruple fragment shader load with virtually zero visible difference for toon/ink art
- 1.5 DPR saves immense battery and thermal load on mobile phones

---

## Batch 13 — Accessibility, 2D Fallback, SEO & Quick Navigation

### Q61. 2D Accessible Fallback → AUTO-FALLBACK + "CLASSIC VIEW" TOGGLE

**Decision:** Auto-detect WebGL failure and provide an explicit "Classic View (2D)" toggle in top HUD. Renders a clean, editorial, reader-friendly static HTML layout of all content in matching warm paper aesthetics.

**Rationale:**
- Zero failure rate — if corporate GPUs or screen readers block WebGL, the portfolio never displays a blank screen
- Offers high-intent visitors an immediate reading mode

---

### Q62. SEO & Crawlers → SSR SEMANTIC HTML + JSON-LD + OPENGRAPH

**Decision:** Next.js pre-renders semantic `<main>`, `<article>`, and OpenGraph meta tags for all canonical routes (`/bio`, `/projects/[slug]`, `/essays/[slug]`).

**Rationale:**
- Ensures Googlebot, Bing, Twitter, and LinkedIn crawlers index full text and display rich cards without running client WebGL

---

### Q63. Motion Sensitivity → AUTO-HONOR `prefers-reduced-motion`

**Decision:** When media query is active: disable Squigglevision jitter (render clean crisp lines), increase camera lerp dampening, and halt crane wing flap oscillations.

**Rationale:**
- WCAG 2.1 compliant; eliminates vestibular discomfort on spherical camera movements for sensitive visitors

---

### Q64. Fast-Travel / Navigation → "INDEX" DRAWER (TABLE OF CONTENTS)

**Decision:** A subtle "Index" button in HUD opens a clean slide-out table of contents listing all stops and works. Clicking any item instantly glides camera/player to that district or opens the article.

**Rationale:**
- Solves the common friction of 3D portfolios for busy recruiters who need to view specific case studies in under 5 seconds

---

### Q65. Full Keyboard Accessibility → WASD/ARROWS + FOCUS TRAPPING IN PANELS

**Decision:** Locomotion via WASD and Arrow keys. E/Enter triggers nearby props. Reading panel traps focus with standard Tab navigation and closes via Escape.

**Rationale:**
- Natural, standard keyboard UX for power users and accessible navigation

---

## Batch 14 — VFX, Environmental Micro-Details & Audio Juice

### Q66. Locomotion Dust Puffs → 2-FRAME BILLBOARD PAPER/INK PUFFS

**Decision:** Emit small stylized paper/ink puffs at character heels upon each footfall, expanding and dissolving over 0.3s.

**Rationale:**
- Visually grounds characters firmly to the curved terrain, preventing floaty sensations
- Matches Messenger's locomotion feedback

---

### Q67. Interactive Prop Highlight → OUTLINE SURGE + 2CM SINE BOB

**Decision:** When entering proximity, slightly increase the prop's outline thickness and add a gentle 2-3cm vertical sine bob.

**Rationale:**
- Subtle, organic indication of interactability without garish video-game halos or flashing colors

---

### Q68. Ambient Particles → INSTANCED DRIFTING PAPER SCRAPS (30-40 particles)

**Decision:** A lightweight field of 30-40 tiny instanced paper flecks drifting along the wind vector near the surface.

**Rationale:**
- Enhances depth perception and parallax against background buildings
- Deepens the "living sketchbook" aesthetic

---

### Q69. Foley & UI Sound Design → TACTILE PAPER, WOOD & TYPEWRITER SOUNDS

**Decision:** Dialogue advance = typewriter key tap; Reading panel = crisp page turn / paper slide; Footsteps = subtle surface taps.

**Rationale:**
- Avoids digital/arcade beeps; handcrafted physical foley reinforces the tangible paper world

---

### Q70. Scene Transitions → CIRCULAR INK-DROP IRIS WIPE

**Decision:** Transitions and teleports use a circular iris mask expanding/contracting like ink diffusing on wet paper.

**Rationale:**
- Distinctive cinematic style reminiscent of classic hand-drawn animation

---

## Batch 15 — Editorial Pipeline, MDX Schemas & Media Extensions

### Q71. Frontmatter Validation → STRICT BUILD-TIME ZOD SCHEMAS

**Decision:** Strict Zod validation on every `.mdx` during `next build`. Missing or malformed required fields immediately halt the build with actionable file and field diagnostics.

**Rationale:**
- Eliminates silent runtime bugs or missing 3D world props in production
- Enforces a reliable content contract across all 4 content types

---

### Q72. Reading Panel Typography → CURATED MONOCHROME MDX COMPONENTS

**Decision:** Shiki syntax highlighting using high-contrast paper/ink theme, 1-click code copy button, editorial pull quotes, callout boxes with hand-drawn ink borders, and captioned image zoom.

**Rationale:**
- Technical writing is the primary deliverable; authoritative, clean typography makes reading enjoyable while honoring the paper aesthetic

---

### Q73. Book Navigation → CONTINUOUS SCROLL + STICKY CHAPTER OUTLINE

**Decision:** Books render as continuous vertical scroll with a sticky floating chapter index on the margin allowing 1-click chapter jumping.

**Rationale:**
- Eliminates pagination click friction; supports fluid reading, scanning, and bookmarking

---

### Q74. Project Case Study Media → INLINE RICH MEDIA + FULL-SCREEN LIGHTBOX

**Decision:** Inline images and GIF demos in MDX body; clicking opens high-resolution lightbox carousel with technical captions.

**Rationale:**
- Allows recruiters and design leads to inspect architecture diagrams and UI workflows at full resolution

---

### Q75. RSS Feed → AUTOMATED BUILD-TIME GENERATION (`public/feed.xml`)

**Decision:** Compile all published essays and books into standard RSS 2.0 / Atom feed during static build.

**Rationale:**
- Zero runtime overhead; provides permanent reach to high-value technical readers using RSS readers

---

## Batch 16 — Telemetry, Contact System & Visitor Engagement

### Q76. Telemetry & Analytics → COOKIELESS, PRIVACY-FIRST CUSTOM BEACON

**Decision:** Lightweight, cookieless event tracking (Plausible/Umami/custom endpoint). Tracks `tour_started`, `tour_completed`, `content_opened`, and `content_read_2min`. Zero cookies, zero IP logging.

**Rationale:**
- Complies with privacy laws without disruptive cookie-consent popups on initial load
- Measures the single metric that matters: content engagement time

---

### Q77. In-World Contact → PHYSICAL MAILBOX PROP + HUD ENVELOPE MODAL

**Decision:** Interacting with the Welcome Terrace Mailbox (or clicking the HUD envelope) opens a paper-styled "Send a Letter" form routed to a serverless email webhook (Resend/Formspree).

**Rationale:**
- Strengthens the paper/mail narrative seamlessly
- Feels personal, warm, and significantly increases inbound messages compared to cold `mailto:` links

---

### Q78. Resume / CV Access → TERRACE CHALKBOARD STANDEE + 1-CLICK PDF DOWNLOAD

**Decision:** Physical standee at Welcome Terrace opens structured interactive resume, with prominent "Download PDF" button in reading header.

**Rationale:**
- Offers recruiters both an immersive interactive review and an immediate ATS-friendly PDF download

---

### Q79. Visitor Footprint → CORKBOARD GUESTBOOK AT CAFE TERRACE

**Decision:** A cafe corkboard where visitors can leave a short 100-character note or emoji reaction, stored in a lightweight database.

**Rationale:**
- Provides social proof and community warmth without the complex engineering of live multiplayer WebSockets

---

### Q80. Tour Completion → CLOSING DIALOGUE + PASSPORT STAMP + CRANE FLYOVER

**Decision:** Upon completing the full loop back to Hub, Abdulrahman delivers a warm closing line ("We've walked the whole loop..."), a "Tour Completed" stamp toast appears, and a low flock of cranes swoops overhead.

**Rationale:**
- Delivers narrative closure, rewards visitor time, and leaves an unforgettable emotional impression

---

## Batch 17 — Developer Experience, Tooling & CI/CD

### Q81. Package Manager → STRICTLY `pnpm` (DELETE `package-lock.json`)

**Decision:** Standardize strictly on `pnpm`. Remove `package-lock.json` and enforce with `only-allow-pnpm`.

**Rationale:**
- Faster installs, strict dependency isolation, and prevention of phantom dependencies in complex Three.js/React 19 ecosystems

---

### Q82. Pre-Commit Quality Gating → HUSKY + LINT-STAGED

**Decision:** Run `tsc --noEmit`, ESLint, and Zod MDX schema validation on staged files prior to commit.

**Rationale:**
- Prevents broken frontmatter or type regressions from ever being pushed to branches or breaking CI builds

---

### Q83. Visual Regression Testing → PLAYWRIGHT WEBGL CANVAS SNAPSHOTS

**Decision:** Playwright tests in CI capturing pixel diffs of key views (Hub, Library, Reading Panel) against baseline images.

**Rationale:**
- Shaders and post-processing passes can silently break without throwing JS errors; visual snapshotting is the only reliable automated defense

---

### Q84. Deployment Pipeline → VERCEL PREVIEW ENVIRONMENTS PER PR

**Decision:** Automatic Vercel branch preview URLs with edge caching for 3D GLB assets and ISR/SSR support.

**Rationale:**
- Enables instant mobile device testing on staging URLs before merging to `main`

---

### Q85. Developer Overlay → F3 DEBUG MODE (WIREFRAMES + COORD INSPECTOR + FREE-FLY)

**Decision:** Toggling `F3` (or `?debug=true`) exposes Rapier collider wireframes, real-time sphere coordinate readouts, and camera detach/OrbitControls.

**Rationale:**
- Invaluable for authoring and placing props on a curved sphere without blind trial-and-error

---

## Batch 18 — Typography, Audio Formats, Colophon & WebGL Resilience

### Q86. Audio Formats & Budget → OPUS (WebM) + AAC/MP3 (<600KB TOTAL BUDGET)

**Decision:** Encode ambient track and all foley in Opus/WebM with AAC/MP3 fallback. 48kbps mono for ambient loop. Total audio asset footprint under 600KB.

**Rationale:**
- Fast load time (<0.25s), universally supported across all desktop and mobile browsers, crystal-clear warm lo-fi acoustics

---

### Q87. 3D In-World Signage → SIGNED DISTANCE FIELD (SDF) TEXT (`@react-three/drei` `<Text>`)

**Decision:** Render street signs and district names using SDF text via troika-three-text (`drei` `<Text>`). No polygon 3D text.

**Rationale:**
- Razor-sharp text at any camera angle without blurring or thousands of wasteful triangles; integrates cleanly with scene lighting and depth

---

### Q88. Editorial Typography Stack → ARCHITECTURAL SANS (UI) + LITERARY SERIF (READING)

**Decision:** Geometric sans (*Geist* / *Space Grotesk*) for UI, HUD, and 3D street signage; warm literary serif (*Newsreader* / *EB Garamond*) for long-form essays and books. Loaded via `next/font`.

**Rationale:**
- Establishes a thoughtful contrast between the utilitarian street navigation and the warm, personal book-reading experience

---

### Q89. Legal, Credits & Colophon → DEDICATED "COLOPHON" SLIDE-OUT

**Decision:** Subtle "Colophon & Credits" link in Welcome Screen and reading footer detailing open-source credits (Kenney, Three.js, Rapier, typefaces) and technical architecture notes.

**Rationale:**
- Demonstrates professional craftsmanship and engineering transparency valued by design leaders and recruiters

---

### Q90. WebGL Context Resilience → AUTOMATED `webglcontextlost` RECOVERY

**Decision:** Implement canvas context listeners to gracefully catch context loss on mobile app-switching, show a discreet status toast, and restore shaders/transforms on context restore.

**Rationale:**
- Prevents crashes when mobile visitors switch apps or answer calls mid-tour

---

## Batch 19 — Refactoring Strategy, Legacy Code Deprecation & Migration Sequence

### Q91. Legacy Code Deprecation → ISOLATED `/legacy` ARCHIVE DIRECTORY

**Decision:** Move legacy flat coordinate math into `src/lib/legacy/worldCoordinatesFlat.ts`. Active files contain only clean, typed spherical mathematics without commented-out legacy blocks.

**Rationale:**
- Keeps the active codebase clean, maintainable, and type-strict while preserving previous implementation history

---

### Q92. Phased Migration Sequence → 5 PROGRESSIVE RUNNABLE MILESTONES

**Decision:**
1. **Phase 1:** Planet mesh & radial gravity impulses
2. **Phase 2:** Camera & tangent-plane locomotion
3. **Phase 3:** Winding street layout, building colliders & district stops
4. **Phase 4:** Shaders & post-processing (Normal+depth Sobel, wider toon steps, radial fog)
5. **Phase 5:** Content auto-placement, video embeds & HUD polish

**Rationale:**
- Each phase delivers a functional, runnable milestone that can be verified with `pnpm dev` immediately

---

### Q93. Side-by-Side Dev Architecture → DEDICATED GIT FEATURE BRANCH

**Decision:** No runtime `?sphere=false` flags or dual-logic branches in production code. Git feature branch provides complete isolation.

**Rationale:**
- Prevents technical debt and branching complexity in physics, camera, and render loops

---

### Q94. Dependency Pruning → REMOVE `@pixiv/three-vrm` POST-GLB CONVERSION

**Decision:** Retain Three, Rapier, Postprocessing, and MDX libraries. Remove `@pixiv/three-vrm` once characters are converted to optimized GLBs.

**Rationale:**
- Strips heavy avatar parsing runtime overhead from the final production bundle

---

### Q95. Character Model Abstraction → UNIFIED `<CharacterModel />` INTERFACE

**Decision:** Keep the `<CharacterModel url="..." />` component props unchanged. Internally branch on file extension (`.vrm` vs `.glb`).

**Rationale:**
- Enables immediate testing on new spherical controllers using existing models, with zero controller churn when compressed GLBs drop in

---

## Batch 20 — Future Expansion, Long-Term Maintenance & Definition of Done

### Q96. Future Venture Expansion → `FEATURE_FLAGS.ORYZON_OPEN` UNLOCK EVENT

**Decision:** Opening the Oryzon district is controlled by a boolean feature flag. When enabled, the construction barrier disappears, Abdulrahman delivers a celebratory unlock dialogue, and the path extends into the new pavilion.

**Rationale:**
- Turns real-world career milestones into living world events that reward returning visitors

---

### Q97. Authoring Documentation → DEDICATED `docs/AUTHORING_GUIDE.md`

**Decision:** Create a concise authoring manual with frontmatter templates for all 4 types, image sizing standards, and the 1-command publish flow.

**Rationale:**
- Makes the site a frictionless personal CMS; you can publish articles months from now without inspecting React internals

---

### Q98. Zero-CDN Preservation → 100% SELF-HOSTED ASSETS

**Decision:** Bundle all fonts via `next/font`, keep all GLBs/textures/audio local in `/public`. Zero external script tags or runtime CDNs.

**Rationale:**
- Guarantees the site will still render perfectly 10 years from now without breaking due to dead external links

---

### Q99. Offline & Repeat Visit Acceleration → SERVICE WORKER CACHING

**Decision:** Lightweight service worker with Stale-While-Revalidate caching for 3D GLBs and audio.

**Rationale:**
- Sub-500ms repeat loads on mobile, even on slow cellular connections

---

### Q100. Definition of Done → STRICT 6-POINT VERIFICATION CRITERIA

**Decision:**
1. **Spherical Physics:** 50m diameter sphere with radial gravity; seamless 360° traversal without clipping.
2. **Messenger Visuals:** Warm monochrome palette, 4-step toon shading, normal+depth ink outlines, 12Hz squigglevision, paper grain, hard shadows.
3. **Street Density:** 6-8m street corridors with 8-12 props per 5m opening into district plazas.
4. **Guided Tour:** Guided path through Bio, Projects, Library with bottom dialogue panel and celebratory finish.
5. **Content Notebook:** Dropping MDX files auto-spawns physical props at build time.
6. **Performance & A11y:** 60 FPS on mobile/desktop, full keyboard navigation, 2D fallback view, zero TS errors.

**Rationale:**
- Establishes an uncompromising standard of craft and finish across engineering, art, and UX

---

## Batch 21 — Character Expressiveness, Micro-Interactions & Environmental Flavor

### Q101. Secondary Idle Animations → 2 RANDOMIZED IDLES PER CHARACTER (>8s IDLE)

**Decision:** After 8 seconds standing still, characters cycle randomized idles: Abdulrahman checks watch / looks at cranes; Visitor stretches / looks around at street architecture.

**Rationale:**
- Prevents mannequins; adds organic warmth and lifelike presence while waiting for player input

---

### Q102. NPC Head Tracking → SMOOTH LOOK-AT CONSTRAINT (±45° YAW)

**Decision:** When visitor walks within 4 meters of Joe or ambient NPCs, their head smoothly turns to track the visitor via bone look-at constraint, returning to neutral as visitor passes.

**Rationale:**
- Subtle Nintendo/Messenger polish detail that makes inhabitants feel perceptually aware with zero frame-rate cost

---

### Q103. Environmental Wind Streaks → ANIMATED SPLINE RIBBONS

**Decision:** Stylized 2D ink wind streak ribbons periodically sweep through the street canyon every 20-30s, paired with a faint wind audio whisper.

**Rationale:**
- Manga/Ghibli aesthetic marker that reinforces the weather and physical atmosphere of the street canyon

---

### Q104. Photo Mode / Clean Capture → 1-CLICK 2X SCREENSHOT BUTTON

**Decision:** HUD camera icon captures a 2x resolution screenshot with UI hidden and a discreet "babthedev.com" ink stamp in the corner.

**Rationale:**
- Free organic social sharing on Twitter/LinkedIn with guaranteed maximum graphical fidelity

---

### Q105. Environmental Easter Eggs → SKETCH PAD & CRANE NEST

**Decision:** 2 hidden micro-discoveries off the beaten path (sketch pad on crate behind Library, paper crane nest on cafe rooftop) triggering a warm 1-line Abdulrahman dialogue.

**Rationale:**
- Rewards playful exploration and proves the world was crafted with depth and love

---

## Batch 22 — Mathematical Formulations & Coordinate Transforms on a Sphere

### Q106. Coordinate Representation → POLAR SPHERICAL $(\theta, \phi)$ TO CARTESIAN

**Decision:** Store positions in radians $(\theta, \phi)$ and convert to Cartesian coordinates via $R=25\text{m}$:
$x = R \sin(\phi) \cos(\theta), \quad y = R \cos(\phi), \quad z = R \sin(\phi) \sin(\theta)$

**Rationale:**
- Intuitive latitude/longitude authoring; guarantees every placed object automatically touches the surface

---

### Q107. Surface Alignment Math → QUATERNION SET FROM UNIT VECTORS

**Decision:** Orient any object using $Q_{\text{align}} = \text{Quaternion}.\text{setFromUnitVectors}([0, 1, 0], \hat{N})$ multiplied by local yaw rotation.

**Rationale:**
- Gimbal-lock-free; guarantees props and characters stand perfectly upright perpendicular to the planet's curvature everywhere

---

### Q108. Tangent-Plane Input Projection → VECTOR REJECTION ON SURFACE NORMAL

**Decision:** Project camera forward and right vectors onto the tangent plane:
$\vec{V} = \vec{V}_{\text{cam}} - (\vec{V}_{\text{cam}} \cdot \hat{N})\hat{N}$

**Rationale:**
- Pressing "forward" moves the player forward relative to the camera's perspective along the ground curvature across all latitudes

---

### Q109. Radial Gravity Force → $35\text{ m/s}^2$ TOWARD $(0,0,0)$

**Decision:** Apply continuous per-frame radial acceleration of $35\text{ m/s}^2$ directed toward $(0,0,0)$ via Rapier impulses.

**Rationale:**
- Eliminates floatiness, firmly plants feet descending curbs, and prevents airborne separation during rapid turns

---

### Q110. Camera Following Math → QUATERNION POSITIONING WITH `camera.up = surfaceNormal`

**Decision:** Camera up-vector lerps to the player's surface normal: `camera.up.lerp(playerNormal, delta * 5)`. Positions at player position + height along normal - back along facing tangent.

**Rationale:**
- Eliminates Euler flip and gimbal lock when traversing poles or the equator; ground remains stably framed at bottom of viewport

---

## Batch 23 — Content Expansion Matrix & 3D Physical Prop Design

### Q111. Content Directory Structure → DEDICATED FOLDERS UNDER `src/content/`

**Decision:** 1:1 mapping of content types to directories:
- `src/content/essays/*.mdx`
- `src/content/books/*.mdx`
- `src/content/videos/*.mdx`
- `src/content/projects/*.mdx`
- `src/content/bio/bio.mdx`

**Rationale:**
- Clean separation for static build scripts to validate schemas and auto-calculate physical prop slot allocations independently

---

### Q112. Physical "Book" Prop in 3D → STYLIZED HARDCOVER WITH SDF SPINE TITLE

**Decision:** Substantial hardcover book model standing upright on the library shelf with cream paper edges and title rendered along the spine via SDF text. Pulls forward slightly on proximity.

**Rationale:**
- Creates a clear tactile distinction from flat essay pamphlets; conveys gravity, weight, and deep-form writing

---

### Q113. Physical "Video Tape" Prop in 3D → RETRO CASSETTE TAPE IN WOODEN RACK

**Decision:** Retro cassette tape model with twin spool holes and hand-inked title sticker label resting in an angled desktop rack. Proximity triggers soft cassette click SFX.

**Rationale:**
- Playfully reinforces the analog, handcrafted physical paper metaphor

---

### Q114. Physical "Project Pedestal" in 3D → CHAMFERED PLINTH WITH HOVERING MINIATURE

**Decision:** Clean architectural concrete pedestal with a low-poly stylized miniature/icon hovering 20cm above it representing the project's identity.

**Rationale:**
- Elevates software projects into tangible museum artifacts, allowing instant visual recognition before opening the case study

---

### Q115. Physical "Archive Terminal" in 3D → RETRO CRT DESK WITH SEARCHABLE GRID

**Decision:** Retro computer terminal desk placed at district ends. Interacting opens a filterable, searchable catalog grid of all past works exceeding physical featured caps.

**Rationale:**
- Preserves the physical world's curation discipline while guaranteeing 100% permanent access to older archive material

---

## Batch 24 — Guided Tour Choreography & Narrative Beats

### Q116. Tour Pathing Math → SPHERICAL CATMULL-ROM SPLINES

**Decision:** Pre-compute a Catmull-Rom cubic spline through district landmarks, with every interpolated point normalized to sphere radius $R=25\text{m}$. Abdulrahman moves along this surface curve at 3 units/sec.

**Rationale:**
- Prevents straight-line subterranean burrowing; produces graceful, sweeping navigation around street corners and architectural facades

---

### Q117. Tour Pacing & Adaptive Waiting → TETHER-AWARE ADAPTIVE WAITING

**Decision:** If separation exceeds 5m, Abdulrahman pauses, turns back toward the visitor, and waits patiently in idle. Resumes forward movement once visitor closes to within 2.5m.

**Rationale:**
- Creates a genuine, considerate human companion dynamic rather than an indifferent on-rails NPC

---

### Q118. District Arrival Fanfare → 3-BEAT ARRIVAL SEQUENCE

**Decision:** On crossing district boundary: camera elevates 0.5m, district title banner slides down for 4 seconds, and a gentle 2-note acoustic chime plays.

**Rationale:**
- Cleanly establishes chapter pacing and geographical progress around the planet

---

### Q119. Mid-Tour Contextual Prompts → INVITATIONAL INTERACTION PAUSES

**Decision:** Abdulrahman pauses at key landmarks (first pedestal, Joe's cafe table), gestures, and delivers an optional prompt ("Press E to inspect, or we can keep walking").

**Rationale:**
- Balances linear storytelling with player autonomy; inviting without being coercive

---

### Q120. Returning Visitor Experience → INSTANT FREE-ROAM + NON-BLOCKING GREETING

**Decision:** Returning visitors skip intro overlay, spawn immediately in free-roam with a quick wave and toast from Abdulrahman ("Welcome back. Take your time wandering."). Tour re-triggerable via HUD.

**Rationale:**
- Zero friction for repeat readers returning for specific articles or sharing with peers

---

## Batch 25 — Asset Pipeline Tooling & Optimization Recipes

### Q121. Automated Asset Optimization → `pnpm run assets:optimize` (`@gltf-transform/cli`)

**Decision:** Automated script (`scripts/optimize-assets.mjs`) applying prune, dedup, and meshopt geometry compression across all models into production GLBs.

**Rationale:**
- Deterministic, 1-command repeatable pipeline that compresses raw models in seconds without manual 3D DCC software

---

### Q122. Pre-Baked Material Standardization → CLEAN UNTEXTURED GLBs

**Decision:** Pre-strip original Kenney materials in asset pipeline, exporting untextured meshes with clean normals ready for instant `MeshToonMaterial` assignment.

**Rationale:**
- Eliminates CPU runtime traversal overhead and `useEffect` re-renders during district streaming

---

### Q123. Collision Blueprints → TYPED `streetLayout.ts` ARRAY

**Decision:** Define building segments with coupled model names, polar sphere coordinates, yaw heading, and oriented cuboid collider dimensions.

**Rationale:**
- Strictly pairs visual placement with physical collision boundaries in one clean TypeScript data structure

---

### Q124. Decals & Signage → SINGLE 1024x1024 MONOCHROME SPRITE ATLAS

**Decision:** Pack all road arrows, posters, cafe signs, and wall notices into one 1K texture atlas (`public/atlas-street-decals.png`).

**Rationale:**
- Replaces dozens of individual HTTP network requests with 1 preloaded texture

---

### Q125. Hard Asset Payload Cap → STRICT 12MB TOTAL `/public` CI BUDGET

**Decision:** Enforce a hard CI limit of 12MB total for all `/public` assets (characters, buildings, props, audio, textures).

**Rationale:**
- Matches Messenger's ultra-lean footprint benchmark, guaranteeing sub-3-second load times on mobile cellular connections

---

## Batch 26 — Immediate Execution Sequence & First Deliverables

### Q126. Git Branching Strategy → `feature/spherical-world-transformation`

**Decision:** Create and develop on a dedicated feature branch `feature/spherical-world-transformation`. Keep `main` pristine until Definition of Done criteria are met.

**Rationale:**
- Standard professional engineering workflow; allows preview deployments without breaking production

---

### Q127. Step 1 Foundation → `src/lib/sphereMath.ts`

**Decision:** Build and unit-test the pure mathematical coordinate conversions, normal calculators, quaternion surface-aligners, and tangent-plane projection utilities.

**Rationale:**
- Establishes a rock-solid mathematical bedrock before modifying physics or render loops

---

### Q128. Step 2 Physics Core → 50m SPHERE MESH & RAPIER RADIAL GRAVITY IN `World.tsx`

**Decision:** Replace flat ground plane with a 128-segment `<sphereGeometry args={[25, 128, 128]} />` and `<BallCollider args={[25]} />`, accompanied by a $35\text{ m/s}^2$ continuous radial gravity impulse loop.

**Rationale:**
- Establishes the physical curved planet ground for characters to walk on

---

### Q129. Step 3 Locomotion & Camera → REFACTOR `VisitorController` & `CameraController`

**Decision:** Refactor visitor input onto tangent planes with normal alignment; lock camera up-vector to the player's surface normal.

**Rationale:**
- Immediately enables 360° walking and smooth third-person camera following around the sphere

---

### Q130. Execution Readiness → LOCKED-IN FOUNDATION, READY TO BUILD

**Decision:** 130 questions answered and documented. Architectural, visual, and mathematical contracts fully unified.

**Rationale:**
- Zero remaining ambiguities; comprehensive clarity across all systems

---

## Batch 27 — Street Furniture, Architectural Dressings & Lighting Nuances

### Q131. Street Lamp Illumination → EMISSIVE TOON MATERIALS + 2 STRATEGIC POINT LIGHTS

**Decision:** 98% of lamps use unlit emissive warm-white toon material on bulb meshes. Only 2 dynamic point lights in scene: 1 flickering in the 404 alley (`FlickerLight.tsx`) and 1 warm lantern over Joe's cafe table.

**Rationale:**
- Prevents GPU fragment shader churn and WebGL light-count crashes while delivering charming nighttime ambiance

---

### Q132. Architectural Street Variety → SCALE JITTER (0.85-1.2x) + FACADE CLUTTER

**Decision:** Randomize building scales ($\pm 20\%$), vary street setbacks by 0.5m, and attach awnings, drain pipes, paper lanterns, and AC units to second stories.

**Rationale:**
- Eliminates the repetitive grid look; replicates the accumulated human density of Messenger and medieval towns like Roccasecca

---

### Q133. Spherical Road Markings → CONFORMAL STRIPS AT $R+0.015\text{m}$ + `polygonOffset`

**Decision:** Curved strip meshes hovering 1.5cm above planet radius with Three.js `polygonOffset` enabled.

**Rationale:**
- Zero z-fighting or ground clipping across all GPUs; strips conform perfectly to ground curvature

---

### Q134. Sidewalk Curbs → VISUAL GROUND BANDS + NON-COLLIDING CURB STONES

**Decision:** Sidewalks are painted mid-grey ground bands bordered by thin 3D curb stone meshes with physics colliders disabled.

**Rationale:**
- Delivers 100% of the architectural curb aesthetic with 0% character snagging or physics hitching

---

### Q135. District Gateways → OVERHEAD ARCHWAYS SPANNING THE 6M STREET

**Decision:** Distinct overhead gateways at district entrances (pergola with lanterns for Bio, stone arch with SDF text for Library, security fence for Oryzon).

**Rationale:**
- Creates dramatic architectural framing (Roccasecca portal effect) when passing into new narrative chapters

---

## Batch 28 — Audio Mixing, Spatial Falloff & Soundscape Stems

### Q136. Spatial vs Stereo Routing → 2D STEREO MUSIC, 3D POSITIONAL WORLD SFX

**Decision:** Background music and UI audio play in 2D stereo. 3D positional audio assigned to world sources (404 flickering lamp hum, cafe cup clatter, low-flying paper crane wing flutter).

**Rationale:**
- Music remains an enveloping, non-distracting background cushion; positional world audio creates an authentic sense of spatial presence

---

### Q137. Dialogue Voice Chirps → WARM TYPEWRITER/MARIMBA 12Hz BLIPS

**Decision:** Soft acoustic typewriter/marimba blips at 12Hz synchronized to typewriter text character streaming.

**Rationale:**
- Injects warmth, rhythm, and personality into Abdulrahman's speech without voice acting, matching the Messenger/Celeste aesthetic

---

### Q138. Dynamic Audio Filtering → DISTRICT-AWARE WEB AUDIO LOW-PASS FILTER

**Decision:** Single audio track dynamically modulated via biquad low-pass filter (rolls off to 800Hz in the Library for cozy warmth; opens up in Projects for brightness).

**Rationale:**
- Simulates distinct acoustic room environments with zero extra asset weight or memory overhead

---

### Q139. Footstep Balance & Randomization → -14dB MIX + $\pm 4\%$ PITCH JITTER

**Decision:** Footsteps mixed at -14dB below master volume with random pitch modulation ($0.96\times-1.04\times$) on every footfall.

**Rationale:**
- Eliminates repetitive machine-gun audio fatigue while keeping locomotion grounded and tactile

---

### Q140. Autoplay Compliance & Persistence → UNLOCKED ON "BEGIN", PERSISTED IN LOCALSTORAGE

**Decision:** AudioContext initializes/resumes on "Begin Journey" click. `audioMuted` state strictly respected and persisted across reloads.

**Rationale:**
- Full compliance with browser autoplay restrictions without console errors; honors returning user preferences

---

## Batch 29 — Camera Occlusion, Viewport Framing & Transitions

### Q141. Camera Occlusion → SPRING-ARM RAYCAST + DITHER TRANSPARENCY

**Decision:** Raycast from player head to camera pulls camera forward smoothly 0.3m off blocking walls; screen-door dither transparency fades building meshes if line of sight is obstructed.

**Rationale:**
- Prevents camera clipping into building interiors while keeping the character visible at all times in narrow corridors

---

### Q142. Camera Pitch Clamping → $-15^\circ$ TO $+60^\circ$ RELATIVE TO TANGENT PLANE

**Decision:** Strict pitch bounds: $-15^\circ$ downward (keeps horizon and street centered) to $+60^\circ$ upward (allows gazing up at sky, cranes, and rooflines).

**Rationale:**
- Prevents disorienting top-down scalp angles while framing vertical street architecture dramatically

---

### Q143. Dialogue Framing → CINEMATIC TWO-SHOT GLIDE

**Decision:** Camera glides inward by 1m and orbits $20^\circ$ during dialogue to frame Abdulrahman and the visitor in a classic over-the-shoulder two-shot.

**Rationale:**
- Elevates narrative conversations into cinematic character interactions

---

### Q144. Viewport Offset During Reading → 1.5M LEFTWARD PAN ON TANGENT PLANE

**Decision:** When Reading Panel opens on desktop (covering right 40%), camera pans 1.5m left to keep Abdulrahman and the visitor framed in the visible 60% viewport.

**Rationale:**
- Prevents characters from being hidden behind the sliding panel; preserves visual continuity

---

### Q145. Micro-Camera Impulse → 0.03M SUBTLE CAMERA PUNCH (80ms)

**Decision:** A tiny 0.03m directional camera impulse upon closing panels or activating physical props.

**Rationale:**
- Injects tactile weight and game-feel juice into physical interactions

---

## Batch 30 — Memory Resilience, Tab Inactivity & Master Architectural Lock

### Q146. Long-Session GPU Memory Management → STRICT DISPOSAL LIFECYCLE ON UNMOUNT

**Decision:** Enforce automatic `geometry.dispose()`, `material.dispose()`, and `texture.dispose()` on all unmounted dynamic preview meshes and reading panels.

**Rationale:**
- Prevents memory leaks and guarantees tab memory stays flat under 180MB RAM across multi-hour reading sessions

---

### Q147. Tab Inactivity & Backgrounding → PAUSE RENDER & PHYSICS VIA PAGE VISIBILITY API

**Decision:** When `document.hidden === true`, pause the Three.js render loop, pause Rapier physics steps, and reduce audio volume by 6dB.

**Rationale:**
- Saves visitor laptop battery, CPU usage, and prevents fan spin when the tab is backgrounded

---

### Q148. Global WebGL Error Boundary → WARM-PAPER ERROR BOUNDARY WITH 2D FALLBACK

**Decision:** Wrap `<GlobalCanvas />` in a custom React Error Boundary that seamlessly catches shader compilation failures or WebGL crashes and transitions cleanly to the 2D Classic View.

**Rationale:**
- Guarantees zero blank screens or raw React stack traces on obscure or older mobile GPUs

---

### Q149. HMR & Dev Stability → SINGLETON PHYSICS GUARDS & CLEAN DETACH HOOKS

**Decision:** Enforce singleton guards on Rapier physics instantiation and clean event listener removal during Fast Refresh.

**Rationale:**
- Prevents duplicate physics worlds and memory leaks during rapid local development in `pnpm dev`

---

### Q150. Master Architectural Lock → 150 QUESTIONS FINALIZED & LOCKED

**Decision:** All 150 questions across 30 batches are officially recorded and locked in `docs/alignment_plan.md`.

**Rationale:**
- Establishes a complete, uncompromising technical and artistic blueprint covering every facet of BabWorld without ambiguity

<!-- 150 Questions Alignment Completed -->
