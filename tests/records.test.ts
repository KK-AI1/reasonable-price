import { describe, expect, it } from 'vitest'
import { clampQuantity, compareAsk, purchaseRecords } from '../src/lib/records'
import type { Item, ObservationKind } from '../src/lib/types'

const today = new Date('2026-10-05T00:00:00Z')
const obs = (kind: ObservationKind, price: number, venue = 'market', publishedAt?: string) => ({
  kind,
  price,
  venue,
  publishedAt,
  source: `${kind}-${price}`,
  checkedAt: '2026-10-05',
  verified: false,
})
const item = (observations: ReturnType<typeof obs>[]): Item => ({
  id: 'x',
  name: 'テスト',
  unit: '1枚',
  keywords: [],
  negotiable: true,
  category: 'clothing',
  spec: '',
  observations,
})

describe('purchaseRecords', () => {
  it('購入記録だけを集計し、提示価格・卸値・通販価格を混ぜない', () => {
    const v = purchaseRecords(
      item([obs('tourist-paid', 100), obs('tourist-paid', 200), obs('tourist-asked', 900), obs('wholesale', 10), obs('local', 50)]),
      null,
      180,
      today,
    )
    expect(v).toMatchObject({ state: 'ok', scope: 'city', min: 100, max: 200, count: 2 })
  })

  it('選んだ市場の記録があれば、その市場だけを使う', () => {
    const it2 = item([obs('tourist-paid', 100, 'market'), obs('tourist-paid', 300, 'tourist-street'), obs('tourist-paid', 260, 'tourist-street')])
    expect(purchaseRecords(it2, 'tourist-street', 180, today)).toMatchObject({ scope: 'venue', min: 260, max: 300, count: 2 })
  })

  it('選んだ市場の記録がなければ、都市全体の記録として返す（市場の値段として扱わない）', () => {
    const it2 = item([obs('tourist-paid', 100, 'market'), obs('tourist-paid', 150, 'market')])
    expect(purchaseRecords(it2, 'asiatique', 180, today)).toMatchObject({ scope: 'city', count: 2 })
  })

  it('単一事例・情報不足を区別する', () => {
    expect(purchaseRecords(item([obs('tourist-paid', 100)]), null, 180, today).state).toBe('single')
    expect(purchaseRecords(item([obs('local', 100)]), null, 180, today).state).toBe('insufficient')
  })

  it('時期の分かる記録がすべて古ければ old。時期不明があれば old にしない', () => {
    const old = item([obs('tourist-paid', 100, 'market', '2023-01'), obs('tourist-paid', 120, 'market', '2024')])
    expect(purchaseRecords(old, null, 180, today)).toMatchObject({ state: 'old', earliest: '2023-01', latest: '2024' })
    const mixed = item([obs('tourist-paid', 100, 'market', '2023-01'), obs('tourist-paid', 120)])
    expect(purchaseRecords(mixed, null, 180, today)).toMatchObject({ state: 'ok', undated: 1 })
    const recent = item([obs('tourist-paid', 100, 'market', '2026-08'), obs('tourist-paid', 120, 'market', '2026-09')])
    expect(purchaseRecords(recent, null, 180, today).state).toBe('ok')
  })
})

describe('compareAsk', () => {
  const v = purchaseRecords(item([obs('tourist-paid', 100), obs('tourist-paid', 200)]), null, 180, today)
  it('範囲の下・内・上を返し、上なら何%高いかを返す', () => {
    expect(compareAsk(80, v)).toEqual({ position: 'below' })
    expect(compareAsk(150, v)).toEqual({ position: 'within' })
    expect(compareAsk(300, v)).toEqual({ position: 'above', percent: 50 })
  })
  it('不正な入力・情報不足では比べない', () => {
    expect(compareAsk(0, v)).toBeNull()
    expect(compareAsk(12.5, v)).toBeNull()
    expect(compareAsk(100, purchaseRecords(item([]), null, 180, today))).toBeNull()
  })
})

describe('clampQuantity', () => {
  it('1〜99の整数に収める', () => {
    expect(clampQuantity(0)).toBe(1)
    expect(clampQuantity(-3)).toBe(1)
    expect(clampQuantity(2.7)).toBe(2)
    expect(clampQuantity(500)).toBe(99)
    expect(clampQuantity(Number.NaN)).toBe(1)
  })
})
