export type AvatarSourceType = 'local' | 'builtin' | 'url' | 'api'

export interface AvatarAsset {
  id: string
  type: 'local' | 'builtin' | 'url'
  category: 'body' | 'face' | 'hair' | 'outfit' | 'accessory' | 'background'
  name: string
  url: string
  thumbnail?: string
  metadata?: Record<string, unknown>
}

export interface AvatarSourceConfig {
  sourceType: AvatarSourceType
  baseUrl?: string
  apiKey?: string
}

export interface AvatarSourceAdapter {
  getSourceType(): AvatarSourceType
  listAssets(category?: AvatarAsset['category']): Promise<AvatarAsset[]>
  getAsset(id: string): Promise<AvatarAsset | null>
  uploadAsset(asset: Omit<AvatarAsset, 'id'>): Promise<AvatarAsset>
  deleteAsset(id: string): Promise<boolean>
  searchAssets(query: string): Promise<AvatarAsset[]>
}

export const BUILTIN_AVATAR_ASSETS: AvatarAsset[] = [
  {
    id: 'builtin-body-1',
    type: 'builtin',
    category: 'body',
    name: '默认体型',
    url: '/assets/avatar/body/default.svg',
    thumbnail: '/assets/avatar/body/default-thumb.svg'
  },
  {
    id: 'builtin-face-1',
    type: 'builtin',
    category: 'face',
    name: '微笑脸',
    url: '/assets/avatar/face/smile.svg',
    thumbnail: '/assets/avatar/face/smile-thumb.svg'
  },
  {
    id: 'builtin-face-2',
    type: 'builtin',
    category: 'face',
    name: '认真脸',
    url: '/assets/avatar/face/focused.svg',
    thumbnail: '/assets/avatar/face/focused-thumb.svg'
  },
  {
    id: 'builtin-hair-1',
    type: 'builtin',
    category: 'hair',
    name: '短发',
    url: '/assets/avatar/hair/short.svg',
    thumbnail: '/assets/avatar/hair/short-thumb.svg'
  },
  {
    id: 'builtin-hair-2',
    type: 'builtin',
    category: 'hair',
    name: '长发',
    url: '/assets/avatar/hair/long.svg',
    thumbnail: '/assets/avatar/hair/long-thumb.svg'
  },
  {
    id: 'builtin-outfit-1',
    type: 'builtin',
    category: 'outfit',
    name: '休闲装',
    url: '/assets/avatar/outfit/casual.svg',
    thumbnail: '/assets/avatar/outfit/casual-thumb.svg'
  },
  {
    id: 'builtin-outfit-2',
    type: 'builtin',
    category: 'outfit',
    name: '正装',
    url: '/assets/avatar/outfit/formal.svg',
    thumbnail: '/assets/avatar/outfit/formal-thumb.svg'
  },
  {
    id: 'builtin-bg-1',
    type: 'builtin',
    category: 'background',
    name: '渐变蓝',
    url: '/assets/avatar/bg/gradient-blue.svg',
    thumbnail: '/assets/avatar/bg/gradient-blue-thumb.svg'
  },
  {
    id: 'builtin-bg-2',
    type: 'builtin',
    category: 'background',
    name: '暖色',
    url: '/assets/avatar/bg/warm.svg',
    thumbnail: '/assets/avatar/bg/warm-thumb.svg'
  }
]

export function createLocalAvatarSourceAdapter(): AvatarSourceAdapter {
  const localAssets: AvatarAsset[] = []

  return {
    getSourceType(): AvatarSourceType {
      return 'local'
    },

    async listAssets(category?: AvatarAsset['category']): Promise<AvatarAsset[]> {
      const all = [...BUILTIN_AVATAR_ASSETS, ...localAssets]
      if (category) {
        return all.filter(a => a.category === category)
      }
      return all
    },

    async getAsset(id: string): Promise<AvatarAsset | null> {
      const all = [...BUILTIN_AVATAR_ASSETS, ...localAssets]
      return all.find(a => a.id === id) || null
    },

    async uploadAsset(asset: Omit<AvatarAsset, 'id'>): Promise<AvatarAsset> {
      const newAsset: AvatarAsset = {
        ...asset,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'local'
      }
      localAssets.push(newAsset)
      return newAsset
    },

    async deleteAsset(id: string): Promise<boolean> {
      const index = localAssets.findIndex(a => a.id === id)
      if (index >= 0) {
        localAssets.splice(index, 1)
        return true
      }
      return false
    },

    async searchAssets(query: string): Promise<AvatarAsset[]> {
      const lowerQuery = query.toLowerCase()
      const all = [...BUILTIN_AVATAR_ASSETS, ...localAssets]
      return all.filter(a => 
        a.name.toLowerCase().includes(lowerQuery) ||
        a.category.toLowerCase().includes(lowerQuery)
      )
    }
  }
}

