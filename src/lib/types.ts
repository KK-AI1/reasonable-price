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
