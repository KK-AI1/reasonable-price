/** 判定（docs/DESIGN.md §3 の fair / caution / high に対応） */
export type Verdict = 'fair' | 'caution' | 'high'

export type TaxiVehicle = 'standard' | 'large'
export type Congestion = 'none' | 'normal' | 'heavy'

export interface DistanceBand {
  fromKm: number
  /** null は上限なし */
  toKm: number | null
  /** 1km あたりの料金（サタン = 1/100 バーツ。小数を避けるため） */
  satangPerKm: number
}

export interface TaxiFareTable {
  id: string
  name: string
  currency: string
  effectiveFrom: string
  source: string
  sourceUrl: string
  checkedAt: string
  verified: boolean
  vehicles: Record<TaxiVehicle, { label: string; flagFallBaht: number; verified: boolean; note?: string }>
  flagFallKm: number
  distanceBands: DistanceBand[]
  waitingSatangPerMinute: number
  bookingSurchargeBaht: number
  airportSurchargeBaht: number
}

export interface TaxiConfig {
  congestionMinutesPerKm: Record<Congestion, number>
  verdict: { fairMaxRatio: number; cautionMaxRatio: number }
}

export interface TaxiFareInput {
  distanceKm: number
  vehicle: TaxiVehicle
  congestion: Congestion
  /** 空港の乗り場から乗る */
  fromAirport: boolean
  /** 配車センター・アプリ経由で呼ぶ */
  booked: boolean
  /** 高速道路の料金（実費、バーツ） */
  tollBaht: number
}

export interface TaxiFareResult {
  /** 適正額の目安（バーツ、整数） */
  totalBaht: number
  /** メーターに表示される額の目安（バーツ、整数） */
  meterBaht: number
  breakdown: {
    flagFallBaht: number
    distanceBaht: number
    waitingBaht: number
    waitingMinutes: number
    bookingBaht: number
    airportBaht: number
    tollBaht: number
  }
  /** 使ったデータがすべて確認済みか */
  verified: boolean
}

/** 交渉価格の幅（docs/SPEC.md §3.2・§4.1）。全員共通 */
export interface PriceRange {
  /** P25 */
  low: number
  /** P50：目標価格 */
  target: number
  /** P75：ここまでなら買ってよい */
  limit: number
}

export interface CoachConfig {
  floorRatioOfLow: number
  concessionRatio: number
  roundTo: number
  walkAwayAfterStalls: number
}

/** 交渉のやり取り。theirs は売り手の言い値（確定したものだけ）、ours はこちらが言った額 */
export interface CoachHistory {
  theirs: number[]
  ours: number[]
}

export type CoachMove =
  /** この額を提案する */
  | { action: 'offer'; amount: number; reason: 'first' | 'counter' | 'hold' | 'final' }
  /** 相手の額で買ってよい */
  | { action: 'buy'; amount: number; reason: 'at-or-below-target' | 'within-limit' | 'met-our-offer' }
  /** お礼を言って立ち去る */
  | { action: 'walk-away'; amount: number }
