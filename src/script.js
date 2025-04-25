import * as THREE from 'three'
import GUI from 'lil-gui'
import { textureLoad } from 'three/tsl'

import gsap from 'gsap'


/**
 * Debug
 */
const gui = new GUI()

const parameters = {
    materialColor: '#ffeded'
}

gui
    .addColor(parameters, 'materialColor')
    .onChange(() => 
        {
            material.color.set(parameters.materialColor),
            particlesMaterial.color.set(parameters.materialColor)
        }) // material.color es un objeto de tipo Color en Three.js. .set() actualiza el color del material con el valor almacenado en parameters.materialColor.

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Objects
 */
// Texture
const textureLoader = new THREE.TextureLoader()
const gradientTexture = textureLoader.load('textures/gradients/3.jpg')
gradientTexture.minFilter = THREE.NearestFilter
gradientTexture.magFilter = THREE.NearestFilter

// Material
const material = new THREE.MeshToonMaterial({ 
    color: parameters.materialColor,
    gradientMap: gradientTexture    
})

// Meshes
const objectsDistance = 4 // esto contrala separacion de los objetos. 

const mesh1 = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.4, 16, 60),
    material
)
const mesh2 = new THREE.Mesh(
    new THREE.ConeGeometry(1, 2, 32),
    material
)
const mesh3 = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.8, 0.5, 100, 16),
    material
)

mesh1.position.y = - objectsDistance * 0 // es negativo por que se ubican hacia abajo.
mesh2.position.y = - objectsDistance * 1
mesh3.position.y = - objectsDistance * 2

mesh1.position.x = 2
mesh2.position.x = - 2
mesh3.position.x = 2


scene.add(mesh1, mesh2, mesh3)

const sectionMeshes = [ mesh1, mesh2, mesh3 ] // Esto permite agrupar las mesh y despues con for of animarlas todas.

/**
 * Particles
 */
// Geometries
const ParticlesCount = 200
const positions = new Float32Array(ParticlesCount * 3)

for(let i = 0; i < ParticlesCount; i++)
{
    positions[i * 3 + 0] = (Math.random() - 0.5) * 10 // Esto seleccion todos x dentro del float32Array 
    positions[i * 3 + 1] = objectsDistance * 0.4 - Math.random() * objectsDistance * sectionMeshes.length // se resta 1.6 que seria la altura por un numero entre 0 y 12 esto lo distribuye por toda la pantalla.
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
}

const particlesGeometry = new THREE.BufferGeometry // crea una geometria vacia
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)) // Llenamos esa geometria  - 'position' atributo especial reconocido por el motor - (positions, 3) toma estos datos y leelos de 3 en 3

// Material
const particlesMaterial = new THREE.PointsMaterial({ // Material Three diseñado para dibujar particulas o puntos individuales. 
    color: parameters.materialColor,
    sizeAttenuation: true, // el tamaño de las particulas cambia según la distancia a la cámara
    size: 0.03 
})

// Point
const particles = new THREE.Points(particlesGeometry, particlesMaterial) // Renderiza puntos individuales.
scene.add(particles)

/**
 * Lights
 */

const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.position.set(1, 1, 0)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Group
const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 6
cameraGroup.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true // esto importante para evitar el error del parche blanco en otros navegadores
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Scroll 
 */
let scrollY = window.scrollY // Esto permite saber donde esta el scroll y guardarlo en una variable - Se hace por si el javascript no se carga a tiempo
console.log(scrollY)
let currentSection = 0 // Esta variable guarda en que sección estas actualmente

window.addEventListener('scroll', () => 
{
    scrollY = window.scrollY // cada vez que el usuario hace scroll, actualiza el valor de scrollY
    
    const newSection = Math.round(scrollY / sizes.height) // esto genera una variable que nos va a decir en que seccion estamos. el scroll y va a variar y el sizes.height va a ser fijo
    
    if(newSection != currentSection) // compara si el usuario cambió de sección
    {
        currentSection = newSection // Actualiza la variable para evitar que el efecto se repita mientras estás en la misma sección
        
        gsap.to( // esto es una libria de animaciones 
            sectionMeshes[currentSection].rotation, // esto busca el mesh correspondiente para animarlo.
            {
                duration: 1.5,
                ease: 'power2.inOut',
                x: '+=6',
                y: '+=6',
                z: '+=1.5'
            }
        )
    }
} )

/**
 * Cursor
 */
const cursor = {}
cursor.x = 0
cursor.y = 0

window.addEventListener('mousemove', (event) => // cada vez que el usuario mueve el mouse
{
    cursor.x = event.clientX / sizes.width - 0.5 // Normaliza el valor entre -0.5 y 0.5
    cursor.y = event.clientY / sizes.height - 0.5
} )



/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0 // contandor de cuanto tiempo 

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime // En animaciones, deltaTime representa el tiempo que ha pasado entre un frame y otro. .
    previousTime = elapsedTime // Actualiza el tiempo previo. 


    // animate camera
    camera.position.y = - scrollY / sizes.height * objectsDistance // al dividir por sizes.height hace que la camara baje exactamente una unidad en la escena ya que si el viewport mide 1000 px y se divide por 1000px que se deplazo el scroll da 1. y se multiplica por 4 por que es la separacion en la que estan los mesh
    
    const parallaxX = cursor.x * 0.5 // Al multiplicar por 0.5 limita el movimiento de la camara a un rango mas pequeño para que nose mueva demasiado lejos
    const parallaxY = - cursor.y * 0.5
    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * deltaTime //parallaxX es su destino, cameragroup es su posicion actual la resta seria cuanto falta para llegar - al restar camera.Group position suaviza el movimiento y lo frena naturalmente
    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * deltaTime
    
    // Animate meshes
    for(const mesh of sectionMeshes) // esto permite animar todas la mesh al tiempo.
    {
        mesh.rotation.x += deltaTime * 0.1   // se agrego el + y se cambio a deltatime para que la libreria de animacion funcionara.
        mesh.rotation.y += deltaTime * 0.12
    }
   



    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()