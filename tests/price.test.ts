import { describe, expect, it } from 'vitest'
import city from '../src/data/cities/bangkok.json'
import itemsJson from '../src/data/items/bangkok-items.json'
import { baseRange, estimatePrice, judgePrice, quantile, quantityFactor, runSearch, searchItems, summarizeRecords } from '../src/lib/price'
import type { Item, ObservationKind, PriceConfig, Venue } from '../src/lib/types'

const config = city.price as PriceConfig
const venues = city.venues as Venue[]
const venue = (id: string) => venues.find((v) => v.id === id)!

const obs = (kind: ObservationKind, price: number, venue = 'market', verified = true) => ({
  kind,
  price,
  venue,
  source: `${kind}-${price}-${venue}`,
  checkedAt: '2026-10-05',
  verified,
})
const item = (observations: ReturnType<typeof obs>[], extra: Partial<Item> = {}): Item => ({
  id: 'x',
  name: 'テスト',
  unit: '1個',
  keywords: [],
  negotiable: true,
  category: 'goods',
  spec: '',
  observations,
  ...extra,
})

describe('quantile', () => {
  it('線形補間', () => {
    expect(quantile([100, 200, 300, 400, 500], 0.5)).toBe(300)
    expect(quantile([100, 200, 300, 400, 500], 0.25)).toBe(200)
    expect(quantile([100, 200], 0.5)).toBe(150)
  })
})

describe('baseRange', () => {
  it('地元の小売が目安、旅行者が払った額が上限、卸値が下限を支える', () => {
    const r = baseRange(
      item([
        obs('wholesale', 60, 'wholesale'),
        obs('local', 120, 'online'),
        obs('local', 150, 'online'),
        obs('tourist-paid', 150),
        obs('tourist-paid', 200),
        obs('tourist-paid', 250),
      ]),
      venues,
      config,
    )!
    // target = 地元の中央値 135
    expect(r.target).toBe(135)
    // limit = 旅行者の 75% 点 225 と 135×1.15 の大きい方
    expect(r.limit).toBe(225)
    // low = 小売と旅行者をまとめた25%点 150 を目安 135 で抑え、卸 60×1.3=78 と比べて大きい方
    expect(r.low).toBe(135)
  })

  it('卸値で下限を支える：小売の安値が卸値＋利益より低ければ持ち上げる', () => {
    const r = baseRange(item([obs('wholesale', 100), obs('local', 105), obs('local', 200)]), venues, config)!
    // 小売の25%点 128.75 < 卸 100 × 1.3 = 130
    expect(r.low).toBe(130)
    expect(r.target).toBe(152.5)
  })

  it('卸値＋最低利益が目安を上回るなら、目安をそこまで上げる', () => {
    const r = baseRange(item([obs('wholesale', 100), obs('local', 110), obs('local', 120)]), venues, config)!
    expect(r.low).toBe(130)
    expect(r.target).toBe(130)
  })

  it('地元の値がなければ、旅行者が払った額の中央値が目安', () => {
    const r = baseRange(item([obs('tourist-paid', 100), obs('tourist-paid', 300)]), venues, config)!
    expect(r.target).toBe(200)
  })

  it('卸値しかなければ、卸値 × 標準の小売倍率', () => {
    const r = baseRange(item([obs('wholesale', 50), obs('wholesale', 70)]), venues, config)!
    expect(r.target).toBe(120)
    expect(r.limit).toBeCloseTo(156)
  })

  it('言い値は目安の計算に使わない', () => {
    const a = baseRange(item([obs('local', 100), obs('local', 200)]), venues, config)
    const b = baseRange(item([obs('local', 100), obs('local', 200), obs('tourist-asked', 900)]), venues, config)
    expect(b).toEqual(a)
  })

  it('観光通りで払った額は、基準の売り場に換算してから使う', () => {
    const r = baseRange(item([obs('tourist-paid', 130, 'tourist-street'), obs('tourist-paid', 260, 'tourist-street')]), venues, config)!
    expect(r.target).toBe(150)
  })
})

