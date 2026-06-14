import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { ThreeDRenderer } from './renderers/ThreeDRenderer'
import type { AvatarDefinition } from './avatarTypes'

globalThis.ResizeObserver = class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
} as unknown as typeof ResizeObserver

const mockGLTFLoaderInstance = {
  load: vi.fn()
}

vi.mock('three/addons/loaders/GLTFLoader.js', () => {
  class MockGLTFLoader {
    load = mockGLTFLoaderInstance.load
  }
  return { GLTFLoader: MockGLTFLoader }
})

function makeVec3(x = 0, y = 0, z = 0) {
  return { x, y, z, set: vi.fn(function (nx: number, ny: number, nz: number) { this.x = nx; this.y = ny; this.z = nz }) }
}

vi.mock('three', () => {
  class MockWebGLRenderer {
    setSize = vi.fn()
    setPixelRatio = vi.fn()
    render = vi.fn()
    dispose = vi.fn()
    domElement = document.createElement('canvas')
    shadowMap = { enabled: false, type: 0 }
    toneMapping = 0
    toneMappingExposure = 0
  }

  class MockClock {
    getDelta() { return 0.016 }
  }

  class MockScene {
    add = vi.fn()
    remove = vi.fn()
    background: unknown = null
  }

  class MockPerspectiveCamera {
    position = makeVec3()
    lookAt = vi.fn()
    aspect = 1
    updateProjectionMatrix = vi.fn()
  }

  class MockColor {
    constructor(_color: string | number) {}
  }

  class MockAmbientLight {
    constructor(_color: number, _intensity: number) {}
  }

  class MockDirectionalLight {
    position = makeVec3()
    castShadow = false
    shadow = {
      mapSize: { width: 0, height: 0 },
      camera: { near: 0, far: 0 }
    }
  }

  class MockCircleGeometry {
    constructor(_radius: number, _segments: number) {}
  }

  class MockMeshStandardMaterial {
    constructor(_params?: Record<string, unknown>) {}
    dispose = vi.fn()
  }

  class MockMesh {
    position = makeVec3()
    rotation = makeVec3()
    receiveShadow = false
    castShadow = false
    geometry: { dispose?: () => void } | null = null
    material: { dispose?: () => void } | { dispose?: () => void }[] | null = null
  }

  class MockBox3 {
    setFromObject = vi.fn(function (this: MockBox3) { return this })
    getCenter = vi.fn((_target?: MockVector3) => new MockVector3(0, 0, 0))
    getSize = vi.fn((_target?: MockVector3) => new MockVector3(1, 1, 1))
  }

  class MockVector3 {
    x: number
    y: number
    z: number
    constructor(x?: number, y?: number, z?: number) {
      this.x = x ?? 0
      this.y = y ?? 0
      this.z = z ?? 0
    }
  }

  class MockGroup {
    add = vi.fn()
    remove = vi.fn()
    traverse = vi.fn()
    position = makeVec3()
    rotation = makeVec3()
    scale = { setScalar: vi.fn() }
  }

  class MockAnimationMixer {
    clipAction = vi.fn(() => ({ play: vi.fn() }))
    stopAllAction = vi.fn()
    update = vi.fn()
  }

  class MockSphereGeometry {
    constructor(_radius: number, _widthSegments: number, _heightSegments: number) {}
  }

  class MockCapsuleGeometry {
    constructor(_radius: number, _length: number, _capSegments: number, _radialSegments: number) {}
    clone() { return new MockCapsuleGeometry(0, 0, 0, 0) }
  }

  class MockTorusGeometry {
    constructor(_radius: number, _tube: number, _radialSegments: number, _tubularSegments: number, _arc: number) {}
  }

  return {
    WebGLRenderer: MockWebGLRenderer,
    Scene: MockScene,
    PerspectiveCamera: MockPerspectiveCamera,
    Color: MockColor,
    AmbientLight: MockAmbientLight,
    DirectionalLight: MockDirectionalLight,
    CircleGeometry: MockCircleGeometry,
    MeshStandardMaterial: MockMeshStandardMaterial,
    Mesh: MockMesh,
    Box3: MockBox3,
    Vector3: MockVector3,
    Group: MockGroup,
    AnimationMixer: MockAnimationMixer,
    Clock: MockClock,
    ACESFilmicToneMapping: 0,
    PCFSoftShadowMap: 0,
    SphereGeometry: MockSphereGeometry,
    CapsuleGeometry: MockCapsuleGeometry,
    TorusGeometry: MockTorusGeometry,
    NoToneMapping: 0
  }
})

