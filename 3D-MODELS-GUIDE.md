# 3D Models Guide for AZSpace

## Current Implementation
Currently using **procedural geometry** with `MeshStandardMaterial` for realistic-looking satellites and ISS.

## Using Real 3D Models (Optional Upgrade)

### Free 3D Model Resources:
1. **NASA 3D Resources** - https://nasa3d.arc.nasa.gov/
   - Official ISS models
   - Satellite models
   - Free for use

2. **Sketchfab** - https://sketchfab.com/
   - Search for "satellite" or "space station"
   - Filter by "Downloadable" and "Free"
   - Download as GLTF/GLB format

3. **TurboSquid** - https://www.turbosquid.com/Search/3D-Models/free/satellite
   - Free satellite models
   - Various formats available

### How to Add GLTF Models:

1. **Download a model** (GLB or GLTF format)
2. **Place it in** `/public/models/`
3. **Load it in the code**:

```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

// Load ISS model
loader.load('/models/iss.glb', (gltf) => {
  const iss = gltf.scene;
  iss.scale.set(0.5, 0.5, 0.5); // Adjust size
  iss.position.z = -3;
  scene.add(iss);
});

// Load satellite model
loader.load('/models/satellite.glb', (gltf) => {
  const satellite = gltf.scene.clone();
  satellite.position.set(x, y, z);
  scene.add(satellite);
});
```

### Recommended Models:
- **ISS**: NASA's International Space Station model
- **Satellites**: 
  - Hubble Space Telescope
  - GPS Satellite
  - Communication Satellite
  - CubeSat

### Advantages of Real Models:
- ✅ More realistic appearance
- ✅ Professionally designed
- ✅ Authentic details

### Advantages of Current Procedural Approach:
- ✅ No external dependencies
- ✅ Smaller file size
- ✅ Faster loading
- ✅ Easy to customize colors/materials
- ✅ Consistent art style
- ✅ Better performance

## Current Features:
- **ISS**: Detailed procedural model with solar panels, modules, radiators
- **Satellites**: 3 types (CubeSat, Communications, Weather) with realistic materials
- **Lighting**: Ambient + directional light for realistic rendering
- **Materials**: MeshStandardMaterial with metalness and roughness
- **Animation**: All objects rotate and move dynamically
