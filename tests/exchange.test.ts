import { describe, expect, it } from 'vitest'
import { newerRate, parseRateResponse, type ExchangeRate } from '../src/lib/exchange'

describe('parseRateResponse', () => {
  it('Frankfurter API の応答からレートと日付を取り出す', () => {
    const json = { amount: 1, base: 'THB', date: '2026-10-02', rates: { JPY: 4.71 } }
    expect(parseRateResponse(json)).toEqual({ jpyPerUnit: 4.71, date: '2026-10-02' })
  })

  it('形が違う・値が不正なら null', () => {
    expect(parseRateResponse(null)).toBeNull()
    expect(parseRateResponse('x')).toBeNull()
    expect(parseRateResponse({ date: '2026-10-02', rates: {} })).toBeNull()
    expect(parseRateResponse({ date: '2026-10-02', rates: { JPY: 0 } })).toBeNull()
    expect(parseRateResponse({ date: '2026-10-02', rates: { JPY: '4.7' } })).toBeNull()
    expect(parseRateResponse({ date: 'yesterday', rates: { JPY: 4.7 } })).toBeNull()
  })
})

describe('newerRate', () => {
  const bundled: ExchangeRate = { jpyPerUnit: 4.73, date: '2026-10-04', origin: 'bundled' }

  it('保存値がなければ同梱の値', () => {
    expect(newerRate(null, bundled)).toBe(bundled)
  })

  it('日付が新しい方を使う', () => {
    const newer: ExchangeRate = { jpyPerUnit: 4.8, date: '2026-11-01', origin: 'cached' }
    const older: ExchangeRate = { jpyPerUnit: 4.5, date: '2026-01-01', origin: 'cached' }
    expect(newerRate(newer, bundled)).toBe(newer)
    expect(newerRate(older, bundled)).toBe(bundled)
  })
})
