import { useCallback, useEffect, useState } from 'react'
import { loadBangkokItems } from './city'
import type { Item } from './types'

export type ItemsState = { status: 'loading' } | { status: 'ready'; items: Item[] } | { status: 'error' }

/** 品目データの読み込み。失敗したときに別のデータへ黙って切り替えない */
export function useItems(): { state: ItemsState; retry: () => void } {
  const [state, setState] = useState<ItemsState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    loadBangkokItems()
      .then((items) => !cancelled && setState({ status: 'ready', items }))
      .catch(() => !cancelled && setState({ status: 'error' }))
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((a) => a + 1)
  }, [])

  return { state, retry }
}
