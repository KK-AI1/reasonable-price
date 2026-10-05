import { CircleCheck, CircleAlert, TriangleAlert } from 'lucide-react'
import type { Verdict } from '../lib/types'

const config = {
  fair: { label: '妥当', Icon: CircleCheck, className: 'text-fair border-fair' },
  caution: { label: 'やや高い', Icon: CircleAlert, className: 'text-caution border-caution' },
  high: { label: '高すぎる', Icon: TriangleAlert, className: 'text-high border-high' },
} as const

/** 判定バッジ。色だけに頼らず、文字とアイコンを必ず添える（docs/DESIGN.md §3・§9） */
export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const { label, Icon, className } = config[verdict]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border bg-surface px-3 py-1 text-label ${className}`}
    >
      <Icon size={16} strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  )
}
