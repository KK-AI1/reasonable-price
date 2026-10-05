/** 数字 ⇔ タイ語の数詞（docs/VOICE.md §4.1・§4.3） */

const DIGITS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
// 位の名前：1, 10, 100, 1000, 10000, 100000
const PLACES = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน']

export const MAX_THAI_NUMBER = 999_999

/**
 * 整数をタイ語の数詞にする。読み上げ用。
 * 例：11 → สิบเอ็ด、21 → ยี่สิบเอ็ด、250 → สองร้อยห้าสิบ、1500 → หนึ่งพันห้าร้อย
 */
export function toThaiNumberWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > MAX_THAI_NUMBER) {
    throw new RangeError(`toThaiNumberWords: 0〜${MAX_THAI_NUMBER} の整数のみ対応しています（${n}）`)
  }
  if (n === 0) return DIGITS[0]

  const digits = String(n).split('').map(Number)
  let words = ''
  digits.forEach((d, i) => {
    const place = digits.length - 1 - i
    if (d === 0) return
    if (place === 1) {
      // 10の位：1 は「สิบ」だけ、2 は「ยี่สิบ」
      words += d === 1 ? 'สิบ' : d === 2 ? 'ยี่สิบ' : DIGITS[d] + 'สิบ'
    } else if (place === 0) {
      // 1の位の 1 は、10以上の数では「เอ็ด」
      words += d === 1 && n > 10 ? 'เอ็ด' : DIGITS[d]
    } else {
      words += DIGITS[d] + PLACES[place]
    }
  })
  return words
}

/** 文中のアラビア数字を、タイ語の数詞に置き換える（読み上げ用） */
export function replaceNumbersWithThaiWords(text: string): string {
  return text.replace(/\d[\d,]*/g, (m) => {
    const n = Number(m.replace(/,/g, ''))
    return Number.isInteger(n) && n <= MAX_THAI_NUMBER ? toThaiNumberWords(n) : m
  })
}

// ---- タイ語の数詞 → 数字 ----

type Token =
  | { kind: 'digit'; value: number }
  | { kind: 'place'; value: number }
  | { kind: 'one-colloquial' } // นึง：「ร้อยนึง」= 100 のように使う

// 長い語から先に照合する（「ยี่สิบ」より前に「ยี่」を取らない等）
const WORD_TOKENS: [string, Token][] = (
  [
    ['ศูนย์', { kind: 'digit', value: 0 }],
    ['หนึ่ง', { kind: 'digit', value: 1 }],
    ['เอ็ด', { kind: 'digit', value: 1 }],
    ['นึง', { kind: 'one-colloquial' }],
    ['สอง', { kind: 'digit', value: 2 }],
    ['ยี่', { kind: 'digit', value: 2 }],
    ['สาม', { kind: 'digit', value: 3 }],
    ['สี่', { kind: 'digit', value: 4 }],
    ['ห้า', { kind: 'digit', value: 5 }],
    ['หก', { kind: 'digit', value: 6 }],
    ['เจ็ด', { kind: 'digit', value: 7 }],
    ['แปด', { kind: 'digit', value: 8 }],
    ['เก้า', { kind: 'digit', value: 9 }],
    ['สิบ', { kind: 'place', value: 10 }],
    ['ร้อย', { kind: 'place', value: 100 }],
    ['พัน', { kind: 'place', value: 1_000 }],
    ['หมื่น', { kind: 'place', value: 10_000 }],
    ['แสน', { kind: 'place', value: 100_000 }],
  ] as [string, Token][]
).sort((a, b) => b[0].length - a[0].length)

export interface ThaiWordNumber {
  /** 文中の表現そのもの */
  raw: string
  start: number
  end: number
  /** 文法どおりに読んだ値 */
  value: number
  /** 話し言葉の省略として読んだ値（「สองร้อยห้า」= 250 など）。同じなら undefined */
  colloquialValue?: number
  hasPlace: boolean
  hasDigit: boolean
}

/** 文中のタイ語の数詞のかたまりを探して数字にする */
export function findThaiWordNumbers(text: string): ThaiWordNumber[] {
  const results: ThaiWordNumber[] = []
  let i = 0
  while (i < text.length) {
    const run: { token: Token; start: number; end: number }[] = []
    let j = i
    for (;;) {
      const hit = WORD_TOKENS.find(([word]) => text.startsWith(word, j))
      if (!hit) break
      run.push({ token: hit[1], start: j, end: j + hit[0].length })
      j += hit[0].length
    }
    if (run.length === 0) {
      i += 1
      continue
    }
    results.push(...parseRun(text, run))
    i = j
  }
  return results
}

type RunToken = { token: Token; start: number; end: number }

/** 連続した数詞のトークンを、1つ以上の数に分けて読む */
function parseRun(text: string, run: RunToken[]): ThaiWordNumber[] {
  // 1. 区切る：数字が2つ続く（「สองสาม」）、位が大きくなる（「สองร้อยสามร้อย」）ところで分ける
  const groups: RunToken[][] = []
  let group: RunToken[] = []
  let lastPlace = Number.POSITIVE_INFINITY
  const lastIsDigit = () => group.length > 0 && group[group.length - 1].token.kind !== 'place'

  for (const t of run) {
    if (t.token.kind === 'place') {
      if (t.token.value >= lastPlace) {
        // 直前の数字は新しい数の側に付ける
        const carried = lastIsDigit() ? group.pop()! : null
        if (group.length > 0) groups.push(group)
        group = carried ? [carried] : []
      }
      lastPlace = t.token.value
    } else if (lastIsDigit()) {
      groups.push(group)
      group = []
      lastPlace = Number.POSITIVE_INFINITY
    }
    group.push(t)
  }
  if (group.length > 0) groups.push(group)

  // 2. それぞれの数を読む
  return groups.map((g) => evaluateGroup(text, g))
}

function evaluateGroup(text: string, g: RunToken[]): ThaiWordNumber {
  let total = 0
  let pending: number | null = null
  let lastPlace: number | null = null
  for (const { token } of g) {
    if (token.kind === 'place') {
      total += (pending ?? 1) * token.value
      pending = null
      lastPlace = token.value
    } else if (token.kind === 'digit') {
      pending = token.value
    } else if (lastPlace === null) {
      // 単独の「นึง」は 1。位の直後（ร้อยนึง）は「1つ分」なので足さない
      pending = 1
    }
  }

  let value = total
  let colloquialValue: number | undefined
  if (pending !== null) {
    value += pending
    // 「สองร้อยห้า」のように100以上の位の直後に1桁だけ残るときは、話し言葉の省略（=250）の可能性がある
    if (lastPlace !== null && lastPlace >= 100 && pending > 0) {
      colloquialValue = total + pending * (lastPlace / 10)
    }
  }

  const start = g[0].start
  const end = g[g.length - 1].end
  return {
    raw: text.slice(start, end),
    start,
    end,
    value,
    colloquialValue,
    hasPlace: g.some((t) => t.token.kind === 'place'),
    hasDigit: g.some((t) => t.token.kind !== 'place'),
  }
}
