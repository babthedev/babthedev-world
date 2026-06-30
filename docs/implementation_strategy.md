# BabTheDev: Implementation Strategy

## Table of Contents

1. Core Identity & Philosophy
2. Architecture & Technology Stack
3. Districts & Zones
4. World Design & Topology
5. Art Direction & Visual Style
6. Rendering Pipeline & Shaders
7. Lighting & Atmosphere
8. Character System
9. World State & Behavioral Systems
10. Character Controller & Physics
11. Camera System
12. Animation System
13. Narrative & Dialogue System
14. Interaction & UI System
15. Spatial Router (World ↔ URL)
16. Content Strategy & Editorial System
17. Content System
18. Data Layer
19. Guided Tour Engine
20. Save & Persistence System
21. Environmental Storytelling & Prop Density
22. Audio & Sound Design
23. Textures & Materials
24. Asset Pipeline
25. Performance & Optimization
26. Responsive Design & Mobile
27. Accessibility
28. SEO & Social Sharing
29. Analytics & Visitor Tracking
30. Configuration & Feature Flag System
31. Deployment & Infrastructure
32. Loading & Onboarding
33. Future Expansion

---

## 1. Core Identity & Philosophy

**The Two-Character Dynamic**
- **Relationship**: The Curator (Abdulrahman) & The Honored Guest (You). The dynamic is polite, structured, and hospitable.
- **Visual Representation**: Both characters are fully detailed, abstract (faceless/implied geometry to avoid the uncanny valley). Each character has a floating name cursor above their head: "Abdulrahman" and "You".
- **The Entry Sequence**: On load, only Abdulrahman is visible on screen. After a welcome message, the visitor clicks "Start". The "You" character walks onto the screen. Both characters then turn their backs to the camera and walk forward together.
- **Movement Tethering**: The two characters *always* move together. In Free Roam, Abdulrahman follows the visitor closely. In Guided Tour, the visitor follows Abdulrahman. They never separate.
- **Interaction**: The Visitor can interact with Abdulrahman (e.g., clicking him for a charm animation or short fact), but physical pathing is seamless—if the visitor blocks the path, Abdulrahman gracefully pathfinds around.

**Tone, Atmosphere, and First Impressions**
- **Emotional Core**: Quiet Focus / Serenity. A peaceful, highly organized space that lowers the heart rate.
- **Color Palette**: Strictly monochrome. Background: `#0B0B0B`, Surface: `#141414`, Text: `#F5F5F5`, Muted: `#A3A3A3`. No other colors.
- **Environment**: Golden Hour/Static lighting (to maximize the stylized shadows), complemented by subtle environmental elements like stylized wind lines and low-poly birds.
- **Humor & Life**: Dry, subtle humor via environmental storytelling. The world features a few specific human NPCs (e.g., "Here's my friend Joe, he only drinks coffee at night") to add charm without feeling crowded.

**The "Museum" Principle**
- **Read-Only Physics**: The world is a museum. Props do not react physically to the user (no kicking objects around). 
- **Content Focus**: When the Visitor opens a 2D content panel, Abdulrahman enters an "Idle Waiting" animation next to the panel, remaining present but unobtrusive.
- **Boundaries**: Soft boundaries. Visitors have freedom to explore the grass and paths, but invisible collision walls prevent breaking the camera framing or jumping on roofs. There are absolutely no "game over" or fail states.

**The Core Definition & Future**
- **Pitch**: "An interactive, spatial portfolio where I personally guide you through my career, projects, and ideas."
- **Scope**: 80% Professional, 20% Personal. BabTheDev serves as the permanent OS umbrella for Abdulrahman's brand. Future ventures (like Oryzon) will be added as dedicated districts.
- **Success Metric**: Content Consumption Time. The 3D world is the hook; the primary goal is reading essays and case studies.
- **Hard Boundary**: BabTheDev will *never* be a game. Traditional game mechanics (combat, inventory, scores) are strictly forbidden.

---

## 2. Architecture & Technology Stack

**The Monorepo & Directory Structure**
- **Structure**: Basic NPM workspaces. The Next.js app will live at the root `app/` folder for maximum simplicity.
- **Package Manager**: `pnpm` for strict dependency graphs and speed.

**React Three Fiber & Rendering**
- **Engine**: Three.js (locked to a stable version) and React Three Fiber.
- **Helpers**: Heavy reliance on `@react-three/drei`.
- **Styling/Shaders**: `react-postprocessing` for outlines, combined with a custom global Shader Material that mathematically snaps lighting to the strict 4-color palette, ensuring zero muddy gradients.

**Physics Engine**
- **Library**: `@react-three/rapier` (WASM-accelerated).
- **Execution**: Runs on a fixed time step to ensure identical speeds across different monitor refresh rates. 
- **Debug**: Collider wireframes toggleable only in development (F3).

**State Management**
- **Library**: Zustand, using slices (`useTourSlice`, `usePlayerSlice`, `useUISlice`) within a single bound store (`useWorldStore`).
- **Persistence**: Only non-spatial preferences (audio volume, `firstTimeVisitor`) are saved to LocalStorage. Player coordinates are not saved to prevent spawning inside new geometry.

**Data Layer (Local MDX)**
- **MDX**: All text content (Projects, Bio) is stored as local `.mdx` files in `src/content/`. This ensures zero network latency, full Git version control, and allows rendering React WebGL components directly inside essays.
- **MDX**: Used for highly custom technical essays that require interactive React components.
- **Fetching**: Next.js App Router `fetch` with webhook revalidation. All text is fetched at build time.

**Deployment & Infrastructure**
- **Hosting**: Vercel.
- **Asset Storage**: `.glb` models stored in the `/public` directory initially.
- **CI/CD & Environment**: GitHub Actions gating merges with ESLint/Prettier/TypeScript checks. Environment variables validated at runtime using `zod`.

**Performance & Code Quality**
- **TypeScript**: `strict: true`. No `any` types.
- **RSC Boundary**: Everything inside `<Canvas>` is a Client Component. Layouts and data-fetching are Server Components.
- **Loading State**: Global Suspense wrapper with a stylized B&W percentage bar.
- **Optimization**: Draco compression for all 3D models (reduces size by ~70%).

**Camera, Inputs & Analytics**
- **Input**: `KeyboardControls` from R3F. 
- **Mouse Parallax**: Mouse movement triggers slight camera parallax/flicking along the Z-axis to give the flat-looking world subtle physical depth.
- **Tracking/Errors**: Vercel Web Analytics and Sentry.

---

## 3. Districts & Zones

**The Layout & Hub**
- **Spawn Sequence**: On load, only Abdulrahman is in frame. After the wait time or clicking "Start", the "You" visitor joins. 
- **Topology**: Radial layout. All districts branch out from a central hub/plaza, allowing the visitor to choose which direction to explore first.
- **The Spawn Point Boundary**: If the visitor tries to walk all the way back into the starting spawn point, the camera remains fixed while the characters walk toward the lens, growing larger until they fill the screen—a cinematic framing device rather than a physical wall.

**District 1: Welcome / Bio / Resume**
- **Metaphor**: A stylized, outdoor coffee shop terrace. Intimate and conversational.
- **Props**: Cafe tables, a bicycle, a laptop, and specific human NPCs like "Joe" (who only drinks coffee at night).
- **Interaction**: Opening the Resume/Bio is triggered by Abdulrahman pointing to a menu board or glowing clipboard on a cafe table.
- **Audio**: Muffled murmur of a quiet cafe and clinking coffee cups.

**District 2: Projects / Portfolio**
- **Metaphor**: An outdoor exhibition space / sculpture garden.
- **Props & Display**: Clean pedestals and giant monochrome billboards. Only the top 3-4 featured projects have physical space; the rest are grouped into a localized "Archive" terminal to maintain environmental elegance.
- **Audio**: A very low, subtle hum of servers or electricity.

**District 3: Essays / Writing**
- **Metaphor**: A quiet, dense library courtyard with tall bookshelves standing outside in the wind and scattered papers on the ground.
- **Interaction**: Essays are divided by category (Tech, Life, Philosophy) across different reading tables. Clicking a stack of papers opens the Blog Directory.
- **Audio**: The sound of pages turning occasionally in the wind.

**Future District: Oryzon**
- **Presence**: Exists on the map as an "Under Construction" zone to build anticipation.
- **Visuals**: Chain-link fences, scaffolding, and a "Coming Soon" billboard. It cannot be entered yet.

**Boundaries, Scale, and Wayfinding**
- **Barriers**: Dense rows of stylized trees and buildings act as natural boundaries instead of invisible walls. Beyond the boundaries lies pure `#0B0B0B` void.
- **Navigation**: Minimalist street signs at intersections guide the user since there is no color coding. A sleek title card flashes in the corner when entering a new district.
- **Scale**: The Projects district is the largest and most impressive. The Bio district is the most intimate. Verticality (large sets of stairs) is used to create dramatic camera angles.

**Environmental Density & Props**
- **Clutter Strategy**: High density in small pockets (corners with vending machines, mailboxes, power lines) while keeping main walking paths clear.
- **Road Markings**: Strict white lines (`#F5F5F5`) painted on the surface (`#141414`) to guide movement naturally.

---

## 4. Art Direction & Visual Style

**The Sketch & Paper Illusion**
- **Outlines (Sobel Edge)**: 2px to 3px variable thickness black outlines (`#0B0B0B`) that look hand-drawn.
- **Squigglevision**: A very slow, subtle jitter applied to the outlines every 4-5 frames to make the world feel like a living sketch.
- **Paper Texture**: A static noise/grain overlay on the camera lens makes the dark background feel like textured paper rather than empty digital space.
- **Dithering**: Transitions between light and shadow use a cross-hatch or dot-dither pattern, avoiding any smooth gradients.

**Shape Language & Geometry**
- **Architecture**: Slightly wonky/crooked buildings and props (tapered tops, slanted poles) to avoid the rigid look of generic 3D. Edges are slightly beveled so the outline shader catches them cleanly.
- **Organic Shapes**: Abstract geometric clusters. Trees are overlapping low-poly spheres (like cotton candy) rather than realistic branches.

