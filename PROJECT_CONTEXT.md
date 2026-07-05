# Cosmogenesis Project Context

This document captures the current project state after the simplification refactor that reorganized the app around separate 3D and 2D geometry workbench modes.

## Product

Cosmogenesis is a static sacred-geometry workbench and atlas. It is not a marketing site. The first screen is the usable app: a full-canvas geometry viewer with a left mode/symbol rail, a floating render controls panel, contextual controls when needed, and an info panel.

The product is organized around two distinct modes:

- 3D mode: the default mode, rendered with Three.js.
- 2D mode: a circle-construction workbench rendered with Canvas 2D.

The guiding product decision from the last refactor was to stop treating 2D symbols as things that should be converted into 3D. The app now treats 2D and 3D as separate sections, each with its own symbol set and visual logic.

## Stack

- Vite static app
- TypeScript
- Three.js for 3D rendering
- Canvas 2D for 2D constructions and overlays
- Plain DOM UI, no frontend framework
- CSS in `src/styles.css`

Package scripts:

```bash
npm run dev
npm run build
npm run preview
```

Deployment target:

- Cloudflare Pages from a GitHub repo named `cosmogenesis`.
- Build command: `npm run build`.
- Build output directory: `dist`.
- Framework preset: `Vite`, or no preset if Vite is unavailable.
- No environment variables are currently required.

For WSL/browser testing:

```bash
npm run dev -- --host 0.0.0.0
```

Then open `http://localhost:5173`, or use `hostname -I` and open `http://<WSL_IP>:5173` from Windows if needed.

## Scaffolding

Important files:

- `index.html`: static HTML shell and favicon.
- `src/main.ts`: imports CSS and mounts `CosmogenesisApp`.
- `src/app.ts`: current active application shell, UI state, event handling, 2D drawing, and Flower workflow.
- `src/styles.css`: all current app layout and visual styling.
- `src/render/threeScene.ts`: current active Three.js renderer for 3D mode.
- `src/render/canvas.ts`: Canvas metrics, camera transform, zoom helpers.
- `src/render/drawing.ts`: reusable 2D drawing primitives and older construction-step rendering helpers.
- `src/geometry/lattice.ts`: hex/triangular lattice generation.
- `src/geometry/vector.ts`: 2D vector utilities.
- `src/geometry/spatial.ts`: older and reusable 3D geometry utilities, including tetrahedra and 64-cell tetra matrix generation.
- `src/symbols/*`: older registry-driven symbol architecture, currently mostly retained but not the active app shell.
- `src/ui/*`: older UI component classes, currently mostly retained but not wired into the active simplified app.

Generated or validation artifacts:

- `cosmogenesis-sphere-slider-vesica.png`
- `cosmogenesis-octahedron-lines.png`
- `.playwright-mcp/page-*.yml`

## Current Active Architecture

`src/app.ts` owns the active app structure.

Primary state:

- `activeMode`: `"3d"` or `"2d"`, default `"3d"`.
- `active3dId`: selected 3D symbol, default `"sphere"`.
- `active2dId`: selected 2D symbol, default `"circle"`.
- `activeFlowerStep`: contextual 2D Flower workflow step.
- `connectCenters`: shared canvas-level centerpoint connection toggle, enabled by default.
- `slideshowPlaying`: 3D timeline autoplay state, enabled by default on load.
- `lastSlideTime`: timer for the 3-second 3D timeline cadence.
- `camera`: 2D pan/zoom/rotation camera.
- `threeView`: 3D yaw, pitch, zoom, pan state.
- `options`: render options shared with renderers, including colors, sphere scale, and centerpoint connection state.
- `options.lineOpacity`: shared opacity for centerpoint, matrix, and overlay linework.
- `options.sphereOpacity`: 3D sphere field opacity.
- `options.sphereGridOpacity`: 3D spherical latitude/longitude grid opacity.

The app uses a direct DOM implementation:

- Creates the WebGL canvas.
- Creates the 2D canvas.
- Creates the left rail with 3D/2D mode buttons.
- Renders the active mode's symbol buttons. In 3D, this list is also the indicator timeline.
- Adds Back / Play-Pause / Forward controls for the 3D timeline.
- Adds the floating render panel with the re-orient action, centerpoint toggle, 3D-only sphere size/opacity sliders, and field/line color controls.
- Adds the contextual Flower workflow stepper.
- Adds the right info panel.

The render loop runs with `requestAnimationFrame`, resizes the canvas each frame, clears the canvas background, and then renders either 3D or 2D depending on `activeMode`.

## 3D Mode

3D is the default mode.

Current 3D symbol set:

- Sphere
- Vesica Piscis
- Tripod
- Tetrahedral Spheres
- Star Tetrahedron
- Vector Equilibrium
- 3D Flower of Life
- 64 Tetrahedron Grid
- The Aether

When `3D Flower of Life` is selected, the same contextual Flower workflow stepper appears as in 2D. The supported overlays are still planar, but they live inside the Three.js scene and rotate/zoom with the 3D view. Autoplay walks through the supported 3D Flower of Life steps before advancing to the 64 Tetrahedron Grid.

