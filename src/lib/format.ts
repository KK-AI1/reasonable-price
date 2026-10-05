import type { Item } from './types'

export const fmt = (n: number) => n.toLocaleString('ja-JP')

export const goodsTypeLabel: Record<NonNullable<Item['goodsType']>, string | null> = {
  generic: null,
  'no-brand': 'ノーブランド品（ロゴなし）',
  brand: 'メーカー品（定価あり）',
}
