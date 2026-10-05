import { describe, expect, it } from 'vitest'
import city from '../src/data/cities/bangkok.json'
import itemsJson from '../src/data/items/bangkok-items.json'
import { estimatePrice, judgePrice, quantile, quantityFactor } from '../src/lib/price'
import type { Item, PriceConfig, Venue } from '../src/lib/types'

const config = city.price as PriceConfig
const venues = city.venues as Venue[]
const venue = (id: string) => venues.find((v) => v.id === id)!

const obs = (price: number, venue = 'market', verified = true) => ({
  price,
  venue,
  source: `src-${price}`,
  checkedAt: '2026-10-05',
  verified,
})
const item = (prices: number[], extra: Partial<Item> = {}): Item => ({
  id: 'x',
  name: 'テスト',
  unit: '1個',
  keywords: [],
  negotiable: true,
  observations: prices.map((p) => obs(p)),
  ...extra,
})

describe('quantile', () => {
  it('線形補間', () => {
    expect(quantile([100, 200, 300, 400, 500], 0.5)).toBe(300)
    expect(quantile([100, 200, 300, 400, 500], 0.25)).toBe(200)
    expect(quantile([100, 200], 0.5)).toBe(150)
  })
})

describe('estimatePrice', () => {
  it('5件以上は P25〜P75', () => {
    const r = estimatePrice(item([100, 200, 300, 400, 500]), venue('market'), 1, venues, config)
    expect(r).toMatchObject({ status: 'ok', unit: { low: 200, target: 300, limit: 400 }, verified: true })
  })

  it('2〜4件は最小〜最大で「少ない」', () => {
    const r = estimatePrice(item([100, 150, 250, 300]), venue('market'), 1, venues, config)
    expect(r).toMatchObject({ status: 'few', unit: { low: 100, target: 200, limit: 300 } })
  })

  it('1件以下は データ不足', () => {
    expect(estimatePrice(item([100]), venue('market'), 1, venues, config)).toEqual({ status: 'insufficient', count: 1 })
  })

  it('交渉しない売り場', () => {
    expect(estimatePrice(item([100, 200]), venue('mall'), 1, venues, config)).toEqual({ status: 'no-haggle' })
  })

  it('売り場の係数を掛ける。観測値は基準の売り場に換算してから使う', () => {
    const it2: Item = { ...item([]), observations: [obs(130, 'tourist-street'), obs(260, 'tourist-street')] }
    const r = estimatePrice(it2, venue('market'), 1, venues, config)
    expect(r).toMatchObject({ unit: { low: 100, target: 150, limit: 200 } })
    const r2 = estimatePrice(it2, venue('tourist-street'), 1, venues, config)
    expect(r2).toMatchObject({ unit: { low: 130, target: 195, limit: 260 } })
  })

  it('数量の段階で1つあたりを下げ、合計を出す', () => {
    expect(quantityFactor(1, config)).toBe(1)
    expect(quantityFactor(3, config)).toBe(0.9)
    expect(quantityFactor(10, config)).toBe(0.8)
    const r = estimatePrice(item([100, 200]), venue('market'), 3, venues, config)
    expect(r).toMatchObject({ unit: { target: 135 }, total: { low: 270, target: 405, limit: 540 }, quantity: 3 })
  })

  it('未確認の観測値が1つでもあれば verified=false', () => {
    const it2: Item = { ...item([]), observations: [obs(100), obs(200, 'market', false)] }
    expect(estimatePrice(it2, venue('market'), 1, venues, config)).toMatchObject({ verified: false })
  })

  it('金額はすべて整数', () => {
    const r = estimatePrice(item([33, 47, 51, 89, 120, 133]), venue('chatuchak'), 7, venues, config)
    if (r.status !== 'ok' && r.status !== 'few') throw new Error()
    for (const v of [...Object.values(r.unit), ...Object.values(r.total)]) expect(Number.isInteger(v)).toBe(true)
  })

  it('同梱の品目データはすべて推定できる', () => {
    for (const it2 of itemsJson.items as Item[]) {
      const r = estimatePrice(it2, venue('market'), 1, venues, config)
      expect(['ok', 'few']).toContain(r.status)
    }
  })
})

describe('judgePrice', () => {
  const range = { low: 160, target: 200, limit: 250 }
  it('上限以下は妥当、目安×1.8以下はやや高い、それ以上は高すぎる', () => {
    expect(judgePrice(250, range, config)).toBe('fair')
    expect(judgePrice(251, range, config)).toBe('caution')
    expect(judgePrice(360, range, config)).toBe('caution')
    expect(judgePrice(361, range, config)).toBe('high')
  })
})
