import * as THREE from 'three';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export function useSpaceScene() {
  const containerRef = ref<HTMLDivElement | null>(null);
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let stars: THREE.Points;
  let sun: THREE.Mesh;
  let planets: { mesh: THREE.Mesh; orbitRadius: number; speed: number }[] = [];
  let orbits: THREE.Line[] = [];

  const init = () => {
    if (!containerRef.value) return;

    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      60,
      containerRef.value.clientWidth / containerRef.value.clientHeight,
      0.1,
      2000
    );

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.value.appendChild(renderer.domElement);

    // Camera position
    camera.position.set(0, 50, 150);

    // OrbitControls setup
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth navigation
    controls.dampingFactor = 0.05;
    controls.maxDistance = 500; // Maximum zoom-out distance
    controls.minDistance = 20; // Minimum zoom-in distance

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);

    // Sun (light source and mesh)
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00, emissive: 0xffcc00 });
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    sun = new THREE.Mesh(sunGeometry, sunMaterial);

    const sunLight = new THREE.PointLight(0xffcc00, 2, 300);
    sun.add(sunLight);
    scene.add(sun);

    // Create stars
    createStars();

    // Create planets
    createPlanets();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.value) return;
      camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
    };
    window.addEventListener('resize', handleResize);

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

      controls.update(); // Update the controls
      renderer.render(scene, camera);
    };
    animate();
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
    const planetData = [
      { color: 0xaaaaaa, size: 1, orbitRadius: 12, speed: 0.1 }, // Mercury
      { color: 0xff7733, size: 1.5, orbitRadius: 18, speed: 0.07 }, // Venus
      { color: 0x44aaff, size: 2, orbitRadius: 25, speed: 0.05 }, // Earth
      { color: 0xff4422, size: 1.2, orbitRadius: 35, speed: 0.03 }, // Mars
      { color: 0xffcc88, size: 3.5, orbitRadius: 50, speed: 0.02 }, // Jupiter
      { color: 0xbbbbbb, size: 3, orbitRadius: 70, speed: 0.015 }, // Saturn
      { color: 0x88ccff, size: 2.5, orbitRadius: 90, speed: 0.01 }, // Uranus
      { color: 0x4444ff, size: 2, orbitRadius: 110, speed: 0.008 }, // Neptune
    ];

    planetData.forEach((data) => {
      // Planet
      const geometry = new THREE.SphereGeometry(data.size, 32, 32);
      const material = new THREE.MeshStandardMaterial({ color: data.color });
      const planet = new THREE.Mesh(geometry, material);

      // Orbit
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
      planets.push({ mesh: planet, orbitRadius: data.orbitRadius, speed: data.speed });
      orbits.push(orbit);

      // Add to scene
      scene.add(planet);
      scene.add(orbit);
    });
  };

  onMounted(() => {
    init();
  });

  onBeforeUnmount(() => {
    if (renderer) {
      renderer.dispose();
      controls.dispose(); // Clean up controls
      window.removeEventListener('resize', () => {});
    }
  });

  return {
    containerRef,
  };
}
