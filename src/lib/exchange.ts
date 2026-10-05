/** 円換算のレート（1 現地通貨あたりの円）と、そのレートの日付 */
export interface ExchangeRate {
  jpyPerUnit: number
  /** YYYY-MM-DD */
  date: string
  origin: 'live' | 'cached' | 'bundled'
}

/** Frankfurter API（欧州中央銀行の参考レート）の応答からレートを取り出す。不正なら null */
export function parseRateResponse(json: unknown): Omit<ExchangeRate, 'origin'> | null {
  if (typeof json !== 'object' || json === null) return null
  const { date, rates } = json as { date?: unknown; rates?: { JPY?: unknown } }
  const jpy = rates?.JPY
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  if (typeof jpy !== 'number' || !Number.isFinite(jpy) || jpy <= 0) return null
  return { jpyPerUnit: jpy, date }
}

/** 端末に保存したレートとアプリ同梱のレートのうち、日付が新しい方を使う */
export function newerRate(a: ExchangeRate | null, b: ExchangeRate): ExchangeRate {
  if (a && a.date >= b.date) return a
  return b
}
