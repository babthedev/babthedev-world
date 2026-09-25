# Character animation

Characters animate from **VRM Animation (`.vrma`) clips** when they exist and fall
back to a built-in procedural animation (`CharacterModel.tsx`) when they don't.
The site works identically with none, some, or all clips present, and requests no
file it hasn't been told about (no 404s in the console).

## Adding clips

1. Put the files in `public/animations/`, named after the state:

   | file | state | plays | used by |
   |---|---|---|---|
   | `idle.vrma`  | standing still | loops | visitor, Abdulrahman, standing NPCs |
   | `walk.vrma`  | walking        | loops | visitor, Abdulrahman |
   | `sit.vrma`   | seated         | loops | Joe and other seated NPCs |
   | `wave.vrma`  | greeting       | once, holds last frame | (gesture override) |
   | `point.vrma` | pointing       | once, holds last frame | (gesture override) |

2. List the ones you added in `.env.local` (restart `pnpm dev` afterwards):

   ```
   NEXT_PUBLIC_VRMA_CLIPS=idle,walk,sit
   ```

   Declared, not probed, on purpose: probing a missing file would put a 404 in
   every visitor's console.

3. Any state without a clip keeps the procedural animation, so you can add them
   one at a time.

Behaviour: states crossfade over 0.15s (Q39). NPC head-tracking (Q102) is applied
additively on top of the clip. A clip that fails to load logs one warning and that
state falls back to procedural.

### Clip requirements

- Standard `.vrma` with the `VRMC_vrm_animation` extension and humanoid bones.
- Loop clips (`idle`, `walk`, `sit`) should start and end on the same pose.
- Author for a normal-height humanoid; hips translation is scaled to each
  character's hips height automatically.

## Optimising character models

`pnpm assets:vrm` shrinks `public/*.vrm` in place (originals are in git):
textures to 1024px palette PNG (thumbnail 256px), all-zero morph normals dropped,
face blend-shape deltas re-encoded as sparse accessors, vertex/index data
meshopt-compressed. It does **not** use gltf-transform, which silently drops the
`VRMC_*` extensions. Every output is verified (each accessor decodes to the same
values, every image decodes, nodes/materials/extensions unchanged) before it is
written, and re-running is a no-op. `pnpm assets:budget` enforces 12MB for all
character models together.

## Opening handshake

The opening handshake is procedural, not a clip: `lib/greeting.ts` solves the right
arm with two-bone IK so both hands meet at the midpoint of the two characters' real
shoulders (it works for any pair of models). It runs during the intro dialogue and the
tour waits for it. It is skipped for `prefers-reduced-motion`, for a dev `__TELEPORT__`,
and whenever the intro is already over. To replace it with authored animation, provide a
paired `handshake` clip for each character and drive it from `GreetingDirector` instead
of the IK; the timeline, turning, camera and tour hold can stay as they are.
