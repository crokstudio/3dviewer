# Container Layer Viewer

Static Three.js website for reviewing a shipping container model by construction layer. It is meant for meetings, budget/doability reviews, and later construction or maintenance coordination.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production output is written to `dist/`.

## Layer contract

The viewer first tries to load `public/models/container.glb`. If that file is missing or cannot be loaded, it falls back to the primitive in-code placeholder.

Each top-level Blender layer should be exported as a real glTF node. The most reliable Blender setup is:

1. Create one Collection per viewer layer.
2. Add one Empty inside each Collection.
3. Name the Empty with the layer id below.
4. Parent that layer's meshes to the Empty.
5. Export as `.glb` to `public/models/container.glb`.

Recommended layer ids:

- `frame`
- `walls`
- `roof`
- `doors`
- `floor`
- `electrical`
- `cameras`
- `hvac`
- `plumbing`
- `lighting`

The UI reads the imported nodes as layers. Unknown layer names are also supported and will appear as custom toggles, but the built-in presets and X-ray shell control know the recommended ids above.

You can preview another file without replacing the default by using a query string:

```txt
http://127.0.0.1:5173/?model=/models/my-export.glb
```

Mesh origins do not need to be at world `0,0,0`. Keep the whole container near the scene origin, use useful pivots for movable parts, and apply object scale before export.

## Texture and lighting notes

The placeholder uses physically based `MeshStandardMaterial` materials, procedural canvas textures, ACES tone mapping, shadows, and a prefiltered room environment. Production `.gltf` assets should use PBR materials and texture maps where possible:

- Base color/albedo
- Roughness
- Metalness
- Normal maps for corrugated metal and fine detail
- Optional baked ambient occlusion if mobile performance becomes tight

The site is static and does not require server-side mesh processing.
