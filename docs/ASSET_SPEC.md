# Asset specification — closing the gap to Messenger

What to author, at what size, in what format, so it drops straight into the
existing pipeline. Everything here is derived from how the code loads and lays
out assets today, not from generic advice. Where a constraint is a *code*
limitation rather than a hard rule, it says so, and the code can be changed.

**Status:** the loading pipeline for the building kit is built and tested (see §1, *Delivery*).
Drop valid files into `public/town/`, run `pnpm assets:town`, and they replace the Kenney
buildings with no further code changes.

Priority order (biggest visual return first):

| # | Asset | Why it matters |
|---|---|---|
| 1 | Building kit (P6) | Architecture is the largest remaining gap to Messenger |
| 2 | Street furniture and facade attachments | Density: Messenger has far more props per metre |
| 3 | Animation clips | Mocap-quality walk, idle, sit |
| 4 | Distinct NPC characters | all three NPCs currently share the visitor model |
| 5 | Signage lettering and title face | Replaces the generated glyph script |

---

## 0. Ground rules for every 3D asset

| Rule | Value | Reason |
|---|---|---|
| Units | 1 unit = 1 metre | The world is a 25 m radius planet; the visitor is ~1.7 m tall |
| Up / forward | +Y up, **+Z is the front** (the side that faces the street) | Placement aligns local +Z to the street-facing direction |
| Origin | Centre of the footprint, **on the ground** (y = 0 is the bottom) | Placement puts the origin on the surface |
| Format | `.glb` (binary glTF 2.0) | |
| Compression | Meshopt is fine (`pnpm assets:optimize` applies it); Draco is fine | The loader enables both |
| Normals | **Hard (split) normals on every hard edge**; smooth only on deliberately curved surfaces | The ink outline pass draws lines where normals change sharply. Smoothed box edges lose their outline |
| Detail floor | Nothing smaller than ~5 cm | Below that, outlines turn to noise at the camera distance |
| Real geometry over texture | Model window recesses, ledges and stairs as geometry, 10–20 cm deep | Ink lines come from depth and normal changes, not from paint |
| Colour | Flat albedo, mid-light greys or any colour | Everything is graded to monochrome; walls read best at ~60–80% luminance. Do not bake shadows or lighting |
| Textures | One shared atlas per kit, 1024 or 2048 px | See the code note in §1 |
| Budget | Whole kit ≤ **4 MB** (core world budget is 12 MB, currently 4.6 MB) | `pnpm assets:budget` enforces it in CI |

---

## 1. Building kit (P6)

### How buildings are placed today (so the kit fits)

- Streets are **6 m wide** (3 m half-width), with **2.2 m sidewalks** and a 0.14 m curb.
- Facades sit on a line **5.2 m from the street centre**, plus a random set-back of 0–0.6 m.
- Each building is a **rectangle footprint**; a matching box collider is generated from
  its width x height x depth. **Whatever sticks out of that box is walk-through.**
- Buildings are laid out along streets by a generator, so the kit needs **variety of
  width and height**, not pre-composed blocks.
- Today the Kenney models are scaled up ~7x. Author the new kit at **real scale (x1)**;
  the placement scale factor will be set to 1.

### Modules to deliver

Each is one `.glb`, one merged mesh, origin at footprint centre on the ground, front = +Z.

| Set | Count | Width (x) | Depth (z) | Height (y) | Notes |
|---|---|---|---|---|---|
| Walk-up house/shop, 2 storey | 4 | 4, 5, 6, 8 m | 6–8 m | 6 m | Shopfront band on the ground floor, 3 m tall |
| Walk-up, 3 storey | 5 | 4, 5, 6, 8, 10 m | 6–8 m | 9 m | The workhorse: most frontages |
| Walk-up, 4 storey | 3 | 5, 6, 8 m | 6–8 m | 12 m | |
| Tall block | 2–3 | 8–10 m | 8–10 m | 18–30 m | Few; they make the skyline |
| Low backdrop | 4 | 8–12 m | 4–6 m | 8–14 m | Seen in the distance only; ≤ 200 triangles is fine |

