import { DEFAULT_AVATAR_ANIMATIONS, isAnimationUnlocked, type AvatarAnimationAsset } from './avatarConstraints'

export type AnimationPickerProps = {
  selectedAnimations: string[]
  avatarLevel: number
  onToggle: (animationId: string) => void
}

const ANIMATION_ICONS: Record<string, string> = {
  idle: '🧘',
  encourage: '💪',
  think: '🤔',
  celebrate: '🎉',
  wave: '👋',
  dance: '💃',
  fly: '🕊️'
}

export function AnimationPicker({ selectedAnimations, avatarLevel, onToggle }: AnimationPickerProps) {
  const animations = DEFAULT_AVATAR_ANIMATIONS.filter(anim => isAnimationUnlocked(anim, avatarLevel))

  const getAnimationIcon = (id: string) => {
    return ANIMATION_ICONS[id.replace('anim_', '')] || '🎬'
  }

  const isSelected = (animationId: string) => {
    const anim = DEFAULT_AVATAR_ANIMATIONS.find(a => a.id === animationId)
    return selectedAnimations.some(id => {
      const selectedAnim = DEFAULT_AVATAR_ANIMATIONS.find(a => a.id === id)
      return selectedAnim?.name === anim?.name
    })
  }

  return (
    <div className="animation-picker">
      <div className="animation-grid">
        {animations.map(anim => (
          <button
            key={anim.id}
            className={`animation-item ${isSelected(anim.id) ? 'selected' : ''}`}
            onClick={() => onToggle(anim.id)}
          >
            <span className="animation-icon">{getAnimationIcon(anim.id)}</span>
            <span className="animation-name">{anim.name}</span>
            <span className="animation-trigger">
              {anim.trigger === 'auto' && '自动'}
              {anim.trigger === 'user_action' && '手动'}
              {anim.trigger === 'schedule' && '定时'}
            </span>
            {anim.unlockLevel && (
              <span className="unlock-level">Lv.{anim.unlockLevel}</span>
            )}
          </button>
        ))}
      </div>
      {animations.length === 0 && (
        <div className="no-animations">暂无可用动画</div>
      )}
    </div>
  )
}

export type AnimationListProps = {
  animations: AvatarAnimationAsset[]
  currentAnimation?: string
  onPlay: (animationId: string) => void
}

export function AnimationList({ animations, currentAnimation, onPlay }: AnimationListProps) {
  const userActionAnimations = animations.filter(a => a.trigger === 'user_action')

  return (
    <div className="animation-list">
      <h4>可用动画</h4>
      {userActionAnimations.length === 0 ? (
        <p className="empty-text">暂无可用动画</p>
      ) : (
        <div className="animation-buttons">
          {userActionAnimations.map(anim => (
            <button
              key={anim.id}
              className={`animation-btn ${currentAnimation === anim.name ? 'active' : ''}`}
              onClick={() => onPlay(anim.id)}
            >
              <span className="btn-icon">{getAnimationIcon(anim.id)}</span>
              <span className="btn-name">{anim.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function getAnimationIcon(id: string): string {
  return ANIMATION_ICONS[id.replace('anim_', '')] || '🎬'
}
