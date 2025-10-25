import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

const ThreeBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup with black background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    containerRef.current.appendChild(renderer.domElement);

    // Create starfield with WHITE particles - positioned FAR in the background in ALL 360 degrees
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 5000; // More stars to ensure full coverage
    const posArray = new Float32Array(particlesCount * 3);
    
    // Fill with random stars in a COMPLETE SPHERE around the camera - FULL 360 DEGREES
    // Stars positioned FAR BEHIND satellites (satellites at z: -120 to -265)
    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Use spherical coordinates for even distribution in ALL directions
      const radius = 300 + Math.random() * 200; // Distance from center: 300-500 (very far background, behind satellites)
      const theta = Math.random() * Math.PI * 2; // Horizontal angle: FULL 0-360 degrees
      const phi = Math.random() * Math.PI * 2; // Vertical angle: FULL 0-360 degrees (not limited to 180)
      
      // Convert spherical to Cartesian coordinates - FULL SPHERE
      posArray[i] = radius * Math.sin(phi) * Math.cos(theta); // X
      posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta); // Y
      posArray[i + 2] = radius * Math.cos(phi); // Z (can be positive or negative - full sphere)
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xffffff, // White particles
      size: 0.35, // Increased size by 40% (0.25 * 1.4 = 0.35)
      transparent: true,
      opacity: 0.9 + Math.random() * 0.1, // Increased opacity for more luminosity
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Add lighting for the ISS model
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);

    // Loaders
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    loader.setDRACOLoader(dracoLoader);

    // Load ISS Model using OBJ/MTL loaders
    let iss: THREE.Group;
    const mtlLoader = new MTLLoader();
    mtlLoader.load(
      '/models/iss.mtl',
      (materials) => {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load(
          '/models/iss.obj',
          (object) => {
            iss = object;
            // Bigger size for ISS
            iss.scale.set(0.08, 0.08, 0.08);
            // Position in the center of the screen
            iss.position.set(0, 0, 0);
            scene.add(iss);
            console.log('ISS model loaded successfully', iss);
          },
          (progress) => {
            console.log('Loading ISS OBJ:', (progress.loaded / progress.total * 100) + '% loaded');
          },
          (error) => {
            console.error('Error loading ISS OBJ:', error);
          }
        );
      },
      (progress) => {
        console.log('Loading ISS MTL:', (progress.loaded / progress.total * 100) + '% loaded');
      },
      (error) => {
        console.error('Error loading ISS MTL:', error);
      }
    );

    // Load Satellite Models using OBJ loader
    const satellites: THREE.Group[] = [];
    const satelliteCount = 18;
    const satelliteModels = [
      '/models/satellite1.obj',
      '/models/satellite2.obj',
      '/models/satellite3.obj',
      '/models/satellite4.obj',
      '/models/satellite5.obj',
      '/models/1236 Satellite.obj',
      '/models/PUSHILIN_satellite.obj',
      '/models/Satelite.obj',
      '/models/Satellite(1).obj',
    ];

    const objLoader = new OBJLoader();
    
    for (let i = 0; i < satelliteCount; i++) {
      // Generate a NEW random index for each satellite iteration
      const randomIndex = Math.floor(Math.random() * satelliteModels.length);
      const modelPath = satelliteModels[randomIndex];
      const mtlPath = modelPath.replace('.obj', '.mtl');
      
      console.log(`Loading satellite ${i + 1} with model: ${modelPath} (index ${randomIndex})`);
      
      // Load MTL first to preserve original colors
      const mtlLoader = new MTLLoader();
      mtlLoader.load(
        mtlPath,
        (materials) => {
          materials.preload();
          const objLoaderWithMaterial = new OBJLoader();
          objLoaderWithMaterial.setMaterials(materials);
          objLoaderWithMaterial.load(
            modelPath,
            (object) => {
              const satellite = object;
              
              // Make all satellites uniformly smaller
              satellite.scale.set(0.008, 0.008, 0.008);

              // RANDOM direction for each satellite on EVERY page refresh
              const direction = Math.random() > 0.5 ? 1 : -1; // 1 = move right (left to right), -1 = move left (right to left)

              // Stagger satellites at different distances for continuous appearance
              // Distribute them so new ones keep appearing over time
              const distanceGroup = i % 5; // Create 5 distance groups
              const startDistance = 40 + (distanceGroup * 20); // 40, 60, 80, 100, 120
              satellite.position.x = direction > 0 ? -startDistance : startDistance;
              
              // Spread satellites across MUCH MORE vertical space - far apart from each other
              // Each satellite gets a unique Y position based on its index
              satellite.position.y = -15 + (i * 1.8); // Spread from -15 to +18 across all satellites
              
              // Z position MUCH FURTHER BEHIND ISS at varying depths - ISS is at z=0, satellites far behind
              // Spread satellites across different depth layers to avoid interception
              const depthLayer = i % 6; // 6 depth layers
              satellite.position.z = -120 - (depthLayer * 25) - Math.random() * 20; // Layers: -120 to -140, -145 to -165, -170 to -190, etc.

              satellite.userData = {
                speed: 0.02 + Math.random() * 0.02, // VERY fast so they appear quickly
                direction: direction, // STRICTLY horizontal direction only
                fixedY: satellite.position.y, // Store the fixed Y position - NEVER CHANGES during movement
                fixedZ: satellite.position.z, // Store the fixed Z position - NEVER CHANGES during movement
                rotationSpeedX: (Math.random() - 0.5) * 0.003, // Random rotation
                rotationSpeedY: (Math.random() - 0.5) * 0.004, // Random rotation
                rotationSpeedZ: (Math.random() - 0.5) * 0.003, // Random rotation
                startDelay: 0, // ALL satellites appear INSTANTLY - NO DELAY
                startTime: Date.now(),
                visible: false,
              };

              satellites.push(satellite);
              scene.add(satellite);
              satellite.visible = false; // Start invisible
              console.log(`Satellite ${i + 1} loaded from ${modelPath} with materials`);
            },
            (progress) => {
              console.log(`Loading satellite ${i + 1}:`, (progress.loaded / progress.total * 100) + '% loaded');
            },
            (error) => {
              console.error(`Error loading satellite ${modelPath}:`, error);
            }
          );
        },
        undefined,
        (error) => {
          console.error(`Error loading materials for ${mtlPath}:`, error);
          // Fallback: load without materials if MTL fails
          objLoader.load(modelPath, (object) => {
            const satellite = object;
            satellite.scale.set(0.008, 0.008, 0.008);
            
            const direction = Math.random() > 0.5 ? 1 : -1;
            const distanceGroup = i % 5;
            const startDistance = 40 + (distanceGroup * 20);
            satellite.position.x = direction > 0 ? -startDistance : startDistance;
            satellite.position.y = -15 + (i * 1.8);
            const depthLayer = i % 6;
            satellite.position.z = -120 - (depthLayer * 25) - Math.random() * 20;
            
            satellite.userData = {
              speed: 0.02 + Math.random() * 0.02,
              direction: direction,
              fixedY: satellite.position.y,
              fixedZ: satellite.position.z,
              rotationSpeedX: (Math.random() - 0.5) * 0.003,
              rotationSpeedY: (Math.random() - 0.5) * 0.004,
              rotationSpeedZ: (Math.random() - 0.5) * 0.003,
              startDelay: 0,
              startTime: Date.now(),
              visible: false,
            };
            satellites.push(satellite);
            scene.add(satellite);
            satellite.visible = false;
            console.log(`Satellite ${i + 1} loaded from ${modelPath} without materials`);
          });
        }
      );
    }

    camera.position.z = 5;

    // Interactive ISS control state
    let isInteractive = false;
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let manualRotationX = 0;
    let manualRotationY = 0;

    // Intersection Observer for #explore-iss section
    const exploreSection = document.querySelector('#explore-iss');
    if (exploreSection) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isInteractive = entry.isIntersecting && entry.intersectionRatio > 0.5;
            if (!isInteractive) {
              isDragging = false;
            }
          });
        },
        { threshold: [0, 0.5, 1] }
      );
      observer.observe(exploreSection);
    }

    // Mouse movement for camera parallax
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

      // ISS drag controls when interactive
      if (isInteractive && isDragging) {
        const deltaX = event.clientX - previousMouseX;
        const deltaY = event.clientY - previousMouseY;
        
        manualRotationY += deltaX * 0.01;
        manualRotationX += deltaY * 0.01;
        
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Mouse down/up for ISS drag control
    const handleMouseDown = (event: MouseEvent) => {
      if (isInteractive) {
        isDragging = true;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
      }
    };
    const handleMouseUp = () => {
      isDragging = false;
    };
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Keyboard controls for ISS
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isInteractive) return;
      
      const rotationSpeed = 0.05;
      switch (event.key) {
        case 'ArrowLeft':
          manualRotationY -= rotationSpeed;
          break;
        case 'ArrowRight':
          manualRotationY += rotationSpeed;
          break;
        case 'ArrowUp':
          manualRotationX -= rotationSpeed;
          break;
        case 'ArrowDown':
          manualRotationX += rotationSpeed;
          break;
        case 'r':
        case 'R':
          manualRotationX = 0;
          manualRotationY = 0;
          if (iss) {
            iss.rotation.x = 0;
            iss.rotation.y = 0;
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Stars rotate very slowly - full 360 degree sphere means they never run out
      particlesMesh.rotation.y += 0.00008;

      // ISS rotation - auto-rotate or manual control based on interactive state
      if (iss) {
        if (isInteractive) {
          // Manual control mode - apply user's rotation adjustments
          iss.rotation.y = manualRotationY;
          iss.rotation.x = manualRotationX;
        } else {
          // Auto-rotation mode - slow continuous rotation (40% slower)
          iss.rotation.y += 0.0006; // Slower rotation on Y axis
          iss.rotation.x += 0.00018; // Very slight rotation on X axis
        }
        // Position stays fixed at (0, 0, 0) - no movement
      }

      satellites.forEach((satellite) => {
        // Check if satellite should become visible based on delay
        if (!satellite.userData.visible) {
          const elapsed = Date.now() - satellite.userData.startTime;
          if (elapsed > satellite.userData.startDelay) {
            satellite.visible = true;
            satellite.userData.visible = true;
          } else {
            return; // Skip this satellite until it's time to show
          }
        }

        // Move satellite ONLY horizontally (left to right or right to left)
        // ONLY X position changes - Y and Z are ABSOLUTELY LOCKED
        satellite.position.x += satellite.userData.speed * satellite.userData.direction;
        
        // FORCE Y position to stay FIXED - absolutely no vertical movement
        satellite.position.y = satellite.userData.fixedY;
        
        // FORCE Z position to stay FIXED - absolutely no depth movement
        satellite.position.z = satellite.userData.fixedZ;
        
        // Rotate satellite (rotation only, no position change)
        satellite.rotation.x += satellite.userData.rotationSpeedX;
        satellite.rotation.y += satellite.userData.rotationSpeedY;
        satellite.rotation.z += satellite.userData.rotationSpeedZ;

        // Wrap around: if satellite goes off-screen, restart from opposite side with NEW random position
        if (satellite.userData.direction > 0 && satellite.position.x > 120) {
          satellite.position.x = -120; // Start from far left
          // NEW random Y and Z for variety on each loop - spread FAR APART vertically
          satellite.userData.fixedY = -15 + Math.random() * 30; // Random Y from -15 to +15 (wide spread)
          const randomDepthLayer = Math.floor(Math.random() * 6);
          satellite.userData.fixedZ = -120 - (randomDepthLayer * 25) - Math.random() * 20; // Far behind ISS
        } else if (satellite.userData.direction < 0 && satellite.position.x < -120) {
          satellite.position.x = 120; // Start from far right
          // NEW random Y and Z for variety on each loop - spread FAR APART vertically
          satellite.userData.fixedY = -15 + Math.random() * 30; // Random Y from -15 to +15 (wide spread)
          const randomDepthLayer = Math.floor(Math.random() * 6);
          satellite.userData.fixedZ = -120 - (randomDepthLayer * 25) - Math.random() * 20; // Far behind ISS
        }
      });

      // Minimal camera parallax - only very slight movement to reduce circling appearance
      camera.position.x += (mouseX * 0.1 - camera.position.x) * 0.003;
      camera.position.y += (mouseY * 0.1 - camera.position.y) * 0.003;
      // Keep camera centered on ISS
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
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

  // Don't render on Mission Control page
  if (location.pathname === '/mission-control') {
    return null;
  }

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: -1,
        filter: location.pathname !== '/' ? 'blur(4px)' : 'blur(0px)'
      }} 
    />
  );
};

export default ThreeBackground;
