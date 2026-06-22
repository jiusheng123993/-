import type { FC } from 'react'
import { RelationshipSpaceProvider } from '../../relationship/RelationshipSpaceProvider'
import { SpaceDetail } from '../../relationship/SpaceDetail'
import { CreateSpaceForm } from '../../relationship/SpaceList'
import { SpaceList } from '../../relationship/SpaceList'

interface RelationshipSpaceModalProps {
  wallpaper: string
  userId: string
  selectedSpaceId: string | null
  isCreatingSpace: boolean
  onClose: () => void
  onOpenWallpaper: () => void
  onSelectSpace: (spaceId: string) => void
  onCreateSpace: () => void
  onCancelCreate: () => void
  onSpaceCreated: (spaceId: string) => void
  onBack: () => void
}

export const RelationshipSpaceModal: FC<RelationshipSpaceModalProps> = ({
  wallpaper,
  userId,
  selectedSpaceId,
  isCreatingSpace,
  onClose,
  onOpenWallpaper,
  onSelectSpace,
  onCreateSpace,
  onCancelCreate,
  onSpaceCreated,
  onBack
}) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: wallpaper || 'var(--wallpaper-image, var(--background))',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      overflow: 'auto'
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--wallpaper-overlay, rgba(0,0,0,0.6))',
        opacity: Number('var(--wallpaper-overlay-opacity, 0.6)') || 0.6
      }}
    />
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      <div style={{
        position: 'absolute',
        top: 24,
        right: 24,
        display: 'flex',
        gap: 12,
        zIndex: 10
      }}>
        <button
          onClick={onOpenWallpaper}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          aria-label="更换壁纸"
          title="更换壁纸"
        >
          🖼️
        </button>
        <button
          onClick={onClose}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            fontSize: 28,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          aria-label="关闭关系空间"
        >
          ×
        </button>
      </div>
      <div style={{ padding: '100px 40px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0, letterSpacing: '0.5px' }}>RELATIONSHIP SPACE</p>
          <h2 style={{ fontSize: 42, fontWeight: 700, margin: '12px 0 0', color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>与伙伴一起成长</h2>
        </div>
        <RelationshipSpaceProvider>
          {selectedSpaceId ? (
            <SpaceDetail
              spaceId={selectedSpaceId}
              userId={userId}
              onBack={onBack}
            />
          ) : isCreatingSpace ? (
            <CreateSpaceForm
              userId={userId}
              onCreated={(spaceId) => {
                onCancelCreate()
                onSpaceCreated(spaceId)
              }}
              onCancel={onCancelCreate}
            />
          ) : (
            <SpaceList
              userId={userId}
              onSelectSpace={onSelectSpace}
              onCreateSpace={onCreateSpace}
            />
          )}
        </RelationshipSpaceProvider>
      </div>
    </div>
  </div>
)