function createMockAvatar(overrides: Partial<AvatarDefinition> = {}): AvatarDefinition {
  return {
    id: 'test-avatar-1',
    userId: 'user-1',
    name: '测试角色',
    source: 'builtin',
    renderMode: '3d_gltf',
    modelUrl: undefined,
    stickerUrl: undefined,
    thumbnailUrl: '',
    evolution: {
      level: 1,
      unlockedDecorations: [],
      unlockedEffects: [],
      unlockedAnimations: [],
      totalFocusMinutes: 0,
      totalTasksCompleted: 0,
      streakDays: 0
    },
    animations: [
      { name: 'idle', loop: true, trigger: 'auto' }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides
  }
}

describe('ThreeDRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGLTFLoaderInstance.load = vi.fn()
  })

  it('renders container with correct dimensions', () => {
    const avatar = createMockAvatar()
    render(<ThreeDRenderer avatar={avatar} width={400} height={300} />)

    const container = document.querySelector('.three-renderer-container') as HTMLElement
    expect(container).toBeTruthy()
    expect(container.style.width).toBe('400px')
    expect(container.style.height).toBe('300px')
  })

  it('renders with default dimensions', () => {
    const avatar = createMockAvatar()
    render(<ThreeDRenderer avatar={avatar} />)

    const container = document.querySelector('.three-renderer-container') as HTMLElement
    expect(container.style.width).toBe('512px')
    expect(container.style.height).toBe('512px')
  })

  it('shows loading state initially', () => {
    const avatar = createMockAvatar({ modelUrl: 'https://example.com/model.glb' })
    render(<ThreeDRenderer avatar={avatar} />)

    const loading = document.querySelector('.three-renderer-loading')
    expect(loading).toBeTruthy()
  })

  it('renders fallback model when no modelUrl', async () => {
    const avatar = createMockAvatar({ modelUrl: undefined })
    const onLoad = vi.fn()

    render(<ThreeDRenderer avatar={avatar} onLoad={onLoad} />)

    await vi.waitFor(() => {
      expect(onLoad).toHaveBeenCalled()
    })
  })

  it('calls onLoad after fallback model renders', async () => {
    const avatar = createMockAvatar()
    const onLoad = vi.fn()

    render(<ThreeDRenderer avatar={avatar} onLoad={onLoad} />)

    await vi.waitFor(() => {
      expect(onLoad).toHaveBeenCalledTimes(1)
    })
  })

  it('attempts to load glTF when modelUrl is provided', () => {
    const avatar = createMockAvatar({ modelUrl: 'https://example.com/model.glb' })
    render(<ThreeDRenderer avatar={avatar} />)

    expect(mockGLTFLoaderInstance.load).toHaveBeenCalledWith(
      'https://example.com/model.glb',
      expect.any(Function),
      undefined,
      expect.any(Function)
    )
  })

  it('calls onError when glTF loading fails', async () => {
    const avatar = createMockAvatar({ modelUrl: 'https://example.com/model.glb' })
    const onError = vi.fn()

    mockGLTFLoaderInstance.load = vi.fn((_url: string, _onLoad: unknown, _onProgress: unknown, onErrorFn: (err: Error) => void) => {
      onErrorFn(new Error('Network error'))
    })

    render(<ThreeDRenderer avatar={avatar} onError={onError} />)

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  it('shows error message when loading fails', async () => {
    const avatar = createMockAvatar({ modelUrl: 'https://example.com/model.glb' })

    mockGLTFLoaderInstance.load = vi.fn((_url: string, _onLoad: unknown, _onProgress: unknown, onErrorFn: (err: Error) => void) => {
      onErrorFn(new Error('Network error'))
    })

    render(<ThreeDRenderer avatar={avatar} />)

    await vi.waitFor(() => {
      const errorEl = document.querySelector('.three-renderer-error')
      expect(errorEl).toBeTruthy()
    })
  })

  it('renders with custom background color', () => {
    const avatar = createMockAvatar()
    render(<ThreeDRenderer avatar={avatar} backgroundColor="#ff0000" />)

    const container = document.querySelector('.three-renderer-container')
    expect(container).toBeTruthy()
  })

  it('handles avatar with empty modelUrl string', async () => {
    const avatar = createMockAvatar({ modelUrl: '' })
    const onLoad = vi.fn()

    render(<ThreeDRenderer avatar={avatar} onLoad={onLoad} />)

    await vi.waitFor(() => {
      expect(onLoad).toHaveBeenCalled()
    })
  })

  it('renders container with border radius', () => {
    const avatar = createMockAvatar()
    render(<ThreeDRenderer avatar={avatar} />)

    const container = document.querySelector('.three-renderer-container') as HTMLElement
    expect(container.style.borderRadius).toBe('8px')
  })

  it('renders container with overflow hidden', () => {
    const avatar = createMockAvatar()
    render(<ThreeDRenderer avatar={avatar} />)

    const container = document.querySelector('.three-renderer-container') as HTMLElement
    expect(container.style.overflow).toBe('hidden')
  })

  it('renders container with relative position', () => {
    const avatar = createMockAvatar()
    render(<ThreeDRenderer avatar={avatar} />)

    const container = document.querySelector('.three-renderer-container') as HTMLElement
    expect(container.style.position).toBe('relative')
  })

  it('handles glTF load success with animations', async () => {
    const avatar = createMockAvatar({ modelUrl: 'https://example.com/animated.glb' })
    const onLoad = vi.fn()

    const mockScene = {
      traverse: vi.fn(),
      position: makeVec3(),
      rotation: makeVec3(),
      scale: { setScalar: vi.fn() }
    }

    mockGLTFLoaderInstance.load = vi.fn((_url: string, onLoadFn: (gltf: { scene: typeof mockScene; animations: { name: string }[] }) => void) => {
      onLoadFn({
        scene: mockScene as Record<string, unknown>,
        animations: [{ name: 'walk' }, { name: 'idle' }]
      })
    })

    render(<ThreeDRenderer avatar={avatar} onLoad={onLoad} />)

    await vi.waitFor(() => {
      expect(onLoad).toHaveBeenCalled()
    })
  })

  it('handles glTF load success without animations', async () => {
    const avatar = createMockAvatar({ modelUrl: 'https://example.com/static.glb' })
    const onLoad = vi.fn()

    const mockScene = {
      traverse: vi.fn(),
      position: makeVec3(),
      rotation: makeVec3(),
      scale: { setScalar: vi.fn() }
    }

    mockGLTFLoaderInstance.load = vi.fn((_url: string, onLoadFn: (gltf: { scene: typeof mockScene; animations: never[] }) => void) => {
      onLoadFn({
        scene: mockScene as Record<string, unknown>,
        animations: []
      })
    })

    render(<ThreeDRenderer avatar={avatar} onLoad={onLoad} />)

    await vi.waitFor(() => {
      expect(onLoad).toHaveBeenCalled()
    })
  })

  it('handles non-Error objects in glTF error callback', async () => {
    const avatar = createMockAvatar({ modelUrl: 'https://example.com/model.glb' })
    const onError = vi.fn()

    mockGLTFLoaderInstance.load = vi.fn((_url: string, _onLoad: unknown, _onProgress: unknown, onErrorFn: (err: unknown) => void) => {
      onErrorFn('string error')
    })

    render(<ThreeDRenderer avatar={avatar} onError={onError} />)

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  it('renders without onLoad callback', async () => {
    const avatar = createMockAvatar()
    render(<ThreeDRenderer avatar={avatar} />)

    const container = document.querySelector('.three-renderer-container')
    expect(container).toBeTruthy()
  })

  it('renders without onError callback', () => {
    const avatar = createMockAvatar({ modelUrl: 'https://example.com/model.glb' })
    render(<ThreeDRenderer avatar={avatar} />)

    expect(mockGLTFLoaderInstance.load).toHaveBeenCalled()
  })

  it('renders loading text in Chinese', () => {
    const avatar = createMockAvatar({ modelUrl: 'https://example.com/model.glb' })
    render(<ThreeDRenderer avatar={avatar} />)

    const loading = document.querySelector('.three-renderer-loading')
    expect(loading?.textContent).toContain('加载3D模型中')
  })

  it('renders error text in Chinese', async () => {
    const avatar = createMockAvatar({ modelUrl: 'https://example.com/model.glb' })

    mockGLTFLoaderInstance.load = vi.fn((_url: string, _onLoad: unknown, _onProgress: unknown, onErrorFn: (err: Error) => void) => {
      onErrorFn(new Error('test error'))
    })

    render(<ThreeDRenderer avatar={avatar} />)

    await vi.waitFor(() => {
      const error = document.querySelector('.three-renderer-error')
      expect(error?.textContent).toContain('3D模型加载失败')
    })
  })
})
