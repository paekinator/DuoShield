# How to Add Real 3D Models

Since I cannot directly download 3D models, please follow these steps to add realistic models:

## Step 1: Download Free 3D Models

### For the ISS (International Space Station):
1. Go to: https://nasa3d.arc.nasa.gov/detail/iss-internal
2. Or: https://sketchfab.com/3d-models/international-space-station-iss-d0f1aa310cb842b5bad2b148663e10fc
3. Download as **GLB** or **GLTF** format
4. Save as: `/public/models/iss.glb`

### For Satellites:
1. **CubeSat**: https://sketchfab.com/3d-models/cubesat-satellite-free-download-35b6a1ce38ed46a5be3e8f2ec19e39ff
2. **Communication Satellite**: https://sketchfab.com/3d-models/satellite-5411d8c2c79c4b71b99887e3e4c9e43a
3. **GPS Satellite**: https://sketchfab.com/3d-models/gps-satellite-a2c5f18a35e74f00b02264c5df3d0ebe
4. Download and save to `/public/models/` folder

## Step 2: Model Files Needed
Place these files in `/public/models/`:
- `iss.glb` - International Space Station
- `satellite1.glb` - First satellite type
- `satellite2.glb` - Second satellite type
- `satellite3.glb` - Third satellite type

## Step 3: Alternative Quick Option
Use these free model repositories:
- **Poly Pizza**: https://poly.pizza/ (search "satellite" or "space station")
- **Quaternius**: http://quaternius.com/assets.html (look for space assets)
- **Free3D**: https://free3d.com/ (search "satellite")

## Step 4: The Code is Already Set Up
The code in `ThreeBackground.tsx` is ready to load these models automatically once you place them in the `/public/models/` folder.

## Quick Test
If you don't want to download models right now, the current procedural models will work as placeholders until you add real ones.
