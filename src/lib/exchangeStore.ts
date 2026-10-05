import { parseRateResponse, type ExchangeRate } from './exchange'

const STORAGE_KEY = 'price-coach:exchange-rate:THB-JPY'

/** 前回取得したレートを端末から読む。使えないときは null */
export function loadCachedRate(): ExchangeRate | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = parseRateResponse(JSON.parse(raw))
    return parsed ? { ...parsed, origin: 'cached' } : null
  } catch {
    return null
  }
}

function saveRate(rate: ExchangeRate): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: rate.date, rates: { JPY: rate.jpyPerUnit } }))
  } catch {
    // 保存できなくても表示には影響しない
  }
}

/** 最新レートを取得して端末に保存する。オフラインや失敗時は null */
export async function fetchLatestRate(url: string, timeoutMs: number): Promise<ExchangeRate | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return null
    const parsed = parseRateResponse(await res.json())
    if (!parsed) return null
    const rate: ExchangeRate = { ...parsed, origin: 'live' }
    saveRate(rate)
    return rate
  } catch {
    return null
  }
}
