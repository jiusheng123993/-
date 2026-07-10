import { DEFAULT_AVATAR_PARTS, isPartUnlocked, type AvatarPartType } from './avatarConstraints'

export type PartPickerProps = {
  selectedParts: Partial<Record<AvatarPartType, string>>
  avatarLevel: number
  onSelect: (partType: AvatarPartType, partId: string) => void
}

const PART_TYPE_LABELS: Record<AvatarPartType, string> = {
  body: '身体',
  head: '头部',
  face: '表情',
  hair: '发型',
  outfit: '服装',
  accessory: '配饰',
  background: '背景'
}

export function PartPicker({ selectedParts, avatarLevel, onSelect }: PartPickerProps) {
  const partTypes: AvatarPartType[] = ['body', 'head', 'face', 'hair', 'outfit', 'accessory', 'background']

  return (
    <div className="part-picker">
      {partTypes.map(partType => {
        const parts = DEFAULT_AVATAR_PARTS[partType] || []
        const unlockedParts = parts.filter(part => isPartUnlocked(part, avatarLevel))

        return (
          <div key={partType} className="part-category">
            <h4>{PART_TYPE_LABELS[partType]}</h4>
            <div className="part-grid">
              {unlockedParts.map(part => (
                <button
                  key={part.id}
                  className={`part-item ${selectedParts[partType] === part.id ? 'selected' : ''}`}
                  onClick={() => onSelect(partType, part.id)}
                >
                  <div className="part-thumbnail">
                    <img
                      src={part.thumbnailUrl}
                      alt={part.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = '🎭'
                      }}
                    />
                  </div>
                  <span className="part-name">{part.name}</span>
                  {part.unlockLevel && (
                    <span className="unlock-level">Lv.{part.unlockLevel}</span>
                  )}
                </button>
              ))}
              {unlockedParts.length === 0 && (
                <div className="no-parts">暂无可用部件</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export type PartCategorySelectorProps = {
  selectedType: AvatarPartType
  onSelectType: (type: AvatarPartType) => void
}

export function PartCategorySelector({ selectedType, onSelectType }: PartCategorySelectorProps) {
  const partTypes: AvatarPartType[] = ['body', 'head', 'face', 'hair', 'outfit', 'accessory', 'background']

  return (
    <div className="part-category-selector">
      {partTypes.map(partType => (
        <button
          key={partType}
          className={`category-btn ${selectedType === partType ? 'active' : ''}`}
          onClick={() => onSelectType(partType)}
        >
          {PART_TYPE_LABELS[partType]}
        </button>
      ))}
    </div>
  )
}
