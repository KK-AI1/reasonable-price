import { replaceNumbersWithThaiWords } from './thai-number'

export type PoliteEnding = 'krap' | 'ka'

export interface PhraseTemplate {
  id: string
  ja: string
  th: string
  reading: string
  ending: 'question' | 'statement'
  verified: boolean
}

export interface PhraseBook {
  language: string
  politeEndings: Record<PoliteEnding, { question: string; statement: string; reading: string }>
  phrases: PhraseTemplate[]
}

export interface BuiltPhrase {
  id: string
  ja: string
  /** 画面に出すタイ語（金額はアラビア数字） */
  thDisplay: string
  /** 読み上げ用のタイ語（金額は数詞） */
  thSpeech: string
  reading: string
  /** 差し込んだ金額。読み上げる金額の検証に使う */
  amount: number | null
  verified: boolean
}

/**
 * 定型文に金額と丁寧語尾を差し込む（docs/VOICE.md §4.1）。
 * 金額は coach.ts の結果かユーザーが確定した数字だけを渡すこと。
 * 語尾は文法上の選択で、価格には一切影響しない。
 */
export function buildPhrase(
  book: PhraseBook,
  id: string,
  ending: PoliteEnding,
  amount: number | null = null,
): BuiltPhrase {
  const template = book.phrases.find((p) => p.id === id)
  if (!template) throw new Error(`定型文が見つかりません：${id}`)

  const needsAmount = template.th.includes('{amount}')
  if (needsAmount && (amount === null || !Number.isInteger(amount) || amount <= 0)) {
    throw new RangeError(`定型文 ${id} には正の整数の金額が必要です`)
  }
  if (!needsAmount && amount !== null) {
    throw new Error(`定型文 ${id} は金額を受け取りません`)
  }

  const polite = book.politeEndings[ending]
  const fill = (s: string, politeText: string) =>
    s.replaceAll('{amount}', amount === null ? '' : String(amount)).replaceAll('{polite}', politeText)

  const thDisplay = fill(template.th, polite[template.ending])
  return {
    id,
    ja: fill(template.ja, ''),
    thDisplay,
    thSpeech: replaceNumbersWithThaiWords(thDisplay),
    reading: fill(template.reading, polite.reading),
    amount: needsAmount ? amount : null,
    verified: template.verified,
  }
}
