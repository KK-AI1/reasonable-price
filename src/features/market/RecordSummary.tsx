import { CircleAlert, Clock, Info } from 'lucide-react'
import { bangkokPriceConfig } from '../../lib/city'
import { purchaseRecords } from '../../lib/records'
import { fmt } from '../../lib/format'
import type { Item } from '../../lib/types'

/** 一覧のカードに出す、購入記録の要約 */
export function RecordSummary({ item, venueId, today }: { item: Item; venueId: string | null; today: Date }) {
  if (!item.negotiable) {
    return <span className="block text-caption text-text-sub">定価で売られる品物です（交渉しない）</span>
  }
  const v = purchaseRecords(item, venueId, bangkokPriceConfig.staleAfterDays, today)
  if (v.state === 'insufficient') {
    return (
      <span className="flex items-center gap-1 text-caption text-text-sub">
        <CircleAlert size={14} strokeWidth={2} aria-hidden="true" />
        価格情報が不足しています
      </span>
    )
  }
  const unverified = v.records.some((r) => !r.verified)
  return (
    <>
      <span className="block text-body font-bold">
        {v.state === 'single' ? `${fmt(v.min)}` : `${fmt(v.min)}〜${fmt(v.max)}`}
        <span className="ml-1 text-label font-normal text-text-sub">THB / {item.unit}</span>
      </span>
      <span className="flex flex-wrap items-center gap-x-1 text-caption text-text-sub">
        <span>購入記録 {v.count}件</span>
        <span>・{v.scope === 'city' ? '都市全体' : 'この市場'}</span>
        {unverified && <span>・未確認</span>}
        {v.state === 'single' && (
          <span className="flex items-center gap-0.5">
            ・<Info size={12} strokeWidth={2} aria-hidden="true" />
            1件のみ
          </span>
        )}
        {v.state === 'old' && (
          <span className="flex items-center gap-0.5">
            ・<Clock size={12} strokeWidth={2} aria-hidden="true" />
            古い記録のみ
          </span>
        )}
      </span>
    </>
  )
}