`The Aether` extends the side-oriented 64-grid reading into an immersive cubic field: a 16 x 16 x 16 visible lattice of 4096 spheres. It is rendered with `THREE.InstancedMesh` for the spheres and line-segment geometry for local x/y/z neighbor links, so it behaves like a navigable field rather than thousands of individual mesh objects. Its lattice line/node visibility is driven by the Grid opacity slider, while Field opacity controls only the translucent sphere shells.

The 3D renderer lives in `src/render/threeScene.ts`.

Implementation notes:

- Uses `THREE.WebGLRenderer` with alpha and antialiasing.
- Uses ambient, key, and fill lights.
- Uses a perspective camera looking at the centered construction.
- Builds a root group and rotates that group for interaction.
- Rebuilds geometry only when the symbol or important render options change.
- Spheres are rendered as translucent `MeshStandardMaterial` fields.
- Each sphere can render longitude/meridian lines using Three.js `LineLoop`s.
- Centerpoints are rendered as small emissive nodes.
- Centerpoint struts are cylinders between centerpoints.
- Sphere geometry uses `THREE.SphereGeometry(radius, 64, 32)`.
- The 64 Tetrahedron Grid has its own render path: validated regular tetrahedral cells, wireframe, translucent faces, lattice nodes, tetrahedron-circumsphere overlay, and projection overlay. It starts with the sphere overlay selected.
- For the 64 Tetrahedron Grid sphere overlay, spheres are centered on each tetrahedral cell's circumcenter and circumscribe that tetrahedron's vertices; they are not centered on the lattice vertices.
- The Star Tetrahedron has its own render path using eight tetrahedral modules around an octahedral core. Spheres circumscribe those tetrahedral modules instead of sitting on the outer star vertices.
- The Aether has its own render path using instanced sphere fields, optional instanced center nodes, local neighbor line segments, and light scene fog for depth.
- Vector Equilibrium has a contextual Jitterbug control. It uses a special render path that moves the 12 cuboctahedron/vector-equilibrium vertices along a helical inward path toward six paired octahedral positions, while preserving the moving centerpoint edge skeleton. Its info panel includes a Buckminster Fuller / Synergetics explanation and explicitly frames Fuller's gravity/field ideas as his geometric worldview rather than standard physics.

The accidental sphere line artifact was addressed by rendering clean translucent sphere meshes and only drawing center lines when `Connect centerpoints` is enabled. The current 3D sphere material does not intentionally add meridian or pole-to-pole linework.

3D interactions:

- Drag rotates the root group for regular 3D symbols.
- In The Aether, drag rotates the field. Shift-drag pans laterally through the field.
- Scroll zooms the 3D camera.
- Double-click or `R` resets the view.
- The 3D symbol timeline auto-plays every 3 seconds on load.
- While autoplay is on, 3D Flower of Life advances through Flower, Fruit, Metatron's Cube, Tetrahedron, Cube / Hexahedron, Octahedron, and Star Tetrahedron before the timeline moves to the 64 Tetrahedron Grid.
- Manual 3D symbol selection pauses autoplay.
- Switching to 2D pauses autoplay.

3D centerpoint connections:

- Sphere: no center edges.
- Vesica Piscis: one center line.
- Tripod: triangle.
- Tetrahedral Spheres: six tetrahedron edges.
- Star Tetrahedron: both tetrahedral edge sets.
- Vector Equilibrium: adjacent cuboctahedron/vector-equilibrium edges between the 12 sphere centers; during Jitterbug, the same edge skeleton follows the moving vertices toward the octahedral double-cover.
- 64 Tetrahedron Grid: validated tetrahedral cell edge network, with contextual display toggles for wireframe, faces, nodes, spheres, and projection.
- 3D Flower of Life: adjacent hex-lattice center connections.
- 3D Flower of Life contextual steps: Fruit, Metatron's Cube, and supported symbolic Platonic overlays from the planar Fruit center network.
- The Aether: local orthogonal neighbor links across the visible 4096-sphere field.

Sphere size:

- The sphere size slider changes rendered sphere radius through `options.sphereScale`.
- Centerpoint coordinates remain fixed.
- This makes it possible to inspect envelope overlap without changing the construction lattice, including for the 12-sphere Vector Equilibrium packing.

Render panel:

- Re-orient snaps the view back to the default readable 3D orientation or default 2D camera.
- Centerpoint visibility is enabled by default and can be toggled off.
- Line opacity controls centerpoint, matrix, and overlay linework.
- Sphere size appears in 3D mode.
- Field opacity appears in 3D mode and controls the translucent sphere envelopes.
- Grid opacity appears in 3D mode and controls the spherical meridian lines.
- Field color controls 3D spheres and 2D circle fields.
- Line color controls centerpoint struts and 2D/3D overlay linework.

## 2D Mode

2D mode uses Canvas 2D and a world-space camera transform.

Current 2D symbol set:

- Circle
- Vesica Piscis
- Tripod
- Seed of Life
- Flower of Life

2D interactions:

- Drag pans the canvas.
- Scroll zooms at the pointer location.
- Double-click or `R` resets the view.

2D centerpoint connections:

