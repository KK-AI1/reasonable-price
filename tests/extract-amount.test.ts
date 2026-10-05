import { describe, expect, it } from 'vitest'
import {
  extractAmounts,
  normalizeDigits,
  validateNoNewAmounts,
  verifyAiAmountExpression,
} from '../src/lib/extract-amount'
import { toThaiNumberWords } from '../src/lib/thai-number'

const values = (text: string) => extractAmounts(text).candidates.map((c) => c.value)

describe('normalizeDigits', () => {
  it('タイ数字・全角数字を半角にする', () => {
    expect(normalizeDigits('๓๐๐ บาท')).toBe('300 บาท')
    expect(normalizeDigits('３００')).toBe('300')
  })
})

describe('extractAmounts', () => {
  it('アラビア数字', () => {
    expect(extractAmounts('300 บาทขายครับ')).toEqual({
      candidates: [{ value: 300, raw: '300', colloquial: false }],
      needsAi: false,
    })
    expect(values('ok 1,500 baht')).toEqual([1500])
  })

  it('タイ数字', () => {
    expect(values('๓๐๐ บาท')).toEqual([300])
  })

  it('タイ語の数詞', () => {
    expect(values('สามร้อยขายครับ')).toEqual([300])
    expect(values('ให้สองร้อยห้าสิบบาทก็ได้ค่ะ')).toEqual([250])
  })

  it('1〜99,999 の数詞と数字を、すべて1つの金額として抜き出す', () => {
    for (let n = 1; n <= 99_999; n++) {
      // 1桁の数詞は「บาท」が付くときだけ金額とみなす
      const r = extractAmounts(`ราคา${toThaiNumberWords(n)}บาท`)
      expect(r.candidates.map((c) => c.value)).toContain(n)
      expect(values(`${n} บาท`)).toEqual([n])
    }
  })

  it('個数は金額にしない', () => {
    expect(values('2 ชิ้น 500 บาท')).toEqual([500])
    expect(values('สองชิ้นห้าร้อย')).toEqual([500])
  })

  it('数詞を含む普通の語を金額にしない', () => {
    // สามารถ（できる）、ห้าง（デパート）
    expect(extractAmounts('ลดได้ ไม่สามารถลดได้แล้วค่ะ').candidates).toEqual([])
    expect(extractAmounts('ไปห้างไหม').candidates).toEqual([])
  })

  it('話し言葉の省略は候補を2つ出し、AI・ユーザーの確認に回す', () => {
    const r = extractAmounts('สองร้อยห้า')
    expect(r.candidates.map((c) => c.value)).toEqual([205, 250])
    expect(r.needsAi).toBe(true)
  })

  it('金額が見つからない・複数あるときは AI に回す', () => {
    expect(extractAmounts('ไม่ได้ครับ').needsAi).toBe(true)
    expect(extractAmounts('300 ไม่ได้ 350 ได้').needsAi).toBe(true)
  })

  it('境界値：0 と 100万以上は金額にしない', () => {
    expect(values('0 บาท')).toEqual([])
    expect(values('1000000 บาท')).toEqual([])
    expect(values('999999 บาท')).toEqual([999999])
  })
})

describe('verifyAiAmountExpression', () => {
  it('元の文にある表現なら、その金額を返す', () => {
    expect(verifyAiAmountExpression('โอเค สามร้อยครับ', 'สามร้อย')).toBe(300)
  })

  it('元の文にない表現・金額が読めない表現は null', () => {
    expect(verifyAiAmountExpression('โอเค สามร้อยครับ', 'สี่ร้อย')).toBeNull()
    expect(verifyAiAmountExpression('โอเค สามร้อยครับ', 'โอเค')).toBeNull()
    expect(verifyAiAmountExpression('โอเค สามร้อยครับ', '')).toBeNull()
  })
})

describe('validateNoNewAmounts', () => {
  it('渡した金額だけなら true', () => {
    expect(validateNoNewAmounts('300バーツなら売る', [300])).toBe(true)
    expect(validateNoNewAmounts('三百バーツなら売る', [300])).toBe(true)
    expect(validateNoNewAmounts('สามร้อยบาทได้ไหมครับ', [300])).toBe(true)
    expect(validateNoNewAmounts('もう少し安くなりますか？', [])).toBe(true)
  })

  it('渡していない金額があれば false', () => {
    expect(validateNoNewAmounts('280バーツでどうですか', [300])).toBe(false)
    expect(validateNoNewAmounts('二百八十バーツ', [300])).toBe(false)
    expect(validateNoNewAmounts('千五百バーツ', [300])).toBe(false)
    expect(validateNoNewAmounts('สองร้อยแปดสิบบาท', [300])).toBe(false)
    expect(validateNoNewAmounts('๒๘๐ บาท', [300])).toBe(false)
    expect(validateNoNewAmounts('２８０バーツ', [300])).toBe(false)
  })

  it('一部だけ許可された金額でも、ほかに新しい金額があれば false', () => {
    expect(validateNoNewAmounts('300は無理、280なら', [300])).toBe(false)
  })
})
