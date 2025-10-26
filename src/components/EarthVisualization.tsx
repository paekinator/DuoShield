import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

interface Satellite {
  id: string;
  name: string;
  position: {
    lat: number;
    lon: number;
    alt: number;
    x: number;
    y: number;
    z: number;
  };
  color: string;
  threatLevel?: string;
  isSelected?: boolean;
}

interface EarthVisualizationProps {
  satellites: Satellite[];
}

const EarthVisualization = ({ satellites }: EarthVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const satelliteMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const orbitLinesRef = useRef<Map<string, THREE.Line>>(new Map());
  const selectionRingRef = useRef<THREE.Mesh | null>(null);
  const connectionLineRef = useRef<THREE.Line | null>(null);
  const satelliteModelRef = useRef<THREE.Group | null>(null); // 3D satellite model from home page
  const earthGroupRef = useRef<THREE.Group | null>(null); // Group containing Earth, wireframe, and grid
  const satelliteOverlayRef = useRef<HTMLDivElement>(null); // Separate canvas for satellite overlay
  const satelliteOverlayModelRef = useRef<THREE.Group | null>(null); // Reference to overlay satellite model
  const [error, setError] = useState(false);
  
  // Camera animation state
  const targetCameraPosition = useRef({ x: 0, y: 0, z: 25000 });
  const currentCameraPosition = useRef({ x: 0, y: 0, z: 25000 });
  
  // Function to get unique camera angle for each satellite
  const getCameraAngleForSatellite = (satelliteId: string) => {
    // Use satellite ID to generate a consistent but varied angle
    const hash = satelliteId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const angleVariation = (hash % 360) * (Math.PI / 180); // Convert to radians
    const verticalVariation = ((hash % 60) - 30) * (Math.PI / 180); // -30 to +30 degrees
    return { angleVariation, verticalVariation };
  };

  useEffect(() => {
    if (!containerRef.current) return;

    try {

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100000
    );
    camera.position.set(0, 0, 25000);
    camera.lookAt(0, 0, 0); // Ensure camera looks at center
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Lighting - BRIGHTER for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increased from 0.4
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0); // Increased from 1.5
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
    
    // Add fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0x88ccff, 0.6);
    fillLight.position.set(-5, -2, -5);
    scene.add(fillLight);

    // Create a group for all Earth elements (so they rotate together)
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0, 0, 0); // Ensure Earth is centered at origin
    earthGroupRef.current = earthGroup;

    // Load Earth model from OBJ file
    const earthObjLoader = new OBJLoader();
    const earthMtlLoader = new MTLLoader();
    
    // Try to load with materials first, fallback to OBJ only
    const loadEarthWithMaterials = () => {
      earthMtlLoader.load(
        '/models/earth_materials.mtl', // Earth materials file
        (materials) => {
          materials.preload();
          earthObjLoader.setMaterials(materials);
          earthObjLoader.load(
            '/models/earth_model.obj',
            (object) => {
              const earth = object;
              // Scale the model to appropriate size (Earth radius ~6371 km)
              // First, let's check the bounding box to determine proper scaling
              const box = new THREE.Box3().setFromObject(earth);
              const size = box.getSize(new THREE.Vector3());
              const maxDimension = Math.max(size.x, size.y, size.z);
              const scaleFactor = 6371 / (maxDimension / 2); // Earth radius / (model radius)
              
              earth.scale.set(scaleFactor, scaleFactor, scaleFactor);
              
              // Ensure the model is properly positioned and visible
              earth.position.set(0, 0, 0);
              earth.rotation.set(0, 0, 0);
              
              // Use the original materials from the OBJ file
              earth.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  console.log('Earth mesh material:', child.material);
                  console.log('Material color:', child.material?.color?.getHexString());
                  
                  // Keep the original material, just ensure it's properly configured
                  if (child.material) {
                    child.material.needsUpdate = true;
                    child.castShadow = true;
                    child.receiveShadow = true;
                  }
                }
              });
              
              earthGroup.add(earth);
              console.log('✅ Earth model loaded with materials');
              console.log('Model size:', size, 'Scale factor:', scaleFactor);
              console.log('Earth position:', earth.position);
            },
            undefined,
            (error) => {
              console.warn('Failed to load Earth with materials, trying OBJ only:', error);
              loadEarthObjOnly();
            }
          );
        },
        undefined,
        (error) => {
          console.warn('Failed to load Earth materials, trying OBJ only:', error);
          loadEarthObjOnly();
        }
      );
    };

    const loadEarthObjOnly = () => {
      earthObjLoader.load(
        '/models/earth_model.obj',
        (object) => {
          const earth = object;
          // Scale the model to appropriate size (Earth radius ~6371 km)
          // First, let's check the bounding box to determine proper scaling
          const box = new THREE.Box3().setFromObject(earth);
          const size = box.getSize(new THREE.Vector3());
          const maxDimension = Math.max(size.x, size.y, size.z);
          const scaleFactor = 6371 / (maxDimension / 2); // Earth radius / (model radius)
          
          earth.scale.set(scaleFactor, scaleFactor, scaleFactor);
          
          // Ensure the model is properly positioned and visible
          earth.position.set(0, 0, 0);
          earth.rotation.set(0, 0, 0);
          
          // Apply a basic material if no materials were loaded
          earth.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              // Only apply fallback material if the original is white/default
              if (!child.material || child.material.color.getHex() === 0xffffff) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0x4169e1, // Ocean blue
                  emissive: 0x0a1a2e,
                  emissiveIntensity: 0.15,
                  roughness: 0.85,
                  metalness: 0.15,
                });
              }
              child.material.needsUpdate = true;
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          earthGroup.add(earth);
          console.log('✅ Earth model loaded (OBJ only)');
          console.log('Model size:', size, 'Scale factor:', scaleFactor);
          console.log('Earth position:', earth.position);
        },
        undefined,
        (error) => {
          console.error('Failed to load Earth model:', error);
          // Fallback to procedural Earth if model fails to load
          createProceduralEarth();
        }
      );
    };

    const createProceduralEarth = () => {
      console.log('Creating procedural Earth as fallback');
      // Create Low-Poly Earth with realistic geography
      const earthGeometry = new THREE.IcosahedronGeometry(6371, 3); // Low poly icosahedron
      
      // Create Earth material with vertex colors
      const earthMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff, // White base for vertex colors
        emissive: 0x0a1a2e,
        emissiveIntensity: 0.15,
        roughness: 0.85,
        metalness: 0.15,
        flatShading: true, // Low-poly look
      });

      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      
      // Create realistic Earth colors with continents, oceans, and poles
      const positionAttribute = earthGeometry.getAttribute('position');
      const colors = new Float32Array(positionAttribute.count * 3);
      const color = new THREE.Color();
      
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        
        // Calculate latitude and longitude
        const latitude = Math.asin(y / 6371) * (180 / Math.PI); // -90 to 90
        const longitude = Math.atan2(z, x) * (180 / Math.PI); // -180 to 180
        
        // Polar ice caps
        if (Math.abs(latitude) > 75) {
          // Arctic/Antarctic - white ice
          const iceVariation = 0.92 + Math.random() * 0.08;
          color.setRGB(iceVariation, iceVariation, iceVariation);
        }
        // North America (roughly)
        else if (latitude > 15 && latitude < 70 && longitude > -170 && longitude < -50) {
          const isLand = (latitude > 25 && longitude > -125) || 
                         (latitude > 40 && longitude > -100) ||
                         (latitude > 50 && longitude < -90);
          if (isLand) {
            // Land - greens and browns
            color.setRGB(0.25 + Math.random() * 0.15, 0.45 + Math.random() * 0.15, 0.15 + Math.random() * 0.1);
          } else {
            // Ocean
            color.setRGB(0.1 + Math.random() * 0.05, 0.3 + Math.random() * 0.1, 0.5 + Math.random() * 0.15);
          }
        }
        // South America (roughly)
        else if (latitude > -55 && latitude < 15 && longitude > -85 && longitude < -30) {
          const isLand = Math.abs(longitude + 60) < 25 && latitude > -40;
          if (isLand) {
            color.setRGB(0.2 + Math.random() * 0.15, 0.5 + Math.random() * 0.15, 0.1 + Math.random() * 0.1);
          } else {
            color.setRGB(0.08 + Math.random() * 0.05, 0.28 + Math.random() * 0.1, 0.48 + Math.random() * 0.15);
          }
        }
        // Europe and Africa (roughly)
        else if (latitude > -40 && latitude < 70 && longitude > -20 && longitude < 50) {
          const isLand = (latitude > 35 && longitude > -10 && longitude < 40) || // Europe
                         (latitude < 35 && latitude > -35 && longitude > -20 && longitude < 50); // Africa
          if (isLand) {
            if (latitude < 20 && latitude > -10) {
              // Sahara desert region
              color.setRGB(0.7 + Math.random() * 0.15, 0.6 + Math.random() * 0.15, 0.3 + Math.random() * 0.15);
            } else {
              // Other land
              color.setRGB(0.25 + Math.random() * 0.15, 0.45 + Math.random() * 0.15, 0.15 + Math.random() * 0.1);
            }
          } else {
            color.setRGB(0.1 + Math.random() * 0.05, 0.3 + Math.random() * 0.1, 0.5 + Math.random() * 0.15);
          }
        }
        // Asia (roughly)
        else if (latitude > 0 && latitude < 75 && longitude > 50 && longitude < 150) {
          const isLand = true; // Most of this region is land
          if (isLand) {
            color.setRGB(0.3 + Math.random() * 0.15, 0.45 + Math.random() * 0.15, 0.15 + Math.random() * 0.1);
          } else {
            color.setRGB(0.1 + Math.random() * 0.05, 0.3 + Math.random() * 0.1, 0.5 + Math.random() * 0.15);
          }
        }
        // Australia (roughly)
        else if (latitude > -45 && latitude < -10 && longitude > 110 && longitude < 155) {
          const isLand = true;
          if (isLand) {
            // Australia - more brown/red
            color.setRGB(0.55 + Math.random() * 0.15, 0.4 + Math.random() * 0.15, 0.2 + Math.random() * 0.1);
          } else {
            color.setRGB(0.1 + Math.random() * 0.05, 0.3 + Math.random() * 0.1, 0.5 + Math.random() * 0.15);
          }
        }
        // Default - Ocean (Pacific, Atlantic, Indian)
        else {
          // Deep ocean blues
          color.setRGB(0.08 + Math.random() * 0.05, 0.25 + Math.random() * 0.1, 0.45 + Math.random() * 0.15);
        }
        
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
      
      earthGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      earthMaterial.vertexColors = true;
      
      earthGroup.add(earth);
    };

    // Try to load the Earth model
    loadEarthWithMaterials();

    // Add wireframe overlay for tech look - BRIGHTER and more visible
    const wireframeGeometry = new THREE.IcosahedronGeometry(6371 + 15, 3);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffaa, // Bright cyan/green
      wireframe: true,
      transparent: true,
      opacity: 0.35, // Increased from 0.15 to 0.35 for better visibility
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    earthGroup.add(wireframe);

    // Add subtle atmosphere glow
    const atmosphereGeometry = new THREE.IcosahedronGeometry(6371 + 300, 2);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earthGroup.add(atmosphere);

    // Add coordinate grid lines (latitude/longitude)
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.3,
    });

    // Latitude lines (horizontal circles)
    for (let lat = -80; lat <= 80; lat += 20) {
      const latRad = (lat * Math.PI) / 180;
      const radius = 6371 * Math.cos(latRad);
      const y = 6371 * Math.sin(latRad);
      
      const points = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(
          radius * Math.cos(theta),
          y,
          radius * Math.sin(theta)
        ));
      }
      const latGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const latLine = new THREE.Line(latGeometry, gridMaterial);
      earthGroup.add(latLine);
    }

    // Longitude lines (vertical circles)
    for (let lon = 0; lon < 180; lon += 20) {
      const points = [];
      for (let i = 0; i <= 64; i++) {
        const lat = ((i / 64) * 180 - 90) * (Math.PI / 180);
        const lonRad = (lon * Math.PI) / 180;
        points.push(new THREE.Vector3(
          6371 * Math.cos(lat) * Math.cos(lonRad),
          6371 * Math.sin(lat),
          6371 * Math.cos(lat) * Math.sin(lonRad)
        ));
      }
      const lonGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lonLine = new THREE.Line(lonGeometry, gridMaterial);
      earthGroup.add(lonLine);
    }

    // Add the entire Earth group to the scene
    scene.add(earthGroup);

    // Create selection ring for selected satellite
    const selectionRingGeometry = new THREE.TorusGeometry(200, 15, 16, 32);
    const selectionRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8,
    });
    const selectionRing = new THREE.Mesh(selectionRingGeometry, selectionRingMaterial);
    selectionRing.visible = false;
    scene.add(selectionRing);
    selectionRingRef.current = selectionRing;

    // Create connection line from Earth to satellite
    const connectionGeometry = new THREE.BufferGeometry();
    const connectionMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      linewidth: 2,
    });
    const connectionLine = new THREE.Line(connectionGeometry, connectionMaterial);
    connectionLine.visible = false;
    scene.add(connectionLine);
    connectionLineRef.current = connectionLine;

    // Load real satellite 3D model (same as home page)
    const satObjLoader = new OBJLoader();
    const satMtlLoader = new MTLLoader();
    
    // Try to load satellite with MTL (material) first
    satMtlLoader.load(
      '/models/satellite2.mtl',
      (materials) => {
        materials.preload();
        satObjLoader.setMaterials(materials);
        satObjLoader.load(
          '/models/satellite2.obj',
          (object) => {
            const satelliteModel = object;
            // Scale MUCH larger for screen overlay visibility
            satelliteModel.scale.set(50, 50, 50);
            satelliteModel.visible = false;
            
            // Set render order to ensure it renders on top of everything
            satelliteModel.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.renderOrder = 999;
                // Disable depth test so it always renders on top
                if (child.material) {
                  (child.material as THREE.Material).depthTest = false;
                }
              }
            });
            
            scene.add(satelliteModel);
            satelliteModelRef.current = satelliteModel;
            console.log('Satellite 3D model loaded successfully (overlay mode)');
          },
          (progress) => {
            console.log('Loading satellite OBJ:', (progress.loaded / progress.total * 100) + '% loaded');
          },
          (error) => {
            console.warn('Could not load satellite with MTL, trying OBJ only:', error);
            // Fallback: Try loading OBJ without MTL
            loadSatelliteObjOnly();
          }
        );
      },
      undefined,
      (error) => {
        console.warn('Could not load satellite MTL, trying OBJ only:', error);
        // Fallback: Try loading OBJ without MTL
        loadSatelliteObjOnly();
      }
    );
    
    // Fallback function to load OBJ without MTL
    const loadSatelliteObjOnly = () => {
      const objLoaderFallback = new OBJLoader();
      objLoaderFallback.load(
        '/models/satellite1.obj',
        (object) => {
          const satelliteModel = object;
          satelliteModel.scale.set(50, 50, 50);
          
          // Apply default material to all meshes and set render order
          satelliteModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.7,
                roughness: 0.3,
                depthTest: false, // Render on top
              });
              child.renderOrder = 999;
            }
          });
          
          satelliteModel.visible = false;
          scene.add(satelliteModel);
          satelliteModelRef.current = satelliteModel;
          console.log('Satellite 3D model loaded (OBJ only, no materials, overlay mode)');
        },
        (progress) => {
          console.log('Loading satellite OBJ (fallback):', (progress.loaded / progress.total * 100) + '% loaded');
        },
        (error) => {
          console.error('Error loading satellite model:', error);
          // If all loading fails, create a simple fallback geometric satellite
          createFallbackSatelliteModel();
        }
      );
    };
    
    // Ultimate fallback: Create a simple geometric satellite if file loading fails
    const createFallbackSatelliteModel = () => {
      const fallbackGroup = new THREE.Group();
      
      // Main body (cube) - larger for visibility
      const bodyGeometry = new THREE.BoxGeometry(200, 160, 160);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.7,
        roughness: 0.3,
        depthTest: false, // Render on top
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.renderOrder = 999;
      fallbackGroup.add(body);
      
      // Solar panels - larger
      const panelGeometry = new THREE.BoxGeometry(300, 4, 120);
      const panelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a2a4a,
        metalness: 0.3,
        roughness: 0.7,
        depthTest: false, // Render on top
      });
      
      const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
      leftPanel.position.x = -250;
      leftPanel.renderOrder = 999;
      fallbackGroup.add(leftPanel);
      
      const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
      rightPanel.position.x = 250;
      rightPanel.renderOrder = 999;
      fallbackGroup.add(rightPanel);
      
      fallbackGroup.visible = false;
      scene.add(fallbackGroup);
      satelliteModelRef.current = fallbackGroup;
      console.log('Using fallback geometric satellite model (overlay mode)');
    };

    // Add starfield
    const starsGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 100000;
      const y = (Math.random() - 0.5) * 100000;
      const z = (Math.random() - 0.5) * 100000;
      starVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starsMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff, 
      size: 50,
      transparent: true,
      opacity: 0.8
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      rotationVelocity.x = deltaY * 0.005;
      rotationVelocity.y = deltaX * 0.005;

      earthGroup.rotation.y += rotationVelocity.y;
      earthGroup.rotation.x += rotationVelocity.x;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.1;
      camera.position.z += e.deltaY * zoomSpeed;
      camera.position.z = Math.max(8000, Math.min(50000, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Auto-rotate Earth group ONLY if no satellite is selected
      const selectedSat = satellites.find(s => s.isSelected === true);
      
      if (!isDragging && !selectedSat) {
        earthGroup.rotation.y += 0.0002; // Much slower rotation
        rotationVelocity.x *= 0.95;
        rotationVelocity.y *= 0.95;
      }
      // If satellite is selected or user is dragging, Earth stays still!

      // Animate satellites (slower rotation)
      satelliteMeshesRef.current.forEach((mesh) => {
        mesh.rotation.y += 0.005; // Much slower satellite rotation
      });

      // Smoothly animate camera to target position
      const lerpFactor = 0.05; // Smooth interpolation speed
      currentCameraPosition.current.x += (targetCameraPosition.current.x - currentCameraPosition.current.x) * lerpFactor;
      currentCameraPosition.current.y += (targetCameraPosition.current.y - currentCameraPosition.current.y) * lerpFactor;
      currentCameraPosition.current.z += (targetCameraPosition.current.z - currentCameraPosition.current.z) * lerpFactor;
      
      camera.position.set(
        currentCameraPosition.current.x,
        currentCameraPosition.current.y,
        currentCameraPosition.current.z
      );

      // Animate selection ring
      if (selectionRingRef.current && selectionRingRef.current.visible) {
        const time = Date.now() * 0.001;
        selectionRingRef.current.rotation.x += 0.02;
        selectionRingRef.current.rotation.y += 0.03;
        
        // Pulsing effect
        const scale = 1 + Math.sin(time * 2) * 0.1;
        selectionRingRef.current.scale.set(scale, scale, scale);
        
        // Opacity pulsing
        const material = selectionRingRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = 0.6 + Math.sin(time * 3) * 0.2;
      }

      // Animate satellite 3D model (just rotate it, position is fixed)
      if (satelliteModelRef.current && satelliteModelRef.current.visible) {
        // Rotate the satellite model slowly for realistic effect
        // Position stays fixed at (0, 0, 8000) - center of graphic
        satelliteModelRef.current.rotation.y += 0.002; // Slower rotation
        satelliteModelRef.current.rotation.x += 0.001; // Slower rotation
      }

      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
    } catch (error) {
      console.error('Earth Visualization Error:', error);
      setError(true);
    }
  }, []);

  // Track selected satellite ID for rotation reset
  const selectedSatelliteIdRef = useRef<string | null>(null);

  // Satellite Overlay - Separate Three.js scene for centered satellite indicator
  useEffect(() => {
    if (!satelliteOverlayRef.current) {
      console.log('⚠️ Satellite overlay ref not ready yet');
      return;
    }

    console.log('🛰️ Creating satellite overlay scene...');

    // Create separate scene, camera, and renderer for satellite overlay
    const overlayScene = new THREE.Scene();
    
    const overlayCamera = new THREE.PerspectiveCamera(
      75, // Wider field of view for better coverage
      1, // Square aspect ratio
      0.1,
      1000
    );
    overlayCamera.position.set(0, 0, 6); // Closer for better visibility

    const overlayRenderer = new THREE.WebGLRenderer({ 
      alpha: true, // Transparent background
      antialias: true 
    });
    overlayRenderer.setSize(800, 800); // Large canvas for detailed satellite view
    overlayRenderer.setClearColor(0x000000, 0); // Transparent
    satelliteOverlayRef.current.appendChild(overlayRenderer.domElement);

    // Add lighting for the satellite
    const overlayAmbient = new THREE.AmbientLight(0xffffff, 0.8);
    overlayScene.add(overlayAmbient);

    const overlayDirectional = new THREE.DirectionalLight(0xffffff, 1.2);
    overlayDirectional.position.set(5, 5, 5);
    overlayScene.add(overlayDirectional);

    // Load the same satellite model from home page
    let satelliteOverlayModel: THREE.Group | null = null;
    const overlayObjLoader = new OBJLoader();
    const overlayMtlLoader = new MTLLoader();
    
    overlayMtlLoader.load(
      '/models/satellite2.mtl',
      (materials) => {
        materials.preload();
        overlayObjLoader.setMaterials(materials);
        overlayObjLoader.load(
          '/models/satellite2.obj',
          (object) => {
            satelliteOverlayModel = object;
            satelliteOverlayModel.scale.set(0.12, 0.12, 0.12); // Even smaller scale
            satelliteOverlayModel.position.set(0, 1.2, 0); // Moved up more for better centering
            overlayScene.add(satelliteOverlayModel);
            satelliteOverlayModelRef.current = satelliteOverlayModel; // Store reference
            console.log('✅ Satellite overlay model loaded with materials!');
          },
          undefined,
          (error) => {
            console.warn('Could not load satellite overlay with MTL:', error);
            // Fallback to OBJ only
            loadOverlaySatelliteObjOnly();
          }
        );
      },
      undefined,
      (error) => {
        console.warn('Could not load satellite overlay MTL:', error);
        loadOverlaySatelliteObjOnly();
      }
    );

    const loadOverlaySatelliteObjOnly = () => {
      const objLoaderFallback = new OBJLoader();
      objLoaderFallback.load(
        '/models/satellite1.obj',
        (object) => {
          satelliteOverlayModel = object;
          satelliteOverlayModel.scale.set(0.12, 0.12, 0.12); // Even smaller scale
          satelliteOverlayModel.position.set(0, 1.2, 0); // Moved up more for better centering
          
          satelliteOverlayModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.7,
                roughness: 0.3,
              });
            }
          });
          
          overlayScene.add(satelliteOverlayModel);
          satelliteOverlayModelRef.current = satelliteOverlayModel; // Store reference
          console.log('✅ Satellite overlay model loaded (OBJ only, no materials)');
        },
        undefined,
        (error) => {
          console.error('Error loading satellite overlay:', error);
          // Create fallback geometric satellite
          createFallbackOverlaySatellite();
        }
      );
    };

    const createFallbackOverlaySatellite = () => {
      const fallbackGroup = new THREE.Group();
      
      // Slightly smaller geometric satellite
      const bodyGeometry = new THREE.BoxGeometry(0.45, 0.35, 0.35);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.7,
        roughness: 0.3,
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      fallbackGroup.add(body);
      
      const panelGeometry = new THREE.BoxGeometry(0.7, 0.015, 0.28);
      const panelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a2a4a,
        metalness: 0.3,
        roughness: 0.7,
      });
      
      const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
      leftPanel.position.x = -0.6;
      fallbackGroup.add(leftPanel);
      
      const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
      rightPanel.position.x = 0.6;
      fallbackGroup.add(rightPanel);
      
      satelliteOverlayModel = fallbackGroup;
      overlayScene.add(fallbackGroup);
      satelliteOverlayModelRef.current = fallbackGroup; // Store reference
      console.log('✅ Using fallback geometric satellite for overlay (files not found)');
    };

    // Animation loop for overlay
    let animationId: number;
    const animateOverlay = () => {
      animationId = requestAnimationFrame(animateOverlay);

      if (satelliteOverlayModel) {
        // More horizontal rotation, less vertical (slower)
        satelliteOverlayModel.rotation.y += 0.003; // Slower horizontal spin
        satelliteOverlayModel.rotation.x += 0.0002; // Much less vertical tilt
      }

      overlayCamera.lookAt(0, 0, 0);
      overlayRenderer.render(overlayScene, overlayCamera);
    };
    animateOverlay();

    return () => {
      cancelAnimationFrame(animationId);
      if (satelliteOverlayRef.current) {
        satelliteOverlayRef.current.removeChild(overlayRenderer.domElement);
      }
      overlayScene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  // Reset satellite rotation when switching between satellites
  useEffect(() => {
    const selectedSat = satellites.find(s => s.isSelected === true);
    const currentSelectedId = selectedSat?.id || null;
    
    // Check if we switched to a different satellite
    if (currentSelectedId && currentSelectedId !== selectedSatelliteIdRef.current) {
      console.log('🔄 Switching to different satellite, resetting rotation...');
      
      if (satelliteOverlayModelRef.current) {
        // Generate unique starting rotation based on satellite ID
        const hash = currentSelectedId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const uniqueRotationY = (hash % 360) * (Math.PI / 180);
        const uniqueRotationX = ((hash * 37) % 360) * (Math.PI / 180);
        const uniqueRotationZ = ((hash * 73) % 360) * (Math.PI / 180);
        
        // Reset to unique rotation for this satellite
        satelliteOverlayModelRef.current.rotation.set(uniqueRotationX, uniqueRotationY, uniqueRotationZ);
        console.log(`✨ New satellite rotation: x=${uniqueRotationX.toFixed(2)}, y=${uniqueRotationY.toFixed(2)}, z=${uniqueRotationZ.toFixed(2)}`);
      }
      
      selectedSatelliteIdRef.current = currentSelectedId;
    } else if (!currentSelectedId) {
      selectedSatelliteIdRef.current = null;
    }
  }, [satellites]);

  // Update satellites when data changes
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const currentScene = sceneRef.current;

    // Remove old satellites
    satelliteMeshesRef.current.forEach((mesh, id) => {
      if (!satellites.find(s => s.id === id)) {
        currentScene.remove(mesh);
        satelliteMeshesRef.current.delete(id);
      }
    });

    orbitLinesRef.current.forEach((line, id) => {
      if (!satellites.find(s => s.id === id)) {
        currentScene.remove(line);
        orbitLinesRef.current.delete(id);
      }
    });

    // Add/update satellites
    satellites.forEach((sat) => {
      let mesh = satelliteMeshesRef.current.get(sat.id);
      
      if (!mesh) {
        // Create new satellite - low poly crystal/diamond shape
        const geometry = new THREE.OctahedronGeometry(120, 0);
        const material = new THREE.MeshStandardMaterial({ 
          color: sat.color,
          emissive: sat.color,
          emissiveIntensity: 0.8,
          metalness: 0.7,
          roughness: 0.3,
          flatShading: true
        });
        mesh = new THREE.Mesh(geometry, material);
        
        // Add point light to satellite for glow effect
        const pointLight = new THREE.PointLight(sat.color, 0.5, 1000);
        mesh.add(pointLight);
        
        currentScene.add(mesh);
        satelliteMeshesRef.current.set(sat.id, mesh);

        // Create orbit line - lower resolution for performance
        const orbitPoints = [];
        const orbitRadius = 6371 + sat.position.alt;
        for (let i = 0; i <= 32; i++) { // Reduced from 64 to 32
          const angle = (i / 32) * Math.PI * 2;
          orbitPoints.push(new THREE.Vector3(
            orbitRadius * Math.cos(angle),
            0,
            orbitRadius * Math.sin(angle)
          ));
        }
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const orbitMaterial = new THREE.LineBasicMaterial({ 
          color: sat.color,
          transparent: true,
          opacity: 0.25,
          linewidth: 2
        });
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        currentScene.add(orbitLine);
        orbitLinesRef.current.set(sat.id, orbitLine);
      }

      // Update position using cartesian coordinates from backend
      if (sat.position.x !== undefined) {
        mesh.position.set(sat.position.x, sat.position.y, sat.position.z);
      } else {
        // Fallback to lat/lon conversion if cartesian not available
        const lat = sat.position.lat * (Math.PI / 180);
        const lon = sat.position.lon * (Math.PI / 180);
        const radius = 6371 + sat.position.alt;
        
        // Scale down the altitude to make satellites more visible and closer to Earth
        const scaledRadius = 6371 + (sat.position.alt * 0.1); // Scale altitude by 0.1
        
        mesh.position.x = scaledRadius * Math.cos(lat) * Math.cos(lon);
        mesh.position.y = scaledRadius * Math.sin(lat);
        mesh.position.z = scaledRadius * Math.cos(lat) * Math.sin(lon);
      }

      // Update color based on threat level
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (sat.threatLevel === 'CRITICAL') {
        material.color.setHex(0xff0000);
        material.emissive.setHex(0xff0000);
      } else if (sat.threatLevel === 'HIGH') {
        material.color.setHex(0xff8800);
        material.emissive.setHex(0xff8800);
      } else {
        material.color.set(sat.color);
        material.emissive.set(sat.color);
      }
    });

    // Handle selected satellite visualization
    const selectedSat = satellites.find(s => s.isSelected === true);
    const mainScene = sceneRef.current;
    
    if (selectedSat && selectedSat.position && selectedSat.position.x !== undefined && 
        selectionRingRef.current && connectionLineRef.current && satelliteModelRef.current && 
        mainScene && earthGroupRef.current && cameraRef.current) {
      
      console.log('Flying to satellite:', selectedSat.name);
      console.log('Position:', selectedSat.position);
      
      // Get the satellite's position vector
      const satPos = new THREE.Vector3(
        selectedSat.position.x,
        selectedSat.position.y,
        selectedSat.position.z
      );
      
      // Show selection ring around satellite at its ACTUAL orbital position
      selectionRingRef.current.visible = true;
      selectionRingRef.current.position.copy(satPos);
      
      // Hide the green connection line
      connectionLineRef.current.visible = false;
      
      // Get unique camera angle for this specific satellite (ORIGINAL BEHAVIOR)
      const { angleVariation, verticalVariation } = getCameraAngleForSatellite(selectedSat.id);
      
      // ORIGINAL: Animate camera to "fly to" the satellite with unique angle per satellite
      // Position camera at a varied angle to see both Earth and satellite
      const cameraDistance = satPos.length() * 1.4; // 1.4x the satellite distance
      const baseCameraOffset = satPos.clone().normalize().multiplyScalar(cameraDistance);
      
      // Apply unique rotation based on satellite ID (ORIGINAL)
      const rotatedOffset = new THREE.Vector3(
        baseCameraOffset.x * Math.cos(angleVariation) - baseCameraOffset.z * Math.sin(angleVariation),
        baseCameraOffset.y + satPos.length() * (0.3 + Math.sin(verticalVariation) * 0.2), // Vary vertical offset
        baseCameraOffset.x * Math.sin(angleVariation) + baseCameraOffset.z * Math.cos(angleVariation)
      );
      
      targetCameraPosition.current = {
        x: rotatedOffset.x,
        y: rotatedOffset.y,
        z: rotatedOffset.z
      };
      
      // ORIGINAL: ROTATE GLOBE TO SHOW SATELLITE LOCATION (with slight variation per satellite)
      const targetLat = selectedSat.position.lat * (Math.PI / 180);
      const targetLon = selectedSat.position.lon * (Math.PI / 180);
      
      // Add slight rotation variation based on satellite (ORIGINAL)
      earthGroupRef.current.rotation.y = -targetLon + (angleVariation * 0.1);
      earthGroupRef.current.rotation.x = -targetLat * 0.5 + (verticalVariation * 0.1);
      
      // Show 3D satellite indicator hovering in CENTER of graphic screen
      // This is ONLY visible when a satellite is selected from the list
      // Position is fixed at center - Earth zoom/rotation happens in background
      satelliteModelRef.current.visible = true;
      satelliteModelRef.current.position.set(0, 0, 7000); // Lower position for better visibility
      
      console.log('✅ Satellite indicator visible at center (0, 0, 7000)');
      
      console.log('Camera flying to:', rotatedOffset);
      console.log('Earth rotated to:', -targetLon, -targetLat * 0.5);
      
    } else {
      // NO satellite selected from list - HIDE everything and zoom out
      if (selectionRingRef.current && connectionLineRef.current && satelliteModelRef.current) {
        selectionRingRef.current.visible = false;
        connectionLineRef.current.visible = false;
        
        // HIDE the 3D satellite indicator (only visible when item is selected)
        satelliteModelRef.current.visible = false;
        
        // Reset camera to default position - ZOOM BACK OUT (background animation)
        targetCameraPosition.current = { x: 0, y: 0, z: 25000 };
        
        console.log('❌ No satellite selected - hiding indicator, zooming out');
      }
    }

  }, [satellites]);

  if (error) {
    return (
      <div 
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'radial-gradient(circle at center, #000814 0%, #000000 100%)',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ff6b6b'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <div>3D Visualization Error</div>
          <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
            WebGL may not be supported
          </div>
        </div>
      </div>
    );
  }

  // Check if any satellite is selected
  const isAnySatelliteSelected = satellites.some(s => s.isSelected === true);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Layer 1: Earth 3D Canvas (Background) */}
      <div 
        ref={containerRef} 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%', 
          height: '100%',
          background: 'radial-gradient(circle at center, #000814 0%, #000000 100%)',
          borderRadius: '12px',
          overflow: 'hidden',
          zIndex: 1,
        }} 
      />
      
      {/* Layer 2: Satellite 3D Canvas (Foreground Overlay) - ALWAYS exists, just hidden */}
      <div 
        ref={satelliteOverlayRef}
        style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 1000,
          filter: 'drop-shadow(0 0 50px rgba(102, 126, 234, 1)) drop-shadow(0 0 80px rgba(102, 126, 234, 0.8)) drop-shadow(0 0 120px rgba(102, 126, 234, 0.6))',
          animation: 'satelliteGlowPulse 2s ease-in-out infinite',
          display: isAnySatelliteSelected ? 'block' : 'none', // Show/hide based on selection
        }}
      />
      
      {/* CSS Animation for pulsing glow */}
      <style>{`
        @keyframes satelliteGlowPulse {
          0%, 100% {
            filter: drop-shadow(0 0 50px rgba(102, 126, 234, 1)) drop-shadow(0 0 80px rgba(102, 126, 234, 0.8)) drop-shadow(0 0 120px rgba(102, 126, 234, 0.6));
          }
          50% {
            filter: drop-shadow(0 0 70px rgba(102, 126, 234, 1)) drop-shadow(0 0 110px rgba(150, 170, 255, 0.9)) drop-shadow(0 0 160px rgba(102, 126, 234, 0.8));
          }
        }
      `}</style>
    </div>
  );
};

export default EarthVisualization;

