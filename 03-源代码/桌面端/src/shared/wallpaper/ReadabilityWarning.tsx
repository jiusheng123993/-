
import type { ReadabilityCheckResult } from './wallpaperTypes'
import { AlertTriangle, Info } from 'lucide-react'

type ReadabilityWarningProps = {
  result: ReadabilityCheckResult
}

export function ReadabilityWarning({ result }: ReadabilityWarningProps) {
  if (!result.warning && result.issues.length === 0) return null

  return (
    <div className="readability-warning">
      <div className="readability-warning-header">
        {result.warning ? <AlertTriangle size={16} /> : <Info size={16} />}
        <span>可读性评分：{result.score}/100</span>
      </div>
      <ul className="readability-warning-list">
        {result.issues.map((issue, idx) => (
          <li key={idx} className={`readability-issue severity-${issue.severity}`}>
            <span className="readability-issue-type">{issue.type.replace(/_/g, ' ')}</span>
            <span className="readability-issue-suggestion">{issue.suggestion}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
