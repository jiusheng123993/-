import { useState, useCallback, useMemo } from 'react'
import styles from './DailyQuote.module.css'

interface DailyQuoteProps {
  onRemove: () => void
}

const QUOTES = [
  { text: '日拱一卒，功不唐捐。', author: '胡适' },
  { text: '不积跬步，无以至千里。', author: '荀子' },
  { text: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采' },
  { text: '种一棵树最好的时间是十年前，其次是现在。', author: '非洲谚语' },
  { text: '你所浪费的今天，是昨天死去的人奢望的明天。', author: '哈佛校训' },
  { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
  { text: '千里之行，始于足下。', author: '老子' },
  { text: '自律给我自由。', author: '康德' },
  { text: '人生没有白走的路，每一步都算数。', author: '佚名' },
  { text: 'The best way to predict the future is to create it.', author: 'Peter Drucker' },
  { text: '业精于勤，荒于嬉。', author: '韩愈' },
  { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
  { text: '天行健，君子以自强不息。', author: '《周易》' },
  { text: '博观而约取，厚积而薄发。', author: '苏轼' },
  { text: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '《警世贤文》' },
  { text: '志当存高远。', author: '诸葛亮' },
  { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { text: '行动是治愈恐惧的良药。', author: '佚名' },
  { text: '今天不想跑，所以才去跑。', author: '村上春树' },
  { text: '知者不惑，仁者不忧，勇者不惧。', author: '孔子' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: '盛年不重来，一日难再晨。', author: '陶渊明' },
  { text: '莫等闲，白了少年头，空悲切。', author: '岳飞' },
]

const STORAGE_KEY = 'xinghuanhai-dailyquote-state'

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function loadFavorites(): number[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const state = JSON.parse(raw)
      return state.favorites || []
    }
  } catch { /* ignore */ }
  return []
}

function saveFavorites(favorites: number[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ favorites }))
}

export function DailyQuote({ onRemove }: DailyQuoteProps) {
  const [favorites, setFavorites] = useState<number[]>(() => loadFavorites())
  const [refreshKey, setRefreshKey] = useState(0)

  const todayIndex = useMemo(() => {
    const today = getTodayStr()
    const base = hashStr(today) % QUOTES.length
    return (base + refreshKey) % QUOTES.length
  }, [refreshKey])

  const quote = QUOTES[todayIndex]
  const isFavorited = favorites.includes(todayIndex)

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const handleToggleFavorite = useCallback(() => {
    setFavorites((prev) => {
      const next = prev.includes(todayIndex)
        ? prev.filter((i) => i !== todayIndex)
        : [...prev, todayIndex]
      saveFavorites(next)
      return next
    })
  }, [todayIndex])

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>每日一句</span>
        <div className={styles.headerActions}>
          <button
            className={styles.favBtn}
            onClick={handleToggleFavorite}
            type="button"
            title={isFavorited ? '取消收藏' : '收藏'}
            data-favorited={isFavorited}
          >
            {isFavorited ? '★' : '☆'}
          </button>
          <button
            className={styles.refreshBtn}
            onClick={handleRefresh}
            type="button"
            title="换一句"
          >
            ↻
          </button>
          <button className={styles.removeBtn} onClick={onRemove} type="button" title="移除">×</button>
        </div>
      </div>

      <div className={styles.quoteBody}>
        <div className={styles.quoteMark}>"</div>
        <p className={styles.quoteText}>{quote.text}</p>
        <div className={styles.quoteDivider} />
        <p className={styles.quoteAuthor}>—— {quote.author}</p>
      </div>

      {favorites.length > 0 && (
        <div className={styles.favoritesSection}>
          <div className={styles.favoritesLabel}>
            已收藏 {favorites.length} 句
          </div>
          <div className={styles.favoritesList}>
            {favorites.slice(-3).reverse().map((idx) => (
              <span key={idx} className={styles.favChip}>
                {QUOTES[idx].text.length > 12
                  ? QUOTES[idx].text.slice(0, 12) + '…'
                  : QUOTES[idx].text}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
