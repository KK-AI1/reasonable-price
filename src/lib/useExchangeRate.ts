import { createContext, useContext, useEffect, useState } from 'react'
import { bangkok } from './city'
import { newerRate, type ExchangeRate } from './exchange'
import { fetchLatestRate, loadCachedRate } from './exchangeStore'

const bundledRate: ExchangeRate = {
  jpyPerUnit: bangkok.exchange.jpyPerUnit,
  date: bangkok.exchange.checkedAt,
  origin: 'bundled',
}

/**
 * 起動するたびに最新レートを取りに行く。取れるまでは、前回の保存値か同梱の値を使う。
 * 金額の計算には使わず、円換算の表示にだけ使う。
 */
export function useLatestExchangeRate(): ExchangeRate {
  const [rate, setRate] = useState<ExchangeRate>(() => newerRate(loadCachedRate(), bundledRate))

  useEffect(() => {
    let cancelled = false
    fetchLatestRate(bangkok.exchange.rateApi, bangkok.exchange.fetchTimeoutMs).then((latest) => {
      if (latest && !cancelled) setRate(latest)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return rate
}

export const ExchangeRateContext = createContext<ExchangeRate>(bundledRate)

export function useExchangeRate(): ExchangeRate {
  return useContext(ExchangeRateContext)
}
