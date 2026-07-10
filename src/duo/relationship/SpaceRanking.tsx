import { useState, useEffect } from 'react'
import { relationshipService } from './relationshipService'

type SpaceRankingProps = {
  spaceId: string
  userId: string
}

type RankingEntry = {
  userId: string
  score: number
  focusMinutes: number
  tasksCompleted: number
}

export function SpaceRanking({ spaceId, userId }: SpaceRankingProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [rankings, setRankings] = useState<RankingEntry[]>([])

  useEffect(() => {
    const result = relationshipService.getRanking(spaceId, userId, period)
    setRankings(result)
  }, [spaceId, userId, period])

  const getMedal = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `${index + 1}`
  }

  return (
    <div className="space-ranking">
      <h3>排行榜</h3>

      <div className="ranking-period-selector">
        <button
          className={`period-btn ${period === 'week' ? 'active' : ''}`}
          onClick={() => setPeriod('week')}
        >
          本周
        </button>
        <button
          className={`period-btn ${period === 'month' ? 'active' : ''}`}
          onClick={() => setPeriod('month')}
        >
          本月
        </button>
      </div>

      {rankings.length === 0 ? (
        <div className="ranking-empty">
          <p>暂无排行数据</p>
        </div>
      ) : (
        <div className="ranking-list">
          {rankings.map((entry, index) => (
            <div
              key={entry.userId}
              className={`ranking-item ${entry.userId === userId ? 'self' : ''}`}
            >
              <span className="ranking-medal">{getMedal(index)}</span>
              <span className="ranking-user">
                {entry.userId === userId ? '我' : entry.userId}
              </span>
              <div className="ranking-stats">
                <span className="ranking-score">{entry.score} 分</span>
                <span className="ranking-detail">
                  ⏰ {entry.focusMinutes}min · ✅ {entry.tasksCompleted}任务
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
