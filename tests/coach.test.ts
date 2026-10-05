import { describe, expect, it } from 'vitest'
import city from '../src/data/cities/bangkok.json'
import { firstOffer, floorAmount, nextMove, predictAsk } from '../src/lib/coach'
import type { CoachConfig, PriceRange } from '../src/lib/types'

const config = city.coach as CoachConfig
const range: PriceRange = { low: 160, target: 200, limit: 250 }

describe('firstOffer', () => {
  it('SPEC の例：目安200・P25 160・言い値400 → 下限144を切り上げて150', () => {
    expect(floorAmount(range, config)).toBe(150)
    expect(firstOffer(400, range, config)).toBe(150)
  })

  it('言い値が目標に近ければ、中間が目標になる額', () => {
    // 2×200 − 230 = 170
    expect(firstOffer(230, range, config)).toBe(170)
  })

  it('目標価格を超えない', () => {
    expect(firstOffer(201, range, config)).toBeLessThanOrEqual(200)
  })
})

describe('nextMove', () => {
  it('言い値が目標以下なら買う', () => {
    expect(nextMove({ theirs: [180], ours: [] }, range, config)).toEqual({
      action: 'buy',
      amount: 180,
      reason: 'at-or-below-target',
    })
  })

  it('最初の一手', () => {
    expect(nextMove({ theirs: [400], ours: [] }, range, config)).toEqual({
      action: 'offer',
      amount: 150,
      reason: 'first',
    })
  })

  it('相手が下げた分の半分だけ上げる', () => {
    // 400 → 320（80下げた）→ こちらは 150 + 40 = 190
    expect(nextMove({ theirs: [400, 320], ours: [150] }, range, config)).toEqual({
      action: 'offer',
      amount: 190,
      reason: 'counter',
    })
  })

  it('目標価格で止める', () => {
    // 400 → 260（140下げた）→ 150 + 70 = 220 → 目標200で止める
    expect(nextMove({ theirs: [400, 260], ours: [150] }, range, config)).toEqual({
      action: 'offer',
      amount: 200,
      reason: 'final',
    })
  })

  it('相手が下げず、上限以内なら買ってよい', () => {
    expect(nextMove({ theirs: [300, 240, 240], ours: [150, 180] }, range, config)).toEqual({
      action: 'buy',
      amount: 240,
      reason: 'within-limit',
    })
  })

  it('相手が下げず上限を超えている：1回目は据え置き、2回続けば立ち去る', () => {
    expect(nextMove({ theirs: [400, 300, 300], ours: [150, 200] }, range, config)).toEqual({
      action: 'offer',
      amount: 200,
      reason: 'hold',
    })
    expect(nextMove({ theirs: [400, 300, 300, 300], ours: [150, 200, 200] }, range, config)).toEqual({
      action: 'walk-away',
      amount: 200,
    })
  })

  it('相手がこちらの額まで下げたら買う', () => {
    expect(nextMove({ theirs: [400, 210], ours: [150, 210] }, range, config).action).toBe('buy')
  })

  it('提案額は常に整数で、下限以上・目標以下', () => {
    for (let ask = 201; ask <= 2000; ask += 7) {
      const move = nextMove({ theirs: [ask], ours: [] }, range, config)
      if (move.action !== 'offer') continue
      expect(Number.isInteger(move.amount)).toBe(true)
      expect(move.amount).toBeGreaterThanOrEqual(floorAmount(range, config))
      expect(move.amount).toBeLessThanOrEqual(range.target)
    }
  })

  it('不正な入力はエラー', () => {
    expect(() => nextMove({ theirs: [], ours: [] }, range, config)).toThrow()
    expect(() => nextMove({ theirs: [300.5], ours: [] }, range, config)).toThrow(RangeError)
  })
})

describe('predictAsk', () => {
  it('目標 × 上乗せ × 見え方 を丸める', () => {
    expect(predictAsk(range, 2.0, 1.0, 10)).toBe(400)
    expect(predictAsk(range, 2.0, 0.9, 10)).toBe(360)
  })
})
