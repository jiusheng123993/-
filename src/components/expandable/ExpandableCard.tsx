import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode
} from 'react'
import { createPortal } from 'react-dom'

export interface ExpandableCardProps {
  children: ReactElement<{
    onClick?: (event: ReactMouseEvent<HTMLElement>) => void
    className?: string
    style?: CSSProperties
    ref?: React.Ref<HTMLElement>
  }>
  expandedContent: ReactNode
  expandedTitle?: ReactNode
  expandedClassName?: string
  maxWidth?: number
  maxHeightVh?: number
}

type Rect = {
  top: number
  left: number
  width: number
  height: number
}

type AnimationPhase = 'idle' | 'opening' | 'open' | 'closing'

const SPRING = 'cubic-bezier(0.32, 0.72, 0, 1)'
const DURATION = 520

export function ExpandableCard({
  children,
  expandedContent,
  expandedTitle,
  expandedClassName,
  maxWidth = 960,
  maxHeightVh = 86
}: ExpandableCardProps) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const cloneRef = useRef<HTMLDivElement | null>(null)
  const [phase, setPhase] = useState<AnimationPhase>('idle')
  const [sourceRect, setSourceRect] = useState<Rect | null>(null)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const reactId = useId()
  const dialogId = `expandable-${reactId.replace(/:/g, '')}`

  const computeTargetRect = useCallback((): Rect => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = Math.min(maxWidth, vw - 48)
    const height = Math.min((vh * maxHeightVh) / 100, vh - 48)
    return {
      width,
      height,
      left: (vw - width) / 2,
      top: (vh - height) / 2
    }
  }, [maxWidth, maxHeightVh])

  const open = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setSourceRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    })
    setTargetRect(computeTargetRect())
    setPhase('opening')
  }, [computeTargetRect])

  const close = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setSourceRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    })
    setPhase('closing')
  }, [])

  useLayoutEffect(() => {
    if (phase !== 'opening' || !cloneRef.current) return
    const node = cloneRef.current
    // Force a frame to allow initial rect to render before transitioning.
    const raf = requestAnimationFrame(() => {
      node.dataset.state = 'open'
    })
    const timer = window.setTimeout(() => {
      setPhase('open')
    }, DURATION)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
    }
  }, [phase])

  useLayoutEffect(() => {
    if (phase !== 'closing' || !cloneRef.current) return
    const node = cloneRef.current
    const raf = requestAnimationFrame(() => {
      node.dataset.state = 'closing'
    })
    const timer = window.setTimeout(() => {
      setPhase('idle')
      setSourceRect(null)
      setTargetRect(null)
    }, DURATION)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'open') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const onResize = () => setTargetRect(computeTargetRect())
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      document.body.style.overflow = prevOverflow
    }
  }, [phase, close, computeTargetRect])

  const isActive = phase !== 'idle'

  const setTriggerRef = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node
  }, [])

  if (!isValidElement(children)) {
    return children
  }

  const originalOnClick = children.props.onClick
  const originalClassName = children.props.className ?? ''
  const originalStyle = children.props.style ?? {}

  // eslint-disable-next-line react-hooks/refs
  const triggerNode = cloneElement(children, {
    ref: setTriggerRef,
    onClick: (event: ReactMouseEvent<HTMLElement>) => {
      originalOnClick?.(event)
      if (event.defaultPrevented) return
      open()
    },
    className: `${originalClassName} expandable-trigger${isActive ? ' is-expanded-source' : ''}`.trim(),
    style: {
      ...originalStyle,
      visibility: isActive ? 'hidden' : originalStyle.visibility,
      cursor: 'zoom-in'
    },
    'aria-haspopup': 'dialog',
    'aria-expanded': phase === 'open',
    'aria-controls': dialogId
  } as Record<string, unknown>)

  const cloneInitialStyle: CSSProperties | null =
    sourceRect && targetRect
      ? ({
          '--target-top': `${targetRect.top}px`,
          '--target-left': `${targetRect.left}px`,
          '--target-width': `${targetRect.width}px`,
          '--target-height': `${targetRect.height}px`,
          '--source-top': `${sourceRect.top}px`,
          '--source-left': `${sourceRect.left}px`,
          '--source-width': `${sourceRect.width}px`,
          '--source-height': `${sourceRect.height}px`,
          '--expand-duration': `${DURATION}ms`,
          '--expand-easing': SPRING
        } as CSSProperties)
      : null

  return (
    <>
      {triggerNode}
      {isActive && sourceRect && targetRect
        ? createPortal(
            <div
              className={`expandable-overlay${phase === 'open' ? ' is-open' : ''}${phase === 'closing' ? ' is-closing' : ''}`}
              onClick={close}
              role="presentation"
            >
              <div
                ref={cloneRef}
                className={`expandable-clone${expandedClassName ? ` ${expandedClassName}` : ''}`}
                data-state="initial"
                style={cloneInitialStyle ?? undefined}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                id={dialogId}
                aria-label={typeof expandedTitle === 'string' ? expandedTitle : 'Expanded card'}
              >
                <button
                  className="expandable-close"
                  onClick={close}
                  type="button"
                  aria-label="收起卡片"
                >
                  ×
                </button>
                <div className="expandable-scroll">
                  {expandedTitle ? (
                    <header className="expandable-header">{expandedTitle}</header>
                  ) : null}
                  <div className="expandable-body">{expandedContent}</div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  )
}
