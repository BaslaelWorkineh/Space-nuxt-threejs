// composables/useSpaceScene.ts
import * as THREE from 'three';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

let labelRenderer: CSS2DRenderer;
export function useSpaceScene() {
  const containerRef = ref<HTMLDivElement | null>(null);
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let loader: GLTFLoader;
  
  let stars: THREE.Points;
  let sun: THREE.Mesh;
  let planets: { mesh: THREE.Mesh; orbitRadius: number; speed: number; name: string }[] = [];
  let orbits: THREE.Line[] = [];
  
  // For hover interactions
  let raycaster: THREE.Raycaster;
  let mouse: THREE.Vector2;
  let INTERSECTED: THREE.Mesh | null = null;
  
  // Tooltip element
  const tooltip = ref<HTMLDivElement | null>(null);

  const init = () => {
    if (!containerRef.value) return;

        // Initialize CSS2DRenderer for labels
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    containerRef.value.appendChild(labelRenderer.domElement);
    
    // Initialize Raycaster and mouse vector
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Scene setup
    scene = new THREE.Scene();

    // Camera setup
    camera = new THREE.PerspectiveCamera(
      60,
      containerRef.value.clientWidth / containerRef.value.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 50, 150);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.value.appendChild(renderer.domElement);

    // OrbitControls setup
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 500;
    controls.minDistance = 20;

    // GLTFLoader setup
    loader = new GLTFLoader();

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);

    // Sun (light source and mesh)
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    sun = new THREE.Mesh(sunGeometry, sunMaterial);

    const sunLight = new THREE.PointLight(0xffcc00, 2, 300);
    sun.add(sunLight);
    scene.add(sun);

    // Create stars
    createStars();

    // Create planets
    createPlanets();
    // makePlanetsMoreVisible();
    // Add satellites, people, and alien ships
    createSatellites();
    createPeople();
    createAlienShips();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.value) return;
      camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Mouse move listener for hover
    window.addEventListener('mousemove', onMouseMove, false);

    // Create tooltip element
    createTooltip();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate planets around their orbits
      planets.forEach((planet) => {
        const time = Date.now() * 0.001;
        const angle = time * planet.speed;

        planet.mesh.position.x = Math.cos(angle) * planet.orbitRadius;
        planet.mesh.position.z = Math.sin(angle) * planet.orbitRadius;
        planet.mesh.rotation.y += 0.01; // Planet self-rotation
      });

      // Rotate stars
      if (stars) stars.rotation.y += 0.0002;

      // Update controls
      controls.update();

      // Render the scene
      renderer.render(scene, camera);

      // Handle hover interactions
      handleHover();
    };
    animate();
  };

  // const makePlanetsMoreVisible = () => {
  //   planets.forEach((planet) => {
  //     const material = planet.mesh.material as THREE.MeshStandardMaterial;
  //     // Set a brighter emissive color
  //     material.emissive = new THREE.Color(planet.mesh.material.color);
  //     material.emissiveIntensity = 0.5;
  
  //     // Optionally, adjust the base color for better contrast
  //     material.color = new THREE.Color(material.color.getHex()).offsetHSL(0, 0.5, 0.2);
  //   });
  // };
  

  const createStars = () => {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 10000;
    const positions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 2000;
      positions[i + 1] = (Math.random() - 0.5) * 2000;
      positions[i + 2] = (Math.random() - 0.5) * 2000;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.7,
      sizeAttenuation: true,
    });

    stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
  };

  const createPlanets = () => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setPath('/textures/'); // Base path for all textures

    const planetData = [
        { texture: 'mercury.jpg', size: 1, orbitRadius: 12, speed: 0.1, name: 'Mercury' },
        { texture: 'venus.jpg', size: 1.5, orbitRadius: 18, speed: 0.07, name: 'Venus' },
        { texture: 'earth.png', size: 2, orbitRadius: 25, speed: 0.05, name: 'Earth' },
        { texture: 'mars.png', size: 1.2, orbitRadius: 35, speed: 0.03, name: 'Mars' },
        { texture: 'jupiter.jpg', size: 3.5, orbitRadius: 50, speed: 0.02, name: 'Jupiter' },
        {
            texture: 'saturn.jpg',
            size: 3,
            orbitRadius: 70,
            speed: 0.015,
            name: 'Saturn',
            hasRings: true,
            ringsInnerRadius: 3.5,
            ringsOuterRadius: 7,
        },
        { texture: 'uranus.png', size: 2.5, orbitRadius: 90, speed: 0.01, name: 'Uranus' },
        { texture: 'neptune.jpg', size: 2, orbitRadius: 110, speed: 0.008, name: 'Neptune' },
    ];

    planetData.forEach((data) => {
        // Load the planet texture
        const texture = textureLoader.load(
            data.texture,
            undefined,
            undefined,
            (error) => console.error(`Error loading texture ${data.texture}:`, error)
        );

        // Create planet geometry and material
        const geometry = new THREE.SphereGeometry(data.size, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
        });

        const planet = new THREE.Mesh(geometry, material);
        planet.name = data.name;

        // Create rings for Saturn
        if (data.hasRings) {
            const ringsGeometry = new THREE.RingGeometry(
                data.ringsInnerRadius,
                data.ringsOuterRadius,
                64
            );
            const ringsMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.6,
            });
            const rings = new THREE.Mesh(ringsGeometry, ringsMaterial);
            rings.rotation.x = Math.PI / 2; // Align the rings to the planet's equator
            planet.add(rings);

            // Add random rocks to the rings
            const rockCount = 1000;
            const rocks = new THREE.Group();
            for (let i = 0; i < rockCount; i++) {
                const radius = data.ringsInnerRadius +
                    Math.random() * (data.ringsOuterRadius - data.ringsInnerRadius);
                const angle = Math.random() * Math.PI * 2;
                const rockGeometry = new THREE.SphereGeometry(0.02, 4, 4);
                const rockMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
                const rock = new THREE.Mesh(rockGeometry, rockMaterial);
                rock.position.set(
                    Math.cos(angle) * radius,
                    0,
                    Math.sin(angle) * radius
                );
                rocks.add(rock);
            }
            rocks.rotation.x = Math.PI / 2; // Align the rocks with the rings
            planet.add(rocks);
        }

        // Create orbit
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitPoints = [];
        const segments = 128;
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            orbitPoints.push(
                Math.cos(theta) * data.orbitRadius,
                0,
                Math.sin(theta) * data.orbitRadius
            );
        }
        orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
        const orbitMaterial = new THREE.LineBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.5,
        });
        const orbit = new THREE.Line(orbitGeometry, orbitMaterial);

        // Store planet and orbit
        planets.push({
            mesh: planet,
            orbitRadius: data.orbitRadius,
            speed: data.speed,
            name: data.name,
        });
        orbits.push(orbit);

        // Add planet and orbit to the scene
        scene.add(planet);
        scene.add(orbit);
    });
};

  

  const createSatellites = () => {
    // Example: Add satellites orbiting Earth (index 2 in planets array)
    const earth = planets.find(p => p.name === 'Earth');
    if (!earth) return;

    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 1);
      const material = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.1 });
      const satellite = new THREE.Mesh(geometry, material);
      satellite.name = `Satellite ${i + 1}`;
      scene.add(satellite);

      // Assign orbit radius relative to Earth
      satellite.userData = {
        orbitRadius: earth.orbitRadius + 3 + i * 2,
        speed: earth.speed * 2 + i * 0.01,
      };
    }
  };

  const createPeople = () => {
    loader.load('/models/astronaut.glb', (gltf) => {
      for (let i = 0; i < 2; i++) {
        const person = gltf.scene.clone();
        person.scale.set(1, 1, 1);
        person.position.set(10 + i * 5, 15, 0);
        person.name = `Astronaut ${i + 1}`;
        scene.add(person);
      }
    });
  };

  const createAlienShips = () => {
    loader.load('/models/ufo.glb', (gltf) => {
      for (let i = 0; i < 2; i++) {
        const ship = gltf.scene.clone();
        ship.scale.set(2, 2, 2);
        ship.position.set(0, 20, i * 30);
        ship.name = `Alien Ship ${i + 1}`;
        scene.add(ship);
      }
    });
  };

  // Tooltip creation
  const createTooltip = () => {
    const tooltipDiv = document.createElement('div');
    tooltipDiv.style.position = 'absolute';
    tooltipDiv.style.padding = '5px 10px';
    tooltipDiv.style.background = 'rgba(0, 0, 0, 0.7)';
    tooltipDiv.style.color = '#fff';
    tooltipDiv.style.borderRadius = '4px';
    tooltipDiv.style.pointerEvents = 'none';
    tooltipDiv.style.display = 'none';
    tooltipDiv.style.transform = 'translate(-50%, -100%)';
    tooltipDiv.style.whiteSpace = 'nowrap';
    tooltipDiv.style.fontSize = '14px';
    document.body.appendChild(tooltipDiv);
    tooltip.value = tooltipDiv;
  };

  // Mouse move handler
  const onMouseMove = (event: MouseEvent) => {
    if (!containerRef.value) return;

    const rect = containerRef.value.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update tooltip position
    if (tooltip.value) {
      tooltip.value.style.left = `${event.clientX}px`;
      tooltip.value.style.top = `${event.clientY}px`;
    }
  };

  // Handle hover interactions
  const handleHover = () => {
    raycaster.setFromCamera(mouse, camera);
    const clickableObjects = planets.map(p => p.mesh).concat(...scene.children.filter(obj => obj.name.startsWith('Satellite') || obj.name.startsWith('Astronaut') || obj.name.startsWith('Alien Ship')));
    const intersects = raycaster.intersectObjects(clickableObjects, true);

    if (intersects.length > 0) {
      const firstIntersect = intersects[0].object as THREE.Mesh;

      if (INTERSECTED !== firstIntersect) {
        INTERSECTED = firstIntersect;

        // Update tooltip
        if (tooltip.value) {
          tooltip.value.innerHTML = firstIntersect.name;
          tooltip.value.style.display = 'block';
        }
      }
    } else {
      INTERSECTED = null;

      // Hide tooltip
      if (tooltip.value) {
        tooltip.value.style.display = 'none';
      }
    }
  };

  onMounted(() => {
    init();
  });

  onBeforeUnmount(() => {
    if (renderer) {
      renderer.dispose();
      controls.dispose();
      window.removeEventListener('resize', () => {});
      window.removeEventListener('mousemove', onMouseMove, false);
    }
    if (tooltip.value) {
      document.body.removeChild(tooltip.value);
    }
  });

  return {
    containerRef,
  };
}
