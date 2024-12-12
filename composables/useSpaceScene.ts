import * as THREE from 'three'
import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useSpaceScene() {
  const containerRef = ref<HTMLDivElement | null>(null)
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let stars: THREE.Points
  let planets: THREE.Mesh[] = []
  let orbits: THREE.Line[] = []

  const init = () => {
    if (!containerRef.value) return

    // Scene setup
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(
      60,
      containerRef.value.clientWidth / containerRef.value.clientHeight,
      0.1,
      1000
    )
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.value.appendChild(renderer.domElement)

    // Camera position
    camera.position.z = 50
    camera.position.y = 10

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x222222)
    scene.add(ambientLight)

    // Add directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 3, 5)
    scene.add(directionalLight)

    // Create stars
    createStars()

    // Create planets
    createPlanets()

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.value) return
      camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      // Rotate planets
      planets.forEach((planet, index) => {
        planet.rotation.y += 0.01 / (index + 1)
        
        // Orbital movement
        const time = Date.now() * 0.001
        const radius = (index + 1) * 8
        planet.position.x = Math.cos(time * 0.5 / (index + 1)) * radius
        planet.position.z = Math.sin(time * 0.5 / (index + 1)) * radius
      })

      // Rotate stars slightly
      if (stars) {
        stars.rotation.y += 0.0002
      }

      renderer.render(scene, camera)
    }
    animate()
  }

  const createStars = () => {
    const starsGeometry = new THREE.BufferGeometry()
    const starsCount = 10000
    const positions = new Float32Array(starsCount * 3)

    for (let i = 0; i < starsCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 2000
      positions[i + 1] = (Math.random() - 0.5) * 2000
      positions[i + 2] = (Math.random() - 0.5) * 2000
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.7,
      sizeAttenuation: true
    })

    stars = new THREE.Points(starsGeometry, starsMaterial)
    scene.add(stars)
  }

  const createPlanets = () => {
    const planetColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44]

    planetColors.forEach((color, index) => {
      // Create planet
      const geometry = new THREE.SphereGeometry(1.5 - index * 0.2)
      const material = new THREE.MeshPhongMaterial({
        color: color,
        shininess: 25,
        bumpScale: 0.05,
      })
      const planet = new THREE.Mesh(geometry, material)

      // Create orbit
      const orbitGeometry = new THREE.BufferGeometry()
      const orbitPoints = []
      const segments = 128
      const radius = (index + 1) * 8

      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2
        orbitPoints.push(
          Math.cos(theta) * radius,
          0,
          Math.sin(theta) * radius
        )
      }

      orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3))
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.3
      })
      const orbit = new THREE.Line(orbitGeometry, orbitMaterial)

      planets.push(planet)
      orbits.push(orbit)
      scene.add(planet)
      scene.add(orbit)
    })
  }

  onMounted(() => {
    init()
  })

  onBeforeUnmount(() => {
    if (renderer) {
      renderer.dispose()
      window.removeEventListener('resize', () => {})
    }
  })

  return {
    containerRef
  }
}