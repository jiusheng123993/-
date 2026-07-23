import { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { AvatarDefinition } from '../avatarTypes'

export type ThreeDRendererProps = {
  avatar: AvatarDefinition
  width?: number
  height?: number
  autoRotate?: boolean
  backgroundColor?: string
  onLoad?: () => void
  onError?: (error: Error) => void
}

const DEFAULT_MODEL_URL = ''

export function ThreeDRenderer({
  avatar,
  width = 512,
  height = 512,
  autoRotate = false,
  backgroundColor = '#1a1a2e',
  onLoad,
  onError
}: ThreeDRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const clockRef = useRef<THREE.Clock>(new THREE.Clock())
  const animFrameRef = useRef<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const disposeScene = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = 0
    }
    if (mixerRef.current) {
      mixerRef.current.stopAllAction()
      mixerRef.current = null
    }
    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose())
            } else {
              child.material.dispose()
            }
          }
        }
      })
      if (sceneRef.current) {
        sceneRef.current.remove(modelRef.current)
      }
      modelRef.current = null
    }
    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(backgroundColor)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 1.2, 3)
    camera.lookAt(0, 0.8, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
    keyLight.position.set(5, 5, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 1024
    keyLight.shadow.mapSize.height = 1024
    keyLight.shadow.camera.near = 0.5
    keyLight.shadow.camera.far = 50
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4)
    fillLight.position.set(-3, 1, -2)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3)
    rimLight.position.set(0, 2, -3)
    scene.add(rimLight)

    const groundGeometry = new THREE.CircleGeometry(2, 32)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x222233,
      roughness: 0.8,
      metalness: 0.2
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1.5
    ground.receiveShadow = true
    scene.add(ground)

    const modelUrl = avatar.modelUrl || DEFAULT_MODEL_URL

    if (!modelUrl) {
      const fallbackGroup = createFallbackModel()
      scene.add(fallbackGroup)
      modelRef.current = fallbackGroup
      setIsLoading(false)
      onLoad?.()
    } else {
      const loader = new GLTFLoader()
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true
              child.receiveShadow = true
            }
          })

          const box = new THREE.Box3().setFromObject(model)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          const scale = 1.8 / maxDim
          model.scale.setScalar(scale)
          model.position.set(-center.x * scale, -center.y * scale + 0.8, -center.z * scale)

          scene.add(model)
          modelRef.current = model

          if (gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model)
            mixerRef.current = mixer
            gltf.animations.forEach((clip) => {
              const action = mixer.clipAction(clip)
              action.play()
            })
          }

          setIsLoading(false)
          onLoad?.()
        },
        undefined,
        (error) => {
          const err = error instanceof Error ? error : new Error(String(error))
          setLoadError(err.message)
          setIsLoading(false)
          onError?.(err)
        }
      )
    }

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)

      const delta = clockRef.current.getDelta()

      if (mixerRef.current) {
        mixerRef.current.update(delta)
      }

      if (autoRotate && modelRef.current) {
        modelRef.current.rotation.y += delta * 0.5
      }

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return
      const rect = container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      rendererRef.current.setSize(rect.width, rect.height)
      cameraRef.current.aspect = rect.width / rect.height
      cameraRef.current.updateProjectionMatrix()
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      disposeScene()
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement)
      }
    }
  }, [avatar.modelUrl, width, height, autoRotate, backgroundColor, onLoad, onError, disposeScene])

  return (
    <div
      ref={containerRef}
      className="three-renderer-container"
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px'
      }}
    >
      {isLoading && (
        <div
          className="three-renderer-loading"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: '#fff',
            fontSize: '14px',
            zIndex: 10
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '8px' }}>⏳</div>
            <div>加载3D模型中...</div>
          </div>
        </div>
      )}
      {loadError && (
        <div
          className="three-renderer-error"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            color: '#fff',
            fontSize: '14px',
            zIndex: 10,
            padding: '16px',
            textAlign: 'center'
          }}
        >
          <div>
            <div style={{ marginBottom: '8px' }}>⚠️</div>
            <div>3D模型加载失败</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
              {loadError}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function createFallbackModel(): THREE.Group {
  const group = new THREE.Group()

  const bodyGeometry = new THREE.CapsuleGeometry(0.35, 0.6, 8, 16)
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x6366f1,
    roughness: 0.4,
    metalness: 0.3
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 0.6
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  const headGeometry = new THREE.SphereGeometry(0.28, 32, 32)
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b5cf6,
    roughness: 0.3,
    metalness: 0.2
  })
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.y = 1.25
  head.castShadow = true
  head.receiveShadow = true
  group.add(head)

  const eyeGeometry = new THREE.SphereGeometry(0.06, 16, 16)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    emissive: 0x333333,
    emissiveIntensity: 0.3
  })
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  leftEye.position.set(-0.1, 1.32, 0.24)
  group.add(leftEye)
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  rightEye.position.set(0.1, 1.32, 0.24)
  group.add(rightEye)

  const pupilGeometry = new THREE.SphereGeometry(0.03, 8, 8)
  const pupilMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.1
  })
  const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
  leftPupil.position.set(-0.1, 1.32, 0.29)
  group.add(leftPupil)
  const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
  rightPupil.position.set(0.1, 1.32, 0.29)
  group.add(rightPupil)

  const mouthGeometry = new THREE.TorusGeometry(0.06, 0.015, 8, 16, Math.PI)
  const mouthMaterial = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.3
  })
  const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial)
  mouth.position.set(0, 1.18, 0.26)
  mouth.rotation.z = Math.PI
  group.add(mouth)

  const leftArmGeometry = new THREE.CapsuleGeometry(0.08, 0.5, 4, 8)
  const armMaterial = new THREE.MeshStandardMaterial({
    color: 0x6366f1,
    roughness: 0.4,
    metalness: 0.3
  })
  const leftArm = new THREE.Mesh(leftArmGeometry, armMaterial)
  leftArm.position.set(-0.45, 0.7, 0)
  leftArm.rotation.z = 0.3
  leftArm.castShadow = true
  group.add(leftArm)

  const rightArm = new THREE.Mesh(leftArmGeometry.clone(), armMaterial)
  rightArm.position.set(0.45, 0.7, 0)
  rightArm.rotation.z = -0.3
  rightArm.castShadow = true
  group.add(rightArm)

  const leftLegGeometry = new THREE.CapsuleGeometry(0.1, 0.4, 4, 8)
  const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x4c4f8a,
    roughness: 0.5,
    metalness: 0.2
  })
  const leftLeg = new THREE.Mesh(leftLegGeometry, legMaterial)
  leftLeg.position.set(-0.15, -0.1, 0)
  leftLeg.castShadow = true
  group.add(leftLeg)

  const rightLeg = new THREE.Mesh(leftLegGeometry.clone(), legMaterial)
  rightLeg.position.set(0.15, -0.1, 0)
  rightLeg.castShadow = true
  group.add(rightLeg)

  return group
}
