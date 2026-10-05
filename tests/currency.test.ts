import { describe, expect, it } from 'vitest'
import { toYen } from '../src/lib/currency'

describe('toYen', () => {
  it('レートを掛けて 10 円単位に丸める', () => {
    expect(toYen(350, { jpyPerUnit: 4.6, roundToYen: 10 })).toBe(1610)
    expect(toYen(0, { jpyPerUnit: 4.6, roundToYen: 10 })).toBe(0)
  })
})