export function createUrlAvatarSourceAdapter(baseUrl: string): AvatarSourceAdapter {
  return {
    getSourceType(): AvatarSourceType {
      return 'url'
    },

    async listAssets(category?: AvatarAsset['category']): Promise<AvatarAsset[]> {
      try {
        const url = category 
          ? `${baseUrl}/assets?category=${category}`
          : `${baseUrl}/assets`
        const response = await fetch(url)
        if (!response.ok) return []
        const data = await response.json()
        return data.assets || []
      } catch {
        return []
      }
    },

    async getAsset(id: string): Promise<AvatarAsset | null> {
      try {
        const response = await fetch(`${baseUrl}/assets/${id}`)
        if (!response.ok) return null
        return await response.json()
      } catch {
        return null
      }
    },

    async uploadAsset(asset: Omit<AvatarAsset, 'id'>): Promise<AvatarAsset> {
      const response = await fetch(`${baseUrl}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset)
      })
      if (!response.ok) throw new Error('Upload failed')
      return await response.json()
    },

    async deleteAsset(id: string): Promise<boolean> {
      const response = await fetch(`${baseUrl}/assets/${id}`, {
        method: 'DELETE'
      })
      return response.ok
    },

    async searchAssets(query: string): Promise<AvatarAsset[]> {
      try {
        const response = await fetch(`${baseUrl}/assets/search?q=${encodeURIComponent(query)}`)
        if (!response.ok) return []
        const data = await response.json()
        return data.assets || []
      } catch {
        return []
      }
    }
  }
}

export function createApiAvatarSourceAdapter(baseUrl: string, apiKey: string): AvatarSourceAdapter {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }

  return {
    getSourceType(): AvatarSourceType {
      return 'api'
    },

    async listAssets(category?: AvatarAsset['category']): Promise<AvatarAsset[]> {
      try {
        const url = category 
          ? `${baseUrl}/avatars?category=${category}`
          : `${baseUrl}/avatars`
        const response = await fetch(url, { headers })
        if (!response.ok) return []
        const data = await response.json()
        return data.items || []
      } catch {
        return []
      }
    },

    async getAsset(id: string): Promise<AvatarAsset | null> {
      try {
        const response = await fetch(`${baseUrl}/avatars/${id}`, { headers })
        if (!response.ok) return null
        return await response.json()
      } catch {
        return null
      }
    },

    async uploadAsset(asset: Omit<AvatarAsset, 'id'>): Promise<AvatarAsset> {
      const response = await fetch(`${baseUrl}/avatars`, {
        method: 'POST',
        headers,
        body: JSON.stringify(asset)
      })
      if (!response.ok) throw new Error('Upload failed')
      return await response.json()
    },

    async deleteAsset(id: string): Promise<boolean> {
      const response = await fetch(`${baseUrl}/avatars/${id}`, {
        method: 'DELETE',
        headers
      })
      return response.ok
    },

    async searchAssets(query: string): Promise<AvatarAsset[]> {
      try {
        const response = await fetch(`${baseUrl}/avatars/search?q=${encodeURIComponent(query)}`, { headers })
        if (!response.ok) return []
        const data = await response.json()
        return data.items || []
      } catch {
        return []
      }
    }
  }
}

export function createAvatarSourceAdapter(config: AvatarSourceConfig): AvatarSourceAdapter {
  switch (config.sourceType) {
    case 'local':
      return createLocalAvatarSourceAdapter()
    case 'url':
      return createUrlAvatarSourceAdapter(config.baseUrl || '')
    case 'api':
      return createApiAvatarSourceAdapter(config.baseUrl || '', config.apiKey || '')
    case 'builtin':
    default:
      return createLocalAvatarSourceAdapter()
  }
}
