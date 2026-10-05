import { describe, expect, it } from 'vitest'
import {
  MAX_THAI_NUMBER,
  findThaiWordNumbers,
  replaceNumbersWithThaiWords,
  toThaiNumberWords,
} from '../src/lib/thai-number'

describe('toThaiNumberWords', () => {
  it.each([
    [0, 'ศูนย์'],
    [1, 'หนึ่ง'],
    [5, 'ห้า'],
    [10, 'สิบ'],
    [11, 'สิบเอ็ด'],
    [12, 'สิบสอง'],
    [20, 'ยี่สิบ'],
    [21, 'ยี่สิบเอ็ด'],
    [35, 'สามสิบห้า'],
    [99, 'เก้าสิบเก้า'],
    [100, 'หนึ่งร้อย'],
    [101, 'หนึ่งร้อยเอ็ด'],
    [110, 'หนึ่งร้อยสิบ'],
    [250, 'สองร้อยห้าสิบ'],
    [1000, 'หนึ่งพัน'],
    [1500, 'หนึ่งพันห้าร้อย'],
    [2021, 'สองพันยี่สิบเอ็ด'],
    [10000, 'หนึ่งหมื่น'],
    [99999, 'เก้าหมื่นเก้าพันเก้าร้อยเก้าสิบเก้า'],
    [100001, 'หนึ่งแสนเอ็ด'],
  ])('%i → %s', (n, words) => {
    expect(toThaiNumberWords(n)).toBe(words)
  })

  it('範囲外・小数はエラー', () => {
    expect(() => toThaiNumberWords(-1)).toThrow(RangeError)
    expect(() => toThaiNumberWords(1.5)).toThrow(RangeError)
    expect(() => toThaiNumberWords(MAX_THAI_NUMBER + 1)).toThrow(RangeError)
  })
})

describe('findThaiWordNumbers', () => {
  const values = (text: string) => findThaiWordNumbers(text).map((r) => r.value)

  it('1〜99,999 のすべてで、数詞に変換して読み戻すと元の数になる', () => {
    for (let n = 1; n <= 99_999; n++) {
      const found = findThaiWordNumbers(toThaiNumberWords(n))
      expect(found.length).toBe(1)
      expect(found[0].value).toBe(n)
    }
  })

  it('文の中の数詞を見つける', () => {
    expect(values('สามร้อยขายครับ')).toEqual([300])
    expect(values('ราคาสองร้อยห้าสิบบาทค่ะ')).toEqual([250])
  })

  it('「ร้อยนึง」「พันนึง」は 100・1000', () => {
    expect(values('ร้อยนึง')).toEqual([100])
    expect(values('พันนึงบาท')).toEqual([1000])
  })

  it('「สองร้อยห้า」は 205 と、話し言葉の 250 の両方の候補を持つ', () => {
    const [r] = findThaiWordNumbers('สองร้อยห้า')
    expect(r.value).toBe(205)
    expect(r.colloquialValue).toBe(250)
  })

  it('別々の数は分けて返す', () => {
    expect(values('สองร้อยสามร้อย')).toEqual([200, 300])
  })
})

describe('replaceNumbersWithThaiWords', () => {
  it('アラビア数字を数詞に置き換える', () => {
    expect(replaceNumbersWithThaiWords('250 บาทได้ไหมครับ')).toBe('สองร้อยห้าสิบ บาทได้ไหมครับ')
    expect(replaceNumbersWithThaiWords('1,500 บาท')).toBe('หนึ่งพันห้าร้อย บาท')
  })
})
