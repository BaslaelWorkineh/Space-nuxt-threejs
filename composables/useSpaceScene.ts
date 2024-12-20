// composables/useSpaceScene.ts
import * as THREE from "three";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer";

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
  let planets: {
    mesh: THREE.Mesh;
    orbitRadius: number;
    speed: number;
    name: string;
  }[] = [];
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
    labelRenderer.setSize(
      containerRef.value.clientWidth,
      containerRef.value.clientHeight
    );
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";
    labelRenderer.domElement.style.pointerEvents = "none";
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
    renderer.setSize(
      containerRef.value.clientWidth,
      containerRef.value.clientHeight
    );
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
    const textureLoader = new THREE.TextureLoader();
    const sunTexture = textureLoader.load("/textures/sun.jpg");
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    sun = new THREE.Mesh(sunGeometry, sunMaterial);

    const sunLight = new THREE.PointLight(0xffcc00, 2, 300);
    sun.add(sunLight);
    scene.add(sun);

    // Create stars
    createStars();
    createAsteroids();
createBlackHole();
fetchNasaData();
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
      camera.aspect =
        containerRef.value.clientWidth / containerRef.value.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.value.clientWidth,
        containerRef.value.clientHeight
      );
    };
    window.addEventListener("resize", handleResize);

    // Mouse move listener for hover
    window.addEventListener("mousemove", onMouseMove, false);

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

  const createAsteroids = () => {
    const asteroidCount = 50;
    const asteroids: THREE.Mesh[] = [];
  
    for (let i = 0; i < asteroidCount; i++) {
      const geometry = new THREE.SphereGeometry(0.5, 8, 8);
      const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const asteroid = new THREE.Mesh(geometry, material);
  
      asteroid.position.set(
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 1000
      );
  
      asteroids.push(asteroid);
      scene.add(asteroid);
    }
  
    // Animate asteroids
    const animateAsteroids = () => {
      asteroids.forEach((asteroid) => {
        asteroid.position.x += (Math.random() - 0.5) * 0.2;
        asteroid.position.y += (Math.random() - 0.5) * 0.2;
        asteroid.position.z += (Math.random() - 0.5) * 0.2;
      });
      requestAnimationFrame(animateAsteroids);
    };
    animateAsteroids();
  };
  
  const createBlackHole = () => {
    const geometry = new THREE.SphereGeometry(3, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const blackHole = new THREE.Mesh(geometry, material);
  
    blackHole.position.set(0, -100, -200);
    scene.add(blackHole);
  
    // Accretion disk
    const diskGeometry = new THREE.RingGeometry(5, 20, 64);
    const diskMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const accretionDisk = new THREE.Mesh(diskGeometry, diskMaterial);
    accretionDisk.rotation.x = Math.PI / 2;
    blackHole.add(accretionDisk);
  };

  const fetchNasaData = async () => {
    const apiKey = "NaGbRJ8hNaQHW9975uDd739PFb89aGs6ntgZzsk9"; // Replace with your NASA API key
    const response = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`
    );
    const data = await response.json();
  
    // Display the data in the tooltip or create an object with the APOD image
    if (data.url) {
      const textureLoader = new THREE.TextureLoader();
      const apodTexture = textureLoader.load(data.url);
      const apodMaterial = new THREE.MeshBasicMaterial({ map: apodTexture });
      const apodGeometry = new THREE.PlaneGeometry(20, 20);
      const apodPlane = new THREE.Mesh(apodGeometry, apodMaterial);
  
      apodPlane.position.set(0, 0, -100);
      scene.add(apodPlane);
    }
  };
  
  const createStars = () => {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 10000;
    const positions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 2000;
      positions[i + 1] = (Math.random() - 0.5) * 2000;
      positions[i + 2] = (Math.random() - 0.5) * 2000;
    }

    starsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

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
    textureLoader.setPath("/textures/"); // Base path for all textures
  
    const planetData = [
      {
        texture: "mercury.jpg",
        size: 1,
        orbitRadius: 12,
        speed: 0.1,
        name: "Mercury",
        info: "Mercury is the smallest planet and closest to the Sun."
      },
      {
        texture: "venus.jpg",
        size: 1.5,
        orbitRadius: 18,
        speed: 0.07,
        name: "Venus",
        info: "Venus has a thick atmosphere and is the hottest planet."
      },
      {
        texture: "earth.png",
        size: 2,
        orbitRadius: 25,
        speed: 0.05,
        name: "Earth",
        info: "Earth is the only known planet to support life."
      },
      {
        texture: "mars.png",
        size: 1.2,
        orbitRadius: 35,
        speed: 0.03,
        name: "Mars",
        info: "Mars is known as the Red Planet due to its iron oxide surface."
      },
      {
        texture: "jupiter.jpg",
        size: 3.5,
        orbitRadius: 50,
        speed: 0.02,
        name: "Jupiter",
        info: "Jupiter is the largest planet in the Solar System."
      },
      {
        texture: "saturn.jpg",
        size: 3,
        orbitRadius: 70,
        speed: 0.015,
        name: "Saturn",
        hasRings: true,
        ringsInnerRadius: 3.5,
        ringsOuterRadius: 7,
        info: "Saturn is famous for its extensive ring system."
      },
      {
        texture: "uranus.png",
        size: 2.5,
        orbitRadius: 90,
        speed: 0.01,
        name: "Uranus",
        info: "Uranus has a unique sideways rotation."
      },
      {
        texture: "neptune.jpg",
        size: 2,
        orbitRadius: 110,
        speed: 0.008,
        name: "Neptune",
        info: "Neptune is known for its strong winds and dark storms."
      },
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
  
      // Add informational tooltip for hover
      planet.userData.info = data.info;
  
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
          opacity: 0.4,
        });
        const rings = new THREE.Mesh(ringsGeometry, ringsMaterial);
        rings.rotation.x = Math.PI / 2; // Align the rings to the planet's equator
        planet.add(rings);
  
        // Add random rocks to the rings with slower rotation
        const rockCount = 1000;
        const rocks = new THREE.Group();
        for (let i = 0; i < rockCount; i++) {
          const radius =
            data.ringsInnerRadius +
            Math.random() * (data.ringsOuterRadius - data.ringsInnerRadius);
          const angle = Math.random() * Math.PI * 2; // Full circle, 0 to 2π
          const rockGeometry = new THREE.SphereGeometry(0.05, 8, 8);
          const rockMaterial = new THREE.MeshBasicMaterial({
            color: 0x694605, // Set color to #694605 (brownish)
            wireframe: false, // Optional: remove wireframe if needed
          });
          const rock = new THREE.Mesh(rockGeometry, rockMaterial);
  
          // Correct the positioning for a true circular formation
          rock.position.set(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius, // x position (horizontal)
            0 // z position (horizontal)
          );
  
          // Add the rock to the rocks group
          rocks.add(rock);
        }
  
        // Rotate the rocks group more slowly for Saturn
        rocks.rotation.x = Math.PI / 2;  // Align to horizontal ring formation
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
      orbitGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(orbitPoints, 3)
      );
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
  
    // Raycasting for hover interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.display = 'none';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px';
    tooltip.style.borderRadius = '5px';
    document.body.appendChild(tooltip);
  
    // Update the mouse position
    window.addEventListener('mousemove', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
  
    // Hover detection
    const onHover = (event) => {
      // Set raycaster direction from camera to mouse position
      raycaster.setFromCamera(mouse, camera);
  
      // Check for intersections with planets
      const intersects = raycaster.intersectObjects(planets.map(planet => planet.mesh));
      if (intersects.length > 0) {
        const planet = intersects[0].object;
        tooltip.style.display = 'block';
        tooltip.innerHTML = planet.userData.info;  // Display planet info
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
      } else {
        tooltip.style.display = 'none';
      }
    };
  
    // Animation loop to update hover
    function animate() {
      requestAnimationFrame(animate);
      window.addEventListener('mousemove', onHover);  // Add onHover here
      renderer.render(scene, camera);
    }
    animate();
  };
  
  const createSatellites = () => {
    // Example: Add satellites orbiting Earth (index 2 in planets array)
    const earth = planets.find((p) => p.name === "Earth");
    if (!earth) return;

    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 1);
      const material = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.5,
        roughness: 0.1,
      });
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
    loader.load("/models/astronaut.glb", (gltf) => {
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
    loader.load("/models/ufo.glb", (gltf) => {
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
    const tooltipDiv = document.createElement("div");
    tooltipDiv.style.position = "absolute";
    tooltipDiv.style.padding = "5px 10px";
    tooltipDiv.style.background = "rgba(0, 0, 0, 0.7)";
    tooltipDiv.style.color = "#fff";
    tooltipDiv.style.borderRadius = "4px";
    tooltipDiv.style.pointerEvents = "none";
    tooltipDiv.style.display = "none";
    tooltipDiv.style.transform = "translate(-50%, -100%)";
    tooltipDiv.style.whiteSpace = "nowrap";
    tooltipDiv.style.fontSize = "14px";
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
    const clickableObjects = planets
      .map((p) => p.mesh)
      .concat(
        ...scene.children.filter(
          (obj) =>
            obj.name.startsWith("Satellite") ||
            obj.name.startsWith("Astronaut") ||
            obj.name.startsWith("Alien Ship")
        )
      );
    const intersects = raycaster.intersectObjects(clickableObjects, true);

    if (intersects.length > 0) {
      const firstIntersect = intersects[0].object as THREE.Mesh;

      if (INTERSECTED !== firstIntersect) {
        INTERSECTED = firstIntersect;

        // Update tooltip
        if (tooltip.value) {
          tooltip.value.innerHTML = firstIntersect.name;
          tooltip.value.style.display = "block";
        }
      }
    } else {
      INTERSECTED = null;

      // Hide tooltip
      if (tooltip.value) {
        tooltip.value.style.display = "none";
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
      window.removeEventListener("resize", () => {});
      window.removeEventListener("mousemove", onMouseMove, false);
    }
    if (tooltip.value) {
      document.body.removeChild(tooltip.value);
    }
  });

  return {
    containerRef,
  };
}
