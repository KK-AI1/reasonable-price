import type { Item, PriceObservation } from './types'

/** 購入記録の状態（docs/SPEC.md §3.8） */
export type RecordState = 'ok' | 'single' | 'old' | 'insufficient'

export interface PurchaseRecordView {
  state: RecordState
  /** venue：選んだ市場の記録だけ／city：都市全体の記録（特定の市場の値段ではない） */
  scope: 'venue' | 'city'
  min: number
  max: number
  count: number
  /** 時期の分かる記録の最古・最新（YYYY または YYYY-MM） */
  earliest: string | null
  latest: string | null
  /** 時期の分からない記録の件数 */
  undated: number
  venues: string[]
  records: PriceObservation[]
}

/** YYYY / YYYY-MM を、その期間の最後の日として Date にする */
function endOfPeriod(p: string): Date | null {
  const m = /^(\d{4})(?:-(\d{2}))?$/.exec(p)
  if (!m) return null
  const y = Number(m[1])
  const mo = m[2] ? Number(m[2]) : 12
  return new Date(Date.UTC(y, mo, 0))
}

/**
 * 旅行者の購入記録だけを、選んだ場所の範囲で集計する。提示価格・卸値・通販価格は混ぜない。
 * 市場を選んでいてもその市場の記録がなければ、都市全体の記録を scope: 'city' として返す。
 */
export function purchaseRecords(
  item: Item,
  venueId: string | null,
  staleAfterDays: number,
  today: Date,
): PurchaseRecordView {
  const paid = item.observations.filter((o) => o.kind === 'tourist-paid')
  const inVenue = venueId === null ? [] : paid.filter((o) => o.venue === venueId)
  const scope = inVenue.length > 0 ? 'venue' : 'city'
  const records = scope === 'venue' ? inVenue : paid

  const dated = records.map((o) => o.publishedAt).filter((p): p is string => !!p && endOfPeriod(p) !== null).sort()
  const undated = records.length - dated.length
  const prices = records.map((o) => o.price)
  const staleBefore = today.getTime() - staleAfterDays * 86_400_000
  const allOld = dated.length > 0 && undated === 0 && dated.every((p) => endOfPeriod(p)!.getTime() < staleBefore)

  const state: RecordState =
    records.length === 0 ? 'insufficient' : allOld ? 'old' : records.length === 1 ? 'single' : 'ok'

  return {
    state,
    scope,
    min: prices.length ? Math.min(...prices) : 0,
    max: prices.length ? Math.max(...prices) : 0,
    count: records.length,
    earliest: dated[0] ?? null,
    latest: dated[dated.length - 1] ?? null,
    undated,
    venues: [...new Set(records.map((o) => o.venue))],
    records,
  }
}

export type AskPosition =
  | { position: 'below' }
  | { position: 'within' }
  | { position: 'above'; percent: number }

/** 提示額（1つあたり）が購入記録の範囲のどこにあるか。良し悪しの判定はしない */
export function compareAsk(askUnit: number, view: PurchaseRecordView): AskPosition | null {
  if (view.state === 'insufficient' || !Number.isInteger(askUnit) || askUnit <= 0) return null
  if (askUnit < view.min) return { position: 'below' }
  if (askUnit <= view.max) return { position: 'within' }
  return { position: 'above', percent: Math.round(((askUnit - view.max) / view.max) * 100) }
}

/** 数量は1〜99の整数に収める */
export function clampQuantity(n: number): number {
  if (!Number.isFinite(n)) return 1
  return Math.min(99, Math.max(1, Math.trunc(n)))
}
