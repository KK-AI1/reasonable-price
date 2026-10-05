import type { Item, ObservationKind, PriceConfig, PriceEstimate, PriceRange, Venue, Verdict } from './types'

/** 分位点（線形補間）。sorted は昇順 */
export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) throw new RangeError('quantile: 値がありません')
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

const median = (sorted: number[]) => quantile(sorted, 0.5)

export function quantityFactor(quantity: number, config: PriceConfig): number {
  let factor = 1
  for (const tier of config.quantityTiers) if (quantity >= tier.minQty) factor = tier.factor
  return factor
}

/**
 * 基準の売り場（一般の市場）での1つあたりの幅を出す（docs/SPEC.md §3.3）。
 * 卸値・地元の小売・旅行者が払った額を使い、言い値は使わない。
 */
export function baseRange(item: Item, venues: Venue[], config: PriceConfig): PriceRange | null {
  const factorOf = (id: string) => venues.find((v) => v.id === id)?.factor ?? 1
  const values = (kind: ObservationKind) =>
    item.observations
      .filter((o) => o.kind === kind)
      // 店頭の値段は売り場の差を除いて、基準の売り場に換算する。卸値は換算しない
      .map((o) => (kind === 'wholesale' ? o.price : o.price / factorOf(o.venue)))
      .sort((a, b) => a - b)

  const W = values('wholesale')
  const L = values('local')
  const T = values('tourist-paid')
  if (W.length + L.length + T.length === 0) return null

  const target = L.length > 0 ? median(L) : T.length > 0 ? median(T) : median(W) * config.defaultRetailMarkup

  const retail = [...L, ...T].sort((a, b) => a - b)
  // 下限は目安を超えないようにしたうえで、卸値＋最低利益より下にはしない（売り手が損をしないため）
  let low = Math.min(retail.length > 0 ? quantile(retail, 0.25) : target * config.lowRatioWithoutData, target)
  if (W.length > 0) low = Math.max(low, median(W) * (1 + config.minSellerMargin))

  const limit =
    T.length > 0
      ? Math.max(quantile(T, 0.75), target * config.minLimitRatio)
      : target * config.limitRatioWithoutTourist

  // 卸値＋最低利益が目安を上回るときは、目安をそこまで上げる
  const t = Math.max(target, low)
  return { low, target: t, limit: Math.max(limit, t) }
}

/** 交渉価格の幅を推定する（docs/SPEC.md §3.3〜§3.6・§4.5） */
export function estimatePrice(
  item: Item,
  venue: Venue,
  quantity: number,
  venues: Venue[],
  config: PriceConfig,
): PriceEstimate {
  if (!Number.isInteger(quantity) || quantity < 1) throw new RangeError('quantity は1以上の整数')
  if (!venue.negotiable || !item.negotiable) return { status: 'no-haggle' }

  const counts: Record<ObservationKind, number> = { wholesale: 0, local: 0, 'tourist-paid': 0, 'tourist-asked': 0 }
  for (const o of item.observations) counts[o.kind] += 1
  const usable = counts.wholesale + counts.local + counts['tourist-paid']
  const kinds = [counts.wholesale, counts.local, counts['tourist-paid']].filter((n) => n > 0).length

  const base = baseRange(item, venues, config)
  if (!base || usable < config.minObservations) return { status: 'insufficient', count: usable }

  const status = usable >= config.minObservationsForFull && kinds >= config.minKindsForFull ? 'ok' : 'few'
  const qf = quantityFactor(quantity, config)
  const scale = (v: number, n: number) => Math.round(v * venue.factor * qf * n)
  const range = (n: number): PriceRange => ({
    low: scale(base.low, n),
    target: scale(base.target, n),
    limit: scale(base.limit, n),
  })

  // 言い値の予測：旅行者が言われた額があれば、その目安に対する倍率を使う
  const asked = item.observations
    .filter((o) => o.kind === 'tourist-asked')
    .map((o) => o.price / (venues.find((v) => v.id === o.venue)?.factor ?? 1))
    .sort((a, b) => a - b)
  const markup = asked.length > 0 ? Math.max(1, median(asked) / base.target) : config.askMarkup
  const total = range(quantity)

  const sources = new Map<string, { source: string; sourceUrl?: string; checkedAt: string; kind: ObservationKind }>()
  for (const o of item.observations) {
    sources.set(o.source, { source: o.source, sourceUrl: o.sourceUrl, checkedAt: o.checkedAt, kind: o.kind })
  }

  return {
    status,
    unit: range(1),
    total,
    quantity,
    count: usable,
    counts,
    predictedAsk: Math.round((total.target * markup) / 10) * 10,
    verified: item.observations.every((o) => o.verified),
    sources: [...sources.values()],
  }
}

/** 提示額を判定する（docs/SPEC.md §3.5） */
export function judgePrice(ask: number, range: PriceRange, config: PriceConfig): Verdict {
  if (ask <= range.limit) return 'fair'
  if (ask <= range.target * config.verdictHighRatio) return 'caution'
  return 'high'
}

/**
 * 品目を名前・別名（keywords）で探す（端末内のデータだけ。費用0円）。
 * 名前か別名に完全に一致するものを先に、部分一致をその後に並べる。
 */
export function searchItems(items: Item[], query: string): Item[] {
  const q = query.trim().toLowerCase()
  if (q === '') return []
  const score = (i: Item): number => {
    const name = i.name.toLowerCase()
    const words = i.keywords.map((w) => w.toLowerCase())
    if (name === q || words.includes(q)) return 0
    if (name.includes(q)) return 1
    if (words.some((w) => w.includes(q))) return 2
    if (words.some((w) => q.includes(w))) return 3
    return -1
  }
  return items
    .map((i, index) => ({ i, s: score(i), index }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => a.s - b.s || a.index - b.index)
    .map((x) => x.i)
}

export interface RecordSummary {
  kind: ObservationKind
  min: number
  max: number
  count: number
  /** 記録の場所（売り場 id）。都市全体の記録を特定の市場の値段と混同しないために使う */
  venues: string[]
}

/**
 * 記録を種類ごとに分けて集計する。購入記録と提示価格などを混ぜない。
 * 値は記録そのまま（売り場の係数で換算しない）。
 */
export function summarizeRecords(item: Item): RecordSummary[] {
  const order: ObservationKind[] = ['tourist-paid', 'tourist-asked', 'local', 'wholesale']
  return order
    .map((kind) => {
      const obs = item.observations.filter((o) => o.kind === kind)
      if (obs.length === 0) return null
      const prices = obs.map((o) => o.price)
      return {
        kind,
        min: Math.min(...prices),
        max: Math.max(...prices),
        count: obs.length,
        venues: [...new Set(obs.map((o) => o.venue))],
      }
    })
    .filter((r): r is RecordSummary => r !== null)
}

export type SearchResult =
  | { status: 'ok'; items: Item[] }
  | { status: 'empty' }
  /** データを取得できなかった（将来サーバーから探すときの通信エラーなど） */
  | { status: 'error' }

/** 検索の結果を、0件とエラーを区別して返す */
export function runSearch(items: Item[] | null | undefined, query: string): SearchResult {
  if (!Array.isArray(items)) return { status: 'error' }
  const found = query.trim() === '' ? items : searchItems(items, query)
  return found.length === 0 ? { status: 'empty' } : { status: 'ok', items: found }
}
