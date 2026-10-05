import { describe, expect, it } from 'vitest'
import city from '../src/data/cities/bangkok.json'
import tableJson from '../src/data/fares/bangkok-taxi.json'
import { calcTaxiFare, distanceChargeSatang, judgeTaxiAsk } from '../src/lib/fare'
import type { TaxiConfig, TaxiFareInput, TaxiFareTable } from '../src/lib/types'

const table = tableJson as TaxiFareTable
const config = city.taxi as TaxiConfig

const base: TaxiFareInput = {
  distanceKm: 10,
  vehicle: 'standard',
  congestion: 'none',
  fromAirport: false,
  booked: false,
  tollBaht: 0,
}

describe('distanceChargeSatang', () => {
  it('初乗り区間（1km）以内は0', () => {
    expect(distanceChargeSatang(0, table)).toBe(0)
    expect(distanceChargeSatang(1, table)).toBe(0)
  })

  it('区間の境目をまたいで単価を合計する', () => {
    // 1〜10km: 9 × 6.50 = 58.50、10〜15km: 5 × 7.00 = 35.00
    expect(distanceChargeSatang(15, table)).toBe(9350)
  })

  it('80km を超える分は 10.50 バーツ／km', () => {
    // 58.5 + 70 + 160 + 170 + 180 + 20 × 10.5 = 848.5
    expect(distanceChargeSatang(100, table)).toBe(84850)
  })
})

describe('calcTaxiFare', () => {
  it('10km・一般車・渋滞なし：35 + 58.5 = 93.5 → 94 バーツ', () => {
    const r = calcTaxiFare(base, table, config)
    expect(r.meterBaht).toBe(94)
    expect(r.totalBaht).toBe(94)
  })

  it('1km 未満は初乗りのみ', () => {
    expect(calcTaxiFare({ ...base, distanceKm: 0.5 }, table, config).totalBaht).toBe(35)
  })

  it('大型車は初乗り 40 バーツで、未確認として扱う', () => {
    const r = calcTaxiFare({ ...base, vehicle: 'large' }, table, config)
    expect(r.totalBaht).toBe(99)
    expect(r.verified).toBe(false)
  })

  it('一般車は確認済み', () => {
    expect(calcTaxiFare(base, table, config).verified).toBe(true)
  })

  it('空港・渋滞・高速料金を加える', () => {
    // 25km: 35 + 58.5 + 70 + 40 = 203.5、渋滞ひどい 25 × 3分 = 75分 × 3 = 225
    // メーター 428.5 → 429、+ 空港 50 + 高速 75 = 554
    const r = calcTaxiFare(
      { ...base, distanceKm: 25, congestion: 'heavy', fromAirport: true, tollBaht: 75 },
      table,
      config,
    )
    expect(r.meterBaht).toBe(429)
    expect(r.breakdown.waitingMinutes).toBe(75)
    expect(r.breakdown.waitingBaht).toBe(225)
    expect(r.totalBaht).toBe(554)
  })

  it('呼び出し料金 20 バーツを加える', () => {
    expect(calcTaxiFare({ ...base, booked: true }, table, config).totalBaht).toBe(114)
  })

  it('内訳の合計が適正額と一致する', () => {
    for (const distanceKm of [0.3, 3.7, 12.2, 33.3, 61.9, 95.5]) {
      const r = calcTaxiFare({ ...base, distanceKm, congestion: 'normal', booked: true, tollBaht: 50 }, table, config)
      const b = r.breakdown
      const sum = b.flagFallBaht + b.distanceBaht + b.waitingBaht + b.bookingBaht + b.airportBaht + b.tollBaht
      expect(sum).toBe(r.totalBaht)
      expect(Number.isInteger(r.totalBaht)).toBe(true)
    }
  })

  it('不正な入力はエラー', () => {
    expect(() => calcTaxiFare({ ...base, distanceKm: -1 }, table, config)).toThrow(RangeError)
    expect(() => calcTaxiFare({ ...base, distanceKm: Number.NaN }, table, config)).toThrow(RangeError)
    expect(() => calcTaxiFare({ ...base, tollBaht: 1.5 }, table, config)).toThrow(RangeError)
  })
})

describe('judgeTaxiAsk', () => {
  it('しきい値で 妥当／やや高い／高すぎる を分ける', () => {
    expect(judgeTaxiAsk(100, 100, config)).toBe('fair')
    expect(judgeTaxiAsk(115, 100, config)).toBe('fair')
    expect(judgeTaxiAsk(116, 100, config)).toBe('caution')
    expect(judgeTaxiAsk(150, 100, config)).toBe('caution')
    expect(judgeTaxiAsk(151, 100, config)).toBe('high')
  })
})