**Contrast & Readability**
- **Color Assignments**: Buildings and ground are mostly Surface (`#141414`). Outlines and shadows are Void (`#0B0B0B`). Highlights are White (`#F5F5F5`).
- **Character Separation**: Abdulrahman and the Visitor are primarily Muted (`#A3A3A3`) and White (`#F5F5F5`), drawing the eye instantly against the dark terrain.
- **Edge Highlighting**: White rim lighting points toward the camera from the void to paint a stark `#F5F5F5` line across terrain edges, preventing them from bleeding into the background.

**Typography & UI Integration**
- **3D Typography**: Handwritten or marker-style fonts printed physically onto objects (perspective-warped), colored strictly `#F5F5F5` or `#0B0B0B`.
- **UI Overlay**: Brutalist/Minimalist. Heavy 2px solid `#F5F5F5` borders, sharp corners, solid `#0B0B0B` backgrounds. No drop shadows or glassmorphism. Slides in from the right edge.
- **Images/Thumbnails**: 100% CSS Grayscale filter by default. Hovering over an image in the UI transitions it to full color (the only color in the entire experience).

**VFX & Camera Framing**
- **Scale**: A miniature diorama feel, achieved via an orthographic-leaning camera (low FOV).
- **VFX**: Wind is represented by fast, unshaded horizontal streaks of `#A3A3A3`. Footsteps leave 2D-sprite puff clouds (shrinking circles).
- **Interaction FX**: Hovering an interactive object inverts its outline to thick white (`#F5F5F5`).
- **Shadows**: Hard, jagged drop shadows or simple circular blob shadows beneath characters. No soft blur.
- **Camera Collisions**: Objects blocking the camera do not cause a zoom/snap; instead, the blocking geometry becomes semi-transparent with a cross-hatch dither pattern.

---

## 5. Rendering Pipeline & Shaders

**Canvas & Renderer Core**
- **Pixel Ratio**: Capped at `Math.min(window.devicePixelRatio, 2)` to protect GPU performance on high-density displays.
- **Renderer Settings**: MSAA (Antialiasing) is disabled to preserve the raw sketch look. Tone mapping is strictly set to `NoToneMapping` to preserve exact hex codes. Color space is `SRGBColorSpace`.
- **Background**: The WebGL scene clear color is strictly `#0B0B0B` to ensure depth calculations against the void remain accurate.

**The Custom Toon Shader**
- **Implementation**: A fully custom GLSL ShaderMaterial replacing standard materials.
- **Lighting Logic**: A strict step function based on the dot product of the surface normal and a directional light vector. No smooth gradients allowed.
- **Dithering**: A static, screen-space cross-hatch texture is multiplied over the shadow boundary edge to simulate ink hatching.

**The Outline Pass (Sobel/Depth Edge Detection)**
- **Mechanics**: A global post-processing pass using both Depth (for outer silhouettes) and Normals (for sharp internal creases) to draw `#0B0B0B` outlines.
- **Sensitivity**: Extremely sensitive normal threshold (0.5 radians) and depth threshold to catch small architectural details.
- **Scaling**: Outlines scale with depth, becoming thinner on distant objects to prevent the background from turning into a black blob.

**Post-Processing Effects (VFX)**
- **Squigglevision**: The UV coordinates of the screen buffer are shifted by 1-2 pixels at a frequency of 12fps. This gives the 3D world a hand-drawn, boiling line effect without affecting the 2D HTML UI.
- **Paper Overlay**: A high-resolution static noise texture is blended over the entire screen (Multiply blend mode, ~10% opacity) to make the digital screen resemble textured paper.
- **Optimization**: If `navigator.hardwareConcurrency` is low (mobile devices), Squigglevision and Paper Noise are disabled to maintain 60fps.

---

## 7. Character System

**Character 1: Abdulrahman (The Curator)**
- **Silhouette**: Wears a simple denim jacket, creating a structured but approachable silhouette. 
- **Face**: Fully modeled with a distinct face.
- **Accessories**: Holds a subtle clipboard or notebook in one hand to visually enforce the "Curator" role.
- **Color Mapping**: Mostly `#A3A3A3` (Muted), with `#F5F5F5` (White) accents to draw the eye to the face and hands.

**Character 2: The Visitor (You)**
- **Silhouette**: A simpler, softer shape (e.g., a chunky sweater). Slightly shorter than Abdulrahman (~90% height) to establish the guide dynamic.
- **Face**: Fully modeled with a face. No player customization allowed to preserve strict art direction.
- **Color Mapping**: Mostly `#F5F5F5` (White) so the player's eye naturally tracks their own character instantly.

