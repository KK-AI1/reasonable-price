/**
 * 売り手の発言から金額を抜き出す（docs/VOICE.md §4.3）。
 * ルールで探し、決められないときだけ AI に頼る。抜き出した金額は、必ずユーザーの確認を経てから使う。
 */
import { MAX_THAI_NUMBER, findThaiWordNumbers } from './thai-number'

export interface AmountCandidate {
  value: number
  /** 文中の表現そのもの */
  raw: string
  /** 話し言葉の省略として読んだ候補（「สองร้อยห้า」→ 250） */
  colloquial: boolean
}

export interface ExtractResult {
  candidates: AmountCandidate[]
  /** 金額が見つからない、または候補が複数で決められない */
  needsAi: boolean
}

// 数のあとに付くと「個数」を表す語（金額ではない）
const QUANTITY_AFTER = /^\s*(ชิ้น|อัน|ตัว|ผืน|คู่|ใบ|กิโล|โล|คน|個|枚|つ|点|人)/
const BAHT_AFTER = /^\s*(บาท|฿|バーツ)/

/** 全角数字・タイ数字（๐〜๙）を半角数字にする。文字数は変わらない */
export function normalizeDigits(text: string): string {
  return text.replace(/[０-９๐-๙]/g, (c) => {
    const code = c.charCodeAt(0)
    return String(code >= 0xff10 ? code - 0xff10 : code - 0x0e50)
  })
}

interface FoundNumber {
  value: number
  alternatives: number[]
  raw: string
  start: number
  end: number
  /** 金額らしさの判断に使う */
  strong: boolean
}

function findArabic(text: string): FoundNumber[] {
  const out: FoundNumber[] = []
  for (const m of text.matchAll(/\d{1,3}(?:,\d{3})+(?!\d)|\d+/g)) {
    const value = Number(m[0].replace(/,/g, ''))
    out.push({ value, alternatives: [], raw: m[0], start: m.index, end: m.index + m[0].length, strong: true })
  }
  return out
}

function findThaiWords(text: string): FoundNumber[] {
  return findThaiWordNumbers(text).map((r) => ({
    value: r.value,
    alternatives: r.colloquialValue !== undefined ? [r.colloquialValue] : [],
    raw: r.raw,
    start: r.start,
    end: r.end,
    // 「สามารถ（できる）」の「สาม」のような誤検出を避けるため、位を含む数詞だけを金額らしいとみなす
    strong: r.hasPlace && r.hasDigit,
  }))
}

const KANJI_DIGITS: Record<string, number> = {
  〇: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
}
const KANJI_PLACES: Record<string, number> = { 十: 10, 百: 100, 千: 1000 }

/** 漢数字（三百、千五百、二万など）を探す。AI の日本語訳の検証用 */
function findKanji(text: string): FoundNumber[] {
  const out: FoundNumber[] = []
  for (const m of text.matchAll(/[〇一二三四五六七八九十百千万]+/g)) {
    const raw = m[0]
    // 「一つ」「一番」のような単独の漢数字は数として扱わない
    if (raw.length < 2 && !/[十百千万]/.test(raw)) continue
    let total = 0
    let section = 0
    let pending: number | null = null
    for (const c of raw) {
      if (c in KANJI_DIGITS) {
        pending = pending === null ? KANJI_DIGITS[c] : pending * 10 + KANJI_DIGITS[c]
      } else if (c === '万') {
        total += (section + (pending ?? 0) || 1) * 10_000
        section = 0
        pending = null
      } else {
        section += (pending ?? 1) * KANJI_PLACES[c]
        pending = null
      }
    }
    const value = total + section + (pending ?? 0)
    out.push({ value, alternatives: [], raw, start: m.index, end: m.index + raw.length, strong: true })
  }
  return out
}

/** 売り手の発言から金額の候補を抜き出す */
export function extractAmounts(input: string): ExtractResult {
  const text = normalizeDigits(input)
  const candidates: AmountCandidate[] = []

  for (const n of [...findArabic(text), ...findThaiWords(text)]) {
    const after = text.slice(n.end)
    if (QUANTITY_AFTER.test(after)) continue
    const looksLikeAmount = n.strong || BAHT_AFTER.test(after) || text.trim() === n.raw
    if (!looksLikeAmount) continue
    for (const [value, colloquial] of [[n.value, false], ...n.alternatives.map((v) => [v, true])] as [number, boolean][]) {
      if (value <= 0 || value > MAX_THAI_NUMBER) continue
      if (candidates.some((c) => c.value === value)) continue
      candidates.push({ value, raw: input.slice(n.start, n.end), colloquial })
    }
  }

  return { candidates, needsAi: candidates.length !== 1 }
}

/**
 * AI が「文中の金額の表現」として返した文字列を検証する。
 * 元の文に含まれ、そこから金額がちょうど1つ読み取れるときだけ、その値を返す。
 */
export function verifyAiAmountExpression(original: string, expression: string): number | null {
  const expr = expression.trim()
  if (expr === '' || !original.includes(expr)) return null
  const values = new Set<number>()
  for (const n of [...findArabic(normalizeDigits(expr)), ...findThaiWords(expr)]) values.add(n.value)
  return values.size === 1 ? [...values][0] : null
}

/**
 * AI の出力に、渡していない金額が含まれていないかを調べる（docs/VOICE.md §2-4・§4.5）。
 * 数らしいものは広めに拾い、1つでも allowed にない数があれば false。
 */
export function validateNoNewAmounts(output: string, allowedAmounts: readonly number[]): boolean {
  const text = normalizeDigits(output)
  const allowed = new Set(allowedAmounts)
  const found = [
    ...findArabic(text),
    ...findKanji(text),
    ...findThaiWords(text).filter((n) => n.strong || BAHT_AFTER.test(text.slice(n.end))),
  ]
  return found.every((n) => [n.value, ...n.alternatives].some((v) => allowed.has(v)))
}
