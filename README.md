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

The current model is a primitive in-code placeholder. Each major system is already grouped as a layer:

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

When replacing the placeholder with production meshes, keep the same layer ids and assign imported `.gltf` nodes to those layer groups. The UI reads the layer list from the model module, so the controls do not need to change when the geometry becomes realistic.

## Texture and lighting notes

The placeholder uses physically based `MeshStandardMaterial` materials, procedural canvas textures, ACES tone mapping, shadows, and a prefiltered room environment. Production `.gltf` assets should use PBR materials and texture maps where possible:

- Base color/albedo
- Roughness
- Metalness
- Normal maps for corrugated metal and fine detail
- Optional baked ambient occlusion if mobile performance becomes tight

The site is static and does not require server-side mesh processing.
