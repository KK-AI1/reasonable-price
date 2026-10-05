import { describe, expect, it } from 'vitest'
import book from '../src/data/phrases/th.json'
import { extractAmounts } from '../src/lib/extract-amount'
import { buildPhrase, type PhraseBook } from '../src/lib/phrases'

const phrases = book as PhraseBook

describe('buildPhrase', () => {
  it('金額と語尾を差し込み、読み上げ用は数詞にする', () => {
    const p = buildPhrase(phrases, 'offer', 'krap', 250)
    expect(p.ja).toBe('250バーツでどうですか？')
    expect(p.thDisplay).toBe('250 บาทได้ไหมครับ')
    expect(p.thSpeech).toBe('สองร้อยห้าสิบ บาทได้ไหมครับ')
    expect(p.amount).toBe(250)
  })

  it('語尾は疑問文と平叙文で使い分ける', () => {
    expect(buildPhrase(phrases, 'offer', 'ka', 250).thDisplay).toBe('250 บาทได้ไหมคะ')
    expect(buildPhrase(phrases, 'thanks', 'ka').thDisplay).toBe('ขอบคุณค่ะ')
  })

  it('語尾を変えても金額は変わらない', () => {
    const a = buildPhrase(phrases, 'buy-at', 'krap', 270)
    const b = buildPhrase(phrases, 'buy-at', 'ka', 270)
    expect(a.amount).toBe(b.amount)
  })

  it('読み上げる金額は、渡した金額と必ず一致する', () => {
    for (const amount of [1, 11, 21, 99, 100, 250, 1500, 9999, 99999]) {
      for (const id of ['offer', 'buy-at']) {
        const p = buildPhrase(phrases, id, 'krap', amount)
        const spoken = extractAmounts(p.thSpeech).candidates.map((c) => c.value)
        const shown = extractAmounts(p.thDisplay).candidates.map((c) => c.value)
        expect(spoken).toEqual([amount])
        expect(shown).toEqual([amount])
      }
    }
  })

  it('金額が必要な定型文に金額がなければエラー、不要な定型文に金額を渡してもエラー', () => {
    expect(() => buildPhrase(phrases, 'offer', 'krap')).toThrow(RangeError)
    expect(() => buildPhrase(phrases, 'offer', 'krap', 12.5)).toThrow(RangeError)
    expect(() => buildPhrase(phrases, 'thanks', 'krap', 100)).toThrow()
    expect(() => buildPhrase(phrases, 'unknown', 'krap')).toThrow()
  })

  it('金額のない定型文に数字が入っていない', () => {
    for (const t of phrases.phrases) {
      if (t.th.includes('{amount}')) continue
      const p = buildPhrase(phrases, t.id, 'krap')
      expect(extractAmounts(p.thSpeech).candidates).toEqual([])
    }
  })
})
