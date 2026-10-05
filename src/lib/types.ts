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

/** 情報源の種類（docs/SPEC.md §3.1） */
export type ObservationKind = 'wholesale' | 'local' | 'tourist-paid' | 'tourist-asked'

export interface PriceObservation {
  kind: ObservationKind
  /** 1つあたりのバーツ */
  price: number
  /** 売り場の id。通販・卸は 'online' / 'wholesale'（係数 1.0 扱い） */
  venue: string
  /** 原文（値段の書かれ方） */
  quote?: string
  source: string
  sourceUrl?: string
  /** 情報が書かれた時期（YYYY または YYYY-MM） */
  publishedAt?: string
  checkedAt: string
  verified: boolean
}

export interface Item {
  id: string
  name: string
  unit: string
  keywords: string[]
  negotiable: boolean
  /** 画面に出す補足（ブランド風の注意など） */
  note?: string
  observations: PriceObservation[]
}

export interface Venue {
  id: string
  name: string
  factor: number
  negotiable: boolean
}

export interface PriceConfig {
  minObservations: number
  minObservationsForFull: number
  minKindsForFull: number
  defaultRetailMarkup: number
  minSellerMargin: number
  lowRatioWithoutData: number
  minLimitRatio: number
  limitRatioWithoutTourist: number
  quantityTiers: { minQty: number; factor: number }[]
  verdictHighRatio: number
  askMarkup: number
  staleAfterDays: number
}

export type PriceEstimate =
  | { status: 'no-haggle' }
  | { status: 'insufficient'; count: number }
  | {
      status: 'ok' | 'few'
      /** 1つあたり */
      unit: PriceRange
      /** 数量分の合計 */
      total: PriceRange
      quantity: number
      count: number
      /** 種類ごとの件数 */
      counts: Record<ObservationKind, number>
      /** 売り手の最初の言い値の予測（合計） */
      predictedAsk: number
      verified: boolean
      sources: { source: string; sourceUrl?: string; checkedAt: string; kind: ObservationKind }[]
    }
