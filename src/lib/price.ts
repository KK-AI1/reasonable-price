import type { Item, PriceConfig, PriceEstimate, PriceRange, Venue, Verdict } from './types'

/** 分位点（線形補間）。values は昇順 */
export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) throw new RangeError('quantile: 値がありません')
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

export function quantityFactor(quantity: number, config: PriceConfig): number {
  let factor = 1
  for (const tier of config.quantityTiers) if (quantity >= tier.minQty) factor = tier.factor
  return factor
}

/** 交渉価格の幅を推定する（docs/SPEC.md §3.2〜§3.5） */
export function estimatePrice(
  item: Item,
  venue: Venue,
  quantity: number,
  venues: Venue[],
  config: PriceConfig,
): PriceEstimate {
  if (!Number.isInteger(quantity) || quantity < 1) throw new RangeError('quantity は1以上の整数')
  if (!venue.negotiable || !item.negotiable) return { status: 'no-haggle' }

  const count = item.observations.length
  if (count < config.minObservationsForRange) return { status: 'insufficient', count }

  // 観測値を基準の売り場（係数1.0）に換算する
  const factorOf = (id: string) => venues.find((v) => v.id === id)?.factor ?? 1
  const base = item.observations.map((o) => o.price / factorOf(o.venue)).sort((a, b) => a - b)

  const status = count >= config.minObservationsForQuantiles ? 'ok' : 'few'
  const [lowQ, highQ] = status === 'ok' ? [0.25, 0.75] : [0, 1]
  const unitBase = { low: quantile(base, lowQ), target: quantile(base, 0.5), limit: quantile(base, highQ) }

  const qf = quantityFactor(quantity, config)
  const scale = (v: number, n: number) => Math.round(v * venue.factor * qf * n)
  const unit: PriceRange = {
    low: scale(unitBase.low, 1),
    target: scale(unitBase.target, 1),
    limit: scale(unitBase.limit, 1),
  }
  const total: PriceRange = {
    low: scale(unitBase.low, quantity),
    target: scale(unitBase.target, quantity),
    limit: scale(unitBase.limit, quantity),
  }

  const sources = new Map<string, { source: string; sourceUrl?: string; checkedAt: string }>()
  for (const o of item.observations) sources.set(o.source, { source: o.source, sourceUrl: o.sourceUrl, checkedAt: o.checkedAt })

  return {
    status,
    unit,
    total,
    quantity,
    count,
    verified: item.observations.every((o) => o.verified),
    sources: [...sources.values()],
  }
}

/** 提示額を判定する（docs/SPEC.md §3.4） */
export function judgePrice(ask: number, range: PriceRange, config: PriceConfig): Verdict {
  if (ask <= range.limit) return 'fair'
  if (ask <= range.target * config.verdictHighRatio) return 'caution'
  return 'high'
}