describe('estimatePrice', () => {
  const rich = item([
    obs('wholesale', 60, 'wholesale'),
    obs('local', 120, 'online'),
    obs('local', 150, 'online'),
    obs('tourist-paid', 200),
    obs('tourist-asked', 400),
  ])

  it('2種類以上・4件以上なら ok。売り場の係数を掛ける', () => {
    const r = estimatePrice(rich, venue('tourist-street'), 1, venues, config)
    expect(r.status).toBe('ok')
    if (r.status !== 'ok') return
    expect(r.unit.target).toBe(Math.round(135 * 1.3))
    expect(r.counts).toEqual({ wholesale: 1, local: 2, 'tourist-paid': 1, 'tourist-asked': 1 })
  })

  it('言い値の予測は、言われた額 ÷ 目安 の倍率を使う', () => {
    const r = estimatePrice(rich, venue('market'), 1, venues, config)
    if (r.status !== 'ok') throw new Error()
    // 400 / 135 ≈ 2.96 → 135 × 2.96 = 400
    expect(r.predictedAsk).toBe(400)
  })

  it('1種類だけ・件数が少なければ few', () => {
    expect(estimatePrice(item([obs('local', 100), obs('local', 200)]), venue('market'), 1, venues, config).status).toBe('few')
  })

  it('使える観測値が2件未満なら データ不足（言い値だけでは出さない）', () => {
    expect(estimatePrice(item([obs('local', 100), obs('tourist-asked', 300)]), venue('market'), 1, venues, config)).toEqual({
      status: 'insufficient',
      count: 1,
    })
    expect(estimatePrice(item([]), venue('market'), 1, venues, config)).toEqual({ status: 'insufficient', count: 0 })
  })

  it('交渉しない売り場', () => {
    expect(estimatePrice(rich, venue('mall'), 1, venues, config)).toEqual({ status: 'no-haggle' })
  })

  it('数量の段階で1つあたりを下げ、合計を出す', () => {
    const tiered = { ...config, quantityTiers: [{ minQty: 1, factor: 1 }, { minQty: 2, factor: 0.9 }, { minQty: 5, factor: 0.8 }] }
    expect(quantityFactor(1, tiered)).toBe(1)
    expect(quantityFactor(3, tiered)).toBe(0.9)
    expect(quantityFactor(10, tiered)).toBe(0.8)
    const r = estimatePrice(item([obs('local', 100), obs('local', 200)]), venue('market'), 3, venues, tiered)
    expect(r).toMatchObject({ unit: { target: 135 }, total: { target: 405 }, quantity: 3 })
  })

  it('同梱の設定では、まとめ買いの値引きをしない（合計＝単価×数量）', () => {
    for (const q of [1, 2, 5, 12]) expect(quantityFactor(q, config)).toBe(1)
    const r = estimatePrice(item([obs('local', 100), obs('local', 200)]), venue('market'), 4, venues, config)
    if (r.status !== 'few') throw new Error()
    expect(r.total.target).toBe(r.unit.target * 4)
  })

  it('未確認の観測値が1つでもあれば verified=false', () => {
    const r = estimatePrice(item([obs('local', 100), obs('local', 200, 'market', false)]), venue('market'), 1, venues, config)
    expect(r).toMatchObject({ verified: false })
  })

  it('金額はすべて整数で、low ≤ target ≤ limit', () => {
    const it2 = item([obs('wholesale', 33), obs('local', 47, 'online'), obs('local', 51), obs('tourist-paid', 89, 'chatuchak'), obs('tourist-paid', 120)])
    for (const v of venues.filter((x) => x.negotiable)) {
      for (const q of [1, 2, 7]) {
        const r = estimatePrice(it2, v, q, venues, config)
        if (r.status !== 'ok' && r.status !== 'few') throw new Error()
        for (const x of [...Object.values(r.unit), ...Object.values(r.total), r.predictedAsk]) expect(Number.isInteger(x)).toBe(true)
        expect(r.total.low).toBeLessThanOrEqual(r.total.target)
        expect(r.total.target).toBeLessThanOrEqual(r.total.limit)
      }
    }
  })

  it('同梱の品目データは、データ不足でなければ幅が整っている', () => {
    for (const it2 of itemsJson.items as Item[]) {
      const r = estimatePrice(it2, venue('market'), 1, venues, config)
      if (r.status === 'ok' || r.status === 'few') {
        expect(r.unit.low).toBeLessThanOrEqual(r.unit.target)
        expect(r.unit.target).toBeLessThanOrEqual(r.unit.limit)
      }
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

describe('searchItems', () => {
  const items = [item([], { id: 'a', name: '象柄のパンツ', keywords: ['タイパンツ', 'กางเกงช้าง'] }), item([], { id: 'b', name: 'Tシャツ', keywords: [] })]
  it('名前・キーワードの一部で探す', () => {
    expect(searchItems(items, 'パンツ').map((i) => i.id)).toEqual(['a'])
    expect(searchItems(items, 'タイパンツ').map((i) => i.id)).toEqual(['a'])
    expect(searchItems(items, 'tシャツ').map((i) => i.id)).toEqual(['b'])
    expect(searchItems(items, '').map((i) => i.id)).toEqual([])
  })

  it('別名に完全一致する品目を、部分一致より先に並べる', () => {
    const list = [
      item([], { id: 'muay', name: 'ムエタイパンツ', keywords: [] }),
      item([], { id: 'elephant', name: '象柄のパンツ', keywords: ['タイパンツ'] }),
    ]
    expect(searchItems(list, 'タイパンツ').map((i) => i.id)).toEqual(['elephant', 'muay'])
  })
})

describe('summarizeRecords', () => {
  it('種類ごとに分け、購入記録と提示価格を混ぜない。値は換算しない', () => {
    const r = summarizeRecords(
      item([obs('tourist-paid', 100), obs('tourist-paid', 300, 'tourist-street'), obs('tourist-asked', 500), obs('wholesale', 50, 'wholesale')]),
    )
    expect(r).toEqual([
      { kind: 'tourist-paid', min: 100, max: 300, count: 2, venues: ['market', 'tourist-street'] },
      { kind: 'tourist-asked', min: 500, max: 500, count: 1, venues: ['market'] },
      { kind: 'wholesale', min: 50, max: 50, count: 1, venues: ['wholesale'] },
    ])
  })

  it('記録がなければ空', () => {
    expect(summarizeRecords(item([]))).toEqual([])
  })
})

describe('runSearch', () => {
  const items = [item([], { id: 'a', name: '象柄のパンツ', keywords: ['タイパンツ'] })]
  it('0件とデータ取得の失敗を区別する', () => {
    expect(runSearch(items, 'パンツ')).toEqual({ status: 'ok', items })
    expect(runSearch(items, '')).toEqual({ status: 'ok', items })
    expect(runSearch(items, '時計')).toEqual({ status: 'empty' })
    expect(runSearch(null, 'パンツ')).toEqual({ status: 'error' })
  })
})