Style targets, from the Messenger references: exterior staircases, balconies with
railings, corrugated shutters, gutters and downpipes, stepped rooflines, window
grilles, recessed doors, water tanks on roofs. Mix concrete, tile and plaster.

**Rules specific to buildings**

- **Ground floor is 3 m tall.** Signs are placed at 3.0–3.5 m and banners at 3.4–5.0 m; this
  is where shopfronts must sit.
- **Front face is flat within the collider box.** Wall clutter (AC units, posters, vending
  machines) is placed against the facade line. Balconies and eaves **above 2.5 m** may
  overhang the box by up to 1.2 m. Anything lower that protrudes more than 0.3 m is
  walk-through, so make low protrusions (stairs, planters) separate props (§2).
- **Triangles:** 400–1500 per module. Instancing makes count cheap; the limit is the
  outline pass, which dislikes noise.
- **One mesh per file.** *(Code limitation.)* The loader reads only the **first mesh** in each
  GLB and applies **one shared material built from the first model's texture** to every
  building. So all modules must share one atlas, or tell me and I will change the loader to
  give each module its own material (a small change, at the cost of one draw call per material).
- The hatching, brush strokes and wear patches are added in the shader from world
  position, so **do not paint them in**.

### Delivery

Put files in `public/town/` (one folder, flat) and run **`pnpm assets:town`**.

| Prefix | Kind | Example |
|---|---|---|
| `bld-` | Frontage: lines the streets | `bld-3-6m-a.glb` |
| `tall-` | Skyline block | `tall-24m-b.glb` |
| `back-` | Low backdrop, seen far away | `back-10m-a.glb` |

The script reads each file's bounding box (so you never supply dimensions), writes
`src/lib/townManifest.ts`, and **validates against this spec**. It warns when a module's
origin isn't the footprint centre on the ground, when its size is outside the ranges above,
when it has more than 3000 triangles or more than one mesh, or when a mesh node carries a
transform. It rejects a file with an unrecognised prefix. Commit the regenerated manifest
(CI fails if it is stale).

As soon as one `bld-` module exists, the town uses the town kit **instead of** the Kenney
models (missing `tall-` or `back-` modules fall back to the `bld-` set), at real scale x1.
With no town files, the town is unchanged.

Run it on the GLBs **before** `pnpm assets:optimize`: compressed (quantised) positions no
longer carry real-world bounds.

---

## 2. Street furniture and facade attachments

Currently these are box and cylinder primitives. Each should be its own small `.glb`
(instanced, so cost is one draw call per type).

| Prop | Approx. size (m) | Variants | Notes |
|---|---|---|---|
| Exterior staircase, straight | 1.0 w x 3.0 h x 4.0 d | 2 | Rise ~3 m to the first floor; needs a collider |
| Balcony with railing | 2.0 w x 1.0 d | 3 | Attaches to a facade |
| AC unit (outdoor condenser) | 0.85 x 0.62 x 0.38 | 2 | Fan grille modelled, not painted |
| Roll-up shutter | 3.0 x 2.6 | 2 | |
| Shopfront awning | 3.0 x 1.2 | 3 | |
| Utility pole with crossarm and transformer | 7.6 h | 2 | Replaces the cylinder pole |
| Street lamp arm | 1.4 long | 1 | |
| Vending machine | 1.0 x 1.8 x 0.7 | 3 | Screen area as a separate flat panel |
| Bin, crate, bicycle, planter, bench | real size | 2 each | |
| Guard rail, bollard, road mirror | real size | 1 each | Bollards are striped in the references |
| Traffic cone | 0.4 h | 1 | The existing Kenney cones are 9 cm tall, so they need replacing |
| Tree (trunk plus foliage clusters) | 5–7 h | 3 | Painted-leaf clusters read better than blobs |
| Grass tuft | 0.4 h | 2 | |

---

