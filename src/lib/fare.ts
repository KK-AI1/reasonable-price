import type { TaxiConfig, TaxiFareInput, TaxiFareResult, TaxiFareTable, Verdict } from './types'

/** 初乗り区間を超えた距離の料金（サタン）。区間ごとの単価を合計する */
export function distanceChargeSatang(distanceKm: number, table: TaxiFareTable): number {
  let total = 0
  for (const band of table.distanceBands) {
    const upper = band.toKm ?? Number.POSITIVE_INFINITY
    const km = Math.min(distanceKm, upper) - band.fromKm
    if (km > 0) total += km * band.satangPerKm
  }
  return total
}

/** メータータクシーの適正額を計算する（docs/SPEC.md §2.2） */
export function calcTaxiFare(input: TaxiFareInput, table: TaxiFareTable, config: TaxiConfig): TaxiFareResult {
  if (!Number.isFinite(input.distanceKm) || input.distanceKm < 0) {
    throw new RangeError('distanceKm must be a non-negative number')
  }
  if (!Number.isInteger(input.tollBaht) || input.tollBaht < 0) {
    throw new RangeError('tollBaht must be a non-negative integer')
  }

  const vehicle = table.vehicles[input.vehicle]
  const flagFallBaht = vehicle.flagFallBaht
  const waitingMinutes = Math.round(input.distanceKm * config.congestionMinutesPerKm[input.congestion])
  const waitingSatang = waitingMinutes * table.waitingSatangPerMinute
  const distanceSatang = distanceChargeSatang(input.distanceKm, table)

  const meterBaht = Math.round((flagFallBaht * 100 + distanceSatang + waitingSatang) / 100)
  const waitingBaht = Math.round(waitingSatang / 100)
  // 内訳の合計がメーター額と一致するよう、距離料金は差し引きで出す
  const distanceBaht = meterBaht - flagFallBaht - waitingBaht

  const bookingBaht = input.booked ? table.bookingSurchargeBaht : 0
  const airportBaht = input.fromAirport ? table.airportSurchargeBaht : 0

  return {
    totalBaht: meterBaht + bookingBaht + airportBaht + input.tollBaht,
    meterBaht,
    breakdown: {
      flagFallBaht,
      distanceBaht,
      waitingBaht,
      waitingMinutes,
      bookingBaht,
      airportBaht,
      tollBaht: input.tollBaht,
    },
    verified: table.verified && vehicle.verified,
  }
}

/** 運転手の言い値を判定する（docs/SPEC.md §2.3） */
export function judgeTaxiAsk(askBaht: number, fairBaht: number, config: TaxiConfig): Verdict {
  if (fairBaht <= 0) throw new RangeError('fairBaht must be positive')
  const ratio = askBaht / fairBaht
  if (ratio <= config.verdict.fairMaxRatio) return 'fair'
  if (ratio <= config.verdict.cautionMaxRatio) return 'caution'
  return 'high'
}