**The Rig & Skeleton**
- **Structure**: A standard Mixamo-compatible rig (~65 bones) to support high-quality realistic mocap animations.
- **Inverse Kinematics (IK)**: IK used for feet (to step accurately on stairs) and heads (Abdulrahman's head mathematically tracks the Visitor when close).

**Name Cursors & UI**
- **Positioning**: Floats ~0.5 meters above the head bone, bobbing with the walk cycle. Uses the `<Billboard>` component to perfectly face the camera.
- **Legibility**: Text maintains a fixed pixel size regardless of distance. It is obscured by 3D geometry if walking behind a wall.
- **Animation**: The cursor block `_` blinks exactly every 1000ms.

**Material & Interactivity**
- **Shading**: No self-shadowing (to avoid a dirty toon look). Internal lines are handled natively by geometry, not painted textures. Outlines wrap the outer silhouette, avoiding messy internal lines on fingers.
- **Physics**: Real-time cloth physics are avoided for performance; the denim jacket is manually weighted to bones. A Rapier capsule collider handles world physics.
- **Hover State**: Clicking or hovering Abdulrahman inverts his outline to thick white `#F5F5F5`.
- **Camera Clipping**: If the camera distance drops below 0.5 meters, the character mesh fades to 0 opacity to prevent clipping inside the head.

---

## 8. World State & Behavioral Systems

**State Machine Modes & Triggers**
- **Default Mode**: Begins with a "Welcome Sequence" cinematic that instantly and seamlessly transitions into the *Guided Tour* state.
- **Triggering Free Roam**: Engaging WASD, arrow keys, or the mobile joystick instantly breaks the tour and triggers Free Roam. Abdulrahman stops walking, turns to face the Visitor, and yields control.
- **Resuming Guided Tour**: Governed by the "2-Second Rule". If the Visitor provides zero input for exactly 2 seconds, Abdulrahman automatically resumes leading the tour.
- **Pause State**: The `useFrame` loop entirely pauses when the browser tab loses focus to save system battery, resuming instantly upon returning.

**Reading State**
- **Trigger**: Opening any 2D HTML panel by clicking an interactive prop.
- **Constraints**: Movement inputs are strictly ignored to prevent accidentally walking away while reading.
- **Abdulrahman's Behavior**: He enters an "Idle Waiting" animation next to the reading panel and turns his head to look at it. The Guided Tour wait timer is paused until the panel is closed.

**Pathfinding & The Tether**
- **Guided Tour Navigation**: Abdulrahman follows a strict array of mathematical `Vector3` waypoints mapping out the museum.
- **Free Roam Navigation**: He calculates dynamic paths on a pre-baked NavMesh to follow exactly 2 meters behind the Visitor.
- **Catch-Up Teleportation**: If the Visitor exceeds a 15-meter distance from Abdulrahman in Free Roam, he teleports to a nearby node, masked by a stylized `#F5F5F5` smoke puff.

**Interaction & Zone Transitions**
- **Non-blocking Dialogue**: If Abdulrahman is talking, opening a new prop instantly replaces his old dialogue bubble to prioritize user agency.
- **Zone Checkpoints**: Crossing invisible AABB trigger boxes updates the `currentDistrict` Zustand state, triggering URL changes.
- **Zone Acknowledgement**: Abdulrahman verbally acknowledges entering new zones in *both* Guided Tour and Free Roam modes.

**Failsafes & Data**
- **Stuck Failsafe**: If Abdulrahman attempts to move but hasn't changed coordinates in 3 seconds (e.g., NavMesh snag), he silently teleports to the nearest valid node.
- **State Limits**: Zustand strictly handles high-level modes (Tour/Roam). It does not track raw camera coordinates or animation loops to preserve pure React performance.
- **Debug Mode**: Appending `?debug=true` to the URL renders the NavMesh, collision boxes, and waypoint lines visually.

---

## 9. Character Controller & Physics

**Physics Engine Setup**
- **Library**: `@react-three/rapier` (WASM-accelerated for max performance).
- **Time Step**: Fixed time step to ensure physics calculations remain identical regardless of monitor refresh rate.
- **Body Type**: `KinematicPositionBased` rigid bodies. Characters collide with walls but are driven strictly by code, preventing them from being violently pushed by physics forces.

**Speed & Pacing**
- **Base Speed**: A leisurely 3.5m/s for both characters to preserve the museum atmosphere.
- **Speed Matching**: Abdulrahman never speeds up to catch the Visitor in Free Roam. Both characters always move at the exact same speed (3.5m/s).
- **Sprinting**: Disabled. There is no sprint button.

**Movement Math & Controls**
- **Translation**: Direct coordinate translation is used instead of physics impulses to ensure the characters stop instantly without feeling icy.
- **Rotation**: Characters smoothly rotate to face their movement direction using spherical linear interpolation (`slerp`) over 0.15s.
- **Mobile Joystick**: A full-screen invisible joystick calculates the 2D delta vector from the initial touch point to the drag point. Speed is binary; dragging further does not increase speed.
- **Camera-Relative Control**: WASD maps directly to the camera's angle (W always moves the character away from the lens).
- **Diagonal Normalization**: Vectors are normalized to 1.0 to prevent moving diagonally faster than moving straight.

**Collision Logic**
- **Character Repel**: Characters do not have hard physics collisions with each other; they use custom soft-repel pathfinding logic.
- **Colliders**: Characters use `Capsule` colliders for smooth wall sliding. Large props (benches) use primitive `Cuboid` boxes. Small props (papers, cups) have no colliders at all to save performance.
- **Stairs**: Invisible smooth physics ramps are placed over 3D stair meshes to allow characters to glide up smoothly instead of violently bouncing.

**Animation & Debugging**
- **Animation Sync**: Walk animation playback speed is dynamically multiplied by the character's velocity vector, automatically crossfading to an `Idle` loop over 0.2s when stopping.
- **Wall Collision Sync**: If a user holds 'W' while stuck in a corner, velocity hits 0, and the animation correctly drops to `Idle`.
- **NavMesh**: Baked in Blender via Recast with a 0.5m padding to prevent shoulder clipping. Used exclusively for Abdulrahman and mobile tap-routing.
- **Debug Tools**: Pressing F3 toggles the Rapier `<Debug />` component to show red wireframe colliders and green NavMesh planes in development.

---

## 10. Camera System

**The Camera Rig & Perspective**
- **Type**: `PerspectiveCamera` with a very low FOV (20-30 degrees) to simulate an isometric/orthographic feel while maintaining accurate depth fog.
- **Angle**: Locked at a 45-degree downward angle. Manual user rotation is strictly disabled to enforce composition.
- **Zoom**: Mouse scroll is reserved for 2D UI panels; the 3D camera does not zoom via scrolling.

**Following the Target**
- **Targeting**: The camera mathematically tracks the midpoint between Abdulrahman and the Visitor.
- **Motion**: Uses a `damp` function (lerp) for smooth gliding, paired with a velocity look-ahead offset so characters don't hit the screen edge.

**Parallax & Mouse Interaction**
- **Z-Axis Parallax**: Translates the camera base position by 1-2 meters based on normalized mouse coordinates (-1 to 1) or mobile gyroscope data.
- **Constraint**: Parallax strictly translates the camera; it does not rotate it, preventing motion sickness.

**Reading Mode & Framing**
- **Focus Pan**: When a 2D reading panel opens on the right, the camera smoothly pans left to keep characters centered in the remaining visible space.
- **Focus Zoom**: The FOV lowers by 5 degrees during reading mode (transitioned over 600ms ease-in-out).
- **Spawn Cinematic**: Walking backward into the spawn hub causes the camera to lock, letting characters walk toward the lens until they fill the screen.
- **Camera Obstructions**: Tall blocking geometry becomes semi-transparent with a cross-hatch dither rather than forcing the camera to violently snap forward.

**Transitions, Cuts, and Render Logic**
- **Cuts**: Fast-traveling or clicking browser 'Back' triggers a 200ms fade-to-black cut rather than panning across the map.
- **Mobile Adaptations**: The FOV explicitly increases on mobile (portrait) to fit both characters vertically. No horizontal panning occurs for mobile UI since it takes 100% width.
- **Post-Processing**: Uses `DepthTexture` with tight near (0.1) and far (100) clipping planes to ensure perfect outline rendering without Z-fighting.
- **State Math**: Camera lerping logic exists entirely inside a localized `useFrame` hook utilizing delta time, completely independent of the global Zustand store to preserve 60fps performance.
- **Accessibility**: OS-level `prefers-reduced-motion` instantly disables mouse parallax.

---

## 11. Animation System

**Animation Logic & Hooks**
- **Engine**: Handled via `useAnimations` from `@react-three/drei`, wrapping Three.js `AnimationMixer` efficiently.
- **Blending**: Animations never snap instantly. They `.crossFadeTo()` over 0.2 seconds to smoothly blend skeletal bones.
- **Masks**: Full-body animations are used exclusively. Splitting upper/lower body masks is avoided to prevent complex web blending issues.

**The Base Animations**
- **Idles**: Abdulrahman uses a sophisticated stance (checking notebook, shifting weight). The Visitor uses a strictly neutral, slow breathing cycle.
- **Walk**: A purposeful, steady stride. Root motion is disabled; the animation plays in-place while the physics capsule moves the character mathematically.
- **Waiting**: Abdulrahman stands patiently with hands behind his back while the Visitor is reading.

**Contextual & Tour Animations**
- **Pointing**: A non-looping `Point` animation is triggered at major checkpoints, auto-crossfading back to `Idle`.
- **Yielding**: If the Visitor breaks the tour, Abdulrahman plays a `Yield` animation, turning his body and lowering his arms.

**Inverse Kinematics (IK)**
- **Head Tracking**: Abdulrahman's `Neck` and `Head` bones mathematically `.lookAt()` the Visitor's world coordinates, clamped to 60° (yaw) and 30° (pitch) to prevent impossible rotations. Tracked smoothly via `slerp`.
- **Feet IK**: Raycasts ensure feet adjust to uneven ground (stairs) dynamically.

**Performance & Loading**
- **Baking**: Animations are baked directly into the character `.glb` files. Keyframes are heavily decimated in Blender to keep file sizes under 2MB.
- **Culling**: R3F Frustum Culling automatically halts animation calculations when characters are off-screen.

**Feedback & Speed Syncing**
- **Sync**: Walk animation `timeScale` is dynamically multiplied by the character's velocity vector (`velocity.length() / baseSpeed`).
- **Wall Sync**: If a character is blocked by a wall but 'W' is held, velocity drops to 0, forcing the animation back to `Idle`.
- **Interactions**: Clicking Abdulrahman triggers a quick `Acknowledge` animation (a nod). Visitors do not play reach/touch animations for UI panels to keep interactions snappy. Faceless characters do not blink.

---

## 12. Narrative & Dialogue System

**Dialogue Delivery & Rendering**
- **Format**: Text-only 2D HTML speech bubbles anchored mathematically to Abdulrahman's 3D position. No voiceover audio.
- **Visual Style**: Brutalist UI. `#0B0B0B` background, `#F5F5F5` text, sharp corners, and a 2px solid white border. Features a classic CSS triangle "tail".
- **Rendering**: Uses Drei's `<Html>` component for crisp, pixel-perfect font rendering rather than blurry WebGL planes. Bubble hides behind geometry via `occlude={true}`.

**Pacing & Context**
- **Duration**: Dynamically calculated by word count (`words * 200ms + 1000ms`).
- **Flow**: Sentences are split into short, punchy bubbles that auto-advance and instantly replace each other. Max 10-15 words per bubble. No typewriter effect.
- **History Tracking**: Zustand stores `visited_zones` to prevent repeating grand introductions, instead using short fallback greetings.

**Interruptions & Edge Cases**
- **Breaking the Flow**: Forcing Free Roam immediately fades out the current dialogue bubble to respect user interruption. Opening a UI panel halts dialogue entirely.
- **Flavor Dialogue**: Clicking Abdulrahman in Free Roam triggers a random short "flavor" fact from a pool of ~15 strings.
- **The Visitor**: The Visitor is a silent protagonist and never spawns dialogue bubbles.

**Content & Storage**
- **Storage**: Text is stored in a local static JSON/TypeScript file, independent of the MDX content, due to tight coupling with 3D scene timing.
- **Tone**: Polite, structured, dry humor. He acknowledges he is inside a portfolio (breaking the fourth wall).

---

## 13. Interaction & UI System

**Interaction Triggers (3D)**
- **Visual Affordance**: Hovering an interactive prop inverts its post-processing outline from `#0B0B0B` to thick `#F5F5F5`. No floating icons are used.
- **Range & Action**: Clicking a prop outside the 3-meter interaction radius causes the Visitor to walk to it first. Alternatively, pressing 'E'/'Enter' while inside the radius triggers it. The cursor uses `cursor: pointer` on hover.

**The 2D UI Overlay (The Reading Panel)**
- **Layout & Animation**: The panel occupies exactly 40% of the screen width on the right (desktop), sliding in smoothly over 300ms using CSS transforms.
- **Aesthetic**: Solid `#0B0B0B` background (no glassmorphism), with a strict 2px `#F5F5F5` border on the left edge. Fixed width; cannot be dragged or resized.

**UI Navigation & Scrolling**
- **UX Rules**: Native vertical browser scrolling (`overflow-y: auto`) with a custom brutalist 4px wide `#F5F5F5` scrollbar thumb.
- **Dismissal**: Closed instantly (frictionless) via an `[ X ]` button, the `Escape` key, or clicking the visible 3D canvas on the left. Scroll positions are saved in Zustand upon closing.

**Content Formatting (MDX)**
- **Typography**: Modern, highly legible sans-serif ('Inter' or 'Geist'). Paragraphs are `#F5F5F5`.
- **Hyperlinks**: `#F5F5F5` text with a 2px underline. Hovering inverts the link to black text on a white block.
- **Code Blocks**: `#141414` background box with a 1px white border. Strictly monochrome; no syntax highlighting colors.

**Images & Media inside UI**
- **Color Reveal**: Images default to a 100% CSS `grayscale()` filter. Hovering an image smoothly transitions it to full color—the *only* use of color in the entire project.
- **Lightbox**: Clicking an image expands it to fill the screen for detailed viewing.

**Global UI Elements & Mobile**
- **HUD Constraints**: No persistent HUD, minimap, inventory, or gamified UI elements.
- **Mobile Adaptations**: The reading panel takes up 100% width on mobile, obscuring the 3D world entirely. Swipe-to-dismiss is enabled.
- **Audio Controls**: A permanently pinned global mute icon (`volume-x`) sits in the top right (moved to bottom edge on mobile).

**Routing & State integration**
- **State tracking**: Zustand tracks `activePanelId`. Opening a panel triggers shallow URL routing to `/projects/[slug]` for deep linking.
- **Dead Ends**: Navigating directly to an invalid UI route loads a "Dead End" 3D alleyway and a 404 UI panel.
- **Audio FX**: Crisp mechanical clicks/paper shuffles trigger when opening and closing the panel.

---

## 14. Spatial Router (World ↔ URL)

**Deep Linking & Initial Load**
- **Direct Navigation**: Deep linking to a specific slug (e.g., `/projects/oryzon`) instantly spawns characters at that target location with the UI panel open, bypassing the Hub cinematic sequence entirely.
- **Coordinates**: 3D coordinates for routes are hardcoded in a local TypeScript dictionary (not MDX frontmatter) to prevent catastrophic coordinate mismatches and clipping bugs.

**Shallow Routing (Walking)**
- **Trigger**: Invisible AABB trigger boxes on the ground detect the Visitor's capsule. Crossing the threshold uses `next/navigation` to push a shallow route (e.g., `/essays`) without reloading the page or React tree.
- **History Tracking**: Standard browser "Forward/Back" buttons work perfectly for spatial walking.

**Teleportation (Browser History)**
- **UX Rules**: Clicking "Back" after walking across the map does not reverse the walking animation. It instantly teleports the characters with a 200ms fade-to-black cut to respect web navigation speed.

**404 & Dead Ends**
- **Routing**: Handled via Next.js `/[...not-found]` catch-all.
- **Visuals**: A physically isolated 3D "Dead End" alleyway district. Abdulrahman delivers unique dialogue ("This isn't on the map"), and a 2D UI button teleports the user back to `/`.

**Preloading & Streaming**
- **Prefetching**: Walking toward a district manually triggers Next.js `<Link prefetch>` for the text data.
- **Geometry**: Heavy `.glb` assets (like the Projects district) are dynamically imported (`next/dynamic`) when the route is requested, saving initial bandwidth.

**URL Structure & State**
- **Paths**: `/` (Hub), `/bio`, `/projects`, `/essays`, `/projects/[slug]`.
- **Query Params**: Avoided for 3D state. Only used for 2D UI filtering inside the Archive terminal, or for developer feature flags (`?debug=true`).
- **Data Fetching**: The Next.js App Router parses MDX content locally and passes it as initial props to the Client Component Canvas, ensuring zero-delay text rendering.

---

## 15. Content Strategy & Editorial System

**The Hall of Fame Strategy**
- **Physical Representation**: Only the top 3-4 projects and top 3 essays get dedicated physical 3D pedestals to prevent world clutter. Controlled via a boolean `isFeatured: true` in the MDX frontmatter.
- **Archive Terminals**: Non-featured content lives exclusively inside 2D UI "Archive Terminals" (one in Projects, one in Essays). These feature infinite scroll and fuzzy text search.

**Structuring the Local MDX Pipeline**
- **Format**: All content (Projects, Essays, Biography) is written in `.mdx` format and stored locally in the `src/content/` directory.
- **Mapping**: The filename (e.g., `src/content/projects/my-app.mdx`) acts as the exact `slug` that maps to the hardcoded `slug` keys in the Next.js 3D coordinate dictionary.
- **Interactive JSX**: Because MDX natively supports React, interactive WebGL components (e.g., `<InlineWebGLDemo />`) can be placed directly inside the markdown paragraphs.

**Images & Media Content**
- **Images**: Placed in the `public/images/` directory and referenced via standard markdown `![alt text](/images/my-image.webp)`. They automatically receive a 100% CSS `grayscale()` filter, transitioning to color on hover.
- **Videos**: Embedded via YouTube/Vimeo `<iframe />` tags directly in the MDX to save Vercel bandwidth.

**Content Linking (Internal)**
- **Teleportation**: Clicking an internal link triggers a 200ms fade-to-black cut, instantly teleporting the 3D characters to the destination district. Abdulrahman acknowledges the jump in dialogue.

**Data Fetching & Visual Pacing**
- **Zero Latency**: Because the content is stored locally, it is parsed at build-time using `next-mdx-remote` or Next.js native MDX. There is zero database latency.
- **Data Flow**: Text content is fetched exclusively in the Next.js App Router layout and passed down, avoiding React Suspense waterfalls inside the R3F Canvas.

---

## 16. MDX Architecture & Frontmatter

**Project Schema (Frontmatter)**
- **Required Fields**: `title`, `excerpt`, `date`, `coverImage`, and `tags`.
- **External Links**: `url` for live sites, `githubUrl` for repositories.
- **Tags**: Tech stack stored as a simple array of strings (`['React', 'Three.js']`).

**Essay Schema (Frontmatter)**
- **Required Fields**: `title`, `date`, `excerpt`.
- **Metrics**: Read time is calculated automatically by a local utility script at build time.
- **Feature Flag**: `isFeatured: true` dictates if the essay gets a physical 3D table or lives in the Archive Terminal.

**Biography & Timeline**
- **Structure**: A single `bio.mdx` file. The timeline/experience array is defined as structured YAML data within the frontmatter of that file.

**SEO & Metadata**
- **Reusable Object**: Every `.mdx` file automatically maps its `title`, `excerpt`, and `coverImage` to Next.js `generateMetadata()` for dynamic OpenGraph tags.

**Validation & Rendering**
- **Validation**: Zod is used to validate the frontmatter of all `.mdx` files during the Next.js build step. If a required field is missing, the build fails locally, preventing production errors.
- **Custom Components**: MDX `components` map is used to strictly enforce styling (e.g., mapping all `<h1>` tags to a custom `<BrutalistHeader>` component).

---

## 17. Performance & Asset Loading

**Model Compression & Formats**
- **Format**: `.glb` (Binary glTF) to bundle meshes, textures, and animations.
- **Compression**: DRACO compression via `@react-three/drei`'s `useGLTF` reduces file sizes drastically (e.g., 20MB to 2MB).
- **Textures**: Use KTX2 / Basis compression to keep textures compressed in GPU VRAM, preventing memory crashes on mobile.

**Loading Screen UX**
- **Visuals**: A stark `#0B0B0B` screen with a minimalist `#F5F5F5` typography percentage counter in the center. No progress bars.
- **Tracking**: Powered by Drei's `useProgress` hooking into `DefaultLoadingManager`.
- **Transition**: Holds for 500ms at 100%, then fades out over 1s to seamlessly reveal the Hub cinematic.

**Draw Calls & Mesh Instancing**
- **Target**: Strictly under 100 draw calls per frame for 60fps on low-end devices.
- **Instancing**: Repetitive static meshes (e.g., streetlamps) use `InstancedMesh` to render in a single draw call.
- **Background**: Static background geometry is merged into a single `.glb` mesh before export. Interactive props remain isolated sub-meshes for `onClick` events.

**React & State Optimization**
- **`useFrame` Loops**: Never update global Zustand state within 60fps loops. Mutate Three.js properties directly via `useRef` to prevent React re-renders.
- **Suspense**: Major 3D districts are wrapped in `<Suspense>` boundaries to load asynchronously.

**Texture & Physics Optimization**
- **Textures**: Max resolution is 2048x2048, but tiled noise textures are kept to 512x512. Mipmaps and Anisotropic Filtering (`anisotropy={16}`) keep textures crisp at 45-degree angles.
- **Physics**: Rapier runs efficiently in WASM. The NavMesh is pre-baked, and pathfinding only calculates mathematical vectors at runtime. Characters simulate physics even when off-screen.

**Post-Processing & Garbage Collection**
- **Scaling**: `pixelRatio` is clamped to `Math.min(window.devicePixelRatio, 2)`. If `navigator.hardwareConcurrency` detects a low-end device, heavy shaders (Squigglevision) are disabled.
- **Cleanup**: Unmounting a district removes its geometry from the scene. Drei's `useGLTF` smartly manages caching and memory disposal.

**Network & Framerate**
- **Network & Framerate**
- **Preloading**: Characters (`/abdulrahman.glb`) and the Hub are preloaded in the root layout. Other districts load lazily.
- **Framerate**: Targets a locked 60fps, but delta-time multiplication ensures smooth scaling on 144Hz monitors. Background tabs natively throttle `requestAnimationFrame`.

---

## 18. Sound & Audio Design

**Audio Philosophy & Tone**
- **Theme**: "The Quiet Museum." Extremely minimal, sparse, and entirely diegetic or mechanical.
- **BGM/VO**: Strictly no background music (to avoid distracting from reading) and no voice acting (to allow flexible pacing).
- **Ambience**: A subtle, low-volume "empty gallery" room tone (faint air conditioning/silence) grounds the physical space.

**Spatial Audio (3D Web Audio)**
- **Engine**: Native Three.js `PositionalAudio` is used (requires MONO files for accurate 3D panning).
- **Footsteps**: Muffled "shoe on concrete" sounds, synced mathematically to both Abdulrahman's and the Visitor's walk animation cycles.
- **VFX Audio**: A quick, stylized "whoosh" accompanies the Catch-Up smoke teleport.

**UI & Interaction Audio**
- **Hover States**: No audio on hover to prevent annoyance.
- **Click Actions**: Opening the 2D panel triggers a crisp, mechanical "click" or paper slide. Closing it triggers a lower-pitched "clack".
- **Dialogue**: A single, soft mechanical typewriter "tick" plays once when a new speech bubble appears.

**Accessibility & Browser Policies**
- **Autoplay**: Browsers block audio until user interaction. The "Click to Begin" button on the loading screen unlocks the global `AudioContext`.
- **Global Control**: A persistent mute button sits in the top right. The `isMuted` boolean is saved to `localStorage` across sessions.
- **Tab Focus**: When the browser tab loses focus, the `AudioContext` naturally pauses alongside the `useFrame` loop, silencing the site.

**Audio Mixing & Mastering**
- **Levels**: Master volume is capped at `-12dB` to prevent digital clipping and startling users.
- **Compression**: A `DynamicsCompressorNode` is attached to the global `AudioListener` to ensure overlapping sounds (like two characters walking) do not peak.
- **Format**: `.mp3` for ambiances, `.ogg` for UI effects for rapid decoding. Preloading is restricted to critical UI/footstep sounds.

**Edge Cases & Narrative Cues**
- **Zone Transitions**: Crossing districts triggers a deep ambient "bass swell."
- **Videos**: 2D UI videos auto-play but are natively muted via browser policies, requiring user interaction with iframe controls to unmute.
- **Dead End (404)**: The ambient room tone drops to pure digital silence to make the 404 district feel isolating.

---

## 19. Environment & Architecture

**Aesthetic & Scale**
- **Style**: Brutalist minimalism (large concrete planes, sharp angles, vast spaces) utilizing the strict 4-color monochrome palette.
- **Proportions**: Architecture is scaled up 1.5x to increase grandeur and make the characters feel smaller. Buildings have no windows or interiors.

**The Districts**
- **The Hub**: A massive, flat concrete plaza surrounded by infinite void, featuring three giant architectural gates. Acts as a breathing space.
- **Projects**: A linear, wide boulevard with 3-4 featured project pedestals. An Archive Terminal caps the end.
- **Essays**: An enclosed, brutalist library/archive room to promote focus. Featured essays use glowing reading tables.
- **Biography**: A small, intimate, isolated courtyard (cafe table) contrasting the massive scale of the other districts.
- **Dead End (404)**: A claustrophobic alleyway with a flickering light and a massive "404" painted on the wall.

**Navigation & Boundaries**
- **Wayfinding**: Massive 3D typography baked into the ground/walls at intersections. No minimap or HUD is used.
- **Constraints**: Invisible walls are strictly avoided. Physical geometry (low concrete barriers, trenches, drops) constrains the NavMesh.
- **The Void**: Districts are surrounded by `#0B0B0B` infinite void. Exponential fog blends buildings into the distance.

**Lighting Integration (Geometry)**
- **Diegetic Light**: Glowing neon strips (`MeshBasicMaterial`) and stark geometric streetlamps justify light sources.
- **Shadows**: Buildings cast strictly hard shadows via the primary directional light.

**Interactive Props & Pedestals**
- **Visuals**: Concrete block pedestals with a simplified, rotating 3D mesh representation of the project resting on top.

**Asset Production Pipeline**
- **Creation**: Built bespoke per-district in Blender to avoid seam-line lighting bugs.
- **Materials**: Solid colors are handled via custom `ShaderMaterial` in React. UV unwrapping is only required for ground planes (noise textures).
- **Optimization**: Building edges are kept razor-sharp (90 degrees, no beveling) to keep polygon counts low and allow the Outline Shader to draw clean lines. 3D text is heavily decimated in Blender rather than generated at runtime.

**Visual Hierarchy**
- **Contrast**: Ground is `#141414`, buildings are `#0B0B0B`, and characters are `#A3A3A3` / `#F5F5F5` to ensure characters pop out instantly.
- **Movement**: The background remains dead still to prevent distraction, save for rotating pedestals.
- **Stairs**: Must be modeled broad, shallow, and monumental to read well from the isometric camera angle.

---

## 20. Post-Processing & Shaders

**The Outline Shader (Sobel)**
- **Method**: A custom screen-space post-processing pass using a Sobel operator to detect edges based on the Depth and Normal buffers.
- **Constraints**: Thickness is calculated in absolute screen pixels (2px) so lines don't scale or thicken with distance. Drei's `<Outlines>` is avoided to save polygon count.
- **Inversion**: Passing a stencil/selection mask to the shader inverts the outline to `#F5F5F5` when hovering interactive props.

**Cross-Hatch Dithering & Paper Noise**
- **Hatching**: Shadows are replaced with a 512x512 tiled cross-hatch texture pattern multiplied against the shadow map using triplanar mapping to prevent sliding.
- **Grain**: A static, high-frequency white noise overlay mixed at ~5% opacity provides a physical paper texture. It is not animated.

**Squigglevision (Line Boiling)**
- **Effect**: A custom post-processing displacement pass randomly offsets screen pixels using a noise texture to simulate a hand-drawn look.
- **Framerate**: Runs at exactly 12Hz (on twos) to mimic traditional animation. It is continuous and never stops.
- **Targeting**: Squigglevision applies strictly to the WebGL canvas. HTML UI panels remain perfectly crisp and excluded from the effect.

**Performance & Shader Material Setup**
- **Unified Effect**: Outlines, Noise, and Squigglevision are combined into a *single* custom WebGL fragment shader via `@react-three/postprocessing` to save massive draw calls. SMAA provides anti-aliasing.
- **Base Shader**: Custom `ShaderMaterial` intercepts lighting chunks, applying a strict `step()` function (threshold 0.5) to clamp colors exclusively to `#A3A3A3` or `#141414`. No soft gradients are allowed.
- **Fog Integration**: `FogExp2` is applied *after* the outline shader in the render pipeline.

**Mobile & Edge Cases**
- **Mobile Opt-Out**: Squigglevision is entirely disabled on mobile devices (via `hardwareConcurrency` detection) to save battery life. Outlines remain active.
- **FX Restrictions**: Teleport smoke uses a custom instanced mesh particle shader. Ambient Occlusion (SSAO) and real-time point lights are strictly prohibited. Glowing tables rely purely on basic bright materials.

---

## 21. Input Handling & Event Delegation

**Keyboard Input (Desktop)**
- **Library**: `KeyboardControls` from `@react-three/drei` handles mapping WASD and Arrow Keys to semantic actions.
- **Interactions**: Spacebar or 'Enter' triggers the `Interact` action (no jumping).
- **Constraints**: Keyboard movement is strictly ignored when a 2D UI panel is open (`isReading = true`) to prevent accidental walking. `Escape` globally closes the UI.

**Mouse & Pointer Input (Desktop)**
- **Raycasting**: R3F's synthetic pointer events (`onClick`, `onPointerOver`) are attached directly to 3D meshes. The raycaster only checks the `InteractionLayer`, ignoring background buildings to save CPU.
- **Event Propagation**: Clicking the 2D HTML UI does not punch through to the 3D canvas due to native `event.stopPropagation()`. Double-clicks are avoided.

**Touch & Mobile Input**
- **Mobile Movement**: A full-screen invisible `<div />` joystick wrapper tracks touch-start and drag deltas.
- **Mobile Interactions**: Distinguishes between a tap (< 200ms duration, no drag) to interact, and a drag to move. Pinch-to-zoom is natively disabled in the HTML meta tag.

**Event Delegation & Optimization**
- **Hitboxes**: Complex 3D models are wrapped in simple, invisible primitive `<mesh>` boxes to handle `onClick` raycasting efficiently.
- **State Feedback**: The `onClick` handler calls `useWorldStore.getState().openPanel(slug)`. If clicked from afar, the Visitor auto-walks to the prop and opens the panel upon arrival. This auto-walk is canceled if the user manually presses WASD.

**Gamepad Support**
- **API**: Native HTML5 Gamepad API mapped to velocity vectors inside a `useFrame` loop. Kept as an undocumented Easter Egg (no visual button prompts).

**Edge Cases & Failsafes**
- **Throttling**: The "Interact" action is debounced to prevent state-thrashing from rapid clicking.
- **Runaway Bug**: A `visibilitychange` event listener forces all WASD inputs to `false` when the browser tab loses focus, preventing the character from running infinitely.
- **Text Selection**: Highlighting text inside an essay is fully supported and automatically disables the 3D mouse parallax effect to keep the background still while reading.
- **A11y**: Standard DOM tabbing works inside open UI panels. 3D spatial navigation is replaced by a hidden "Skip to 2D HTML Version" link for screen readers.

---

## 22. Deployment & CI/CD

**Hosting & Infrastructure**
- **Platform**: Vercel. Natively optimized for Next.js App Router and edge caching.
- **Asset Delivery**: `.glb` files are hosted in the Next.js `/public` folder and delivered via Vercel's Global Edge Network. S3 is not used to avoid CORS complexity.

**MDX Integration**
- **Updates**: Git pushes containing new or modified `.mdx` files trigger automatic Vercel rebuilds. Because content is local and statically parsed, builds remain lightning fast.

**Continuous Integration (CI)**
- **Testing**: GitHub Actions verify TypeScript compilation and ESLint on every push. Vercel blocks deployment on failure. E2E testing (Cypress/Playwright) is avoided due to WebGL flakiness.
- **Previews**: Vercel generates Preview Deployments for every Pull Request.

**Bundle Size Optimization**
- **Dynamic Imports**: R3F `<Canvas>` is dynamically imported (`next/dynamic`) so the HTML/CSS loads instantly. Target Web Vitals TTI is <3 seconds on desktop.
- **Tree-Shaking**: Imports from `three/src/...` ensure unused Three.js math classes are dropped from the bundle.

**Cache & Environment**
- **Caching**: `.glb` files use aggressive 1-year headers (`Cache-Control: public, max-age=31536000, immutable`). Vercel handles cache invalidation natively via file hashing.
- **Secrets**: API keys use Vercel Environment Variables (`NEXT_PUBLIC_` for client access). `.env` files are never committed.

**Analytics & Error Monitoring**
- **Analytics**: Vercel Web Analytics or Plausible (cookie-free, lightweight). Google Analytics is prohibited. Custom events track 3D state thresholds (e.g., entering districts).
- **Errors**: Sentry is used to catch WebGL hardware crashes and missing MDX frontmatter fields. Source Maps are uploaded directly to Sentry and kept private from the public browser.

**Security & DNS**
- **Headers**: Strict CSP in `next.config.mjs` prevents XSS. `X-Frame-Options` restricts `<iframe>` embedding to approved portfolio aggregators.
- **DNS**: Root domain points directly to Vercel's IP. WWW is 308 redirected to the apex domain. URLs have trailing slashes removed (`/projects`).
- **Failsafes**: Next.js serves the last statically generated HTML if the local data source drops, preventing site downtime.

---

## 23. Accessibility (A11y) & Inclusive Design

**Accessibility HTML Fallback**
- **Architecture**: A complete, non-WebGL 2D HTML version of the portfolio is built using Next.js Server Components, rendering the exact same text data.
- **Implementation**: A hidden "Skip to 2D HTML Version" link sits at the top of the DOM. Clicking it skips the 3D Canvas and renders the MDX content as a standard, vertically scrolling HTML website using the same brutalist aesthetics.

**Screen Reader (ARIA) Integration**
- **Hiding Canvas**: The R3F `<Canvas>` is marked `aria-hidden="true"` so screen readers bypass the 3D geometry entirely and use the HTML fallback.
- **Landmarks**: 2D UI panels utilize strict semantic HTML (`<main>`, `<article>`, `<nav>`).

**Visual Accessibility & Contrast**
- **Contrast**: The `#F5F5F5` on `#0B0B0B` monochrome palette vastly exceeds WCAG AAA 7:1 contrast ratio requirements.
- **Typography**: Uses `rem` units to natively support user-defined browser font sizing. Links use thick 2px underlines rather than relying solely on color (which assists color blindness).

**Motion & Vestibular Disorders**
- **Prefers-Reduced-Motion**: Detected via CSS and React hooks.
- **Adjustments**: When enabled, Z-axis mouse parallax and Squigglevision (boiling lines) are completely disabled to prevent vertigo. UI panels snap instantly instead of sliding.

**Cognitive & Interaction**
- **Pacing**: The Guided Tour can be broken instantly with WASD. Dialogue bubble timings include a +1000ms buffer for slower readers.
- **Flashing**: The 404 flickering light is kept safely under 3Hz to prevent triggering photosensitive epilepsy.
- **Focus States**: A highly visible, thick `#F5F5F5` outline is applied on `:focus-visible`. Escape closes all panels.

**Media & Transcripts**
- **Alt Text**: Strictly required in the MDX frontmatter for all cover images, and in standard markdown syntax for inline images.
- **Video & Audio**: Videos must have captions. Since the tour is text-based, no audio transcripts are needed. Footsteps are purely aesthetic.

**Touch & Language**
- **Hit Areas**: Minimum 44x44px tap targets for mobile close buttons. Typography is forced large enough (16px min) since pinch-to-zoom is disabled.
- **Readability**: Content aims for an 8th-10th grade reading level, strictly in English for V1.

**Testing**
- **Automation**: `eslint-plugin-jsx-a11y` runs in CI. Target is 100/100 Lighthouse Accessibility score for the HTML layer.

---

## 24. SEO & Metadata Strategy

**WebGL Indexing Challenges**
- **SSR Fallback**: Because Googlebot cannot parse WebGL geometry, Next.js Server-Side Renders the MDX text content into a hidden HTML fallback layer.
- **Concealment**: The fallback layer is hidden using CSS clipping (`clip-path: inset(100%)`) rather than `display: none` to avoid Google keyword-stuffing penalties.

**Dynamic Meta Tags**
- **Injection**: `generateMetadata` in `layout.tsx` and `page.tsx` dynamically reads and sets SEO fields from MDX frontmatter for every unique project route.
- **Title Structure**: `[Project Name] | Abdulrahman's Hub`.
- **OG Images**: 1200x630px bespoke screenshots of the 3D pedestals are placed in `public/images/`. Auto-generated text images (`@vercel/og`) are avoided to maintain premium art direction.

**Sitemap Generation**
- **Generation**: Next.js `sitemap.ts` dynamically builds the XML file by reading the local `src/content/` directory, including `lastModified` dates from frontmatter.

---

## 25. Core Web Vitals & Optimization

**LCP (Largest Contentful Paint)**
- **Images**: `next/image` lazy-loads 2D assets below the fold in WebP/AVIF formats.

**Performance & Technical SEO**
- **LCP & CLS**: The `#0B0B0B` background and HTML layer load instantly to pass LCP. The Canvas wrapper uses a fixed `100dvh` height to guarantee zero Cumulative Layout Shift (CLS) when 3D assets pop in.
- **Images**: `next/image` lazy-loads 2D assets below the fold in WebP/AVIF formats.
- **Canonical URLs**: Set explicitly in `generateMetadata` to prevent duplicate content penalties from trailing slash variations.

**Social Proof & Meta Layer**
- **Theme Color**: `<meta name="theme-color" content="#0B0B0B" />` seamlessly merges the mobile browser address bar with the Canvas.
- **Apple Touch Icon**: Provided for users who save the portfolio to their iOS home screen.

---

## 25. 3D Asset Pipeline & Blender Workflow

**Scale & Origin Points**
- **Units**: Set Blender to Meters (`1 BU = 1 Three.js Unit`) and strictly apply scale (`Ctrl+A`) before export to prevent physics and rig bugs. Abdulrahman is exactly 1.8 meters tall.
- **Origins**: Building origins are at the bottom center (Z=0). Rotating interactive props have their origins at their exact geometric center.

**Export Format & Settings**
- **Format**: `glTF 2.0 (.glb)`.
- **Exclusions**: Do not export cameras or lights (handled in React). Do not export animations for environmental objects.
- **Modifiers**: Apply all modifiers before export. Triangulate geometry and strictly avoid n-gons to ensure sharp normals for the Outline Shader.

**Materials & Geometry**
- **Shading**: Do not build procedural nodes or apply final colors in Blender. Use blank placeholder materials; the custom `ShaderMaterial` will be applied in React.
- **UV Mapping**: Only required for ground planes (for noise textures). Solid-color buildings skip UV unwrapping to save time.
- **Edges**: Mark sharp edges and use "Auto Smooth" correctly so the Outline shader knows exactly where to draw lines.

**Optimization & Organization**
- **Naming**: Use strict lowercase snake_case (e.g., `project_pedestal_01`). These become the React object keys.
- **Grouping**: Group assets by district in Blender. Merge all static background buildings into a single mesh (`Ctrl+J`) to reduce draw calls to 1.
- **Polycount**: Keep the entire scene under 100,000 triangles.

**Rigging & Animation**
- **Baking**: Any IK constraints used for animating the characters must be baked to standard Forward Kinematics (FK) before export.
- **Rigging**: Use a minimal Mixamo-style humanoid rig (~50 bones, no facial bones) to keep file sizes small. Walk cycles must loop seamlessly.

**Physics & NavMesh**
- **Colliders**: Do not export invisible collision meshes from Blender. Use Rapier's `<CuboidCollider>` in React. Stairs use an invisible smooth ramp collider to prevent camera jitter.
- **NavMesh**: Modeled as a flat, contiguous polygon plane covering walkable areas. Exported as a separate `navmesh.glb` and kept invisible (`visible={false}`) in R3F.

**The React Integration**
- **Conversion**: Use `@react-three/gltfjsx` to generate declarative React components from the `.glb` files.
- **Iterative Updates**: Overwrite the `.glb` in the `public` folder to trigger Next.js Fast Refresh. Re-running `gltfjsx` is only necessary if object names change.

---

## 26. Camera Cinematics & Sequences

**The Opening & State Transitions**
- **Hub Arrival**: The camera starts high in the black void and swoops down into the 45-degree isometric position over 2 seconds via a cubic-bezier easing curve. Characters are already present.
- **State Management**: Zustand stores `cameraMode` (`'HUB_INTRO'`, `'FREE_ROAM'`, `'READING'`, `'404'`). The camera automatically lerps to the mathematically defined offset for each state.
- **Reading Mode**: When a UI panel opens, the camera pans to the right to frame the 3D characters in the remaining 60% of the screen, and narrows the FOV (e.g., 45 to 35) for a subtle zoom.

**Cinematic Sequences**
- **Dialogue**: The camera stays locked in the isometric view. No zooming or snapping occurs when Abdulrahman speaks to prevent jarring flow interruptions.
- **Teleportation**: Internal links trigger a 200ms fade-to-black HTML overlay, an instantaneous coordinate swap, and a 200ms fade-in. The camera angle strictly remains the same.
- **Catch-Up**: When Abdulrahman teleports to the Visitor, the camera stays locked on the Visitor, waiting for Abdulrahman to arrive in frame.
- **404 Dead End**: The camera drops lower than 45 degrees, looking slightly upward to create a claustrophobic, trapped feeling.

**Dynamic Framing & Constraints**
- **Tracking**: The camera mathematically tracks the Visitor. Because Abdulrahman tethers to the Visitor (max 15m), both remain perfectly in frame.
- **Collisions**: The 45-degree elevated angle naturally clears all brutalist roofs, eliminating the need for expensive camera-collision raycasting.

**Mouse Parallax (Diorama Effect)**
- **Movement**: Slight offsets (max `±0.5` units) based on normalized mouse coordinates (`-1` to `1`).
- **Damping**: `THREE.MathUtils.damp()` ensures the parallax feels heavy and buttery smooth.

**Mobile & Edge Cases**
- **Mobile Adjustments**: The camera pulls further back (increased distance) to fit both characters in portrait mode. The Reading Mode pan is disabled, as the UI takes up 100% of the screen.
- **Resizing**: Changing window height dynamically adjusts the FOV to prevent characters from being cut off at the bottom.
- **Framerate & Focus**: All lerping multiplies by `delta` time inside `useFrame`. Switching tabs pauses the loop gracefully without snapping upon return.

**Technical Constraints**
- **Libraries**: `@react-three/camera-controls` and GSAP are avoided. Custom `useCameraLerp` hooks manage pure math.
- **Aesthetics**: Screen shake, Z-axis rolling, and Depth of Field (DOF) are strictly prohibited to maintain the sharp, quiet museum aesthetic.

---

## 27. The Dialogue Engine (Data Structure)

**Data Storage & Format**
- **Storage**: A hardcoded local `dialogue.ts` file. Storing UI micro-copy in MDX causes unnecessary complexity.
- **Structure**: `[{ id: 'intro_01', text: "Welcome to the Hub.", delayBefore: 500, gesture: 'point' }]`
- **Branching**: Strictly linear. No dialogue trees to maintain the guided museum metaphor and keep global state simple.

**Trigger Conditions**
- **Guided Tour**: Triggered sequentially via NavMesh waypoints.
- **Free Roam**: Triggered by spatial proximity (entering invisible `InteractionZone` boxes).
- **Interactions**: Clicking Abdulrahman triggers a random "Idle/Poke" line.

**Timing & Queuing**
- **Duration Math**: `(words.length * 250ms) + 1000ms buffer`.
- **Queue System**: Zustand manages `dialogueQueue`. Simultaneous triggers push to the back of the queue.
- **Overrides**: Clicking an interactive prop instantly flushes the queue, forcing the contextual line to play immediately for a hyper-responsive feel.

**Dialogue UI & Rendering**
- **DOM Integration**: Rendered using Drei's `<Html>` component for perfectly crisp, accessible text. It automatically tracks the 3D coordinate of Abdulrahman's head.
- **Clutter Control**: Max 100 characters per bubble. Longer lines are split into sequential arrays. Viewport boundaries push the bubble downward if Abdulrahman approaches the top edge of the screen.
- **Aesthetics**: `#F5F5F5` background, `#0B0B0B` text. It appears instantly (no typing animation) and features a small CSS pointer tail.

**The Fourth Wall & Variables**
- **Contextual Awareness**: Abdulrahman comments on early UI dismissals, 30s idle time, and small viewport widths (`window.innerWidth < 768`).
- **Variables & Markup**: Dialogue strings accept dynamic variables (e.g., `{timeOfDay}`) and basic HTML tags (bold/italic) parsed via `dangerouslySetInnerHTML`.

**Animations Syncing**
- **Body**: The `gesture` property triggers specific animations in the `AnimationMixer` simultaneously with the text. Abdulrahman continues walking while talking.
- **Head Tracking**: IK bone rotation ensures Abdulrahman makes eye contact with the camera/Visitor while speaking.

**Edge Cases & Debugging**
- **404 District**: A specific "You shouldn't be here" line plays, and the queue locks until the user navigates away.
- **Failsafes**: Empty dialogue strings `""` immediately resolve and pull the next line to prevent soft-locks.
- **Developer Tools**: `?debug=true` shows spatial trigger zones as green wireframes. `Shift + N` skips the current dialogue line.

---

## 28. Typography & Font Loading

**Font Selection**
- **Primary UI**: Inter or Roboto Mono (geometric sans-serif/monospace) for the brutalist aesthetic.
- **Secondary (Essays)**: Merriweather or Georgia (highly legible serif) for long-form reading contrast.
- **Format**: Variable fonts are strictly used to bundle weights (100-900) into a single optimized file.

**Loading Strategies (Next.js)**
- **Self-Hosting**: `next/font/google` automatically self-hosts fonts at build time, eliminating external network requests.
- **CLS Prevention**: Next.js automatically injects mathematically matched fallback fonts with `size-adjust` to completely eliminate Cumulative Layout Shift.
- **FOUT**: `font-display: swap` ensures text is visible instantly (FOUT) rather than invisible (FOIT). The primary font is preloaded in the `<head>`.

**Typographic Hierarchy & Sizing**
- **Units**: `rem` for standard text (base `16px`), and `clamp(2rem, 5vw, 4rem)` for fluid `H1` essay headers.
- **Spacing**: Essays use left-aligned, ragged-right paragraphs (no justification) with a `1.6` to `1.8` line height. Uppercase UI buttons use `0.05em` letter spacing.
- **Width**: Essay containers are strictly clamped to `max-width: 65ch` for optimal reading mechanics.

**Performance & Subsetting**
- **Subsetting**: Fonts are subset strictly to `latin` to strip out unused glyphs (reducing file size by 70%).
- **Italics**: Italic variants are only loaded for the serif Essay font, not the primary brutalist UI font.
- **WebGL**: The 3D Canvas does not load `.woff2` files. All 3D wayfinding text is converted to raw geometry in Blender.

**Styling & Components**
- **Dialogue Bubbles**: Uses the primary UI font (Medium/Semi-Bold) to resemble digital interface overlays.
- **Code Snippets**: Fira Code or JetBrains Mono with contextual ligatures, rendered in a `#141414` box with `#F5F5F5` text.
- **Links & Quotes**: Links use a thick `2px` underline (`text-underline-offset: 4px`). Blockquotes use a thick `#F5F5F5` left border. Drop caps are avoided.
- **Failsafes**: `word-wrap: break-word` prevents long URLs from breaking the mobile layout. Hyphenation (`hyphens: auto`) is disabled to maintain clean brutalist edges. Font weights do not change on hover to prevent reflow.

---

## 29. UI/UX: The Reading Experience

**Panel Architecture & Layout**
- **Slide-In**: The panel slides in from the left, occupying 40% of the desktop width as a brutalist sidebar. The camera pans right to frame the 3D world in the remaining 60%.
- **Aesthetics**: Solid `#0B0B0B` background with a harsh 2px `#F5F5F5` right border. No `backdrop-filter` blur is used to protect WebGL performance.

**Scrolling & Navigation**
- **Scrollbar**: Custom-styled via `::-webkit-scrollbar` (blocky, no rounded corners).
- **Progress**: A 2px high `#F5F5F5` progress bar fixed to the top edge grows as the user scrolls. Smooth scrolling is enabled for internal anchors.

**Entry & Exit Intents**
- **Closing**: Handled via a massive sticky `[ X ]` button, the `Escape` key, or clicking the exposed 3D canvas.
- **Animation**: Closes by sliding left (`-100% transform`) over 300ms while the camera lerps back to center.

**Table of Contents & Media**
- **ToC**: Auto-generated from MDX `H2`/`H3` tags, placed inline at the top of the essay. Uses `IntersectionObserver` to highlight the active section.
- **Images**: Expand into a full-screen, center-aligned lightbox when clicked. Captions are rendered underneath in monospace.

**Code Snippets & Links**
- **Code Blocks**: Server-side highlighted via Shiki, styled to the 4-color monochrome palette. Features a brutalist `[ COPY ]` hover button.
- **External Links**: Always open in a new tab (`target="_blank"`) and feature an appended SVG arrow `↗`.

**Metadata & Archives**
- **Layout**: "Tech Stack" tags sit below the `H1`. The "Live Project" button is fixed to the bottom of the panel with inverted colors (`#F5F5F5` bg).
- **Archive Terminal**: Functions as a searchable directory list (`[ _SEARCH ]`). Clicking an item slides the list away and reveals the content.

**Accessibility Mechanics**
- **Focus Management**: Focus is programmatically shifted to the panel upon opening. A Focus Trap ensures `Tab` cycling stays within the panel.
- **Micro-Interactions**: Buttons instantly invert colors (0ms transition) on hover.

**State Management Integration**
- **Deep Linking**: Scrolling updates the URL hash. Loading a hashed URL automatically opens the panel and scrolls to the target `H2`.
- **Background Activity**: The WebGL world (Squigglevision, pedestals, idle animations) continues running seamlessly behind the open panel.

---

## 30. Mobile Responsive Overrides

**3D Canvas & Camera Adaptation**
- **Visibility**: The 3D Canvas remains fully active on mobile. It is not hidden behind a static image.
- **Framing**: The camera maintains the 45-degree angle but pulls back (increased distance) to fit characters in portrait mode.
- **Zoom Restrictions**: `user-scalable=no` is enforced to prevent pinch-to-zoom, locking the isometric perspective.

**Performance Degradation**
- **Disabling Effects**: Squigglevision (full-screen pixel displacement) is entirely disabled on mobile to preserve battery life and framerate. The static Outline Shader remains active.
- **Resolution Capping**: `pixelRatio` is strictly capped at `1` on mobile, bypassing Retina scaling to save massive amounts of GPU memory.
- **Memory Management**: Unused geometries and materials are aggressively disposed of to prevent Safari from dumping the WebGL context.

**Movement & Touch Controls**
- **Invisible Joystick**: The entire screen acts as an invisible touch-and-drag joystick. No visible HUD joystick clutters the UI.
- **Interactions**: Double-tapping is not required. A single tap on an interactive prop opens its panel immediately.
- **Proximity Highlights**: Since mobile has no hover state, props invert to a white outline automatically when the Visitor walks near them.

**Reading Panel Overrides**
- **Width & Panning**: The reading panel expands to 100% width, covering the Canvas entirely. Consequently, the camera pan-to-right behavior is disabled.
- **Close Button**: The `[ X ]` button is enlarged to ensure a minimum 44x44px hit area.
- **Typography**: Base font remains 16px to prevent forced zooming. `H1` headers shrink fluidly. The Table of Contents remains inline at the top.

**Browser UI & Edge Cases**
- **Safe Areas**: `padding: env(safe-area-inset-top)` prevents text from hiding behind the iPhone notch or Dynamic Island.
- **Dynamic Viewport**: CSS `100dvh` is used to perfectly match the bottom of the screen regardless of the Safari toolbar's collapsed/expanded state.
- **Scroll Bouncing**: `overscroll-behavior-y: none` disables pull-to-refresh, and `overflow: hidden` on the canvas wrapper prevents iOS rubber-banding.
- **Audio**: Autoplay is blocked. Audio unlocks upon the initial "Enter" gesture.
- **Sharing & Connectivity**: Replaces "Copy Link" with the native `navigator.share()` API on supported devices. Offline Resilience ensures dropping cell service does not crash the 3D world once loaded.

---

## 31. Error Handling & Failsafes

**WebGL & Asset Failures**
- **No WebGL**: Next.js automatically detects missing WebGL support and renders the `<noscript>` / HTML fallback reading panels.
- **GPU Crashes**: `webglcontextlost` triggers a stark `[ FATAL ERROR: GPU CRASH ]` UI overlay requiring a manual page reload (auto-restore is disabled to prevent memory leaks).
- **Missing Assets**: React Suspense Error Boundaries replace failed `.glb` models with wireframe bounding boxes. Missing textures gracefully fall back to solid colors inside the `ShaderMaterial`.

**Content & Network Failsafes**
- **MDX Reliability**: Because all content is stored locally as `.mdx` files, the site is immune to database API outages and network drops.
- **Missing Images**: Next.js `<Image>` `onError` handlers display a `[ IMAGE MISSING ]` brutalist placeholder. Missing project slugs (`/projects/does-not-exist`) seamlessly route to the 3D 404 District.
- **Data Validation**: Zod schemas intercept missing MDX frontmatter fields during the build (e.g., failing the local build immediately if a title is missing) rather than crashing the live React tree.

**Physics & Boundary Escapes**
- **The Void**: A trigger plane at `Y=-10` catches falling characters and teleports them back to `0,0,0`.
- **NavMesh Escapes**: The tether system detects invalid coordinates and smoothly rubber-bands the character back onto the nearest valid polygon.

**State Management Glitches**
- **Dialogue Queue**: A 15-second timeout automatically flushes stuck dialogue queues.
- **Camera Math**: Defensive checks intercept `NaN` outputs from camera lerps, safely snapping the camera back to the default Hub offset.
- **Input Desync**: The `visibilitychange` event forces all `WASD` booleans to `false` when tabs are switched, preventing infinite running bugs.

**Performance Throttling**
- **Auto-Degradation**: If `useFrame` detects framerates below 30fps for 5 seconds, Squigglevision is disabled and `pixelRatio` drops to `1`, triggering a `[ PERFORMANCE DEGRATED ]` UI toast.

**Error Tracking & Deployment**
- **Sentry**: Client-side React and WebGL crashes are logged. Source maps are hidden from the browser. Benign Three.js warnings are filtered to save quota.
- **Deployment**: GitHub Actions blocks Vercel deployments if TypeScript (`tsc`) or ESLint fails.

**Soft-Locks**
- **AI Stuck**: If Abdulrahman is separated from the Visitor by >20 meters, he bypasses the NavMesh and teleports directly behind the Visitor.
- **Audio Fails**: Audio decoding errors fail silently, allowing the visual experience to continue uninterrupted.

---

## 32. Development Environment & Tooling

**Local Environment Setup**
- **Package Manager**: `pnpm` is strictly used for speed and disk space efficiency.
- **Node Version**: Node 20 LTS (or higher), enforced via `.nvmrc`.
- **Architecture**: Monorepos (Turborepo) are avoided. Content lives locally in the `src/content/` directory.

**Code Quality & Linting**
- **TypeScript**: `"strict": true` is strictly enforced to catch undefined meshes before they crash WebGL.
- **Formatting**: Prettier is configured to use single quotes and no semicolons for a stark, modern aesthetic. Enforced on save.
- **Linting**: Uses `eslint-config-next` and `@react-three/eslint-plugin` to catch React hook errors within R3F.
- **Git Hooks**: Husky runs `lint-staged` pre-commit to ensure code quality.

**Debug UI & Profiling**
- **Leva**: Used for real-time GUI tweaking of shader uniforms and camera math.
- **r3f-perf**: `@react-three/perf` monitors FPS, draw calls, and GPU memory.
- **Production**: Both tools are conditionally rendered *out* of the production bundle to save weight.

**The `?debug=true` Mode**
- **Visual Aids**: Renders NavMesh wireframes, `InteractionZone` boxes (green), and Rapier `<Physics debug>` colliders (red lines).
- **Controls**: Temporarily mounts `<OrbitControls>` and unmounts the cinematic camera for free-flight inspection. Displays an X/Y/Z coordinate overlay.

**3D Asset Workflow (Local)**
- **Conversion**: Run `npx gltfjsx [file.glb] -t` to generate TypeScript-ready React components from Blender exports.
- **Git**: `.glb` files are committed directly to Git (LFS is unnecessary due to low poly counts). Placeholder textures are pre-compressed via `squoosh.app`.

**Next.js Dev Server & MDX**
- **Hydration**: The `<Canvas>` is wrapped in a `next/dynamic` import with `ssr: false` to prevent React hydration errors.
- **MDX Parsing**: MDX files are parsed locally using Next.js native MDX or `next-mdx-remote`, allowing instant Hot Module Replacement (HMR) when writing essays.

**Testing Strategy**
- **Unit Tests**: Minimal. Focused strictly on pure functions (e.g., dialogue queue math), avoiding brittle WebGL tests.
- **E2E**: Playwright is used strictly for testing HTML reading panels, SEO routes, and accessibility, not WebGL canvas contents.

**Pre-Deployment Checks**
- **Local Build**: Always run `pnpm run build` and `pnpm run start` to audit bundle size before pushing.
- **Staging**: Vercel Preview URLs generated from PRs must be verified on a physical mobile device before merging to `main`.

---

## 33. Post-Launch & Maintenance

**Content Updates (MDX)**
- **Adding Projects**: New projects are added by creating a new `.mdx` file in `src/content/projects/` and pushing to GitHub. Vercel automatically rebuilds the static site instantly.
- **Dynamic 3D Generation**: The React code mathematically spaces and instantiates a new 3D pedestal for each new project along a Bezier curve in the NavMesh, meaning Blender never needs to be reopened to add a project.
- **Timelines**: The Biography/Timeline is driven by a YAML array (`experienceList`) inside the `bio.mdx` frontmatter, allowing instant updates when new jobs are added.

**Analytics & Monitoring**
- **Tracking**: Plausible/Vercel Analytics track page views. Custom events track 3D milestones ("Entered Projects District", "Triggered 404").
- **Error Triage**: Sentry alerts are configured to email the developer if a specific error (e.g., `webglcontextlost`) spikes above a 5% threshold, indicating the 3D scene is too heavy for current mobile devices.

**Dependency Management**
- **Manual Upgrades**: Three.js (`@react-three/fiber`) introduces breaking changes frequently. Dependencies should be upgraded manually and deliberately every quarter rather than relying on auto-merging bots.
- **Next.js**: Core Next.js updates should be prioritized for security and edge caching optimizations.

**Cost & Performance**
- **Hosting**: $0/month. Vercel Hobby tier and Plausible/Vercel Analytics cover the entire stack. Vercel's Edge Network absorbs traffic spikes automatically.
- **Audits**: Target Core Web Vitals are LCP < 2.5s, CLS = 0, INP < 200ms. The HTML fallback ensures perfect scores despite the WebGL payload.

**Design Longevity & Customization**
- **Aesthetic**: The highly stylized, high-contrast brutalist paper-drawing look ages significantly better than hyper-realistic rendering.
- **Theming**: The 4 monochrome colors are defined as CSS variables and Zustand global state. Changing them updates both the HTML UI and the 3D world instantly.

**Future Expansion (V2)**
- **Scope Lock**: V1 strictly remains a single-player, hardcoded guided tour to guarantee a curated, latency-free experience.
- **V2 Ideas**: Hooking the `dialogueQueue` to an AI API or turning the "Dead End" 404 district into an interactive minigame are viable future updates.

**Disaster Recovery & Sunsetting**
- **Backups**: Git automatically backs up all `.mdx` content history.
- **Sunsetting**: The portfolio is designed for a 2-3 year lifespan. When replaced, it will be archived to a subdomain (e.g., `v1.abdulrahmans-portfolio.com`) to preserve inbound links and the 3D experience.

---

> **END OF DOCUMENT**
> This Implementation Strategy serves as the absolute source of truth for the architecture, art direction, logic, and deployment of the BabTheDev portfolio.

---

## 9. Character Controller & Physics

**Physics Engine Setup**
- **Library**: `@react-three/rapier` (WASM-accelerated for max performance).
- **Time Step**: Fixed time step to ensure physics calculations remain identical regardless of monitor refresh rate.
- **Body Type**: `KinematicPositionBased` rigid bodies. Characters collide with walls but are driven strictly by code, preventing them from being violently pushed by physics forces.

**Speed & Pacing**
- **Base Speed**: A leisurely 3.5m/s for both characters to preserve the museum atmosphere.
- **Speed Matching**: Abdulrahman never speeds up to catch the Visitor in Free Roam. Both characters always move at the exact same speed (3.5m/s).
- **Sprinting**: Disabled. There is no sprint button.

**Movement Math & Controls**
- **Translation**: Direct coordinate translation is used instead of physics impulses to ensure the characters stop instantly without feeling icy.
- **Rotation**: Characters smoothly rotate to face their movement direction using spherical linear interpolation (`slerp`) over 0.15s.
- **Mobile Joystick**: A full-screen invisible joystick calculates the 2D delta vector from the initial touch point to the drag point. Speed is binary; dragging further does not increase speed.
- **Camera-Relative Control**: WASD maps directly to the camera's angle (W always moves the character away from the lens).
- **Diagonal Normalization**: Vectors are normalized to 1.0 to prevent moving diagonally faster than moving straight.

**Collision Logic**
- **Character Repel**: Characters do not have hard physics collisions with each other; they use custom soft-repel pathfinding logic.
- **Colliders**: Characters use `Capsule` colliders for smooth wall sliding. Large props (benches) use primitive `Cuboid` boxes. Small props (papers, cups) have no colliders at all to save performance.
- **Stairs**: Invisible smooth physics ramps are placed over 3D stair meshes to allow characters to glide up smoothly instead of violently bouncing.

**Animation & Debugging**
- **Animation Sync**: Walk animation playback speed is dynamically multiplied by the character's velocity vector, automatically crossfading to an `Idle` loop over 0.2s when stopping.
- **Wall Collision Sync**: If a user holds 'W' while stuck in a corner, velocity hits 0, and the animation correctly drops to `Idle`.
- **NavMesh**: Baked in Blender via Recast with a 0.5m padding to prevent shoulder clipping. Used exclusively for Abdulrahman and mobile tap-routing.
- **Debug Tools**: Pressing F3 toggles the Rapier `<Debug />` component to show red wireframe colliders and green NavMesh planes in development.

---

## 6. Lighting & Atmosphere

**Primary Light & Shadow Map**
- **Light Source**: A static, pure white (`#FFFFFF`) directional light angled at 45 degrees to mimic a golden hour casting long dramatic shadows, paired with a very low `#141414` ambient light.
- **Shadow Quality**: `BasicShadowMap` at 1024x1024. Shadows must be hard, jagged, and aliased. Soft blurs ruin the paper aesthetic.
- **Shadow Color**: Pure `#0B0B0B`, looking like solid ink blocks.
- **Bias**: A high `shadowBias` (-0.0001) is used to prevent shadow acne on the clean `#141414` surfaces.

**Fog & Depth Handling**
- **Type**: `FogExp2` (Exponential squared).
- **Color**: Pure `#0B0B0B`.
- **Distance**: Starts at 15 meters, reaches 100% opacity at 35 meters, perfectly obscuring the curving edges of the spherical world. Outlines render over the fog to stay crisp.

**Character & Prop Illumination**
- **Character Lighting**: Characters ignore the shadow map and have a custom material override ensuring they always render at 100% brightness. A fresnel effect paints the extreme outer edges `#F5F5F5` to pop them out of dark backgrounds.
- **Blob Shadows**: Characters cast simple 2D `#0B0B0B` oval blob shadows instead of complex silhouettes.
- **Focus Dimming**: Opening the 2D UI panel interpolates ambient light down by 50% over 300ms to pull focus away from the 3D world.
- **Emissive Bloom**: Glowing objects (like computer screens) use a tight bloom threshold (>1.0) with a very small radius to simulate ink bleeding.

**Atmospheric VFX**
- **Sky**: No skybox, no HDRI reflections, no stars. Just pure `#0B0B0B` negative space.
- **Wind**: Fast, unshaded horizontal `#A3A3A3` line segments.
- **Dust**: Extremely sparse, tiny `#A3A3A3` squares floating lazily.
- **Birds**: Low-poly paper cranes flapping on a sine-wave loop high above the fog line. They do not cast shadows or react to players.
