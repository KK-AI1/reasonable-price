import { toYen } from '../lib/currency'
import { bangkok } from '../lib/city'

interface Props {
  amount: number
  size?: 'display' | 'heading' | 'body'
}

const sizeClass = {
  display: 'text-display',
  heading: 'text-heading',
  body: 'text-body',
}

/** 現地通貨（大）＋円換算（小）の2段表示（docs/DESIGN.md §4） */
export function Money({ amount, size = 'display' }: Props) {
  const yen = toYen(amount, bangkok.exchange)
  return (
    <div>
      <p className={sizeClass[size]}>
        {amount.toLocaleString('ja-JP')}
        <span className="text-heading ml-1">{bangkok.currencyLabel}</span>
      </p>
      <p className="text-caption text-text-sub">約{yen.toLocaleString('ja-JP')}円</p>
    </div>
  )
}