## 3. Animation clips

Format: **VRM Animation (`.vrma`)**, humanoid VRM 1.0 bones. The runtime, crossfading
and fallback are already built and tested; see `docs/ANIMATIONS.md`.

| File | Length | Loop | Notes |
|---|---|---|---|
| `idle.vrma` | 4–6 s | yes | Subtle weight shift and breathing; seamless loop |
| `walk.vrma` | 1.0–1.2 s (one full stride cycle) | yes | **In place** (no root motion). Played at 3 m/s, so the stride should look right at that speed. Real weight transfer: pelvis shift, counter-rotating shoulders |
| `sit.vrma` | 4 s | yes | Seated on a bench or chair at ~0.45 m seat height |
| `wave.vrma` | ~2 s | once | Optional |
| `point.vrma` | ~1.5 s | once | Optional |
| `talk.vrma` | 4 s | yes | Optional; not wired yet, tell me and I will connect it to dialogue |

- 30 fps, T-pose reference, hips translation included (it is rescaled to each character's height).
- Start and end poses of loops must match.
- Enable with `NEXT_PUBLIC_VRMA_CLIPS=idle,walk,sit` in `.env.local`.

---

## 4. Characters

- **Format:** VRM 1.0 (VRoid Studio export is fine). Run `pnpm assets:vrm` on delivery; it
  slims them to roughly 3 MB each without changing anything the runtime needs.
- **Three distinct NPCs** are needed: Joe (café), the library sleeper, the newspaper reader.
  Today all three share the visitor’s model, set by `NPC_PLACEHOLDER_MODEL` in
  `src/lib/characterModels.ts`. (`joe.vrm` is a copy of `visitor.vrm`. It looks wasteful, and it is, but it has to
  stay a separate file: one URL means one model on screen, because a parsed GLTF is cached
  per URL and a VRM scene is a single object graph. Two characters sharing a file means one
  of them renders nothing. Only the second and third NPC are currently invisible for this
  reason — giving them their own files, or real models, fixes that.)
  **To add a real one:** drop the file in `public/` and set that NPC’s `modelUrl` in
  `src/lib/worldCoordinates.ts` (or change the constant to move all three at once).
  The character budget is 12 MB and is currently 5.4 MB (2 files), so there is room for three more.
- **Fewer materials per character is a direct performance win.** Each material becomes a
  separate draw, and each is drawn three times per frame. The current models have about 15
  submeshes each; **6 or fewer** would cut character cost by more than half. In VRoid,
  merge hair parts and use fewer clothing layers.
- Keep VRoid's default blend shapes and spring bones; they are preserved.

---

## 5. Signage and type

- **Glyph set:** an SVG set of ~30–40 blocky glyphs in the invented script seen in the
  references (angular, built from bars and squares), plus digits. Replaces the generated script in
  `src/lib/glyphs.ts` (`signTexture()`); nothing else changes.
- **Title face:** a heavy, blocky display face for district titles (the "MAIN SQUARE" style).
  Currently Inter Black with an outline. A `.woff2` file is enough.
- Sign plates are 8 sizes (0.8 x 0.26 up to 3.0 x 0.9 m); glyphs can be authored to fit those
  aspect ratios.

---

## 6. Acceptance checklist

When files are in place, I will:

1. Run `pnpm assets:budget` (world ≤ 12 MB, characters ≤ 12 MB).
2. Run `pnpm assets:vrm --dry` on any characters.
3. Capture the fixed pose set (`node scripts/capture-poses.mjs <label>`) and compare it with
   the previous contact sheet and the Messenger references, including the greyscale
   value-distribution comparison used for P5.
4. Check per-view draw calls on both quality tiers, and walk the tour Hub → Projects →
   Essays → Bio to confirm no collider mismatches.
5. Run the Playwright suite and the DoD checklist.

**Deliver a small batch first** (two or three building modules, one staircase, one
vending machine). Getting the scale, origin and normals right on a handful is far cheaper
than fixing forty.
