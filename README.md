# Cosmogenesis

Cosmogenesis is a static Vite + TypeScript sacred-geometry workbench. It is organized around two separate atlas modes: a default 3D sphere workbench and a 2D circle workbench. Geometry is generated procedurally in canvas and Three.js, with a canvas-level centerpoint connection control for revealing the underlying construction graph.

## Install

```bash
npm install
```

## Development

```bash
npm run dev -- --host 0.0.0.0
```

First try:

```text
http://localhost:5173
```

If that does not work from Windows, run:

```bash
hostname -I
```

Then open:

```text
http://<WSL_IP>:5173
```

## Production Build

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

The production build is emitted to `dist/` and uses relative paths, so it can be deployed to Vercel, Netlify, GitHub Pages, Cloudflare Pages, or any static host.

## Cloudflare Pages

Cloudflare Pages can deploy this app directly from a GitHub repository.

Use these settings:

- Build command: `npm run build`
- Build output directory: `dist`
- Framework preset: `Vite`, or no preset if Vite is unavailable
- Environment variables: none required

Recommended flow:

1. Push this repo to GitHub as `cosmogenesis`.
2. In Cloudflare, open **Workers & Pages**.
3. Select **Create application**.
4. Select **Pages**.
5. Select **Import from an existing Git repository**.
6. Choose the `cosmogenesis` repository.
7. Enter the build settings above.
8. Save and deploy.

Cloudflare will publish the site at a `*.pages.dev` URL and redeploy automatically on future pushes to the connected branch.

## Controls

- 3D / 2D: switch between separate symbol sets. 3D is the default.
- 3D timeline: the 3D symbol list acts as an indicator timeline and auto-plays on load.
- Back / Pause / Forward: step through or pause the 3D timeline. Manual symbol selection pauses autoplay.
- Symbol grid: select the active construction for the current mode.
- Render panel: re-orient, centerpoint connections, line opacity, sphere size, opacity controls, and field/line colors.
- Re-orient: snap the view back to the default readable orientation.
- Connect centerpoints: enabled by default; toggle it off to hide the center-to-center construction graph.
- Line opacity: tune centerpoint, matrix, and overlay linework.
- Sphere size: in 3D mode, scale sphere envelopes in real time while keeping construction centers fixed.
- Field opacity: in 3D mode, tune the translucency of the sphere envelopes.
- Grid opacity: in 3D mode, tune the longitude/meridian lines drawn over each sphere.
- Fields / Lines: recolor sphere or circle fields and the centerpoint/overlay linework.
- 3D mode drag: rotate the sphere or tetrahedral construction.
- 2D mode drag: pan the circle canvas.
- Mouse wheel: zoom the current canvas.
- Double click or `R`: restore the default view.
- Flower of Life in 2D: opens a contextual mini-stepper for Flower, Fruit, Metatron's Cube, and projected Platonic overlays.
- 3D Flower of Life: uses the same contextual mini-stepper as the 2D Flower workflow, with planar 3D centerpoint overlays. During autoplay, the timeline walks through the supported 3D Flower of Life steps before advancing to the 64 Tetrahedron Grid.

## Symbol Sets

The app keeps the 3D and 2D symbols separate instead of converting one into the other.

3D symbols:

- Sphere
- Vesica Piscis with two intersecting spheres
- Tripod with three spheres
- Four tetrahedral spheres
- Star tetrahedron tetra-module circumsphere arrangement
- Vector Equilibrium / Cuboctahedron 12-sphere packing
- 3D Flower of Life sphere layer
- 3D Flower of Life sphere layer with Fruit, Metatron's Cube, and symbolic Platonic overlay steps
- 64 Tetrahedron Grid
- The Aether 4096-sphere navigable field

2D symbols:

- Circle
- Vesica Piscis
- Tripod
- Seed of Life
- Flower of Life

The 2D Flower of Life has its own contextual workflow: Flower of Life, Fruit of Life, Metatron's Cube, Tetrahedron, Cube / Hexahedron, Octahedron, Dodecahedron, Icosahedron, and Star Tetrahedron.

## Geometry Generation

All visible geometry is generated procedurally. The app keeps 2D world coordinates separate from screen coordinates through a camera transform with scale, offset, and rotation fields. Circles use a shared base radius, and the Seed of Life is derived from the first ring of a triangular/hexagonal lattice.

3D symbols use explicit centerpoint coordinates. Vesica and Tripod preserve the circle-construction rule that neighboring sphere centers are separated by one base radius. Tetrahedral symbols use regular tetrahedron coordinates. The star tetrahedron uses eight tetrahedral modules around an octahedral core and renders a circumscribing sphere around each tetrahedral module, while its connected centerpoint graph still shows the two complementary tetrahedra from alternate cube corners. The Vector Equilibrium uses the 12 cuboctahedron vertices as sphere centers, scaled so neighboring centers are one base radius apart. It includes a contextual Jitterbug control that spirals the 12 vertices inward toward an octahedral double-cover while keeping the moving centerpoint skeleton connected. The 64 Tetrahedron Grid is generated as a finite 3D tetrahedral lattice cluster with 64 validated tetrahedral cells. It can be viewed as wireframe, translucent faces, glowing nodes, tetrahedron-circumsphere overlay, or 2D projection overlay; it starts with the sphere overlay selected. Its sphere overlay places one sphere around each tetrahedral cell, centered on that tetrahedron's circumcenter, rather than placing spheres on lattice vertices. The Aether extends the side-oriented 64-grid reading into a 16 x 16 x 16, 4096-sphere visible field using Three.js instanced rendering, with local neighbor links when centerpoints are connected. In The Aether, Grid opacity controls lattice line/node visibility, Field opacity controls only the translucent sphere shells, drag rotates, Shift-drag pans, and scroll moves through depth. The flower-like image is a projection or sphere-overlay interpretation of this 3D structure, not a flat circle construction. The sphere-size slider changes only rendered sphere radius, so centerpoint lattices and struts remain fixed. Spheres render as clean translucent fields with longitude/meridian lines; field, grid, and line opacity can be tuned independently. Center lines can be toggled with Connect centerpoints.

The 3D Flower of Life uses one ring-two hexagonal center layer, matching the center Flower of Life rather than stacked staggered layers. It also shares the contextual Flower workflow used in 2D: Fruit of Life, Metatron's Cube, Tetrahedron, Cube / Hexahedron, Octahedron, and Star Tetrahedron are drawn as planar 3D centerpoint networks when Connect centerpoints is enabled. Dodecahedron and Icosahedron remain available in the 2D Flower workflow, but are disabled in the 3D Flower of Life because they need a different projection treatment to read cleanly. The 2D Flower workflow derives Fruit of Life centers from the Flower lattice, connects those centers into Metatron's Cube, and draws symbolic Platonic solid projections from that centerpoint network.
