import type { CoachConfig, CoachHistory, CoachMove, PriceRange } from './types'

/** これより下は言わない額（docs/SPEC.md §4.1） */
export function floorAmount(range: PriceRange, config: CoachConfig): number {
  return Math.ceil((range.low * config.floorRatioOfLow) / config.roundTo) * config.roundTo
}

/** 切りのいい額に切り上げる。ただし上限を超えない */
function roundUpCapped(amount: number, cap: number, roundTo: number): number {
  return Math.min(Math.ceil(amount / roundTo) * roundTo, cap)
}

/** 最初に言う金額：売り手の言い値との中間が目標価格になるように決める（docs/SPEC.md §4.2） */
export function firstOffer(ask: number, range: PriceRange, config: CoachConfig): number {
  const floor = floorAmount(range, config)
  const raw = Math.max(2 * range.target - ask, floor)
  return Math.max(roundUpCapped(raw, range.target, config.roundTo), Math.min(floor, range.target))
}

/** 売り手が下げなかった回数（直近から数える） */
function countStalls(theirs: number[]): number {
  let stalls = 0
  for (let i = theirs.length - 1; i > 0; i--) {
    if (theirs[i] < theirs[i - 1]) break
    stalls += 1
  }
  return stalls
}

/**
 * 次の一手を計算する（docs/SPEC.md §4.2〜§4.4）。
 * 金額はすべてここで決める。AI や音声機能は、この結果をそのまま使う。
 */
export function nextMove(history: CoachHistory, range: PriceRange, config: CoachConfig): CoachMove {
  const { theirs, ours } = history
  if (theirs.length === 0) throw new Error('nextMove: 売り手の言い値が必要です')
  for (const v of [...theirs, ...ours]) {
    if (!Number.isInteger(v) || v <= 0) throw new RangeError('金額は正の整数で渡してください')
  }

  const last = theirs[theirs.length - 1]
  if (last <= range.target) return { action: 'buy', amount: last, reason: 'at-or-below-target' }

  const lastOurs = ours.length > 0 ? ours[ours.length - 1] : null
  if (lastOurs !== null && last <= lastOurs) return { action: 'buy', amount: last, reason: 'met-our-offer' }

  if (lastOurs === null) {
    return { action: 'offer', amount: firstOffer(last, range, config), reason: 'first' }
  }

  const stalls = countStalls(theirs)
  if (stalls >= 1 && last <= range.limit) return { action: 'buy', amount: last, reason: 'within-limit' }
  if (stalls >= config.walkAwayAfterStalls) return { action: 'walk-away', amount: lastOurs }

  // 相手が譲った分の一部だけ譲る。目標価格は超えない
  const prevTheirs = theirs.length >= 2 ? theirs[theirs.length - 2] : last
  const concession = Math.max(0, prevTheirs - last)
  if (concession === 0) return { action: 'offer', amount: lastOurs, reason: 'hold' }

  const next = roundUpCapped(lastOurs + concession * config.concessionRatio, range.target, config.roundTo)
  const amount = Math.max(next, lastOurs)
  if (amount >= last) return { action: 'buy', amount: last, reason: 'met-our-offer' }
  return { action: 'offer', amount, reason: amount === range.target ? 'final' : 'counter' }
}

/** 売り手の最初の言い値の予測（docs/SPEC.md §4.5）。見え方の係数は予測にだけ使う */
export function predictAsk(range: PriceRange, markup: number, appearanceFactor: number, roundTo: number): number {
  return Math.round((range.target * markup * appearanceFactor) / roundTo) * roundTo
}