- Circle: no center edges.
- Vesica Piscis: one center line.
- Tripod: triangle.
- Seed of Life: spokes from center plus the hexagonal perimeter.
- Flower of Life: adjacent lattice center connections.

## Flower Of Life Workflow

When `Flower of Life` is selected in 2D mode, or `3D Flower of Life` is selected in 3D mode, a contextual mini-stepper appears. This is intentionally not a global timeline.

Current Flower workflow steps:

1. Flower of Life
2. Fruit of Life
3. Metatron's Cube
4. Tetrahedron
5. Cube / Hexahedron
6. Octahedron
7. Dodecahedron
8. Icosahedron
9. Star Tetrahedron

Implementation notes:

- Flower uses `generateHexLattice(radius, 2)`.
- Fruit uses the center plus `generateHexRing(radius, 2)`, producing 13 centers.
- Metatron's Cube uses complete pairwise edges between Fruit centers.
- Platonic solid steps draw symbolic 2D projected overlays derived from the Fruit/Metatron center network.
- In 3D Flower of Life, the supported overlay sequence is drawn as planar Three.js centerpoint struts. Dodecahedron and Icosahedron are disabled in this planar 3D context and remain available only in the 2D Flower workflow until a clearer 3D projection treatment is added.
- The info panel updates to the active contextual step.
- The shared centerpoint toggle remains visible in the render panel while walking the workflow.

The Platonic overlays are symbolic 2D projections, not full mathematically rigorous 3D solid projections.

## Geometry Helpers

Active helpers:

- `generateHexRing`
- `generateHexLattice`
- `getSeedOfLifeCenters`
- `getTripodOfLifeCenters`
- vector and camera transform utilities

Retained broader helpers:

- `createTetrahedronGeometry`
- `createStarTetrahedronGeometry`
- `createStarTetrahedronModules`
- `generateTetrahedronMatrix64`
- older sphere-center helpers in `spatial.ts`

These retained helpers support the earlier broader atlas direction and may be useful if the project later restores a registry-driven construction system or adds advanced 3D studies.

## Older Retained Architecture

The repo still contains an older registry/component architecture:

- `src/symbols/registry.ts`
- `src/symbols/primitives.ts`
- `src/symbols/lifePatterns.ts`
- `src/symbols/polyhedra.ts`
- `src/symbols/spatialPatterns.ts`
- `src/ui/controls.ts`
- `src/ui/iconGrid.ts`
- `src/ui/infoPanel.ts`
- `src/ui/timeline.ts`
- `src/ui/colorDock.ts`

That architecture includes broader concepts such as:

- Void
- Point
- Circle
- Vesica Piscis
- Tripod of Life
- Seed of Life
- Sphere Flower
- Tetrahedron
- Tetrahedron + Sphere
- Star Tetrahedron
- 64 Tetra Matrix

The current simplified product does not use these UI classes as the primary workflow. They are retained source, not the active product shell.

## Styling

The visual direction is a dark, full-screen technical workbench:

- Full-bleed canvas.
- Left rail for mode and symbol selection.
- Right info panel on wider screens.
- Floating render controls panel containing the centerpoint toggle, sphere-size slider, and color swatches.
- Contextual Flower stepper at the bottom when needed.
- Cyan/gold geometry accents.

Responsive behavior:

- Info panel hides on narrower screens.
- Left rail compresses on mobile.
- Floating controls move toward the bottom on small screens.
- Flower stepper becomes scrollable on mobile.

## Validation

Last known build check:

```bash
npm run build
```

Result:

- TypeScript passed.
- Vite production build passed.
- Vite emitted a chunk-size warning because the bundled app includes Three.js.

Representative visual/UI states captured in `.playwright-mcp` snapshots:

- Default 3D Sphere.
- 3D Vesica Piscis.
- 2D Circle.
- 2D Flower of Life workflow.
- 2D Octahedron workflow.

Representative PNG artifacts:

- `cosmogenesis-sphere-slider-vesica.png`: 3D Vesica/sphere slider validation.
- `cosmogenesis-octahedron-lines.png`: 2D Octahedron overlay validation.

## Known Gaps And Risks

- There are no formal automated tests.
- Visual behavior has been validated through build checks, Playwright snapshots, and screenshots.
- The older registry/UI architecture remains in the codebase but is not integrated with the active app shell, so future changes should either deliberately remove it or deliberately re-integrate it.
- The Platonic solid overlays in the 2D Flower workflow are symbolic graph overlays, not rigorous geometric projections.
- The bundle is over Vite's default 500 kB chunk warning threshold because of Three.js.
- `.git` is not usable in this workspace snapshot, so commit history is not available from here.

## Next Useful Work

Likely next engineering steps:

- Decide whether to delete or re-integrate the older registry-driven UI and symbol modules.
- Add lightweight Playwright smoke checks for the major UI states.
- Add focused geometry unit tests for lattice generation and centerpoint edge generation.
- Consider code-splitting Three.js if bundle size matters.
- Refine the symbolic Platonic overlays if mathematical precision becomes a product requirement.
- Add a small project roadmap or design-notes file once the next product direction is clear.
