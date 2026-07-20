import type { FocusBriefStyleId } from './types'
import { focusBriefStyles, getFocusBriefStyleById } from './focusBriefRegistry'
import { LayoutGrid, Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export interface FocusBriefStylePickerProps {
  currentStyleId: FocusBriefStyleId
  onStyleChange: (styleId: FocusBriefStyleId) => void
}

export function FocusBriefStylePicker({
  currentStyleId,
  onStyleChange
}: FocusBriefStylePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    const closeOnClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        menuRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    document.addEventListener('mousedown', closeOnClickOutside)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('mousedown', closeOnClickOutside)
    }
  }, [isOpen])

  const current = getFocusBriefStyleById(currentStyleId)

  const selectAndClose = (styleId: FocusBriefStyleId) => {
    onStyleChange(styleId)
    setIsOpen(false)
  }

  return (
    <>
      <button
        ref={triggerRef}
        className="focus-brief-style-trigger"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={`切换专注概览样式，当前：${current.name}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        type="button"
      >
        <LayoutGrid size={16} aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          className="focus-brief-style-menu"
          role="menu"
          aria-label="专注概览样式"
        >
          <div className="focus-brief-style-menu-title">选择概览样式</div>
          {focusBriefStyles.map((style) => (
            <button
              key={style.id}
              className="focus-brief-style-option"
              onClick={() => selectAndClose(style.id)}
              role="menuitemradio"
              aria-checked={currentStyleId === style.id}
              type="button"
            >
              <span className="focus-brief-style-option-name">{style.name}</span>
              <span className="focus-brief-style-option-desc">{style.description}</span>
              {currentStyleId === style.id && <Check size={16} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
